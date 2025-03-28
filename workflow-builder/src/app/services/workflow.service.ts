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

  // Use signals for reactive state management
  private workflowSignal = signal<Workflow>({
    nodes: [],
    connections: [],
  })

  // Computed values derived from the workflow signal
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
    const currentWorkflow = this.workflowSignal()
    // Check if connection already exists
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

    // Check if there's a start node
    const startNodes = workflow.nodes.filter((node) => node.type === NodeType.START)
    if (startNodes.length === 0) {
      errors.push("Workflow must have a Start node")
    }

    // Check if there's an end node
    const endNodes = workflow.nodes.filter((node) => node.type === NodeType.END)
    if (endNodes.length === 0) {
      errors.push("Workflow must have an End node")
    }

    // Check if start node is connected
    if (startNodes.length > 0) {
      const startNodeConnected = workflow.connections.some((conn) => conn.sourceId === startNodes[0].id)
      if (!startNodeConnected) {
        errors.push("Start node must connect to at least one node")
      }
    }

    // Check if end node has input
    if (endNodes.length > 0) {
      const endNodeHasInput = workflow.connections.some((conn) => conn.targetId === endNodes[0].id)
      if (!endNodeHasInput) {
        errors.push("End node must have at least one input connection")
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

