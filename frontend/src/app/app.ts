import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './shared/app-header/app-header.component';
import { ToastOutletComponent } from './core/toast/toast-outlet.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeaderComponent, ToastOutletComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
