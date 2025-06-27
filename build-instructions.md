# Building Mathematics Study Platform as Desktop App (.exe)

## Quick Start for Windows

1. **Download this project** to your PC
2. **Install Node.js** from nodejs.org (if not installed)
3. **Open Terminal/Command Prompt** in project folder
4. **Run the build script:**
   ```cmd
   # Easy way: Double-click build-exe.cmd
   build-exe.cmd
   
   # OR run manually:
   npm install
   npm run build
   npx electron-builder --win --config electron-builder.json
   ```
5. **Find your .exe** in `electron-dist/` folder:
   - `Mathematics Study Platform Setup.exe` - Full installer
   - `win-unpacked/Mathematics Study Platform.exe` - Portable version

## Detailed Instructions

## Prerequisites

1. Node.js installed
2. Git Bash or Windows Terminal
3. All project dependencies installed: `npm install`

## Development Mode

To run the app in development mode:

```bash
# Option 1: Use the batch script (Windows)
test-electron.cmd

# Option 2: Manual commands
npm install
npm run build
npx electron electron-main.js
```

## Building for Production

### 1. Build the Web App
```bash
npm run build
```

### 2. Create Desktop App

#### Windows (.exe)
```bash
# Easy way: Use the batch script
build-exe.cmd

# Manual way:
npm run build
npx electron-builder --win --config electron-builder.json
```

#### Outputs:
- `electron-dist/` folder contains:
  - `Mathematics Study Platform Setup.exe` - Installer
  - `Mathematics Study Platform.exe` - Portable version

### 3. Install and Run

**Installer Version:**
1. Run `Mathematics Study Platform Setup.exe`
2. Follow installation wizard
3. Launch from Start Menu or Desktop shortcut

**Portable Version:**
1. Extract files from the portable package
2. Double-click `Mathematics Study Platform.exe`
3. No installation required!

## App Features in Desktop Mode

- **Native Window Controls**: Minimize, maximize, close
- **Keyboard Shortcuts**: 
  - Ctrl+Q: Quit app
  - Ctrl+Left/Right: Navigate exercises
  - Escape: Open settings
- **Menu Bar**: File, Edit, View, Study, Help menus
- **Offline Capable**: Runs without internet (except AI features)
- **System Integration**: Proper app icon, taskbar integration

## Customization

### App Icon
1. Add your icons to `electron/assets/`:
   - `icon.ico` for Windows
   - `icon.png` for Linux
   - `icon.icns` for macOS
2. Rebuild with `npm run electron:build`

### App Details
Edit `package.json` build section:
- `appId`: Change app identifier
- `productName`: Change display name
- `description`: App description

## Troubleshooting

**Server not starting:**
- Make sure port 5000 is available
- Check `server/index.ts` for errors

**Build fails:**
- Run `npm install` to ensure all dependencies
- Clear cache: `npm run build` then try again

**App crashes:**
- Check console for errors
- Ensure database is accessible
- Verify all required files are included in build

## Distribution

Your built app is completely self-contained and can be:
- Shared via USB drive
- Uploaded to file sharing services
- Distributed to other Windows PCs
- Installed without internet connection

The app includes your exercises, all dependencies, and the complete Node.js runtime.