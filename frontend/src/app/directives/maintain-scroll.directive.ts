import { Directive, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NavigationService } from '../services/navigation.service';

@Directive({
  selector: '[appMaintainScroll]'
})
export class MaintainScrollDirective implements OnInit, OnDestroy {
  private subscription!: Subscription;

  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    this.subscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.navigationService.restoreScrollPosition();
    });

    window.addEventListener('beforeunload', () => {
      this.navigationService.saveScrollPosition();
    });
  }

  ngOnDestroy(): void {
    this.navigationService.saveScrollPosition();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
