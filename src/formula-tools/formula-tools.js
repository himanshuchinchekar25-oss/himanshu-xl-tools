Office.onReady(function () {

  const refreshBtn =
    document.getElementById("refreshBtn");

  const runBtn =
    document.getElementById("runBtn");

  const status =
    document.getElementById("status");

  const resultBox =
    document.getElementById("resultBox");


  if (
    !refreshBtn ||
    !runBtn ||
    !status ||
    !resultBox
  ) {
    return;
  }


  let workbookReady = false;
  let savedSelection = null;


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    function (arg) {

      try {

        const payload =
          JSON.parse(arg.message);


        if (
          payload.type ===
          "HXL_FORMULA_TOOLS_INFO"
        ) {

          workbookReady = true;
          savedSelection = {
  rowIndex:
    payload.selectionRowIndex,

  columnIndex:
    payload.selectionColumnIndex,

  rowCount:
    payload.selectionRowCount,

  columnCount:
    payload.selectionColumnCount
};
          runBtn.disabled = false;

          const selectionAddress =
            payload.selectionAddress || "Unknown";

          const usedRangeAddress =
            payload.usedRangeAddress || "Empty";


          status.textContent =
            "Ready.\n" +
            "Selected Range: " +
            selectionAddress +
            "\nUsed Range: " +
            usedRangeAddress;

          validateForm();

          return;
        }


        if (
          payload.type ===
          "HXL_FORMULA_TOOLS_RESULT"
        ) {

          runBtn.disabled = false;


          if (payload.success) {

            status.textContent =
              payload.message ||
              "Formula operation completed.";


            if (
              Array.isArray(payload.results) &&
              payload.results.length > 0
            ) {

              resultBox.style.display =
                "block";

              resultBox.textContent =
                payload.results.join("\n");

            } else {

              resultBox.style.display =
                "none";

              resultBox.textContent =
                "";

            }

          } else {

            status.textContent =
              "Error: " +
              (
                payload.message ||
                "Formula operation failed."
              );

            resultBox.style.display =
              "none";

            resultBox.textContent =
              "";

          }


          return;
        }

      } catch (error) {

        console.error(
          "Formula Tools message error:",
          error
        );

        status.textContent =
          "Unable to process workbook response.";

        runBtn.disabled = false;

      }

    }
  );


  refreshBtn.addEventListener(
    "click",
    function () {

      requestInfo();

    }
  );


  runBtn.addEventListener(
    "click",
    function () {

      runFormulaTool();

    }
  );


  document
    .querySelectorAll(
      'input[name="formulaRange"]'
    )
    .forEach(function (radio) {

      radio.addEventListener(
        "change",
        function () {

          validateForm();

        }
      );

    });


  document
    .querySelectorAll(
      'input[name="formulaOperation"]'
    )
    .forEach(function (radio) {

      radio.addEventListener(
        "change",
        function () {

          validateForm();

          resultBox.style.display =
            "none";

          resultBox.textContent =
            "";

        }
      );

    });


  function getSelectedValue(name) {

    const selected =
      document.querySelector(
        'input[name="' +
        name +
        '"]:checked'
      );


    return selected
      ? selected.value
      : "";

  }


  function validateForm() {

    const rangeMode =
      getSelectedValue(
        "formulaRange"
      );

    const operation =
      getSelectedValue(
        "formulaOperation"
      );


    const valid =
      workbookReady &&
      !!rangeMode &&
      !!operation;


    runBtn.disabled =
      !valid;


    return valid;

  }


  function requestInfo() {

  workbookReady = false;
  savedSelection = null;

  runBtn.disabled = true;

  resultBox.style.display =
    "none";

  resultBox.textContent =
    "";

  status.textContent =
    "Reading workbook...";


  Office.context.ui.messageParent(
    JSON.stringify({
      type:
        "HXL_GET_FORMULA_TOOLS_INFO"
    })
  );

}


  function runFormulaTool() {

    if (!validateForm()) {
      return;
    }


    const rangeMode =
      getSelectedValue(
        "formulaRange"
      );

    const operation =
      getSelectedValue(
        "formulaOperation"
      );


    runBtn.disabled =
      true;

    resultBox.style.display =
      "none";

    resultBox.textContent =
      "";


    switch (operation) {

      case "show":

        status.textContent =
          "Reading formulas...";

        break;


      case "values":

        status.textContent =
          "Converting formulas to values...";

        break;


      case "fillDown":

        status.textContent =
          "Filling formula down...";

        break;


      case "fillRight":

        status.textContent =
          "Filling formula right...";

        break;


      case "errors":

        status.textContent =
          "Scanning for formula errors...";

        break;


      default:

        status.textContent =
          "Running Formula Tool...";

        break;

    }


        Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_RUN_FORMULA_TOOL",

        rangeMode:
          rangeMode,

        operation:
          operation,

        selection:
          savedSelection

      })
    );

  }


  requestInfo();

});