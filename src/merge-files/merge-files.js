import * as XLSX from "xlsx";

Office.onReady(function (info) {

  if (
    info.host !==
    Office.HostType.Excel
  ) {
    return;
  }

  const input =
    document.getElementById(
      "mergeFilesInput"
    );

  const validateButton =
    document.getElementById(
      "validateMergeFilesBtn"
    );

  const mergeButton =
    document.getElementById(
      "runMergeFilesBtn"
    );

  const status =
    document.getElementById(
      "mergeFilesStatus"
    );

  const selectedFilesInfo =
    document.getElementById(
      "selectedFilesInfo"
    );


  if (input) {

    input.addEventListener(
      "change",
      function () {

        const count =
          input.files
            ? input.files.length
            : 0;

        if (selectedFilesInfo) {

          selectedFilesInfo.textContent =
            count === 0
              ? "No files selected."
              : count +
                " file(s) selected.";

        }

        if (status) {

          status.textContent =
            count < 2
              ? "Please select at least 2 Excel files."
              : "Files selected. Click Validate Files.";

        }

      }
    );

  }


  if (validateButton) {

    validateButton.onclick =
      validateMergeFiles;

  }


  if (mergeButton) {

    mergeButton.onclick =
      mergeSelectedFiles;

  }

});


async function readSelectedFiles() {

  const input =
    document.getElementById(
      "mergeFilesInput"
    );

  if (
    !input ||
    !input.files ||
    input.files.length < 2
  ) {

    throw new Error(
      "Please select at least 2 Excel files."
    );

  }


  const fileData = [];


  for (
    let fileIndex = 0;
    fileIndex < input.files.length;
    fileIndex++
  ) {

    const file =
      input.files[fileIndex];

    const buffer =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(
        buffer,
        {
          type: "array",
          cellDates: true
        }
      );


    if (
      !workbook.SheetNames ||
      workbook.SheetNames.length === 0
    ) {

      continue;

    }


    const sheetName =
      workbook.SheetNames[0];

    const sheet =
      workbook.Sheets[
        sheetName
      ];


    if (!sheet) {
      continue;
    }


    const rows =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          header: 1,
          defval: "",
          raw: false
        }
      );


    if (
      !rows ||
      rows.length < 2
    ) {

      continue;

    }


    const headers =
      rows[0].map(
        function (value) {

          return String(
            value === null ||
            value === undefined
              ? ""
              : value
          ).trim();

        }
      );


    const hasHeader =
      headers.some(
        function (header) {
          return header !== "";
        }
      );


    if (!hasHeader) {
      continue;
    }


    fileData.push({
      fileName: file.name,
      sheetName: sheetName,
      headers: headers,
      rows: rows.slice(1)
    });

  }


  if (
    fileData.length < 2
  ) {

    throw new Error(
      "At least 2 usable Excel files are required."
    );

  }


  return fileData;

}


async function validateMergeFiles() {

  const status =
    document.getElementById(
      "mergeFilesStatus"
    );

  try {

    if (status) {

      status.textContent =
        "Validating selected files...";

    }


    const fileData =
      await readSelectedFiles();


    const allHeaders = [];


    for (
      const item of fileData
    ) {

      for (
        const header of item.headers
      ) {

        const cleanHeader =
          String(
            header || ""
          ).trim();


        if (!cleanHeader) {
          continue;
        }


        const alreadyExists =
          allHeaders.some(
            function (existing) {

              return (
                existing.toLowerCase() ===
                cleanHeader.toLowerCase()
              );

            }
          );


        if (!alreadyExists) {

          allHeaders.push(
            cleanHeader
          );

        }

      }

    }


    const commonHeaders =
      allHeaders.filter(
        function (header) {

          return fileData.every(
            function (item) {

              return item.headers.some(
                function (fileHeader) {

                  return (
                    String(
                      fileHeader || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    header
                      .trim()
                      .toLowerCase()
                  );

                }
              );

            }
          );

        }
      );


    if (status) {

      status.innerHTML =
        "Files validated successfully.<br>" +
        "Files: " +
        fileData.length +
        "<br>" +
        "All columns: " +
        allHeaders.length +
        "<br>" +
        "Common columns: " +
        commonHeaders.length;

    }

  } catch (error) {

    console.error(
      "Merge Validation Error:",
      error
    );


    if (status) {

      status.textContent =
        "Validation Error: " +
        (
          error.message ||
          String(error)
        );

    }

  }

}


async function mergeSelectedFiles() {

  const status =
    document.getElementById(
      "mergeFilesStatus"
    );

  const outputSheetInput =
    document.getElementById(
      "mergeOutputSheet"
    );

  const mergeMode =
    document.getElementById(
      "mergeModeSelect"
    )?.value || "headers";


  try {

    if (status) {
      status.textContent =
        "Reading and analyzing files...";
    }


    const fileData =
      await readSelectedFiles();


    /* =============================================
       BUILD ALL UNIQUE HEADERS
    ============================================= */

    const allHeaders = [];


    for (const item of fileData) {

      for (const header of item.headers) {

        const cleanHeader =
          String(header || "").trim();

        if (!cleanHeader) {
          continue;
        }


        const exists =
          allHeaders.some(
            function (existing) {

              return (
                existing.toLowerCase() ===
                cleanHeader.toLowerCase()
              );

            }
          );


        if (!exists) {
          allHeaders.push(cleanHeader);
        }

      }

    }


    /* =============================================
       DETERMINE FINAL HEADERS
    ============================================= */

    let finalHeaders = [];


    if (mergeMode === "common") {

      finalHeaders =
        allHeaders.filter(
          function (header) {

            return fileData.every(
              function (item) {

                return item.headers.some(
                  function (fileHeader) {

                    return (
                      String(fileHeader || "")
                        .trim()
                        .toLowerCase() ===
                      header
                        .trim()
                        .toLowerCase()
                    );

                  }
                );

              }
            );

          }
        );


      if (finalHeaders.length === 0) {

        throw new Error(
          "No common columns found across selected files."
        );

      }

    } else {

      finalHeaders = allHeaders;

    }


    /* =============================================
       AUTO-MAP ROWS BY HEADER
    ============================================= */

    const mergedRows = [
      finalHeaders
    ];


    for (const item of fileData) {

      const headerMap = {};


      for (
        let i = 0;
        i < item.headers.length;
        i++
      ) {

        const key =
          String(item.headers[i] || "")
            .trim()
            .toLowerCase();

        if (key) {
          headerMap[key] = i;
        }

      }


      for (const sourceRow of item.rows) {

        const hasData =
          sourceRow.some(
            function (value) {

              return (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
              );

            }
          );


        if (!hasData) {
          continue;
        }


        const mappedRow =
          finalHeaders.map(
            function (header) {

              const key =
                header
                  .trim()
                  .toLowerCase();

              const sourceIndex =
                headerMap[key];


              if (sourceIndex === undefined) {
                return "";
              }


              return (
                sourceRow[sourceIndex] ?? ""
              );

            }
          );


        mergedRows.push(mappedRow);

      }

    }


    if (mergedRows.length <= 1) {

      throw new Error(
        "No usable data rows were found."
      );

    }


    const outputSheetName =
      (
        outputSheetInput?.value ||
        "Merged_Data"
      ).trim();


    if (!outputSheetName) {

      throw new Error(
        "Please enter an output sheet name."
      );

    }


    /* =============================================
       SEND DATA TO EXCEL PARENT
       Do NOT use Excel.run inside dialog
    ============================================= */

    if (status) {

      status.textContent =
        "Sending merged data to Excel...";

    }


    const payload = {

      type: "HXL_MERGE_FILES",

      outputSheetName:
        outputSheetName,

      rows:
        mergedRows,

      fileCount:
        fileData.length,

      dataRowCount:
        mergedRows.length - 1,

      columnCount:
        finalHeaders.length

    };


    Office.context.ui.messageParent(
      JSON.stringify(payload)
    );


    if (status) {

      status.innerHTML =
        "Files processed successfully.<br>" +
        "Files: " +
        fileData.length +
        "<br>" +
        "Rows: " +
        (mergedRows.length - 1) +
        "<br>" +
        "Columns: " +
        finalHeaders.length +
        "<br><br>" +
        "Writing data to Excel...";

    }


  } catch (error) {

    console.error(
      "Merge Files Error:",
      error
    );


    if (status) {

      status.textContent =
        "Merge Error: " +
        (
          error.message ||
          String(error)
        );

    }

  }

}
