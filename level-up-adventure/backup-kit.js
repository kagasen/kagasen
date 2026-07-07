/* =====================================================================
   backup-kit.js v2 — きろくの「バックアップ＆ひきつぎ」共通部品
   同梱している全アプリで共通（どのフォルダのも同一ファイル）。
   修正するときは全アプリのフォルダに同じファイルを配り直し、
   各 index.html の ?v= と 各 sw.js の CACHE バージョンを繰り上げること。

   使い方（各アプリの index.html 側で1回だけ呼ぶ）:
     BackupKit.init({
       appId:      'ugoki-no-kiroku',      // 封筒のapp識別子（フォルダ名と同じ）
       appName:    'うごきのきろく',         // 子ども向けの表示名
       storageKey: 'ugokiNoKiroku_v1',     // 記録本体の localStorage キー
       looksLike(data){...},               // このアプリの記録らしいか（封筒なし旧ファイル判定にも使う）
       summarize(data){                    // プレビューに出す行（レベル・バッジ数など）
         return [{label:'レベル', value:'3'}, ...];
       },
       onImported(){ location.reload(); }, // 反映後の処理（省略時 reload）

       // ▼ v2: localStorage キーが複数あるアプリ用（両方セットで指定。storageKey は不要になる）
       collect(){ return {...}; },         // いまの記録を1つのオブジェクトにまとめて返す（無ければ null）
       restore(data){ ... },               // data を localStorage に書き戻す（置換前の _mae 退避も自分で行う）
     });
   開く: BackupKit.open()

   封筒形式: { kagasenBackup:1, app, appName, exportedAt, data }
   封筒なしのJSONも looksLike() が真なら旧形式として受け入れる（後方互換）。
   置換前の自動退避: storageKey+'_mae' に1世代だけ残す（まちがえた時に手で戻せる）。
   外部送信は一切しない（ファイル保存とクリップボードのみ）。
   ===================================================================== */
(function(){
'use strict';

let cfg = null;

function todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function esc(s){ return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- データの読み書き ---------- */
function currentRaw(){ return localStorage.getItem(cfg.storageKey); }
function currentData(){
  if(cfg.collect){ try{ return cfg.collect(); }catch(e){ return null; } }
  try{ const raw = currentRaw(); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
}
function makeEnvelope(){
  return {
    kagasenBackup: 1,
    app: cfg.appId,
    appName: cfg.appName,
    exportedAt: new Date().toISOString(),
    data: currentData(),
  };
}
/* テキスト → {data} か {err, name?}。既存データには一切さわらない */
function parseBackup(text){
  let obj;
  try{ obj = JSON.parse(text); }catch(e){ return {err:'broken'}; }
  if(!obj || typeof obj !== 'object') return {err:'broken'};
  if(obj.kagasenBackup && obj.data !== undefined){
    if(obj.app !== cfg.appId) return {err:'otherapp', name: obj.appName || obj.app || 'べつのアプリ'};
    if(!obj.data || typeof obj.data !== 'object' || !cfg.looksLike(obj.data)) return {err:'broken'};
    return {data: obj.data};
  }
  // 封筒なし＝むかしの「データをほぞん」ファイルなど。中身がこのアプリの記録なら受け入れる
  if(cfg.looksLike(obj)) return {data: obj};
  return {err:'broken'};
}
function applyImport(data){
  if(cfg.restore){ cfg.restore(data); return; }  // v2: 複数キーのアプリは restore 側で退避も行う
  const raw = currentRaw();
  if(raw !== null) localStorage.setItem(cfg.storageKey + '_mae', raw);  // 1世代だけ退避
  localStorage.setItem(cfg.storageKey, JSON.stringify(data));
}

/* ---------- 見た目 ---------- */
const CSS = `
.bk-overlay{position:fixed;inset:0;background:rgba(30,41,59,.45);z-index:99990;
  display:flex;align-items:center;justify-content:center;padding:14px;}
.bk-box{background:#fff;border-radius:20px;max-width:520px;width:100%;max-height:92vh;
  overflow-y:auto;padding:20px 18px;box-shadow:0 12px 40px rgba(0,0,0,.25);
  color:#334155;font-size:15px;line-height:1.6;-webkit-overflow-scrolling:touch;}
.bk-box h2{margin:0 0 6px;font-size:20px;color:#1e293b;}
.bk-box h3{margin:16px 0 6px;font-size:16px;color:#1e293b;}
.bk-note{font-size:13px;color:#64748b;margin:2px 0 10px;}
.bk-btn{display:block;width:100%;min-height:48px;border:none;border-radius:14px;
  font-size:16px;font-weight:bold;cursor:pointer;padding:12px;margin:8px 0;
  font-family:inherit;color:#fff;background:#3B82F6;}
.bk-btn.green{background:#10B981;}
.bk-btn.ghost{background:#F1F5F9;color:#334155;}
.bk-btn.danger{background:#F97316;}
.bk-btn:active{transform:scale(.98);}
.bk-ta{width:100%;box-sizing:border-box;height:120px;border:2px solid #CBD5E1;border-radius:12px;
  padding:10px;font-size:12px;font-family:ui-monospace,monospace;resize:vertical;}
.bk-err{background:#FEF2F2;border:2px solid #FECACA;color:#B91C1C;border-radius:12px;
  padding:10px 12px;margin:10px 0;font-size:14px;}
.bk-ok{background:#ECFDF5;border:2px solid #A7F3D0;color:#047857;border-radius:12px;
  padding:10px 12px;margin:10px 0;font-size:14px;}
.bk-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:14px;}
.bk-table th,.bk-table td{padding:7px 8px;border-bottom:1px solid #E2E8F0;text-align:left;}
.bk-table th{color:#64748b;font-size:12px;font-weight:bold;}
.bk-table td.bk-new{color:#047857;font-weight:bold;}
.bk-warn{background:#FFFBEB;border:2px solid #FDE68A;color:#92400E;border-radius:12px;
  padding:10px 12px;margin:10px 0;font-size:14px;}
.bk-parent{background:#F8FAFC;border-radius:12px;padding:10px 12px;margin-top:14px;
  font-size:12px;color:#64748b;}
`;

let overlay = null;
function ensureCss(){
  if(document.getElementById('bk-css')) return;
  const st = document.createElement('style');
  st.id = 'bk-css'; st.textContent = CSS;
  document.head.appendChild(st);
}
function close(){ if(overlay){ overlay.remove(); overlay = null; } }
function show(html){
  ensureCss();
  if(!overlay){
    overlay = document.createElement('div');
    overlay.className = 'bk-overlay';
    overlay.addEventListener('click', e=>{ if(e.target === overlay) close(); });
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="bk-box">${html}</div>`;
}

/* ---------- 画面: メイン ---------- */
function viewMain(msg){
  show(`
    <h2>💾 きろくを まもる</h2>
    <div class="bk-note">きろくは この たんまつの 中にだけ ほぞんされているよ。<br>
    ときどき ファイルに のこしておくと、きえても もどせるし、あたらしい たんまつにも ひきつげるよ。</div>
    ${msg||''}
    <h3>⬇️ かきだす（バックアップ）</h3>
    <button class="bk-btn" id="bk-dl">📄 ファイルに ほぞん</button>
    <button class="bk-btn ghost" id="bk-copy">📋 テキストを コピー</button>
    <div id="bk-copyarea"></div>
    <h3>⬆️ よみこむ（ひきつぎ）</h3>
    <div class="bk-note">まえに ほぞんした ファイルや テキストを よみこむと、その ときの きろくに もどるよ。</div>
    <button class="bk-btn green" id="bk-file">📂 ファイルを よみこむ</button>
    <button class="bk-btn ghost" id="bk-paste">📝 テキストを はりつけて よみこむ</button>
    <div id="bk-pastearea"></div>
    <input type="file" id="bk-fileinput" accept=".json,application/json,text/plain" style="display:none">
    <div class="bk-parent">おうちの かたへ：記録はこの端末のブラウザ内（localStorage）だけに保存され、外部には一切送信されません。端末の買いかえ・ブラウザのデータ削除・長く使わなかった場合（iOS/Safariの仕様）に消えることがあるため、ときどき「ファイルに ほぞん」でバックアップし、ご家庭で保管してください。</div>
    <button class="bk-btn ghost" id="bk-close">とじる</button>
  `);
  document.getElementById('bk-close').onclick = close;
  document.getElementById('bk-dl').onclick = doDownload;
  document.getElementById('bk-copy').onclick = doCopy;
  document.getElementById('bk-paste').onclick = showPasteArea;
  const fi = document.getElementById('bk-fileinput');
  document.getElementById('bk-file').onclick = ()=> fi.click();
  fi.addEventListener('change', ()=>{
    const f = fi.files && fi.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = ()=> handleIncoming(String(r.result));
    r.onerror = ()=> viewMain(errBox('broken'));
    r.readAsText(f);
  });
}
function doDownload(){
  const blob = new Blob([JSON.stringify(makeEnvelope(), null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = cfg.appId + '_kiroku_' + todayStr() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  viewMain(`<div class="bk-ok">📄 ほぞんファイルを つくったよ！ ダウンロードした ファイルを おうちの人と いっしょに たいせつに とっておいてね。</div>`);
}
function doCopy(){
  const text = JSON.stringify(makeEnvelope());
  const area = document.getElementById('bk-copyarea');
  area.innerHTML = `<textarea class="bk-ta" id="bk-copyta" readonly></textarea><div id="bk-copymsg"></div>`;
  const ta = document.getElementById('bk-copyta');
  ta.value = text;
  const done = ()=>{ document.getElementById('bk-copymsg').innerHTML =
    `<div class="bk-ok">📋 コピーしたよ！ メモアプリなどに はりつけて とっておいてね。</div>`; };
  const fallback = ()=>{
    ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    try{ document.execCommand('copy'); done(); }
    catch(e){ document.getElementById('bk-copymsg').innerHTML =
      `<div class="bk-warn">じどうで コピーできなかったよ。上の 文字を ぜんぶ えらんで コピーしてね。</div>`; }
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done, fallback);
  }else fallback();
}
function showPasteArea(){
  const area = document.getElementById('bk-pastearea');
  area.innerHTML = `
    <textarea class="bk-ta" id="bk-pasteta" placeholder="ここに コピーしておいた テキストを はりつけてね"></textarea>
    <button class="bk-btn green" id="bk-pastego">よみこむ</button>`;
  document.getElementById('bk-pastego').onclick = ()=>{
    handleIncoming(document.getElementById('bk-pasteta').value);
  };
  document.getElementById('bk-pasteta').focus();
}

/* ---------- 画面: プレビュー（確認） ---------- */
function errBox(err, name){
  if(err === 'otherapp')
    return `<div class="bk-err">これは 「${esc(name)}」の きろくファイルだよ。<br>この アプリ（${esc(cfg.appName)}）の きろくじゃないから よみこめないよ。いまの きろくは そのままだよ。</div>`;
  return `<div class="bk-err">この ファイル（テキスト）は よみこめなかったよ。<br>こわれているか、ちがう ファイルかもしれないよ。いまの きろくは そのままだよ。</div>`;
}
function handleIncoming(text){
  const res = parseBackup((text||'').trim());
  if(res.err){ viewMain(errBox(res.err, res.name)); return; }
  viewPreview(res.data);
}
function summaryRows(data){
  try{ return data ? cfg.summarize(data) : null; }catch(e){ return null; }
}
function viewPreview(incoming){
  const now = summaryRows(currentData());
  const inc = summaryRows(incoming) || [];
  const labels = [];
  inc.forEach(r=>labels.push(r.label));
  (now||[]).forEach(r=>{ if(!labels.includes(r.label)) labels.push(r.label); });
  const get = (rows, l)=>{ const r = (rows||[]).find(x=>x.label===l); return r ? r.value : '—'; };
  show(`
    <h2>この きろくに ひきつぐ？</h2>
    <table class="bk-table">
      <tr><th></th><th>いまの きろく</th><th>ファイルの きろく</th></tr>
      ${labels.map(l=>`<tr><th>${esc(l)}</th><td>${now?esc(get(now,l)):'（まだ なし）'}</td><td class="bk-new">${esc(get(inc,l))}</td></tr>`).join('')}
    </table>
    <div class="bk-warn">⚠️ よみこむと、いまの きろくは ぜんぶ 「ファイルの きろく」に おきかわるよ。おうちの人と かくにんしてね。</div>
    <button class="bk-btn green" id="bk-doimport">✅ ひきつぐ（おきかえる）</button>
    <button class="bk-btn ghost" id="bk-cancel">やめる</button>
  `);
  document.getElementById('bk-cancel').onclick = ()=> viewMain();
  document.getElementById('bk-doimport').onclick = ()=>{
    applyImport(incoming);
    show(`<h2>🎉 ひきついだよ！</h2><div class="bk-ok">きろくを よみこんだよ。がめんを あたらしくするね。</div>`);
    setTimeout(()=>{ (cfg.onImported || (()=>location.reload()))(); }, 900);
  };
}

/* ---------- 公開API ---------- */
window.BackupKit = {
  init(c){ cfg = c; },
  open(){
    if(!cfg){ console.error('BackupKit: init() が先に必要'); return; }
    viewMain();
  },
};
})();
