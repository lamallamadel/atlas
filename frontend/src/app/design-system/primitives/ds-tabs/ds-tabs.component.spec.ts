import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DsTabsComponent } from './ds-tabs.component';

describe('DsTabsComponent', () => {
  let fixture: ComponentFixture<DsTabsComponent>;
  let list: HTMLElement;

  function create(active = 'a') {
    fixture = TestBed.createComponent(DsTabsComponent);
    fixture.componentInstance.tabs = ['a', 'b', 'c', 'd'].map((v) => ({ value: v, label: 'Onglet ' + v }));
    fixture.componentInstance.activeTab = active;
    fixture.detectChanges();
    list = (fixture.nativeElement as HTMLElement).querySelector('.ds-tabs') as HTMLElement;
    return fixture.componentInstance;
  }

  /** jsdom ne calcule pas la mise en page : tailles simulées. */
  function size(el: HTMLElement, props: Record<string, number>) {
    for (const [k, v] of Object.entries(props)) Object.defineProperty(el, k, { configurable: true, value: v, writable: true });
  }

  beforeEach(() => TestBed.configureTestingModule({ imports: [DsTabsComponent] }));

  it('émet le changement et marque l’onglet actif', () => {
    const c = create();
    const spy = vi.fn();
    c.tabChange.subscribe(spy);
    (list.querySelectorAll('[role="tab"]')[2] as HTMLElement).click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith('c');
    expect(list.querySelector('[aria-selected="true"]')?.getAttribute('data-tab')).toBe('c');
  });

  it('signale les onglets cachés de chaque côté', () => {
    const c = create();
    size(list, { clientWidth: 200, scrollWidth: 600, scrollLeft: 0 });
    c.updateOverflow();
    expect(list.classList).toContain('ds-tabs--more-right');
    expect(list.classList).not.toContain('ds-tabs--more-left');
    list.scrollLeft = 400;
    c.updateOverflow();
    expect(list.classList).toContain('ds-tabs--more-left');
    expect(list.classList).not.toContain('ds-tabs--more-right');
    size(list, { clientWidth: 600, scrollWidth: 600, scrollLeft: 0 });
    c.updateOverflow();
    expect(list.className).not.toMatch(/more-/);
  });

  it('ramène l’onglet actif dans la zone visible', () => {
    const c = create();
    size(list, { clientWidth: 200, scrollWidth: 800, scrollLeft: 0, offsetLeft: 0 });
    const last = list.querySelector('[data-tab="d"]') as HTMLElement;
    size(last, { offsetLeft: 600, offsetWidth: 120 });
    c.select({ value: 'd', label: 'Onglet d' });
    expect(list.scrollLeft).toBe(576);
  });
});
