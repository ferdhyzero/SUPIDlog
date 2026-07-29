# 🚀 TUTORIAL DEPLOYMENT CPANEL GIT™ VERSION CONTROL (SUBDOMAIN: supid.myhostzone.biz.id)

Panduan ini berisi langkah-langkah praktis medeploy aplikasi **SUPID Log** ke subdomain `https://supid.myhostzone.biz.id` menggunakan fitur resmi **cPanel Git™ Version Control**.

---

## 📋 DATA KONFIGURASI PRODUCTION

- **Subdomain**: `supid.myhostzone.biz.id`
- **Nama Database cPanel**: `myhostzo_sup`
- **File Database SQL**: `database.sql`

---

## 🛠️ LANGKAH 1: BUILD PRODUCTION & INITIALIZE GIT DI LAPTOP

1. Jalankan kompilasi produksi di terminal laptop:
   ```bash
   npm run build
   ```
2. Commit & push source code project ke akun GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "Deploy SUPID Log PWA Database myhostzo_sup"
   git branch -M main
   git remote add origin https://github.com/USERNAME/SUPIDlog.git
   git push -u origin main
   ```

---

## 🌐 LANGKAH 2: SETUP DATABASE MYSQL DI CPANEL

1. Login ke **cPanel** ➔ Klik menu **MySQL® Databases**.
2. **Buat Database Baru**: Isi nama database persis: **`myhostzo_sup`**.
3. **Buat User Database Baru**: (misal: `myhostzo_supiduser`, Password: `PasswordKuat123!`).
4. **Hubungkan User ke Database**: Berikan centang **ALL PRIVILEGES**.
5. Buka **phpMyAdmin** di cPanel ➔ Pilih database **`myhostzo_sup`** ➔ Klik tab **Import** ➔ Upload file `database.sql`.

---

## ⚙️ LANGKAH 3: KONEKSI DATABASE PHP (`api/db_config.php`)

File `api/db_config.php` telah dikonfigurasi secara otomatis mengarah ke database produksi **`myhostzo_sup`** (lengkap dengan fallback otomatis untuk XAMPP lokal).

Jika Anda ingin mengubah password/user MySQL cPanel, sesuaikan pada file `api/db_config.php`:
```php
$primary_db = 'myhostzo_sup';
```

---

## 📦 LANGKAH 4: CONNECT REPOSITORY KE CPANEL GIT™ VERSION CONTROL

1. Login ke **cPanel** ➔ Cari & klik menu **Git™ Version Control** (di kelompok *Files*).
2. Klik tombol **Create** (di kanan atas).
3. Isi form berikut:
   - **Clone URL**: `https://github.com/USERNAME/SUPIDlog.git`
   - **Repository Path**: `public_html/supid` (atau path folder subdomain Anda).
   - **Repository Name**: `SUPIDlog`.
4. Klik tombol **Create**. cPanel akan meng-clone repositori dari GitHub secara otomatis!

---

## 🚀 LANGKAH 5: AUTOMATIC DEPLOYMENT (.cpanel.yml)

1. File konfigurasi otomatis **`.cpanel.yml`** telah disertakan di root project.
2. Pada cPanel ➔ **Git™ Version Control** ➔ Klik **Manage** di sebelah nama repository `SUPIDlog`.
3. Klik tab **Deploy HEAD Commit** ➔ Klik **Update from Remote** ➔ Klik **Deploy HEAD Commit**.
4. **Selesai!** Subdomain `https://supid.myhostzone.biz.id` Anda kini 100% online, super cepat, terhubung ke database `myhostzo_sup`, dan PWA siap di-install di HP!
