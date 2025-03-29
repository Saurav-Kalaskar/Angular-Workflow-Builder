import { Injectable, signal, computed } from "@angular/core"
import { type Connection, type NodeConfig, NodeType, type Workflow, type ValidationResult } from "../models/node.model"

interface NodeTypeInfo {
  type: NodeType
  title: string
  color: string
}

@Injectable({
  providedIn: "root",
})
export class WorkflowService {
  private nodeTypes: NodeTypeInfo[] = [
    { type: NodeType.START, title: "Start", color: "#4CAF50" },
    { type: NodeType.ACTION_1, title: "Send Email", color: "#2196F3" },
    { type: NodeType.ACTION_2, title: "Process Data", color: "#FF9800" },
    { type: NodeType.END, title: "End", color: "#F44336" },
  ]

  
  private workflowSignal = signal<Workflow>({
    nodes: [],
    connections: [],
  })

  
  readonly nodes = computed(() => this.workflowSignal().nodes)
  readonly connections = computed(() => this.workflowSignal().connections)
  readonly workflow = computed(() => this.workflowSignal())

  constructor() {}

  getNodeTypes(): NodeTypeInfo[] {
    return this.nodeTypes
  }

  addNode(node: NodeConfig): void {
    this.workflowSignal.update((workflow) => ({
      ...workflow,
      nodes: [...workflow.nodes, node],
    }))
  }

  updateNode(updatedNode: NodeConfig): void {
    this.workflowSignal.update((workflow) => ({
      ...workflow,
      nodes: workflow.nodes.map((node) => (node.id === updatedNode.id ? updatedNode : node)),
    }))
  }

  removeNode(nodeId: string): void {
    this.workflowSignal.update((workflow) => ({
      nodes: workflow.nodes.filter((node) => node.id !== nodeId),
      connections: workflow.connections.filter((conn) => conn.sourceId !== nodeId && conn.targetId !== nodeId),
    }))
  }

  addConnection(connection: Connection): void {
    
    if (!this.isValidConnection(connection)) {
      console.error("Invalid connection:", connection)
      return
    }

    const currentWorkflow = this.workflowSignal()
    
    const connectionExists = currentWorkflow.connections.some(
      (conn) => conn.sourceId === connection.sourceId && conn.targetId === connection.targetId,
    )

    if (!connectionExists) {
      this.workflowSignal.update((workflow) => ({
        ...workflow,
        connections: [...workflow.connections, connection],
      }))
    }
  }

  removeConnection(connectionId: string): void {
    this.workflowSignal.update((workflow) => ({
      ...workflow,
      connections: workflow.connections.filter((conn) => conn.id !== connectionId),
    }))
  }

  isValidConnection(connection: Connection): boolean {
    const { sourceId, targetId } = connection

    
    const sourceNode = this.nodes().find((node) => node.id === sourceId)
    const targetNode = this.nodes().find((node) => node.id === targetId)

    
    if (!sourceNode || !targetNode) {
      console.error("Source or target node not found")
      return false
    }

    
    
    if (sourceNode.type === NodeType.END) {
      console.error("End node cannot be a source")
      return false
    }

    
    if (targetNode.type === NodeType.START) {
      console.error("Start node cannot be a target")
      return false
    }

    
    const workflow = this.workflowSignal()

    
    const targetHasInput = workflow.connections.some((conn) => conn.targetId === targetId)
    if (targetHasInput) {
      console.error("Target node already has an input connection")
      return false
    }

    return true
  }

  saveWorkflow(): string {
    return JSON.stringify(this.workflowSignal())
  }

  loadWorkflow(json: string): boolean {
    try {
      const workflow = JSON.parse(json) as Workflow
      this.workflowSignal.set(workflow)
      return true
    } catch (e) {
      console.error("Failed to parse workflow JSON", e)
      return false
    }
  }

  validateWorkflow(): ValidationResult {
    const workflow = this.workflowSignal()
    const errors: string[] = []

    
    const startNodes = workflow.nodes.filter((node) => node.type === NodeType.START)
    if (startNodes.length === 0) {
      errors.push("Workflow must have a Start node")
    }

    
    const endNodes = workflow.nodes.filter((node) => node.type === NodeType.END)
    if (endNodes.length === 0) {
      errors.push("Workflow must have an End node")
    }

    
    if (startNodes.length > 0) {
      const startNodeConnected = workflow.connections.some((conn) => conn.sourceId === startNodes[0].id)
      if (!startNodeConnected) {
        errors.push("Start node must connect to at least one node")
      }
    }

    
    if (endNodes.length > 0) {
      const endNodeHasInput = workflow.connections.some((conn) => conn.targetId === endNodes[0].id)
      if (!endNodeHasInput) {
        errors.push("End node must have at least one input connection")
      }
    }

    
    workflow.nodes.forEach((node) => {
      if (node.type !== NodeType.START && node.type !== NodeType.END) {
        const hasInput = workflow.connections.some((conn) => conn.targetId === node.id)
        const hasOutput = workflow.connections.some((conn) => conn.sourceId === node.id)

        if (!hasInput && !hasOutput) {
          errors.push(`Node "${node.title}" (${node.id}) is disconnected`)
        }
      }
    })

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

