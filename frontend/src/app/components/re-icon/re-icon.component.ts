import { NgStyle } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, input } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { IconRegistryService } from '../../services/icon-registry.service';

@Component({
    selector: 'app-re-icon',
    standalone: true,
    imports: [NgStyle],
    templateUrl: './re-icon.component.html',
    styleUrls: ['./re-icon.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReIconComponent implements OnInit {
  readonly icon = input.required<string>();
  readonly size = input<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  readonly color = input<string>();
  readonly ariaLabel = input<string>();

  iconSvg: SafeHtml | null = null;

  constructor(
    private iconRegistry: IconRegistryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadIcon();
  }

  private loadIcon(): void {
    if (this.iconRegistry.isLoaded()) {
      this.iconSvg = this.iconRegistry.getIconSync(this.icon());
      this.cdr.markForCheck();
    } else {
      this.iconRegistry.getIcon(this.icon()).subscribe(svg => {
        this.iconSvg = svg;
        this.cdr.markForCheck();
      });
    }
  }

  get sizeClass(): string {
    return `re-icon-${this.size()}`;
  }

  get styles(): { [key: string]: string } {
    const styles: { [key: string]: string } = {};
    const color = this.color();
    if (color) {
      styles['color'] = color;
    }
    return styles;
  }
}
