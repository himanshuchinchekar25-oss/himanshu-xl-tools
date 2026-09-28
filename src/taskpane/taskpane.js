import { createTable } from "./tools/dataTools/createTable";
import * as XLSX from "xlsx";
import { checkLicenseAccess } from "../licensing/license-guard.js";
import { readStoredDeviceToken } from "../licensing/device-identity.js";

import {
  activateAndBindLicense,
  getLicenseRuntimeStatus
} from "../licensing/license-runtime.js";

import { analyzeUniversalData, formatUniversalAnalysis } 
from "../core/UniversalDataEngine";
/* Himanshu XL Tools
   Excel 2021 - Office.js
*/

Office.onReady(async (info) => {

  if (info.host !== Office.HostType.Excel) {
    setStatus(
      "Please open Himanshu XL Tools inside Excel."
    );
    return;
  }

  /*
     License Panel must always be available.

     IMPORTANT:
     Do not return when the license is missing.
     The customer must still be able to activate.
  */

  connectLicensePanel();

  await refreshLicensePanel();

  const licenseAccess =
    await checkLicenseAccess();

  if (!licenseAccess.allowed) {

    setStatus(
      "🔒 " +
      (
        licenseAccess.message ||
        "License activation required."
      )
    );

    console.warn(
      "HXL License Access Denied:",
      licenseAccess.reasonCode
    );

    return;
  }

  setStatus(
    "🟢 Himanshu XL Tools license is active."
  );


  /*
     Ribbon action handling remains available
     after successful license validation.
  */

  const params =
    new URLSearchParams(
      window.location.search
    );

  const ribbonAction =
    params.get("action");


  if (
    ribbonAction ===
    "powerDashboard"
  ) {

    setTimeout(
      function () {
        openPowerDashboardBuilder();
      },
      300
    );

  }


  if (
    ribbonAction ===
    "mergeFiles"
  ) {

    setTimeout(
      function () {
        openMergeFilesPanel();
      },
      300
    );

  }

});

/* =========================================================
   LICENSE MANAGEMENT PANEL
   ========================================================= */

function setLicenseText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value === null ||
      value === undefined ||
      value === ""
        ? "-"
        : String(value);
  }

}


function renderLicenseRuntime(result) {

  const runtime =
    result && typeof result === "object"
      ? result
      : {};

  const state =
    runtime.state &&
    typeof runtime.state === "object"
      ? runtime.state
      : {};


  if (runtime.allowed) {

    setLicenseText(
      "licenseStatus",
      "🟢 Active"
    );

  } else {

    let statusText =
      "🔒 Activation Required";

    if (
      runtime.reasonCode ===
      "LICENSE_EXPIRED"
    ) {
      statusText =
        "🔴 License Expired";
    }

    if (
      runtime.mode ===
      "ERROR"
    ) {
      statusText =
        "❌ License Error";
    }

    setLicenseText(
      "licenseStatus",
      statusText
    );

  }


  setLicenseText(
    "licenseDeviceId",
    state.deviceId || "-"
  );

  setLicenseText(
    "licensePlan",
    state.planCode || "-"
  );

  setLicenseText(
    "licenseExpiry",
    state.expiryDate || "-"
  );

  setLicenseText(
    "licenseMode",
    runtime.mode || "-"
  );

}


async function getSafeDeviceDiagnostic() {

  const stored =
    await readStoredDeviceToken();

  if (!stored || !stored.token) {
    return {
      storage: stored ? stored.storage : null,
      sha256: null
    };
  }

  const bytes =
    new TextEncoder().encode(stored.token);

  const digest =
    await crypto.subtle.digest("SHA-256", bytes);

  const sha256 =
    Array.from(new Uint8Array(digest))
      .map(byte =>
        byte.toString(16).padStart(2, "0")
      )
      .join("");

  return {
    storage: stored.storage,
    sha256
  };
}


async function refreshLicensePanel() {

  try {

    setLicenseText(
      "licenseStatus",
      "Checking license..."
    );

    const result =
      await getLicenseRuntimeStatus();

    const deviceDiagnostic =
      await getSafeDeviceDiagnostic();

    console.log(
      "LICENSE DEVICE DIAGNOSTIC:",
      deviceDiagnostic
    );

    renderLicenseRuntime(result);


    const diagnosticMessage =
      document.getElementById("licenseMessage");

    if (diagnosticMessage && deviceDiagnostic) {
      diagnosticMessage.textContent =
        "Device Storage: " +
        (deviceDiagnostic.storage || "-") +
        " | Token Hash: " +
        (deviceDiagnostic.sha256 || "-");
    }

    return result;

  } catch (error) {

    console.error(
      "License Status Error:",
      error
    );

    setLicenseText(
      "licenseStatus",
      "❌ Unable to read license status"
    );

    return null;

  }

}


async function activateLicenseFromPanel() {

  const input =
    document.getElementById(
      "licenseKeyInput"
    );

  const button =
    document.getElementById(
      "activateLicenseBtn"
    );

  const licenseKey =
    input
      ? String(input.value || "").trim()
      : "";


  if (!licenseKey) {

    setLicenseText(
      "licenseStatus",
      "⚠️ Enter your license key."
    );

    return;

  }


  try {

    if (button) {
      button.disabled = true;
      button.textContent =
        "Activating...";
    }

    setLicenseText(
      "licenseStatus",
      "Activating license..."
    );


    const result =
      await activateAndBindLicense(
        licenseKey
      );

      console.log(
  "LICENSE ACTIVATION STORAGE:",
  {
    licenseStorage: result.storage,
    deviceStorage: result.deviceStorage,
    deviceId:
      result.state &&
      result.state.deviceId
        ? result.state.deviceId
        : null
  }
);


    renderLicenseRuntime(result);


    if (result.allowed) {

      if (input) {
        input.value = "";
      }

      setStatus(
        "✅ License activated successfully."
      );

    } else {

      setStatus(
        "❌ License activation failed."
      );

    }


  } catch (error) {

    console.error(
      "License Activation Error:",
      error
    );

    const message =
      error &&
      error.message
        ? error.message
        : "License activation failed.";

    setLicenseText(
      "licenseStatus",
      "❌ " + message
    );

    setStatus(
      "❌ License activation failed."
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent =
        "Activate License";
    }

  }

}


function connectLicensePanel() {

  const activateButton =
    document.getElementById(
      "activateLicenseBtn"
    );

  const refreshButton =
    document.getElementById(
      "refreshLicenseBtn"
    );

  const input =
    document.getElementById(
      "licenseKeyInput"
    );


  if (activateButton) {

    activateButton.onclick =
      activateLicenseFromPanel;

  }


  if (refreshButton) {

    refreshButton.onclick =
      async function () {

        setStatus(
          "Refreshing license status..."
        );

        const result =
          await refreshLicensePanel();

        if (result && result.allowed) {

          setStatus(
            "🟢 License status refreshed."
          );

        } else {

          setStatus(
            "🔒 License activation required."
          );

        }

      };

  }


  if (input) {

    input.addEventListener(
      "keydown",
      function (event) {

        if (event.key === "Enter") {
          event.preventDefault();
          activateLicenseFromPanel();
        }

      }
    );

  }

}

function setStatus(message) {
  const status = document.getElementById("status");

  if (status) {
    status.textContent = message;
  }
}


window.addEventListener(
"load",
function(){

    const action =
    localStorage.getItem(
        "HXL_ACTION"
    );


    if(action==="SMART_CHART"){

        smartChartInfo();

    }


    if(action==="POWER_DASHBOARD"){

        powerDashboardInfo();

    }


    localStorage.removeItem(
        "HXL_ACTION"
    );


});

async function updateRibbonToolMonitor() {

    try {

        const raw =
            await OfficeRuntime.storage.getItem(
                "HXL_TOOL_STATUS"
            );

        if (!raw) {
            return;
        }

        const data =
            JSON.parse(raw);

        const statusElement =
            document.getElementById("status");

        const lastAction =
            document.getElementById("lastAction");

        if (lastAction) {

            lastAction.textContent =
                data.tool || "-";

        }

        if (statusElement) {

            let icon = "🟢";

            if (data.state === "RUNNING") {
                icon = "🟡";
            }

            if (data.state === "SUCCESS") {
                icon = "✅";
            }

            if (data.state === "ERROR") {
                icon = "❌";
            }

            statusElement.textContent =
                icon +
                " " +
                (data.tool || "Tool") +
                ": " +
                (data.message || data.state);

        }

    } catch (error) {

        console.error(
            "Ribbon Monitor Error:",
            error
        );

    }

}

setInterval(
    updateRibbonToolMonitor,
    700
);


/* -------------------------------------------------
   Connect all buttons from taskpane.html
------------------------------------------------- */

/* -------------------------------------------------
   CONNECT ALL BUTTONS
------------------------------------------------- */

function connectButtons() {

  const connect = (id, fn) => {

    const button = document.getElementById(id);

    if (button) {

      button.onclick = fn;

    } else {

      console.error("Button not found:", id);

    }

  };

  /* ---------------------------------------------
     BASIC TOOLS
  --------------------------------------------- */

  connect("refreshBtn", refreshTool);
  connect("tableBtn", createTable);
  connect("removeDuplicatesBtn", removeDuplicates);
  connect("freezeBtn", freezeTopRow);
  connect("sortFilterBtn", activateFilter);

  /* ---------------------------------------------
     DASHBOARD / ANALYTICS
  --------------------------------------------- */

  connect("dashboardBtn", dashboardInfo);
  connect("kpiBtn", createKPI);
  connect("chartBtn", createChart);
  connect("pivotBtn", pivotInfo);

  /* ---------------------------------------------
     LOOKUP / FORMULA TOOLS
  --------------------------------------------- */

  connect("xlookupBtn", xlookupInfo);
  connect("vlookupBtn", vlookupInfo);
  connect("sumifsBtn", sumifsInfo);
  connect("countifsBtn", countifsInfo);

  /* ---------------------------------------------
     DATA TOOLS
  --------------------------------------------- */

  connect("conditionalBtn", conditionalFormatting);
  connect("validationBtn", validationInfo);
  connect("textColumnsBtn", textColumnsInfo);
  connect("flashFillBtn", flashFillInfo);
  connect("slicerBtn", smartSlicer);

  /* ---------------------------------------------
     SMART VISUAL
  --------------------------------------------- */

  connect("smartChartBtn", smartChartInfo);

  /* ---------------------------------------------
     POWER DASHBOARD
  --------------------------------------------- */

    connect(
    "powerDashboardBtn",
    openPowerDashboardBuilder
  );

  /* ---------------------------------------------
     FILE TOOLS
  --------------------------------------------- */

  connect(
    "mergeFilesBtn",
    openMergeFilesPanel
  );

  
}

/* =========================================================
   FILE TOOLS - MERGE FILES
   ========================================================= */

function openMergeFilesPanel() {

  const oldBuilder =
    document.getElementById(
      "mergeFilesBuilder"
    );

  if (oldBuilder) {
    oldBuilder.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "mergeFilesBuilder";

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: #f5f7fa;
    z-index: 99999;
    overflow-y: auto;
    padding: 18px;
    font-family: "Segoe UI", Arial, sans-serif;
  `;

  overlay.innerHTML = `

    <div style="
      max-width:520px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #d9d9d9;
      border-radius:10px;
      padding:22px;
      box-shadow:0 4px 18px rgba(0,0,0,.08);
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:18px;
      ">

        <div>
          <h2 style="
            margin:0;
            color:#217346;
            font-size:22px;
          ">
            Merge Files Builder
          </h2>

          <div style="
            margin-top:4px;
            font-size:12px;
            color:#666;
          ">
            Combine multiple Excel files into one worksheet
          </div>
        </div>

        <button
          id="closeMergeFilesBuilder"
          style="
            border:none;
            background:#eeeeee;
            border-radius:6px;
            padding:7px 10px;
            cursor:pointer;
          "
        >
          ✕
        </button>

      </div>


      <div style="margin-bottom:14px;">

        <label style="
          display:block;
          font-weight:600;
          margin-bottom:6px;
        ">
          Select Excel Files
        </label>

        <input
          id="mergeFilesInput"
          type="file"
          accept=".xlsx,.xls"
          multiple
          style="
            width:100%;
            padding:9px;
            border:1px solid #d0d7de;
            border-radius:6px;
          "
        />

      </div>


      <div style="margin-bottom:14px;">

        <label style="
          display:block;
          font-weight:600;
          margin-bottom:6px;
        ">
          Merge Mode
        </label>

        <select
          id="mergeModeSelect"
          style="
            width:100%;
            padding:9px;
            border:1px solid #d0d7de;
            border-radius:6px;
          "
        >
          <option value="headers">
            Match Columns by Header
          </option>

          <option value="common">
            Common Columns Only
          </option>

        </select>

      </div>


      <div style="margin-bottom:14px;">

        <label style="
          display:block;
          font-weight:600;
          margin-bottom:6px;
        ">
          Output Sheet
        </label>

        <input
          id="mergeOutputSheet"
          type="text"
          value="Merged_Data"
          style="
            width:100%;
            padding:9px;
            border:1px solid #d0d7de;
            border-radius:6px;
          "
        />

      </div>


      <div style="
        background:#f8faf9;
        border:1px solid #e0e6e3;
        border-radius:6px;
        padding:12px;
        margin-bottom:14px;
        font-size:12px;
      ">

        <label style="display:block;margin-bottom:7px;">
          <input
            id="mergeIgnoreBlankRows"
            type="checkbox"
            checked
          />
          Ignore blank rows
        </label>

        <label style="display:block;margin-bottom:7px;">
          <input
            id="mergeKeepHeaderOnce"
            type="checkbox"
            checked
          />
          Keep header only once
        </label>

        <label style="display:block;">
          <input
            id="mergeAutoMapColumns"
            type="checkbox"
            checked
          />
          Match columns automatically
        </label>

      </div>


      <button
        id="validateMergeFilesBtn"
        style="
          width:100%;
          border:1px solid #217346;
          background:#ffffff;
          color:#217346;
          border-radius:6px;
          padding:11px;
          font-weight:600;
          cursor:pointer;
          margin-bottom:9px;
        "
      >
        Validate Files
      </button>


      <button
        id="runMergeFilesBtn"
        style="
          width:100%;
          border:none;
          background:#217346;
          color:#ffffff;
          border-radius:6px;
          padding:12px;
          font-weight:600;
          cursor:pointer;
        "
      >
        Merge Files
      </button>


      <div
        id="mergeFilesStatus"
        style="
          margin-top:14px;
          padding:10px;
          border:1px solid #dddddd;
          border-radius:6px;
          background:#fafafa;
          font-size:12px;
          color:#555555;
        "
      >
        Ready. Select Excel files.
      </div>

    </div>
  `;

  document.body.appendChild(
    overlay
  );


  document
    .getElementById(
      "closeMergeFilesBuilder"
    )
    .onclick =
      function () {

        overlay.remove();

      };


  document
    .getElementById(
      "runMergeFilesBtn"
    )
    .onclick =
      mergeSelectedFiles;


  document
    .getElementById(
      "validateMergeFilesBtn"
    )
    .onclick =
      validateMergeFiles;

}


async function validateMergeFiles() {

  const input =
    document.getElementById(
      "mergeFilesInput"
    );

  const status =
    document.getElementById(
      "mergeFilesStatus"
    );

  if (
    !input ||
    !input.files ||
    input.files.length < 2
  ) {

    if (status) {
      status.textContent =
        "❌ Please select at least 2 Excel files.";
    }

    return;

  }

  try {

    const headerSets = [];

    for (
      let i = 0;
      i < input.files.length;
      i++
    ) {

      const file =
        input.files[i];

      const buffer =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(
          buffer,
          {
            type: "array"
          }
        );

      const firstSheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const rows =
        XLSX.utils.sheet_to_json(
          firstSheet,
          {
            header: 1,
            defval: ""
          }
        );

      if (
        !rows ||
        rows.length === 0
      ) {
        continue;
      }

      const headers =
        rows[0]
          .map(function (value) {
            return String(value).trim();
          })
          .filter(Boolean);

      headerSets.push({
        fileName: file.name,
        headers: headers
      });

    }

    if (
      headerSets.length === 0
    ) {

      throw new Error(
        "No valid files found."
      );

    }


    const allHeaders =
      Array.from(
        new Set(
          headerSets.flatMap(
            function (item) {
              return item.headers;
            }
          )
        )
      );


    const commonHeaders =
      allHeaders.filter(
        function (header) {

          return headerSets.every(
            function (item) {
              return item.headers.includes(
                header
              );
            }
          );

        }
      );


    if (status) {

      status.innerHTML =
        "✅ Files validated.<br>" +
        "Files: " +
        headerSets.length +
        "<br>" +
        "All columns: " +
        allHeaders.length +
        "<br>" +
        "Common columns: " +
        commonHeaders.length;

    }

  } catch (error) {

    if (status) {

      status.textContent =
        "❌ Validation Error: " +
        (
          error.message ||
          String(error)
        );

    }

  }

}


async function mergeSelectedFiles() {

  const input =
    document.getElementById(
      "mergeFilesInput"
    );

  const status =
    document.getElementById(
      "mergeFilesStatus"
    );

  const outputSheetInput =
    document.getElementById(
      "mergeOutputSheet"
    );

  const mergeMode =
    document.getElementById(
      "mergeModeSelect"
    )?.value || "headers";


  try {

    /* =============================================
       STEP 1 - VALIDATE FILES
    ============================================= */

    if (
      !input ||
      !input.files ||
      input.files.length < 2
    ) {

      throw new Error(
        "Please select at least 2 Excel files."
      );

    }


    const outputSheetName =
      (
        outputSheetInput?.value ||
        "Merged_Data"
      ).trim();


    if (!outputSheetName) {

      throw new Error(
        "Please enter output sheet name."
      );

    }


    if (status) {

      status.textContent =
        "Analyzing selected Excel files...";

    }


    /* =============================================
       STEP 2 - READ ALL FILES
    ============================================= */

    const fileData = [];

    const allHeaderNames = [];


    for (
      let fileIndex = 0;
      fileIndex < input.files.length;
      fileIndex++
    ) {

      const file =
        input.files[fileIndex];


      if (status) {

        status.textContent =
          "Reading " +
          file.name +
          "...";

      }


      const buffer =
        await file.arrayBuffer();


      const externalWorkbook =
        XLSX.read(
          buffer,
          {
            type: "array",
            cellDates: true
          }
        );


      if (
        !externalWorkbook.SheetNames ||
        externalWorkbook.SheetNames.length === 0
      ) {

        continue;

      }


      const sheetName =
        externalWorkbook.SheetNames[0];


      const sheet =
        externalWorkbook.Sheets[
          sheetName
        ];


      if (!sheet) {
        continue;
      }


      const rows =
        XLSX.utils.sheet_to_json(
          sheet,
          {
            header: 1,
            defval: "",
            raw: false
          }
        );


      if (
        !rows ||
        rows.length < 2
      ) {

        continue;

      }


      const headers =
        rows[0].map(
          function (value) {

            return String(
              value === null ||
              value === undefined
                ? ""
                : value
            ).trim();

          }
        );


      const cleanHeaders =
        headers.filter(
          function (header) {
            return header !== "";
          }
        );


      if (
        cleanHeaders.length === 0
      ) {

        continue;

      }


      for (
        const header of cleanHeaders
      ) {

        if (
          !allHeaderNames.some(
            function (existing) {

              return (
                existing.toLowerCase() ===
                header.toLowerCase()
              );

            }
          )
        ) {

          allHeaderNames.push(
            header
          );

        }

      }


      fileData.push({
        fileName:
          file.name,

        headers:
          headers,

        rows:
          rows.slice(1)
      });

    }


    /* =============================================
       STEP 3 - VALIDATE PARSED FILES
    ============================================= */

    if (
      fileData.length < 2
    ) {

      throw new Error(
        "At least 2 files with usable data are required."
      );

    }


    /* =============================================
       STEP 4 - DETERMINE FINAL HEADERS
    ============================================= */

    let finalHeaders = [];


    if (
      mergeMode ===
      "common"
    ) {

      finalHeaders =
        allHeaderNames.filter(
          function (header) {

            return fileData.every(
              function (item) {

                return item.headers.some(
                  function (fileHeader) {

                    return (
                      String(
                        fileHeader
                      )
                      .trim()
                      .toLowerCase() ===
                      header
                        .trim()
                        .toLowerCase()
                    );

                  }
                );

              }
            );

          }
        );


      if (
        finalHeaders.length === 0
      ) {

        throw new Error(
          "No common columns found across selected files."
        );

      }

    } else {

      finalHeaders =
        allHeaderNames;

    }


    /* =============================================
       STEP 5 - AUTO MAP ROWS BY HEADER NAME
    ============================================= */

    const mergedRows = [
      finalHeaders
    ];


    for (
      const item of fileData
    ) {

      const headerMap = {};


      for (
        let i = 0;
        i < item.headers.length;
        i++
      ) {

        const key =
          String(
            item.headers[i] || ""
          )
          .trim()
          .toLowerCase();


        if (key) {

          headerMap[key] =
            i;

        }

      }


      for (
        const sourceRow of item.rows
      ) {

        const hasData =
          sourceRow.some(
            function (value) {

              return (
                value !== null &&
                value !== undefined &&
                String(value)
                  .trim() !== ""
              );

            }
          );


        if (!hasData) {
          continue;
        }


        const mappedRow =
          finalHeaders.map(
            function (header) {

              const key =
                header
                  .trim()
                  .toLowerCase();


              const sourceIndex =
                headerMap[key];


              if (
                sourceIndex ===
                undefined
              ) {

                return "";

              }


              return (
                sourceRow[
                  sourceIndex
                ] ?? ""
              );

            }
          );


        mergedRows.push(
          mappedRow
        );

      }

    }


    /* =============================================
       STEP 6 - FINAL DATA CHECK
    ============================================= */

    if (
      mergedRows.length <= 1
    ) {

      throw new Error(
        "No usable data rows found."
      );

    }


    if (status) {

      status.textContent =
        "Writing merged data into Excel...";

    }


    /* =============================================
       STEP 7 - WRITE TO WORKBOOK
    ============================================= */

    await Excel.run(
      async (context) => {

        const workbook =
          context.workbook;


        let outputSheet =
          workbook
            .worksheets
            .getItemOrNullObject(
              outputSheetName
            );


        outputSheet.load(
          "isNullObject"
        );


        await context.sync();


        if (
          outputSheet.isNullObject
        ) {

          outputSheet =
            workbook
              .worksheets
              .add(
                outputSheetName
              );

        }


        const usedRange =
          outputSheet
            .getUsedRangeOrNullObject();


        usedRange.load(
          "isNullObject"
        );


        await context.sync();


        if (
          !usedRange.isNullObject
        ) {

          usedRange.clear(
            Excel.ClearApplyTo.all
          );

        }


        const targetRange =
          outputSheet
            .getRangeByIndexes(
              0,
              0,
              mergedRows.length,
              finalHeaders.length
            );


        targetRange.values =
          mergedRows;


        const headerRange =
          outputSheet
            .getRangeByIndexes(
              0,
              0,
              1,
              finalHeaders.length
            );


        headerRange
          .format
          .font
          .bold = true;


        headerRange
          .format
          .font
          .color = "#FFFFFF";


        headerRange
          .format
          .fill
          .color = "#217346";


        targetRange
          .format
          .autofitColumns();


        targetRange
          .format
          .autofitRows();


        outputSheet.activate();


        await context.sync();

      }
    );


    /* =============================================
       STEP 8 - SUCCESS
    ============================================= */

    const totalRows =
      mergedRows.length - 1;


    if (status) {

      status.innerHTML =
        "✅ Merge completed successfully.<br>" +
        "Files: " +
        fileData.length +
        "<br>" +
        "Rows: " +
        totalRows +
        "<br>" +
        "Columns: " +
        finalHeaders.length +
        "<br>" +
        "Output: " +
        outputSheetName;

    }


    setStatus(
      "✅ Merge Files completed: " +
      totalRows +
      " rows merged."
    );


    console.log(
      "Merge Files completed:",
      {
        files:
          fileData.length,

        rows:
          totalRows,

        columns:
          finalHeaders.length,

        output:
          outputSheetName
      }
    );


  } catch (error) {

    console.error(
      "Merge Files Error:",
      error
    );


    const message =
      error &&
      error.message
        ? error.message
        : String(error);


    if (status) {

      status.textContent =
        "❌ Merge Error: " +
        message;

    }


    setStatus(
      "❌ Merge Files Error: " +
      message
    );

  }

}


/* -------------------------------------------------
   REFRESH HIMANSHU XL TOOLS
   Smart Workbook Refresh
------------------------------------------------- */


/* -------------------------------------------------
   REFRESH HIMANSHU XL TOOLS
   Real Workbook Refresh + Recalculate
------------------------------------------------- */

async function refreshTool() {

  setStatus(" Refreshing Himanshu XL Tools...");

  try {

    await Excel.run(async (context) => {

      const workbook = context.workbook;

      /* ---------------------------------------------
         Active worksheet
      --------------------------------------------- */

      const sheet =
        workbook.worksheets.getActiveWorksheet();

      sheet.load("name");

      /* ---------------------------------------------
         Current used range
      --------------------------------------------- */

      let usedRange =
        sheet.getUsedRangeOrNullObject();

      usedRange.load([
        "address",
        "rowCount",
        "columnCount",
        "values"
      ]);

      await context.sync();

      if (usedRange.isNullObject) {

        setStatus(
          `?? ${sheet.name} is empty.`
        );

        return;
      }

      /* ---------------------------------------------
         STEP 1
         Refresh workbook data connections
      --------------------------------------------- */

      setStatus(
        "?? Refreshing Excel Data Connections..."
      );

      try {

        workbook.dataConnections.refreshAll();

        await context.sync();

      } catch (connectionError) {

        console.warn(
          "Data connection refresh:",
          connectionError
        );

      }

      /* ---------------------------------------------
         STEP 2
         Refresh PivotTables
      --------------------------------------------- */

      setStatus(
        "?? Refreshing PivotTables..."
      );

      try {

        workbook.pivotTables.refreshAll();

        await context.sync();

      } catch (pivotError) {

        console.warn(
          "Pivot refresh:",
          pivotError
        );

      }

      /* ---------------------------------------------
         STEP 3
         Full calculation
      --------------------------------------------- */

      setStatus(
        "?? Recalculating workbook..."
      );

      workbook.application.calculate(
        Excel.CalculationType.fullRebuild
      );

      await context.sync();

      /* ---------------------------------------------
         STEP 4
         Read updated range again
      --------------------------------------------- */

      usedRange =
        sheet.getUsedRangeOrNullObject();

      usedRange.load([
        "address",
        "rowCount",
        "columnCount",
        "values"
      ]);
      

      await context.sync();

      if (usedRange.isNullObject) {

        setStatus(
          `?? ${sheet.name} has no data after refresh.`
        );

        return;
      }

      /* ---------------------------------------------
         STEP 5
         Count rows / columns
      --------------------------------------------- */

      const address =
        usedRange.address;

      const dataRows =
        Math.max(
          usedRange.rowCount - 1,
          0
        );

      const columns =
        usedRange.columnCount;

      /* ---------------------------------------------
         STEP 6
         Final result
      --------------------------------------------- */

      setStatus(
        `? Refresh Himanshu XL Tools completed � ` +
        `${address} | ` +
        `${dataRows} data rows | ` +
        `${columns} columns`
      );

    });

  } catch (error) {

    console.error(
      "Refresh Himanshu XL Tools Error:",
      error
    );

    setStatus(
      "? Refresh Himanshu XL Tools Error: " +
      (error.message || error)
    );

  }

}


/* -------------------------------------------------
   REMOVE DUPLICATES
------------------------------------------------- */

async function removeDuplicates() {

  setStatus("Removing duplicates...");

  try {

    await Excel.run(async (context) => {

      const range = context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount"
      ]);

      await context.sync();

      if (range.rowCount < 2) {
        setStatus("Please select at least 2 rows.");
        return;
      }

      const columns = [];

      for (let i = 0; i < range.columnCount; i++) {
        columns.push(i);
      }

      // FALSE = first row is NOT a header
      range.removeDuplicates(columns, false);

      await context.sync();

      setStatus(
        `Duplicates removed from ${range.address}`
      );

    });

  } catch (error) {

    console.error(error);

    setStatus(
      "Remove Duplicates Error: " + error.message
    );
  }
}

/* -------------------------------------------------
   FREEZE TOP ROW
------------------------------------------------- */

async function freezeTopRow() {

  setStatus("FREEZE BUTTON CLICKED...");

  try {

    await Excel.run(async (context) => {

      setStatus("Excel.run started...");

      const worksheet =
        context.workbook.worksheets.getActiveWorksheet();

      setStatus("Active worksheet found...");

      worksheet.freezePanes.freezeRows(1);

      setStatus("freezeRows(1) called...");

      await context.sync();

      setStatus("SUCCESS � Top row frozen.");

    });

  } catch (error) {

    console.error("Freeze Panes Error:", error);

    setStatus(
      "Freeze Error: " +
      (error.message || error)
    );

  }
}


/* -------------------------------------------------
   FILTER
------------------------------------------------- */

async function activateFilter() {

  setStatus("Activating Sort & Filter...");

  try {

    await Excel.run(async (context) => {

      const sheet =
        context.workbook.worksheets.getActiveWorksheet();

      const range =
        context.workbook.getSelectedRange();

      range.load(["address", "rowCount", "columnCount"]);

      await context.sync();

      if (range.rowCount < 2) {
        setStatus("Please select a data range with headers.");
        return;
      }

      // Apply AutoFilter to selected range
      sheet.autoFilter.apply(range);

      await context.sync();

      setStatus(
        `Sort & Filter activated on ${range.address}`
      );

    });

  } catch (error) {

    console.error(error);

    setStatus(
      "Filter Error: " + error.message
    );

  }

}




/* -------------------------------------------------
   CHART
------------------------------------------------- */

async function createChart() {

  setStatus("Creating chart...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      const sheet =
        context.workbook.worksheets
          .getActiveWorksheet();

      const chart =
        sheet.charts.add(
          Excel.ChartType.columnClustered,
          range,
          Excel.ChartSeriesBy.auto
        );

      chart.title.text =
        "Himanshu XL Tools Chart";

      chart.legend.position =
        Excel.ChartLegendPosition.right;

      await context.sync();

      setStatus(
        "Chart created successfully."
      );

    });

  } catch (error) {

    setStatus(
      "Chart Error: " +
      error.message
    );

  }
}


/* -------------------------------------------------
   KPI CARDS
------------------------------------------------- */

async function createKPI() {

  setStatus("Creating KPI Cards...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount",
        "values"
      ]);

      await context.sync();

      if (range.rowCount < 2 || range.columnCount < 3) {

        setStatus(
          "KPI Cards: Please select Employee, Department and Sales data."
        );

        return;
      }

      const values = range.values;

      let totalSales = 0;
      let highestSales = 0;
      let employeeCount = 0;

      // First row = headers
      for (let i = 1; i < values.length; i++) {

        const sales =
          Number(values[i][2]);

        if (!isNaN(sales)) {

          totalSales += sales;

          if (sales > highestSales) {
            highestSales = sales;
          }

          employeeCount++;
        }
      }

      const averageSales =
        employeeCount > 0
          ? totalSales / employeeCount
          : 0;

      const sheet =
        context.workbook.worksheets.getActiveWorksheet();

      /*
         KPI Cards will be created
         2 columns � 2 rows
      */

      const kpiRange =
        sheet.getRange("E1:H4");

      kpiRange.clear(
        Excel.ClearApplyTo.all
      );

      // Titles
      sheet.getRange("E1").values = [
        ["TOTAL SALES"]
      ];

      sheet.getRange("G1").values = [
        ["AVERAGE SALES"]
      ];

      sheet.getRange("E3").values = [
        ["HIGHEST SALES"]
      ];

      sheet.getRange("G3").values = [
        ["EMPLOYEE COUNT"]
      ];

      // Values
      sheet.getRange("E2").values = [
        [totalSales]
      ];

      sheet.getRange("G2").values = [
        [averageSales]
      ];

      sheet.getRange("E4").values = [
        [highestSales]
      ];

      sheet.getRange("G4").values = [
        [employeeCount]
      ];

      // Format titles
      const titleRanges = [
        sheet.getRange("E1:F1"),
        sheet.getRange("G1:H1"),
        sheet.getRange("E3:F3"),
        sheet.getRange("G3:H3")
      ];

      for (const titleRange of titleRanges) {

        titleRange.merge(false);

        titleRange.format.font.bold = true;
        titleRange.format.horizontalAlignment =
          Excel.HorizontalAlignment.center;
        titleRange.format.verticalAlignment =
          Excel.VerticalAlignment.center;
      }

      // Format values
      const valueRanges = [
        sheet.getRange("E2:F2"),
        sheet.getRange("G2:H2"),
        sheet.getRange("E4:F4"),
        sheet.getRange("G4:H4")
      ];

      for (const valueRange of valueRanges) {

        valueRange.merge(false);

        valueRange.format.font.bold = true;
        valueRange.format.font.size = 18;

        valueRange.format.horizontalAlignment =
          Excel.HorizontalAlignment.center;

        valueRange.format.verticalAlignment =
          Excel.VerticalAlignment.center;
      }

      // Number formatting
      sheet.getRange("E2").numberFormat = [
        ["#,##0"]
      ];

      sheet.getRange("G2").numberFormat = [
        ["#,##0.00"]
      ];

      sheet.getRange("E4").numberFormat = [
        ["#,##0"]
      ];

      sheet.getRange("G4").numberFormat = [
        ["0"]
      ];

      // Autofit
      kpiRange.format.autofitColumns();
      kpiRange.format.autofitRows();

      await context.sync();

      setStatus(
        "KPI Cards created successfully."
      );

    });

  } catch (error) {

    console.error(
      "KPI Cards Error:",
      error
    );

    setStatus(
      "KPI Cards Error: " +
      error.message
    );

  }

}

/* -------------------------------------------------
   DASHBOARD
------------------------------------------------- */

async function dashboardInfo() {

  setStatus("Creating Dashboard...");

  try {

    await Excel.run(async (context) => {

      const workbook = context.workbook;

      const sourceRange =
        workbook.getSelectedRange();

      sourceRange.load([
        "address",
        "rowCount",
        "columnCount",
        "values"
      ]);

      await context.sync();

      if (sourceRange.rowCount < 2) {

        setStatus(
          "Dashboard: Please select a data range with headers and data."
        );

        return;
      }

      /* ---------------------------------------------
         Create / get Dashboard worksheet
      --------------------------------------------- */

      let dashboardSheet;

      try {

        dashboardSheet =
          workbook.worksheets.getItem("Dashboard");

        dashboardSheet.load("name");

        await context.sync();

      } catch (error) {

        dashboardSheet =
          workbook.worksheets.add("Dashboard");

        await context.sync();
      }

      /* ---------------------------------------------
         Clear old Dashboard content
      --------------------------------------------- */

      const dashboardRange =
        dashboardSheet.getRange("A1:H30");

      dashboardRange.clear(
        Excel.ClearApplyTo.all
      );

      /* ---------------------------------------------
         Dashboard Title
      --------------------------------------------- */

      const title =
        dashboardSheet.getRange("A1");

      title.values = [
        ["Himanshu XL Tools - Dashboard"]
      ];

      title.format.font.bold = true;
      title.format.font.size = 18;

      /* ---------------------------------------------
         Source information
      --------------------------------------------- */

      dashboardSheet.getRange("A3").values = [
        ["Source Range"]
      ];

      dashboardSheet.getRange("B3").values = [
        [sourceRange.address]
      ];

      dashboardSheet.getRange("A4").values = [
        ["Rows"]
      ];

      dashboardSheet.getRange("B4").values = [
        [sourceRange.rowCount]
      ];

      dashboardSheet.getRange("A5").values = [
        ["Columns"]
      ];

      dashboardSheet.getRange("B5").values = [
        [sourceRange.columnCount]
      ];

      /* ---------------------------------------------
         Basic KPI
      --------------------------------------------- */

      dashboardSheet.getRange("D3").values = [
        ["KPI"]
      ];

      dashboardSheet.getRange("D3").format.font.bold = true;

      dashboardSheet.getRange("D4").values = [
        ["Total Rows"]
      ];

      dashboardSheet.getRange("E4").values = [
        [sourceRange.rowCount - 1]
      ];

      dashboardSheet.getRange("D5").values = [
        ["Total Columns"]
      ];

      dashboardSheet.getRange("E5").values = [
        [sourceRange.columnCount]
      ];

      /* ---------------------------------------------
         Copy selected data to Dashboard
      --------------------------------------------- */

      const data = sourceRange.values;

const outputRange =
  dashboardSheet.getRangeByIndexes(
    8,
    0,
    sourceRange.rowCount,
    sourceRange.columnCount
  );

outputRange.values = data;

      /* ---------------------------------------------
         Format header
      --------------------------------------------- */

      const headerRange =
        dashboardSheet.getRangeByIndexes(
          8,
          0,
          1,
          data[0].length
        );

      headerRange.format.font.bold = true;

      /* ---------------------------------------------
         Autofit
      --------------------------------------------- */

      dashboardSheet
        .getUsedRange()
        .format
        .autofitColumns();

        /* =====================================================
   FIX SUMMARY COLUMN WIDTH
   ===================================================== */

dashboardSheet
  .getRange("A:B")
  .format.columnWidth = 18;

dashboardSheet
  .getRange("D:E")
  .format.columnWidth = 18;

      await context.sync();

      dashboardSheet.activate();

      await context.sync();

      setStatus(
        `Dashboard created successfully from ${sourceRange.address}.`
      );

    });

  } catch (error) {

    console.error(
      "Dashboard Error:",
      error
    );

    setStatus(
      "Dashboard Error: " +
      error.message
    );

  }
}


/* -------------------------------------------------
   PIVOT TABLE
------------------------------------------------- */

async function pivotInfo() {

  setStatus("Creating Pivot Table...");

  try {

    await Excel.run(async (context) => {

      const sourceRange =
        context.workbook.getSelectedRange();

      sourceRange.load([
        "address",
        "rowCount",
        "columnCount",
        "values"
      ]);

      await context.sync();

      if (sourceRange.rowCount < 2) {
        setStatus(
          "Pivot Table: Please select headers and data."
        );
        return;
      }

      if (sourceRange.columnCount < 2) {
        setStatus(
          "Pivot Table: Please select at least 2 columns."
        );
        return;
      }

      // Read headers
      const headers = sourceRange.values[0];

      const rowHeader = String(headers[0]);
      const valueHeader =
        String(headers[headers.length - 1]);

      // Create new worksheet
      const pivotSheet =
        context.workbook.worksheets.add(
          "HXL_Pivot_" +
          Date.now().toString().slice(-5)
        );

      await context.sync();

      // Create PivotTable
      const pivotTable =
        pivotSheet.pivotTables.add(
          "HXL_PivotTable",
          sourceRange,
          "A3"
        );

      await context.sync();

      // Add first column as Row
      pivotTable.rowHierarchies.add(
        pivotTable.hierarchies.getItem(rowHeader)
      );

      // Add last column as Data
      const dataHierarchy =
        pivotTable.dataHierarchies.add(
          pivotTable.hierarchies.getItem(valueHeader)
        );

      // SUM the last column
      dataHierarchy.summarizeBy =
        Excel.AggregationFunction.sum;

      await context.sync();

      // Title
      const title =
        pivotSheet.getRange("A1");

      title.values = [
        ["Himanshu XL Tools - Pivot Table"]
      ];

      title.format.font.bold = true;
      title.format.font.size = 16;

      // Autofit
      pivotSheet
        .getRange("A:A")
        .format
        .autofitColumns();

      pivotSheet
        .getRange("B:B")
        .format
        .autofitColumns();

      await context.sync();

      setStatus(
        `Pivot Table created successfully from ${sourceRange.address}.`
      );

    });

  } catch (error) {

    console.error(
      "Pivot Table Error:",
      error
    );

    setStatus(
      "Pivot Table Error: " +
      error.message
    );

  }
}


/* -------------------------------------------------
   LOOKUP FUNCTIONS
------------------------------------------------- */

/* -------------------------------------------------
   LOOKUP FUNCTIONS
------------------------------------------------- */

/* -------------------------------------------------
   LOOKUP FUNCTIONS
------------------------------------------------- */

/* -------------------------------------------------
   LOOKUP FUNCTIONS
------------------------------------------------- */

/* -------------------------------------------------
   XLOOKUP
------------------------------------------------- */

async function xlookupInfo() {

  setStatus("XLOOKUP: Processing...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount"
      ]);

      await context.sync();

      const formula =
        '=XLOOKUP(A2,A2:A4,B2:B4,"Not Found")';

      range.formulas = [[formula]];

      await context.sync();

      setStatus(
        `XLOOKUP completed in ${range.address}.`
      );

    });

  } catch (error) {

    console.error("XLOOKUP Error:", error);

    setStatus(
      "XLOOKUP Error: " + error.message
    );

  }
}

/* -------------------------------------------------
   VLOOKUP
------------------------------------------------- */

async function vlookupInfo() {

  setStatus("VLOOKUP: Processing...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount"
      ]);

      await context.sync();

      const formula =
        '=VLOOKUP(A2,A2:B4,2,FALSE)';

      range.formulas = [[formula]];

      await context.sync();

      setStatus(
        `VLOOKUP completed in ${range.address}.`
      );

    });

  } catch (error) {

    console.error("VLOOKUP Error:", error);

    setStatus(
      "VLOOKUP Error: " + error.message
    );

  }
}

/* -------------------------------------------------
   SUMIFS
------------------------------------------------- */

async function sumifsInfo() {

  setStatus("SUMIFS: Processing...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount"
      ]);

      await context.sync();

      if (range.rowCount < 2 || range.columnCount < 3) {

        setStatus(
          "SUMIFS: Please select Employee, Department and Sales data."
        );

        return;
      }

      /*
         Expected structure:

         A = Employee
         B = Department
         C = Sales
      */

      const sheet =
        context.workbook.worksheets.getActiveWorksheet();

      /*
         SUMIFS result area
      */

      sheet.getRange("E1:F4").clear(
        Excel.ClearApplyTo.all
      );

      sheet.getRange("E1").values = [
        ["SUMIFS DEMO"]
      ];

      sheet.getRange("E2").values = [
        ["Department"]
      ];

      sheet.getRange("F2").values = [
        ["Total Sales"]
      ];

      sheet.getRange("E3").values = [
        ["IT"]
      ];

      sheet.getRange("E4").values = [
        ["Sales"]
      ];

      /*
         SUMIFS formulas
      */

      sheet.getRange("F3").formulas = [
        ['=SUMIFS(C:C,B:B,E3)']
      ];

      sheet.getRange("F4").formulas = [
        ['=SUMIFS(C:C,B:B,E4)']
      ];

      /*
         Formatting
      */

      sheet.getRange("E1:F1")
        .format.font.bold = true;

      sheet.getRange("E2:F2")
        .format.font.bold = true;

      sheet.getRange("F3:F4").numberFormat = [
        ["#,##0"],
        ["#,##0"]
      ];

      sheet.getRange("E1:F4")
        .format.autofitColumns();

      await context.sync();

      setStatus(
        "SUMIFS completed successfully. Check E1:F4."
      );

    });

  } catch (error) {

    console.error(
      "SUMIFS Error:",
      error
    );

    setStatus(
      "SUMIFS Error: " +
      error.message
    );

  }
}

/* -------------------------------------------------
   COUNTIFS
------------------------------------------------- */


/* -------------------------------------------------
   COUNTIFS
------------------------------------------------- */

async function countifsInfo() {

  setStatus("COUNTIFS: Processing...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount"
      ]);

      await context.sync();

      if (range.rowCount < 2 || range.columnCount < 3) {

        setStatus(
          "COUNTIFS: Please select Employee, Department and Sales data."
        );

        return;
      }

      const sheet =
        context.workbook.worksheets.getActiveWorksheet();

      /* ---------------------------------------------
         COUNTIFS result area
      --------------------------------------------- */

      sheet.getRange("H1:I5").clear(
        Excel.ClearApplyTo.all
      );

      sheet.getRange("H1").values = [
        ["COUNTIFS DEMO"]
      ];

      sheet.getRange("H2").values = [
        ["Department"]
      ];

      sheet.getRange("I2").values = [
        ["Employee Count"]
      ];

      sheet.getRange("H3").values = [
        ["IT"]
      ];

      sheet.getRange("H4").values = [
        ["Sales"]
      ];

      sheet.getRange("H5").values = [
        ["Finance"]
      ];

      /* ---------------------------------------------
         COUNTIFS formulas
      --------------------------------------------- */

      sheet.getRange("I3").formulas = [
        ['=COUNTIFS(B:B,H3)']
      ];

      sheet.getRange("I4").formulas = [
        ['=COUNTIFS(B:B,H4)']
      ];

      sheet.getRange("I5").formulas = [
        ['=COUNTIFS(B:B,H5)']
      ];

      /* ---------------------------------------------
         Formatting
      --------------------------------------------- */

      sheet.getRange("H1:I1")
        .format.font.bold = true;

      sheet.getRange("H2:I2")
        .format.font.bold = true;

      sheet.getRange("I3:I5").numberFormat = [
        ["0"],
        ["0"],
        ["0"]
      ];

      sheet.getRange("H1:I5")
        .format.autofitColumns();

      await context.sync();

      setStatus(
        "COUNTIFS completed successfully. Check H1:I5."
      );

    });

  } catch (error) {

    console.error(
      "COUNTIFS Error:",
      error
    );

    setStatus(
      "COUNTIFS Error: " +
      error.message
    );

  }
}


/* -------------------------------------------------
   SMART CONDITIONAL FORMATTING v2
   Auto-detect numeric / business metric columns
------------------------------------------------- */


/* -------------------------------------------------
   SMART CONDITIONAL FORMATTING v3
   Advanced Excel-style Analytics Formatting
------------------------------------------------- */

async function conditionalFormatting() {

  setStatus("Smart Formatting v3: Analyzing data...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount",
        "values",
        "rowIndex",
        "columnIndex"
      ]);

      await context.sync();

      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (range.rowCount < 2) {

        setStatus(
          "Smart Formatting: Please select headers + data."
        );

        return;
      }

      const values = range.values;
      const headers = values[0];

      const sheet =
        context.workbook.worksheets.getActiveWorksheet();

      /* ---------------------------------------------
         SMART METRIC KEYWORDS
      --------------------------------------------- */

      const metricKeywords = [
        "sales",
        "sale",
        "revenue",
        "amount",
        "price",
        "profit",
        "loss",
        "cost",
        "income",
        "total",
        "score",
        "marks",
        "quantity",
        "qty",
        "value",
        "salary",
        "target",
        "achievement",
        "percentage",
        "percent",
        "growth",
        "balance"
      ];

      /* ---------------------------------------------
         FIND BEST NUMERIC COLUMN
      --------------------------------------------- */

      const candidates = [];

      for (
        let c = 0;
        c < range.columnCount;
        c++
      ) {

        const header =
          String(headers[c] || "")
            .trim()
            .toLowerCase();

        let numericCount = 0;
        let nonEmptyCount = 0;

        for (
          let r = 1;
          r < values.length;
          r++
        ) {

          const value = values[r][c];

          if (
            value !== "" &&
            value !== null &&
            value !== undefined
          ) {

            nonEmptyCount++;

            if (!isNaN(Number(value))) {
              numericCount++;
            }

          }

        }

        const numericRatio =
          nonEmptyCount > 0
            ? numericCount / nonEmptyCount
            : 0;

        let keywordScore = 0;

        for (
          let k = 0;
          k < metricKeywords.length;
          k++
        ) {

          if (
            header.includes(
              metricKeywords[k]
            )
          ) {

            keywordScore += 10;

          }

        }

        if (
          numericCount > 0 &&
          numericRatio >= 0.6
        ) {

          candidates.push({

            index: c,
            header: headers[c],
            numericCount: numericCount,
            numericRatio: numericRatio,
            keywordScore: keywordScore

          });

        }

      }

      if (candidates.length === 0) {

        setStatus(
          "Smart Formatting: No numeric business column found."
        );

        return;
      }

      /* ---------------------------------------------
         SELECT BUSINESS METRIC
      --------------------------------------------- */

      candidates.sort(
        function (a, b) {

          if (
            b.keywordScore !==
            a.keywordScore
          ) {

            return (
              b.keywordScore -
              a.keywordScore
            );

          }

          return (
            b.numericCount -
            a.numericCount
          );

        }
      );

      const selectedColumn =
        candidates[0];

      const columnIndex =
        selectedColumn.index;

      const headerName =
        String(
          selectedColumn.header ||
          "Numeric Column"
        );

      /* ---------------------------------------------
         DATA RANGE
         Skip header
      --------------------------------------------- */

      const dataRange =
        sheet.getRangeByIndexes(

          range.rowIndex + 1,

          range.columnIndex + columnIndex,

          range.rowCount - 1,

          1

        );

      /* ---------------------------------------------
         REMOVE OLD RULES
      --------------------------------------------- */

      dataRange.conditionalFormats.clearAll();

      /* ---------------------------------------------
         COLLECT NUMBERS
      --------------------------------------------- */

      const numbers = [];

      for (
        let r = 1;
        r < values.length;
        r++
      ) {

        const value =
          Number(
            values[r][columnIndex]
          );

        if (
          values[r][columnIndex] !== "" &&
          !isNaN(value)
        ) {

          numbers.push(value);

        }

      }

      if (numbers.length === 0) {

        setStatus(
          "Smart Formatting: No usable numeric values."
        );

        return;
      }

      /* ---------------------------------------------
         CALCULATE AVERAGE
      --------------------------------------------- */

      let total = 0;

      for (
        let i = 0;
        i < numbers.length;
        i++
      ) {

        total += numbers[i];

      }

      const average =
        total / numbers.length;

      /* ---------------------------------------------
         1. COLOR SCALE
         LOW ? MID ? HIGH
      --------------------------------------------- */

      const colorScale =
        dataRange.conditionalFormats.add(
          Excel.ConditionalFormatType.colorScale
        );

      colorScale.colorScale.criteria = {

        minimum: {

          formula: null,

          type:
            Excel.ConditionalFormatColorCriterionType
              .lowestValue,

          color: "#F8696B"

        },

        midpoint: {

          formula: "50",

          type:
            Excel.ConditionalFormatColorCriterionType
              .percent,

          color: "#FFEB84"

        },

        maximum: {

          formula: null,

          type:
            Excel.ConditionalFormatColorCriterionType
              .highestValue,

          color: "#63BE7B"

        }

      };

      /* ---------------------------------------------
         2. DATA BAR
      --------------------------------------------- */

      const dataBar =
        dataRange.conditionalFormats.add(
          Excel.ConditionalFormatType.dataBar
        );

      dataBar.dataBar.barDirection =
        Excel.ConditionalDataBarDirection.leftToRight;

      dataBar.dataBar.showDataBarOnly =
        false;

      /* ---------------------------------------------
         3. TOP 10%
      --------------------------------------------- */

      const top10 =
        dataRange.conditionalFormats.add(
          Excel.ConditionalFormatType.topBottom
        );

      top10.topBottom.rule = {

        rank: 10,

        type: "TopPercent"

      };

      top10.topBottom.format.fill.color =
        "#C6EFCE";

      top10.topBottom.format.font.color =
        "#006100";

      top10.topBottom.format.font.bold =
        true;

      /* ---------------------------------------------
         4. BOTTOM 10%
      --------------------------------------------- */

      const bottom10 =
        dataRange.conditionalFormats.add(
          Excel.ConditionalFormatType.topBottom
        );

      bottom10.topBottom.rule = {

        rank: 10,

        type: "BottomPercent"

      };

      bottom10.topBottom.format.fill.color =
        "#FFC7CE";

      bottom10.topBottom.format.font.color =
        "#9C0006";

      bottom10.topBottom.format.font.bold =
        true;

      /* ---------------------------------------------
         5. ABOVE AVERAGE
      --------------------------------------------- */

      const aboveAverage =
        dataRange.conditionalFormats.add(
          Excel.ConditionalFormatType.cellValue
        );

      aboveAverage.cellValue.rule = {

        formula1:
          average.toString(),

        operator:
          Excel.ConditionalCellValueOperator
            .greaterThan

      };

      aboveAverage.cellValue.format.font.color =
        "#006100";

      /* ---------------------------------------------
         6. BELOW AVERAGE
      --------------------------------------------- */

      const belowAverage =
        dataRange.conditionalFormats.add(
          Excel.ConditionalFormatType.cellValue
        );

      belowAverage.cellValue.rule = {

        formula1:
          average.toString(),

        operator:
          Excel.ConditionalCellValueOperator
            .lessThan

      };

      belowAverage.cellValue.format.font.color =
        "#9C0006";

      /* ---------------------------------------------
         7. EXACT AVERAGE
      --------------------------------------------- */

      const equalAverage =
        dataRange.conditionalFormats.add(
          Excel.ConditionalFormatType.cellValue
        );

      equalAverage.cellValue.rule = {

        formula1:
          average.toString(),

        operator:
          Excel.ConditionalCellValueOperator
            .equalTo

      };

      equalAverage.cellValue.format.fill.color =
        "#FFEB9C";

      equalAverage.cellValue.format.font.color =
        "#9C6500";

      /* ---------------------------------------------
         SYNC
      --------------------------------------------- */

      await context.sync();

      /* ---------------------------------------------
         STATUS
      --------------------------------------------- */

      setStatus(

        "Smart Formatting v3 applied ? " +
        headerName +
        " | Average: " +
        average.toFixed(2)

      );

    });

  } catch (error) {

    console.error(
      "Smart Formatting v3 Error:",
      error
    );

    setStatus(
      "Smart Formatting v3 Error: " +
      error.message
    );

  }

}




/* -------------------------------------------------
   SMART DATA VALIDATION
------------------------------------------------- */

async function validationInfo() {

  setStatus("Smart Data Validation: Analyzing selection...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      range.load([
        "address",
        "rowCount",
        "columnCount",
        "values"
      ]);

      await context.sync();

      const values = range.values;

      if (
        !values ||
        values.length === 0 ||
        values[0].length === 0
      ) {
        setStatus(
          "Data Validation: Please select cells."
        );
        return;
      }

      /* ---------------------------------------------
         Remove old validation
      --------------------------------------------- */

      range.dataValidation.clear();

      /* ---------------------------------------------
         Collect non-empty values
      --------------------------------------------- */

      const nonEmptyValues = [];

      for (let r = 0; r < values.length; r++) {

        for (let c = 0; c < values[r].length; c++) {

          const value = values[r][c];

          if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          ) {
            nonEmptyValues.push(value);
          }

        }

      }

      if (nonEmptyValues.length === 0) {

        setStatus(
          "Data Validation: No values found in selection."
        );

        return;
      }

      /* ---------------------------------------------
         Detect numeric vs text
      --------------------------------------------- */

      let numericCount = 0;
      let textCount = 0;

      for (let i = 0; i < nonEmptyValues.length; i++) {

        const value = nonEmptyValues[i];

        if (
          typeof value === "number" &&
          !isNaN(value)
        ) {
          numericCount++;
        } else {
          textCount++;
        }

      }

      /* ---------------------------------------------
         SMART TEXT VALIDATION
         Create dropdown from unique values
      --------------------------------------------- */

      if (textCount >= numericCount) {

        const uniqueValues = [];

        for (let i = 0; i < nonEmptyValues.length; i++) {

          const value =
            String(nonEmptyValues[i]).trim();

          if (
            value !== "" &&
            !uniqueValues.includes(value)
          ) {
            uniqueValues.push(value);
          }

        }

        /* -------------------------------------------
           Limit dropdown size
        ------------------------------------------- */

        if (uniqueValues.length > 50) {

          setStatus(
            "Data Validation: Too many unique text values. Please select a smaller list."
          );

          return;
        }

        if (uniqueValues.length === 1) {

          setStatus(
            "Data Validation: Only one unique value found."
          );

          return;
        }

        /* -------------------------------------------
           Create Excel dropdown source
        ------------------------------------------- */

        const dropdownSource =
          uniqueValues
            .map(function (value) {

              return value
                .replace(/"/g, '""');

            })
            .join(",");

        range.dataValidation.rule = {

          list: {

            inCellDropDown: true,

            source: dropdownSource

          }

        };

        /* -------------------------------------------
           Input message
        ------------------------------------------- */

        range.dataValidation.prompt = {

          showPrompt: true,

          title: "Himanshu XL Tools",

          message:
            "Please select a value from the dropdown list."

        };

        /* -------------------------------------------
           Error alert
        ------------------------------------------- */

        range.dataValidation.errorAlert = {

          showAlert: true,

          title: "Invalid Value",

          message:
            "Please select a value from the dropdown list.",

          style: Excel.DataValidationAlertStyle.stop

        };

        await context.sync();

        setStatus(
          `Smart Dropdown created on ${range.address}. ${uniqueValues.length} options found.`
        );

        return;
      }

      /* ---------------------------------------------
         SMART NUMERIC VALIDATION
      --------------------------------------------- */

      if (numericCount > 0) {

        let minValue =
          Number(nonEmptyValues[0]);

        let maxValue =
          Number(nonEmptyValues[0]);

        for (let i = 1; i < nonEmptyValues.length; i++) {

          const value =
            Number(nonEmptyValues[i]);

          if (value < minValue) {
            minValue = value;
          }

          if (value > maxValue) {
            maxValue = value;
          }

        }

        /* -------------------------------------------
           Allow numbers within detected range
        ------------------------------------------- */

        range.dataValidation.rule = {

          decimal: {

            formula1: minValue.toString(),

            formula2: maxValue.toString(),

            operator:
              Excel.DataValidationOperator.between

          }

        };

        /* -------------------------------------------
           Input message
        ------------------------------------------- */

        range.dataValidation.prompt = {

          showPrompt: true,

          title: "Valid Number Range",

          message:
            `Enter a number between ${minValue} and ${maxValue}.`

        };

        /* -------------------------------------------
           Error alert
        ------------------------------------------- */

        range.dataValidation.errorAlert = {

          showAlert: true,

          title: "Invalid Number",

          message:
            `Please enter a number between ${minValue} and ${maxValue}.`,

          style:
            Excel.DataValidationAlertStyle.stop

        };

        await context.sync();

        setStatus(
          `Smart Number Validation applied to ${range.address}: ${minValue} to ${maxValue}.`
        );

        return;
      }

    });

  } catch (error) {

    console.error(
      "Smart Data Validation Error:",
      error
    );

    setStatus(
      "Data Validation Error: " +
      error.message
    );

  }

}





/* -------------------------------------------------
   TEXT TO COLUMNS
------------------------------------------------- */

/* -------------------------------------------------
   TEXT TO COLUMNS
------------------------------------------------- */

async function textColumnsInfo() {

  setStatus("Text to Columns: Processing...");

  try {

    await Excel.run(async (context) => {

      const range = context.workbook.getSelectedRange();

      range.load([
        "address",
        "values",
        "rowCount"
      ]);

      await context.sync();

      const values = range.values;
      const output = [];
      let maxColumns = 1;

      for (let i = 0; i < values.length; i++) {

        const text =
          values[i][0] == null
            ? ""
            : String(values[i][0]);

        const parts = text
          .split(/[,\.\s]+/)
          .map(function (item) {
            return item.trim();
          });

        output.push(parts);

        if (parts.length > maxColumns) {
          maxColumns = parts.length;
        }
      }

      for (let i = 0; i < output.length; i++) {

        while (output[i].length < maxColumns) {
          output[i].push("");
        }

      }

      const firstCell = range.getCell(0, 0);

      firstCell.load([
        "rowIndex",
        "columnIndex"
      ]);

      await context.sync();

      const sheet =
        context.workbook.worksheets.getActiveWorksheet();

      const result =
        sheet.getRangeByIndexes(
          firstCell.rowIndex,
          firstCell.columnIndex,
          output.length,
          maxColumns
        );

      result.values = output;

      await context.sync();

      setStatus("Text to Columns completed.");

    });

  } catch (error) {

    console.error(
      "Text to Columns Error:",
      error
    );

    setStatus(
      "Text to Columns Error: " +
      error.message
    );

  }
}



/* -------------------------------------------------
   STEP 9 � SMART SLICER
   Creates an Excel Slicer for the selected Table
------------------------------------------------- */

async function smartSlicer() {

  setStatus("Smart Slicer: Checking selected table...");

  try {

    await Excel.run(async (context) => {

      const workbook = context.workbook;

      /* ---------------------------------------------
         STEP 1
         Get selected range
      --------------------------------------------- */

      const selectedRange =
        workbook.getSelectedRange();

      selectedRange.load([
        "address",
        "rowCount",
        "columnCount"
      ]);

      await context.sync();

      /* ---------------------------------------------
         STEP 2
         Find table containing selected range
      --------------------------------------------- */

      const tables =
        workbook.tables;

      tables.load("items/name");

      await context.sync();

      let selectedTable = null;

      for (const table of tables.items) {

        const tableRange =
          table.getRange();

        tableRange.load([
          "address",
          "rowIndex",
          "columnIndex",
          "rowCount",
          "columnCount"
        ]);

        await context.sync();

        const selectedRowStart =
          selectedRange.rowIndex;

        const selectedRowEnd =
          selectedRowStart +
          selectedRange.rowCount - 1;

        const selectedColStart =
          selectedRange.columnIndex;

        const selectedColEnd =
          selectedColStart +
          selectedRange.columnCount - 1;

        const tableRowStart =
          tableRange.rowIndex;

        const tableRowEnd =
          tableRowStart +
          tableRange.rowCount - 1;

        const tableColStart =
          tableRange.columnIndex;

        const tableColEnd =
          tableColStart +
          tableRange.columnCount - 1;

        const insideTable =
          selectedRowStart >= tableRowStart &&
          selectedRowEnd <= tableRowEnd &&
          selectedColStart >= tableColStart &&
          selectedColEnd <= tableColEnd;

        if (insideTable) {

          selectedTable = table;

          break;

        }

      }

      /* ---------------------------------------------
         STEP 3
         No table found
      --------------------------------------------- */

      if (!selectedTable) {

        setStatus(
          "?? Smart Slicer: Please select a cell inside an Excel Table."
        );

        return;
      }

      selectedTable.load("name");

      await context.sync();

      /* ---------------------------------------------
         STEP 4
         Load table columns
      --------------------------------------------- */

      const columns =
        selectedTable.columns;

      columns.load("items/name");

      await context.sync();

      if (
        !columns.items ||
        columns.items.length === 0
      ) {

        setStatus(
          "?? Smart Slicer: No table columns found."
        );

        return;
      }

      /* ---------------------------------------------
         STEP 5
         Select first suitable column
      --------------------------------------------- */

      let slicerColumn = null;

      for (const column of columns.items) {

        const name =
          String(column.name || "").trim();

        if (name !== "") {

          slicerColumn = name;

          break;

        }

      }

      if (!slicerColumn) {

        setStatus(
          "?? Smart Slicer: No suitable column found."
        );

        return;
      }

      /* ---------------------------------------------
         STEP 6
         Get worksheet
      --------------------------------------------- */

      const worksheet =
        workbook.worksheets.getActiveWorksheet();

      worksheet.load("name");

      await context.sync();

      /* ---------------------------------------------
         STEP 7
         Create slicer
      --------------------------------------------- */

      const slicer =
        workbook.slicers.add(
          selectedTable,
          slicerColumn,
          "HXL_Slicer_" +
          Date.now().toString().slice(-6)
        );

      /* ---------------------------------------------
         STEP 8
         Position slicer
      --------------------------------------------- */

      slicer.left = 450;
      slicer.top = 30;
      slicer.width = 180;
      slicer.height = 250;

      /* ---------------------------------------------
         STEP 9
         Sync
      --------------------------------------------- */

      await context.sync();

      setStatus(
        `? Smart Slicer created successfully � ` +
        `${slicerColumn} | Table: ${selectedTable.name}`
      );

    });

  } catch (error) {

    console.error(
      "Smart Slicer Error:",
      error
    );

    setStatus(
      "? Smart Slicer Error: " +
      (error.message || error)
    );

  }

}


/* -------------------------------------------------
   SMART FLASH FILL
   Example:
   A = Full Name
   B = First Name
   Amit Sharma  -> Amit
   Rahul Patil  -> Rahul
   Suresh More  -> Suresh
------------------------------------------------- */

async function flashFillInfo() {

  setStatus("Smart Flash Fill: Analyzing selection...");

  try {

    await Excel.run(async (context) => {

      const workbook = context.workbook;
      const selected = workbook.getSelectedRange();

      selected.load([
        "address",
        "rowCount",
        "columnCount",
        "rowIndex",
        "columnIndex"
      ]);

      await context.sync();

      /* ---------------------------------------------
         VALIDATION
      --------------------------------------------- */

      if (selected.rowCount < 1) {

        setStatus(
          "Smart Flash Fill: Please select cells."
        );

        return;
      }

      if (selected.columnCount !== 1) {

        setStatus(
          "?? Smart Flash Fill: Please select ONE column only."
        );

        return;
      }

      /* ---------------------------------------------
         SOURCE COLUMN
         Assume selected column is target.
         Previous column contains source text.
         
         Example:
         A = Full Name
         B = First Name

         Select B3:B5
         Source = A3:A5
      --------------------------------------------- */

      const targetColumn =
        selected.columnIndex;

      if (targetColumn === 0) {

        setStatus(
          "?? Smart Flash Fill: Target column must have a source column on the left."
        );

        return;
      }

      const sourceColumn =
        targetColumn - 1;

      const sourceRange =
        workbook.worksheets
          .getActiveWorksheet()
          .getRangeByIndexes(
            selected.rowIndex,
            sourceColumn,
            selected.rowCount,
            1
          );

      sourceRange.load("values");

      await context.sync();

      const sourceValues =
        sourceRange.values;

      /* ---------------------------------------------
         DETECT MODE
         
         Header decides:
         "First Name" -> first name
         "Last Name"  -> last name

         Otherwise default = first name
      --------------------------------------------- */

      const sheet =
        workbook.worksheets.getActiveWorksheet();

      const targetHeaderCell =
        sheet.getCell(
          Math.max(selected.rowIndex - 1, 0),
          targetColumn
        );

      targetHeaderCell.load("values");

      await context.sync();

      let header = "";

      if (
        targetHeaderCell.values &&
        targetHeaderCell.values[0]
      ) {

        header =
          String(
            targetHeaderCell.values[0][0] || ""
          )
          .trim()
          .toLowerCase();

      }

      let mode = "first";

      if (
        header.includes("last") ||
        header.includes("surname") ||
        header.includes("family")
      ) {

        mode = "last";

      }

      /* ---------------------------------------------
         SMART SPLIT FUNCTION
      --------------------------------------------- */

      function extractName(value) {

        if (
          value === null ||
          value === undefined
        ) {

          return "";

        }

        const text =
          String(value)
            .trim()
            .replace(/\s+/g, " ");

        if (text === "") {
          return "";
        }

        const parts =
          text.split(" ");

        /* -------------------------------------------
           FIRST NAME
        ------------------------------------------- */

        if (mode === "first") {

          return parts[0];

        }

        /* -------------------------------------------
           LAST NAME
        ------------------------------------------- */

        if (mode === "last") {

          return parts.length > 1
            ? parts[parts.length - 1]
            : parts[0];

        }

        return parts[0];
      }

      /* ---------------------------------------------
         CREATE OUTPUT
      --------------------------------------------- */

      const output = [];

      for (
        let i = 0;
        i < sourceValues.length;
        i++
      ) {

        const source =
          sourceValues[i][0];

        output.push([
          extractName(source)
        ]);

      }

      /* ---------------------------------------------
         WRITE RESULT
      --------------------------------------------- */

      selected.values = output;

      await context.sync();

      /* ---------------------------------------------
         STATUS
      --------------------------------------------- */

      const modeText =
        mode === "first"
          ? "First Name"
          : "Last Name";

      setStatus(
        `? Smart Flash Fill completed � ${modeText} filled in ${selected.address}.`
      );

    });

  } catch (error) {

    console.error(
      "Smart Flash Fill Error:",
      error
    );

    setStatus(
      "? Smart Flash Fill Error: " +
      (error.message || error)
    );

  }
}



/* -------------------------------------------------
   SMART VISUAL
   ------------------------------------------------- */

async function smartChartInfo() {

  setStatus("?? Smart Chart: Analyzing selected Excel data...");

  try {

    await Excel.run(async (context) => {

      const range =
        context.workbook.getSelectedRange();

      const sheet =
        context.workbook.worksheets.getActiveWorksheet();

      range.load([
        "address",
        "rowCount",
        "columnCount",
        "values",
        "rowIndex",
        "columnIndex"
      ]);

      await context.sync();

      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (
        range.rowCount < 2 ||
        range.columnCount < 2
      ) {

        setStatus(
          "Smart Chart: Select headers + at least one data row."
        );

        return;
      }

      const values = range.values;

      const headers = values[0];

      // ---------------------------------------------
      // DETECT TEXT + NUMERIC COLUMNS
      // ---------------------------------------------

      let textColumn = -1;
      let numericColumn = -1;

      for (let col = 0; col < headers.length; col++) {

        let numericCount = 0;
        let textCount = 0;

        for (let row = 1; row < values.length; row++) {

          const value = values[row][col];

          if (
            value !== null &&
            value !== "" &&
            typeof value === "number"
          ) {
            numericCount++;
          }

          if (
            value !== null &&
            value !== "" &&
            typeof value !== "number"
          ) {
            textCount++;
          }
        }

        // First useful text column
        if (
          textColumn === -1 &&
          textCount > 0
        ) {
          textColumn = col;
        }

        // First useful numeric column
        if (
          numericColumn === -1 &&
          numericCount > 0
        ) {
          numericColumn = col;
        }
      }

      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (textColumn === -1) {

        setStatus(
          "Smart Chart: No text/category column found."
        );

        return;
      }

      if (numericColumn === -1) {

        setStatus(
          "Smart Chart: No numeric/value column found."
        );

        return;
      }

      const categoryName =
        headers[textColumn];

      const valueName =
        headers[numericColumn];

      // ---------------------------------------------
      // BUILD CLEAN CHART DATA
      // ---------------------------------------------

      const chartData = [];

      for (
        let row = 1;
        row < values.length;
        row++
      ) {

        const category =
          values[row][textColumn];

        const value =
          values[row][numericColumn];

        if (
          category !== null &&
          category !== "" &&
          typeof value === "number"
        ) {

          chartData.push([
            category,
            value
          ]);
        }
      }

      if (chartData.length === 0) {

        setStatus(
          "Smart Chart: No valid category/value data found."
        );

        return;
      }

      // ---------------------------------------------
      // CREATE TEMP DATA AREA
      // ---------------------------------------------

      const startRow =
        range.rowIndex + range.rowCount + 2;

      const startCol =
        range.columnIndex;

      const helperRange =
        sheet.getRangeByIndexes(
          startRow,
          startCol,
          chartData.length + 1,
          2
        );

      helperRange.values = [
        [
          categoryName,
          valueName
        ],
        ...chartData
      ];

      // ---------------------------------------------
      // CREATE CHART
      // ---------------------------------------------

      const chart =
        sheet.charts.add(
          Excel.ChartType.columnClustered,
          helperRange,
          Excel.ChartSeriesBy.columns
        );

      chart.title.text =
        `Himanshu XL Tools - ${valueName} by ${categoryName}`;

      chart.legend.position =
        Excel.ChartLegendPosition.none;

      // ---------------------------------------------
      // POSITION
      // ---------------------------------------------

      chart.setPosition(
        sheet.getCell(
          startRow + chartData.length + 2,
          startCol
        ),
        sheet.getCell(
          startRow + chartData.length + 18,
          startCol + 8
        )
      );

      await context.sync();

      setStatus(
        `?? Smart Chart created: ${valueName} by ${categoryName}.`
      );

    });

  } catch (error) {

    console.error(
      "Smart Chart Error:",
      error
    );

    setStatus(
      "Smart Chart Error: " +
      (error.message || error)
    );

  }

}


/* -------------------------------------------------
   POWER DASHBOARD BUTTON
------------------------------------------------- */

function powerDashboardInfo() {

  openPowerDashboardBuilder();

}






/* =========================================================
   POWER DASHBOARD BUILDER
   ========================================================= */

function openPowerDashboardBuilder() {

  /* ---------------------------------------------
     REMOVE OLD BUILDER
  --------------------------------------------- */

  const oldBuilder =
    document.getElementById(
      "powerDashboardBuilder"
    );

  if (oldBuilder) {
    oldBuilder.remove();
  }

  /* ---------------------------------------------
     CREATE BUILDER
  --------------------------------------------- */

  const builder =
    document.createElement("div");

  builder.id =
    "powerDashboardBuilder";

  builder.innerHTML = `

  

     <div style="
      position:fixed;
      top:0;
      left:0;
      right:0;
      bottom:0;
      background:rgba(0,0,0,0.45);
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:10px;
      overflow:auto;
    ">




      <div style="
        width:360px;
        max-width:95%;
        max-height:90%;
        background:white;
        border-radius:12px;
        box-shadow:0 10px 40px rgba(0,0,0,0.25);
        overflow-y:auto;
      ">



        <!-- HEADER -->

        <div style="
          background:#217346;
          color:white;
          padding:16px;
        ">

          <div style="
            font-size:18px;
            font-weight:700;
          ">
             Power Dashboard Builder
          </div>

          <div style="
            font-size:11px;
            margin-top:4px;
            opacity:0.9;
          ">
            Create a smart dashboard from Excel data
          </div>

        </div>


        <!-- BODY -->

        <div style="
          padding:20px;
          overflow-y:auto;
          
        ">

          <!-- SELECT DATA -->

          <label style="
            display:block;
            font-size:12px;
            font-weight:600;
            margin-bottom:7px;
          ">
            Excel Data
          </label>


          <button
            id="selectDashboardDataBtn"
            type="button"
            style="
              width:100%;
              padding:12px;
              border:1px solid #217346;
              background:#eef7f1;
              color:#217346;
              border-radius:7px;
              font-weight:600;
              text-align:center;
              cursor:pointer;
            "
          >
             Select Current Excel Selection
          </button>


          <!-- SELECTED RANGE -->

          <div
            id="dashboardSelectedRange"
            style="
              margin-top:10px;
              padding:10px;
              background:#f5f7fa;
              border:1px solid #ddd;
              border-radius:6px;
              font-size:11px;
              color:#666;
            "
          >
            No data selected
          </div>


              <!-- DASHBOARD SETTINGS -->

<label style="
  display:block;
  font-size:12px;
  font-weight:600;
  margin-top:16px;
  margin-bottom:7px;
">
  Dashboard Title
</label>


<input
  id="dashboardTitleInput"
  type="text"
  value="Himanshu XL Dashboard"
  style="
    width:100%;
    box-sizing:border-box;
    padding:10px;
    border:1px solid #ccc;
    border-radius:6px;
    font-size:12px;
  "
/>


<label style="
  display:block;
  font-size:12px;
  font-weight:600;
  margin-top:12px;
">
  Data Type
</label>

<select
 id="dashboardDataTypeInput"
 style="
 width:100%;
 padding:9px;
 border:1px solid #ccc;
 border-radius:6px;
 ">
 <option>Auto Detect</option>
 <option>Sales Data</option>
 <option>Employee Data</option>
 <option>Inventory Data</option>
</select>


<label style="
  display:block;
  font-size:12px;
  font-weight:600;
  margin-top:12px;
">
  Theme
</label>

<select
 id="dashboardThemeInput"
 style="
 width:100%;
 padding:9px;
 border:1px solid #ccc;
 border-radius:6px;
 ">
 <option>Professional</option>
 <option>Modern</option>
 <option>Corporate</option>
 <option>Dark</option>
</select>


<label style="
  display:block;
  font-size:12px;
  font-weight:600;
  margin-top:12px;
">
  Currency Type
</label>

<select
 id="dashboardCurrencyInput"
 style="
 width:100%;
 padding:9px;
 border:1px solid #ccc;
 border-radius:6px;
 ">
 <option> ₹ INR</option>
 <option> $ USD</option>
 <option> € EURO</option>
</select>




<!-- SMART ANALYSIS -->

<!-- SMART ANALYSIS -->

<div style="
 margin-top:20px;
 padding-top:15px;
 border-top:1px solid #ddd;
">

<div style="
font-size:13px;
font-weight:700;
margin-bottom:10px;
">
──── SMART ANALYSIS ────
</div>


<button
id="analyzeDashboardBtn"
type="button"
style="
width:100%;
padding:11px;
background:#217346;
color:white;
border:none;
border-radius:7px;
font-weight:600;
">
🔍 ANALYZE DATA 
</button>


<label style="
display:block;
font-size:12px;
font-weight:600;
margin-top:12px;
">
Detected Data Type
</label>

<input
id="detectedDataType"
value="Auto Detect"
readonly
style="
width:100%;
padding:8px;
border:1px solid #ccc;
border-radius:6px;
"
/>


<label style="
display:block;
font-size:12px;
font-weight:600;
margin-top:10px;
">
Name / Entity
</label>

<select 
id="entityColumnInput"
style="width:100%;padding:8px;">
<option>Auto Detect</option>
</select>


<label style="
display:block;
font-size:12px;
font-weight:600;
margin-top:10px;
">
Category
</label>

<select 
id="categoryColumnInput"
style="width:100%;padding:8px;">
<option>Auto Detect</option>
</select>


<label style="
display:block;
font-size:12px;
font-weight:600;
margin-top:10px;
">
Group By
</label>

<select 
id="groupColumnInput"
style="width:100%;padding:8px;">
<option>Auto Detect</option>
</select>


<label style="
display:block;
font-size:12px;
font-weight:600;
margin-top:10px;
">
Date
</label>

<select 
id="dateColumnInput"
style="width:100%;padding:8px;">
<option>Auto Detect</option>
</select>




</div>

          <!-- CREATE BUTTON -->

<button
  id="createPowerDashboardBtn"
  type="button"
  style="
    width:100%;
    margin-top:16px;
    padding:12px;
    background:#217346;
    color:white;
    border:none;
    border-radius:7px;
    font-weight:700;
    text-align:center;
    cursor:pointer;
  "
>
    Create Power Dashboard
</button>



          <!-- CANCEL -->

          <button
            id="closePowerDashboardBtn"
            type="button"
            style="
              width:100%;
              margin-top:8px;
              padding:10px;
              background:white;
              color:#555;
              border:1px solid #ccc;
              border-radius:7px;
              text-align:center;
              cursor:pointer;
            "
          >
            Cancel
          </button>


          <!-- STATUS -->

          <div
            id="powerDashboardStatus"
            style="
              margin-top:10px;
              font-size:11px;
              color:#666;
              text-align:center;
            "
          >
            Ready
          </div>

        </div>

      </div>

    </div>
  `;


  document.body.appendChild(builder);


    /* =====================================================
     STEP 3B � KPI CONFIGURATION UI
     ===================================================== */

  const createButton =
    document.getElementById(
      "createPowerDashboardBtn"
    );


  const kpiSection =
    document.createElement("div");


  kpiSection.id =
    "powerDashboardKpiSection";


  kpiSection.style.cssText = `
    margin-top:20px;
    padding-top:16px;
    border-top:2px solid #217346;
  `;


  kpiSection.innerHTML = `

    <div style="
      background:#eef7f1;
      border-left:4px solid #217346;
      padding:9px 10px;
      margin-bottom:12px;
      border-radius:5px;
      color:#217346;
      font-size:13px;
      font-weight:700;
    ">
      KPI CONFIGURATION
    </div>


    <label style="
      display:block;
      font-size:12px;
      font-weight:600;
      margin-top:8px;
      margin-bottom:5px;
    ">
      KPI 1
    </label>


    <select
      id="kpi1Input"
      style="
        width:100%;
        box-sizing:border-box;
        padding:9px;
        border:1px solid #ccc;
        border-radius:6px;
        background:white;
      "
    >
      <option value="">Auto Suggested</option>
    </select>


    <label style="
      display:block;
      font-size:12px;
      font-weight:600;
      margin-top:10px;
      margin-bottom:5px;
    ">
      KPI 2
    </label>


    <select
      id="kpi2Input"
      style="
        width:100%;
        box-sizing:border-box;
        padding:9px;
        border:1px solid #ccc;
        border-radius:6px;
        background:white;
      "
    >
      <option value="">Auto Suggested</option>
    </select>


    <label style="
      display:block;
      font-size:12px;
      font-weight:600;
      margin-top:10px;
      margin-bottom:5px;
    ">
      KPI 3
    </label>


    <select
      id="kpi3Input"
      style="
        width:100%;
        box-sizing:border-box;
        padding:9px;
        border:1px solid #ccc;
        border-radius:6px;
        background:white;
      "
    >
      <option value="">Auto Suggested</option>
    </select>


    <label style="
      display:block;
      font-size:12px;
      font-weight:600;
      margin-top:10px;
      margin-bottom:5px;
    ">
      KPI 4
    </label>


    <select
      id="kpi4Input"
      style="
        width:100%;
        box-sizing:border-box;
        padding:9px;
        border:1px solid #ccc;
        border-radius:6px;
        background:white;
      "
    >
      <option value="">Auto Suggested</option>
    </select>

  `;


  /* ---------------------------------------------
     INSERT KPI SECTION BEFORE CREATE BUTTON
  --------------------------------------------- */

  if (createButton) {

    createButton.parentNode.insertBefore(
      kpiSection,
      createButton
    );

  }




  /* =====================================================
     CLOSE BUTTON
     ===================================================== */

  document
    .getElementById("closePowerDashboardBtn")
    .onclick = function () {

      builder.remove();

    };


  /* =====================================================
     SELECT EXCEL DATA
     ===================================================== */

  document
    .getElementById("selectDashboardDataBtn")
    .onclick = async function () {

      const status =
        document.getElementById(
          "powerDashboardStatus"
        );

      const rangeBox =
        document.getElementById(
          "dashboardSelectedRange"
        );


      status.textContent =
        "Reading Excel selection...";


      try {

        await Excel.run(async (context) => {

          const range =
            context.workbook.getSelectedRange();


          range.load([
            "address",
            "worksheet/name",
            "rowCount",
            "columnCount"
          ]);


          await context.sync();


          rangeBox.textContent =
            `${range.worksheet.name}!${range.address} ` +
            `${range.rowCount} rows x ` +
            `${range.columnCount} columns)`;


          status.textContent =
            "? Excel data selected successfully.";

        });

      } catch (error) {

        console.error(
          "Power Dashboard Selection Error:",
          error
        );


        status.textContent =
          "? Unable to read Excel selection.";

      }

    };


      /* =====================================================
     STEP 3A � SMART ANALYSIS
     ===================================================== */

  document
    .getElementById("analyzeDashboardBtn")
    .onclick = async function () {

      const status =
        document.getElementById(
          "powerDashboardStatus"
        );

      const detectedDataType =
        document.getElementById(
          "detectedDataType"
        );

      const entitySelect =
        document.getElementById(
          "entityColumnInput"
        );

      const categorySelect =
        document.getElementById(
          "categoryColumnInput"
        );

      const groupSelect =
        document.getElementById(
          "groupColumnInput"
        );

      const dateSelect =
        document.getElementById(
          "dateColumnInput"
        );


      status.textContent =
        "?? Analyzing Excel data...";


      try {

        await Excel.run(async (context) => {

          /* ---------------------------------------------
             GET CURRENT EXCEL SELECTION
          --------------------------------------------- */

          const range =
            context.workbook.getSelectedRange();

          range.load([
            "values",
            "rowCount",
            "columnCount",
            "address",
            "worksheet/name"
          ]);

          await context.sync();


          /* ---------------------------------------------
             VALIDATE DATA
          --------------------------------------------- */

          if (
            range.rowCount < 2 ||
            range.columnCount < 1
          ) {

            throw new Error(
              "Please select headers and at least one data row."
            );

          }


          const values =
            range.values;


          /* ---------------------------------------------
             UNIVERSAL DATA ENGINE - PHASE 1
             Shared profiler + semantic analysis
          --------------------------------------------- */

          const universalContext = analyzeUniversalData({
            sheetName: range.worksheet?.name || "",
            address: range.address,
            values
          });

          const universalAnalysis =
            formatUniversalAnalysis(universalContext);

          console.log("HXL UNIVERSAL ANALYSIS:", universalAnalysis);

          /* ---------------------------------------------
             EXISTING ANALYSIS CONTINUES BELOW
          --------------------------------------------- */


          const headers =
            values[0].map(function (header) {

              return String(
                header || ""
              ).trim();

            });


          /* ---------------------------------------------
             CLEAR OLD OPTIONS
          --------------------------------------------- */

          function resetSelect(selectElement) {

            selectElement.innerHTML =
              '<option value="">Auto Detect</option>';

          }


          resetSelect(entitySelect);
          resetSelect(categorySelect);
          resetSelect(groupSelect);
          resetSelect(dateSelect);


          /* ---------------------------------------------
             ANALYZE COLUMNS
          --------------------------------------------- */

          let textColumns = [];
          let numericColumns = [];
          let dateColumns = [];

          let detectedEntity = "";
          let detectedCategory = "";
          let detectedGroup = "";
          let detectedDate = "";


          for (
            let c = 0;
            c < headers.length;
            c++
          ) {

            const header =
              headers[c];

            const lowerHeader =
              header.toLowerCase();


            let numericCount = 0;
            let dateCount = 0;
            let textCount = 0;


            for (
              let r = 1;
              r < values.length;
              r++
            ) {

              const value =
                values[r][c];


              /* Numeric */

              if (
                typeof value === "number" &&
                !isNaN(value)
              ) {

                numericCount++;

              }


              /* Date */

              if (
                value instanceof Date
              ) {

                dateCount++;

              }


              /* Text */

              if (
                typeof value === "string" &&
                value.trim() !== ""
              ) {

                textCount++;

              }

            }


            /* -----------------------------------------
               NUMERIC COLUMN
            ----------------------------------------- */

            if (
              numericCount > 0
            ) {

              numericColumns.push({
                index: c,
                name: header
              });

            }


            /* -----------------------------------------
               TEXT COLUMN
            ----------------------------------------- */

            if (
              textCount > 0
            ) {

              textColumns.push({
                index: c,
                name: header
              });

            }


            /* -----------------------------------------
               DATE COLUMN
            ----------------------------------------- */

            if (
              lowerHeader.includes("date") ||
              lowerHeader.includes("month") ||
              lowerHeader.includes("year") ||
              lowerHeader.includes("time") ||
              dateCount > 0
            ) {

              dateColumns.push({
                index: c,
                name: header
              });

            }


            /* -----------------------------------------
               ENTITY DETECTION
            ----------------------------------------- */

            if (
              !detectedEntity &&
              (
                lowerHeader.includes("employee") ||
                lowerHeader.includes("emp-name") ||
                lowerHeader.includes("emp name") ||
                lowerHeader.includes("customer") ||
                lowerHeader.includes("client") ||
                lowerHeader.includes("product") ||
                lowerHeader.includes("name") ||
                lowerHeader.includes("person") ||
                lowerHeader.includes("staff")
              )
            ) {

              detectedEntity =
                header;

            }


            /* -----------------------------------------
               CATEGORY DETECTION
            ----------------------------------------- */

            if (
              !detectedCategory &&
              (
                lowerHeader.includes("department") ||
                lowerHeader.includes("dept") ||
                lowerHeader.includes("category") ||
                lowerHeader.includes("region") ||
                lowerHeader.includes("branch") ||
                lowerHeader.includes("type") ||
                lowerHeader.includes("designation")
              )
            ) {

              detectedCategory =
                header;

            }


            /* -----------------------------------------
               GROUP BY DETECTION
            ----------------------------------------- */

            if (
              !detectedGroup &&
              (
                lowerHeader.includes("region") ||
                lowerHeader.includes("department") ||
                lowerHeader.includes("dept") ||
                lowerHeader.includes("category") ||
                lowerHeader.includes("branch") ||
                lowerHeader.includes("product")
              )
            ) {

              detectedGroup =
                header;

            }


            /* -----------------------------------------
               DATE DETECTION
            ----------------------------------------- */

            if (
              !detectedDate &&
              (
                lowerHeader.includes("date") ||
                lowerHeader.includes("month") ||
                lowerHeader.includes("year") ||
                lowerHeader.includes("time")
              )
            ) {

              detectedDate =
                header;

            }

          }


          /* ---------------------------------------------
             ADD OPTIONS FUNCTION
          --------------------------------------------- */

          function addOptions(
            selectElement,
            columns
          ) {

            for (
              const column of columns
            ) {

              const option =
                document.createElement(
                  "option"
                );

              option.value =
                column.name;

              option.textContent =
                column.name;

              selectElement.appendChild(
                option
              );

            }

          }


          /* ---------------------------------------------
             POPULATE DROPDOWNS
          --------------------------------------------- */

          addOptions(
            entitySelect,
            textColumns
          );

          addOptions(
            categorySelect,
            textColumns
          );

          addOptions(
            groupSelect,
            textColumns
          );

          addOptions(
            dateSelect,
            dateColumns
          );


          /* ---------------------------------------------
             AUTO SELECT DETECTED VALUES
          --------------------------------------------- */

          if (detectedEntity) {

            entitySelect.value =
              detectedEntity;

          }


          if (detectedCategory) {

            categorySelect.value =
              detectedCategory;

          }


          if (detectedGroup) {

            groupSelect.value =
              detectedGroup;

          }


          if (detectedDate) {

            dateSelect.value =
              detectedDate;

          }


          /* ---------------------------------------------
             DETECT DATA TYPE
          --------------------------------------------- */

          let detectedType =
            universalAnalysis.detectedType ||
            "General Data";


          const headerText =
            headers
              .join(" ")
              .toLowerCase();


          if (
            headerText.includes("salary") ||
            headerText.includes("basic salary") ||
            headerText.includes("net salary") ||
            headerText.includes("attendance") ||
            headerText.includes("overtime") ||
            headerText.includes("hra") ||
            headerText.includes("pf") ||
            headerText.includes("esi")
          ) {

            detectedType =
              "Employee Data";

          }

          else if (
            headerText.includes("sales") ||
            headerText.includes("revenue") ||
            headerText.includes("customer") ||
            headerText.includes("order") ||
            headerText.includes("product")
          ) {

            detectedType =
              "Sales Data";

          }

          else if (
            headerText.includes("stock") ||
            headerText.includes("inventory") ||
            headerText.includes("quantity") ||
            headerText.includes("warehouse")
          ) {

            detectedType =
              "Inventory Data";

          }


          detectedDataType.value =
            detectedType;


          /* ---------------------------------------------
             UPDATE MAIN DATA TYPE
          --------------------------------------------- */

          const mainDataType =
            document.getElementById(
              "dashboardDataTypeInput"
            );

          if (mainDataType) {

            mainDataType.value =
              detectedType;

          }


          /* ---------------------------------------------
             FINAL STATUS
          --------------------------------------------- */

          status.textContent =
            "Smart Analysis completed: " +
            headers.length +
            " columns detected. " +
            "Pattern: " + universalAnalysis.detectedType +
            " (" + Math.round(universalAnalysis.confidence * 100) + "%).";


            /* =================================================
   STEP 3B TEST � KPI DETECTION
   ================================================= */

console.log(
  "STEP 3B TEST:",
  {
    detectedType: detectedType,
    numericColumns: numericColumns,
    textColumns: textColumns
  }
);   



          console.log(
            "SMART ANALYSIS:",
            {
              headers: headers,
              entity: detectedEntity,
              category: detectedCategory,
              groupBy: detectedGroup,
              date: detectedDate,
              dataType: detectedType,
              numericColumns: numericColumns,
              textColumns: textColumns,
              dateColumns: dateColumns
            }
          );

        });


        



/* =====================================================
   STEP 3B - KPI AUTO SUGGESTION
   ===================================================== */

const kpiSuggestions =
  universalAnalysis?.suggestions?.kpis || [];

const kpiSelects = [
  document.getElementById("kpi1Input"),
  document.getElementById("kpi2Input"),
  document.getElementById("kpi3Input"),
  document.getElementById("kpi4Input")
];

for (const select of kpiSelects) {

  if (!select) continue;

  select.innerHTML =
    '<option value="">Auto Suggested</option>';
}

for (const suggestion of kpiSuggestions) {

  const option =
    document.createElement("option");

  option.value =
    suggestion.type + "|" + suggestion.column;

  option.textContent =
    suggestion.title;

  kpiSelects.forEach(select => {

    if (select) {
      select.appendChild(option.cloneNode(true));
    }

  });
}

/* Auto-select the first four universal recommendations.
   No salary/sales/inventory column is hard-coded here. */
kpiSelects.forEach((select, index) => {

  if (select && kpiSuggestions[index]) {

    const suggestion = kpiSuggestions[index];

    select.value =
      suggestion.type + "|" + suggestion.column;

  }
});

console.log(
  "UNIVERSAL KPI SUGGESTIONS:",
  kpiSuggestions
);




      } catch (error) {

        console.error(
          "Smart Analysis Error:",
          error
        );


        status.textContent =
          "? Smart Analysis failed � " +
          (error.message || error);

      }

    };


  /* =====================================================
     STEP 3A � END
     ===================================================== */





  /* =====================================================
     CREATE POWER DASHBOARD
     ===================================================== */

  document
    .getElementById("createPowerDashboardBtn")
    .onclick = async function () {

      const status =
        document.getElementById(
          "powerDashboardStatus"
        );


      const dashboardName =
        document
          .getElementById(
            "dashboardTitleInput"
        )
          .value
          .trim();


      if (!dashboardName) {

        status.textContent =
          "?? Please enter dashboard name.";

        return;

      }


      status.textContent =
        "? Creating Power Dashboard...";


      try {

        await createPowerDashboard(
          dashboardName
        );


        status.textContent =
          " Power Dashboard created successfully.";


      } catch (error) {

        console.error(
          "Power Dashboard Error:",
          error
        );


        status.textContent =
          "? " +
          (error.message || error);

      }

    };

}


/* =========================================================
   CREATE POWER DASHBOARD
   ========================================================= */


/* =========================================================
   POWER DASHBOARD v2
   KPI + Smart Summary + Smart Chart
   ========================================================= */

  async function createPowerDashboard(dashboardName) {

  let calculatedKpis = [];

  await Excel.run(async (context) => {

    const workbook = context.workbook;

    /* STEP 1 */
    const sourceRange =
      workbook.getSelectedRange();

    /* =====================================================
       STEP 1 � GET SOURCE DATA
       ===================================================== */

    

    sourceRange.load([
      "address",
      "rowCount",
      "columnCount",
      "values"
    ]);

    await context.sync();

    if (
      sourceRange.rowCount < 2 ||
      sourceRange.columnCount < 2
    ) {

      throw new Error(
        "Please select headers and at least one data row."
      );

    }

    const values = sourceRange.values;

    const headers = values[0].map(function (header) {
      return String(header || "").trim();
    });


    /* =====================================================
   STEP 1A - READ SELECTED KPI CONFIGURATION
   ===================================================== */

const kpiSelections = [
  document.getElementById("kpi1Input")?.value || "",
  document.getElementById("kpi2Input")?.value || "",
  document.getElementById("kpi3Input")?.value || "",
  document.getElementById("kpi4Input")?.value || ""
];

console.log(
  "SELECTED KPI CONFIGURATION:",
  kpiSelections
);


/* =====================================================
   STEP 1B - KPI CALCULATION FUNCTION
   ===================================================== */

function calculateSelectedKpi(type, columnName) {

  /* ---------------------------------------------
     FIND COLUMN INDEX
  --------------------------------------------- */

  const columnIndex =
    headers.findIndex(function (header) {

      return (
        String(header).trim() ===
        String(columnName).trim()
      );

    });


  if (columnIndex === -1) {

    console.warn(
      "KPI COLUMN NOT FOUND:",
      columnName
    );

    return null;

  }


  /* ---------------------------------------------
     COUNT
  --------------------------------------------- */

  if (type === "Count") {

    let count = 0;

    for (
      let r = 1;
      r < values.length;
      r++
    ) {

      const cellValue =
        values[r][columnIndex];

      if (
        cellValue !== null &&
        cellValue !== undefined &&
        String(cellValue).trim() !== ""
      ) {

        count++;

      }

    }

    return count;

  }


  /* ---------------------------------------------
     GET NUMERIC VALUES
  --------------------------------------------- */

  const numbers = [];

  for (
    let r = 1;
    r < values.length;
    r++
  ) {

    const number =
      Number(values[r][columnIndex]);

    if (!isNaN(number)) {

      numbers.push(number);

    }

  }


  if (numbers.length === 0) {

    return 0;

  }


  /* ---------------------------------------------
     TOTAL
  --------------------------------------------- */

  if (type === "Total") {

    return numbers.reduce(
      function (sum, value) {

        return sum + value;

      },
      0
    );

  }


  /* ---------------------------------------------
     AVERAGE
  --------------------------------------------- */

  if (type === "Average") {

    const total =
      numbers.reduce(
        function (sum, value) {

          return sum + value;

        },
        0
      );

    return total / numbers.length;

  }


  /* ---------------------------------------------
     MAXIMUM
  --------------------------------------------- */

  if (type === "Maximum") {

    return Math.max.apply(
      null,
      numbers
    );

  }


  /* ---------------------------------------------
     MINIMUM
  --------------------------------------------- */

  if (type === "Minimum") {

    return Math.min.apply(
      null,
      numbers
    );

  }


  return null;

}


/* =====================================================
   STEP 1C - BUILD CALCULATED KPI ARRAY
   ===================================================== */

calculatedKpis = [];


for (
  let i = 0;
  i < kpiSelections.length;
  i++
) {

  const selection =
    kpiSelections[i];


  /* ---------------------------------------------
     EMPTY / AUTO SUGGESTED
  --------------------------------------------- */

  if (
    !selection ||
    selection === "Auto Suggested"
  ) {

    continue;

  }


  /* ---------------------------------------------
     FORMAT:
     Total|Net Salary
     Count|Emp-Name
  --------------------------------------------- */

  const separatorIndex =
    selection.indexOf("|");


  if (separatorIndex === -1) {

    console.warn(
      "INVALID KPI SELECTION:",
      selection
    );

    continue;

  }


  const type =
    selection.substring(
      0,
      separatorIndex
    );


  const columnName =
    selection.substring(
      separatorIndex + 1
    );


  /* ---------------------------------------------
     CALCULATE VALUE
  --------------------------------------------- */

  const calculatedValue =
    calculateSelectedKpi(
      type,
      columnName
    );


  if (
    calculatedValue === null
  ) {

    continue;

  }


  /* ---------------------------------------------
     SAVE KPI
  --------------------------------------------- */

  calculatedKpis.push({

    type: type,

    column: columnName,

    value: calculatedValue

  });

}


console.log(
  "CALCULATED KPIs:",
  calculatedKpis
);
    

    


  /* =====================================================
   STEP 2 – SMART COLUMN DETECTION
   ===================================================== */

let employeeColumn = -1;
let departmentColumn = -1;

let salesColumn = -1;
let costColumn = -1;
let profitColumn = -1;

let numericColumns = [];


/* =====================================================
   DETECT COLUMNS
   ===================================================== */

for (let c = 0; c < headers.length; c++) {

  const header = headers[c];

  const lowerHeader =
    header.toLowerCase().trim();


  /* =================================================
     EMPLOYEE / ENTITY
     ================================================= */

  if (
    employeeColumn === -1 &&
    (
      lowerHeader.includes("employee") ||
      lowerHeader.includes("emp-name") ||
      lowerHeader.includes("emp name") ||
      lowerHeader === "employee" ||
      lowerHeader === "name" ||
      lowerHeader.includes("customer") ||
      lowerHeader.includes("client") ||
      lowerHeader.includes("staff") ||
      lowerHeader.includes("person")
    )
  ) {

    employeeColumn = c;

  }


  /* =================================================
     DEPARTMENT / CATEGORY
     ================================================= */

  if (
    departmentColumn === -1 &&
    (
      lowerHeader.includes("department") ||
      lowerHeader.includes("dept") ||
      lowerHeader.includes("category") ||
      lowerHeader.includes("designation") ||
      lowerHeader.includes("region") ||
      lowerHeader.includes("branch")
    )
  ) {

    departmentColumn = c;

  }


  /* =================================================
     SALES
     ================================================= */

  if (
    salesColumn === -1 &&
    (
      lowerHeader === "sales" ||
      lowerHeader.includes("sales") ||
      lowerHeader.includes("revenue") ||
      lowerHeader.includes("turnover") ||
      lowerHeader.includes("amount") ||
      lowerHeader.includes("net sales")
    )
  ) {

    salesColumn = c;

  }


  /* =================================================
     COST
     ================================================= */

  if (
    costColumn === -1 &&
    (
      lowerHeader === "cost" ||
      lowerHeader.includes("cost") ||
      lowerHeader.includes("expense")
    )
  ) {

    costColumn = c;

  }


  /* =================================================
     PROFIT
     ================================================= */

  if (
    profitColumn === -1 &&
    (
      lowerHeader === "profit" ||
      lowerHeader.includes("profit") ||
      lowerHeader.includes("net profit") ||
      lowerHeader.includes("gross profit")
    )
  ) {

    profitColumn = c;

  }


  /* =================================================
     NUMERIC COLUMN DETECTION
     ================================================= */

  let numericCount = 0;

  for (
    let r = 1;
    r < values.length;
    r++
  ) {

    const value = values[r][c];

    if (
      typeof value === "number" &&
      !isNaN(value)
    ) {

      numericCount++;

    }

  }


  if (numericCount > 0) {

    numericColumns.push({
      index: c,
      name: header
    });

  }

}


/* =====================================================
   FALLBACK SALES COLUMN
   ===================================================== */

if (
  salesColumn === -1 &&
  numericColumns.length > 0
) {

  salesColumn =
    numericColumns[0].index;

}


/* =====================================================
   DEBUG
   ===================================================== */

console.log(
  "SMART COLUMN DETECTION:",
  {
    employeeColumn,
    departmentColumn,
    salesColumn,
    costColumn,
    profitColumn,
    numericColumns
  }
);
    


    
    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;

    let salesCount = 0;
    let highestSales = 0;


    for (
      let r = 1;
      r < values.length;
      r++
    ) {

      /* Sales */

      if (salesColumn !== -1) {

        const sales =
          Number(values[r][salesColumn]);

        if (!isNaN(sales)) {

          totalSales += sales;

          salesCount++;

          if (
            sales > highestSales
          ) {

            highestSales = sales;

          }

        }

      }


      /* Cost */

      if (costColumn !== -1) {

        const cost =
          Number(values[r][costColumn]);

        if (!isNaN(cost)) {

          totalCost += cost;

        }

      }


      /* Profit */

      if (profitColumn !== -1) {

        const profit =
          Number(values[r][profitColumn]);

        if (!isNaN(profit)) {

          totalProfit += profit;

        }

      }

    }


    /* If Profit column doesn't exist */

    if (
      profitColumn === -1 &&
      salesColumn !== -1 &&
      costColumn !== -1
    ) {

      totalProfit =
        totalSales - totalCost;

    }


    const averageSales =
      salesCount > 0
        ? totalSales / salesCount
        : 0;


    /* =====================================================
   STEP 4 � CREATE / GET DASHBOARD SHEET
   ===================================================== */

let dashboardSheet =
  workbook.worksheets.getItemOrNullObject(
    dashboardName
  );

dashboardSheet.load("isNullObject");

await context.sync();


/* =====================================================
   CREATE NEW SHEET OR CLEAR EXISTING SHEET
   ===================================================== */

if (dashboardSheet.isNullObject) {

  /* ---------------------------------------------
     CREATE NEW DASHBOARD SHEET
  --------------------------------------------- */

  dashboardSheet =
    workbook.worksheets.add(
      dashboardName
    );

  console.log(
    "NEW DASHBOARD SHEET CREATED:",
    dashboardName
  );

} else {

  /* =================================================
     EXISTING DASHBOARD
     REMOVE OLD CHARTS
     ================================================= */

  console.log(
    "EXISTING DASHBOARD FOUND:",
    dashboardName
  );


  /* ---------------------------------------------
     REMOVE OLD CHARTS
  --------------------------------------------- */

  const oldCharts =
    dashboardSheet.charts;

  oldCharts.load("items/name");

  await context.sync();


  for (
    const oldChart of oldCharts.items
  ) {

    oldChart.delete();

  }


  /* ---------------------------------------------
     REMOVE OLD TABLES
  --------------------------------------------- */

  const oldTables =
    dashboardSheet.tables;

  oldTables.load("items/name");

  await context.sync();


  for (
    const oldTable of oldTables.items
  ) {

    oldTable.delete();

  }


  /* ---------------------------------------------
     CLEAR OLD DASHBOARD CONTENT
  --------------------------------------------- */

  const oldRange =
    dashboardSheet.getUsedRangeOrNullObject();

  oldRange.load("isNullObject");

  await context.sync();


  if (
    !oldRange.isNullObject
  ) {

    oldRange.clear(
      Excel.ClearApplyTo.all
    );

  }


  console.log(
    "OLD DASHBOARD CLEARED"
  );

}


/* =====================================================
   STEP 4 CHECKPOINT
   ===================================================== */

console.log(
  "CHECKPOINT - STEP 4 OK"
);


/* =====================================================
   STEP 5 � TITLE
   ===================================================== */


    /* =====================================================
       STEP 5 � TITLE
       ===================================================== */

    
    const titleRange =
    dashboardSheet.getRange("A1:N1");

    titleRange.merge(false);

    titleRange.getCell(0, 0).values = [
    [dashboardName]
  ];


    titleRange.format.font.bold =
      true;

    titleRange.format.font.size =
      20;

    titleRange.format.horizontalAlignment =
      Excel.HorizontalAlignment.center;


    /* =====================================================
       STEP 6 � SOURCE INFORMATION
       ===================================================== */

    dashboardSheet.getRange("A3:B5").values = [

      [
        "Source",
        sourceRange.address
      ],

      [
        "Data Rows",
        sourceRange.rowCount - 1
      ],

      [
        "Columns",
        sourceRange.columnCount
      ]

    ];


    dashboardSheet.getRange("A3:A5")
      .format.font.bold = true;
    await context.sync();
console.log("CHECKPOINT 1 � STEP 6 OK");


/* =====================================================
   STEP 7 � DYNAMIC KPI CARDS
   ===================================================== */

const kpiPositions = [

  {
    titleRange: "D3:F3",
    valueRange: "D4:F5"
  },

  {
    titleRange: "G3:I3",
    valueRange: "G4:I5"
  },

  {
    titleRange: "J3:L3",
    valueRange: "J4:L5"
  },

  {
    titleRange: "D6:F6",
    valueRange: "D7:F8"
  }

];



for (
  let i = 0;
  i < calculatedKpis.length &&
  i < kpiPositions.length;
  i++
) {

  const kpi =
    calculatedKpis[i];

  const position =
    kpiPositions[i];


  const title =
    dashboardSheet.getRange(
      position.titleRange
    );

  const value =
    dashboardSheet.getRange(
      position.valueRange
    );


  /* -----------------------------------------
     UNMERGE
  ----------------------------------------- */

  title.unmerge();
  value.unmerge();


  /* -----------------------------------------
     MERGE
  ----------------------------------------- */

  title.merge(false);
  value.merge(false);


  /* -----------------------------------------
     KPI TITLE
  ----------------------------------------- */

  let displayTitle =
    kpi.type.toUpperCase();


  if (
    kpi.column &&
    kpi.column !== "Rows"
  ) {

    displayTitle +=
      " " +
      kpi.column.toUpperCase();

  }


  title.getCell(
    0,
    0
  ).values = [
    [displayTitle]
  ];


  /* -----------------------------------------
     KPI VALUE
  ----------------------------------------- */

  value.getCell(
    0,
    0
  ).values = [
    [kpi.value]
  ];


  /* -----------------------------------------
     TITLE FORMAT
  ----------------------------------------- */

  title.format.font.bold =
    true;

  title.format.font.size =
    11;

  title.format.horizontalAlignment =
    Excel.HorizontalAlignment.center;

  title.format.verticalAlignment =
    Excel.VerticalAlignment.center;


  /* -----------------------------------------
     VALUE FORMAT
  ----------------------------------------- */

  value.format.font.bold =
    true;

  value.format.font.size =
    16;

  value.format.horizontalAlignment =
    Excel.HorizontalAlignment.center;

  value.format.verticalAlignment =
    Excel.VerticalAlignment.center;


  /* -----------------------------------------
     NUMBER FORMAT
  ----------------------------------------- */

  
    /* -----------------------------------------
   NUMBER FORMAT
----------------------------------------- */

if (kpi.type === "Count") {

  value.numberFormat =
    Array(2).fill(
      Array(3).fill("#,##0")
    );

} else {

  value.numberFormat =
    Array(2).fill(
      Array(3).fill("#,##0.00")
    );

}

}


await context.sync();

console.log(
  "CHECKPOINT 2 - KPI CARDS CREATED:",
  calculatedKpis
);





    /* =====================================================
       STEP 8 � EMPLOYEE SALES SUMMARY
       ===================================================== */

    const employeeSummary = {};

    if (
      employeeColumn !== -1 &&
      salesColumn !== -1
      
    ) {


      for (
        let r = 1;
        r < values.length;
        r++
      ) {

        const employee =
          String(
            values[r][employeeColumn] || ""
          ).trim();

        const sales =
          Number(
            values[r][salesColumn]
          );


        if (
          employee !== "" &&
          !isNaN(sales)
        ) {

          if (
            employeeSummary[employee] === undefined
          ) {

            employeeSummary[employee] =
              0;

          }

          employeeSummary[employee] +=
            sales;

        }

      }

    }


    const employeeRows =
      Object.keys(
        employeeSummary
      ).map(function (employee) {

        return [
          employee,
          employeeSummary[employee]
        ];

      });


    /* =====================================================
       STEP 9 � WRITE EMPLOYEE SUMMARY
       ===================================================== */

    dashboardSheet.getRange("A11:B11").values = [

      [
        "Employee",
        "Sales"
      ]

    ];


    if (
      employeeRows.length > 0
    ) {

      dashboardSheet
        .getRangeByIndexes(
          11,
          0,
          employeeRows.length,
          2
        )
        .values =
        employeeRows;

    }


    dashboardSheet
      .getRange("A11:B11")
      .format.font.bold = true;


    /* =====================================================
       STEP 10 � DEPARTMENT SUMMARY
       ===================================================== */

    const departmentSummary = {};


    if (
      departmentColumn !== -1 &&
      salesColumn !== -1
    ) {

      for (
        let r = 1;
        r < values.length;
        r++
      ) {

        const department =
          String(
            values[r][departmentColumn] || ""
          ).trim();

        const sales =
          Number(
            values[r][salesColumn]
          );


        if (
          department !== "" &&
          !isNaN(sales)
        ) {

          if (
            departmentSummary[department] === undefined
          ) {

            departmentSummary[department] =
              0;

          }

          departmentSummary[department] +=
            sales;

        }

      }

    }


    const departmentRows =
      Object.keys(
        departmentSummary
      ).map(function (department) {

        return [
          department,
          departmentSummary[department]
        ];

      });


    dashboardSheet.getRange("D11:E11").values = [

      [
        "Department",
        "Sales"
      ]

    ];


    if (
      departmentRows.length > 0
    ) {

      dashboardSheet
        .getRangeByIndexes(
          11,
          3,
          departmentRows.length,
          2
        )
        .values =
        departmentRows;

    }


    dashboardSheet
      .getRange("D11:E11")
      .format.font.bold = true;


    /* =====================================================
       STEP 11 � CREATE EMPLOYEE SALES CHART
       ===================================================== */

    if (
      employeeRows.length > 0
    ) {

      const chartRange =
        dashboardSheet.getRangeByIndexes(
          10,
          0,
          employeeRows.length + 1,
          2
        );


      const chart =
        dashboardSheet.charts.add(
          Excel.ChartType.columnClustered,
          chartRange,
          Excel.ChartSeriesBy.columns
        );


      chart.title.text =
        "Sales by Employee";


      chart.legend.position =
        Excel.ChartLegendPosition.none;


      chart.setPosition(
        dashboardSheet.getRange("G11"),
        dashboardSheet.getRange("N26")
      );

    }


    /* =====================================================
       STEP 12 � CREATE DEPARTMENT CHART
       ===================================================== */

    if (
      departmentRows.length > 0
    ) {

      const departmentChartRange =
        dashboardSheet.getRangeByIndexes(
          10,
          3,
          departmentRows.length + 1,
          2
        );


      const departmentChart =
        dashboardSheet.charts.add(
          Excel.ChartType.columnClustered,
          departmentChartRange,
          Excel.ChartSeriesBy.columns
        );


      departmentChart.title.text =
        "Sales by Department";


      departmentChart.legend.position =
        Excel.ChartLegendPosition.none;


      departmentChart.setPosition(
        dashboardSheet.getRange("G28"),
        dashboardSheet.getRange("N43")
      );

    }


    /* =====================================================
       STEP 13 � FORMAT TABLE AREAS
       ===================================================== */

    dashboardSheet
      .getRange("A11:B11")
      .format.font.bold = true;


    dashboardSheet
      .getRange("D11:E11")
      .format.font.bold = true;


    if (
      employeeRows.length > 0
    ) {

      dashboardSheet
        .getRangeByIndexes(
          11,
          1,
          employeeRows.length,
          1
        )
        .numberFormat =
        Array(
          employeeRows.length
        )
        .fill(["#,##0"]);

    }


    if (
      departmentRows.length > 0
    ) {

      dashboardSheet
        .getRangeByIndexes(
          11,
          4,
          departmentRows.length,
          1
        )
        .numberFormat =
        Array(
          departmentRows.length
        )
        .fill(["#,##0"]);

    }


    /* =====================================================
       STEP 14 � AUTOFIT
       ===================================================== */

    dashboardSheet
      .getUsedRange()
      .format
      .autofitColumns();


    dashboardSheet
      .getUsedRange()
      .format
      .autofitRows();


    /* =====================================================
       STEP 15 � ACTIVATE DASHBOARD
       ===================================================== */

    dashboardSheet.activate();

    await context.sync();


    /* =====================================================
       FINAL STATUS
       ===================================================== */

    setStatus(
      "? Power Dashboard v2 created successfully � " +
      "KPI + Employee Chart + Department Analysis."
    );

  });

}












