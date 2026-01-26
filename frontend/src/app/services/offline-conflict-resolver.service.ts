import { Injectable } from '@angular/core';
import { QueuedAction, QueuedActionType } from './offline-queue.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export enum ConflictResolutionStrategy {
  SERVER_WINS = 'SERVER_WINS',
  CLIENT_WINS = 'CLIENT_WINS',
  MERGE = 'MERGE',
  MANUAL = 'MANUAL'
}

export interface ConflictInfo {
  action: QueuedAction;
  serverData: any;
  clientData: any;
  conflictFields: string[];
}

export interface MergeResult {
  resolved: boolean;
  mergedData: any;
  conflicts?: ConflictInfo[];
}

@Injectable({
  providedIn: 'root'
})
export class OfflineConflictResolverService {
  private defaultStrategy: ConflictResolutionStrategy = ConflictResolutionStrategy.SERVER_WINS;

  constructor(private http: HttpClient) {}

  setDefaultStrategy(strategy: ConflictResolutionStrategy): void {
    this.defaultStrategy = strategy;
  }

  async detectConflict(action: QueuedAction): Promise<ConflictInfo | null> {
    try {
      const serverData = await this.fetchServerData(action);
      if (!serverData) {
        return null;
      }

      const conflictFields = this.compareData(action.payload, serverData);
      
      if (conflictFields.length === 0) {
        return null;
      }

      return {
        action,
        serverData,
        clientData: action.payload,
        conflictFields
      };
    } catch (error) {
      return null;
    }
  }

  async resolveConflict(
    conflict: ConflictInfo,
    strategy?: ConflictResolutionStrategy
  ): Promise<MergeResult> {
    const resolutionStrategy = strategy || this.defaultStrategy;

    switch (resolutionStrategy) {
      case ConflictResolutionStrategy.SERVER_WINS:
        return this.resolveServerWins(conflict);
      
      case ConflictResolutionStrategy.CLIENT_WINS:
        return this.resolveClientWins(conflict);
      
      case ConflictResolutionStrategy.MERGE:
        return this.resolveAutoMerge(conflict);
      
      case ConflictResolutionStrategy.MANUAL:
        return {
          resolved: false,
          mergedData: null,
          conflicts: [conflict]
        };
      
      default:
        return this.resolveServerWins(conflict);
    }
  }

  private resolveServerWins(conflict: ConflictInfo): MergeResult {
    return {
      resolved: true,
      mergedData: conflict.serverData
    };
  }

  private resolveClientWins(conflict: ConflictInfo): MergeResult {
    return {
      resolved: true,
      mergedData: conflict.clientData
    };
  }

  private resolveAutoMerge(conflict: ConflictInfo): MergeResult {
    const merged = { ...conflict.serverData };
    const unresolvedConflicts: string[] = [];

    for (const field of conflict.conflictFields) {
      const serverValue = conflict.serverData[field];
      const clientValue = conflict.clientData[field];

      if (this.canAutoMerge(field, serverValue, clientValue)) {
        merged[field] = this.mergeValues(field, serverValue, clientValue);
      } else {
        unresolvedConflicts.push(field);
        merged[field] = serverValue;
      }
    }

    return {
      resolved: unresolvedConflicts.length === 0,
      mergedData: merged,
      conflicts: unresolvedConflicts.length > 0 ? [conflict] : undefined
    };
  }

  private compareData(clientData: any, serverData: any): string[] {
    const conflicts: string[] = [];
    const clientKeys = Object.keys(clientData);
    const serverKeys = Object.keys(serverData);
    const allKeys = [...new Set([...clientKeys, ...serverKeys])];

    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      if (this.isSystemField(key)) {
        continue;
      }

      const clientValue = clientData[key];
      const serverValue = serverData[key];

      if (!this.valuesEqual(clientValue, serverValue)) {
        conflicts.push(key);
      }
    }

    return conflicts;
  }

  private isSystemField(field: string): boolean {
    const systemFields = ['id', 'createdAt', 'updatedAt', 'version', 'orgId', 'createdBy', 'updatedBy'];
    return systemFields.includes(field);
  }

  private valuesEqual(value1: any, value2: any): boolean {
    if (value1 === value2) {
      return true;
    }

    if (value1 == null || value2 == null) {
      return value1 === value2;
    }

    if (typeof value1 !== typeof value2) {
      return false;
    }

    if (typeof value1 === 'object') {
      return JSON.stringify(value1) === JSON.stringify(value2);
    }

    return false;
  }

  private canAutoMerge(field: string, serverValue: any, clientValue: any): boolean {
    if (typeof serverValue === 'number' && typeof clientValue === 'number') {
      return false;
    }

    if (typeof serverValue === 'string' && typeof clientValue === 'string') {
      if (serverValue.includes(clientValue) || clientValue.includes(serverValue)) {
        return true;
      }
    }

    if (Array.isArray(serverValue) && Array.isArray(clientValue)) {
      return true;
    }

    return false;
  }

  private mergeValues(field: string, serverValue: any, clientValue: any): any {
    if (Array.isArray(serverValue) && Array.isArray(clientValue)) {
      const merged = [...serverValue];
      for (const item of clientValue) {
        if (!merged.some(m => JSON.stringify(m) === JSON.stringify(item))) {
          merged.push(item);
        }
      }
      return merged;
    }

    if (typeof serverValue === 'string' && typeof clientValue === 'string') {
      if (clientValue.length > serverValue.length) {
        return clientValue;
      }
      return serverValue;
    }

    return serverValue;
  }

  private async fetchServerData(action: QueuedAction): Promise<any> {
    let url: string;

    switch (action.type) {
      case QueuedActionType.UPDATE_DOSSIER_STATUS:
        url = `/api/v1/dossiers/${action.payload.id}`;
        break;

      case QueuedActionType.UPDATE_APPOINTMENT:
        url = `/api/v1/appointments/${action.payload.id}`;
        break;

      case QueuedActionType.CREATE_MESSAGE:
      case QueuedActionType.CREATE_APPOINTMENT:
      case QueuedActionType.CREATE_NOTE:
        return null;

      default:
        return null;
    }

    try {
      return await firstValueFrom(this.http.get(url));
    } catch (error) {
      console.error('Failed to fetch server data for conflict detection:', error);
      return null;
    }
  }

  async resolveBatch(
    conflicts: ConflictInfo[],
    strategy: ConflictResolutionStrategy
  ): Promise<MergeResult[]> {
    const results: MergeResult[] = [];

    for (const conflict of conflicts) {
      const result = await this.resolveConflict(conflict, strategy);
      results.push(result);
    }

    return results;
  }
}
