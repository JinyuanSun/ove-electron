/* eslint-disable no-console*/
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const bioParsers = require("bio-parsers");
const fs = require("fs");
const createMenu = require("./src/main_utils/menu");
const windowStateKeeper = require("electron-window-state");
const { autoUpdater } = require("electron-updater");
const xmlrpc = require("xmlrpc");

let isAppReady = false;
let isMacOpenTriggered = false;
// XML-RPC: Store last opened file path and data for getSeqJson
let lastOpenedFilePath = null;
let lastSeqJson = null;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows = [];
createMenu({ windows, createWindow, getSeqJsonFromPath });

async function getSeqJsonFromPath(_filePath) {
  const filePath = _filePath || process.argv[1];
  // const filePath = _filePath || process.argv[2] || process.argv[1];
  if (filePath === ".") return;
  const data = fs.readFileSync(path.resolve(filePath));
  //open, read, handle file
  if (!data) return;
  const fileName = filePath.replace(/^.*[\\/]/, "");
  try {
    if (fileName.endsWith(".json") && (data.sequence || data.proteinSequence)) {
      return data;
    }
    const res = await bioParsers.anyToJson(data, { fileName });
    return res[0].parsedSequence;
  } catch (error) {
    console.error(`error:`, error);
    return {};
  }
}

function waitTillAppReady() {
  return new Promise((resolve, reject) => {
    const waitTillReadyInterval = setInterval(() => {
      if (isAppReady) {
        resolve();
        clearInterval(waitTillReadyInterval);
      }
    }, 100);
  });
}

async function createWindow({ initialSeqJson, filePath, windowToUse } = {}) {
  await waitTillAppReady();
  //if no windowVars are passed then we should
  // Create the browser window.

  if (filePath) {
    let alreadyOpen = false;
    windows.forEach((w) => {
      if (w.__filePath === filePath) {
        w.bw.show();
        alreadyOpen = true;
      }
    });
    if (alreadyOpen) {
      return;
    }
  }
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  let newWindow =
    windowToUse ||
    new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      show: false,
      webPreferences: {
        contextIsolation: true,
        // nodeIntegration: true, //we don't want to enable this because it is a security risk and slows down the app
        preload: path.join(__dirname, "src/preload.js"),
      },
    });

  newWindow.once("ready-to-show", () => {
    newWindow.show();
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(newWindow);

  !windowToUse &&
    windows.push({
      bw: newWindow,
      //set a __filePath property so we can reference this if a user tries to open the same file multiple times
      __filePath: filePath,
    });
console.log(`initialSeqJson:`,initialSeqJson)
  newWindow.loadFile("index.html", {
    query: { initialSeqJson: JSON.stringify(initialSeqJson), filePath },
  });

  // Open the DevTools.
  // newWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  newWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    let indexToSplice;
    windows.forEach((w, i) => {
      if (w.bw === newWindow) {
        indexToSplice = i;
      }
    });
    windows.splice(indexToSplice, 1);
    newWindow = null;
  });
}

app.on("open-file", async (event, path) => {
  isMacOpenTriggered = true;
  //mac only
  event.preventDefault();
  console.log(`open-file`)
  try {
    console.log("trying to open gb file");
    const initialSeqJson = await getSeqJsonFromPath(path);
    createWindow({ filePath: path, initialSeqJson });
  } catch (e) {
    console.error(`e73562891230:`, e);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  console.info(`App Starting Up`);
  autoUpdater.checkForUpdatesAndNotify();
  isAppReady = true;
  if (!windows.length && !isMacOpenTriggered) {
    let initialSeqJson;
    if ( process.argv.length >= 2) {
      initialSeqJson = await getSeqJsonFromPath();
    }
    createWindow({ filePath: path, initialSeqJson });
  }

  // Start XML-RPC server
  const xmlrpcServer = xmlrpc.createServer({ host: '127.0.0.1', port: 9091 }, () => {
    console.log('XML-RPC server listening on port 9091');
  });

  // XML-RPC: openFile
  xmlrpcServer.on('openFile', async function (err, params, callback) {
    if (!params || !params[0]) {
      callback({ faultCode: 400, faultString: 'File path required' });
      return;
    }
    const filePath = params[0];
    try {
      const seqJson = await getSeqJsonFromPath(filePath);
      // Optionally open window/ui
      createWindow({ filePath, initialSeqJson: seqJson });
      // Save state for getSeqJson
      lastOpenedFilePath = filePath;
      lastSeqJson = seqJson;
      callback(null, { status: 'ok', name: seqJson && seqJson.name, circular: seqJson && seqJson.circular });
    } catch (error) {
      callback({ faultCode: 500, faultString: error.message });
    }
  });

  // XML-RPC: getSeqJson
  xmlrpcServer.on('getSeqJson', async function (err, params, callback) {
    try {
      // If a path param provided, reload and return
      if (params && params[0]) {
        const seqJson = await getSeqJsonFromPath(params[0]);
        callback(null, seqJson);
      } else if (lastSeqJson) {
        callback(null, lastSeqJson);
      } else {
        callback({ faultCode: 404, faultString: 'No sequence in memory.' });
      }
    } catch (error) {
      callback({ faultCode: 500, faultString: error.message });
    }
  });

  // XML-RPC: generic OVE command invoke
  xmlrpcServer.on('invoke', async function (_err, params, callback) {
    // params[0] = commandName, params[1] = args
    try {
      const command = params && params[0];
      const args = (params && params[1]) || {};
      // Find focused OVE window (simplified: last in array)
      const target = windows.length ? windows[windows.length-1].bw : null;
      if (!target) return callback({ faultCode: 404, faultString: 'No OVE window' });
      // Use IPC to renderer
      const result = await target.webContents.executeJavaScript(`window.oveRpcHandler && window.oveRpcHandler(${JSON.stringify(command)}, ${JSON.stringify(args)})`);
      callback(null, result);
    } catch (e) {
      callback({ faultCode: 500, faultString: e.message });
    }
  });

  // XML-RPC: createFeature for selected DNA sequence
  xmlrpcServer.on('createFeature', async function (_err, params, callback) {
    try {
      // params[0]: {start, end, name, type, strand}
      const featureData = params && params[0];
      if (!featureData || featureData.start == null || featureData.end == null) {
        return callback({ faultCode: 400, faultString: 'Feature start/end required.' });
      }
      const target = windows.length ? windows[windows.length-1].bw : null;
      if (!target) return callback({ faultCode: 404, faultString: 'No OVE window' });
      // Invoke renderer's handler
      const response = await target.webContents.executeJavaScript(
        `window.oveRpcHandler && window.oveRpcHandler('createFeature', ${JSON.stringify(featureData)})`
      );
      callback(null, response);
    } catch (e) {
      callback({ faultCode: 500, faultString: e.message });
    }
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!windows.length) {
    console.log(`onActivate`);
    createWindow();
  }
});

// ipcMain.on("restart_app", () => {
//   setImmediate(() => {
//     autoUpdater.quitAndInstall();
//   });
// });

/*  HANDLE THE API CALLS FROM THE RENDERER PROCESS  */

ipcMain.handle(
  "ove_saveFile",
  (event, { sequenceDataToSave, filePath, isSaveAs }) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    const ext = path.extname(filePath);

    let formattedSeqString;
    if (ext === ".fasta") {
      formattedSeqString = bioParsers.jsonToFasta(sequenceDataToSave);
    } else if (ext === ".bed") {
      formattedSeqString = bioParsers.jsonToBed(sequenceDataToSave);
    } else if (ext === ".json") {
      formattedSeqString = JSON.stringify(sequenceDataToSave, null, 2);
    } else {
      formattedSeqString = bioParsers.jsonToGenbank(sequenceDataToSave);
    }
    fs.writeFileSync(filePath, formattedSeqString);
    !isSaveAs &&
      windows.forEach((w) => {
        if (w.bw === browserWindow) {
          //update the __filePath prop we're saving on the window to prevent opening the same file twice
          w.__filePath = filePath;
        }
      });
  }
);

ipcMain.handle("ove_showSaveDialog", async (event, opts) => {
  return dialog.showSaveDialogSync(
    BrowserWindow.fromWebContents(event.sender),
    opts
  );
});

/*  **************************************************  */
