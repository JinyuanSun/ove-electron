<p align="center">
  <img src="https://user-images.githubusercontent.com/2730609/67169732-df3ca800-f348-11e9-8003-baa91cd8cfec.png" alt="open-vector-editor Electron banner"/>
</p>

# ove-electron: Open Vector Editor Desktop App (with XML-RPC support)

**ove-electron** wraps the powerful [Open Vector Editor (OVE)](https://github.com/TeselaGen/open-vector-editor) web app in a cross-platform Electron application. It allows scientists to open, view, edit, and save DNA/protein files using a rich UI — now with programmable XML-RPC automation.

---

## 🚀 Features

- Open, edit, annotate, and export biological sequences (GenBank, FASTA, JSON, etc.)
- Full-featured OVE graphical editor in a native desktop window
- Cross-platform: Windows, macOS, Linux
- **Native file dialogs, menus, and multi-window support**
- **Programmable XML-RPC server—automate OVE or integrate with other tools!**

---

## Installation

**Pre-built installs:**
- Windows: Microsoft Store [OVE app page](https://www.microsoft.com/en-us/p/openvectoreditor/9nxcc5vc41k9?activetab=pivot:overviewtab)
- Mac/Linux: Download [latest release](https://github.com/tnrich/ove-electron/releases) for your OS

**From source:**
```bash
git clone https://github.com/tnrich/ove-electron.git
cd ove-electron
npm install
npm start
```

---

## Usage

Run as a **desktop app**:
```bash
npm start
```

### Open/Save/Export via GUI

- Use the File menu to open, create, or save sequences
- Use OVE’s graphical UI for edits, annotations, sequence viewing, and feature manipulation
- Export to GenBank, FASTA, Teselagen JSON, BED, etc.

### Native Menus
- New, Open, Save, Save As, Quit, Undo/Redo, Cut, Copy, Paste, View, Window controls

---

## XML-RPC Server (Automate OVE!)

When you run the app, it starts an **XML-RPC server** on `127.0.0.1:9091` by default. You can control/automate the editor and operate on sequence files programmatically!

### Exposed XML-RPC Methods

- `openFile(path)`: Open & parse a sequence file in OVE
- `getSeqJson([path])`: Return the JSON for the loaded (or given) sequence file
- `invoke(command, args)`: Call any OVE UI/editor function (see below)

#### Example (Python):
```python
import xmlrpc.client
proxy = xmlrpc.client.ServerProxy("http://127.0.0.1:9091/")
proxy.openFile("/path/to/file.gb")
json = proxy.getSeqJson()
result = proxy.invoke("getSequence", {})
# Extend 'invoke' for other OVE operations
```

#### Create Feature via XML-RPC (Python Demo)

Here is how to programmatically add a feature/annotation to a selected DNA region in the currently open OVE window:

```python
import xmlrpc.client
proxy = xmlrpc.client.ServerProxy("http://127.0.0.1:9091/")

# 1. Open your sequence file:
proxy.openFile("/path/to/file.gb")

# 2. Create a new feature (annotate bases 10-50 on the forward strand):
# You can modify name/type/strand as needed
result = proxy.createFeature({
    "start": 10,   # 0-based, inclusive
    "end": 50,     # inclusive
    "name": "DemoFeature",
    "type": "misc_feature",
    "strand": 1    # 1 (forward) or -1 (reverse)
})
print('createFeature result:', result)

# 3. Fetch all current features as confirmation:
new_json = proxy.getSeqJson()
print('Current features:', new_json['features'])
```

This will add a visible feature/annotation to the loaded sequence in the Electron OVE window.

#### Adding Actions
To allow a new GUI/editor function via RPC, add an implementation to `window.oveRpcHandler` in `src/renderer.js`, and document its usage.

---

## Extending Automation

- The infrastructure allows *any* OVE function to be dispatched via `invoke(command, args)`!
- Example commands to expose: set sequence, add annotation, run undo/redo, export, etc.
- Add your handler in `src/renderer.js` → `window.oveRpcHandler`

---

## Development

```bash
npm install
npm start
# Make changes to Open Vector Editor? See the section below for live-linking OVE.
```

## Live-link OVE for Development
To test unreleased OVE changes:
```bash
cd open-vector-editor
npm link
cd ../ove-electron
npm link open-vector-editor
```

---

## License

MIT; Copyright (c) Teselagen Biotechnology. See LICENSE.md for more.