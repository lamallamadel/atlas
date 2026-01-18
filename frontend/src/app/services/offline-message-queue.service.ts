import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';
import { MessageApiService, MessageCreateRequest, MessageResponse } from './message-api.service';

export interface QueuedMessage {
  id: string;
  request: MessageCreateRequest;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'whatsapp_message_queue';
const MAX_RETRIES = 3;

@Injectable({
  providedIn: 'root'
})
export class OfflineMessageQueueService {
  private queueSubject = new BehaviorSubject<QueuedMessage[]>([]);
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private isSyncingSubject = new BehaviorSubject<boolean>(false);

  queue$ = this.queueSubject.asObservable();
  isOnline$ = this.isOnlineSubject.asObservable();
  isSyncing$ = this.isSyncingSubject.asObservable();

  queueCount$ = this.queue$.pipe(
    map(queue => queue.length)
  );

  constructor(private messageApiService: MessageApiService) {
    this.loadQueue();
    this.setupOnlineListener();
  }

  private setupOnlineListener(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        debounceTime(500)
      )
      .subscribe(isOnline => {
        this.isOnlineSubject.next(isOnline);
        if (isOnline) {
          this.syncQueue();
        }
      });
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const queue = JSON.parse(stored) as QueuedMessage[];
        this.queueSubject.next(queue);
      }
    } catch (error) {
      console.error('Error loading message queue:', error);
      this.queueSubject.next([]);
    }
  }

  private saveQueue(): void {
    try {
      const queue = this.queueSubject.value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving message queue:', error);
    }
  }

  enqueue(request: MessageCreateRequest): Observable<MessageResponse | null> {
    if (this.isOnlineSubject.value) {
      return this.messageApiService.create(request);
    }

    const queuedMessage: QueuedMessage = {
      id: this.generateId(),
      request,
      timestamp: Date.now(),
      retries: 0
    };

    const currentQueue = this.queueSubject.value;
    this.queueSubject.next([...currentQueue, queuedMessage]);
    this.saveQueue();

    return of(null);
  }

  async syncQueue(): Promise<void> {
    if (this.isSyncingSubject.value || !this.isOnlineSubject.value) {
      return;
    }

    const queue = this.queueSubject.value;
    if (queue.length === 0) {
      return;
    }

    this.isSyncingSubject.next(true);

    const remainingMessages: QueuedMessage[] = [];

    for (const queuedMessage of queue) {
      try {
        await this.sendQueuedMessage(queuedMessage);
      } catch (error) {
        console.error('Error sending queued message:', error);
        
        if (queuedMessage.retries < MAX_RETRIES) {
          remainingMessages.push({
            ...queuedMessage,
            retries: queuedMessage.retries + 1
          });
        }
      }
    }

    this.queueSubject.next(remainingMessages);
    this.saveQueue();
    this.isSyncingSubject.next(false);
  }

  private sendQueuedMessage(queuedMessage: QueuedMessage): Promise<MessageResponse> {
    return new Promise((resolve, reject) => {
      this.messageApiService.create(queuedMessage.request).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error)
      });
    });
  }

  clearQueue(): void {
    this.queueSubject.next([]);
    this.saveQueue();
  }

  removeFromQueue(messageId: string): void {
    const currentQueue = this.queueSubject.value;
    const updatedQueue = currentQueue.filter(m => m.id !== messageId);
    this.queueSubject.next(updatedQueue);
    this.saveQueue();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getQueueSize(): number {
    return this.queueSubject.value.length;
  }

  isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  isSyncing(): boolean {
    return this.isSyncingSubject.value;
  }
}
