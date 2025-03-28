import { Component, type OnInit, signal } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"
import type { NodeType, ValidationResult } from "../../models/node.model"
import { WorkflowService } from "../../services/workflow.service"

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent implements OnInit {
  nodeTypes: any[] = []
  workflowJson = signal("")
  validationResult = signal<ValidationResult>({ valid: true, errors: [] })

  constructor(private workflowService: WorkflowService) {}

  ngOnInit(): void {
    this.nodeTypes = this.workflowService.getNodeTypes()
  }

  onDragStart(event: DragEvent, nodeType: NodeType, title: string, color: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData("nodeType", nodeType)
      event.dataTransfer.setData("title", title)
      event.dataTransfer.setData("color", color)
      event.dataTransfer.effectAllowed = "copy"
    }
  }

  saveWorkflow() {
    this.workflowJson.set(this.workflowService.saveWorkflow())
  }

  loadWorkflow() {
    const json = this.workflowJson()
    if (json) {
      const success = this.workflowService.loadWorkflow(json)
      if (!success) {
        alert("Failed to load workflow. Invalid JSON format.")
      }
    }
  }

  validateWorkflow() {
    this.validationResult.set(this.workflowService.validateWorkflow())
  }

  // Add this new method
  updateWorkflowJson(value: string) {
    this.workflowJson.set(value)
  }
}