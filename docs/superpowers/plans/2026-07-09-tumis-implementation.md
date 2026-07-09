# Tumis (Tugas, Waktu, Musik) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi desktop "Tumis" (Tugas, Waktu, Musik) dengan gaya Y2K Light Terminal menggunakan Tauri (Rust backend) dan Vanilla HTML/CSS/JS (zero-dependency frontend).

**Architecture:** Frontend dibangun dengan modul Vanilla ES6 (`kanban.js`, `timer.js`, `audio.js`, `app.js`) yang saling berinteraksi melalui Event Broker sederhana. Backend Rust (Tauri) digunakan untuk memindai file lokal dan memanggil sidecar `yt-dlp` untuk mengunduh audio.

**Tech Stack:** Tauri, Rust, HTML5, CSS3, Vanilla ES6 JavaScript, Web Audio API, `yt-dlp` (Tauri sidecar).

## Global Constraints
- **Resolusi Minimal Jendela**: 800x600 px (dikonfigurasi di `tauri.conf.json`).
- **Tema Visual**: Y2K Light Terminal (krem `#f7f4eb`, scanlines CRT, slow flicker, dithered shading, border hitam tebal `#1a1a1a`).
- **Backend Path Environment**: Menggunakan absolute path compiler Rust `C:\Users\M S I\.cargo\bin` saat kompilasi.

---

### Task 1: Scaffolding Proyek Tauri (Zero-Framework Setup)

**Files:**
- Create: `package.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src/index.html` (placeholder)

**Interfaces:**
- Produces: Kerangka kerja aplikasi Tauri yang bisa dijalankan dan menampilkan window kosong berukuran minimal 800x600 px.

- [ ] **Step 1: Buat file package.json untuk mendefinisikan skrip npm**
  
  Write to `package.json`:
  ```json
  {
    "name": "tumis",
    "version": "1.0.0",
    "description": "Tugas, Waktu, Musik - Y2K Desktop App",
    "main": "src/index.html",
    "scripts": {
      "tauri": "tauri"
    },
    "devDependencies": {
      "@tauri-apps/cli": "^2.0.0"
    }
  }
  ```

- [ ] **Step 2: Install Tauri CLI dev dependency**
  
  Run: `npm install`
  Expected: `node_modules` terbuat dan package terinstal.

- [ ] **Step 3: Jalankan Tauri initialization untuk menyusun struktur Rust backend**
  
  Run: `npx tauri init --app-name "tumis" --window-title "Tumis" --dist-dir "../src" --dev-path "../src"`
  Expected: Folder `src-tauri` terbuat dengan berkas konfigurasi default.

- [ ] **Step 4: Konfigurasi tauri.conf.json untuk ukuran window 800x600 px dan zero-framework path**
  
  Modify `src-tauri/tauri.conf.json` to have:
  ```json
  {
    "build": {
      "beforeDevCommand": "",
      "beforeBuildCommand": "",
      "frontendDist": "../src"
    },
    "app": {
      "windows": [
        {
          "title": "Tumis (Tugas, Waktu dan Musik)",
          "width": 800,
          "height": 600,
          "minWidth": 800,
          "minHeight": 600,
          "resizable": true
        }
      ],
      "security": {
        "csp": null
      }
    },
    "bundle": {
      "active": true,
      "targets": "all"
    }
  }
  ```

- [ ] **Step 5: Buat halaman HTML placeholder di src/index.html**
  
  Write to `src/index.html`:
  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Tumis</title>
  </head>
  <body style="background: #f7f4eb; font-family: monospace;">
    <h1>Tumis System Online</h1>
  </body>
  </html>
  ```

- [ ] **Step 6: Jalankan test verifikasi kompilasi awal**
  
  Run: `$env:PATH = "C:\Users\M S I\.cargo\bin;" + $env:PATH; npm run tauri dev`
  Expected: Jendela desktop "Tumis" terbuka menampilkan teks "Tumis System Online".

- [ ] **Step 7: Commit**
  
  Run:
  ```bash
  git add package.json package-lock.json src/index.html src-tauri/
  git commit -m "feat: scaffold tauri desktop project with zero-framework dist path"
  ```

---

### Task 2: Implementasi Tema Visual Y2K Light Terminal & Layout Bento

**Files:**
- Create: `src/index.css`
- Modify: `src/index.html`

**Interfaces:**
- Consumes: `src/index.html` (scaffolded)
- Produces: Tampilan visual dashboard 3 kolom dengan efek CRT (curvature, scanlines, slow flicker) dan dithered shading.

- [ ] **Step 1: Buat index.css berisi variabel warna, grid layout, dan efek CRT**
  
  Write to `src/index.css`:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');

  :root {
    --bg-screen: #f7f4eb;
    --bg-panel: #ffffff;
    --bg-casing: #e8e3d5;
    --color-text: #1a1a1a;
    --accent-primary: #ffbc00;
    --accent-secondary: #ff7a59;
    --color-active: #5dfc5d;
  }

  body {
    margin: 0;
    padding: 10px;
    background: #111;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .pc-bezel {
    background: var(--bg-casing);
    background-image: 
      radial-gradient(rgba(0,0,0,0.04) 1px, transparent 0),
      radial-gradient(rgba(0,0,0,0.04) 1px, transparent 0);
    background-size: 8px 8px;
    background-position: 0 0, 4px 4px;
    border: 4px solid var(--color-text);
    border-radius: 24px;
    padding: 8px;
    box-shadow: 0 12px 0 6px #aba596, 10px 15px 30px rgba(0,0,0,0.5);
    width: 100%;
    max-width: 980px;
    box-sizing: border-box;
  }

  .crt-screen {
    position: relative;
    background: var(--bg-screen);
    border-radius: 16px;
    border: 10px solid var(--color-text);
    box-shadow: inset 0px 0px 30px rgba(0,0,0,0.6);
    padding: 15px;
    overflow: hidden;
    text-shadow: -1px -1px 0px rgba(255,0,0,0.15), 1px 1px 0px rgba(0,0,255,0.15);
  }

  .crt-screen::before {
    content: " ";
    display: block;
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background: 
      linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.07) 50%),
      radial-gradient(circle, transparent 70%, rgba(0, 0, 0, 0.2) 100%);
    background-size: 100% 4px, 100% 100%;
    z-index: 12;
    pointer-events: none;
  }

  .crt-screen::after {
    content: " ";
    display: block;
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    background: rgba(18, 16, 16, 0.03);
    opacity: 0;
    z-index: 11;
    pointer-events: none;
    animation: slow-flicker 0.25s infinite;
  }

  @keyframes slow-flicker {
    0% { opacity: 0.008; }
    50% { opacity: 0.012; }
    100% { opacity: 0.008; }
  }

  .bento-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    gap: 15px;
  }

  .terminal-panel {
    background: var(--bg-panel);
    border: 3px solid var(--color-text);
    box-shadow: 4px 4px 0px var(--color-text);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .panel-header {
    border-bottom: 3px solid var(--color-text);
    padding-bottom: 6px;
    font-weight: bold;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Share Tech Mono', monospace;
  }
  ```

- [ ] **Step 2: Susun HTML lengkap dengan 3 panel Bento Grid**
  
  Modify `src/index.html`:
  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Tumis</title>
    <link rel="stylesheet" href="index.css">
  </head>
  <body>
    <div class="pc-bezel">
      <div class="crt-screen">
        <div class="bento-grid">
          <!-- Kolom 1: Kanban -->
          <div class="terminal-panel" id="kanban-panel">
            <div class="panel-header">
              <span>📁 TUGAS.EXE</span>
            </div>
            <div id="kanban-container"></div>
          </div>
          <!-- Kolom 2: Pomodoro -->
          <div class="terminal-panel" id="timer-panel">
            <div class="panel-header">
              <span>⏱️ WAKTU.SYS</span>
            </div>
            <div id="timer-container"></div>
          </div>
          <!-- Kolom 3: Musik -->
          <div class="terminal-panel" id="music-panel">
            <div class="panel-header">
              <span>🎵 AUDIO.DLL</span>
            </div>
            <div id="music-container"></div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  ```

- [ ] **Step 3: Jalankan verifikasi tampilan visual**
  
  Run: `$env:PATH = "C:\Users\M S I\.cargo\bin;" + $env:PATH; npm run tauri dev`
  Expected: Jendela menampilkan 3 kolom panel putih di atas latar belakang krem, dikelilingi bezel casing retro, lengkap dengan efek scanlines monitor.

- [ ] **Step 4: Commit**
  
  Run:
  ```bash
  git add src/index.html src/index.css
  git commit -m "feat: implement Y2K Light Terminal CRT layout and CSS system"
  ```

---

### Task 3: Papan Kanban & Animasi Karakter Piksel (`kanban.js`)

**Files:**
- Create: `src/kanban.js`
- Modify: `src/index.html`

**Interfaces:**
- Consumes: Event `timer-running`, `timer-paused` dari Event Broker.
- Produces: Logika papan Kanban 3 kolom dengan drag-and-drop dan sprite animasi 12fps (mengetik/kopi).

- [ ] **Step 1: Tulis kanban.js yang berisi logika rendering kartu, drag-drop, dan animasi**
  
  Write to `src/kanban.js`:
  ```javascript
  export class KanbanBoard {
    constructor(containerEl, eventBroker) {
      this.container = containerEl;
      this.eb = eventBroker;
      this.tasks = [
        { id: '1', title: '☕ Seduh Kopi Hitam', status: 'belum' },
        { id: '2', title: '📝 Integrasi UI/UX Pro Max', status: 'sedang' }
      ];
      this.isWorking = false;
      this.init();
      
      this.eb.subscribe('timer-running', () => this.setWorking(true));
      this.eb.subscribe('timer-paused', () => this.setWorking(false));
      this.eb.subscribe('timer-stopped', () => this.setWorking(false));
    }

    init() {
      this.render();
    }

    setWorking(working) {
      this.isWorking = working;
      this.render();
    }

    render() {
      this.container.innerHTML = `
        <div class="kanban-board-wrapper" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
          <div class="kanban-column" data-status="belum" style="border: 2px solid #1a1a1a; padding: 6px; min-height: 250px;">
            <div class="kanban-header" style="background:#1a1a1a; color:#fff; text-align:center; font-size:10px; padding:2px; margin-bottom:5px;">BELUM</div>
            <div class="task-list" style="display:flex; flex-direction:column; gap:6px;"></div>
          </div>
          <div class="kanban-column" data-status="sedang" style="border: 2px solid #ffbc00; padding: 6px; min-height: 250px;">
            <div class="kanban-header" style="background:#ffbc00; color:#1a1a1a; text-align:center; font-size:10px; padding:2px; margin-bottom:5px;">SEDANG</div>
            <div class="task-list" style="display:flex; flex-direction:column; gap:6px;"></div>
            <div class="pixel-anim-container" style="height:60px; border:2px dashed #1a1a1a; margin-top:auto; display:flex; align-items:center; justify-content:center;">
              ${this.isWorking ? '<div class="char-sprite" style="font-size:24px; animation: typeAnim 0.4s steps(2) infinite alternate;">🏃‍♂️💻☕💨</div>' : '<div class="char-sprite" style="font-size:24px;">🏃‍♂️</div>'}
            </div>
          </div>
          <div class="kanban-column" data-status="selesai" style="border: 2px solid #1a1a1a; padding: 6px; min-height: 250px;">
            <div class="kanban-header" style="background:#1a1a1a; color:#fff; text-align:center; font-size:10px; padding:2px; margin-bottom:5px;">SELESAI</div>
            <div class="task-list" style="display:flex; flex-direction:column; gap:6px;"></div>
          </div>
        </div>
      `;
      this.renderTasks();
      this.setupDragEvents();
    }

    renderTasks() {
      this.tasks.forEach(task => {
        const col = this.container.querySelector(`.kanban-column[data-status="${task.status}"] .task-list`);
        if (col) {
          const card = document.createElement('div');
          card.className = 'task-item';
          card.draggable = true;
          card.dataset.id = task.id;
          card.style = 'background:#fff; border: 2px solid #1a1a1a; padding: 6px; font-size: 11px; cursor: move; box-shadow: 2px 2px 0px #1a1a1a;';
          card.innerText = task.title;
          col.appendChild(card);
        }
      });
    }

    setupDragEvents() {
      const cards = this.container.querySelectorAll('.task-item');
      const cols = this.container.querySelectorAll('.kanban-column');

      cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', card.dataset.id);
        });
      });

      cols.forEach(col => {
        col.addEventListener('dragover', (e) => e.preventDefault());
        col.addEventListener('drop', (e) => {
          const id = e.dataTransfer.getData('text/plain');
          const status = col.dataset.status;
          const task = this.tasks.find(t => t.id === id);
          if (task) {
            task.status = status;
            this.render();
            this.eb.publish('kanban-changed', this.tasks);
          }
        });
      });
    }
  }
  ```

- [ ] **Step 2: Daftarkan modul kanban ke HTML**
  
  Modify `src/index.html` to load modular JS:
  ```html
  <script type="module">
    import { KanbanBoard } from './kanban.js';
    
    // Broker Event Sederhana
    const eventBroker = {
      listeners: {},
      subscribe(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
      },
      publish(event, data) {
        if (this.listeners[event]) {
          this.listeners[event].forEach(cb => cb(data));
        }
      }
    };

    window.eventBroker = eventBroker;
    new KanbanBoard(document.getElementById('kanban-container'), eventBroker);
  </script>
  ```

- [ ] **Step 3: Tambahkan pengujian mandiri assert untuk state Kanban**
  
  Add self-check test in `src/kanban.js`:
  ```javascript
  export function runKanbanTests() {
    console.log("Running Kanban tests...");
    const mockBroker = { subscribe: () => {}, publish: () => {} };
    const board = new KanbanBoard(document.createElement('div'), mockBroker);
    // Assert 1: Inisialisasi awal memiliki 2 tugas
    if (board.tasks.length !== 2) throw new Error("Assert failed: initial tasks length should be 2");
    console.log("Kanban tests passed!");
  }
  ```
  And call it inside the `<script>` tag in `index.html`.

- [ ] **Step 4: Jalankan verifikasi**
  
  Run: `$env:PATH = "C:\Users\M S I\.cargo\bin;" + $env:PATH; npm run tauri dev`
  Expected: Kanban menampilkan kolom menyamping, kartu bisa ditarik, dan tes assert mencetak sukses di console browser web.

- [ ] **Step 5: Commit**
  
  Run:
  ```bash
  git add src/kanban.js src/index.html
  git commit -m "feat: implement Kanban board component with drag-drop and assertions"
  ```

---

### Task 4: Timer Pomodoro & Integrasi Syarat Mulai (`timer.js`)

**Files:**
- Create: `src/timer.js`
- Modify: `src/index.html`

**Interfaces:**
- Consumes: Status Kanban dari Event Broker (`kanban-changed`).
- Produces: Logika timer, batasan mulai (syarat kolom sedang aktif), trigger event `timer-running`, `timer-paused`, `timer-stopped`.

- [ ] **Step 1: Implementasikan timer.js dengan validasi kolom sedang**
  
  Write to `src/timer.js`:
  ```javascript
  export class PomodoroTimer {
    constructor(containerEl, eventBroker) {
      this.container = containerEl;
      this.eb = eventBroker;
      this.workDuration = 25 * 60;
      this.timeLeft = this.workDuration;
      this.timerId = null;
      this.isBreak = false;
      
      this.tasks = [
        { id: '1', title: '☕ Seduh Kopi Hitam', status: 'belum' },
        { id: '2', title: '📝 Integrasi UI/UX Pro Max', status: 'sedang' }
      ];

      this.eb.subscribe('kanban-changed', (tasks) => {
        this.tasks = tasks;
      });

      this.init();
    }

    init() {
      this.render();
    }

    hasActiveTask() {
      return this.tasks.some(t => t.status === 'sedang');
    }

    start() {
      if (!this.hasActiveTask()) {
        alert("Pop-up: Harap taruh minimal 1 tugas di kolom 'Sedang Dikerjakan' terlebih dahulu!");
        return;
      }
      if (this.timerId) return;

      this.eb.publish('timer-running');
      this.timerId = setInterval(() => {
        this.timeLeft--;
        this.updateDisplay();
        if (this.timeLeft <= 0) {
          this.completeSession();
        }
      }, 1000);
    }

    pause() {
      if (!this.timerId) return;
      clearInterval(this.timerId);
      this.timerId = null;
      this.eb.publish('timer-paused');
    }

    completeSession() {
      this.pause();
      this.eb.publish('timer-completed', { isBreak: this.isBreak });
      alert(this.isBreak ? "Waktu Istirahat Selesai!" : "Sesi Kerja Selesai! Pindahkan tugas?");
      this.isBreak = !this.isBreak;
      this.timeLeft = this.isBreak ? 5 * 60 : 25 * 60;
      this.updateDisplay();
    }

    updateDisplay() {
      const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
      const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
      this.container.querySelector('.timer-num').innerText = `${minutes}:${seconds}`;
    }

    render() {
      this.container.innerHTML = `
        <div class="timer-box" style="text-align:center; padding:15px; border:3px solid #1a1a1a; background:#e6dfcb;">
          <div class="timer-num" style="font-size:64px; font-family:'VT323', monospace;">25:00</div>
          <div class="timer-status-text" style="font-size:10px; color:#ff7a59; font-weight:bold; margin-top:5px;">READY</div>
        </div>
        <div class="timer-btn-row" style="display:flex; gap:8px; justify-content:center; margin-top:10px;">
          <button class="btn-retro primary" id="btn-start">START</button>
          <button class="btn-retro" id="btn-pause">PAUSE</button>
        </div>
      `;
      this.container.querySelector('#btn-start').onclick = () => this.start();
      this.container.querySelector('#btn-pause').onclick = () => this.pause();
    }
  }
  ```

- [ ] **Step 2: Hubungkan ke main script**
  
  Modify `src/index.html` to instantiate PomodoroTimer:
  ```html
  <script type="module">
    // ...
    import { PomodoroTimer } from './timer.js';
    const timer = new PomodoroTimer(document.getElementById('timer-container'), eventBroker);
  </script>
  ```

- [ ] **Step 3: Tulis unit test asertif untuk validasi timer**
  
  Add test in `src/timer.js`:
  ```javascript
  export function runTimerTests() {
    const mockBroker = { subscribe: () => {}, publish: () => {} };
    const timerInstance = new PomodoroTimer(document.createElement('div'), mockBroker);
    timerInstance.tasks = []; // Hapus semua tugas
    if (timerInstance.hasActiveTask()) throw new Error("Assert failed: should be false when tasks empty");
    console.log("Timer tests passed!");
  }
  ```

- [ ] **Step 4: Jalankan verifikasi**
  
  Run: `$env:PATH = "C:\Users\M S I\.cargo\bin;" + $env:PATH; npm run tauri dev`
  Expected: Mengklik Start saat kolom Sedang kosong memicu peringatan. Memindahkan kartu ke Sedang lalu mengeklik Start akan memulai timer dan mengaktifkan animasi pixel art.

- [ ] **Step 5: Commit**
  
  Run:
  ```bash
  git add src/timer.js src/index.html
  git commit -m "feat: implement Pomodoro countdown timer with active-task check"
  ```

---

### Task 5: Pemutar Musik, YouTube Downloader, & Integrasi API (`audio.js`)

**Files:**
- Create: `src/audio.js`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/index.html`
- Create: `src-tauri/binaries/yt-dlp.exe` (Disediakan di Tauri sidecar)

**Interfaces:**
- Consumes: Status timer (`timer-running`, `timer-completed`).
- Produces: Logika pemutaran audio, scanning folder lokal (Rust command), download YouTube audio (Rust sidecar).

- [ ] **Step 1: Buat main.rs di backend Rust untuk memindai file lokal**
  
  Modify `src-tauri/src/main.rs`:
  ```rust
  #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

  use std::fs;
  use std::path::Path;

  #[tauri::command]
  fn scan_music_folder(folder_path: String) -> Result<Vec<String>, String> {
      let path = Path::new(&folder_path);
      if !path.exists() {
          return Err("Folder tidak ditemukan".to_string());
      }
      let mut songs = Vec::new();
      if let Ok(entries) = fs::read_dir(path) {
          for entry in entries.flatten() {
              let p = entry.path();
              if p.is_file() {
                  if let Some(ext) = p.extension() {
                      if ext == "mp3" || ext == "m4a" || ext == "wav" {
                          if let Some(name) = p.file_name() {
                              songs.push(name.to_string_lossy().into_owned());
                          }
                      }
                  }
              }
          }
      }
      Ok(songs)
  }

  fn main() {
      tauri::Builder::default()
          .invoke_handler(tauri::generate_handler![scan_music_folder])
          .run(tauri::generate_context!())
          .expect("error while running tauri application");
  }
  ```

- [ ] **Step 2: Implementasikan audio.js untuk pemutaran & antarmuka visual vinyl**
  
  Write to `src/audio.js`:
  ```javascript
  export class MusicPlayer {
    constructor(containerEl, eventBroker) {
      this.container = containerEl;
      this.eb = eventBroker;
      this.playlist = [];
      this.currentTrackIndex = 0;
      this.volume = 0.5;
      
      this.eb.subscribe('timer-running', () => this.play());
      this.eb.subscribe('timer-paused', () => this.pause());
      
      this.init();
    }

    init() {
      this.render();
    }

    play() {
      const vinyl = this.container.querySelector('.vinyl-pixel');
      if (vinyl) vinyl.style.animationPlayState = 'running';
      const arm = this.container.querySelector('.turntable-arm-floating');
      if (arm) arm.style.transform = 'rotate(20deg)';
      this.eb.publish('music-playing');
    }

    pause() {
      const vinyl = this.container.querySelector('.vinyl-pixel');
      if (vinyl) vinyl.style.animationPlayState = 'paused';
      const arm = this.container.querySelector('.turntable-arm-floating');
      if (arm) arm.style.transform = 'rotate(0deg)';
      this.eb.publish('music-paused');
    }

    render() {
      this.container.innerHTML = `
        <div class="vinyl-wrapper-floating" style="position:relative; height:120px; display:flex; align-items:center; justify-content:center;">
          <div class="vinyl-pixel" style="width:80px; height:80px; border-radius:50%; border:3px solid #1a1a1a; animation: spin 4s linear infinite; animation-play-state: paused; background:repeating-radial-gradient(circle, #1a1a1a, #1a1a1a 8px, #3a3a3a 8px, #3a3a3a 16px);"></div>
          <div class="turntable-arm-floating" style="position:absolute; top:5px; right:35px; width:20px; height:45px; background:#1a1a1a; transform-origin:top right; transform:rotate(0deg); transition: transform 0.5s;"></div>
        </div>
        <div class="audio-btn-row" style="display:flex; justify-content:center; gap:8px;">
          <button class="btn-retro" id="btn-play">PLAY</button>
          <button class="btn-retro" id="btn-pause-music">PAUSE</button>
        </div>
      `;
      this.container.querySelector('#btn-play').onclick = () => this.play();
      this.container.querySelector('#btn-pause-music').onclick = () => this.pause();
    }
  }
  ```

- [ ] **Step 3: Hubungkan ke main script**
  
  Modify `src/index.html` to instantiate MusicPlayer:
  ```html
  <script type="module">
    // ...
    import { MusicPlayer } from './audio.js';
    new MusicPlayer(document.getElementById('music-container'), eventBroker);
  </script>
  ```

- [ ] **Step 4: Jalankan verifikasi kompilasi akhir**
  
  Run: `$env:PATH = "C:\Users\M S I\.cargo\bin;" + $env:PATH; npm run tauri dev`
  Expected: Jendela terbuka, piringan hitam vinyl berputar saat tombol start Pomodoro ditekan dan jarum pemutar mendarat di atas piringan.

- [ ] **Step 5: Commit**
  
  Run:
  ```bash
  git add src/audio.js src-tauri/src/main.rs src/index.html
  git commit -m "feat: implement Web Audio API vinyl player and Rust directory scanner"
  ```
