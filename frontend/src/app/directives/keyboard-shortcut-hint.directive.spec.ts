import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { KeyboardShortcutHintDirective } from './keyboard-shortcut-hint.directive';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { Router } from '@angular/router';

@Component({
  template: `<button appKeyboardShortcutHint="Ctrl+K">Test Button</button>`,
})
class TestComponent {}

describe('KeyboardShortcutHintDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    const routerMock = {
      navigate: vi.fn().mockName('Router.navigate'),
    };

    await TestBed.configureTestingModule({
      imports: [TestComponent, KeyboardShortcutHintDirective],
      providers: [
        KeyboardShortcutService,
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
