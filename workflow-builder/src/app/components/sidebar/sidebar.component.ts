export class SidebarComponent {
  nodeTypes = [
    { id: 1, title: 'Start', type: 'start' },
    { id: 2, title: 'Action 1', type: 'action1' },
    { id: 3, title: 'Action 2', type: 'action2' },
    { id: 4, title: 'End', type: 'end' }
  ];

  constructor() {}

  onDragStart(event: DragEvent, nodeType: any) {
    event.dataTransfer?.setData('nodeType', JSON.stringify(nodeType));
  }
}