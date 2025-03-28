import { Component, type OnInit, ViewChild, type ElementRef, signal, effect } from "@angular/core"
import { CommonModule } from "@angular/common"
import { type NodeConfig, NodeType, type Connection } from "../../models/node.model"
import { WorkflowService } from "../../services/workflow.service"

@Component({
  selector: "app-canvas",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./canvas.component.html",
  styleUrl: "./canvas.component.scss",
})
export class CanvasComponent implements OnInit {
  @ViewChild("canvas", { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>

  connectingNode = signal<{ id: string; isOutput: boolean } | null>(null)

  constructor(public workflowService: WorkflowService) {
    // Use effect to redraw connections when nodes or connections change
    effect(() => {
      const nodes = this.workflowService.nodes()
      const connections = this.workflowService.connections()
      // Need both nodes and connections for the effect to trigger
      if (nodes && connections) {
        // Draw connections after DOM updates
        setTimeout(() => this.drawConnections(), 0)
      }
    })
  }

  ngOnInit(): void {
    // Initial draw
    setTimeout(() => this.drawConnections(), 0)
  }

  onDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy"
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    if (!event.dataTransfer) return

    const nodeType = event.dataTransfer.getData("nodeType") as NodeType
    const title = event.dataTransfer.getData("title")
    const color = event.dataTransfer.getData("color")

    if (!nodeType || !title) return

    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect()
    const x = event.clientX - canvasRect.left
    const y = event.clientY - canvasRect.top

    // Create default params for action nodes
    let params = {}
    if (nodeType === NodeType.ACTION_1) {
      params = { recipient: "", subject: "", body: "" }
    } else if (nodeType === NodeType.ACTION_2) {
      params = { dataSource: "", operation: "transform" }
    }

    const newNode: NodeConfig = {
      id: `node-${Date.now()}`,
      type: nodeType,
      title,
      x,
      y,
      params,
    }

    this.workflowService.addNode(newNode)
  }

  onNodeDragStart(event: DragEvent, nodeId: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData("nodeId", nodeId)
      event.dataTransfer.effectAllowed = "move"
    }
  }

  onNodeDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move"
    }
  }

  onNodeDrop(event: DragEvent) {
    event.preventDefault()
    if (!event.dataTransfer) return

    const nodeId = event.dataTransfer.getData("nodeId")
    if (!nodeId) return

    const node = this.workflowService.nodes().find((n) => n.id === nodeId)
    if (!node) return

    const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect()
    const x = event.clientX - canvasRect.left
    const y = event.clientY - canvasRect.top

    const updatedNode = { ...node, x, y }
    this.workflowService.updateNode(updatedNode)
  }

  startConnection(nodeId: string, isOutput: boolean, event: MouseEvent) {
    event.stopPropagation()
    this.connectingNode.set({ id: nodeId, isOutput })
  }

  endConnection(nodeId: string, isOutput: boolean, event: MouseEvent) {
    event.stopPropagation()
    const connecting = this.connectingNode()
    if (!connecting) return

    // Can't connect to self
    if (connecting.id === nodeId) {
      this.connectingNode.set(null)
      return
    }

    // Output port connects to input port
    if (connecting.isOutput && !isOutput) {
      const connection: Connection = {
        id: `conn-${Date.now()}`,
        sourceId: connecting.id,
        targetId: nodeId,
      }
      this.workflowService.addConnection(connection)
    }
    // Input port connects to output port
    else if (!connecting.isOutput && isOutput) {
      const connection: Connection = {
        id: `conn-${Date.now()}`,
        sourceId: nodeId,
        targetId: connecting.id,
      }
      this.workflowService.addConnection(connection)
    }

    this.connectingNode.set(null)
  }

  cancelConnection() {
    this.connectingNode.set(null)
  }

  removeNode(nodeId: string, event: MouseEvent) {
    event.stopPropagation()
    this.workflowService.removeNode(nodeId)
  }

  drawConnections() {
    if (typeof window === 'undefined' || !this.canvasRef) {
      // Skip execution if not in a browser environment
      return;
    }
  
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
  
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Set canvas dimensions to match parent
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;
  
    // Draw connections
    this.workflowService.connections().forEach((connection) => {
      const sourceNode = document.getElementById(`output-${connection.sourceId}`);
      const targetNode = document.getElementById(`input-${connection.targetId}`);
  
      if (sourceNode && targetNode) {
        const sourceRect = sourceNode.getBoundingClientRect();
        const targetRect = targetNode.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
  
        const startX = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
        const startY = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
        const endX = targetRect.left + targetRect.width / 2 - canvasRect.left;
        const endY = targetRect.top + targetRect.height / 2 - canvasRect.top;
  
        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(startX, startY);
  
        const controlPointX = (startX + endX) / 2;
        const controlPointY = (startY + endY) / 2;
  
        ctx.quadraticCurveTo(controlPointX, controlPointY, endX, endY);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }

  openNodeConfig(node: NodeConfig) {
    // This would typically open a modal or panel
    // For simplicity, we'll use a prompt
    if (node.type === NodeType.ACTION_1) {
      const recipient = prompt("Recipient Email:", node.params?.['recipient'] || "")
      const subject = prompt("Email Subject:", node.params?.['subject'] || "")
      const body = prompt("Email Body:", node.params?.['body'] || "")

      if (recipient !== null && subject !== null && body !== null) {
        const updatedNode = {
          ...node,
          params: { recipient, subject, body },
        }
        this.workflowService.updateNode(updatedNode)
      }
    } else if (node.type === NodeType.ACTION_2) {
      const dataSource = prompt("Data Source:", node.params?.['dataSource'] || "")
      const operation = prompt("Operation (transform, filter, aggregate):", node.params?.['operation'] || "transform")

      if (dataSource !== null && operation !== null) {
        const updatedNode = {
          ...node,
          params: { dataSource, operation },
        }
        this.workflowService.updateNode(updatedNode)
      }
    }
  }
}

