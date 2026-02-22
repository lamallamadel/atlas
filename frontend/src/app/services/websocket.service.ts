import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IFrame, IMessage } from '@stomp/stompjs';

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private messageSubjects: Map<string, Subject<any>> = new Map();

  constructor() { /* no-op */ }

  connect(userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stompClient?.connected) {
        resolve();
        return;
      }

      this.stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        debug: (_str: string) => { /* no-op */ },
        onConnect: (frame: IFrame) => {
          console.log('WebSocket connected:', frame);
          this.connected$.next(true);
          resolve();
        },
        onStompError: (frame: IFrame) => {
          console.error('WebSocket connection error:', frame.headers['message']);
          this.connected$.next(false);
          reject(frame.headers['message']);
        },
        onWebSocketError: (error: any) => {
          console.error('WebSocket transport error:', error);
          this.connected$.next(false);
          reject(error);
        }
      });
      this.stompClient.activate();
    });
  }

  disconnect(): void {
    if (this.stompClient?.connected) {
      this.stompClient.deactivate().then(() => {
        console.log('WebSocket disconnected');
        this.connected$.next(false);
      });
    }
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  subscribe<T = any>(destination: string): Observable<T> {
    if (!this.messageSubjects.has(destination)) {
      const subject = new Subject<T>();
      this.messageSubjects.set(destination, subject);

      if (this.stompClient?.connected) {
        this.stompClient.subscribe(destination, (message: IMessage) => {
          const payload = JSON.parse(message.body);
          subject.next(payload);
        });
      }
    }

    return this.messageSubjects.get(destination)!.asObservable();
  }

  send(destination: string, body: any): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({ destination, body: JSON.stringify(body) });
    } else {
      console.error('Cannot send message, WebSocket not connected');
    }
  }

  unsubscribe(destination: string): void {
    const subject = this.messageSubjects.get(destination);
    if (subject) {
      subject.complete();
      this.messageSubjects.delete(destination);
    }
  }
}
