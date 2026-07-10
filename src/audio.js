export class MusicPlayer {
  constructor(containerEl, eventBroker) {
    this.container = containerEl;
    this.eb = eventBroker;

    this.musicFolder = localStorage.getItem('tumis_music_folder') || '';
    this.playlist = [];
    this.currentTrackIndex = 0;
    this.isShuffle = false;
    this.isRepeat = false; // 'none', 'one', 'all' style
    this.isPlaying = false;
    
    // HTML5 Audio Element
    this.audio = new Audio();
    
    // Auto play next when track ends
    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    // Listen to timer events
    this.eb.subscribe('timer-running', () => {
      // Auto play music when timer starts if playlist is not empty
      if (this.playlist.length > 0 && !this.isPlaying) {
        this.play();
      }
    });

    this.eb.subscribe('timer-paused', () => {
      // Auto pause music when timer pauses
      if (this.isPlaying) {
        this.pause();
      }
    });

    this.eb.subscribe('timer-finished', () => {
      // Fade out and pause when timer finishes
      this.fadeOut();
    });

    this.init();
  }

  init() {
    this.render();
    if (this.musicFolder) {
      this.scanFolder();
    }
  }

  async scanFolder() {
    if (!this.musicFolder) return;
    const statusEl = this.container.querySelector('.music-status');
    statusEl.innerText = "Memindai folder...";
    
    try {
      // Call Tauri Rust command to scan folder
      // In Tauri v2 withGlobalTauri, the invoke function is at window.__TAURI__.core.invoke
      if (window.__TAURI__) {
        const songs = await window.__TAURI__.core.invoke('scan_music_folder', {
          folderPath: this.musicFolder
        });
        
        this.playlist = songs.map(songName => ({
          name: songName,
          path: `${this.musicFolder}/${songName}`.replace(/\/+/g, '/')
        }));
        
        localStorage.setItem('tumis_music_folder', this.musicFolder);
        statusEl.innerText = `${this.playlist.length} lagu dimuat.`;
        this.renderPlaylist();
        
        if (this.playlist.length > 0) {
          this.loadTrack(0);
        }
      } else {
        statusEl.innerText = "Tauri API tidak terdeteksi (mock mode).";
      }
    } catch (e) {
      console.error(e);
      statusEl.innerText = `Error: ${e}`;
    }
  }

  loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    const track = this.playlist[index];
    
    // Update displayed title
    this.container.querySelector('.current-song-title').innerText = track.name;
    
    // Convert local filepath to asset URL
    if (window.__TAURI__) {
      const assetUrl = window.__TAURI__.core.convertFileSrc(track.path);
      this.audio.src = assetUrl;
    } else {
      this.audio.src = '';
    }
    
    this.audio.load();
    
    // Update active playlist item class
    const items = this.container.querySelectorAll('.playlist-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.style.background = 'var(--accent-primary)';
        item.style.fontWeight = 'bold';
      } else {
        item.style.background = 'none';
        item.style.fontWeight = 'normal';
      }
    });
  }

  play() {
    if (this.playlist.length === 0) return;
    
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.container.querySelector('#btn-play-music').innerText = "PAUSE";
      
      const vinyl = this.container.querySelector('.vinyl-pixel');
      if (vinyl) {
        vinyl.style.animationPlayState = 'running';
      }
      
      const arm = this.container.querySelector('.turntable-arm-floating');
      if (arm) {
        arm.style.transform = 'rotate(24deg)';
        arm.style.animation = 'bass-jiggle 0.2s infinite alternate';
      }
    }).catch(err => {
      console.error("Audio playback failed: ", err);
    });
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.container.querySelector('#btn-play-music').innerText = "PLAY";
    
    const vinyl = this.container.querySelector('.vinyl-pixel');
    if (vinyl) {
      vinyl.style.animationPlayState = 'paused';
    }
    
    const arm = this.container.querySelector('.turntable-arm-floating');
    if (arm) {
      arm.style.transform = 'rotate(0deg)';
      arm.style.animation = 'none';
    }
  }

  playNext() {
    if (this.playlist.length === 0) return;
    
    if (this.isRepeat && !this.isShuffle) {
      // Repeat current track
      this.loadTrack(this.currentTrackIndex);
    } else if (this.isShuffle) {
      const randIndex = Math.floor(Math.random() * this.playlist.length);
      this.loadTrack(randIndex);
    } else {
      let nextIndex = this.currentTrackIndex + 1;
      if (nextIndex >= this.playlist.length) {
        nextIndex = 0; // Loop playlist back to start
      }
      this.loadTrack(nextIndex);
    }
    
    this.play();
  }

  playPrev() {
    if (this.playlist.length === 0) return;
    
    let prevIndex = this.currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.playlist.length - 1;
    }
    this.loadTrack(prevIndex);
    this.play();
  }

  setVolume(val) {
    this.volume = val / 100;
    this.audio.volume = this.volume;
  }

  fadeOut() {
    // Fade out audio smoothly over 1.5 seconds
    let currentVol = this.audio.volume;
    const interval = 100; // ms
    const step = currentVol / 15;
    
    const fadeTimer = setInterval(() => {
      if (currentVol > step) {
        currentVol -= step;
        this.audio.volume = currentVol;
      } else {
        this.audio.volume = 0;
        this.pause();
        clearInterval(fadeTimer);
        // Reset volume back to user preference
        this.audio.volume = this.volume;
      }
    }, interval);
  }

  async downloadAudio() {
    const urlInput = this.container.querySelector('#yt-url-input');
    const dlStatusEl = this.container.querySelector('.dl-status');
    const url = urlInput.value.trim();
    
    if (!url) return;
    if (!this.musicFolder) {
      alert("Harap tentukan folder sumber musik terlebih dahulu sebelum mengunduh!");
      return;
    }
    
    dlStatusEl.innerText = "Mengunduh audio dari YouTube...";
    dlStatusEl.style.color = "var(--accent-secondary)";
    
    try {
      if (window.__TAURI__) {
        const res = await window.__TAURI__.core.invoke('download_youtube_audio', {
          url: url,
          outputDir: this.musicFolder
        });
        dlStatusEl.innerText = "Selesai! Memperbarui playlist...";
        dlStatusEl.style.color = "var(--color-active)";
        urlInput.value = '';
        this.scanFolder();
      } else {
        dlStatusEl.innerText = "Mmock download sukses.";
      }
    } catch (e) {
      console.error(e);
      dlStatusEl.innerText = `Gagal: ${e}`;
      dlStatusEl.style.color = "red";
      
      const errText = String(e);
      if (errText.includes("403") || errText.includes("Forbidden") || errText.includes("signature")) {
        alert("⚠️ SYSTEM HALT: Biner 'yt-dlp' Anda kedaluwarsa (HTTP 403 Forbidden).\n\nSolusi: Buka PowerShell/Command Prompt Anda, lalu jalankan:\n\nyt-dlp -U\n\nUntuk memperbarui ke versi terbaru.");
      } else if (errText.includes("JavaScript") || errText.includes("JS runtime") || errText.includes("runtime could be found")) {
        alert("⚠️ SYSTEM HALT: Runtime JavaScript tidak ditemukan oleh 'yt-dlp'.\n\nSolusi: Buka PowerShell/Command Prompt Anda, lalu jalankan:\n\nwinget install --id=DenoLand.Deno\n\nLalu restart aplikasi ini agar PATH baru terbaca.");
      }
    }
  }

  renderPlaylist() {
    const listEl = this.container.querySelector('.playlist-items');
    listEl.innerHTML = '';
    
    this.playlist.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.style = 'font-size: 11px; padding: 4px; border-bottom: 1px dotted #ccc; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      item.innerText = `${index + 1}. ${track.name}`;
      
      item.addEventListener('click', () => {
        this.loadTrack(index);
        this.play();
      });
      
      listEl.appendChild(item);
    });
    
    // Refresh current loaded class
    this.loadTrack(this.currentTrackIndex);
  }

  render() {
    this.container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; height:100%;">
        
        <!-- Turntable Deck & Vinyl -->
        <div class="vinyl-wrapper-floating" style="position:relative; height:100px; display:flex; align-items:center; justify-content:center; border:2px solid #1a1a1a; background:#151815; overflow:hidden; border-radius:6px; box-shadow:inset 0 0 10px rgba(0,0,0,0.8);">
          <!-- Glowing Scanlines behind vinyl -->
          <div style="position:absolute; inset:0; background:linear-gradient(rgba(18,16,16,0) 50%, rgba(93,252,93,0.05) 50%); background-size:100% 4px; pointer-events:none;"></div>
          
          <!-- Vinyl Disc -->
          <div class="vinyl-pixel" style="width:72px; height:72px; border-radius:50%; border:3px solid #1a1a1a; animation: spin 4s linear infinite; animation-play-state: paused; background:repeating-radial-gradient(circle, #222, #222 6px, #444 6px, #444 12px); box-shadow:0 0 10px rgba(0,0,0,0.8); z-index:1;">
            <!-- Pastel glare reflection overlay -->
            <div style="position:absolute; top:5px; left:5px; right:5px; bottom:5px; border-radius:50%; background:linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%); pointer-events:none;"></div>
            <!-- Center label -->
            <div style="position:absolute; top:24px; left:24px; width:24px; height:24px; border-radius:50%; background:var(--accent-primary); border:2px solid #1a1a1a; box-sizing:border-box;"></div>
          </div>

          <!-- Turntable Arm -->
          <div class="turntable-arm-floating" style="position:absolute; top:12px; right:45px; width:24px; height:45px; background:none; border-right:4px solid #fff; border-top:4px solid #fff; border-radius:0 12px 0 0; transform-origin:top right; transform:rotate(0deg); transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); z-index:2; pointer-events:none;">
            <!-- Cartridge/Needle block -->
            <div style="position:absolute; bottom:0; left:-4px; width:8px; height:12px; background:var(--accent-secondary); border:1px solid #1a1a1a;"></div>
          </div>
        </div>

        <!-- Song info -->
        <div style="border:2px solid #1a1a1a; padding:6px; background:#fff; font-size:11px; min-height:36px; display:flex; flex-direction:column; justify-content:center; box-sizing:border-box;">
          <div style="font-size:9px; font-weight:bold; color:#777; font-family:'Share Tech Mono', monospace;">NOW PLAYING:</div>
          <div class="current-song-title" style="font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">(Tidak ada lagu)</div>
        </div>

        <!-- Controls -->
        <div style="display:flex; flex-direction:column; gap:6px;">
          <!-- Buttons row -->
          <div style="display:flex; gap:6px; justify-content:center;">
            <button class="btn-retro" id="btn-prev-music" style="padding:4px 8px;">PREV</button>
            <button class="btn-retro primary" id="btn-play-music" style="padding:4px 12px; flex-grow:1;">PLAY</button>
            <button class="btn-retro" id="btn-next-music" style="padding:4px 8px;">NEXT</button>
          </div>

          <!-- Volume and Shuffle/Repeat -->
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:11px; padding:0 4px;">
            <div style="display:flex; align-items:center; gap:4px;">
              <img src="assets/VOLUME.svg" style="height: 12px; width: auto;" alt="Volume Icon"/>
              <input type="range" id="volume-slider" min="0" max="100" value="50" style="width:70px; accent-color:#1a1a1a;">
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-retro" id="btn-shuffle" style="padding:2px 6px; font-size:9px;">SHUFFLE</button>
              <button class="btn-retro" id="btn-repeat" style="padding:2px 6px; font-size:9px;">LOOP</button>
            </div>
          </div>
        </div>

        <!-- Local Directory Select -->
        <div style="border:2px solid #1a1a1a; padding:6px; background:#fff; display:flex; flex-direction:column; gap:4px;">
          <div style="font-size:9px; font-weight:bold; font-family:'Share Tech Mono', monospace;">LOCAL_SOURCE:</div>
          <div style="display:flex; gap:4px;">
            <input type="text" id="music-folder-input" class="retro-input" placeholder="Path folder musik..." value="${this.musicFolder}" style="flex-grow:1; font-size:10px; padding:4px;">
            <button class="btn-retro" id="btn-scan-folder" style="font-size:10px; padding:2px 6px;">SCAN</button>
          </div>
          <div class="music-status" style="font-size:9px; color:#666;">(Folder belum dipindai)</div>
        </div>

        <!-- YouTube Downloader -->
        <div style="border:2px solid #1a1a1a; padding:6px; background:#fff; display:flex; flex-direction:column; gap:4px;">
          <div style="font-size:9px; font-weight:bold; font-family:'Share Tech Mono', monospace;">YT_DOWNLOADER:</div>
          <div style="display:flex; gap:4px;">
            <input type="text" id="yt-url-input" class="retro-input" placeholder="URL Video YouTube..." style="flex-grow:1; font-size:10px; padding:4px;">
            <button class="btn-retro" id="btn-download-yt" style="font-size:10px; padding:2px 6px;">DL</button>
          </div>
          <div class="dl-status" style="font-size:9px; color:#666;">Ready</div>
        </div>

        <!-- Playlist Panel -->
        <div style="border:2px solid #1a1a1a; background:#fff; flex-grow:1; display:flex; flex-direction:column; min-height:80px; max-height:130px; box-sizing:border-box;">
          <div style="background:#1a1a1a; color:#fff; font-size:9px; padding:2px; font-weight:bold; text-align:center; font-family:'Share Tech Mono', monospace;">PLAYLIST.LST</div>
          <div class="playlist-items" style="flex-grow:1; overflow-y:auto; padding:2px; display:flex; flex-direction:column;">
            <div style="font-size:10px; color:#999; text-align:center; padding-top:20px;">Playlist kosong</div>
          </div>
        </div>

      </div>
    `;

    // Bind controls
    this.container.querySelector('#btn-play-music').onclick = () => {
      if (this.isPlaying) this.pause();
      else this.play();
    };
    this.container.querySelector('#btn-prev-music').onclick = () => this.playPrev();
    this.container.querySelector('#btn-next-music').onclick = () => this.playNext();
    
    const slider = this.container.querySelector('#volume-slider');
    slider.oninput = (e) => this.setVolume(e.target.value);
    this.setVolume(slider.value);

    // Shuffle & Repeat buttons
    const shuffleBtn = this.container.querySelector('#btn-shuffle');
    shuffleBtn.onclick = () => {
      this.isShuffle = !this.isShuffle;
      shuffleBtn.style.background = this.isShuffle ? 'var(--accent-primary)' : '';
      shuffleBtn.style.fontWeight = this.isShuffle ? 'bold' : '';
    };

    const repeatBtn = this.container.querySelector('#btn-repeat');
    repeatBtn.onclick = () => {
      this.isRepeat = !this.isRepeat;
      repeatBtn.style.background = this.isRepeat ? 'var(--accent-primary)' : '';
      repeatBtn.style.fontWeight = this.isRepeat ? 'bold' : '';
    };

    // Folder setup
    this.container.querySelector('#btn-scan-folder').onclick = () => {
      const input = this.container.querySelector('#music-folder-input');
      this.musicFolder = input.value.trim();
      this.scanFolder();
    };

    // Youtube download setup
    this.container.querySelector('#btn-download-yt').onclick = () => this.downloadAudio();
  }
}

export function runPlayerTests() {
  console.log("Running Player tests...");
  const mockBroker = { subscribe: () => {}, publish: () => {} };
  const player = new MusicPlayer(document.createElement('div'), mockBroker);
  if (player.playlist.length !== 0) {
    throw new Error("Assert failed: playlist should start empty");
  }
  console.log("Player tests passed!");
}
