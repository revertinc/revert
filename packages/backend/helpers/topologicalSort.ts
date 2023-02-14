interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  neighbors: string[];
}
interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
}
let visited: any = {};
const getNeighbors = (
  node: WorkflowNode,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] => {
  const targetNodeIds = edges
    .filter((e) => e.source === node.id)
    .map((e) => e.target);
  return nodes.filter((n) => targetNodeIds.includes(n.id));
};

const dfs = (
  rootNode: WorkflowNode,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  orderedNodes: WorkflowNode[]
) => {
  visited[rootNode.id] = true;
  let neighbors = getNeighbors(rootNode, nodes, edges);
  rootNode.neighbors = neighbors?.map((n) => n.id);
  for (let j = 0; j < neighbors.length; j++) {
    if (!visited[neighbors[j].id]) {
      dfs(neighbors[j], nodes, edges, orderedNodes);
    }
  }
  orderedNodes.push(rootNode);
};
export const topologicalSort = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
) => {
  visited = {};
  const orderedNodes: WorkflowNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (!visited[node.id]) {
      dfs(node, nodes, edges, orderedNodes);
    }
  }
  return orderedNodes.reverse();
};
