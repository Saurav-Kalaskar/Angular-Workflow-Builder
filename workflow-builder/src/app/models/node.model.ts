export enum NodeType {
    START = 'start',
    ACTION_1 = 'action_1',
    ACTION_2 = 'action_2',
    END = 'end'
  }
  
  export interface NodeConfig {
    id: string;
    type: NodeType;
    title: string;
    x: number;
    y: number;
    params?: { [key: string]: any };
  }
  
  export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
  }
  
  export interface Workflow {
    nodes: NodeConfig[];
    connections: Connection[];
  }
  
  export interface NodeTypeInfo {
    type: NodeType;
    title: string;
    color: string;
  }
  
  export interface ValidationResult {
    valid: boolean;
    errors: string[];
  }