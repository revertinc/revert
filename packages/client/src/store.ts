import create from "zustand";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from "react-flow-renderer";

const initialNodes = [];

const initialEdges = [];

type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: any;
  selectedNodes: Node[];
  selectedEdges: Edge[];
  updateNodeData: any;
  initGraph: any;
  isMoving: boolean;
  setIsMoving: (isMoving: boolean) => void;
  setSelection: (nodes: Node[], edges: Edge[]) => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFState>((set, get) => ({
  isMoving: false,
  setIsMoving: (isMoving: boolean) => {
    set({
      isMoving: isMoving,
    });
  },
  selectedNodes: [],
  selectedEdges: [],
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (newNode: Node) => {
    set((state) => {
      const newNodes = state.nodes.concat(newNode);
      return {
        ...state,
        nodes: newNodes,
        selectedNodes: [newNode],
      };
    });
  },
  initGraph: (nodes: Node[], edges: Edge[]) => {
    set(() => {
      nodes.forEach((n) =>
        useNodeExecutionStore.getState().setSeen(n.id, true)
      );
      return {
        selectedNodes: [],
        selectedEdges: [],
        nodes: nodes,
        edges: edges,
      };
    });
  },
  setSelection: (nodes: Node[], edges: Edge[]) => {
    set({
      selectedNodes: nodes,
      selectedEdges: edges,
    });
  },
  updateNodeData: (nodeId: string, data: any) => {
    set((state) => {
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node) return state;
      const others = state.nodes.filter((n) => n.id !== nodeId);
      node.data = { ...node.data, ...data };
      return {
        ...state,
        nodes: [...others, node],
      };
    });
  },
}));

type AppState = {
  workspaceId?: string;
  workspaceData?: any;
  currentUser: any;
  currentWorkflowId?: string;
  currentWorkflowName?: string;
  setWorkspaceId: any;
  setCurrentUser: any;
  setCurrentWorkflowId: any;
  setCurrentWorkflowName: any;
  setWorkspaceData: any;
  currentWorkflowData?: any;
  setCurrentWorkflowData: any;
};

export const useAppStore = create<AppState>((set) => ({
  currentWorkflowData: undefined,
  currentWorkflowId: undefined,
  currentUser: null,
  workspaceId: undefined,
  currentWorkflowName: undefined,
  setCurrentWorkflowData: (data: any) =>
    set((state) => ({
      ...state,
      currentWorkflowData: data,
    })),
  setCurrentWorkflowName: (workflowName: string) =>
    set((state) => ({
      ...state,
      currentWorkflowName: workflowName,
    })),
  setCurrentWorkflowId: (workflowId) =>
    set((state) => ({
      ...state,
      currentWorkflowId: workflowId,
    })),

  setCurrentUser: (user) =>
    set((state) => ({
      ...state,
      currentUser: user,
    })),

  setWorkspaceId: (workspaceId) =>
    set((state) => ({
      ...state,
      workspaceId,
    })),
  setWorkspaceData: (workspaceData) =>
    set((state) => ({
      ...state,
      workspaceData,
    })),
}));

type NodeExecutionState = {
  data: any;
  setData: (nodeId: string, data: { logs: any; response: any }) => void;
  seenMap: any;
  setSeen: (nodeId: string, value: boolean) => void;
};

export const useNodeExecutionStore = create<NodeExecutionState>((set) => ({
  data: {},
  seenMap: {},
  setData: (nodeId, data) =>
    set((state) => ({
      ...state,
      data: { ...state.data, [nodeId]: data },
    })),
  setSeen: (nodeId, value) =>
    set((state) => ({
      ...state,
      seenMap: { ...state.seenMap, [nodeId]: value },
    })),
}));

export default useStore;
