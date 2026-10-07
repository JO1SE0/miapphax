const { app, shell, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const { z } = require('zod');
const { version } = require('./package.json');
const { generateKeyPairSync } = require('crypto');
const DiscordRPC = require ("discord-rpc");

let win;
// --- Identidad "TL App" ---------------------------------------------------
// La carpeta de datos (ajustes + login/auth de HaxBall en localStorage) se deriva
// del nombre de la app. Para NO perderlos al renombrar, se fija a mano la carpeta
// que ya se venia usando (la primera que exista) antes de que arranque la app.
(() => {
  try {
    const base = app.getPath('appData');
    const candidates = ['haxball-client', 'HaxBall Client', 'TL App'];
    const found = candidates.find((n) => fs.existsSync(path.join(base, n)));
    const dir = path.join(base, found || 'haxball-client');
    app.setPath('userData', dir);
    // copia de seguridad unica de los ajustes antes del cambio de nombre
    const prefs = path.join(dir, 'preferences.json');
    const bak = path.join(dir, 'preferences.backup-pre-tlapp.json');
    if (fs.existsSync(prefs) && !fs.existsSync(bak)) fs.copyFileSync(prefs, bak);
  } catch (e) {
    console.error('No se pudo fijar userData', e);
  }
  app.setName('TL App');
})();

// Id de la aplicacion de Discord. El nombre que aparece en "Jugando a ..." es el de ESA
// aplicacion: para que diga TL App, crea la tuya en discord.com/developers y pon su id en
// preferences.json ("discord_client_id"). Si no, usa la del cliente original.
const DEFAULT_RPC_ID = "1391027232352501841";
const rpc = new DiscordRPC.Client({ transport: 'ipc' });
rpc.on('ready', () => {
	console.log('Discord RPC ready');
});


const validatePreferences = (prefs) => {
  const ProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    autosave: z.boolean(),
    avatar: z.string().nullable(),
    extrapolation: z.string().nullable(),
    fav_rooms: z.array(z.string()),
    geo_override: z.object({
      lat: z.number(),
      lon: z.number(),
      code: z.string()
    }).nullable(),
    player_auth_key: z.string().nullable(),
    player_name: z.string().nullable()
  });

  const PreferencesSchema = z.object({
      fps_unlock: z.boolean(),
      notes: z.array(z.object({
        title: z.string(),
        body: z.string(),
        time: z.string()
      })), 
      transp_ui: z.boolean(),
      shortcuts: z.array(z.tuple([z.string(), z.string()])),
      profiles: z.array(ProfileSchema),
      discord_rpc: z.boolean().optional()
  });

  try {
    PreferencesSchema.parse(prefs);
  } catch (err) {
    console.error('Failed to validate preferences:', err);
}

}

const saveAppPreferences = (prefs) => {
  const userDatapath = app.getPath('userData')
  const preferencesPath = path.join(userDatapath, 'preferences.json')
  try {
    fs.writeFileSync(preferencesPath, JSON.stringify(prefs, null, 2));
  } catch (error) {
    console.error('Error saving app preferences:', error);
  }
}

const loadAppPreferences = () => {
  const userDataPath = app.getPath('userData')
  const preferencesPath = path.join(userDataPath, 'preferences.json')
  const preferencesDefaultPath = path.join(__dirname, 'inject', 'preferences_default.json')
  try {
    if (fs.existsSync(preferencesPath)) {
      const fileContent = fs.readFileSync(preferencesPath, 'utf-8');
      const data = JSON.parse(fileContent)
      validatePreferences(data)
      return data;
    } else {
      // File doesn't exist, return and save default settings
      const fileContent = fs.readFileSync(preferencesDefaultPath, 'utf8')
      const data = JSON.parse(fileContent)
      validatePreferences(data)
      saveAppPreferences(data)
      return data;
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
    app.quit();
    return {};
  }
}

const preferences = loadAppPreferences();
// --- Rendimiento / latencia -------------------------------------------------
// Todas son flags estandar de Chromium. Se leen una sola vez al arrancar, por
// eso hay que reiniciar la app despues de cambiar estas opciones en Settings.
//
// FPS ilimitado: sin vsync ni limite de cuadros (puede verse algo de tearing).
if (preferences.fps_unlock) {
  app.commandLine.appendSwitch('disable-gpu-vsync');
  app.commandLine.appendSwitch('disable-frame-rate-limit');
  // (estas tres ya estaban aca antes; se repiten en low_latency y no molesta)
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  console.log("FPS unlocked")
}

// Modo baja latencia (Settings > Low Latency): evita que Chromium baje la
// prioridad del juego y usa mejor la GPU.
if (preferences.low_latency) {
  // GPU: dibujar el canvas con la GPU y evitar copias de memoria.
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  // Nada de throttling cuando la ventana no esta en primer plano / tapada.
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
  // Chromium en Windows calcula si la ventana esta tapada (cuesta CPU y puede
  // frenar el render); lo apagamos. 'disable-features' se pasa en UNA sola
  // llamada porque una segunda pisaria a la primera.
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,IntensiveWakeUpThrottling');
  // Sin limite de eventos de teclado/mouse por segundo hacia la pagina.
  app.commandLine.appendSwitch('disable-ipc-flooding-protection');
  // Menos trabajo en segundo plano: sin monitor de cuelgues, reportes de fallas,
  // actualizaciones de componentes, red de fondo, accesibilidad ni scroll suave.
  for (const flag of [
    'disable-hang-monitor', 'disable-breakpad', 'disable-component-update',
    'disable-background-networking', 'disable-sync', 'disable-default-apps',
    'no-pings', 'disable-renderer-accessibility', 'disable-smooth-scrolling'
  ]) app.commandLine.appendSwitch(flag);
  console.log("Low latency flags enabled")
}

// Laptops con dos placas de video: fuerza la GPU dedicada en vez de la integrada.
if (preferences.force_gpu) {
  app.commandLine.appendSwitch('force_high_performance_gpu');
}

// EXPERIMENTAL: el proceso de GPU corre dentro del proceso principal. Ahorra
// comunicacion entre procesos (puede bajar algo la latencia) pero si la GPU
// se cuelga se cae toda la app. Apagado por defecto.
if (preferences.in_process_gpu) {
  app.commandLine.appendSwitch('in-process-gpu');
}

// Prioridad alta de CPU para la app y sus procesos (ayuda cuando la PC esta
// cargada). No necesita permisos de administrador; si el sistema no lo permite
// simplemente se ignora.
const boostPriority = () => {
  if (!preferences.high_priority) return;
  const os = require('os');
  const high = os.constants.priority.PRIORITY_HIGH;
  const pids = new Set([process.pid]);
  try {
    app.getAppMetrics().forEach((m) => pids.add(m.pid));
  } catch (e) {}
  pids.forEach((pid) => {
    try { os.setPriority(pid, high); } catch (e) {}
  });
};


const createWindow = () => {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 1024,
    minHeight: 720,
    show: false, // start hidden
    fullscreen: false,
    fullscreenable: true,
    titleBarStyle: "default",
    autoHideMenuBar: true,
    kiosk: false,
    frame: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      backgroundThrottling: !preferences.low_latency,
      spellcheck: false
    },
    title: "TL App",
    icon: path.join(__dirname, 'assets', 'icon.png')
  });
  
  // La extension "All-in-one Tool" mete scripts en la pagina; se puede apagar
  // desde el panel (Rendim.) para ahorrar CPU, a costa de sus funciones.
  if (!preferences.disable_extension) {
    const extensionPath = path.join(__dirname, 'inject', 'Haxball-Room-Extension');
    win.webContents.session.loadExtension(extensionPath);
  }

  // El titulo de la ventana/barra de tareas siempre es "TL App" (la pagina intenta poner "HaxBall")
  win.on('page-title-updated', (e) => {
    e.preventDefault();
    win.setTitle('TL App');
  });

  // Baja latencia: que Windows no apague la pantalla ni suspenda la app en plena partida.
  if (preferences.low_latency) {
    try {
      const { powerSaveBlocker } = require('electron');
      powerSaveBlocker.start('prevent-display-sleep');
    } catch (e) { /* no critico */ }
  }

  win.loadURL('https://www.haxball.com/play');

  // Atajos: F8 = lineas finas on/off, F9 = mostrar/ocultar el panel lateral
  const hotkeys = {
    F8: 'window.__haxToggleLines && window.__haxToggleLines()',
    F9: 'window.__haxTogglePanel && window.__haxTogglePanel()'
  };
  win.webContents.on('before-input-event', (event, input) => {
    const code = hotkeys[input.key];
    if (code && input.type === 'keyDown' && !input.isAutoRepeat) {
      event.preventDefault();
      win.webContents.executeJavaScript(code).catch(() => {});
    }
  });

  win.webContents.on('did-finish-load', boostPriority);
  setInterval(boostPriority, 30000);

  win.webContents.on('did-finish-load', () => {
    const injectJS = fs.readFileSync(path.join(__dirname, 'inject', 'inject.js'), 'utf8');
    // const injectCSS = fs.readFileSync(path.join(__dirname, 'inject', 'inject.css'), 'utf8');

    // win.webContents.executeJavaScript(`
    //   const style = document.createElement('style');
    //   style.textContent = \`${injectCSS}\`;
    //   document.head.appendChild(style);
    // `);

    win.webContents.executeJavaScript(injectJS);
  });

  // unlimited FPS workaround for newer electron versions
  // win.webContents.on('did-frame-finish-load', () => {
  //   if (!win.webContents.debugger.isAttached()) {
  //     try {
  //       win.webContents.debugger.attach('1.3');
  //     } catch (err) {
  //       console.error('Debugger attach failed:', err);
  //       return;
  //     }
  //   }

  //   if (preferences.fps_unlock){
  //     win.webContents.debugger.sendCommand('Emulation.setCPUThrottlingRate', {
  //       rate: 9
  //     }).then(() => {
  //       console.log('Throttling enabled');
  //     }).catch(err => {
  //       console.error('Failed to set throttling rate:', err);
  //     });
  //   }
  // })


  // Handle in-app navigation (e.g., <a href="..."> clicks)
  win.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    // const isInternal = parsedUrl.hostname.endsWith('haxball.com');

    const allowed = url.includes('haxball.com') || url.startsWith('https://github.com/oghb/haxball-client/releases/download');

    if (!allowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle window.open or target="_blank"
  win.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    const isInternal = parsedUrl.hostname.endsWith('haxball.com');

    if (isInternal & url !== "https://haxball.com/playerauth") {
      createWindow(url);
    } else {
      shell.openExternal(url);
    }

    return { action: 'deny' }; // We handle both cases manually
  });

  // make sure the app closes even if player in a room
  win.webContents.on('will-prevent-unload', (event) => {
    event.preventDefault();
  });
  win.on('close', (e) => {
    mainWindow = null;
  });

  return win;
}

ipcMain.handle('set-app-preference', async (event, key, value) => {
  // console.log('Received preference:', key, value);
  const prefs = loadAppPreferences();
  prefs[key] = value;
  saveAppPreferences(prefs);
});

ipcMain.handle('get-app-preferences', async () => {
  return loadAppPreferences();
});

ipcMain.on('restart-app', () => {
  console.log('Restarting app...');
  // app.relaunch();
  app.relaunch({
    execPath: process.execPath,
    args: process.argv.slice(1).concat(['--relaunch'])
  });
  app.exit(0);
});

ipcMain.on('ready-to-show', () => {
  win.show();
});

ipcMain.handle('save-preferences-file', async () => {
  const userDataPath = app.getPath('userData')
  const preferencesPath = path.join(userDataPath, 'preferences.json')
  const now = +new Date()

  const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `preferences_${now}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (!canceled && filePath) {
      const content = await fs.promises.readFile(preferencesPath, 'utf-8');
      await fs.promises.writeFile(filePath, content);
      return { success: true };
  }
  return { succes: false };
});


ipcMain.handle('import-preferences-file', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Preferences JSON',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) {
      return { success: false, error: 'No file selected.' };
  }

  try {
      const filePath = filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // console.log(data)

      // Validate the data
      validatePreferences(data);

      // Save it to the Electron user data folder
      const userDataPath = app.getPath('userData');
      const preferencesPath = path.join(userDataPath, 'preferences.json');

      fs.writeFileSync(preferencesPath, JSON.stringify(data, null, 2), 'utf-8');

      return { success: true };
  } catch (err) {
      console.error('Failed to import preferences:', err);
      return { success: false, error: err.errors || err.message || 'Invalid JSON file.' };
  }
});

ipcMain.handle('delete-preferences-file', async (event) => {
  const userDataPath = app.getPath('userData')
  const preferencesPath = path.join(userDataPath, 'preferences.json')
  try {
    if (fs.existsSync(preferencesPath)) {
      fs.rmSync(preferencesPath);
      return { success: true }
    }
  } catch (error) {
    console.error('Error deleting preferences:', error);
    return { success: false };
  }
})

ipcMain.handle('get-app-version', async (event) => {
  return version
})

ipcMain.handle('generate-player-auth-key', async (event) => {
  const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { format: 'jwk' },
    privateKeyEncoding: { format: 'jwk' },
  });

  const idkey = `idkey.${privateKey.x}.${privateKey.y}.${privateKey.d}`;

  return idkey
})

let rpcLastKey = '';
let rpcSince = Date.now();
ipcMain.on('update-discord-rpc', (_event, details, state) => {
  // el contador de tiempo solo se reinicia al cambiar de sala / pantalla
  const key = String(details);
  if (key !== rpcLastKey) { rpcLastKey = key; rpcSince = Date.now(); }
  const activity = {
    details: String(details).slice(0, 128),
    largeImageKey: 'client-logo',
    largeImageText: 'TL App',
    startTimestamp: rpcSince,
  };
  if (state) activity.state = String(state).slice(0, 128);

  rpc.setActivity(activity).catch((err) => {
    console.error('Discord RPC Error: Not logged in');
  });
});

app.whenReady().then(() => {
  win = createWindow();

  const preferencesPath = path.join(app.getPath('userData'), 'preferences.json')
  const fileContent = fs.readFileSync(preferencesPath, 'utf-8');
  const data = JSON.parse(fileContent);

  const enableRPC = data["discord_rpc"] ?? true;

  if (enableRPC){
    const customId = String(data["discord_client_id"] || '').trim();
    rpc.login({ clientId: /^\d{15,25}$/.test(customId) ? customId : DEFAULT_RPC_ID }).catch(() => {});
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
