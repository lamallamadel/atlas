/**
 * Extended Semantic Color System - Type Definitions
 * 
 * This file provides TypeScript type safety for the extended color system.
 * Use these types when working with colors programmatically.
 */

/**
 * Neutral-Warmth color variants (warm grays for real estate UI)
 * WCAG AAA compliant (7:1) starting from 600
 */
export type NeutralWarmthVariant = 
  | '50' | '100' | '200' | '300' | '400' 
  | '500' | '600' | '700' | '800' | '900';

/**
 * Success variant types for different positive outcomes
 */
export type SuccessVariantType = 
  | 'sold'    // Vendu (Green)
  | 'rented'  // Loué (Teal)
  | 'signed'  // Signé (Blue-Green)
  | 'default'; // Standard success

/**
 * Success color scale (50-900)
 */
export type SuccessVariantScale = 
  | '50' | '100' | '200' | '300' | '400' 
  | '500' | '600' | '700' | '800' | '900';

/**
 * Warning level types for progressive urgency
 */
export type WarningLevelType = 
  | 'attention'   // Yellow-Orange (mild warning)
  | 'urgent'      // Orange (important warning)
  | 'critical';   // Red-Orange (critical warning)

/**
 * Warning color scale (50-900)
 */
export type WarningLevelScale = 
  | '50' | '100' | '200' | '300' | '400' 
  | '500' | '600' | '700' | '800' | '900';

/**
 * Danger-Soft color scale for non-blocking errors
 */
export type DangerSoftScale = 
  | '50' | '100' | '200' | '300' | '400' 
  | '500' | '600' | '700' | '800' | '900';

/**
 * Surface layer elevation levels
 */
export type SurfaceLayer = 
  | 'base'      // Base background
  | '1'         // First elevation
  | '2'         // Second elevation
  | '3'         // Third elevation
  | '4';        // Fourth elevation

/**
 * Surface variant types
 */
export type SurfaceVariant = 
  | 'default'   // Neutral surfaces
  | 'warm';     // Warm-toned surfaces

/**
 * Property status types for real estate
 */
export type PropertyStatus = 
  | 'SOLD'        // Vendu
  | 'RENTED'      // Loué
  | 'SIGNED'      // Signé
  | 'AVAILABLE'   // Disponible
  | 'PENDING'     // En attente
  | 'RESERVED'    // Réservé
  | 'WITHDRAWN';  // Retiré

/**
 * Lead urgency levels
 */
export type LeadUrgency = 
  | 'attention'   // Normal follow-up
  | 'urgent'      // Urgent attention
  | 'critical';   // Critical immediate action

/**
 * Validation state types
 */
export type ValidationState = 
  | 'error'       // Critical error
  | 'warning'     // Warning
  | 'info'        // Information
  | 'success'     // Success
  | 'soft-error'; // Non-blocking error

/**
 * Badge status entity types
 */
export type BadgeEntityType = 
  | 'annonce'   // Annonce entity
  | 'dossier'   // Dossier entity
  | 'property'; // Property entity

/**
 * Badge status configuration
 */
export interface BadgeStatusConfig {
  label: string;
  icon: string;
  description: string;
  isPulse?: boolean;
  variant?: BadgeColorVariant;
}

/**
 * Badge color variants
 */
export type BadgeColorVariant = 
  | 'success-sold'
  | 'success-rented'
  | 'success-signed'
  | 'success'
  | 'warning-attention'
  | 'warning-urgent'
  | 'warning-critical'
  | 'danger-soft'
  | 'danger'
  | 'neutral'
  | 'neutral-warmth'
  | 'info';

/**
 * Transition types for smooth animations
 */
export type TransitionType = 
  | 'smooth'      // All properties smooth (250ms)
  | 'color'       // Color transitions only
  | 'transform'   // Transform transitions only
  | 'shadow';     // Shadow transitions only

/**
 * WCAG compliance levels
 */
export type WCAGLevel = 
  | 'AA'    // 4.5:1 contrast
  | 'AAA';  // 7:1 contrast

/**
 * Color CSS custom property builder utility type
 */
export type ColorVariable<T extends string> = `--color-${T}`;

/**
 * Utility type for creating color variable names
 * 
 * @example
 * const soldColor: ColorVariable<'success-sold-700'> = '--color-success-sold-700';
 */
export type NeutralWarmthVariable = ColorVariable<`neutral-warmth-${NeutralWarmthVariant}`>;
export type SuccessSoldVariable = ColorVariable<`success-sold-${SuccessVariantScale}`>;
export type SuccessRentedVariable = ColorVariable<`success-rented-${SuccessVariantScale}`>;
export type SuccessSignedVariable = ColorVariable<`success-signed-${SuccessVariantScale}`>;
export type WarningAttentionVariable = ColorVariable<`warning-attention-${WarningLevelScale}`>;
export type WarningUrgentVariable = ColorVariable<`warning-urgent-${WarningLevelScale}`>;
export type WarningCriticalVariable = ColorVariable<`warning-critical-${WarningLevelScale}`>;
export type DangerSoftVariable = ColorVariable<`danger-soft-${DangerSoftScale}`>;
export type SurfaceVariable = ColorVariable<`surface-${SurfaceLayer}`>;

/**
 * Property status color mapping
 */
export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  SOLD: 'var(--color-property-sold)',
  RENTED: 'var(--color-property-rented)',
  SIGNED: 'var(--color-property-signed)',
  AVAILABLE: 'var(--color-property-available)',
  PENDING: 'var(--color-property-pending)',
  RESERVED: 'var(--color-property-reserved)',
  WITHDRAWN: 'var(--color-property-withdrawn)',
};

/**
 * Lead urgency color mapping
 */
export const LEAD_URGENCY_COLORS: Record<LeadUrgency, string> = {
  attention: 'var(--color-lead-attention)',
  urgent: 'var(--color-lead-urgent)',
  critical: 'var(--color-lead-critical)',
};

/**
 * Validation state color mapping
 */
export const VALIDATION_STATE_COLORS: Record<ValidationState, string> = {
  error: 'var(--color-validation-error)',
  warning: 'var(--color-validation-warning)',
  info: 'var(--color-validation-info)',
  success: 'var(--color-validation-success)',
  'soft-error': 'var(--color-validation-soft-error)',
};

/**
 * Transition duration mapping
 */
export const TRANSITION_DURATIONS: Record<TransitionType, string> = {
  smooth: 'var(--transition-badge-smooth)',
  color: 'var(--transition-badge-color)',
  transform: 'var(--transition-badge-transform)',
  shadow: 'var(--transition-badge-shadow)',
};

/**
 * WCAG contrast ratio requirements
 */
export const WCAG_CONTRAST_RATIOS: Record<WCAGLevel, number> = {
  AA: 4.5,
  AAA: 7.0,
};

/**
 * Helper function to get property status color
 */
export function getPropertyStatusColor(status: PropertyStatus): string {
  return PROPERTY_STATUS_COLORS[status];
}

/**
 * Helper function to get lead urgency color
 */
export function getLeadUrgencyColor(urgency: LeadUrgency): string {
  return LEAD_URGENCY_COLORS[urgency];
}

/**
 * Helper function to get validation state color
 */
export function getValidationStateColor(state: ValidationState): string {
  return VALIDATION_STATE_COLORS[state];
}

/**
 * Helper function to check if a color variant meets WCAG AAA (7:1)
 */
export function isWCAGAAA(variant: number): boolean {
  return variant >= 700; // 700+ variants meet WCAG AAA
}

/**
 * Helper function to check if a color variant meets WCAG AA (4.5:1)
 */
export function isWCAGAA(variant: number): boolean {
  return variant >= 600; // 600+ variants meet WCAG AA
}

/**
 * Surface layer shadow mapping
 */
export const SURFACE_SHADOWS: Record<SurfaceLayer, string> = {
  base: 'none',
  '1': 'var(--shadow-surface-1)',
  '2': 'var(--shadow-surface-2)',
  '3': 'var(--shadow-surface-3)',
  '4': 'var(--shadow-surface-4)',
};

/**
 * Helper function to get surface shadow
 */
export function getSurfaceShadow(layer: SurfaceLayer): string {
  return SURFACE_SHADOWS[layer];
}

/**
 * CSS class name builder for utility classes
 */
export interface ColorUtilityClasses {
  // Background utilities
  bgNeutralWarmth: (variant: NeutralWarmthVariant) => string;
  bgSuccessSold: (variant: SuccessVariantScale) => string;
  bgSuccessRented: (variant: SuccessVariantScale) => string;
  bgSuccessSigned: (variant: SuccessVariantScale) => string;
  bgSurface: (layer: SurfaceLayer) => string;
  
  // Text utilities
  textNeutralWarmth: (variant: NeutralWarmthVariant) => string;
  textSuccessSold: (variant: SuccessVariantScale) => string;
  textSuccessRented: (variant: SuccessVariantScale) => string;
  textSuccessSigned: (variant: SuccessVariantScale) => string;
  
  // Border utilities
  borderSuccessSold: () => string;
  borderSuccessRented: () => string;
  borderSuccessSigned: () => string;
  borderNeutralWarmth: (variant: NeutralWarmthVariant) => string;
  
  // Transition utilities
  transitionBadgeSmooth: () => string;
  transitionBadgeColor: () => string;
  transitionBadgeTransform: () => string;
  transitionBadgeShadow: () => string;
}

/**
 * Color utility class name builders
 */
export const colorUtilities: ColorUtilityClasses = {
  bgNeutralWarmth: (variant) => `bg-neutral-warmth-${variant}`,
  bgSuccessSold: (variant) => `bg-success-sold-${variant}`,
  bgSuccessRented: (variant) => `bg-success-rented-${variant}`,
  bgSuccessSigned: (variant) => `bg-success-signed-${variant}`,
  bgSurface: (layer) => `bg-surface-${layer}`,
  
  textNeutralWarmth: (variant) => `text-neutral-warmth-${variant}`,
  textSuccessSold: (variant) => `text-success-sold-${variant}`,
  textSuccessRented: (variant) => `text-success-rented-${variant}`,
  textSuccessSigned: (variant) => `text-success-signed-${variant}`,
  
  borderSuccessSold: () => 'border-success-sold',
  borderSuccessRented: () => 'border-success-rented',
  borderSuccessSigned: () => 'border-success-signed',
  borderNeutralWarmth: (variant) => `border-neutral-warmth-${variant}`,
  
  transitionBadgeSmooth: () => 'transition-badge-smooth',
  transitionBadgeColor: () => 'transition-badge-color',
  transitionBadgeTransform: () => 'transition-badge-transform',
  transitionBadgeShadow: () => 'transition-badge-shadow',
};
