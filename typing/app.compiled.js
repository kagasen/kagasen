var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const { useState, useEffect, useCallback, useRef } = React;
const ROMAJI_MAPPING = [
  { k: "\u304D\u3083", r: ["kya"] },
  { k: "\u304D\u3085", r: ["kyu"] },
  { k: "\u304D\u3087", r: ["kyo"] },
  { k: "\u3057\u3083", r: ["sya", "sha"] },
  { k: "\u3057\u3085", r: ["syu", "shu"] },
  { k: "\u3057\u3087", r: ["syo", "sho"] },
  { k: "\u3061\u3083", r: ["tya", "cha", "cya"] },
  { k: "\u3061\u3085", r: ["tyu", "chu", "cyu"] },
  { k: "\u3061\u3087", r: ["tyo", "cho", "cyo"] },
  { k: "\u306B\u3083", r: ["nya"] },
  { k: "\u306B\u3085", r: ["nyu"] },
  { k: "\u306B\u3087", r: ["nyo"] },
  { k: "\u3072\u3083", r: ["hya"] },
  { k: "\u3072\u3085", r: ["hyu"] },
  { k: "\u3072\u3087", r: ["hyo"] },
  { k: "\u307F\u3083", r: ["mya"] },
  { k: "\u307F\u3085", r: ["myu"] },
  { k: "\u307F\u3087", r: ["myo"] },
  { k: "\u308A\u3083", r: ["rya"] },
  { k: "\u308A\u3085", r: ["ryu"] },
  { k: "\u308A\u3087", r: ["ryo"] },
  { k: "\u304E\u3083", r: ["gya"] },
  { k: "\u304E\u3085", r: ["gyu"] },
  { k: "\u304E\u3087", r: ["gyo"] },
  { k: "\u3058\u3083", r: ["ja", "zya", "jya"] },
  { k: "\u3058\u3085", r: ["ju", "zyu", "jyu"] },
  { k: "\u3058\u3087", r: ["jo", "zyo", "jyo"] },
  { k: "\u3073\u3083", r: ["bya"] },
  { k: "\u3073\u3085", r: ["byu"] },
  { k: "\u3073\u3087", r: ["byo"] },
  { k: "\u3074\u3083", r: ["pya"] },
  { k: "\u3074\u3085", r: ["pyu"] },
  { k: "\u3074\u3087", r: ["pyo"] },
  { k: "\u3075\u3041", r: ["fa"] },
  { k: "\u3075\u3043", r: ["fi"] },
  { k: "\u3075\u3047", r: ["fe"] },
  { k: "\u3075\u3049", r: ["fo"] },
  { k: "\u3066\u3043", r: ["thi"] },
  { k: "\u3067\u3043", r: ["dhi"] },
  { k: "\u3042", r: ["a"] },
  { k: "\u3044", r: ["i"] },
  { k: "\u3046", r: ["u", "wu"] },
  { k: "\u3048", r: ["e"] },
  { k: "\u304A", r: ["o"] },
  { k: "\u304B", r: ["ka", "ca"] },
  { k: "\u304D", r: ["ki"] },
  { k: "\u304F", r: ["ku", "cu"] },
  { k: "\u3051", r: ["ke"] },
  { k: "\u3053", r: ["ko", "co"] },
  { k: "\u3055", r: ["sa"] },
  { k: "\u3057", r: ["si", "shi", "ci"] },
  { k: "\u3059", r: ["su"] },
  { k: "\u305B", r: ["se", "ce"] },
  { k: "\u305D", r: ["so"] },
  { k: "\u305F", r: ["ta"] },
  { k: "\u3061", r: ["ti", "chi"] },
  { k: "\u3064", r: ["tsu", "tu"] },
  { k: "\u3066", r: ["te"] },
  { k: "\u3068", r: ["to"] },
  { k: "\u306A", r: ["na"] },
  { k: "\u306B", r: ["ni"] },
  { k: "\u306C", r: ["nu"] },
  { k: "\u306D", r: ["ne"] },
  { k: "\u306E", r: ["no"] },
  { k: "\u306F", r: ["ha"] },
  { k: "\u3072", r: ["hi"] },
  { k: "\u3075", r: ["fu", "hu"] },
  { k: "\u3078", r: ["he"] },
  { k: "\u307B", r: ["ho"] },
  { k: "\u307E", r: ["ma"] },
  { k: "\u307F", r: ["mi"] },
  { k: "\u3080", r: ["mu"] },
  { k: "\u3081", r: ["me"] },
  { k: "\u3082", r: ["mo"] },
  { k: "\u3084", r: ["ya"] },
  { k: "\u3086", r: ["yu"] },
  { k: "\u3088", r: ["yo"] },
  { k: "\u3089", r: ["ra"] },
  { k: "\u308A", r: ["ri"] },
  { k: "\u308B", r: ["ru"] },
  { k: "\u308C", r: ["re"] },
  { k: "\u308D", r: ["ro"] },
  { k: "\u308F", r: ["wa"] },
  { k: "\u3092", r: ["wo"] },
  { k: "\u3093", r: ["nn"] },
  // 'ん' は nn のみとする
  { k: "\u304C", r: ["ga"] },
  { k: "\u304E", r: ["gi"] },
  { k: "\u3050", r: ["gu"] },
  { k: "\u3052", r: ["ge"] },
  { k: "\u3054", r: ["go"] },
  { k: "\u3056", r: ["za"] },
  { k: "\u3058", r: ["ji", "zi"] },
  { k: "\u305A", r: ["zu"] },
  { k: "\u305C", r: ["ze"] },
  { k: "\u305E", r: ["zo"] },
  { k: "\u3060", r: ["da"] },
  { k: "\u3062", r: ["di"] },
  { k: "\u3065", r: ["du"] },
  { k: "\u3067", r: ["de"] },
  { k: "\u3069", r: ["do"] },
  { k: "\u3070", r: ["ba"] },
  { k: "\u3073", r: ["bi"] },
  { k: "\u3076", r: ["bu"] },
  { k: "\u3079", r: ["be"] },
  { k: "\u307C", r: ["bo"] },
  { k: "\u3071", r: ["pa"] },
  { k: "\u3074", r: ["pi"] },
  { k: "\u3077", r: ["pu"] },
  { k: "\u307A", r: ["pe"] },
  { k: "\u307D", r: ["po"] },
  { k: "\u3041", r: ["la", "xa"] },
  { k: "\u3043", r: ["li", "xi"] },
  { k: "\u3045", r: ["lu", "xu"] },
  { k: "\u3047", r: ["le", "xe"] },
  { k: "\u3049", r: ["lo", "xo"] },
  { k: "\u3083", r: ["lya", "xya"] },
  { k: "\u3085", r: ["lyu", "xyu"] },
  { k: "\u3087", r: ["lyo", "xyo"] },
  { k: "\u3063", r: ["ltsu", "xtsu", "ltu", "xtu"] },
  { k: "\u30FC", r: ["-"] },
  { k: "\u3001", r: [","] },
  { k: "\u3002", r: ["."] },
  { k: "\uFF1F", r: ["?"] },
  { k: "\uFF01", r: ["!"] },
  { k: "\uFF12", r: ["2", "ni"] },
  { k: "\uFF13", r: ["3", "sann"] },
  // 全角数字対応
  // 半角数字（数字キーまたは日本語読みのローマ字で入力可能）
  { k: "0", r: ["0", "zero", "rei"] },
  { k: "1", r: ["1", "ichi", "iti"] },
  { k: "2", r: ["2", "ni"] },
  { k: "3", r: ["3", "sann"] },
  { k: "4", r: ["4", "yonn", "shi", "si"] },
  { k: "5", r: ["5", "go"] },
  { k: "6", r: ["6", "roku"] },
  { k: "7", r: ["7", "nana", "shichi", "siti"] },
  { k: "8", r: ["8", "hachi", "hati"] },
  { k: "9", r: ["9", "kyuu", "ku"] }
];
const RANK_LIST = [
  { min: 400, max: Infinity, name: "\u795E" },
  { min: 350, max: 399, name: "\u5929\u624D" },
  { min: 300, max: 349, name: "\u79C0\u624D" },
  { min: 251, max: 299, name: "\u30BF\u30A4\u30D4\u30F3\u30B0\u306E\u661F" },
  { min: 221, max: 250, name: "\u30BF\u30A4\u30D4\u30F3\u30B0\u738B" },
  { min: 201, max: 220, name: "\u30BF\u30A4\u30D4\u30F3\u30B0\u30DE\u30B9\u30BF\u30FC" },
  { min: 181, max: 200, name: "\u4F1D\u8AAC\u306E\u30BF\u30A4\u30D1\u30FC" },
  { min: 161, max: 180, name: "\u795E\u901F\u30BF\u30A4\u30D1\u30FC" },
  { min: 141, max: 160, name: "\u97F3\u901F\u30BF\u30A4\u30D1\u30FC" },
  { min: 121, max: 140, name: "\u5149\u901F\u30BF\u30A4\u30D1\u30FC" },
  { min: 101, max: 120, name: "\u8D85\u4EBA\u30BF\u30A4\u30D1\u30FC" },
  { min: 91, max: 100, name: "\u9054\u4EBA\u30BF\u30A4\u30D1\u30FC" },
  { min: 81, max: 90, name: "\u540D\u4EBA\u30BF\u30A4\u30D1\u30FC" },
  { min: 71, max: 80, name: "\u30D9\u30C6\u30E9\u30F3\u30BF\u30A4\u30D1\u30FC" },
  { min: 61, max: 70, name: "\u4E00\u4EBA\u524D\u30BF\u30A4\u30D1\u30FC" },
  { min: 51, max: 60, name: "\u306F\u3093\u4EBA\u524D\u30BF\u30A4\u30D1\u30FC" },
  { min: 41, max: 50, name: "\u898B\u7FD2\u3044\u30BF\u30A4\u30D1\u30FC" },
  { min: 31, max: 40, name: "\u30C1\u30FC\u30BF\u30FC\u30EC\u30D9\u30EB" },
  { min: 21, max: 30, name: "\u3046\u3055\u304E\u30EC\u30D9\u30EB" },
  { min: 11, max: 20, name: "\u304B\u3081\u30EC\u30D9\u30EB" },
  { min: 1, max: 10, name: "\u3072\u3088\u3053\u30EC\u30D9\u30EB" },
  { min: 0, max: 0, name: "\u306F\u3058\u307E\u308A\u306E\u4E00\u6B69" },
  { min: -Infinity, max: -1, name: "\u3069\u3093\u307E\u3044" }
];
const FINGER_MAP = {
  "1": "L_PINKY",
  "q": "L_PINKY",
  "a": "L_PINKY",
  "z": "L_PINKY",
  "2": "L_RING",
  "w": "L_RING",
  "s": "L_RING",
  "x": "L_RING",
  "3": "L_MIDDLE",
  "e": "L_MIDDLE",
  "d": "L_MIDDLE",
  "c": "L_MIDDLE",
  "4": "L_INDEX",
  "r": "L_INDEX",
  "f": "L_INDEX",
  "v": "L_INDEX",
  "5": "L_INDEX",
  "t": "L_INDEX",
  "g": "L_INDEX",
  "b": "L_INDEX",
  "6": "R_INDEX",
  "y": "R_INDEX",
  "h": "R_INDEX",
  "n": "R_INDEX",
  "7": "R_INDEX",
  "u": "R_INDEX",
  "j": "R_INDEX",
  "m": "R_INDEX",
  "8": "R_MIDDLE",
  "i": "R_MIDDLE",
  "k": "R_MIDDLE",
  ",": "R_MIDDLE",
  "9": "R_RING",
  "o": "R_RING",
  "l": "R_RING",
  ".": "R_RING",
  "0": "R_PINKY",
  "p": "R_PINKY",
  ";": "R_PINKY",
  "/": "R_PINKY",
  "-": "R_PINKY"
};
const KEYBOARD_LAYOUT = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", ""],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", ""],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/", ""]
];
const buildWordListForCourse = (course) => {
  const low = typeof window !== "undefined" ? window.WORDS_LOW : null;
  const high = typeof window !== "undefined" ? window.WORDS_HIGH : null;
  const list = course === "low" ? low : high;
  if (!Array.isArray(list) || list.length === 0) {
    return [{ kanji: "\u3058\u3085\u3093\u3073\u3061\u3085\u3046", kana: "\u3058\u3085\u3093\u3073\u3061\u3085\u3046" }];
  }
  return [...list].sort(() => Math.random() - 0.5);
};
const rotateFirstToCurrent = (wordList) => {
  if (!wordList.length) {
    return {
      words: [],
      currentText: { kanji: "", kana: "", remainingKana: "", altRemainingKana: null, typedRomaji: "", currentInput: "" }
    };
  }
  const first = wordList[0];
  const rotated = [...wordList.slice(1), first];
  return {
    words: rotated,
    currentText: {
      kanji: first.kanji,
      kana: first.kana,
      remainingKana: first.kana,
      altRemainingKana: first.altKana || null,
      typedRomaji: "",
      currentInput: ""
    }
  };
};
const getRank = (score) => {
  const rank = RANK_LIST.find((r) => score >= r.min && score <= r.max);
  return rank ? rank.name : "";
};
const getValidFirstPatterns = (kana) => {
  if (!kana) return [];
  let patterns = [];
  if (kana.startsWith("\u3063") && kana.length > 1) {
    const nextKana = kana.slice(1);
    const nextPatterns = getValidFirstPatterns(nextKana);
    nextPatterns.forEach((p) => {
      const firstChar = p.romaji[0];
      if (!["a", "i", "u", "e", "o", "-"].includes(firstChar)) {
        patterns.push({ len: 1 + p.len, romaji: firstChar + p.romaji });
      }
    });
  }
  for (let m of ROMAJI_MAPPING) {
    if (kana.startsWith(m.k)) {
      m.r.forEach((rStr) => patterns.push({ len: m.k.length, romaji: rStr }));
    }
  }
  return patterns;
};
const generateDefaultRomaji = (kana) => {
  let result = "";
  let remaining = kana;
  while (remaining.length > 0) {
    let match = false;
    if (remaining.startsWith("\u3063") && remaining.length > 1) {
      const nextKana = remaining.slice(1);
      for (let m of ROMAJI_MAPPING) {
        if (nextKana.startsWith(m.k)) {
          const firstChar = m.r[0][0];
          if (!["a", "i", "u", "e", "o", "-"].includes(firstChar)) {
            result += firstChar;
            remaining = remaining.slice(1);
            match = true;
            break;
          }
        }
      }
    }
    if (match) continue;
    for (let m of ROMAJI_MAPPING) {
      if (remaining.startsWith(m.k)) {
        result += m.r[0];
        remaining = remaining.slice(m.k.length);
        match = true;
        break;
      }
    }
    if (!match) {
      result += remaining[0];
      remaining = remaining.slice(1);
    }
  }
  return result;
};
let audioCtx = null;
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
};
const playBeep = (frequency, type, duration, vol = 0.1) => {
  if (!audioCtx) return;
  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(1e-5, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error(e);
  }
};
const playCorrectSound = () => playBeep(880, "sine", 0.1, 0.2);
const playMissSound = () => playBeep(150, "sawtooth", 0.15, 0.3);
const playClearSound = () => {
  initAudio();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const stepMs = 95;
  notes.forEach((freq, i) => {
    setTimeout(() => playBeep(freq, "sine", 0.18, 0.2), i * stepMs);
  });
};
const KeyboardRow = ({ row, targetKey }) => /* @__PURE__ */ React.createElement("div", { className: "flex justify-center mb-1 sm:mb-2" }, row.map((key, i) => {
  if (!key) return /* @__PURE__ */ React.createElement("div", { key: i, className: "w-7 h-9 sm:w-11 sm:h-12 mx-0.5 sm:mx-1" });
  const isTarget = targetKey === key;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      key,
      className: `w-7 h-9 sm:w-11 sm:h-12 mx-0.5 sm:mx-1 flex items-center justify-center rounded-md shadow-sm border-b-2 sm:border-b-4 text-sm sm:text-lg
            ${isTarget ? "bg-yellow-300 border-yellow-500 font-bold text-red-600 scale-110 z-10 translate-y-[-2px] shadow-lg shadow-yellow-200" : "bg-white border-gray-300 text-gray-700"}
            transition-all duration-100 uppercase`
    },
    key
  );
}));
const Keyboard = ({ targetKey }) => {
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-center text-xs sm:text-sm font-bold text-indigo-500 mt-1 mb-1 sm:mb-2" }, "\u{1F448} \u5DE6\u624B\u4EBA\u5DEE\u3057\u6307\u3092 ", /* @__PURE__ */ React.createElement("span", { className: "font-black text-indigo-700 bg-indigo-50 px-1 rounded" }, "F"), "\u3001\u53F3\u624B\u4EBA\u5DEE\u3057\u6307\u3092 ", /* @__PURE__ */ React.createElement("span", { className: "font-black text-indigo-700 bg-indigo-50 px-1 rounded" }, "J"), " \u306B\u304A\u3044\u3066\u306D \u{1F449}"), /* @__PURE__ */ React.createElement("div", { className: "relative p-2 sm:p-3 bg-gray-100 rounded-xl shadow-inner overflow-hidden" }, KEYBOARD_LAYOUT.map((row, i) => /* @__PURE__ */ React.createElement(KeyboardRow, { key: i, row, targetKey })), /* @__PURE__ */ React.createElement(HandsOverlay, { activeFinger: FINGER_MAP[targetKey] })));
};
const Finger = ({ cx, cy, rot, length, isActive, label }) => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: `absolute flex flex-col items-center justify-start transition-all duration-200 origin-bottom pointer-events-none
      ${isActive ? "z-30 scale-110 translate-y-[-10px] opacity-90" : "z-20 opacity-40"}`,
    style: {
      left: `${cx}%`,
      top: `${cy}%`,
      width: "clamp(20px, 3.5vw, 32px)",
      height: `clamp(${length * 0.7}px, ${length * 0.15}vw, ${length * 1.2}px)`,
      transform: `translate(-50%, -100%) rotate(${rot}deg)`
    }
  },
  /* @__PURE__ */ React.createElement("div", { className: `w-full h-full rounded-t-full rounded-b-lg border shadow-sm flex flex-col items-center justify-start pt-1 sm:pt-2 overflow-hidden
      ${isActive ? "bg-yellow-300 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]" : "bg-orange-100 border-orange-200 backdrop-blur-sm"}` }, /* @__PURE__ */ React.createElement("div", { className: `w-[60%] aspect-square rounded-full border border-b-2 ${isActive ? "bg-white border-yellow-500" : "bg-white/80 border-orange-200"} mb-1 sm:mb-2` }), /* @__PURE__ */ React.createElement("div", { className: `w-[80%] h-[2px] rounded-full ${isActive ? "bg-yellow-500" : "bg-orange-300"}` }), /* @__PURE__ */ React.createElement("div", { className: `w-[80%] h-[2px] rounded-full mt-1.5 sm:mt-2.5 ${isActive ? "bg-yellow-500" : "bg-orange-300"}` }), /* @__PURE__ */ React.createElement("span", { className: `mt-auto mb-1 text-[9px] sm:text-[11px] font-black ${isActive ? "text-red-600 drop-shadow-md" : "text-gray-500/0"}` }, isActive ? label : ""))
);
const Palm = ({ cx, cy, isRight }) => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: "absolute z-10 pointer-events-none opacity-40",
    style: {
      left: `${cx}%`,
      top: `${cy}%`,
      width: "clamp(80px, 14vw, 130px)",
      height: "clamp(70px, 12vw, 110px)",
      transform: `translate(-50%, -50%) rotate(${isRight ? "-5deg" : "5deg"})`
    }
  },
  /* @__PURE__ */ React.createElement("div", { className: "w-full h-full bg-orange-100 border border-orange-200 rounded-[40%] backdrop-blur-sm shadow-sm relative" }, /* @__PURE__ */ React.createElement("div", { className: "absolute -bottom-10 left-1/2 -translate-x-1/2 w-[70%] h-16 bg-orange-100 border-x border-orange-200 rounded-b-xl backdrop-blur-sm" }))
);
const HandsOverlay = ({ activeFinger }) => {
  return /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-0 w-full h-full pointer-events-none" }, /* @__PURE__ */ React.createElement(Palm, { cx: 20, cy: 115, isRight: false }), /* @__PURE__ */ React.createElement(Finger, { cx: 11, cy: 95, rot: -12, length: 85, isActive: activeFinger === "L_PINKY", label: "\u5C0F\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 18, cy: 90, rot: -4, length: 95, isActive: activeFinger === "L_RING", label: "\u85AC\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 25, cy: 87, rot: 2, length: 105, isActive: activeFinger === "L_MIDDLE", label: "\u4E2D\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 32, cy: 90, rot: 8, length: 95, isActive: activeFinger === "L_INDEX", label: "\u4EBA\u5DEE\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 38, cy: 105, rot: 55, length: 60, isActive: activeFinger === "L_THUMB", label: "\u89AA\u6307" }), /* @__PURE__ */ React.createElement(Palm, { cx: 80, cy: 115, isRight: true }), /* @__PURE__ */ React.createElement(Finger, { cx: 53, cy: 105, rot: -55, length: 60, isActive: activeFinger === "R_THUMB", label: "\u89AA\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 59, cy: 90, rot: -8, length: 95, isActive: activeFinger === "R_INDEX", label: "\u4EBA\u5DEE\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 66, cy: 87, rot: -2, length: 105, isActive: activeFinger === "R_MIDDLE", label: "\u4E2D\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 73, cy: 90, rot: 4, length: 95, isActive: activeFinger === "R_RING", label: "\u85AC\u6307" }), /* @__PURE__ */ React.createElement(Finger, { cx: 80, cy: 95, rot: 12, length: 85, isActive: activeFinger === "R_PINKY", label: "\u5C0F\u6307" }));
};
function App() {
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname || "";
  const is2to6nenTypingOnlyShort = pathname.includes("/typing/2nen/") || pathname.endsWith("/typing/2nen/index.html") || pathname.includes("/typing/3nen/") || pathname.endsWith("/typing/3nen/index.html") || pathname.includes("/typing/4nen/") || pathname.endsWith("/typing/4nen/index.html") || pathname.includes("/typing/5nen/") || pathname.endsWith("/typing/5nen/index.html") || pathname.includes("/typing/6nen/") || pathname.endsWith("/typing/6nen/index.html");
  const initialCourse = is2to6nenTypingOnlyShort ? "high" : params.get("mode") === "high" ? "high" : "low";
  const typingInitRef = useRef(null);
  if (typingInitRef.current === null) {
    typingInitRef.current = rotateFirstToCurrent(buildWordListForCourse(initialCourse));
  }
  const [gameState, setGameState] = useState("ready");
  const [course, setCourse] = useState(initialCourse);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState(() => typingInitRef.current.words);
  const [currentText, setCurrentText] = useState(() => typingInitRef.current.currentText);
  const [isShaking, setIsShaking] = useState(false);
  const pyramidRef = useRef(null);
  const currentRankRef = useRef(null);
  const restartGame = () => {
    initAudio();
    const wl = buildWordListForCourse(course);
    const bundle = rotateFirstToCurrent(wl);
    setWords(bundle.words);
    setCurrentText(bundle.currentText);
    setScore(0);
    setCorrectCount(0);
    setMissCount(0);
    setTimeLeft(60);
    setGameState("ready");
  };
  const setNextWord = (wordList, index) => {
    if (index >= wordList.length) {
      wordList.sort(() => Math.random() - 0.5);
      index = 0;
    }
    const word = wordList[index];
    setCurrentText({
      kanji: word.kanji,
      kana: word.kana,
      remainingKana: word.kana,
      altRemainingKana: word.altKana || null,
      typedRomaji: "",
      currentInput: ""
    });
    const newList = [...wordList];
    newList.push(newList.splice(index, 1)[0]);
    setWords(newList);
  };
  useEffect(() => {
    let timer;
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1e3);
    } else if (gameState === "playing" && timeLeft === 0) {
      setGameState("result");
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);
  const beginTypingPlay = useCallback(() => {
    initAudio();
    setGameState("playing");
  }, []);
  useEffect(() => {
    if (gameState === "result" && currentRankRef.current && pyramidRef.current) {
      setTimeout(() => {
        currentRankRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [gameState]);
  useEffect(() => {
    if (gameState !== "result") return;
    playClearSound();
    const prevTotal = parseInt(localStorage.getItem("typing_total_points") || "0");
    localStorage.setItem("typing_total_points", prevTotal + Math.max(0, score));
  }, [gameState, score]);
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (gameState === "ready") {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        beginTypingPlay();
      }
      return;
    }
    if (gameState !== "playing") return;
    if (e.key === "Shift" || e.key === "Backspace" || e.key === "Tab" || e.key === "Enter") return;
    let key = e.key.toLowerCase();
    if (!/^[a-z0-9\-\,\.\?\!]$/.test(key)) {
      if (key === "\uFF12") key = "2";
      else if (key === "\uFF13") key = "3";
      else if (key === "\u3002") key = ".";
      else if (key === "\u3001") key = ",";
      else return;
    }
    const { remainingKana, altRemainingKana, currentInput } = currentText;
    const newInput = currentInput + key;
    const p1Patterns = getValidFirstPatterns(remainingKana);
    const p1Valid = p1Patterns.filter((p) => p.romaji.startsWith(newInput));
    const p2Patterns = altRemainingKana != null ? getValidFirstPatterns(altRemainingKana) : [];
    const p2Valid = p2Patterns.filter((p) => p.romaji.startsWith(newInput));
    if (p1Valid.length === 0 && p2Valid.length === 0) {
      initAudio();
      playMissSound();
      setScore((s) => s - 1);
      setMissCount((m) => m + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
    } else {
      initAudio();
      playCorrectSound();
      setScore((s) => s + 1);
      setCorrectCount((c) => c + 1);
      const pm1 = p1Valid.find((p) => p.romaji === newInput);
      const pm2 = p2Valid.find((p) => p.romaji === newInput);
      let newRemainingKana = p1Valid.length > 0 ? remainingKana : null;
      let newAltRemainingKana = p2Valid.length > 0 ? altRemainingKana : null;
      let newTypedRomaji = currentText.typedRomaji;
      let newCurrentInput = newInput;
      if (pm1 || pm2) {
        const pm = pm1 || pm2;
        newTypedRomaji = currentText.typedRomaji + pm.romaji;
        newCurrentInput = "";
        if (pm1 && newRemainingKana !== null) {
          newRemainingKana = remainingKana.slice(pm1.len);
        }
        if (pm2 && newAltRemainingKana !== null) {
          newAltRemainingKana = altRemainingKana.slice(pm2.len);
        }
      }
      if (newRemainingKana === "" || newAltRemainingKana === "") {
        setNextWord(words, 0);
      } else {
        if (newRemainingKana === null && newAltRemainingKana !== null) {
          newRemainingKana = newAltRemainingKana;
          newAltRemainingKana = null;
        }
        setCurrentText((prev) => __spreadProps(__spreadValues({}, prev), {
          remainingKana: newRemainingKana,
          altRemainingKana: newAltRemainingKana,
          typedRomaji: newTypedRomaji,
          currentInput: newCurrentInput
        }));
      }
    }
  }, [gameState, currentText, words, beginTypingPlay]);
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  const expectedRemainingRomaji = generateDefaultRomaji(currentText.remainingKana);
  let targetKey = "";
  if (currentText.remainingKana) {
    const patterns = getValidFirstPatterns(currentText.remainingKana);
    const validPatterns = patterns.filter((p) => p.romaji.startsWith(currentText.currentInput));
    if (validPatterns.length > 0) {
      targetKey = validPatterns[0].romaji[currentText.currentInput.length];
    }
  }
  const kanjiLength = currentText.kanji.length;
  let kanjiClass = "text-3xl sm:text-5xl";
  let kanaClass = "text-xl sm:text-2xl";
  let romajiClass = "text-2xl sm:text-4xl tracking-[0.1em] sm:tracking-[0.2em]";
  if (kanjiLength > 30) {
    kanjiClass = "text-base sm:text-xl";
    kanaClass = "text-xs sm:text-sm";
    romajiClass = "text-sm sm:text-lg tracking-normal sm:tracking-[0.1em]";
  } else if (kanjiLength > 20) {
    kanjiClass = "text-lg sm:text-2xl";
    kanaClass = "text-sm sm:text-base";
    romajiClass = "text-base sm:text-xl tracking-normal sm:tracking-[0.1em]";
  } else if (kanjiLength > 12) {
    kanjiClass = "text-xl sm:text-3xl";
    kanaClass = "text-base sm:text-xl";
    romajiClass = "text-lg sm:text-2xl tracking-[0.1em]";
  }
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-blue-50 flex items-center justify-center font-sans" }, /* @__PURE__ */ React.createElement("style", null, `
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-3px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink { animation: blink 1s infinite; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(191, 219, 254, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.7);
          border-radius: 4px;
        }
      `), /* @__PURE__ */ React.createElement("div", { className: `w-full max-w-4xl p-2 sm:p-6 bg-white rounded-3xl shadow-2xl relative ${isShaking ? "shake border-4 border-red-500" : "border-4 border-transparent"}` }, (gameState === "ready" || gameState === "playing") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center mb-4 sm:mb-6 bg-blue-100 p-3 sm:p-4 rounded-xl border-2 border-blue-200 relative z-30" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 sm:gap-6" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        window.location.href = "../index.html";
      },
      className: "bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg shadow transform transition hover:scale-105 text-xs sm:text-base focus:outline-none",
      tabIndex: "-1"
    },
    "\u25C0 \u30E1\u30CB\u30E5\u30FC\u3078"
  ), /* @__PURE__ */ React.createElement("div", { className: "text-xl sm:text-3xl font-black text-blue-800" }, "\u30B9\u30B3\u30A2: ", /* @__PURE__ */ React.createElement("span", { className: score < 0 ? "text-red-500" : "text-blue-600" }, score))), /* @__PURE__ */ React.createElement("div", { className: `text-2xl sm:text-4xl font-black ${gameState === "ready" ? "text-gray-400" : timeLeft <= 10 ? "text-red-600 animate-blink" : "text-green-600"}` }, "\u23F3 ", timeLeft, "\u79D2", gameState === "ready" ? /* @__PURE__ */ React.createElement("span", { className: "block text-xs sm:text-sm font-bold text-gray-500 mt-1" }, "\u30B9\u30BF\u30FC\u30C8\u307E\u3061") : null)), /* @__PURE__ */ React.createElement("div", { className: "relative" }, gameState === "ready" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-slate-900/45 backdrop-blur-[2px] cursor-pointer border-0 p-4",
      onClick: () => beginTypingPlay(),
      "aria-label": "\u30B9\u30DA\u30FC\u30B9\u30AD\u30FC\u307E\u305F\u306F\u30BF\u30C3\u30D7\u3067\u30B9\u30BF\u30FC\u30C8"
    },
    /* @__PURE__ */ React.createElement("span", { className: "text-white text-xl sm:text-3xl font-black text-center drop-shadow-md px-2" }, "\u30B9\u30DA\u30FC\u30B9\u30AD\u30FC\u3067\u30B9\u30BF\u30FC\u30C8"),
    /* @__PURE__ */ React.createElement("span", { className: "text-white/90 text-sm sm:text-base font-bold mt-3" }, "\uFF08\u30BF\u30C3\u30D7\u3067\u3082\u30B9\u30BF\u30FC\u30C8\u3067\u304D\u307E\u3059\uFF09")
  ), /* @__PURE__ */ React.createElement("div", { className: "bg-gray-50 rounded-2xl p-3 sm:p-6 text-center shadow-inner border border-gray-200 min-h-[150px] sm:min-h-[220px] flex flex-col justify-center items-center overflow-hidden w-full relative" }, /* @__PURE__ */ React.createElement("div", { className: `${kanaClass} font-bold text-gray-500 mb-1 sm:mb-2 tracking-widest break-all w-full leading-tight` }, currentText.kana), /* @__PURE__ */ React.createElement("div", { className: `${kanjiClass} font-black text-gray-800 mb-3 sm:mb-6 break-all w-full leading-snug` }, currentText.kanji), /* @__PURE__ */ React.createElement("div", { className: `${romajiClass} font-mono font-bold flex justify-center flex-wrap w-full` }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-300 break-all" }, currentText.typedRomaji + currentText.currentInput), expectedRemainingRomaji.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "break-all" }, /* @__PURE__ */ React.createElement("span", { className: "text-red-500 underline decoration-red-300 decoration-2 sm:decoration-4 underline-offset-4" }, targetKey || expectedRemainingRomaji[currentText.currentInput.length] || expectedRemainingRomaji[0]), /* @__PURE__ */ React.createElement("span", { className: "text-gray-800" }, expectedRemainingRomaji.slice(currentText.currentInput.length > 0 && expectedRemainingRomaji.startsWith(currentText.currentInput) ? currentText.currentInput.length + 1 : 1))))), /* @__PURE__ */ React.createElement(Keyboard, { targetKey }))), gameState === "result" && /* @__PURE__ */ React.createElement("div", { className: "text-center py-4 sm:py-8 flex flex-col items-center" }, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl sm:text-4xl font-black text-gray-800 mb-4" }, "\u30BF\u30A4\u30E0\u30A2\u30C3\u30D7\uFF01"), /* @__PURE__ */ React.createElement("div", { className: "bg-yellow-100 rounded-3xl p-4 sm:p-6 mb-6 inline-block shadow-lg border-4 border-yellow-300 w-full max-w-lg" }, /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold text-gray-600 mb-1" }, "\u3042\u306A\u305F\u306E\u30B9\u30B3\u30A2"), /* @__PURE__ */ React.createElement("p", { className: "text-5xl sm:text-6xl font-black text-blue-600 mb-4" }, score, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xl text-gray-600" }, "\u30DD\u30A4\u30F3\u30C8")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center gap-4 sm:gap-8 mb-4 text-sm sm:text-base font-bold bg-white/50 py-2 rounded-xl" }, /* @__PURE__ */ React.createElement("div", { className: "text-green-600" }, "\u6B63\u3057\u304F\u6253\u3063\u305F\u6570: ", /* @__PURE__ */ React.createElement("span", { className: "text-xl sm:text-2xl" }, correctCount), " \u56DE"), /* @__PURE__ */ React.createElement("div", { className: "text-red-500" }, "\u30DF\u30B9\u3057\u305F\u6570: ", /* @__PURE__ */ React.createElement("span", { className: "text-xl sm:text-2xl" }, missCount), " \u56DE")), /* @__PURE__ */ React.createElement("div", { className: "border-t-2 border-yellow-200 pt-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-lg font-bold text-gray-600 mb-1" }, "\u30E9\u30F3\u30AF"), /* @__PURE__ */ React.createElement("p", { className: "text-3xl sm:text-4xl font-black text-red-500 drop-shadow" }, getRank(score)))), /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-lg mb-6" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: pyramidRef,
      className: "bg-blue-50/80 p-2 sm:p-4 rounded-xl border-2 border-blue-200 h-[200px] sm:h-[260px] overflow-y-auto relative shadow-inner custom-scrollbar"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center space-y-1 w-full py-2" }, RANK_LIST.map((rank, index) => {
      const isCurrent = score >= rank.min && score <= rank.max;
      const widthPct = 40 + index / (RANK_LIST.length - 1) * 60;
      let rangeText = "";
      if (rank.min === 400) rangeText = "400\u301C";
      else if (rank.max === -1) rangeText = "\u30DE\u30A4\u30CA\u30B9";
      else if (rank.min === rank.max) rangeText = "0";
      else rangeText = `${rank.min}\u301C${rank.max}`;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: rank.name,
          ref: isCurrent ? currentRankRef : null,
          className: `flex items-center px-2 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-sm font-bold border transition-all ${isCurrent ? "bg-red-500 text-white border-red-600 scale-[1.02] shadow-md shadow-red-300 z-10" : "bg-white text-gray-600 border-gray-300 opacity-90"}`,
          style: { width: `${widthPct}%` }
        },
        /* @__PURE__ */ React.createElement("span", { className: `w-1/4 text-left ${isCurrent ? "text-red-100" : "text-gray-400"}` }, rangeText),
        /* @__PURE__ */ React.createElement("span", { className: "w-2/4 text-center truncate" }, rank.name),
        /* @__PURE__ */ React.createElement("span", { className: `w-1/4 text-right font-black ${isCurrent ? "text-yellow-300" : ""}` }, isCurrent ? "\u25C0 YOU" : "")
      );
    }))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => restartGame(),
      className: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 sm:py-4 sm:px-10 rounded-full shadow-lg transform transition hover:scale-105 text-lg sm:text-xl"
    },
    "\u3082\u3046\u3044\u3061\u3069\u3042\u305D\u3076"
  )))));
}
function TokkunDrillApp() {
  const cfg = window.TOKKUN_DRILL_CONFIG || { key: "f", total: 20, titleKanji: "", titleSub: "", backHref: "index.html" };
  const drillMode = cfg.kana || Array.isArray(cfg.words) && cfg.words.length > 0 ? "kana" : cfg.pattern ? "sequence" : "single";
  const kanaWordsMode = Array.isArray(cfg.words) && cfg.words.length > 0;
  const pattern = String(cfg.pattern || "").toLowerCase();
  const targetKeySingle = String(cfg.key || "f").toLowerCase();
  const total = drillMode === "kana" ? kanaWordsMode ? cfg.words.reduce((s, w) => s + (w.kana || "").length, 0) : (cfg.kana || "").length : drillMode === "sequence" ? pattern.length : Math.max(1, Number(cfg.total) || 20);
  const levelNum = cfg.level != null ? Number(cfg.level) : NaN;
  const nextLevelHref = (() => {
    if (cfg.nextHref === false) return null;
    if (typeof cfg.nextHref === "string" && cfg.nextHref.length > 0) return cfg.nextHref;
    if (!Number.isFinite(levelNum) || levelNum < 1 || levelNum >= 70) return null;
    return `level${String(levelNum + 1).padStart(2, "0")}.html`;
  })();
  const isBoss = !!cfg.boss;
  const timeLimitSec = Number(cfg.timeLimitSec) > 0 ? Number(cfg.timeLimitSec) : 0;
  const bossSuccessMsg = cfg.bossSuccessMsg != null ? cfg.bossSuccessMsg : "\u304A\u4E3B\u3084\u308B\u306A\u3041";
  const bossFailMsg = cfg.bossFailMsg != null ? cfg.bossFailMsg : "\u307E\u3060\u307E\u3060\u3058\u3083\u306A";
  const [gameState, setGameState] = useState("ready");
  const [progress, setProgress] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [hintMsg, setHintMsg] = useState("");
  const [burstFragments, setBurstFragments] = useState([]);
  const fragClearRef = useRef(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() => {
    const c = typeof window !== "undefined" ? window.TOKKUN_DRILL_CONFIG : null;
    const t = c && c.timeLimitSec != null ? Number(c.timeLimitSec) : 0;
    return t > 0 ? t : null;
  });
  const [kanaState, setKanaState] = useState(() => {
    const c = typeof window !== "undefined" ? window.TOKKUN_DRILL_CONFIG : null;
    if (c && Array.isArray(c.words) && c.words.length) {
      return { remainingKana: c.words[0].kana || "", currentInput: "", typedRomaji: "" };
    }
    return {
      remainingKana: c && c.kana ? c.kana : "",
      currentInput: "",
      typedRomaji: ""
    };
  });
  const restartGame = useCallback(() => {
    initAudio();
    setProgress(0);
    setWordIndex(0);
    setMissCount(0);
    setGameState("ready");
    setHintMsg("");
    setBurstFragments([]);
    if (fragClearRef.current) {
      clearTimeout(fragClearRef.current);
      fragClearRef.current = null;
    }
    const firstKana = Array.isArray(cfg.words) && cfg.words.length ? cfg.words[0].kana || "" : cfg.kana || "";
    setKanaState({
      remainingKana: firstKana,
      currentInput: "",
      typedRomaji: ""
    });
    setTimeLeft(timeLimitSec > 0 ? timeLimitSec : null);
  }, [cfg.kana, cfg.words, timeLimitSec]);
  const beginDrillPlay = useCallback(() => {
    initAudio();
    setGameState("playing");
  }, []);
  useEffect(() => () => {
    if (fragClearRef.current) clearTimeout(fragClearRef.current);
  }, []);
  useEffect(() => {
    if (gameState !== "playing" || !timeLimitSec) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev == null || prev <= 0) return prev;
        const n = prev - 1;
        if (n <= 0) {
          setGameState("bossTimeout");
          return 0;
        }
        return n;
      });
    }, 1e3);
    return () => clearInterval(id);
  }, [gameState, timeLimitSec]);
  useEffect(() => {
    if (gameState !== "bossTimeout") return;
    initAudio();
    playMissSound();
  }, [gameState]);
  const spawnBurstFragments = useCallback((burstChar) => {
    const ch = String(burstChar || "f").toLowerCase();
    const ts = Date.now();
    const count = 14;
    const parts = Array.from({ length: count }, (_, i) => {
      const a = i / count * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const d = 48 + Math.random() * 92;
      return {
        id: `${ts}-${i}`,
        tx: Math.cos(a) * d,
        ty: Math.sin(a) * d,
        rot: (Math.random() - 0.5) * 240,
        s: 0.32 + Math.random() * 0.42,
        hue: i % 3 === 0 ? "#ef4444" : i % 3 === 1 ? "#f97316" : "#eab308"
      };
    });
    setBurstFragments(parts);
    if (fragClearRef.current) clearTimeout(fragClearRef.current);
    fragClearRef.current = setTimeout(() => {
      setBurstFragments([]);
      fragClearRef.current = null;
    }, 720);
  }, []);
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (gameState === "ready") {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        beginDrillPlay();
      }
      return;
    }
    if (gameState !== "playing") return;
    if (e.key === "Shift" || e.key === "Backspace" || e.key === "Tab" || e.key === "Enter") return;
    let key = e.key.toLowerCase();
    if (drillMode === "kana") {
      if (!/^[a-z0-9\-\,\.\?\!]$/.test(key)) {
        if (key === "\uFF12") key = "2";
        else if (key === "\uFF13") key = "3";
        else if (key === "\u3002") key = ".";
        else if (key === "\u3001") key = ",";
        else return;
      }
      const { remainingKana, currentInput } = kanaState;
      const newInput = currentInput + key;
      const patterns = getValidFirstPatterns(remainingKana);
      const validPatterns = patterns.filter((p) => p.romaji.startsWith(newInput));
      if (validPatterns.length > 0) {
        initAudio();
        const perfectMatch = validPatterns.find((p) => p.romaji === newInput);
        const willLevelClear = perfectMatch && remainingKana.slice(perfectMatch.len).length === 0 && !(kanaWordsMode && wordIndex < cfg.words.length - 1);
        if (willLevelClear) playClearSound();
        else playCorrectSound();
        setHintMsg("");
        if (perfectMatch) {
          const newRemaining = remainingKana.slice(perfectMatch.len);
          if (newRemaining.length === 0) {
            if (kanaWordsMode && wordIndex < cfg.words.length - 1) {
              const wi = wordIndex + 1;
              setWordIndex(wi);
              setKanaState({
                remainingKana: cfg.words[wi].kana || "",
                currentInput: "",
                typedRomaji: ""
              });
            } else {
              setKanaState((prev) => __spreadProps(__spreadValues({}, prev), {
                remainingKana: "",
                typedRomaji: prev.typedRomaji + perfectMatch.romaji,
                currentInput: ""
              }));
              setGameState("result");
            }
          } else {
            setKanaState((prev) => __spreadProps(__spreadValues({}, prev), {
              remainingKana: newRemaining,
              typedRomaji: prev.typedRomaji + perfectMatch.romaji,
              currentInput: ""
            }));
          }
        } else {
          setKanaState((prev) => __spreadProps(__spreadValues({}, prev), {
            currentInput: newInput
          }));
        }
      } else {
        initAudio();
        playMissSound();
        setMissCount((m) => m + 1);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 200);
        setHintMsg("");
      }
      return;
    }
    if (drillMode === "sequence") {
      if (key.length !== 1 || !/^[a-z0-9\-]$/.test(key)) return;
    } else if (key.length !== 1 || !/^[a-z0-9]$/.test(key)) return;
    if (drillMode === "sequence") {
      const expect = pattern[progress];
      if (key === expect) {
        initAudio();
        if (progress + 1 >= total) playClearSound();
        else playCorrectSound();
        setHintMsg("");
        spawnBurstFragments(expect);
        setProgress((p) => {
          const next = p + 1;
          if (next >= total) setGameState("result");
          return next;
        });
      } else {
        initAudio();
        playMissSound();
        setMissCount((m) => m + 1);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 200);
        setHintMsg(cfg.hintWrong || "\u3064\u304E\u306E \u30AD\u30FC\u3092 \u304A\u3057\u3066\u306D");
      }
      return;
    }
    if (key === targetKeySingle) {
      initAudio();
      if (progress + 1 >= total) playClearSound();
      else playCorrectSound();
      setHintMsg("");
      spawnBurstFragments(targetKeySingle);
      setProgress((p) => {
        const next = p + 1;
        if (next >= total) setGameState("result");
        return next;
      });
    } else {
      initAudio();
      playMissSound();
      setMissCount((m) => m + 1);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
      setHintMsg(cfg.hintWrong || "F\u30AD\u30FC\u3060\u3088\u3002\u3086\u3063\u304F\u308A\u3067 \u3060\u3044\u3058\u3087\u3046\u3076\uFF01");
    }
  }, [gameState, drillMode, pattern, progress, total, cfg.hintWrong, spawnBurstFragments, kanaState, targetKeySingle, kanaWordsMode, wordIndex, cfg.words, beginDrillPlay]);
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  useEffect(() => {
    if (gameState !== "result") return;
    const lvl = cfg.level;
    if (lvl == null) return;
    if (window.TokkunStorage && typeof window.TokkunStorage.setLevelCleared === "function") {
      window.TokkunStorage.setLevelCleared(lvl);
    }
  }, [gameState, cfg.level]);
  useEffect(() => {
    if (gameState !== "result" && gameState !== "bossTimeout") return;
    const onResultShortcut = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if (k !== "f" && k !== "j") return;
      if (k === "f") {
        e.preventDefault();
        restartGame();
        return;
      }
      if (k === "j" && nextLevelHref && gameState === "result") {
        e.preventDefault();
        window.location.href = nextLevelHref;
      }
    };
    window.addEventListener("keydown", onResultShortcut);
    return () => window.removeEventListener("keydown", onResultShortcut);
  }, [gameState, nextLevelHref, restartGame]);
  const remain = drillMode === "kana" ? kanaWordsMode ? kanaState.remainingKana.length + (cfg.words || []).slice(wordIndex + 1).reduce((s, w) => s + (w.kana || "").length, 0) : kanaState.remainingKana.length : Math.max(0, total - progress);
  const seqCurrent = drillMode === "sequence" && progress < pattern.length ? pattern[progress] : "";
  const queueCellChar = (i) => drillMode === "sequence" ? pattern[i] : targetKeySingle;
  let keyboardTarget = "";
  if (drillMode === "kana" && kanaState.remainingKana) {
    const patterns = getValidFirstPatterns(kanaState.remainingKana);
    const validPatterns = patterns.filter((p) => p.romaji.startsWith(kanaState.currentInput));
    if (validPatterns.length > 0) {
      const r = validPatterns[0].romaji;
      keyboardTarget = r[kanaState.currentInput.length] || "";
    }
  } else if (drillMode === "sequence") {
    keyboardTarget = seqCurrent;
  } else {
    keyboardTarget = targetKeySingle;
  }
  let kanaRomajiTail = null;
  if (drillMode === "kana" && kanaState.remainingKana) {
    const patterns = getValidFirstPatterns(kanaState.remainingKana);
    const validPatterns = patterns.filter((p) => p.romaji.startsWith(kanaState.currentInput));
    if (validPatterns.length > 0) {
      const fullFirst = validPatterns[0].romaji;
      const restAfterFirst = fullFirst.slice(kanaState.currentInput.length);
      const restOfWhole = generateDefaultRomaji(kanaState.remainingKana).slice(fullFirst.length);
      kanaRomajiTail = { restAfterFirst, restOfWhole };
    }
  }
  return /* @__PURE__ */ React.createElement("div", { className: `min-h-[100dvh] flex items-start justify-center py-2 sm:py-4 font-sans relative overflow-x-hidden ${isBoss ? "bg-gradient-to-b from-slate-950 via-violet-950 to-black" : "bg-blue-50"}` }, isBoss && /* @__PURE__ */ React.createElement("div", { className: "pointer-events-none fixed inset-0 z-0", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,#4c1d95_0%,transparent_55%)] opacity-70" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,#1e1b4b_0%,transparent_45%)] opacity-90" }), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black via-black/50 to-transparent" }), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-6 right-4 sm:right-10 flex flex-col items-center gap-1 tokkun-demon-float" }, /* @__PURE__ */ React.createElement("span", { className: "text-7xl sm:text-8xl drop-shadow-[0_0_24px_rgba(168,85,247,0.8)]", role: "img", "aria-label": "\u30BF\u30A4\u30D4\u30F3\u30B0\u9B54\u4EBA" }, "\u{1F479}"), /* @__PURE__ */ React.createElement("span", { className: "text-xs sm:text-sm font-black text-purple-300/90 tracking-widest" }, "\u30BF\u30A4\u30D4\u30F3\u30B0\u9B54\u4EBA")), /* @__PURE__ */ React.createElement("div", { className: "absolute top-16 left-2 sm:left-8 text-5xl sm:text-6xl font-black text-violet-900/40 rotate-[-8deg] select-none" }, "\u2026")), /* @__PURE__ */ React.createElement("style", null, `
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-3px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes tokkun-core-burst {
          0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0 transparent); }
          18% { transform: scale(0.42) rotate(-8deg); filter: drop-shadow(0 0 14px #f97316) drop-shadow(0 0 28px #fbbf24); }
          50% { transform: scale(1.22) rotate(4deg); filter: drop-shadow(0 0 24px #fde047) drop-shadow(0 0 40px #fb923c); }
          100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0 transparent); }
        }
        .tokkun-core-burst {
          display: inline-block;
          transform-origin: center center;
          animation: tokkun-core-burst 0.58s cubic-bezier(0.34, 1.45, 0.64, 1);
        }

        @keyframes tokkun-ring-pop {
          0% { transform: translate(-50%, -50%) scale(0.35); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(2.35); opacity: 0; }
        }
        .tokkun-burst-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 7rem;
          height: 7rem;
          margin-left: 0;
          margin-top: 0;
          border-radius: 9999px;
          border: 5px solid rgba(251, 146, 60, 0.85);
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.7), inset 0 0 20px rgba(254, 243, 199, 0.5);
          pointer-events: none;
          animation: tokkun-ring-pop 0.55s ease-out forwards;
        }

        @keyframes tokkun-frag-fly {
          0% {
            transform: translate(-50%, -50%) scale(var(--frag-s, 0.9)) rotate(0deg);
            opacity: 1;
          }
          25% { opacity: 1; }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.12) rotate(var(--rot));
            opacity: 0;
          }
        }
        .tokkun-frag {
          position: absolute;
          left: 50%;
          top: 50%;
          font-family: ui-monospace, monospace;
          font-weight: 900;
          pointer-events: none;
          animation: tokkun-frag-fly 0.68s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.9), 0 0 18px rgba(248, 113, 113, 0.6);
        }

        .tokkun-queue-track {
          transition: transform 0.38s cubic-bezier(0.34, 1.25, 0.64, 1);
        }

        @keyframes tokkun-demon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .tokkun-demon-float { animation: tokkun-demon-float 2.8s ease-in-out infinite; }
      `), /* @__PURE__ */ React.createElement("div", { className: `w-full max-w-4xl p-2 sm:p-4 rounded-3xl shadow-2xl relative z-10 ${isBoss ? "bg-gray-100 border-4 border-purple-900 shadow-[0_0_48px_rgba(76,29,149,0.55)]" : "bg-white"} ${isShaking ? "shake border-4 border-red-500" : isBoss ? "" : "border-4 border-transparent"}` }, (gameState === "ready" || gameState === "playing") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: `flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2 sm:mb-3 p-3 sm:p-4 rounded-xl border-2 relative z-30 ${isBoss ? "bg-slate-900/90 border-purple-700" : "bg-blue-100 border-blue-200"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-3 sm:gap-6" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        window.location.href = cfg.backHref || "index.html";
      },
      className: "bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg shadow transform transition hover:scale-105 text-xs sm:text-base focus:outline-none",
      tabIndex: "-1"
    },
    "\u25C0 \u30E1\u30CB\u30E5\u30FC\u3078"
  ), /* @__PURE__ */ React.createElement("div", { className: `text-base sm:text-2xl font-black ${isBoss ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" : "text-blue-800"}` }, drillMode === "kana" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "\u3042\u3068 ", /* @__PURE__ */ React.createElement("span", { className: isBoss ? "text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" : "text-blue-600" }, remain), " \u3082\u3058") : /* @__PURE__ */ React.createElement(React.Fragment, null, "\u30AF\u30EA\u30A2\u307E\u3067 \u3042\u3068 ", /* @__PURE__ */ React.createElement("span", { className: isBoss ? "text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]" : "text-blue-600" }, remain), " \u304B\u3044"))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-end gap-3 sm:gap-4" }, timeLeft != null && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `text-xl sm:text-3xl font-black tabular-nums ${gameState === "ready" ? isBoss ? "text-zinc-500" : "text-gray-400" : isBoss ? timeLeft <= 3 ? "text-red-400 animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" : "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]" : timeLeft <= 3 ? "text-red-600 animate-pulse" : "text-green-600"}`,
      "aria-live": "polite"
    },
    "\u23F1 ",
    timeLeft,
    " \u3073\u3087\u3046",
    gameState === "ready" ? /* @__PURE__ */ React.createElement("span", { className: "block text-xs sm:text-sm font-bold mt-1 text-center opacity-90" }, "\u30B9\u30BF\u30FC\u30C8\u307E\u3061") : null
  ), /* @__PURE__ */ React.createElement("div", { className: `text-base sm:text-xl font-bold ${isBoss ? "text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : "text-gray-600"}` }, "\u30DF\u30B9: ", /* @__PURE__ */ React.createElement("span", { className: missCount > 0 ? "text-orange-400" : isBoss ? "text-zinc-200" : "text-gray-400" }, missCount), " \u304B\u3044"))), /* @__PURE__ */ React.createElement("div", { className: `mb-1 text-center ${isBoss ? "rounded-2xl bg-black/25 px-3 py-2 sm:py-3 border border-purple-500/40" : ""}` }, /* @__PURE__ */ React.createElement("p", { className: `text-sm sm:text-base font-bold ${isBoss ? "text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" : "text-amber-800"}` }, "70\u306E\u3068\u3063\u304F\u3093 \xB7 \u30EC\u30D9\u30EB", Number.isFinite(levelNum) ? levelNum : "\uFF1F"), /* @__PURE__ */ React.createElement("h1", { className: `text-lg sm:text-2xl font-black leading-tight px-1 ${isBoss ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]" : "text-gray-800"}` }, cfg.titleKanji)), /* @__PURE__ */ React.createElement("div", { className: "relative" }, gameState === "ready" && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: `absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border-0 p-4 cursor-pointer ${isBoss ? "bg-violet-950/55 backdrop-blur-sm" : "bg-slate-900/45 backdrop-blur-[2px]"}`,
      onClick: () => beginDrillPlay(),
      "aria-label": "\u30B9\u30DA\u30FC\u30B9\u30AD\u30FC\u307E\u305F\u306F\u30BF\u30C3\u30D7\u3067\u30B9\u30BF\u30FC\u30C8"
    },
    /* @__PURE__ */ React.createElement("span", { className: `text-xl sm:text-3xl font-black text-center drop-shadow-md px-2 ${isBoss ? "text-amber-100" : "text-white"}` }, "\u30B9\u30DA\u30FC\u30B9\u30AD\u30FC\u3067\u30B9\u30BF\u30FC\u30C8"),
    /* @__PURE__ */ React.createElement("span", { className: `text-sm sm:text-base font-bold mt-3 ${isBoss ? "text-purple-200" : "text-white/90"}` }, "\uFF08\u30BF\u30C3\u30D7\u3067\u3082\u30B9\u30BF\u30FC\u30C8\u3067\u304D\u307E\u3059\uFF09")
  ), /* @__PURE__ */ React.createElement("div", { className: `rounded-2xl p-3 sm:p-5 text-center shadow-inner min-h-0 sm:min-h-[140px] flex flex-col justify-center items-center overflow-visible ${isBoss ? "bg-slate-900/50 border-2 border-purple-800/80 shadow-[inset_0_0_24px_rgba(0,0,0,0.35)]" : "bg-gray-50 border border-gray-200"}` }, drillMode === "kana" && kanaWordsMode ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 font-bold mb-3" }, "\u30ED\u30FC\u30DE\u5B57\u3067 \u3072\u3089\u304C\u306A\u3092 \u3046\u3063\u3066\u306D\uFF08\u534A\u89D2\uFF09"), cfg.words[wordIndex] ? /* @__PURE__ */ React.createElement("p", { className: "text-xl sm:text-2xl font-black text-gray-800 mb-4 px-1" }, cfg.words[wordIndex].kanji, "\uFF08", cfg.words[wordIndex].kana, "\uFF09") : null, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 bg-white rounded-xl border-2 border-gray-300 shadow-inner p-5 sm:p-8 text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl sm:text-6xl font-black text-gray-800 mb-5 sm:mb-6 tracking-wide break-all" }, cfg.words[wordIndex] ? cfg.words[wordIndex].kana : ""), /* @__PURE__ */ React.createElement("div", { className: "text-xl sm:text-3xl font-mono font-bold flex flex-wrap justify-center break-all border-t-2 border-dashed border-gray-200 pt-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, kanaState.typedRomaji), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, kanaState.currentInput), kanaRomajiTail && kanaRomajiTail.restAfterFirst.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-red-500 underline decoration-2 underline-offset-4" }, kanaRomajiTail.restAfterFirst[0]), /* @__PURE__ */ React.createElement("span", { className: "text-gray-800" }, kanaRomajiTail.restAfterFirst.slice(1))), kanaRomajiTail && /* @__PURE__ */ React.createElement("span", { className: "text-gray-800" }, kanaRomajiTail.restOfWhole))), wordIndex + 1 < cfg.words.length ? /* @__PURE__ */ React.createElement("div", { className: "w-full sm:w-48 flex-shrink-0 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/90 p-4 flex flex-col justify-center text-center shadow-sm" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-amber-800 mb-2" }, "\u3064\u304E\u306E \u305F\u3093\u3054"), /* @__PURE__ */ React.createElement("p", { className: "text-lg sm:text-xl font-black text-gray-800 leading-tight" }, cfg.words[wordIndex + 1].kanji, "\uFF08", cfg.words[wordIndex + 1].kana, "\uFF09")) : null)) : drillMode === "kana" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500 font-bold mb-3" }, "\u30ED\u30FC\u30DE\u5B57\u3067 \u3072\u3089\u304C\u306A\u3092 \u3046\u3063\u3066\u306D\uFF08\u534A\u89D2\uFF09"), cfg.kanjiDisplay ? /* @__PURE__ */ React.createElement("p", { className: "text-base sm:text-lg font-bold text-gray-800 mb-4 px-1 leading-relaxed" }, cfg.kanjiDisplay) : null, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-3xl mx-auto bg-white/90 rounded-xl border-2 border-gray-200 p-4 sm:p-6 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-2xl sm:text-4xl font-black text-gray-700 mb-4 break-all leading-relaxed tracking-wide" }, kanaState.remainingKana || "\u3000"), /* @__PURE__ */ React.createElement("div", { className: "text-lg sm:text-2xl font-mono font-bold flex flex-wrap justify-center break-all" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-400" }, kanaState.typedRomaji), /* @__PURE__ */ React.createElement("span", { className: "text-gray-500" }, kanaState.currentInput), kanaRomajiTail && kanaRomajiTail.restAfterFirst.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-red-500 underline decoration-2 underline-offset-4" }, kanaRomajiTail.restAfterFirst[0]), /* @__PURE__ */ React.createElement("span", { className: "text-gray-800" }, kanaRomajiTail.restAfterFirst.slice(1))), kanaRomajiTail && /* @__PURE__ */ React.createElement("span", { className: "text-gray-800" }, kanaRomajiTail.restOfWhole)))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: `w-full max-w-3xl mx-auto overflow-hidden rounded-xl border-2 border-dashed py-3 sm:py-4 pl-2 sm:pl-4 pr-1 ${isBoss ? "border-purple-600/70 bg-slate-900/40" : "border-gray-200 bg-white/80"}` }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "tokkun-queue-track flex items-end gap-2",
      style: {
        transform: `translateX(calc(-1 * ${progress} * (3.5rem + 0.5rem)))`
      }
    },
    Array.from({ length: total }).map((_, i) => {
      const ch = queueCellChar(i);
      const done = i < progress;
      const current = i === progress;
      const waiting = i > progress;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: i,
          className: "w-14 flex-shrink-0 flex flex-col justify-end items-center relative overflow-visible min-h-[5rem] sm:min-h-[6.5rem]"
        },
        done && /* @__PURE__ */ React.createElement("span", { className: "text-green-500 text-2xl sm:text-3xl font-black leading-none pb-1", "aria-hidden": "true" }, "\u2713"),
        current && /* @__PURE__ */ React.createElement(React.Fragment, null, progress > 0 && /* @__PURE__ */ React.createElement("div", { key: progress, className: "tokkun-burst-ring", "aria-hidden": "true" }), burstFragments.map((f) => /* @__PURE__ */ React.createElement(
          "span",
          {
            key: f.id,
            className: "tokkun-frag text-lg sm:text-xl z-[20]",
            style: {
              color: f.hue,
              "--tx": `${f.tx}px`,
              "--ty": `${f.ty}px`,
              "--rot": `${f.rot}deg`,
              "--frag-s": f.s
            }
          },
          ch
        )), /* @__PURE__ */ React.createElement("div", { className: "text-5xl sm:text-7xl font-mono font-black relative z-[10] leading-none" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            key: progress,
            className: `text-red-500 underline decoration-red-300 decoration-2 sm:decoration-4 underline-offset-4 sm:underline-offset-8 inline-block ${progress > 0 ? "tokkun-core-burst" : ""}`
          },
          ch
        ))),
        waiting && /* @__PURE__ */ React.createElement("span", { className: `text-2xl sm:text-4xl font-mono font-black select-none leading-none pb-1 ${isBoss ? "text-slate-300" : "text-slate-400"}` }, ch)
      );
    })
  ))), hintMsg ? /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-base sm:text-lg font-bold text-orange-600 animate-pulse" }, hintMsg) : /* @__PURE__ */ React.createElement("p", { className: `mt-3 text-sm font-bold ${isBoss ? "text-purple-300/90" : "text-gray-400"}` }, drillMode === "kana" ? "\u30ED\u30FC\u30DE\u5B57\u306E \u30EB\u30FC\u30EB\u306B \u3057\u305F\u304C\u3063\u3066 \u3046\u3063\u3066\u306D" : cfg.fingerHint || `\u3044\u307E\u306E\u30AD\u30FC\u306F ${drillMode === "sequence" ? seqCurrent : targetKeySingle}`)), /* @__PURE__ */ React.createElement(Keyboard, { targetKey: keyboardTarget }))), gameState === "result" && /* @__PURE__ */ React.createElement("div", { className: "text-center py-6 sm:py-10 flex flex-col items-center px-2" }, isBoss && /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-lg flex flex-row justify-end items-end gap-3 mb-4 px-1" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gray-900 text-amber-100 px-4 py-3 rounded-2xl rounded-br-sm border-2 border-purple-600 shadow-lg text-base sm:text-lg font-bold max-w-[85%]" }, bossSuccessMsg), /* @__PURE__ */ React.createElement("span", { className: "text-5xl sm:text-6xl shrink-0", "aria-hidden": "true" }, "\u{1F479}")), /* @__PURE__ */ React.createElement("p", { className: "text-5xl sm:text-6xl mb-2" }, "\u{1F389}"), /* @__PURE__ */ React.createElement("h2", { className: `text-2xl sm:text-4xl font-black mb-2 ${isBoss ? "text-amber-300" : "text-blue-600"}` }, "\u30AF\u30EA\u30A2\uFF01"), /* @__PURE__ */ React.createElement("p", { className: `font-bold mb-6 text-base sm:text-lg ${isBoss ? "text-purple-100" : "text-gray-700"}` }, drillMode === "kana" ? "\u304B\u306A\u3092 \u30AF\u30EA\u30A2\u3067\u304D\u305F\u306D\uFF01" : drillMode === "sequence" ? "\u3082\u3093\u3060\u3044\u3092 \u30AF\u30EA\u30A2\u3067\u304D\u305F\u306D\uFF01" : `${targetKeySingle.toUpperCase()} \u3092 ${total} \u304B\u3044 \u3067\u304D\u305F\u306D\uFF01`), missCount > 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-sm sm:text-base text-gray-500 mb-6" }, "\u30DF\u30B9\u306F ", missCount, " \u304B\u3044\u3002\u3064\u304E\u306F \u3082\u3063\u3068 \u30B9\u30E0\u30FC\u30BA\u306B \u3044\u3051\u308B\u3088\uFF01") : /* @__PURE__ */ React.createElement("p", { className: "text-sm sm:text-base text-green-600 font-bold mb-6" }, "\u30DF\u30B9 \u30BC\u30ED\uFF01 \u3059\u3070\u3089\u3057\u3044\uFF01"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3 w-full max-w-lg justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: restartGame,
      className: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
    },
    "\u3082\u3046\u4E00\u5EA6"
  ), nextLevelHref ? /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        window.location.href = nextLevelHref;
      },
      className: "bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
    },
    "\u6B21\u3078"
  ) : null, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        window.location.href = cfg.backHref || "index.html";
      },
      className: "bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
    },
    "\u30B9\u30C6\u30FC\u30B8\u3092\u9078\u3076"
  ))), /* @__PURE__ */ React.createElement("p", { className: "mt-6 text-sm sm:text-base text-gray-500 font-bold leading-relaxed px-2" }, "\u2328\uFE0F \u30AD\u30FC\u30DC\u30FC\u30C9\u3067\u3082\uFF1A ", /* @__PURE__ */ React.createElement("span", { className: "text-blue-600" }, "F"), "\uFF1D\u3082\u3046\u4E00\u5EA6", nextLevelHref ? /* @__PURE__ */ React.createElement(React.Fragment, null, "\u3000/\u3000", /* @__PURE__ */ React.createElement("span", { className: "text-green-600" }, "J"), "\uFF1D\u6B21\u3078") : /* @__PURE__ */ React.createElement(React.Fragment, null, "\uFF08\u3064\u304E\u306E\u30B9\u30C6\u30FC\u30B8\u304C\u306A\u3044\u3068\u304D\u306F J \u306F \u3064\u304B\u3048\u307E\u305B\u3093\uFF09"))), gameState === "bossTimeout" && /* @__PURE__ */ React.createElement("div", { className: "text-center py-8 sm:py-10 flex flex-col items-center px-3" }, isBoss && /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-lg flex flex-row justify-end items-end gap-3 mb-6 px-1" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gray-900 text-red-200 px-4 py-3 rounded-2xl rounded-br-sm border-2 border-red-500/60 shadow-lg text-base sm:text-lg font-bold max-w-[85%] text-left" }, bossFailMsg), /* @__PURE__ */ React.createElement("span", { className: "text-5xl sm:text-6xl shrink-0", "aria-hidden": "true" }, "\u{1F479}")), /* @__PURE__ */ React.createElement("h2", { className: `text-2xl sm:text-4xl font-black mb-3 ${isBoss ? "text-red-300" : "text-red-600"}` }, "\u3058\u304B\u3093\u304E\u308C"), isBoss ? /* @__PURE__ */ React.createElement("p", { className: "text-purple-200 font-bold mb-6 text-sm sm:text-base" }, timeLimitSec, "\u3073\u3087\u3046\u3092 \u3053\u3048\u305F\u3088\u3002\u3082\u3046\u3044\u3061\u3069\uFF01") : /* @__PURE__ */ React.createElement("p", { className: "text-gray-700 font-bold mb-6 text-sm sm:text-base" }, "\u3058\u304B\u3093\u306A\u3044\u3067 \u304A\u308F\u3089\u306A\u304B\u3063\u305F\u306D\u3002\u3082\u3046\u3044\u3061\u3069\uFF01"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3 w-full max-w-lg justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: restartGame,
      className: "bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
    },
    "\u3082\u3046\u4E00\u5EA6"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        window.location.href = cfg.backHref || "index.html";
      },
      className: "bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
    },
    "\u30B9\u30C6\u30FC\u30B8\u3092\u9078\u3076"
  )), /* @__PURE__ */ React.createElement("p", { className: "mt-6 text-sm sm:text-base text-gray-500 font-bold leading-relaxed px-2" }, "\u2328\uFE0F ", /* @__PURE__ */ React.createElement("span", { className: "text-blue-600" }, "F"), "\uFF1D\u3082\u3046\u4E00\u5EA6"))));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
if (window.TOKKUN_DRILL_CONFIG) {
  root.render(/* @__PURE__ */ React.createElement(TokkunDrillApp, null));
} else {
  root.render(/* @__PURE__ */ React.createElement(App, null));
}
