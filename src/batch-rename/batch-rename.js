document.addEventListener(
  "DOMContentLoaded",
  function () {

  const fileInput =
    document.getElementById("fileInput");

  const prefixInput =
    document.getElementById("prefixInput");

  const startNumberInput =
    document.getElementById("startNumberInput");

  const paddingInput =
    document.getElementById("paddingInput");

  const keepOriginalInput =
    document.getElementById("keepOriginalInput");

  const previewList =
    document.getElementById("previewList");

  const previewBtn =
    document.getElementById("previewBtn");

  const renameBtn =
    document.getElementById("renameBtn");

  const status =
    document.getElementById("status");


  if (
    !fileInput ||
    !previewBtn ||
    !renameBtn
  ) {
    return;
  }


  fileInput.addEventListener(
    "change",
    function () {

      const count =
        fileInput.files
          ? fileInput.files.length
          : 0;

      if (count === 0) {

        status.textContent =
          "Select files to begin.";

        renameBtn.disabled =
          true;

        return;
      }

      status.textContent =
        count +
        " file(s) selected. Click Preview Names.";

      buildPreview();

    }
  );


  previewBtn.onclick =
    function () {

      buildPreview();

    };


  renameBtn.onclick =
    async function () {

      const files =
        Array.from(
          fileInput.files || []
        );

      if (
        files.length === 0
      ) {

        status.textContent =
          "Please select files first.";

        return;
      }


      const renamePlan =
        createRenamePlan(files);


      if (
        renamePlan.length === 0
      ) {

        status.textContent =
          "No files available to rename.";

        return;
      }


      renameBtn.disabled =
        true;

      status.textContent =
        "Preparing renamed files...";


      try {

        let completed = 0;


        for (
          const item of renamePlan
        ) {

          const arrayBuffer =
            await item.file.arrayBuffer();


          const blob =
            new Blob(
              [arrayBuffer],
              {
                type:
                  item.file.type ||
                  "application/octet-stream"
              }
            );


          downloadBlob(
            blob,
            item.newName
          );


          completed++;


          status.textContent =
            "Downloading " +
            completed +
            " of " +
            renamePlan.length +
            "...";


          /*
             Small delay helps browsers process
             multiple download requests.
          */
          await wait(
            250
          );

        }


        status.textContent =
          "✅ Batch Rename complete: " +
          completed +
          " renamed file(s) downloaded.";


      } catch (error) {

        console.error(
          "Batch Rename Error:",
          error
        );


        status.textContent =
          "❌ Batch Rename Error: " +
          (
            error &&
            error.message
              ? error.message
              : String(error)
          );

      } finally {

        renameBtn.disabled =
          false;

      }

    };


  function buildPreview() {

    const files =
      Array.from(
        fileInput.files || []
      );


    previewList.innerHTML =
      "";


    if (
      files.length === 0
    ) {

      previewList.innerHTML =
        '<div class="preview-row">' +
        "Select files to preview renamed filenames." +
        "</div>";

      renameBtn.disabled =
        true;

      return;

    }


    const renamePlan =
      createRenamePlan(files);


    renamePlan.forEach(
      function (item) {

        const row =
          document.createElement(
            "div"
          );

        row.className =
          "preview-row";


        const oldName =
          document.createElement(
            "div"
          );

        oldName.className =
          "old-name";

        oldName.textContent =
          item.file.name;


        const arrow =
          document.createElement(
            "div"
          );

        arrow.className =
          "arrow";

        arrow.textContent =
          "→";


        const newName =
          document.createElement(
            "div"
          );

        newName.className =
          "new-name";

        newName.textContent =
          item.newName;


        row.appendChild(
          oldName
        );

        row.appendChild(
          arrow
        );

        row.appendChild(
          newName
        );


        previewList.appendChild(
          row
        );

      }
    );


    status.textContent =
      renamePlan.length +
      " filename(s) ready.";


    renameBtn.disabled =
      renamePlan.length === 0;

  }


  function createRenamePlan(
    files
  ) {

    const prefix =
      sanitizeNamePart(
        prefixInput &&
        prefixInput.value
          ? prefixInput.value
          : "File_"
      );


    let startNumber =
      parseInt(
        startNumberInput &&
        startNumberInput.value
          ? startNumberInput.value
          : "1",
        10
      );


    if (
      Number.isNaN(startNumber)
    ) {
      startNumber = 1;
    }


    let padding =
      parseInt(
        paddingInput &&
        paddingInput.value
          ? paddingInput.value
          : "3",
        10
      );


    if (
      Number.isNaN(padding)
    ) {
      padding = 3;
    }


    padding =
      Math.max(
        1,
        Math.min(
          10,
          padding
        )
      );


    const includeOriginal =
      !!(
        keepOriginalInput &&
        keepOriginalInput.checked
      );


    return files.map(
      function (
        file,
        index
      ) {

        const fileParts =
          splitFileName(
            file.name
          );


        const number =
          String(
            startNumber +
            index
          ).padStart(
            padding,
            "0"
          );


        let baseName =
          prefix +
          number;


        if (
          includeOriginal
        ) {

          const originalBase =
            sanitizeNamePart(
              fileParts.base
            );


          if (
            originalBase
          ) {

            baseName +=
              "_" +
              originalBase;

          }

        }


        const newName =
          sanitizeFinalFileName(
            baseName +
            fileParts.extension
          );


        return {
          file:
            file,

          newName:
            newName
        };

      }
    );

  }

});


function splitFileName(
  fileName
) {

  const value =
    String(
      fileName || ""
    );


  const lastDot =
    value.lastIndexOf(".");


  if (
    lastDot <= 0 ||
    lastDot ===
      value.length - 1
  ) {

    return {
      base:
        value,

      extension:
        ""
    };

  }


  return {
    base:
      value.substring(
        0,
        lastDot
      ),

    extension:
      value.substring(
        lastDot
      )
  };

}


function sanitizeNamePart(
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


function sanitizeFinalFileName(
  value
) {

  let result =
    String(
      value || "File"
    )
      .replace(
        /[<>:"/\\|?*]/g,
        "_"
      )
      .trim();


  if (!result) {
    result = "File";
  }


  return result;

}


function downloadBlob(
  blob,
  fileName
) {

  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;

  link.download =
    fileName;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  setTimeout(
    function () {

      URL.revokeObjectURL(
        url
      );

    },
    2000
  );

}


function wait(
  milliseconds
) {

  return new Promise(
    function (resolve) {

      setTimeout(
        resolve,
        milliseconds
      );

    }
  );

}