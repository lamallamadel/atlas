import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { IconRegistryService } from '../../services/icon-registry.service';

@Component({
  selector: 'app-re-icon',
  templateUrl: './re-icon.component.html',
  styleUrls: ['./re-icon.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReIconComponent implements OnInit {
  @Input() icon!: string;
  @Input() size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  @Input() color?: string;
  @Input() ariaLabel?: string;

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
      this.iconSvg = this.iconRegistry.getIconSync(this.icon);
      this.cdr.markForCheck();
    } else {
      this.iconRegistry.getIcon(this.icon).subscribe(svg => {
        this.iconSvg = svg;
        this.cdr.markForCheck();
      });
    }
  }

  get sizeClass(): string {
    return `re-icon-${this.size}`;
  }

  get styles(): { [key: string]: string } {
    const styles: { [key: string]: string } = {};
    if (this.color) {
      styles['color'] = this.color;
    }
    return styles;
  }
}
