const electron = require("electron");
const currentWindow = electron.remote.getCurrentWindow();

const seqDataToUse = currentWindow.initialSeqJson || { circular: true };
// export default generateSequenceData()

const editor = window.createVectorEditor("createDomNodeForMe", {
  isFullscreen: true,
  // or you can pass "createDomNodeForMe" but make sure to use editor.close() to clean up the dom node!

  //you can also pass a DOM node as the first arg here
  // showReadOnly: false,
  // disableSetReadOnly: true,
  shouldAutosave: true,
  // rightClickOverrides: {
  //   selectionLayerRightClicked: (items /* { annotation }, props */) => {
  //     return [
  //       ...items,
  //       {
  //         text: "Create Part",
  //         onClick: () => console.info("hey!≈")
  //       }
  //     ];
  //   }
  // },
  // handleFullscreenClose: () => { //comment this function in to make the editor fullscreen by default
  //   editor.close() //this calls reactDom.unmountComponent at the node you passed as the first arg
  // },
  // onRename: () => {}, //this option should be shown by default
  // onNew: () => {}, //unless this callback is defined, don't show the option to create a new seq
  // onDuplicate: () => {}, //unless this callback is defined, don't show the option to create a new seq
  // onSave: function(
  //   event,
  //   sequenceDataToSave,
  //   editorState,
  //   onSuccessCallback
  // ) {
  //   console.info("event:", event);
  //   console.info("sequenceData:", sequenceDataToSave);
  //   console.info("editorState:", editorState);
  //   // To disable the save button after successful saving
  //   // either call the onSuccessCallback or return a successful promise :)
  //   onSuccessCallback();
  //   //or
  //   // return myPromiseBasedApiCall()
  // },
  // onDelete: data => {
  //   console.warn("would delete", data);
  // },
  // onCopy: function(event, copiedSequenceData /* , editorState */) {
  //   //the copiedSequenceData is the subset of the sequence that has been copied in the teselagen sequence format
  //   const clipboardData = event.clipboardData;
  //   clipboardData.setData("text/plain", copiedSequenceData.sequence);
  //   clipboardData.setData(
  //     "application/json",
  //     //for example here you could change teselagen parts into jbei parts
  //     JSON.stringify(copiedSequenceData)
  //   );
  //   event.preventDefault();
  //   //in onPaste in your app you can do:
  //   // e.clipboardData.getData('application/json')
  // },
  // onPaste: function(event /* , editorState */) {
  //   //the onPaste here must return sequenceData in the teselagen data format
  //   const clipboardData = event.clipboardData;
  //   let jsonData = clipboardData.getData("application/json");
  //   if (jsonData) {
  //     jsonData = JSON.parse(jsonData);
  //     if (jsonData.isJbeiSeq) {
  //       jsonData = convertJbeiToTeselagen(jsonData);
  //     }
  //   }
  //   const sequenceData = jsonData || {
  //     sequence: clipboardData.getData("text/plain")
  //   };
  //   return sequenceData;
  // },
  // getSequenceAtVersion: versionId => {
  //   if (versionId === 2) {
  //     return {
  //       sequence: "thomaswashere"
  //     };
  //   } else if ((versionId = 3)) {
  //     return {
  //       features: [{ start: 4, end: 6 }],
  //       sequence:
  //         "GGGAAAagagagtgagagagtagagagagaccacaccccccGGGAAAagagagtgagagagtagagagagaccacaccccccGGGAAAagagagtgagagagtagagagagaccacaccccccGGGAAAagagagtgagagagtagagagagaccacacccccc"
  //     };
  //   } else {
  //     console.error("we shouldn't be here...");
  //     return {
  //       sequence: "taa"
  //     };
  //   }
  // },
  // getVersionList: () => {
  //   return [
  //     {
  //       dateChanged: "12/30/2211",
  //       editedBy: "Nara",
  //       // revisionType: "Sequence Deletion",
  //       versionId: 2
  //     },
  //     {
  //       dateChanged: "8/30/2211",
  //       editedBy: "Ralph",
  //       // revisionType: "Feature Edit",
  //       versionId: 3
  //     }
  //   ];
  // },
  showMenuBar: true,
  PropertiesProps: {
    propertiesList: [
      "general",
      "features",
      "parts",
      "primers",
      "translations",
      "cutsites",
      "orfs",
      "genbank"
    ]
  },
  ToolBarProps: {
    toolList: [
      "saveTool",
      "downloadTool",
      "importTool",
      "undoTool",
      "redoTool",
      "cutsiteTool",
      "featureTool",
      "alignmentTool",
      "versionHistoryTool",
      // "oligoTool",
      "orfTool",
      // "viewTool",
      "editTool",
      "findTool",
      "visibilityTool"
      // "propertiesTool"
    ]
  }
}); /* createDomNodeForMe will make a dom node for you and append it to the document.body*/

editor.updateEditor({
  sequenceData: seqDataToUse,
  sequenceDataHistory: {}, //clear the sequenceDataHistory if there is any left over from a previous sequence
  annotationVisibility: {
    // features: false,
    orfTranslations: false
  },
  readOnly: false,
  panelsShown: [
    [
      {
        // fullScreen: true,
        active: true,
        id: "circular",
        name: "Circular Map"
      },
      {
        id: "rail",
        name: "Linear Map"
      }
    ],
    [
      {
        id: "sequence",
        name: "Sequence Map",
        active: true
      },

      {
        id: "properties",
        name: "Properties"
      }
    ]
  ],
  annotationsToSupport: {
    //these are the defaults, change to false to exclude
    features: true,
    translations: true,
    parts: true,
    orfs: true,
    cutsites: true,
    primers: false
  }
});
