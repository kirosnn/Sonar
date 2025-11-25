const { app, BrowserWindow, protocol, ipcMain, nativeTheme, systemPreferences, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { AssemblyAI } = require('assemblyai');
require('dotenv').config();

app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disk-cache-size', '0');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow;

function getThemeColors() {
  const isDark = nativeTheme.shouldUseDarkColors;

  if (process.platform === 'win32') {
    try {
      const accentColor = systemPreferences.getAccentColor();
      const r = parseInt(accentColor.substr(0, 2), 16);
      const g = parseInt(accentColor.substr(2, 2), 16);
      const b = parseInt(accentColor.substr(4, 2), 16);

      return {
        backgroundColor: isDark ? '#191a1a' : '#f3f3f3',
        symbolColor: isDark ? '#ffffff' : '#000000',
        accentColor: `rgb(${r}, ${g}, ${b})`
      };
    } catch (error) {
      return {
        backgroundColor: isDark ? '#2c2c2c' : '#f3f3f3',
        symbolColor: isDark ? '#ffffff' : '#000000',
        accentColor: isDark ? '#0078d4' : '#0067c0'
      };
    }
  }

  return {
    backgroundColor: isDark ? '#2c2c2c' : '#f3f3f3',
    symbolColor: isDark ? '#ffffff' : '#000000',
    accentColor: isDark ? '#0078d4' : '#0067c0'
  };
}

function updateTitleBarOverlay() {
  if (mainWindow && process.platform !== 'darwin') {
    const colors = getThemeColors();
    mainWindow.setTitleBarOverlay({
      color: colors.backgroundColor,
      symbolColor: colors.symbolColor,
      height: 40
    });
  }
}

function createWindow() {
  const colors = getThemeColors();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hidden',
    titleBarOverlay: process.platform !== 'darwin' ? {
      color: colors.backgroundColor,
      symbolColor: colors.symbolColor,
      height: 40
    } : false,
    backgroundColor: colors.backgroundColor,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      partition: 'persist:sonar',
      cache: false
    }
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.maximize();

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  nativeTheme.on('updated', () => {
    updateTitleBarOverlay();
    if (mainWindow) {
      mainWindow.webContents.send('theme-changed', getThemeColors());
    }
  });
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sonar',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

function registerSonarProtocol() {
  const handler = (request) => {
    const url = new URL(request.url);
    const pathname = url.hostname + url.pathname;

    console.log('Sonar protocol requested:', pathname);

    let filePath;

    if (pathname === 'new-tab' || pathname === 'new-tab/') {
      filePath = path.join(__dirname, 'pages', 'new-tab.html');
    } else if (pathname.endsWith('/')) {
      filePath = path.join(__dirname, 'pages', pathname.slice(0, -1) + '.html');
    } else {
      filePath = path.join(__dirname, 'pages', pathname);
    }

    console.log('File path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));

    if (fs.existsSync(filePath)) {
      return net.fetch('file://' + filePath);
    } else {
      const fallbackPath = path.join(__dirname, 'pages', '404.html');
      return net.fetch('file://' + fallbackPath);
    }
  };

  protocol.handle('sonar', handler);

  try {
    const webviewSession = session.fromPartition('persist:sonar');
    if (webviewSession && webviewSession.protocol && webviewSession.protocol.handle) {
      webviewSession.protocol.handle('sonar', handler);
    }
  } catch (e) {
    console.error('Failed to register sonar protocol for webview session:', e);
  }
}

app.on('ready', () => {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('sonar', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('sonar');
  }

  console.log('Registering sonar protocol...');
  registerSonarProtocol();
  console.log('Sonar protocol registered');
  console.log('__dirname:', __dirname);
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('navigate', async (event, url) => {
  return { success: true, url: url };
});

ipcMain.handle('go-back', async (event) => {
  return { success: true };
});

ipcMain.handle('go-forward', async (event) => {
  return { success: true };
});

ipcMain.handle('reload', async (event) => {
  return { success: true };
});

ipcMain.handle('new-tab', async (event) => {
  return { success: true };
});

ipcMain.handle('get-theme-colors', async (event) => {
  return getThemeColors();
});

ipcMain.handle('get-new-tab-path', async (event) => {
  console.log('IPC get-new-tab-path called');
  return 'sonar://new-tab';
});

ipcMain.handle('close-app', async (event) => {
  app.quit();
  return { success: true };
});

ipcMain.handle('transcribe-audio', async (event, base64Audio) => {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      throw new Error('AssemblyAI API key not found');
    }

    const client = new AssemblyAI({ apiKey });

    const buffer = Buffer.from(base64Audio, 'base64');
    const tempFilePath = path.join(app.getPath('temp'), `voice-${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, buffer);

    const transcript = await client.transcripts.transcribe({
      audio: tempFilePath,
      language_code: 'en'
    });

    fs.unlinkSync(tempFilePath);

    if (transcript.status === 'error') {
      throw new Error(transcript.error);
    }

    return transcript.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
});
