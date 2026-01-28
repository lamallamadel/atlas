#!/bin/bash

set -euo pipefail

###############################################################################
# Multi-Region Deployment Script for Atlas CRM
# 
# This script orchestrates the deployment of the Atlas CRM application
# across multiple AWS regions with proper sequencing and validation.
#
# Usage: ./deploy-multi-region.sh [environment] [version]
# Example: ./deploy-multi-region.sh production v1.2.3
###############################################################################

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

REGIONS=("eu-west-1" "us-east-1" "ap-southeast-1")
PRIMARY_REGION="eu-west-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    for cmd in aws terraform docker jq; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

build_docker_images() {
    log_info "Building Docker images for version $VERSION..."
    
    cd "$ROOT_DIR/backend"
    
    # Build Spring Boot application
    log_info "Building Spring Boot application..."
    mvn clean package -DskipTests
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -t atlas-crm:$VERSION .
    
    # Tag for each region
    for region in "${REGIONS[@]}"; do
        ECR_REPO=$(aws ecr describe-repositories \
            --repository-names atlas-crm \
            --region $region \
            --query 'repositories[0].repositoryUri' \
            --output text 2>/dev/null || echo "")
        
        if [ -z "$ECR_REPO" ]; then
            log_warn "ECR repository not found in $region, creating..."
            aws ecr create-repository \
                --repository-name atlas-crm \
                --region $region \
                --image-scanning-configuration scanOnPush=true
            
            ECR_REPO=$(aws ecr describe-repositories \
                --repository-names atlas-crm \
                --region $region \
                --query 'repositories[0].repositoryUri' \
                --output text)
        fi
        
        log_info "Tagging image for $region: $ECR_REPO:$VERSION"
        docker tag atlas-crm:$VERSION $ECR_REPO:$VERSION
        docker tag atlas-crm:$VERSION $ECR_REPO:latest
    done
    
    log_info "Docker images built successfully"
}

push_docker_images() {
    log_info "Pushing Docker images to ECR..."
    
    for region in "${REGIONS[@]}"; do
        log_info "Pushing to $region..."
        
        # Get ECR login
        aws ecr get-login-password --region $region | \
            docker login --username AWS --password-stdin \
            $(aws ecr describe-repositories \
                --repository-names atlas-crm \
                --region $region \
                --query 'repositories[0].repositoryUri' \
                --output text | cut -d'/' -f1)
        
        ECR_REPO=$(aws ecr describe-repositories \
            --repository-names atlas-crm \
            --region $region \
            --query 'repositories[0].repositoryUri' \
            --output text)
        
        docker push $ECR_REPO:$VERSION
        docker push $ECR_REPO:latest
    done
    
    log_info "Docker images pushed successfully"
}

run_database_migrations() {
    log_info "Running database migrations on primary region ($PRIMARY_REGION)..."
    
    # Get database endpoint
    DB_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier atlas-$ENVIRONMENT-db-$PRIMARY_REGION \
        --region $PRIMARY_REGION \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    
    # Get database credentials from Secrets Manager
    DB_SECRET=$(aws secretsmanager get-secret-value \
        --secret-id atlas-$ENVIRONMENT-db-credentials-$PRIMARY_REGION \
        --region $PRIMARY_REGION \
        --query SecretString \
        --output text)
    
    DB_USERNAME=$(echo $DB_SECRET | jq -r '.username')
    DB_PASSWORD=$(echo $DB_SECRET | jq -r '.password')
    
    log_info "Database endpoint: $DB_ENDPOINT"
    
    # Run Flyway migrations
    cd "$ROOT_DIR/backend"
    mvn flyway:migrate \
        -Dflyway.url=jdbc:postgresql://$DB_ENDPOINT:5432/atlas \
        -Dflyway.user=$DB_USERNAME \
        -Dflyway.password=$DB_PASSWORD \
        -Dspring.profiles.active=$PRIMARY_REGION
    
    log_info "Database migrations completed"
}

deploy_to_region() {
    local region=$1
    log_info "Deploying to region: $region..."
    
    # Get ECS cluster and service names
    CLUSTER_NAME="atlas-crm-$ENVIRONMENT-cluster-$region"
    SERVICE_NAME="atlas-crm-$ENVIRONMENT-service-$region"
    
    # Get current task definition
    TASK_DEF=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $region \
        --query 'services[0].taskDefinition' \
        --output text)
    
    # Get ECR image URI
    ECR_REPO=$(aws ecr describe-repositories \
        --repository-names atlas-crm \
        --region $region \
        --query 'repositories[0].repositoryUri' \
        --output text)
    
    IMAGE_URI="$ECR_REPO:$VERSION"
    
    log_info "Updating task definition with image: $IMAGE_URI"
    
    # Create new task definition revision
    TASK_DEF_JSON=$(aws ecs describe-task-definition \
        --task-definition $TASK_DEF \
        --region $region \
        --query 'taskDefinition')
    
    NEW_TASK_DEF=$(echo $TASK_DEF_JSON | jq --arg IMAGE "$IMAGE_URI" \
        '.containerDefinitions[0].image = $IMAGE | 
         del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')
    
    NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
        --cli-input-json "$NEW_TASK_DEF" \
        --region $region \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    log_info "New task definition: $NEW_TASK_DEF_ARN"
    
    # Update ECS service
    log_info "Updating ECS service..."
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $NEW_TASK_DEF_ARN \
        --region $region \
        --force-new-deployment
    
    # Wait for service to stabilize
    log_info "Waiting for service to stabilize (this may take several minutes)..."
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $region
    
    log_info "Deployment to $region completed successfully"
}

verify_deployment() {
    local region=$1
    log_info "Verifying deployment in $region..."
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names atlas-crm-$ENVIRONMENT-alb-$region \
        --region $region \
        --query 'LoadBalancers[0].DNSName' \
        --output text)
    
    # Health check
    HEALTH_URL="https://$region.atlas-crm.com/actuator/health"
    
    log_info "Checking health endpoint: $HEALTH_URL"
    
    RETRY_COUNT=0
    MAX_RETRIES=10
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            log_info "Health check passed for $region"
            return 0
        fi
        
        log_warn "Health check failed (attempt $((RETRY_COUNT+1))/$MAX_RETRIES), retrying..."
        sleep 10
        RETRY_COUNT=$((RETRY_COUNT+1))
    done
    
    log_error "Health check failed for $region after $MAX_RETRIES attempts"
    return 1
}

rollback_region() {
    local region=$1
    log_warn "Rolling back deployment in $region..."
    
    CLUSTER_NAME="atlas-crm-$ENVIRONMENT-cluster-$region"
    SERVICE_NAME="atlas-crm-$ENVIRONMENT-service-$region"
    
    # Get previous task definition
    TASK_DEFS=$(aws ecs list-task-definitions \
        --family-prefix atlas-crm-$ENVIRONMENT-$region \
        --sort DESC \
        --region $region \
        --query 'taskDefinitionArns[1]' \
        --output text)
    
    if [ -z "$TASK_DEFS" ]; then
        log_error "No previous task definition found for rollback"
        return 1
    fi
    
    log_info "Rolling back to: $TASK_DEFS"
    
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_DEFS \
        --region $region \
        --force-new-deployment
    
    log_info "Rollback initiated for $region"
}

main() {
    log_info "Starting multi-region deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Regions: ${REGIONS[*]}"
    
    # Confirmation prompt for production
    if [ "$ENVIRONMENT" = "production" ]; then
        read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    check_prerequisites
    build_docker_images
    push_docker_images
    
    # Run migrations on primary region only
    run_database_migrations
    
    # Deploy to all regions
    FAILED_REGIONS=()
    
    for region in "${REGIONS[@]}"; do
        if ! deploy_to_region $region; then
            log_error "Deployment failed for $region"
            FAILED_REGIONS+=($region)
        fi
    done
    
    # Verify deployments
    for region in "${REGIONS[@]}"; do
        if ! verify_deployment $region; then
            log_error "Verification failed for $region"
            FAILED_REGIONS+=($region)
        fi
    done
    
    # Handle failures
    if [ ${#FAILED_REGIONS[@]} -gt 0 ]; then
        log_error "Deployment failed for regions: ${FAILED_REGIONS[*]}"
        
        read -p "Do you want to rollback failed regions? (yes/no): " rollback_confirm
        if [ "$rollback_confirm" = "yes" ]; then
            for region in "${FAILED_REGIONS[@]}"; do
                rollback_region $region
            done
        fi
        
        exit 1
    fi
    
    log_info "Multi-region deployment completed successfully!"
    log_info "Deployed version: $VERSION"
    log_info "Regions: ${REGIONS[*]}"
}

# Run main function
main
