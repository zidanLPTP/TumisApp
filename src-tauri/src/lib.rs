use std::fs;
use std::path::Path;
use std::process::Command;

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
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str == "mp3" || ext_str == "m4a" || ext_str == "wav" {
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

#[tauri::command]
fn download_youtube_audio(app: tauri::AppHandle, url: String, output_dir: String) -> Result<String, String> {
    use tauri::Manager;
    let path = Path::new(&output_dir);
    if !path.exists() {
        return Err("Folder output tidak ditemukan".to_string());
    }

    // Resolve the path to our bundled yt-dlp.exe
    let yt_dlp_path = app.path()
        .resolve("yt-dlp.exe", tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Gagal memetakan jalur resource: {}", e))?;

    // Download the best audio format that is natively playable (usually .m4a or .webm)
    let output = Command::new(yt_dlp_path)
        .args(&[
            "-f", "ba[ext=m4a]/ba",
            "-o", &format!("{}/%(title)s.%(ext)s", output_dir),
            &url
        ])
        .output();

    match output {
        Ok(out) => {
            if out.status.success() {
                // Get the standard output to read what filename was downloaded
                let stdout_str = String::from_utf8_lossy(&out.stdout).to_string();
                Ok(format!("Sukses: {}", stdout_str))
            } else {
                let err = String::from_utf8_lossy(&out.stderr).to_string();
                Err(format!("yt-dlp error: {}", err))
            }
        }
        Err(e) => Err(format!(
            "Gagal menjalankan biner yt-dlp bawaan: {}. Pastikan sistem operasi Anda mengizinkan pengeksekusian biner lokal.",
            e
        ))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![scan_music_folder, download_youtube_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
