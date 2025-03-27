export interface Node {
  id: string;
  title: string;
  type: 'Start' | 'Action1' | 'Action2' | 'End';
  inputPort: boolean;
  outputPort: boolean;
}