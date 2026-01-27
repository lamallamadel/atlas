import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationApiService, NotificationResponse } from '../services/notification-api.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface GroupedNotifications {
  date: string;
  displayDate: string;
  notifications: NotificationResponse[];
}

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications: NotificationResponse[] = [];
  groupedNotifications: GroupedNotifications[] = [];
  loading = false;
  unreadCount = 0;
  selectedType = 'ALL';
  page = 0;
  size = 20;
  hasMore = true;
  
  private destroy$ = new Subject<void>();

  notificationTypes = [
    { value: 'ALL', label: 'Toutes' },
    { value: 'IN_APP', label: 'In-App' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'WHATSAPP', label: 'WhatsApp' }
  ];

  constructor(
    private notificationApiService: NotificationApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.notificationApiService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadCount = count);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(append = false): void {
    this.loading = true;
    const type = this.selectedType === 'ALL' ? undefined : this.selectedType;
    
    this.notificationApiService.list(undefined, type, undefined, this.page, this.size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (append) {
            this.notifications = [...this.notifications, ...response.content];
          } else {
            this.notifications = response.content;
          }
          
          this.hasMore = this.page < response.totalPages - 1;
          this.groupNotificationsByDate();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading notifications:', err);
          this.loading = false;
        }
      });
  }

  groupNotificationsByDate(): void {
    const groups = new Map<string, NotificationResponse[]>();
    
    this.notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const dateKey = this.getDateKey(date);
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      const group = groups.get(dateKey);
      if (group) {
        group.push(notification);
      }
    });

    this.groupedNotifications = Array.from(groups.entries()).map(([date, notifications]) => ({
      date,
      displayDate: this.getDisplayDate(date),
      notifications
    }));
  }

  getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDisplayDate(dateKey: string): string {
    const date = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateString = date.toISOString().split('T')[0];
    const todayString = today.toISOString().split('T')[0];
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateString === todayString) {
      return "Aujourd'hui";
    } else if (dateString === yesterdayString) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  onFilterChange(type: string): void {
    this.selectedType = type;
    this.page = 0;
    this.notifications = [];
    this.loadNotifications();
  }

  loadMore(): void {
    if (!this.loading && this.hasMore) {
      this.page++;
      this.loadNotifications(true);
    }
  }

  markAsRead(notification: NotificationResponse, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    if (notification.readAt) {
      return;
    }

    this.notificationApiService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedNotification) => {
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index] = updatedNotification;
            this.groupNotificationsByDate();
          }
        },
        error: (err) => console.error('Error marking notification as read:', err)
      });
  }

  markAsUnread(notification: NotificationResponse, event: Event): void {
    event.stopPropagation();
    
    if (!notification.readAt) {
      return;
    }

    this.notificationApiService.markAsUnread(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedNotification) => {
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications[index] = updatedNotification;
            this.groupNotificationsByDate();
          }
        },
        error: (err) => console.error('Error marking notification as unread:', err)
      });
  }

  onNotificationClick(notification: NotificationResponse): void {
    this.markAsRead(notification);

    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    } else if (notification.dossierId) {
      this.router.navigate(['/dossiers', notification.dossierId]);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'EMAIL':
        return 'email';
      case 'SMS':
        return 'sms';
      case 'WHATSAPP':
        return 'chat';
      case 'IN_APP':
        return 'notifications';
      default:
        return 'info';
    }
  }

  getNotificationTitle(notification: NotificationResponse): string {
    return notification.subject || notification.message || 'Notification';
  }

  getNotificationMessage(notification: NotificationResponse): string {
    if (notification.message) {
      return notification.message.length > 100 
        ? notification.message.substring(0, 100) + '...' 
        : notification.message;
    }
    return notification.subject || '';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return "À l'instant";
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }

  isUnread(notification: NotificationResponse): boolean {
    return !notification.readAt;
  }

  refresh(): void {
    this.page = 0;
    this.notifications = [];
    this.loadNotifications();
    this.notificationApiService.refreshUnreadCount();
  }
}
