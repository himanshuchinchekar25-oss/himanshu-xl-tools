Office.onReady(function () {

  const fillValueInput =
    document.getElementById("fillValueInput");

  const formulaInput =
    document.getElementById("formulaInput");

  const valueSection =
    document.getElementById("valueSection");

  const formulaSection =
    document.getElementById("formulaSection");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const fillBtn =
    document.getElementById("fillBtn");

  const status =
    document.getElementById("status");


  if (
    !refreshBtn ||
    !fillBtn ||
    !status
  ) {
    return;
  }


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    function (arg) {

      try {

        const payload =
          JSON.parse(arg.message);


        if (
          payload.type ===
          "HXL_FILL_BLANKS_INFO"
        ) {

          status.textContent =
            "Ready.\n" +
            "Sheet: " +
            (payload.sheetName || "-") +
            "\nSelection: " +
            (payload.selectionAddress || "-") +
            "\nUsed Range: " +
            (payload.usedRangeAddress || "-");


          validateForm();

          return;
        }


        if (
          payload.type ===
          "HXL_FILL_BLANKS_RESULT"
        ) {

          if (payload.success) {

            status.textContent =
              "SUCCESS: Fill Blanks completed.\n" +
              "Blank cells filled: " +
              (
                payload.filledCount || 0
              );


            fillBtn.disabled =
              false;

          } else {

            status.textContent =
              "ERROR: " +
              (
                payload.message ||
                "Fill Blanks failed."
              );


            fillBtn.disabled =
              false;

          }


          return;
        }


      } catch (error) {

        console.error(
          "Fill Blanks message error:",
          error
        );


        status.textContent =
          "ERROR: " +
          (
            error &&
            error.message
              ? error.message
              : String(error)
          );


        fillBtn.disabled =
          false;

      }

    },

    function (asyncResult) {

      if (
        asyncResult.status ===
        Office.AsyncResultStatus.Failed
      ) {

        console.error(
          "Fill Blanks handler error:",
          asyncResult.error
        );


        status.textContent =
          "ERROR: Unable to initialize Fill Blanks.";

        fillBtn.disabled =
          true;

        return;
      }


      requestInfo();

    }
  );


  refreshBtn.addEventListener(
    "click",
    function () {

      requestInfo();

    }
  );


  fillBtn.addEventListener(
    "click",
    function () {

      runFillBlanks();

    }
  );


  const methodInputs =
    document.querySelectorAll(
      'input[name="fillMethod"]'
    );


  methodInputs.forEach(
    function (input) {

      input.addEventListener(
        "change",
        function () {

          updateMethodUI();
          validateForm();

        }
      );

    }
  );


  if (fillValueInput) {

    fillValueInput.addEventListener(
      "input",
      function () {

        validateForm();

      }
    );

  }


  if (formulaInput) {

    formulaInput.addEventListener(
      "input",
      function () {

        validateForm();

      }
    );

  }


  function getRangeMode() {

    const selected =
      document.querySelector(
        'input[name="fillRange"]:checked'
      );


    return selected
      ? selected.value
      : "selection";

  }


  function getMethod() {

    const selected =
      document.querySelector(
        'input[name="fillMethod"]:checked'
      );


    return selected
      ? selected.value
      : "fixed";

  }


  function updateMethodUI() {

    const method =
      getMethod();


    if (valueSection) {

      valueSection.style.display =
        method === "fixed"
          ? "block"
          : "none";

    }


    if (formulaSection) {

      formulaSection.style.display =
        method === "formula"
          ? "block"
          : "none";

    }

  }


  function validateForm() {

    const method =
      getMethod();


    if (
      method === "fixed"
    ) {

      const value =
        fillValueInput
          ? fillValueInput.value
          : "";


      fillBtn.disabled =
        value === "";

      return (
        value !== ""
      );

    }


    if (
      method === "formula"
    ) {

      const formula =
        formulaInput
          ? formulaInput.value.trim()
          : "";


      const valid =
        formula.length > 1 &&
        formula.charAt(0) === "=";


      fillBtn.disabled =
        !valid;

      return valid;

    }


    fillBtn.disabled =
      false;

    return true;

  }


  function requestInfo() {

    fillBtn.disabled =
      true;


    status.textContent =
      "Reading worksheet information...";


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_FILL_BLANKS_INFO"
      })
    );

  }


  function runFillBlanks() {

    if (
      !validateForm()
    ) {

      status.textContent =
        "ERROR: Please check the selected fill method.";

      return;

    }


    const method =
      getMethod();


    fillBtn.disabled =
      true;


    status.textContent =
      "Filling blank cells...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_RUN_FILL_BLANKS",

        rangeMode:
          getRangeMode(),

        method:
          method,

        value:
          method === "fixed"
            ? fillValueInput.value
            : "",

        formula:
          method === "formula"
            ? formulaInput.value.trim()
            : ""

      })
    );

  }


  updateMethodUI();

});