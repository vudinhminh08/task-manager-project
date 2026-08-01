import { authGuard } from './core/guards/auth.guard';
import { routes } from './app.routes';

describe('application routes', () => {
  it('defines public authentication routes and guarded task routes', () => {
    expect(routes.map((route) => route.path)).toEqual([
      'login',
      'register',
      'dashboard',
      'tasks/new',
      'tasks/:id',
      'tasks/:id/edit',
      '',
      '**',
    ]);

    for (const path of [
      'dashboard',
      'tasks/new',
      'tasks/:id',
      'tasks/:id/edit',
    ]) {
      expect(routes.find((route) => route.path === path)?.canActivate).toEqual([authGuard]);
    }
    expect(routes.find((route) => route.path === 'login')?.canActivate).toBeUndefined();
    expect(routes.find((route) => route.path === 'register')?.canActivate).toBeUndefined();
  });
});
