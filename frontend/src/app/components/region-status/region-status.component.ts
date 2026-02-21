import { Component, OnInit, OnDestroy } from '@angular/core';
import { RegionRoutingService, RegionConfig, RegionHealth } from '../../services/region-routing.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-region-status',
  templateUrl: './region-status.component.html',
  styleUrls: ['./region-status.component.css']
})
export class RegionStatusComponent implements OnInit, OnDestroy {
  currentRegion: RegionConfig | null = null;
  allRegions: RegionConfig[] = [];
  regionHealth: Map<string, RegionHealth> = new Map();
  failoverInProgress = false;
  showRegionSelector = false;

  private destroy$ = new Subject<void>();

  constructor(private regionRoutingService: RegionRoutingService) {}

  ngOnInit(): void {
    this.allRegions = this.regionRoutingService.getAllRegions();

    this.regionRoutingService.selectedRegion$
      .pipe(takeUntil(this.destroy$))
      .subscribe(region => {
        this.currentRegion = region;
      });

    this.regionRoutingService.regionHealth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(health => {
        this.regionHealth = health;
      });

    this.regionRoutingService.failoverInProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(inProgress => {
        this.failoverInProgress = inProgress;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getRegionHealth(regionName: string): RegionHealth | undefined {
    return this.regionHealth.get(regionName);
  }

  getRegionStatusClass(regionName: string): string {
    const health = this.getRegionHealth(regionName);
    if (!health) return 'status-unknown';
    return health.healthy ? 'status-healthy' : 'status-unhealthy';
  }

  getRegionStatusIcon(regionName: string): string {
    const health = this.getRegionHealth(regionName);
    if (!health) return 'help_outline';
    return health.healthy ? 'check_circle' : 'error';
  }

  getLatencyDisplay(regionName: string): string {
    const health = this.getRegionHealth(regionName);
    if (!health || health.latency === Infinity) return 'N/A';
    return `${health.latency.toFixed(0)}ms`;
  }

  getLatencyClass(regionName: string): string {
    const health = this.getRegionHealth(regionName);
    if (!health || health.latency === Infinity) return '';
    
    if (health.latency < 100) return 'latency-excellent';
    if (health.latency < 200) return 'latency-good';
    if (health.latency < 500) return 'latency-fair';
    return 'latency-poor';
  }

  isCurrentRegion(region: RegionConfig): boolean {
    return this.currentRegion?.name === region.name;
  }

  async switchRegion(regionName: string): Promise<void> {
    if (this.failoverInProgress) {
      return;
    }

    const success = await this.regionRoutingService.switchRegion(regionName);
    
    if (success) {
      this.showRegionSelector = false;
      window.location.reload();
    } else {
      alert('Failed to switch region. The selected region may be unavailable.');
    }
  }

  toggleRegionSelector(): void {
    this.showRegionSelector = !this.showRegionSelector;
  }

  async testAllRegions(): Promise<void> {
    const latencies = await this.regionRoutingService.testAllRegions();
    
    console.log('Region Latency Test Results:');
    latencies.forEach((latency, region) => {
      console.log(`${region}: ${latency.toFixed(2)}ms`);
    });
  }
}
