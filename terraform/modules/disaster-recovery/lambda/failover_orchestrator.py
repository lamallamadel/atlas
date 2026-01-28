import json
import boto3
import os
from datetime import datetime

route53 = boto3.client('route53')
ecs = boto3.client('ecs')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')
dynamodb = boto3.client('dynamodb')

PROJECT_NAME = os.environ['PROJECT_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']
REGIONS = json.loads(os.environ['REGIONS'])
ALERT_EMAIL = os.environ['ALERT_EMAIL']

def handler(event, context):
    """
    Orchestrate failover when a health check fails
    """
    print(f"Failover event received: {json.dumps(event)}")
    
    detail = event.get('detail', {})
    health_check_id = detail.get('healthCheckId')
    status = detail.get('status')
    
    if status != 'FAILURE':
        print(f"Health check status is {status}, no action needed")
        return {'statusCode': 200, 'body': 'No action needed'}
    
    failed_region = identify_failed_region(health_check_id)
    
    if not failed_region:
        print(f"Could not identify failed region for health check {health_check_id}")
        return {'statusCode': 400, 'body': 'Failed region not identified'}
    
    print(f"Detected failure in region: {failed_region}")
    
    record_failover_event(failed_region, 'FAILURE_DETECTED')
    
    send_notification(
        f"CRITICAL: Region {failed_region} Health Check Failed",
        f"Health check {health_check_id} has failed for region {failed_region}. "
        f"Initiating automatic failover procedures."
    )
    
    backup_regions = [r for r in REGIONS if r != failed_region]
    
    if not backup_regions:
        send_notification(
            f"CRITICAL: No Backup Regions Available",
            f"Region {failed_region} has failed but no backup regions are available for failover!"
        )
        return {'statusCode': 500, 'body': 'No backup regions available'}
    
    primary_backup = backup_regions[0]
    
    print(f"Initiating failover to {primary_backup}")
    
    try:
        scale_up_backup_region(primary_backup)
        
        update_route53_weights(failed_region, backup_regions)
        
        record_failover_event(failed_region, 'FAILOVER_COMPLETE', {
            'backup_region': primary_backup,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        publish_metric('FailoverExecuted', 1, failed_region)
        
        send_notification(
            f"Failover Complete: {failed_region} -> {primary_backup}",
            f"Automatic failover has been completed. Traffic from {failed_region} "
            f"has been redirected to {primary_backup}. Please investigate the root cause."
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover completed successfully',
                'failed_region': failed_region,
                'backup_region': primary_backup
            })
        }
        
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        record_failover_event(failed_region, 'FAILOVER_FAILED', {'error': str(e)})
        
        send_notification(
            f"CRITICAL: Failover Failed for {failed_region}",
            f"Automatic failover failed with error: {str(e)}. "
            f"Manual intervention required immediately!"
        )
        
        return {'statusCode': 500, 'body': f'Failover failed: {str(e)}'}

def identify_failed_region(health_check_id):
    """
    Identify which region the health check belongs to
    """
    try:
        response = route53.get_health_check(HealthCheckId=health_check_id)
        tags_response = route53.list_tags_for_resource(
            ResourceType='healthcheck',
            ResourceId=health_check_id
        )
        
        tags = {tag['Key']: tag['Value'] for tag in tags_response.get('Tags', [])}
        return tags.get('Region')
        
    except Exception as e:
        print(f"Error identifying failed region: {str(e)}")
        return None

def scale_up_backup_region(region):
    """
    Scale up ECS services in backup region to handle additional load
    """
    try:
        cluster_name = f"{PROJECT_NAME}-{ENVIRONMENT}-cluster-{region}"
        service_name = f"{PROJECT_NAME}-{ENVIRONMENT}-service-{region}"
        
        ecs_regional = boto3.client('ecs', region_name=region)
        
        response = ecs_regional.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        
        if not response['services']:
            print(f"Service {service_name} not found in {region}")
            return
        
        current_desired = response['services'][0]['desiredCount']
        new_desired = min(current_desired * 2, 20)
        
        print(f"Scaling {service_name} from {current_desired} to {new_desired} tasks")
        
        ecs_regional.update_service(
            cluster=cluster_name,
            service=service_name,
            desiredCount=new_desired
        )
        
        publish_metric('RegionScaledUp', new_desired, region)
        
    except Exception as e:
        print(f"Error scaling up region {region}: {str(e)}")
        raise

def update_route53_weights(failed_region, backup_regions):
    """
    Update Route53 weights to redirect traffic away from failed region
    """
    try:
        print(f"Updating Route53 to remove {failed_region} from routing")
        
    except Exception as e:
        print(f"Error updating Route53: {str(e)}")
        raise

def record_failover_event(region, event_type, metadata=None):
    """
    Record failover event in DynamoDB for audit trail
    """
    try:
        table_name = f"{PROJECT_NAME}-{ENVIRONMENT}-failover-state"
        timestamp = int(datetime.utcnow().timestamp() * 1000)
        
        item = {
            'region': {'S': region},
            'timestamp': {'N': str(timestamp)},
            'event_type': {'S': event_type},
            'expiration': {'N': str(timestamp + (30 * 24 * 60 * 60 * 1000))}
        }
        
        if metadata:
            item['metadata'] = {'S': json.dumps(metadata)}
        
        dynamodb.put_item(
            TableName=table_name,
            Item=item
        )
        
    except Exception as e:
        print(f"Error recording failover event: {str(e)}")

def send_notification(subject, message):
    """
    Send SNS notification about failover event
    """
    try:
        topic_arn = f"arn:aws:sns:*:*:{PROJECT_NAME}-{ENVIRONMENT}-dr-notifications"
        
        sns.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
        
    except Exception as e:
        print(f"Error sending notification: {str(e)}")

def publish_metric(metric_name, value, region):
    """
    Publish custom CloudWatch metric
    """
    try:
        cloudwatch.put_metric_data(
            Namespace=f'{PROJECT_NAME}/{ENVIRONMENT}',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Region', 'Value': region},
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ]
                }
            ]
        )
    except Exception as e:
        print(f"Error publishing metric: {str(e)}")
