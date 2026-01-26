import { 
  trigger, 
  transition, 
  style, 
  query, 
  animate, 
  group, 
  animateChild,
  AnimationMetadata 
} from '@angular/animations';

const isReducedMotion = (): boolean => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

const getAnimationDuration = (defaultDuration: string): string => {
  return isReducedMotion() ? '0ms' : defaultDuration;
};

export const routeFadeAnimation = trigger('routeFadeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        opacity: 0
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 })
    ], { optional: true }),
    group([
      query(':leave', [
        animate(getAnimationDuration('200ms') + ' ease-out', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        animate(getAnimationDuration('200ms') + ' ease-in', style({ opacity: 1 }))
      ], { optional: true })
    ])
  ])
]);

export const routeSlideLeftAnimation = trigger('routeSlideLeftAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        left: 0,
        right: 0
      })
    ], { optional: true }),
    group([
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate(getAnimationDuration('200ms') + ' ease-out', style({ 
          transform: 'translateX(-100%)', 
          opacity: 0 
        }))
      ], { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(getAnimationDuration('200ms') + ' ease-out', style({ 
          transform: 'translateX(0)', 
          opacity: 1 
        }))
      ], { optional: true })
    ])
  ])
]);

export const routeSlideRightAnimation = trigger('routeSlideRightAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        left: 0,
        right: 0
      })
    ], { optional: true }),
    group([
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate(getAnimationDuration('200ms') + ' ease-out', style({ 
          transform: 'translateX(100%)', 
          opacity: 0 
        }))
      ], { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate(getAnimationDuration('200ms') + ' ease-out', style({ 
          transform: 'translateX(0)', 
          opacity: 1 
        }))
      ], { optional: true })
    ])
  ])
]);

export const routeFadeInAnimation = trigger('routeFadeInAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        style({ opacity: 1 }),
        animate(getAnimationDuration('200ms') + ' ease-out', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0 }),
        animate(getAnimationDuration('200ms') + ' ease-in', style({ opacity: 1 })),
        animateChild()
      ], { optional: true })
    ])
  ])
]);

export const routeFadeSlideAnimation = trigger('routeFadeSlideAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate(getAnimationDuration('200ms') + ' ease-in', style({ 
          transform: 'translateY(-20px)', 
          opacity: 0 
        }))
      ], { optional: true }),
      query(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate(getAnimationDuration('200ms') + ' ease-out', style({ 
          transform: 'translateY(0)', 
          opacity: 1 
        })),
        animateChild()
      ], { optional: true })
    ])
  ])
]);
