# Shift Changelog

## v0.7.2 (2026-06-17)

### Fitur (Features)
- **Markdown Changelog Rendering:** Menampilkan riwayat update dengan format Markdown untuk keterbacaan yang lebih baik.
- **Real-Time Shortcut Application:** Perubahan shortcut launcher/dashboard sekarang diterapkan secara langsung tanpa harus restart aplikasi.

### Bug Fixes
- **UI Organization:** Memindahkan tombol "View Log" dari bagian "Software Updates" ke bagian "Project Information" agar lebih terorganisir.
- **Version Consistency:** Semua file konfigurasi (package.json, Cargo.toml, tauri.conf.json) sekarang menggunakan versi yang seragam.

### Kesimpulan (Conclusion)
Rilis `v0.7.2` difokuskan pada peningkatan user experience dan organisasi UI, sehingga aplikasi lebih nyaman dan mudah digunakan.

## v0.7.1 (2026-06-17)

### Fitur (Features)
- **In-App Changelog Modal:** Menampilkan seluruh riwayat update langsung di dalam aplikasi tanpa harus membuka browser eksternal.
- **View Log Button:** Menambahkan tombol untuk membuka direktori log aplikasi secara langsung dari tab About.

### Bug Fixes
- **Resource Links Fix:** Memperbaiki tombol di bagian Resources agar membuka link di browser default dengan benar.
- **Version Consistency:** Semua file konfigurasi (package.json, Cargo.toml, tauri.conf.json) sekarang menggunakan versi yang seragam.

### Kesimpulan (Conclusion)
Rilis `v0.7.1` difokuskan pada perbaikan kecil dan peningkatan user experience agar aplikasi lebih stabil dan nyaman digunakan.

## v0.7.0 (2026-06-17)

### Fitur (Features)
- **Dual Global Shortcut System:** Pemisahan kontrol pintasan (*shortcut*) secara mandiri untuk memanggil *Workspace Launcher* (pencarian instan) dan *Dashboard* (pengaturan penuh) agar tidak lagi saling tumpang tindih.
- **Interactive Folder Browser:** Fitur pemilihan `Absolute Drive Path` otomatis menggunakan *native OS file dialog* untuk menghindari kesalahan pengetikan (*typo*) pada pembuatan *workspace*.
- **Smart Workspace Icons:** Peningkatan deteksi cerdas untuk ikon workspace secara dinamis berdasarkan kata kunci (Code, Cyber, Design, Education) yang tersinkronisasi di Launcher maupun Dashboard.
- **Software Updates Relocation:** Menu OTA Updater kini dipusatkan di tab *About* dengan tambahan tautan langsung menuju halaman Changelog resmi.

### Bug Fixes
- **Shortcut Collision Fix:** Memperbaiki *deadlock* navigasi dan pemanggilan *window* akibat *global shortcut* yang sebelumnya tercampur.
- **Icon Synchronization Logic:** Memperbaiki inkonsistensi *rendering* ikon *workspace* antara *main window* dan *launcher window*.
- **Legacy UI Cleanup:** Pembersihan menu "Roadmap" yang sudah *deprecated* serta pembaruan tautan (GitHub/Wiki/Issues) ke repositori resmi `DzarelDeveloper/Shift`.
- **Version Alignment:** Memperbaiki inkonsistensi metadata versi dari `v0.6.9` ke `v0.7.0` pada `package.json` dan `tauri.conf.json`.

### Kesimpulan (Conclusion)
Rilis `v0.7.0` difokuskan pada peningkatan kualitas interaksi pengguna (UX), penghapusan rintangan pengisian data (seperti ketidaktepatan pengetikan *path* direktori), dan memberikan fondasi arsitektur pintasan (*shortcut*) global yang lebih solid untuk aplikasi multi-*window*.

## v0.6.9 (2026-06-12)

### Improvements
- Perbaikan bug minor dan pembaruan build process
- Penyelesaian aset aplikasi untuk rilis otomatis (macOS, Windows, Linux)
- Penambahan fungsi pembaruan versi (Over-the-Air)
