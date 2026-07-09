# Spesifikasi Desain: Aplikasi Desktop "Tumis" (Tugas, Waktu, Musik)

Dokumen ini mendefinisikan spesifikasi arsitektur, visual, dan fungsional untuk aplikasi desktop **Tumis**, sebuah dasbor produktivitas terintegrasi yang menggabungkan papan Kanban, timer Pomodoro, dan pemutar musik offline dengan YouTube downloader.

---

## 1. Konsep & Estetika Visual: Y2K Light Terminal

Aplikasi ini menggunakan gaya **Y2K Light Terminal** yang memadukan kehangatan material fisik klasik dengan ketegasan antarmuka terminal siber minimalis.

### Kode Warna (Color Palette)
- **Background Utama (Screen)**: Krem Hangat `#f7f4eb`
- **Background Panel**: Putih bersih `#ffffff`
- **Casing PC Retro (Bezel)**: Abu-abu kekuningan PC jadul `#e8e3d5`
- **Teks & Border Utama**: Hitam Pekat `#1a1a1a`
- **Warna Aksen 1 (Primary)**: Kuning Emas `#ffbc00`
- **Warna Aksen 2 (Secondary)**: Orange Pastel `#ff7a59`
- **Indikator Aktif (Success)**: Hijau Neon Pudar `#5dfc5d`

### Efek Visual CRT & Dithering (CSS-Native)
- **Scanlines**: Garis-garis monitor tabung horizontal tipis menggunakan `linear-gradient` transparan yang berulang setiap 4px.
- **Curvature (Kelengkungan)**: Frame layar dibulatkan dengan `border-radius: 20px` dan dibungkus dalam casing tebal untuk memunculkan ilusi cembung kaca monitor tabung.
- **Subtle Flicker**: Animasi kedipan tipis berfrekuensi rendah pada layar (`opacity` berfluktuasi antara 0.008 hingga 0.012) untuk memberi nyawa pada monitor fosfor.
- **Dithered Shading**: Pola gradasi titik-titik silang (*checkerboard pattern* berukuran 4x4px) pada panel-panel utama untuk menggantikan gradasi warna modern.
- **Chromatic Aberration**: Efek pergeseran warna merah-biru tipis di tepi teks/border menggunakan `text-shadow` dan `box-shadow` berlapis.

---

## 2. Tata Letak Dasbor (3-Column Bento Grid)

Batas minimal jendela aplikasi dipertahankan pada **800x600 piksel** untuk menjaga keseimbangan layout. Panel disusun secara horizontal dalam satu jendela utama agar pengguna tidak perlu berpindah tab.

```
+-------------------------------------------------------------------------------+
| 💾 T U M I S                                        SYS_STATUS: ONLINE        |
+-------------------------------------------------------------------------------+
| [ 📁 TUGAS.EXE (Kanban) ] | [ ⏱️ WAKTU.SYS (Pomodoro) ] | [ 🎵 AUDIO.DLL (Musik) ] |
|                           |                             |                        |
| +-------++-------++-----+ | +-------------------------+ |  +------------------+  |
| | Belum ||Sedang ||Sel  | | |          25:00          | |  |    ( Vinyl )     |  |
| |       ||       ||     | | |                         | |  |    / \ Jarum     |  |
| |       || [Spr] ||     | | +-------------------------+ |  +------------------+  |
| |       ||       ||     | | [START]           [PAUSE]   | |  [Progress Bar]      |  |
| +-------++-------++-----+ | Durasi Kerja: [ 25 ]        | |  [⏮️]  [⏸️]  [⏭️]     |  |
|                           | Durasi Istirahat: [ 5 ]     | |  YT URL: [    ]      |  |
|                           |                             | |  [DOWNLOAD]          |  |
+-------------------------------------------------------------------------------+
```

### Kolom 1: Kanban Board (`TUGAS.EXE`)
Papan Kanban dibagi menjadi 3 kolom vertikal berdampingan:
1. **Belum Dikerjakan**
2. **Sedang Dikerjakan** (kolom aktif tempat tugas prioritas diletakkan).
3. **Selesai**

#### Mekanika Drag-and-Drop:
- Pengguna wajib memindahkan minimal 1 tugas ke kolom **Sedang Dikerjakan** agar Pomodoro bisa dimulai.
- Drag-and-drop didukung penuh untuk memindahkan kartu tugas secara manual dengan feedback visual berupa getaran kartu (shake animation) saat di-hover.

#### Animasi Karakter Piksel (Neo-Geo Style):
- **Kondisi Kosong / Idle**: Jika kolom "Sedang Dikerjakan" kosong atau timer di-pause, karakter piksel berdiri rileks (idle animation loop).
- **Kondisi Aktif (Timer Running)**: Karakter piksel duduk mengetik di depan PC mini secara dinamis (laju ketik bergoyang, kabel PC mini bergerak, uap/asap kopi membubung secara acak dengan framerate 12fps).

---

### Kolom 2: Pomodoro Timer (`WAKTU.SYS`)
- **Tampilan Waktu**: Menggunakan font digital/pixel LCD **`VT323`** berukuran besar.
- **Konfigurasi Bebas**: Kotak input angka durasi kerja dan istirahat yang fleksibel. Kotak input memiliki kursor terminal (`_`) yang berkedip di ujung teks saat dalam kondisi fokus.
- **Status Sesi**: Label status bertuliskan `KERJA` (warna kuning) atau `ISTIRAHAT` (warna hijau) di bawah angka waktu.

---

### Kolom 3: Pemutar Musik & Downloader (`AUDIO.DLL`)
- **Pixel Art Vinyl (Piringan Hitam)**: Digambar secara pixelated menggunakan radial gradient solid yang berulang dan shading warna pastel *flat*.
- **Jarum Pemutar (Turntable Arm)**:
  - **Status Pause/Stop**: Jarum berada di posisi luar (mengangkat).
  - **Status Play**: Jarum bergerak mulus ke dalam (mendarat di permukaan piringan hitam) lalu bergetar halus (*bass jiggle*) mengikuti spektrum suara musik.
- **Kontrol Musik**: Tombol Previous, Play/Pause, Next berukuran besar dengan bayangan solid tebal (`box-shadow: 4px 4px 0px #1a1a1a`).
- **Offline Source Folder**: Sekali klik tombol "Pilih Folder Sumber", aplikasi memindai seluruh file audio (`.mp3`, `.wav`, `.m4a`) dalam folder lokal laptop dan memasukkannya ke playlist internal.
- **YouTube Downloader**: Kotak input URL YouTube yang terintegrasi. Untuk menghindari ketergantungan wajib pada instalasi biner `ffmpeg` di komputer pengguna, biner `yt-dlp` dikonfigurasi untuk mengunduh audio format asli terbaik (seperti `.m4a` atau `.webm`) yang didukung langsung oleh Web Audio API di frontend.


---

## 3. Integrasi Mekanika Sebab-Akibat (Cause-Effect State Machine)

Ketiga fitur diikat menjadi satu alur kerja logis:

```mermaid
stateDiagram-v2
    [*] --> IdleState : Aplikasi Dibuka
    IdleState --> WaitTask : Klik Start Pomodoro (Jika kolom "Sedang" kosong)
    WaitTask --> IdleState : Pop-up "Pilih tugas prioritas terlebih dahulu!"
    
    IdleState --> SetupTask : Taruh tugas di kolom "Sedang Dikerjakan"
    SetupTask --> RunningState : Klik Start Pomodoro
    
    state RunningState {
        [*] --> FocusSess
        FocusSess: Karakter Piksel beranimasi kerja (12fps)
        FocusSess: Musik Fokus otomatis berputar & Vinyl berputar
        FocusSess: Jarum Vinyl mendarat & bergetar
    }
    
    RunningState --> PausedState : Klik Pause Pomodoro
    PausedState: Karakter Piksel kembali ke animasi santai (idle)
    PausedState: Musik terjeda & Jarum Vinyl terangkat
    PausedState --> RunningState : Klik Resume
    
    RunningState --> CompletedState : Waktu Pomodoro Habis (00:00)
    CompletedState: Alarm piksel berbunyi dengan penyesuaian volume aman
    CompletedState: Musik Fokus fade out
    CompletedState: Musik berganti ke playlist Istirahat
    CompletedState: Muncul Pop-up Konfirmasi manis untuk menyelesaikan tugas
    
    CompletedState --> SetupTask : Klik "Selesai" (Tugas pindah ke Selesai)
    CompletedState --> SetupTask : Klik "Lanjutkan Kerja" (Tugas tetap di Sedang)

### Aturan State Tambahan & Audio Edge Cases
1. **Lagu Habis Sebelum Pomodoro Selesai**:
   - *Kondisi*: Durasi lagu aktif selesai diputar sebelum waktu kerja Pomodoro habis.
   - *Respons*: Modul `audio.js` otomatis memutar lagu berikutnya dalam antrean Playlist Fokus.
   - *Kontrol*: Mode putar acak (Shuffle) dan ulangi (Repeat) dikendalikan secara independen melalui Web Audio API.
2. **Penyelarasan Volume Alarm (Mencegah Efek Kejut)**:
   - *Aturan*: Volume suara alarm piksel penanda sesi selesai **wajib disesuaikan secara proporsional (+20%)** dari tingkat volume slider musik aktif saat itu (dibatasi maksimal 100%). Hal ini dilakukan melalui kontrol gain node Web Audio API untuk menghindari lonjakan suara tiba-tiba yang dapat mengganggu fokus atau mengejutkan pengguna.

```

---

## 4. Arsitektur Kode & Teknologi (Ponytail Style)

### Frontend (Minimalist, Zero-Dependency)
- **HTML/CSS/JS**: Vanilla ES6 Modules. Kode dipisah menjadi modular:
  - `app.js` (Event broker & inisialisasi aplikasi).
  - `kanban.js` (Logika kartu, drag-drop, state karakter piksel).
  - `timer.js` (Logika countdown, peralihan sesi istirahat).
  - `audio.js` (Web Audio API, pemutaran playlist, fade out, input scanner).
- **CSS**: Pure vanilla CSS dengan CSS Variables untuk mengelola tema visual Y2K Light Terminal.

### Backend (Tauri & Rust Core)
Backend Tauri dibuat seminimal mungkin, hanya menangani fungsi yang tidak bisa dilakukan di browser:
1. **File System Scan**: Memindai folder musik lokal pilihan pengguna.
2. **Sidecar Downloader**: Menjalankan biner **`yt-dlp`** bawaan (sidecar) untuk mengunduh audio YouTube.
   - *Catatan Kaki Arsitektur (Optimasi Biner)*: Agar aplikasi berjalan secara mandiri (*zero-dependency*), Tauri mengonfigurasi `yt-dlp` untuk mengunduh audio dalam format `.m4a` atau `.webm` (audio-only) tanpa memerlukan transcode `ffmpeg` ke `.mp3`. Format-format ini secara native didukung penuh oleh browser engine di bawah Tauri Webview dan Web Audio API, sehingga ukuran kemasan aplikasi tetap minimalis (~15MB dibanding ~80MB jika menyertakan biner static `ffmpeg` sebagai sidecar kedua).


---

## 5. Rencana Pengujian Mandiri (Verification Check)
Setiap modul logika harus memiliki fungsi pengujian internal mandiri (self-check/assert) yang dapat dijalankan langsung di terminal lokal tanpa framework pengujian eksternal:
- **Kanban State Assert**: Memastikan tugas tidak dapat terduplikasi dan alur drag-and-drop memperbarui array data secara akurat.
- **Timer Count Assert**: Memastikan transisi dari 25:00 ke 00:00 berjalan tepat waktu dan memicu event `session-completed`.
- **Audio Scanner Assert**: Memverifikasi pemindaian folder mengabaikan file non-audio dan membaca format lagu dengan benar.
