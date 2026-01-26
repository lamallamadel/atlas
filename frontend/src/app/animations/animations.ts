import {
  trigger,
  state,
  style,
  animate,
  transition,
  query,
  stagger,
  keyframes,
  AnimationTriggerMetadata,
} from '@angular/animations';

/**
 * Fade In Animation
 * Simple opacity fade-in for element entrance
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0 }))
  ])
]);

/**
 * Slide Up Animation
 * Slides element up from bottom with fade
 * Used for dialogs and modals (300ms ease-out)
 */
export const slideUp = trigger('slideUp', [
  transition(':enter', [
    style({
      transform: 'translateY(20px)',
      opacity: 0
    }),
    animate('300ms ease-out', style({
      transform: 'translateY(0)',
      opacity: 1
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({
      transform: 'translateY(20px)',
      opacity: 0
    }))
  ])
]);

/**
 * Scale In Animation
 * Scales element from smaller size with fade
 */
export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({
      transform: 'scale(0.9)',
      opacity: 0
    }),
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({
      transform: 'scale(1)',
      opacity: 1
    }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({
      transform: 'scale(0.9)',
      opacity: 0
    }))
  ])
]);

/**
 * Stagger List Animation
 * Animates list items with 50ms delay between each
 * Used for card appearances
 */
export const staggerList = trigger('staggerList', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      stagger(50, [
        animate('300ms ease-out', style({
          opacity: 1,
          transform: 'translateY(0)'
        }))
      ])
    ], { optional: true })
  ])
]);

/**
 * Bounce In Animation
 * Playful bounce effect for success feedback
 */
export const bounceIn = trigger('bounceIn', [
  transition(':enter', [
    animate('600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
      style({ opacity: 0, transform: 'scale(0)', offset: 0 }),
      style({ opacity: 1, transform: 'scale(1.1)', offset: 0.6 }),
      style({ transform: 'scale(0.95)', offset: 0.8 }),
      style({ transform: 'scale(1)', offset: 1.0 })
    ]))
  ])
]);

/**
 * Shake X Animation
 * Horizontal shake for error feedback
 */
export const shakeX = trigger('shakeX', [
  transition('* => error', [
    animate('500ms', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-10px)', offset: 0.1 }),
      style({ transform: 'translateX(10px)', offset: 0.2 }),
      style({ transform: 'translateX(-10px)', offset: 0.3 }),
      style({ transform: 'translateX(10px)', offset: 0.4 }),
      style({ transform: 'translateX(-10px)', offset: 0.5 }),
      style({ transform: 'translateX(10px)', offset: 0.6 }),
      style({ transform: 'translateX(-10px)', offset: 0.7 }),
      style({ transform: 'translateX(10px)', offset: 0.8 }),
      style({ transform: 'translateX(0)', offset: 1.0 })
    ]))
  ])
]);

/**
 * Hover Button Scale Animation
 * Scales button to 1.02 with enhanced shadow on hover
 * Applied via CSS classes and Angular state animations
 */
export const buttonHover = trigger('buttonHover', [
  state('idle', style({
    transform: 'scale(1)',
  })),
  state('hover', style({
    transform: 'scale(1.02)',
  })),
  transition('idle <=> hover', animate('150ms cubic-bezier(0.4, 0, 0.2, 1)'))
]);

/**
 * Focus Pulse Animation
 * Pulse effect on border for focus states
 */
export const focusPulse = trigger('focusPulse', [
  state('unfocused', style({
    boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
  })),
  state('focused', style({
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)'
  })),
  transition('unfocused <=> focused', animate('200ms ease-out'))
]);

/**
 * Card Entrance with Stagger
 * Combines fade, slide and stagger for card list appearances
 */
export const cardStagger = trigger('cardStagger', [
  transition('* => *', [
    query(':enter', [
      style({
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)'
      }),
      stagger(50, [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({
          opacity: 1,
          transform: 'translateY(0) scale(1)'
        }))
      ])
    ], { optional: true }),
    query(':leave', [
      stagger(30, [
        animate('200ms ease-in', style({
          opacity: 0,
          transform: 'translateY(-10px) scale(0.95)'
        }))
      ])
    ], { optional: true })
  ])
]);

/**
 * Dialog Slide Up Animation (specific for Material Dialog)
 * 300ms ease-out as specified
 */
export const dialogSlideUp = trigger('dialogSlideUp', [
  transition(':enter', [
    style({
      transform: 'translateY(30px)',
      opacity: 0
    }),
    animate('300ms ease-out', style({
      transform: 'translateY(0)',
      opacity: 1
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({
      transform: 'translateY(20px)',
      opacity: 0
    }))
  ])
]);

/**
 * List Item Animation (for individual items)
 */
export const listItem = trigger('listItem', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateX(-20px)'
    }),
    animate('300ms ease-out', style({
      opacity: 1,
      transform: 'translateX(0)'
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({
      opacity: 0,
      transform: 'translateX(20px)'
    }))
  ])
]);

/**
 * Fade Slide Animation (combined)
 */
export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(10px)'
    }),
    animate('250ms ease-out', style({
      opacity: 1,
      transform: 'translateY(0)'
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({
      opacity: 0,
      transform: 'translateY(-10px)'
    }))
  ])
]);

/**
 * Expand/Collapse Animation
 */
export const expandCollapse = trigger('expandCollapse', [
  state('collapsed', style({
    height: '0',
    overflow: 'hidden',
    opacity: 0
  })),
  state('expanded', style({
    height: '*',
    overflow: 'visible',
    opacity: 1
  })),
  transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'))
]);

/**
 * Success State Animation
 * Combines scale and color change for success feedback
 */
export const successState = trigger('successState', [
  transition('* => success', [
    animate('400ms ease-out', keyframes([
      style({ transform: 'scale(1)', offset: 0 }),
      style({ transform: 'scale(1.1)', offset: 0.5 }),
      style({ transform: 'scale(1)', offset: 1.0 })
    ]))
  ])
]);

/**
 * Error State Animation
 * Combines shake with color change for error feedback
 */
export const errorState = trigger('errorState', [
  transition('* => error', [
    animate('400ms', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-8px)', offset: 0.15 }),
      style({ transform: 'translateX(8px)', offset: 0.3 }),
      style({ transform: 'translateX(-8px)', offset: 0.45 }),
      style({ transform: 'translateX(8px)', offset: 0.6 }),
      style({ transform: 'translateX(-4px)', offset: 0.75 }),
      style({ transform: 'translateX(0)', offset: 1.0 })
    ]))
  ])
]);

/**
 * Animation Utilities
 */
export const AnimationDurations = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800
} as const;

export const AnimationEasings = {
  EASE_OUT: 'ease-out',
  EASE_IN: 'ease-in',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  SPRING: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)'
} as const;
