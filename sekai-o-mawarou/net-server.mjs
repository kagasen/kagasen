// せかいをまわろう！ — 手もとの にせサーバー（★2026-08-18 オンライン対戦の 第2段）
//
//   node sekai-o-mawarou/net-server.mjs      → ws://localhost:8787 で 待つ
//
// ★これは **開発・検証よう**。本番は 第3段で Cloudflare Worker に 同じ やくわりを させる。
//   （プロトコルは まったく同じ。index.html は URL を 見て つなぎ先を えらぶ）
// ★サーバーは **ゲームのルールを 知らない**。やることは 4つだけ:
//     ①へやを 作る ②へやに 入れる ③JSONを そのまま 転送する ④だれか 切れたら 知らせる
//   ＝子どもの きろくや 名まえは サーバーに 残らない（へやが 空になったら 消える）。
// 外部ライブラリは つかわない（node だけで WebSocket を しゃべる）。
import http from 'http';
import crypto from 'crypto';

const PORT = +(process.env.PORT || 8787);
// まぎらわしい字（0/O・1/I/L）は つかわない＝子どもが 打ちまちがえないように（ユーザー決定 AS-5）
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const rooms = new Map();     // code -> { code, size, members: [{id, name, sock}] }

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('sekai-o-mawarou room server\n部屋の数: ' + rooms.size + '\n');
});

// ───────── WebSocket（RFC6455）の さいしょの あいさつ ─────────
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );
  setupSocket(socket);
});

function sendFrame(socket, str) {
  const data = Buffer.from(str, 'utf8');
  const len = data.length;
  let head;
  if (len < 126) { head = Buffer.from([0x81, len]); }
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  try { socket.write(Buffer.concat([head, data])); } catch (e) {}
}

function setupSocket(socket) {
  const state = { id: 'u' + crypto.randomBytes(4).toString('hex'), room: null, name: '' };
  let buf = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      const op = buf[0] & 0x0f, masked = (buf[1] & 0x80) === 0x80;
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      const maskKey = masked ? buf.slice(off, off + 4) : null;
      if (masked) off += 4;
      if (buf.length < off + len) return;
      const payload = buf.slice(off, off + len);
      buf = buf.slice(off + len);
      if (masked) for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i % 4];
      if (op === 8) { socket.end(); return; }               // close
      if (op === 9) continue;                                // ping（かえさなくても 動く）
      if (op !== 1) continue;                                // テキストだけ あつかう
      let m = null;
      try { m = JSON.parse(payload.toString('utf8')); } catch (e) { continue; }
      onMessage(state, socket, m);
    }
  });
  socket.on('close', () => leave(state));
  socket.on('error', () => leave(state));
}

function newCode() {
  for (let t = 0; t < 200; t++) {
    let c = '';
    for (let i = 0; i < 4; i++) c += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
  return 'AAAA' + rooms.size;
}
function memberList(room) {
  // ★本番の Worker と 同じ かたち（host の しるしを 入れる）
  return room.members.map((m, i) => ({ id: m.id, name: m.name, host: i === 0 }));
}
function tellMembers(room) {
  const list = memberList(room);
  room.members.forEach((m) => sendFrame(m.sock, JSON.stringify({ t: 'members', members: list })));
}
// 同じ へやで なまえが かぶったら「きつね2」にする（ユーザー決定 AS-3）
function uniqName(room, name) {
  let n = name, k = 2;
  while (room.members.some((m) => m.name === n)) { n = name + k; k++; }
  return n;
}

function onMessage(state, socket, m) {
  if (m.t === 'new') {
    leave(state);
    const code = newCode();
    const room = { code, size: Math.min(4, Math.max(2, +m.size || 4)), members: [] };
    rooms.set(code, room);
    state.room = code;
    state.name = uniqName(room, String(m.name || '?').slice(0, 12));
    room.members.push({ id: state.id, name: state.name, sock: socket });
    sendFrame(socket, JSON.stringify({
      t: 'joined', code, id: state.id, host: true, members: memberList(room)
    }));
    console.log('へやを作った', code, state.name);
    return;
  }
  if (m.t === 'join') {
    leave(state);
    const room = rooms.get(String(m.code || '').toUpperCase());
    if (!room) { sendFrame(socket, JSON.stringify({ t: 'err', why: 'nofound' })); return; }
    if (room.members.length >= room.size) { sendFrame(socket, JSON.stringify({ t: 'err', why: 'full' })); return; }
    state.room = room.code;
    state.name = uniqName(room, String(m.name || '?').slice(0, 12));
    room.members.push({ id: state.id, name: state.name, sock: socket });
    sendFrame(socket, JSON.stringify({
      t: 'joined', code: room.code, id: state.id, host: false, members: memberList(room)
    }));
    tellMembers(room);
    console.log('へやに入った', room.code, state.name);
    return;
  }
  const room = state.room ? rooms.get(state.room) : null;
  if (!room) return;
  if (m.t === 'say') {   // へやの ぜんいん（自分いがい）へ
    room.members.forEach((x) => {
      if (x.id !== state.id) sendFrame(x.sock, JSON.stringify({ t: 'd', from: state.id, d: m.d }));
    });
    return;
  }
  if (m.t === 'to') {    // ひとりへ
    const x = room.members.find((y) => y.id === m.id);
    if (x) sendFrame(x.sock, JSON.stringify({ t: 'd', from: state.id, d: m.d }));
  }
}

function leave(state) {
  if (!state.room) return;
  const room = rooms.get(state.room);
  state.room = null;
  if (!room) return;
  room.members = room.members.filter((m) => m.id !== state.id);
  if (!room.members.length) { rooms.delete(room.code); console.log('へやを消した', room.code); return; }
  room.members.forEach((m) => sendFrame(m.sock, JSON.stringify({ t: 'left', id: state.id })));
  tellMembers(room);
}

server.listen(PORT, () => {
  console.log('せかいをまわろう！ にせサーバー ws://localhost:' + PORT + ' で まっています');
});
