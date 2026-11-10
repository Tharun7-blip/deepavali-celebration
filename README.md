# 🪔 Deepavali – Traditional Indian Festival of Lights

An immersive, premium-quality, interactive Diwali celebration website crafted with pure **HTML5**, **CSS3**, **Vanilla JavaScript**, **HTML5 Canvas**, and the **Web Audio API**.

Live celebration features realistic pyrotechnic fireworks, interactive glowing brass oil lamps (*diyas*), traditional rangoli mandala artwork, floating flower petals, and authentic Indian classical ambient soundscapes — celebrating both English and Kannada traditions.

![Deepavali Celebration Preview](https://img.shields.io/badge/Festival-Deepavali%20%7C%20Diwali-gold?style=for-the-badge)
![Status-Complete](https://img.shields.io/badge/Status-Complete%20%26%20Production%20Ready-success?style=for-the-badge)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-blue?style=for-the-badge)

---

## ✨ Features

### 1. Traditional Indian Aesthetic & Typography
- **Deep Festive Color Palette**: Rich royal maroon (`#4a0515`), dark purple (`#150524`), midnight blue (`#0a0312`), and shimmering gold metallic leaf accents.
- **Bilingual Celebration**:
  - **English**: *"Happy Diwali!"* and *"May your life shine with happiness, prosperity and peace."*
  - **Kannada (ಕನ್ನಡ)**: *"ದೀಪಾವಳಿ ಹಬ್ಬದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು"* and *"ನಿಮ್ಮ ಜೀವನ ಸಂತೋಷ, ಸಮೃದ್ಧಿ ಮತ್ತು ಶಾಂತಿಯಿಂದ ಬೆಳಗಲಿ."*
- **Auspicious Shloka**: *"ತಮಸೋ ಮಾ ಜ್ಯೋತಿರ್ಗಮಯ • Lead us from darkness unto light"*.
- **Traditional Toran**: Swaying mango leaves, marigold flowers, and ringing golden bells along the top.
- **Glassmorphism Greeting Card**: Subtle golden-trimmed frosted glass backdrop keeping typography crystal-clear across all screen sizes and dynamic fireworks explosions.

### 2. High-Performance HTML5 Canvas Fireworks
- **Diverse Firework Patterns**:
  - **Kamuro / Brocade Crown**: Long-lingering golden weeping willows that cascade downward like molten rain.
  - **Peony & Dahlia**: Spherical explosions in ruby vermillion, sapphire blue, emerald green, and saffron orange.
  - **Concentric Ring & Saturn**: Expanding geometric shockwaves of brilliant stars.
  - **Crackling Palm**: Fiery trunk branching outward with secondary crackling starbursts.
- **Realistic Physics Simulation**: Rocket launch velocity, apex deceleration, air resistance, gravity, motion-blur spark trails, and ambient sky detonation flashes.
- **Interactive Sky**: Click or tap anywhere across the night sky to launch a custom firework rocket aimed directly at your touch coordinates! Supports multi-touch on mobile.
- **Autonomous Ambient Displays**: Periodically launches spontaneous fireworks so the celebration never goes dull.

### 3. Sacred Brass Diyas (Oil Lamps) & Rangoli
- **Handcrafted Vector Brass Diyas**: Detailed ornamental brass pedestal, oil pool reflections, cotton wick, and layered dynamic flames.
- **Realistic Animated Flames**: Multi-tone flame (white core, yellow heart, orange-red halo, and subtle smoke wisps) with flickering flutter physics.
- **Floor Illumination**: Synchronized radial ground glow cast onto an intricate floral mandala Rangoli.
- **Interactive Lamp Lighting**: Tap or press Enter/Space on any diya to extinguish or rekindle its flame with a harmonic brass temple bell chime.

### 4. Floating Festive Atmosphere
- **Falling Marigold & Rose Petals**: Canvas-rendered marigold (yellow & orange) and crimson rose petals gently swaying and tumbling with natural 3D oscillation.
- **Twinkling Night Sky**: Ambient golden dust particles and soft bokeh.

### 5. 100% Native Web Audio API Soundscape (Zero External Downloads)
- **Whistle / Launch Whoosh**: Swept frequency modulated oscillators with bandpass filtered noise.
- **Deep Explosion Boom**: Sub-bass sine wave drop paired with low-pass filtered pyrotechnic shockwave noise.
- **Pyrotechnic Crackle**: High-pass filtered stochastic noise bursts.
- **Brass Temple Bells**: Modal acoustic bell synthesis with harmonic partials (1.0x, 2.76x, 5.40x).
- **Festive Tanpura & Raga Ambience**: Soothing drone on Sa-Pa chords with gentle pentatonic chimes in *Raga Bhupali / Mohanam* (Sa, Re, Ga, Pa, Dha).
- **Mute / Music Toggle**: Smooth ramping without pops or clicks; complies fully with modern browser autoplay policies.

### 6. Interactive Control Bar
- **🎆 Start Celebration**: Triggers a choreographed 4-wave fireworks finale, rings temple bells, and lights all sacred lamps.
- **✨ Replay Fireworks**: Launches an immediate celebratory triple salvo.
- **🎵 Music On / Music Off**: Toggles background festive raga soundscape with visual equalizer waves.
- **🪔 Light All Diyas**: Relights all lamps if extinguished.
- **⛶ Fullscreen Mode**: Seamlessly toggles full-screen mode with browser security fallbacks.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic markup, accessible attributes, inline SVGs for brass lamps and rangoli mandala. |
| **CSS3** | Responsive layouts, CSS custom properties, gold text shimmers, realistic flame keyframe animations, glassmorphism. |
| **Vanilla JavaScript (ES6+)** | Fireworks physics engine, particle lifecycle, touch/mouse event listeners, UI state manager. |
| **HTML5 Canvas** | High-performance 60 FPS particle rendering with `devicePixelRatio` scaling. |
| **Web Audio API** | Real-time procedural audio synthesis for fireworks, bells, crackles, and ambient music. |

> **Note**: Completely self-contained. No React, Angular, Vue, Bootstrap, Tailwind, backend server, database, or external audio libraries are required. Works 100% offline!

---

## 📂 Project Structure

```text
deepavali-celebration/
│
├── index.html       # Semantic HTML5 layout, inline SVGs, audio defs & greetings
├── style.css        # Responsive styling, color palettes, diya flames & animations
├── script.js        # Canvas fireworks, petal physics, Web Audio synthesizer & interactions
└── README.md        # Documentation, architecture guide & deployment instructions
```

---

## 🚀 How to Run Locally

You do not need to install any package manager (Node.js, npm, yarn) or set up a build pipeline.

### Option 1: Direct File Open
Double click `index.html` in your file explorer to open it directly in any modern browser (Chrome, Firefox, Safari, Edge, Android Chrome, Samsung Internet).

### Option 2: Using VS Code Live Server
1. Open the project folder in [Visual Studio Code](https://code.visualstudio.com/).
2. Install the **Live Server** extension.
3. Click **"Go Live"** on the bottom status bar or right-click `index.html` and choose **"Open with Live Server"**.

### Option 3: Using Python Built-in Server
Open your terminal in the project directory and run:

```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

## 🌐 How to Deploy to GitHub Pages (100% Free)

Deploying this project to GitHub Pages takes less than 2 minutes:

### Step 1: Initialize Git and Commit
Open a terminal in the project directory:

```bash
git init
git add .
git commit -m "Initial commit: Deepavali celebration website"
```

### Step 2: Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (e.g., `deepavali-celebration`).
2. Link your local repo and push:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/deepavali-celebration.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click on **Settings** (top right tab).
3. Scroll down on the left sidebar to **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Choose `main` and folder `/(root)`.
5. Click **Save**.
6. Wait 30–60 seconds, and GitHub will provide your live URL:
   `https://<your-username>.github.io/deepavali-celebration/`

---

## 📱 Cross-Device Responsiveness & Accessibility

- **Desktop & Laptop**: Full cinematic 4K / Ultra-wide support with high particle resolution.
- **Android & iOS Mobile Phones**: Touch-optimized hit targets, responsive button wrap, clamped font sizing, and throttled particle counts to maintain silky-smooth 60 FPS even on lower-end devices.
- **Accessibility**: Includes `aria-label`, `role` attributes, keyboard navigation (Tab, Enter, Space) for diyas and buttons, and respects the user's `prefers-reduced-motion` settings.

---

## 🕉️ Traditional Message

> **ದೀಪಾವಳಿ ಹಬ್ಬದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು!**  
> *May the divine light of Deepavali bring joy, peace, prosperity, and good health to you and your family.*

