import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type StickyColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface StickyNode {
  id: string;
  x: number;
  y: number;
  text: string;
  color: StickyColor;
  width: number;
  height: number;
}

export interface TemplateShape {
  id: string;
  type: 'venn' | 'x' | 'y' | 'axis' | 'pmi' | 'fishbone' | 'pyramid' | 'jellyfish' | 'candy' | 'kwl';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export interface TextNode {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  width: number;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export type ToolType = 'pointer' | 'lasso';

interface CanvasState {
  tool: ToolType;
  nodes: StickyNode[];
  images: ImageNode[];
  texts: TextNode[];
  templates: TemplateShape[];
  edges: Edge[];
  selectedNodeIds: string[];
  selectedTemplateIds: string[];
  canvasScale: number;
  canvasPosition: { x: number; y: number };
  
  // Actions
  addNode: (x: number, y: number) => void;
  updateNode: (id: string, data: Partial<StickyNode>) => void;
  removeNode: (id: string) => void;
  addConnectedNode: (sourceId: string) => void;

  addImage: (src: string, x: number, y: number, width: number, height: number) => void;
  updateImage: (id: string, data: Partial<ImageNode>) => void;
  removeImage: (id: string) => void;

  addText: (x: number, y: number) => void;
  updateText: (id: string, data: Partial<TextNode>) => void;
  removeText: (id: string) => void;
  
  addTemplate: (type: TemplateShape['type']) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, data: Partial<TemplateShape>) => void;
  
  addEdge: (sourceId: string, targetId: string) => void;
  removeEdge: (id: string) => void;
  
  setSelectedNodes: (ids: string[]) => void;
  setSelectedTemplates: (ids: string[]) => void;
  setMultiSelection: (nodeIds: string[], templateIds: string[]) => void;
  setCanvasTransform: (scale: number, position: { x: number; y: number }) => void;
  setTool: (tool: ToolType) => void;
  moveSelectedNodes: (dx: number, dy: number, excludeId?: string) => void;
  
  resetCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      tool: 'pointer',
      nodes: [],
      images: [],
      texts: [],
      templates: [],
      edges: [],
      selectedNodeIds: [],
      selectedTemplateIds: [],
      canvasScale: 1,
      canvasPosition: { x: 0, y: 0 },

      addNode: (x, y) => set((state) => ({
        nodes: [...state.nodes, {
          id: uuidv4(),
          x,
          y,
          text: '',
          color: 'yellow',
          width: 150,
          height: 150,
        }]
      })),

      updateNode: (id, data) => set((state) => ({
        nodes: state.nodes.map(n => n.id === id ? { ...n, ...data } : n)
      })),

      removeNode: (id) => set((state) => ({
        nodes: state.nodes.filter(n => n.id !== id),
        edges: state.edges.filter(e => e.sourceId !== id && e.targetId !== id),
        selectedNodeIds: state.selectedNodeIds.filter(selectedId => selectedId !== id)
      })),

      addImage: (src, x, y, width, height) => set((state) => ({
        images: [...state.images, { id: uuidv4(), src, x, y, width, height }]
      })),

      updateImage: (id, data) => set((state) => ({
        images: state.images.map(img => img.id === id ? { ...img, ...data } : img)
      })),

      removeImage: (id) => set((state) => ({
        images: state.images.filter(img => img.id !== id),
        selectedNodeIds: state.selectedNodeIds.filter(selectedId => selectedId !== id)
      })),

      addText: (x, y) => set((state) => ({
        texts: [...state.texts, { id: uuidv4(), x, y, text: '', fontSize: 24, width: 200 }]
      })),

      updateText: (id, data) => set((state) => ({
        texts: state.texts.map(t => t.id === id ? { ...t, ...data } : t)
      })),

      removeText: (id) => set((state) => ({
        texts: state.texts.filter(t => t.id !== id),
        selectedNodeIds: state.selectedNodeIds.filter(selectedId => selectedId !== id)
      })),

      addConnectedNode: (sourceId) => set((state) => {
        const sourceNode = state.nodes.find(n => n.id === sourceId);
        if (!sourceNode) return state;
        
        const newNodeId = uuidv4();
        const newNode: StickyNode = {
          id: newNodeId,
          x: sourceNode.x + sourceNode.width + 50,
          y: sourceNode.y,
          text: '',
          color: sourceNode.color,
          width: sourceNode.width,
          height: sourceNode.height,
        };
        
        const newEdge: Edge = {
          id: uuidv4(),
          sourceId: sourceId,
          targetId: newNodeId,
        };
        
        return {
          nodes: [...state.nodes, newNode],
          edges: [...state.edges, newEdge],
          selectedNodeIds: [newNodeId],
        };
      }),

      addTemplate: (type) => set((state) => {
        // Calculate center position based on current canvas transform
        const width = 1200;
        const height = 800;
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        const x = -state.canvasPosition.x / state.canvasScale + (screenWidth / 2) / state.canvasScale - width / 2;
        const y = -state.canvasPosition.y / state.canvasScale + (screenHeight / 2) / state.canvasScale - height / 2;
        
        return {
          templates: [...state.templates, {
            id: uuidv4(),
            type,
            x,
            y,
            width,
            height,
          }]
        };
      }),

      removeTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        selectedTemplateIds: state.selectedTemplateIds.filter(selectedId => selectedId !== id)
      })),

      updateTemplate: (id, data) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...data } : t)
      })),

      addEdge: (sourceId, targetId) => set((state) => ({
        edges: [...state.edges, { id: uuidv4(), sourceId, targetId }]
      })),

      removeEdge: (id) => set((state) => ({
        edges: state.edges.filter(e => e.id !== id)
      })),

      setSelectedNodes: (ids) => set({ selectedNodeIds: ids, selectedTemplateIds: [] }),
      setSelectedTemplates: (ids) => set({ selectedTemplateIds: ids, selectedNodeIds: [] }),
      setMultiSelection: (nodeIds, templateIds) => set({ selectedNodeIds: nodeIds, selectedTemplateIds: templateIds }),

      setCanvasTransform: (scale, position) => set({ canvasScale: scale, canvasPosition: position }),
      setTool: (tool) => set({ tool }),

      moveSelectedNodes: (dx, dy, excludeId) => set((state) => {
        const moveIfSelected = (items: any[]) => items.map(item => 
          (state.selectedNodeIds.includes(item.id) || state.selectedTemplateIds.includes(item.id)) && item.id !== excludeId
            ? { ...item, x: item.x + dx, y: item.y + dy }
            : item
        );
        return {
          nodes: moveIfSelected(state.nodes),
          images: moveIfSelected(state.images),
          texts: moveIfSelected(state.texts),
          templates: moveIfSelected(state.templates),
        };
      }),

      resetCanvas: () => set({
        tool: 'pointer',
        nodes: [],
        images: [],
        texts: [],
        templates: [],
        edges: [],
        selectedNodeIds: [],
        selectedTemplateIds: [],
        canvasScale: 1,
        canvasPosition: { x: 0, y: 0 }
      })
    }),
    {
      name: 'canvas-storage',
      partialize: (state) => ({ 
        nodes: state.nodes, 
        images: state.images,
        texts: state.texts,
        templates: state.templates, 
        edges: state.edges,
        canvasScale: state.canvasScale,
        canvasPosition: state.canvasPosition
      }),
    }
  )
);
