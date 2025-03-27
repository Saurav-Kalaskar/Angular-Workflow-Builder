export class NodeComponent {
  id: string;
  title: string;
  type: string;
  inputPort: boolean;
  outputPort: boolean;

  constructor(id: string, title: string, type: string) {
    this.id = id;
    this.title = title;
    this.type = type;
    this.inputPort = true; // Assuming all nodes have an input port
    this.outputPort = true; // Assuming all nodes have an output port
  }
}