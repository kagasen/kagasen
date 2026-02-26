'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Image as KonvaImage, Transformer, Group } from 'react-konva';
import { Html } from 'react-konva-utils';
import { useCanvasStore, ImageNode as ImageNodeType } from '@/store/useCanvasStore';

export function ImageNode({ node, isSelected }: { node: ImageNodeType, isSelected: boolean }) {
  const { updateImage, setSelectedNodes, removeImage } = useCanvasStore();
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = node.src;
    img.onload = () => setImage(img);
  }, [node.src]);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const lastPos = useRef({ x: node.x, y: node.y });

  const handleDragStart = (e: any) => {
    lastPos.current = { x: e.target.x(), y: e.target.y() };
  };

  const handleDragMove = (e: any) => {
    if (isSelected) {
      const dx = e.target.x() - lastPos.current.x;
      const dy = e.target.y() - lastPos.current.y;
      useCanvasStore.getState().moveSelectedNodes(dx, dy, node.id);
      lastPos.current = { x: e.target.x(), y: e.target.y() };
    }
  };

  return (
    <React.Fragment>
      <Group
        id={node.id}
        ref={shapeRef}
        x={node.x}
        y={node.y}
        draggable
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onClick={(e) => { e.cancelBubble = true; setSelectedNodes([node.id]); }}
        onDragEnd={(e) => updateImage(node.id, { x: e.target.x(), y: e.target.y() })}
        onTransformEnd={(e) => {
          const n = shapeRef.current;
          const scaleX = n.scaleX();
          const scaleY = n.scaleY();
          n.scaleX(1);
          n.scaleY(1);
          updateImage(node.id, {
            x: n.x(),
            y: n.y(),
            width: Math.max(20, node.width * scaleX),
            height: Math.max(20, node.height * scaleY),
          });
        }}
      >
        <KonvaImage
          image={image || undefined}
          width={node.width}
          height={node.height}
        />
        {isSelected && (
          <Html divProps={{ style: { position: 'absolute', top: -15, left: node.width - 15 } }}>
            <button onClick={(e) => { e.stopPropagation(); removeImage(node.id); }} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 text-lg z-50">×</button>
          </Html>
        )}
      </Group>
      {isSelected && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox.width < 20 || newBox.height < 20 ? oldBox : newBox} />}
    </React.Fragment>
  );
}
