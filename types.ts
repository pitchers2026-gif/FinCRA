
export type NodeType = 'CONDITION' | 'OPERATOR' | 'ACTION';

export interface Node {
  id: string;
  type: NodeType;
  title: string;
  description: string;
  x: number;
  y: number;
  icon: string;
  status?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'solid' | 'dashed';
}

export interface DataField {
  name: string;
  type: string;
  source: string;
  description: string;
}

export interface SimulationStep {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'completed';
}
