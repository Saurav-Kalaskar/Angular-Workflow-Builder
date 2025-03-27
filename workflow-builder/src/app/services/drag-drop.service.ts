export class DragDropService {
    private dragSource: any;
    private dropTarget: any;

    constructor() {}

    public startDrag(source: any): void {
        this.dragSource = source;
    }

    public drop(target: any): void {
        this.dropTarget = target;
        // Logic to handle the drop event
    }

    public connectNodes(source: any, target: any): void {
        // Logic to connect nodes visually
    }

    public clearDrag(): void {
        this.dragSource = null;
        this.dropTarget = null;
    }
}