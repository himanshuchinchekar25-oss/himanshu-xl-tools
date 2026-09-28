Office.onReady(function () {

  const selectedRangeBox =
    document.getElementById("selectedRangeBox");

  const promptInput =
    document.getElementById("promptInput");

  const formulaOutput =
    document.getElementById("formulaOutput");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const generateBtn =
    document.getElementById("generateBtn");

  const insertBtn =
    document.getElementById("insertBtn");

  const status =
    document.getElementById("status");

  const resultBox =
    document.getElementById("resultBox");


  if (
    !selectedRangeBox ||
    !promptInput ||
    !formulaOutput ||
    !refreshBtn ||
    !generateBtn ||
    !insertBtn ||
    !status ||
    !resultBox
  ) {
    return;
  }


  let selectionInfo = null;
  let generatedFormula = "";


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    function (arg) {

      try {

        const payload =
          JSON.parse(arg.message);


        if (
          payload.type ===
          "HXL_AI_FORMULA_INFO"
        ) {

          selectionInfo =
            payload.selection || null;


          selectedRangeBox.textContent =
            payload.selectionAddress ||
            "No selection found";


          status.textContent =
            "Ready.";


          validateForm();

          return;
        }


        if (
          payload.type ===
          "HXL_AI_FORMULA_RESULT"
        ) {

          generateBtn.disabled =
            false;


          if (payload.success) {

            generatedFormula =
              payload.formula || "";


            formulaOutput.value =
              generatedFormula;


            insertBtn.disabled =
              !generatedFormula;


            resultBox.style.display =
              "block";


            resultBox.textContent =
              payload.explanation ||
              "Formula generated successfully.";


            status.textContent =
              "Formula generated successfully.";

          } else {

            generatedFormula =
              "";


            formulaOutput.value =
              "";


            insertBtn.disabled =
              true;


            resultBox.style.display =
              "none";


            resultBox.textContent =
              "";


            status.textContent =
              "Error: " +
              (
                payload.message ||
                "Unable to generate formula."
              );

          }


          return;
        }


        if (
          payload.type ===
          "HXL_AI_FORMULA_INSERT_RESULT"
        ) {

          insertBtn.disabled =
            false;


          if (payload.success) {

            status.textContent =
              payload.message ||
              "Formula inserted successfully.";

          } else {

            status.textContent =
              "Error: " +
              (
                payload.message ||
                "Unable to insert formula."
              );

          }


          return;
        }

      } catch (error) {

        console.error(
          "AI Formula message error:",
          error
        );


        status.textContent =
          "Unable to process AI Formula response.";

      }

    }
  );


  refreshBtn.addEventListener(
    "click",
    function () {

      requestSelection();

    }
  );


  generateBtn.addEventListener(
    "click",
    function () {

      generateFormula();

    }
  );


  insertBtn.addEventListener(
    "click",
    function () {

      insertFormula();

    }
  );


  promptInput.addEventListener(
    "input",
    function () {

      validateForm();

    }
  );


  function validateForm() {

    const prompt =
      promptInput.value.trim();


    generateBtn.disabled =
      !prompt ||
      !selectionInfo;


    return (
      !!prompt &&
      !!selectionInfo
    );

  }


  function requestSelection() {

    selectionInfo = null;


    selectedRangeBox.textContent =
      "Reading selection...";


    generateBtn.disabled =
      true;


    status.textContent =
      "Reading workbook selection...";


    Office.context.ui.messageParent(
      JSON.stringify({
        type:
          "HXL_GET_AI_FORMULA_INFO"
      })
    );

  }


  function generateFormula() {

    if (
      !validateForm()
    ) {
      return;
    }


    generatedFormula =
      "";


    formulaOutput.value =
      "";


    insertBtn.disabled =
      true;


    resultBox.style.display =
      "none";


    resultBox.textContent =
      "";


    generateBtn.disabled =
      true;


    status.textContent =
      "Generating formula...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_GENERATE_AI_FORMULA",

        prompt:
          promptInput.value.trim(),

        selection:
          selectionInfo

      })
    );

  }


  function insertFormula() {

    if (
      !generatedFormula ||
      !selectionInfo
    ) {

      status.textContent =
        "Generate a formula first.";

      return;

    }


    insertBtn.disabled =
      true;


    status.textContent =
      "Inserting formula...";


    Office.context.ui.messageParent(
      JSON.stringify({

        type:
          "HXL_INSERT_AI_FORMULA",

        formula:
          generatedFormula,

        selection:
          selectionInfo

      })
    );

  }


  requestSelection();

});