import { NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { FormsModule } from "@angular/forms"

import { AppComponent } from "./app.component"
import { SidebarComponent } from "./components/sidebar/sidebar.component"
import { CanvasComponent } from "./components/canvas/canvas.component"

@NgModule({
  declarations: [AppComponent, SidebarComponent, CanvasComponent],
  imports: [BrowserModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}