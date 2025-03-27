import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NodeComponent } from './components/node/node.component';
import { ConnectorComponent } from './components/connector/connector.component';

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    SidebarComponent,
    NodeComponent,
    ConnectorComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }