import * as XLSX from "xlsx";


Office.onReady(function () {

    const status =
        document.getElementById(
            "status"
        );

    const splitButton =
        document.getElementById(
            "splitWorkbookBtn"
        );

    const selectAllButton =
        document.getElementById(
            "selectAllBtn"
        );


    /* -----------------------------------------
       RECEIVE MESSAGES FROM PARENT
    ----------------------------------------- */

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
                    "HXL_SPLIT_SHEETS"
                ) {

                    renderSheetList(
                        payload.sheets || []
                    );

                    return;
                }


                if (
                    payload.type ===
                    "HXL_SPLIT_EXPORT_DATA"
                ) {

                    downloadSplitFiles(
                        payload.sheets || []
                    );

                    return;
                }


                if (
                    payload.type ===
                    "HXL_SPLIT_ERROR"
                ) {

                    status.textContent =
                        "Error: " +
                        payload.message;

                }

            } catch (error) {

                status.textContent =
                    "Message Error: " +
                    error.message;

            }

        }
    );


    /* -----------------------------------------
       ASK PARENT FOR WORKSHEET LIST
    ----------------------------------------- */

    Office.context.ui.messageParent(
        JSON.stringify({
            type:
                "HXL_SPLIT_READY"
        })
    );


    if (selectAllButton) {

        selectAllButton.onclick =
            function () {

                const checkboxes =
                    document.querySelectorAll(
                        ".sheet-checkbox"
                    );


                const shouldSelect =
                    Array.from(
                        checkboxes
                    ).some(
                        function (checkbox) {
                            return !checkbox.checked;
                        }
                    );


                checkboxes.forEach(
                    function (checkbox) {

                        checkbox.checked =
                            shouldSelect;

                    }
                );


                updateSplitButton();

            };

    }


    if (splitButton) {

        splitButton.onclick =
            function () {

                const selected =
                    Array.from(
                        document.querySelectorAll(
                            ".sheet-checkbox:checked"
                        )
                    ).map(
                        function (checkbox) {
                            return checkbox.value;
                        }
                    );


                if (
                    selected.length === 0
                ) {

                    status.textContent =
                        "Please select at least one worksheet.";

                    return;
                }


                status.textContent =
                    "Preparing " +
                    selected.length +
                    " worksheet(s)...";


                splitButton.disabled =
                    true;


                Office.context.ui.messageParent(
                    JSON.stringify({
                        type:
                            "HXL_SPLIT_EXPORT",

                        sheets:
                            selected
                    })
                );

            };

    }

});


function renderSheetList(
    sheets
) {

    const list =
        document.getElementById(
            "sheetList"
        );

    const status =
        document.getElementById(
            "status"
        );


    list.innerHTML = "";


    if (
        sheets.length === 0
    ) {

        list.textContent =
            "No worksheets found.";

        status.textContent =
            "Workbook contains no worksheets.";

        return;
    }


    sheets.forEach(
        function (sheetName) {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "option";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";

            checkbox.className =
                "sheet-checkbox";

            checkbox.value =
                sheetName;

            checkbox.checked =
                true;


            checkbox.addEventListener(
                "change",
                updateSplitButton
            );


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                sheetName;


            label.appendChild(
                checkbox
            );

            label.appendChild(
                text
            );


            list.appendChild(
                label
            );

        }
    );


    status.textContent =
        sheets.length +
        " worksheet(s) found. Select sheets and click Split Workbook.";


    updateSplitButton();

}


function updateSplitButton() {

    const button =
        document.getElementById(
            "splitWorkbookBtn"
        );


    const count =
        document.querySelectorAll(
            ".sheet-checkbox:checked"
        ).length;


    if (button) {

        button.disabled =
            count === 0;

    }

}


function downloadSplitFiles(
    sheets
) {

    const status =
        document.getElementById(
            "status"
        );

    const button =
        document.getElementById(
            "splitWorkbookBtn"
        );


    try {

        if (
            !sheets ||
            sheets.length === 0
        ) {

            throw new Error(
                "No worksheet data received."
            );

        }


        let exportedCount = 0;


        sheets.forEach(
            function (sheetInfo) {

                const workbook =
                    XLSX.utils.book_new();


                const worksheet =
                    XLSX.utils.aoa_to_sheet(
                        sheetInfo.values || []
                    );


                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    sanitizeSheetName(
                        sheetInfo.name
                    )
                );


                const fileName =
                    sanitizeFileName(
                        sheetInfo.name
                    ) +
                    ".xlsx";


                XLSX.writeFile(
                    workbook,
                    fileName
                );


                exportedCount++;

            }
        );


        status.innerHTML =
            "Split completed successfully.<br>" +
            "Files exported: " +
            exportedCount;


        if (button) {
            button.disabled = false;
        }


    } catch (error) {

        console.error(
            "Split Download Error:",
            error
        );


        status.textContent =
            "Export Error: " +
            (
                error.message ||
                String(error)
            );


        if (button) {
            button.disabled = false;
        }

    }

}


function sanitizeFileName(
    name
) {

    return String(
        name || "Sheet"
    )
    .replace(
        /[<>:"/\\|?*]/g,
        "_"
    )
    .trim();

}


function sanitizeSheetName(
    name
) {

    return String(
        name || "Sheet"
    )
    .replace(
        /[:\\/?*\[\]]/g,
        "_"
    )
    .substring(
        0,
        31
    );

}