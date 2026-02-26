'use client';

import React, { useState } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  LayoutTemplate, 
  Trash2, 
  Download, 
  Sparkles,
  Type,
  Image as ImageIcon,
  MousePointer2,
  BoxSelect
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

export function Sidebar() {
  const { tool, setTool, addNode, addTemplate, resetCanvas, addImage, addText } = useCanvasStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAddNode = () => {
    addNode(window.innerWidth / 2 - 75, window.innerHeight / 2 - 75);
    toast.success('ふせんを追加しました');
  };

  const handleAddText = () => {
    addText(window.innerWidth / 2 - 100, window.innerHeight / 2 - 25);
    toast.success('テキストを追加しました');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxW = 800;
        const maxH = 800;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w *= ratio;
          h *= ratio;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        addImage(dataUrl, window.innerWidth / 2 - w/2, window.innerHeight / 2 - h/2, w, h);
        toast.success('画像を追加しました');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddTemplate = (type: any) => {
    addTemplate(type);
    toast.success('テンプレートを追加しました');
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const handleExport = () => {
    toast.info('画像書き出し機能は準備中です');
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col p-4 shadow-sm z-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-500" />
          思考ツール
        </h1>
        <p className="text-sm text-slate-500 mt-1">考えを整理しよう</p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">操作モード</h2>
          <div className="flex flex-col gap-2 mb-4">
            <Button
              onClick={() => setTool('pointer')}
              variant={tool === 'pointer' ? 'default' : 'outline'}
              className={`w-full justify-start gap-2 ${tool === 'pointer' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
            >
              <MousePointer2 className="w-4 h-4" />
              選択・移動
            </Button>
            <Button
              onClick={() => setTool('lasso')}
              variant={tool === 'lasso' ? 'default' : 'outline'}
              className={`w-full justify-start gap-2 ${tool === 'lasso' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
            >
              <BoxSelect className="w-4 h-4" />
              囲んで選択
            </Button>
          </div>

          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mt-6">追加ツール</h2>
          <Button 
            onClick={handleAddNode} 
            className="w-full justify-start gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            variant="outline"
          >
            <PlusCircle className="w-4 h-4" />
            ふせんを追加
          </Button>

          <Button 
            onClick={handleAddText} 
            className="w-full justify-start gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            variant="outline"
          >
            <Type className="w-4 h-4" />
            テキストを追加
          </Button>

          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="画像を追加"
            />
            <Button 
              className="w-full justify-start gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 pointer-events-none"
              variant="outline"
            >
              <ImageIcon className="w-4 h-4" />
              画像を追加
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                className="w-full justify-start gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                variant="outline"
              >
                <LayoutTemplate className="w-4 h-4" />
                テンプレート
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 max-h-[60vh] overflow-y-auto">
              <DropdownMenuItem onClick={() => handleAddTemplate('x')}>Xチャート (分類)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('y')}>Yチャート (分類)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('axis')}>座標軸 (順序付け)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('venn')}>ベン図 (比較)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('pmi')}>PMIチャート (分析)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('kwl')}>KWLチャート (振り返り)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('jellyfish')}>クラゲチャート (見通す)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('fishbone')}>フィッシュボーン図 (構造化)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('candy')}>キャンディーチャート (因果関係)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTemplate('pyramid')}>ピラミッドチャート (焦点化)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-4 border-t border-slate-100">
        <Button 
          onClick={handleExport} 
          variant="outline" 
          className="w-full justify-start gap-2"
        >
          <Download className="w-4 h-4" />
          画像として保存
        </Button>
        <Button 
          onClick={handleReset} 
          variant="ghost" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
          すべて消去
        </Button>
      </div>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>キャンバスをすべて消去しますか？</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。本当にキャンバスをリセットしますか？
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={() => {
              resetCanvas();
              setShowResetConfirm(false);
              toast.success('キャンバスをリセットしました');
            }}>
              すべて消去
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
