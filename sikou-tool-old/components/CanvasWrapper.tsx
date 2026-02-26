'use client';

import dynamic from 'next/dynamic';

const ClientCanvas = dynamic(() => import('./ClientCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p>キャンバスを読み込み中...</p>
      </div>
    </div>
  ),
});

export default function CanvasWrapper() {
  return <ClientCanvas />;
}
