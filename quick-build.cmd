@echo off
echo Quick Build - Mathematics Study Platform
echo.

echo Checking if dist folder exists...
if not exist dist (
    echo Building application...
    call npm run build
) else (
    echo Using existing dist folder
)

echo.
echo Creating electron package...
call npx electron-packager . "Mathematics Study Platform" --platform=win32 --arch=x64 --out=electron-dist --overwrite --electron-version=latest --ignore="client|\.git|\.cache|\.replit|\.upm|node_modules/\.cache"

echo.
if exist "electron-dist\Mathematics Study Platform-win32-x64" (
    echo SUCCESS! Your .exe is ready in:
    echo electron-dist\Mathematics Study Platform-win32-x64\Mathematics Study Platform.exe
) else (
    echo ERROR: Package creation failed
)

echo.
pause