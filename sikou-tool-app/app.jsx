import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { THOUGHT_TOOL_LIST, THOUGHT_TOOL_PROMPTS } from './topicsData.js';

const LucideIcon = ({ size, className, children }) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);
const Trash2 = (p) => <LucideIcon {...p}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></LucideIcon>;
const Plus = (p) => <LucideIcon {...p}><path d="M5 12h14" /><path d="M12 5v14" /></LucideIcon>;
const ArrowDownRight = (p) => <LucideIcon {...p}><path d="m7 7 10 10" /><path d="M17 7v10H7" /></LucideIcon>;
const MousePointer2 = (p) => <LucideIcon {...p}><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" /></LucideIcon>;
const Hand = (p) => <LucideIcon {...p}><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></LucideIcon>;
const PenLine = (p) => <LucideIcon {...p}><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></LucideIcon>;
const Eraser = (p) => <LucideIcon {...p}><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></LucideIcon>;
const StickyNote = (p) => <LucideIcon {...p}><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" /><path d="M15 3v4a2 2 0 0 0 2 2h4" /></LucideIcon>;
const Type = (p) => <LucideIcon {...p}><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" x2="15" y1="20" y2="20" /><line x1="12" x2="12" y1="4" y2="20" /></LucideIcon>;
const AlignLeft = (p) => <LucideIcon {...p}><path d="M15 12H3" /><path d="M17 18H3" /><path d="M21 6H3" /></LucideIcon>;
const ImageIcon = (p) => <LucideIcon {...p}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></LucideIcon>;
const LayoutTemplate = (p) => <LucideIcon {...p}><rect width="18" height="7" x="3" y="3" rx="1" /><rect width="9" height="7" x="3" y="14" rx="1" /><rect width="5" height="7" x="16" y="14" rx="1" /></LucideIcon>;
const HelpCircle = (p) => <LucideIcon {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></LucideIcon>;
const ZoomIn = (p) => <LucideIcon {...p}><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="11" x2="11" y1="8" y2="14" /><line x1="8" x2="14" y1="11" y2="11" /></LucideIcon>;
const ZoomOut = (p) => <LucideIcon {...p}><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="8" x2="14" y1="11" y2="11" /></LucideIcon>;
const Focus = (p) => <LucideIcon {...p}><circle cx="12" cy="12" r="3" /><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></LucideIcon>;
const Layers = (p) => <LucideIcon {...p}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.18a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.18a2 2 0 0 1-1.66 0L2 12.65" /></LucideIcon>;
const Pencil = (p) => <LucideIcon {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></LucideIcon>;

const STORAGE_KEY = 'sikou-tool-app-pages-v1';

function createNewPage(name) {
    return {
        id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: name || 'ページ',
        past: [],
        present: [],
        future: [],
        connections: [],
        view: { x: 0, y: 0, scale: 1 },
        maxZIndex: 2,
    };
}

function loadPersistedState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data.pages || !Array.isArray(data.pages) || data.pages.length === 0) return null;
        const pages = data.pages.map((p, idx) => ({
            id: p.id || `page-${idx}`,
            name: typeof p.name === 'string' ? p.name : `ページ${idx + 1}`,
            past: Array.isArray(p.past) ? p.past : [],
            present: Array.isArray(p.present) ? p.present : [],
            future: Array.isArray(p.future) ? p.future : [],
            connections: Array.isArray(p.connections) ? p.connections : [],
            view: p.view && typeof p.view === 'object'
                ? { x: p.view.x ?? 0, y: p.view.y ?? 0, scale: p.view.scale ?? 1 }
                : { x: 0, y: 0, scale: 1 },
            maxZIndex: typeof p.maxZIndex === 'number' ? p.maxZIndex : 2,
        }));
        const activePageId = data.activePageId && pages.some((x) => x.id === data.activePageId)
            ? data.activePageId
            : pages[0].id;
        return { pages, activePageId };
    } catch {
        return null;
    }
}

// --- 定数とデータ ---
const STICKY_COLORS = [
    'bg-yellow-100 border-yellow-300',
    'bg-pink-100 border-pink-300',
    'bg-blue-100 border-blue-300',
    'bg-green-100 border-green-300',
    'bg-purple-100 border-purple-300'
];

const TEMPLATES = [
    { id: 'x-chart', name: 'Xチャート (分類)', width: 1000, height: 800 },
    { id: 'y-chart', name: 'Yチャート (分類)', width: 1000, height: 800 },
    { id: 'axis-chart', name: '座標軸 (順序付け)', width: 1000, height: 1000 },
    { id: 'venn-diagram', name: 'ベン図 (比較)', width: 1000, height: 700 },
    { id: 'pmi-chart', name: 'PMIチャート (分析)', width: 1200, height: 800 },
    { id: 'kwl-chart', name: 'KWLチャート (振り返り)', width: 1200, height: 800 },
    { id: 'jellyfish-chart', name: 'クラゲチャート (見通す)', width: 1000, height: 800 },
    { id: 'fishbone-diagram', name: 'フィッシュボーン図 (構造化)', width: 1200, height: 600 },
    { id: 'candy-chart', name: 'キャンディーチャート (因果関係)', width: 1000, height: 500 },
    { id: 'pyramid-chart', name: 'ピラミッドチャート (焦点化)', width: 1000, height: 800 },
];

// --- テンプレートSVG描画コンポーネント ---
const TemplateSvg = ({ id }) => {
    switch (id) {
        case 'x-chart':
            return (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#64748b" strokeWidth="1" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#64748b" strokeWidth="1" />
                </svg>
            );
        case 'y-chart':
            return (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <line x1="50" y1="50" x2="50" y2="100" stroke="#64748b" strokeWidth="1" />
                    <line x1="50" y1="50" x2="0" y2="0" stroke="#64748b" strokeWidth="1" />
                    <line x1="50" y1="50" x2="100" y2="0" stroke="#64748b" strokeWidth="1" />
                </svg>
            );
        case 'axis-chart':
            return (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <line x1="50" y1="5" x2="50" y2="95" stroke="#475569" strokeWidth="1" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="#475569" strokeWidth="1" />
                    <polygon points="50,0 45,8 55,8" fill="#475569" />
                    <polygon points="100,50 92,45 92,55" fill="#475569" />
                </svg>
            );
        case 'venn-diagram':
            return (
                <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                    <circle cx="70" cy="60" r="50" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <circle cx="130" cy="60" r="50" fill="transparent" stroke="#64748b" strokeWidth="2" />
                </svg>
            );
        case 'pmi-chart':
            return (
                <svg viewBox="0 0 300 200" preserveAspectRatio="none" className="w-full h-full">
                    <line x1="100" y1="0" x2="100" y2="200" stroke="#64748b" strokeWidth="1" />
                    <line x1="200" y1="0" x2="200" y2="200" stroke="#64748b" strokeWidth="1" />
                    <line x1="0" y1="30" x2="300" y2="30" stroke="#64748b" strokeWidth="1" />
                    <text x="50" y="20" textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">P (良いところ)</text>
                    <text x="150" y="20" textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">M (悪いところ)</text>
                    <text x="250" y="20" textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">I (おもしろい)</text>
                </svg>
            );
        case 'kwl-chart':
            return (
                <svg viewBox="0 0 300 200" preserveAspectRatio="none" className="w-full h-full">
                    <line x1="100" y1="0" x2="100" y2="200" stroke="#64748b" strokeWidth="1" />
                    <line x1="200" y1="0" x2="200" y2="200" stroke="#64748b" strokeWidth="1" />
                    <line x1="0" y1="30" x2="300" y2="30" stroke="#64748b" strokeWidth="1" />
                    <text x="50" y="20" textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">K (知っている)</text>
                    <text x="150" y="20" textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">W (知りたい)</text>
                    <text x="250" y="20" textAnchor="middle" fill="#333" fontSize="12" fontWeight="bold">L (わかった)</text>
                </svg>
            );
        case 'jellyfish-chart':
            return (
                <svg viewBox="0 0 400 230" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M 100 120 L 100 60 Q 100 10 200 10 Q 300 10 300 60 L 300 120 Z" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <line x1="120" y1="120" x2="80" y2="150" stroke="#64748b" strokeWidth="2" />
                    <circle cx="80" cy="180" r="30" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <line x1="160" y1="120" x2="140" y2="150" stroke="#64748b" strokeWidth="2" />
                    <circle cx="140" cy="180" r="30" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <line x1="200" y1="120" x2="200" y2="150" stroke="#64748b" strokeWidth="2" />
                    <circle cx="200" cy="180" r="30" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <line x1="240" y1="120" x2="260" y2="150" stroke="#64748b" strokeWidth="2" />
                    <circle cx="260" cy="180" r="30" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <line x1="280" y1="120" x2="320" y2="150" stroke="#64748b" strokeWidth="2" />
                    <circle cx="320" cy="180" r="30" fill="transparent" stroke="#64748b" strokeWidth="2" />
                </svg>
            );
        case 'fishbone-diagram':
            return (
                <svg viewBox="0 0 700 300" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M 500 70 L 500 230 C 650 230, 650 70, 500 70 Z" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <line x1="40" y1="150" x2="500" y2="150" stroke="#64748b" strokeWidth="2" />
                    <line x1="480" y1="150" x2="420" y2="30" stroke="#64748b" strokeWidth="2" />
                    <line x1="420" y1="30" x2="270" y2="30" stroke="#64748b" strokeWidth="2" />
                    <line x1="480" y1="150" x2="420" y2="270" stroke="#64748b" strokeWidth="2" />
                    <line x1="420" y1="270" x2="270" y2="270" stroke="#64748b" strokeWidth="2" />
                    <line x1="270" y1="150" x2="210" y2="30" stroke="#64748b" strokeWidth="2" />
                    <line x1="210" y1="30" x2="60" y2="30" stroke="#64748b" strokeWidth="2" />
                    <line x1="270" y1="150" x2="210" y2="270" stroke="#64748b" strokeWidth="2" />
                    <line x1="210" y1="270" x2="60" y2="270" stroke="#64748b" strokeWidth="2" />
                </svg>
            );
        case 'candy-chart':
            return (
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="w-full h-full">
                    <polygon points="100,60 20,20 20,100" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <polygon points="200,60 280,20 280,100" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <ellipse cx="150" cy="60" rx="60" ry="40" fill="transparent" stroke="#64748b" strokeWidth="2" />
                </svg>
            );
        case 'pyramid-chart':
            return (
                <svg viewBox="0 0 200 200" preserveAspectRatio="none" className="w-full h-full">
                    <polygon points="100,10 10,190 190,190" fill="transparent" stroke="#64748b" strokeWidth="2" />
                    <line x1="70" y1="70" x2="130" y2="70" stroke="#64748b" strokeWidth="2" />
                    <line x1="40" y1="130" x2="160" y2="130" stroke="#64748b" strokeWidth="2" />
                </svg>
            );
        default:
            return null;
    }
};

// --- カスタムカーソル用URL定義 ---
const penCursorUrl = `url('data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>')}') 0 24, crosshair`;
const eraserCursorUrl = `url('data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>')}') 0 24, cell`;

// --- メインアプリケーション ---
function App() {
    const persisted = loadPersistedState();
    const initialPages = persisted?.pages ?? [createNewPage('ページ1')];
    const initialActiveId = persisted?.activePageId ?? initialPages[0].id;

    const [pages, setPages] = useState(initialPages);
    const [activePageId, setActivePageId] = useState(initialActiveId);
    const [renamingPageId, setRenamingPageId] = useState(null);
    const cancelRenameBlurRef = useRef(false);

    const activePageIdRef = useRef(activePageId);
    useEffect(() => {
        activePageIdRef.current = activePageId;
    }, [activePageId]);

    const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
    const items = activePage.present;
    const connections = activePage.connections;
    const view = activePage.view;
    const maxZIndex = activePage.maxZIndex;
    const canUndo = activePage.past.length > 0;
    const canRedo = activePage.future.length > 0;

    const setItems = (arg) => {
        const pid = activePageIdRef.current;
        setPages((prev) =>
            prev.map((p) => {
                if (p.id !== pid) return p;
                const nextPresent = typeof arg === 'function' ? arg(p.present) : arg;
                if (nextPresent === p.present) return p;
                return { ...p, past: [...p.past, p.present], present: nextPresent, future: [] };
            }),
        );
    };

    const setConnections = (arg) => {
        const pid = activePageIdRef.current;
        setPages((prev) =>
            prev.map((p) => {
                if (p.id !== pid) return p;
                const next = typeof arg === 'function' ? arg(p.connections) : arg;
                return { ...p, connections: next };
            }),
        );
    };

    const setView = (arg) => {
        const pid = activePageIdRef.current;
        setPages((prev) =>
            prev.map((p) => {
                if (p.id !== pid) return p;
                const next = typeof arg === 'function' ? arg(p.view) : arg;
                return { ...p, view: next };
            }),
        );
    };

    const setMaxZIndex = (arg) => {
        const pid = activePageIdRef.current;
        setPages((prev) =>
            prev.map((p) => {
                if (p.id !== pid) return p;
                const next = typeof arg === 'function' ? arg(p.maxZIndex) : arg;
                return { ...p, maxZIndex: next };
            }),
        );
    };

    const undo = useCallback(() => {
        const pid = activePageIdRef.current;
        setPages((prev) =>
            prev.map((p) => {
                if (p.id !== pid || p.past.length === 0) return p;
                const previous = p.past[p.past.length - 1];
                return {
                    ...p,
                    past: p.past.slice(0, -1),
                    future: [p.present, ...p.future],
                    present: previous,
                };
            }),
        );
    }, []);

    const redo = useCallback(() => {
        const pid = activePageIdRef.current;
        setPages((prev) =>
            prev.map((p) => {
                if (p.id !== pid || p.future.length === 0) return p;
                const next = p.future[0];
                return {
                    ...p,
                    past: [...p.past, p.present],
                    present: next,
                    future: p.future.slice(1),
                };
            }),
        );
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages, activePageId }));
        } catch (_) {
            /* 容量不足など */
        }
    }, [pages, activePageId]);

    const [selectedIds, setSelectedIds] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showTutorialModal, setShowTutorialModal] = useState(false);
    const [tutorialImage, setTutorialImage] = useState(null);
    const [toolMode, setToolMode] = useState('pan'); // 'select', 'pan', 'draw', 'eraser'
    const [selectionBox, setSelectionBox] = useState(null);
    const [drawColor, setDrawColor] = useState('#ef4444'); // ペンカラー初期値（赤）
    const [currentDrawingPath, setCurrentDrawingPath] = useState(null); // 描画中のパス
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [selectedToolForPrompt, setSelectedToolForPrompt] = useState(null);
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [rouletteDisplay, setRouletteDisplay] = useState('');
    const [isRouletteRunning, setIsRouletteRunning] = useState(false);

    const switchPage = (id) => {
        if (id === activePageId) return;
        setActivePageId(id);
        setSelectedIds([]);
        setEditingId(null);
        setCurrentDrawingPath(null);
        setSelectionBox(null);
    };

    const addPage = () => {
        const newPage = createNewPage(`ページ${pages.length + 1}`);
        setPages((prev) => [...prev, newPage]);
        setActivePageId(newPage.id);
        setSelectedIds([]);
        setEditingId(null);
        setCurrentDrawingPath(null);
        setSelectionBox(null);
    };

    const renamePage = (id, name) => {
        const t = (name || '').trim() || 'ページ';
        setPages((prev) => prev.map((p) => (p.id === id ? { ...p, name: t } : p)));
        setRenamingPageId(null);
    };

    const deletePage = (id) => {
        if (pages.length <= 1) {
            window.alert('ページが1枚だけのときは、さくじょできません。');
            return;
        }
        const page = pages.find((p) => p.id === id);
        const label = page?.name || 'このページ';
        if (!window.confirm(`「${label}」をさくじょしていい？\n（うわがきされてももとに戻せません）`)) return;
        const idx = pages.findIndex((p) => p.id === id);
        const nextPages = pages.filter((p) => p.id !== id);
        setPages(nextPages);
        if (renamingPageId === id) setRenamingPageId(null);
        if (activePageId === id) {
            const newIdx = Math.min(Math.max(0, idx - 1), nextPages.length - 1);
            const fallback = nextPages[newIdx] ?? nextPages[0];
            setActivePageId(fallback.id);
            setSelectedIds([]);
            setEditingId(null);
            setCurrentDrawingPath(null);
            setSelectionBox(null);
        }
    };

    const fileInputRef = useRef(null);
    const viewRef = useRef(view);
    const itemsRef = useRef(items);
    const maxZIndexRef = useRef(maxZIndex);
    const selectedIdsRef = useRef(selectedIds);
    const drawColorRef = useRef(drawColor);
    const rouletteIntervalRef = useRef(null);
    const rouletteTimeoutRef = useRef(null);

    useEffect(() => { viewRef.current = view; }, [view]);
    useEffect(() => { drawColorRef.current = drawColor; }, [drawColor]);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);
    useEffect(() => { maxZIndexRef.current = maxZIndex; }, [maxZIndex]);
    useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
    useEffect(() => {
        return () => {
            if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
            if (rouletteTimeoutRef.current) clearTimeout(rouletteTimeoutRef.current);
        };
    }, []);

    // ショートカットキーの実装（Cmd+Z / Ctrl+Z）
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const getCanvasCenter = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const v = viewRef.current;
        return {
            x: (w / 2 - v.x) / v.scale,
            y: (h / 2 - v.y) / v.scale,
        };
    };

    const bringToFront = (ids) => {
        const newZ = maxZIndexRef.current + 1;
        setMaxZIndex(newZ);
        // 履歴に残さずZインデックスだけ更新したい場合はsetItemsを使いますが、
        // Zインデックスの変更も状態として保存します。
        setItems(items.map(item => ids.includes(item.id) ? { ...item, zIndex: newZ } : item));
        setSelectedIds(ids);
    };

    const updateItem = (id, changes) => {
        setItems(items.map(item => item.id === id ? { ...item, ...changes } : item));
    };

    const toggleLockSelected = () => {
        if (selectedIds.length === 0) return;
        const firstItem = items.find(i => i.id === selectedIds[0]);
        if (!firstItem) return;
        const newLockedStat = !firstItem.isLocked;
        setItems(items.map(item => selectedIds.includes(item.id) ? { ...item, isLocked: newLockedStat } : item));
    };

    const deleteSelected = () => {
        setItems(items.filter(item => !selectedIds.includes(item.id)));
        setConnections(prev => prev.filter(conn => !selectedIds.includes(conn.from) && !selectedIds.includes(conn.to)));
        setSelectedIds([]);
    };

    const deleteAll = () => {
        if (window.confirm("すべてのアイテムと繋がりを削除します。よろしいですか？")) {
            setItems([]);
            setConnections([]);
            setSelectedIds([]);
        }
    };

    const addSticky = () => {
        const center = getCanvasCenter();
        const color = STICKY_COLORS[0];
        const newZ = maxZIndexRef.current + 1;
        setMaxZIndex(newZ);
        const offset = (items.length % 10) * 10;
        setItems([...items, {
            id: `sticky-${Date.now()}`,
            type: 'sticky',
            content: '',
            color,
            x: center.x - 75 + offset, y: center.y - 30 + offset,
            width: 150, height: 100,
            zIndex: newZ,
            isLocked: false
        }]);
    };

    const addText = () => {
        const center = getCanvasCenter();
        const newZ = maxZIndexRef.current + 1;
        setMaxZIndex(newZ);
        const offset = (items.length % 10) * 10;
        setItems([...items, {
            id: `text-${Date.now()}`,
            type: 'text',
            content: '',
            x: center.x - 150 + offset, y: center.y - 50 + offset,
            width: 300, height: 100,
            zIndex: newZ,
            isLocked: false
        }]);
    };

    const addSummary = () => {
        const center = getCanvasCenter();
        const newZ = maxZIndexRef.current + 1;
        setMaxZIndex(newZ);
        const offset = (items.length % 10) * 10;
        setItems([...items, {
            id: `summary-${Date.now()}`,
            type: 'summary',
            content: '',
            x: center.x - 500 + offset, y: center.y - 140 + offset,
            width: 1000, height: 280,
            zIndex: newZ,
            isLocked: false,
            fontSize: 22
        }]);
    };

    const addTemplate = (templateId) => {
        const tpl = TEMPLATES.find(t => t.id === templateId);
        const center = getCanvasCenter();
        const newZ = maxZIndexRef.current + 1;
        setMaxZIndex(newZ);
        setItems([...items, {
            id: `tpl-${Date.now()}`,
            type: 'template',
            content: tpl.id,
            x: center.x - tpl.width / 2, y: center.y - tpl.height / 2,
            width: tpl.width, height: tpl.height,
            zIndex: newZ,
            isLocked: false
        }]);
        setShowTemplateModal(false);
    };

    const startPromptRoulette = (toolId) => {
        const prompts = THOUGHT_TOOL_PROMPTS[toolId];
        if (!prompts || prompts.length === 0) return;

        setSelectedToolForPrompt(toolId);

        if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
        if (rouletteTimeoutRef.current) clearTimeout(rouletteTimeoutRef.current);

        setIsRouletteRunning(true);
        setCurrentPrompt('');

        let count = 0;
        const maxCount = 20;
        const finalPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        rouletteIntervalRef.current = setInterval(() => {
            const tempPrompt = prompts[Math.floor(Math.random() * prompts.length)];
            setRouletteDisplay(tempPrompt);
            count += 1;
        }, 80);

        rouletteTimeoutRef.current = setTimeout(() => {
            if (rouletteIntervalRef.current) {
                clearInterval(rouletteIntervalRef.current);
            }
            setIsRouletteRunning(false);
            setCurrentPrompt(finalPrompt);
            setRouletteDisplay(finalPrompt);
        }, maxCount * 80);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > 400) { h = h * (400 / w); w = 400; }
                const center = getCanvasCenter();
                const newZ = maxZIndexRef.current + 1;
                setMaxZIndex(newZ);
                setItems([...items, {
                    id: `img-${Date.now()}`,
                    type: 'image',
                    content: dataUrl,
                    x: center.x - w / 2, y: center.y - h / 2,
                    width: w, height: h,
                    zIndex: newZ,
                    isLocked: false
                }]);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const connectNewSticky = (sourceItem) => {
        const newId = `sticky-${Date.now()}`;
        const color = sourceItem.color || STICKY_COLORS[0];
        const newZ = maxZIndexRef.current + 1;
        setMaxZIndex(newZ);

        const h = sourceItem.height || 100;
        const newX = sourceItem.x;
        const newY = sourceItem.y + h + 15; // 40から15に変更し間隔を狭める

        const newItem = {
            id: newId,
            type: 'sticky',
            content: '',
            color,
            x: newX, y: newY,
            width: 150, height: 100,
            zIndex: newZ,
            isLocked: false
        };

        setItems([...items, newItem]);
        setConnections(prev => [...prev, { from: sourceItem.id, to: newId }]);
        setSelectedIds([newId]);
        setEditingId(newId);
    };

    const handleCanvasPointerDown = (e) => {
        if (e.target.closest('[data-item]') && toolMode !== 'draw') return;

        if (toolMode !== 'draw') {
            setSelectedIds([]);
            setEditingId(null);
        }

        if (toolMode === 'select') {
            // ... selection logic ...
            const startX = e.clientX;
            const startY = e.clientY;
            const startViewX = viewRef.current.x;
            const startViewY = viewRef.current.y;
            const scale = viewRef.current.scale;

            const canvasStartX = (startX - startViewX) / scale;
            const canvasStartY = (startY - startViewY) / scale;

            const handlePointerMove = (moveEvent) => {
                const currentX = (moveEvent.clientX - startViewX) / scale;
                const currentY = (moveEvent.clientY - startViewY) / scale;

                const minX = Math.min(canvasStartX, currentX);
                const minY = Math.min(canvasStartY, currentY);
                const maxX = Math.max(canvasStartX, currentX);
                const maxY = Math.max(canvasStartY, currentY);

                setSelectionBox({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });

                const newSelectedIds = itemsRef.current.filter(item => {
                    const iw = item.width || 100;
                    const ih = item.height || 100;
                    return (
                        item.x < minX + (maxX - minX) &&
                        item.x + iw > minX &&
                        item.y < minY + (maxY - minY) &&
                        item.y + ih > minY
                    );
                }).map(i => i.id);
                setSelectedIds(newSelectedIds);
            };

            const handlePointerUp = () => {
                setSelectionBox(null);
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
            };

            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);

        } else if (toolMode === 'pan') {
            setIsPanning(true);
            const startX = e.clientX;
            const startY = e.clientY;
            const startViewX = viewRef.current.x;
            const startViewY = viewRef.current.y;

            const handlePointerMove = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                setView({ ...viewRef.current, x: startViewX + dx, y: startViewY + dy });
            };

            const handlePointerUp = () => {
                setIsPanning(false);
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
            };

            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);

        } else if (toolMode === 'draw') {
            const startX = e.clientX;
            const startY = e.clientY;
            const scale = viewRef.current.scale;

            const canvasX = (startX - viewRef.current.x) / scale;
            const canvasY = (startY - viewRef.current.y) / scale;

            let pathData = `M ${canvasX} ${canvasY}`;
            const currentDrawColor = drawColorRef.current;
            const newId = `path-${Date.now()}`;

            setCurrentDrawingPath({ id: newId, path: pathData, color: currentDrawColor, x: 0, y: 0 });

            const handlePointerMove = (moveEvent) => {
                const currentX = (moveEvent.clientX - viewRef.current.x) / scale;
                const currentY = (moveEvent.clientY - viewRef.current.y) / scale;
                pathData += ` L ${currentX} ${currentY}`;
                setCurrentDrawingPath({ id: newId, path: pathData, color: currentDrawColor, x: 0, y: 0 });
            };

            const handlePointerUp = () => {
                // PointerUpしたら最終パスをitemsに追加
                setCurrentDrawingPath(prev => {
                    if (prev) {
                        const newZ = maxZIndexRef.current + 1;
                        setMaxZIndex(newZ);
                        const newPathItem = {
                            id: prev.id,
                            type: 'path',
                            content: prev.path, // pathデータをcontentに持つ
                            color: prev.color,
                            x: 0, y: 0, width: 1, height: 1, // 基本0,0でフルキャンバスに配置
                            zIndex: newZ,
                            isLocked: true // パスは最初は移動不可とする。
                        };
                        setItems([...itemsRef.current, newPathItem]);
                    }
                    return null;
                });
                document.removeEventListener('pointermove', handlePointerMove);
                document.removeEventListener('pointerup', handlePointerUp);
            };

            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handlePointerUp);
        }
    };

    const handleWheel = (e) => {
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.1, view.scale * (1 + delta)), 5);

        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const newX = mouseX - (mouseX - view.x) * (newScale / view.scale);
        const newY = mouseY - (mouseY - view.y) * (newScale / view.scale);

        setView({ x: newX, y: newY, scale: newScale });
    };

    const handleItemDragStart = (e, id) => {
        e.stopPropagation();
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.closest('.lock-btn')) return;

        const targetItem = itemsRef.current.find(i => i.id === id);
        if (!targetItem || targetItem.isLocked) {
            if (targetItem && targetItem.isLocked) setSelectedIds([id]);
            return;
        }

        let dragTargetIds = selectedIdsRef.current;
        if (!dragTargetIds.includes(id)) {
            dragTargetIds = [id];
            setSelectedIds(dragTargetIds);
        }

        bringToFront(dragTargetIds);

        const startClientX = e.clientX;
        const startClientY = e.clientY;

        const startPositions = dragTargetIds.map(dragId => {
            const item = itemsRef.current.find(i => i.id === dragId);
            return item ? { id: dragId, x: item.x, y: item.y, isLocked: item.isLocked } : null;
        }).filter(p => p && !p.isLocked);

        const handlePointerMove = (moveEvent) => {
            const scale = viewRef.current.scale;
            const dx = (moveEvent.clientX - startClientX) / scale;
            const dy = (moveEvent.clientY - startClientY) / scale;

            setItems(itemsRef.current.map(item => {
                const startPos = startPositions.find(p => p.id === item.id);
                if (startPos) {
                    return { ...item, x: startPos.x + dx, y: startPos.y + dy };
                }
                return item;
            }));
        };

        const handlePointerUp = () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handleItemResizeStart = (e, id) => {
        e.stopPropagation();

        const targetItem = itemsRef.current.find(i => i.id === id);
        if (!targetItem || targetItem.isLocked) return;

        let resizeTargetIds = selectedIdsRef.current;
        if (!resizeTargetIds.includes(id)) {
            resizeTargetIds = [id];
            setSelectedIds(resizeTargetIds);
        }

        bringToFront(resizeTargetIds);

        const startClientX = e.clientX;
        const startClientY = e.clientY;

        const startSizes = resizeTargetIds.map(resizeId => {
            const item = itemsRef.current.find(i => i.id === resizeId);
            return item ? { id: resizeId, w: item.width, h: item.height, isLocked: item.isLocked } : null;
        }).filter(s => s && !s.isLocked);

        const handlePointerMove = (moveEvent) => {
            const scale = viewRef.current.scale;
            const dx = (moveEvent.clientX - startClientX) / scale;
            const dy = (moveEvent.clientY - startClientY) / scale;

            setItems(itemsRef.current.map(item => {
                const startSize = startSizes.find(s => s.id === item.id);
                if (startSize) {
                    return {
                        ...item,
                        width: Math.max(100, startSize.w + dx),
                        height: Math.max(50, startSize.h + dy)
                    };
                }
                return item;
            }));
        };

        const handlePointerUp = () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const changeFontSizeSelected = (delta) => {
        if (selectedIdsRef.current.length === 0) return;
        setItems(itemsRef.current.map(item => {
            if (!selectedIdsRef.current.includes(item.id)) return item;
            if (item.isLocked) return item;
            if (item.type !== 'text' && item.type !== 'summary') return item;
            const current = typeof item.fontSize === 'number'
                ? item.fontSize
                : (item.type === 'text' ? 24 : 22);
            const next = Math.min(60, Math.max(12, current + delta));
            return { ...item, fontSize: next };
        }));
    };

    return (
        <div
            className="w-screen h-screen flex relative overflow-hidden text-slate-800"
            style={{ fontFamily: '"Hiragino Maru Gothic ProN", "ヒラギノ丸ゴ ProN", "Meiryo", sans-serif' }}
        >
            <div
                className="w-full h-full absolute inset-0 touch-none"
                onPointerDown={handleCanvasPointerDown}
                onWheel={handleWheel}
                style={{
                    cursor: toolMode === 'select' ? 'default' :
                        toolMode === 'pan' ? (isPanning ? 'grabbing' : 'grab') :
                            toolMode === 'draw' ? penCursorUrl :
                                toolMode === 'eraser' ? eraserCursorUrl : 'default',
                    backgroundColor: '#f8fafc',
                    backgroundImage: `radial-gradient(#cbd5e1 ${1 * view.scale}px, transparent ${1 * view.scale}px)`,
                    backgroundSize: `${20 * view.scale}px ${20 * view.scale}px`,
                    backgroundPosition: `${view.x}px ${view.y}px`,
                }}
            >
                <div
                    className="absolute top-0 left-0 origin-top-left w-full h-full pointer-events-none"
                    style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
                >
                    <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
                        {connections.map((conn, idx) => {
                            const fromItem = items.find(i => i.id === conn.from);
                            const toItem = items.find(i => i.id === conn.to);
                            if (!fromItem || !toItem) return null;

                            const x1 = fromItem.x + (fromItem.width || 150) / 2;
                            const y1 = fromItem.y + (fromItem.height || 100) / 2;
                            const x2 = toItem.x + (toItem.width || 150) / 2;
                            const y2 = toItem.y + (toItem.height || 100) / 2;

                            return (
                                <line
                                    key={idx}
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke="#475569" strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            );
                        })}
                        {selectionBox && (
                            <rect
                                x={selectionBox.x}
                                y={selectionBox.y}
                                width={selectionBox.w}
                                height={selectionBox.h}
                                fill="rgba(59, 130, 246, 0.1)"
                                stroke="rgba(59, 130, 246, 0.5)"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                            />
                        )}
                        {currentDrawingPath && (
                            <path
                                d={currentDrawingPath.path}
                                fill="none"
                                stroke={currentDrawingPath.color}
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}
                    </svg>

                    {items.map(item => {
                        const isSelected = selectedIds.includes(item.id);
                        const isLocked = item.isLocked || false;

                        const renderZIndex = item.type === 'template'
                            ? (isSelected ? item.zIndex + 1000 : item.zIndex)
                            : (isSelected ? item.zIndex + 11000 : item.zIndex + 10000); // path 等の場合はテキストと同じZレンジ

                        if (item.type === 'path') {
                            // Pathの場合はSVG内に直接描画する特別なラッパーにする
                            return (
                                <div
                                    key={item.id}
                                    id={`item-wrapper-${item.id}`}
                                    data-item="true"
                                    className={`absolute pointer-events-none group ${isSelected ? 'ring-4 ring-blue-400 ring-offset-2 rounded-xl' : ''}`}
                                    style={{
                                        left: 0, top: 0, width: 0, height: 0,
                                        zIndex: renderZIndex,
                                    }}
                                >
                                    <svg className="absolute top-0 left-0 overflow-visible pointer-events-auto" style={{ width: '1px', height: '1px' }}>
                                        <path
                                            d={item.content}
                                            fill="none"
                                            stroke={item.color}
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`hover:stroke-opacity-70 ${toolMode === 'eraser' ? 'cursor-cell' : isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                                            onPointerDown={(e) => {
                                                if (toolMode === 'eraser') {
                                                    e.stopPropagation();
                                                    setItems(prev => prev.filter(i => i.id !== item.id));
                                                    return;
                                                }
                                                // パス自身をクリックした時も選択可能にする
                                                if (!isLocked) {
                                                    e.stopPropagation();
                                                    if (!e.shiftKey) setSelectedIds([item.id]);
                                                    else setSelectedIds([...selectedIds, item.id]);
                                                } else {
                                                    setSelectedIds([item.id]);
                                                }
                                            }}
                                            onPointerEnter={(e) => {
                                                // ドラッグ状態で消しゴムがホバーした場合に消す
                                                if (toolMode === 'eraser' && e.buttons === 1) {
                                                    e.stopPropagation();
                                                    setItems(prev => prev.filter(i => i.id !== item.id));
                                                }
                                            }}
                                        />
                                    </svg>
                                    {/* 削除ボタン（パス専用） */}
                                    {isSelected && !isLocked && (
                                        <div className="absolute z-50 pointer-events-auto" style={{ left: 20, top: 20 }}>
                                            <button
                                                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg cursor-pointer transition-transform hover:scale-110"
                                                onPointerDown={(e) => { e.stopPropagation(); deleteSelected(); }}
                                                title="さくじょ"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // 幅に依存したフォントサイズの計算 (初期サイズを基準としたスケール)
                        const baseFontSize = item.type === 'text' ? 24 : 18;
                        const baseWidth = item.type === 'text' ? 300 : 150;
                        const computedFontSize = typeof item.fontSize === 'number'
                            ? item.fontSize
                            : Math.max(12, Math.floor(baseFontSize * (item.width / baseWidth)));

                        const isOnlySelected = selectedIds.length === 1 && isSelected;

                        return (
                            <div
                                key={item.id}
                                id={`item-wrapper-${item.id}`}
                                data-item="true"
                                className={`absolute pointer-events-auto shadow-sm group ${isSelected ? 'ring-4 ring-blue-400 ring-offset-2 rounded-xl' : ''} ${isLocked ? 'ring-red-400 opacity-90' : ''}`}
                                style={{
                                    left: item.x,
                                    top: item.y,
                                    width: item.width,
                                    height: item.height,
                                    zIndex: renderZIndex,
                                    cursor: isLocked ? 'not-allowed' : 'move'
                                }}
                                onPointerDown={(e) => handleItemDragStart(e, item.id)}
                            >
                                {/* ロックトグルボタン */}
                                {isSelected && (
                                    <button
                                        className={`lock-btn absolute -top-4 left-4 ${isLocked ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-500 hover:bg-slate-600'} text-white rounded-full p-2 z-50 shadow-lg transition-transform hover:scale-110 flex items-center justify-center`}
                                        onPointerDown={(e) => { e.stopPropagation(); toggleLockSelected(); }}
                                        title={isLocked ? "ロック解除" : "位置をロック"}
                                        style={{ width: '34px', height: '34px', fontSize: '14px' }}
                                    >
                                        {isLocked ? '🔒' : '🔓'}
                                    </button>
                                )}

                                {/* 削除ボタン */}
                                {isSelected && !isLocked && (
                                    <button
                                        className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 z-50 shadow-lg cursor-pointer transition-transform hover:scale-110"
                                        onPointerDown={(e) => { e.stopPropagation(); deleteSelected(); }}
                                        title="さくじょ"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}

                                {/* 繋ぐ（＋）ボタン（付箋のみ） */}
                                {isOnlySelected && item.type === 'sticky' && !isLocked && (
                                    <button
                                        className="absolute top-1/2 -right-6 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 shadow-lg z-50 cursor-pointer transition-transform hover:scale-110"
                                        onPointerDown={(e) => { e.stopPropagation(); connectNewSticky(item); }}
                                        title="新しく繋ぐ"
                                    >
                                        <Plus size={20} />
                                    </button>
                                )}

                                {/* 色変更パレット（付箋のみ） */}
                                {isSelected && item.type === 'sticky' && !isLocked && (
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-full shadow-lg border border-slate-200 flex gap-2 z-50 pointer-events-auto">
                                        {STICKY_COLORS.map(c => (
                                            <button
                                                key={c}
                                                className={`w-6 h-6 rounded-full ${c.split(' ')[0]} border shadow-sm transition-transform hover:scale-110 ${item.color === c ? 'border-slate-800 scale-110 ring-2 ring-slate-400' : 'border-slate-200'}`}
                                                onPointerDown={(e) => {
                                                    e.stopPropagation();
                                                    setItems(items.map(i => (selectedIds.includes(i.id) && i.type === 'sticky') ? { ...i, color: c } : i));
                                                }}
                                                title="色をかえる"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* 文字サイズ（文字・まとめ） */}
                                {isSelected && (item.type === 'text' || item.type === 'summary') && !isLocked && (
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white px-3 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 z-50 pointer-events-auto">
                                        <button
                                            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700"
                                            onPointerDown={(e) => { e.stopPropagation(); changeFontSizeSelected(-2); }}
                                            title="文字を小さく"
                                        >
                                            A-
                                        </button>
                                        <div className="min-w-[56px] text-center text-xs font-bold text-slate-600">
                                            {computedFontSize}px
                                        </div>
                                        <button
                                            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 font-extrabold text-slate-700"
                                            onPointerDown={(e) => { e.stopPropagation(); changeFontSizeSelected(2); }}
                                            title="文字を大きく"
                                        >
                                            A+
                                        </button>
                                    </div>
                                )}

                                {item.type === 'sticky' && (
                                    <div
                                        className={`w-full h-full ${item.color} border-2 p-3 rounded-lg shadow-md flex flex-col ${isLocked ? 'cursor-default pointer-events-none' : 'cursor-move'}`}
                                        onDoubleClick={() => !isLocked && setEditingId(item.id)}
                                        style={{ fontSize: `${computedFontSize}px` }}
                                    >
                                        {editingId === item.id ? (
                                            <textarea
                                                className="w-full h-full bg-transparent resize-none outline-none font-bold text-slate-800 overflow-hidden"
                                                value={item.content}
                                                onChange={(e) => updateItem(item.id, { content: e.target.value })}
                                                onBlur={() => setEditingId(null)}
                                                placeholder="ここに入力..."
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="w-full h-full font-bold text-slate-800 whitespace-pre-wrap break-words select-none pointer-events-none flex items-start">
                                                {item.content || <span className="text-black/30">ダブルクリックで入力</span>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {item.type === 'text' && (
                                    <div
                                        className={`w-full h-full flex flex-col p-2 ${isLocked ? 'cursor-default' : 'cursor-move'}`}
                                        onDoubleClick={() => !isLocked && setEditingId(item.id)}
                                        style={{ fontSize: `${computedFontSize}px`, lineHeight: 1.2 }}
                                    >
                                        {editingId === item.id ? (
                                            <textarea
                                                className="w-full h-full bg-transparent resize-none outline-none font-extrabold text-slate-700 overflow-hidden"
                                                value={item.content}
                                                onChange={(e) => updateItem(item.id, { content: e.target.value })}
                                                onBlur={() => setEditingId(null)}
                                                placeholder="テキストを入力"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="w-full h-full font-extrabold text-slate-700 whitespace-pre-wrap break-words select-none pointer-events-none">
                                                {item.content || <span className="text-black/30">テキスト(ダブルクリック)</span>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {item.type === 'summary' && (
                                    <div
                                        className={`w-full h-full bg-white/95 border-2 border-slate-200 rounded-2xl shadow-md flex flex-col overflow-hidden ${isLocked ? 'cursor-default pointer-events-none' : 'cursor-move'}`}
                                        onDoubleClick={() => !isLocked && setEditingId(item.id)}
                                        style={{ fontSize: `${computedFontSize}px`, lineHeight: 1.35 }}
                                    >
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                            <div className="text-sm font-extrabold text-slate-700 tracking-wide">まとめ</div>
                                            <div className="text-[11px] font-bold text-slate-500">ダブルクリックで入力</div>
                                        </div>
                                        <div className="flex-1 p-4">
                                            {editingId === item.id ? (
                                                <textarea
                                                    className="w-full h-full bg-transparent resize-none outline-none font-bold text-slate-800 overflow-auto"
                                                    value={item.content}
                                                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                                                    onBlur={() => setEditingId(null)}
                                                    placeholder="ここに「まとめ」を書こう。"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="w-full h-full font-bold text-slate-800 whitespace-pre-wrap break-words select-none pointer-events-none">
                                                    {item.content || <span className="text-black/30">ダブルクリックで入力</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {item.type === 'image' && (
                                    <div className="w-full h-full bg-white border-4 border-white shadow-md rounded pointer-events-none">
                                        <img src={item.content} alt="uploaded" className="w-full h-full object-contain" draggable={false} />
                                    </div>
                                )}

                                {item.type === 'template' && (
                                    <div className="w-full h-full pointer-events-none">
                                        <TemplateSvg id={item.content} />
                                    </div>
                                )}

                                {isSelected && !isLocked && (
                                    <div
                                        className="absolute -bottom-4 -right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-nwse-resize z-50 shadow-lg"
                                        onPointerDown={(e) => handleItemResizeStart(e, item.id)}
                                        title="おおきさ変更"
                                    >
                                        <ArrowDownRight size={18} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/90 backdrop-blur shadow-2xl rounded-2xl p-3 flex flex-col gap-4 z-50 border border-slate-200" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                {/* 戻る（Undo）ボタン */}
                <button onClick={undo} disabled={!canUndo} className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors group ${canUndo ? 'hover:bg-orange-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                    <div className="bg-orange-100 p-2 rounded-lg group-hover:scale-110 transition-transform flex items-center justify-center font-bold text-xl text-orange-600" style={{ width: '44px', height: '44px' }}>↺</div>
                    <span className="text-xs font-bold text-slate-600">もどる</span>
                </button>
                <div className="h-px bg-slate-200 my-1 w-full"></div>

                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    <div className="flex items-center justify-center gap-1 text-slate-600">
                        <Layers size={18} />
                        <span className="text-xs font-extrabold text-slate-600">ページ</span>
                    </div>
                    <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-0.5">
                        {pages.map((p) => (
                            <div key={p.id} className="flex items-stretch gap-1">
                                {renamingPageId === p.id ? (
                                    <input
                                        type="text"
                                        defaultValue={p.name}
                                        className="flex-1 min-w-0 text-xs font-bold px-2 py-2 rounded-lg border-2 border-emerald-400 bg-white text-slate-800"
                                        autoFocus
                                        onBlur={(e) => {
                                            if (cancelRenameBlurRef.current) {
                                                cancelRenameBlurRef.current = false;
                                                return;
                                            }
                                            renamePage(p.id, e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.currentTarget.blur();
                                            if (e.key === 'Escape') {
                                                cancelRenameBlurRef.current = true;
                                                setRenamingPageId(null);
                                            }
                                        }}
                                    />
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => switchPage(p.id)}
                                            className={`flex-1 min-w-0 text-left px-2 py-2 rounded-xl text-xs font-bold transition-colors truncate ${activePageId === p.id ? 'bg-emerald-200 text-emerald-900 ring-2 ring-emerald-400' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                            title={p.name}
                                        >
                                            {p.name}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRenamingPageId(p.id)}
                                            className="shrink-0 p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600"
                                            title="なまえをかえる"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deletePage(p.id);
                                            }}
                                            disabled={pages.length <= 1}
                                            className={`shrink-0 p-2 rounded-xl ${pages.length <= 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 hover:bg-red-100 text-red-600'}`}
                                            title={pages.length <= 1 ? 'ページが1枚のときはさくじょできません' : 'このページをさくじょ'}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addPage}
                        className="flex items-center justify-center gap-1 w-full px-3 py-2.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-extrabold text-xs border border-sky-200"
                    >
                        <Plus size={18} />
                        ページを追加
                    </button>
                </div>

                <div className="h-px bg-slate-200 my-1 w-full"></div>

                {/* ツールモード切替 */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    <button onClick={() => setToolMode('select')} title="せんたく" className={`p-2 rounded-lg transition-transform ${toolMode === 'select' ? 'bg-cyan-200 text-cyan-800 scale-110 shadow-sm' : 'hover:bg-cyan-100 text-slate-500'}`}>
                        <MousePointer2 size={24} />
                    </button>
                    <button onClick={() => setToolMode('pan')} title="なでる" className={`p-2 rounded-lg transition-transform ${toolMode === 'pan' ? 'bg-cyan-200 text-cyan-800 scale-110 shadow-sm' : 'hover:bg-cyan-100 text-slate-500'}`}>
                        <Hand size={24} />
                    </button>
                    <button onClick={() => setToolMode('draw')} title="ペン" className={`p-2 rounded-lg transition-transform ${toolMode === 'draw' ? 'bg-cyan-200 text-cyan-800 scale-110 shadow-sm' : 'hover:bg-cyan-100 text-slate-500'}`}>
                        <PenLine size={24} />
                    </button>
                    <button onClick={() => setToolMode('eraser')} title="消しゴム" className={`p-2 rounded-lg transition-transform ${toolMode === 'eraser' ? 'bg-cyan-200 text-cyan-800 scale-110 shadow-sm' : 'hover:bg-cyan-100 text-slate-500'}`}>
                        <Eraser size={24} />
                    </button>
                </div>

                {/* ペンの色選択（ペンモード時のみ） */}
                {toolMode === 'draw' && (
                    <div className="flex gap-2 justify-center p-2 bg-slate-50 rounded-xl">
                        {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#000000'].map(c => (
                            <button
                                key={c}
                                onClick={() => setDrawColor(c)}
                                className={`w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110 ${drawColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400 border-slate-800' : 'border-slate-300'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                )}

                <div className="h-px bg-slate-200 my-1 w-full"></div>

                <button onClick={addSticky} className="flex flex-col items-center gap-1 p-3 hover:bg-yellow-50 rounded-xl transition-colors group">
                    <div className="bg-yellow-100 p-2 rounded-lg group-hover:scale-110 transition-transform"><StickyNote className="text-yellow-600" size={28} /></div>
                    <span className="text-xs font-bold text-slate-600">ふせん</span>
                </button>
                <button onClick={addText} className="flex flex-col items-center gap-1 p-3 hover:bg-blue-50 rounded-xl transition-colors group">
                    <div className="bg-blue-100 p-2 rounded-lg group-hover:scale-110 transition-transform"><Type className="text-blue-600" size={28} /></div>
                    <span className="text-xs font-bold text-slate-600">文字</span>
                </button>
                <button onClick={addSummary} className="flex flex-col items-center gap-1 p-3 hover:bg-slate-100 rounded-xl transition-colors group">
                    <div className="bg-slate-100 p-2 rounded-lg group-hover:scale-110 transition-transform"><AlignLeft className="text-slate-700" size={28} /></div>
                    <span className="text-xs font-bold text-slate-600">まとめ</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-3 hover:bg-green-50 rounded-xl transition-colors group">
                    <div className="bg-green-100 p-2 rounded-lg group-hover:scale-110 transition-transform"><ImageIcon className="text-green-600" size={28} /></div>
                    <span className="text-xs font-bold text-slate-600">画像</span>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </button>
                <div className="h-px bg-slate-200 my-1 w-full"></div>
                <button onClick={() => setShowTemplateModal(true)} className="flex flex-col items-center gap-1 p-3 hover:bg-purple-50 rounded-xl transition-colors group">
                    <div className="bg-purple-100 p-2 rounded-lg group-hover:scale-110 transition-transform"><LayoutTemplate className="text-purple-600" size={28} /></div>
                    <span className="text-xs font-bold text-slate-600">テンプレート</span>
                </button>

                <button onClick={() => setShowPromptModal(true)} className="flex flex-col items-center gap-1 p-3 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors group shadow-sm border border-pink-200">
                    <div className="bg-pink-100 p-2 rounded-lg group-hover:scale-110 transition-transform flex items-center justify-center">
                        <span className="text-pink-600 font-extrabold text-lg">お</span>
                    </div>
                    <span className="text-[10px] font-bold text-pink-700">思考ツールの</span>
                    <span className="text-[10px] font-bold text-pink-700">お題</span>
                </button>

                <div className="h-px bg-slate-200 my-1 w-full"></div>

                <button onClick={() => setShowTutorialModal(true)} className="flex flex-col items-center gap-1 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors group shadow-sm border border-indigo-200">
                    <div className="bg-indigo-100 p-2 rounded-lg group-hover:scale-110 transition-transform"><HelpCircle className="text-indigo-600" size={28} /></div>
                    <span className="text-[10px] font-bold text-indigo-700">思考ツールの</span>
                    <span className="text-[10px] font-bold text-indigo-700">説明</span>
                </button>

                <button onClick={deleteAll} className="flex flex-col items-center gap-1 p-3 hover:bg-red-50 rounded-xl transition-colors group">
                    <div className="bg-red-100 p-2 rounded-lg group-hover:scale-110 transition-transform"><Eraser className="text-red-500" size={28} /></div>
                    <span className="text-xs font-bold text-red-600">すべて削除</span>
                </button>

                <div className="mt-2 flex flex-col items-center gap-1">
                    {/* アプリ一覧に戻るリンクに変更 */}
                    <a href="../index.html" className="text-center font-bold text-sm text-slate-500 hover:text-slate-800 transition-colors bg-slate-200 px-3 py-2 rounded-lg">一覧へ</a>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex bg-white/90 backdrop-blur shadow-xl rounded-full p-2 gap-2 z-50 border border-slate-200">
                <button onClick={() => setView(v => ({ ...v, scale: Math.min(5, v.scale * 1.2) }))} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="ズームイン">
                    <ZoomIn size={24} />
                </button>
                <div className="flex items-center justify-center w-16 font-extrabold text-slate-700 text-sm">
                    {Math.round(view.scale * 100)}%
                </div>
                <button onClick={() => setView(v => ({ ...v, scale: Math.max(0.1, v.scale / 1.2) }))} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="ズームアウト">
                    <ZoomOut size={24} />
                </button>
                <div className="w-px bg-slate-200 my-2"></div>
                <button onClick={() => setView({ x: 0, y: 0, scale: 1 })} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-600" title="最初の位置にもどる">
                    <Focus size={24} />
                </button>
            </div>

            {/* 思考ツールのお題モーダル */}
            {
                showPromptModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
                        <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl transform transition-all">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3 text-center">
                                思考ツールのお題ルーレット
                            </h2>
                            <p className="text-sm md:text-base text-slate-600 mb-6 text-center">
                                まずはツールをえらんでね。ボタンをおすと、お題がルーレットみたいにくるくる動いて決まるよ！
                            </p>
                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1 overflow-hidden">
                                {/* ツール一覧 */}
                                <div className="md:w-1/2 overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {THOUGHT_TOOL_LIST.map(tool => (
                                            <button
                                                key={tool.id}
                                                onClick={() => startPromptRoulette(tool.id)}
                                                className={`text-left rounded-2xl px-4 py-3 border-2 transition-all shadow-sm ${
                                                    selectedToolForPrompt === tool.id
                                                        ? 'border-pink-400 bg-pink-50 shadow-md'
                                                        : 'border-slate-200 bg-slate-50 hover:bg-pink-50 hover:border-pink-300'
                                                }`}
                                            >
                                                <div className="text-xs font-semibold text-slate-500 mb-1">ツール</div>
                                                <div className="font-extrabold text-slate-800 text-sm md:text-base">
                                                    {tool.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ルーレット表示エリア */}
                                <div className="md:w-1/2 flex flex-col items-center justify-center gap-4">
                                    <div className="text-xs font-semibold text-slate-500 tracking-wide">
                                        えらばれたお題
                                    </div>
                                    <div className="w-full">
                                        <div className="bg-gradient-to-r from-pink-400 via-sky-400 to-emerald-400 p-[3px] rounded-3xl shadow-xl">
                                            <div className={`bg-white rounded-[22px] px-4 py-6 md:px-6 md:py-8 flex items-center justify-center min-h-[140px] md:min-h-[180px] text-center ${isRouletteRunning ? 'animate-pulse' : ''}`}>
                                                <span className="text-base md:text-xl font-extrabold text-slate-800 leading-relaxed whitespace-pre-wrap">
                                                    {rouletteDisplay || currentPrompt || 'どのツールにするかボタンをおして、お題ルーレットをスタートしよう！'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isRouletteRunning && (
                                        <div className="text-xs md:text-sm font-semibold text-pink-600 animate-bounce">
                                            ルーレット中… どんなお題が出るかな？
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-center gap-4">
                                <button
                                    onClick={() => {
                                        setShowPromptModal(false);
                                        setIsRouletteRunning(false);
                                        if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
                                        if (rouletteTimeoutRef.current) clearTimeout(rouletteTimeoutRef.current);
                                    }}
                                    className="px-10 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-bold text-lg transition-colors shadow-sm"
                                >
                                    とじる
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showTemplateModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl transform transition-all">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-6 text-center">つかいたい「思考ツール」をえらんでね！</h2>
                            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {TEMPLATES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => addTemplate(t.id)}
                                            className="border-4 border-slate-100 rounded-2xl p-4 hover:border-purple-400 hover:bg-purple-50 hover:-translate-y-1 transition-all flex flex-col items-center gap-4 group"
                                        >
                                            <div className="w-full h-32 bg-slate-50 rounded-xl flex items-center justify-center pointer-events-none p-2 relative overflow-hidden">
                                                <TemplateSvg id={t.id} />
                                                <div className="absolute inset-0 bg-transparent group-hover:bg-purple-500/10 transition-colors"></div>
                                            </div>
                                            <span className="font-extrabold text-slate-700 text-lg">{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowTemplateModal(false)}
                                    className="px-10 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-bold text-lg transition-colors shadow-sm"
                                >
                                    やめる (とじる)
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* チュートリアル用モーダル */}
            {
                showTutorialModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl transform transition-all">
                            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-6 text-center">思考ツールの使い方・具体例</h2>
                            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <button onClick={() => setTutorialImage('images/xtya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">Xチャート</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/ytya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">Yチャート</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/zahyoujiku.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">座標軸</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/bennzu.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">ベン図</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/pmitya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">PMIチャート</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/kwltya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">KWLチャート</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/kuragetya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">クラゲチャート</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/fissyubo-nnzu.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">フィッシュボーン図</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/kyandhitya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">キャンディーチャート</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/piramiddotya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">ピラミッドチャート</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/ime-jimappu.png?v=2')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">イメージマップ</div>
                                    </button>
                                    <button onClick={() => setTutorialImage('images/sutepputya-to.png')} className="border-2 border-indigo-100 rounded-xl p-4 hover:bg-indigo-50 text-left transition-colors">
                                        <div className="font-extrabold text-indigo-800">ステップチャート</div>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-center">
                                <button onClick={() => setShowTutorialModal(false)} className="px-10 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-bold text-lg">
                                    やめる (とじる)
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* チュートリアル画像プレビュー用モーダル */}
            {
                tutorialImage && (
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[200] p-4" onClick={() => setTutorialImage(null)}>
                        <div className="relative w-full h-full flex items-center justify-center max-w-7xl max-h-[95vh]">
                            <img src={tutorialImage} alt="思考ツールの説明" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                            <button
                                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors backdrop-blur-sm"
                                onClick={(e) => { e.stopPropagation(); setTutorialImage(null); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )
            }

            <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `}</style>
        </div >
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
