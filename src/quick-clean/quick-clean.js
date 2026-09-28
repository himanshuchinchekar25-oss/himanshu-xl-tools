Office.onReady(function () {

  const cleanBtn =
    document.getElementById("cleanBtn");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const trimSpaces =
    document.getElementById("trimSpaces");

  const cleanCharacters =
    document.getElementById("cleanCharacters");

  const removeBlankRows =
    document.getElementById("removeBlankRows");

  const removeDuplicates =
    document.getElementById("removeDuplicates");

  const convertNumbers =
    document.getElementById("convertNumbers");

  const status =
    document.getElementById("status");


  if (
    !cleanBtn ||
    !refreshBtn ||
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
          "HXL_QUICK_CLEAN_INFO"
        ) {

          status.textContent =
            "Ready.\n" +
            "Sheet: " +
            (payload.sheetName || "-") +
            "\nSelection: " +
            (payload.selectionAddress || "-") +
            "\nUsed Range: " +
            (payload.usedRangeAddress || "-");

          cleanBtn.disabled =
            false;

          return;
        }


        if (
          payload.type ===
          "HXL_QUICK_CLEAN_RESULT"
        ) {

          if (payload.success) {

            const result =
              payload.result || {};


            status.textContent =
              "SUCCESS: Quick Clean completed.\n" +
              "Cells cleaned: " +
              (result.cellsCleaned || 0) +
              "\nBlank rows removed: " +
              (result.blankRowsRemoved || 0) +
              "\nDuplicate rows removed: " +
              (result.duplicateRowsRemoved || 0) +
              "\nNumbers converted: " +
              (result.numbersConverted || 0);


            cleanBtn.disabled =
              false;

          } else {

            status.textContent =
              "ERROR: " +
              (
                payload.message ||
                "Quick Clean failed."
              );


            cleanBtn.disabled =
              false;

          }


          return;
        }


      } catch (error) {

        console.error(
          "Quick Clean message error:",
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


        cleanBtn.disabled =
          false;

      }

    },

    function (asyncResult) {

      if (
        asyncResult.status ===
        Office.AsyncResultStatus.Failed
      ) {

        console.error(
          "Quick Clean handler error:",
          asyncResult.error
        );


        status.textContent =
          "ERROR: Unable to initialize Quick Clean.";

        cleanBtn.disabled =
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


  cleanBtn.addEventListener(
    "click",
    function () {

      runQuickClean();

    }
  );


  function getRangeMode() {

    const selected =
      document.querySelector(
        'input[name="cleanRange"]:checked'
      );


    return selected
      ? selected.value
      : "selection";

  }


  function requestInfo() {

    cleanBtn.disabled =
      true;


    status.textContent =
      "Reading worksheet information...";


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_QUICK_CLEAN_INFO"
      })
    );

  }


  function hasAnyOptionSelected() {

    return !!(
      (trimSpaces && trimSpaces.checked) ||
      (cleanCharacters && cleanCharacters.checked) ||
      (removeBlankRows && removeBlankRows.checked) ||
      (removeDuplicates && removeDuplicates.checked) ||
      (convertNumbers && convertNumbers.checked)
    );

  }


  function runQuickClean() {

    if (
      !hasAnyOptionSelected()
    ) {

      status.textContent =
        "ERROR: Select at least one cleaning option.";

      return;
    }


    cleanBtn.disabled =
      true;


    status.textContent =
      "Running Quick Clean...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_RUN_QUICK_CLEAN",

        rangeMode:
          getRangeMode(),

        options: {

          trimSpaces:
            !!(
              trimSpaces &&
              trimSpaces.checked
            ),

          cleanCharacters:
            !!(
              cleanCharacters &&
              cleanCharacters.checked
            ),

          removeBlankRows:
            !!(
              removeBlankRows &&
              removeBlankRows.checked
            ),

          removeDuplicates:
            !!(
              removeDuplicates &&
              removeDuplicates.checked
            ),

          convertNumbers:
            !!(
              convertNumbers &&
              convertNumbers.checked
            )

        }

      })
    );

  }

});