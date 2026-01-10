import { trigger, style, transition, animate, keyframes } from '@angular/animations';

export const formFieldErrorAnimation = trigger('errorState', [
  transition('* => error', [
    animate('400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)', keyframes([
      style({ transform: 'translateX(0)', offset: 0 }),
      style({ transform: 'translateX(-10px)', offset: 0.1 }),
      style({ transform: 'translateX(10px)', offset: 0.2 }),
      style({ transform: 'translateX(-10px)', offset: 0.3 }),
      style({ transform: 'translateX(10px)', offset: 0.4 }),
      style({ transform: 'translateX(-10px)', offset: 0.5 }),
      style({ transform: 'translateX(10px)', offset: 0.6 }),
      style({ transform: 'translateX(-10px)', offset: 0.7 }),
      style({ transform: 'translateX(10px)', offset: 0.8 }),
      style({ transform: 'translateX(0)', offset: 1 })
    ]))
  ])
]);

export const errorMessageAnimation = trigger('errorMessage', [
  transition(':enter', [
    style({ 
      opacity: 0, 
      maxHeight: 0,
      transform: 'translateY(-10px)',
      overflow: 'hidden'
    }),
    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ 
      opacity: 1, 
      maxHeight: '100px',
      transform: 'translateY(0)'
    }))
  ]),
  transition(':leave', [
    style({ 
      opacity: 1, 
      maxHeight: '100px',
      overflow: 'hidden'
    }),
    animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ 
      opacity: 0, 
      maxHeight: 0,
      transform: 'translateY(-10px)'
    }))
  ])
]);

export const successFeedbackAnimation = trigger('successFeedback', [
  transition(':enter', [
    style({ 
      opacity: 0, 
      transform: 'scale(0.8)'
    }),
    animate('300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', style({ 
      opacity: 1, 
      transform: 'scale(1)'
    }))
  ]),
  transition(':leave', [
    animate('200ms ease-out', style({ 
      opacity: 0, 
      transform: 'scale(0.8)'
    }))
  ])
]);

export const formSubmitAnimation = trigger('formSubmit', [
  transition('* => submitting', [
    style({ opacity: 1 }),
    animate('200ms ease-out', style({ opacity: 0.6 }))
  ]),
  transition('submitting => success', [
    style({ opacity: 0.6 }),
    animate('300ms ease-in', style({ opacity: 1 }))
  ]),
  transition('submitting => error', [
    animate('400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)', keyframes([
      style({ transform: 'translateX(0)', opacity: 0.6, offset: 0 }),
      style({ transform: 'translateX(-10px)', opacity: 0.8, offset: 0.25 }),
      style({ transform: 'translateX(10px)', opacity: 0.8, offset: 0.5 }),
      style({ transform: 'translateX(-10px)', opacity: 0.8, offset: 0.75 }),
      style({ transform: 'translateX(0)', opacity: 1, offset: 1 })
    ]))
  ])
]);

export const loadingSpinnerAnimation = trigger('loadingSpinner', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.5)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.5)' }))
  ])
]);
