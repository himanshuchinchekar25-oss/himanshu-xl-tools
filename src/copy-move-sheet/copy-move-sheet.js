Office.onReady(function () {

  const sourceSheetSelect =
    document.getElementById("sourceSheetSelect");

  const positionSelect =
    document.getElementById("positionSelect");

  const targetSheetSelect =
    document.getElementById("targetSheetSelect");

  const targetSheetSection =
    document.getElementById("targetSheetSection");

  const newNameInput =
    document.getElementById("newNameInput");

  const newNameSection =
    document.getElementById("newNameSection");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const applyBtn =
    document.getElementById("applyBtn");

  const status =
    document.getElementById("status");


  if (
    !sourceSheetSelect ||
    !positionSelect ||
    !targetSheetSelect ||
    !newNameInput ||
    !refreshBtn ||
    !applyBtn ||
    !status
  ) {
    return;
  }


  let workbookSheets = [];


  // =========================================
  // RECEIVE MESSAGE FROM PARENT
  // =========================================

  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    function (arg) {

      try {

        const payload =
          JSON.parse(arg.message);


        if (
          payload.type ===
          "HXL_COPY_MOVE_SHEETS_DATA"
        ) {

          workbookSheets =
            Array.isArray(payload.sheets)
              ? payload.sheets
              : [];


          renderSheets();

          return;
        }


        if (
          payload.type ===
          "HXL_COPY_MOVE_SHEET_RESULT"
        ) {

          if (payload.success) {

            status.textContent =
              "SUCCESS: " +
              (
                payload.message ||
                "Worksheet operation completed."
              );


            requestSheets();

          } else {

            status.textContent =
              "ERROR: " +
              (
                payload.message ||
                "Unable to complete worksheet operation."
              );


            applyBtn.disabled =
              false;

          }


          return;
        }


      } catch (error) {

        console.error(
          "Copy / Move Sheet message error:",
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


        applyBtn.disabled =
          false;

      }

    },

    function (asyncResult) {

      if (
        asyncResult.status ===
        Office.AsyncResultStatus.Failed
      ) {

        console.error(
          "Copy / Move initialization error:",
          asyncResult.error
        );


        status.textContent =
          "ERROR: Unable to initialize Copy / Move Sheet.";

        return;
      }


      requestSheets();

    }
  );


  // =========================================
  // EVENTS
  // =========================================

  refreshBtn.addEventListener(
    "click",
    function () {

      requestSheets();

    }
  );


  sourceSheetSelect.addEventListener(
    "change",
    function () {

      refreshTargetSheetOptions();
      suggestCopyName();
      validateForm();

    }
  );


  positionSelect.addEventListener(
    "change",
    function () {

      updatePositionUI();
      validateForm();

    }
  );


  targetSheetSelect.addEventListener(
    "change",
    function () {

      validateForm();

    }
  );


  newNameInput.addEventListener(
    "input",
    function () {

      validateForm();

    }
  );


  const modeInputs =
    document.querySelectorAll(
      'input[name="copyMoveMode"]'
    );


  modeInputs.forEach(
    function (input) {

      input.addEventListener(
        "change",
        function () {

          updateModeUI();
          refreshTargetSheetOptions();
          validateForm();

        }
      );

    }
  );


  applyBtn.addEventListener(
    "click",
    function () {

      executeOperation();

    }
  );


  // =========================================
  // MODE
  // =========================================

  function getMode() {

    const selected =
      document.querySelector(
        'input[name="copyMoveMode"]:checked'
      );


    return selected
      ? selected.value
      : "copy";

  }


  // =========================================
  // REQUEST SHEETS
  // =========================================

  function requestSheets() {

    status.textContent =
      "Reading workbook sheets...";


    applyBtn.disabled =
      true;


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_COPY_MOVE_SHEETS"
      })
    );

  }


  // =========================================
  // RENDER
  // =========================================

  function renderSheets() {

    sourceSheetSelect.innerHTML =
      "";


    if (
      workbookSheets.length === 0
    ) {

      status.textContent =
        "No worksheets found.";

      applyBtn.disabled =
        true;

      return;

    }


    workbookSheets.forEach(
      function (sheetName) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          sheetName;

        option.textContent =
          sheetName;


        sourceSheetSelect.appendChild(
          option
        );

      }
    );


    refreshTargetSheetOptions();

    suggestCopyName();

    updateModeUI();

    updatePositionUI();


    status.textContent =
      workbookSheets.length +
      " worksheet(s) loaded.";


    validateForm();

  }


  // =========================================
  // TARGET SHEETS
  // =========================================

  function refreshTargetSheetOptions() {

    const sourceName =
      sourceSheetSelect.value;


    targetSheetSelect.innerHTML =
      "";


    workbookSheets.forEach(
      function (sheetName) {

        if (
          sheetName === sourceName
        ) {
          return;
        }


        const option =
          document.createElement(
            "option"
          );


        option.value =
          sheetName;

        option.textContent =
          sheetName;


        targetSheetSelect.appendChild(
          option
        );

      }
    );

  }


  // =========================================
  // COPY NAME
  // =========================================

  function suggestCopyName() {

    if (
      getMode() !== "copy"
    ) {
      return;
    }


    const sourceName =
      sourceSheetSelect.value;


    if (!sourceName) {
      return;
    }


    const base =
      sourceName + "_Copy";


    let candidate =
      base;

    let counter =
      2;


    while (
      workbookSheets.some(
        function (name) {

          return (
            name.toLowerCase() ===
            candidate.toLowerCase()
          );

        }
      )
    ) {

      candidate =
        base +
        "_" +
        counter;

      counter++;

    }


    newNameInput.value =
      candidate;

  }


  // =========================================
  // MODE UI
  // =========================================

  function updateModeUI() {

    const mode =
      getMode();


    if (
      mode === "copy"
    ) {

      if (newNameSection) {

        newNameSection.style.display =
          "block";

      }


      applyBtn.textContent =
        "Copy Sheet";


      suggestCopyName();

    } else {

      if (newNameSection) {

        newNameSection.style.display =
          "none";

      }


      applyBtn.textContent =
        "Move Sheet";

    }

  }


  // =========================================
  // POSITION UI
  // =========================================

  function updatePositionUI() {

    if (!targetSheetSection) {
      return;
    }


    targetSheetSection.style.display =
      positionSelect.value === "end"
        ? "none"
        : "block";

  }


  // =========================================
  // VALIDATION
  // =========================================

  function validateForm() {

    const sourceName =
      sourceSheetSelect.value;


    if (!sourceName) {

      applyBtn.disabled =
        true;

      return false;

    }


    const position =
      positionSelect.value;


    if (
      position !== "end" &&
      !targetSheetSelect.value
    ) {

      applyBtn.disabled =
        true;

      return false;

    }


    if (
      getMode() === "copy"
    ) {

      const newName =
        newNameInput.value.trim();


      if (!newName) {

        applyBtn.disabled =
          true;

        return false;

      }


      if (
        newName.length > 31
      ) {

        applyBtn.disabled =
          true;

        return false;

      }


      if (
        /[:\\\/\?\*\[\]]/.test(
          newName
        )
      ) {

        applyBtn.disabled =
          true;

        return false;

      }


      if (
        newName.charAt(0) === "'" ||
        newName.charAt(
          newName.length - 1
        ) === "'"
      ) {

        applyBtn.disabled =
          true;

        return false;

      }


      const duplicate =
        workbookSheets.some(
          function (name) {

            return (
              name.toLowerCase() ===
              newName.toLowerCase()
            );

          }
        );


      if (duplicate) {

        applyBtn.disabled =
          true;

        return false;

      }

    }


    applyBtn.disabled =
      false;

    return true;

  }


  // =========================================
  // EXECUTE
  // =========================================

  function executeOperation() {

    if (
      !validateForm()
    ) {

      status.textContent =
        "ERROR: Please check the selected options.";

      return;

    }


    const mode =
      getMode();


    const payload = {

      type:
        "HXL_APPLY_COPY_MOVE_SHEET",

      mode:
        mode,

      sourceSheet:
        sourceSheetSelect.value,

      position:
        positionSelect.value,

      targetSheet:
        positionSelect.value === "end"
          ? ""
          : targetSheetSelect.value,

      newName:
        mode === "copy"
          ? newNameInput.value.trim()
          : ""

    };


    applyBtn.disabled =
      true;


    status.textContent =
      mode === "copy"
        ? "Copying worksheet..."
        : "Moving worksheet...";


    Office.context.ui.messageParent(
      JSON.stringify(payload)
    );

  }


  // =========================================
  // INITIAL UI
  // =========================================

  updateModeUI();
  updatePositionUI();

});