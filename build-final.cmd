@echo off
cls
echo ========================================================
echo MATHEMATICS STUDY PLATFORM - FINAL EXE BUILDER
echo ========================================================
echo.

echo [STEP 1] Creating clean package structure...
if exist electron-temp rmdir /s /q electron-temp
mkdir electron-temp

echo [STEP 2] Copying essential files...
copy electron-main.js electron-temp\
copy electron-preload.js electron-temp\
copy electron-package.json electron-temp\package.json
copy icon.ico electron-temp\ 2>nul

echo [STEP 3] Building application if needed...
if not exist dist (
    echo Building web application...
    call npm run build
) else (
    echo Using existing build
)

echo [STEP 4] Copying build outputs...
xcopy /E /I /Q dist electron-temp\dist\
xcopy /E /I /Q server electron-temp\server\
xcopy /E /I /Q shared electron-temp\shared\
xcopy /E /I /Q sube-seccion electron-temp\sube-seccion\
xcopy /E /I /Q attached_assets electron-temp\attached_assets\

echo [STEP 5] Copying essential node_modules...
mkdir electron-temp\node_modules
xcopy /E /I /Q node_modules\electron electron-temp\node_modules\electron\

echo [STEP 6] Installing Electron in temp directory...
cd electron-temp
call npm install electron --no-save

echo [STEP 7] Creating Windows executable...
cd ..
call npx electron-packager electron-temp "Mathematics Study Platform" --platform=win32 --arch=x64 --out=electron-final --overwrite --app-version=1.0.0

echo.
echo ========================================================
echo VERIFICATION AND CLEANUP
echo ========================================================

if exist "electron-final\Mathematics Study Platform-win32-x64" (
    echo ✓ SUCCESS! Package created successfully
    if exist "electron-final\Mathematics Study Platform-win32-x64\Mathematics Study Platform.exe" (
        echo ✓ .exe file found!
        echo.
        echo YOUR APPLICATION IS READY:
        echo Location: electron-final\Mathematics Study Platform-win32-x64\Mathematics Study Platform.exe
        echo.
        for %%A in ("electron-final\Mathematics Study Platform-win32-x64\Mathematics Study Platform.exe") do echo File size: %%~zA bytes
        echo.
        echo INSTRUCTIONS:
        echo 1. Navigate to: electron-final\Mathematics Study Platform-win32-x64\
        echo 2. Double-click: Mathematics Study Platform.exe
        echo 3. Wait 6 seconds for the server to start
        echo 4. The app will open automatically
    ) else (
        echo ✗ Package created but .exe not found
        echo Contents:
        dir "electron-final\Mathematics Study Platform-win32-x64" /b
    )
) else (
    echo ✗ Package creation failed
    echo Checking for any output folders:
    dir electron-final /b 2>nul
)

echo.
echo Cleaning up temporary files...
if exist electron-temp rmdir /s /q electron-temp

echo.
echo Build process complete!
pause