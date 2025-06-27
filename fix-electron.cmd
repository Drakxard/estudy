@echo off
echo ANALYZING AND FIXING Electron Packaging Issues
echo.

echo === DIAGNOSTIC INFORMATION ===
echo Checking required files:
if exist electron-main.js (echo ✓ electron-main.js found) else (echo ✗ electron-main.js MISSING)
if exist package.json (echo ✓ package.json found) else (echo ✗ package.json MISSING)

echo.
echo Current package.json main field:
findstr "main" package.json

echo.
echo === STEP 1: Backup and create clean package.json ===
copy package.json package-backup.json
copy package-temp.json package.json

echo.
echo === STEP 2: Check electron-main.js syntax ===
node -c electron-main.js
if %errorlevel% equ 0 (
    echo ✓ electron-main.js syntax is valid
) else (
    echo ✗ electron-main.js has syntax errors
)

echo.
echo === STEP 3: Test electron locally first ===
echo Testing electron app locally...
timeout /t 3 >nul
npx electron . --disable-web-security --no-sandbox 2>error.log &
timeout /t 5 >nul
taskkill /f /im electron.exe 2>nul

echo.
echo === STEP 4: Create electron package ===
echo Running electron-packager with explicit main file...
npx electron-packager . "Mathematics Study Platform" --platform=win32 --arch=x64 --out=electron-dist --overwrite --main=electron-main.js --ignore="client|\.git|\.cache|\.replit|\.upm|node_modules/\.cache|package-original\.json|package-backup\.json"

echo.
echo === VERIFICATION ===
if exist "electron-dist\Mathematics Study Platform-win32-x64" (
    echo ✓ SUCCESS: Package created at electron-dist\Mathematics Study Platform-win32-x64\
    if exist "electron-dist\Mathematics Study Platform-win32-x64\Mathematics Study Platform.exe" (
        echo ✓ SUCCESS: .exe file found
        echo.
        echo YOUR .EXE IS READY AT:
        echo electron-dist\Mathematics Study Platform-win32-x64\Mathematics Study Platform.exe
    ) else (
        echo ✗ ERROR: .exe file not found in package
    )
) else (
    echo ✗ ERROR: Package folder not created
    echo Check error.log for details:
    type error.log 2>nul
)

echo.
echo === CLEANUP ===
copy package-backup.json package.json
del package-backup.json 2>nul
del error.log 2>nul

pause