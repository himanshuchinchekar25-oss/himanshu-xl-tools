Office.onReady(function () {

  const selectionBox =
    document.getElementById(
      "selectionBox"
    );

  const currentFormulaBox =
    document.getElementById(
      "currentFormulaBox"
    );

  const problemBox =
    document.getElementById(
      "problemBox"
    );

  const fixedFormulaBox =
    document.getElementById(
      "fixedFormulaBox"
    );

  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );

  const fixBtn =
    document.getElementById(
      "fixBtn"
    );

  const insertBtn =
    document.getElementById(
      "insertBtn"
    );

  const status =
    document.getElementById(
      "status"
    );


  if (
    !selectionBox ||
    !currentFormulaBox ||
    !problemBox ||
    !fixedFormulaBox ||
    !refreshBtn ||
    !fixBtn ||
    !insertBtn ||
    !status
  ) {
    return;
  }


  let selectionInfo = null;
  let fixedFormula = "";


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    function (arg) {

      try {

        const payload =
          JSON.parse(
            arg.message
          );


        // =====================================
        // SELECTION INFO
        // =====================================

        if (
          payload.type ===
          "HXL_FIX_FORMULA_INFO"
        ) {

          selectionInfo = {
            sheetName:
              payload.sheetName || "",

            address:
              payload.address || "",

            rowIndex:
              payload.rowIndex,

            columnIndex:
              payload.columnIndex,

            rowCount:
              payload.rowCount,

            columnCount:
              payload.columnCount,

            formula:
              payload.formula || "",

            value:
              payload.value
          };


          fixedFormula = "";


          selectionBox.textContent =
            payload.address || "Unknown";


          currentFormulaBox.textContent =
            payload.formula || "-";


          problemBox.textContent =
            "No issue analysis generated yet.";


          fixedFormulaBox.textContent =
            "-";


          insertBtn.disabled =
            true;


          const hasFormula =
            typeof payload.formula ===
              "string" &&
            payload.formula.charAt(0) === "=";


          fixBtn.disabled =
            !hasFormula;


          if (hasFormula) {

            status.textContent =
              "Ready to analyze and fix formula.";

          } else {

            status.textContent =
              "Select a cell containing an Excel formula.";

          }


          return;
        }


        // =====================================
        // FIX RESULT
        // =====================================

        if (
          payload.type ===
          "HXL_FIX_FORMULA_RESULT"
        ) {

          fixBtn.disabled =
            false;


          if (payload.success) {

            fixedFormula =
              payload.fixedFormula || "";


            problemBox.textContent =
              payload.problem ||
              "Formula issue analyzed.";


            fixedFormulaBox.textContent =
              fixedFormula || "-";


            insertBtn.disabled =
              !(
                fixedFormula &&
                fixedFormula.charAt(0) === "="
              );


            status.textContent =
              payload.message ||
              "Formula fixed successfully.";

          } else {

            fixedFormula =
              "";


            problemBox.textContent =
              "Unable to fix formula.";


            fixedFormulaBox.textContent =
              "-";


            insertBtn.disabled =
              true;


            status.textContent =
              "Error: " +
              (
                payload.message ||
                "Fix Formula failed."
              );

          }


          return;
        }


        // =====================================
        // INSERT RESULT
        // =====================================

        if (
          payload.type ===
          "HXL_FIX_FORMULA_INSERT_RESULT"
        ) {

          insertBtn.disabled =
            false;


          if (payload.success) {

            status.textContent =
              payload.message ||
              "Fixed formula inserted successfully.";

          } else {

            status.textContent =
              "Error: " +
              (
                payload.message ||
                "Unable to insert fixed formula."
              );

          }


          return;
        }

      } catch (error) {

        console.error(
          "Fix Formula message error:",
          error
        );


        status.textContent =
          "Unable to process workbook response.";


        fixBtn.disabled =
          false;

      }

    }
  );


  refreshBtn.addEventListener(
    "click",

    function () {

      requestFormulaInfo();

    }
  );


  fixBtn.addEventListener(
    "click",

    function () {

      requestFormulaFix();

    }
  );


  insertBtn.addEventListener(
    "click",

    function () {

      insertFixedFormula();

    }
  );


  function requestFormulaInfo() {

    selectionInfo =
      null;


    fixedFormula =
      "";


    fixBtn.disabled =
      true;


    insertBtn.disabled =
      true;


    selectionBox.textContent =
      "Reading selection...";


    currentFormulaBox.textContent =
      "-";


    problemBox.textContent =
      "No issue analysis generated yet.";


    fixedFormulaBox.textContent =
      "-";


    status.textContent =
      "Reading workbook selection...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_GET_FIX_FORMULA_INFO"

      })
    );

  }


  function requestFormulaFix() {

    if (
      !selectionInfo ||
      !selectionInfo.formula ||
      selectionInfo.formula.charAt(0) !== "="
    ) {

      status.textContent =
        "Select a cell containing an Excel formula.";

      return;
    }


    fixBtn.disabled =
      true;


    insertBtn.disabled =
      true;


    problemBox.textContent =
      "Analyzing formula...";


    fixedFormulaBox.textContent =
      "-";


    status.textContent =
      "Fixing formula...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_FIX_FORMULA",

        selection:
          selectionInfo

      })
    );

  }


  function insertFixedFormula() {

    if (
      !selectionInfo ||
      !fixedFormula ||
      fixedFormula.charAt(0) !== "="
    ) {

      status.textContent =
        "No valid fixed formula is available.";

      return;
    }


    insertBtn.disabled =
      true;


    status.textContent =
      "Inserting fixed formula...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_INSERT_FIXED_FORMULA",

        fixedFormula:
          fixedFormula,

        selection:
          selectionInfo

      })
    );

  }


  requestFormulaInfo();

});