Office.onReady(function () {

  const sheetList =
    document.getElementById("sheetList");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const renameBtn =
    document.getElementById("renameBtn");

  const status =
    document.getElementById("status");


  if (
    !sheetList ||
    !refreshBtn ||
    !renameBtn ||
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
          JSON.parse(arg.message);


        if (
          payload.type ===
          "HXL_RENAME_SHEETS_DATA"
        ) {

          renderSheets(
            payload.sheets || []
          );

          return;
        }


        if (
          payload.type ===
          "HXL_RENAME_SHEETS_RESULT"
        ) {

          if (payload.success) {

            status.textContent =
              "✅ " +
              (
                payload.message ||
                "Sheets renamed successfully."
              );

            requestSheets();

          } else {

            status.textContent =
              "❌ " +
              (
                payload.message ||
                "Unable to rename sheets."
              );

            renameBtn.disabled =
              false;

          }

          return;
        }


      } catch (error) {

        console.error(
          "Rename Sheets message error:",
          error
        );

        status.textContent =
          "❌ Message Error: " +
          (
            error && error.message
              ? error.message
              : String(error)
          );

        renameBtn.disabled =
          false;

      }

    },

    function (asyncResult) {

      if (
        asyncResult.status ===
        Office.AsyncResultStatus.Failed
      ) {

        console.error(
          "Rename Sheets handler error:",
          asyncResult.error
        );

        status.textContent =
          "❌ Unable to initialize Rename Sheets.";

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


  renameBtn.addEventListener(
    "click",
    function () {

      renameSheets();

    }
  );


  // =========================================
  // REQUEST SHEETS
  // =========================================

  function requestSheets() {

    status.textContent =
      "Reading workbook sheets...";

    renameBtn.disabled =
      true;


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_RENAME_SHEETS"
      })
    );

  }


  // =========================================
  // RENDER SHEETS
  // =========================================

  function renderSheets(sheets) {

    sheetList.innerHTML = "";


    if (
      !Array.isArray(sheets) ||
      sheets.length === 0
    ) {

      sheetList.textContent =
        "No worksheets found.";

      status.textContent =
        "No worksheets found.";

      renameBtn.disabled =
        true;

      return;
    }


    sheets.forEach(
      function (sheet) {

        const row =
          document.createElement("div");

        row.className =
          "sheet-row";


        const oldName =
          document.createElement("div");

        oldName.className =
          "old-name";

        oldName.textContent =
          sheet.name;


        const arrow =
          document.createElement("div");

        arrow.className =
          "arrow";

        arrow.textContent =
          "→";


        const input =
          document.createElement("input");

        input.type =
          "text";

        input.className =
          "new-name-input";

        input.value =
          sheet.name;

        input.maxLength =
          31;

        input.dataset.oldName =
          sheet.name;

        input.setAttribute(
          "aria-label",
          "New name for " + sheet.name
        );


        input.addEventListener(
          "input",
          function () {

            validateForm(false);

          }
        );


        row.appendChild(
          oldName
        );

        row.appendChild(
          arrow
        );

        row.appendChild(
          input
        );

        sheetList.appendChild(
          row
        );

      }
    );


    status.textContent =
      sheets.length +
      " worksheet(s) loaded.";

    validateForm(false);

  }


  // =========================================
  // GET RENAME PLAN
  // =========================================

  function getRenamePlan() {

    const inputs =
      Array.from(
        document.querySelectorAll(
          ".new-name-input"
        )
      );


    return inputs.map(
      function (input) {

        return {
          oldName:
            input.dataset.oldName || "",

          newName:
            input.value.trim()
        };

      }
    );

  }


  // =========================================
  // VALIDATE
  // =========================================

  function validateForm(showMessage) {

    const plan =
      getRenamePlan();


    if (
      plan.length === 0
    ) {

      renameBtn.disabled =
        true;

      return false;
    }


    const invalidCharacters =
      /[:\\\/\?\*\[\]]/;


    for (
      let i = 0;
      i < plan.length;
      i++
    ) {

      const newName =
        plan[i].newName;


      if (!newName) {

        renameBtn.disabled =
          true;

        if (showMessage) {
          status.textContent =
            "❌ Sheet name cannot be blank.";
        }

        return false;
      }


      if (
        newName.length > 31
      ) {

        renameBtn.disabled =
          true;

        if (showMessage) {
          status.textContent =
            "❌ Sheet names cannot exceed 31 characters.";
        }

        return false;
      }


      if (
        invalidCharacters.test(
          newName
        )
      ) {

        renameBtn.disabled =
          true;

        if (showMessage) {
          status.textContent =
            "❌ Sheet names cannot contain : \\ / ? * [ ]";
        }

        return false;
      }


      if (
        newName.charAt(0) === "'" ||
        newName.charAt(
          newName.length - 1
        ) === "'"
      ) {

        renameBtn.disabled =
          true;

        if (showMessage) {
          status.textContent =
            "❌ Sheet names cannot begin or end with an apostrophe.";
        }

        return false;
      }

    }


    const normalizedNames =
      plan.map(
        function (item) {

          return item.newName.toLowerCase();

        }
      );


    const uniqueNames =
      new Set(normalizedNames);


    if (
      uniqueNames.size !==
      normalizedNames.length
    ) {

      renameBtn.disabled =
        true;

      if (showMessage) {
        status.textContent =
          "❌ Every worksheet must have a unique name.";
      }

      return false;
    }


    const changed =
      plan.some(
        function (item) {

          return (
            item.oldName !==
            item.newName
          );

        }
      );


    renameBtn.disabled =
      !changed;


    if (
      showMessage &&
      !changed
    ) {

      status.textContent =
        "No sheet names have been changed.";

    }


    return changed;

  }


  // =========================================
  // SEND RENAME REQUEST
  // =========================================

  function renameSheets() {

    if (
      !validateForm(true)
    ) {
      return;
    }


    const plan =
      getRenamePlan();


    const changes =
      plan.filter(
        function (item) {

          return (
            item.oldName !==
            item.newName
          );

        }
      );


    if (
      changes.length === 0
    ) {

      status.textContent =
        "No sheet names have been changed.";

      return;
    }


    renameBtn.disabled =
      true;


    status.textContent =
      "Renaming " +
      changes.length +
      " worksheet(s)...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_APPLY_RENAME_SHEETS",

        changes:
          changes

      })
    );

  }

});