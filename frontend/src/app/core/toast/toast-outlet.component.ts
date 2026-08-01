import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="toast-region" aria-live="polite" aria-atomic="false">
      @if (toastService.toasts$ | async; as toasts) {
        @for (toast of toasts; track toast.id) {
          <div class="toast" [class]="'toast toast--' + toast.type" role="status">
            <span>{{ toast.message }}</span>
            <button
              type="button"
              aria-label="Đóng thông báo"
              (click)="toastService.dismiss(toast.id)"
            >
              ×
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 1rem 1rem auto auto;
        z-index: 1000;
        pointer-events: none;
      }
      .toast-region {
        display: grid;
        gap: 0.65rem;
        width: min(360px, calc(100vw - 2rem));
      }
      .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        min-height: 44px;
        padding: 0.7rem 0.8rem 0.7rem 1rem;
        border: 1px solid;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgb(15 23 42 / 15%);
        pointer-events: auto;
        font-size: 0.92rem;
      }
      .toast--success {
        color: #065f46;
        border-color: #a7f3d0;
        background: #ecfdf5;
      }
      .toast--error {
        color: #991b1b;
        border-color: #fecaca;
        background: #fef2f2;
      }
      .toast--info {
        color: #1e40af;
        border-color: #bfdbfe;
        background: #eff6ff;
      }
      button {
        min-width: 32px;
        min-height: 32px;
        padding: 0;
        border: 0;
        color: inherit;
        background: transparent;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
      }
      button:focus-visible {
        outline: 3px solid rgb(37 99 235 / 28%);
        outline-offset: 2px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutletComponent {
  constructor(readonly toastService: ToastService) {}
}
