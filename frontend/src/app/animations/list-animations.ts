import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const listStaggerAnimation = trigger('listStaggerAnimation', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      stagger(50, [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

export const fadeInStagger = trigger('fadeInStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0 }),
      stagger(50, [
        animate('250ms ease-out', style({ opacity: 1 }))
      ])
    ], { optional: true })
  ])
]);

export const slideInStagger = trigger('slideInStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      stagger(50, [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ], { optional: true })
  ])
]);

export const itemAnimation = trigger('itemAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
  ])
]);
