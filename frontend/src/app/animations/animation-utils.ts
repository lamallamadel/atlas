import { AnimationTriggerMetadata, trigger, state, style, transition, animate, keyframes } from '@angular/animations';

/**
 * Utility functions for creating common animations
 */

/**
 * Creates a fade animation trigger
 * @param triggerName - Name of the animation trigger
 * @param duration - Animation duration in milliseconds (default: 300)
 */
export function fadeAnimation(triggerName: string, duration = 300): AnimationTriggerMetadata {
  return trigger(triggerName, [
    transition(':enter', [
      style({ opacity: 0 }),
      animate(`${duration}ms ease-out`, style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate(`${duration}ms ease-in`, style({ opacity: 0 }))
    ])
  ]);
}

/**
 * Creates a slide animation trigger
 * @param triggerName - Name of the animation trigger
 * @param direction - Direction to slide ('left', 'right', 'up', 'down')
 * @param distance - Distance to slide in pixels (default: 20)
 * @param duration - Animation duration in milliseconds (default: 300)
 */
export function slideAnimation(
  triggerName: string, 
  direction: 'left' | 'right' | 'up' | 'down', 
  distance = 20,
  duration = 300
): AnimationTriggerMetadata {
  const transforms = {
    left: `translateX(-${distance}px)`,
    right: `translateX(${distance}px)`,
    up: `translateY(-${distance}px)`,
    down: `translateY(${distance}px)`
  };

  return trigger(triggerName, [
    transition(':enter', [
      style({ opacity: 0, transform: transforms[direction] }),
      animate(`${duration}ms ease-out`, style({ opacity: 1, transform: 'translate(0, 0)' }))
    ]),
    transition(':leave', [
      animate(`${duration}ms ease-in`, style({ opacity: 0, transform: transforms[direction] }))
    ])
  ]);
}

/**
 * Creates a scale animation trigger
 * @param triggerName - Name of the animation trigger
 * @param fromScale - Initial scale value (default: 0.8)
 * @param duration - Animation duration in milliseconds (default: 300)
 */
export function scaleAnimation(
  triggerName: string, 
  fromScale = 0.8,
  duration = 300
): AnimationTriggerMetadata {
  return trigger(triggerName, [
    transition(':enter', [
      style({ opacity: 0, transform: `scale(${fromScale})` }),
      animate(`${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`, 
        style({ opacity: 1, transform: 'scale(1)' }))
    ]),
    transition(':leave', [
      animate(`${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`, 
        style({ opacity: 0, transform: `scale(${fromScale})` }))
    ])
  ]);
}

/**
 * Creates a bounce animation trigger
 * @param triggerName - Name of the animation trigger
 */
export function bounceAnimation(triggerName: string): AnimationTriggerMetadata {
  return trigger(triggerName, [
    transition(':enter', [
      animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
        style({ opacity: 0, transform: 'scale(0)', offset: 0 }),
        style({ opacity: 0.5, transform: 'scale(1.2)', offset: 0.5 }),
        style({ opacity: 1, transform: 'scale(1)', offset: 1 })
      ]))
    ])
  ]);
}

/**
 * Creates a rotate animation trigger
 * @param triggerName - Name of the animation trigger
 * @param degrees - Degrees to rotate (default: 360)
 * @param duration - Animation duration in milliseconds (default: 300)
 */
export function rotateAnimation(
  triggerName: string, 
  degrees = 360,
  duration = 300
): AnimationTriggerMetadata {
  return trigger(triggerName, [
    transition(':enter', [
      style({ opacity: 0, transform: 'rotate(0deg)' }),
      animate(`${duration}ms ease-out`, 
        style({ opacity: 1, transform: `rotate(${degrees}deg)` }))
    ])
  ]);
}

/**
 * Creates a flip animation trigger
 * @param triggerName - Name of the animation trigger
 * @param axis - Axis to flip around ('x' or 'y')
 */
export function flipAnimation(
  triggerName: string, 
  axis: 'x' | 'y' = 'y'
): AnimationTriggerMetadata {
  const transform = axis === 'x' ? 'rotateX(90deg)' : 'rotateY(90deg)';
  
  return trigger(triggerName, [
    transition(':enter', [
      style({ transform, opacity: 0 }),
      animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', 
        style({ transform: 'rotate(0deg)', opacity: 1 }))
    ])
  ]);
}

/**
 * Creates an expand/collapse animation trigger
 * @param triggerName - Name of the animation trigger
 * @param duration - Animation duration in milliseconds (default: 300)
 */
export function expandCollapseAnimation(
  triggerName: string,
  duration = 300
): AnimationTriggerMetadata {
  return trigger(triggerName, [
    state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
    state('expanded', style({ height: '*', overflow: 'visible', opacity: 1 })),
    transition('collapsed <=> expanded', [
      animate(`${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`)
    ])
  ]);
}

/**
 * Animation timing presets
 */
export const AnimationTimings = {
  FAST: '150ms ease',
  NORMAL: '300ms ease-out',
  SLOW: '500ms ease-out',
  SPRING: '400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  SMOOTH: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Easing function presets
 */
export const EasingFunctions = {
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASE_IN_BACK: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  EASE_OUT_BACK: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  EASE_IN_OUT_BACK: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;
