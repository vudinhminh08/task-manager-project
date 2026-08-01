import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly subject = new BehaviorSubject<Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  readonly toasts$ = this.subject.asObservable();

  current(): Toast[] {
    return this.subject.value;
  }

  show(type: ToastType, message: string, duration = 3500): number {
    const id = this.nextId++;
    this.subject.next([...this.subject.value, { id, type, message }]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), duration),
    );
    return id;
  }

  success(message: string, duration = 3500): number {
    return this.show('success', message, duration);
  }

  error(message: string, duration = 3500): number {
    return this.show('error', message, duration);
  }

  info(message: string, duration = 3500): number {
    return this.show('info', message, duration);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.subject.next(this.subject.value.filter((toast) => toast.id !== id));
  }
}
