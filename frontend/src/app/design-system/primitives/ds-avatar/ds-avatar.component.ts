import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type DsAvatarVariant = 'marine' | 'copper' | 'neutral';

@Component({
  selector: 'ds-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="classes" [attr.aria-label]="name || null" role="img">
      @if (src) {
        <img [src]="src" [alt]="name || ''" (error)="onImgError()">
      } @else {
        <span class="ds-avatar__initials" aria-hidden="true">{{ initials }}</span>
      }
    </div>
  `,
  styleUrls: ['./ds-avatar.component.scss'],
})
export class DsAvatarComponent {
  @Input() name: string = '';
  @Input() src: string | null = null;
  @Input() size: DsAvatarSize = 'md';
  @Input() variant: DsAvatarVariant = 'marine';

  get initials(): string {
    if (!this.name) return '?';
    const parts = this.name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  get classes(): string {
    return [
      'ds-avatar',
      `ds-avatar--${this.size}`,
      `ds-avatar--${this.variant}`,
    ].join(' ');
  }

  onImgError(): void {
    this.src = null;
  }
}
