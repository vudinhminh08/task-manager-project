import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders shared header, router outlet, and toast outlet as the application shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const childElements = Array.from(compiled.children);

    expect(childElements.map((element) => element.tagName)).toEqual([
      'APP-HEADER',
      'ROUTER-OUTLET',
      'APP-TOAST-OUTLET',
    ]);
  });
});
