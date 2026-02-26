import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: '思考ツールキャンバス',
  description: '小学生が自分の考えを可視化し、整理・分類・深化させるための「思考ツール」アプリ',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
