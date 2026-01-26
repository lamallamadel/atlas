import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { Client, Frame, Message, Stomp } from 'stompjs';

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

  constructor() {}

  connect(userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.stompClient?.connected) {
        resolve();
        return;
      }

      const socket = new SockJS('http://localhost:8080/ws');
      this.stompClient = Stomp.over(socket);

      this.stompClient.debug = () => {};

      this.stompClient.connect(
        {},
        (frame: Frame) => {
          console.log('WebSocket connected:', frame);
          this.connected$.next(true);
          resolve();
        },
        (error: any) => {
          console.error('WebSocket connection error:', error);
          this.connected$.next(false);
          reject(error);
        }
      );
    });
  }

  disconnect(): void {
    if (this.stompClient?.connected) {
      this.stompClient.disconnect(() => {
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
        this.stompClient.subscribe(destination, (message: Message) => {
          const payload = JSON.parse(message.body);
          subject.next(payload);
        });
      }
    }

    return this.messageSubjects.get(destination)!.asObservable();
  }

  send(destination: string, body: any): void {
    if (this.stompClient?.connected) {
      this.stompClient.send(destination, {}, JSON.stringify(body));
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
