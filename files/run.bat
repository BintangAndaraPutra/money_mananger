@echo off
chcp 65001 >nul
title 🚀 Money Manager - Modern Version
color 0A

echo ============================================
echo         MONEY MANAGER MODERN
echo ============================================
echo.
echo 📁 Working directory: %CD%
echo.
echo 🔥 FITUR BARU:
echo ✅ Auto-refresh setiap 1 menit
echo ✅ Export Laporan ke PDF
echo ✅ Export Grafik ke PDF
echo ✅ Export Dashboard ke PDF
echo ✅ Monitoring data real-time
echo.
echo 📊 Data akan diperbarui otomatis!
echo.

:MAIN_MENU
cls
echo ============================================
echo         MONEY MANAGER - MODERN
echo ============================================
echo.
echo 1. Jalankan Frontend Saja (Standalone)
echo 2. Jalankan Backend Saja (Server Mode)
echo 3. Jalankan Keduanya (Full System)
echo 4. Kompilasi Backend
echo 5. Test Connection
echo 6. Backup Data
echo 7. Exit
echo.
set /p choice="Pilih (1-7): "

if "%choice%"=="1" goto FRONTEND
if "%choice%"=="2" goto BACKEND
if "%choice%"=="3" goto BOTH
if "%choice%"=="4" goto COMPILE
if "%choice%"=="5" goto TEST
if "%choice%"=="6" goto BACKUP
if "%choice%"=="7" exit

goto MAIN_MENU

:FRONTEND
echo.
echo 🌐 Membuka Frontend Modern...
echo 📊 Auto-refresh: AKTIF (1 menit)
echo 📄 PDF Export: SIAP
start "" "index.html"
echo ✅ Frontend terbuka di browser
pause
goto MAIN_MENU

:BACKEND
if not exist "backend.exe" call :COMPILE_SILENT
if not exist "backend.exe" (
    echo ❌ Gagal kompilasi backend!
    pause
    goto MAIN_MENU
)

echo.
echo 🔧 Menjalankan Backend Server...
echo 🌐 URL: http://localhost:8888
echo 💾 Data: data.csv
echo 🔄 Auto-refresh: Support
echo.
backend.exe
goto MAIN_MENU

:BOTH
if not exist "backend.exe" call :COMPILE_SILENT

if exist "backend.exe" (
    start "Backend" /MIN backend.exe
    timeout /t 2 /nobreak >nul
    echo ✅ Backend berjalan di background
)

echo 🌐 Membuka Frontend...
echo 📊 Auto-refresh: AKTIF
echo 📄 PDF Export: SIAP
start "" "index.html"
echo.
echo 🚀 Sistem berjalan!
echo 🔄 Data auto-refresh setiap 1 menit
echo 📄 Gunakan menu Export untuk PDF
pause
goto MAIN_MENU

:COMPILE
echo.
echo 🔧 Mengkompilasi Backend...
where g++ >nul 2>nul && (
    g++ backend.cpp filemanager.cpp -std=c++17 -o backend.exe -lws2_32
    goto :CHECK_COMPILE
)
where cl >nul 2>nul && (
    cl backend.cpp filemanager.cpp /EHsc /std:c++17 /Fe:backend.exe ws2_32.lib
    goto :CHECK_COMPILE
)
echo ❌ Tidak ada compiler C++!
pause
goto MAIN_MENU

:CHECK_COMPILE
if exist backend.exe (
    echo ✅ Kompilasi berhasil!
) else (
    echo ❌ Kompilasi gagal!
)
pause
goto MAIN_MENU

:COMPILE_SILENT
where g++ >nul 2>nul && (
    g++ backend.cpp filemanager.cpp -std=c++17 -o backend.exe -lws2_32 >nul 2>&1
    exit /b 0
)
where cl >nul 2>nul && (
    cl backend.cpp filemanager.cpp /EHsc /std:c++17 /Fe:backend.exe ws2_32.lib >nul 2>&1
    exit /b 0
)
exit /b 1

:TEST
echo.
echo 🔍 Testing System...
curl http://localhost:8888/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend berjalan
) else (
    echo ❌ Backend tidak berjalan
)
pause
goto MAIN_MENU

:BACKUP
echo.
echo 💾 Membuat backup data...
if exist "data.csv" (
    copy data.csv data_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.csv
    echo ✅ Backup created: data_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.csv
) else (
    echo ❌ File data.csv tidak ditemukan
)
pause
goto MAIN_MENU