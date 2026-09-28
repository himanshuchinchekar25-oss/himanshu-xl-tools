


Office.onReady(function () {

  const exportButton =
    document.getElementById(
      "exportPptBtn"
    );

  const fileNameInput =
    document.getElementById(
      "pptFileName"
    );

  const status =
    document.getElementById(
      "status"
    );


  if (!exportButton) {
    return;
  }


  exportButton.onclick =
    function () {

      let fileName =
        fileNameInput &&
        fileNameInput.value
          ? fileNameInput.value.trim()
          : "";


      if (!fileName) {

        fileName =
          "HimanshuXLTools_Dashboard";

      }


      fileName =
        fileName.replace(
          /\.pptx$/i,
          ""
        );


      exportButton.disabled =
        true;


      status.textContent =
        "Preparing PowerPoint...";


      try {

        Office.context.ui.messageParent(
          JSON.stringify({
            type:
              "HXL_EXPORT_PPT",

            fileName:
              fileName
          })
        );

      }
      catch (error) {

        console.error(
          "Unable to request PowerPoint export:",
          error
        );


        status.textContent =
          "Export Error: " +
          (
            error.message ||
            String(error)
          );


        exportButton.disabled =
          false;

      }

    };


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,

    async function (arg) {

      try {

        const payload =
          JSON.parse(
            arg.message
          );


        if (
          payload.type ===
          "HXL_EXPORT_PPT_DATA"
        ) {

          status.textContent =
            "Creating PowerPoint...";


          if (!payload.base64) {

            throw new Error(
              "Dashboard image data is empty."
            );

          }


          if (
  !window.PptxGenJS
) {

  throw new Error(
    "PptxGenJS browser library is not loaded."
  );

}


const pptx =
  new window.PptxGenJS();


          pptx.layout =
            "LAYOUT_WIDE";


          pptx.author =
            "Himanshu XL Tools";


          pptx.company =
            "Himanshu XL Tools";


          pptx.subject =
            "Power Dashboard";


          pptx.title =
            "Himanshu XL Tools Dashboard";


          pptx.lang =
            "en-US";


          const slide =
            pptx.addSlide();


          slide.background = {
            color:
              "F4F8FC"
          };


          slide.addImage({
            data:
              "data:image/png;base64," +
              payload.base64,

            x:
              0.25,

            y:
              0.25,

            w:
              12.83,

            h:
              7.0
          });


          const requestedFileName =
            payload.fileName ||
            (
              fileNameInput &&
              fileNameInput.value
                ? fileNameInput.value.trim()
                : ""
            ) ||
            "HimanshuXLTools_Dashboard";


          const finalFileName =
            requestedFileName.replace(
              /\.pptx$/i,
              ""
            ) +
            ".pptx";


          await pptx.writeFile({
            fileName:
              finalFileName
          });


          status.textContent =
            "PowerPoint exported successfully.";


          exportButton.disabled =
            false;


          return;

        }


        if (
          payload.type ===
          "HXL_EXPORT_PPT_ERROR"
        ) {

          status.textContent =
            "Export Error: " +
            (
              payload.message ||
              "Unable to export PowerPoint."
            );


          exportButton.disabled =
            false;


          return;

        }

      }
      catch (error) {

        console.error(
          "Export PPT dialog error:",
          error
        );


        status.textContent =
          "Export Error: " +
          (
            error.message ||
            String(error)
          );


        exportButton.disabled =
          false;

      }

    }
  );

});