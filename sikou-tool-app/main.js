document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const container = document.getElementById('canvas-container');
    const btnPointer = document.getElementById('btn-mode-pointer');
    const btnLasso = document.getElementById('btn-mode-lasso');
    const btnAddSticky = document.getElementById('btn-add-sticky');
    const btnAddText = document.getElementById('btn-add-text');
    const imgUpload = document.getElementById('image-upload');
    const btnTplToggle = document.getElementById('btn-templates-toggle');
    const tplMenu = document.getElementById('templates-menu');
    const btnExport = document.getElementById('btn-export');
    const btnClear = document.getElementById('btn-clear');

    const textEditor = document.getElementById('text-editor');
    const popover = document.getElementById('popover');
    const btnDelete = document.getElementById('btn-delete-item');
    const btnConnect = document.getElementById('btn-connect-item');
    const colorBtns = document.querySelectorAll('.color-btn');

    let mode = 'pointer'; // 'pointer' | 'lasso'
    let currentZIndex = 1;

    // Local Storage Key
    const STORAGE_KEY = 'sikou-tool-data';

    // Konva Setup
    const stage = new Konva.Stage({
        container: 'canvas-container',
        width: container.offsetWidth,
        height: container.offsetHeight,
    });

    // Resize handling
    window.addEventListener('resize', () => {
        stage.width(container.offsetWidth);
        stage.height(container.offsetHeight);
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Transformer & Selection
    const tr = new Konva.Transformer({
        boundBoxFunc: (oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 50) return oldBox;
            return newBox;
        },
    });
    layer.add(tr);

    const selectionRectangle = new Konva.Rect({
        fill: 'rgba(59, 130, 246, 0.2)',
        stroke: "#475569",
        strokeWidth: 1,
        visible: false,
        listening: false,
    });
    layer.add(selectionRectangle);

    let x1, y1, x2, y2;
    let isSelecting = false;
    let selectedNodes = [];
    const connections = []; // Store lines for sticky connections

    // Mode UI Update
    function updateModeUI() {
        if (mode === 'pointer') {
            btnPointer.className = 'flex items-center gap-2 w-full px-4 py-2 rounded-md text-sm font-medium bg-slate-800 text-white transition-colors';
            btnLasso.className = 'flex items-center gap-2 w-full px-4 py-2 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors';
            container.style.cursor = 'default';
        } else {
            btnLasso.className = 'flex items-center gap-2 w-full px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white transition-colors';
            btnPointer.className = 'flex items-center gap-2 w-full px-4 py-2 rounded-md text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors';
            container.style.cursor = 'crosshair';
        }
    }

    btnPointer.addEventListener('click', () => { mode = 'pointer'; updateModeUI(); });
    btnLasso.addEventListener('click', () => { mode = 'lasso'; updateModeUI(); });

    // Selection Logic
    stage.on('mousedown touchstart', (e) => {
        hideTextEditor();
        hidePopover();

        if (mode === 'lasso' && e.target === stage) {
            isSelecting = true;
            const pos = stage.getPointerPosition();
            x1 = pos.x;
            y1 = pos.y;
            x2 = pos.x;
            y2 = pos.y;
            selectionRectangle.visible(true);
            selectionRectangle.width(0);
            selectionRectangle.height(0);
            updateDeleteButton();
            return;
        }

        if (mode === 'pointer') {
            if (e.target === stage) {
                // Clicked on empty area - clear selection
                tr.nodes([]);
                selectedNodes = [];
                updateDeleteButton();
                return;
            }

            // Clicked on transformer - do nothing
            const clickedOnTransformer = e.target.getParent().className === 'Transformer';
            if (clickedOnTransformer) return;

            // Find the draggable group
            let node = e.target;
            while (node && !node.attrs.draggable) {
                node = node.getParent();
                if (node === stage) break;
            }

            if (node && node !== stage) {
                const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
                const isSelected = tr.nodes().indexOf(node) >= 0;

                if (!metaPressed && !isSelected) {
                    tr.nodes([node]);
                    selectedNodes = [node];
                } else if (metaPressed && isSelected) {
                    const nodes = tr.nodes().slice();
                    nodes.splice(nodes.indexOf(node), 1);
                    tr.nodes(nodes);
                    selectedNodes = nodes;
                } else if (metaPressed && !isSelected) {
                    const nodes = tr.nodes().concat([node]);
                    tr.nodes(nodes);
                    selectedNodes = nodes;
                }

                // Move to top
                if (!metaPressed) node.moveToTop();
                tr.moveToTop();
                updateDeleteButton();
            }
        }
    });

    stage.on('mousemove touchmove', (e) => {
        if (!isSelecting) return;
        e.evt.preventDefault();
        const pos = stage.getPointerPosition();
        x2 = pos.x;
        y2 = pos.y;
        selectionRectangle.setAttrs({
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
        });
    });

    stage.on('mouseup touchend', (e) => {
        if (isSelecting) {
            isSelecting = false;
            // Delay hide to prevent immediate clearing
            setTimeout(() => { selectionRectangle.visible(false); }, 0);

            const box = selectionRectangle.getClientRect();
            const shapes = layer.getChildren().filter(shape =>
                shape.attrs.draggable &&
                shape.id() !== 'selectionRectangle'
            );

            const selected = shapes.filter((shape) => {
                return Konva.Util.haveIntersection(box, shape.getClientRect());
            });

            tr.nodes(selected);
            selectedNodes = selected;
            updateDeleteButton();
            saveData();
        }
    });

    // Delete & Connect Button Logic
    function updateDeleteButton() {
        if (selectedNodes.length > 0) {
            const box = tr.getClientRect();
            // Delete button at top-left outside
            btnDelete.style.display = 'flex';
            btnDelete.style.left = (box.x - 15) + 'px';
            btnDelete.style.top = (box.y - 15) + 'px';

            // Connect button (only if single sticky note is selected)
            if (selectedNodes.length === 1 && selectedNodes[0].name() === 'sticky') {
                btnConnect.style.display = 'flex';
                btnConnect.style.left = (box.x + box.width + 15) + 'px';
                btnConnect.style.top = (box.y + box.height / 2) + 'px';
            } else {
                btnConnect.style.display = 'none';
            }
        } else {
            btnDelete.style.display = 'none';
            btnConnect.style.display = 'none';
        }
    }

    btnDelete.addEventListener('click', () => {
        selectedNodes.forEach(node => {
            node.destroy();
            // Remove associated connecting lines
            for (let i = connections.length - 1; i >= 0; i--) {
                const conn = connections[i];
                if (conn.node1 === node || conn.node2 === node) {
                    conn.line.destroy();
                    connections.splice(i, 1);
                }
            }
        });
        tr.nodes([]);
        selectedNodes = [];
        updateDeleteButton();
        saveData();
    });

    // Transformer events to update delete button position
    tr.on('transform', updateDeleteButton);
    tr.on('dragmove', updateDeleteButton);
    tr.on('transformend dragend', saveData);

    function updateConnections() {
        connections.forEach(conn => {
            const b1 = conn.node1.getClientRect();
            const b2 = conn.node2.getClientRect();
            conn.line.points([
                b1.x + b1.width / 2, b1.y + b1.height / 2,
                b2.x + b2.width / 2, b2.y + b2.height / 2
            ]);
        });
    }

    // Group Drag handling to match React refactored version (fix disappearance)
    layer.on('dragmove', (e) => {
        updateConnections();
        updateDeleteButton();
    });

    // Custom Shapes & Elements
    function getNextId() { return 'id_' + Date.now() + Math.floor(Math.random() * 1000); }

    function makeDraggableGroup(config) {
        const group = new Konva.Group({
            id: getNextId(),
            x: config.x || stage.width() / 2,
            y: config.y || stage.height() / 2,
            draggable: true,
            name: config.name || 'group'
        });

        group.on('dragstart', () => {
            hidePopover(); hideTextEditor();
            if (tr.nodes().indexOf(group) === -1) {
                tr.nodes([group]);
                selectedNodes = [group];
            }
        });
        group.on('dragend', saveData);

        return group;
    }

    // 1. Sticky Note
    btnAddSticky.addEventListener('click', () => {
        const g = makeDraggableGroup({ x: stage.width() / 2 - 75, y: stage.height() / 2 - 75, name: 'sticky' });

        const rect = new Konva.Rect({
            name: 'bg',
            width: 150, height: 150,
            fill: '#fef08a',
            stroke: "#475569",
            shadowColor: 'black', shadowBlur: 10, shadowOpacity: 0.1, shadowOffset: { x: 2, y: 2 }
        });

        const text = new Konva.Text({
            name: 'content',
            text: 'ダブルクリックで入力',
            fontSize: 16, fontFamily: 'Noto Sans JP', fill: '#334155',
            width: 130, height: 130,
            x: 10, y: 10,
            align: 'center', verticalAlign: 'middle'
        });

        g.add(rect, text);
        layer.add(g);
        tr.nodes([g]);
        selectedNodes = [g];
        updateDeleteButton();
        saveData();

        // Events
        g.on('dblclick dbltap', () => { showTextEditor(g, text); });
        g.on('click tap', (e) => {
            if (e.evt.button === 2 || e.evt.shiftKey) return; // ignore right click
            showPopover(g, rect);
        });
    });

    // 1.5 Connect Button Engine
    btnConnect.addEventListener('click', () => {
        if (selectedNodes.length === 1 && selectedNodes[0].name() === 'sticky') {
            const parentNode = selectedNodes[0];
            const pBox = parentNode.getClientRect();

            // Create a new connected sticky
            const g = makeDraggableGroup({
                x: pBox.x + pBox.width + 50, // Spaced 50px to the right
                y: parentNode.y(),
                name: 'sticky'
            });

            const rect = new Konva.Rect({
                name: 'bg',
                width: 150, height: 150,
                fill: '#fef08a',
                stroke: "#475569",
                shadowColor: 'black', shadowBlur: 10, shadowOpacity: 0.1, shadowOffset: { x: 2, y: 2 }
            });
            const text = new Konva.Text({
                name: 'content',
                text: '入力',
                fontSize: 16, fontFamily: 'Noto Sans JP', fill: '#334155',
                width: 130, height: 130,
                x: 10, y: 10,
                align: 'center', verticalAlign: 'middle'
            });

            g.add(rect, text);
            layer.add(g);

            // Add connecting line
            const line = new Konva.Line({
                stroke: "#475569",
                strokeWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                points: [0, 0, 0, 0]
            });
            layer.add(line);
            line.moveToBottom();

            connections.push({ node1: parentNode, node2: g, line: line });
            updateConnections();

            // Auto-select the new sticky
            tr.nodes([g]);
            selectedNodes = [g];
            updateDeleteButton();
            saveData();

            g.on('dblclick dbltap', () => { showTextEditor(g, text); });
            g.on('click tap', (e) => {
                if (e.evt.button === 2 || e.evt.shiftKey) return;
                showPopover(g, rect);
            });

            // Immediately start input
            setTimeout(() => { showTextEditor(g, text); }, 50);
        }
    });

    // 2. Text Note
    btnAddText.addEventListener('click', () => {
        const g = makeDraggableGroup({ x: stage.width() / 2 - 100, y: stage.height() / 2 - 25, name: 'text' });

        const text = new Konva.Text({
            name: 'content',
            text: 'ダブルクリックで入力',
            fontSize: 24, fontFamily: 'Noto Sans JP', fill: '#334155',
            width: 200, padding: 10,
            align: 'center'
        });

        g.add(text);
        layer.add(g);
        tr.nodes([g]);
        selectedNodes = [g];
        updateDeleteButton();
        saveData();

        g.on('dblclick dbltap', () => { showTextEditor(g, text, true); });
    });

    // 3. Image
    imgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const imgObj = new Image();
            imgObj.onload = () => {
                let w = imgObj.width, h = imgObj.height;
                const max = 400;
                if (w > max || h > max) {
                    const r = Math.min(max / w, max / h); w *= r; h *= r;
                }
                const g = makeDraggableGroup({ x: stage.width() / 2 - w / 2, y: stage.height() / 2 - h / 2, name: 'image' });
                const konvaImg = new Konva.Image({ image: imgObj, width: w, height: h });
                g.add(konvaImg);
                layer.add(g);
                tr.nodes([g]);
                selectedNodes = [g];
                updateDeleteButton();
                saveData();
            };
            imgObj.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });

    // 4. Templates
    let tplOpen = false;
    btnTplToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        tplOpen = !tplOpen;
        tplMenu.classList.toggle('hidden', !tplOpen);
    });
    document.addEventListener('click', () => {
        if (tplOpen) {
            tplOpen = false;
            tplMenu.classList.add('hidden');
        }
    });

    document.querySelectorAll('.tpl-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.getAttribute('data-type');
            addTemplate(type);
        });
    });

    function addTemplate(type) {
        const width = 600, height = 400;
        const g = makeDraggableGroup({ x: stage.width() / 2 - width / 2, y: stage.height() / 2 - height / 2, name: 'template_' + type });

        // Background bounds
        const bg = new Konva.Rect({ width, height, fill: 'transparent' });
        g.add(bg);

        // Render shapes based on type
        const strokeColor = '#94a3b8';
        const fillColor = 'rgba(203, 213, 225, 0.05)';

        if (type === 'x') {
            g.add(new Konva.Rect({ width, height, stroke: '#cbd5e1', strokeWidth: 2, fill: fillColor }));
            g.add(new Konva.Line({ points: [0, 0, width, height], stroke: strokeColor, strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [width, 0, 0, height], stroke: strokeColor, strokeWidth: 4 }));
        } else if (type === 'y') {
            g.add(new Konva.Rect({ width, height, stroke: '#cbd5e1', strokeWidth: 2, fill: fillColor }));
            g.add(new Konva.Line({ points: [0, 0, width / 2, height / 2], stroke: strokeColor, strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [width, 0, width / 2, height / 2], stroke: strokeColor, strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [width / 2, height / 2, width / 2, height], stroke: strokeColor, strokeWidth: 4 }));
        } else if (type === 'axis') {
            g.add(new Konva.Line({ points: [width / 2, 0, width / 2, height], stroke: strokeColor, strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [0, height / 2, width, height / 2], stroke: strokeColor, strokeWidth: 4 }));
        } else if (type === 'venn') {
            g.add(new Konva.Circle({ x: width / 3, y: height / 2, radius: Math.min(width, height) / 2.5, stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
            g.add(new Konva.Circle({ x: (width / 3) * 2, y: height / 2, radius: Math.min(width, height) / 2.5, stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
        } else if (type === 'pmi') {
            [0, 1, 2].forEach(i => g.add(new Konva.Rect({ x: (width / 3) * i, y: 0, width: width / 3, height, stroke: '#cbd5e1', strokeWidth: 2, fill: fillColor })));
            g.add(new Konva.Text({ x: 0, y: 20, width: width / 3, text: 'Plus (良い点)', fontSize: 16, fill: '#64748b', align: 'center' }));
            g.add(new Konva.Text({ x: width / 3, y: 20, width: width / 3, text: 'Minus (悪い点)', fontSize: 16, fill: '#64748b', align: 'center' }));
            g.add(new Konva.Text({ x: (width / 3) * 2, y: 20, width: width / 3, text: 'Interesting', fontSize: 16, fill: '#64748b', align: 'center' }));
        } else if (type === 'kwl') {
            [0, 1, 2].forEach(i => g.add(new Konva.Rect({ x: (width / 3) * i, y: 0, width: width / 3, height, stroke: '#cbd5e1', strokeWidth: 2, fill: fillColor })));
            g.add(new Konva.Text({ x: 0, y: 20, width: width / 3, text: 'K (知っていること)', fontSize: 16, fill: '#64748b', align: 'center' }));
            g.add(new Konva.Text({ x: width / 3, y: 20, width: width / 3, text: 'W (知りたいこと)', fontSize: 16, fill: '#64748b', align: 'center' }));
            g.add(new Konva.Text({ x: (width / 3) * 2, y: 20, width: width / 3, text: 'L (わかったこと)', fontSize: 16, fill: '#64748b', align: 'center' }));
        } else if (type === 'jellyfish') {
            g.add(new Konva.Rect({ x: width * 0.25, y: height * 0.05, width: width * 0.5, height: width * 0.25 + height * 0.05, cornerRadius: [width / 4, width / 4, 0, 0], stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
            [0, 1, 2, 3, 4].forEach(i => {
                const x1 = width * (0.25 + 0.125 * i), y1 = height * 0.05 + width * 0.25 + height * 0.05;
                const x2 = width * (0.1 + 0.2 * i), y2 = height * 0.85;
                g.add(new Konva.Line({ points: [x1, y1, x2, y2], stroke: '#cbd5e1', strokeWidth: 4 }));
                g.add(new Konva.Circle({ x: x2, y: y2, radius: width * 0.08, stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
            });
        }
        else if (type === 'fishbone') {
            g.add(new Konva.Line({ points: [0, height / 2, width * 0.75, height / 2], stroke: '#cbd5e1', strokeWidth: 4 }));
            g.add(new Konva.Rect({ x: width * 0.75, y: height * 0.25, width: width * 0.25, height: height * 0.5, cornerRadius: [0, height / 4, height / 4, 0], stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
            // Bones
            g.add(new Konva.Line({ points: [width * 0.35, height / 2, width * 0.2, height * 0.1, 0, height * 0.1], stroke: '#cbd5e1', strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [width * 0.35, height / 2, width * 0.2, height * 0.9, 0, height * 0.9], stroke: '#cbd5e1', strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [width * 0.7, height / 2, width * 0.55, height * 0.1, width * 0.35, height * 0.1], stroke: '#cbd5e1', strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [width * 0.7, height / 2, width * 0.55, height * 0.9, width * 0.35, height * 0.9], stroke: '#cbd5e1', strokeWidth: 4 }));
        }
        else if (type === 'candy') {
            g.add(new Konva.Circle({ x: width / 2, y: height / 2, radius: Math.min(width, height) * 0.3, stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
            g.add(new Konva.Line({ points: [width / 2 - Math.min(width, height) * 0.3, height / 2, 0, height * 0.2, 0, height * 0.8], closed: true, stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
            g.add(new Konva.Line({ points: [width / 2 + Math.min(width, height) * 0.3, height / 2, width, height * 0.2, width, height * 0.8], closed: true, stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
        }
        else if (type === 'pyramid') {
            g.add(new Konva.Line({ points: [width / 2, 0, width, height, 0, height], closed: true, stroke: '#cbd5e1', strokeWidth: 4, fill: fillColor }));
            g.add(new Konva.Line({ points: [width * 0.33, height * 0.33, width * 0.67, height * 0.33], stroke: '#cbd5e1', strokeWidth: 4 }));
            g.add(new Konva.Line({ points: [width * 0.16, height * 0.66, width * 0.84, height * 0.66], stroke: '#cbd5e1', strokeWidth: 4 }));
        }
        else {
            g.add(new Konva.Rect({ width, height, stroke: '#cbd5e1', strokeWidth: 2, dash: [10, 5] }));
        }

        // Send to bottom so it doesn't cover stickies
        layer.add(g);
        g.moveToBottom();

        tr.nodes([g]);
        selectedNodes = [g];
        updateDeleteButton();
        saveData();
    }

    // Export
    btnExport.addEventListener('click', () => {
        tr.nodes([]); selectedNodes = []; updateDeleteButton();
        const dataURL = stage.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = '思考ツール.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Clear
    btnClear.addEventListener('click', () => {
        if (confirm('キャンバスをすべて消去しますか？')) {
            const children = layer.getChildren().slice();
            children.forEach(c => {
                if (c !== tr && c !== selectionRectangle) c.destroy();
            });
            connections.splice(0, connections.length);
            tr.nodes([]); selectedNodes = []; updateDeleteButton();
            saveData();
        }
    });

    // Text Editor Overlay Engine
    let currentTextNode = null;
    let currentGroup = null;

    function showTextEditor(group, textNode, isTextOnly = false) {
        currentTextNode = textNode;
        currentGroup = group;
        textNode.hide();
        tr.hide();
        btnDelete.style.display = 'none';
        btnConnect.style.display = 'none';

        const textPosition = textNode.absolutePosition();
        const absScale = textNode.getAbsoluteScale();

        textEditor.value = textNode.text();
        textEditor.style.display = 'block';
        textEditor.style.top = textPosition.y + 'px';
        textEditor.style.left = textPosition.x + 'px';

        // Exact pixel alignment and zoom scaling matching
        textEditor.style.width = textNode.width() * absScale.x + 'px';
        textEditor.style.height = (textNode.height() * absScale.y + 10) + 'px';
        textEditor.style.fontSize = textNode.fontSize() * absScale.y + 'px';
        textEditor.style.color = textNode.fill();
        textEditor.style.transform = `rotateZ(${group.rotation()}deg)`;

        // Seamless UI Overrides
        textEditor.style.border = 'none';
        textEditor.style.outline = 'none';
        textEditor.style.backgroundColor = 'transparent';
        textEditor.style.padding = '0';
        textEditor.style.margin = '0';
        textEditor.style.textAlign = textNode.align();

        textEditor.focus();

        // Move caret to end
        const length = textEditor.value.length;
        textEditor.setSelectionRange(length, length);
    }

    function hideTextEditor() {
        if (textEditor.style.display !== 'none' && currentTextNode) {
            currentTextNode.text(textEditor.value);
            currentTextNode.show();
            tr.show();
            textEditor.style.display = 'none';
            updateDeleteButton();
            saveData();
            currentTextNode = null;
            currentGroup = null;
        }
    }

    textEditor.addEventListener('keydown', function (e) {
        // Shift+Enter creates a new line, Enter completes
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            hideTextEditor();
        }
    });

    // Color Popover Engine
    let activeGroupForColor = null;
    let activeRectForColor = null;

    function showPopover(group, rect) {
        activeGroupForColor = group;
        activeRectForColor = rect;
        const box = group.getClientRect();
        popover.style.display = 'flex';
        popover.style.left = box.x + 'px';
        popover.style.top = (box.y + box.height + 10) + 'px';

        // Update active class
        const currentFill = rect.fill();
        colorBtns.forEach(btn => {
            if (btn.getAttribute('data-color') === currentFill) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function hidePopover() {
        popover.style.display = 'none';
        activeGroupForColor = null;
        activeRectForColor = null;
    }

    colorBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const color = btn.getAttribute('data-color');
            if (activeRectForColor) {
                activeRectForColor.fill(color);
                hidePopover();
                saveData();
            }
        });
    });

    // Handle Transform End properly
    stage.on('transformstart', () => { hidePopover(); });

    // Save and Load stub (Persistence)
    function saveData() {
        const data = layer.getChildren().filter(c => c !== tr && c !== selectionRectangle).map(c => {
            // simplified serialization
            return { className: c.className, attrs: c.attrs };
        });
        // We will implement full serialization if needed, but for now we skip complex JSON
        // localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
});
