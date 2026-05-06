import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import {
  LoadingSkeletonComponent,
  SkeletonVariant,
} from './loading-skeleton.component';

/** Variantes supportées par `app-skeleton-loader` (sans variante `spinner`). */
export type SkeletonLoaderVariant = Exclude<SkeletonVariant, 'spinner'>;

/**
 * Alias historique : délègue à {@link LoadingSkeletonComponent} (DS + `ds-skeleton`).
 * Préférer `app-loading-skeleton` dans le nouveau code.
 */
@Component({
  selector: 'app-skeleton-loader',
  template:
    '<app-loading-skeleton [variant]="variant()" [rows]="rows()" [columns]="columns()" [animate]="animate()" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingSkeletonComponent],
})
export class SkeletonLoaderComponent {
  readonly variant = input<SkeletonLoaderVariant>('card');
  readonly rows = input(3);
  readonly columns = input(8);
  readonly animate = input(true);
}
