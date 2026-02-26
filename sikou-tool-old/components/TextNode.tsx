'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Group, Text, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';
import { TextNode as TextNodeType, useCanvasStore } from '@/store/useCanvasStore';

export function TextNode({ node, isSelected }: { node: TextNodeType, isSelected: boolean }) {
  const { updateText, setSelectedNodes, removeText } = useCanvasStore();
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

  const handleTransformEnd = (e: any) => {
    const nodeShape = shapeRef.current;
    const scaleX = nodeShape.scaleX();
    const scaleY = nodeShape.scaleY();

    nodeShape.scaleX(1);
    nodeShape.scaleY(1);

    updateText(node.id, {
      x: nodeShape.x(),
      y: nodeShape.y(),
      width: Math.max(50, node.width * scaleX),
      fontSize: Math.max(12, node.fontSize * scaleY),
    });
  };

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
        onDblClick={(e) => { e.cancelBubble = true; setIsEditing(true); }}
        onDragEnd={(e) => updateText(node.id, { x: e.target.x(), y: e.target.y() })}
        onTransformEnd={handleTransformEnd}
      >
        {!isEditing ? (
          <Text
            text={node.text || 'ダブルクリックでテキスト入力'}
            fontSize={node.fontSize}
            fontFamily="sans-serif"
            fill="#1e293b"
            width={Math.max(node.width, 200)}
            padding={10}
          />
        ) : (
          <Html divProps={{ style: { position: 'absolute', top: 0, left: 0 } }}>
            <textarea
              ref={textareaRef}
              autoFocus
              defaultValue={text}
              onBlur={() => {
                setIsEditing(false);
                if (textareaRef.current) {
                  const newText = textareaRef.current.value;
                  setText(newText);
                  updateText(node.id, { text: newText });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  if (textareaRef.current) {
                    const newText = textareaRef.current.value;
                    setText(newText);
                    updateText(node.id, { text: newText });
                  }
                }
              }}
              className="bg-white/80 backdrop-blur-sm border border-blue-400 outline-none resize-none text-slate-800 rounded-md shadow-sm"
              style={{ fontSize: `${node.fontSize}px`, width: `${Math.max(node.width, 200)}px`, minHeight: '50px', padding: '10px' }}
              placeholder="テキストを入力..."
            />
          </Html>
        )}
        {isSelected && !isEditing && (
          <Html divProps={{ style: { position: 'absolute', top: -15, left: Math.max(node.width, 200) - 15 } }}>
            <button onClick={(e) => { e.stopPropagation(); removeText(node.id); }} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 text-lg z-50">×</button>
          </Html>
        )}
      </Group>
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 12) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
}
