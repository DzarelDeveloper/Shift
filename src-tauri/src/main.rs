// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, AppHandle, Emitter, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
#[cfg(target_os = "linux")]
use freedesktop_icons::lookup;

#[derive(Serialize, Deserialize, Clone, Debug)]
struct AppInfo {
    id: String,
    name: String,
    path: String,
    icon: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct SystemInfo {
    platform: String,
    os_version: String,
    arch: String,
}



struct AppState {
    launcher_shortcut: Mutex<Option<Shortcut>>,
    dashboard_shortcut: Mutex<Option<Shortcut>>,
    minimize_to_tray: Mutex<bool>,
}

fn get_default_launcher_shortcut() -> &'static str {
    #[cfg(target_os = "macos")]
    {
        "Cmd+Opt+Space"
    }
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        "Ctrl+Shift+Space"
    }
}

fn get_default_dashboard_shortcut() -> &'static str {
    #[cfg(target_os = "macos")]
    {
        "Cmd+Opt+Enter"
    }
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        "Ctrl+Alt+Enter"
    }
}

#[tauri::command]
fn get_installed_apps() -> Vec<AppInfo> {
    let mut apps: Vec<AppInfo> = Vec::new();
    
    #[cfg(target_os = "linux")]
    {
        use std::fs;
        use std::path::Path;
        use std::collections::HashMap;
        use std::sync::Mutex;
        
        // Cache icon untuk menghindari scan berulang
        static ICON_CACHE: Mutex<Option<HashMap<String, Option<String>>>> = Mutex::new(None);
        
        fn resolve_icon(icon_name: &str, cache: &mut HashMap<String, Option<String>>) -> Option<String> {
            // Cek cache terlebih dahulu
            if let Some(cached) = cache.get(icon_name) {
                return cached.clone();
            }
            
            // Jika iconnya sudah path absolute
            if Path::new(icon_name).is_absolute() {
                let result = Some(icon_name.to_string());
                cache.insert(icon_name.to_string(), result.clone());
                return result;
            }
            
            let mut result: Option<String> = None;
            
            // Coba 1: Cari menggunakan freedesktop-icons (cara standar)
            if result.is_none() {
                result = lookup(icon_name)
                    .with_size(48)
                    .find()
                    .map(|p| p.to_string_lossy().to_string());
            }
            if result.is_none() {
                result = lookup(icon_name)
                    .with_size(64)
                    .find()
                    .map(|p| p.to_string_lossy().to_string());
            }
            if result.is_none() {
                result = lookup(icon_name)
                    .with_size(32)
                    .find()
                    .map(|p| p.to_string_lossy().to_string());
            }
            if result.is_none() {
                result = lookup(icon_name)
                    .find()
                    .map(|p| p.to_string_lossy().to_string());
            }
            
            // Coba 2: Cari di direktori tambahan dengan berbagai ekstensi
            if result.is_none() {
                let extra_dirs = [
                    "/usr/share/pixmaps",
                    "/usr/share/icons/gnome",
                    "/usr/share/icons/hicolor",
                    "/usr/share/icons",
                ];
                let extensions = ["png", "svg", "xpm", "jpg", "jpeg"];
                
                for dir in extra_dirs {
                    for ext in extensions {
                        let candidate = format!("{}/{}.{}", dir, icon_name, ext);
                        if Path::new(&candidate).exists() {
                            result = Some(candidate);
                            break;
                        }
                        let candidate_no_ext = format!("{}/{}", dir, icon_name);
                        if Path::new(&candidate_no_ext).exists() {
                            result = Some(candidate_no_ext);
                            break;
                        }
                    }
                    if result.is_some() {
                        break;
                    }
                }
            }
            
            // Simpan ke cache
            cache.insert(icon_name.to_string(), result.clone());
            result
        }
        
        let mut scanned_count = 0;
        let mut parsed_count = 0;
        let mut rejected_count = 0;
        let mut skipped_count = 0;
        
        fn scan_dir(dir: &Path, apps: &mut Vec<AppInfo>, cache: &mut HashMap<String, Option<String>>,
                     scanned_count: &mut u32, parsed_count: &mut u32, rejected_count: &mut u32, skipped_count: &mut u32) {
            if !dir.exists() {
                return;
            }
            match fs::read_dir(dir) {
                Ok(entries) => {
                    for entry in entries.flatten() {
                        *scanned_count += 1;
                        let entry_path = entry.path();
                        if entry_path.is_file() && entry_path.extension().and_then(|e| e.to_str()) == Some("desktop") {
                            match fs::read_to_string(&entry_path) {
                                Ok(content) => {
                                    let mut name = String::new();
                                    let mut exec = String::new();
                                    let mut icon = None;
                                    let mut in_desktop_entry = false;
                                    let mut no_display = false;
                                    for line in content.lines() {
                                        let line = line.trim();
                                        if line == "[Desktop Entry]" {
                                            in_desktop_entry = true;
                                        } else if in_desktop_entry && line.starts_with('[') {
                                            break;
                                        } else if in_desktop_entry {
                                            if line.starts_with("Name=") {
                                                name = line[5..].to_string();
                                            } else if line.starts_with("Exec=") {
                                                let raw_exec = &line[5..];
                                                let mut cleaned_exec = raw_exec.to_string();
                                                let placeholders = [
                                                    "%U", "%u", "%F", "%f", "%D", "%d", "%N", "%n",
                                                    "%i", "%c", "%k", "%v", "%m"
                                                ];
                                                for placeholder in placeholders {
                                                    cleaned_exec = cleaned_exec.replace(placeholder, "");
                                                }
                                                exec = cleaned_exec.trim().to_string();
                                            } else if line.starts_with("Icon=") {
                                                let icon_name = line[5..].to_string();
                                                icon = resolve_icon(&icon_name, cache);
                                            } else if line.eq_ignore_ascii_case("NoDisplay=true") {
                                                no_display = true;
                                            }
                                        }
                                    }
                                    if !name.is_empty() && !exec.is_empty() && !no_display {
                                        if apps.iter().any(|a| a.name == name) {
                                            *skipped_count += 1;
                                            continue;
                                        }
                                        let id = format!("{}-{}", name.replace(' ', "_"), exec.replace(' ', "_"));
                                        apps.push(AppInfo { id, name, path: exec, icon });
                                        *parsed_count += 1;
                                    } else {
                                        *rejected_count += 1;
                                    }
                                }
                                Err(e) => {
                                    *rejected_count += 1;
                                    eprintln!("[Apps] Failed to read .desktop file {:?}: {:?}", entry_path, e);
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[Apps] Failed to read directory {:?}: {:?}", dir, e);
                }
            }
        }

        // Inisialisasi cache
        let mut cache_lock = ICON_CACHE.lock().unwrap();
        let mut cache = cache_lock.take().unwrap_or_else(HashMap::new);
        drop(cache_lock);

        let desktop_dirs = [
            "/usr/share/applications",
            "/usr/local/share/applications",
            &format!("{}/.local/share/applications", std::env::var("HOME").unwrap_or_default()),
        ];
        for dir in desktop_dirs {
            scan_dir(Path::new(dir), &mut apps, &mut cache, &mut scanned_count, &mut parsed_count, &mut rejected_count, &mut skipped_count);
        }

        // Simpan kembali cache
        let mut cache_lock = ICON_CACHE.lock().unwrap();
        *cache_lock = Some(cache);
        drop(cache_lock);

        eprintln!("[Apps] Linux scan: scanned={}, parsed={}, rejected={}, skipped={}, total={}",
                  scanned_count, parsed_count, rejected_count, skipped_count, apps.len());
    }

    #[cfg(target_os = "windows")]
    {
        use std::path::Path;
        use walkdir::WalkDir;

        let start_menu_dirs = [
            format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", std::env::var("ProgramData").unwrap_or_else(|_| "C:\\ProgramData".to_string())),
            format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", std::env::var("APPDATA").unwrap_or_else(|_| "".to_string())),
        ];

        let mut scanned_count = 0;
        let mut parsed_count = 0;
        let mut skipped_count = 0;

        for dir in start_menu_dirs.iter() {
            let path = Path::new(dir);
            if !path.exists() {
                continue;
            }
            for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
                scanned_count += 1;
                let entry_path = entry.path();
                if entry_path.is_file() && entry_path.extension().and_then(|e| e.to_str()) == Some("lnk") {
                    if let Some(file_stem) = entry_path.file_stem().and_then(|n| n.to_str()) {
                        if apps.iter().any(|a| a.name == file_stem) {
                            skipped_count += 1;
                            continue;
                        }
                        let path_str = entry_path.to_string_lossy().to_string();
                        let id = format!("{}-{}", file_stem.replace(' ', "_"), path_str.replace(' ', "_"));
                        apps.push(AppInfo {
                            id,
                            name: file_stem.to_string(),
                            path: path_str,
                            icon: None,
                        });
                        parsed_count += 1;
                    }
                }
            }
        }
        eprintln!("[Apps] Windows scan: scanned={}, parsed={}, skipped={}, total={}", scanned_count, parsed_count, skipped_count, apps.len());
    }

    #[cfg(target_os = "macos")]
    {
        use std::path::Path;
        use std::fs;

        let app_dirs = [
            "/Applications",
            "/System/Applications",
            &format!("{}/Applications", std::env::var("HOME").unwrap_or_default()),
        ];

        let mut scanned_count = 0;
        let mut parsed_count = 0;
        let mut skipped_count = 0;

        for dir in app_dirs.iter() {
            let path = Path::new(dir);
            if !path.exists() {
                continue;
            }
            if let Ok(entries) = fs::read_dir(path) {
                for entry in entries.flatten() {
                    scanned_count += 1;
                    let entry_path = entry.path();
                    if entry_path.is_dir() && entry_path.extension().and_then(|e| e.to_str()) == Some("app") {
                        if let Some(file_stem) = entry_path.file_stem().and_then(|n| n.to_str()) {
                            if apps.iter().any(|a| a.name == file_stem) {
                                skipped_count += 1;
                                continue;
                            }
                            let path_str = entry_path.to_string_lossy().to_string();
                            let id = format!("{}-{}", file_stem.replace(' ', "_"), path_str.replace(' ', "_"));
                            apps.push(AppInfo {
                                id,
                                name: file_stem.to_string(),
                                path: path_str,
                                icon: None,
                            });
                            parsed_count += 1;
                        }
                    }
                }
            }
        }
        eprintln!("[Apps] macOS scan: scanned={}, parsed={}, skipped={}, total={}", scanned_count, parsed_count, skipped_count, apps.len());
    }
    
    apps.sort_by(|a, b| a.name.cmp(&b.name));
    eprintln!("[Apps] Indexed {} applications total", apps.len());
    apps
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    use sysinfo::System;
    let os_version = System::long_os_version().unwrap_or_else(|| "Unknown".to_string());
    let platform = System::name().unwrap_or_else(|| "Unknown".to_string());
    SystemInfo {
        platform,
        os_version,
        arch: std::env::consts::ARCH.to_string(),
    }
}

#[tauri::command]
fn launch_application(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to launch app: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to launch app: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        // Use shlex to safely parse command arguments and prevent command injection
        if let Some(mut parts) = shlex::split(&path) {
            if !parts.is_empty() {
                let cmd = parts.remove(0);
                let mut command = std::process::Command::new(cmd);
                command.args(parts);
                
                // If running inside an AppImage, it sets LD_LIBRARY_PATH which can break system apps.
                // We must remove it so the child process uses the system's libraries.
                if std::env::var("APPIMAGE").is_ok() {
                    command.env_remove("LD_LIBRARY_PATH");
                }
                
                command
                    .stdin(std::process::Stdio::null())
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn()
                    .map_err(|e| format!("Failed to launch app: {}", e))?;
            }
        } else {
            return Err("Failed to parse command arguments".to_string());
        }
    }
    Ok(())
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn get_minimize_to_tray(state: tauri::State<AppState>) -> bool {
    *state.minimize_to_tray.lock().unwrap()
}

#[tauri::command]
fn set_minimize_to_tray(value: bool, state: tauri::State<AppState>) {
    *state.minimize_to_tray.lock().unwrap() = value;
}



fn map_shortcut_key(s: &str) -> String {
    let parts: Vec<&str> = s.split('+').collect();
    let mut mapped_parts = Vec::new();
    
    for part in parts {
        let part_trimmed = part.trim();
        match part_trimmed.to_uppercase().as_str() {
            "CTRL" => mapped_parts.push("Ctrl".to_string()),
            "CONTROL" => mapped_parts.push("Ctrl".to_string()),
            "ALT" => mapped_parts.push("Alt".to_string()),
            "OPTION" => mapped_parts.push("Alt".to_string()),
            "SHIFT" => mapped_parts.push("Shift".to_string()),
            "CMD" => mapped_parts.push("Cmd".to_string()),
            "META" => mapped_parts.push("Meta".to_string()),
            "WIN" => mapped_parts.push("Meta".to_string()),
            "SPACE" => mapped_parts.push("Space".to_string()),
            "ENTER" => mapped_parts.push("Enter".to_string()),
            "RETURN" => mapped_parts.push("Enter".to_string()),
            "TAB" => mapped_parts.push("Tab".to_string()),
            "ESCAPE" => mapped_parts.push("Escape".to_string()),
            "ESC" => mapped_parts.push("Escape".to_string()),
            "BACKSPACE" => mapped_parts.push("Backspace".to_string()),
            "DELETE" => mapped_parts.push("Delete".to_string()),
            "UP" => mapped_parts.push("ArrowUp".to_string()),
            "DOWN" => mapped_parts.push("ArrowDown".to_string()),
            "LEFT" => mapped_parts.push("ArrowLeft".to_string()),
            "RIGHT" => mapped_parts.push("ArrowRight".to_string()),
            "HOME" => mapped_parts.push("Home".to_string()),
            "END" => mapped_parts.push("End".to_string()),
            "PAGEUP" => mapped_parts.push("PageUp".to_string()),
            "PAGEDOWN" => mapped_parts.push("PageDown".to_string()),
            "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11" | "F12" => {
                mapped_parts.push(part_trimmed.to_string());
            }
            "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" => {
                mapped_parts.push(format!("Key{}", part_trimmed.to_uppercase()));
            }
            _ if part_trimmed.len() == 1 => {
                let c = part_trimmed.to_uppercase().chars().next().unwrap();
                if c.is_ascii_alphabetic() {
                    mapped_parts.push(format!("Key{}", c));
                } else {
                    mapped_parts.push(part_trimmed.to_string());
                }
            }
            _ => mapped_parts.push(part_trimmed.to_string()),
        }
    }
    
    mapped_parts.join("+")
}

#[tauri::command]
fn set_global_shortcut(
    app_handle: AppHandle,
    new_launcher_shortcut: String,
    new_dashboard_shortcut: String,
    state: tauri::State<AppState>
) -> Result<(), String> {
    eprintln!("[Shortcut] =================================");
    eprintln!("[Shortcut] set_global_shortcut() CALLED with new_launcher_shortcut={:?}, new_dashboard_shortcut={:?}", new_launcher_shortcut, new_dashboard_shortcut);
    let mut launcher_guard = state.launcher_shortcut.lock().unwrap();
    let mut dashboard_guard = state.dashboard_shortcut.lock().unwrap();

    // Unregister old shortcuts
    if let Some(old_launcher) = launcher_guard.take() {
        eprintln!("[Shortcut] Unregistering old launcher shortcut: {:?}", old_launcher);
        match app_handle.global_shortcut().unregister(old_launcher) {
            Ok(_) => eprintln!("[Shortcut] Old launcher shortcut unregistered successfully"),
            Err(e) => eprintln!("[Shortcut WARNING] Failed to unregister old launcher shortcut: {:?}", e),
        }
    }
    if let Some(old_dashboard) = dashboard_guard.take() {
        eprintln!("[Shortcut] Unregistering old dashboard shortcut: {:?}", old_dashboard);
        match app_handle.global_shortcut().unregister(old_dashboard) {
            Ok(_) => eprintln!("[Shortcut] Old dashboard shortcut unregistered successfully"),
            Err(e) => eprintln!("[Shortcut WARNING] Failed to unregister old dashboard shortcut: {:?}", e),
        }
    }

    let launcher_str = if new_launcher_shortcut.is_empty() {
        map_shortcut_key(get_default_launcher_shortcut())
    } else {
        map_shortcut_key(&new_launcher_shortcut)
    };
    
    let dashboard_str = if new_dashboard_shortcut.is_empty() {
        map_shortcut_key(get_default_dashboard_shortcut())
    } else {
        map_shortcut_key(&new_dashboard_shortcut)
    };
    eprintln!("[Shortcut] Mapped shortcuts: Launcher={}, Dashboard={}", launcher_str, dashboard_str);

    let launcher_sc = launcher_str.parse::<Shortcut>().map_err(|e| {
        let err_msg = format!("Failed to parse launcher shortcut '{}': {:?}", launcher_str, e);
        eprintln!("[Shortcut ERROR] {}", err_msg);
        err_msg
    })?;
    let dashboard_sc = dashboard_str.parse::<Shortcut>().map_err(|e| {
        let err_msg = format!("Failed to parse dashboard shortcut '{}': {:?}", dashboard_str, e);
        eprintln!("[Shortcut ERROR] {}", err_msg);
        err_msg
    })?;

    eprintln!("[Shortcut] Attempting to register shortcuts");
    eprintln!("[Shortcut] Launcher shortcut to register: {:?}", launcher_sc);
    eprintln!("[Shortcut] Dashboard shortcut to register: {:?}", dashboard_sc);
    
    app_handle.global_shortcut().on_shortcut(launcher_sc.clone(), move |app, shortcut, event| {
        eprintln!("[Shortcut] =================================");
        eprintln!("[Shortcut] ✅ Launcher shortcut TRIGGERED!");
        eprintln!("[Shortcut] Event: {:?}", event);
        eprintln!("[Shortcut] Shortcut: {:?}", shortcut);
        
        if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
            // Toggle the launcher window visibility
            if let Some(window) = app.get_webview_window("launcher") {
                match window.is_visible() {
                    Ok(true) => {
                        eprintln!("[Launcher] Hiding window...");
                        let _ = window.hide();
                    }
                    Ok(false) => {
                        eprintln!("[Launcher] Showing window...");
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                    Err(e) => {
                        eprintln!("[Shortcut ERROR] Failed to check launcher visibility: {:?}", e);
                    }
                }
            } else {
                eprintln!("[Shortcut ERROR] ❌ Launcher window not found!");
            }
        }
        
        eprintln!("[Shortcut] =================================");
    }).map_err(|e| {
        let err_msg = format!("Failed to register launcher shortcut: {:?}", e);
        eprintln!("[Shortcut ERROR] {}", err_msg);
        err_msg
    })?;
    eprintln!("[Shortcut] Launcher shortcut registered successfully!");
    
    app_handle.global_shortcut().on_shortcut(dashboard_sc.clone(), move |app, shortcut, event| {
        eprintln!("[Shortcut] =================================");
        eprintln!("[Shortcut] ✅ Dashboard shortcut TRIGGERED!");
        eprintln!("[Shortcut] Event: {:?}", event);
        eprintln!("[Shortcut] Shortcut: {:?}", shortcut);
        
        if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
            // Focus the main window
            if let Some(window) = app.get_webview_window("main") {
                eprintln!("[Dashboard] Focusing main window...");
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            } else {
                eprintln!("[Shortcut ERROR] ❌ Main window not found!");
            }
        }
        
        eprintln!("[Shortcut] =================================");
    }).map_err(|e| {
        let err_msg = format!("Failed to register dashboard shortcut: {:?}", e);
        eprintln!("[Shortcut ERROR] {}", err_msg);
        err_msg
    })?;
    eprintln!("[Shortcut] Dashboard shortcut registered successfully!");

    *launcher_guard = Some(launcher_sc);
    *dashboard_guard = Some(dashboard_sc);

    eprintln!("[Shortcut] All registrations complete!");
    eprintln!("[Shortcut] =================================");
    Ok(())
}



fn main() {
    tauri::Builder::default()
        // ── Single-instance guard ──────────────────────────────────────────────
        // If a second process is launched while Shift is already running,
        // kill the second process and focus/restore the existing main window
        // instead. This prevents duplicate window sets entirely.
        .plugin(
            tauri_plugin_single_instance::init(|app, _argv, _cwd| {
                eprintln!("[Single Instance] Second launch attempt detected – focusing existing window.");
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            })
        )
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState {
            launcher_shortcut: Mutex::new(None),
            dashboard_shortcut: Mutex::new(None),
            minimize_to_tray: Mutex::new(true),
        })
        .invoke_handler(tauri::generate_handler![
            get_installed_apps,
            get_system_info,
            launch_application,
            open_folder,
            open_url,
            set_global_shortcut,
            get_minimize_to_tray,
            set_minimize_to_tray
        ])
        .setup(|app| {
            // Register custom protocol for app icons
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_fs::init())?;

            let system_info = get_system_info();
            eprintln!("[Shortcut] Platform detected: {}", system_info.platform);

            let open_shift = tauri::menu::MenuItemBuilder::with_id("open_shift", "Open Shift")
                .build(app)?;
            let separator1 = tauri::menu::PredefinedMenuItem::separator(app)?;
            let settings_item = tauri::menu::MenuItemBuilder::with_id("settings", "Settings")
                .build(app)?;
            let separator2 = tauri::menu::PredefinedMenuItem::separator(app)?;
            let exit_item = tauri::menu::MenuItemBuilder::with_id("exit", "Exit")
                .build(app)?;
            let menu = tauri::menu::MenuBuilder::new(app)
                .items(&[&open_shift, &separator1, &settings_item, &separator2, &exit_item])
                .build()?;
            let _tray = tauri::tray::TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open_shift" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                            let _ = window.emit("open-launcher", ());
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("open-settings", ());
                        }
                    }
                    "exit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, _event| {
                    let app = tray.app_handle();
                    let minimize_to_tray = *app.state::<AppState>().minimize_to_tray.lock().unwrap();
                    if let Some(window) = app.get_webview_window("main") {
                        if let Ok(is_visible) = window.is_visible() {
                            if is_visible {
                                // Only hide if minimize-to-tray is enabled
                                if minimize_to_tray {
                                    let _ = window.hide();
                                }
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // Register shortcuts once at startup from the Rust side.
            // The frontend (main window only) may call set_global_shortcut to
            // update the bindings when the user changes settings.
            let _ = set_global_shortcut(
                app.handle().clone(),
                get_default_launcher_shortcut().to_string(),
                get_default_dashboard_shortcut().to_string(),
                app.state(),
            );

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let label = window.label();

                if label == "launcher" {
                    // The launcher window must NEVER be destroyed.
                    // Always intercept the close and hide it so the shortcut
                    // handler can always find it via get_webview_window("launcher").
                    api.prevent_close();
                    let _ = window.hide();
                    eprintln!("[Launcher] Close intercepted – hidden instead of destroyed.");
                    return;
                }

                // For all other windows ("main"), honour the minimize-to-tray setting.
                let app_state = window.state::<AppState>();
                let minimize_to_tray = *app_state.minimize_to_tray.lock().unwrap();
                if minimize_to_tray {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
