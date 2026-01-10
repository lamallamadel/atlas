import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { routeFadeSlideAnimation } from './animations/route-animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [routeFadeSlideAnimation]
})
export class AppComponent {
  title = 'frontend';

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
