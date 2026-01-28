import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, map, tap, retry, timeout } from 'rxjs/operators';

export interface RegionConfig {
  name: string;
  displayName: string;
  endpoint: string;
  continent: string;
  isPrimary: boolean;
  priority: number;
  healthCheckUrl: string;
}

export interface GeoLocationData {
  country: string;
  continent: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface RegionHealth {
  region: string;
  healthy: boolean;
  latency: number;
  lastChecked: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RegionRoutingService {
  private readonly REGIONS: RegionConfig[] = [
    {
      name: 'eu-west-1',
      displayName: 'Europe (Paris)',
      endpoint: 'https://eu-west-1.atlas-crm.com',
      continent: 'EU',
      isPrimary: true,
      priority: 1,
      healthCheckUrl: '/actuator/health'
    },
    {
      name: 'us-east-1',
      displayName: 'North America (Virginia)',
      endpoint: 'https://us-east-1.atlas-crm.com',
      continent: 'NA',
      isPrimary: false,
      priority: 2,
      healthCheckUrl: '/actuator/health'
    },
    {
      name: 'ap-southeast-1',
      displayName: 'Asia Pacific (Singapore)',
      endpoint: 'https://ap-southeast-1.atlas-crm.com',
      continent: 'AS',
      isPrimary: false,
      priority: 3,
      healthCheckUrl: '/actuator/health'
    }
  ];

  private selectedRegionSubject = new BehaviorSubject<RegionConfig | null>(null);
  public selectedRegion$ = this.selectedRegionSubject.asObservable();

  private regionHealthSubject = new BehaviorSubject<Map<string, RegionHealth>>(new Map());
  public regionHealth$ = this.regionHealthSubject.asObservable();

  private failoverInProgressSubject = new BehaviorSubject<boolean>(false);
  public failoverInProgress$ = this.failoverInProgressSubject.asObservable();

  private readonly LATENCY_THRESHOLD_MS = 200;
  private readonly HEALTH_CHECK_INTERVAL_MS = 30000;
  private readonly STORAGE_KEY = 'atlas_selected_region';

  constructor(private http: HttpClient) {
    this.initializeRegionSelection();
    this.startHealthMonitoring();
  }

  private async initializeRegionSelection(): Promise<void> {
    const savedRegion = localStorage.getItem(this.STORAGE_KEY);
    
    if (savedRegion) {
      const region = this.REGIONS.find(r => r.name === savedRegion);
      if (region && await this.checkRegionHealth(region)) {
        this.selectRegion(region);
        return;
      }
    }

    try {
      const geoLocation = await this.detectGeoLocation();
      const optimalRegion = await this.findOptimalRegion(geoLocation);
      this.selectRegion(optimalRegion);
    } catch (error) {
      console.error('Failed to detect optimal region, using primary', error);
      const primaryRegion = this.REGIONS.find(r => r.isPrimary) || this.REGIONS[0];
      this.selectRegion(primaryRegion);
    }
  }

  private detectGeoLocation(): Promise<GeoLocationData> {
    return this.http.get<GeoLocationData>('https://ipapi.co/json/')
      .pipe(
        timeout(5000),
        retry(2),
        catchError(error => {
          console.error('Geolocation detection failed', error);
          return of({
            country: 'US',
            continent: 'NA',
            city: 'Unknown',
            latitude: 0,
            longitude: 0,
            timezone: 'UTC'
          });
        })
      )
      .toPromise() as Promise<GeoLocationData>;
  }

  private async findOptimalRegion(geoLocation: GeoLocationData): Promise<RegionConfig> {
    const continentMap: { [key: string]: string } = {
      'EU': 'EU',
      'NA': 'NA',
      'SA': 'NA',
      'AS': 'AS',
      'OC': 'AS',
      'AF': 'EU'
    };

    const targetContinent = continentMap[geoLocation.continent] || 'EU';
    
    const continentRegions = this.REGIONS.filter(r => r.continent === targetContinent);
    
    if (continentRegions.length > 0) {
      const latencies = await Promise.all(
        continentRegions.map(async region => ({
          region,
          latency: await this.measureLatency(region)
        }))
      );

      latencies.sort((a, b) => a.latency - b.latency);
      
      const fastestHealthyRegion = latencies.find(l => l.latency < this.LATENCY_THRESHOLD_MS);
      if (fastestHealthyRegion) {
        return fastestHealthyRegion.region;
      }
    }

    const allLatencies = await Promise.all(
      this.REGIONS.map(async region => ({
        region,
        latency: await this.measureLatency(region)
      }))
    );

    allLatencies.sort((a, b) => a.latency - b.latency);
    return allLatencies[0].region;
  }

  private async measureLatency(region: RegionConfig): Promise<number> {
    const startTime = performance.now();
    
    try {
      await this.http.get(region.endpoint + region.healthCheckUrl, {
        observe: 'response'
      }).pipe(
        timeout(5000)
      ).toPromise();
      
      const endTime = performance.now();
      return endTime - startTime;
    } catch (error) {
      return Infinity;
    }
  }

  private async checkRegionHealth(region: RegionConfig): Promise<boolean> {
    try {
      const response = await this.http.get<any>(region.endpoint + region.healthCheckUrl)
        .pipe(
          timeout(5000),
          retry(1)
        )
        .toPromise();
      
      return response?.status === 'UP';
    } catch (error) {
      return false;
    }
  }

  private selectRegion(region: RegionConfig): void {
    this.selectedRegionSubject.next(region);
    localStorage.setItem(this.STORAGE_KEY, region.name);
    console.log(`Selected region: ${region.displayName} (${region.name})`);
  }

  public getApiEndpoint(): string {
    const region = this.selectedRegionSubject.value;
    return region ? region.endpoint : this.REGIONS[0].endpoint;
  }

  public getCurrentRegion(): RegionConfig | null {
    return this.selectedRegionSubject.value;
  }

  public getAllRegions(): RegionConfig[] {
    return [...this.REGIONS];
  }

  public async switchRegion(regionName: string): Promise<boolean> {
    const region = this.REGIONS.find(r => r.name === regionName);
    
    if (!region) {
      console.error(`Region ${regionName} not found`);
      return false;
    }

    const isHealthy = await this.checkRegionHealth(region);
    
    if (!isHealthy) {
      console.error(`Region ${regionName} is unhealthy`);
      return false;
    }

    this.selectRegion(region);
    return true;
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      const healthMap = new Map<string, RegionHealth>();

      for (const region of this.REGIONS) {
        const latency = await this.measureLatency(region);
        const healthy = latency < this.LATENCY_THRESHOLD_MS && latency !== Infinity;

        healthMap.set(region.name, {
          region: region.name,
          healthy,
          latency,
          lastChecked: new Date()
        });

        if (latency > this.LATENCY_THRESHOLD_MS && latency !== Infinity) {
          console.warn(`High latency detected for region ${region.name}: ${latency.toFixed(2)}ms`);
          this.reportLatencyMetric(region.name, latency);
        }
      }

      this.regionHealthSubject.next(healthMap);

      const currentRegion = this.selectedRegionSubject.value;
      if (currentRegion) {
        const currentHealth = healthMap.get(currentRegion.name);
        if (currentHealth && !currentHealth.healthy) {
          await this.performFailover();
        }
      }
    }, this.HEALTH_CHECK_INTERVAL_MS);
  }

  private async performFailover(): Promise<void> {
    if (this.failoverInProgressSubject.value) {
      return;
    }

    this.failoverInProgressSubject.next(true);
    console.warn('Performing automatic failover due to unhealthy region');

    try {
      const healthyRegions = this.REGIONS.filter(async r => {
        const health = await this.checkRegionHealth(r);
        return health;
      });

      healthyRegions.sort((a, b) => a.priority - b.priority);

      if (healthyRegions.length > 0) {
        const targetRegion = healthyRegions[0];
        console.log(`Failing over to region: ${targetRegion.displayName}`);
        this.selectRegion(targetRegion);
      } else {
        console.error('No healthy regions available for failover');
      }
    } finally {
      this.failoverInProgressSubject.next(false);
    }
  }

  private reportLatencyMetric(region: string, latency: number): void {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const data = JSON.stringify({
        metric: 'cross_region_latency',
        region,
        latency,
        timestamp: new Date().toISOString()
      });
      
      navigator.sendBeacon('/api/metrics/latency', data);
    }
  }

  public async testAllRegions(): Promise<Map<string, number>> {
    const latencies = new Map<string, number>();

    for (const region of this.REGIONS) {
      const latency = await this.measureLatency(region);
      latencies.set(region.name, latency);
    }

    return latencies;
  }

  public getRegionByName(name: string): RegionConfig | undefined {
    return this.REGIONS.find(r => r.name === name);
  }

  public isRegionHealthy(regionName: string): boolean {
    const healthMap = this.regionHealthSubject.value;
    const health = healthMap.get(regionName);
    return health?.healthy ?? false;
  }
}
