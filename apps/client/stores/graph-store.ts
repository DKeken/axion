import { create } from "zustand";
import {
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
} from "reactflow";
import { NodeType, EdgeType, type GraphData } from "@axion/contracts";
import { NodeFactory } from "./node-factory";
import {
  graphDataToFlow,
  flowToGraphData,
  type GraphFlowNodeData,
  type GraphFlowEdgeData,
} from "@/utils/graph-converter";

interface GraphState {
  nodes: Node<GraphFlowNodeData>[];
  edges: Edge<GraphFlowEdgeData>[];
  selectedNodeId: string | null;

  // Actions
  setGraphData: (data: GraphData) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, data: Partial<GraphFlowNodeData>) => void;
  deleteNode: (id: string) => void;
  getGraphData: () => GraphData;
  reset: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  setGraphData: (data: GraphData) => {
    const { nodes, edges } = graphDataToFlow(data);
    set({ nodes, edges });
  },

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
    const newEdge = {
      ...connection,
      id: `${connection.source}-${connection.target}`,
      type: "smoothstep",
      data: {
        edgeType: EdgeType.EDGE_TYPE_HTTP,
      },
      animated: true,
    };
    set({
      edges: addEdge(newEdge, get().edges),
    });
  },

  addNode: (type: NodeType, position: { x: number; y: number }) => {
    const newNode = NodeFactory.createNode(type, position);
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  updateNodeData: (id: string, data: Partial<GraphFlowNodeData>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
  },

  deleteNode: (id: string) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  getGraphData: () => {
    const { nodes, edges } = get();
    return flowToGraphData(nodes, edges);
  },

  reset: () => {
    set({ nodes: [], edges: [], selectedNodeId: null });
  },
}));
