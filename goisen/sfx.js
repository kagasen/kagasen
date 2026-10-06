(function () {
  'use strict';

  var Ctor = window.AudioContext || window.webkitAudioContext;
  var ctx = null, unlocked = false, muted = false;
  var dry, wet, sfxBus, bgmBus, duckBus, noiseBuffer;
  var seed = 91731, lastTick = -1, bgmVolume = 1;
  var requestedTrack = null, activeTrack = null, timer = null, duckUntil = 0;

  function random() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function hidden() { return typeof document !== 'undefined' && document.hidden; }
  function setup() {
    if (ctx || !Ctor) return ctx;
    try {
      ctx = new Ctor();
      var compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;
      compressor.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = muted ? 0 : 0.48;
      sfxBus.connect(compressor);
      bgmBus = ctx.createGain();
      bgmBus.gain.value = muted ? 0 : 0.18 * bgmVolume;
      duckBus = ctx.createGain();
      duckBus.gain.value = 1;
      duckBus.connect(bgmBus);
      bgmBus.connect(compressor);
      dry = ctx.createGain();
      wet = ctx.createGain();
      wet.gain.value = 0.12;
      dry.connect(sfxBus);
      var reverb = ctx.createConvolver();
      var impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 0.43), ctx.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var data = impulse.getChannelData(ch);
        for (var i = 0; i < data.length; i++) {
          data[i] = (random() * 2 - 1) * Math.pow(1 - i / data.length, 2.7) * 0.25;
        }
      }
      reverb.buffer = impulse;
      wet.connect(reverb);
      reverb.connect(sfxBus);
      noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.72), ctx.sampleRate);
      var samples = noiseBuffer.getChannelData(0);
      for (var n = 0; n < samples.length; n++) samples[n] = random() * 2 - 1;
      return ctx;
    } catch (e) { ctx = null; return null; }
  }
  function resume() {
    if (!ctx || hidden() || ctx.state !== 'suspended') return;
    try {
      var p = ctx.resume();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function run(fn) {
    if (!unlocked || muted || hidden()) return;
    try {
      if (!setup()) return;
      resume();
      fn(ctx.currentTime + 0.012);
    } catch (e) {}
  }
  function envelope(node, t, peak, attack, decay) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(0.002, attack));
    node.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function tone(t, hz, duration, volume, wave, destination, bend, attack) {
    var osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = wave || 'sine';
    osc.frequency.setValueAtTime(hz, t);
    if (bend) osc.frequency.exponentialRampToValueAtTime(Math.max(30, hz * bend), t + duration);
    attack = attack || Math.min(0.012, duration * 0.12);
    envelope(amp, t, volume, attack, Math.max(0.02, duration - attack));
    osc.connect(amp);
    amp.connect(destination || dry);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
  function noise(t, duration, low, high, volume, sweep, destination) {
    if (!noiseBuffer) return;
    var src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), amp = ctx.createGain();
    src.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(sweep ? low : (low + high) / 2, t);
    if (sweep) filter.frequency.exponentialRampToValueAtTime(high, t + duration);
    var attack = Math.min(0.012, duration * 0.17);
    envelope(amp, t, volume, attack, duration);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(destination || dry);
    src.start(t, random() * 0.08);
    src.stop(t + attack + duration + 0.015);
  }
  function pluck(t, hz, volume, duration) {
    duration = duration || 0.24;
    tone(t, hz, duration, volume, 'triangle', dry, 0.995);
    tone(t, hz * 2.01, duration * 0.55, volume * 0.18, 'sine', dry);
    tone(t, hz * 3.98, duration * 0.32, volume * 0.07, 'sine', wet);
    noise(t, 0.018, 2300, 7200, volume * 0.12);
  }
  function bell(t, hz, volume, duration) {
    tone(t, hz, duration, volume * 0.62, 'sine', dry);
    tone(t, hz * 2.01, duration * 0.68, volume * 0.21, 'sine', wet);
    tone(t, hz * 3.97, duration * 0.42, volume * 0.13, 'sine', dry);
    tone(t, hz * 5.43, duration * 0.29, volume * 0.07, 'sine', wet);
  }
  function metal(t, hz, volume, long) {
    var d = long ? 0.29 : 0.085;
    noise(t, long ? 0.065 : 0.026, 6500, 2900, volume * (long ? 0.33 : 0.20), true);
    tone(t, hz, d, volume * 0.53, 'sine', dry, 1.025);
    tone(t + 0.006, hz * 1.497, d * 0.74, volume * 0.29, 'sine', dry, 1.015);
    tone(t + 0.014, hz * 2.39, d * 0.57, volume * 0.18, 'sine', wet);
    if (long) {
      tone(t + 0.064, hz * 3.02, 0.25, volume * 0.16, 'sine', wet);
      bell(t + 0.13, hz * 1.99, volume * 0.12, 0.28);
    }
  }
  function swoosh(t, volume, up) {
    noise(t, 0.16, up ? 600 : 4600, up ? 4700 : 520, volume, true);
    tone(t, up ? 220 : 620, 0.15, volume * 0.18, 'triangle', dry, up ? 2.1 : 0.45);
  }
  function impact(t, volume, pitch) {
    noise(t, 0.10, 350, 2600, volume * 0.75);
    tone(t, pitch || 105, 0.20, volume * 0.8, 'sine', dry, 0.45);
    tone(t + 0.007, (pitch || 105) * 2.2, 0.11, volume * 0.29, 'triangle', wet, 0.66);
  }
  function notes(t, list, step, volume, duration, instrument) {
    for (var i = 0; i < list.length; i++) (instrument || pluck)(t + i * step, list[i], volume, duration);
  }
  function duck() {
    if (!ctx || !duckBus) return;
    var now = ctx.currentTime;
    var wasDucked = now < duckUntil;
    duckUntil = Math.max(duckUntil, now + 1.5);
    var gain = duckBus.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(wasDucked ? 0.3 : gain.value, now);
    gain.linearRampToValueAtTime(0.3, now + 0.045);
    gain.setValueAtTime(0.3, duckUntil);
    gain.linearRampToValueAtTime(1, duckUntil + 0.3);
  }
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  // Each two-bar melody has an answering phrase. Eight passes form a 16-bar loop.
  var tracks = {
    title: { bpm: 116, root: 60, scale: [0,2,4,5,7,9,11],
      chords: [0,4,5,3,0,4,3,4,5,3,0,4,3,4,0,0],
      motif: [0,2,4,5,4,2,0,-1,2,4,7,6,5,4,2,-1],
      answer: [4,5,7,9,7,5,4,-1,5,7,9,7,5,4,2,-1],
      lead: 'square', bass: 'triangle', kick: 0.11, hat: 0.027, leadGain: 0.115 },
    map: { bpm: 104, root: 62, scale: [0,2,4,5,7,9,11],
      chords: [0,3,4,0,5,3,4,4,0,3,5,4,3,4,0,0],
      motif: [0,2,4,-1,5,4,2,-1,4,5,7,5,4,2,0,-1],
      answer: [2,4,5,7,5,4,2,-1,0,2,4,2,0,-1,2,-1],
      lead: 'triangle', bass: 'sine', kick: 0.08, hat: 0.021, leadGain: 0.14 },
    battle: { bpm: 142, root: 57, scale: [0,2,3,5,7,8,10],
      chords: [0,5,3,4,0,5,4,4,3,5,0,4,3,4,0,0],
      motif: [0,0,2,3,4,-1,3,2,0,2,3,5,4,3,2,-1],
      answer: [4,4,5,7,6,5,4,-1,3,4,5,7,5,4,3,-1],
      lead: 'sawtooth', bass: 'square', kick: 0.13, hat: 0.036, leadGain: 0.078 },
    boss: { bpm: 154, root: 53, scale: [0,2,3,5,7,8,11],
      chords: [0,1,5,4,0,5,1,4,3,1,5,4,0,1,4,0],
      motif: [0,1,2,4,5,4,2,1,0,2,4,6,5,4,2,-1],
      answer: [4,5,6,8,7,6,5,4,2,4,5,7,6,5,4,-1],
      lead: 'sawtooth', bass: 'sawtooth', kick: 0.15, hat: 0.042, leadGain: 0.07 },
    ending: { bpm: 98, root: 60, scale: [0,2,4,5,7,9,11],
      chords: [0,3,4,0,5,3,4,0,3,4,5,0,3,4,0,0],
      motif: [0,2,4,-1,5,7,5,-1,4,2,0,2,4,-1,2,-1],
      answer: [4,5,7,-1,9,7,5,-1,4,5,7,5,4,2,0,-1],
      lead: 'triangle', bass: 'sine', kick: 0.07, hat: 0.018, leadGain: 0.13 }
  };
  function musicTone(t, hz, duration, volume, wave, bus) {
    var osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(hz, t);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(volume, t + 0.009);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(amp);
    amp.connect(bus);
    osc.start(t);
    osc.stop(t + duration + 0.015);
  }
  function drum(t, which, volume, bus) {
    if (which === 'kick') {
      var osc = ctx.createOscillator(), amp = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.11);
      amp.gain.setValueAtTime(volume, t);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(amp);
      amp.connect(bus);
      osc.start(t);
      osc.stop(t + 0.16);
    } else {
      noise(t, which === 'snare' ? 0.075 : 0.025,
        which === 'snare' ? 1000 : 7500, which === 'snare' ? 3800 : 10500,
        volume, false, bus);
    }
  }
  function scaleMidi(track, degree) {
    var octave = Math.floor(degree / 7);
    return track.root + track.scale[((degree % 7) + 7) % 7] + octave * 12;
  }
  function scheduleStep(state) {
    var tr = state.data, step = state.step, bar = Math.floor(step / 8);
    var inBar = step % 8, chord = tr.chords[bar], t = state.nextTime;
    var beat = 60 / tr.bpm, phrase = Math.floor(step / 16);
    var melody = (phrase % 2 ? tr.answer : tr.motif)[step % 16];
    if (melody >= 0) {
      var lift = phrase >= 4 && step % 16 === 12 ? 7 : 0;
      musicTone(t, midi(scaleMidi(tr, melody + lift) + 12), beat * 0.38,
        tr.leadGain, tr.lead, state.gain);
      if (tr === tracks.boss && inBar === 6) {
        musicTone(t, midi(scaleMidi(tr, melody) + 24), beat * 0.23,
          tr.leadGain * 0.32, 'square', state.gain);
      }
    }
    if (inBar % 2 === 0) {
      musicTone(t, midi(scaleMidi(tr, chord - 7 + (inBar === 6 ? 4 : 0))),
        beat * 0.82, 0.16, tr.bass, state.gain);
    }
    if (inBar === 0 || inBar === 4) {
      musicTone(t, midi(scaleMidi(tr, chord)), beat * 1.3, 0.038, 'triangle', state.gain);
      musicTone(t, midi(scaleMidi(tr, chord + 2)), beat * 1.3, 0.030, 'sine', state.gain);
      musicTone(t, midi(scaleMidi(tr, chord + 4)), beat * 1.3, 0.026, 'sine', state.gain);
      drum(t, 'kick', tr.kick, state.gain);
    }
    if (inBar === 2 || inBar === 6) drum(t, 'snare', tr.kick * 0.42, state.gain);
    if (inBar % 2 === 1 || tr === tracks.battle || tr === tracks.boss) {
      drum(t, 'hat', tr.hat, state.gain);
    }
    state.step = (step + 1) % 128;
    state.nextTime += beat / 2;
  }
  function scheduleBgm() {
    if (!activeTrack || !ctx || hidden() || ctx.state === 'suspended') return;
    if (activeTrack.nextTime < ctx.currentTime - 0.1) {
      activeTrack.nextTime = ctx.currentTime + 0.04;
    }
    while (activeTrack.nextTime < ctx.currentTime + 0.18) scheduleStep(activeTrack);
  }
  function startTimer() {
    if (timer || hidden()) return;
    timer = window.setInterval(scheduleBgm, 50);
    scheduleBgm();
  }
  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  function fadeTrack(state, seconds) {
    if (!state || !ctx) return;
    state.gain.gain.cancelScheduledValues(ctx.currentTime);
    state.gain.gain.setValueAtTime(state.gain.gain.value, ctx.currentTime);
    state.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + seconds);
    window.setTimeout(function () {
      try { state.gain.disconnect(); } catch (e) {}
    }, Math.ceil((seconds + 0.35) * 1000));
  }
  function startBgm(name) {
    if (!ctx || hidden() || !tracks[name]) return;
    if (activeTrack && activeTrack.name === name) return;
    fadeTrack(activeTrack, 0.65);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.65);
    gain.connect(duckBus);
    activeTrack = { name: name, data: tracks[name], gain: gain,
      step: 0, nextTime: ctx.currentTime + 0.055 };
    startTimer();
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      if (hidden()) stopTimer();
      else if (unlocked && ctx) {
        resume();
        if (requestedTrack && (!activeTrack || activeTrack.name !== requestedTrack)) {
          startBgm(requestedTrack);
        }
        if (activeTrack) {
          activeTrack.nextTime = ctx.currentTime + 0.055;
          startTimer();
        }
      }
    });
  }
  var api = {
    unlock: function () {
      unlocked = true;
      if (!setup()) return;
      resume();
      if (requestedTrack) startBgm(requestedTrack);
    },
    setMuted: function (value) {
      muted = !!value;
      if (!ctx) return;
      sfxBus.gain.setTargetAtTime(muted ? 0 : 0.48, ctx.currentTime, 0.012);
      bgmBus.gain.setTargetAtTime(muted ? 0 : 0.18 * bgmVolume, ctx.currentTime, 0.018);
    },
    setBgmVolume: function (value) {
      bgmVolume = Math.max(0, Math.min(1, Number(value) || 0));
      if (ctx) bgmBus.gain.setTargetAtTime(muted ? 0 : 0.18 * bgmVolume, ctx.currentTime, 0.025);
    },
    bgm: function (name) {
      if (!tracks[name]) return;
      requestedTrack = name;
      if (unlocked) {
        try { if (setup()) { resume(); startBgm(name); } } catch (e) {}
      }
    },
    stopBgm: function () {
      requestedTrack = null;
      fadeTrack(activeTrack, 0.45);
      activeTrack = null;
      stopTimer();
    },
    select: function () {
      run(function (t) {
        noise(t, 0.045, 1200, 6800, 0.085, true);
        metal(t + 0.018, 940, 0.22, true);
      });
    },
    tick: function (n) {
      run(function (t) {
        if (t - lastTick < 0.065) return;
        lastTick = t;
        var scale = [587.33,659.25,698.46,783.99,880,987.77,
          1046.5,1174.66,1318.51,1396.91,1567.98];
        metal(t, scale[Math.max(0, Math.min(10, (n | 0) - 2))], 0.105, false);
      });
    },
    word: function (count) {
      run(function (t) {
        var extra = Math.min(3, Math.max(0, (count | 0) - 1));
        notes(t, [659.25,830.61,987.77,1174.66].slice(0, 2 + extra),
          0.075, 0.16, 0.32, bell);
      });
    },
    hit: function () { run(function (t) { swoosh(t, 0.23, true); impact(t + 0.105, 0.27, 140); }); },
    miss: function () { run(function (t) { notes(t, [440,392], 0.11, 0.095, 0.24, bell); }); },
    ouch: function () { run(function (t) { impact(t, 0.21, 125); tone(t + 0.07, 280, 0.22, 0.1, 'triangle', dry, 0.72); }); },
    enemyDown: function () { run(function (t) { swoosh(t, 0.22, false); notes(t + 0.1, [523.25,659.25,783.99,1046.5], 0.085, 0.19, 0.48, bell); }); },
    chance: function () {
      run(function (t) {
        duck();
        swoosh(t, 0.2, true);
        notes(t + 0.08, [392,587.33,783.99,1174.66], 0.095, 0.18, 0.4, bell);
        impact(t + 0.4, 0.11, 175);
      });
    },
    quizTick: function () { run(function (t) { pluck(t, 880, 0.11, 0.11); }); },
    correct: function () { run(function (t) { notes(t, [659.25,830.61,987.77,1318.51], 0.085, 0.17, 0.4, bell); }); },
    wrong: function () { run(function (t) { notes(t, [523.25,493.88,440], 0.13, 0.085, 0.23, bell); }); },
    superCharge: function () {
      run(function (t) {
        duck();
        noise(t, 0.54, 500, 6500, 0.19, true);
        tone(t, 140, 0.51, 0.12, 'sawtooth', dry, 3.7, 0.30);
        tone(t + 0.08, 280, 0.44, 0.08, 'triangle', wet, 2.4, 0.21);
        notes(t + 0.31, [783.99,987.77,1174.66], 0.06, 0.095, 0.15, bell);
      });
    },
    special: function (level) {
      run(function (t) {
        duck();
        var power = Math.max(1, Math.min(3, level | 0));
        var strike = t + 0.46 + power * 0.035;
        noise(t, strike - t, 350, 7000, 0.21 + power * 0.035, true);
        tone(t, 125, strike - t, 0.12, 'sawtooth', dry, 4.1, 0.25);
        tone(t + 0.09, 280, strike - t - 0.09, 0.09, 'triangle', wet, 2.8, 0.19);
        notes(t + 0.18, [392,523.25,659.25,783.99], 0.075, 0.095, 0.18, bell);
        impact(strike, 0.40 + power * 0.07, 94 - power * 7);
        noise(strike, 0.065, 900, 5200, 0.23 + power * 0.025, true);
        tone(strike, 64, 0.34, 0.31, 'sine', dry, 0.58);
        metal(strike + 0.012, 1174.66, 0.22, false);
        notes(strike + 0.13, [783.99,1174.66,1567.98,1975.53,2349.32].slice(0, 3 + power),
          0.105, 0.25, 0.43, bell);
        notes(strike + 0.28, [1318.51,1760,2093,2637.02].slice(0, power + 1),
          0.14, 0.105, 0.36, bell);
        if (power === 3) {
          notes(strike + 0.71, [1567.98,1975.53,2349.32,3135.96],
            0.13, 0.13, 0.27, bell);
          noise(strike + 0.72, 0.23, 6500, 2900, 0.07, true);
        }
      });
    },
    jackpot: function () {
      run(function (t) {
        duck();
        impact(t, 0.16, 150);
        notes(t + 0.05, [1046.5,1318.51,1567.98,2093,2637.02,3135.96,2093,3135.96],
          0.105, 0.17, 0.33, bell);
        for (var i = 0; i < 5; i++) noise(t + 0.09 + i * 0.17, 0.025, 4500, 9000, 0.045);
      });
    },
    clear: function () {
      run(function (t) {
        duck();
        notes(t, [523.25,659.25,783.99,1046.5,783.99,987.77,1318.51],
          0.19, 0.21, 0.52, bell);
        bell(t + 1.18, 523.25, 0.14, 0.73);
        bell(t + 1.18, 659.25, 0.14, 0.73);
        bell(t + 1.18, 783.99, 0.14, 0.73);
      });
    },
    gameover: function () { run(function (t) { notes(t, [587.33,523.25,440,392], 0.22, 0.1, 0.42, bell); }); },
    button: function () { run(function (t) { pluck(t, 740, 0.09, 0.1); }); }
  };
  window.GoiSFX = api;
}());
