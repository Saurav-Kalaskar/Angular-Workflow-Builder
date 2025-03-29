import {
  Component,
  type OnInit,
  ViewChild,
  type ElementRef,
  signal,
  effect,
  type AfterViewInit,
  HostListener,
  PLATFORM_ID,
  inject,
} from "@angular/core"
import { CommonModule, isPlatformBrowser } from "@angular/common"
import { NodeConfig, NodeType, Connection } from "../../models/node.model"
import { WorkflowService } from "../../services/workflow.service"

@Component({
  selector: "app-canvas",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./canvas.component.html",
  styleUrl: "./canvas.component.scss",
})
export class CanvasComponent implements OnInit, AfterViewInit {
  @ViewChild("canvas", { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>

  // Connection state
  connectingNode = signal<{ id: string; isOutput: boolean } | null>(null)
  connectionInProgress = signal(false)
  connectionStartX = signal(0)
  connectionStartY = signal(0)
  connectionEndX = signal(0)
  connectionEndY = signal(0)

  // Hover state for ports
  hoveredPort = signal<{ id: string; isOutput: boolean } | null>(null)

  private platformId = inject(PLATFORM_ID);
  isBrowser: boolean;

  constructor(
    public workflowService: WorkflowService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Only set up the effect if we're in a browser
    if (this.isBrowser) {
      effect(() => {
        const nodes = this.workflowService.nodes()
        const connections = this.workflowService.connections()
        // Need both nodes and connections for the effect to trigger
        if (nodes && connections && this.canvasRef?.nativeElement) {
          // Draw connections after DOM updates
          setTimeout(() => this.drawConnections(), 0)
        }
      })
    }
  }

  ngOnInit(): void {
    console.log("Canvas component initialized")
  }

  ngAfterViewInit(): void {
    // Only run browser-specific code if we're in a browser
    if (this.isBrowser) {
      console.log("Canvas component view initialized");
      
      // Log canvas element to verify it exists
      if (this.canvasRef?.nativeElement) {
        console.log("Canvas element found:", this.canvasRef.nativeElement);
      } else {
        console.error("Canvas element not found");
      }
      
      // Set initial canvas size after a delay to ensure DOM is ready
      setTimeout(() => {
        this.resizeCanvas();
        // Initial draw
        this.drawConnections();
        console.log("Initial canvas resize and draw completed");
      }, 100);
    }
  }

  @HostListener("window:resize")
  resizeCanvas(): void {
    if (!this.isBrowser || !this.canvasRef?.nativeElement) {
      console.warn("Can't resize canvas - browser not available or canvas ref not found");
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;

    if (container) {
      // Log dimensions before and after
      console.log("Container dimensions:", container.clientWidth, "x", container.clientHeight);
      
      // Set canvas dimensions to match container
      canvas.width = container.clientWidth || 800;
      canvas.height = container.clientHeight || 500;
      
      console.log("Canvas resized to:", canvas.width, "x", canvas.height);
      
      // Redraw connections with the new dimensions
      this.drawConnections();
    } else {
      console.error("Canvas container not found");
    }
  }

  onDragOver(event: DragEvent) {
    // This is critical - prevents the browser from handling the drag
    event.preventDefault()

    // Set the drop effect to copy
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy"
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()

    if (!event.dataTransfer) {
      console.error("No dataTransfer in drop event")
      return
    }

    const nodeType = event.dataTransfer.getData("nodeType")
    const title = event.dataTransfer.getData("title")
    const color = event.dataTransfer.getData("color")

    console.log("Drop data:", { nodeType, title, color })

    if (nodeType && title) {
      // Get canvas coordinates - use the event target instead of canvasRef
      const canvasRect = (event.currentTarget as HTMLElement).getBoundingClientRect()

      const x = event.clientX - canvasRect.left
      const y = event.clientY - canvasRect.top

      console.log("Drop position:", x, y)

      // Create default params for action nodes
      let params = {}
      if (nodeType === NodeType.ACTION_1) {
        params = { recipient: "", subject: "", body: "" }
      } else if (nodeType === NodeType.ACTION_2) {
        params = { dataSource: "", operation: "transform" }
      }

      const newNode: NodeConfig = {
        id: `node-${Date.now()}`,
        type: nodeType as NodeType,
        title,
        x,
        y,
        params,
      }

      console.log("Adding node:", newNode)
      this.workflowService.addNode(newNode)
    } else {
      console.error("Missing node data in drop event")
    }
  }

  onNodeDragStart(event: DragEvent, nodeId: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData("nodeId", nodeId)
      event.dataTransfer.effectAllowed = "move"
      console.log("Node drag started:", nodeId)
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
    event.stopPropagation()

    if (!event.dataTransfer) {
      console.error("No dataTransfer in node drop event")
      return
    }

    const nodeId = event.dataTransfer.getData("nodeId")
    if (!nodeId) {
      console.error("No nodeId in dataTransfer")
      return
    }

    // Use the event target instead of canvasRef
    const canvasRect = (event.currentTarget as HTMLElement).getBoundingClientRect()

    const x = event.clientX - canvasRect.left
    const y = event.clientY - canvasRect.top

    // Find the node in the workflow service
    const node = this.workflowService.nodes().find((n) => n.id === nodeId)
    if (!node) {
      console.error("Node not found:", nodeId)
      return
    }

    const updatedNode = { ...node, x, y }
    this.workflowService.updateNode(updatedNode)
    console.log("Node moved to:", x, y)
  }

  // Port hover handlers
  onPortMouseEnter(nodeId: string, isOutput: boolean) {
    this.hoveredPort.set({ id: nodeId, isOutput })
  }

  onPortMouseLeave() {
    this.hoveredPort.set(null)
  }

  // Connection handlers
  startConnection(nodeId: string, isOutput: boolean, event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()

    // Set the connecting node
    this.connectingNode.set({ id: nodeId, isOutput })

    // Get the port element
    const portId = isOutput ? `output-${nodeId}` : `input-${nodeId}`
    const portElement = document.getElementById(portId)

    if (portElement) {
      const portRect = portElement.getBoundingClientRect()
      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect()

      // Set the connection start coordinates
      this.connectionStartX.set(portRect.left + portRect.width / 2 - canvasRect.left)
      this.connectionStartY.set(portRect.top + portRect.height / 2 - canvasRect.top)

      // Initialize end coordinates to the same as start
      this.connectionEndX.set(this.connectionStartX())
      this.connectionEndY.set(this.connectionStartY())

      // Set connection in progress
      this.connectionInProgress.set(true)

      console.log("Starting connection from:", nodeId, isOutput ? "output" : "input")
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this.connectionInProgress() && event.touches.length > 0) {
      event.preventDefault();
      
      const touch = event.touches[0];
      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();
  
      this.connectionEndX.set(touch.clientX - canvasRect.left);
      this.connectionEndY.set(touch.clientY - canvasRect.top);
  
      this.drawConnections();
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    // Implementation for handling touch start events
    // This is important for mobile drag-drop operations
    if (event.target) {
      const element = event.target as HTMLElement;
      const portElement = element.closest('.port');
      
      if (portElement) {
        // Handle port touch start
        const nodeId = portElement.id.split('-')[1];
        const isOutput = portElement.classList.contains('output-port');
        
        // Create a simulated mouse event
        const touchLocation = event.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touchLocation.clientX,
          clientY: touchLocation.clientY,
          bubbles: true
        });
        
        this.startConnection(nodeId, isOutput, mouseEvent);
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    // Handle touch end events
    if (this.connectionInProgress()) {
      // Check if we're over a port
      const touch = event.changedTouches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element && element.classList.contains('port')) {
        const nodeId = element.id.split('-')[1];
        const isOutput = element.classList.contains('output-port');
        
        // Create a simulated mouse event
        const mouseEvent = new MouseEvent('mouseup', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true
        });
        
        this.endConnection(nodeId, isOutput, mouseEvent);
      } else {
        this.cancelConnection();
      }
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Only update if a connection is in progress
    if (this.connectionInProgress() && this.canvasRef?.nativeElement) {
      const canvasRect = this.canvasRef.nativeElement.getBoundingClientRect();

      // Update the end coordinates
      this.connectionEndX.set(event.clientX - canvasRect.left);
      this.connectionEndY.set(event.clientY - canvasRect.top);

      // Redraw connections
      this.drawConnections();
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    // If connection is in progress but not over a port, cancel it
    if (this.connectionInProgress()) {
      const element = event.target as HTMLElement;
      if (element.classList.contains('port')) {
        // This is handled by port click handlers
        return;
      }
      // If released not on a port, cancel the connection
      this.cancelConnection();
    }
  }

  endConnection(nodeId: string, isOutput: boolean, event: MouseEvent) {
    event.stopPropagation()

    // Only process if a connection is in progress
    if (!this.connectionInProgress()) return

    const connecting = this.connectingNode()
    if (!connecting) return

    // Can't connect to self
    if (connecting.id === nodeId) {
      this.cancelConnection()
      return
    }

    // Validate connection types
    if (connecting.isOutput === isOutput) {
      // Can't connect output to output or input to input
      console.log("Invalid connection: Cannot connect same port types")
      this.cancelConnection()
      return
    }

    // Create the connection
    let connection: Connection

    // Output port connects to input port
    if (connecting.isOutput && !isOutput) {
      connection = {
        id: `conn-${Date.now()}`,
        sourceId: connecting.id,
        targetId: nodeId,
      }
    }
    // Input port connects to output port
    else {
      connection = {
        id: `conn-${Date.now()}`,
        sourceId: nodeId,
        targetId: connecting.id,
      }
    }

    // Add the connection
    this.workflowService.addConnection(connection)
    console.log("Connection created:", connection.sourceId, "->", connection.targetId)

    // Reset connection state
    this.cancelConnection()
  }

  cancelConnection() {
    this.connectingNode.set(null)
    this.connectionInProgress.set(false)
    // Redraw connections to remove the in-progress line
    this.drawConnections()
  }

  removeNode(nodeId: string, event: MouseEvent) {
    event.stopPropagation()
    this.workflowService.removeNode(nodeId)
    console.log("Node removed:", nodeId)
  }

  drawConnections() {
    if (!this.isBrowser || !this.canvasRef?.nativeElement) {
      return;
    }
  
    try {
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
  
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // Set canvas dimensions to match parent container
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
  
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
  
          // Draw the connection
          this.drawConnection(ctx, startX, startY, endX, endY);
        }
      });
  
      // Draw connection preview
      if (this.connectionInProgress()) {
        this.drawConnection(
          ctx,
          this.connectionStartX(),
          this.connectionStartY(),
          this.connectionEndX(),
          this.connectionEndY(),
          true
        );
      }
    } catch (error) {
      console.error("Error drawing connections:", error);
    }
  }
  

  drawConnection(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    isPreview = false,
  ) {
    // Draw arrow
    ctx.beginPath()
    ctx.moveTo(startX, startY)

    // Create a curved line
    const controlPointX = (startX + endX) / 2
    const controlPointY = (startY + endY) / 2

    ctx.quadraticCurveTo(controlPointX, controlPointY, endX, endY)

    // Set styles based on whether this is a preview or not
    if (isPreview) {
      ctx.strokeStyle = "#4CAF50" // Green for preview
      ctx.lineWidth = 2
    } else {
      ctx.strokeStyle = "#666" // Gray for existing connections
      ctx.lineWidth = 2
    }

    ctx.stroke()

    // Only draw arrowhead for non-preview connections
    if (!isPreview) {
      // Draw arrowhead
      const angle = Math.atan2(endY - controlPointY, endX - controlPointX)
      const arrowSize = 10

      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6))
      ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6))
      ctx.closePath()
      ctx.fillStyle = "#666"
      ctx.fill()
    }
  }

  openNodeConfig(node: NodeConfig) {
    // This would typically open a modal or panel
    // For simplicity, we'll use a prompt
    if (node.type === NodeType.ACTION_1) {
      const recipient = prompt("Recipient Email:", node.params?.["recipient"] || "")
      const subject = prompt("Email Subject:", node.params?.["subject"] || "")
      const body = prompt("Email Body:", node.params?.["body"] || "")

      if (recipient !== null && subject !== null && body !== null) {
        const updatedNode = {
          ...node,
          params: { recipient, subject, body },
        }
        this.workflowService.updateNode(updatedNode)
      }
    } else if (node.type === NodeType.ACTION_2) {
      const dataSource = prompt("Data Source:", node.params?.["dataSource"] || "")
      const operation = prompt("Operation (transform, filter, aggregate):", node.params?.["operation"] || "transform")

      if (dataSource !== null && operation !== null) {
        const updatedNode = {
          ...node,
          params: { dataSource, operation },
        }
        this.workflowService.updateNode(updatedNode)
      }
    }
  }

  // Add this method to your CanvasComponent class:
  getObjectKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}

