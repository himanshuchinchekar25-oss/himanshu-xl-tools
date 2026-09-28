Office.onReady(function () {

  const sheetList =
    document.getElementById("sheetList");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const applyBtn =
    document.getElementById("applyBtn");

  const status =
    document.getElementById("status");


  if (
    !sheetList ||
    !refreshBtn ||
    !applyBtn ||
    !status
  ) {
    return;
  }


  refreshBtn.onclick =
    function () {

      requestSheets();

    };


  applyBtn.onclick =
    function () {

      applyChanges();

    };


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
          "HXL_SHEETS_DATA"
        ) {

          renderSheets(
            payload.sheets || []
          );

          return;

        }


        if (
          payload.type ===
          "HXL_SHEETS_APPLIED"
        ) {

          status.textContent =
            "✅ Sheet visibility updated successfully.";

          requestSheets();

          return;

        }


        if (
          payload.type ===
          "HXL_SHEETS_ERROR"
        ) {

          status.textContent =
            "❌ Error: " +
            (
              payload.message ||
              "Unknown error."
            );

          applyBtn.disabled =
            true;

        }

      } catch (error) {

        status.textContent =
          "❌ Dialog Error: " +
          (
            error.message ||
            String(error)
          );

      }

    },
    function () {

      requestSheets();

    }
  );


  function requestSheets() {

    sheetList.innerHTML =
      "Reading workbook sheets...";

    status.textContent =
      "Reading workbook...";

    applyBtn.disabled =
      true;


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_SHEETS"
      })
    );

  }


  function renderSheets(
    sheets
  ) {

    sheetList.innerHTML =
      "";


    if (
      !Array.isArray(sheets) ||
      sheets.length === 0
    ) {

      sheetList.textContent =
        "No worksheets found.";

      status.textContent =
        "No worksheets found.";

      applyBtn.disabled =
        true;

      return;

    }


    sheets.forEach(
      function (sheet) {

        const row =
          document.createElement(
            "div"
          );


        row.className =
          "sheet-row";


        const name =
          document.createElement(
            "div"
          );


        name.className =
          "sheet-name";

        name.textContent =
          sheet.name;


        const control =
          document.createElement(
            "div"
          );


        control.className =
          "sheet-control";


        const select =
          document.createElement(
            "select"
          );


        select.className =
          "sheet-visibility";

        select.dataset.sheetName =
          sheet.name;


        const visibleOption =
          document.createElement(
            "option"
          );

        visibleOption.value =
          "Visible";

        visibleOption.textContent =
          "Visible";


        const hiddenOption =
          document.createElement(
            "option"
          );

        hiddenOption.value =
          "Hidden";

        hiddenOption.textContent =
          "Hidden";


        select.appendChild(
          visibleOption
        );

        select.appendChild(
          hiddenOption
        );


        select.value =
          sheet.visibility ===
          "Hidden"
            ? "Hidden"
            : "Visible";


        select.dataset.originalValue =
          select.value;


        select.onchange =
          updateApplyButton;


        control.appendChild(
          select
        );


        row.appendChild(
          name
        );

        row.appendChild(
          control
        );


        sheetList.appendChild(
          row
        );

      }
    );


    status.textContent =
      sheets.length +
      " worksheet(s) loaded.";


    updateApplyButton();

  }


  function updateApplyButton() {

    const selects =
      Array.from(
        document.querySelectorAll(
          ".sheet-visibility"
        )
      );


    const changed =
      selects.some(
        function (select) {

          return (
            select.value !==
            select.dataset.originalValue
          );

        }
      );


    applyBtn.disabled =
      !changed;

  }


  function applyChanges() {

    const selects =
      Array.from(
        document.querySelectorAll(
          ".sheet-visibility"
        )
      );


    const visibleCount =
      selects.filter(
        function (select) {

          return (
            select.value ===
            "Visible"
          );

        }
      ).length;


    if (
      visibleCount < 1
    ) {

      status.textContent =
        "❌ At least one worksheet must remain visible.";

      return;

    }


    const changes =
      selects.map(
        function (select) {

          return {
            name:
              select.dataset.sheetName,

            visibility:
              select.value
          };

        }
      );


    status.textContent =
      "Applying changes...";

    applyBtn.disabled =
      true;


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_APPLY_SHEET_VISIBILITY",

        sheets:
          changes
      })
    );

  }

});