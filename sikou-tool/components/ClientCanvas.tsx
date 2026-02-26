'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line, Transformer } from 'react-konva';
import { useCanvasStore } from '@/store/useCanvasStore';
import { StickyNode } from './StickyNode';
import { TemplateShape } from './TemplateShape';
import { EdgeLine } from './EdgeLine';
import { ImageNode } from './ImageNode';
import { TextNode } from './TextNode';

export default function ClientCanvas() {
  const {
    tool,
    nodes, images, texts, templates, edges,
    addNode, setCanvasTransform, canvasScale, canvasPosition,
    setSelectedNodes, selectedNodeIds, selectedTemplateIds, setMultiSelection
  } = useCanvasStore();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const trRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (trRef.current && layerRef.current) {
      const allSelectedIds = [...selectedNodeIds, ...selectedTemplateIds];
      if (allSelectedIds.length > 1) {
        const selectedElements = allSelectedIds.map(id => layerRef.current.findOne('#' + id)).filter(Boolean);
        trRef.current.nodes(selectedElements);
        trRef.current.getLayer().batchDraw();
      } else {
        trRef.current.nodes([]);
      }
    }
  }, [selectedNodeIds, selectedTemplateIds]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Limit scale
    if (newScale < 0.1 || newScale > 5) return;

    setCanvasTransform(newScale, {
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    });
  };

  const handleDragEnd = (e: any) => {
    if (e.target === e.target.getStage()) {
      setCanvasTransform(canvasScale, { x: e.target.x(), y: e.target.y() });
    }
  };

  const handleStageClick = (e: any) => {
    // If clicked on empty space, deselect all
    if (e.target === e.target.getStage() && !isSelecting) {
      setMultiSelection([], []);
    }
  };

  const getRelativePointerPosition = (stage: any) => {
    const pointerPosition = stage.getPointerPosition();
    return {
      x: (pointerPosition.x - canvasPosition.x) / canvasScale,
      y: (pointerPosition.y - canvasPosition.y) / canvasScale,
    };
  };

  const handleMouseDown = (e: any) => {
    if (tool === 'lasso' && e.target === e.target.getStage()) {
      setIsSelecting(true);
      const pos = getRelativePointerPosition(e.target.getStage());
      setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: any) => {
    if (isSelecting && selectionBox) {
      const pos = getRelativePointerPosition(e.target.getStage());
      setSelectionBox({
        ...selectionBox,
        width: pos.x - selectionBox.x,
        height: pos.y - selectionBox.y,
      });
    }
  };

  const handleMouseUp = (e: any) => {
    if (isSelecting && selectionBox) {
      setIsSelecting(false);

      const box = {
        x: Math.min(selectionBox.x, selectionBox.x + selectionBox.width),
        y: Math.min(selectionBox.y, selectionBox.y + selectionBox.height),
        width: Math.abs(selectionBox.width),
        height: Math.abs(selectionBox.height),
      };

      if (box.width < 5 || box.height < 5) {
        setSelectionBox(null);
        return;
      }

      const isIntersecting = (item: any) => {
        return !(
          item.x > box.x + box.width ||
          item.x + item.width < box.x ||
          item.y > box.y + box.height ||
          item.y + item.height < box.y
        );
      };

      const selectedIds: string[] = [];
      const templateIds: string[] = [];

      nodes.forEach(node => { if (isIntersecting(node)) selectedIds.push(node.id); });
      images.forEach(img => { if (isIntersecting(img)) selectedIds.push(img.id); });
      texts.forEach(text => { if (isIntersecting(text)) selectedIds.push(text.id); });
      templates.forEach(template => { if (isIntersecting(template)) templateIds.push(template.id); });

      setMultiSelection(selectedIds, templateIds);
      setSelectionBox(null);
    }
  };

  const handleStageDblClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const x = (pointerPosition.x - canvasPosition.x) / canvasScale;
      const y = (pointerPosition.y - canvasPosition.y) / canvasScale;
      addNode(x, y);
    }
  };

  if (windowSize.width === 0) return null; // Avoid hydration mismatch

  return (
    <div className="w-full h-full bg-slate-50 overflow-hidden" style={{ cursor: 'grab' }}>
      <Stage
        width={windowSize.width}
        height={windowSize.height}
        onWheel={handleWheel}
        draggable={tool === 'pointer'}
        x={canvasPosition.x}
        y={canvasPosition.y}
        scaleX={canvasScale}
        scaleY={canvasScale}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onDblClick={handleStageDblClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {/* Templates (Background) */}
          {templates.map(template => (
            <TemplateShape key={template.id} template={template} />
          ))}

          {/* Images */}
          {images.map(img => (
            <ImageNode key={img.id} node={img} isSelected={selectedNodeIds.includes(img.id)} />
          ))}

          {/* Texts */}
          {texts.map(text => (
            <TextNode key={text.id} node={text} isSelected={selectedNodeIds.includes(text.id)} />
          ))}

          {/* Edges */}
          {edges.map(edge => (
            <EdgeLine key={edge.id} edge={edge} />
          ))}

          {/* Sticky Notes */}
          {nodes.map(node => (
            <StickyNode key={node.id} node={node} isSelected={selectedNodeIds.includes(node.id)} />
          ))}

          {/* Selection Box */}
          {selectionBox && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1 / canvasScale}
            />
          )}

          {/* Multi-selection Transformer */}
          {(selectedNodeIds.length + selectedTemplateIds.length) > 1 && (
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 50 || newBox.height < 50) {
                  return oldBox;
                }
                return newBox;
              }}
              onTransformEnd={(e) => {
                // Update all selected nodes after transform
                const allSelectedIds = [...selectedNodeIds, ...selectedTemplateIds];
                const state = useCanvasStore.getState();

                allSelectedIds.forEach(id => {
                  const konvaNode = layerRef.current.findOne('#' + id);
                  if (konvaNode) {
                    const scaleX = Math.abs(konvaNode.scaleX());
                    const scaleY = Math.abs(konvaNode.scaleY());
                    konvaNode.scaleX(1);
                    konvaNode.scaleY(1);

                    const stateNode = state.nodes.find(n => n.id === id);
                    const stateImage = state.images.find(n => n.id === id);
                    const stateText = state.texts.find(n => n.id === id);
                    const stateTemplate = state.templates.find(n => n.id === id);

                    if (stateNode) {
                      state.updateNode(id, {
                        x: konvaNode.x(),
                        y: konvaNode.y(),
                        width: Math.max(50, stateNode.width * scaleX),
                        height: Math.max(50, stateNode.height * scaleY),
                      });
                    } else if (stateImage) {
                      state.updateImage(id, {
                        x: konvaNode.x(),
                        y: konvaNode.y(),
                        width: Math.max(20, stateImage.width * scaleX),
                        height: Math.max(20, stateImage.height * scaleY),
                      });
                    } else if (stateText) {
                      state.updateText(id, {
                        x: konvaNode.x(),
                        y: konvaNode.y(),
                        width: Math.max(50, stateText.width * scaleX),
                        fontSize: Math.max(12, stateText.fontSize * scaleX),
                      });
                    } else if (stateTemplate) {
                      state.updateTemplate(id, {
                        x: konvaNode.x(),
                        y: konvaNode.y(),
                        width: Math.max(50, stateTemplate.width * scaleX),
                        height: Math.max(50, stateTemplate.height * scaleY),
                      });
                    }
                  }
                });
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
