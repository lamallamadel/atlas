import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';

export enum ConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  SLOW = 'SLOW'
}

export interface ConnectivityState {
  status: ConnectionStatus;
  lastOnline: Date | null;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private connectivitySubject = new BehaviorSubject<ConnectivityState>({
    status: ConnectionStatus.ONLINE,
    lastOnline: new Date()
  });

  public connectivity$: Observable<ConnectivityState> = this.connectivitySubject.asObservable();

  constructor() {
    this.initializeConnectivityMonitoring();
  }

  private initializeConnectivityMonitoring(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(debounceTime(100))
      .subscribe(isOnline => {
        this.updateConnectivityStatus(isOnline);
      });

    this.updateConnectivityStatus(navigator.onLine);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.checkConnectionQuality();
        });
      }
    }
  }

  private updateConnectivityStatus(isOnline: boolean): void {
    const currentState = this.connectivitySubject.value;
    
    if (isOnline) {
      this.checkConnectionQuality();
    } else {
      this.connectivitySubject.next({
        status: ConnectionStatus.OFFLINE,
        lastOnline: currentState.status !== ConnectionStatus.OFFLINE ? new Date() : currentState.lastOnline
      });
    }
  }

  private checkConnectionQuality(): void {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink;
      const rtt = connection.rtt;

      let status = ConnectionStatus.ONLINE;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g' || rtt > 2000) {
        status = ConnectionStatus.SLOW;
      }

      this.connectivitySubject.next({
        status,
        lastOnline: new Date(),
        effectiveType,
        downlink,
        rtt
      });
    } else {
      this.connectivitySubject.next({
        status: ConnectionStatus.ONLINE,
        lastOnline: new Date()
      });
    }
  }

  isOnline(): boolean {
    return this.connectivitySubject.value.status !== ConnectionStatus.OFFLINE;
  }

  isSlow(): boolean {
    return this.connectivitySubject.value.status === ConnectionStatus.SLOW;
  }

  getStatus(): ConnectionStatus {
    return this.connectivitySubject.value.status;
  }

  getLastOnlineTime(): Date | null {
    return this.connectivitySubject.value.lastOnline;
  }

  async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      const response = await fetch('/api/v1/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
