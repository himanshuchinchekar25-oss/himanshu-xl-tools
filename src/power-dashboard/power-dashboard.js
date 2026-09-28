import "./power-dashboard.css";


// ============================================================
// POWER DASHBOARD STUDIO STATE
// ============================================================

const dashboardState = {

    // ==========================================================
  // DASHBOARD PROJECT MODEL
  // ==========================================================

  project: {

    dashboardId: "",

    projectVersion: 1,

    mode: "new",

    status: "draft",

    isDirty: false,

    createdAt: "",

    updatedAt: "",

    lastSavedAt: "",

    publishedAt: "",

    publishedVersion: 0,

    draftVersion: 0

  },

  activeSection: "dataSetupSection",

  dataRange: "",

  rowCount: null,

  columnCount: null,

  headerDetected: false,

  dataTypeDetected: false,

  dashboardTitle:
    "Sales Performance Dashboard",

  theme: "ocean",

  currency: "INR",

  gridlines: "hide",

  layout: "executive",

  canvasMode:
  "auto",

canvasPreset:
  "window",

canvasStartCell:
  "B2",

canvasEndCell:
  "Y55",

lockCanvas:
  true,

  kpiStyle:
    "Modern Cards",

  chartStyle:
    "Clean",

    background:
    "Light",

  protectDashboard:
    true,

  hideBackend:
    true,

  lockSettings:
    false,

  dataEngine: "classic",

    // ==========================================================
  // DASHBOARD BUILDER ITEMS
  // ==========================================================

  kpis: [],

  charts: [],

  slicers: [],

  tables: [],

columnDefinitions: [],

profilerResult: null,

advisorResult: null,

advisorActionState: {},

sourceValues: [],

lastRefreshedAt: "",

// ==========================================================
// LIVE SLICER / FILTER STATE
// ==========================================================
//
// Structure:
//
// activeFilters: {
//   "State": ["Maharashtra", "Gujarat"],
//   "Category": ["Furniture"]
// }
//
// Empty object = no active filtering.
//
activeFilters: {},


editingKpiId: null,

  editingChartId: null,

  editingSlicerId: null,

  editingTableId: null,

  counts: {
    kpis: 0,
    charts: 0,
    slicers: 0,
    tables: 0
  }

};

// ============================================================
// POWER DASHBOARD REFRESH STATE
// ============================================================

let dashboardRefreshInProgress = false;


// ============================================================
// DASHBOARD PROJECT MODEL HELPERS
// ============================================================

function createDashboardProjectId() {

  return (
    "HXLT_DASH_" +
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()
  );

}


function initializeDashboardProject() {

  if (
    !dashboardState.project
  ) {

    dashboardState.project = {};

  }


  if (
    !dashboardState.project
      .dashboardId
  ) {

    dashboardState.project
      .dashboardId =
      createDashboardProjectId();

  }


  const now =
    new Date()
      .toISOString();


  if (
    !dashboardState.project
      .createdAt
  ) {

    dashboardState.project
      .createdAt =
      now;

  }


  dashboardState.project
    .updatedAt =
    now;


  dashboardState.project
    .mode =
    dashboardState.project
      .mode ||
    "new";


  dashboardState.project
    .status =
    dashboardState.project
      .status ||
    "draft";


  dashboardState.project
    .projectVersion =
    Number(
      dashboardState.project
        .projectVersion ||
      1
    );


  dashboardState.project
    .publishedVersion =
    Number(
      dashboardState.project
        .publishedVersion ||
      0
    );


  dashboardState.project
    .draftVersion =
    Number(
      dashboardState.project
        .draftVersion ||
      0
    );

}

// ============================================================
// RESET DASHBOARD TO NEW PROJECT
// ============================================================

function resetDashboardToNewProject() {

  const now =
    new Date()
      .toISOString();


  // ==========================================================
  // PROJECT MODEL
  // ==========================================================

  dashboardState.project = {

    dashboardId:
      createDashboardProjectId(),

    projectVersion: 1,

    mode: "new",

    status: "draft",

    isDirty: false,

    createdAt: now,

    updatedAt: now,

    lastSavedAt: "",

    publishedAt: "",

    publishedVersion: 0,

    draftVersion: 0

  };


  // ==========================================================
  // DATA & SETUP
  // ==========================================================

  dashboardState.activeSection =
    "dataSetupSection";

  dashboardState.dataRange =
    "";

  dashboardState.rowCount =
    null;

  dashboardState.columnCount =
    null;

  dashboardState.headerDetected =
    false;

  dashboardState.dataTypeDetected =
    false;

  dashboardState.dashboardTitle =
    "Sales Performance Dashboard";

  dashboardState.theme =
    "ocean";

  dashboardState.currency =
    "INR";

  dashboardState.gridlines =
    "hide";

  dashboardState.layout =
    "executive";


  // ==========================================================
  // CANVAS
  // ==========================================================

  dashboardState.canvasMode =
    "auto";

  dashboardState.canvasPreset =
    "window";

  dashboardState.canvasStartCell =
    "B2";

  dashboardState.canvasEndCell =
    "Y55";

  dashboardState.lockCanvas =
    true;


  // ==========================================================
  // APPEARANCE
  // ==========================================================

  dashboardState.kpiStyle =
    "Modern Cards";

  dashboardState.chartStyle =
    "Clean";

  dashboardState.background =
    "Light";


  // ==========================================================
  // SECURITY
  // ==========================================================

  dashboardState.protectDashboard =
    true;

  dashboardState.hideBackend =
    true;

  dashboardState.lockSettings =
    false;


  // ==========================================================
  // DATA ENGINE
  // ==========================================================

  dashboardState.dataEngine =
    "classic";


  // ==========================================================
  // BUILDER ITEMS
  // ==========================================================

  dashboardState.kpis =
    [];

  dashboardState.charts =
    [];

  dashboardState.slicers =
    [];

  dashboardState.tables =
  [];

dashboardState.columnDefinitions =
  [];

dashboardState.profilerResult =
  null;

dashboardState.advisorResult =
  null;

dashboardState.advisorActionState =
  {};

dashboardState.sourceValues =
  [];


// ==========================================================
// EDIT MODE
// ==========================================================

  dashboardState.editingKpiId =
    null;

  dashboardState.editingChartId =
    null;

  dashboardState.editingSlicerId =
    null;

  dashboardState.editingTableId =
    null;


  // ==========================================================
  // COUNTS
  // ==========================================================

  dashboardState.counts = {

    kpis: 0,

    charts: 0,

    slicers: 0,

    tables: 0

  };


  // ==========================================================
  // REFRESH STUDIO
  // ==========================================================

  updateAllUI();


  setStatus(
    "Ready"
  );

}


function markDashboardProjectDirty() {

  initializeDashboardProject();


  dashboardState.project
    .isDirty =
    true;


  dashboardState.project
    .updatedAt =
    new Date()
      .toISOString();

}


function markDashboardProjectClean() {

  initializeDashboardProject();


  dashboardState.project
    .isDirty =
    false;


  dashboardState.project
    .lastSavedAt =
    new Date()
      .toISOString();

}


function getDashboardProjectSnapshot() {

  initializeDashboardProject();


  return {

    project: {
      ...dashboardState.project
    },

    dataRange:
      dashboardState.dataRange,

    rowCount:
      dashboardState.rowCount,

    columnCount:
      dashboardState.columnCount,

    headerDetected:
      dashboardState.headerDetected,

    dataTypeDetected:
      dashboardState.dataTypeDetected,

    dashboardTitle:
      dashboardState.dashboardTitle,

    theme:
      dashboardState.theme,

    currency:
      dashboardState.currency,

    gridlines:
      dashboardState.gridlines,

    layout:
      dashboardState.layout,

    canvasMode:
      dashboardState.canvasMode,

    canvasPreset:
      dashboardState.canvasPreset,

    canvasStartCell:
      dashboardState.canvasStartCell,

    canvasEndCell:
      dashboardState.canvasEndCell,

    lockCanvas:
      dashboardState.lockCanvas,

    kpiStyle:
      dashboardState.kpiStyle,

    chartStyle:
      dashboardState.chartStyle,

    background:
      dashboardState.background,

    protectDashboard:
      dashboardState.protectDashboard,

    hideBackend:
      dashboardState.hideBackend,

    lockSettings:
      dashboardState.lockSettings,

    dataEngine:
      dashboardState.dataEngine,

    kpis:
      Array.isArray(
        dashboardState.kpis
      )
        ? dashboardState.kpis
            .map(
              function (item) {
                return {
                  ...item
                };
              }
            )
        : [],

    charts:
      Array.isArray(
        dashboardState.charts
      )
        ? dashboardState.charts
            .map(
              function (item) {
                return {
                  ...item
                };
              }
            )
        : [],

    slicers:
      Array.isArray(
        dashboardState.slicers
      )
        ? dashboardState.slicers
            .map(
              function (item) {
                return {
                  ...item
                };
              }
            )
        : [],

    tables:
      Array.isArray(
        dashboardState.tables
      )
        ? dashboardState.tables
            .map(
              function (item) {
                return {
                  ...item
                };
              }
            )
        : [],

                columnDefinitions:
      Array.isArray(
        dashboardState
          .columnDefinitions
      )
        ? dashboardState
            .columnDefinitions
            .map(
              function (item) {
                return {
                  ...item
                };
              }
            )
        : [],

            profilerResult:
  dashboardState.profilerResult
    ? JSON.parse(
        JSON.stringify(
          dashboardState.profilerResult
        )
      )
    : null,

advisorResult:
  dashboardState.advisorResult
    ? JSON.parse(
        JSON.stringify(
          dashboardState.advisorResult
        )
      )
    : null,

advisorActionState:
  dashboardState.advisorActionState &&
  typeof dashboardState.advisorActionState ===
    "object"
    ? JSON.parse(
        JSON.stringify(
          dashboardState.advisorActionState
        )
      )
    : {},

sourceValues:
      Array.isArray(
        dashboardState
          .sourceValues
      )
        ? dashboardState
            .sourceValues
            .map(
              function (row) {

                return Array.isArray(
                  row
                )
                  ? row.slice()
                  : [];

              }
            )
        : [],

    lastRefreshedAt:
      dashboardState.lastRefreshedAt ||
      "",

    counts: {
      ...dashboardState.counts
    }

  };

}



// ============================================================
// DASHBOARD DRAFT STORAGE
// ============================================================

const DASHBOARD_LAST_DRAFT_KEY =
  "HXLT_POWER_DASHBOARD_LAST_DRAFT";


function getDashboardDraftStorageKey(
  dashboardId
) {

  return (
    "HXLT_POWER_DASHBOARD_DRAFT_" +
    String(
      dashboardId || ""
    )
  );

}


function saveDashboardDraft(
  reason
) {

  try {

    initializeDashboardProject();


    const now =
      new Date()
        .toISOString();


    dashboardState.project
      .draftVersion =
      Number(
        dashboardState.project
          .draftVersion ||
        0
      ) +
      1;


    dashboardState.project
      .updatedAt =
      now;


    dashboardState.project
      .lastSavedAt =
      now;


    dashboardState.project
      .status =
      "draft";


    const snapshot =
      getDashboardProjectSnapshot();


    snapshot.draftMeta = {

      savedAt:
        now,

      reason:
        reason ||
        "manual",

      schemaVersion:
        1

    };


    const dashboardId =
      snapshot.project
        .dashboardId;


    const storageKey =
      getDashboardDraftStorageKey(
        dashboardId
      );


    setStatus(
      "Saving..."
    );


    localStorage.setItem(
      storageKey,
      JSON.stringify(
        snapshot
      )
    );


    localStorage.setItem(
      DASHBOARD_LAST_DRAFT_KEY,
      dashboardId
    );


    dashboardState.project
      .isDirty =
      false;


    setStatus(
      "Saved ✓"
      
    );


    console.log(
      "Power Dashboard draft saved:",
      {
        dashboardId:
          dashboardId,

        draftVersion:
          dashboardState.project
            .draftVersion,

        reason:
          reason ||
          "manual"
      }
    );


    return true;

  }
  catch (error) {

    console.error(
      "Dashboard draft save failed:",
      error
    );


    setStatus(
      "Draft save failed"
    );


    return false;

  }

}


// ============================================================
// DASHBOARD AUTO SAVE
// ============================================================

const DASHBOARD_AUTO_SAVE_DELAY =
  3000;


let dashboardAutoSaveTimer =
  null;


function scheduleDashboardAutoSave() {

  if (
    dashboardAutoSaveTimer
  ) {

    clearTimeout(
      dashboardAutoSaveTimer
    );

  }


  dashboardAutoSaveTimer =
    setTimeout(
      function () {

        dashboardAutoSaveTimer =
          null;


        if (
          dashboardState.project &&
          dashboardState.project
            .isDirty === true
        ) {

          saveDashboardDraft(
            "auto"
          );

        }

      },
      DASHBOARD_AUTO_SAVE_DELAY
    );

}


function registerDashboardChange() {

  markDashboardProjectDirty();


  setStatus(
    "Unsaved changes"
  );


  scheduleDashboardAutoSave();

}


function initializeDashboardAutoSave() {

  document.addEventListener(
    "input",
    function (event) {

      const target =
        event.target;


      if (
        !target ||
        !target.matches ||
        !target.matches(
          "input, textarea, select"
        )
      ) {

        return;

      }


      registerDashboardChange();

    }
  );


  document.addEventListener(
    "change",
    function (event) {

      const target =
        event.target;


      if (
        !target ||
        !target.matches ||
        !target.matches(
          "input, textarea, select"
        )
      ) {

        return;

      }


      registerDashboardChange();

    }
  );

}


// ============================================================
// DASHBOARD SAFETY CHECKPOINT
// ============================================================

const DASHBOARD_SAFETY_CHECKPOINT_INTERVAL =
  30000;


let dashboardSafetyCheckpointTimer =
  null;


function initializeDashboardSafetyCheckpoint() {

  if (
    dashboardSafetyCheckpointTimer
  ) {

    clearInterval(
      dashboardSafetyCheckpointTimer
    );

  }


  dashboardSafetyCheckpointTimer =
    setInterval(
      function () {

        if (
          dashboardState.project &&
          dashboardState.project
            .isDirty === true
        ) {

          saveDashboardDraft(
            "checkpoint"
          );

        }

      },
      DASHBOARD_SAFETY_CHECKPOINT_INTERVAL
    );

}


// ============================================================
// OFFICE READY
// ============================================================

Office.onReady(function () {

  console.log(
    "Himanshu XL Tools - Power Dashboard Studio ready"
  );

    initializeDashboardProject();

  // Recovery actions must be wired early.
  initializeDashboardRecoveryActions();
  
  initializeDashboardAutoSave();

  initializeDashboardSafetyCheckpoint();

  initializeDialogMessaging();

  initializeNavigation();

initializeSetupControls();

initializeSmartAdvisorControls();

initializeEngineCards();

initializeBuilderButtons();

  initializeAppearance();

  initializeSecurity();

  initializeFooter();

  initializeCloseButton();

  updateAllUI();

});

// ============================================================
// DIALOG <-> EXCEL PARENT COMMUNICATION
// ============================================================

function initializeDialogMessaging() {

  try {

    Office.context.ui.addHandlerAsync(

      Office.EventType.DialogParentMessageReceived,

      function (args) {

        try {

          const message =
            JSON.parse(
              args.message
            );

            if (
    message.type ===
    "HXL_DASHBOARD_EXPORT_PPT_DATA"
) {

    try {

        const binary =
            atob(
                message.base64
            );


        const bytes =
            new Uint8Array(
                binary.length
            );


        for (
            let index = 0;
            index < binary.length;
            index++
        ) {

            bytes[index] =
                binary.charCodeAt(
                    index
                );

        }


        const blob =
            new Blob(
                [bytes],
                {
                    type:
                        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                }
            );


        const downloadUrl =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            downloadUrl;


        link.download =
            message.fileName ||
            "HimanshuXLTools_Dashboard.pptx";


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        URL.revokeObjectURL(
            downloadUrl
        );


        setStatus(
            "PowerPoint exported successfully"
        );

    }
    catch (pptDownloadError) {

        console.error(
            "PowerPoint download failed:",
            pptDownloadError
        );


        setStatus(
            "PowerPoint export failed."
        );

    }


    return;

}


if (
    message.type ===
    "HXL_DASHBOARD_EXPORT_PPT_ERROR"
) {

    setStatus(
        "PowerPoint export failed: " +
        (
            message.message ||
            "Unknown error"
        )
    );


    return;

}


          // ==================================================
          // 1. EXCEL SELECTION RESULT
          // ==================================================

          if (
            message.type ===
            "POWER_DASHBOARD_SELECTION_RESULT"
          ) {

            if (
  message.success === true &&
  message.data
) {

  const wasRefresh =
    dashboardRefreshInProgress;

  const previousSourceValues =
    wasRefresh
      ? JSON.stringify(
          Array.isArray(
            dashboardState.sourceValues
          )
            ? dashboardState.sourceValues
            : []
        )
      : "";

  applySelectedRange(
    message.data
  );

  const refreshedSourceValues =
    wasRefresh
      ? JSON.stringify(
          Array.isArray(
            dashboardState.sourceValues
          )
            ? dashboardState.sourceValues
            : []
        )
      : "";

  const sourceDataChanged =
    wasRefresh
      ? previousSourceValues !==
        refreshedSourceValues
      : false;

  if (wasRefresh) {

    if (!dashboardState.dataRange) {

  setStatus(
    "No dashboard source range is available"
  );

  return;
}

    dashboardRefreshInProgress =
      false;

        const dashboardRefreshButton =
      document.getElementById(
        "dashboardRefreshBtn"
      );

    const previewRefreshButton =
      document.getElementById(
        "previewRefreshBtn"
      );

    if (dashboardRefreshButton) {
      dashboardRefreshButton.disabled =
        false;
    }

    if (previewRefreshButton) {
      previewRefreshButton.disabled =
        false;
    }
          dashboardState.lastRefreshedAt =
      new Date().toISOString();

    if (sourceDataChanged) {

      dashboardState.activeFilters =
        {};

      markDashboardProjectDirty();

      updatePreview();

      saveDashboardDraft(
        "dashboard-refresh"
      );

      setStatus(
        "Dashboard data refreshed successfully"
      );

    }
    else {

      updatePreview();

      setStatus(
        "No changes detected"
      );

    }

  }
else {

setStatus(
  "Excel data selected successfully"
);

}


}
else {

  const errorMessage =
    message.error ||
    "Unable to read Excel selection";

  dashboardRefreshInProgress =
    false;

    const dashboardRefreshButton =
    document.getElementById(
      "dashboardRefreshBtn"
    );

  const previewRefreshButton =
    document.getElementById(
      "previewRefreshBtn"
    );

  if (dashboardRefreshButton) {
    dashboardRefreshButton.disabled =
      false;
  }

  if (previewRefreshButton) {
    previewRefreshButton.disabled =
      false;
  }

  console.error(
    "Power Dashboard selection failed:",
    errorMessage
  );

  setStatus(
    errorMessage
  );

}

            return;
          }


          // ==================================================
          // 2. EXISTING DASHBOARD CONFIG RESULT
          // ==================================================

          if (
            message.type ===
            "POWER_DASHBOARD_EXISTING_CONFIG_RESULT"
          ) {

            if (
  message.success === true &&
  message.data &&
  message.data.exists === true
) {

  const publishedConfig =
    message.data;

  const recoveryDraft =
    getLastDashboardDraft();


  if (
    recoveryDraft &&
    hasNewerRecoveryDraft(
      publishedConfig
    )
  ) {

    dashboardRecoveryContext
      .draft =
      recoveryDraft;

    dashboardRecoveryContext
      .publishedConfig =
      publishedConfig;


    const recoveryShown =
      showDashboardRecoveryModal(
        recoveryDraft
      );


    if (recoveryShown) {

      setStatus(
        "Unsaved dashboard changes found"
      );

    }
    else {

      dashboardRecoveryContext
        .draft =
        null;

      dashboardRecoveryContext
        .publishedConfig =
        null;


      applyExistingDashboardConfig(
        publishedConfig
      );

      setStatus(
        "Existing dashboard settings loaded"
      );

    }

  }
  else {

    dashboardRecoveryContext
      .draft =
      null;

    dashboardRecoveryContext
      .publishedConfig =
      null;


    applyExistingDashboardConfig(
      publishedConfig
    );

    setStatus(
      "Existing dashboard settings loaded"
    );

  }

}
else if (
  message.success === true &&
  message.data &&
  message.data.exists === false
) {

  console.log(
    "No existing Power Dashboard configuration found."
  );


  // ==========================================================
  // RECOVER UNSAVED NEW DASHBOARD
  // ==========================================================

  const recoveryDraft =
    getLastDashboardDraft();


  if (recoveryDraft) {

    dashboardRecoveryContext
      .draft =
      recoveryDraft;

    dashboardRecoveryContext
      .publishedConfig =
      null;


    const recoveryShown =
      showDashboardRecoveryModal(
        recoveryDraft
      );


    if (recoveryShown) {

      setStatus(
        "Unsaved dashboard draft found"
      );

    }
    else {

      dashboardRecoveryContext
        .draft =
        null;

      dashboardRecoveryContext
        .publishedConfig =
        null;


      setStatus(
        "Ready"
      );

    }

  }
  else {

    dashboardRecoveryContext
      .draft =
      null;

    dashboardRecoveryContext
      .publishedConfig =
      null;


    setStatus(
      "Ready"
    );

  }

}
            else {

              console.error(
                "Existing config load failed:",
                message.error
              );

              setStatus(
                "Unable to load old dashboard settings"
              );

            }

            return;
          }

                      // ==================================================
          // 3. DASHBOARD BUILD PROGRESS
          // ==================================================

          if (
            message.type ===
            "POWER_DASHBOARD_BUILD_PROGRESS"
          ) {

            updateDashboardBuildProgress(
              message
            );

            return;
          }

          // ==================================================
          // 3. DASHBOARD BUILD RESULT
          // ==================================================

          if (
            message.type ===
            "POWER_DASHBOARD_BUILD_RESULT"
          ) {

              const buildDashboardBtn =
              document.getElementById(
                "buildDashboardBtn"
              );

            if (buildDashboardBtn) {

              buildDashboardBtn.disabled =
                false;

              buildDashboardBtn.textContent =
                "Build Dashboard";

            }

if (
  message.success === true
) {

  // ==========================================================
  // COMMIT SUCCESSFUL BUILD AS PUBLISHED PROJECT
  // ==========================================================

  initializeDashboardProject();


if (
  message.data &&
  message.data.project &&
  typeof message.data.project ===
    "object"
) {

  dashboardState.project = {

    ...dashboardState.project,

    ...message.data.project,

    mode:
      "edit",

    status:
      "published",

    isDirty:
      false

  };

}
else {

  console.warn(
    "Published project metadata was not returned by Excel."
  );


  dashboardState.project.mode =
    "edit";

  dashboardState.project.status =
    "published";

  dashboardState.project.isDirty =
    false;

}


  // ==========================================================
  // REMOVE RECOVERY DRAFT AFTER SUCCESSFUL PUBLISH
  // ==========================================================

  try {

    const dashboardId =
      dashboardState.project
        .dashboardId;


    if (dashboardId) {

      const storageKey =
        getDashboardDraftStorageKey(
          dashboardId
        );


      localStorage.removeItem(
        storageKey
      );


      const lastDraftDashboardId =
        localStorage.getItem(
          DASHBOARD_LAST_DRAFT_KEY
        );


      if (
        lastDraftDashboardId &&
        String(
          lastDraftDashboardId
        ) ===
        String(
          dashboardId
        )
      ) {

        localStorage.removeItem(
          DASHBOARD_LAST_DRAFT_KEY
        );

      }

    }

  }
  catch (error) {

    console.warn(
      "Unable to clear published dashboard recovery draft:",
      error
    );

  }


  dashboardRecoveryContext.draft =
    null;

  dashboardRecoveryContext
    .publishedConfig =
    null;


  hideDashboardRecoveryModal();


  // ==========================================================
  // SUCCESS UI
  // ==========================================================

  setDashboardBuildView(
    "success"
  );


  setStatus(
    "Dashboard created successfully"
  );


  const steps =
    document.querySelectorAll(
      ".pd-step"
    );


  steps.forEach(
    function (step) {

      step.classList.remove(
        "active"
      );

    }
  );


  if (steps[3]) {

    steps[3].classList.add(
      "active"
    );

  }


  console.log(
    "Power Dashboard published successfully:",
    {
      dashboardId:
        dashboardState.project
          .dashboardId,

      publishedVersion:
        dashboardState.project
          .publishedVersion,

      publishedAt:
        dashboardState.project
          .publishedAt
    }
  );

}
else {

  // ==========================================================
  // PRESERVE PROJECT AFTER BUILD FAILURE
  // ==========================================================

  markDashboardProjectDirty();


  saveDashboardDraft(
    "build-failed"
  );


  setDashboardBuildView(
    "error",
    message.error ||
    "Dashboard build failed"
  );


  console.error(
    "Dashboard build failed:",
    message.error
  );


  setStatus(
    message.error ||
    "Dashboard build failed - draft saved"
  );

}

            return;
          }

        }
        catch (error) {

  markDashboardProjectDirty();


  saveDashboardDraft(
    "build-response-error"
  );


  setDashboardBuildView(
    "error",
    error.message ||
    String(error)
  );


  console.error(
    "Power Dashboard parent message error:",
    error
  );


  setStatus(
    "Unable to process Excel response - draft saved"
  );

        }

      },

      // ======================================================
      // MESSAGE LISTENER REGISTERED
      // ======================================================

      function (asyncResult) {

        if (
          asyncResult.status ===
          Office.AsyncResultStatus.Succeeded
        ) {

          console.log(
            "Power Dashboard parent messaging ready"
          );

          // ================================================
          // AUTO-LOAD EXISTING DASHBOARD SETTINGS
          // ================================================

          requestExistingDashboardConfig();

        }
        else {

          console.error(
            "Unable to initialize parent messaging:",
            asyncResult.error
          );

        }

      }

    );

  }
  catch (error) {

    console.error(
      "initializeDialogMessaging failed:",
      error
    );

  }

}


// ============================================================
// REQUEST EXISTING DASHBOARD CONFIG
// ============================================================

function requestExistingDashboardConfig() {

  try {

    const projectSnapshot =
  getDashboardProjectSnapshot();

    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "POWER_DASHBOARD_GET_EXISTING_CONFIG"
      })
    );

  }
  catch (error) {

    console.error(
      "Existing dashboard config request failed:",
      error
    );

  }

}

// ============================================================
// DASHBOARD RECOVERY DRAFT HELPERS
// ============================================================

function getLastDashboardDraft() {

  try {

    const dashboardId =
      localStorage.getItem(
        DASHBOARD_LAST_DRAFT_KEY
      );


    if (!dashboardId) {

      return null;

    }


    const storageKey =
      getDashboardDraftStorageKey(
        dashboardId
      );


    const draftText =
      localStorage.getItem(
        storageKey
      );


    if (!draftText) {

      return null;

    }


    const draft =
      JSON.parse(
        draftText
      );


    if (
      !draft ||
      typeof draft !==
        "object"
    ) {

      return null;

    }


    return draft;

  }
  catch (error) {

    console.warn(
      "Unable to read dashboard recovery draft:",
      error
    );


    return null;

  }

}


function getRecoveryDraftComparison(
  draft,
  publishedConfig
) {

  if (
    !draft ||
    typeof draft !== "object"
  ) {

    return {
      isNewer: false,
      reason: "missing-draft"
    };

  }


  const draftDashboardId =
    draft.project &&
    draft.project.dashboardId
      ? String(
          draft.project.dashboardId
        )
      : "";


  const publishedDashboardId =
    publishedConfig &&
    publishedConfig.project &&
    publishedConfig.project.dashboardId
      ? String(
          publishedConfig.project.dashboardId
        )
      : "";


  // Recovery draft दुसऱ्या dashboard चा असेल
  // तर तो resume करू नये.
  if (
    draftDashboardId &&
    publishedDashboardId &&
    draftDashboardId !==
      publishedDashboardId
  ) {

    return {
      isNewer: false,
      reason:
        "dashboard-id-mismatch"
    };

  }


  const draftSavedAt =
    Date.parse(
      (
        draft.draftMeta &&
        draft.draftMeta.savedAt
      ) ||
      (
        draft.project &&
        draft.project.lastSavedAt
      ) ||
      (
        draft.project &&
        draft.project.updatedAt
      ) ||
      ""
    );


  const publishedSavedAt =
    Date.parse(
      (
        publishedConfig &&
        publishedConfig.project &&
        publishedConfig.project.publishedAt
      ) ||
      (
        publishedConfig &&
        publishedConfig.project &&
        publishedConfig.project.lastSavedAt
      ) ||
      (
        publishedConfig &&
        publishedConfig.project &&
        publishedConfig.project.updatedAt
      ) ||
      ""
    );


  if (
    !Number.isNaN(draftSavedAt) &&
    !Number.isNaN(publishedSavedAt)
  ) {

    if (
      draftSavedAt >
      publishedSavedAt
    ) {

      return {
        isNewer: true,
        reason:
          "newer-timestamp"
      };

    }


    if (
      draftSavedAt <
      publishedSavedAt
    ) {

      return {
        isNewer: false,
        reason:
          "published-is-newer"
      };

    }

  }


  const draftVersion =
    Number(
      (
        draft.project &&
        draft.project.draftVersion
      ) ||
      0
    );


  const publishedDraftVersion =
    Number(
      (
        publishedConfig &&
        publishedConfig.project &&
        publishedConfig.project.draftVersion
      ) ||
      0
    );


  if (
    Number.isFinite(
      draftVersion
    ) &&
    Number.isFinite(
      publishedDraftVersion
    ) &&
    draftVersion >
      publishedDraftVersion
  ) {

    return {
      isNewer: true,
      reason:
        "newer-draft-version"
    };

  }


  // Published timestamp उपलब्ध नसेल,
  // पण recovery draft timestamp valid असेल.
  if (
    !Number.isNaN(
      draftSavedAt
    ) &&
    Number.isNaN(
      publishedSavedAt
    )
  ) {

    return {
      isNewer: true,
      reason:
        "published-timestamp-missing"
    };

  }


  return {
    isNewer: false,
    reason:
      "not-newer"
  };

}


function hasNewerRecoveryDraft(
  publishedConfig
) {

  const draft =
    getLastDashboardDraft();


  const comparison =
    getRecoveryDraftComparison(
      draft,
      publishedConfig
    );


  if (
    comparison.reason ===
      "dashboard-id-mismatch"
  ) {

    console.log(
      "Recovery draft ignored because dashboard IDs do not match."
    );

  }


  return comparison.isNewer;

}

// ============================================================
// DASHBOARD RECOVERY MODAL
// ============================================================

let dashboardRecoveryContext = {

  draft: null,

  publishedConfig: null

};

function showDashboardRecoveryModal(
  draft
) {

  if (!draft) {

    return false;

  }


  const modal =
    document.getElementById(
      "dashboardRecoveryModal"
    );

  const titleElement =
    document.getElementById(
      "recoveryDashboardTitle"
    );

  const savedAtElement =
    document.getElementById(
      "recoverySavedAt"
    );


  if (!modal) {

    console.warn(
      "Dashboard recovery modal was not found."
    );

    return false;

  }


  // ==========================================================
  // DASHBOARD TITLE
  // ==========================================================

  const dashboardTitle =
    draft.dashboardTitle ||
    (
      draft.project &&
      draft.project.dashboardTitle
    ) ||
    "Power Dashboard";


  if (titleElement) {

    titleElement.textContent =
      dashboardTitle;

  }


  // ==========================================================
  // DRAFT SAVED TIME
  // ==========================================================

  const savedAt =
    (
      draft.draftMeta &&
      draft.draftMeta.savedAt
    ) ||
    (
      draft.project &&
      draft.project.lastSavedAt
    ) ||
    "";


  if (savedAtElement) {

    if (savedAt) {

      const parsedDate =
        new Date(
          savedAt
        );


      if (
        !Number.isNaN(
          parsedDate.getTime()
        )
      ) {

        savedAtElement.textContent =
          parsedDate.toLocaleString();

      }
      else {

        savedAtElement.textContent =
          savedAt;

      }

    }
    else {

      savedAtElement.textContent =
        "Unknown";

    }

  }


  // ==========================================================
  // SHOW MODAL
  // ==========================================================

  modal.hidden =
    false;


  document.body.classList.add(
    "pd-recovery-open"
  );

  const openPublishedButton =
  document.getElementById(
    "openPublishedDashboardBtn"
  );


if (openPublishedButton) {

  openPublishedButton.hidden =
    !dashboardRecoveryContext
      .publishedConfig;

}

  const resumeButton =
    document.getElementById(
      "resumeRecoveryDraftBtn"
    );


  if (resumeButton) {

    resumeButton.focus();

  }


  return true;

}


function hideDashboardRecoveryModal() {

  const modal =
    document.getElementById(
      "dashboardRecoveryModal"
    );


  if (!modal) {

    return;

  }


  modal.hidden =
    true;


  document.body.classList.remove(
    "pd-recovery-open"
  );

}

// ============================================================
// DASHBOARD RECOVERY ACTIONS
// ============================================================

function initializeDashboardRecoveryActions() {

  const resumeButton =
    document.getElementById(
      "resumeRecoveryDraftBtn"
    );

  const openPublishedButton =
    document.getElementById(
      "openPublishedDashboardBtn"
    );

  const discardButton =
    document.getElementById(
      "discardRecoveryDraftBtn"
    );


  if (resumeButton) {

    resumeButton.addEventListener(
      "click",
      resumeDashboardRecoveryDraft
    );

  }


  if (openPublishedButton) {

    openPublishedButton.addEventListener(
      "click",
      openPublishedDashboard
    );

  }


  if (discardButton) {

    discardButton.addEventListener(
      "click",
      discardDashboardRecoveryDraft
    );

  }

}


// ============================================================
// RESUME RECOVERY DRAFT
// ============================================================

function resumeDashboardRecoveryDraft() {

  const draft =
    dashboardRecoveryContext
      .draft;


  if (!draft) {

    setStatus(
      "Recovery draft is no longer available"
    );

    hideDashboardRecoveryModal();

    return;

  }


  applyExistingDashboardConfig(
    draft
  );


  dashboardState.project.mode =
    "edit";

  dashboardState.project.status =
    "draft";

  dashboardState.project.isDirty =
    false;


  dashboardRecoveryContext.draft =
    null;

  dashboardRecoveryContext
    .publishedConfig =
    null;


  hideDashboardRecoveryModal();


  setStatus(
    "Recovery draft restored"
  );

}

console.log(
  "Opening published dashboard:",
  {
    topLevel: {
      kpis:
        Array.isArray(
          publishedConfig.kpis
        )
          ? publishedConfig.kpis.length
          : "missing",

      charts:
        Array.isArray(
          publishedConfig.charts
        )
          ? publishedConfig.charts.length
          : "missing",

      slicers:
        Array.isArray(
          publishedConfig.slicers
        )
          ? publishedConfig.slicers.length
          : "missing",

      tables:
        Array.isArray(
          publishedConfig.tables
        )
          ? publishedConfig.tables.length
          : "missing"
    },

    snapshot: {
      kpis:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .kpis
        )
          ? publishedConfig
              .projectSnapshot
              .kpis.length
          : "missing",

      charts:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .charts
        )
          ? publishedConfig
              .projectSnapshot
              .charts.length
          : "missing",

      slicers:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .slicers
        )
          ? publishedConfig
              .projectSnapshot
              .slicers.length
          : "missing",

      tables:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .tables
        )
          ? publishedConfig
              .projectSnapshot
              .tables.length
          : "missing"
    }
  }
);

// ============================================================
// OPEN PUBLISHED DASHBOARD
// ============================================================

function openPublishedDashboard() {

  const publishedConfig =
    dashboardRecoveryContext
      .publishedConfig;

      console.log(
  "Opening published dashboard:",
  {
    topLevel: {
      kpis:
        Array.isArray(
          publishedConfig.kpis
        )
          ? publishedConfig.kpis.length
          : "missing",

      charts:
        Array.isArray(
          publishedConfig.charts
        )
          ? publishedConfig.charts.length
          : "missing",

      slicers:
        Array.isArray(
          publishedConfig.slicers
        )
          ? publishedConfig.slicers.length
          : "missing",

      tables:
        Array.isArray(
          publishedConfig.tables
        )
          ? publishedConfig.tables.length
          : "missing"
    },

    snapshot: {
      kpis:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .kpis
        )
          ? publishedConfig
              .projectSnapshot
              .kpis.length
          : "missing",

      charts:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .charts
        )
          ? publishedConfig
              .projectSnapshot
              .charts.length
          : "missing",

      slicers:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .slicers
        )
          ? publishedConfig
              .projectSnapshot
              .slicers.length
          : "missing",

      tables:
        publishedConfig.projectSnapshot &&
        Array.isArray(
          publishedConfig
            .projectSnapshot
            .tables
        )
          ? publishedConfig
              .projectSnapshot
              .tables.length
          : "missing"
    }
  }
);


  if (!publishedConfig) {

    setStatus(
      "Published dashboard is not available"
    );

    hideDashboardRecoveryModal();

    return;

  }


  applyExistingDashboardConfig(
    publishedConfig
  );


  dashboardRecoveryContext.draft =
    null;

  dashboardRecoveryContext
    .publishedConfig =
    null;


  hideDashboardRecoveryModal();


  setStatus(
    "Published dashboard opened"
  );

}


// ============================================================
// DISCARD RECOVERY DRAFT
// ============================================================

function discardDashboardRecoveryDraft() {

  const draft =
    dashboardRecoveryContext
      .draft;

  const publishedConfig =
    dashboardRecoveryContext
      .publishedConfig;


  if (!draft) {

    setStatus(
      "Recovery draft is no longer available"
    );

    hideDashboardRecoveryModal();

    return;

  }


  try {

    const draftDashboardId =
      draft.project &&
      draft.project.dashboardId
        ? String(
            draft.project.dashboardId
          )
        : "";


    if (draftDashboardId) {

      const storageKey =
        getDashboardDraftStorageKey(
          draftDashboardId
        );


      localStorage.removeItem(
        storageKey
      );


      const lastDraftDashboardId =
        localStorage.getItem(
          DASHBOARD_LAST_DRAFT_KEY
        );


      if (
        lastDraftDashboardId &&
        String(
          lastDraftDashboardId
        ) ===
        draftDashboardId
      ) {

        localStorage.removeItem(
          DASHBOARD_LAST_DRAFT_KEY
        );

      }

    }


    // ==========================================================
// AFTER DISCARD:
// - Existing published dashboard असेल तर ते restore करा.
// - Published dashboard नसेल तरच new project सुरू करा.
// ==========================================================

dashboardRecoveryContext.draft =
  null;

dashboardRecoveryContext
  .publishedConfig =
  null;


hideDashboardRecoveryModal();


if (
  publishedConfig &&
  typeof publishedConfig ===
    "object"
) {

  applyExistingDashboardConfig(
    publishedConfig
  );


  showSection(
    "dataSetupSection"
  );


  setStatus(
    "Unsaved changes discarded - published dashboard restored"
  );

}
else {

  resetDashboardToNewProject();


  showSection(
    "dataSetupSection"
  );


  setStatus(
    "Unsaved draft discarded - new dashboard started"
  );

}

  }
  catch (error) {

    console.error(
      "Unable to discard dashboard recovery draft:",
      error
    );


    setStatus(
      "Unable to discard recovery draft"
    );

  }

}

// ============================================================
// APPLY EXISTING DASHBOARD CONFIG
// ============================================================

function applyExistingDashboardConfig(
  config
) {

  if (!config) {
    return;
  }


    const publishedSnapshot =
    config.projectSnapshot &&
    typeof config.projectSnapshot ===
      "object"
      ? config.projectSnapshot
      : {};


  function getPublishedConfigValue(
    key,
    fallbackValue
  ) {

    const directValue =
      config[key];


    if (
      directValue !== undefined &&
      directValue !== null &&
      directValue !== ""
    ) {

      return directValue;

    }


    const snapshotValue =
      publishedSnapshot[key];


    if (
      snapshotValue !== undefined &&
      snapshotValue !== null &&
      snapshotValue !== ""
    ) {

      return snapshotValue;

    }


    return fallbackValue;

  }
  
  

  // ==========================================================
  // RESTORE STATE
  // ==========================================================

  


function getPublishedConfigValue(
  key,
  fallbackValue
) {

  const directValue =
    config[key];


  if (
    directValue !== undefined &&
    directValue !== null &&
    directValue !== ""
  ) {

    return directValue;

  }


  const snapshotValue =
    publishedSnapshot[key];


  if (
    snapshotValue !== undefined &&
    snapshotValue !== null &&
    snapshotValue !== ""
  ) {

    return snapshotValue;

  }


  return fallbackValue;

}

  dashboardState.dashboardTitle =
  getPublishedConfigValue(
    "dashboardTitle",
    "Sales Performance Dashboard"
  );


dashboardState.theme =
  getPublishedConfigValue(
    "theme",
    "ocean"
  );


dashboardState.currency =
  getPublishedConfigValue(
    "currency",
    "INR"
  );


dashboardState.gridlines =
  getPublishedConfigValue(
    "gridlines",
    "hide"
  );


dashboardState.layout =
  getPublishedConfigValue(
    "layout",
    "executive"
  );


dashboardState.kpiStyle =
  getPublishedConfigValue(
    "kpiStyle",
    "Modern Cards"
  );


dashboardState.chartStyle =
  getPublishedConfigValue(
    "chartStyle",
    "Clean"
  );


dashboardState.background =
  getPublishedConfigValue(
    "background",
    "Light"
  );


  dashboardState.protectDashboard =
    config.protectDashboard !== false;


  dashboardState.hideBackend =
    config.hideBackend !== false;


  dashboardState.lockSettings =
    config.lockSettings === true;


  dashboardState.dataEngine =
  getPublishedConfigValue(
    "dataEngine",
    "classic"
  );


dashboardState.dataRange =
  getPublishedConfigValue(
    "dataRange",
    ""
  );


  dashboardState.rowCount =
  config.rowCount !== null &&
  config.rowCount !== undefined
    ? config.rowCount
    : (
        publishedSnapshot.rowCount !== null &&
        publishedSnapshot.rowCount !== undefined
      )
        ? publishedSnapshot.rowCount
        : null;


dashboardState.columnCount =
  config.columnCount !== null &&
  config.columnCount !== undefined
    ? config.columnCount
    : (
        publishedSnapshot.columnCount !== null &&
        publishedSnapshot.columnCount !== undefined
      )
        ? publishedSnapshot.columnCount
        : null;


dashboardState.headerDetected =
  config.headerDetected !== undefined
    ? Boolean(
        config.headerDetected
      )
    : Boolean(
        publishedSnapshot.headerDetected
      );


dashboardState.dataTypeDetected =
  config.dataTypeDetected !== undefined
    ? Boolean(
        config.dataTypeDetected
      )
    : Boolean(
        publishedSnapshot.dataTypeDetected
      );


    dashboardState.columnDefinitions =
  Array.isArray(
    config.columnDefinitions
  ) &&
  config.columnDefinitions.length > 0
    ? config.columnDefinitions.map(
        function (item) {
          return {
            ...item
          };
        }
      )
    : Array.isArray(
        publishedSnapshot.columnDefinitions
      )
      ? publishedSnapshot.columnDefinitions.map(
          function (item) {
            return {
              ...item
            };
          }
        )
      : [];

      dashboardState.profilerResult =
    config.profilerResult &&
    typeof config.profilerResult ===
      "object"
      ? config.profilerResult
      : (
          config.projectSnapshot &&
          config.projectSnapshot.profilerResult &&
          typeof config.projectSnapshot.profilerResult ===
            "object"
        )
          ? config.projectSnapshot.profilerResult
          : null;

    dashboardState.advisorResult =
  config.advisorResult &&
  typeof config.advisorResult ===
    "object"
    ? JSON.parse(
        JSON.stringify(
          config.advisorResult
        )
      )
    : (
        config.projectSnapshot &&
        config.projectSnapshot.advisorResult &&
        typeof config.projectSnapshot.advisorResult ===
          "object"
      )
        ? JSON.parse(
            JSON.stringify(
              config.projectSnapshot.advisorResult
            )
          )
        : null;

    dashboardState.advisorActionState =
  config.advisorActionState &&
  typeof config.advisorActionState ===
    "object"
    ? JSON.parse(
        JSON.stringify(
          config.advisorActionState
        )
      )
    : (
        config.projectSnapshot &&
        config.projectSnapshot.advisorActionState &&
        typeof config.projectSnapshot.advisorActionState ===
          "object"
      )
        ? JSON.parse(
            JSON.stringify(
              config.projectSnapshot.advisorActionState
            )
          )
        : {};


dashboardState.lastRefreshedAt =
  String(
    config.lastRefreshedAt ||
    (
      config.projectSnapshot &&
      config.projectSnapshot.lastRefreshedAt
    ) ||
    ""
  );


    dashboardState.sourceValues =
  Array.isArray(
    config.sourceValues
  )
    ? config.sourceValues
    : (
        config.projectSnapshot &&
        Array.isArray(
          config.projectSnapshot.sourceValues
        )
      )
        ? config.projectSnapshot.sourceValues
        : [];


// ==========================================================
// RESTORE DASHBOARD PROJECT
// ==========================================================

  if (
    config.project &&
    typeof config.project ===
      "object"
  ) {

    dashboardState.project = {
      ...dashboardState.project,
      ...config.project,
      mode: "edit",
      status:
        config.project.status ||
        "published",
      isDirty: false
    };

  }
  else {

    initializeDashboardProject();

    dashboardState.project.mode =
      "edit";

    dashboardState.project.status =
      "published";

    dashboardState.project.isDirty =
      false;

  }



            // ==========================================================
          // RESTORE KPI / CHART / SLICER / TABLE CONFIGURATION
          // Robust fallback:
          // 1. Prefer populated top-level config arrays.
          // 2. If top-level array is empty/missing, restore from
          //    projectSnapshot.
          // ==========================================================


const restoredProjectSnapshot =
  config.projectSnapshot &&
  typeof config.projectSnapshot === "object"
    ? config.projectSnapshot
    : null;


function getRestoredDashboardArray(
  topLevelValue,
  snapshotKey
) {

  // Prefer top-level data only when it actually contains items.
  if (
    Array.isArray(topLevelValue) &&
    topLevelValue.length > 0
  ) {

    return topLevelValue.map(
      function (item) {

        return item &&
          typeof item === "object"
            ? {
                ...item
              }
            : item;

      }
    );

  }


  // Fallback to the full published project snapshot.
  if (
    restoredProjectSnapshot &&
    Array.isArray(
      restoredProjectSnapshot[
        snapshotKey
      ]
    )
  ) {

    return restoredProjectSnapshot[
      snapshotKey
    ].map(
      function (item) {

        return item &&
          typeof item === "object"
            ? {
                ...item
              }
            : item;

      }
    );

  }


  // If the top-level array exists and is intentionally empty,
  // keep it empty only when the snapshot also has no usable data.
  if (
    Array.isArray(
      topLevelValue
    )
  ) {

    return [];

  }


  return [];

}


dashboardState.kpis =
  getRestoredDashboardArray(
    config.kpis,
    "kpis"
  );


dashboardState.charts =
  getRestoredDashboardArray(
    config.charts,
    "charts"
  );


dashboardState.slicers =
  getRestoredDashboardArray(
    config.slicers,
    "slicers"
  );


dashboardState.tables =
  getRestoredDashboardArray(
    config.tables,
    "tables"
  );


dashboardState.counts = {

  kpis:
    dashboardState.kpis.length,

  charts:
    dashboardState.charts.length,

  slicers:
    dashboardState.slicers.length,

  tables:
    dashboardState.tables.length

};


console.log(
  "Dashboard builder objects restored:",
  {
    kpis:
      dashboardState.kpis.length,

    charts:
      dashboardState.charts.length,

    slicers:
      dashboardState.slicers.length,

    tables:
      dashboardState.tables.length,

    usedProjectSnapshotFallback:
      Boolean(
        restoredProjectSnapshot
      )
  }
);

  dashboardState.counts = {

    kpis:
      dashboardState.kpis.length,

    charts:
      dashboardState.charts.length,

    slicers:
      dashboardState.slicers.length,

    tables:
      dashboardState.tables.length

  };


  if (
    config.canvasMode
  ) {

    dashboardState.canvasMode =
      config.canvasMode;

  }


  if (
    config.canvasPreset
  ) {

    dashboardState.canvasPreset =
      config.canvasPreset;

  }


  if (
    config.canvasStartCell
  ) {

    dashboardState.canvasStartCell =
      config.canvasStartCell;

  }


  if (
    config.canvasEndCell
  ) {

    dashboardState.canvasEndCell =
      config.canvasEndCell;

  }


  if (
    config.lockCanvas !==
      undefined
  ) {

    dashboardState.lockCanvas =
      Boolean(
        config.lockCanvas
      );

  }


  // ==========================================================
  // RESTORE DATA & SETUP CONTROLS
  // ==========================================================

  const dashboardTitle =
    document.getElementById(
      "dashboardTitle"
    );

    const appearanceCanvasMode =
  document.getElementById(
    "appearanceCanvasMode"
  );

const appearanceCanvasPreset =
  document.getElementById(
    "appearanceCanvasPreset"
  );

const manualCanvasFields =
  document.getElementById(
    "manualCanvasFields"
  );

const appearanceCanvasStart =
  document.getElementById(
    "appearanceCanvasStart"
  );

const appearanceCanvasEnd =
  document.getElementById(
    "appearanceCanvasEnd"
  );

const appearanceLockCanvas =
  document.getElementById(
    "appearanceLockCanvas"
  );


  const themeSelect =
    document.getElementById(
      "themeSelect"
    );


  const currencySelect =
    document.getElementById(
      "currencySelect"
    );


  const gridlinesSelect =
    document.getElementById(
      "gridlinesSelect"
    );


  const layoutSelect =
    document.getElementById(
      "layoutSelect"
    );

      const appearanceKpiStyle =
    document.getElementById(
      "appearanceKpiStyle"
    );

  const appearanceChartStyle =
    document.getElementById(
      "appearanceChartStyle"
    );

  const appearanceBackground =
    document.getElementById(
      "appearanceBackground"
    );

      const protectDashboardToggle =
    document.getElementById(
      "protectDashboardToggle"
    );

  const hideBackendToggle =
    document.getElementById(
      "hideBackendToggle"
    );

  const lockSettingsToggle =
    document.getElementById(
      "lockSettingsToggle"
    );

  if (dashboardTitle) {

    dashboardTitle.value =
      dashboardState.dashboardTitle;

  }


  if (themeSelect) {

    themeSelect.value =
      dashboardState.theme;

  }


  if (currencySelect) {

    currencySelect.value =
      dashboardState.currency;

  }


  if (gridlinesSelect) {

    gridlinesSelect.value =
      dashboardState.gridlines;

  }


  if (layoutSelect) {

    layoutSelect.value =
      dashboardState.layout;

  }

      if (appearanceKpiStyle) {

    appearanceKpiStyle.value =
      dashboardState.kpiStyle;

  }


  if (appearanceChartStyle) {

    appearanceChartStyle.value =
      dashboardState.chartStyle;

  }


    if (appearanceBackground) {

    appearanceBackground.value =
      dashboardState.background;

  }


  if (protectDashboardToggle) {

    protectDashboardToggle.checked =
      Boolean(
        dashboardState.protectDashboard
      );

  }


  if (hideBackendToggle) {

    hideBackendToggle.checked =
      Boolean(
        dashboardState.hideBackend
      );

  }


  if (lockSettingsToggle) {

    lockSettingsToggle.checked =
      Boolean(
        dashboardState.lockSettings
      );

  }


  applyPreviewAppearance();

  // ==========================================================
  // RESTORE DATA ENGINE CARD
  // ==========================================================

  document
    .querySelectorAll(
      ".pd-engine-card"
    )
    .forEach(
      function (card) {

        const selected =
          card.dataset.engine ===
          dashboardState.dataEngine;


        card.classList.toggle(
          "selected",
          selected
        );


        const check =
          card.querySelector(
            ".pd-engine-check"
          );


        if (check) {

          check.textContent =
            selected
              ? "âœ“"
              : "â—‹";

        }

      }
    );


  // ==========================================================
  // RESTORE BUILDER COLUMN DROPDOWNS
  // ==========================================================

  populateBuilderColumns();


  // ==========================================================
  // UPDATE PREVIEW + REVIEW + DATA INFO
  // ==========================================================

  updateAllUI();


  console.log(
    "Existing Power Dashboard configuration restored:",
    config
  );

}

// ============================================================
// NAVIGATION
// ============================================================

function initializeNavigation() {

  const navItems =
    document.querySelectorAll(
      ".pd-nav-item"
    );


  navItems.forEach(function (item) {

    item.addEventListener(
      "click",
      function () {

        const sectionId =
          item.dataset.section;

        showSection(sectionId);

      }
    );


  });


  const headerSteps =
    document.querySelectorAll(
      ".pd-step[data-section]"
    );


  headerSteps.forEach(function (step) {

    step.addEventListener(
      "click",
      function () {

        const sectionId =
          step.dataset.section;

        if (!sectionId) {
          return;
        }

        const isBuildStep =
  step.dataset.scrollTarget ===
  "buildDashboardBtn";


        headerSteps.forEach(
          function (headerStep) {

            headerStep.classList.remove(
              "active"
            );

          }
        );


        step.classList.add(
          "active"
        );


                  showSection(
  sectionId
);

if (isBuildStep) {

  headerSteps.forEach(
    function (headerStep) {
      headerStep.classList.remove(
        "active"
      );
    }
  );

  step.classList.add(
    "active"
  );

}


        // ====================================================
        // STEP 4 - BUILD DASHBOARD
        // ====================================================

               


        const scrollTargetId =
          step.dataset.scrollTarget;

        if (scrollTargetId) {

          window.setTimeout(
            function () {

              const scrollTarget =
                document.getElementById(
                  scrollTargetId
                );

              const configPanel =
                document.querySelector(
                  ".pd-config-panel"
                );

              if (
                scrollTarget &&
                configPanel
              ) {

                const panelRect =
                  configPanel.getBoundingClientRect();

                const targetRect =
                  scrollTarget.getBoundingClientRect();

                const targetTop =
                  configPanel.scrollTop +
                  targetRect.top -
                  panelRect.top -
                  (
                    configPanel.clientHeight /
                    2
                  ) +
                  (
                    targetRect.height /
                    2
                  );

                configPanel.scrollTo({
                  top: Math.max(
                    0,
                    targetTop
                  ),
                  behavior: "smooth"
                });

                scrollTarget.focus({
                  preventScroll: true
                });

              }

            },
            100
          );

        }

      }
    );

  });

}


function showSection(sectionId) {

  dashboardState.activeSection =
    sectionId;


  document
    .querySelectorAll(
      ".pd-nav-item"
    )
    .forEach(function (item) {

      item.classList.toggle(
        "active",
        item.dataset.section === sectionId
      );

    });


  document
    .querySelectorAll(
      ".pd-section"
    )
    .forEach(function (section) {

      section.classList.toggle(
        "active",
        section.id === sectionId
      );

    });


  updateHeaderSteps();

}


// ============================================================
// HEADER STEPS
// ============================================================

function updateHeaderSteps() {

  const steps =
    document.querySelectorAll(
      ".pd-step"
    );


  steps.forEach(function (step) {

    step.classList.remove(
      "active"
    );

  });


  let activeIndex = 0;


  if (
    dashboardState.activeSection ===
    "dataSetupSection"
  ) {

    activeIndex = 0;

  }
  else if (
    dashboardState.activeSection ===
      "kpiBuilderSection" ||
    dashboardState.activeSection ===
      "chartBuilderSection" ||
    dashboardState.activeSection ===
      "slicerBuilderSection" ||
    dashboardState.activeSection ===
      "smartTableSection" ||
    dashboardState.activeSection ===
      "appearanceSection" ||
    dashboardState.activeSection ===
      "securitySection"
  ) {

    activeIndex = 1;

  }
  else if (
    dashboardState.activeSection ===
    "reviewSection"
  ) {

    activeIndex = 2;

  }


  if (steps[activeIndex]) {

    steps[activeIndex].classList.add(
      "active"
    );

  }

}


// ============================================================
// DATA & SETUP CONTROLS
// ============================================================

function initializeSetupControls() {

  const dashboardTitle =
    document.getElementById(
      "dashboardTitle"
    );

  const themeSelect =
    document.getElementById(
      "themeSelect"
    );

  const currencySelect =
    document.getElementById(
      "currencySelect"
    );

  const gridlinesSelect =
    document.getElementById(
      "gridlinesSelect"
    );

  const layoutSelect =
    document.getElementById(
      "layoutSelect"
    );

  const selectRangeBtn =
    document.getElementById(
      "selectRangeBtn"
    );


  dashboardTitle.addEventListener(
    "input",
    function () {

      dashboardState.dashboardTitle =
        dashboardTitle.value.trim() ||
        "Power Dashboard";

      updateAllUI();

    }
  );


  themeSelect.addEventListener(
    "change",
    function () {

      dashboardState.theme =
        themeSelect.value;

      updateAllUI();

      setStatus(
        getThemeName(
          dashboardState.theme
        ) +
        " theme selected"
      );

    }
  );


  currencySelect.addEventListener(
    "change",
    function () {

      dashboardState.currency =
        currencySelect.value;

      updateAllUI();

      setStatus(
        "Currency updated"
      );

    }
  );


  gridlinesSelect.addEventListener(
    "change",
    function () {

      dashboardState.gridlines =
        gridlinesSelect.value;

      setStatus(
        "Gridlines: " +
        capitalize(
          dashboardState.gridlines
        )
      );

    }
  );


  layoutSelect.addEventListener(
    "change",
    function () {

      dashboardState.layout =
        layoutSelect.value;

      setStatus(
        "Layout: " +
        capitalize(
          dashboardState.layout
        )
      );

    }
  );


selectRangeBtn.addEventListener(
  "click",
  function () {

    requestExcelRange();

  }
);

}

// ============================================================
// EXCEL RANGE REQUEST
//
// IMPORTANT:
// This Studio is an Office Dialog.
//
// A dialog does not directly share the same Excel.run
// worksheet context as the parent command runtime.
//
// So this button currently sends a request to the
// parent commands page.
//
// In the next phase the commands runtime will:
// 1. Read the current Excel selection
// 2. Detect rows / columns / headers
// 3. Send the result back to this dialog
// ============================================================

function requestExcelRange(
  sourceRange
) {

  const savedSourceRange =
    String(
      sourceRange || ""
    ).trim();

  if (!savedSourceRange) {

    setStatus(
      "Reading current Excel selection..."
    );

  }

  try {

    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "POWER_DASHBOARD_GET_SELECTION",

        sourceRange:
          savedSourceRange
      })
    );

  }
  catch (error) {

    dashboardRefreshInProgress =
      false;

        const dashboardRefreshButton =
      document.getElementById(
        "dashboardRefreshBtn"
      );

    const previewRefreshButton =
      document.getElementById(
        "previewRefreshBtn"
      );

    if (dashboardRefreshButton) {
      dashboardRefreshButton.disabled =
        false;
    }

    if (previewRefreshButton) {
      previewRefreshButton.disabled =
        false;
    }

    console.error(
      "Range request failed:",
      error
    );

    setStatus(
      "Unable to request Excel selection"
    );

  }

}


// ============================================================
// APPLY RANGE
// ============================================================

function applySelectedRange(data) {

  dashboardState.dataRange =
    data.address || "";

  dashboardState.rowCount =
    data.rows || 0;

  dashboardState.columnCount =
    data.columns || 0;

  dashboardState.headerDetected =
    Boolean(
      data.headersDetected
    );

  dashboardState.dataTypeDetected =
    Boolean(
      data.dataTypesDetected
    );

    dashboardState.columnDefinitions =
  Array.isArray(
    data.columnDefinitions
  )
    ? data.columnDefinitions.map(
        function (item) {

          return item &&
            typeof item === "object"
              ? {
                  ...item
                }
              : item;

        }
      )
    : [];

     dashboardState.profilerResult =
  data.profilerResult &&
  typeof data.profilerResult ===
    "object"
    ? data.profilerResult
    : null;


dashboardState.advisorResult =
  null;


dashboardState.sourceValues =
  Array.isArray(
    data.sourceValues
  )
    ? data.sourceValues
    : [];


const advisorInput =
  createSmartAdvisorInput();


const kpiRecommendations =
  createKpiAdvisorRecommendations(
    advisorInput
  );


const chartRecommendations =
  createChartAdvisorRecommendations(
    advisorInput
  );

const slicerRecommendations =
  createSlicerAdvisorRecommendations(
    advisorInput
  );

const tableRecommendations =
  createTableAdvisorRecommendations(
    advisorInput
  );

  const combinedRecommendation =
  createCombinedDashboardRecommendation(
    kpiRecommendations,
    chartRecommendations,
    slicerRecommendations,
    tableRecommendations
  );


dashboardState.advisorResult = {

  generatedAt:
    new Date().toISOString(),

  input:
    advisorInput,

  kpis:
    kpiRecommendations,

    charts:
    chartRecommendations,

  slicers:
    slicerRecommendations,

  tables:
    tableRecommendations,

  combined:
    combinedRecommendation

};



populateBuilderColumns();

  updateAllUI();

}


// ============================================================
// POPULATE BUILDER COLUMN DROPDOWNS
// ============================================================

function populateBuilderColumns() {

  const columns =
    dashboardState.columnDefinitions || [];


  // ==========================================================
  // KPI BUILDER
  // ==========================================================

  const kpiColumn =
    document.getElementById(
      "kpiColumn"
    );


  if (kpiColumn) {

    fillColumnSelect(
      kpiColumn,
      columns,
      "Select Column",
      function (column) {

        return (
          column.type === "number"
        );

      }
    );

  }


// ==========================================================
// SLICER BUILDER
// ==========================================================



const slicerTypeSelect =
  document.getElementById(
    "slicerType"
  );


if (
  slicerTypeSelect &&
  slicerTypeSelect.dataset
    .columnFilterBound !==
    "true"
) {

  slicerTypeSelect.dataset
    .columnFilterBound =
    "true";


  slicerTypeSelect.addEventListener(
    "change",
    function () {

      updateSlicerColumnOptions();

    }
  );

}




  // ==========================================================
  // CHART BUILDER
  //
  // Current HTML order:
  //
  // select[0] = Chart Type
  // select[1] = X Axis
  // select[2] = Y Axis
  // select[3] = Aggregation
  // select[4] = Top / Bottom
  // select[5] = Data Labels
  // ==========================================================

const chartXAxis =
  document.getElementById(
    "chartXAxis"
  );


const chartYAxis =
  document.getElementById(
    "chartYAxis"
  );


const chartSecondaryYAxis =
  document.getElementById(
    "chartSecondaryYAxis"
  );


if (chartXAxis) {

  fillColumnSelect(
    chartXAxis,
    columns,
    "Select Column"
  );

}


updateChartAxisColumnOptions();


if (chartYAxis) {

  fillColumnSelect(
    chartYAxis,
    columns,
    "Select Column",
    function (column) {

      return (
        column.type === "number"
      );

    }
  );

}


if (chartSecondaryYAxis) {

  fillColumnSelect(
    chartSecondaryYAxis,
    columns,
    "Select Secondary Value",
    function (column) {

      return (
        column.type === "number"
      );

    }
  );

}


// ==========================================================
// SMART TABLE BUILDER
// ==========================================================

const tableGroupColumn =
  document.getElementById(
    "tableGroupColumn"
  );

const tableValueColumn =
  document.getElementById(
    "tableValueColumn"
  );


if (tableGroupColumn) {

  fillColumnSelect(
    tableGroupColumn,
    columns,
    "Select Group Column"
  );

}


if (tableValueColumn) {

  fillColumnSelect(
    tableValueColumn,
    columns,
    "Select Value Column",
    function (column) {

      return (
        column.type === "number"
      );

    }
  );

}


console.log(
  "Power Dashboard columns loaded:",
  columns
);

}


// ============================================================
// CHART AXIS COLUMN OPTIONS
// ============================================================

function updateChartAxisColumnOptions() {

  const columns =
    dashboardState.columnDefinitions ||
    [];


  const chartTypeSelect =
    document.getElementById(
      "chartType"
    );

  const chartXAxis =
    document.getElementById(
      "chartXAxis"
    );

  const chartYAxis =
    document.getElementById(
      "chartYAxis"
    );


  if (
    !chartXAxis ||
    !chartYAxis
  ) {

    return;

  }


  const currentType =
    chartTypeSelect
      ? String(
          chartTypeSelect.value ||
          ""
        )
          .trim()
          .toLowerCase()
      : "";


  const previousX =
    chartXAxis.value;


  const previousY =
    chartYAxis.value;


  // ==========================================================
  // SCATTER
  // X + Y MUST BOTH BE NUMERIC
  // ==========================================================

  if (
    currentType ===
    "scatter"
  ) {

    fillColumnSelect(
      chartXAxis,
      columns,
      "Select Numeric X Axis",
      function (column) {

        return (
          column.type ===
          "number"
        );

      }
    );


    fillColumnSelect(
      chartYAxis,
      columns,
      "Select Numeric Y Axis",
      function (column) {

        return (
          column.type ===
          "number"
        );

      }
    );

  }
  else {

    // ========================================================
    // NORMAL CHARTS
    // X = ANY COLUMN
    // Y = NUMERIC
    // ========================================================

    fillColumnSelect(
      chartXAxis,
      columns,
      "Select Column"
    );


    fillColumnSelect(
      chartYAxis,
      columns,
      "Select Column",
      function (column) {

        return (
          column.type ===
          "number"
        );

      }
    );

  }


  // Restore prior selections when still available.
  if (
    previousX &&
    Array.from(
      chartXAxis.options
    ).some(
      function (option) {

        return (
          option.value ===
          previousX
        );

      }
    )
  ) {

    chartXAxis.value =
      previousX;

  }


  if (
    previousY &&
    Array.from(
      chartYAxis.options
    ).some(
      function (option) {

        return (
          option.value ===
          previousY
        );

      }
    )
  ) {

    chartYAxis.value =
      previousY;

  }

}


// ============================================================
// GENERIC COLUMN SELECT POPULATOR
// ============================================================

function fillColumnSelect(
  selectElement,
  columns,
  placeholder,
  filterFunction
) {

  if (!selectElement) {

    return;

  }


  selectElement.innerHTML =
    "";


  const placeholderOption =
    document.createElement(
      "option"
    );


  placeholderOption.value =
    "";

  placeholderOption.textContent =
    placeholder || "Select Column";


  selectElement.appendChild(
    placeholderOption
  );


  columns.forEach(
    function (column) {

      if (
        typeof filterFunction ===
          "function" &&
        !filterFunction(column)
      ) {

        return;

      }


      const option =
        document.createElement(
          "option"
        );


      option.value =
        column.name;


      option.textContent =
        column.name +
        " (" +
        getColumnTypeLabel(
          column.type
        ) +
        ")";


      option.dataset.columnIndex =
        column.index;


      option.dataset.columnType =
        column.type;


      selectElement.appendChild(
        option
      );

    }
  );

}


// ============================================================
// FRIENDLY COLUMN TYPE NAME
// ============================================================

function getColumnTypeLabel(type) {

  switch (type) {

    case "number":
      return "Number";

    case "date":
      return "Date";

    case "text":
      return "Text";

    case "blank":
      return "Blank";

    default:
      return "Auto";

  }

}

// ============================================================
// SMART ADVISOR - INPUT MODEL / PROFILER BRIDGE
// ============================================================

function createSmartAdvisorInput() {

  const profiler =
    dashboardState.profilerResult &&
    typeof dashboardState.profilerResult === "object"
      ? dashboardState.profilerResult
      : null;


  const sourceColumns =
    profiler &&
    Array.isArray(profiler.columns)
      ? profiler.columns
      : (
          Array.isArray(dashboardState.columnDefinitions)
            ? dashboardState.columnDefinitions
            : []
        );


  const columns =
    sourceColumns.map(function (column, index) {

      const safeColumn =
        column &&
        typeof column === "object"
          ? column
          : {};


      const statistics =
        safeColumn.statistics &&
        typeof safeColumn.statistics === "object"
          ? safeColumn.statistics
          : {};


      const name =
        String(
          safeColumn.name ||
          safeColumn.header ||
          ""
        ).trim();


      const detectedType =
        String(
          safeColumn.type ||
          "text"
        ).trim().toLowerCase();


      const semanticType =
        String(
          safeColumn.semanticType ||
          detectedType ||
          "text"
        ).trim().toLowerCase();


      return {

        index:
          index,

        name:
          name,

        type:
          detectedType,

        semanticType:
          semanticType,

        statistics: {

          totalCount:
            Number(
              statistics.totalCount || 0
            ),

          nonBlankCount:
            Number(
              statistics.nonBlankCount || 0
            ),

          blankCount:
            Number(
              statistics.blankCount || 0
            ),

          blankPercent:
            Number(
              statistics.blankPercent || 0
            ),

          uniqueCount:
            Number(
              statistics.uniqueCount || 0
            ),

          cardinalityPercent:
            Number(
              statistics.cardinalityPercent || 0
            ),

          validCount:
            Number(
              statistics.validCount || 0
            ),

          invalidCount:
            Number(
              statistics.invalidCount || 0
            ),

          invalidPercent:
            Number(
              statistics.invalidPercent || 0
            ),

          min:
            statistics.min !== undefined
              ? statistics.min
              : null,

          max:
            statistics.max !== undefined
              ? statistics.max
              : null

        }

      };

    });


  return {

    rowCount:
      profiler
        ? Number(profiler.rowCount || 0)
        : Math.max(
            0,
            (
              Array.isArray(
                dashboardState.sourceValues
              )
                ? dashboardState.sourceValues.length
                : 0
            ) - 1
          ),

    columnCount:
      profiler
        ? Number(
            profiler.columnCount ||
            columns.length
          )
        : columns.length,

    columns:
      columns,

    duplicateRows:
      profiler &&
      profiler.duplicateRows
        ? JSON.parse(
            JSON.stringify(
              profiler.duplicateRows
            )
          )
        : null,

    dataQuality:
      profiler &&
      profiler.dataQuality
        ? JSON.parse(
            JSON.stringify(
              profiler.dataQuality
            )
          )
        : null

  };

}


// ============================================================
// SMART ADVISOR - KPI ADVISOR ENGINE
// ============================================================

function createKpiAdvisorRecommendations(advisorInput) {

  const input =
    advisorInput &&
    typeof advisorInput === "object"
      ? advisorInput
      : createSmartAdvisorInput();


  const columns =
    Array.isArray(input.columns)
      ? input.columns
      : [];


  const recommended = [];
  const alternatives = [];
  const usedKeys = {};


  function normalizeColumnName(name) {

    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");

  }


  function hasNameHint(column, hints) {

    const normalizedName =
      normalizeColumnName(
        column && column.name
      );


    return hints.some(
      function (hint) {

        return (
          normalizedName.indexOf(
            String(hint)
              .trim()
              .toLowerCase()
          ) !== -1
        );

      }
    );

  }


  function addRecommendation(
    target,
    column,
    title,
    aggregation,
    format,
    reason,
    priority
  ) {

    if (
      !column ||
      !column.name
    ) {
      return;
    }


    const key =
      String(column.name) +
      "|" +
      String(aggregation);


    if (usedKeys[key]) {
      return;
    }


    usedKeys[key] =
      true;


    target.push({

      title:
        title,

      column:
        column.name,

      aggregation:
        aggregation,

      format:
        format,

      comparison:
        "None",

      reason:
        reason,

      priority:
        priority

    });

  }


  // ==========================================================
  // PRIMARY BUSINESS VALUE KPIs
  // ==========================================================

  columns.forEach(
    function (column) {

      const semanticType =
        String(
          column.semanticType ||
          column.type ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        semanticType !== "currency" &&
        semanticType !== "number"
      ) {
        return;
      }


      if (
        hasNameHint(
          column,
          [
            "net sales",
            "net revenue",
            "revenue"
          ]
        )
      ) {

        addRecommendation(
          recommended,
          column,
          "Total " + column.name,
          "SUM",
          "Currency",
          "Primary revenue measure",
          100
        );

        return;
      }


      if (
        hasNameHint(
          column,
          [
            "profit",
            "margin amount"
          ]
        )
      ) {

        addRecommendation(
          recommended,
          column,
          "Total " + column.name,
          "SUM",
          "Currency",
          "Primary profitability measure",
          95
        );

        return;
      }


      if (
        hasNameHint(
          column,
          [
            "gross sales",
            "gross revenue",
            "sales"
          ]
        )
      ) {

        addRecommendation(
          recommended,
          column,
          "Total " + column.name,
          "SUM",
          "Currency",
          "Important sales measure",
          90
        );

        return;
      }


      if (
        hasNameHint(
          column,
          [
            "quantity",
            "qty",
            "units"
          ]
        )
      ) {

        addRecommendation(
          recommended,
          column,
          "Total " + column.name,
          "SUM",
          "Number",
          "Important volume measure",
          80
        );

        return;
      }


      if (
        semanticType === "currency"
      ) {

        addRecommendation(
          alternatives,
          column,
          "Total " + column.name,
          "SUM",
          "Currency",
          "Additional monetary measure",
          60
        );

        return;
      }


      addRecommendation(
        alternatives,
        column,
        "Total " + column.name,
        "SUM",
        "Number",
        "Additional numeric measure",
        50
      );

    }
  );


  // ==========================================================
  // ORDER / TRANSACTION COUNT KPI
  // ==========================================================

  columns.forEach(
    function (column) {

      const semanticType =
        String(
          column.semanticType || ""
        )
          .trim()
          .toLowerCase();


      if (
        semanticType === "id" ||
        hasNameHint(
          column,
          [
            "order id",
            "transaction id",
            "invoice id",
            "order number",
            "invoice number"
          ]
        )
      ) {

        addRecommendation(
          recommended,
          column,
          hasNameHint(
            column,
            [
              "order",
              "invoice"
            ]
          )
            ? "Orders"
            : "Unique " + column.name,
          "UNIQUE COUNT",
          "Number",
          "Unique transaction or identifier count",
          85
        );

      }

    }
  );


  // ==========================================================
  // CUSTOMER COUNT KPI
  // ==========================================================

  columns.forEach(
    function (column) {

      if (
        hasNameHint(
          column,
          [
            "customer",
            "client",
            "buyer"
          ]
        )
      ) {

        addRecommendation(
          recommended,
          column,
          "Unique " + column.name,
          "UNIQUE COUNT",
          "Number",
          "Unique customer count",
          75
        );

      }

    }
  );


  recommended.sort(
    function (a, b) {

      return (
        Number(b.priority || 0) -
        Number(a.priority || 0)
      );

    }
  );


  const primaryRecommendations =
  recommended.slice(
    0,
    6
  );


recommended.slice(6).forEach(
  function (item) {

    alternatives.push(
      item
    );

  }
);


alternatives.sort(
  function (a, b) {

    return (
      Number(b.priority || 0) -
      Number(a.priority || 0)
    );

  }
);


  return {

    recommendedCount:
      primaryRecommendations.length,

    recommended:
      primaryRecommendations,

    alternatives:
      alternatives

  };

}

// ============================================================
// SMART ADVISOR - CHART / REPORT ADVISOR ENGINE
// ============================================================

function createChartAdvisorRecommendations(advisorInput) {

  const input =
    advisorInput &&
    typeof advisorInput === "object"
      ? advisorInput
      : createSmartAdvisorInput();


  const columns =
    Array.isArray(input.columns)
      ? input.columns
      : [];


  const recommended = [];
  const alternatives = [];
  const usedKeys = {};


  function normalizeColumnName(name) {

    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");

  }


  function hasNameHint(column, hints) {

    const normalizedName =
      normalizeColumnName(
        column && column.name
      );


    return hints.some(
      function (hint) {

        return (
          normalizedName.indexOf(
            String(hint || "")
              .trim()
              .toLowerCase()
          ) !== -1
        );

      }
    );

  }


  function findColumnByHints(hints) {

    return columns.find(
      function (column) {

        return hasNameHint(
          column,
          hints
        );

      }
    ) || null;

  }


  function findColumnBySemanticTypes(types) {

    return columns.find(
      function (column) {

        return (
          types.indexOf(
            String(
              column.semanticType ||
              ""
            ).toLowerCase()
          ) !== -1
        );

      }
    ) || null;

  }


  function findNumericColumn() {

    return columns.find(
      function (column) {

        const type =
          String(
            column.type ||
            ""
          ).toLowerCase();

        const semanticType =
          String(
            column.semanticType ||
            ""
          ).toLowerCase();

        return (
          type === "number" ||
          type === "currency" ||
          semanticType === "number" ||
          semanticType === "currency"
        );

      }
    ) || null;

  }


  function addRecommendation(
    target,
    config
  ) {

    if (
      !config ||
      !config.xAxis ||
      !config.yAxis
    ) {
      return;
    }


    const key =
      [
        config.type,
        config.xAxis,
        config.yAxis,
        config.aggregation,
        config.secondaryYAxis || "",
        config.topBottom || "Show All"
      ].join("|");


    if (usedKeys[key]) {
      return;
    }


    usedKeys[key] =
      true;


    target.push({

      title:
        String(
          config.title || ""
        ),

      type:
        String(
          config.type ||
          "Column"
        ),

      xAxis:
        String(
          config.xAxis ||
          ""
        ),

      yAxis:
        String(
          config.yAxis ||
          ""
        ),

      aggregation:
        String(
          config.aggregation ||
          "SUM"
        ),

      secondaryYAxis:
        String(
          config.secondaryYAxis ||
          ""
        ),

      secondaryAggregation:
        String(
          config.secondaryAggregation ||
          "SUM"
        ),

      topBottom:
        String(
          config.topBottom ||
          "Show All"
        ),

      dataLabels:
        String(
          config.dataLabels ||
          "Show"
        ),

      reportType:
        String(
          config.reportType ||
          "Summary Report"
        ),

      reason:
        String(
          config.reason ||
          ""
        ),

      priority:
        Number(
          config.priority ||
          0
        )

    });

  }


  const dateColumn =
    findColumnBySemanticTypes(
      ["date"]
    ) ||
    findColumnByHints(
      ["date", "month", "year"]
    );


  const netSalesColumn =
    findColumnByHints(
      [
        "net sales",
        "revenue"
      ]
    );


  const salesColumn =
    netSalesColumn ||
    findColumnByHints(
      [
        "gross sales",
        "sales"
      ]
    );


  const profitColumn =
    findColumnByHints(
      [
        "profit",
        "margin"
      ]
    );


  const stateColumn =
    findColumnByHints(
      [
        "state",
        "region",
        "zone",
        "territory"
      ]
    );


  const categoryColumn =
    findColumnByHints(
      [
        "category",
        "segment"
      ]
    );


  const productColumn =
    findColumnByHints(
      [
        "product",
        "item"
      ]
    );


  const customerColumn =
    findColumnByHints(
      [
        "customer",
        "client",
        "buyer"
      ]
    );


  const numericColumn =
    salesColumn ||
    profitColumn ||
    findNumericColumn();


  // ==========================================================
  // TREND / TIME-BASED SALES REPORT
  // ==========================================================

  if (
    dateColumn &&
    salesColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          salesColumn.name +
          " Trend",

        type:
          "Line",

        xAxis:
          dateColumn.name,

        yAxis:
          salesColumn.name,

        aggregation:
          "SUM",

        topBottom:
          "Show All",

        dataLabels:
          "Hide",

        reportType:
          "Trend Report",

        reason:
          "Shows sales performance over time",

        priority:
          100
      }
    );

  }


  // ==========================================================
  // SALES + PROFIT COMPARISON REPORT
  // ==========================================================

  if (
    dateColumn &&
    salesColumn &&
    profitColumn &&
    salesColumn.name !==
      profitColumn.name
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Sales vs Profit Trend",

        type:
          "Combo",

        xAxis:
          dateColumn.name,

        yAxis:
          salesColumn.name,

        aggregation:
          "SUM",

        secondaryYAxis:
          profitColumn.name,

        secondaryAggregation:
          "SUM",

        topBottom:
          "Show All",

        dataLabels:
          "Hide",

        reportType:
          "Profitability Report",

        reason:
          "Compares sales and profit over time",

        priority:
          95
      }
    );

  }


  // ==========================================================
  // REGIONAL REPORT
  // ==========================================================

  if (
    stateColumn &&
    salesColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Top 5 " +
          stateColumn.name +
          " by " +
          salesColumn.name,

        type:
          "Bar",

        xAxis:
          stateColumn.name,

        yAxis:
          salesColumn.name,

        aggregation:
          "SUM",

        topBottom:
          "Top 5",

        dataLabels:
          "Show",

        reportType:
          "Regional Report",

        reason:
          "Highlights strongest geographic areas",

        priority:
          90
      }
    );

  }


  // ==========================================================
  // PRODUCT PERFORMANCE REPORT
  // ==========================================================

  if (
    productColumn &&
    profitColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Top 5 " +
          productColumn.name +
          " by " +
          profitColumn.name,

        type:
          "Bar",

        xAxis:
          productColumn.name,

        yAxis:
          profitColumn.name,

        aggregation:
          "SUM",

        topBottom:
          "Top 5",

        dataLabels:
          "Show",

        reportType:
          "Product Performance Report",

        reason:
          "Ranks products by profitability",

        priority:
          88
      }
    );

  }


  // ==========================================================
  // CATEGORY COMPARISON REPORT
  // ==========================================================

  if (
    categoryColumn &&
    salesColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          salesColumn.name +
          " by " +
          categoryColumn.name,

        type:
          "Column",

        xAxis:
          categoryColumn.name,

        yAxis:
          salesColumn.name,

        aggregation:
          "SUM",

        topBottom:
          "Show All",

        dataLabels:
          "Show",

        reportType:
          "Category Comparison Report",

        reason:
          "Compares sales across categories",

        priority:
          85
      }
    );

  }


  // ==========================================================
  // CUSTOMER REPORT
  // ==========================================================

  if (
    customerColumn &&
    salesColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Top 10 " +
          customerColumn.name +
          " by " +
          salesColumn.name,

        type:
          "Bar",

        xAxis:
          customerColumn.name,

        yAxis:
          salesColumn.name,

        aggregation:
          "SUM",

        topBottom:
          "Top 10",

        dataLabels:
          "Show",

        reportType:
          "Customer Report",

        reason:
          "Identifies highest-value customers",

        priority:
          80
      }
    );

  }


  // ==========================================================
  // PROFITABILITY BY CATEGORY
  // ==========================================================

  if (
    categoryColumn &&
    profitColumn
  ) {

    addRecommendation(
      alternatives,
      {
        title:
          profitColumn.name +
          " by " +
          categoryColumn.name,

        type:
          "Column",

        xAxis:
          categoryColumn.name,

        yAxis:
          profitColumn.name,

        aggregation:
          "SUM",

        topBottom:
          "Show All",

        dataLabels:
          "Show",

        reportType:
          "Profitability Report",

        reason:
          "Compares profitability across categories",

        priority:
          75
      }
    );

  }


  // ==========================================================
  // GENERIC SUMMARY REPORT FALLBACK
  // ==========================================================

  if (
    categoryColumn &&
    numericColumn
  ) {

    addRecommendation(
      alternatives,
      {
        title:
          numericColumn.name +
          " by " +
          categoryColumn.name,

        type:
          "Column",

        xAxis:
          categoryColumn.name,

        yAxis:
          numericColumn.name,

        aggregation:
          "SUM",

        topBottom:
          "Show All",

        dataLabels:
          "Show",

        reportType:
          "Summary Report",

        reason:
          "General category performance summary",

        priority:
          60
      }
    );

  }


  recommended.sort(
    function (a, b) {

      return (
        Number(b.priority || 0) -
        Number(a.priority || 0)
      );

    }
  );


  const primaryRecommendations =
    recommended.slice(
      0,
      6
    );


  recommended.slice(6).forEach(
    function (item) {

      alternatives.push(
        item
      );

    }
  );


  alternatives.sort(
    function (a, b) {

      return (
        Number(b.priority || 0) -
        Number(a.priority || 0)
      );

    }
  );


  return {

    recommendedCount:
      primaryRecommendations.length,

    recommended:
      primaryRecommendations,

    alternatives:
      alternatives

  };

}

// ============================================================
// SLICER ADVISOR
// ============================================================

function createSlicerAdvisorRecommendations(advisorInput) {

  const input =
    advisorInput ||
    createSmartAdvisorInput();

  const columns =
    Array.isArray(input.columns)
      ? input.columns
      : [];

  const recommended = [];
  const alternatives = [];
  const usedColumns = {};

  function normalizeColumnName(column) {
    return String(
      column && column.name
        ? column.name
        : ""
    )
      .trim()
      .toLowerCase();
  }

  function hasNameHint(column, hints) {

    const name =
      normalizeColumnName(column);

    return hints.some(
      function (hint) {
        return name.indexOf(hint) !== -1;
      }
    );
  }

  function getUniqueCount(column) {

    const statistics =
      column &&
      column.statistics &&
      typeof column.statistics === "object"
        ? column.statistics
        : {};

    const value =
      Number(statistics.uniqueCount);

    return Number.isFinite(value)
      ? value
      : 0;
  }

  function addRecommendation(
    target,
    column,
    options
  ) {

    if (
      !column ||
      !column.name ||
      !options
    ) {
      return;
    }

    const columnName =
      String(column.name).trim();

    const key =
      columnName.toLowerCase();

    if (
      !columnName ||
      usedColumns[key]
    ) {
      return;
    }

    usedColumns[key] = true;

    target.push({
      title:
        options.title ||
        columnName,

      column:
        columnName,

      type:
        options.type ||
        "Category Slicer",

      timelineGrouping:
        options.timelineGrouping ||
        "Month",

      orientation:
        options.orientation ||
        "Vertical",

      selectionMode:
        options.selectionMode ||
        "Multi Select",

      connection:
        options.connection ||
        "All Dashboard Objects",

      connectionTargets: {
        kpis: true,
        charts: true,
        tables: true
      },

      reason:
        options.reason ||
        "Useful dashboard filter",

      priority:
        Number(options.priority) || 0
    });
  }


  // ==========================================================
  // DATE / TIMELINE
  // ==========================================================

  const dateColumn =
    columns.find(
      function (column) {

        const type =
          String(
            column.type || ""
          ).toLowerCase();

        const semanticType =
          String(
            column.semanticType || ""
          ).toLowerCase();

        return (
          type === "date" ||
          semanticType === "date" ||
          hasNameHint(
            column,
            [
              "date",
              "month",
              "year"
            ]
          )
        );
      }
    );

  if (dateColumn) {

    addRecommendation(
      recommended,
      dateColumn,
      {
        title:
          dateColumn.name,

        type:
          "Timeline",

        timelineGrouping:
          "Month",

        orientation:
          "Horizontal",

        selectionMode:
          "Multi Select",

        connection:
          "All Dashboard Objects",

        reason:
          "Time-based filtering and trend analysis",

        priority:
          100
      }
    );
  }


  // ==========================================================
  // REGION / GEOGRAPHY
  // ==========================================================

  const regionColumns =
    columns.filter(
      function (column) {
        return hasNameHint(
          column,
          [
            "state",
            "region",
            "zone",
            "territory"
          ]
        );
      }
    );

  regionColumns.forEach(
    function (column, index) {

      addRecommendation(
        index === 0
          ? recommended
          : alternatives,
        column,
        {
          title:
            column.name,

          type:
            "Region Slicer",

          timelineGrouping:
            "Month",

          orientation:
            "Vertical",

          selectionMode:
            "Multi Select",

          connection:
            "All Dashboard Objects",

          reason:
            "Useful geographic dashboard filter",

          priority:
            index === 0
              ? 95
              : 70
        }
      );
    }
  );


  // ==========================================================
  // CATEGORY
  // ==========================================================

  const categoryColumn =
    columns.find(
      function (column) {
        return hasNameHint(
          column,
          [
            "category",
            "segment",
            "department"
          ]
        );
      }
    );

  if (categoryColumn) {

    addRecommendation(
      recommended,
      categoryColumn,
      {
        title:
          categoryColumn.name,

        type:
          "Category Slicer",

        timelineGrouping:
          "Month",

        orientation:
          "Vertical",

        selectionMode:
          "Multi Select",

        connection:
          "All Dashboard Objects",

        reason:
          "Useful category comparison filter",

        priority:
          90
      }
    );
  }


  // ==========================================================
  // PRODUCT
  // ==========================================================

  const productColumn =
    columns.find(
      function (column) {
        return hasNameHint(
          column,
          [
            "product",
            "item",
            "sku"
          ]
        );
      }
    );

  if (productColumn) {

    addRecommendation(
      recommended,
      productColumn,
      {
        title:
          productColumn.name,

        type:
          "Product Slicer",

        timelineGrouping:
          "Month",

        orientation:
          "Vertical",

        selectionMode:
          "Multi Select",

        connection:
          "All Dashboard Objects",

        reason:
          "Useful product performance filter",

        priority:
          85
      }
    );
  }


  // ==========================================================
  // CUSTOMER
  // ==========================================================

  const customerColumn =
    columns.find(
      function (column) {
        return hasNameHint(
          column,
          [
            "customer",
            "client",
            "buyer"
          ]
        );
      }
    );

  if (customerColumn) {

    addRecommendation(
      recommended,
      customerColumn,
      {
        title:
          customerColumn.name,

        type:
          "Customer Slicer",

        timelineGrouping:
          "Month",

        orientation:
          "Vertical",

        selectionMode:
          "Multi Select",

        connection:
          "All Dashboard Objects",

        reason:
          "Useful customer analysis filter",

        priority:
          80
      }
    );
  }


  // ==========================================================
  // STATUS
  // ==========================================================

  const statusColumn =
    columns.find(
      function (column) {
        return hasNameHint(
          column,
          [
            "status",
            "stage",
            "state"
          ]
        );
      }
    );

  if (
    statusColumn &&
    !usedColumns[
      normalizeColumnName(statusColumn)
    ]
  ) {

    addRecommendation(
      recommended,
      statusColumn,
      {
        title:
          statusColumn.name,

        type:
          "Status Slicer",

        timelineGrouping:
          "Month",

        orientation:
          "Vertical",

        selectionMode:
          "Multi Select",

        connection:
          "All Dashboard Objects",

        reason:
          "Useful status-based dashboard filter",

        priority:
          75
      }
    );
  }


  // ==========================================================
  // GENERIC CATEGORICAL FALLBACKS
  // ==========================================================

  columns.forEach(
    function (column) {

      const semanticType =
        String(
          column.semanticType || ""
        ).toLowerCase();

      const type =
        String(
          column.type || ""
        ).toLowerCase();

      const uniqueCount =
        getUniqueCount(column);

      const columnKey =
        normalizeColumnName(column);

      if (
        usedColumns[columnKey]
      ) {
        return;
      }

      if (
        semanticType === "category" ||
        type === "text"
      ) {

        if (
          uniqueCount > 1 &&
          uniqueCount <= 25
        ) {

          addRecommendation(
            alternatives,
            column,
            {
              title:
                column.name,

              type:
                "Category Slicer",

              timelineGrouping:
                "Month",

              orientation:
                "Vertical",

              selectionMode:
                "Multi Select",

              connection:
                "All Dashboard Objects",

              reason:
                "Low-cardinality categorical filter",

              priority:
                50
            }
          );
        }
      }
    }
  );


  recommended.sort(
    function (a, b) {
      return b.priority - a.priority;
    }
  );

  alternatives.sort(
    function (a, b) {
      return b.priority - a.priority;
    }
  );


  // Keep the primary dashboard filter area comfortable.
  while (
    recommended.length > 5
  ) {
    alternatives.unshift(
      recommended.pop()
    );
  }


  return {
    recommendedCount:
      recommended.length,

    recommended:
      recommended,

    alternatives:
      alternatives
  };
}

function createTableAdvisorRecommendations(advisorInput) {

  const input =
    advisorInput ||
    createSmartAdvisorInput();

  const columns =
    Array.isArray(input.columns)
      ? input.columns
      : [];

  const recommended = [];
  const alternatives = [];

  const usedKeys =
    new Set();


  function normalizeColumnName(column) {

    return String(
      column && column.name
        ? column.name
        : ""
    )
      .trim()
      .toLowerCase();

  }


  function hasNameHint(
    column,
    hints
  ) {

    const name =
      normalizeColumnName(
        column
      );

    return hints.some(
      function (hint) {

        return name.indexOf(
          hint
        ) !== -1;

      }
    );

  }


  function addRecommendation(
    target,
    config
  ) {

    if (
      !config ||
      !config.groupColumn ||
      !config.valueColumn
    ) {
      return;
    }

    const key =
      String(
        config.groupColumn
      ).toLowerCase() +
      "|" +
      String(
        config.valueColumn
      ).toLowerCase() +
      "|" +
      String(
        config.aggregation
      ).toUpperCase();

    if (
      usedKeys.has(
        key
      )
    ) {
      return;
    }

    usedKeys.add(
      key
    );

    target.push({
      title:
        config.title,

      dataEngine:
        "Aggregated",

      groupColumn:
        config.groupColumn,

      valueColumn:
        config.valueColumn,

      aggregation:
        config.aggregation ||
        "SUM",

      grandTotal:
        config.grandTotal ||
        "Yes",

      limitData:
        config.limitData ||
        "Show All",

      visualIndicator:
        config.visualIndicator ||
        "None",

      reportType:
        config.reportType ||
        "Summary Report",

      reason:
        config.reason ||
        "",

      priority:
        Number(
          config.priority ||
          0
        )
    });

  }


  function findColumn(
    predicate
  ) {

    return (
      columns.find(
        predicate
      ) ||
      null
    );

  }


  const salesColumn =
  findColumn(
    function (column) {

      return hasNameHint(
        column,
        [
          "net sales"
        ]
      );

    }
  ) ||
  findColumn(
    function (column) {

      return hasNameHint(
        column,
        [
          "revenue"
        ]
      );

    }
  ) ||
  findColumn(
    function (column) {

      const name =
        normalizeColumnName(
          column
        );

      return (
        name === "sales" ||
        (
          name.indexOf("sales") !== -1 &&
          name.indexOf("gross") === -1
        )
      );

    }
  ) ||
  findColumn(
    function (column) {

      return hasNameHint(
        column,
        [
          "gross sales"
        ]
      );

    }
  );


  const profitColumn =
    findColumn(
      function (column) {

        return hasNameHint(
          column,
          [
            "profit"
          ]
        );

      }
    );


  const categoryColumn =
    findColumn(
      function (column) {

        return hasNameHint(
          column,
          [
            "category",
            "segment",
            "department"
          ]
        );

      }
    );


  const regionColumn =
    findColumn(
      function (column) {

        return hasNameHint(
          column,
          [
            "state",
            "region",
            "zone",
            "territory"
          ]
        );

      }
    );


  const productColumn =
    findColumn(
      function (column) {

        return hasNameHint(
          column,
          [
            "product",
            "item",
            "sku"
          ]
        );

      }
    );


  const customerColumn =
    findColumn(
      function (column) {

        return hasNameHint(
          column,
          [
            "customer",
            "client",
            "buyer"
          ]
        );

      }
    );


  if (
    categoryColumn &&
    salesColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Category Sales Summary",

        groupColumn:
          categoryColumn.name,

        valueColumn:
          salesColumn.name,

        aggregation:
          "SUM",

        grandTotal:
          "Yes",

        limitData:
          "Show All",

        visualIndicator:
          "Data Bars",

        reportType:
          "Category Summary Report",

        reason:
          "Summarizes sales performance by category.",

        priority:
          100
      }
    );

  }


  if (
    regionColumn &&
    salesColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Regional Sales Summary",

        groupColumn:
          regionColumn.name,

        valueColumn:
          salesColumn.name,

        aggregation:
          "SUM",

        grandTotal:
          "Yes",

        limitData:
          "Show All",

        visualIndicator:
          "Color Scale",

        reportType:
          "Regional Report",

        reason:
          "Compares sales performance across regions.",

        priority:
          95
      }
    );

  }


  if (
    productColumn &&
    profitColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Top Products by Profit",

        groupColumn:
          productColumn.name,

        valueColumn:
          profitColumn.name,

        aggregation:
          "SUM",

        grandTotal:
          "Yes",

        limitData:
          "Top 10",

        visualIndicator:
          "Data Bars",

        reportType:
          "Product Performance Report",

        reason:
          "Highlights the most profitable products.",

        priority:
          90
      }
    );

  }


  if (
    customerColumn &&
    salesColumn
  ) {

    addRecommendation(
      recommended,
      {
        title:
          "Customer Sales Summary",

        groupColumn:
          customerColumn.name,

        valueColumn:
          salesColumn.name,

        aggregation:
          "SUM",

        grandTotal:
          "Yes",

        limitData:
          "Top 10",

        visualIndicator:
          "Data Bars",

        reportType:
          "Customer Report",

        reason:
          "Shows the highest-value customers by sales.",

        priority:
          85
      }
    );

  }


  if (
    categoryColumn &&
    profitColumn
  ) {

    addRecommendation(
      alternatives,
      {
        title:
          "Category Profitability Summary",

        groupColumn:
          categoryColumn.name,

        valueColumn:
          profitColumn.name,

        aggregation:
          "SUM",

        grandTotal:
          "Yes",

        limitData:
          "Show All",

        visualIndicator:
          "Color Scale",

        reportType:
          "Profitability Report",

        reason:
          "Compares profit contribution across categories.",

        priority:
          75
      }
    );

  }


  const genericCategoryColumns =
    columns.filter(
      function (column) {

        const semanticType =
          String(
            column.semanticType ||
            ""
          ).toLowerCase();

        const type =
          String(
            column.type ||
            ""
          ).toLowerCase();

        return (
          semanticType ===
            "category" ||
          type ===
            "text"
        );

      }
    );


  const genericNumericColumns =
    columns.filter(
      function (column) {

        const type =
          String(
            column.type ||
            ""
          ).toLowerCase();

        const semanticType =
          String(
            column.semanticType ||
            ""
          ).toLowerCase();

        return (
          type ===
            "number" ||
          semanticType ===
            "currency" ||
          type ===
            "currency"
        );

      }
    );


  genericCategoryColumns.forEach(
    function (groupColumn) {

      genericNumericColumns.forEach(
        function (valueColumn) {

          addRecommendation(
            alternatives,
            {
              title:
                valueColumn.name +
                " by " +
                groupColumn.name,

              groupColumn:
                groupColumn.name,

              valueColumn:
                valueColumn.name,

              aggregation:
                "SUM",

              grandTotal:
                "Yes",

              limitData:
                "Show All",

              visualIndicator:
                "None",

              reportType:
                "Summary Report",

              reason:
                "Provides a general grouped summary table.",

              priority:
                50
            }
          );

        }
      );

    }
  );


  recommended.sort(
    function (
      a,
      b
    ) {

      return (
        b.priority -
        a.priority
      );

    }
  );


  alternatives.sort(
    function (
      a,
      b
    ) {

      return (
        b.priority -
        a.priority
      );

    }
  );


  const primary =
    recommended.slice(
      0,
      4
    );


  const overflow =
    recommended.slice(
      4
    );


  overflow.forEach(
    function (item) {

      alternatives.push(
        item
      );

    }
  );


  alternatives.sort(
    function (
      a,
      b
    ) {

      return (
        b.priority -
        a.priority
      );

    }
  );


  return {
    recommendedCount:
      primary.length,

    recommended:
      primary,

    alternatives:
      alternatives
  };

}

// ============================================================
// COMBINED DASHBOARD RECOMMENDATION
// ============================================================

function createCombinedDashboardRecommendation(
  kpiRecommendations,
  chartRecommendations,
  slicerRecommendations,
  tableRecommendations
) {

  function getRecommendedItems(
    recommendation
  ) {

    if (
      !recommendation ||
      !Array.isArray(
        recommendation.recommended
      )
    ) {
      return [];
    }

    return recommendation.recommended;

  }


  function getAlternativeItems(
    recommendation
  ) {

    if (
      !recommendation ||
      !Array.isArray(
        recommendation.alternatives
      )
    ) {
      return [];
    }

    return recommendation.alternatives;

  }


  const recommendedKpis =
    getRecommendedItems(
      kpiRecommendations
    );

  const recommendedCharts =
    getRecommendedItems(
      chartRecommendations
    );

  const recommendedSlicers =
    getRecommendedItems(
      slicerRecommendations
    );

  const recommendedTables =
    getRecommendedItems(
      tableRecommendations
    );


  const alternativeKpis =
    getAlternativeItems(
      kpiRecommendations
    );

  const alternativeCharts =
    getAlternativeItems(
      chartRecommendations
    );

  const alternativeSlicers =
    getAlternativeItems(
      slicerRecommendations
    );

  const alternativeTables =
    getAlternativeItems(
      tableRecommendations
    );


  const totalRecommended =
    recommendedKpis.length +
    recommendedCharts.length +
    recommendedSlicers.length +
    recommendedTables.length;


  const totalAlternatives =
    alternativeKpis.length +
    alternativeCharts.length +
    alternativeSlicers.length +
    alternativeTables.length;


  return {

    recommendedCount:
      totalRecommended,

    alternativeCount:
      totalAlternatives,

    recommended: {

      kpis:
        recommendedKpis,

      charts:
        recommendedCharts,

      slicers:
        recommendedSlicers,

      tables:
        recommendedTables

    },

    alternatives: {

      kpis:
        alternativeKpis,

      charts:
        alternativeCharts,

      slicers:
        alternativeSlicers,

      tables:
        alternativeTables

    },

    counts: {

      kpis:
        recommendedKpis.length,

      charts:
        recommendedCharts.length,

      slicers:
        recommendedSlicers.length,

      tables:
        recommendedTables.length

    }

  };

}

function initializeSmartAdvisorControls() {

  const applyButton =
    document.getElementById(
      "applyAdvisorRecommendationsBtn"
    );


  if (applyButton) {

    applyButton.addEventListener(
      "click",
      function () {

        applySmartAdvisorRecommendations();

      }
    );

  }

}

function renderSmartAdvisorRecommendations(recommended) {
  const container = document.getElementById(
    "smartAdvisorRecommendations"
  );

  if (!container) {
    return;
  }

  container.textContent = "";

  const groups = [
    { key: "kpis", type: "kpi", title: "KPI Recommendations" },
    { key: "charts", type: "chart", title: "Chart Recommendations" },
    { key: "slicers", type: "slicer", title: "Slicer Recommendations" },
    { key: "tables", type: "table", title: "Smart Table Recommendations" }
  ];

  let renderedCount = 0;

  groups.forEach(function (group) {
    const items =
      recommended && Array.isArray(recommended[group.key])
        ? recommended[group.key]
        : [];

    const validItems = items.filter(function (item) {
      return item && typeof item === "object";
    });

    if (validItems.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "pd-advisor-group";

    const heading = document.createElement("h4");
    heading.textContent =
      group.title + " (" + validItems.length + ")";
    section.appendChild(heading);

    validItems.forEach(function (recommendation, index) {
      const row = document.createElement("div");
      row.className = "pd-advisor-item";

    const advisorActionKey =
  [
    group.type,
    recommendation.title ||
      recommendation.column ||
      recommendation.groupColumn ||
      "",
    recommendation.xAxis || "",
    recommendation.yAxis || "",
    recommendation.valueColumn || "",
    recommendation.aggregation || ""
  ]
    .map(function (value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    })
    .join("|");

      const title = document.createElement("strong");
      title.className = "pd-advisor-item-title";
      title.textContent = String(
        recommendation.title ||
        recommendation.column ||
        recommendation.groupColumn ||
        ("Recommendation " + (index + 1))
      );

      const actions =
  document.createElement("div");

actions.className =
  "pd-advisor-item-actions";


// ==========================================================
// APPLY
// ==========================================================

const applyButton =
  document.createElement("button");

applyButton.type =
  "button";

applyButton.className =
  "pd-btn pd-btn-secondary pd-advisor-apply-btn";

applyButton.textContent =
  "Apply";

applyButton.setAttribute(
  "aria-label",
  "Apply " + title.textContent
);


applyButton.addEventListener(
  "click",
  function () {

    const result =
      applySmartAdvisorRecommendation(
        group.type,
        recommendation
      );


    if (
  result &&
  result.applied
) {

  row.dataset.advisorState =
    "applied";

  dashboardState.advisorActionState[
    advisorActionKey
  ] = "applied";

}

  }
);


// ==========================================================
// REPLACE
// ==========================================================

const replaceButton =
  document.createElement("button");

replaceButton.type =
  "button";

replaceButton.className =
  "pd-btn pd-btn-secondary pd-advisor-replace-btn";

replaceButton.textContent =
  "Replace";

replaceButton.setAttribute(
  "aria-label",
  "Replace with " +
    title.textContent
);


replaceButton.addEventListener(
  "click",
  function () {

    const result =
      replaceSmartAdvisorRecommendation(
        group.type,
        recommendation
      );


    if (
  result &&
  result.replaced
) {

  row.dataset.advisorState =
    "replaced";

  dashboardState.advisorActionState[
    advisorActionKey
  ] = "replaced";

}

  }
);


// ==========================================================
// SKIP
// ==========================================================

const skipButton =
  document.createElement("button");

skipButton.type =
  "button";

skipButton.className =
  "pd-btn pd-btn-secondary pd-advisor-skip-btn";

skipButton.textContent =
  "Skip";

skipButton.setAttribute(
  "aria-label",
  "Skip " + title.textContent
);


skipButton.addEventListener(
  "click",
  function () {

    row.dataset.advisorState =
      "skipped";

    dashboardState.advisorActionState[
  advisorActionKey
] = "skipped";

registerDashboardChange();

    applyButton.disabled =
      true;

    replaceButton.disabled =
      true;

    skipButton.disabled =
      true;


    setStatus(
      "Advisor recommendation skipped"
    );

  }
);


actions.appendChild(
  applyButton
);

actions.appendChild(
  replaceButton
);

actions.appendChild(
  skipButton
);


row.appendChild(
  title
);

row.appendChild(
  actions
);

section.appendChild(
  row
);

      renderedCount += 1;
    });

    container.appendChild(section);
  });

  container.hidden = renderedCount === 0;
}

function updateSmartAdvisorUI() {

  const summary =
    document.getElementById(
      "smartAdvisorSummary"
    );

  const badge =
    document.getElementById(
      "smartAdvisorBadge"
    );

  const kpiCountElement =
    document.getElementById(
      "advisorKpiCount"
    );

  const chartCountElement =
    document.getElementById(
      "advisorChartCount"
    );

  const slicerCountElement =
    document.getElementById(
      "advisorSlicerCount"
    );

  const tableCountElement =
    document.getElementById(
      "advisorTableCount"
    );

  const applyButton =
    document.getElementById(
      "applyAdvisorRecommendationsBtn"
    );


  const advisorResult =
    dashboardState.advisorResult;

  const combined =
    advisorResult &&
    advisorResult.combined;

    const recommended =
    combined &&
    combined.recommended;

  renderSmartAdvisorRecommendations(recommended);


  const kpiCount =
    recommended &&
    Array.isArray(
      recommended.kpis
    )
      ? recommended.kpis.length
      : 0;


  const chartCount =
    recommended &&
    Array.isArray(
      recommended.charts
    )
      ? recommended.charts.length
      : 0;


  const slicerCount =
    recommended &&
    Array.isArray(
      recommended.slicers
    )
      ? recommended.slicers.length
      : 0;


  const tableCount =
    recommended &&
    Array.isArray(
      recommended.tables
    )
      ? recommended.tables.length
      : 0;


  const totalCount =
    kpiCount +
    chartCount +
    slicerCount +
    tableCount;


  if (kpiCountElement) {

    kpiCountElement.textContent =
      String(kpiCount);

  }


  if (chartCountElement) {

    chartCountElement.textContent =
      String(chartCount);

  }


  if (slicerCountElement) {

    slicerCountElement.textContent =
      String(slicerCount);

  }


  if (tableCountElement) {

    tableCountElement.textContent =
      String(tableCount);

  }


  if (summary) {

    if (totalCount > 0) {

      summary.textContent =
        totalCount +
        " recommendations ready.";

    }
    else {

      summary.textContent =
        "Select Excel data to generate recommendations.";

    }

  }


  if (badge) {

    badge.textContent =
      totalCount > 0
        ? "Ready"
        : "Waiting";

  }


  if (applyButton) {

    applyButton.disabled =
      totalCount === 0;

  }

}

function applySmartAdvisorRecommendation(
  recommendationType,
  recommendation
) {

  if (
    !recommendationType ||
    !recommendation
  ) {

    setStatus(
      "Advisor recommendation is not available"
    );

    return {
      applied: false,
      skipped: false
    };

  }


  const normalize = function (value) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  };


  const createId = function (prefix) {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );

  };


  let applied = false;
  let skipped = false;


  if (recommendationType === "kpi") {

    const exists =
      dashboardState.kpis.some(
        function (item) {

          return (
            normalize(item.title) ===
              normalize(
                recommendation.title
              ) &&
            normalize(item.column) ===
              normalize(
                recommendation.column
              ) &&
            normalize(item.aggregation) ===
              normalize(
                recommendation.aggregation
              )
          );

        }
      );


    if (exists) {

      skipped = true;

    }
    else {

      dashboardState.kpis.push({

        id:
          createId("kpi"),

        title:
          recommendation.title,

        column:
          recommendation.column,

        aggregation:
          recommendation.aggregation,

        format:
          recommendation.format ||
          "Auto",

        comparison:
          recommendation.comparison ||
          "None"

      });

      applied = true;

    }

  }


  else if (
    recommendationType === "chart"
  ) {

    const exists =
      dashboardState.charts.some(
        function (item) {

          return (
            normalize(item.title) ===
              normalize(
                recommendation.title
              ) &&
            normalize(item.type) ===
              normalize(
                recommendation.type
              ) &&
            normalize(item.xAxis) ===
              normalize(
                recommendation.xAxis
              ) &&
            normalize(item.yAxis) ===
              normalize(
                recommendation.yAxis
              ) &&
            normalize(item.aggregation) ===
              normalize(
                recommendation.aggregation
              )
          );

        }
      );


    if (exists) {

      skipped = true;

    }
    else {

      dashboardState.charts.push({

        id:
          createId("chart"),

        title:
          recommendation.title,

        type:
          recommendation.type,

        xAxis:
          recommendation.xAxis,

        yAxis:
          recommendation.yAxis,

        aggregation:
          recommendation.aggregation,

        secondaryYAxis:
          recommendation.secondaryYAxis ||
          "",

        secondaryAggregation:
          recommendation.secondaryAggregation ||
          "SUM",

        topBottom:
          recommendation.topBottom ||
          "Show All",

        dataLabels:
          recommendation.dataLabels ||
          "Show"

      });

      applied = true;

    }

  }


  else if (
    recommendationType === "slicer"
  ) {

    const exists =
      dashboardState.slicers.some(
        function (item) {

          return (
            normalize(item.column) ===
              normalize(
                recommendation.column
              ) &&
            normalize(item.type) ===
              normalize(
                recommendation.type
              ) &&
            normalize(
              item.timelineGrouping
            ) ===
              normalize(
                recommendation.timelineGrouping
              )
          );

        }
      );


    if (exists) {

      skipped = true;

    }
    else {

      const recommendationTargets =
        recommendation.connectionTargets ||
        recommendation.targets ||
        {};


      dashboardState.slicers.push({

        id:
          createId("slicer"),

        column:
          recommendation.column,

        title:
          recommendation.title,

        type:
          recommendation.type ||
          "Category Slicer",

        timelineGrouping:
          recommendation.timelineGrouping ||
          "Month",

        orientation:
          recommendation.orientation ||
          "Vertical",

        selectionMode:
          recommendation.selectionMode ||
          "Multi Select",

        connection:
          recommendation.connection ||
          "All Charts & KPIs",

        connectionTargets: {

          kpis:
            recommendationTargets.kpis !==
            false,

          charts:
            recommendationTargets.charts !==
            false,

          tables:
            recommendationTargets.tables !==
            false

        }

      });

      applied = true;

    }

  }


  else if (
    recommendationType === "table"
  ) {

    const exists =
      dashboardState.tables.some(
        function (item) {

          return (
            normalize(item.title) ===
              normalize(
                recommendation.title
              ) &&
            normalize(item.dataEngine) ===
              normalize(
                recommendation.dataEngine
              ) &&
            normalize(
              item.groupColumn
            ) ===
              normalize(
                recommendation.groupColumn
              ) &&
            normalize(
              item.valueColumn
            ) ===
              normalize(
                recommendation.valueColumn
              ) &&
            normalize(
              item.aggregation
            ) ===
              normalize(
                recommendation.aggregation
              )
          );

        }
      );


    if (exists) {

      skipped = true;

    }
    else {

      dashboardState.tables.push({

        id:
          createId("table"),

        title:
          recommendation.title,

        dataEngine:
          recommendation.dataEngine ||
          "Aggregated",

        groupColumn:
          recommendation.groupColumn ||
          "",

        valueColumn:
          recommendation.valueColumn ||
          "",

        aggregation:
          recommendation.aggregation ||
          "SUM",

        grandTotal:
          recommendation.grandTotal ||
          "Yes",

        limitData:
          recommendation.limitData ||
          "Show All",

        visualIndicator:
          recommendation.visualIndicator ||
          "None"

      });

      applied = true;

    }

  }


  else {

    setStatus(
      "Unknown advisor recommendation type"
    );

    return {
      applied: false,
      skipped: false
    };

  }


  if (applied) {

    syncKpiCount();
    syncChartCount();
    syncSlicerCount();
    syncTableCount();

    renderKpiList();
    renderChartList();
    renderSlicerList();
    renderTableList();

    updateAllUI();

    registerDashboardChange();

    setStatus(
      "Advisor recommendation applied"
    );

  }
  else if (skipped) {

    setStatus(
      "Advisor recommendation already applied"
    );

  }


  return {
    applied:
      applied,
    skipped:
      skipped
  };

}

function replaceSmartAdvisorRecommendation(
  recommendationType,
  recommendation
) {

  if (
    !recommendationType ||
    !recommendation
  ) {

    setStatus(
      "Advisor replacement is not available"
    );

    return {
      replaced: false,
      applied: false
    };

  }


  const normalize =
    function (value) {

      return String(
        value || ""
      )
        .trim()
        .toLowerCase();

    };


  let targetIndex =
    -1;


  // ==========================================================
  // KPI
  // Match same title OR same source column.
  // ==========================================================

  if (
    recommendationType ===
      "kpi"
  ) {

    targetIndex =
      dashboardState.kpis.findIndex(
        function (item) {

          return (
            normalize(
              item.title
            ) ===
              normalize(
                recommendation.title
              ) ||
            normalize(
              item.column
            ) ===
              normalize(
                recommendation.column
              )
          );

        }
      );


    if (
      targetIndex >= 0
    ) {

      const currentId =
        dashboardState
          .kpis[
            targetIndex
          ].id;


      dashboardState.kpis[
        targetIndex
      ] = {

        id:
          currentId,

        title:
          recommendation.title,

        column:
          recommendation.column,

        aggregation:
          recommendation.aggregation,

        format:
          recommendation.format ||
          "Auto",

        comparison:
          recommendation.comparison ||
          "None"

      };

    }

  }


  // ==========================================================
  // CHART
  // Match same title OR same X/Y source combination.
  // ==========================================================

  else if (
    recommendationType ===
      "chart"
  ) {

    targetIndex =
      dashboardState.charts.findIndex(
        function (item) {

          return (
            normalize(
              item.title
            ) ===
              normalize(
                recommendation.title
              ) ||
            (
              normalize(
                item.xAxis
              ) ===
                normalize(
                  recommendation.xAxis
                ) &&
              normalize(
                item.yAxis
              ) ===
                normalize(
                  recommendation.yAxis
                )
            )
          );

        }
      );


    if (
      targetIndex >= 0
    ) {

      const currentId =
        dashboardState
          .charts[
            targetIndex
          ].id;


      dashboardState.charts[
        targetIndex
      ] = {

        id:
          currentId,

        title:
          recommendation.title,

        type:
          recommendation.type,

        xAxis:
          recommendation.xAxis,

        yAxis:
          recommendation.yAxis,

        aggregation:
          recommendation.aggregation,

        secondaryYAxis:
          recommendation.secondaryYAxis ||
          "",

        secondaryAggregation:
          recommendation.secondaryAggregation ||
          "SUM",

        topBottom:
          recommendation.topBottom ||
          "Show All",

        dataLabels:
          recommendation.dataLabels ||
          "Show"

      };

    }

  }


  // ==========================================================
  // SLICER
  // Match same source column.
  // ==========================================================

  else if (
    recommendationType ===
      "slicer"
  ) {

    targetIndex =
      dashboardState.slicers.findIndex(
        function (item) {

          return (
            normalize(
              item.column
            ) ===
              normalize(
                recommendation.column
              )
          );

        }
      );


    if (
      targetIndex >= 0
    ) {

      const currentId =
        dashboardState
          .slicers[
            targetIndex
          ].id;


      const targets =
        recommendation.connectionTargets ||
        recommendation.targets ||
        {};


      dashboardState.slicers[
        targetIndex
      ] = {

        id:
          currentId,

        column:
          recommendation.column,

        title:
          recommendation.title,

        type:
          recommendation.type ||
          "Category Slicer",

        timelineGrouping:
          recommendation.timelineGrouping ||
          "Month",

        orientation:
          recommendation.orientation ||
          "Vertical",

        selectionMode:
          recommendation.selectionMode ||
          "Multi Select",

        connection:
          recommendation.connection ||
          "All Charts & KPIs",

        connectionTargets: {

          kpis:
            targets.kpis !==
            false,

          charts:
            targets.charts !==
            false,

          tables:
            targets.tables !==
            false

        }

      };

    }

  }


  // ==========================================================
  // TABLE
  // Match same title OR same group/value pair.
  // ==========================================================

  else if (
    recommendationType ===
      "table"
  ) {

    targetIndex =
      dashboardState.tables.findIndex(
        function (item) {

          return (
            normalize(
              item.title
            ) ===
              normalize(
                recommendation.title
              ) ||
            (
              normalize(
                item.groupColumn
              ) ===
                normalize(
                  recommendation.groupColumn
                ) &&
              normalize(
                item.valueColumn
              ) ===
                normalize(
                  recommendation.valueColumn
                )
            )
          );

        }
      );


    if (
      targetIndex >= 0
    ) {

      const currentId =
        dashboardState
          .tables[
            targetIndex
          ].id;


      dashboardState.tables[
        targetIndex
      ] = {

        id:
          currentId,

        title:
          recommendation.title,

        dataEngine:
          recommendation.dataEngine ||
          "Aggregated",

        groupColumn:
          recommendation.groupColumn ||
          "",

        valueColumn:
          recommendation.valueColumn ||
          "",

        aggregation:
          recommendation.aggregation ||
          "SUM",

        grandTotal:
          recommendation.grandTotal ||
          "Yes",

        limitData:
          recommendation.limitData ||
          "Show All",

        visualIndicator:
          recommendation.visualIndicator ||
          "None"

      };

    }

  }


  // ==========================================================
  // Nothing suitable exists:
  // use normal Apply so Replace remains useful.
  // ==========================================================

  if (
    targetIndex < 0
  ) {

    const applyResult =
      applySmartAdvisorRecommendation(
        recommendationType,
        recommendation
      );


    return {

      replaced: false,

      applied:
        Boolean(
          applyResult &&
          applyResult.applied
        )

    };

  }


  // ==========================================================
  // REFRESH UI
  // ==========================================================

  syncKpiCount();
  syncChartCount();
  syncSlicerCount();
  syncTableCount();

  renderKpiList();
  renderChartList();
  renderSlicerList();
  renderTableList();

  updateAllUI();

  registerDashboardChange();


  setStatus(
    "Advisor recommendation replaced"
  );


  return {
    replaced: true,
    applied: false
  };

}


// ============================================================
// APPLY SMART ADVISOR RECOMMENDATIONS
// ============================================================

function applySmartAdvisorRecommendations() {

  const advisorResult =
    dashboardState.advisorResult;

  const combined =
    advisorResult &&
    advisorResult.combined;

  const recommended =
    combined &&
    combined.recommended;


  if (!recommended) {

    setStatus(
      "No advisor recommendations available"
    );

    return {
      appliedCount: 0,
      skippedCount: 0
    };

  }


  const applied = {
    kpis: 0,
    charts: 0,
    slicers: 0,
    tables: 0
  };


  const skipped = {
    kpis: 0,
    charts: 0,
    slicers: 0,
    tables: 0
  };


  function createId(prefix) {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7)
    );

  }


  function normalize(value) {

    return String(
      value === undefined ||
      value === null
        ? ""
        : value
    )
      .trim()
      .toLowerCase();

  }


  function hasExistingKpi(
    recommendation
  ) {

    return dashboardState.kpis.some(
      function (item) {

        return (
          normalize(item.title) ===
            normalize(
              recommendation.title
            ) &&
          normalize(item.column) ===
            normalize(
              recommendation.column
            ) &&
          normalize(item.aggregation) ===
            normalize(
              recommendation.aggregation
            )
        );

      }
    );

  }


  function hasExistingChart(
    recommendation
  ) {

    return dashboardState.charts.some(
      function (item) {

        return (
          normalize(item.title) ===
            normalize(
              recommendation.title
            ) &&
          normalize(item.type) ===
            normalize(
              recommendation.type
            ) &&
          normalize(item.xAxis) ===
            normalize(
              recommendation.xAxis
            ) &&
          normalize(item.yAxis) ===
            normalize(
              recommendation.yAxis
            ) &&
          normalize(item.aggregation) ===
            normalize(
              recommendation.aggregation
            )
        );

      }
    );

  }


  function hasExistingSlicer(
    recommendation
  ) {

    return dashboardState.slicers.some(
      function (item) {

        return (
          normalize(item.column) ===
            normalize(
              recommendation.column
            ) &&
          normalize(item.type) ===
            normalize(
              recommendation.type
            ) &&
          normalize(
            item.timelineGrouping
          ) ===
            normalize(
              recommendation
                .timelineGrouping
            )
        );

      }
    );

  }


  function hasExistingTable(
    recommendation
  ) {

    return dashboardState.tables.some(
      function (item) {

        return (
          normalize(item.title) ===
            normalize(
              recommendation.title
            ) &&
          normalize(
            item.dataEngine
          ) ===
            normalize(
              recommendation.dataEngine
            ) &&
          normalize(
            item.groupColumn
          ) ===
            normalize(
              recommendation.groupColumn
            ) &&
          normalize(
            item.valueColumn
          ) ===
            normalize(
              recommendation.valueColumn
            ) &&
          normalize(
            item.aggregation
          ) ===
            normalize(
              recommendation.aggregation
            )
        );

      }
    );

  }


  const recommendedKpis =
    Array.isArray(
      recommended.kpis
    )
      ? recommended.kpis
      : [];


  recommendedKpis.forEach(
    function (recommendation) {

      if (
        !recommendation ||
        hasExistingKpi(
          recommendation
        )
      ) {

        skipped.kpis += 1;
        return;

      }


      dashboardState.kpis.push({

        id:
          createId("kpi"),

        title:
          recommendation.title,

        column:
          recommendation.column,

        aggregation:
          recommendation.aggregation,

        format:
          recommendation.format ||
          "Auto",

        comparison:
          recommendation.comparison ||
          "None"

      });


      applied.kpis += 1;

    }
  );


  const recommendedCharts =
    Array.isArray(
      recommended.charts
    )
      ? recommended.charts
      : [];


  recommendedCharts.forEach(
    function (recommendation) {

      if (
        !recommendation ||
        hasExistingChart(
          recommendation
        )
      ) {

        skipped.charts += 1;
        return;

      }


      dashboardState.charts.push({

        id:
          createId("chart"),

        title:
          recommendation.title,

        type:
          recommendation.type,

        xAxis:
          recommendation.xAxis,

        yAxis:
          recommendation.yAxis,

        aggregation:
          recommendation.aggregation,

        secondaryYAxis:
          recommendation.secondaryYAxis ||
          "",

        secondaryAggregation:
          recommendation
            .secondaryAggregation ||
          "SUM",

        topBottom:
          recommendation.topBottom ||
          "Show All",

        dataLabels:
          recommendation.dataLabels ||
          "Show"

      });


      applied.charts += 1;

    }
  );


  const recommendedSlicers =
    Array.isArray(
      recommended.slicers
    )
      ? recommended.slicers
      : [];


  recommendedSlicers.forEach(
    function (recommendation) {

      if (
        !recommendation ||
        hasExistingSlicer(
          recommendation
        )
      ) {

        skipped.slicers += 1;
        return;

      }


      const recommendationTargets =
        recommendation.connectionTargets ||
        recommendation.targets ||
        {};


      dashboardState.slicers.push({

        id:
          createId("slicer"),

        column:
          recommendation.column,

        title:
          recommendation.title,

        type:
          recommendation.type ||
          "Category Slicer",

        timelineGrouping:
          recommendation.timelineGrouping ||
          "Month",

        orientation:
          recommendation.orientation ||
          "Vertical",

        selectionMode:
          recommendation.selectionMode ||
          "Multi Select",

        connection:
          recommendation.connection ||
          "All Charts & KPIs",

        connectionTargets: {

          kpis:
            recommendationTargets.kpis !==
            false,

          charts:
            recommendationTargets.charts !==
            false,

          tables:
            recommendationTargets.tables !==
            false

        }

      });


      applied.slicers += 1;

    }
  );


  const recommendedTables =
    Array.isArray(
      recommended.tables
    )
      ? recommended.tables
      : [];


  recommendedTables.forEach(
    function (recommendation) {

      if (
        !recommendation ||
        hasExistingTable(
          recommendation
        )
      ) {

        skipped.tables += 1;
        return;

      }


      dashboardState.tables.push({

        id:
          createId("table"),

        title:
          recommendation.title,

        dataEngine:
          recommendation.dataEngine ||
          "Aggregated",

        groupColumn:
          recommendation.groupColumn ||
          "",

        valueColumn:
          recommendation.valueColumn ||
          "",

        aggregation:
          recommendation.aggregation ||
          "SUM",

        grandTotal:
          recommendation.grandTotal ||
          "Yes",

        limitData:
          recommendation.limitData ||
          "Show All",

        visualIndicator:
          recommendation
            .visualIndicator ||
          "None"

      });


      applied.tables += 1;

    }
  );


  const appliedCount =
    applied.kpis +
    applied.charts +
    applied.slicers +
    applied.tables;


  const skippedCount =
    skipped.kpis +
    skipped.charts +
    skipped.slicers +
    skipped.tables;


  if (appliedCount > 0) {

    syncKpiCount();
    syncChartCount();
    syncSlicerCount();
    syncTableCount();

    renderKpiList();
    renderChartList();
    renderSlicerList();
    renderTableList();

    updateAllUI();

    registerDashboardChange();

  }


  setStatus(
    "Advisor applied: " +
    appliedCount +
    " added, " +
    skippedCount +
    " skipped"
  );


  return {
    appliedCount:
      appliedCount,

    skippedCount:
      skippedCount,

    applied:
      applied,

    skipped:
      skipped
  };

}


// ============================================================
// DATA ENGINE
// ============================================================

function initializeEngineCards() {

  const engineCards =
    document.querySelectorAll(
      ".pd-engine-card"
    );


  engineCards.forEach(
    function (card) {

      card.addEventListener(
        "click",
        function () {

          dashboardState.dataEngine =
            card.dataset.engine;


          engineCards.forEach(
            function (item) {

              item.classList.remove(
                "selected"
              );

              const check =
                item.querySelector(
                  ".pd-engine-check"
                );

              if (check) {

                check.textContent =
                  "â—‹";

              }

            }
          );


          card.classList.add(
            "selected"
          );


          const currentCheck =
            card.querySelector(
              ".pd-engine-check"
            );


          if (currentCheck) {

            currentCheck.textContent =
              "âœ“";

          }


          setStatus(
            dashboardState.dataEngine ===
            "classic"
              ? "Smart Classic selected"
              : "Data Model selected"
          );


          updateReview();

        }
      );

    }
  );

}

let slicerCustomConnectionTargets = {
  kpis: true,
  charts: true,
  tables: true
};

// ============================================================
// UPDATE SLICER COLUMN OPTIONS
// Date Slicer / Timeline => Date columns only
// ============================================================

function updateSlicerColumnOptions() {

  const slicerColumn =
    document.getElementById(
      "slicerColumn"
    );


  const slicerType =
    document.getElementById(
      "slicerType"
    );


  if (!slicerColumn) {
    return;
  }


  const columns =
    Array.isArray(
      dashboardState.columnDefinitions
    )
      ? dashboardState.columnDefinitions
      : [];


  const currentValue =
    slicerColumn.value;


  const type =
    String(
      slicerType
        ? slicerType.value
        : "Category Slicer"
    )
      .trim()
      .toLowerCase();


  const dateOnly =
    type === "date slicer" ||
    type === "timeline";


  fillColumnSelect(
    slicerColumn,
    columns,
    "Select Column",
    function (column) {

      if (dateOnly) {

        return (
          column.type === "date"
        );

      }


      return (
        column.type === "text" ||
        column.type === "date"
      );

    }
  );


  const optionExists =
    Array.from(
      slicerColumn.options || []
    ).some(
      function (option) {

        return (
          option.value ===
          currentValue
        );

      }
    );

  if (optionExists) {

    slicerColumn.value =
      currentValue;

  }
  else {

    slicerColumn.selectedIndex =
      0;

  }


    const timelineGroupingField =
    document.getElementById(
      "timelineGroupingField"
    );

  if (timelineGroupingField) {

    timelineGroupingField.style.display =
      type === "timeline"
        ? ""
        : "none";

  }

}








// ============================================================
// SLICER CONNECTION MODE / TARGET SYNC
// ============================================================

function updateSlicerConnectionTargets() {

  const connectionSelect =
    document.getElementById(
      "slicerConnection"
    );


  const targetKpisCheckbox =
    document.getElementById(
      "slicerTargetKpis"
    );


  const targetChartsCheckbox =
    document.getElementById(
      "slicerTargetCharts"
    );


  const targetTablesCheckbox =
    document.getElementById(
      "slicerTargetTables"
    );


  if (!connectionSelect) {
    return;
  }


  const mode =
    String(
      connectionSelect.value ||
      "All Charts & KPIs"
    )
      .trim()
      .toLowerCase();


  // ==========================================================
  // CUSTOM CONNECTIONS
  // ==========================================================

  if (
    mode ===
    "custom connections"
  ) {

    if (targetKpisCheckbox) {

      targetKpisCheckbox.disabled =
        false;

      targetKpisCheckbox.checked =
        slicerCustomConnectionTargets.kpis;

    }


    if (targetChartsCheckbox) {

      targetChartsCheckbox.disabled =
        false;

      targetChartsCheckbox.checked =
        slicerCustomConnectionTargets.charts;

    }


    if (targetTablesCheckbox) {

      targetTablesCheckbox.disabled =
        false;

      targetTablesCheckbox.checked =
        slicerCustomConnectionTargets.tables;

    }


    return;

  }


  // ==========================================================
  // ALL CHARTS & KPIs
  // ==========================================================

  if (
    mode ===
    "all charts & kpis"
  ) {

    if (targetKpisCheckbox) {
      targetKpisCheckbox.checked =
        true;
    }


    if (targetChartsCheckbox) {
      targetChartsCheckbox.checked =
        true;
    }


    if (targetTablesCheckbox) {
      targetTablesCheckbox.checked =
        false;
    }

  }


  // ==========================================================
  // ALL DASHBOARD OBJECTS
  // ==========================================================

  else if (
    mode ===
    "all dashboard objects"
  ) {

    if (targetKpisCheckbox) {
      targetKpisCheckbox.checked =
        true;
    }


    if (targetChartsCheckbox) {
      targetChartsCheckbox.checked =
        true;
    }


    if (targetTablesCheckbox) {
      targetTablesCheckbox.checked =
        true;
    }

  }


  // ==========================================================
  // PRESET MODES = READ ONLY
  // ==========================================================

  if (targetKpisCheckbox) {
    targetKpisCheckbox.disabled =
      true;
  }


  if (targetChartsCheckbox) {
    targetChartsCheckbox.disabled =
      true;
  }


  if (targetTablesCheckbox) {
    targetTablesCheckbox.disabled =
      true;
  }

}



// ============================================================
// BUILDER BUTTONS
// ============================================================

function initializeBuilderButtons() {

  const addKpiButton =
    document.getElementById(
      "addKpiBtn"
    );

  const saveKpiButton =
    document.getElementById(
      "saveKpiBtn"
    );

  const resetKpiButton =
    document.getElementById(
      "resetKpiBtn"
    );

  const addSlicerButton =
    document.getElementById(
      "addSlicerBtn"
    );

    const slicerConnectionSelect =
  document.getElementById(
    "slicerConnection"
  );

  const slicerTargetKpis =
  document.getElementById(
    "slicerTargetKpis"
  );

const slicerTargetCharts =
  document.getElementById(
    "slicerTargetCharts"
  );

const slicerTargetTables =
  document.getElementById(
    "slicerTargetTables"
  );


function saveCustomSlicerTargets() {

  const connectionSelect =
    document.getElementById(
      "slicerConnection"
    );


  if (
    !connectionSelect ||
    String(
      connectionSelect.value || ""
    )
      .trim()
      .toLowerCase() !==
      "custom connections"
  ) {

    return;

  }


  slicerCustomConnectionTargets = {

    kpis:
      slicerTargetKpis
        ? slicerTargetKpis.checked
        : true,

    charts:
      slicerTargetCharts
        ? slicerTargetCharts.checked
        : true,

    tables:
      slicerTargetTables
        ? slicerTargetTables.checked
        : true

  };

}


if (slicerTargetKpis) {
  slicerTargetKpis.addEventListener(
    "change",
    saveCustomSlicerTargets
  );
}


if (slicerTargetCharts) {
  slicerTargetCharts.addEventListener(
    "change",
    saveCustomSlicerTargets
  );
}


if (slicerTargetTables) {
  slicerTargetTables.addEventListener(
    "change",
    saveCustomSlicerTargets
  );
}


if (
  slicerConnectionSelect
) {

  slicerConnectionSelect.addEventListener(
    "change",
    function () {

      updateSlicerConnectionTargets();

    }
  );


  updateSlicerConnectionTargets();

}



  // ==========================================================
  // NEW KPI
  // ==========================================================

  if (addKpiButton) {

    addKpiButton.addEventListener(
      "click",
      function () {

        resetKpiForm();

        const titleInput =
          document.getElementById(
            "kpiTitle"
          );

        if (titleInput) {
          titleInput.focus();
        }

        setStatus(
          "Ready to configure a new KPI"
        );

      }
    );

  }


  // ==========================================================
  // SAVE KPI
  // ==========================================================

  if (saveKpiButton) {

    saveKpiButton.addEventListener(
      "click",
      function () {

        addKpiToDashboard();

      }
    );

  }


  // ==========================================================
  // RESET KPI FORM
  // ==========================================================

  if (resetKpiButton) {

    resetKpiButton.addEventListener(
      "click",
      function () {

        resetKpiForm();

        setStatus(
          "KPI configuration reset"
        );

      }
    );

  }

  

  // ==========================================================
  // SLICER BUILDER BUTTONS
  // ==========================================================

  const saveSlicerButton =
    document.getElementById(
      "saveSlicerBtn"
    );

  const previewSlicerButton =
    document.getElementById(
      "previewSlicerBtn"
    );


  if (addSlicerButton) {

    addSlicerButton.addEventListener(
      "click",
      function () {

        resetSlicerForm();

        const titleInput =
          document.getElementById(
            "slicerTitle"
          );

        if (titleInput) {
          titleInput.focus();
        }

        setStatus(
          "Ready to configure a new slicer"
        );

      }
    );

  }


  if (saveSlicerButton) {

    saveSlicerButton.addEventListener(
      "click",
      function () {

        addSlicerToDashboard();

      }
    );

  }


  if (previewSlicerButton) {

    previewSlicerButton.addEventListener(
      "click",
      function () {

        previewSlicerConfiguration();

      }
    );

  }
  // ==========================================================
  // CHART BUILDER BUTTONS
  // ==========================================================

  const addChartButton =
    document.getElementById(
      "addChartBtn"
    );

  const saveChartButton =
    document.getElementById(
      "saveChartBtn"
    );

  const resetChartButton =
  document.getElementById(
    "resetChartBtn"
  );


const chartTypeSelect =
  document.getElementById(
    "chartType"
  );


// ==========================================================
// COMBO CHART FIELD VISIBILITY
// ==========================================================

if (chartTypeSelect) {

  chartTypeSelect.addEventListener(
  "change",
  function () {

    updateComboChartFields();

    updateChartAxisColumnOptions();
    

  }
);

}


// Set correct initial state
updateComboChartFields();


// ==========================================================
// NEW CHART
// ==========================================================

  if (addChartButton) {

    addChartButton.addEventListener(
      "click",
      function () {

        resetChartForm();

        const titleInput =
          document.getElementById(
            "chartTitle"
          );

        if (titleInput) {
          titleInput.focus();
        }

        setStatus(
          "Ready to configure a new chart"
        );

      }
    );

  }


  // ==========================================================
  // SAVE CHART
  // ==========================================================

  if (saveChartButton) {

    saveChartButton.addEventListener(
      "click",
      function () {

        addChartToDashboard();

      }
    );

  }


  // ==========================================================
  // RESET CHART
  // ==========================================================

  if (resetChartButton) {

    resetChartButton.addEventListener(
      "click",
      function () {

        resetChartForm();

        setStatus(
          "Chart configuration reset"
        );

      }
    );

  }

    // ==========================================================
  // SMART TABLE BUILDER BUTTONS
  // ==========================================================

  const addTableButton =
    document.getElementById(
      "addTableBtn"
    );

  const saveTableButton =
    document.getElementById(
      "saveTableBtn"
    );

  const resetTableButton =
    document.getElementById(
      "resetTableBtn"
    );


  if (addTableButton) {

    addTableButton.addEventListener(
      "click",
      function () {

        resetTableForm();

        const titleInput =
          document.getElementById(
            "tableTitle"
          );

        if (titleInput) {
          titleInput.focus();
        }

        setStatus(
          "Ready to configure a new smart table"
        );

      }
    );

  }


  if (saveTableButton) {

    saveTableButton.addEventListener(
      "click",
      function () {

        addTableToDashboard();

      }
    );

  }


  if (resetTableButton) {

    resetTableButton.addEventListener(
      "click",
      function () {

        resetTableForm();

        setStatus(
          "Smart table configuration reset"
        );

      }
    );

  }


    // Initial builder list render.

  renderKpiList();

  renderChartList();

  renderSlicerList();

}

// ============================================================
// KPI BUILDER ENGINE
// ============================================================

function addKpiToDashboard() {

  const titleInput =
    document.getElementById(
      "kpiTitle"
    );

  const columnSelect =
    document.getElementById(
      "kpiColumn"
    );

  const aggregationSelect =
    document.getElementById(
      "kpiAggregation"
    );

  const formatSelect =
    document.getElementById(
      "kpiFormat"
    );

  const comparisonSelect =
    document.getElementById(
      "kpiComparison"
    );


  const title =
    titleInput
      ? titleInput.value.trim()
      : "";

  const column =
    columnSelect
      ? columnSelect.value
      : "";

  const aggregation =
    aggregationSelect
      ? aggregationSelect.value
      : "SUM";

  const format =
    formatSelect
      ? formatSelect.value
      : "Auto";

  const comparison =
    comparisonSelect
      ? comparisonSelect.value
      : "None";


  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!title) {

    setStatus(
      "Enter a KPI title"
    );

    if (titleInput) {
      titleInput.focus();
    }

    return;
  }


  if (!column) {

    setStatus(
      "Select a value column for the KPI"
    );

    if (columnSelect) {
      columnSelect.focus();
    }

    return;
  }


  // ==========================================================
  // CREATE KPI OBJECT
  // ==========================================================

  const kpi = {

    id:
      "kpi_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    title:
      title,

    column:
      column,

    aggregation:
      aggregation,

    format:
      format,

    comparison:
      comparison

  };


const editingKpiId =
  dashboardState.editingKpiId;


let kpiAction =
  "added";


if (
  editingKpiId
) {

  const editingIndex =
    dashboardState.kpis.findIndex(
      function (item) {
        return (
          item.id ===
          editingKpiId
        );
      }
    );


  if (
    editingIndex !== -1
  ) {

    kpi.id =
      editingKpiId;


    dashboardState.kpis[
      editingIndex
    ] =
      kpi;


    kpiAction =
      "updated";

  }
  else {

    dashboardState.kpis.push(
      kpi
    );

  }


  dashboardState.editingKpiId =
    null;

}
else {

  dashboardState.kpis.push(
    kpi
  );

}


syncKpiCount();

renderKpiList();

updateAllUI();

resetKpiForm();


registerDashboardChange();


setStatus(
  '"' +
  kpi.title +
  '" ' +
  kpiAction
);

}


// ============================================================
// KPI COUNT
// ============================================================

function syncKpiCount() {

  dashboardState.counts.kpis =
    dashboardState.kpis.length;

}


// ============================================================
// RESET KPI FORM
// ============================================================

function resetKpiForm() {

  const titleInput =
    document.getElementById(
      "kpiTitle"
    );

  const columnSelect =
    document.getElementById(
      "kpiColumn"
    );

  const aggregationSelect =
    document.getElementById(
      "kpiAggregation"
    );

  const formatSelect =
    document.getElementById(
      "kpiFormat"
    );

  const comparisonSelect =
    document.getElementById(
      "kpiComparison"
    );


  if (titleInput) {
    titleInput.value = "";
  }


  if (columnSelect) {
    columnSelect.selectedIndex = 0;
  }


  if (aggregationSelect) {
    aggregationSelect.value = "SUM";
  }


  if (formatSelect) {
    formatSelect.value = "Currency";
  }


  if (comparisonSelect) {
    comparisonSelect.value = "None";
  }

}


// ============================================================
// RENDER KPI LIST
// ============================================================

function renderKpiList() {

  const container =
    document.getElementById(
      "kpiList"
    );

  const countElement =
    document.getElementById(
      "kpiListCount"
    );


  if (!container) {
    return;
  }


  syncKpiCount();


  if (countElement) {

    countElement.textContent =
      dashboardState.kpis.length +
      (
        dashboardState.kpis.length === 1
          ? " KPI"
          : " KPIs"
      );

  }


  container.innerHTML = "";


  if (
    dashboardState.kpis.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "pd-empty-state";

    empty.textContent =
      "No KPIs added yet.";

    container.appendChild(
      empty
    );

    return;
  }


  dashboardState.kpis.forEach(
    function (kpi, index) {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "pd-kpi-list-item";


      // -------------------------------------------------------
      // INFO
      // -------------------------------------------------------

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "pd-kpi-list-info";


      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        (index + 1) +
        ". " +
        kpi.title;


      const details =
        document.createElement(
          "div"
        );

      details.className =
        "pd-kpi-list-details";

      details.textContent =
        kpi.column +
        " â€¢ " +
        kpi.aggregation +
        " â€¢ " +
        kpi.format +
        (
          kpi.comparison !== "None"
            ? " â€¢ " +
              kpi.comparison
            : ""
        );


      info.appendChild(
        title
      );

      info.appendChild(
        details
      );


      // -------------------------------------------------------
      // ACTIONS
      // -------------------------------------------------------

      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "pd-kpi-list-actions";


      const editButton =
        createKpiActionButton(
          "Edit",
          function () {
            editKpi(kpi.id);
          }
        );


      const duplicateButton =
        createKpiActionButton(
          "Duplicate",
          function () {
            duplicateKpi(kpi.id);
          }
        );


      const deleteButton =
        createKpiActionButton(
          "Delete",
          function () {
            deleteKpi(kpi.id);
          }
        );


      


      actions.appendChild(
        editButton
      );

      actions.appendChild(
        duplicateButton
      );

      actions.appendChild(
        deleteButton
      );


      item.appendChild(
        info
      );

      item.appendChild(
        actions
      );


      container.appendChild(
        item
      );

    }
  );

}


// ============================================================
// KPI ACTION BUTTON
// ============================================================

function createKpiActionButton(
  text,
  handler
) {

  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "pd-btn pd-btn-outline";

  button.textContent =
    text;

  button.addEventListener(
    "click",
    handler
  );

  return button;

}


// ============================================================
// EDIT KPI
// ============================================================

function editKpi(id) {

  const index =
    dashboardState.kpis.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const kpi =
    dashboardState.kpis[index];


  const titleInput =
    document.getElementById(
      "kpiTitle"
    );

  const columnSelect =
    document.getElementById(
      "kpiColumn"
    );

  const aggregationSelect =
    document.getElementById(
      "kpiAggregation"
    );

  const formatSelect =
    document.getElementById(
      "kpiFormat"
    );

  const comparisonSelect =
    document.getElementById(
      "kpiComparison"
    );


  if (titleInput) {
    titleInput.value =
      kpi.title;
  }

  if (columnSelect) {
    columnSelect.value =
      kpi.column;
  }

  if (aggregationSelect) {
    aggregationSelect.value =
      kpi.aggregation;
  }

  if (formatSelect) {
    formatSelect.value =
      kpi.format;
  }

  if (comparisonSelect) {
    comparisonSelect.value =
      kpi.comparison;
  }


  // Keep the existing KPI in state while editing.
// It will be updated when the user saves the KPI again.

dashboardState.editingKpiId =
  kpi.id;


  syncKpiCount();

  renderKpiList();

  updateAllUI();


  setStatus(
    'Editing "' +
    kpi.title +
    '"'
  );

}


// ============================================================
// DUPLICATE KPI
// ============================================================

function duplicateKpi(id) {

  const source =
    dashboardState.kpis.find(
      function (item) {
        return item.id === id;
      }
    );


  if (!source) {
    return;
  }


  const copy = {

    ...source,

    id:
      "kpi_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    title:
      source.title +
      " Copy"

  };


  dashboardState.kpis.push(
    copy
  );


  syncKpiCount();

  renderKpiList();

  updateAllUI();

  registerDashboardChange();


  setStatus(
    '"' +
    source.title +
    '" duplicated'
  );

}


// ============================================================
// DELETE KPI
// ============================================================

function deleteKpi(id) {

  const index =
    dashboardState.kpis.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const removed =
    dashboardState.kpis[index];


  dashboardState.kpis.splice(
    index,
    1
  );


  syncKpiCount();

  renderKpiList();

  updateAllUI();

  registerDashboardChange();

  setStatus(
    '"' +
    removed.title +
    '" removed'
  );

}


// ============================================================
// COMBO CHART FIELD VISIBILITY
// ============================================================

function updateComboChartFields() {

  const chartTypeSelect =
    document.getElementById(
      "chartType"
    );

  const secondaryYAxisField =
    document.getElementById(
      "comboSecondaryYAxisField"
    );

  const secondaryAggregationField =
    document.getElementById(
      "comboSecondaryAggregationField"
    );


  const isCombo =
    chartTypeSelect &&
    String(
      chartTypeSelect.value || ""
    )
      .trim()
      .toLowerCase() ===
      "combo";


  if (secondaryYAxisField) {

    secondaryYAxisField.hidden =
      !isCombo;

  }


  if (secondaryAggregationField) {

    secondaryAggregationField.hidden =
      !isCombo;

  }

}


// ============================================================
// CHART BUILDER ENGINE
// ============================================================

function addChartToDashboard() {

  const titleInput =
    document.getElementById(
      "chartTitle"
    );

  const typeSelect =
    document.getElementById(
      "chartType"
    );

  const xAxisSelect =
    document.getElementById(
      "chartXAxis"
    );

  const yAxisSelect =
    document.getElementById(
      "chartYAxis"
    );

const aggregationSelect =
  document.getElementById(
    "chartAggregation"
  );


const secondaryYAxisSelect =
  document.getElementById(
    "chartSecondaryYAxis"
  );


const secondaryAggregationSelect =
  document.getElementById(
    "chartSecondaryAggregation"
  );


const topBottomSelect =
    document.getElementById(
      "chartTopBottom"
    );

  const dataLabelsSelect =
    document.getElementById(
      "chartDataLabels"
    );


  const title =
    titleInput
      ? titleInput.value.trim()
      : "";

  const chartType =
    typeSelect
      ? typeSelect.value
      : "Column";

  const xAxis =
    xAxisSelect
      ? xAxisSelect.value
      : "";

  const yAxis =
    yAxisSelect
      ? yAxisSelect.value
      : "";

  const aggregation =
  aggregationSelect
    ? aggregationSelect.value
    : "SUM";


const secondaryYAxis =
  secondaryYAxisSelect
    ? secondaryYAxisSelect.value
    : "";


const secondaryAggregation =
  secondaryAggregationSelect
    ? secondaryAggregationSelect.value
    : "SUM";


const topBottom =
    topBottomSelect
      ? topBottomSelect.value
      : "Show All";

  const dataLabels =
    dataLabelsSelect
      ? dataLabelsSelect.value
      : "Show";


  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!title) {

    setStatus(
      "Enter a chart title"
    );

    if (titleInput) {
      titleInput.focus();
    }

    return;
  }


  if (!xAxis) {

    setStatus(
      "Select an X Axis column"
    );

    if (xAxisSelect) {
      xAxisSelect.focus();
    }

    return;
  }


  if (!yAxis) {

    setStatus(
      "Select a Y Axis column"
    );

    if (yAxisSelect) {
      yAxisSelect.focus();
    }

    return;
  }

  // ==========================================================
// COMBO CHART VALIDATION
// ==========================================================

if (
  String(
    chartType
  )
    .trim()
    .toLowerCase() ===
    "combo"
) {

  if (!secondaryYAxis) {

    setStatus(
      "Select a Secondary Y Axis column"
    );


    if (secondaryYAxisSelect) {

      secondaryYAxisSelect.focus();

    }


    return;

  }

}


  // ==========================================================
  // CREATE CHART OBJECT
  // ==========================================================

  const chart = {

    id:
      "chart_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    title:
      title,

    type:
      chartType,

    xAxis:
      xAxis,

    yAxis:
  yAxis,

aggregation:
  aggregation,

secondaryYAxis:
  secondaryYAxis,

secondaryAggregation:
  secondaryAggregation,

topBottom:
      topBottom,

    dataLabels:
      dataLabels

  };


const editingChartId =
  dashboardState.editingChartId;


let chartAction =
  "added";


if (
  editingChartId
) {

  const editingIndex =
    dashboardState.charts.findIndex(
      function (item) {
        return (
          item.id ===
          editingChartId
        );
      }
    );


  if (
    editingIndex !== -1
  ) {

    chart.id =
      editingChartId;


    dashboardState.charts[
      editingIndex
    ] =
      chart;


    chartAction =
      "updated";

  }
  else {

    dashboardState.charts.push(
      chart
    );

  }


  dashboardState.editingChartId =
    null;

}
else {

  dashboardState.charts.push(
    chart
  );

}


syncChartCount();

renderChartList();

updateAllUI();

resetChartForm();


registerDashboardChange();


setStatus(
  '"' +
  chart.title +
  '" ' +
  chartAction
);

}


// ============================================================
// CHART COUNT
// ============================================================

function syncChartCount() {

  dashboardState.counts.charts =
    dashboardState.charts.length;

}


// ============================================================
// RESET CHART FORM
// ============================================================

function resetChartForm() {

  const titleInput =
    document.getElementById(
      "chartTitle"
    );

  const typeSelect =
    document.getElementById(
      "chartType"
    );

  const xAxisSelect =
    document.getElementById(
      "chartXAxis"
    );

  const yAxisSelect =
    document.getElementById(
      "chartYAxis"
    );

  const aggregationSelect =
  document.getElementById(
    "chartAggregation"
  );


const secondaryYAxisSelect =
  document.getElementById(
    "chartSecondaryYAxis"
  );


const secondaryAggregationSelect =
  document.getElementById(
    "chartSecondaryAggregation"
  );


const topBottomSelect =
    document.getElementById(
      "chartTopBottom"
    );

  const dataLabelsSelect =
    document.getElementById(
      "chartDataLabels"
    );


  if (titleInput) {
    titleInput.value = "";
  }


  if (typeSelect) {
    typeSelect.value = "Line";
  }


  if (xAxisSelect) {
    xAxisSelect.selectedIndex = 0;
  }


  if (yAxisSelect) {
    yAxisSelect.selectedIndex = 0;
  }


  if (aggregationSelect) {
    aggregationSelect.value = "SUM";
  }

  if (secondaryYAxisSelect) {

  secondaryYAxisSelect.selectedIndex =
    0;

}


if (secondaryAggregationSelect) {

  secondaryAggregationSelect.value =
    "SUM";

}


  if (topBottomSelect) {
    topBottomSelect.value =
      "Show All";
  }


  if (dataLabelsSelect) {
    dataLabelsSelect.value =
      "Show";
  }

    updateComboChartFields();
}


// ============================================================
// RENDER CHART LIST
// ============================================================

function renderChartList() {

  const container =
    document.getElementById(
      "chartList"
    );

  const countElement =
    document.getElementById(
      "chartListCount"
    );


  if (!container) {
    return;
  }


  syncChartCount();


  if (countElement) {

    countElement.textContent =
      dashboardState.charts.length +
      (
        dashboardState.charts.length === 1
          ? " Chart"
          : " Charts"
      );

  }


  container.innerHTML = "";


  if (
    dashboardState.charts.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "pd-empty-state";

    empty.textContent =
      "No charts added yet.";

    container.appendChild(
      empty
    );

    return;
  }


  dashboardState.charts.forEach(
    function (chart, index) {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "pd-kpi-list-item";


      // -------------------------------------------------------
      // CHART INFO
      // -------------------------------------------------------

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "pd-kpi-list-info";


      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        (index + 1) +
        ". " +
        chart.title;


      const details =
        document.createElement(
          "div"
        );

      details.className =
        "pd-kpi-list-details";

      details.textContent =
        chart.type +
        " â€¢ " +
        chart.xAxis +
        " â†’ " +
        chart.yAxis +
        " â€¢ " +
        chart.aggregation +
        (
          chart.topBottom !==
          "Show All"
            ? " â€¢ " +
              chart.topBottom
            : ""
        ) +
        " â€¢ Labels: " +
        chart.dataLabels;


      info.appendChild(
        title
      );

      info.appendChild(
        details
      );


      // -------------------------------------------------------
      // ACTION BUTTONS
      // -------------------------------------------------------

      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "pd-kpi-list-actions";


      const editButton =
        createChartActionButton(
          "Edit",
          function () {
            editChart(
              chart.id
            );
          }
        );


      const duplicateButton =
        createChartActionButton(
          "Duplicate",
          function () {
            duplicateChart(
              chart.id
            );
          }
        );


      const deleteButton =
        createChartActionButton(
          "Delete",
          function () {
            deleteChart(
              chart.id
            );
          }
        );


      actions.appendChild(
        editButton
      );

      actions.appendChild(
        duplicateButton
      );

      actions.appendChild(
        deleteButton
      );


      item.appendChild(
        info
      );

      item.appendChild(
        actions
      );


      container.appendChild(
        item
      );

    }
  );

}


// ============================================================
// CHART ACTION BUTTON
// ============================================================

function createChartActionButton(
  text,
  handler
) {

  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "pd-btn pd-btn-outline";

  button.textContent =
    text;

  button.addEventListener(
    "click",
    handler
  );

  return button;

}


// ============================================================
// EDIT CHART
// ============================================================

function editChart(id) {

  const index =
    dashboardState.charts.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const chart =
    dashboardState.charts[index];


  const titleInput =
    document.getElementById(
      "chartTitle"
    );

  const typeSelect =
    document.getElementById(
      "chartType"
    );

  const xAxisSelect =
    document.getElementById(
      "chartXAxis"
    );

  const yAxisSelect =
    document.getElementById(
      "chartYAxis"
    );

  const aggregationSelect =
  document.getElementById(
    "chartAggregation"
  );


const secondaryYAxisSelect =
  document.getElementById(
    "chartSecondaryYAxis"
  );


const secondaryAggregationSelect =
  document.getElementById(
    "chartSecondaryAggregation"
  );


const topBottomSelect =
    document.getElementById(
      "chartTopBottom"
    );

  const dataLabelsSelect =
    document.getElementById(
      "chartDataLabels"
    );


  if (titleInput) {
    titleInput.value =
      chart.title;
  }


  if (typeSelect) {
    typeSelect.value =
      chart.type;
  }


  if (xAxisSelect) {
    xAxisSelect.value =
      chart.xAxis;
  }


  if (yAxisSelect) {
    yAxisSelect.value =
      chart.yAxis;
  }


  if (aggregationSelect) {
  aggregationSelect.value =
    chart.aggregation;
}


if (secondaryYAxisSelect) {

  secondaryYAxisSelect.value =
    chart.secondaryYAxis ||
    "";

}


if (secondaryAggregationSelect) {

  secondaryAggregationSelect.value =
    chart.secondaryAggregation ||
    "SUM";

}


if (topBottomSelect) {
    topBottomSelect.value =
      chart.topBottom;
  }


  if (dataLabelsSelect) {
  dataLabelsSelect.value =
    chart.dataLabels;
}


updateComboChartFields();


// Keep the existing chart in state while editing.
// It will be updated when the user saves the chart again.

dashboardState.editingChartId =
  chart.id;


syncChartCount();

renderChartList();

updateAllUI();

}

// ============================================================
// DUPLICATE CHART
// ============================================================

function duplicateChart(id) {

  const source =
  dashboardState.charts.find(
    function (item) {
      return item.id === id;
    }
  );


  if (!source) {
    return;
  }


  const copy = {

    ...source,

    id:
      "chart_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    title:
      source.title +
      " Copy"

  };


  dashboardState.charts.push(
    copy
  );


  syncChartCount();

  renderChartList();

  updateAllUI();

  registerDashboardChange();


  setStatus(
    '"' +
    source.title +
    '" duplicated'
  );

}


// ============================================================
// DELETE CHART
// ============================================================

function deleteChart(id) {

  const index =
    dashboardState.charts.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const removed =
    dashboardState.charts[index];


  dashboardState.charts.splice(
    index,
    1
  );


  syncChartCount();

  renderChartList();

  updateAllUI();

  registerDashboardChange();


  setStatus(
    '"' +
    removed.title +
    '" removed'
  );

}

// ============================================================
// SLICER BUILDER ENGINE
// ============================================================

function addSlicerToDashboard() {



  const columnSelect =
    document.getElementById(
      "slicerColumn"
    );

  const titleInput =
    document.getElementById(
      "slicerTitle"
    );

      const typeSelect =
    document.getElementById(
      "slicerType"
    );


  const timelineGroupingSelect =
    document.getElementById(
      "timelineGrouping"
    );


  const orientationSelect =
    document.getElementById(
      "slicerOrientation"
    );


  const selectionModeSelect =
    document.getElementById(
      "slicerSelectionMode"
    );


  const connectionSelect =
    document.getElementById(
      "slicerConnection"
    );


  const targetKpisCheckbox =
    document.getElementById(
      "slicerTargetKpis"
    );


  const targetChartsCheckbox =
    document.getElementById(
      "slicerTargetCharts"
    );


  const targetTablesCheckbox =
    document.getElementById(
      "slicerTargetTables"
    );


  const column =
    columnSelect
      ? columnSelect.value
      : "";


  const title =
    titleInput
      ? titleInput.value.trim()
      : "";


  const type =
    typeSelect
      ? typeSelect.value
      : "Category Slicer";


  const timelineGrouping =
    timelineGroupingSelect
      ? timelineGroupingSelect.value
      : "Month";


  const orientation =
    orientationSelect
      ? orientationSelect.value
      : "Vertical";

  const selectionMode =
    selectionModeSelect
      ? selectionModeSelect.value
      : "Multi Select";

  const connection =
  connectionSelect
    ? connectionSelect.value
    : "All Charts & KPIs";


const connectionTargets = {

  kpis:
    targetKpisCheckbox
      ? targetKpisCheckbox.checked
      : true,

  charts:
    targetChartsCheckbox
      ? targetChartsCheckbox.checked
      : true,

  tables:
    targetTablesCheckbox
      ? targetTablesCheckbox.checked
      : true

};


  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (
    !column ||
    column === "Select Column"
  ) {

    setStatus(
      "Select a slicer column"
    );

    if (columnSelect) {
      columnSelect.focus();
    }

    return;
  }


  if (!title) {

    setStatus(
      "Enter a slicer title"
    );

    if (titleInput) {
      titleInput.focus();
    }

    return;
  }


  // ==========================================================
  // CREATE SLICER OBJECT
  // ==========================================================

  const slicer = {

    id:
      "slicer_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    column:
      column,

    title:
      title,

        type:
      type,

    timelineGrouping:
      timelineGrouping,

    orientation:
      orientation,

    selectionMode:
  selectionMode,

connection:
  connection,

connectionTargets:
  connectionTargets

  };


const editingSlicerId =
  dashboardState.editingSlicerId;


let slicerAction =
  "added";


if (
  editingSlicerId
) {

  const editingIndex =
    dashboardState.slicers.findIndex(
      function (item) {
        return (
          item.id ===
          editingSlicerId
        );
      }
    );


if (
  editingIndex !== -1
) {

  const previousSlicer =
    dashboardState.slicers[
      editingIndex
    ];


  const previousColumn =
    previousSlicer
      ? String(
          previousSlicer.column ||
          ""
        ).trim()
      : "";


  const nextColumn =
    String(
      slicer.column ||
      ""
    ).trim();


  slicer.id =
    editingSlicerId;


  dashboardState.slicers[
    editingIndex
  ] =
    slicer;


  // ========================================================
  // CLEAN OLD FILTER IF SLICER COLUMN CHANGED
  // ========================================================

  if (
    previousColumn &&
    previousColumn !==
      nextColumn &&
    dashboardState.activeFilters &&
    typeof dashboardState.activeFilters ===
      "object"
  ) {

    const oldColumnStillUsed =
      dashboardState.slicers.some(
        function (item) {

          return (
            item &&
            item.id !==
              editingSlicerId &&
            String(
              item.column ||
              ""
            ).trim() ===
              previousColumn
          );

        }
      );


    if (
      !oldColumnStillUsed
    ) {

      delete dashboardState.activeFilters[
        previousColumn
      ];

    }

  }


  slicerAction =
    "updated";

}
  else {

    dashboardState.slicers.push(
      slicer
    );

  }


  dashboardState.editingSlicerId =
    null;

}
else {

  dashboardState.slicers.push(
    slicer
  );

}


syncSlicerCount();

renderSlicerList();

updateAllUI();

resetSlicerForm();


registerDashboardChange();


setStatus(
  '"' +
  slicer.title +
  '" ' +
  slicerAction
);

}


// ============================================================
// SLICER COUNT
// ============================================================

function syncSlicerCount() {

  dashboardState.counts.slicers =
    dashboardState.slicers.length;

}


// ============================================================
// RESET SLICER FORM
// ============================================================

function resetSlicerForm() {

  const columnSelect =
    document.getElementById(
      "slicerColumn"
    );

  const titleInput =
    document.getElementById(
      "slicerTitle"
    );

    const typeSelect =
    document.getElementById(
      "slicerType"
    );


  const timelineGroupingSelect =
    document.getElementById(
      "timelineGrouping"
    );


  const orientationSelect =
    document.getElementById(
      "slicerOrientation"
    );

    const selectionModeSelect =
  document.getElementById(
    "slicerSelectionMode"
  );


const connectionSelect =
  document.getElementById(
    "slicerConnection"
  );


const targetKpisCheckbox =
  document.getElementById(
    "slicerTargetKpis"
  );


const targetChartsCheckbox =
  document.getElementById(
    "slicerTargetCharts"
  );


const targetTablesCheckbox =
  document.getElementById(
    "slicerTargetTables"
  );


  if (columnSelect) {
    columnSelect.selectedIndex = 0;
  }


  if (titleInput) {
    titleInput.value = "";
  }


  if (typeSelect) {
    typeSelect.value =
      "Category Slicer";
  }

  updateSlicerColumnOptions();

    if (timelineGroupingSelect) {
    timelineGroupingSelect.value =
      "Month";
  }


  if (orientationSelect) {
    orientationSelect.value =
      "Vertical";
  }


  if (selectionModeSelect) {
    selectionModeSelect.value =
      "Multi Select";
  }


  if (connectionSelect) {
  connectionSelect.value =
    "All Charts & KPIs";
}


if (targetKpisCheckbox) {
  targetKpisCheckbox.checked =
    true;
}


if (targetChartsCheckbox) {
  targetChartsCheckbox.checked =
    true;
}


if (targetTablesCheckbox) {
  targetTablesCheckbox.checked =
    true;
}


updateSlicerConnectionTargets();


const saveSlicerButton =
  document.getElementById(
    "saveSlicerBtn"
  );


if (saveSlicerButton) {

  saveSlicerButton.textContent =
    "Add Slicer to Dashboard";

}


dashboardState.editingSlicerId =
  null;

}


// ============================================================
// PREVIEW SLICER
// ============================================================

function previewSlicerConfiguration() {

  const columnSelect =
    document.getElementById(
      "slicerColumn"
    );

  const titleInput =
    document.getElementById(
      "slicerTitle"
    );

    const typeSelect =
    document.getElementById(
      "slicerType"
    );


  const timelineGroupingSelect =
    document.getElementById(
      "timelineGrouping"
    );


  const orientationSelect =
    document.getElementById(
      "slicerOrientation"
    );


  const column =
    columnSelect
      ? columnSelect.value
      : "";

  const title =
    titleInput
      ? titleInput.value.trim()
      : "";

  const type =
    typeSelect
      ? typeSelect.value
      : "";

  const orientation =
    orientationSelect
      ? orientationSelect.value
      : "";


  if (
    !column ||
    column === "Select Column"
  ) {

    setStatus(
      "Select a slicer column first"
    );

    return;
  }


  setStatus(
    "Preview: " +
    (title || column) +
    " â€¢ " +
    type +
    " â€¢ " +
    orientation
  );

}


// ============================================================
// RENDER SLICER LIST
// ============================================================

function renderSlicerList() {

  const container =
    document.getElementById(
      "slicerList"
    );

  const countElement =
    document.getElementById(
      "slicerListCount"
    );


  if (!container) {
    return;
  }


  syncSlicerCount();


  if (countElement) {

    countElement.textContent =
      dashboardState.slicers.length +
      (
        dashboardState.slicers.length === 1
          ? " Slicer"
          : " Slicers"
      );

  }


  container.innerHTML = "";


  if (
    dashboardState.slicers.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "pd-empty-state";

    empty.textContent =
      "No slicers added yet.";

    container.appendChild(
      empty
    );

    return;
  }


  dashboardState.slicers.forEach(
    function (slicer, index) {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "pd-kpi-list-item";


      const info =
        document.createElement(
          "div"
        );

      info.className =
        "pd-kpi-list-info";


      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        (index + 1) +
        ". " +
        slicer.title;


      const details =
        document.createElement(
          "div"
        );

      details.className =
        "pd-kpi-list-details";

      details.textContent =
        slicer.column +
        " â€¢ " +
        slicer.type +
        " â€¢ " +
        slicer.orientation +
        " â€¢ " +
        slicer.selectionMode;


      info.appendChild(
        title
      );

      info.appendChild(
        details
      );


      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "pd-kpi-list-actions";


      const editButton =
        createSlicerActionButton(
          "Edit",
          function () {
            editSlicer(
              slicer.id
            );
          }
        );


      const duplicateButton =
        createSlicerActionButton(
          "Duplicate",
          function () {
            duplicateSlicer(
              slicer.id
            );
          }
        );


      const deleteButton =
        createSlicerActionButton(
          "Delete",
          function () {
            deleteSlicer(
              slicer.id
            );
          }
        );


      actions.appendChild(
        editButton
      );

      actions.appendChild(
        duplicateButton
      );

      actions.appendChild(
        deleteButton
      );


      item.appendChild(
        info
      );

      item.appendChild(
        actions
      );


      container.appendChild(
        item
      );

    }
  );

}


// ============================================================
// SLICER ACTION BUTTON
// ============================================================

function createSlicerActionButton(
  text,
  handler
) {

  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "pd-btn pd-btn-outline";

  button.textContent =
    text;

  button.addEventListener(
    "click",
    handler
  );

  return button;

}


// ============================================================
// EDIT SLICER
// ============================================================

function editSlicer(id) {

  const index =
    dashboardState.slicers.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const slicer =
    dashboardState.slicers[index];


  const columnSelect =
    document.getElementById(
      "slicerColumn"
    );

  const titleInput =
    document.getElementById(
      "slicerTitle"
    );

    const typeSelect =
    document.getElementById(
      "slicerType"
    );


  const timelineGroupingSelect =
    document.getElementById(
      "timelineGrouping"
    );


  const orientationSelect =
    document.getElementById(
      "slicerOrientation"
    );

  const selectionModeSelect =
  document.getElementById(
    "slicerSelectionMode"
  );


const connectionSelect =
  document.getElementById(
    "slicerConnection"
  );


const targetKpisCheckbox =
  document.getElementById(
    "slicerTargetKpis"
  );


const targetChartsCheckbox =
  document.getElementById(
    "slicerTargetCharts"
  );


const targetTablesCheckbox =
  document.getElementById(
    "slicerTargetTables"
  );


const connectionTargets =
  slicer.connectionTargets &&
  typeof slicer.connectionTargets ===
    "object"
    ? slicer.connectionTargets
    : {
        kpis: true,
        charts: true,
        tables: true
      };


  if (columnSelect) {
    columnSelect.value =
      slicer.column;
  }


  if (titleInput) {
    titleInput.value =
      slicer.title;
  }


  if (typeSelect) {
    typeSelect.value =
      slicer.type;
  }

  updateSlicerColumnOptions();

    if (timelineGroupingSelect) {
    timelineGroupingSelect.value =
      slicer.timelineGrouping ||
      "Month";
  }

if (columnSelect) {
  columnSelect.value =
    slicer.column;
}


  if (orientationSelect) {
    orientationSelect.value =
      slicer.orientation;
  }


  if (selectionModeSelect) {
    selectionModeSelect.value =
      slicer.selectionMode;
  }


  if (connectionSelect) {
    connectionSelect.value =
      slicer.connection;
  }

  if (targetKpisCheckbox) {

  targetKpisCheckbox.checked =
    connectionTargets.kpis !==
      false;

}


if (targetChartsCheckbox) {

  targetChartsCheckbox.checked =
    connectionTargets.charts !==
      false;

}


if (targetTablesCheckbox) {

  targetTablesCheckbox.checked =
    connectionTargets.tables !==
      false;

}


updateSlicerConnectionTargets();


dashboardState.editingSlicerId =
  slicer.id;


const saveSlicerButton =
  document.getElementById(
    "saveSlicerBtn"
  );


if (saveSlicerButton) {

  saveSlicerButton.textContent =
    "Update Slicer";

}


if (titleInput) {

  titleInput.focus();

}


syncSlicerCount();

renderSlicerList();

updateAllUI();

setStatus(
  'Editing "' +
  (
    slicer.title ||
    slicer.column ||
    "Slicer"
  ) +
  '"'
);

}


// ============================================================
// DUPLICATE SLICER
// ============================================================



function duplicateSlicer(id) {

  const source =
    dashboardState.slicers.find(
      function (item) {
        return item.id === id;
      }
    );


  if (!source) {
    return;
  }


  const copy = {

    ...source,

    id:
      "slicer_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    title:
      source.title +
      " Copy"

  };


  dashboardState.slicers.push(
    copy
  );


  syncSlicerCount();

  renderSlicerList();

  updateAllUI();

  registerDashboardChange();


  setStatus(
    '"' +
    source.title +
    '" duplicated'
  );

}


// ============================================================
// DELETE SLICER
// ============================================================

function deleteSlicer(id) {

  const index =
    dashboardState.slicers.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const removed =
    dashboardState.slicers[index];


  dashboardState.slicers.splice(
    index,
    1
  );

    dashboardState.slicers.splice(
    index,
    1
  );

    // ==========================================================
  // CLEAN STALE LIVE FILTER STATE
  // ==========================================================

  if (
    removed &&
    removed.column &&
    dashboardState.activeFilters &&
    typeof dashboardState.activeFilters ===
      "object"
  ) {

    const sameColumnSlicerStillExists =
      dashboardState.slicers.some(
        function (slicer) {

          return (
            slicer &&
            String(
              slicer.column ||
              ""
            ).trim() ===
            String(
              removed.column ||
              ""
            ).trim()
          );

        }
      );


    if (
      !sameColumnSlicerStillExists
    ) {

      delete dashboardState.activeFilters[
        removed.column
      ];

    }

  }


  syncSlicerCount();


  syncSlicerCount();

  renderSlicerList();

  updateAllUI();

  registerDashboardChange();


  setStatus(
    '"' +
    removed.title +
    '" removed'
  );

}

// ============================================================
// SMART TABLE BUILDER ENGINE
// ============================================================

function addTableToDashboard() {

  const titleInput =
    document.getElementById(
      "tableTitle"
    );

const dataEngineSelect =
  document.getElementById(
    "tableDataEngine"
  );

const groupColumnSelect =
  document.getElementById(
    "tableGroupColumn"
  );

const valueColumnSelect =
  document.getElementById(
    "tableValueColumn"
  );

const aggregationSelect =
  document.getElementById(
    "tableAggregation"
  );

const grandTotalSelect =
  document.getElementById(
    "tableGrandTotal"
  );




  const limitDataSelect =
    document.getElementById(
      "tableLimitData"
    );

  const visualIndicatorSelect =
    document.getElementById(
      "tableVisualIndicator"
    );


  const title =
    titleInput
      ? titleInput.value.trim()
      : "";

  const dataEngine =
  dataEngineSelect
    ? dataEngineSelect.value
    : "Aggregated";


const groupColumn =
  groupColumnSelect
    ? groupColumnSelect.value
    : "";


const valueColumn =
  valueColumnSelect
    ? valueColumnSelect.value
    : "";


const aggregation =
  aggregationSelect
    ? aggregationSelect.value
    : "SUM";


const grandTotal =
    grandTotalSelect
      ? grandTotalSelect.value
      : "Yes";

  const limitData =
    limitDataSelect
      ? limitDataSelect.value
      : "Show All";

  const visualIndicator =
    visualIndicatorSelect
      ? visualIndicatorSelect.value
      : "None";


  if (!title) {

    setStatus(
      "Enter a table title"
    );

    if (titleInput) {
      titleInput.focus();
    }

    return;
  }

  // ==========================================================
// AGGREGATED TABLE VALIDATION
// ==========================================================

if (
  String(
    dataEngine
  ).toLowerCase() ===
    "aggregated"
) {

  if (!groupColumn) {

    setStatus(
      "Select a Group By column"
    );


    if (groupColumnSelect) {

      groupColumnSelect.focus();

    }


    return;

  }


  if (!valueColumn) {

    setStatus(
      "Select a Value column"
    );


    if (valueColumnSelect) {

      valueColumnSelect.focus();

    }


    return;

  }

}


  const table = {

    id:
      "table_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    title:
  title,

dataEngine:
  dataEngine,

groupColumn:
  groupColumn,

valueColumn:
  valueColumn,

aggregation:
  aggregation,

grandTotal:
  grandTotal,

limitData:
  limitData,

visualIndicator:
  visualIndicator

  };


const editingTableId =
  dashboardState.editingTableId;


let tableAction =
  "added";


if (
  editingTableId
) {

  const editingIndex =
    dashboardState.tables.findIndex(
      function (item) {
        return (
          item.id ===
          editingTableId
        );
      }
    );


if (
  editingIndex !== -1
) {

  table.id =
    editingTableId;


  dashboardState.tables[
    editingIndex
  ] =
    table;


  tableAction =
    "updated";

}
  else {

    dashboardState.tables.push(
      table
    );

  }


  dashboardState.editingTableId =
    null;

}
else {

  dashboardState.tables.push(
    table
  );

}


syncTableCount();

renderTableList();

updateAllUI();

resetTableForm();


registerDashboardChange();


setStatus(
  '"' +
  table.title +
  '" ' +
  tableAction
);

}


// ============================================================
// TABLE COUNT
// ============================================================

function syncTableCount() {

  dashboardState.counts.tables =
    dashboardState.tables.length;

}


// ============================================================
// RESET TABLE FORM
// ============================================================

function resetTableForm() {

  const titleInput =
    document.getElementById(
      "tableTitle"
    );

  const dataEngineSelect =
    document.getElementById(
      "tableDataEngine"
    );

  const groupColumnSelect =
    document.getElementById(
      "tableGroupColumn"
    );

  const valueColumnSelect =
    document.getElementById(
      "tableValueColumn"
    );

  const aggregationSelect =
    document.getElementById(
      "tableAggregation"
    );

  const grandTotalSelect =
    document.getElementById(
      "tableGrandTotal"
    );

  const limitDataSelect =
    document.getElementById(
      "tableLimitData"
    );

  const visualIndicatorSelect =
    document.getElementById(
      "tableVisualIndicator"
    );


  if (titleInput) {

    titleInput.value =
      "";

  }


  if (dataEngineSelect) {

    dataEngineSelect.value =
      "Aggregated";

  }


  if (groupColumnSelect) {

    groupColumnSelect.value =
      "";

  }


  if (valueColumnSelect) {

    valueColumnSelect.value =
      "";

  }


  if (aggregationSelect) {

    aggregationSelect.value =
      "SUM";

  }


  if (grandTotalSelect) {

    grandTotalSelect.value =
      "Yes";

  }


  if (limitDataSelect) {

    limitDataSelect.value =
      "Show All";

  }


  if (visualIndicatorSelect) {

    visualIndicatorSelect.value =
      "None";

  }

}


// ============================================================
// RENDER TABLE LIST
// ============================================================

function renderTableList() {

  const container =
    document.getElementById(
      "tableList"
    );

  const countElement =
    document.getElementById(
      "tableListCount"
    );


  if (!container) {
    return;
  }


  syncTableCount();


  if (countElement) {

    countElement.textContent =
      dashboardState.tables.length +
      (
        dashboardState.tables.length === 1
          ? " Table"
          : " Tables"
      );

  }


  container.innerHTML = "";


  if (
    dashboardState.tables.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "pd-empty-state";

    empty.textContent =
      "No smart tables added yet.";

    container.appendChild(
      empty
    );

    return;
  }


  dashboardState.tables.forEach(
    function (table, index) {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "pd-kpi-list-item";


      const info =
        document.createElement(
          "div"
        );

      info.className =
        "pd-kpi-list-info";


      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        (index + 1) +
        ". " +
        table.title;


      const details =
        document.createElement(
          "div"
        );

      details.className =
        "pd-kpi-list-details";

      details.textContent =
        table.dataEngine +
        " â€¢ Grand Total: " +
        table.grandTotal +
        " â€¢ " +
        table.limitData +
        " â€¢ " +
        table.visualIndicator;


      info.appendChild(
        title
      );

      info.appendChild(
        details
      );


      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "pd-kpi-list-actions";


      const editButton =
        createTableActionButton(
          "Edit",
          function () {
            editTable(
              table.id
            );
          }
        );


      const duplicateButton =
        createTableActionButton(
          "Duplicate",
          function () {
            duplicateTable(
              table.id
            );
          }
        );


      const deleteButton =
        createTableActionButton(
          "Delete",
          function () {
            deleteTable(
              table.id
            );
          }
        );


      actions.appendChild(
        editButton
      );

      actions.appendChild(
        duplicateButton
      );

      actions.appendChild(
        deleteButton
      );


      item.appendChild(
        info
      );

      item.appendChild(
        actions
      );


      container.appendChild(
        item
      );

    }
  );

}


// ============================================================
// TABLE ACTION BUTTON
// ============================================================

function createTableActionButton(
  text,
  handler
) {

  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "pd-btn pd-btn-outline";

  button.textContent =
    text;

  button.addEventListener(
    "click",
    handler
  );

  return button;

}


// ============================================================
// EDIT TABLE
// ============================================================

function editTable(id) {

  const index =
    dashboardState.tables.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const table =
    dashboardState.tables[index];


  const titleInput =
    document.getElementById(
      "tableTitle"
    );

  const dataEngineSelect =
    document.getElementById(
      "tableDataEngine"
    );

  const grandTotalSelect =
    document.getElementById(
      "tableGrandTotal"
    );

  const limitDataSelect =
    document.getElementById(
      "tableLimitData"
    );

  const visualIndicatorSelect =
    document.getElementById(
      "tableVisualIndicator"
    );


  if (titleInput) {
    titleInput.value =
      table.title;
  }

  if (dataEngineSelect) {
  dataEngineSelect.value =
    table.dataEngine;
}

if (groupColumnSelect) {
  groupColumnSelect.value =
    table.groupColumn ||
    "";
}

if (valueColumnSelect) {
  valueColumnSelect.value =
    table.valueColumn ||
    "";
}

if (aggregationSelect) {
  aggregationSelect.value =
    table.aggregation ||
    "SUM";
}

if (grandTotalSelect) {
  grandTotalSelect.value =
    table.grandTotal;
}

  if (limitDataSelect) {
    limitDataSelect.value =
      table.limitData;
  }

  if (visualIndicatorSelect) {
    visualIndicatorSelect.value =
      table.visualIndicator;
  }


dashboardState.editingTableId =
  table.id;


syncTableCount();

renderTableList();

updateAllUI();

setStatus(
  'Editing "' +
    '"'
  );

}


// ============================================================
// DUPLICATE TABLE
// ============================================================

function duplicateTable(id) {

  const source =
    dashboardState.tables.find(
      function (item) {
        return item.id === id;
      }
    );


  if (!source) {
    return;
  }


  const copy = {

    ...source,

    id:
      "table_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 7),

    title:
      source.title +
      " Copy"

  };


  dashboardState.tables.push(
    copy
  );


  syncTableCount();

  renderTableList();

  updateAllUI();

  registerDashboardChange();


  setStatus(
    '"' +
    source.title +
    '" duplicated'
  );

}


// ============================================================
// DELETE TABLE
// ============================================================

function deleteTable(id) {

  const index =
    dashboardState.tables.findIndex(
      function (item) {
        return item.id === id;
      }
    );


  if (index === -1) {
    return;
  }


  const removed =
    dashboardState.tables[index];


  dashboardState.tables.splice(
    index,
    1
  );


  syncTableCount();

  renderTableList();

  updateAllUI();

  registerDashboardChange();

  setStatus(
    '"' +
    removed.title +
    '" removed'
  );

}


// ============================================================
// APPEARANCE
// ============================================================

function initializeAppearance() {

  const appearanceTheme =
    document.getElementById(
      "appearanceTheme"
    );

      const appearanceKpiStyle =
    document.getElementById(
      "appearanceKpiStyle"
    );

  const appearanceChartStyle =
    document.getElementById(
      "appearanceChartStyle"
    );

  const appearanceBackground =
    document.getElementById(
      "appearanceBackground"
    );

  const applyThemeButton =
    document.getElementById(
      "applyThemeBtn"
    );

  const previewApplyThemeBtn =
    document.getElementById(
      "previewApplyThemeBtn"
    );

  const previewThemeSelect =
    document.getElementById(
      "previewThemeSelect"
    );


  if (appearanceTheme) {

    appearanceTheme.addEventListener(
      "change",
      function () {

        dashboardState.theme =
          appearanceTheme.value
            .toLowerCase();

        syncThemeControls();

        applyPreviewTheme();

      }
    );

  }


    // ==========================================================
  // KPI STYLE
  // ==========================================================

  if (appearanceKpiStyle) {

    appearanceKpiStyle.addEventListener(
      "change",
      function () {

        dashboardState.kpiStyle =
          appearanceKpiStyle.value;

        applyPreviewAppearance();

        updateAllUI();

        setStatus(
          "KPI style updated"
        );

      }
    );

  }


  // ==========================================================
  // CHART STYLE
  // ==========================================================

  if (appearanceChartStyle) {

    appearanceChartStyle.addEventListener(
      "change",
      function () {

        dashboardState.chartStyle =
          appearanceChartStyle.value;

        applyPreviewAppearance();

        updateAllUI();

        setStatus(
          "Chart style updated"
        );

      }
    );

  }


  // ==========================================================
  // BACKGROUND
  // ==========================================================

  if (appearanceBackground) {

    appearanceBackground.addEventListener(
      "change",
      function () {

        dashboardState.background =
          appearanceBackground.value;

        applyPreviewAppearance();

        updateAllUI();

        setStatus(
          "Dashboard background updated"
        );

      }
    );

  }

  // ==========================================================
// DASHBOARD CANVAS
// ==========================================================

if (appearanceCanvasMode) {

  appearanceCanvasMode.addEventListener(
    "change",
    function () {

      dashboardState.canvasMode =
        appearanceCanvasMode.value;

      if (manualCanvasFields) {

        manualCanvasFields.hidden =
          dashboardState.canvasMode !==
          "manual";

      }

      updateAllUI();

      setStatus(
        dashboardState.canvasMode ===
          "manual"
          ? "Manual dashboard canvas enabled"
          : "Automatic dashboard canvas enabled"
      );

    }
  );

}


if (appearanceCanvasPreset) {

  appearanceCanvasPreset.addEventListener(
    "change",
    function () {

      dashboardState.canvasPreset =
        appearanceCanvasPreset.value;

      updateAllUI();

      setStatus(
        "Dashboard canvas preset updated"
      );

    }
  );

}


if (appearanceCanvasStart) {

  appearanceCanvasStart.addEventListener(
    "change",
    function () {

      dashboardState.canvasStartCell =
        String(
          appearanceCanvasStart.value ||
          "B2"
        )
          .trim()
          .toUpperCase();

    }
  );

}


if (appearanceCanvasEnd) {

  appearanceCanvasEnd.addEventListener(
    "change",
    function () {

      dashboardState.canvasEndCell =
        String(
          appearanceCanvasEnd.value ||
          "Y55"
        )
          .trim()
          .toUpperCase();

    }
  );

}


if (appearanceLockCanvas) {

  appearanceLockCanvas.addEventListener(
    "change",
    function () {

      dashboardState.lockCanvas =
        appearanceLockCanvas.checked;

    }
  );

}


  if (previewThemeSelect) {

    previewThemeSelect.addEventListener(
      "change",
      function () {

        dashboardState.theme =
          previewThemeSelect.value
            .toLowerCase();

        syncThemeControls();

        applyPreviewTheme();

      }
    );

  }


  if (applyThemeButton) {

    applyThemeButton.addEventListener(
      "click",
      function () {

        applyPreviewTheme();
        applyPreviewAppearance();

        setStatus(
          getThemeName(
            dashboardState.theme
          ) +
          " theme applied"
        );

      }
    );

  }

    if (previewApplyThemeBtn) {

    previewApplyThemeBtn.addEventListener(
      "click",
      function () {

        applyPreviewTheme();
        applyPreviewAppearance();

        setStatus(
          "Preview theme applied"
        );

      }
    );

  }


  const dashboardThemeButton =
    document.getElementById(
      "dashboardApplyThemeBtn"
    );


   if (dashboardThemeButton) {

    dashboardThemeButton.addEventListener(
      "click",
      function () {

        applyPreviewTheme();
        applyPreviewAppearance();

        setStatus(
          "Dashboard theme applied"
        );

      }
    );

  }

}


// ============================================================
// PREVIEW APPEARANCE
// ============================================================

function applyPreviewAppearance() {

  const preview =
    document.getElementById(
      "dashboardPreview"
    );


  if (!preview) {
    return;
  }


  const kpiStyle =
    String(
      dashboardState.kpiStyle ||
      "Modern Cards"
    );

  const chartStyle =
    String(
      dashboardState.chartStyle ||
      "Clean"
    );

  const background =
    String(
      dashboardState.background ||
      "Light"
    );


  preview.dataset.kpiStyle =
    kpiStyle
      .toLowerCase()
      .replace(/\s+/g, "-");


  preview.dataset.chartStyle =
    chartStyle
      .toLowerCase()
      .replace(/\s+/g, "-");


  preview.dataset.background =
    background
      .toLowerCase();


  if (
    background.toLowerCase() ===
    "dark"
  ) {

    preview.style.background =
      "#17212b";

    preview.style.color =
      "#ffffff";

  }
  else if (
    background.toLowerCase() ===
    "soft"
  ) {

    preview.style.background =
      "#f3f7fa";

    preview.style.color =
      "#172a3a";

  }
  else {

    preview.style.background =
      "#ffffff";

    preview.style.color =
      "#172a3a";

  }


  const kpiCards =
    preview.querySelectorAll(
      ".pd-preview-kpi"
    );


  kpiCards.forEach(
    function (card) {

      card.style.borderRadius =
        kpiStyle === "Flat Cards"
          ? "2px"
          : kpiStyle === "Compact Cards"
            ? "6px"
            : "12px";

    }
  );

}

// ============================================================
// PREVIEW THEME
// ============================================================

function applyPreviewTheme() {

  const preview =
    document.getElementById(
      "dashboardPreview"
    );


  if (!preview) {

    return;

  }


  preview.dataset.theme =
    dashboardState.theme;


  const themes = {

    ocean: {
      primary:
        "#2f6fed",

      secondary:
        "#126c82",

      soft:
        "#eef6ff"
    },

    emerald: {
      primary:
        "#16865e",

      secondary:
        "#126447",

      soft:
        "#eefaf4"
    },

    royal: {
      primary:
        "#6757d9",

      secondary:
        "#4938b8",

      soft:
        "#f2efff"
    },

    slate: {
      primary:
        "#52636f",

      secondary:
        "#35434c",

      soft:
        "#f2f5f6"
    },

    midnight: {
      primary:
        "#27364a",

      secondary:
        "#142235",

      soft:
        "#eef2f7"
    }

  };


  const current =
    themes[
      dashboardState.theme
    ] ||
    themes.ocean;


  preview.style.setProperty(
    "--preview-primary",
    current.primary
  );

  preview.style.setProperty(
    "--preview-secondary",
    current.secondary
  );

  preview.style.setProperty(
    "--preview-soft",
    current.soft
  );


  const kpiValues =
    preview.querySelectorAll(
      ".pd-preview-kpi strong"
    );


  kpiValues.forEach(
    function (value) {

      value.style.color =
        current.secondary;

    }
  );


  const chartBars =
    preview.querySelectorAll(
      ".pd-fake-chart span"
    );


  chartBars.forEach(
    function (bar) {

      bar.style.background =
        current.primary;

    }
  );

}

function runPowerDashboardRefresh() {

  if (dashboardRefreshInProgress) {
    return;
  }


  if (!dashboardState.dataRange) {

    setStatus(
      "No dashboard source range is available"
    );

    return;
  }


  dashboardRefreshInProgress =
    true;


  const previewRefreshButton =
    document.getElementById(
      "previewRefreshBtn"
    );

  const dashboardRefreshButton =
    document.getElementById(
      "dashboardRefreshBtn"
    );


  if (previewRefreshButton) {
    previewRefreshButton.disabled =
      true;
  }

  if (dashboardRefreshButton) {
    dashboardRefreshButton.disabled =
      true;
  }


  setStatus(
    "Refreshing dashboard data..."
  );


  requestExcelRange(
    dashboardState.dataRange
  );

}


// ============================================================
// REFRESH PREVIEW
// ============================================================

function initializePreviewRefresh() {

  const button =
    document.getElementById(
      "previewRefreshBtn"
    );


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    function () {

      runPowerDashboardRefresh();

    }
  );

}


// ============================================================
// DASHBOARD ACTION BUTTONS
// ============================================================

function initializeDashboardActions() {

  const refresh =
    document.getElementById(
      "dashboardRefreshBtn"
    );

  const pdf =
    document.getElementById(
      "exportPdfBtn"
    );

  const ppt =
    document.getElementById(
      "exportPptBtn"
    );


  if (refresh) {

  refresh.addEventListener(
    "click",
    function () {

      runPowerDashboardRefresh();

    }
  );

}


  if (pdf) {

    pdf.addEventListener(
        "click",
        function () {

            try {

                setStatus(
                    "Opening PDF Export..."
                );


                Office.context.ui.messageParent(
                    JSON.stringify({
                        type:
                            "HXL_DASHBOARD_EXPORT_PDF"
                    })
                );

            }
            catch (error) {

                console.error(
                    "Dashboard PDF export request failed:",
                    error
                );


                setStatus(
                    "Unable to open PDF Export."
                );

            }

        }
    );

}


  if (ppt) {

    ppt.addEventListener(
        "click",
        function () {

            try {

                setStatus(
                    "Generating PowerPoint..."
                );


                Office.context.ui.messageParent(
                    JSON.stringify({
                        type:
                            "HXL_DASHBOARD_EXPORT_PPT"
                    })
                );

            }
            catch (error) {

                console.error(
                    "Dashboard PPT export request failed:",
                    error
                );


                setStatus(
                    "Unable to export PowerPoint."
                );

            }

        }
    );

}

}


// ============================================================
// VIEW DASHBOARD MODE
// ============================================================

function initializeViewDashboardMode() {

  const viewButton =
    document.getElementById(
      "viewDashboardBtn"
    );

  const closeButton =
    document.getElementById(
      "closeDashboardViewBtn"
    );


  if (viewButton) {

    viewButton.addEventListener(
      "click",
      openDashboardView
    );

  }


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeDashboardView
    );

  }

}


function openDashboardView() {

  try {

    // ========================================================
    // SAVE CURRENT STUDIO STATE BEFORE OPENING VIEW PAGE
    // ========================================================

    saveDashboardDraft(
      "open-dashboard-view"
    );


    setStatus(
      "Opening dashboard view..."
    );


    // ========================================================
    // OPEN INDEPENDENT DASHBOARD VIEW PAGE
    // ========================================================

    window.location.href =
      "dashboard-view.html";

  }
  catch (error) {

    console.error(
      "Unable to open dashboard view:",
      error
    );


    setStatus(
      "Unable to open dashboard view"
    );

  }

}


function closeDashboardView() {

  const preview =
    document.getElementById(
      "dashboardPreview"
    );


  const progressPanel =
    document.getElementById(
      "buildProgressPanel"
    );


  const closeButton =
    document.getElementById(
      "closeDashboardViewBtn"
    );


  // ==========================================================
  // CLOSE FULL VIEW
  // ==========================================================

  if (preview) {

    preview.classList.remove(
      "pd-dashboard-full-view"
    );

    preview.hidden =
      true;

  }


  document.body.classList.remove(
    "pd-dashboard-view-open"
  );


  if (closeButton) {

    closeButton.hidden =
      true;

  }


  // ==========================================================
  // RESTORE BUILD SUCCESS PANEL
  // ==========================================================

  if (progressPanel) {

    progressPanel.hidden =
      false;

  }


  setStatus(
    "Dashboard view closed"
  );

}


// ============================================================
// SECURITY
// ============================================================

function initializeSecurity() {

  const protectDashboardToggle =
    document.getElementById(
      "protectDashboardToggle"
    );

  const hideBackendToggle =
    document.getElementById(
      "hideBackendToggle"
    );

  const lockSettingsToggle =
    document.getElementById(
      "lockSettingsToggle"
    );


  // ==========================================================
  // INITIAL UI STATE
  // ==========================================================

  if (protectDashboardToggle) {

    protectDashboardToggle.checked =
      Boolean(
        dashboardState.protectDashboard
      );

  }


  if (hideBackendToggle) {

    hideBackendToggle.checked =
      Boolean(
        dashboardState.hideBackend
      );

  }


  if (lockSettingsToggle) {

    lockSettingsToggle.checked =
      Boolean(
        dashboardState.lockSettings
      );

  }


  // ==========================================================
  // PROTECT DASHBOARD
  // ==========================================================

  if (protectDashboardToggle) {

    protectDashboardToggle.addEventListener(
      "change",
      function () {

        dashboardState.protectDashboard =
          protectDashboardToggle.checked;

        updateAllUI();

        setStatus(
          dashboardState.protectDashboard
            ? "Dashboard protection enabled"
            : "Dashboard protection disabled"
        );

      }
    );

  }


  // ==========================================================
  // HIDE BACKEND
  // ==========================================================

  if (hideBackendToggle) {

    hideBackendToggle.addEventListener(
      "change",
      function () {

        dashboardState.hideBackend =
          hideBackendToggle.checked;

        updateAllUI();

        setStatus(
          dashboardState.hideBackend
            ? "Backend sheet will be hidden"
            : "Backend sheet will remain visible"
        );

      }
    );

  }


  // ==========================================================
  // LOCK SETTINGS
  // ==========================================================

  if (lockSettingsToggle) {

    lockSettingsToggle.addEventListener(
      "change",
      function () {

        dashboardState.lockSettings =
          lockSettingsToggle.checked;

        updateAllUI();

        setStatus(
          dashboardState.lockSettings
            ? "Dashboard settings will be locked"
            : "Dashboard settings will remain editable"
        );

      }
    );

  }

}


// ============================================================
// FOOTER NAVIGATION
// ============================================================

function initializeFooter() {

  const previousBtn =
    document.getElementById(
      "previousBtn"
    );

  const nextBtn =
    document.getElementById(
      "nextBtn"
    );

  const buildDashboardBtn =
    document.getElementById(
      "buildDashboardBtn"
    );

  const saveDraftBtn =
    document.getElementById(
      "saveDraftBtn"
    );


  if (previousBtn) {

    previousBtn.addEventListener(
      "click",
      goPrevious
    );

  }


  if (nextBtn) {

    nextBtn.addEventListener(
      "click",
      goNext
    );

  }


  if (buildDashboardBtn) {

    buildDashboardBtn.addEventListener(
      "click",
      buildDashboard
    );

  }


  if (saveDraftBtn) {

  saveDraftBtn.addEventListener(
    "click",
    function () {

      saveDashboardDraft(
        "manual"
      );

    }
  );

}


  initializePreviewRefresh();

  initializeDashboardActions();

  initializeViewDashboardMode();

}


function goNext() {

  const order = [

    "dataSetupSection",
    "kpiBuilderSection",
    "chartBuilderSection",
    "slicerBuilderSection",
    "smartTableSection",
    "appearanceSection",
    "securitySection",
    "reviewSection"

  ];


  const currentIndex =
    order.indexOf(
      dashboardState.activeSection
    );


  // Final Review page:
  // Continue = Build Dashboard

  if (
    dashboardState.activeSection ===
    "reviewSection"
  ) {

    buildDashboard();

    return;

  }


  if (
    currentIndex >= 0 &&
    currentIndex <
    order.length - 1
  ) {

    showSection(
      order[
        currentIndex + 1
      ]
    );

  }

}


function goPrevious() {

  const order = [

    "dataSetupSection",

    "kpiBuilderSection",

    "chartBuilderSection",

    "slicerBuilderSection",

    "smartTableSection",

    "appearanceSection",

    "securitySection",

    "reviewSection"

  ];


  const currentIndex =
    order.indexOf(
      dashboardState.activeSection
    );


  if (currentIndex > 0) {

    showSection(
      order[
        currentIndex - 1
      ]
    );

  }

}


  // ============================================================
// REAL DASHBOARD BUILD PROGRESS
// ============================================================

function updateDashboardBuildProgress(
  progress
) {

  const panel =
    document.getElementById(
      "buildProgressPanel"
    );

  const preview =
    document.getElementById(
      "dashboardPreview"
    );

  const title =
    document.getElementById(
      "buildProgressTitle"
    );

  const percent =
    document.getElementById(
      "buildProgressPercent"
    );

  const bar =
    document.getElementById(
      "buildProgressBar"
    );

  const engineStep =
    document.getElementById(
      "buildStepEngine"
    );

  const componentStep =
    document.getElementById(
      "buildStepComponents"
    );

  const finishStep =
    document.getElementById(
      "buildStepFinish"
    );

  const summary =
    document.getElementById(
      "buildProgressSummary"
    );


  if (!panel) {
    return;
  }


  panel.hidden =
    false;


  if (preview) {

    preview.hidden =
      true;

  }


  const progressPercent =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          progress.percent || 0
        )
      )
    );


  const stage =
    String(
      progress.stage || ""
    ).toLowerCase();


  if (title) {

    title.textContent =
      progress.title ||
      "Building Dashboard";

  }


  if (percent) {

    percent.textContent =
      Math.round(
        progressPercent
      ) +
      "%";

  }


  if (bar) {

    bar.style.animation =
      "none";

    bar.style.transform =
      "none";

    bar.style.width =
      progressPercent +
      "%";

  }


  if (summary) {

    summary.textContent =
      progress.detail ||
      "Building dashboard...";

  }


  // ----------------------------------------------------------
  // ENGINE / STARTING
  // ----------------------------------------------------------

  if (
    stage === "starting"
  ) {

    if (engineStep) {
      engineStep.className =
        "pd-build-step active";
    }

    if (componentStep) {
      componentStep.className =
        "pd-build-step";
    }

    if (finishStep) {
      finishStep.className =
        "pd-build-step";
    }

    return;
  }


  // ----------------------------------------------------------
  // COMPONENT CREATION
  // ----------------------------------------------------------

  if (
    stage === "kpis" ||
    stage === "charts" ||
    stage === "slicers" ||
    stage === "tables"
  ) {

    if (engineStep) {
      engineStep.className =
        "pd-build-step done";
    }

    if (componentStep) {
      componentStep.className =
        "pd-build-step active";
    }

    if (finishStep) {
      finishStep.className =
        "pd-build-step";
    }

    return;
  }


  // ----------------------------------------------------------
  // FINALIZATION
  // ----------------------------------------------------------

  if (
    stage === "formatting" ||
    stage === "security" ||
    stage === "finishing"
  ) {

    if (engineStep) {
      engineStep.className =
        "pd-build-step done";
    }

    if (componentStep) {
      componentStep.className =
        "pd-build-step done";
    }

    if (finishStep) {
      finishStep.className =
        "pd-build-step active";
    }

    return;
  }


  // ----------------------------------------------------------
  // COMPLETE
  // ----------------------------------------------------------

  if (
    stage === "complete"
  ) {

    [
      engineStep,
      componentStep,
      finishStep
    ].forEach(
      function (step) {

        if (step) {

          step.className =
            "pd-build-step done";

        }

      }
    );

  }

}

// ============================================================
// DASHBOARD BUILD PROGRESS VIEW
// ============================================================

function setDashboardBuildView(
  state,
  message
) {

  const panel =
    document.getElementById(
      "buildProgressPanel"
    );

  const preview =
    document.getElementById(
      "dashboardPreview"
    );

  const title =
    document.getElementById(
      "buildProgressTitle"
    );

  const percent =
    document.getElementById(
      "buildProgressPercent"
    );

  const bar =
    document.getElementById(
      "buildProgressBar"
    );

  const engineStep =
    document.getElementById(
      "buildStepEngine"
    );

  const componentStep =
    document.getElementById(
      "buildStepComponents"
    );

  const finishStep =
    document.getElementById(
      "buildStepFinish"
    );

  const summary =
    document.getElementById(
      "buildProgressSummary"
    );


  if (!panel) {
    return;
  }


  panel.hidden =
    false;


  if (preview) {

    preview.hidden =
      state !== "preview";

  }


  if (
    state ===
    "building"
  ) {

    if (title) {
      title.textContent =
        "Building Dashboard";
    }

    if (percent) {
      percent.textContent =
        "Working...";
    }

    if (bar) {

      bar.style.width =
        "35%";

      bar.style.animation =
        "pdBuildWorking 1.25s ease-in-out infinite";

    }


    if (engineStep) {
      engineStep.className =
        "pd-build-step active";
    }

    if (componentStep) {
      componentStep.className =
        "pd-build-step";
    }

    if (finishStep) {
      finishStep.className =
        "pd-build-step";
    }


    if (summary) {

      summary.textContent =
        dashboardState.counts.kpis +
        " KPI Cards â€¢ " +
        dashboardState.counts.charts +
        " Charts â€¢ " +
        dashboardState.counts.slicers +
        " Slicers â€¢ " +
        dashboardState.counts.tables +
        " Smart Tables";

    }

    return;
  }


  if (
    state ===
    "success"
  ) {

    if (title) {
      title.textContent =
        "Dashboard Ready";
    }

    if (percent) {
      percent.textContent =
        "100%";
    }

    if (bar) {

      bar.style.animation =
        "none";

      bar.style.transform =
        "none";

      bar.style.width =
        "100%";

    }


    [
      engineStep,
      componentStep,
      finishStep
    ].forEach(
      function (step) {

        if (step) {
          step.className =
            "pd-build-step done";
        }

      }
    );


    if (summary) {

      summary.textContent =
        "Dashboard created successfully. " +
        dashboardState.counts.kpis +
        " KPI Cards, " +
        dashboardState.counts.charts +
        " Charts, " +
        dashboardState.counts.slicers +
        " Slicers and " +
        dashboardState.counts.tables +
        " Smart Tables.";

    }

    return;
  }


  if (
    state ===
    "error"
  ) {

    if (title) {
      title.textContent =
        "Dashboard Build Failed";
    }

    if (percent) {
      percent.textContent =
        "Stopped";
    }

    if (bar) {

      bar.style.animation =
        "none";

      bar.style.transform =
        "none";

      bar.style.width =
        "100%";

      bar.style.background =
        "#dc2626";

    }

    if (summary) {

      summary.textContent =
        message ||
        "Unable to build dashboard.";

    }

  }

}


// ============================================================
// BUILD DASHBOARD
// ============================================================

function buildDashboard() {

  if (!dashboardState.dataRange) {

    setStatus(
      "Select Excel data before building dashboard"
    );

    showSection(
      "dataSetupSection"
    );

    return;
  }


  const buildDashboardBtn =
    document.getElementById(
      "buildDashboardBtn"
    );

  if (buildDashboardBtn) {

    buildDashboardBtn.disabled =
      true;

    buildDashboardBtn.textContent =
      "Building...";

  }

    setDashboardBuildView(
    "building"
  );


  setStatus(
    "Creating Excel Dashboard..."
  );


  const steps =
    document.querySelectorAll(
      ".pd-step"
    );


  steps.forEach(
    function (step) {

      step.classList.remove(
        "active"
      );

    }
  );


  if (steps[3]) {

    steps[3].classList.add(
      "active"
    );

  }


try {

  // ==========================================================
  // PRE-BUILD RECOVERY CHECKPOINT
  // ==========================================================

  const preBuildSaved =
    saveDashboardDraft(
      "pre-build"
    );


  if (
    preBuildSaved !== true
  ) {

    throw new Error(
      "Unable to save pre-build recovery checkpoint"
    );

  }


  setStatus(
    "Creating Excel Dashboard..."
  );


  const projectSnapshot =
    getDashboardProjectSnapshot();


  Office.context.ui.messageParent(
    JSON.stringify({

      type:
        "POWER_DASHBOARD_BUILD",

      config: {

        project:
          projectSnapshot.project,

        projectSnapshot:
          projectSnapshot,

          dataRange:
            dashboardState.dataRange,

          dashboardTitle:
            dashboardState.dashboardTitle,

          theme:
            dashboardState.theme,

          currency:
            dashboardState.currency,

          gridlines:
            dashboardState.gridlines,

                    layout:
            dashboardState.layout,

            canvasMode:
  dashboardState.canvasMode,

canvasPreset:
  dashboardState.canvasPreset,

canvasStartCell:
  dashboardState.canvasStartCell,

canvasEndCell:
  dashboardState.canvasEndCell,

lockCanvas:
  dashboardState.lockCanvas,

          kpiStyle:
            dashboardState.kpiStyle,

          chartStyle:
            dashboardState.chartStyle,

          background:
            dashboardState.background,

          protectDashboard:
            dashboardState.protectDashboard,

          hideBackend:
            dashboardState.hideBackend,

          lockSettings:
            dashboardState.lockSettings,

            dataEngine:
              dashboardState.dataEngine,

          counts:
            dashboardState.counts,

          kpis:
            dashboardState.kpis || [],

          charts:
            dashboardState.charts || [],

          slicers:
            dashboardState.slicers || [],

          tables:
            dashboardState.tables || [],

          columnDefinitions:
            dashboardState.columnDefinitions || []
        }

      })
    );

  }


    catch (error) {

    setDashboardBuildView(
  "error",
  error.message ||
  String(error)
);  

    console.error(
      "Dashboard build request failed:",
      error
    );


    const buildDashboardBtn =
      document.getElementById(
        "buildDashboardBtn"
      );

    if (buildDashboardBtn) {

      buildDashboardBtn.disabled =
        false;

      buildDashboardBtn.textContent =
        "Build Dashboard";

    }


    setStatus(
      "Unable to send dashboard build request"
    );

  }
}


// ============================================================
// CLOSE STUDIO
// ============================================================

function initializeCloseButton() {

  const closeButton =
    document.getElementById(
      "closeStudioBtn"
    );


  if (!closeButton) {

    return;

  }


  closeButton.addEventListener(
    "click",
    closeStudio
  );

}


function closeStudio() {

  try {

    // ========================================================
    // CANCEL PENDING AUTO-SAVE TIMER
    // ========================================================

    if (
      dashboardAutoSaveTimer
    ) {

      clearTimeout(
        dashboardAutoSaveTimer
      );


      dashboardAutoSaveTimer =
        null;

    }


    // ========================================================
    // FINAL DRAFT SAVE BEFORE CLOSE
    // ========================================================

    if (
      dashboardState.project &&
      dashboardState.project
        .isDirty === true
    ) {

      const saveSucceeded =
        saveDashboardDraft(
          "close"
        );


      if (
        saveSucceeded !== true
      ) {

        setStatus(
          "Unable to save changes. Studio not closed."
        );


        return;

      }

    }


    // ========================================================
    // CLOSE STUDIO
    // ========================================================

    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "CLOSE_STUDIO"
      })
    );

  }
  catch (error) {

    console.error(
      "Unable to close dialog:",
      error
    );


    // Final fallback:
    // only close directly when there are no unsaved changes.

    if (
      !dashboardState.project ||
      dashboardState.project
        .isDirty !== true
    ) {

      window.close();

    }
    else {

      setStatus(
        "Unable to close safely. Please save your draft."
      );

    }

  }

}


// ============================================================
// UPDATE ALL UI
// ============================================================

function updateAllUI() {

  // ==========================================================
  // DATA / SOURCE INFORMATION
  // ==========================================================

  updateDataInfo();
  renderDataProfiler();
  updateSmartAdvisorUI();


  // ==========================================================
  // RESTORE / REFRESH BUILDER LISTS
  // ==========================================================

  renderKpiList();

  renderChartList();

  renderSlicerList();

  renderTableList();


  // ==========================================================
  // LIVE PREVIEW + REVIEW
  // ==========================================================

  updatePreview();

  updateReview();


  // ==========================================================
  // APPEARANCE
  // ==========================================================

  syncThemeControls();

  applyPreviewTheme();

}


// ============================================================
// DATA INFO UI
// ============================================================

function updateDataInfo() {

  const dataRangeInput =
    document.getElementById(
      "dataRangeInput"
    );

  const rowCount =
    document.getElementById(
      "rowCount"
    );

  const columnCount =
    document.getElementById(
      "columnCount"
    );

  const headerDetected =
    document.getElementById(
      "headerDetected"
    );

  const dataTypeDetected =
    document.getElementById(
      "dataTypeDetected"
    );


  if (dataRangeInput) {

    dataRangeInput.value =
      dashboardState.dataRange;

  }


  if (rowCount) {

    rowCount.textContent =
      dashboardState.rowCount === null
        ? "â€”"
        : formatInteger(
            dashboardState.rowCount
          );

  }


  if (columnCount) {

    columnCount.textContent =
      dashboardState.columnCount === null
        ? "â€”"
        : formatInteger(
            dashboardState.columnCount
          );

  }


  if (headerDetected) {

    headerDetected.textContent =
      dashboardState.headerDetected
        ? "Yes"
        : "â€”";

  }


  if (dataTypeDetected) {

    dataTypeDetected.textContent =
      dashboardState.dataTypeDetected
        ? "Yes"
        : "â€”";

  }

}

// ============================================================
// SMART DATA PROFILER UI
// ============================================================

function renderDataProfiler() {

  const profiler =
    dashboardState.profilerResult;


  const qualityBadge =
    document.getElementById(
      "profilerQualityBadge"
    );

  const rowCount =
    document.getElementById(
      "profilerRowCount"
    );

  const columnCount =
    document.getElementById(
      "profilerColumnCount"
    );

  const duplicateCount =
    document.getElementById(
      "profilerDuplicateCount"
    );

  const warningCount =
    document.getElementById(
      "profilerWarningCount"
    );

  const errorCount =
    document.getElementById(
      "profilerErrorCount"
    );

  const qualityWarningCount =
    document.getElementById(
      "profilerQualityWarningCount"
    );

  const infoCount =
    document.getElementById(
      "profilerInfoCount"
    );

  const warningsContainer =
    document.getElementById(
      "profilerWarnings"
    );

  const columnsContainer =
    document.getElementById(
      "profilerColumns"
    );


  // ==========================================================
  // NO PROFILER RESULT
  // ==========================================================

  if (
    !profiler ||
    typeof profiler !== "object"
  ) {

    if (qualityBadge) {
      qualityBadge.textContent =
        "Not Analyzed";

      qualityBadge.dataset.status =
        "none";
    }


    if (rowCount) {
      rowCount.textContent = "—";
    }

    if (columnCount) {
      columnCount.textContent = "—";
    }

    if (duplicateCount) {
      duplicateCount.textContent = "—";
    }

    if (warningCount) {
      warningCount.textContent = "—";
    }

    if (errorCount) {
      errorCount.textContent = "—";
    }

    if (qualityWarningCount) {
      qualityWarningCount.textContent =
        "—";
    }

    if (infoCount) {
      infoCount.textContent = "—";
    }


    if (warningsContainer) {

      warningsContainer.innerHTML =
        '<div class="pd-profiler-empty">' +
        "Select an Excel range to analyze data quality." +
        "</div>";

    }


    if (columnsContainer) {

      columnsContainer.innerHTML =
        '<div class="pd-profiler-empty">' +
        "Column statistics will appear here." +
        "</div>";

    }


    return;
  }


  const duplicateRows =
    profiler.duplicateRows &&
    typeof profiler.duplicateRows ===
      "object"
      ? profiler.duplicateRows
      : {};


  const dataQuality =
    profiler.dataQuality &&
    typeof profiler.dataQuality ===
      "object"
      ? profiler.dataQuality
      : {};


  const columns =
    Array.isArray(
      profiler.columns
    )
      ? profiler.columns
      : [];


  const warnings =
    Array.isArray(
      dataQuality.warnings
    )
      ? dataQuality.warnings
      : [];


  // ==========================================================
  // SUMMARY
  // ==========================================================

  if (rowCount) {

    rowCount.textContent =
      formatInteger(
        Number(
          profiler.rowCount || 0
        )
      );

  }


  if (columnCount) {

    columnCount.textContent =
      formatInteger(
        Number(
          profiler.columnCount || 0
        )
      );

  }


  if (duplicateCount) {

    duplicateCount.textContent =
      formatInteger(
        Number(
          duplicateRows
            .duplicateRowCount || 0
        )
      );

  }


  if (warningCount) {

    warningCount.textContent =
      formatInteger(
        Number(
          dataQuality.totalWarnings !==
            undefined
            ? dataQuality.totalWarnings
            : warnings.length
        )
      );

  }


  if (errorCount) {

    errorCount.textContent =
      formatInteger(
        Number(
          dataQuality.errorCount || 0
        )
      );

  }


  if (qualityWarningCount) {

    qualityWarningCount.textContent =
      formatInteger(
        Number(
          dataQuality.warningCount || 0
        )
      );

  }


  if (infoCount) {

    infoCount.textContent =
      formatInteger(
        Number(
          dataQuality.infoCount || 0
        )
      );

  }


  // ==========================================================
  // QUALITY STATUS
  // ==========================================================

  const qualityStatus =
    String(
      dataQuality.status ||
      (
        Number(
          dataQuality.errorCount || 0
        ) > 0
          ? "poor"
          : Number(
              dataQuality.warningCount || 0
            ) > 0
              ? "warning"
              : "good"
      )
    ).toLowerCase();


  if (qualityBadge) {

    qualityBadge.dataset.status =
      qualityStatus;


    if (qualityStatus === "poor") {

      qualityBadge.textContent =
        "Poor";

    }

    else if (
      qualityStatus === "warning"
    ) {

      qualityBadge.textContent =
        "Needs Attention";

    }

    else {

      qualityBadge.textContent =
        "Good";

    }

  }


  // ==========================================================
  // DATA QUALITY WARNINGS
  // ==========================================================

  if (warningsContainer) {

    warningsContainer.innerHTML = "";


    if (warnings.length === 0) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "pd-profiler-empty";

      empty.textContent =
        "No data quality issues detected.";

      warningsContainer.appendChild(
        empty
      );

    }

    else {

      warnings.forEach(
        function (warning) {

          const item =
            document.createElement(
              "div"
            );


          const severity =
            String(
              warning &&
              warning.severity
                ? warning.severity
                : "info"
            ).toLowerCase();


          item.className =
            "pd-profiler-warning " +
            "pd-profiler-warning-" +
            severity;


          const severityLabel =
            document.createElement(
              "span"
            );

          severityLabel.className =
            "pd-profiler-warning-severity";

          severityLabel.textContent =
            severity.toUpperCase();


          const message =
            document.createElement(
              "span"
            );

          message.className =
            "pd-profiler-warning-message";

          message.textContent =
            warning &&
            warning.message
              ? String(
                  warning.message
                )
              : "Data quality issue detected.";


          item.appendChild(
            severityLabel
          );

          item.appendChild(
            message
          );


          warningsContainer.appendChild(
            item
          );

        }
      );

    }

  }


  // ==========================================================
  // COLUMN PROFILES
  // ==========================================================

  if (columnsContainer) {

    columnsContainer.innerHTML = "";


    if (columns.length === 0) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "pd-profiler-empty";

      empty.textContent =
        "No column profiles available.";

      columnsContainer.appendChild(
        empty
      );

    }

    else {

      columns.forEach(
        function (column) {

          const stats =
            column &&
            column.stats &&
            typeof column.stats ===
              "object"
              ? column.stats
              : {};


          const item =
            document.createElement(
              "div"
            );

          item.className =
            "pd-profiler-column";


          const header =
            document.createElement(
              "div"
            );

          header.className =
            "pd-profiler-column-header";


          const name =
            document.createElement(
              "strong"
            );

          name.className =
            "pd-profiler-column-name";

          name.textContent =
            column &&
            column.name
              ? String(
                  column.name
                )
              : "Unknown Column";


          const type =
            document.createElement(
              "span"
            );

          type.className =
            "pd-profiler-column-type";

          type.textContent =
            String(
              (
                column &&
                (
                  column.semanticType ||
                  column.type
                )
              ) ||
              "unknown"
            );


          header.appendChild(
            name
          );

          header.appendChild(
            type
          );


          const details =
            document.createElement(
              "div"
            );

          details.className =
            "pd-profiler-column-stats";


          const blankText =
            document.createElement(
              "span"
            );

          blankText.textContent =
            "Blanks: " +
            formatInteger(
              Number(
                stats.blankCount || 0
              )
            );


          const invalidText =
            document.createElement(
              "span"
            );

          invalidText.textContent =
            "Invalid: " +
            formatInteger(
              Number(
                stats.invalidCount || 0
              )
            );


          const uniqueText =
            document.createElement(
              "span"
            );

          uniqueText.textContent =
            "Unique: " +
            formatInteger(
              Number(
                stats.uniqueCount || 0
              )
            );


          details.appendChild(
            blankText
          );

          details.appendChild(
            invalidText
          );

          details.appendChild(
            uniqueText
          );


          item.appendChild(
            header
          );

          item.appendChild(
            details
          );


          columnsContainer.appendChild(
            item
          );

        }
      );

    }

  }

}

// ============================================================
// LIVE PREVIEW - KPI CARDS
// ============================================================

function renderLivePreviewKpis() {

  const container =
    document.getElementById(
      "previewKpiContainer"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  const kpis =
    Array.isArray(
      dashboardState.kpis
    )
      ? dashboardState.kpis
      : [];


  if (kpis.length === 0) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "pd-preview-empty";

    empty.textContent =
      "Add KPI cards to start building the dashboard.";

    container.appendChild(
      empty
    );

    return;
  }


  kpis.forEach(
    function (kpi) {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "pd-preview-kpi";


      const title =
        document.createElement(
          "span"
        );

      title.textContent =
        kpi.title ||
        kpi.column ||
        "KPI";


      const value =
        document.createElement(
          "strong"
        );

      value.textContent =
        getLivePreviewKpiValue(
          kpi
        );


      const detail =
        document.createElement(
          "small"
        );

      detail.textContent =
        (
          kpi.aggregation ||
          "SUM"
        ) +
        (
          kpi.comparison &&
          String(
            kpi.comparison
          ).toLowerCase() !==
            "none"
            ? " â€¢ " +
              kpi.comparison
            : ""
        );


      card.appendChild(
        title
      );

      card.appendChild(
        value
      );

      card.appendChild(
        detail
      );


      container.appendChild(
        card
      );

    }
  );

}

// ============================================================
// LIVE PREVIEW - SMART TABLES
// ============================================================

// ============================================================
// LIVE PREVIEW - SMART TABLES
// ============================================================

function renderLivePreviewTables() {

  const container =
    document.getElementById(
      "previewTableContainer"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  const tables =
    Array.isArray(
      dashboardState.tables
    )
      ? dashboardState.tables
      : [];


  if (
    tables.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "pd-preview-empty";


    empty.textContent =
      "Add a Smart Table to complete the dashboard.";


    container.appendChild(
      empty
    );


    return;

  }


  tables.forEach(
    function (tableConfig) {

      const widget =
        document.createElement(
          "div"
        );


      widget.className =
        "pd-widget pd-live-table-widget";


      // ======================================================
      // TITLE
      // ======================================================

      const title =
        document.createElement(
          "div"
        );


      title.className =
        "pd-widget-title";


      title.textContent =
        tableConfig.title ||
        "Smart Table";


      // ======================================================
      // META
      // ======================================================

      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "pd-preview-table-meta";


      meta.textContent =
        (
          tableConfig.dataEngine ||
          "Aggregated"
        ) +
        " â€¢ " +
        (
          tableConfig.aggregation ||
          "SUM"
        ) +
        " â€¢ " +
        (
          tableConfig.limitData ||
          "Show All"
        );


      // ======================================================
      // BUILD ACTUAL TABLE DATA
      // ======================================================

      const tableData =
        getLivePreviewTableData(
          tableConfig
        );


      const previewTable =
        document.createElement(
          "table"
        );


      previewTable.className =
        "pd-mini-table";


      const thead =
        document.createElement(
          "thead"
        );


      const headerRow =
        document.createElement(
          "tr"
        );


      const groupHeader =
        document.createElement(
          "th"
        );


      groupHeader.textContent =
        tableConfig.groupColumn ||
        "Category";


      const valueHeader =
        document.createElement(
          "th"
        );


      valueHeader.textContent =
        (
          tableConfig.aggregation ||
          "SUM"
        ) +
        " " +
        (
          tableConfig.valueColumn ||
          "Value"
        );


      headerRow.appendChild(
        groupHeader
      );


      headerRow.appendChild(
        valueHeader
      );


      const visualIndicator =
        String(
          tableConfig.visualIndicator ||
          "None"
        );


      let indicatorHeader =
        null;


      if (
        visualIndicator.toLowerCase() !==
        "none"
      ) {

        indicatorHeader =
          document.createElement(
            "th"
          );


        indicatorHeader.textContent =
          "Indicator";


        headerRow.appendChild(
          indicatorHeader
        );

      }


      thead.appendChild(
        headerRow
      );


      previewTable.appendChild(
        thead
      );


      const tbody =
        document.createElement(
          "tbody"
        );


      if (
        tableData.rows.length === 0
      ) {

        const emptyRow =
          document.createElement(
            "tr"
          );


        const emptyCell =
          document.createElement(
            "td"
          );


        emptyCell.colSpan =
          indicatorHeader
            ? 3
            : 2;


          emptyCell.className =
  "pd-live-table-empty";


const hasActiveFilters =
  dashboardState.activeFilters &&
  Object.keys(
    dashboardState.activeFilters
  ).length > 0;


emptyCell.textContent =
  hasActiveFilters
    ? "No data for current filters"
    : "No preview data";


        emptyRow.appendChild(
          emptyCell
        );


        tbody.appendChild(
          emptyRow
        );

      }
      else {

        // Keep the live preview readable.
        const visibleRows =
          tableData.rows.slice(
            0,
            12
          );


        visibleRows.forEach(
          function (rowData) {

            const row =
              document.createElement(
                "tr"
              );


            const categoryCell =
              document.createElement(
                "td"
              );


            categoryCell.textContent =
              String(
                rowData.category
              );


            categoryCell.title =
              String(
                rowData.category
              );


            const valueCell =
              document.createElement(
                "td"
              );


            valueCell.textContent =
              formatPreviewNumber(
                rowData.value
              );


            valueCell.className =
              "pd-live-table-value";


            row.appendChild(
              categoryCell
            );


            row.appendChild(
              valueCell
            );


            if (indicatorHeader) {

              const indicatorCell =
                document.createElement(
                  "td"
                );


              indicatorCell.className =
                "pd-live-table-indicator";


              indicatorCell.appendChild(
                createLivePreviewTableIndicator(
                  rowData.value,
                  tableData.maximumValue,
                  visualIndicator
                )
              );


              row.appendChild(
                indicatorCell
              );

            }


            tbody.appendChild(
              row
            );

          }
        );

      }


      // ======================================================
      // GRAND TOTAL ROW
      // ======================================================

      if (
        String(
          tableConfig.grandTotal ||
          "Yes"
        ).toLowerCase() ===
          "yes" &&
        tableData.rows.length > 0
      ) {

        const totalRow =
          document.createElement(
            "tr"
          );


        totalRow.className =
          "pd-live-table-total-row";


        const totalLabel =
          document.createElement(
            "td"
          );


        totalLabel.textContent =
          "Grand Total";


        const totalValue =
          document.createElement(
            "td"
          );


        totalValue.textContent =
          formatPreviewNumber(
            tableData.grandTotal
          );


        totalRow.appendChild(
          totalLabel
        );


        totalRow.appendChild(
          totalValue
        );


        if (indicatorHeader) {

          const totalIndicator =
            document.createElement(
              "td"
            );


          totalIndicator.textContent =
            "";


          totalRow.appendChild(
            totalIndicator
          );

        }


        tbody.appendChild(
          totalRow
        );

      }


      previewTable.appendChild(
        tbody
      );


      // ======================================================
      // FOOTER
      // ======================================================

      const footer =
        document.createElement(
          "div"
        );


      footer.className =
        "pd-preview-table-footer";


      let footerText =
        tableData.rows.length +
        (
          tableData.rows.length === 1
            ? " row"
            : " rows"
        );


      if (
        tableData.rows.length > 12
      ) {

        footerText +=
          " â€¢ showing first 12";

      }


      if (
        visualIndicator.toLowerCase() !==
        "none"
      ) {

        footerText +=
          " â€¢ " +
          visualIndicator;

      }


      footer.textContent =
        footerText;


      widget.appendChild(
        title
      );


      widget.appendChild(
        meta
      );


      widget.appendChild(
        previewTable
      );


      widget.appendChild(
        footer
      );


      container.appendChild(
        widget
      );

    }
  );

}


// ============================================================
// BUILD ACTUAL LIVE PREVIEW TABLE DATA
// ============================================================

function getLivePreviewTableData(
  tableConfig
) {

  if (!tableConfig) {

    return {
      rows: [],
      grandTotal: 0,
      maximumValue: 0
    };

  }


  const sourceValues =
  getFilteredSourceValues(
    "tables"
  );


  if (
    sourceValues.length < 2
  ) {

    return {
      rows: [],
      grandTotal: 0,
      maximumValue: 0
    };

  }


  const headers =
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  const groupColumnIndex =
    findPreviewColumnIndex(
      headers,
      tableConfig.groupColumn
    );


  const valueColumnIndex =
    findPreviewColumnIndex(
      headers,
      tableConfig.valueColumn
    );


  if (
    groupColumnIndex === -1 ||
    valueColumnIndex === -1
  ) {

    return {
      rows: [],
      grandTotal: 0,
      maximumValue: 0
    };

  }


  const groupedValues =
    new Map();


  const allValueColumnValues =
    [];


  for (
    let rowIndex = 1;
    rowIndex < sourceValues.length;
    rowIndex++
  ) {

    const row =
      sourceValues[
        rowIndex
      ];


    if (
      !Array.isArray(
        row
      )
    ) {

      continue;

    }


    const rawCategory =
      row[
        groupColumnIndex
      ];


    const category =
      rawCategory === null ||
      rawCategory === undefined ||
      String(
        rawCategory
      ).trim() ===
        ""
        ? "(Blank)"
        : String(
            rawCategory
          ).trim();


    const rawValue =
      row[
        valueColumnIndex
      ];


    if (
      !groupedValues.has(
        category
      )
    ) {

      groupedValues.set(
        category,
        []
      );

    }


    groupedValues
      .get(
        category
      )
      .push(
        rawValue
      );


    allValueColumnValues.push(
      rawValue
    );

  }


  let rows =
    [];


  groupedValues.forEach(
    function (
      values,
      category
    ) {

      rows.push({

        category:
          category,

        value:
          aggregateLivePreviewChartValues(
            values,
            tableConfig.aggregation
          )

      });

    }
  );


  rows =
    applyLivePreviewTopBottom(
      rows,
      tableConfig.limitData
    );


  const grandTotal =
    aggregateLivePreviewChartValues(
      allValueColumnValues,
      tableConfig.aggregation
    );


  const maximumValue =
    rows.length > 0
      ? Math.max(
          ...rows.map(
            function (row) {

              return Math.abs(
                Number(
                  row.value ||
                  0
                )
              );

            }
          ),
          0
        )
      : 0;


  return {
    rows:
      rows,

    grandTotal:
      grandTotal,

    maximumValue:
      maximumValue
  };

}


// ============================================================
// LIVE PREVIEW TABLE VISUAL INDICATOR
// ============================================================

function createLivePreviewTableIndicator(
  value,
  maximumValue,
  visualIndicator
) {

  const indicator =
    document.createElement(
      "span"
    );


  const mode =
    String(
      visualIndicator ||
      "None"
    )
      .trim()
      .toLowerCase();


  const numericValue =
    Math.abs(
      Number(
        value ||
        0
      )
    );


  const maximum =
    Math.max(
      Number(
        maximumValue ||
        0
      ),
      1
    );


  const ratio =
    Math.max(
      0,
      Math.min(
        1,
        numericValue /
        maximum
      )
    );


  if (
    mode ===
    "data bars"
  ) {

    indicator.className =
      "pd-live-table-data-bar";


    indicator.style.setProperty(
      "--pd-table-bar-width",
      Math.round(
        ratio *
        100
      ) +
      "%"
    );


    indicator.title =
      Math.round(
        ratio *
        100
      ) +
      "% of maximum";


    return indicator;

  }


  if (
    mode ===
    "icons"
  ) {

    indicator.className =
      "pd-live-table-icon";


    indicator.textContent =
      ratio >= 0.67
        ? "â–²"
        : ratio >= 0.34
          ? "â—"
          : "â–¼";


    return indicator;

  }


  if (
    mode ===
    "color scale"
  ) {

    indicator.className =
      "pd-live-table-scale";


    indicator.style.opacity =
      String(
        0.25 +
        (
          ratio *
          0.75
        )
      );


    return indicator;

  }


  indicator.textContent =
    "â€”";


  return indicator;

}

// ============================================================
// LIVE PREVIEW - SLICERS
// ============================================================

// ============================================================
// LIVE PREVIEW - SLICERS
// ============================================================

// ============================================================
// LIVE SLICER FILTER STATE ENGINE
// ============================================================

function getActiveSlicerValues(
  slicer
) {

  if (
    !slicer ||
    !slicer.column
  ) {

    return [];

  }


  const filters =
    dashboardState.activeFilters &&
    typeof dashboardState.activeFilters ===
      "object"
      ? dashboardState.activeFilters
      : {};


  const values =
    filters[
      slicer.column
    ];


  return Array.isArray(
    values
  )
    ? values
    : [];

}


// ============================================================
// CHECK WHETHER SLICER VALUE IS SELECTED
// ============================================================

function isSlicerValueActive(
  slicer,
  value
) {

  const activeValues =
    getActiveSlicerValues(
      slicer
    );


  return activeValues.some(
    function (activeValue) {

      return (
        String(
          activeValue
        ) ===
        String(
          value
        )
      );

    }
  );

}


// ============================================================
// CHECK WHETHER SLICER IS CURRENTLY "ALL"
// ============================================================

function isSlicerAllActive(
  slicer
) {

  return (
    getActiveSlicerValues(
      slicer
    ).length === 0
  );

}

// ============================================================
// LIVE SLICER SELECTION ENGINE
// ============================================================

function toggleLiveSlicerValue(
  slicer,
  value
) {

  if (
    !slicer ||
    !slicer.column
  ) {

    return;

  }


  if (
    !dashboardState.activeFilters ||
    typeof dashboardState.activeFilters !==
      "object"
  ) {

    dashboardState.activeFilters =
      {};

  }


  const column =
    slicer.column;


  const selectionMode =
    String(
      slicer.selectionMode ||
      "Multi Select"
    )
      .trim()
      .toLowerCase();


  // ==========================================================
  // SINGLE SELECT
  // ==========================================================

  if (
    selectionMode ===
    "single select"
  ) {

    dashboardState.activeFilters[
      column
    ] = [
      value
    ];

  }

  // ==========================================================
  // MULTI SELECT
  // ==========================================================

  else {

    const currentValues =
      Array.isArray(
        dashboardState.activeFilters[
          column
        ]
      )
        ? [
            ...dashboardState.activeFilters[
              column
            ]
          ]
        : [];


    const existingIndex =
      currentValues.findIndex(
        function (currentValue) {

          return (
            String(
              currentValue
            ) ===
            String(
              value
            )
          );

        }
      );


    if (
      existingIndex === -1
    ) {

      currentValues.push(
        value
      );

    }
    else {

      currentValues.splice(
        existingIndex,
        1
      );

    }


    if (
      currentValues.length === 0
    ) {

      delete dashboardState.activeFilters[
        column
      ];

    }
    else {

      dashboardState.activeFilters[
        column
      ] =
        currentValues;

    }

  }


  updatePreview();

}

// ============================================================
// CLEAR ALL LIVE SLICER FILTERS
// ============================================================

function clearAllLiveSlicerFilters() {

  dashboardState.activeFilters =
    {};

  updatePreview();

  setStatus(
    "All dashboard filters cleared"
  );

}

// ============================================================
// GET SOURCE VALUES FILTERED BY OTHER SLICERS
// ============================================================

function getCrossFilteredSourceValues(
  excludedColumn
) {

  const sourceValues =
    Array.isArray(
      dashboardState.sourceValues
    )
      ? dashboardState.sourceValues
      : [];


  if (
    sourceValues.length === 0
  ) {

    return [];

  }


  const headers =
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  if (
    headers.length === 0
  ) {

    return sourceValues;

  }


  const activeFilters =
    dashboardState.activeFilters &&
    typeof dashboardState.activeFilters ===
      "object"
      ? dashboardState.activeFilters
      : {};


  const excludedName =
    String(
      excludedColumn ||
      ""
    ).trim();


    const filterColumns =
  Object.keys(
    activeFilters
  ).filter(
    function (columnName) {

      const values =
        activeFilters[
          columnName
        ];


      const hasValues =
        Array.isArray(
          values
        ) &&
        values.length > 0;


      if (
        !hasValues
      ) {

        return false;

      }


      return (
        String(
          columnName
        ).trim() !==
        excludedName
      );

    }
  );


  // No OTHER slicers are active.
  // Return complete source data.

  if (
    filterColumns.length === 0
  ) {

    return sourceValues;

  }


  const filterDefinitions =
    [];


  filterColumns.forEach(
    function (columnName) {

      const columnIndex =
        headers.findIndex(
          function (header) {

            return (
              String(
                header === null ||
                header === undefined
                  ? ""
                  : header
              ).trim() ===
              String(
                columnName
              ).trim()
            );

          }
        );


      if (
        columnIndex === -1
      ) {

        return;

      }


      const selectedValues =
        activeFilters[
          columnName
        ].map(
          function (value) {

            return normalizeLiveSlicerValue(
              value
            );

          }
        );


      filterDefinitions.push({

        columnIndex:
          columnIndex,

        selectedValues:
          selectedValues

      });

    }
  );


  if (
    filterDefinitions.length === 0
  ) {

    return sourceValues;

  }


  const filteredRows =
    sourceValues
      .slice(1)
      .filter(
        function (row) {

          if (
            !Array.isArray(
              row
            )
          ) {

            return false;

          }


          return filterDefinitions.every(
            function (filterDefinition) {

              const rowValue =
                normalizeLiveSlicerValue(
                  row[
                    filterDefinition
                      .columnIndex
                  ]
                );


              return (
                filterDefinition
                  .selectedValues
                  .indexOf(
                    rowValue
                  ) !==
                -1
              );

            }
          );

        }
      );


  return [
    headers,
    ...filteredRows
  ];

}

// ============================================================
// CHECK WHETHER A SLICER FILTER TARGETS A DASHBOARD OBJECT
// ============================================================

function doesSlicerFilterTarget(
  columnName,
  targetType
) {

  const normalizedColumn =
    String(
      columnName ||
      ""
    ).trim();


  const normalizedTarget =
    String(
      targetType ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    !normalizedColumn ||
    !normalizedTarget
  ) {

    return true;

  }


  const matchingSlicers =
    Array.isArray(
      dashboardState.slicers
    )
      ? dashboardState.slicers.filter(
          function (slicer) {

            return (
              slicer &&
              String(
                slicer.column ||
                ""
              ).trim() ===
                normalizedColumn
            );

          }
        )
      : [];


  // Backward compatibility:
  // if no matching slicer definition exists,
  // keep the filter active.
  if (
    matchingSlicers.length === 0
  ) {

    return true;

  }


  return matchingSlicers.some(
    function (slicer) {

      const connectionMode =
        String(
          slicer.connection ||
          "All Charts & KPIs"
        )
          .trim()
          .toLowerCase();


      // ======================================================
      // ALL DASHBOARD OBJECTS
      // ======================================================

      if (
        connectionMode ===
        "all dashboard objects"
      ) {

        return true;

      }


      // ======================================================
      // ALL CHARTS & KPIS
      // ======================================================

      if (
        connectionMode ===
        "all charts & kpis"
      ) {

        return (
          normalizedTarget ===
            "kpis" ||
          normalizedTarget ===
            "charts"
        );

      }


      // ======================================================
      // CUSTOM CONNECTIONS
      // ======================================================

      const targets =
        slicer.connectionTargets &&
        typeof slicer.connectionTargets ===
          "object"
          ? slicer.connectionTargets
          : {
              kpis: true,
              charts: true,
              tables: true
            };


      if (
        normalizedTarget ===
        "kpis"
      ) {

        return (
          targets.kpis !==
          false
        );

      }


      if (
        normalizedTarget ===
        "charts"
      ) {

        return (
          targets.charts !==
          false
        );

      }


      if (
        normalizedTarget ===
        "tables"
      ) {

        return (
          targets.tables !==
          false
        );

      }


      return true;

    }
  );

}

// ============================================================
// FILTERED SOURCE ROWS ENGINE
// ============================================================

function getFilteredSourceValues(
  targetType
) {

  const sourceValues =
    Array.isArray(
      dashboardState.sourceValues
    )
      ? dashboardState.sourceValues
      : [];


  if (
    sourceValues.length === 0
  ) {

    return [];

  }


  const headers =
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  if (
    headers.length === 0
  ) {

    return sourceValues;

  }


  const activeFilters =
    dashboardState.activeFilters &&
    typeof dashboardState.activeFilters ===
      "object"
      ? dashboardState.activeFilters
      : {};


    const filterColumns =
  Object.keys(
    activeFilters
  ).filter(
    function (columnName) {

      const values =
        activeFilters[
          columnName
        ];


      const hasValues =
        Array.isArray(
          values
        ) &&
        values.length > 0;


      if (
        !hasValues
      ) {

        return false;

      }


      if (
        !targetType
      ) {

        return true;

      }


      return doesSlicerFilterTarget(
        columnName,
        targetType
      );

    }
  );


  // No active filters.
  // Return original source data including header row.

  if (
    filterColumns.length === 0
  ) {

    return sourceValues;

  }


  // ==========================================================
  // RESOLVE FILTER COLUMN INDEXES
  // ==========================================================

  const filterDefinitions =
    [];


  filterColumns.forEach(
    function (columnName) {

      const columnIndex =
        headers.findIndex(
          function (header) {

            return (
              String(
                header === null ||
                header === undefined
                  ? ""
                  : header
              ).trim() ===
              String(
                columnName
              ).trim()
            );

          }
        );


      if (
        columnIndex === -1
      ) {

        return;

      }


      const selectedValues =
        activeFilters[
          columnName
        ].map(
          function (value) {

            return normalizeLiveSlicerValue(
              value
            );

          }
        );


      filterDefinitions.push({

        column:
          columnName,

        columnIndex:
          columnIndex,

        selectedValues:
          selectedValues

      });

    }
  );


  if (
    filterDefinitions.length === 0
  ) {

    return sourceValues;

  }


  // ==========================================================
  // FILTER DATA ROWS
  //
  // Different slicers = AND
  // Values inside same slicer = OR
  // ==========================================================

  const filteredRows =
    sourceValues
      .slice(1)
      .filter(
        function (row) {

          if (
            !Array.isArray(
              row
            )
          ) {

            return false;

          }


          return filterDefinitions.every(
            function (filterDefinition) {

              const rowValue =
                normalizeLiveSlicerValue(
                  row[
                    filterDefinition
                      .columnIndex
                  ]
                );


              return (
                filterDefinition
                  .selectedValues
                  .indexOf(
                    rowValue
                  ) !==
                -1
              );

            }
          );

        }
      );


  return [
    headers,
    ...filteredRows
  ];

}


// ============================================================
// NORMALIZE LIVE SLICER VALUE
// ============================================================

function normalizeLiveSlicerValue(
  value
) {

  if (
    value === null ||
    value === undefined ||
    String(
      value
    ).trim() ===
      ""
  ) {

    return "(Blank)";

  }


  return String(
    value
  ).trim();

}

// ============================================================
// GET TIMELINE GROUP INFO
// Year / Quarter / Month / Date
// ============================================================

function getTimelineGroupInfo(
  slicer,
  value
) {

  const timestamp =
    parseLiveSlicerDateValue(
      value
    );


  if (
    !Number.isFinite(
      timestamp
    )
  ) {

    return {
      key: String(value),
      label: String(value),
      timestamp: NaN
    };

  }


  const date =
    new Date(
      timestamp
    );


  const year =
    date.getUTCFullYear();


  const monthIndex =
    date.getUTCMonth();


  const day =
    date.getUTCDate();


  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];


  const grouping =
    String(
      slicer &&
      slicer.timelineGrouping
        ? slicer.timelineGrouping
        : "Month"
    )
      .trim()
      .toLowerCase();


  if (grouping === "year") {

    return {
      key:
        "year:" +
        year,

      label:
        String(year),

      timestamp:
        Date.UTC(
          year,
          0,
          1
        )
    };

  }


  if (grouping === "quarter") {

    const quarter =
      Math.floor(
        monthIndex / 3
      ) + 1;


    return {
      key:
        "quarter:" +
        year +
        ":" +
        quarter,

      label:
        "Q" +
        quarter +
        " " +
        year,

      timestamp:
        Date.UTC(
          year,
          (quarter - 1) * 3,
          1
        )
    };

  }


  if (grouping === "month") {

    return {
      key:
        "month:" +
        year +
        ":" +
        monthIndex,

      label:
        monthNames[
          monthIndex
        ] +
        "-" +
        year,

      timestamp:
        Date.UTC(
          year,
          monthIndex,
          1
        )
    };

  }


  const paddedDay =
    String(
      day
    ).padStart(
      2,
      "0"
    );


  return {
    key:
      "date:" +
      year +
      ":" +
      monthIndex +
      ":" +
      day,

    label:
      paddedDay +
      "-" +
      monthNames[
        monthIndex
      ] +
      "-" +
      year,

    timestamp:
      Date.UTC(
        year,
        monthIndex,
        day
      )
  };

}

// ============================================================
// FORMAT LIVE SLICER DISPLAY VALUE
// Keeps raw filter value unchanged.
// ============================================================

function formatLiveSlicerDisplayValue(
  slicer,
  value
) {

  const slicerType =
    String(
      slicer &&
      slicer.type
        ? slicer.type
        : ""
    )
      .trim()
      .toLowerCase();


    const isTimeline =
    slicerType ===
      "timeline";


  const isDateSlicer =
    slicerType ===
      "date slicer";


  if (isTimeline) {

    return getTimelineGroupInfo(
      slicer,
      value
    ).label;

  }


  if (!isDateSlicer) {

    return String(
      value
    );

  }


  const timestamp =
    parseLiveSlicerDateValue(
      value
    );


  if (
    !Number.isFinite(
      timestamp
    )
  ) {

    return String(
      value
    );

  }


  const date =
    new Date(
      timestamp
    );


  const day =
    String(
      date.getUTCDate()
    ).padStart(
      2,
      "0"
    );


  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];


  const month =
    monthNames[
      date.getUTCMonth()
    ];


  const year =
    date.getUTCFullYear();


  return (
    day +
    "-" +
    month +
    "-" +
    year
  );

}


function renderLivePreviewSlicers() {

  const container =
    document.getElementById(
      "previewSlicerContainer"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  // ==========================================================
  // FILTER PANEL TITLE
  // ==========================================================

  const headingRow =
  document.createElement(
    "div"
  );


headingRow.className =
  "pd-live-slicer-heading-row";


const headingGroup =
  document.createElement(
    "div"
  );


headingGroup.className =
  "pd-live-slicer-heading-group";


const heading =
  document.createElement(
    "div"
  );


heading.className =
  "pd-widget-title";


heading.textContent =
  "Filters";


const activeFilterCount =
  dashboardState.activeFilters &&
  typeof dashboardState.activeFilters ===
    "object"
    ? Object.keys(
        dashboardState.activeFilters
      ).filter(
        function (columnName) {

          const values =
            dashboardState.activeFilters[
              columnName
            ];


          return (
            Array.isArray(
              values
            ) &&
            values.length > 0
          );

        }
      ).length
    : 0;


const activeCount =
  document.createElement(
    "span"
  );


activeCount.className =
  "pd-live-slicer-active-count";


activeCount.textContent =
  activeFilterCount === 1
    ? "1 active"
    : activeFilterCount +
      " active";


headingGroup.appendChild(
  heading
);


headingGroup.appendChild(
  activeCount
);


const clearAllButton =
  document.createElement(
    "button"
  );


clearAllButton.type =
  "button";


clearAllButton.className =
  "pd-live-slicer-clear-all";


clearAllButton.textContent =
  "Clear All";


clearAllButton.disabled =
  !dashboardState.activeFilters ||
  Object.keys(
    dashboardState.activeFilters
  ).length === 0;


clearAllButton.addEventListener(
  "click",
  function () {

    clearAllLiveSlicerFilters();

  }
);


headingRow.appendChild(
  headingGroup
);


headingRow.appendChild(
  clearAllButton
);


container.appendChild(
  headingRow
);


  const slicers =
    Array.isArray(
      dashboardState.slicers
    )
      ? dashboardState.slicers
      : [];


  if (
    slicers.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "pd-preview-empty";


    empty.textContent =
      "Add slicers to create dashboard filters.";


    container.appendChild(
      empty
    );


    return;

  }


  // ==========================================================
  // RENDER EACH SLICER
  // ==========================================================

  slicers.forEach(
    function (slicer) {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "pd-live-slicer";


      // ======================================================
      // TITLE
      // ======================================================

      const title =
        document.createElement(
          "div"
        );


      title.className =
        "pd-live-slicer-title";


      title.textContent =
        slicer.title ||
        slicer.column ||
        "Filter";


      // ======================================================
      // VALUES
      // ======================================================

      const control =
        document.createElement(
          "div"
        );


      control.className =
        "pd-live-slicer-control";


      const allOption =
        document.createElement(
          "span"
        );


      allOption.className =
  isSlicerAllActive(
    slicer
  )
    ? "active"
    : "";


allOption.textContent =
  "All";


allOption.title =
  "Clear filter";


allOption.addEventListener(
  "click",
  function () {

    if (
      dashboardState.activeFilters &&
      slicer.column
    ) {

      delete dashboardState.activeFilters[
        slicer.column
      ];

    }


    updatePreview();

  }
);


control.appendChild(
  allOption
);


      const slicerValues =
        getLivePreviewSlicerValues(
          slicer
        );


      if (
        slicerValues.length === 0
      ) {

        const noValues =
          document.createElement(
            "span"
          );


        noValues.textContent =
          "No Values";


        control.appendChild(
          noValues
        );

      }
      else {

        // Keep preview compact.
        const visibleLimit =
          8;


        slicerValues
          .slice(
            0,
            visibleLimit
          )
          .forEach(
            function (value) {

              const option =
                document.createElement(
                  "span"
                );


                const displayValue =
  formatLiveSlicerDisplayValue(
    slicer,
    value
  );


option.textContent =
  displayValue;


option.title =
  displayValue;


if (
  isSlicerValueActive(
    slicer,
    value
  )
) {

  option.classList.add(
    "active"
  );

}


option.addEventListener(
  "click",
  function () {

    toggleLiveSlicerValue(
      slicer,
      value
    );

  }
);


control.appendChild(
  option
);

            }
          );


              if (
          slicerValues.length >
          visibleLimit
        ) {

          const more =
            document.createElement(
              "span"
            );


          more.className =
            "pd-live-slicer-more";


          more.textContent =
            "+" +
            (
              slicerValues.length -
              visibleLimit
            ) +
            " more";


          more.title =
            "Show all slicer values";


          more.addEventListener(
            "click",
            function () {

              // Remove the "+N more" control.
              more.remove();


              // Render remaining slicer values.
              slicerValues
                .slice(
                  visibleLimit
                )
                .forEach(
                  function (value) {

                    const option =
                      document.createElement(
                        "span"
                      );


                    const displayValue =
  formatLiveSlicerDisplayValue(
    slicer,
    value
  );


option.textContent =
  displayValue;


option.title =
  displayValue;


                    option.className =
                      isSlicerValueActive(
                        slicer,
                        value
                      )
                        ? "active"
                        : "";


                    option.addEventListener(
                      "click",
                      function () {

                        toggleLiveSlicerValue(
                          slicer,
                          value
                        );

                      }
                    );


                    control.appendChild(
                      option
                    );

                  }
                );


              // Add "Show less".
              const showLess =
                document.createElement(
                  "span"
                );


              showLess.className =
                "pd-live-slicer-more";


              showLess.textContent =
                "Show less";


              showLess.title =
                "Show fewer slicer values";


              showLess.addEventListener(
                "click",
                function () {

                  updatePreview();

                }
              );


              control.appendChild(
                showLess
              );

            }
          );


          control.appendChild(
            more
          );

        }

      }


      // ======================================================
      // META
      // ======================================================

      const meta =
        document.createElement(
          "small"
        );


      meta.className =
        "pd-live-slicer-meta";


      meta.textContent =
        (
          slicer.type ||
          "Slicer"
        ) +
        " â€¢ " +
        (
          slicer.orientation ||
          "Vertical"
        ) +
        (
          slicer.connection
            ? " â€¢ " +
              slicer.connection
            : ""
        );


      item.appendChild(
        title
      );


      item.appendChild(
        control
      );


      item.appendChild(
        meta
      );


      container.appendChild(
        item
      );

    }
  );

}


// ============================================================
// PARSE LIVE SLICER DATE VALUE
// Supports Excel serial dates + normal date text
// ============================================================

function parseLiveSlicerDateValue(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return NaN;

  }


  const text =
    String(
      value
    ).trim();


  if (!text) {
    return NaN;
  }


  // ==========================================================
  // EXCEL SERIAL DATE
  // ==========================================================

  const numericValue =
    Number(
      text
    );


  if (
    Number.isFinite(
      numericValue
    ) &&
    numericValue >= 20000 &&
    numericValue <= 100000
  ) {

    const excelEpoch =
      Date.UTC(
        1899,
        11,
        30
      );


    return (
      excelEpoch +
      numericValue *
      86400000
    );

  }


  // ==========================================================
  // STANDARD DATE TEXT
  // ==========================================================

  const parsedTimestamp =
    Date.parse(
      text
    );


  if (
    Number.isFinite(
      parsedTimestamp
    )
  ) {

    return parsedTimestamp;

  }


  // ==========================================================
  // DD/MM/YYYY OR DD-MM-YYYY
  // ==========================================================

  const dateParts =
    text.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
    );


  if (dateParts) {

    const day =
      Number(
        dateParts[1]
      );

    const month =
      Number(
        dateParts[2]
      );

    const year =
      Number(
        dateParts[3]
      );


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    if (
      date.getFullYear() === year &&
      date.getMonth() ===
        month - 1 &&
      date.getDate() === day
    ) {

      return date.getTime();

    }

  }


  return NaN;

}

// ============================================================
// GET ACTUAL SLICER VALUES FROM SOURCE DATA
// ============================================================

function getLivePreviewSlicerValues(
  slicer
) {

  if (!slicer) {

    return [];

  }


const sourceValues =
  getCrossFilteredSourceValues(
    slicer.column
  );


  if (
    sourceValues.length < 2
  ) {

    return [];

  }


  const headers =
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  const columnName =
    String(
      slicer.column ||
      ""
    ).trim();


  const columnIndex =
    findPreviewColumnIndex(
      headers,
      columnName
    );


  if (
    columnIndex === -1
  ) {

    return [];

  }


  const uniqueValues =
    new Set();


  for (
    let rowIndex = 1;
    rowIndex < sourceValues.length;
    rowIndex++
  ) {

    const row =
      sourceValues[
        rowIndex
      ];


    if (
      !Array.isArray(
        row
      )
    ) {

      continue;

    }


    const rawValue =
      row[
        columnIndex
      ];


    if (
      rawValue === null ||
      rawValue === undefined ||
      String(
        rawValue
      ).trim() ===
        ""
    ) {

      continue;

    }


    uniqueValues.add(
      String(
        rawValue
      ).trim()
    );

  }


  const slicerValues =
  Array.from(
    uniqueValues
  );


const slicerType =
  String(
    slicer.type ||
    "Category Slicer"
  )
    .trim()
    .toLowerCase();


const isTimeline =
  slicerType ===
    "timeline";


const isDateSlicer =
  slicerType ===
    "date slicer";


// ==========================================================
// TIMELINE
// Build one representative value per Year / Quarter / Month / Date
// ==========================================================

if (isTimeline) {

  const timelineGroups =
    new Map();


  slicerValues.forEach(
    function (value) {

      const groupInfo =
        getTimelineGroupInfo(
          slicer,
          value
        );


      if (
        !timelineGroups.has(
          groupInfo.key
        )
      ) {

        timelineGroups.set(
          groupInfo.key,
          {
            value:
              value,

            timestamp:
              groupInfo.timestamp
          }
        );

      }

    }
  );


  return Array.from(
    timelineGroups.values()
  )
    .sort(
      function (
        first,
        second
      ) {

        const firstValid =
          Number.isFinite(
            first.timestamp
          );


        const secondValid =
          Number.isFinite(
            second.timestamp
          );


        if (
          firstValid &&
          secondValid
        ) {

          return (
            first.timestamp -
            second.timestamp
          );

        }


        if (firstValid) {
          return -1;
        }


        if (secondValid) {
          return 1;
        }


        return String(
          first.value
        ).localeCompare(
          String(
            second.value
          ),
          undefined,
          {
            numeric: true,
            sensitivity: "base"
          }
        );

      }
    )
    .map(
      function (group) {

        return group.value;

      }
    );

}


// ==========================================================
// DATE SLICER
// Keep existing individual-date behavior
// ==========================================================

if (isDateSlicer) {

  return slicerValues.sort(
    function (
      first,
      second
    ) {

      const firstDate =
        parseLiveSlicerDateValue(
          first
        );


      const secondDate =
        parseLiveSlicerDateValue(
          second
        );


      const firstValid =
        Number.isFinite(
          firstDate
        );


      const secondValid =
        Number.isFinite(
          secondDate
        );


      if (
        firstValid &&
        secondValid
      ) {

        return (
          firstDate -
          secondDate
        );

      }


      if (firstValid) {
        return -1;
      }


      if (secondValid) {
        return 1;
      }


      return String(
        first
      ).localeCompare(
        String(
          second
        ),
        undefined,
        {
          numeric: true,
          sensitivity: "base"
        }
      );

    }
  );

}


return slicerValues.sort(
  function (
    first,
    second
  ) {

    return String(
      first
    ).localeCompare(
      String(
        second
      ),
      undefined,
      {
        numeric: true,
        sensitivity: "base"
      }
    );

  }
);

}

// ============================================================
// LIVE PREVIEW - CHARTS
// ============================================================

// ============================================================
// LIVE PREVIEW - CHARTS
// ============================================================

function renderLivePreviewCharts() {

  const container =
    document.getElementById(
      "previewChartContainer"
    );


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  const charts =
    Array.isArray(
      dashboardState.charts
    )
      ? dashboardState.charts
      : [];


  if (
    charts.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );


    empty.className =
      "pd-preview-empty";


    empty.textContent =
      "Add charts to continue building the dashboard.";


    container.appendChild(
      empty
    );


    return;

  }


  charts.forEach(
    function (chart) {

      const widget =
        document.createElement(
          "div"
        );


      widget.className =
        "pd-widget pd-chart-widget";


      // ======================================================
      // TITLE
      // ======================================================

      const title =
        document.createElement(
          "div"
        );


      title.className =
        "pd-widget-title";


      title.textContent =
        chart.title ||
        "Dashboard Chart";


      // ======================================================
      // META
      // ======================================================

      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "pd-preview-chart-meta";


      meta.textContent =
        (
          chart.type ||
          "Column"
        ) +
        " â€¢ " +
        (
          chart.xAxis ||
          "X Axis"
        ) +
        " â†’ " +
        (
          chart.yAxis ||
          "Y Axis"
        );


      // ======================================================
      // GET ACTUAL CHART DATA
      // ======================================================

      const chartData =
        getLivePreviewChartData(
          chart
        );


        const visual =
  document.createElement(
    "div"
  );


const chartType =
  String(
    chart.type ||
    "Column"
  )
    .trim()
    .toLowerCase();


if (
  chartType ===
  "bar"
) {

  visual.className =
    "pd-live-chart-placeholder pd-live-chart-horizontal";

}
else {

  visual.className =
    "pd-live-chart-placeholder pd-live-chart-vertical";

}


if (
  chartData.length === 0
) {

  const empty =
    document.createElement(
      "div"
    );


  empty.className =
    "pd-live-chart-empty";


  const hasActiveFilters =
    dashboardState.activeFilters &&
    Object.keys(
      dashboardState.activeFilters
    ).length > 0;


  empty.textContent =
    hasActiveFilters
      ? "No data for current filters"
      : "No preview data";


  visual.appendChild(
    empty
  );

}
else {

  const maximumValue =
    Math.max(
      ...chartData.map(
        function (item) {

          return Math.abs(
            Number(
              item.value ||
              0
            )
          );

        }
      ),
      1
    );


  if (
    chartType ===
    "bar"
  ) {

    // ======================================================
    // HORIZONTAL BAR CHART
    // ======================================================

    chartData.forEach(
      function (item) {

        const barItem =
          document.createElement(
            "div"
          );


        barItem.className =
          "pd-live-chart-horizontal-item";


        const categoryLabel =
          document.createElement(
            "span"
          );


        categoryLabel.className =
          "pd-live-chart-horizontal-category";


        categoryLabel.textContent =
          String(
            item.category
          );


        categoryLabel.title =
          String(
            item.category
          );


        const track =
          document.createElement(
            "div"
          );


        track.className =
          "pd-live-chart-horizontal-track";


        const bar =
          document.createElement(
            "div"
          );


        bar.className =
          "pd-live-chart-horizontal-bar";


        const percentage =
          Math.max(
            5,
            Math.round(
              (
                Math.abs(
                  Number(
                    item.value ||
                    0
                  )
                ) /
                maximumValue
              ) *
              100
            )
          );


        bar.style.width =
          percentage +
          "%";


        bar.title =
          item.category +
          ": " +
          item.value;


        track.appendChild(
          bar
        );


        const valueLabel =
  document.createElement(
    "span"
  );


valueLabel.className =
  "pd-live-chart-horizontal-value";


valueLabel.textContent =
  formatPreviewNumber(
    item.value
  );


barItem.appendChild(
  categoryLabel
);


barItem.appendChild(
  track
);


if (
  String(
    chart.dataLabels ||
    "Show"
  )
    .trim()
    .toLowerCase() ===
    "show"
) {

  barItem.appendChild(
    valueLabel
  );

}


        visual.appendChild(
          barItem
        );

      }
        );

  }
  else if (
    chartType ===
    "line"
  ) {

    // ======================================================
    // LINE CHART
    // ======================================================

    visual.className =
      "pd-live-chart-line-area";


    const svgNamespace =
      "http://www.w3.org/2000/svg";


    const svg =
      document.createElementNS(
        svgNamespace,
        "svg"
      );


    svg.setAttribute(
      "viewBox",
      "0 0 100 100"
    );


    svg.setAttribute(
  "preserveAspectRatio",
  "xMidYMid meet"
);


    svg.classList.add(
      "pd-live-chart-svg"
    );


    const pointCount =
      Math.max(
        1,
        chartData.length - 1
      );


    const points =
      chartData.map(
        function (
          item,
          index
        ) {

          const x =
            chartData.length === 1
              ? 50
              : (
                  index /
                  pointCount
                ) *
                100;


          const normalized =
            Math.abs(
              Number(
                item.value ||
                0
              )
            ) /
            maximumValue;


          const y =
            90 -
            (
              normalized *
              75
            );


          return {
            x:
              x,

            y:
              y,

            item:
              item
          };

        }
      );


    const polyline =
      document.createElementNS(
        svgNamespace,
        "polyline"
      );


    polyline.setAttribute(
      "points",
      points
        .map(
          function (point) {

            return (
              point.x +
              "," +
              point.y
            );

          }
        )
        .join(" ")
    );


    polyline.classList.add(
      "pd-live-chart-line-path"
    );


    svg.appendChild(
      polyline
    );


    points.forEach(
      function (point) {

        const circle =
          document.createElementNS(
            svgNamespace,
            "circle"
          );


        circle.setAttribute(
          "cx",
          point.x
        );


        circle.setAttribute(
          "cy",
          point.y
        );


        circle.setAttribute(
          "r",
          "2.1"
        );


        circle.classList.add(
          "pd-live-chart-line-point"
        );


        const tooltip =
          document.createElementNS(
            svgNamespace,
            "title"
          );


        tooltip.textContent =
          point.item.category +
          ": " +
          point.item.value;


        circle.appendChild(
          tooltip
        );


        svg.appendChild(
          circle
        );

      }
    );


    visual.appendChild(
      svg
    );


    const labels =
      document.createElement(
        "div"
      );


    labels.className =
      "pd-live-chart-axis-labels";


    chartData.forEach(
      function (item) {

        const label =
          document.createElement(
            "span"
          );


        label.textContent =
          String(
            item.category
          );


        label.title =
          String(
            item.category
          );


        labels.appendChild(
          label
        );

      }
    );


    visual.appendChild(
      labels
    );

  }
  else if (
    chartType ===
    "area"
  ) {

    // ======================================================
    // AREA CHART
    // ======================================================

    visual.className =
      "pd-live-chart-line-area";


    const svgNamespace =
      "http://www.w3.org/2000/svg";


    const svg =
      document.createElementNS(
        svgNamespace,
        "svg"
      );


    svg.setAttribute(
      "viewBox",
      "0 0 100 100"
    );


    svg.setAttribute(
      "preserveAspectRatio",
      "none"
    );


    svg.classList.add(
      "pd-live-chart-svg"
    );


    const pointCount =
      Math.max(
        1,
        chartData.length - 1
      );


    const points =
      chartData.map(
        function (
          item,
          index
        ) {

          const x =
            chartData.length === 1
              ? 50
              : (
                  index /
                  pointCount
                ) *
                100;


          const normalized =
            Math.abs(
              Number(
                item.value ||
                0
              )
            ) /
            maximumValue;


          const y =
            90 -
            (
              normalized *
              75
            );


          return {
            x:
              x,

            y:
              y,

            item:
              item
          };

        }
      );


    const areaPolygon =
      document.createElementNS(
        svgNamespace,
        "polygon"
      );


    const areaPoints =
      [
        "0,90",
        ...points.map(
          function (point) {

            return (
              point.x +
              "," +
              point.y
            );

          }
        ),
        "100,90"
      ]
        .join(" ");


    areaPolygon.setAttribute(
      "points",
      areaPoints
    );


    areaPolygon.classList.add(
      "pd-live-chart-area-fill"
    );


    svg.appendChild(
      areaPolygon
    );


    const polyline =
      document.createElementNS(
        svgNamespace,
        "polyline"
      );


    polyline.setAttribute(
      "points",
      points
        .map(
          function (point) {

            return (
              point.x +
              "," +
              point.y
            );

          }
        )
        .join(" ")
    );


    polyline.classList.add(
      "pd-live-chart-line-path"
    );


    svg.appendChild(
      polyline
    );


    points.forEach(
      function (point) {

        const circle =
          document.createElementNS(
            svgNamespace,
            "circle"
          );


        circle.setAttribute(
          "cx",
          point.x
        );


        circle.setAttribute(
          "cy",
          point.y
        );


        circle.setAttribute(
          "r",
          "2"
        );


        circle.classList.add(
          "pd-live-chart-line-point"
        );


        const tooltip =
          document.createElementNS(
            svgNamespace,
            "title"
          );


        tooltip.textContent =
          point.item.category +
          ": " +
          point.item.value;


        circle.appendChild(
          tooltip
        );


        svg.appendChild(
          circle
        );

      }
    );


    visual.appendChild(
      svg
    );


    const labels =
      document.createElement(
        "div"
      );


    labels.className =
      "pd-live-chart-axis-labels";


    chartData.forEach(
      function (item) {

        const label =
          document.createElement(
            "span"
          );


        label.textContent =
          String(
            item.category
          );


        label.title =
          String(
            item.category
          );


        labels.appendChild(
          label
        );

      }
    );


    visual.appendChild(
      labels
    );

    }
  else if (
    chartType ===
      "pie" ||
    chartType ===
      "doughnut"
  ) {

    // ======================================================
    // PIE / DOUGHNUT CHART
    // ======================================================

    visual.className =
      "pd-live-chart-pie-layout";


    const pieData =
      chartData
        .map(
          function (item) {

            return {

              category:
                item.category,

              value:
                Math.abs(
                  Number(
                    item.value ||
                    0
                  )
                )

            };

          }
        )
        .filter(
          function (item) {

            return (
              item.value >
              0
            );

          }
        );


    const totalValue =
      pieData.reduce(
        function (
          total,
          item
        ) {

          return (
            total +
            item.value
          );

        },
        0
      );


    if (
      pieData.length === 0 ||
      totalValue <= 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.className =
        "pd-live-chart-empty";


      empty.textContent =
        "No positive values available";


      visual.appendChild(
        empty
      );

    }
    else {

      const pieSection =
        document.createElement(
          "div"
        );


      pieSection.className =
        "pd-live-chart-pie-section";


      const pie =
        document.createElement(
          "div"
        );


      pie.className =
        chartType ===
          "doughnut"
          ? "pd-live-chart-pie pd-live-chart-doughnut"
          : "pd-live-chart-pie";


      const colors = [
        "#7c3aed",
        "#2563eb",
        "#14b8a6",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#84cc16",
        "#ec4899",
        "#64748b"
      ];


      let currentPercent =
        0;


      const gradientParts =
        [];


      pieData.forEach(
        function (
          item,
          index
        ) {

          const slicePercent =
            (
              item.value /
              totalValue
            ) *
            100;


          const endPercent =
            currentPercent +
            slicePercent;


          const color =
            colors[
              index %
              colors.length
            ];


          gradientParts.push(
            color +
            " " +
            currentPercent +
            "% " +
            endPercent +
            "%"
          );


          currentPercent =
            endPercent;

        }
      );


      pie.style.background =
        "conic-gradient(" +
        gradientParts.join(
          ", "
        ) +
        ")";


      pie.title =
        "Total: " +
        formatPreviewNumber(
          totalValue
        );


      if (
        chartType ===
        "doughnut"
      ) {

        const center =
          document.createElement(
            "div"
          );


        center.className =
          "pd-live-chart-doughnut-center";


        const centerValue =
          document.createElement(
            "strong"
          );


        centerValue.textContent =
          formatPreviewNumber(
            totalValue
          );


        const centerLabel =
          document.createElement(
            "span"
          );


        centerLabel.textContent =
          "Total";


        center.appendChild(
          centerValue
        );


        center.appendChild(
          centerLabel
        );


        pie.appendChild(
          center
        );

      }


      pieSection.appendChild(
        pie
      );


      const legend =
        document.createElement(
          "div"
        );


      legend.className =
        "pd-live-chart-pie-legend";


      pieData.forEach(
        function (
          item,
          index
        ) {

          const legendItem =
            document.createElement(
              "div"
            );


          legendItem.className =
            "pd-live-chart-pie-legend-item";


          const marker =
            document.createElement(
              "span"
            );


          marker.className =
            "pd-live-chart-pie-marker";


          marker.style.background =
            colors[
              index %
              colors.length
            ];


          const category =
            document.createElement(
              "span"
            );


          category.className =
            "pd-live-chart-pie-category";


          category.textContent =
            String(
              item.category
            );


          const value =
            document.createElement(
              "strong"
            );


          const percentage =
            (
              item.value /
              totalValue
            ) *
            100;


          value.textContent =
            formatPreviewNumber(
              item.value
            ) +
            " (" +
            percentage.toFixed(
              1
            ) +
            "%)";


          legendItem.appendChild(
  marker
);


legendItem.appendChild(
  category
);


if (
  String(
    chart.dataLabels ||
    "Show"
  )
    .trim()
    .toLowerCase() ===
    "show"
) {

  legendItem.appendChild(
    value
  );

}


          legend.appendChild(
            legendItem
          );

        }
      );


      pieSection.appendChild(
        legend
      );


      visual.appendChild(
        pieSection
      );

    }

    }
  else if (
    chartType ===
    "combo"
  ) {

    // ======================================================
    // COMBO CHART
    // PRIMARY = COLUMNS
    // SECONDARY = LINE
    // ======================================================

    visual.className =
      "pd-live-chart-combo";


    const comboData =
      getLivePreviewComboChartData(
        chart
      );


    if (
      comboData.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.className =
        "pd-live-chart-empty";


      empty.textContent =
        "No preview data";


      visual.appendChild(
        empty
      );

    }
    else {

      const primaryMaximum =
        Math.max(
          ...comboData.map(
            function (item) {

              return Math.abs(
                Number(
                  item.primaryValue ||
                  0
                )
              );

            }
          ),
          1
        );


      const secondaryMaximum =
        Math.max(
          ...comboData.map(
            function (item) {

              return Math.abs(
                Number(
                  item.secondaryValue ||
                  0
                )
              );

            }
          ),
          1
        );


      const plot =
        document.createElement(
          "div"
        );


      plot.className =
        "pd-live-chart-combo-plot";


      const columns =
        document.createElement(
          "div"
        );


      columns.className =
        "pd-live-chart-combo-columns";


      comboData.forEach(
        function (item) {

          const columnItem =
            document.createElement(
              "div"
            );


          columnItem.className =
            "pd-live-chart-combo-column-item";


          const value =
            document.createElement(
              "span"
            );


          value.className =
            "pd-live-chart-combo-primary-value";


          value.textContent =
            formatPreviewNumber(
              item.primaryValue
            );


          const bar =
            document.createElement(
              "div"
            );


          bar.className =
            "pd-live-chart-combo-bar";


          const percentage =
            Math.max(
              6,
              Math.round(
                (
                  Math.abs(
                    Number(
                      item.primaryValue ||
                      0
                    )
                  ) /
                  primaryMaximum
                ) *
                100
              )
            );


          bar.style.height =
            percentage +
            "%";


          bar.title =
            chart.yAxis +
            ": " +
            item.primaryValue;


          const category =
            document.createElement(
              "span"
            );


          category.className =
            "pd-live-chart-combo-category";


          category.textContent =
            String(
              item.category
            );


          category.title =
            String(
              item.category
            );


          if (
  String(
    chart.dataLabels ||
    "Show"
  )
    .trim()
    .toLowerCase() ===
    "show"
) {

  columnItem.appendChild(
    value
  );

}


columnItem.appendChild(
  bar
);


columnItem.appendChild(
  category
);


          columns.appendChild(
            columnItem
          );

        }
      );


      plot.appendChild(
        columns
      );


      // ====================================================
      // SECONDARY LINE SVG
      // ====================================================

      const svgNamespace =
        "http://www.w3.org/2000/svg";


      const svg =
        document.createElementNS(
          svgNamespace,
          "svg"
        );


      svg.setAttribute(
        "viewBox",
        "0 0 100 100"
      );


      svg.setAttribute(
        "preserveAspectRatio",
        "none"
      );


      svg.classList.add(
        "pd-live-chart-combo-svg"
      );


      const pointCount =
        Math.max(
          1,
          comboData.length - 1
        );


      const points =
        comboData.map(
          function (
            item,
            index
          ) {

            const x =
              comboData.length === 1
                ? 50
                : (
                    index /
                    pointCount
                  ) *
                  100;


            const normalized =
              Math.abs(
                Number(
                  item.secondaryValue ||
                  0
                )
              ) /
              secondaryMaximum;


            const y =
              88 -
              (
                normalized *
                72
              );


            return {
              x:
                x,

              y:
                y,

              item:
                item
            };

          }
        );


      const line =
        document.createElementNS(
          svgNamespace,
          "polyline"
        );


      line.setAttribute(
        "points",
        points
          .map(
            function (point) {

              return (
                point.x +
                "," +
                point.y
              );

            }
          )
          .join(" ")
      );


      line.classList.add(
        "pd-live-chart-combo-line"
      );


      svg.appendChild(
        line
      );


      points.forEach(
        function (point) {

          const circle =
            document.createElementNS(
              svgNamespace,
              "circle"
            );


          circle.setAttribute(
            "cx",
            point.x
          );


          circle.setAttribute(
            "cy",
            point.y
          );


          circle.setAttribute(
            "r",
            "2.2"
          );


          circle.classList.add(
            "pd-live-chart-combo-point"
          );


          const tooltip =
            document.createElementNS(
              svgNamespace,
              "title"
            );


          tooltip.textContent =
            chart.secondaryYAxis +
            ": " +
            point.item.secondaryValue;


          circle.appendChild(
            tooltip
          );


          svg.appendChild(
            circle
          );

        }
      );


      plot.appendChild(
        svg
      );


      visual.appendChild(
        plot
      );


      // ====================================================
      // COMBO LEGEND
      // ====================================================

      const legend =
        document.createElement(
          "div"
        );


      legend.className =
        "pd-live-chart-combo-legend";


      const primaryLegend =
        document.createElement(
          "span"
        );


      primaryLegend.textContent =
        "â–  " +
        (
          chart.yAxis ||
          "Primary"
        );


      const secondaryLegend =
        document.createElement(
          "span"
        );


      secondaryLegend.textContent =
        "â— " +
        (
          chart.secondaryYAxis ||
          "Secondary"
        );


      legend.appendChild(
        primaryLegend
      );


      legend.appendChild(
        secondaryLegend
      );


      visual.appendChild(
        legend
      );

    }

    }
  else if (
    chartType ===
    "scatter"
  ) {

    // ======================================================
    // SCATTER CHART
    // ======================================================

    visual.className =
      "pd-live-chart-scatter";


    const scatterData =
      getLivePreviewScatterData(
        chart
      );


    if (
      scatterData.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.className =
        "pd-live-chart-empty";


      empty.textContent =
        "No numeric scatter data";


      visual.appendChild(
        empty
      );

    }
    else {

      const svgNamespace =
        "http://www.w3.org/2000/svg";


      const svg =
        document.createElementNS(
          svgNamespace,
          "svg"
        );


      svg.setAttribute(
        "viewBox",
        "0 0 100 100"
      );


      svg.setAttribute(
  "preserveAspectRatio",
  "xMidYMid meet"
);


      svg.classList.add(
        "pd-live-chart-scatter-svg"
      );


      const xValues =
        scatterData.map(
          function (item) {
            return item.x;
          }
        );


      const yValues =
        scatterData.map(
          function (item) {
            return item.y;
          }
        );


      let minX =
        Math.min(
          ...xValues
        );


      let maxX =
        Math.max(
          ...xValues
        );


      let minY =
        Math.min(
          ...yValues
        );


      let maxY =
        Math.max(
          ...yValues
        );


      if (
        minX ===
        maxX
      ) {

        minX -= 1;
        maxX += 1;

      }


      if (
        minY ===
        maxY
      ) {

        minY -= 1;
        maxY += 1;

      }


      scatterData.forEach(
        function (item) {

          const x =
            8 +
            (
              (
                item.x -
                minX
              ) /
              (
                maxX -
                minX
              )
            ) *
            84;


          const y =
            92 -
            (
              (
                item.y -
                minY
              ) /
              (
                maxY -
                minY
              )
            ) *
            84;


          const circle =
            document.createElementNS(
              svgNamespace,
              "circle"
            );


          circle.setAttribute(
            "cx",
            x
          );


          circle.setAttribute(
            "cy",
            y
          );


          circle.setAttribute(
  "r",
  "2.1"
);


          circle.classList.add(
            "pd-live-chart-scatter-point"
          );


          const tooltip =
            document.createElementNS(
              svgNamespace,
              "title"
            );


          tooltip.textContent =
            (
              chart.xAxis ||
              "X"
            ) +
            ": " +
            item.x +
            " | " +
            (
              chart.yAxis ||
              "Y"
            ) +
            ": " +
            item.y;


          circle.appendChild(
            tooltip
          );


          svg.appendChild(
            circle
          );

        }
      );


      visual.appendChild(
        svg
      );


      const axisInfo =
        document.createElement(
          "div"
        );


      axisInfo.className =
        "pd-live-chart-scatter-axis-info";


      axisInfo.textContent =
        (
          chart.xAxis ||
          "X"
        ) +
        "  â†”  " +
        (
          chart.yAxis ||
          "Y"
        );


      visual.appendChild(
        axisInfo
      );

    }

  }
  else {

    // ======================================================
    // COLUMN CHART
    // ======================================================

    chartData.forEach(
      function (item) {

        const barItem =
          document.createElement(
            "div"
          );


        barItem.className =
          "pd-live-chart-bar-item";


        const valueLabel =
          document.createElement(
            "span"
          );


        valueLabel.className =
          "pd-live-chart-value";


        valueLabel.textContent =
          formatPreviewNumber(
            item.value
          );


        const bar =
          document.createElement(
            "div"
          );


        bar.className =
          "pd-live-chart-bar";


        const percentage =
          Math.max(
            8,
            Math.round(
              (
                Math.abs(
                  Number(
                    item.value ||
                    0
                  )
                ) /
                maximumValue
              ) *
              100
            )
          );


        bar.style.height =
          percentage +
          "%";


        bar.title =
          item.category +
          ": " +
          item.value;


        const categoryLabel =
          document.createElement(
            "span"
          );


        categoryLabel.className =
          "pd-live-chart-category";


        categoryLabel.textContent =
          String(
            item.category
          );


if (
  String(
    chart.dataLabels ||
    "Show"
  )
    .trim()
    .toLowerCase() ===
    "show"
) {

  barItem.appendChild(
    valueLabel
  );

}


        barItem.appendChild(
          bar
        );


        barItem.appendChild(
          categoryLabel
        );


        visual.appendChild(
          barItem
        );

      }
    );

  }

}


      // ======================================================
      // FOOTER
      // ======================================================

      const footer =
        document.createElement(
          "div"
        );


      footer.className =
        "pd-preview-chart-footer";


      footer.textContent =
        (
          chart.aggregation ||
          "SUM"
        ) +
        (
          chart.topBottom &&
          String(
            chart.topBottom
          ).toLowerCase() !==
            "show all"
            ? " â€¢ " +
              chart.topBottom
            : ""
        );


      widget.appendChild(
        title
      );


      widget.appendChild(
        meta
      );


      widget.appendChild(
        visual
      );


      widget.appendChild(
        footer
      );


      container.appendChild(
        widget
      );

    }
  );

}


// ============================================================
// BUILD ACTUAL LIVE PREVIEW CHART DATA
// ============================================================

  // ============================================================
// BUILD ACTUAL LIVE PREVIEW SCATTER DATA
// ============================================================

function getLivePreviewScatterData(
  chart
) {

  if (!chart) {

    return [];

  }


    const sourceValues =
    getFilteredSourceValues(
  "charts"
);


  if (
    sourceValues.length < 2
  ) {

    return [];

  }


  const headers =
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  const xIndex =
    findPreviewColumnIndex(
      headers,
      chart.xAxis
    );


  const yIndex =
    findPreviewColumnIndex(
      headers,
      chart.yAxis
    );


  if (
    xIndex === -1 ||
    yIndex === -1
  ) {

    return [];

  }


  const scatterData =
    [];


  for (
    let rowIndex = 1;
    rowIndex <
    sourceValues.length;
    rowIndex++
  ) {

    const row =
      sourceValues[
        rowIndex
      ];


    if (
      !Array.isArray(
        row
      )
    ) {

      continue;

    }


    const rawX =
      row[
        xIndex
      ];


    const rawY =
      row[
        yIndex
      ];


    const x =
      Number(
        rawX
      );


    const y =
      Number(
        rawY
      );


    if (
      !Number.isFinite(
        x
      ) ||
      !Number.isFinite(
        y
      )
    ) {

      continue;

    }


    scatterData.push({
      x:
        x,

      y:
        y
    });

  }


  const limitText =
    String(
      chart.topBottom ||
      "Show All"
    )
      .trim()
      .toLowerCase();


  let limit =
    null;


  if (
    limitText ===
    "top 5" ||
    limitText ===
    "bottom 5"
  ) {

    limit = 5;

  }
  else if (
    limitText ===
    "top 10" ||
    limitText ===
    "bottom 10"
  ) {

    limit = 10;

  }


  if (
    limit !== null
  ) {

    scatterData.sort(
      function (
        a,
        b
      ) {

        return (
          limitText.startsWith(
            "bottom"
          )
            ? a.y -
              b.y
            : b.y -
              a.y
        );

      }
    );


    return scatterData.slice(
      0,
      limit
    );

  }


  return scatterData;

}

// ============================================================
// BUILD ACTUAL LIVE PREVIEW COMBO CHART DATA
// ============================================================

function getLivePreviewComboChartData(
  chart
) {

  if (
    !chart ||
    !chart.secondaryYAxis
  ) {

    return [];

  }


  const primaryData =
    getLivePreviewChartData(
      chart
    );


  if (
    primaryData.length === 0
  ) {

    return [];

  }


  const secondaryChart = {

    ...chart,

    yAxis:
      chart.secondaryYAxis,

    aggregation:
      chart.secondaryAggregation ||
      "SUM",

    topBottom:
      "Show All"

  };


  const secondaryData =
    getLivePreviewChartData(
      secondaryChart
    );


  const secondaryMap =
    new Map();


  secondaryData.forEach(
    function (item) {

      secondaryMap.set(
        String(
          item.category
        ),
        Number(
          item.value ||
          0
        )
      );

    }
  );


  return primaryData.map(
    function (item) {

      const key =
        String(
          item.category
        );


      return {

        category:
          item.category,

        primaryValue:
          Number(
            item.value ||
            0
          ),

        secondaryValue:
          secondaryMap.has(
            key
          )
            ? secondaryMap.get(
                key
              )
            : 0

      };

    }
  );

}


function getLivePreviewChartData(
  chart
) {

  if (!chart) {

    return [];

  }


    const sourceValues =
    getFilteredSourceValues(
  "charts"
);


  if (
    sourceValues.length < 2
  ) {

    return [];

  }


  const headers =
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  const xAxisName =
    String(
      chart.xAxis ||
      ""
    ).trim();


  const yAxisName =
    String(
      chart.yAxis ||
      ""
    ).trim();


  const xColumnIndex =
    findPreviewColumnIndex(
      headers,
      xAxisName
    );


  const yColumnIndex =
    findPreviewColumnIndex(
      headers,
      yAxisName
    );


  if (
    xColumnIndex === -1 ||
    yColumnIndex === -1
  ) {

    return [];

  }


  // ==========================================================
  // GROUP SOURCE ROWS BY X-AXIS CATEGORY
  // ==========================================================

  const groupedValues =
    new Map();


  for (
    let rowIndex = 1;
    rowIndex < sourceValues.length;
    rowIndex++
  ) {

    const row =
      sourceValues[
        rowIndex
      ];


    if (
      !Array.isArray(
        row
      )
    ) {

      continue;

    }


    const rawCategory =
      row[
        xColumnIndex
      ];


    const category =
      rawCategory === null ||
      rawCategory === undefined ||
      String(
        rawCategory
      ).trim() ===
        ""
        ? "(Blank)"
        : String(
            rawCategory
          ).trim();


    const rawValue =
      row[
        yColumnIndex
      ];


    if (
      !groupedValues.has(
        category
      )
    ) {

      groupedValues.set(
        category,
        []
      );

    }


    groupedValues
      .get(
        category
      )
      .push(
        rawValue
      );

  }


  // ==========================================================
  // AGGREGATE EACH CATEGORY
  // ==========================================================

  let chartData =
    [];


  groupedValues.forEach(
    function (
      values,
      category
    ) {

      chartData.push({

        category:
          category,

        value:
          aggregateLivePreviewChartValues(
            values,
            chart.aggregation
          )

      });

    }
  );


  // ==========================================================
  // TOP / BOTTOM FILTER
  // ==========================================================

  chartData =
    applyLivePreviewTopBottom(
      chartData,
      chart.topBottom
    );


  return chartData;

}


// ============================================================
// FIND COLUMN INDEX
// ============================================================

function findPreviewColumnIndex(
  headers,
  columnName
) {

  if (
    !Array.isArray(
      headers
    )
  ) {

    return -1;

  }


  const target =
    String(
      columnName ||
      ""
    ).trim();


  for (
    let index = 0;
    index < headers.length;
    index++
  ) {

    if (
      String(
        headers[index] ||
        ""
      ).trim() ===
      target
    ) {

      return index;

    }

  }


  return -1;

}


// ============================================================
// CHART AGGREGATION
// ============================================================

function aggregateLivePreviewChartValues(
  values,
  aggregation
) {

  const rawValues =
    Array.isArray(
      values
    )
      ? values
      : [];


  const nonBlankValues =
    rawValues.filter(
      function (value) {

        return (
          value !== null &&
          value !== undefined &&
          String(
            value
          ).trim() !==
            ""
        );

      }
    );


  const numericValues =
    nonBlankValues
      .map(
        function (value) {

          if (
            typeof value ===
            "number"
          ) {

            return value;

          }


          const cleaned =
            String(
              value
            )
              .replace(
                /[,â‚¹$â‚¬Â£%\s]/g,
                ""
              )
              .trim();


          return Number(
            cleaned
          );

        }
      )
      .filter(
        function (value) {

          return Number.isFinite(
            value
          );

        }
      );


  const mode =
    String(
      aggregation ||
      "SUM"
    )
      .trim()
      .toUpperCase();


  if (
    mode ===
    "COUNT"
  ) {

    return numericValues.length;

  }


  if (
    mode ===
      "COUNTA" ||
    mode ===
      "COUNT A"
  ) {

    return nonBlankValues.length;

  }


  if (
    mode ===
    "AVERAGE"
  ) {

    if (
      numericValues.length === 0
    ) {

      return 0;

    }


    return (
      numericValues.reduce(
        function (
          total,
          value
        ) {

          return (
            total +
            value
          );

        },
        0
      ) /
      numericValues.length
    );

  }


  if (
    mode ===
    "MIN"
  ) {

    return numericValues.length > 0
      ? Math.min(
          ...numericValues
        )
      : 0;

  }


  if (
    mode ===
    "MAX"
  ) {

    return numericValues.length > 0
      ? Math.max(
          ...numericValues
        )
      : 0;

  }


  return numericValues.reduce(
    function (
      total,
      value
    ) {

      return (
        total +
        value
      );

    },
    0
  );

}


// ============================================================
// TOP / BOTTOM N
// ============================================================

function applyLivePreviewTopBottom(
  chartData,
  topBottom
) {

  const data =
    Array.isArray(
      chartData
    )
      ? [
          ...chartData
        ]
      : [];


  const option =
    String(
      topBottom ||
      "Show All"
    )
      .trim()
      .toLowerCase();


  if (
    !option ||
    option ===
      "show all"
  ) {

    return data;

  }


  const numberMatch =
    option.match(
      /\d+/
    );


  const limit =
    numberMatch
      ? Math.max(
          1,
          Number(
            numberMatch[0]
          )
        )
      : 5;


  if (
    option.includes(
      "bottom"
    )
  ) {

    return data
      .sort(
        function (
          first,
          second
        ) {

          return (
            Number(
              first.value ||
              0
            ) -
            Number(
              second.value ||
              0
            )
          );

        }
      )
      .slice(
        0,
        limit
      );

  }


  if (
    option.includes(
      "top"
    )
  ) {

    return data
      .sort(
        function (
          first,
          second
        ) {

          return (
            Number(
              second.value ||
              0
            ) -
            Number(
              first.value ||
              0
            )
          );

        }
      )
      .slice(
        0,
        limit
      );

  }


  return data;

}


// ============================================================
// LIVE PREVIEW KPI CALCULATION
// ============================================================

function getLivePreviewKpiValue(
  kpi
) {

  if (!kpi) {

    return "--";

  }


const sourceValues =
  getFilteredSourceValues(
  "kpis"
);


  if (
    sourceValues.length < 2
  ) {

    return "--";

  }


  const headers =
    Array.isArray(
      sourceValues[0]
    )
      ? sourceValues[0]
      : [];


  const targetColumn =
    String(
      kpi.column ||
      ""
    ).trim();


  let columnIndex =
    -1;


  for (
    let index = 0;
    index < headers.length;
    index++
  ) {

    if (
      String(
        headers[index] ||
        ""
      ).trim() ===
      targetColumn
    ) {

      columnIndex =
        index;

      break;

    }

  }


  if (
    columnIndex === -1
  ) {

    return "--";

  }


  // ==========================================================
  // COLLECT COLUMN VALUES
  // ==========================================================

  const rawValues =
    [];


  for (
    let rowIndex = 1;
    rowIndex < sourceValues.length;
    rowIndex++
  ) {

    const row =
      sourceValues[
        rowIndex
      ];


    if (
      !Array.isArray(
        row
      )
    ) {

      continue;

    }


    rawValues.push(
      row[
        columnIndex
      ]
    );

  }


  const nonBlankValues =
    rawValues.filter(
      function (value) {

        return (
          value !== null &&
          value !== undefined &&
          String(
            value
          ).trim() !==
            ""
        );

      }
    );


  const numericValues =
    nonBlankValues
      .map(
        function (value) {

          if (
            typeof value ===
            "number"
          ) {

            return value;

          }


          const cleaned =
            String(
              value
            )
              .replace(
                /[,â‚¹$â‚¬Â£%\s]/g,
                ""
              )
              .trim();


          if (!cleaned) {

            return NaN;

          }


          return Number(
            cleaned
          );

        }
      )
      .filter(
        function (value) {

          return Number.isFinite(
            value
          );

        }
      );


  // ==========================================================
  // AGGREGATION
  // ==========================================================

  const aggregation =
    String(
      kpi.aggregation ||
      "SUM"
    )
      .trim()
      .toUpperCase();


  let result =
    0;


  if (
    aggregation ===
    "SUM"
  ) {

    result =
      numericValues.reduce(
        function (
          total,
          value
        ) {

          return (
            total +
            value
          );

        },
        0
      );

  }
  else if (
    aggregation ===
    "COUNT"
  ) {

    result =
      numericValues.length;

  }
  else if (
    aggregation ===
      "COUNTA" ||
    aggregation ===
      "COUNT A"
  ) {

    result =
      nonBlankValues.length;

  }
  else if (
    aggregation ===
    "AVERAGE"
  ) {

    result =
      numericValues.length > 0
        ? numericValues.reduce(
            function (
              total,
              value
            ) {

              return (
                total +
                value
              );

            },
            0
          ) /
          numericValues.length
        : 0;

  }
  else if (
    aggregation ===
    "MIN"
  ) {

    result =
      numericValues.length > 0
        ? Math.min(
            ...numericValues
          )
        : 0;

  }
  else if (
    aggregation ===
    "MAX"
  ) {

    result =
      numericValues.length > 0
        ? Math.max(
            ...numericValues
          )
        : 0;

  }
  else if (
    aggregation ===
      "UNIQUE COUNT" ||
    aggregation ===
      "UNIQUECOUNT" ||
    aggregation ===
      "DISTINCT COUNT"
  ) {

    const uniqueValues =
      new Set(
        nonBlankValues.map(
          function (value) {

            return String(
              value
            );

          }
        )
      );


    result =
      uniqueValues.size;

  }
  else {

    result =
      numericValues.reduce(
        function (
          total,
          value
        ) {

          return (
            total +
            value
          );

        },
        0
      );

  }


  // ==========================================================
  // FORMAT RESULT
  // ==========================================================

  return formatLivePreviewKpiValue(
    result,
    kpi
  );

}


// ============================================================
// FORMAT LIVE PREVIEW KPI VALUE
// ============================================================

function formatLivePreviewKpiValue(
  value,
  kpi
) {

  const numericValue =
    Number(
      value || 0
    );


  const format =
    String(
      kpi.format ||
      "Auto"
    )
      .trim()
      .toLowerCase();


  const symbols = {

    INR: "â‚¹",

    USD: "$",

    EUR: "â‚¬",

    GBP: "Â£"

  };


  const currencySymbol =
    symbols[
      dashboardState.currency
    ] ||
    "â‚¹";


  if (
    format ===
    "currency"
  ) {

    return (
      currencySymbol +
      " " +
      formatPreviewNumber(
        numericValue
      )
    );

  }


  if (
    format ===
      "percentage" ||
    format ===
      "percent"
  ) {

    return (
      formatPreviewNumber(
        numericValue
      ) +
      "%"
    );

  }


  return formatPreviewNumber(
    numericValue
  );

}


// ============================================================
// COMPACT PREVIEW NUMBER FORMATTER
// ============================================================

function formatPreviewNumber(
  value
) {

  const numericValue =
    Number(
      value || 0
    );


  const absoluteValue =
    Math.abs(
      numericValue
    );


  if (
    absoluteValue >=
    10000000
  ) {

    return (
      (
        numericValue /
        10000000
      ).toLocaleString(
        undefined,
        {
          maximumFractionDigits:
            2
        }
      ) +
      "Cr"
    );

  }


  if (
    absoluteValue >=
    100000
  ) {

    return (
      (
        numericValue /
        100000
      ).toLocaleString(
        undefined,
        {
          maximumFractionDigits:
            2
        }
      ) +
      "L"
    );

  }


  if (
    absoluteValue >=
    1000
  ) {

    return (
      (
        numericValue /
        1000
      ).toLocaleString(
        undefined,
        {
          maximumFractionDigits:
            2
        }
      ) +
      "K"
    );

  }


  return numericValue
    .toLocaleString(
      undefined,
      {
        maximumFractionDigits:
          2
      }
    );

}

// ============================================================
// LIVE PREVIEW
// ============================================================

function formatLastRefreshedTimestamp() {

  const value =
    dashboardState.lastRefreshedAt;

  if (!value) {
    return "Never";
  }

  const parsedDate =
    new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Never";
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }
  );

}


function updateLastRefreshedUI() {

  const formattedValue =
    "Last Refreshed: " +
    formatLastRefreshedTimestamp();

  const previewElement =
    document.getElementById(
      "previewLastRefreshed"
    );

  const dashboardElement =
    document.getElementById(
      "dashboardLastRefreshed"
    );

  if (previewElement) {
    previewElement.textContent =
      formattedValue;
  }

  if (dashboardElement) {
    dashboardElement.textContent =
      formattedValue;
  }

}


function updatePreview() {

  const title =
    document.getElementById(
      "previewDashboardTitle"
    );


  if (title) {

    title.textContent =
      dashboardState.dashboardTitle;

  }


  renderLivePreviewKpis();
  renderLivePreviewCharts();
  renderLivePreviewSlicers();
  renderLivePreviewTables();
  updateLastRefreshedUI();
}


function updateCurrencyPreview() {

  const symbols = {

    INR: "â‚¹",

    USD: "$",

    EUR: "â‚¬",

    GBP: "Â£"

  };


  const symbol =
    symbols[
      dashboardState.currency
    ] ||
    "â‚¹";


  const previewValues =
    document.querySelectorAll(
      ".pd-preview-kpi strong"
    );


  if (
    previewValues.length >= 3
  ) {

    previewValues[0].textContent =
      symbol + " 33.4M";

    previewValues[1].textContent =
      symbol + " 30.6M";

    previewValues[2].textContent =
      symbol + " 4.0M";

  }

}


// ============================================================
// REVIEW
// ============================================================

function updateReview() {

  setText(
    "reviewRange",
    dashboardState.dataRange ||
    "Not Selected"
  );


  setText(
    "reviewRows",
    dashboardState.rowCount === null
      ? "â€”"
      : formatInteger(
          dashboardState.rowCount
        )
  );


  setText(
    "reviewColumns",
    dashboardState.columnCount === null
      ? "â€”"
      : formatInteger(
          dashboardState.columnCount
        )
  );


  setText(
    "reviewTitle",
    dashboardState.dashboardTitle
  );


  setText(
    "reviewTheme",
    getThemeName(
      dashboardState.theme
    )
  );


  setText(
    "reviewCurrency",
    dashboardState.currency
  );


  setText(
    "reviewLayout",
    dashboardState.layout
      ? dashboardState.layout
          .charAt(0)
          .toUpperCase() +
        dashboardState.layout.slice(1)
      : "Executive"
  );


  setText(
    "reviewEngine",
    dashboardState.dataEngine ===
    "classic"
      ? "Smart Classic"
      : "Data Model"
  );


  setText(
    "reviewKpiStyle",
    dashboardState.kpiStyle ||
    "Modern Cards"
  );


  setText(
    "reviewChartStyle",
    dashboardState.chartStyle ||
    "Clean"
  );


  setText(
    "reviewBackground",
    dashboardState.background ||
    "Light"
  );


  setText(
    "reviewProtectDashboard",
    dashboardState.protectDashboard
      ? "Yes"
      : "No"
  );


  setText(
    "reviewHideBackend",
    dashboardState.hideBackend
      ? "Yes"
      : "No"
  );


  setText(
    "reviewLockSettings",
    dashboardState.lockSettings
      ? "Yes"
      : "No"
  );


  setText(
    "reviewKpiCount",
    dashboardState.counts.kpis
  );


  setText(
    "reviewChartCount",
    dashboardState.counts.charts
  );


  setText(
    "reviewSlicerCount",
    dashboardState.counts.slicers
  );


  setText(
    "reviewTableCount",
    dashboardState.counts.tables
  );

}


// ============================================================
// THEME CONTROL SYNC
// ============================================================

function syncThemeControls() {
  const themeSelect =
    document.getElementById(
      "themeSelect"
    );

  const appearanceTheme =
    document.getElementById(
      "appearanceTheme"
    );

  const previewThemeSelect =
    document.getElementById(
      "previewThemeSelect"
    );


  if (themeSelect) {

    themeSelect.value =
      dashboardState.theme;

  }


  if (appearanceTheme) {

    const desired =
      getThemeName(
        dashboardState.theme
      );


    for (
      let i = 0;
      i <
      appearanceTheme.options.length;
      i++
    ) {

      if (
        appearanceTheme.options[
          i
        ].text === desired
      ) {

        appearanceTheme.selectedIndex =
          i;

        break;

      }

    }

  }

    


  if (previewThemeSelect) {

    const desired =
      getThemeName(
        dashboardState.theme
      );


    for (
      let i = 0;
      i <
      previewThemeSelect.options.length;
      i++
    ) {

      if (
        previewThemeSelect.options[
          i
        ].text === desired
      ) {

        previewThemeSelect.selectedIndex =
          i;

        break;

      }

    }

  }

}


// ============================================================
// HELPERS
// ============================================================

function getThemeName(theme) {

  const names = {

    ocean:
      "Ocean",

    emerald:
      "Emerald",

    royal:
      "Royal",

    slate:
      "Slate",

    midnight:
      "Midnight"

  };


    return (
    names[theme] ||
    "Ocean"
  );

}


function capitalize(value) {

  if (!value) {

    return "";

  }


  return (
    value.charAt(0)
      .toUpperCase() +
    value.slice(1)
  );

}


function formatInteger(value) {

  return Number(
    value || 0
  ).toLocaleString();

}


function setText(id, value) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;

  }

}


function setStatus(message) {
  const element = document.getElementById("studioStatus");

  if (!element) {
  return;
}

element.textContent = message;

  window.clearTimeout(setStatus.timer);

  setStatus.timer = window.setTimeout(function () {
    element.textContent = "Ready";
  }, 3500);
}
