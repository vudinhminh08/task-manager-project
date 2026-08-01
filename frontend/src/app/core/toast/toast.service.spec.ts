import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('publishes typed toasts and supports manual dismissal', () => {
    service.success('Đã lưu');
    service.error('Có lỗi');
    service.info('Thông tin');
    const values = service.current();
    expect(values.map((toast) => toast.type)).toEqual(['success', 'error', 'info']);
    service.dismiss(values[1]!.id);
    expect(service.current().map((toast) => toast.message)).toEqual(['Đã lưu', 'Thông tin']);
  });

  it('auto dismisses a toast after its duration', async () => {
    service.show('success', 'Xong', 0);
    expect(service.current()).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(service.current()).toHaveLength(0);
  });
});
