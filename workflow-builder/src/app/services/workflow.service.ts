export class WorkflowService {
    private workflows: any[] = [];

    constructor() {}

    saveWorkflow(workflow: any): void {
        this.workflows.push(workflow);
        localStorage.setItem('workflows', JSON.stringify(this.workflows));
    }

    loadWorkflows(): any[] {
        const savedWorkflows = localStorage.getItem('workflows');
        if (savedWorkflows) {
            this.workflows = JSON.parse(savedWorkflows);
        }
        return this.workflows;
    }

    validateWorkflow(workflow: any): boolean {
        const startNode = workflow.nodes.find((node: any) => node.type === 'Start');
        const endNode = workflow.nodes.find((node: any) => node.type === 'End');
        return startNode && endNode && startNode.connections.length > 0 && endNode.connections.length > 0;
    }
}