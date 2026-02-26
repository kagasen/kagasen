'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Group, Rect, Text, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';
import { StickyNode as StickyNodeType, useCanvasStore, StickyColor } from '@/store/useCanvasStore';

interface Props {
  node: StickyNodeType;
  isSelected: boolean;
}

const colorMap = {
  yellow: '#fef08a',
  blue: '#bfdbfe',
  green: '#bbf7d0',
  pink: '#fbcfe8',
  purple: '#e9d5ff',
};

const availableColors: StickyColor[] = ['yellow', 'blue', 'green', 'pink', 'purple'];

export function StickyNode({ node, isSelected }: Props) {
  const { updateNode, setSelectedNodes, removeNode, addConnectedNode } = useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(textareaRef.current?.value.length || 0, textareaRef.current?.value.length || 0);
      }, 50);
    }
  }, [isEditing]);

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

  const handleDragEnd = (e: any) => {
    updateNode(node.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    setSelectedNodes([node.id]);
  };

  const handleDblClick = (e: any) => {
    e.cancelBubble = true;
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textareaRef.current) {
      const newText = textareaRef.current.value;
      setText(newText);
      updateNode(node.id, { text: newText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleBlur();
    }
  };

  const handleTransformEnd = (e: any) => {
    const nodeShape = shapeRef.current;
    const scaleX = nodeShape.scaleX();
    const scaleY = nodeShape.scaleY();

    nodeShape.scaleX(1);
    nodeShape.scaleY(1);

    updateNode(node.id, {
      x: nodeShape.x(),
      y: nodeShape.y(),
      width: Math.max(50, node.width * scaleX),
      height: Math.max(50, node.height * scaleY),
    });
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
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDblClick={handleDblClick}
        onTransformEnd={handleTransformEnd}
      >
        <Rect
          width={node.width}
          height={node.height}
          fill={colorMap[node.color]}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.1}
          shadowOffset={{ x: 2, y: 2 }}
          cornerRadius={4}
          stroke={isSelected ? '#3b82f6' : 'transparent'}
          strokeWidth={isSelected ? 2 : 0}
        />

        {!isEditing ? (
          <Text
            text={node.text || 'ダブルクリックで入力'}
            width={node.width - 24}
            height={node.height - 24}
            x={12}
            y={12}
            fontSize={16}
            fontFamily="sans-serif"
            fill={node.text ? '#1e293b' : '#94a3b8'}
            wrap="word"
            align="center"
            verticalAlign="middle"
          />
        ) : (
          <Group x={12} y={12}>
            <Html>
              <textarea
                ref={textareaRef}
                autoFocus
                defaultValue={text}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none outline-none resize-none text-center text-slate-800 text-base p-1"
                style={{ width: `${node.width - 24}px`, height: `${node.height - 24}px`, fontFamily: 'sans-serif' }}
                placeholder="テキストを入力..."
              />
            </Html>
          </Group>
        )}

        {/* Controls when selected */}
        {isSelected && (
          <React.Fragment>
            {/* Connect Button (Top Left, completely outside) */}
            <Group x={0} y={-40}>
              <Html>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addConnectedNode(node.id);
                  }}
                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full shadow-md hover:bg-blue-600 transition-colors whitespace-nowrap"
                >
                  繋げる →
                </button>
              </Html>
            </Group>

            {/* Delete Button (Top Right) */}
            <Group x={node.width + 15} y={-15}>
              <Html>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNode(node.id);
                  }}
                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors text-lg"
                  style={{ transform: 'translate(-50%, -50%)' }}
                  title="削除"
                >
                  ×
                </button>
              </Html>
            </Group>

            {/* Color Picker (Bottom Center, outside) */}
            <Group x={node.width / 2} y={node.height + 15}>
              <Html>
                <div
                  className="flex gap-1 bg-white p-1.5 rounded-full shadow-md border border-slate-200"
                  style={{ transform: 'translate(-50%, 0)' }}
                >
                  {availableColors.map(color => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateNode(node.id, { color });
                      }}
                      className={`w-6 h-6 rounded-full border ${node.color === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: colorMap[color] }}
                      title={`${color}に変更`}
                    />
                  ))}
                </div>
              </Html>
            </Group>
          </React.Fragment>
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
