Office.onReady(function () {

  const selectionBox =
    document.getElementById(
      "selectionBox"
    );

  const formulaBox =
    document.getElementById(
      "formulaBox"
    );

  const explanationBox =
    document.getElementById(
      "explanationBox"
    );

  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );

  const explainBtn =
    document.getElementById(
      "explainBtn"
    );

  const status =
    document.getElementById(
      "status"
    );


  if (
    !selectionBox ||
    !formulaBox ||
    !explanationBox ||
    !refreshBtn ||
    !explainBtn ||
    !status
  ) {
    return;
  }


  let selectionInfo = null;


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    function (arg) {

      try {

        const payload =
          JSON.parse(
            arg.message
          );


        if (
          payload.type ===
          "HXL_EXPLAIN_FORMULA_INFO"
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


          selectionBox.textContent =
            payload.address || "Unknown";


          formulaBox.textContent =
            payload.formula || "-";


          explanationBox.textContent =
            "No explanation generated yet.";


          const hasFormula =
            typeof payload.formula ===
              "string" &&
            payload.formula.charAt(0) === "=";


          explainBtn.disabled =
            !hasFormula;


          if (hasFormula) {

            status.textContent =
              "Ready to explain formula.";

          } else {

            status.textContent =
              "Select a cell containing an Excel formula.";

          }


          return;
        }


        if (
          payload.type ===
          "HXL_EXPLAIN_FORMULA_RESULT"
        ) {

          explainBtn.disabled =
            false;


          if (payload.success) {

            explanationBox.textContent =
              payload.explanation ||
              "No explanation returned.";


            status.textContent =
              payload.message ||
              "Formula explained successfully.";

          } else {

            explanationBox.textContent =
              "Unable to explain formula.";


            status.textContent =
              "Error: " +
              (
                payload.message ||
                "Explain Formula failed."
              );

          }


          return;
        }

      } catch (error) {

        console.error(
          "Explain Formula message error:",
          error
        );


        status.textContent =
          "Unable to process workbook response.";


        explainBtn.disabled =
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


  explainBtn.addEventListener(
    "click",

    function () {

      explainFormula();

    }
  );


  function requestFormulaInfo() {

    selectionInfo =
      null;


    explainBtn.disabled =
      true;


    selectionBox.textContent =
      "Reading selection...";


    formulaBox.textContent =
      "-";


    explanationBox.textContent =
      "No explanation generated yet.";


    status.textContent =
      "Reading workbook selection...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_GET_EXPLAIN_FORMULA_INFO"

      })
    );

  }


  function explainFormula() {

    if (
      !selectionInfo ||
      !selectionInfo.formula ||
      selectionInfo.formula.charAt(0) !== "="
    ) {

      status.textContent =
        "Select a cell containing an Excel formula.";

      return;
    }


    explainBtn.disabled =
      true;


    explanationBox.textContent =
      "Generating explanation...";


    status.textContent =
      "Explaining formula...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_EXPLAIN_FORMULA",

        selection:
          selectionInfo

      })
    );

  }


  requestFormulaInfo();

});