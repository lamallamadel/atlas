/* ================================================================
   ATLASIA DESIGN SYSTEM — barrel d'exports Angular
   ================================================================ */

/* ── Primitives ── */
export { DsButtonComponent }         from './primitives/ds-button/ds-button.component';
export { DsRippleDirective }         from './primitives/ds-button/ds-ripple.directive';
export { DsIconComponent }           from './icons/ds-icon.component';
export { DsCardComponent }           from './primitives/ds-card/ds-card.component';
export { DsInputComponent }          from './primitives/ds-input/ds-input.component';
export { DsTextareaComponent }       from './primitives/ds-textarea/ds-textarea.component';
export { DsSelectComponent }         from './primitives/ds-select/ds-select.component';
export { DsCheckboxComponent }       from './primitives/ds-checkbox/ds-checkbox.component';
export { DsRadioGroupComponent }     from './primitives/ds-radio/ds-radio-group.component';
export { DsBadgeComponent }          from './primitives/ds-badge/ds-badge.component';
export { DsSkeletonComponent }       from './primitives/ds-skeleton/ds-skeleton.component';
export { DsProgressBarComponent }    from './primitives/ds-progress-bar/ds-progress-bar.component';
export { DsEmptyStateComponent }     from './primitives/ds-empty-state/ds-empty-state.component';
export { DsTableComponent }          from './primitives/ds-table/ds-table.component';
export { DsCellDirective }           from './primitives/ds-table/ds-cell.directive';
export { DsTabsComponent }           from './primitives/ds-tabs/ds-tabs.component';
export { DsFilterChipComponent }     from './primitives/ds-filter-chip/ds-filter-chip.component';
export { DsAvatarComponent }         from './primitives/ds-avatar/ds-avatar.component';
export { DsSwitchComponent }         from './primitives/ds-switch/ds-switch.component';

export { DsToastComponent }          from './primitives/ds-toast/ds-toast.component';
export { DsToastContainerComponent } from './primitives/ds-toast/ds-toast-container.component';
export { DsToastService }            from './primitives/ds-toast/ds-toast.service';
export { DsDialogService }           from './primitives/ds-dialog/ds-dialog.service';
export { DsDialogHeaderComponent }   from './primitives/ds-dialog/ds-dialog-header.component';
export { DsDialogContentComponent }  from './primitives/ds-dialog/ds-dialog-content.component';
export { DsDialogActionsComponent }   from './primitives/ds-dialog/ds-dialog-actions.component';

/* ── Icons ── */
export type { DsIconName, DsIconSize } from './icons/ds-icon.component';

/* ── Types & Interfaces ── */
export type { DsButtonVariant, DsButtonSize } from './primitives/ds-button/ds-button.component';
export type { DsBadgeStatus } from './primitives/ds-badge/ds-badge.component';
export type { DsProgressBarVariant } from './primitives/ds-progress-bar/ds-progress-bar.component';
export type { DsSelectOption } from './primitives/ds-select/ds-select.component';
export type { DsTextareaResize } from './primitives/ds-textarea/ds-textarea.component';
export type { DsRadioOption } from './primitives/ds-radio/ds-radio-group.component';
export type { DsTab } from './primitives/ds-tabs/ds-tabs.component';
export type { DsColumn, DsRowAction, DsSortEvent } from './primitives/ds-table/ds-table.component';
export type { DsToastAction, DsToastType } from './primitives/ds-toast/ds-toast.service';

/* ── Patterns ── */
export { PageHeaderComponent }       from './patterns/page-header/page-header.component';
export { KpiCardComponent }          from './patterns/kpi-card/kpi-card.component';
export { FilterBarComponent }        from './patterns/filter-bar/filter-bar.component';
export { EntityDetailLayoutComponent } from './patterns/entity-detail-layout/entity-detail-layout.component';
export { MessagingThreadComponent }  from './patterns/messaging-thread/messaging-thread.component';
export { TimelineComponent }         from './patterns/timeline/timeline.component';
export { KanbanColumnComponent }     from './patterns/kanban-column/kanban-column.component';
export { WeekGridComponent }         from './patterns/week-grid/week-grid.component';
export { StageStepperComponent }     from './patterns/stage-stepper/stage-stepper.component';

export type { DsFilterOption } from './patterns/filter-bar/filter-bar.component';
export type { DsKanbanCard, DsKanbanColumn, DsKanbanDropEvent } from './patterns/kanban-column/kanban-column.component';
export type { WeekGridEvent, WeekGridEventType, WeekGridClickEvent } from './patterns/week-grid/week-grid.component';
export type { DsTimelineEvent } from './patterns/timeline/timeline.component';
export type { DsStage } from './patterns/stage-stepper/stage-stepper.component';
