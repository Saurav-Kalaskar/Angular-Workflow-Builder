import { Component, type OnInit, signal } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { NodeType, type ValidationResult } from "../../models/node.model"
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
    console.log("Drag started with:", nodeType, title, color)
    if (event.dataTransfer) {
      event.dataTransfer.setData("nodeType", nodeType)
      event.dataTransfer.setData("title", title)
      event.dataTransfer.setData("color", color)
      event.dataTransfer.effectAllowed = "copy"
    }
  }

  saveWorkflow() {
    const json = this.workflowService.saveWorkflow()
    this.workflowJson.set(json)
    console.log("Workflow saved:", json)
  }

  loadWorkflow() {
    const json = this.workflowJson()
    if (json) {
      console.log("Attempting to load workflow:", json)
      try {
        const success = this.workflowService.loadWorkflow(json)
        if (success) {
          console.log("Workflow loaded successfully")
        } else {
          console.error("Failed to load workflow - service returned false")
          alert("Failed to load workflow. Invalid JSON format.")
        }
      } catch (error) {
        console.error("Error loading workflow:", error)
        alert("Error loading workflow: " + (error instanceof Error ? error.message : String(error)))
      }
    } else {
      console.warn("No workflow JSON to load")
      alert("Please save a workflow first or paste a valid workflow JSON.")
    }
  }

  validateWorkflow() {
    this.validationResult.set(this.workflowService.validateWorkflow())
  }

  updateWorkflowJson(value: string) {
    this.workflowJson.set(value)
  }

  getNodeDescription(nodeType: NodeType): string {
    switch (nodeType) {
      case NodeType.START:
        return "Starting point of the workflow"
      case NodeType.ACTION_1:
        return "Send emails to recipients"
      case NodeType.ACTION_2:
        return "Process and transform data"
      case NodeType.END:
        return "End point of the workflow"
      default:
        return ""
    }
  }
}