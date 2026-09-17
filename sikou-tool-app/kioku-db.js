/* =====================================================================
   kioku-db.js v1 — 大きいデータを IndexedDB に しまう 共通部品（2026-09-16）
   同梱しているアプリ（sikou-tool-app / classroom-board）で 同一ファイル。
   直したら 全フォルダに 配り直し、各 index.html の ?v= と sw.js の CACHE を 繰り上げる。
   ★ES2017+α縛り（?. ?? は書かない）。

   なぜ: localStorage は kagasen.github.io の 全アプリで 分け合う 約5MB（iPad）。
   写真（思考ツール）や 手書き（教室サポートボード）が ここを うめると、子どもの アプリの
   記録まで 保存できなくなる。IndexedDB は 同じ サイトでも 上限が ずっと大きいので、
   大きいデータだけ こちらへ うつす（子どもの 小さな記録は localStorage のまま）。

   使い方:
     var k = KiokuDB.create({ db: 'classroom-board', key: 'h', lsKey: 'cb-v2-h' });
     k.load().then(function (raw) { ... });   // 文字列 or null。はじめて ひらいた時に localStorage から 引っ越し
     k.save(raw).then(function (ok) { ... }); // 文字列。いちばん 新しいものだけ 順に 書く
     k.latest()                               // いま 保存されている 文字列（同期。バックアップの collect 用）
     k.importRaw(raw)                         // バックアップの 読みこみ（前のデータを key+'_mae' に 退避）。以後の save は 止まる

   約束（CLAUDE.md §3 — データを 絶対に 壊さない）:
   - localStorage に lsKey が ある ＝ そちらが 新しい（まだ 引っ越していない／IndexedDB が 使えず そちらに 保存した）。
     IndexedDB に 書いて **読み返して 一致を たしかめてから** localStorage の方を 消す。
   - IndexedDB に べつの データが あったら 消さずに key+'_mae' に 1世代 退避する。
   - IndexedDB が 使えない（プライベートブラウズ・古い Safari の 不具合）ときは これまでどおり localStorage に 保存する。
   ===================================================================== */
(function () {
  'use strict';
  var STORE = 'kv';

  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsRemove(k) { try { window.localStorage.removeItem(k); } catch (e) {} }

  /* Safari 14.1 で 1回目の indexedDB.open が 返ってこない 不具合の よけ（databases() を 呼ぶと 目をさます） */
  function wakeSafari() {
    if (!window.indexedDB || typeof indexedDB.databases !== 'function') return Promise.resolve();
    return new Promise(function (resolve) {
      var n = 0, t;
      function tryOnce() {
        n++;
        indexedDB.databases().then(function () { clearInterval(t); resolve(); }, function () {});
        if (n >= 30) { clearInterval(t); resolve(); }
      }
      t = setInterval(tryOnce, 100);
      tryOnce();
    });
  }

  function openDb(name) {
    return wakeSafari().then(function () {
      return new Promise(function (resolve) {
        var done = false;
        function finish(db) { if (!done) { done = true; resolve(db); } else if (db) db.close(); }
        var timer = setTimeout(function () { finish(null); }, 8000);
        try {
          var req = indexedDB.open(name, 1);
          req.onupgradeneeded = function () {
            if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
          };
          req.onsuccess = function () {
            clearTimeout(timer);
            var db = req.result;
            db.onversionchange = function () { db.close(); };
            finish(db);
          };
          req.onerror = function () { clearTimeout(timer); finish(null); };
          req.onblocked = function () { clearTimeout(timer); finish(null); };
        } catch (e) { clearTimeout(timer); finish(null); }
      });
    });
  }

  function idbGet(db, key) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).get(key);
      req.onsuccess = function () { resolve(req.result === undefined ? null : req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbPut(db, key, value) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(STORE, 'readwrite');
      if (value === null) tx.objectStore(STORE).delete(key);
      else tx.objectStore(STORE).put(value, key);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  }

  function create(opt) {
    var key = opt.key, lsKey = opt.lsKey;
    var dbP = null;          /* Promise<IDBDatabase|null> */
    var loadP = null;        /* ★load() が おわるまで 保存を 待たせる（おわる前に localStorage へ 書かない） */
    var mode = 'ls';         /* 'idb' | 'ls'（IndexedDB が 使えなかった） */
    var latest = null;
    var frozen = false;      /* バックアップ 読みこみ後は 古い画面からの 保存を 止める */
    var writing = false, pending, hasPending = false, waiters = [];

    function db() { if (!dbP) dbP = window.indexedDB ? openDb(opt.db) : Promise.resolve(null); return dbP; }

    function load() {
      if (loadP) return loadP;
      loadP = db().then(function (d) {
        var lsRaw = lsGet(lsKey);
        if (!d) { mode = 'ls'; latest = lsRaw; return lsRaw; }
        return idbGet(d, key).then(function (idbRaw) {
          if (lsRaw === null) { mode = 'idb'; latest = idbRaw; return idbRaw; }
          /* localStorage の方が 新しい → IndexedDB へ 引っ越し */
          var stash = (idbRaw !== null && idbRaw !== lsRaw) ? idbPut(d, key + '_mae', idbRaw) : Promise.resolve();
          return stash
            .then(function () { return idbPut(d, key, lsRaw); })
            .then(function () { return idbGet(d, key); })
            .then(function (check) {
              if (check !== lsRaw) throw new Error('kioku-db: 読み返しが 一致しない');
              lsRemove(lsKey);   /* ここで はじめて localStorage の 場所が あく */
              mode = 'idb'; latest = lsRaw; return lsRaw;
            });
        });
      }).catch(function (e) {
        console.warn(e);
        mode = 'ls'; latest = lsGet(lsKey); return latest;
      });
      return loadP;
    }

    function writeOnce(raw) {
      if (mode !== 'idb') {
        try { window.localStorage.setItem(lsKey, raw); return Promise.resolve(true); }
        catch (e) { return Promise.resolve(false); }
      }
      return db().then(function (d) { return idbPut(d, key, raw); }).then(function () {
        if (lsGet(lsKey) !== null) lsRemove(lsKey);
        return true;
      }).catch(function (e) {
        console.warn(e);
        /* IndexedDB が こわれた → localStorage に にがす（入れば「そちらが新しい」として 次回 引っ越す） */
        try { window.localStorage.setItem(lsKey, raw); return true; } catch (e2) { return false; }
      });
    }

    /* 保存は 順番に 1つずつ。書いている あいだに 来たものは いちばん 新しい1つだけ 書く */
    function pump() {
      if (writing || !hasPending) return;
      var raw = pending; hasPending = false; writing = true;
      var ws = waiters; waiters = [];
      load().then(function () { return writeOnce(raw); }).then(function (ok) {
        writing = false;
        ws.forEach(function (w) { w(ok); });
        pump();
      });
    }
    function save(raw) {
      if (frozen) return Promise.resolve(true);
      latest = raw;
      pending = raw; hasPending = true;
      return new Promise(function (resolve) { waiters.push(resolve); pump(); });
    }

    /* バックアップの 読みこみ。raw=null は「データなし」にする */
    function importRaw(raw) {
      frozen = true;
      return load().then(db).then(function (d) {
        if (!d || mode !== 'idb') {
          var old = lsGet(lsKey);
          if (old !== null) window.localStorage.setItem(lsKey + '_mae', old);
          if (raw === null) lsRemove(lsKey); else window.localStorage.setItem(lsKey, raw);
          return;
        }
        return idbGet(d, key).then(function (old) {
          return (old !== null ? idbPut(d, key + '_mae', old) : Promise.resolve())
            .then(function () { return idbPut(d, key, raw); })
            .then(function () { lsRemove(lsKey); });
        });
      });
    }

    return {
      load: load,
      save: save,
      importRaw: importRaw,
      latest: function () { return latest; },
      mode: function () { return mode; }
    };
  }

  window.KiokuDB = { create: create };
})();
