import { trigger, transition, style, query, animate, group, animateChild } from '@angular/animations';

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
        animate('200ms ease-out', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        animate('300ms 100ms ease-in', style({ opacity: 1 }))
      ], { optional: true })
    ])
  ])
]);

export const routeSlideAnimation = trigger('routeSlideAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        style({ transform: 'translateX(0)', opacity: 1 }),
        animate('200ms ease-out', style({ 
          transform: 'translateX(-10%)', 
          opacity: 0 
        }))
      ], { optional: true }),
      query(':enter', [
        style({ transform: 'translateX(10%)', opacity: 0 }),
        animate('300ms 100ms ease-out', style({ 
          transform: 'translateX(0)', 
          opacity: 1 
        }))
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
        animate('250ms ease-in', style({ 
          transform: 'translateY(-20px)', 
          opacity: 0 
        }))
      ], { optional: true }),
      query(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('350ms 150ms ease-out', style({ 
          transform: 'translateY(0)', 
          opacity: 1 
        })),
        animateChild()
      ], { optional: true })
    ])
  ])
]);
