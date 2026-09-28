Office.onReady(function () {

  const exportButton =
    document.getElementById("exportPdfBtn");

  const status =
    document.getElementById("status");

  const fileNameInput =
    document.getElementById("pdfFileName");


  if (!exportButton) {
    return;
  }


  exportButton.onclick =
    function () {

      let fileName =
        fileNameInput &&
        fileNameInput.value
          ? fileNameInput.value.trim()
          : "HimanshuXLTools_Export";


      fileName =
        sanitizeFileName(fileName);


      if (!fileName) {
        fileName =
          "HimanshuXLTools_Export";
      }


      exportButton.disabled = true;

      status.textContent =
        "Preparing PDF...";


      Office.context.ui.messageParent(
        JSON.stringify({
          type: "HXL_EXPORT_PDF",
          fileName: fileName
        })
      );

    };


  Office.context.ui.addHandlerAsync(
    Office.EventType.DialogParentMessageReceived,
    function (arg) {

      try {

        const payload =
          JSON.parse(arg.message);


        if (
          payload.type ===
          "HXL_EXPORT_PDF_DATA"
        ) {

          status.textContent =
            "Downloading PDF...";


          const bytes =
            base64ToUint8Array(
              payload.base64
            );


          const blob =
            new Blob(
              [bytes],
              {
                type: "application/pdf"
              }
            );


          const url =
            URL.createObjectURL(blob);


          const link =
            document.createElement("a");


          link.href = url;

          link.download =
            sanitizeFileName(
              payload.fileName ||
              "HimanshuXLTools_Export"
            ) +
            ".pdf";


          document.body.appendChild(link);

          link.click();

          link.remove();


          setTimeout(
            function () {
              URL.revokeObjectURL(url);
            },
            1000
          );


          status.textContent =
            "✅ PDF exported successfully.";


          exportButton.disabled = false;

          return;

        }


        if (
          payload.type ===
          "HXL_EXPORT_PDF_ERROR"
        ) {

          status.textContent =
            "❌ Export Error: " +
            payload.message;

          exportButton.disabled = false;

        }

      } catch (error) {

        status.textContent =
          "❌ Export Error: " +
          (
            error.message ||
            String(error)
          );

        exportButton.disabled = false;

      }

    }
  );

});


function base64ToUint8Array(
  base64
) {

  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );


  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }


  return bytes;

}


function sanitizeFileName(
  value
) {

  return String(
    value || ""
  )
    .replace(
      /[<>:"/\\|?*]/g,
      "_"
    )
    .trim();

}