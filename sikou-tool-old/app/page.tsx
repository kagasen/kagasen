import { Sidebar } from '@/components/Sidebar';
import CanvasWrapper from '@/components/CanvasWrapper';

export default function Home() {
  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 relative">
        <CanvasWrapper />
      </div>
    </main>
  );
}
