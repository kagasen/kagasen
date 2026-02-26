'use client';

import React from 'react';
import { Line } from 'react-konva';
import { Edge as EdgeType, useCanvasStore } from '@/store/useCanvasStore';

interface Props {
  edge: EdgeType;
}

export function EdgeLine({ edge }: Props) {
  const { nodes } = useCanvasStore();
  const sourceNode = nodes.find(n => n.id === edge.sourceId);
  const targetNode = nodes.find(n => n.id === edge.targetId);

  if (!sourceNode || !targetNode) return null;

  // Calculate center points
  const startX = sourceNode.x + sourceNode.width / 2;
  const startY = sourceNode.y + sourceNode.height / 2;
  const endX = targetNode.x + targetNode.width / 2;
  const endY = targetNode.y + targetNode.height / 2;

  return (
    <Line
      points={[startX, startY, endX, endY]}
      stroke="#94a3b8"
      strokeWidth={3}
      dash={[10, 5]}
    />
  );
}
