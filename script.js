/**
 * ============================================================================
 * DEEPAVALI – Traditional Indian Festival of Lights
 * High-Performance Fireworks Engine, Traditional Diyas & Web Audio Synthesizer
 *
 * Performance-Engineered:
 * - Zero-allocation particle loop (no per-frame object churn or GC pauses)
 * - Hardware-accelerated additive blending (eliminated costly ctx.shadowBlur)
 * - Strict particle budget (capped to prevent CPU/GPU throttling)
 * - In-place O(N) array compaction (no Array.splice re-indexing)
 * - Single unified 60 FPS animation loop with Page Visibility API pause
 * - Web Audio node auto-disconnect to prevent audio thread memory leaks
 * ============================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     Global Configuration & Constants (Tuned for 60 FPS on all hardware)
     ========================================================================== */
  const CONFIG = {
    gravity: 0.048,
    airResistance: 0.982,
    rocketSpeedMin: 9,
    rocketSpeedMax: 13,
    // Strict particle budgets to protect laptop CPU/GPU and mobile batteries
    maxParticles: {
      desktop: 240,
      mobile: 130
    },
    maxRockets: 5,
    particlesPerExplosion: {
      desktop: 55,
      mobile: 32
    },
    // Ambient firework timing (ms)
    ambientIntervalMin: 3500,
    ambientIntervalMax: 7000,
    // Falling flower petals count
    petalsCount: {
      desktop: 22,
      mobile: 12
    },
    // Color palettes for authentic Indian festival fireworks
    palettes: [
      { name: 'Royal Gold', colors: ['#ffd700', '#fff275', '#ffaa00', '#ffe680', '#d4af37'] },
      { name: 'Ruby Vermillion', colors: ['#ff0055', '#d90429', '#ff4d6d', '#ff758f', '#ffb3c1'] },
      { name: 'Emerald Jewel', colors: ['#00f5d4', '#2ec4b6', '#52b788', '#74c69d', '#99e2b4'] },
      { name: 'Royal Sapphire', colors: ['#4cc9f0', '#4895ef', '#4361ee', '#3f37c9', '#7209b7'] },
      { name: 'Saffron Amber', colors: ['#ff5400', '#ff7900', '#ff9100', '#ffaa00', '#ffd000'] },
      { name: 'Sparkling Diamond', colors: ['#ffffff', '#fff8e7', '#f0f3f4', '#ffd700', '#e0e1dd'] }
    ]
  };

  // Application State
  const state = {
    isMobile: false,
    audioInitialized: false,
    musicPlaying: false,
    diyasLitCount: 5,
    ambientTimer: null,
    isTabVisible: true,
    animFrameId: null,
    lastFrameTime: 0
  };

  /* ==========================================================================
     DOM Elements Cache
     ========================================================================== */
  const dom = {
    fireworksCanvas: document.getElementById('fireworks-canvas'),
    petalsCanvas: document.getElementById('petals-canvas'),
    btnStart: document.getElementById('btn-start'),
    btnReplay: document.getElementById('btn-replay'),
    btnMusic: document.getElementById('btn-music'),
    musicIcon: document.getElementById('music-icon'),
    musicLabel: document.getElementById('music-label'),
    btnDiyas: document.getElementById('btn-diyas'),
    diyasLabel: document.getElementById('diyas-label'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    fsIcon: document.getElementById('fs-icon'),
    fsLabel: document.getElementById('fs-label'),
    toast: document.getElementById('toast'),
    groundGlow: document.getElementById('ground-glow'),
    diyas: Array.from(document.querySelectorAll('.diya-unit'))
  };

  /* ==========================================================================
     Canvas Setup & Optimized Resolution Management
     ========================================================================== */
  const fwCtx = dom.fireworksCanvas.getContext('2d', { alpha: true, desynchronized: true });
  const petCtx = dom.petalsCanvas.getContext('2d', { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = 1;

  function handleResize() {
    // Cap devicePixelRatio at 1.25 to prevent 4K/Retina laptops from doing 4x-9x overdraw
    dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    width = window.innerWidth;
    height = window.innerHeight;

    state.isMobile = width <= 768;

    // Fireworks Canvas
    dom.fireworksCanvas.width = Math.floor(width * dpr);
    dom.fireworksCanvas.height = Math.floor(height * dpr);
    dom.fireworksCanvas.style.width = width + 'px';
    dom.fireworksCanvas.style.height = height + 'px';
    fwCtx.setTransform(1, 0, 0, 1, 0, 0);
    fwCtx.scale(dpr, dpr);

    // Petals Canvas
    dom.petalsCanvas.width = Math.floor(width * dpr);
    dom.petalsCanvas.height = Math.floor(height * dpr);
    dom.petalsCanvas.style.width = width + 'px';
    dom.petalsCanvas.style.height = height + 'px';
    petCtx.setTransform(1, 0, 0, 1, 0, 0);
    petCtx.scale(dpr, dpr);
  }

  window.addEventListener('resize', handleResize, { passive: true });
  handleResize();

  /* ==========================================================================
     Toast / Notification Helper
     ========================================================================== */
  let toastTimer = null;
  function showToast(message, duration = 3000) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, duration);
  }

  /* ==========================================================================
     Web Audio API: Native Indian Festival Sound Engine (Zero external files)
     Features clean node disconnections to eliminate audio memory leaks
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.musicGain = null;
      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.droneFilter = null;
      this.droneLfo = null;
      this.chimeInterval = null;
    }

    init() {
      if (this.ctx) return;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        state.audioInitialized = true;
      } catch (err) {
        console.warn('Web Audio API not supported:', err);
      }
    }

    resume() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    createPanner(panValue) {
      if (!this.ctx) return null;
      const clampedPan = Math.max(-1, Math.min(1, panValue));
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(clampedPan, this.ctx.currentTime);
        return panner;
      }
      return null;
    }

    // Rocket launch whoosh
    playLaunch(xCoord = width / 2) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const panVal = (xCoord / width) * 2 - 1;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        const panner = this.createPanner(panVal);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.45);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(1100, now + 0.45);
        filter.Q.setValueAtTime(3.0, now);

        oscGain.gain.setValueAtTime(0.01, now);
        oscGain.gain.linearRampToValueAtTime(0.09, now + 0.12);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(filter);
        filter.connect(oscGain);

        const targetNode = panner || this.masterGain;
        if (panner) {
          oscGain.connect(panner);
          panner.connect(this.masterGain);
        } else {
          oscGain.connect(this.masterGain);
        }

        osc.start(now);
        osc.stop(now + 0.46);

        // Auto disconnect to prevent audio graph leaks
        osc.onended = () => {
          try {
            osc.disconnect();
            filter.disconnect();
            oscGain.disconnect();
            if (panner) panner.disconnect();
          } catch (e) {}
        };
      } catch (e) {}
    }

    // Pyrotechnic explosion
    playExplosion(intensity = 1.0, type = 'peony', xCoord = width / 2) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const now = this.ctx.currentTime;
        const panVal = (xCoord / width) * 2 - 1;
        const panner = this.createPanner(panVal);

        // Sub-bass physical thump
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';

        const startPitch = 140 + Math.random() * 30;
        subOsc.frequency.setValueAtTime(startPitch, now);
        subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        subGain.gain.setValueAtTime(0.3 * intensity, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        subOsc.connect(subGain);

        // Pyrotechnic shockwave noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(550, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 0.45);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.38 * intensity, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        if (panner) {
          subGain.connect(panner);
          noiseGain.connect(panner);
          panner.connect(this.masterGain);
        } else {
          subGain.connect(this.masterGain);
          noiseGain.connect(this.masterGain);
        }

        subOsc.start(now);
        subOsc.stop(now + 0.55);
        noiseNode.start(now);
        noiseNode.stop(now + 0.55);

        // Memory cleanup
        subOsc.onended = () => {
          try {
            subOsc.disconnect();
            subGain.disconnect();
            noiseNode.disconnect();
            noiseFilter.disconnect();
            noiseGain.disconnect();
            if (panner) panner.disconnect();
          } catch (e) {}
        };

        if (type === 'crackling' || type === 'brocade' || Math.random() < 0.3) {
          setTimeout(() => {
            this.playCrackle();
          }, 180 + Math.random() * 150);
        }
      } catch (e) {}
    }

    // Sparkler crackles
    playCrackle() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const bursts = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < bursts; i++) {
          setTimeout(() => {
            if (!this.ctx || this.ctx.state !== 'running') return;
            const now = this.ctx.currentTime;
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let j = 0; j < bufferSize; j++) {
              data[j] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1600 + Math.random() * 600, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start(now);
            noise.stop(now + 0.04);

            noise.onended = () => {
              try {
                noise.disconnect();
                filter.disconnect();
                gain.disconnect();
              } catch (e) {}
            };
          }, i * 45);
        }
      } catch (e) {}
    }

    // Indian brass temple bell chime
    playTempleBell(freq = 784) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      try {
        const now = this.ctx.currentTime;
        const partials = [
          { f: freq, gain: 0.25, decay: 1.5 },
          { f: freq * 2.756, gain: 0.12, decay: 1.0 },
          { f: freq * 5.404, gain: 0.06, decay: 0.6 }
        ];

        partials.forEach(p => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(p.f, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(p.gain, now + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(now);
          osc.stop(now + p.decay + 0.05);

          osc.onended = () => {
            try {
              osc.disconnect();
              gain.disconnect();
            } catch (e) {}
          };
        });
      } catch (e) {}
    }

    // Traditional Festive Tanpura Drone + Indian Raga Notes
    startFestiveAmbience() {
      if (!this.ctx) this.init();
      this.resume();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.32, now + 1.0);

      this.stopDrones();

      const baseFreq = 130.81; // Sa (C3)

      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'triangle';
      this.droneOsc1.frequency.setValueAtTime(baseFreq, now);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(baseFreq * 1.5, now); // Pa

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(360, now);

      this.droneLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.droneLfo.frequency.setValueAtTime(0.2, now);
      lfoGain.gain.setValueAtTime(50, now);
      this.droneLfo.connect(lfoGain);
      lfoGain.connect(this.droneFilter.frequency);
      this.droneLfo.start(now);

      const droneVol = this.ctx.createGain();
      droneVol.gain.setValueAtTime(0.2, now);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(droneVol);
      droneVol.connect(this.musicGain);

      this.droneOsc1.start(now);
      this.droneOsc2.start(now);

      // Raga Bhupali Notes (Sa, Re, Ga, Pa, Dha)
      const ragaNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

      clearInterval(this.chimeInterval);
      this.chimeInterval = setInterval(() => {
        if (!state.musicPlaying || !this.ctx || !state.isTabVisible) return;
        const note = ragaNotes[Math.floor(Math.random() * ragaNotes.length)];
        this.playMelodicChime(note);
      }, 2600);

      state.musicPlaying = true;
    }

    playMelodicChime(freq) {
      if (!this.ctx || !state.musicPlaying) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 2.1);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) {}
        };
      } catch (e) {}
    }

    stopDrones() {
      if (this.droneOsc1) {
        try { this.droneOsc1.stop(); this.droneOsc1.disconnect(); } catch (e) {}
        this.droneOsc1 = null;
      }
      if (this.droneOsc2) {
        try { this.droneOsc2.stop(); this.droneOsc2.disconnect(); } catch (e) {}
        this.droneOsc2 = null;
      }
      if (this.droneLfo) {
        try { this.droneLfo.stop(); this.droneLfo.disconnect(); } catch (e) {}
        this.droneLfo = null;
      }
    }

    stopFestiveAmbience() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.0001, now + 0.6);

      setTimeout(() => {
        this.stopDrones();
        clearInterval(this.chimeInterval);
      }, 650);

      state.musicPlaying = false;
    }

    toggleMusic() {
      this.resume();
      if (state.musicPlaying) {
        this.stopFestiveAmbience();
        return false;
      } else {
        this.startFestiveAmbience();
        return true;
      }
    }
  }

  const sound = new SoundEngine();

  /* ==========================================================================
     High-Performance Fireworks Physics (Zero Per-Frame Object Allocation)
     ========================================================================== */

  // Rocket Class
  class Rocket {
    constructor(startX, startY, targetX, targetY, palette, type) {
      this.x = startX;
      this.y = startY;
      this.prevX = startX;
      this.prevY = startY;
      this.targetX = targetX;
      this.targetY = targetY;
      this.palette = palette;
      this.type = type || 'peony';

      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.hypot(dx, dy) || 1;

      const speed = Math.random() * (CONFIG.rocketSpeedMax - CONFIG.rocketSpeedMin) + CONFIG.rocketSpeedMin;
      this.vx = (dx / distance) * speed;
      this.vy = (dy / distance) * speed;

      this.alive = true;
      sound.playLaunch(startX);
    }

    update() {
      this.prevX = this.x;
      this.prevY = this.y;

      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.06; // Apex gravity

      if (this.vy >= -0.5 || this.y <= this.targetY) {
        this.alive = false;
        createExplosion(this.x, this.y, this.palette, this.type);
      }
    }

    draw(ctx) {
      // Direct streak line without array allocations
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // Bright glowing head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.2, 0, 6.283);
      ctx.fill();
    }
  }

  // Particle Class with Zero Trail Array Churn
  class Particle {
    constructor(x, y, color, vx, vy, options = {}) {
      this.x = x;
      this.y = y;
      this.prevX = x;
      this.prevY = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.alpha = 1.0;
      this.size = options.size || (Math.random() * 1.8 + 1.2);
      this.decay = options.decay || (Math.random() * 0.016 + 0.013);
      this.gravity = options.gravity !== undefined ? options.gravity : CONFIG.gravity;
      this.friction = options.friction || CONFIG.airResistance;
      this.flicker = options.flicker || false;
      this.alive = true;
    }

    update() {
      this.prevX = this.x;
      this.prevY = this.y;

      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;

      this.x += this.vx;
      this.y += this.vy;

      this.alpha -= this.decay;
      if (this.alpha <= 0.02) {
        this.alive = false;
      }
    }

    draw(ctx) {
      if (!this.alive) return;

      let drawAlpha = this.alpha;
      if (this.flicker && Math.random() < 0.25) {
        drawAlpha = Math.max(0.1, drawAlpha - 0.4);
      }

      ctx.globalAlpha = drawAlpha;

      // Realistic pyrotechnic spark streak line (prevX, prevY -> x, y)
      // Hardware accelerated additive blending (lighter) makes sparks glow without shadowBlur
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    }
  }

  const rockets = [];
  const particles = [];
  let skyFlashAlpha = 0;
  let skyFlashColor = '#ffd700';

  /**
   * Spawns an explosion respecting strict particle budgets
   */
  function createExplosion(x, y, palette, type = 'peony') {
    const maxAllowed = state.isMobile ? CONFIG.maxParticles.mobile : CONFIG.maxParticles.desktop;
    if (particles.length >= maxAllowed) {
      // Throttled: reuse existing budget to prevent lag
      return;
    }

    const baseCount = state.isMobile
      ? CONFIG.particlesPerExplosion.mobile
      : CONFIG.particlesPerExplosion.desktop;

    // Remaining capacity
    const count = Math.min(baseCount, maxAllowed - particles.length);
    if (count <= 4) return;

    skyFlashAlpha = 0.18;
    skyFlashColor = palette.colors[0];

    sound.playExplosion(1.0, type, x);

    switch (type) {
      case 'brocade': {
        // Golden weeping willow
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * 6.28318;
          const speed = Math.random() * 4.8 + 0.8;
          const color = palette.colors[Math.floor(Math.random() * palette.colors.length)];
          particles.push(
            new Particle(x, y, color, Math.cos(angle) * speed, Math.sin(angle) * speed, {
              gravity: 0.035,
              friction: 0.975,
              decay: 0.011,
              size: 2.2,
              flicker: true
            })
          );
        }
        break;
      }

      case 'ring': {
        // Concentric Saturn ring
        const ringSpeed = Math.random() * 1.5 + 3.8;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * 6.28318;
          const color = palette.colors[i % palette.colors.length];
          particles.push(
            new Particle(
              x,
              y,
              color,
              Math.cos(angle) * ringSpeed,
              Math.sin(angle) * ringSpeed,
              { gravity: 0.038, friction: 0.97, decay: 0.015, size: 2.0 }
            )
          );
        }
        break;
      }

      case 'crackling': {
        // Crackling palm burst
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * 6.28318;
          const speed = Math.random() * 5.2 + 1.2;
          const color = palette.colors[Math.floor(Math.random() * palette.colors.length)];
          particles.push(
            new Particle(x, y, color, Math.cos(angle) * speed, Math.sin(angle) * speed, {
              gravity: 0.046,
              friction: 0.965,
              decay: 0.015,
              size: 2.2,
              flicker: true
            })
          );
        }
        break;
      }

      case 'peony':
      default: {
        // Spherical 3D peony
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * 6.28318;
          const speed = Math.pow(Math.random(), 0.5) * 5.5;
          const color = palette.colors[Math.floor(Math.random() * palette.colors.length)];
          particles.push(
            new Particle(x, y, color, Math.cos(angle) * speed, Math.sin(angle) * speed, {
              gravity: 0.044,
              friction: 0.98,
              decay: 0.014,
              size: 1.9,
              flicker: Math.random() < 0.2
            })
          );
        }
        break;
      }
    }
  }

  function launchFirework(targetX, targetY, customPalette = null, customType = null) {
    if (rockets.length >= CONFIG.maxRockets) return;

    const startX = targetX + (Math.random() - 0.5) * 80;
    const startY = height + 10;
    const palette = customPalette || CONFIG.palettes[Math.floor(Math.random() * CONFIG.palettes.length)];
    const types = ['peony', 'brocade', 'ring', 'crackling'];
    const type = customType || types[Math.floor(Math.random() * types.length)];

    rockets.push(new Rocket(startX, startY, targetX, targetY, palette, type));
  }

  /* ==========================================================================
     Falling Flower Petals Engine (Optimized with zero gradient churn)
     ========================================================================== */
  class FlowerPetal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -15;
      this.size = Math.random() * 6 + 6;
      this.speedY = Math.random() * 0.8 + 0.5;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.angle = Math.random() * 360;
      this.angularSpeed = (Math.random() - 0.5) * 1.2;
      this.oscillationSpeed = Math.random() * 0.02 + 0.01;
      this.oscillationOffset = Math.random() * 6.283;
      this.opacity = Math.random() * 0.3 + 0.55;

      const rand = Math.random();
      if (rand < 0.45) {
        this.color = '#ff9f1c'; // Orange Marigold
      } else if (rand < 0.8) {
        this.color = '#ffea00'; // Yellow Marigold
      } else {
        this.color = '#c9184a'; // Crimson Rose
      }
    }

    update(time) {
      this.y += this.speedY;
      this.x += Math.sin(time * this.oscillationSpeed + this.oscillationOffset) * 0.5 + this.speedX;
      this.angle += this.angularSpeed;

      if (this.y > height + 20) {
        this.reset();
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.angle * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;

      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.7, -this.size * 0.4, this.size * 0.5, this.size * 0.7, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.5, this.size * 0.7, -this.size * 0.7, -this.size * 0.4, 0, -this.size);
      ctx.fill();

      ctx.restore();
    }
  }

  const petals = [];
  function initPetals() {
    petals.length = 0;
    const count = state.isMobile ? CONFIG.petalsCount.mobile : CONFIG.petalsCount.desktop;
    for (let i = 0; i < count; i++) {
      petals.push(new FlowerPetal());
    }
  }
  initPetals();

  /* ==========================================================================
     Single Unified 60 FPS Animation Loop (With In-Place O(N) Array Compaction)
     ========================================================================== */
  function animationLoop(timestamp) {
    if (!state.isTabVisible) {
      state.animFrameId = null;
      return;
    }

    state.animFrameId = requestAnimationFrame(animationLoop);

    // Limit to 60 FPS (skip frames if delta < 14ms)
    const elapsed = timestamp - state.lastFrameTime;
    if (elapsed < 14) return;
    state.lastFrameTime = timestamp;

    // 1. Fireworks Trails Persistence (Destination-Out)
    fwCtx.globalAlpha = 1.0;
    fwCtx.globalCompositeOperation = 'destination-out';
    fwCtx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    fwCtx.fillRect(0, 0, width, height);

    // Switch to hardware-accelerated additive blending
    fwCtx.globalCompositeOperation = 'lighter';

    // Sky Flash
    if (skyFlashAlpha > 0.005) {
      fwCtx.fillStyle = skyFlashColor;
      fwCtx.globalAlpha = skyFlashAlpha;
      fwCtx.fillRect(0, 0, width, height);
      skyFlashAlpha *= 0.82;
    }

    // In-place compaction for rockets (no Array.splice overhead)
    let aliveRockets = 0;
    for (let i = 0; i < rockets.length; i++) {
      const r = rockets[i];
      r.update();
      if (r.alive) {
        r.draw(fwCtx);
        rockets[aliveRockets++] = r;
      }
    }
    rockets.length = aliveRockets;

    // In-place compaction for particles (no Array.splice overhead)
    let aliveParticles = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update();
      if (p.alive) {
        p.draw(fwCtx);
        particles[aliveParticles++] = p;
      }
    }
    particles.length = aliveParticles;

    // 2. Petals Canvas Update
    petCtx.clearRect(0, 0, width, height);
    const timeInSeconds = timestamp * 0.001;
    for (let i = 0; i < petals.length; i++) {
      petals[i].update(timeInSeconds);
      petals[i].draw(petCtx);
    }
  }

  // Start the animation loop
  state.animFrameId = requestAnimationFrame(animationLoop);

  /* ==========================================================================
     Page Visibility API (Instantly Pauses Animation & Timers on Tab Switch)
     ========================================================================== */
  document.addEventListener('visibilitychange', () => {
    state.isTabVisible = !document.hidden;

    if (state.isTabVisible) {
      // Resume loop and timers
      state.lastFrameTime = performance.now();
      if (!state.animFrameId) {
        state.animFrameId = requestAnimationFrame(animationLoop);
      }
      scheduleNextAmbientFirework();
    } else {
      // Pause loop and cancel timers to save laptop battery and CPU
      if (state.animFrameId) {
        cancelAnimationFrame(state.animFrameId);
        state.animFrameId = null;
      }
      clearTimeout(state.ambientTimer);
    }
  });

  /* ==========================================================================
     Ambient Fireworks Scheduler
     ========================================================================== */
  function scheduleNextAmbientFirework() {
    clearTimeout(state.ambientTimer);
    if (!state.isTabVisible) return;

    const delay =
      Math.random() * (CONFIG.ambientIntervalMax - CONFIG.ambientIntervalMin) +
      CONFIG.ambientIntervalMin;

    state.ambientTimer = setTimeout(() => {
      if (state.isTabVisible) {
        const targetX = width * 0.15 + Math.random() * (width * 0.7);
        const targetY = height * 0.12 + Math.random() * (height * 0.35);
        launchFirework(targetX, targetY);
      }
      scheduleNextAmbientFirework();
    }, delay);
  }

  scheduleNextAmbientFirework();

  /* ==========================================================================
     Grand Celebration Orchestrator
     ========================================================================== */
  function triggerGrandCelebration() {
    sound.resume();
    sound.playTempleBell(880);

    relightAllDiyas(false);
    showToast('🎆 Grand Deepavali Celebration Commencing! 🎆', 3500);

    const salvos = [
      { delay: 100, x: width * 0.32, y: height * 0.24, palette: CONFIG.palettes[0], type: 'brocade' },
      { delay: 250, x: width * 0.68, y: height * 0.22, palette: CONFIG.palettes[0], type: 'brocade' },
      { delay: 1200, x: width * 0.5, y: height * 0.16, palette: CONFIG.palettes[1], type: 'peony' },
      { delay: 1600, x: width * 0.25, y: height * 0.26, palette: CONFIG.palettes[3], type: 'peony' },
      { delay: 1850, x: width * 0.75, y: height * 0.25, palette: CONFIG.palettes[4], type: 'ring' },
      { delay: 2600, x: width * 0.4, y: height * 0.2, palette: CONFIG.palettes[2], type: 'crackling' },
      { delay: 2850, x: width * 0.6, y: height * 0.2, palette: CONFIG.palettes[5], type: 'crackling' },
      { delay: 3800, x: width * 0.35, y: height * 0.18, palette: CONFIG.palettes[0], type: 'brocade' },
      { delay: 3950, x: width * 0.65, y: height * 0.18, palette: CONFIG.palettes[4], type: 'brocade' }
    ];

    salvos.forEach(salvo => {
      setTimeout(() => {
        if (state.isTabVisible) {
          launchFirework(salvo.x, salvo.y, salvo.palette, salvo.type);
        }
      }, salvo.delay);
    });
  }

  function triggerReplayFireworks() {
    sound.resume();
    showToast('✨ Sparkling Fireworks Display ✨', 2500);

    const salvo = [
      { x: width * 0.5, y: height * 0.22, type: 'peony' },
      { x: width * 0.28, y: height * 0.28, type: 'brocade' },
      { x: width * 0.72, y: height * 0.26, type: 'ring' }
    ];

    salvo.forEach((item, index) => {
      setTimeout(() => {
        if (state.isTabVisible) {
          launchFirework(item.x, item.y, null, item.type);
        }
      }, index * 380);
    });
  }

  /* ==========================================================================
     Diya Interactive Logic & Ground Illumination
     ========================================================================== */
  function updateGroundGlow() {
    if (!dom.groundGlow) return;
    const ratio = state.diyasLitCount / dom.diyas.length;
    dom.groundGlow.style.opacity = Math.max(0.1, ratio).toString();

    if (state.diyasLitCount === 0) {
      dom.diyasLabel.textContent = 'Light All Diyas';
    } else if (state.diyasLitCount === dom.diyas.length) {
      dom.diyasLabel.textContent = 'Diyas Glowing ✨';
    } else {
      dom.diyasLabel.textContent = `Light Diyas (${state.diyasLitCount}/${dom.diyas.length})`;
    }
  }

  function toggleDiya(diyaUnit) {
    sound.resume();
    const flame = diyaUnit.querySelector('.flame-wrapper');
    const isLit = flame.classList.contains('is-lit') && !flame.classList.contains('is-extinguished');

    if (isLit) {
      flame.classList.remove('is-lit');
      flame.classList.add('is-extinguished');
      diyaUnit.classList.add('is-extinguished');
      diyaUnit.setAttribute('aria-label', 'Brass Diya, extinguished. Tap to light.');
      state.diyasLitCount = Math.max(0, state.diyasLitCount - 1);
    } else {
      flame.classList.remove('is-extinguished');
      flame.classList.add('is-lit');
      diyaUnit.classList.remove('is-extinguished');
      diyaUnit.setAttribute('aria-label', 'Brass Diya, lit. Tap to extinguish.');
      state.diyasLitCount = Math.min(dom.diyas.length, state.diyasLitCount + 1);
      sound.playTempleBell(987);
    }

    updateGroundGlow();
  }

  function relightAllDiyas(playSound = true) {
    dom.diyas.forEach(diyaUnit => {
      const flame = diyaUnit.querySelector('.flame-wrapper');
      flame.classList.remove('is-extinguished');
      flame.classList.add('is-lit');
      diyaUnit.classList.remove('is-extinguished');
      diyaUnit.setAttribute('aria-label', 'Brass Diya, lit. Tap to extinguish.');
    });

    state.diyasLitCount = dom.diyas.length;
    updateGroundGlow();

    if (playSound) {
      sound.resume();
      sound.playTempleBell(1046.5);
      showToast('🪔 All Sacred Diyas are Lit and Glowing! 🪔', 2500);
    }
  }

  /* ==========================================================================
     Fullscreen Mode Handling
     ========================================================================== */
  function isFullscreen() {
    return Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  function toggleFullscreen() {
    try {
      if (!isFullscreen()) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          root.requestFullscreen().catch(handleFsError);
        } else if (root.webkitRequestFullscreen) {
          root.webkitRequestFullscreen();
        } else if (root.mozRequestFullScreen) {
          root.mozRequestFullScreen();
        } else if (root.msRequestFullscreen) {
          root.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(handleFsError);
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (e) {
      handleFsError(e);
    }
  }

  function handleFsError(err) {
    console.warn('Fullscreen request failed:', err);
    showToast('Fullscreen mode was blocked by browser permissions.', 3000);
  }

  function updateFullscreenUI() {
    const fs = isFullscreen();
    if (dom.btnFullscreen) {
      dom.btnFullscreen.setAttribute('aria-pressed', fs ? 'true' : 'false');
      dom.fsLabel.textContent = fs ? 'Exit Fullscreen' : 'Fullscreen';
      dom.fsIcon.textContent = fs ? '✕' : '⛶';
    }
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(
    event => {
      document.addEventListener(event, updateFullscreenUI, { passive: true });
    }
  );

  /* ==========================================================================
     Event Listeners & User Interactions
     ========================================================================== */

  // Interactive Sky Canvas Clicks & Touches
  function handleSkyInteraction(clientX, clientY) {
    sound.resume();
    launchFirework(clientX, clientY);
  }

  dom.fireworksCanvas.addEventListener(
    'pointerdown',
    e => {
      if (e.button === 0 || e.pointerType === 'touch') {
        handleSkyInteraction(e.clientX, e.clientY);
      }
    },
    { passive: true }
  );

  // Buttons
  if (dom.btnStart) {
    dom.btnStart.addEventListener('click', () => {
      triggerGrandCelebration();
    });
  }

  if (dom.btnReplay) {
    dom.btnReplay.addEventListener('click', () => {
      triggerReplayFireworks();
    });
  }

  if (dom.btnMusic) {
    dom.btnMusic.addEventListener('click', () => {
      const isPlaying = sound.toggleMusic();
      dom.btnMusic.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      dom.musicLabel.textContent = isPlaying ? 'Music On' : 'Music Off';
      dom.musicIcon.textContent = isPlaying ? '🎶' : '🎵';
      showToast(isPlaying ? '🎶 Festive Raag Ambient Music Started' : '🔇 Music Muted', 2200);
    });
  }

  if (dom.btnDiyas) {
    dom.btnDiyas.addEventListener('click', () => {
      relightAllDiyas(true);
    });
  }

  if (dom.btnFullscreen) {
    dom.btnFullscreen.addEventListener('click', () => {
      toggleFullscreen();
    });
  }

  // Diya Tap / Keydown Handlers
  dom.diyas.forEach(diyaUnit => {
    diyaUnit.addEventListener('click', e => {
      e.stopPropagation();
      toggleDiya(diyaUnit);
    });

    diyaUnit.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDiya(diyaUnit);
      }
    });
  });

  // Global First User Gesture for Audio Context Warmup
  function warmUpAudioOnFirstGesture() {
    sound.resume();
    window.removeEventListener('pointerdown', warmUpAudioOnFirstGesture);
    window.removeEventListener('keydown', warmUpAudioOnFirstGesture);
  }
  window.addEventListener('pointerdown', warmUpAudioOnFirstGesture, { passive: true });
  window.addEventListener('keydown', warmUpAudioOnFirstGesture, { passive: true });

  // Initial UI state setup
  updateGroundGlow();
  updateFullscreenUI();

  // Initial welcome fireworks burst after 1 second
  setTimeout(() => {
    if (state.isTabVisible) {
      launchFirework(width * 0.5, height * 0.22, CONFIG.palettes[0], 'brocade');
    }
  }, 1000);
})();
