export class PomodoroTimer {
  constructor(containerEl, eventBroker) {
    this.container = containerEl;
    this.eb = eventBroker;
    
    // Load config or use defaults
    this.workDurationMinutes = 25;
    this.breakDurationMinutes = 5;
    this.timeLeft = this.workDurationMinutes * 60;
    this.timerId = null;
    this.isBreak = false;
    
    // Tasks cache
    this.tasks = [];

    // Load tasks from storage initially if available
    const saved = localStorage.getItem('tumis_tasks');
    if (saved) {
      this.tasks = JSON.parse(saved);
    }

    // Subscribe to kanban changes to update task list
    this.eb.subscribe('kanban-changed', (tasks) => {
      this.tasks = tasks;
      
      const wasRunning = this.timerId !== null;
      // If timer is running, not on break, and there are no active tasks in progress
      if (wasRunning && !this.isBreak && !this.hasActiveTask()) {
        this.pause();
        alert("⚠️ SYSTEM HALT: Tidak ada tugas aktif di kolom 'SEDANG'. Timer otomatis dihentikan!");
      }
    });

    this.init();
  }

  init() {
    this.render();
    this.updateDisplay();
  }

  hasActiveTask() {
    return this.tasks.some(t => t.status === 'sedang');
  }

  playRetroAlarm() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Calculate safe volume based on DOM volume slider (+20%)
      const volumeSlider = document.getElementById('volume-slider');
      const currentVolume = volumeSlider ? parseFloat(volumeSlider.value) / 100 : 0.5;
      const alarmVolume = Math.min(1.0, currentVolume + 0.2);
      
      let startTime = audioCtx.currentTime;
      // 3 retro beeps
      for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, startTime);
        osc.frequency.setValueAtTime(660, startTime + 0.12);
        
        gainNode.gain.setValueAtTime(alarmVolume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.25);
        
        startTime += 0.35;
      }
    } catch (e) {
      console.warn("Unable to play sound: ", e);
    }
  }

  start() {
    if (!this.isBreak && !this.hasActiveTask()) {
      alert("⚠️ SYSTEM HALT: Taruh minimal 1 tugas di kolom 'SEDANG' untuk memulai!");
      return;
    }
    
    if (this.timerId) return;

    this.eb.publish('timer-running');
    this.container.querySelector('.timer-status-text').innerText = this.isBreak ? "BREAK ACTIVE" : "WORKING ACTIVE";
    this.container.querySelector('.timer-status-text').style.color = this.isBreak ? "var(--color-active)" : "var(--accent-primary)";

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
    this.container.querySelector('.timer-status-text').innerText = "PAUSED";
    this.container.querySelector('.timer-status-text').style.color = "var(--accent-secondary)";
  }

  stop() {
    this.pause();
    this.timeLeft = (this.isBreak ? this.breakDurationMinutes : this.workDurationMinutes) * 60;
    this.updateDisplay();
    this.eb.publish('timer-stopped');
    this.container.querySelector('.timer-status-text').innerText = "READY";
    this.container.querySelector('.timer-status-text').style.color = "var(--color-text)";
  }

  completeSession() {
    this.pause();
    this.playRetroAlarm();
    this.eb.publish('timer-finished');

    if (!this.isBreak) {
      // Finished working session
      alert("🎉 TUGAS SELESAI!\nSesi kerja selesai. Silakan pindahkan tugas yang telah selesai ke kolom 'SELESAI'.");
      
      // Auto transition to break
      this.isBreak = true;
      this.timeLeft = this.breakDurationMinutes * 60;
    } else {
      // Finished break session
      alert("⏱️ ISTIRAHAT SELESAI!\nSaatnya kembali fokus bekerja.");
      
      // Auto transition to work
      this.isBreak = false;
      this.timeLeft = this.workDurationMinutes * 60;
    }
    
    this.stop();
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (this.timeLeft % 60).toString().padStart(2, '0');
    this.container.querySelector('.timer-num').innerText = `${minutes}:${seconds}`;
  }

  applyConfig() {
    const workInput = this.container.querySelector('#work-min');
    const breakInput = this.container.querySelector('#break-min');
    
    const workVal = parseInt(workInput.value);
    const breakVal = parseInt(breakInput.value);
    
    if (isNaN(workVal) || workVal < 1 || isNaN(breakVal) || breakVal < 1) {
      alert("Masukkan durasi yang valid!");
      return;
    }
    
    this.workDurationMinutes = workVal;
    this.breakDurationMinutes = breakVal;
    
    this.stop();
  }

  render() {
    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:12px; height:100%; justify-content:center; align-items:center;">
        
        <!-- LCD Display -->
        <div class="lcd-screen" style="width:100%; text-align:center; box-sizing:border-box;">
          <div class="timer-num" style="font-size:72px; line-height:1; font-weight:bold; font-family:'VT323', monospace;">25:00</div>
          <div class="timer-status-text" style="font-size:12px; font-family:'Share Tech Mono', monospace; margin-top:6px; letter-spacing:2px; font-weight:bold; color:var(--color-text);">READY</div>
        </div>

        <!-- Tombol Kontrol -->
        <div style="display:flex; gap:8px; width:100%;">
          <button class="btn-retro primary" id="btn-start" style="flex-grow:1;">START</button>
          <button class="btn-retro" id="btn-pause" style="flex-grow:1;">PAUSE</button>
          <button class="btn-retro" id="btn-stop" style="flex-grow:1;">RESET</button>
        </div>

        <!-- Konfigurasi Durasi -->
        <div style="border:2px solid #1a1a1a; padding:8px; width:100%; box-sizing:border-box; background:#fff; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:10px; font-weight:bold; font-family:'Share Tech Mono', monospace; text-align:center; border-bottom:2px solid #1a1a1a; padding-bottom:4px;">KONFIGURASI.SYS</div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
            <span>Kerja (Min):</span>
            <div style="position:relative; display:inline-flex; align-items:center;">
              <input type="number" id="work-min" class="retro-input" value="25" min="1" max="99" style="width:50px; text-align:center; font-family:'Share Tech Mono', monospace;">
              <span class="terminal-cursor-work" style="position:absolute; right:4px; font-family:monospace; pointer-events:none; font-weight:bold; display:none;">_</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
            <span>Istirahat (Min):</span>
            <div style="position:relative; display:inline-flex; align-items:center;">
              <input type="number" id="break-min" class="retro-input" value="5" min="1" max="99" style="width:50px; text-align:center; font-family:'Share Tech Mono', monospace;">
              <span class="terminal-cursor-break" style="position:absolute; right:4px; font-family:monospace; pointer-events:none; font-weight:bold; display:none;">_</span>
            </div>
          </div>

          <button class="btn-retro" id="btn-apply" style="width:100%; font-size:10px; padding:4px;">APPLY CONFIG</button>
        </div>

      </div>
    `;

    // Bind actions
    this.container.querySelector('#btn-start').onclick = () => this.start();
    this.container.querySelector('#btn-pause').onclick = () => this.pause();
    this.container.querySelector('#btn-stop').onclick = () => this.stop();
    this.container.querySelector('#btn-apply').onclick = () => this.applyConfig();

    // Setup blinking cursors on focus
    const workInput = this.container.querySelector('#work-min');
    const workCursor = this.container.querySelector('.terminal-cursor-work');
    workInput.addEventListener('focus', () => { workCursor.style.display = 'inline'; workCursor.classList.add('terminal-cursor'); });
    workInput.addEventListener('blur', () => { workCursor.style.display = 'none'; workCursor.classList.remove('terminal-cursor'); });

    const breakInput = this.container.querySelector('#break-min');
    const breakCursor = this.container.querySelector('.terminal-cursor-break');
    breakInput.addEventListener('focus', () => { breakCursor.style.display = 'inline'; breakCursor.classList.add('terminal-cursor'); });
    breakInput.addEventListener('blur', () => { breakCursor.style.display = 'none'; breakCursor.classList.remove('terminal-cursor'); });
  }
}

export function runTimerTests() {
  console.log("Running Timer tests...");
  const mockBroker = { subscribe: () => {}, publish: () => {} };
  const timer = new PomodoroTimer(document.createElement('div'), mockBroker);
  timer.tasks = []; // Set empty tasks
  if (timer.hasActiveTask()) {
    throw new Error("Assert failed: should be false when tasks empty");
  }
  console.log("Timer tests passed!");
}
