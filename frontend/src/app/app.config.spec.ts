import { NgZone, ɵChangeDetectionScheduler } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { appConfig } from './app.config';

/**
 * Components in this app hold plain mutable fields and assign them from RxJS
 * callbacks, so they only repaint under zone-based change detection. Angular 21
 * is zoneless by default; when this provider went missing the dashboard sat on
 * its loading state forever even though the request had already returned, and
 * every unit test still passed.
 *
 * TestBed installs its own zone no matter how the application is configured, so
 * no component test can catch that. This asserts the configuration itself.
 */
describe('application change detection setup', () => {
  it('registers zone-based change detection', () => {
    const tokens: unknown[] = [];
    const collect = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      const nested = (value as { ɵproviders?: unknown })?.ɵproviders;
      if (nested) {
        collect(nested);
        return;
      }
      const token = (value as { provide?: unknown })?.provide;
      if (token) tokens.push(token);
    };
    collect(appConfig.providers as unknown);

    expect(tokens).toContain(NgZone);
    expect(tokens).not.toContain(ɵChangeDetectionScheduler);
  });
});
