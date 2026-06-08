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
    current_shortcut: Mutex<Option<Shortcut>>,
    minimize_to_tray: Mutex<bool>,
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
        
        fn scan_dir(dir: &Path, apps: &mut Vec<AppInfo>, cache: &mut HashMap<String, Option<String>>) {
            if !dir.exists() {
                return;
            }
            match fs::read_dir(dir) {
                Ok(entries) => {
                    for entry in entries.flatten() {
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
                                            continue;
                                        }
                                        apps.push(AppInfo { name, path: exec, icon });
                                    }
                                }
                                Err(_) => {}
                            }
                        }
                    }
                }
                Err(_) => {}
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
            scan_dir(Path::new(dir), &mut apps, &mut cache);
        }

        // Simpan kembali cache
        let mut cache_lock = ICON_CACHE.lock().unwrap();
        *cache_lock = Some(cache);
        drop(cache_lock);
    }

    #[cfg(target_os = "windows")]
    {
        use std::path::Path;
        use walkdir::WalkDir;

        let start_menu_dirs = [
            format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", std::env::var("ProgramData").unwrap_or_else(|_| "C:\\ProgramData".to_string())),
            format!("{}\\Microsoft\\Windows\\Start Menu\\Programs", std::env::var("APPDATA").unwrap_or_else(|_| "".to_string())),
        ];

        for dir in start_menu_dirs.iter() {
            let path = Path::new(dir);
            if !path.exists() {
                continue;
            }
            for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
                let entry_path = entry.path();
                if entry_path.is_file() && entry_path.extension().and_then(|e| e.to_str()) == Some("lnk") {
                    if let Some(file_stem) = entry_path.file_stem().and_then(|n| n.to_str()) {
                        if apps.iter().any(|a| a.name == file_stem) {
                            continue;
                        }
                        apps.push(AppInfo {
                            name: file_stem.to_string(),
                            path: entry_path.to_string_lossy().to_string(),
                            icon: None, // Icon extraction on Windows requires deeper native API integration
                        });
                    }
                }
            }
        }
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

        for dir in app_dirs.iter() {
            let path = Path::new(dir);
            if !path.exists() {
                continue;
            }
            if let Ok(entries) = fs::read_dir(path) {
                for entry in entries.flatten() {
                    let entry_path = entry.path();
                    if entry_path.is_dir() && entry_path.extension().and_then(|e| e.to_str()) == Some("app") {
                        if let Some(file_stem) = entry_path.file_stem().and_then(|n| n.to_str()) {
                            if apps.iter().any(|a| a.name == file_stem) {
                                continue;
                            }
                            apps.push(AppInfo {
                                name: file_stem.to_string(),
                                path: entry_path.to_string_lossy().to_string(),
                                icon: None,
                            });
                        }
                    }
                }
            }
        }
    }
    
    apps.sort_by(|a, b| a.name.cmp(&b.name));
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
            .spawn()
            .map_err(|e| format!("Failed to launch app: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to launch app: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        // Use shlex to safely parse command arguments and prevent command injection
        if let Some(mut parts) = shlex::split(&path) {
            if !parts.is_empty() {
                let cmd = parts.remove(0);
                std::process::Command::new(cmd)
                    .args(parts)
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

fn get_default_shortcut() -> &'static str {
    #[cfg(target_os = "macos")]
    {
        "Cmd+Opt+Space"
    }
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        "Ctrl+Alt+Space"
    }
}

#[tauri::command]
fn set_global_shortcut(
    app_handle: AppHandle,
    new_shortcut: String,
    state: tauri::State<AppState>
) -> Result<(), String> {
    let mut current = state.current_shortcut.lock().unwrap();
    if let Some(old_shortcut) = current.take() {
        eprintln!("[Shortcut] Unregistering old shortcut: {:?}", old_shortcut);
        let unregister_result = app_handle.global_shortcut().unregister(old_shortcut);
        if let Err(e) = unregister_result {
            eprintln!("[Shortcut] Failed to unregister shortcut: {}", e);
        }
    }
    let shortcut_to_parse = if new_shortcut.is_empty() {
        get_default_shortcut().to_string()
    } else {
        new_shortcut
    };
    eprintln!("[Shortcut] Registering shortcut: {}", shortcut_to_parse);
    let tauri_shortcut = shortcut_to_parse.parse::<Shortcut>().map_err(|e| {
        eprintln!("[Shortcut] Registration failed: {}", e);
        format!("Invalid shortcut: {}", e)
    })?;
    app_handle.global_shortcut().register(tauri_shortcut.clone()).map_err(|e| {
        eprintln!("[Shortcut] Registration failed: {}", e);
        e.to_string()
    })?;
    *current = Some(tauri_shortcut);
    eprintln!("[Shortcut] Registration successful");
    Ok(())
}



fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(|app, shortcut, _event| {
            eprintln!("[Shortcut] Triggered: {:?}", shortcut);
            let state: tauri::State<AppState> = app.state();
            let current = state.current_shortcut.lock().unwrap();
            if let Some(current_shortcut) = &*current {
                if current_shortcut == shortcut {
                    if let Some(window) = app.get_webview_window("main") {
                        eprintln!("[Shortcut] Found main window");
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                        let _ = window.emit("open-launcher", ());
                    }
                }
            }
        }).build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(AppState {
            current_shortcut: Mutex::new(None),
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
                    if let Some(window) = tray.app_handle().get_webview_window("main") {
                        if let Ok(is_visible) = window.is_visible() {
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;
            let _ = set_global_shortcut(app.handle().clone(), get_default_shortcut().to_string(), app.state());
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
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
