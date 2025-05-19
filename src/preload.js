// tnr: We now only access the ipcRenderer from here and
// create a bridge called "api" to communicate back to the
// main process from renderer. I also am now setting the initial sequence data
// using a querystring - https://stackoverflow.com/questions/38335004/how-to-pass-parameters-from-main-process-to-render-processes-in-electron/38401579#38401579

const { ipcRenderer, contextBridge } = require("electron");

// Adds an object 'api' to the global window object:
contextBridge.exposeInMainWorld("api", {
  send: async (type, arg) => ipcRenderer.invoke(type, arg),
});

// OVE RPC handler—expose to Electron main

// Grab initialSeqJson from URL, as before (already in code below)
let seqDataToUse = { circular: true };
const urlParams = new URLSearchParams(global.location.search);
try {
  const datastring = urlParams.get('initialSeqJson');
  if (datastring) {
    const data = JSON.parse(datastring);
    seqDataToUse = data;
    contextBridge.exposeInMainWorld("initialSeqJson", data);
  }
} catch (error) {
  console.error(`error with initialSeqJson:`, error);
}

// Native OVE handler now defined in preload, logic in main world
contextBridge.exposeInMainWorld("oveRpcHandler", async (command, args) => {
  try {
    switch (command) {
      case 'getSequence':
        return seqDataToUse;
      case 'setTitle':
        // Title setting should likely be handled renderer-side for real UI
        return { ok: true };
      case 'createFeature':
        // args: {start, end, name, type, strand}
        if (!args || args.start == null || args.end == null) {
          return { error: 'Feature start/end is required' };
        }
        // Default options -- DNA is 1-based, inclusive
        const feature = {
          name: args.name || 'New Feature',
          type: args.type || 'misc_feature',
          start: args.start|0,
          end: args.end|0,
          strand: args.strand || 1,
        };
        if (!seqDataToUse.features) seqDataToUse.features = [];
        seqDataToUse.features.push(feature);
        // UI update should be sent renderer-side if needed (e.g., via ipcRenderer)
        return { ok: true, feature, features: seqDataToUse.features };
      default:
        return { error: `Unknown OVE RPC command: ${command}` };
    }
  } catch (e) {
    return { error: e.message };
  }
});

// initialSeqJson is set above, in process of setting seqDataToUse
// Add the filepath to the renderer window
try {
  const datastring = urlParams.get('filePath');
  if (datastring) {
    const data = JSON.parse(datastring);
    contextBridge.exposeInMainWorld("filePath", data);
  }
} catch (error) {
  console.error(`error with filePath:`, error);
}

// function getParameterByName(name, url ) {
//   name = name.replace(/[\[\]]/g, '\\$&');
//   const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
//       results = regex.exec(url);
//   if (!results) return null;
//   if (!results[2]) return '';
//   return decodeURIComponent(results[2].replace(/\+/g, ' '));
// }