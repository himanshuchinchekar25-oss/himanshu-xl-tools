Office.onReady(function () {

  const selectionBox =
    document.getElementById(
      "selectionBox"
    );

  const previewBox =
    document.getElementById(
      "previewBox"
    );

  const analysisBox =
    document.getElementById(
      "analysisBox"
    );

  const refreshBtn =
    document.getElementById(
      "refreshBtn"
    );

  const analyzeBtn =
    document.getElementById(
      "analyzeBtn"
    );

  const status =
    document.getElementById(
      "status"
    );


  if (
    !selectionBox ||
    !previewBox ||
    !analysisBox ||
    !refreshBtn ||
    !analyzeBtn ||
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


        // =====================================
        // RANGE INFO
        // =====================================

        if (
          payload.type ===
          "HXL_AI_ANALYSIS_INFO"
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

            values:
              Array.isArray(
                payload.values
              )
                ? payload.values
                : []
          };


          selectionBox.textContent =
            payload.address || "Unknown";


          previewBox.textContent =
            buildPreview(
              selectionInfo.values
            );


          analysisBox.textContent =
            "No analysis generated yet.";


          const hasData =
            selectionInfo.values.length > 0;


          analyzeBtn.disabled =
            !hasData;


          status.textContent =
            hasData
              ? "Ready to analyze selected data."
              : "Select a non-empty Excel data range.";


          return;
        }


        // =====================================
        // ANALYSIS RESULT
        // =====================================

        if (
          payload.type ===
          "HXL_AI_ANALYSIS_RESULT"
        ) {

          analyzeBtn.disabled =
            false;


          if (payload.success) {

            analysisBox.textContent =
              payload.analysis ||
              "No analysis returned.";


            status.textContent =
              payload.message ||
              "AI analysis completed successfully.";

          } else {

            analysisBox.textContent =
              "Unable to analyze selected data.";


            status.textContent =
              "Error: " +
              (
                payload.message ||
                "AI Analysis failed."
              );

          }


          return;
        }

      } catch (error) {

        console.error(
          "AI Analysis message error:",
          error
        );


        status.textContent =
          "Unable to process workbook response.";


        analyzeBtn.disabled =
          false;

      }

    }
  );


  refreshBtn.addEventListener(
    "click",

    function () {

      requestAnalysisInfo();

    }
  );


  analyzeBtn.addEventListener(
    "click",

    function () {

      runAnalysis();

    }
  );


  function requestAnalysisInfo() {

    selectionInfo =
      null;


    analyzeBtn.disabled =
      true;


    selectionBox.textContent =
      "Reading selection...";


    previewBox.textContent =
      "-";


    analysisBox.textContent =
      "No analysis generated yet.";


    status.textContent =
      "Reading workbook selection...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_GET_AI_ANALYSIS_INFO"

      })
    );

  }


  function runAnalysis() {

    if (
      !selectionInfo ||
      !Array.isArray(
        selectionInfo.values
      ) ||
      selectionInfo.values.length === 0
    ) {

      status.textContent =
        "Select a non-empty Excel data range.";

      return;
    }


    analyzeBtn.disabled =
      true;


    analysisBox.textContent =
      "Analyzing selected data...";


    status.textContent =
      "Generating AI analysis...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_RUN_AI_ANALYSIS",

        selection:
          selectionInfo

      })
    );

  }


  function buildPreview(values) {

    if (
      !Array.isArray(values) ||
      values.length === 0
    ) {
      return "-";
    }


    const maxRows =
      Math.min(
        values.length,
        12
      );


    const rows = [];


    for (
      let r = 0;
      r < maxRows;
      r++
    ) {

      const row =
        Array.isArray(values[r])
          ? values[r]
          : [];


      rows.push(
        row
          .map(function (value) {

            if (
              value === null ||
              typeof value === "undefined"
            ) {
              return "";
            }


            return String(value);

          })
          .join(" | ")
      );

    }


    if (
      values.length > maxRows
    ) {

      rows.push(
        "... " +
        (
          values.length -
          maxRows
        ) +
        " more row(s)"
      );

    }


    return rows.join("\n");

  }


  requestAnalysisInfo();

});