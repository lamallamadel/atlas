import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
  Token
} from '@capacitor/push-notifications';
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PushNotificationPermission {
  granted: boolean;
  denied: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  badge?: number;
  sound?: string;
  channelId?: string;
}

/**
 * Service for native push notifications
 * Handles FCM (Android) and APNs (iOS) push notifications
 */
@Injectable({
  providedIn: 'root'
})
export class NativePushNotificationsService {
  private readonly isNativePlatform = Capacitor.isNativePlatform();
  
  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  private readonly notificationReceivedSubject = new Subject<PushNotificationSchema>();
  private readonly notificationActionSubject = new Subject<ActionPerformed>();

  public readonly token$ = this.tokenSubject.asObservable();
  public readonly notificationReceived$ = this.notificationReceivedSubject.asObservable();
  public readonly notificationAction$ = this.notificationActionSubject.asObservable();

  constructor() {
    if (this.isNativePlatform) {
      this.initializePushNotifications();
    }
  }

  /**
   * Initialize push notification listeners
   */
  private initializePushNotifications(): void {
    // Registration success
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.tokenSubject.next(token.value);
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
      this.tokenSubject.next(null);
    });

    // Notification received (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', 
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        this.notificationReceivedSubject.next(notification);
      }
    );

    // Notification action performed (user tapped)
    PushNotifications.addListener('pushNotificationActionPerformed', 
      (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
        this.notificationActionSubject.next(notification);
      }
    );
  }

  /**
   * Request push notification permissions
   */
  requestPermissions(): Observable<PushNotificationPermission> {
    if (!this.isNativePlatform) {
      return of({ granted: false, denied: true });
    }

    return from(PushNotifications.requestPermissions()).pipe(
      map((result) => ({
        granted: result.receive === 'granted',
        denied: result.receive === 'denied'
      })),
      catchError((error) => {
        console.error('Error requesting push notification permissions:', error);
        return of({ granted: false, denied: true });
      })
    );
  }

  /**
   * Check current push notification permissions
   */
  checkPermissions(): Observable<PushNotificationPermission> {
    if (!this.isNativePlatform) {
      return of({ granted: false, denied: true });
    }

    return from(PushNotifications.checkPermissions()).pipe(
      map((result) => ({
        granted: result.receive === 'granted',
        denied: result.receive === 'denied'
      })),
      catchError(() => of({ granted: false, denied: true }))
    );
  }

  /**
   * Register for push notifications
   */
  register(): Observable<boolean> {
    if (!this.isNativePlatform) {
      return of(false);
    }

    return from(PushNotifications.register()).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error registering for push notifications:', error);
        return of(false);
      })
    );
  }

  /**
   * Get the current push notification token
   */
  getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Get delivered notifications (iOS only)
   */
  getDeliveredNotifications(): Observable<PushNotificationSchema[]> {
    if (!this.isNativePlatform) {
      return of([]);
    }

    return from(PushNotifications.getDeliveredNotifications()).pipe(
      map((result) => result.notifications),
      catchError(() => of([]))
    );
  }

  /**
   * Remove delivered notifications
   */
  removeDeliveredNotifications(notificationIds: string[]): Observable<boolean> {
    if (!this.isNativePlatform) {
      return of(false);
    }

    return from(PushNotifications.removeDeliveredNotifications({
      notifications: notificationIds.map(id => ({ id }))
    })).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error removing delivered notifications:', error);
        return of(false);
      })
    );
  }

  /**
   * Remove all delivered notifications
   */
  removeAllDeliveredNotifications(): Observable<boolean> {
    if (!this.isNativePlatform) {
      return of(false);
    }

    return from(PushNotifications.removeAllDeliveredNotifications()).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error removing all delivered notifications:', error);
        return of(false);
      })
    );
  }

  /**
   * Create notification channel (Android only)
   */
  createChannel(
    id: string,
    name: string,
    importance: 1 | 2 | 3 | 4 | 5 = 3,
    description?: string,
    sound?: string,
    vibration: boolean = true,
    lights: boolean = true
  ): Observable<boolean> {
    if (!this.isNativePlatform || Capacitor.getPlatform() !== 'android') {
      return of(false);
    }

    return from(PushNotifications.createChannel({
      id,
      name,
      importance,
      description,
      sound,
      vibration,
      lights
    })).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error creating notification channel:', error);
        return of(false);
      })
    );
  }

  /**
   * Delete notification channel (Android only)
   */
  deleteChannel(channelId: string): Observable<boolean> {
    if (!this.isNativePlatform || Capacitor.getPlatform() !== 'android') {
      return of(false);
    }

    return from(PushNotifications.deleteChannel({ id: channelId })).pipe(
      map(() => true),
      catchError((error) => {
        console.error('Error deleting notification channel:', error);
        return of(false);
      })
    );
  }

  /**
   * List notification channels (Android only)
   */
  listChannels(): Observable<any[]> {
    if (!this.isNativePlatform || Capacitor.getPlatform() !== 'android') {
      return of([]);
    }

    return from(PushNotifications.listChannels()).pipe(
      map((result) => result.channels),
      catchError(() => of([]))
    );
  }

  /**
   * Initialize default notification channels (Android)
   */
  initializeDefaultChannels(): void {
    if (Capacitor.getPlatform() === 'android') {
      this.createChannel(
        'messages',
        'Messages',
        5,
        'Notifications pour les nouveaux messages',
        'default',
        true,
        true
      ).subscribe();

      this.createChannel(
        'appointments',
        'Rendez-vous',
        4,
        'Rappels de rendez-vous',
        'default',
        true,
        false
      ).subscribe();

      this.createChannel(
        'updates',
        'Mises à jour',
        3,
        'Mises à jour de dossiers',
        undefined,
        false,
        false
      ).subscribe();

      this.createChannel(
        'general',
        'Général',
        2,
        'Notifications générales',
        undefined,
        false,
        false
      ).subscribe();
    }
  }

  /**
   * Handle notification routing based on action
   */
  handleNotificationAction(action: ActionPerformed): { route: string; params?: any } | null {
    const data = action.notification.data;
    
    if (!data) {
      return { route: '/' };
    }

    // Route based on notification type
    switch (data.type) {
      case 'message':
        return {
          route: `/dossiers/${data.dossierId}`,
          params: { tab: 'messages' }
        };
      
      case 'appointment':
        return {
          route: `/calendar`,
          params: { eventId: data.eventId }
        };
      
      case 'task':
        return {
          route: `/dossiers/${data.dossierId}`,
          params: { tab: 'tasks', taskId: data.taskId }
        };
      
      case 'dossier_update':
        return {
          route: `/dossiers/${data.dossierId}`
        };
      
      case 'whatsapp':
        return {
          route: `/dossiers/${data.dossierId}`,
          params: { tab: 'whatsapp' }
        };
      
      default:
        return { route: '/' };
    }
  }

  /**
   * Clean up listeners
   */
  removeAllListeners(): void {
    if (this.isNativePlatform) {
      PushNotifications.removeAllListeners();
    }
  }
}
