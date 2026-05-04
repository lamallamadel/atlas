/* ================================================================
   ATLASIA DESIGN SYSTEM — barrel d'exports Angular
   ================================================================ */

/* ── Primitives ── */
export { DsButtonComponent }         from './primitives/ds-button/ds-button.component';
export { DsBadgeComponent }          from './primitives/ds-badge/ds-badge.component';
export { DsCardComponent }           from './primitives/ds-card/ds-card.component';
export { DsAvatarComponent }         from './primitives/ds-avatar/ds-avatar.component';
export { DsInputComponent }          from './primitives/ds-input/ds-input.component';
export { DsFilterChipComponent }     from './primitives/ds-filter-chip/ds-filter-chip.component';
export { DsEmptyStateComponent }     from './primitives/ds-empty-state/ds-empty-state.component';
export { DsSkeletonComponent }       from './primitives/ds-skeleton/ds-skeleton.component';
export { DsTabsComponent }           from './primitives/ds-tabs/ds-tabs.component';
export { DsTableComponent }          from './primitives/ds-table/ds-table.component';

/* ── Icons ── */
export { DsIconComponent }           from './icons/ds-icon.component';

/* ── Platform — iOS ── */
export { LargeTitleDirective }       from './platform/ios/large-title.directive';
export { GlassTabbarComponent }      from './platform/ios/glass-tabbar.component';

/* ── Platform — Android ── */
export { M3AppBarComponent }         from './platform/android/m3-app-bar.component';
export { M3FabComponent }            from './platform/android/m3-fab.component';

/* ── Patterns ── */
export { PageHeaderComponent }         from './patterns/page-header/page-header.component';
export { KpiCardComponent }            from './patterns/kpi-card/kpi-card.component';
export { FilterBarComponent }          from './patterns/filter-bar/filter-bar.component';
export { EntityDetailLayoutComponent } from './patterns/entity-detail-layout/entity-detail-layout.component';
export { StageStepperComponent }       from './patterns/stage-stepper/stage-stepper.component';
export { TimelineComponent }           from './patterns/timeline/timeline.component';
export { MessagingThreadComponent }    from './patterns/messaging-thread/messaging-thread.component';
export { AuthHeroComponent }           from './patterns/auth-hero/auth-hero.component';
export { KanbanColumnComponent }       from './patterns/kanban-column/kanban-column.component';
export { WeekGridComponent }           from './patterns/week-grid/week-grid.component';

/* ── Types ── */
export type { DsButtonVariant, DsButtonSize }     from './primitives/ds-button/ds-button.component';
export type { DsBadgeStatus }                     from './primitives/ds-badge/ds-badge.component';
export type { DsCardElevation }                   from './primitives/ds-card/ds-card.component';
export type { DsAvatarSize, DsAvatarVariant }     from './primitives/ds-avatar/ds-avatar.component';
export type { DsTab, DsTabsVariant }              from './primitives/ds-tabs/ds-tabs.component';
export type { DsColumn, DsSortEvent }             from './primitives/ds-table/ds-table.component';
export type { DsIconSize }                        from './icons/ds-icon.component';
export type { IosTabItem }                        from './platform/ios/glass-tabbar.component';
export type { M3AppBarType }                      from './platform/android/m3-app-bar.component';
export type { M3FabSize, M3FabVariant }           from './platform/android/m3-fab.component';
export type { DsTrend }                           from './patterns/kpi-card/kpi-card.component';
export type { DsFilterOption }                    from './patterns/filter-bar/filter-bar.component';
export type { DsStage }                           from './patterns/stage-stepper/stage-stepper.component';
export type { DsTimelineEvent }                   from './patterns/timeline/timeline.component';
export type { DsMessage }                         from './patterns/messaging-thread/messaging-thread.component';
export type { DsKanbanCard, DsKanbanColumn, DsKanbanDropEvent } from './patterns/kanban-column/kanban-column.component';
export type { WeekGridEvent, WeekGridEventType, WeekGridClickEvent } from './patterns/week-grid/week-grid.component';
