import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DsCardComponent } from '../design-system';

@NgModule({
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientTestingModule,
    NoopAnimationsModule,
    LayoutModule,
    DsCardComponent,
  ],
  imports: [
    CommonModule,
    HttpClientTestingModule,
    FormsModule,
    ReactiveFormsModule,
    NoopAnimationsModule,
    LayoutModule,
    DsCardComponent,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideHttpClientTesting(),
  ],
})
export class CommonTestingModule { }
