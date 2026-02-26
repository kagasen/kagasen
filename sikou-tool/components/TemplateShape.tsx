'use client';

import React, { useRef, useEffect } from 'react';
import { Group, Rect, Circle, Line, Text, Transformer, Arc } from 'react-konva';
import { Html } from 'react-konva-utils';
import { TemplateShape as TemplateShapeType, useCanvasStore } from '@/store/useCanvasStore';

interface Props {
  template: TemplateShapeType;
}

export function TemplateShape({ template }: Props) {
  const { type, x, y, width, height, id } = template;
  const { updateTemplate, selectedTemplateIds, setSelectedTemplates, removeTemplate } = useCanvasStore();
  const isSelected = selectedTemplateIds.includes(id);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const lastPos = useRef({ x, y });

  const handleDragStart = (e: any) => {
    lastPos.current = { x: e.target.x(), y: e.target.y() };
  };

  const handleDragMove = (e: any) => {
    if (isSelected) {
      const dx = e.target.x() - lastPos.current.x;
      const dy = e.target.y() - lastPos.current.y;
      useCanvasStore.getState().moveSelectedNodes(dx, dy, id);
      lastPos.current = { x: e.target.x(), y: e.target.y() };
    }
  };

  const handleDragEnd = (e: any) => {
    updateTemplate(id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateTemplate(id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(50, node.width() * scaleX),
      height: Math.max(50, node.height() * scaleY),
    });
  };

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    setSelectedTemplates([id]);
  };

  const renderShape = () => {
    switch (type) {
      case 'x':
        return (
          <Group>
            <Rect width={width} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />
            <Line points={[0, 0, width, height]} stroke="#94a3b8" strokeWidth={4} />
            <Line points={[width, 0, 0, height]} stroke="#94a3b8" strokeWidth={4} />
          </Group>
        );
      case 'y':
        return (
          <Group>
            <Rect width={width} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />
            <Line points={[0, 0, width / 2, height / 2]} stroke="#94a3b8" strokeWidth={4} />
            <Line points={[width, 0, width / 2, height / 2]} stroke="#94a3b8" strokeWidth={4} />
            <Line points={[width / 2, height / 2, width / 2, height]} stroke="#94a3b8" strokeWidth={4} />
          </Group>
        );
      case 'axis':
        return (
          <Group>
            <Line points={[width / 2, 0, width / 2, height]} stroke="#94a3b8" strokeWidth={4} />
            <Line points={[0, height / 2, width, height / 2]} stroke="#94a3b8" strokeWidth={4} />
            <Line points={[width / 2 - 10, 10, width / 2, 0, width / 2 + 10, 10]} stroke="#94a3b8" strokeWidth={4} />
            <Line points={[width - 10, height / 2 - 10, width, height / 2, width - 10, height / 2 + 10]} stroke="#94a3b8" strokeWidth={4} />
          </Group>
        );
      case 'venn':
        return (
          <Group>
            <Circle x={width / 3} y={height / 2} radius={Math.min(width, height) / 2.5} stroke="#cbd5e1" strokeWidth={4} fill="rgba(203, 213, 225, 0.1)" />
            <Circle x={(width / 3) * 2} y={height / 2} radius={Math.min(width, height) / 2.5} stroke="#cbd5e1" strokeWidth={4} fill="rgba(203, 213, 225, 0.1)" />
          </Group>
        );

      case 'pmi':
        return (
          <Group>
            <Rect x={0} y={0} width={width / 3} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />
            <Rect x={width / 3} y={0} width={width / 3} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />
            <Rect x={(width / 3) * 2} y={0} width={width / 3} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />

            <Text x={0} y={20} width={width / 3} text="Plus (良い点)" fontSize={Math.max(16, width * 0.025)} fill="#64748b" align="center" />
            <Text x={width / 3} y={20} width={width / 3} text="Minus (悪い点)" fontSize={Math.max(16, width * 0.025)} fill="#64748b" align="center" />
            <Text x={(width / 3) * 2} y={20} width={width / 3} text="Interesting (興味深い点)" fontSize={Math.max(16, width * 0.025)} fill="#64748b" align="center" />
          </Group>
        );
      case 'kwl':
        return (
          <Group>
            <Rect x={0} y={0} width={width / 3} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />
            <Rect x={width / 3} y={0} width={width / 3} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />
            <Rect x={(width / 3) * 2} y={0} width={width / 3} height={height} stroke="#cbd5e1" strokeWidth={2} fill="rgba(203, 213, 225, 0.05)" />

            <Text x={0} y={20} width={width / 3} text="K (知っていること)" fontSize={Math.max(16, width * 0.025)} fill="#64748b" align="center" />
            <Text x={width / 3} y={20} width={width / 3} text="W (知りたいこと)" fontSize={Math.max(16, width * 0.025)} fill="#64748b" align="center" />
            <Text x={(width / 3) * 2} y={20} width={width / 3} text="L (わかったこと)" fontSize={Math.max(16, width * 0.025)} fill="#64748b" align="center" />
          </Group>
        );

      case 'jellyfish': {
        const topRectW = width * 0.5;
        const topRectH = topRectW / 2 + height * 0.05;
        const topRectX = width * 0.25;
        const topRectY = height * 0.05;
        const bottomY = topRectY + topRectH;

        const circleY = height * 0.85;
        const circleR = width * 0.08;

        const startXs = [
          width * 0.25,
          width * 0.375,
          width * 0.5,
          width * 0.625,
          width * 0.75
        ];

        const endXs = [
          width * 0.1,
          width * 0.3,
          width * 0.5,
          width * 0.7,
          width * 0.9
        ];

        return (
          <Group>
            {/* Top Shape */}
            <Rect
              x={topRectX}
              y={topRectY}
              width={topRectW}
              height={topRectH}
              cornerRadius={[topRectW / 2, topRectW / 2, 0, 0]}
              stroke="#cbd5e1"
              strokeWidth={4}
              fill="rgba(203, 213, 225, 0.1)"
            />

            {/* Legs and Circles */}
            {[0, 1, 2, 3, 4].map(i => {
              const x1 = startXs[i];
              const y1 = bottomY;
              const x2 = endXs[i];
              const y2 = circleY;
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const lineEndX = x2 - circleR * Math.cos(angle);
              const lineEndY = y2 - circleR * Math.sin(angle);

              return (
                <React.Fragment key={i}>
                  <Line
                    points={[x1, y1, lineEndX, lineEndY]}
                    stroke="#cbd5e1"
                    strokeWidth={4}
                  />
                  <Circle
                    x={x2}
                    y={y2}
                    radius={circleR}
                    stroke="#cbd5e1"
                    strokeWidth={4}
                    fill="rgba(203, 213, 225, 0.05)"
                  />
                </React.Fragment>
              );
            })}
          </Group>
        );
      }
      case 'fishbone': {
        const headW = width * 0.25;
        const headH = height * 0.5;
        const headX = width * 0.75;
        const headY = height * 0.25;

        const bone1X = width * 0.35;
        const bone2X = width * 0.7;
        const boneDx = width * 0.15;
        const boneDy = height * 0.4;

        const bone1CornerX = bone1X - boneDx;
        const bone2CornerX = bone2X - boneDx;
        const bone1EndX = 0;
        const bone2EndX = bone1X;

        return (
          <Group>
            {/* Backbone */}
            <Line points={[0, height / 2, headX, height / 2]} stroke="#cbd5e1" strokeWidth={4} />

            {/* Head */}
            <Rect
              x={headX}
              y={headY}
              width={headW}
              height={headH}
              cornerRadius={[0, headH / 2, headH / 2, 0]}
              stroke="#cbd5e1"
              strokeWidth={4}
              fill="rgba(203, 213, 225, 0.1)"
            />

            {/* Top Bone 1 */}
            <Line points={[bone1X, height / 2, bone1CornerX, height / 2 - boneDy, bone1EndX, height / 2 - boneDy]} stroke="#cbd5e1" strokeWidth={4} />
            {/* Bottom Bone 1 */}
            <Line points={[bone1X, height / 2, bone1CornerX, height / 2 + boneDy, bone1EndX, height / 2 + boneDy]} stroke="#cbd5e1" strokeWidth={4} />

            {/* Top Bone 2 */}
            <Line points={[bone2X, height / 2, bone2CornerX, height / 2 - boneDy, bone2EndX, height / 2 - boneDy]} stroke="#cbd5e1" strokeWidth={4} />
            {/* Bottom Bone 2 */}
            <Line points={[bone2X, height / 2, bone2CornerX, height / 2 + boneDy, bone2EndX, height / 2 + boneDy]} stroke="#cbd5e1" strokeWidth={4} />
          </Group>
        );
      }
      case 'candy':
        return (
          <Group>
            <Circle x={width / 2} y={height / 2} radius={Math.min(width, height) * 0.3} stroke="#cbd5e1" strokeWidth={4} fill="rgba(203, 213, 225, 0.1)" />
            <Line points={[width / 2 - Math.min(width, height) * 0.3, height / 2, 0, height * 0.2, 0, height * 0.8]} closed stroke="#cbd5e1" strokeWidth={4} fill="rgba(203, 213, 225, 0.05)" />
            <Line points={[width / 2 + Math.min(width, height) * 0.3, height / 2, width, height * 0.2, width, height * 0.8]} closed stroke="#cbd5e1" strokeWidth={4} fill="rgba(203, 213, 225, 0.05)" />
          </Group>
        );
      case 'pyramid':
        return (
          <Group>
            <Line points={[width / 2, 0, width, height, 0, height]} closed stroke="#cbd5e1" strokeWidth={4} fill="rgba(203, 213, 225, 0.1)" />
            <Line points={[width * 0.33, height * 0.33, width * 0.67, height * 0.33]} stroke="#cbd5e1" strokeWidth={4} />
            <Line points={[width * 0.16, height * 0.66, width * 0.84, height * 0.66]} stroke="#cbd5e1" strokeWidth={4} />
          </Group>
        );
      default:
        return (
          <Rect width={width} height={height} stroke="#cbd5e1" strokeWidth={2} dash={[10, 5]} />
        );
    }
  };

  return (
    <React.Fragment>
      <Group
        id={id}
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        draggable
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onTransformEnd={handleTransformEnd}
      >
        {/* Invisible rect for bounding box to make selection easier */}
        <Rect width={width} height={height} fill="transparent" />
        {renderShape()}
        {isSelected && (
          <Html divProps={{ style: { position: 'absolute', top: -20, left: width - 20 } }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTemplate(id);
              }}
              className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors text-2xl z-50 hover:scale-110"
              title="削除"
            >
              ×
            </button>
          </Html>
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
}
