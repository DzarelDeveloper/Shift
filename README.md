# Shift

> **Restore your workflow in seconds.**

<p align="center">
  <img src="https://raw.githubusercontent.com/DzarelDeveloper/BloggerImg/refs/heads/main/shift.png" alt="Shift Banner" width="100%">
</p>

<p align="center">
  <a href="https://github.com/DzarelDeveloper/shift/releases">
    <img src="https://img.shields.io/badge/version-0.6.0-blue?style=for-the-badge&logo=github" alt="Version">
  </a>
  <a href="https://github.com/DzarelDeveloper/shift/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge&logo=mit" alt="License">
  </a>
  <a href="https://github.com/DzarelDeveloper/shift/blob/main/DEVELOPMENT.md">
    <img src="https://img.shields.io/badge/development-guide-purple?style=for-the-badge&logo=vite" alt="Development Guide">
  </a>
  <br>
  <img src="https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-blue?style=for-the-badge&logo=windows" alt="Platform Support">
</p>

## ✨ Apa Itu Shift?

**Shift** adalah workspace launcher dan otomatisasi workflow untuk pengembang, desainer, dan pembuat konten. Alih-alih menghabiskan waktu berharga untuk membuka program satu per satu, Shift memungkinkan kamu mengembalikan lingkungan kerja lengkap secara instan dengan satu tombol pintas!

## 🎯 Fitur Utama

- 🚀 **Instant Workspace Launch**: Buka koleksi aplikasi desktop, URL browser, dan direktori folder secara sekaligus!
- ⌨️ **Raycast-Inspired Summoned Command Bar**: Tekan `Ctrl + Alt + Space` (configurable) untuk menampilkan launcher cepat di atas semua jendela aktif!
- 🎯 **Background Zero-Lag Daemon Mode**: Berjalan di system tray dengan overhead RAM minimal (< 15 MB)!
- ⚡ **Native App & OS Integration**: Deteksi aplikasi terinstall secara real, buka folder, dan jalankan aplikasi secara native!
- 🧙 **Interactive First-Run Wizard**: Panduan setup langkah demi langkah untuk konfigurasi awal!
- 🎨 **Theme Customization**: Pilih light, dark, atau system mode, dan pilih warna accent favoritmu!
- 📥 **Workspace Import/Export**: Backup workspace kamu atau bagikan ke temenmu dengan file .shift!

## 🎬 Cara Kerja

1. **Define Workspace**: Buat profile workspace yang menentukan aplikasi, URL, dan folder yang akan dibuka!
2. **Configure Shortcut**: Atur shortcut keyboard global (default: `Ctrl + Alt + Space`) untuk memanggil launcher!
3. **Restore Instantly**: Jalankan workspace dengan satu tombol atau klik, dan lihat lingkungan kamu hidup kembali!
4. **Run in Background**: Tutup jendela, dan Shift akan tetap berjalan di system tray, siap dipanggil kapan saja!

## 📦 Instalasi

### 🐧 Linux / 🍎 macOS

#### Quick Install (Recommended)

Jalankan one-liner ini untuk menginstall Shift secara otomatis:

```bash
curl -fsSL https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/install.sh | bash
```

#### Update Shift

Untuk mengupdate Shift ke versi terbaru:

```bash
curl -fsSL https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/update.sh | bash
```

#### Uninstall Shift

Untuk menghapus Shift sepenuhnya dari sistem:

```bash
curl -fsSL https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/uninstall.sh | bash
```

---

### 🪟 Windows

#### Quick Install (Recommended)

Buka PowerShell as Administrator dan jalankan:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/install.ps1" -UseBasicParsing).Content
```

> **Troubleshooting: Error "git is not recognized"**
> Jika Anda mendapatkan error yang menyebutkan `The term 'git' is not recognized` saat instalasi di Windows, itu berarti Git belum terinstal.
> Anda dapat menginstalnya dengan menjalankan perintah berikut di PowerShell:
> ```powershell
> winget install --id Git.Git -e --source winget
> ```
> Setelah selesai, **tutup PowerShell**, buka kembali yang baru, dan jalankan ulang perintah instalasi di atas.

#### Update Shift

Buka PowerShell as Administrator dan jalankan:

```powershell
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/update.ps1" -UseBasicParsing).Content
```

#### Uninstall Shift

Buka PowerShell as Administrator dan jalankan:

```powershell
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/uninstall.ps1" -UseBasicParsing).Content
```

---

## 📦 Download App Bundle

| Platform | Format | Size |
|----------|--------|------|
| Linux | .deb | ~2.3 MB |
| Windows | .exe | ~30-40 MB (Estimasi) |
| macOS | .dmg/.pkg | ~20-30 MB (Estimasi) |

Download terbaru di [Releases Page](https://github.com/DzarelDeveloper/Shift/releases)!

---

## 🤝 Contributing

Kontribusi welcome banget! Please read the full [CONTRIBUTING.md](CONTRIBUTING.md) guide before submitting PRs.

Quick steps:
1. Fork repository ini
2. Buat feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add some amazing feature'`
4. Push ke branch: `git push origin feature/amazing-feature`
5. Buka Pull Request!

---

## 📄 License

Distributed under the MIT License. Lihat `LICENSE` untuk detail.

---

## 👤 Author

**Muhamad Dzarel Alghifari**
- GitHub: [@DzarelDeveloper](https://github.com/DzarelDeveloper)

---

## 🔗 Links

- [Project Repository](https://github.com/DzarelDeveloper/Shift)
- [Development Guide](https://github.com/DzarelDeveloper/Shift/blob/main/DEVELOPMENT.md)
- [Contributing Guide](https://github.com/DzarelDeveloper/Shift/blob/main/CONTRIBUTING.md)
- [Issue Tracker](https://github.com/DzarelDeveloper/Shift/issues)
- [Pull Requests](https://github.com/DzarelDeveloper/Shift/pulls)

---

<p align="center">
  <b>Made with ❤️ using React & Tauri</b>
</p>
