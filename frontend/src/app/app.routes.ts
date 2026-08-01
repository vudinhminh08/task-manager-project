import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((module) => module.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(
        (module) => module.RegisterComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/pages/dashboard/dashboard.component').then(
        (module) => module.DashboardComponent,
      ),
  },
  {
    path: 'transactions/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/pages/transaction-form/transaction-form.component').then(
        (module) => module.TransactionFormComponent,
      ),
  },
  {
    path: 'transactions/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/pages/transaction-detail/transaction-detail.component').then(
        (module) => module.TransactionDetailComponent,
      ),
  },
  {
    path: 'transactions/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/pages/transaction-form/transaction-form.component').then(
        (module) => module.TransactionFormComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
