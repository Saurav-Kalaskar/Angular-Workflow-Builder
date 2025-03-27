export interface Workflow {
  nodes: Node[];
  connections: Connection[];
}

export interface Node {
  id: string;
  title: string;
  type: string;
  position: { x: number; y: number };
  inputPort: boolean;
  outputPort: boolean;
}

export interface Connection {
  sourceId: string;
  targetId: string;
}