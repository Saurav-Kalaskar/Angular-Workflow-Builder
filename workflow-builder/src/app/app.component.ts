import { Component } from '@angular/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CanvasComponent } from './components/canvas/canvas.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, CanvasComponent],
  template: `
    <div class="app-container">
      <h1 class="app-title">Workflow Builder</h1>
      <div class="workflow-container">
        <app-sidebar />
        <app-canvas />
      </div>
    </div>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'workflow-builder';
}