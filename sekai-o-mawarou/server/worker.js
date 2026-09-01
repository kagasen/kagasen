// せかいをまわろう！ — へやサーバー（Cloudflare Worker + Durable Object）
// ★2026-08-18 オンライン対戦の 第3段。
//
// このサーバーが やることは 4つだけ:
//   ①へやを 作る ②へやに 入れる ③JSONを そのまま 転送する ④だれか 切れたら 知らせる
// **ゲームのルールは 知らない**（山札も 勝ち負けも ホストの 端末が 持っている）。
// のこるデータも ない: へやは メモリの上だけ、みんなが 出たら 消える。
// ＝子どもの きろく・本名は サーバーに 一切 のこらない（CLAUDE.md §1 の やくそく）。
//
// プロトコルは 手もとの にせサーバー（net-server.mjs）と **まったく同じ**。
//   C→S: {t:'new',name,size} / {t:'join',code,name} / {t:'say',d} / {t:'to',id,d}
//   S→C: {t:'joined',code,id,host,members} / {t:'members',members} / {t:'d',from,d}
//         {t:'left',id} / {t:'err',why}

// まぎらわしい字（0/O・1/I/L）は つかわない＝子どもが 打ちまちがえないように
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') === 'websocket') {
      // へやは ぜんぶ 1つの Durable Object が あずかる（教室の 規模なら これで 十分）
      const id = env.HUB.idFromName('hub');
      return env.HUB.get(id).fetch(request);
    }
    if (url.pathname === '/health') return new Response('ok');
    return new Response(
      'せかいをまわろう！ へやサーバー\nWebSocket で つないでね（/ws）',
      { headers: { 'content-type': 'text/plain; charset=utf-8' } }
    );
  }
};

export class Hub {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket', { status: 426 });
    }
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    // ★Hibernation API。だれも しゃべっていない あいだ サーバーは ねむる＝無料枠を 食わない。
    this.ctx.acceptWebSocket(server);
    // at = 入った じゅんばん（へやの ならびを いつも同じに するため）
    server.serializeAttachment({ id: 'u' + rnd(8), name: '', room: '', host: false, size: 4, at: Date.now() });
    return new Response(null, { status: 101, webSocket: client });
  }

  // ── 手つだい ──
  // ★ねむって おきると メモリの 中みは 消えている。だから へやの じょうたいは
  //   **ソケットに くっつけた attachment**（serializeAttachment）から 毎回 組みなおす。
  //   ここを メモリの Map に すると、ねむった あとで へやが 消える。
  all() {
    return this.ctx.getWebSockets();
  }
  attOf(ws) {
    try { return ws.deserializeAttachment() || {}; } catch (e) { return {}; }
  }
  membersOf(code) {
    if (!code) return [];
    const out = [];
    for (const ws of this.all()) {
      const a = this.attOf(ws);
      if (a.room === code) out.push({ ws, a });
    }
    // ★ならびを そろえる（getWebSockets() の じゅんばんは バラバラ）。
    //   ホストが 先頭 → あとは 入った じゅんばん。席の ならびが 毎回 変わらないように。
    out.sort((x, y) => (y.a.host ? 1 : 0) - (x.a.host ? 1 : 0) || (x.a.at || 0) - (y.a.at || 0));
    return out;
  }
  send(ws, obj) {
    try { ws.send(JSON.stringify(obj)); } catch (e) {}
  }
  list(members) {
    return members.map((m) => ({ id: m.a.id, name: m.a.name, host: !!m.a.host }));
  }
  tellMembers(code) {
    const ms = this.membersOf(code), list = this.list(ms);
    ms.forEach((m) => this.send(m.ws, { t: 'members', members: list }));
  }
  uniqName(code, name) {
    const used = this.membersOf(code).map((m) => m.a.name);
    let n = name, k = 2;
    while (used.indexOf(n) >= 0) { n = name + k; k++; }
    return n;
  }
  newCode() {
    for (let t = 0; t < 200; t++) {
      let c = '';
      for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      if (!this.membersOf(c).length) return c;
    }
    return 'AAAA';
  }
  leave(ws) {
    const a = this.attOf(ws);
    if (!a.room) return;
    const code = a.room;
    a.room = '';
    try { ws.serializeAttachment(a); } catch (e) {}
    const rest = this.membersOf(code);
    rest.forEach((m) => this.send(m.ws, { t: 'left', id: a.id }));
    this.tellMembers(code);
  }

  // ── メッセージ ──
  webSocketMessage(ws, message) {
    let m = null;
    try { m = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message)); }
    catch (e) { return; }
    if (!m || !m.t) return;
    const a = this.attOf(ws);

    if (m.t === 'new') {
      this.leave(ws);
      const code = this.newCode();
      a.room = code;
      a.host = true;
      a.at = Date.now();
      a.size = Math.min(4, Math.max(2, +m.size || 4));
      a.name = String(m.name || '?').slice(0, 12);
      ws.serializeAttachment(a);
      this.send(ws, {
        t: 'joined', code: code, id: a.id, host: true,
        members: this.list(this.membersOf(code))
      });
      return;
    }

    if (m.t === 'join') {
      this.leave(ws);
      const code = String(m.code || '').toUpperCase();
      const ms = this.membersOf(code);
      if (!ms.length) { this.send(ws, { t: 'err', why: 'nofound' }); return; }
      const host = ms.filter((x) => x.a.host)[0];
      const size = host ? host.a.size : 4;
      if (ms.length >= size) { this.send(ws, { t: 'err', why: 'full' }); return; }
      a.room = code;
      a.host = false;
      a.at = Date.now();
      a.size = size;
      a.name = this.uniqName(code, String(m.name || '?').slice(0, 12));
      ws.serializeAttachment(a);
      this.send(ws, {
        t: 'joined', code: code, id: a.id, host: false,
        members: this.list(this.membersOf(code))
      });
      this.tellMembers(code);
      return;
    }

    if (!a.room) return;
    if (m.t === 'say') {          // へやの ぜんいん（自分いがい）へ
      this.membersOf(a.room).forEach((x) => {
        if (x.a.id !== a.id) this.send(x.ws, { t: 'd', from: a.id, d: m.d });
      });
      return;
    }
    if (m.t === 'to') {           // ひとりへ
      const x = this.membersOf(a.room).filter((y) => y.a.id === m.id)[0];
      if (x) this.send(x.ws, { t: 'd', from: a.id, d: m.d });
    }
  }

  webSocketClose(ws) { this.leave(ws); }
  webSocketError(ws) { this.leave(ws); }
}

function rnd(n) {
  const b = new Uint8Array(n / 2);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
}
