import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AnnoncesComponent } from './pages/annonces/annonces.component';
import { AnnonceCreateComponent } from './pages/annonces/annonce-create.component';
import { AnnonceDetailComponent } from './pages/annonces/annonce-detail.component';
import { DossiersComponent } from './pages/dossiers/dossiers.component';
import { DossierDetailComponent } from './pages/dossiers/dossier-detail.component';
import { GenericTableComponent } from './components/generic-table.component';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    AppLayoutComponent,
    DashboardComponent,
    AnnoncesComponent,
    AnnonceCreateComponent,
    AnnonceDetailComponent,
    DossiersComponent,
    DossierDetailComponent,
    GenericTableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CorrelationIdInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
