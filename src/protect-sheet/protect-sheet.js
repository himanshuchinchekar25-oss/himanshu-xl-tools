Office.onReady(function () {

  const sheetSelect =
    document.getElementById("sheetSelect");

  const passwordInput =
    document.getElementById("passwordInput");

  const confirmPasswordInput =
    document.getElementById("confirmPasswordInput");

  const confirmPasswordSection =
    document.getElementById("confirmPasswordSection");

  const protectionOptions =
    document.getElementById("protectionOptions");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const applyBtn =
    document.getElementById("applyBtn");

  const status =
    document.getElementById("status");


  if (
    !sheetSelect ||
    !passwordInput ||
    !applyBtn ||
    !status
  ) {
    return;
  }


  // =========================================
  // RECEIVE MESSAGE FROM PARENT
  // =========================================

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
          "HXL_PROTECT_SHEETS_DATA"
        ) {

          renderSheets(
            payload.sheets || []
          );

          return;
        }


        if (
          payload.type ===
          "HXL_PROTECT_SHEET_RESULT"
        ) {

          if (
            payload.success
          ) {

            status.textContent =
              payload.message ||
              "Worksheet protection updated successfully.";


            passwordInput.value =
              "";


            if (
              confirmPasswordInput
            ) {

              confirmPasswordInput.value =
                "";

            }


            requestSheets();

          } else {

            status.textContent =
              "❌ " +
              (
                payload.message ||
                "Unable to update sheet protection."
              );


            applyBtn.disabled =
              false;

          }


          return;
        }


      } catch (error) {

        console.error(
          "Protect Sheet message error:",
          error
        );


        status.textContent =
          "❌ Message Error: " +
          (
            error &&
            error.message
              ? error.message
              : String(error)
          );

      }

    },

    function (asyncResult) {

      if (
        asyncResult.status ===
        Office.AsyncResultStatus.Failed
      ) {

        console.error(
          "Protect Sheet message handler error:",
          asyncResult.error
        );


        status.textContent =
          "❌ Unable to initialize Protect Sheet.";

        return;
      }


      requestSheets();

    }
  );


  // =========================================
  // BUTTON EVENTS
  // =========================================

  refreshBtn.addEventListener(
    "click",
    function () {

      requestSheets();

    }
  );


  applyBtn.addEventListener(
    "click",
    function () {

      applyProtection();

    }
  );


  const modeInputs =
    document.querySelectorAll(
      'input[name="protectMode"]'
    );


  modeInputs.forEach(
    function (input) {

      input.addEventListener(
        "change",
        function () {

          updateModeUI();

        }
      );

    }
  );


  sheetSelect.addEventListener(
    "change",
    function () {

      applyBtn.disabled =
        !sheetSelect.value;

    }
  );


  // =========================================
  // REQUEST WORKSHEETS
  // =========================================

  function requestSheets() {

    status.textContent =
      "Reading workbook sheets...";


    applyBtn.disabled =
      true;


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_PROTECT_SHEETS"
      })
    );

  }


  // =========================================
  // RENDER WORKSHEETS
  // =========================================

  function renderSheets(
    sheets
  ) {

    sheetSelect.innerHTML =
      "";


    if (
      !Array.isArray(sheets) ||
      sheets.length === 0
    ) {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        "";


      option.textContent =
        "No worksheets found";


      sheetSelect.appendChild(
        option
      );


      status.textContent =
        "No worksheets found.";


      applyBtn.disabled =
        true;

      return;

    }


    sheets.forEach(
      function (sheet) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          sheet.name;


        option.textContent =
          sheet.name +
          (
            sheet.protected
              ? " — Protected"
              : " — Unprotected"
          );


        option.dataset.protected =
          sheet.protected
            ? "true"
            : "false";


        sheetSelect.appendChild(
          option
        );

      }
    );


    status.textContent =
      sheets.length +
      " worksheet(s) loaded.";


    applyBtn.disabled =
      false;

  }


  // =========================================
  // CURRENT MODE
  // =========================================

  function getMode() {

    const selected =
      document.querySelector(
        'input[name="protectMode"]:checked'
      );


    return selected
      ? selected.value
      : "protect";

  }


  // =========================================
  // UPDATE UI
  // =========================================

  function updateModeUI() {

    const mode =
      getMode();


    if (
      mode === "protect"
    ) {

      applyBtn.textContent =
        "Protect Sheet";


      if (
        confirmPasswordSection
      ) {

        confirmPasswordSection.style.display =
          "block";

      }


      if (
        protectionOptions
      ) {

        protectionOptions.style.display =
          "block";

      }

    } else {

      applyBtn.textContent =
        "Unprotect Sheet";


      if (
        confirmPasswordSection
      ) {

        confirmPasswordSection.style.display =
          "none";

      }


      if (
        protectionOptions
      ) {

        protectionOptions.style.display =
          "none";

      }

    }

  }


  // =========================================
  // APPLY PROTECT / UNPROTECT
  // =========================================

  function applyProtection() {

    const sheetName =
      sheetSelect.value;


    if (
      !sheetName
    ) {

      status.textContent =
        "Please select a worksheet.";

      return;

    }


    const mode =
      getMode();


    const password =
      passwordInput.value || "";


    if (
      mode === "protect"
    ) {

      const confirmPassword =
        confirmPasswordInput
          ? confirmPasswordInput.value
          : "";


      if (
        password !==
        confirmPassword
      ) {

        status.textContent =
          "❌ Password and Confirm Password do not match.";

        return;

      }

    }


    const allowFormatCells =
      document.getElementById(
        "allowFormatCells"
      );

    const allowInsertRows =
      document.getElementById(
        "allowInsertRows"
      );

    const allowDeleteRows =
      document.getElementById(
        "allowDeleteRows"
      );

    const allowSort =
      document.getElementById(
        "allowSort"
      );

    const allowAutoFilter =
      document.getElementById(
        "allowAutoFilter"
      );


    applyBtn.disabled =
      true;


    status.textContent =
      mode === "protect"
        ? "Protecting worksheet..."
        : "Unprotecting worksheet...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_APPLY_PROTECT_SHEET",

        sheetName:
          sheetName,

        mode:
          mode,

        password:
          password,

        options: {

          allowFormatCells:
            !!(
              allowFormatCells &&
              allowFormatCells.checked
            ),

          allowInsertRows:
            !!(
              allowInsertRows &&
              allowInsertRows.checked
            ),

          allowDeleteRows:
            !!(
              allowDeleteRows &&
              allowDeleteRows.checked
            ),

          allowSort:
            !!(
              allowSort &&
              allowSort.checked
            ),

          allowAutoFilter:
            !!(
              allowAutoFilter &&
              allowAutoFilter.checked
            )

        }

      })
    );

  }


  // =========================================
  // INITIAL UI
  // =========================================

  updateModeUI();

});