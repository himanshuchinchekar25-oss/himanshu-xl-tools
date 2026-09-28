import {
    runWithLicenseAccess
} from "../licensing/license-guard.js";
// ============================================================
// HIMANSHU XL TOOLS â€” APP URL HELPER
// Dev:        https://localhost:3000/
// Production: current hosted HTTPS origin
// ============================================================

function getHxlAppUrl(relativePath) {

    const cleanPath =
        String(relativePath || "")
            .replace(/^\/+/, "");

    return (
        window.location.origin +
        "/" +
        cleanPath
    );

}


Office.onReady(function () {

});


async function reportToolStatus(
    toolName,
    state,
    message
) {

    try {

        await OfficeRuntime.storage.setItem(
            "HXL_TOOL_STATUS",
            JSON.stringify({
                tool: toolName,
                state: state,
                message: message || "",
                time: new Date().toLocaleTimeString()
            })
        );

    } catch (error) {

        console.error(
            "HXL Status Reporter Error:",
            error
        );

    }

}



function openTool(event) {

    Office.context.ui.openTaskPane();

    event.completed();

}



function refreshTool(event){

    openTool(event);

}



function createTable(event) {

    Excel.run(async (context) => {

        const range =
            context.workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount"
        ]);

        await context.sync();

        if (range.rowCount < 2) {

            console.log(
                "Excel Table: Please select data with headers."
            );

            return;
        }

        const table =
            context.workbook.tables.add(
                range,
                true
            );

        table.name =
            "HXL_Table_" +
            Date.now()
                .toString()
                .slice(-6);

        table.getRange()
            .format
            .autofitColumns();

        await context.sync();

        console.log(
            "Excel Table created successfully:",
            range.address
        );

    })
    .catch(function (error) {

        console.error(
            "Excel Table Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}



function removeDuplicates(event) {

    Excel.run(async (context) => {

        const range =
            context.workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount"
        ]);

        await context.sync();

        if (range.rowCount < 2) {
            console.log(
                "Remove Duplicates: Please select at least 2 rows."
            );
            return;
        }

        const columns = [];

        for (let i = 0; i < range.columnCount; i++) {
            columns.push(i);
        }

        range.removeDuplicates(
            columns,
            false
        );

        await context.sync();

        console.log(
            "Duplicates removed successfully:",
            range.address
        );

    })
    .catch(function (error) {

        console.error(
            "Remove Duplicates Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}



function activateFilter(event) {

    Excel.run(async (context) => {

        const worksheet =
            context.workbook.worksheets.getActiveWorksheet();

        const range =
            context.workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount"
        ]);

        await context.sync();

        if (range.rowCount < 2) {

            console.log(
                "Sort & Filter: Please select headers and data."
            );

            return;
        }

        worksheet.autoFilter.apply(range);

        await context.sync();

        console.log(
            "Sort & Filter applied successfully:",
            range.address
        );

    })
    .catch(function (error) {

        console.error(
            "Sort & Filter Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}



function createChart(event) {

    reportToolStatus(
        "Chart",
        "RUNNING",
        "Creating chart from selected data..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const range =
            workbook.getSelectedRange();

        const sheet =
            workbook.worksheets
                .getActiveWorksheet();

        range.load([
            "address",
            "rowCount",
            "columnCount"
        ]);

        await context.sync();

        if (
            range.rowCount < 2 ||
            range.columnCount < 2
        ) {

            const message =
                "Please select headers and at least two columns.";

            await reportToolStatus(
                "Chart",
                "ERROR",
                message
            );

            return;
        }

        const chart =
            sheet.charts.add(
                Excel.ChartType.columnClustered,
                range,
                Excel.ChartSeriesBy.auto
            );

        chart.title.text =
            "Himanshu XL Tools Chart";

        chart.legend.position =
            Excel.ChartLegendPosition.right;

        chart.setPosition(
            "E2",
            "M20"
        );

        await context.sync();

        await reportToolStatus(
            "Chart",
            "SUCCESS",
            "Chart created from " +
            range.address
        );

        console.log(
            "Chart created successfully:",
            range.address
        );

    })
    .catch(function (error) {

        console.error(
            "Chart Error:",
            error
        );

        reportToolStatus(
            "Chart",
            "ERROR",
            error &&
            error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}



function dashboardInfo(event) {

    reportToolStatus(
        "Dashboard",
        "RUNNING",
        "Creating Dashboard from selected data..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const sourceRange =
            workbook.getSelectedRange();

        sourceRange.load([
            "address",
            "rowCount",
            "columnCount",
            "values"
        ]);

        await context.sync();


        /* =========================================
           VALIDATION
        ========================================= */

        if (sourceRange.rowCount < 2) {

            const message =
                "Please select headers and at least one data row.";

            await reportToolStatus(
                "Dashboard",
                "ERROR",
                message
            );

            return;
        }


        /* =========================================
           CREATE / GET DASHBOARD SHEET
        ========================================= */

        let dashboardSheet =
            workbook.worksheets
                .getItemOrNullObject(
                    "Dashboard"
                );

        dashboardSheet.load(
            "isNullObject"
        );

        await context.sync();


        if (dashboardSheet.isNullObject) {

            dashboardSheet =
                workbook.worksheets.add(
                    "Dashboard"
                );

        } else {

            const oldRange =
                dashboardSheet
                    .getUsedRangeOrNullObject();

            oldRange.load(
                "isNullObject"
            );

            await context.sync();

            if (!oldRange.isNullObject) {

                oldRange.unmerge();

                oldRange.clear(
                    Excel.ClearApplyTo.all
                );

            }

        }


        /* =========================================
           DASHBOARD TITLE
        ========================================= */

        const titleRange =
            dashboardSheet.getRange(
                "A1:H1"
            );

        titleRange.merge(false);

        titleRange
            .getCell(0, 0)
            .values = [
                ["Himanshu XL Tools - Dashboard"]
            ];

        titleRange.format.font.bold =
            true;

        titleRange.format.font.size =
            18;

        titleRange.format.font.color =
            "#FFFFFF";

        titleRange.format.fill.color =
            "#217346";

        titleRange.format.horizontalAlignment =
            Excel.HorizontalAlignment.center;

        titleRange.format.verticalAlignment =
            Excel.VerticalAlignment.center;

        titleRange.format.rowHeight =
            30;


        /* =========================================
           SOURCE INFORMATION
        ========================================= */

        dashboardSheet
            .getRange("A3:B5")
            .values = [

                [
                    "Source Range",
                    sourceRange.address
                ],

                [
                    "Data Rows",
                    sourceRange.rowCount - 1
                ],

                [
                    "Columns",
                    sourceRange.columnCount
                ]

            ];


        dashboardSheet
            .getRange("A3:A5")
            .format.font.bold =
            true;


        /* =========================================
           BASIC KPI SUMMARY
        ========================================= */

        dashboardSheet
            .getRange("D3:E5")
            .values = [

                [
                    "KPI",
                    "Value"
                ],

                [
                    "Total Rows",
                    sourceRange.rowCount - 1
                ],

                [
                    "Total Columns",
                    sourceRange.columnCount
                ]

            ];


        dashboardSheet
            .getRange("D3:E3")
            .format.font.bold =
            true;

        dashboardSheet
            .getRange("D3:E3")
            .format.fill.color =
            "#E2F0D9";


        /* =========================================
           COPY SELECTED DATA
        ========================================= */

        const data =
            sourceRange.values;

        const outputRange =
            dashboardSheet
                .getRangeByIndexes(
                    7,
                    0,
                    sourceRange.rowCount,
                    sourceRange.columnCount
                );

        outputRange.values =
            data;


        /* =========================================
           FORMAT DATA HEADER
        ========================================= */

        const headerRange =
            dashboardSheet
                .getRangeByIndexes(
                    7,
                    0,
                    1,
                    sourceRange.columnCount
                );

        headerRange.format.font.bold =
            true;

        headerRange.format.fill.color =
            "#D9EAD3";


        /* =========================================
           AUTOFIT
        ========================================= */

        dashboardSheet
            .getUsedRange()
            .format
            .autofitColumns();

        dashboardSheet
            .getUsedRange()
            .format
            .autofitRows();


        dashboardSheet
            .getRange("A:B")
            .format.columnWidth =
            18;

        dashboardSheet
            .getRange("D:E")
            .format.columnWidth =
            18;


        /* =========================================
           ACTIVATE DASHBOARD
        ========================================= */

        dashboardSheet.activate();

        await context.sync();


        console.log(
            "Dashboard created successfully:",
            sourceRange.address
        );


        await reportToolStatus(
            "Dashboard",
            "SUCCESS",
            "Dashboard created successfully from " +
            sourceRange.address
        );

    })
    .catch(function (error) {

        console.error(
            "Dashboard Error:",
            error
        );

        reportToolStatus(
            "Dashboard",
            "ERROR",
            error && error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}



function createKPI(event) {

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const sheet =
            workbook.worksheets
                .getActiveWorksheet();

        const range =
            workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount",
            "values"
        ]);

        await context.sync();


        /* =========================================
           VALIDATION
        ========================================= */

        if (
            range.rowCount < 2 ||
            range.columnCount < 3
        ) {

            console.log(
                "KPI Cards: Select Employee, Department and Sales data."
            );

            return;
        }


        /* =========================================
           READ DATA
        ========================================= */

        const values =
            range.values;

        let totalSales = 0;
        let highestSales = 0;
        let employeeCount = 0;


        for (
            let row = 1;
            row < values.length;
            row++
        ) {

            const sales =
                Number(values[row][2]);

            if (!isNaN(sales)) {

                totalSales += sales;

                employeeCount++;

                if (
                    sales > highestSales
                ) {

                    highestSales =
                        sales;
                }
            }
        }


        const averageSales =
            employeeCount > 0
                ? totalSales / employeeCount
                : 0;


        /* =========================================
           REMOVE OLD KPI AREA
        ========================================= */

        const oldArea =
            sheet.getRange("E1:P7");

        try {

            oldArea.unmerge();

        } catch (error) {

            console.log(
                "Old KPI unmerge skipped:",
                error
            );
        }


        oldArea.clear(
            Excel.ClearApplyTo.all
        );


        /* =========================================
           DASHBOARD TITLE
        ========================================= */

        const heading =
            sheet.getRange("E1:P1");

        heading.merge(false);

        heading
            .getCell(0, 0)
            .values = [
                ["KPI DASHBOARD"]
            ];

        heading.format.font.bold =
            true;

        heading.format.font.size =
            18;

        heading.format.font.color =
            "#1F2937";

        heading.format.horizontalAlignment =
            Excel.HorizontalAlignment.center;

        heading.format.verticalAlignment =
            Excel.VerticalAlignment.center;

        heading.format.rowHeight =
            30;


        /* =========================================
           CARD DATA
        ========================================= */

        const cards = [

            {
                cardRange: "E3:G6",
                titleRange: "E3:G3",
                valueRange: "E4:G5",
                noteRange: "E6:G6",

                title: "TOTAL SALES",
                value: totalSales,
                note: "Sum of all sales",

                fill: "#EAF2FF",
                titleColor: "#2563EB",

                numberFormat:
                    "â‚¹#,##0"
            },

            {
                cardRange: "H3:J6",
                titleRange: "H3:J3",
                valueRange: "H4:J5",
                noteRange: "H6:J6",

                title: "AVERAGE",
                value: averageSales,
                note: "Average sales",

                fill: "#E9F8EF",
                titleColor: "#16A34A",

                numberFormat:
                    "â‚¹#,##0"
            },

            {
                cardRange: "K3:M6",
                titleRange: "K3:M3",
                valueRange: "K4:M5",
                noteRange: "K6:M6",

                title: "TOP SALES",
                value: highestSales,
                note: "Highest sales value",

                fill: "#FFF5E5",
                titleColor: "#EA580C",

                numberFormat:
                    "â‚¹#,##0"
            },

            {
                cardRange: "N3:P6",
                titleRange: "N3:P3",
                valueRange: "N4:P5",
                noteRange: "N6:P6",

                title: "EMPLOYEES",
                value: employeeCount,
                note: "Total employees",

                fill: "#F5EBFF",
                titleColor: "#9333EA",

                numberFormat:
                    "0"
            }

        ];


        /* =========================================
           BUILD KPI CARDS
        ========================================= */

        for (
            const card of cards
        ) {

            const cardRange =
                sheet.getRange(
                    card.cardRange
                );

            const titleRange =
                sheet.getRange(
                    card.titleRange
                );

            const valueRange =
                sheet.getRange(
                    card.valueRange
                );

            const noteRange =
                sheet.getRange(
                    card.noteRange
                );


            /* MERGE */

            titleRange.merge(false);

            valueRange.merge(false);

            noteRange.merge(false);


            /* CARD BACKGROUND */

            cardRange.format.fill.color =
                card.fill;


            /* TITLE */

            titleRange
                .getCell(0, 0)
                .values = [
                    [card.title]
                ];

            titleRange.format.font.bold =
                true;

            titleRange.format.font.size =
                10;

            titleRange.format.font.color =
                card.titleColor;

            titleRange.format.horizontalAlignment =
                Excel.HorizontalAlignment.center;

            titleRange.format.verticalAlignment =
                Excel.VerticalAlignment.center;


            /* VALUE */

            const valueCell =
                valueRange.getCell(
                    0,
                    0
                );

            valueCell.values = [
                [card.value]
            ];

            valueCell.numberFormat = [
                [card.numberFormat]
            ];

            valueRange.format.font.bold =
                true;

            valueRange.format.font.size =
                20;

            valueRange.format.font.color =
                "#111827";

            valueRange.format.horizontalAlignment =
                Excel.HorizontalAlignment.center;

            valueRange.format.verticalAlignment =
                Excel.VerticalAlignment.center;


            /* NOTE */

            noteRange
                .getCell(0, 0)
                .values = [
                    [card.note]
                ];

            noteRange.format.font.size =
                9;

            noteRange.format.font.color =
                "#6B7280";

            noteRange.format.horizontalAlignment =
                Excel.HorizontalAlignment.center;

            noteRange.format.verticalAlignment =
                Excel.VerticalAlignment.center;


            /* OUTER BORDER */

            const borderNames = [
                "EdgeTop",
                "EdgeBottom",
                "EdgeLeft",
                "EdgeRight"
            ];


            for (
                const borderName of borderNames
            ) {

                const border =
                    cardRange
                        .format
                        .borders
                        .getItem(
                            borderName
                        );

                border.style =
                    Excel.BorderLineStyle
                        .continuous;

                border.color =
                    card.titleColor;
            }
        }


        /* =========================================
           CARD SIZE
        ========================================= */

        sheet.getRange("E:P")
            .format.columnWidth = 11;

        sheet.getRange("E3:P6")
            .format.wrapText = true;


        /* =========================================
           APPLY
        ========================================= */

        await context.sync();


        console.log(
            "KPI Cards created successfully:",
            {
                totalSales,
                averageSales,
                highestSales,
                employeeCount
            }
        );

    })
    .catch(function (error) {

        console.error(
            "KPI Cards Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}



function vlookupInfo(event) {

    reportToolStatus(
        "VLOOKUP",
        "RUNNING",
        "Creating VLOOKUP formula..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const range =
            workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount"
        ]);

        await context.sync();


        /* =========================================
           VALIDATION
        ========================================= */

        if (
            range.rowCount !== 1 ||
            range.columnCount !== 1
        ) {

            await reportToolStatus(
                "VLOOKUP",
                "ERROR",
                "Please select ONE result cell only."
            );

            return;
        }


        /* =========================================
           VLOOKUP FORMULA

           A = Employee
           B = Salary
           D2 = Search Employee
           E2 = Result Cell
        ========================================= */

        const formula =
            '=VLOOKUP(D2,A2:B9,2,FALSE)';


        range.formulas = [
            [formula]
        ];


        await context.sync();


        console.log(
            "VLOOKUP created:",
            {
                cell: range.address,
                formula: formula
            }
        );


        await reportToolStatus(
            "VLOOKUP",
            "SUCCESS",
            "VLOOKUP formula created in " +
            range.address
        );

    })
    .catch(function (error) {

        console.error(
            "VLOOKUP Error:",
            error
        );


        reportToolStatus(
            "VLOOKUP",
            "ERROR",
            error && error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}

function xlookupInfo(event) {

    reportToolStatus(
        "XLOOKUP",
        "RUNNING",
        "Creating XLOOKUP formula..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const range =
            workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount",
            "rowIndex",
            "columnIndex"
        ]);

        await context.sync();


        /* =========================================
           VALIDATION
        ========================================= */

        if (
            range.rowCount !== 1 ||
            range.columnCount !== 1
        ) {

            await reportToolStatus(
                "XLOOKUP",
                "ERROR",
                "Please select ONE result cell only."
            );

            return;
        }


        /* =========================================
           CREATE FORMULA
           
           Demo layout:
           A = Employee
           B = Salary
           D2 = lookup employee
           E2 = selected result cell
        ========================================= */

        const formula =
            '=XLOOKUP(D2,A2:A9,B2:B9,"Not Found")';


        range.formulas = [
            [formula]
        ];


        await context.sync();


        console.log(
            "XLOOKUP created:",
            {
                cell: range.address,
                formula: formula
            }
        );


        await reportToolStatus(
            "XLOOKUP",
            "SUCCESS",
            "XLOOKUP formula created in " +
            range.address
        );

    })
    .catch(function (error) {

        console.error(
            "XLOOKUP Error:",
            error
        );

        reportToolStatus(
            "XLOOKUP",
            "ERROR",
            error && error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}


function smartChartInfo(event) {

    reportToolStatus(
        "Smart Chart",
        "RUNNING",
        "Analyzing selected Excel data..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const range =
            workbook.getSelectedRange();

        const sheet =
            workbook.worksheets
                .getActiveWorksheet();

        range.load([
            "address",
            "rowCount",
            "columnCount",
            "values",
            "rowIndex",
            "columnIndex"
        ]);

        await context.sync();


        /* =========================================
           STEP 1 - VALIDATE SELECTION
        ========================================= */

        if (
            range.rowCount < 2 ||
            range.columnCount < 2
        ) {

            await reportToolStatus(
                "Smart Chart",
                "ERROR",
                "Select headers and at least one data row."
            );

            return;
        }


        const values =
            range.values;

        const headers =
            values[0];


        /* =========================================
           STEP 2 - DETECT TEXT + NUMERIC COLUMN
        ========================================= */

        let textColumn = -1;
        let numericColumn = -1;


        for (
            let col = 0;
            col < headers.length;
            col++
        ) {

            let numericCount = 0;
            let textCount = 0;


            for (
                let row = 1;
                row < values.length;
                row++
            ) {

                const value =
                    values[row][col];


                if (
                    value !== null &&
                    value !== "" &&
                    typeof value === "number"
                ) {

                    numericCount++;

                }


                if (
                    value !== null &&
                    value !== "" &&
                    typeof value !== "number"
                ) {

                    textCount++;

                }

            }


            if (
                textColumn === -1 &&
                textCount > 0
            ) {

                textColumn =
                    col;

            }


            if (
                numericColumn === -1 &&
                numericCount > 0
            ) {

                numericColumn =
                    col;

            }

        }


        /* =========================================
           STEP 3 - VALIDATE DETECTION
        ========================================= */

        if (textColumn === -1) {

            await reportToolStatus(
                "Smart Chart",
                "ERROR",
                "No text/category column found."
            );

            return;
        }


        if (numericColumn === -1) {

            await reportToolStatus(
                "Smart Chart",
                "ERROR",
                "No numeric/value column found."
            );

            return;
        }


        const categoryName =
            String(
                headers[textColumn] ||
                "Category"
            );

        const valueName =
            String(
                headers[numericColumn] ||
                "Value"
            );


        /* =========================================
           STEP 4 - BUILD CLEAN CHART DATA
        ========================================= */

        const chartData = [];


        for (
            let row = 1;
            row < values.length;
            row++
        ) {

            const category =
                values[row][textColumn];

            const value =
                values[row][numericColumn];


            if (
                category !== null &&
                category !== "" &&
                typeof value === "number"
            ) {

                chartData.push([
                    category,
                    value
                ]);

            }

        }


        if (
            chartData.length === 0
        ) {

            await reportToolStatus(
                "Smart Chart",
                "ERROR",
                "No valid category/value data found."
            );

            return;
        }


        /* =========================================
           STEP 5 - HELPER DATA AREA
        ========================================= */

        const startRow =
            range.rowIndex +
            range.rowCount +
            2;

        const startCol =
            range.columnIndex;


        const helperRange =
            sheet.getRangeByIndexes(
                startRow,
                startCol,
                chartData.length + 1,
                2
            );


        helperRange.values = [
            [
                categoryName,
                valueName
            ],
            ...chartData
        ];


        /* =========================================
           STEP 6 - CREATE SMART CHART
        ========================================= */

        const chart =
            sheet.charts.add(
                Excel.ChartType
                    .columnClustered,
                helperRange,
                Excel.ChartSeriesBy
                    .columns
            );


        chart.title.text =
            "Himanshu XL Tools - " +
            valueName +
            " by " +
            categoryName;


        chart.legend.position =
            Excel.ChartLegendPosition
                .none;


        /* =========================================
           STEP 7 - POSITION CHART
        ========================================= */

        chart.setPosition(

            sheet.getCell(
                startRow +
                chartData.length +
                2,
                startCol
            ),

            sheet.getCell(
                startRow +
                chartData.length +
                18,
                startCol + 8
            )

        );


        /* =========================================
           STEP 8 - APPLY
        ========================================= */

        await context.sync();


        console.log(
            "Smart Chart created:",
            {
                source: range.address,
                category: categoryName,
                value: valueName
            }
        );


        await reportToolStatus(
            "Smart Chart",
            "SUCCESS",
            "Created " +
            valueName +
            " by " +
            categoryName
        );

    })
    .catch(function (error) {

        console.error(
            "Smart Chart Error:",
            error
        );


        reportToolStatus(
            "Smart Chart",
            "ERROR",
            error &&
            error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}



function powerDashboardInfo(event) {

    Excel.run(async (context) => {

        console.log(
            "Power Dashboard clicked"
        );

    })
    .catch(function (error) {

        console.error(
            "Power Dashboard Error:",
            error
        );

    })
    .finally(function () {

        if (event && event.completed) {
            event.completed();
        }

    });
}


// ============================================================
// POWER DASHBOARD STUDIO
// Standalone dialog - No Task Pane
// ============================================================

function openPowerDashboardStudio(event) {

    try {

        console.log(
            "Opening Power Dashboard Studio..."
        );

        Office.context.ui.displayDialogAsync(
    getHxlAppUrl(
        "power-dashboard.html"
    ),

            {
                height: 88,
                width: 88,
                displayInIframe: false
            },

            function (asyncResult) {

                if (
                    asyncResult.status ===
                    Office.AsyncResultStatus.Failed
                ) {

                    console.error(
                        "Power Dashboard Studio Error:",
                        asyncResult.error
                    );

                    if (
                        event &&
                        event.completed
                    ) {
                        event.completed();
                    }

                    return;
                }


                const dialog =
                    asyncResult.value;


                console.log(
                    "Power Dashboard Studio opened successfully."
                );


                dialog.addEventHandler(

                    Office.EventType.DialogMessageReceived,

                    async function (args) {

                        try {

                            const message =
                                JSON.parse(
                                    args.message
                                );


                            // =========================================
                            // CLOSE STUDIO
                            // =========================================

                            if (
                                message.type ===
                                "CLOSE_STUDIO"
                            ) {

                                dialog.close();

                                return;
                            }




                // =========================================
// DASHBOARD -> EXISTING PDF EXPORT DIALOG
// =========================================

if (
    message.type ===
    "HXL_DASHBOARD_EXPORT_PDF"
) {

    try {

        console.log(
            "Dashboard requested PDF Export."
        );


        // Excel allows one Office dialog at a time.
        dialog.close();


        await new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    300
                );

            }
        );


        openExportPdfDialog({
            completed:
                function () {
                    // Dashboard Studio bridge:
                    // no Ribbon event completion required.
                }
        });

    }
    catch (pdfDialogError) {

        console.error(
            "Dashboard PDF Export dialog could not be opened:",
            pdfDialogError
        );

    }


    return;

}


// =========================================
// DASHBOARD -> EXPORT POWERPOINT DIALOG
// =========================================

if (
    message.type ===
    "HXL_DASHBOARD_EXPORT_PPT"
) {

    try {

        console.log(
            "Dashboard requested PowerPoint Export."
        );


        // Excel allows one Office dialog at a time.
        dialog.close();


        await new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    300
                );

            }
        );


        openExportPptDialog();

    }
    catch (pptDialogError) {

        console.error(
            "Dashboard PowerPoint dialog could not be opened:",
            pptDialogError
        );

    }


    return;

}



                            // =========================================
                            // GET EXCEL SELECTION
                            // =========================================

                            if (
                                message.type ===
                                "POWER_DASHBOARD_GET_SELECTION"
                            ) {

                                try {

                                    const result =
                                        await readPowerDashboardSelection(
                                            message.sourceRange || ""
                                        );


                                    dialog.messageChild(
                                        JSON.stringify({
                                            type:
                                                "POWER_DASHBOARD_SELECTION_RESULT",
                                            success:
                                                true,
                                            data:
                                                result
                                        })
                                    );

                                }
                                catch (error) {

                                    console.error(
                                        "Selection Error:",
                                        error
                                    );


                                    dialog.messageChild(
                                        JSON.stringify({
                                            type:
                                                "POWER_DASHBOARD_SELECTION_RESULT",
                                            success:
                                                false,
                                            error:
                                                error.message ||
                                                String(error)
                                        })
                                    );

                                }

                                return;
                            }


                            // =========================================
                            // GET EXISTING DASHBOARD CONFIGURATION
                            // =========================================

                            if (
                                message.type ===
                                "POWER_DASHBOARD_GET_EXISTING_CONFIG"
                            ) {

                                try {

                                    const existingConfig =
                                        await readExistingPowerDashboardConfig();


                                    dialog.messageChild(
                                        JSON.stringify({
                                            type:
                                                "POWER_DASHBOARD_EXISTING_CONFIG_RESULT",

                                            success:
                                                true,

                                            data:
                                                existingConfig
                                        })
                                    );

                                }
                                catch (configError) {

                                    console.error(
                                        "Existing Dashboard Config Error:",
                                        configError
                                    );


                                    dialog.messageChild(
                                        JSON.stringify({
                                            type:
                                                "POWER_DASHBOARD_EXISTING_CONFIG_RESULT",

                                            success:
                                                false,

                                            error:
                                                configError &&
                                                configError.message
                                                    ? configError.message
                                                    : String(
                                                        configError
                                                    )
                                        })
                                    );

                                }


                                return;

                            }


                            // =========================================
                            // BUILD DASHBOARD
                            // =========================================

                            if (
                                message.type ===
                                "POWER_DASHBOARD_BUILD"
                            ) {

                                try {

                                const result =
    await createPowerDashboardWorkbook(
        message.config || {},

        function (progress) {

            try {

                dialog.messageChild(
                    JSON.stringify({
                        type:
                            "POWER_DASHBOARD_BUILD_PROGRESS",

                        percent:
                            progress.percent || 0,

                        stage:
                            progress.stage || "",

                        title:
                            progress.title || "",

                        detail:
                            progress.detail || ""
                    })
                );

            }
            catch (progressMessageError) {

                console.warn(
                    "Dashboard progress message could not be sent:",
                    progressMessageError
                );

            }

        }
    );


                                    dialog.messageChild(
                                        JSON.stringify({
                                            type:
                                                "POWER_DASHBOARD_BUILD_RESULT",

                                            success:
                                                true,

                                            data:
                                                result
                                        })
                                    );

                                }
                                catch (error) {

                                    console.error(
                                        "Dashboard Build Error:",
                                        error
                                    );


                                    dialog.messageChild(
                                        JSON.stringify({
                                            type:
                                                "POWER_DASHBOARD_BUILD_RESULT",

                                            success:
                                                false,

                                            error:
                                                error.message ||
                                                String(error)
                                        })
                                    );

                                }


                                return;

                            }
                        }
                        catch (error) {

                            console.error(
                                "Power Dashboard message error:",
                                error
                            );

                        }

                    }

                );


                dialog.addEventHandler(

                    Office.EventType.DialogEventReceived,

                    function (args) {

                        console.log(
                            "Power Dashboard Studio closed:",
                            args.error
                        );

                    }

                );


                if (
                    event &&
                    event.completed
                ) {

                    event.completed();

                }

            }

        );

    }
    catch (error) {

        console.error(
            "openPowerDashboardStudio failed:",
            error
        );


        if (
            event &&
            event.completed
        ) {

            event.completed();

        }

    }

}


// ============================================================
// READ EXISTING POWER DASHBOARD CONFIGURATION
// ============================================================

async function readExistingPowerDashboardConfig() {

    return Excel.run(
        async function (context) {

            const workbook =
                context.workbook;


            const settingsSheet =
                workbook.worksheets
                    .getItemOrNullObject(
                        "Dash_Settings"
                    );


            settingsSheet.load(
                "isNullObject"
            );


            await context.sync();


            // =================================================
            // NO EXISTING DASHBOARD
            // =================================================

            if (
                settingsSheet.isNullObject
            ) {

                return {
                    exists: false
                };

            }


            const settingsRange =
                settingsSheet
                    .getUsedRangeOrNullObject();


            settingsRange.load([
                "isNullObject",
                "values"
            ]);


            await context.sync();


            if (
                settingsRange.isNullObject
            ) {

                return {
                    exists: false
                };

            }


            const values =
                settingsRange.values || [];


            const settings =
                {};


            // =================================================
            // CONVERT A:B SETTINGS TABLE TO OBJECT
            // =================================================

            for (
                let row = 1;
                row < values.length;
                row++
            ) {

                const key =
                    String(
                        values[row][0] || ""
                    ).trim();


                const value =
                    values[row][1];


                if (key) {

                    settings[key] =
                        value;

                }

            }


            const sourceSheetName =
                String(
                    settings[
                        "Source Sheet"
                    ] || ""
                ).trim();


            const configuredRange =
                String(
                    settings[
                        "Source Range"
                    ] || ""
                ).trim();


            // =================================================
            // BASIC CONFIG
            // =================================================

            const result = {

                exists:
                    true,

                dashboardTitle:
                    settings[
                        "Dashboard Title"
                    ] ||
                    "Sales Performance Dashboard",

                theme:
                    String(
                        settings[
                            "Theme"
                        ] ||
                        "ocean"
                    ).toLowerCase(),

                currency:
                    String(
                        settings[
                            "Currency"
                        ] ||
                        "INR"
                    ).toUpperCase(),

                gridlines:
                    String(
                        settings[
                            "Gridlines"
                        ] ||
                        "hide"
                    ).toLowerCase(),

                layout:
                    String(
                        settings[
                            "Layout"
                        ] ||
                        "executive"
                    ).toLowerCase(),

                                    dataEngine:
                    String(
                        settings[
                            "Data Engine"
                        ] ||
                        "classic"
                    ).toLowerCase(),

                kpiStyle:
                    String(
                        settings[
                            "KPI Style"
                        ] ||
                        "Modern Cards"
                    ),

                chartStyle:
                    String(
                        settings[
                            "Chart Style"
                        ] ||
                        "Clean"
                    ),

                                background:
                    String(
                        settings[
                            "Background"
                        ] ||
                        "Light"
                    ),

                protectDashboard:
                    String(
                        settings[
                            "Protect Dashboard"
                        ] ||
                        "Yes"
                    ).toLowerCase() ===
                    "yes",

                hideBackend:
                    String(
                        settings[
                            "Hide Backend"
                        ] ||
                        "Yes"
                    ).toLowerCase() ===
                    "yes",

                lockSettings:
                    String(
                        settings[
                            "Lock Settings"
                        ] ||
                        "No"
                    ).toLowerCase() ===
                    "yes",

                sourceSheet:
                    sourceSheetName,

                dataRange:
                    configuredRange,

                rowCount:
                    null,

                columnCount:
                    null,

                headerDetected:
                    false,

                dataTypeDetected:
                    false,

                columnDefinitions:
                    []

            };

                // =================================================
// LOAD FULL PROJECT CONFIG WHEN AVAILABLE
// =================================================

try {

    // ============================================================
// LOAD FULL PROJECT CONFIG
//
// Schema 2 stores the JSON in multiple cells.
// Schema 1 / old workbooks still use D2 only.
// ============================================================

const projectSchemaRange =
    settingsSheet.getRange(
        "E2"
    );

const projectChunkCountRange =
    settingsSheet.getRange(
        "F2"
    );

const legacyProjectConfigRange =
    settingsSheet.getRange(
        "D2"
    );


projectSchemaRange.load(
    "values"
);

projectChunkCountRange.load(
    "values"
);

legacyProjectConfigRange.load(
    "values"
);


await context.sync();


const projectSchema =
    Number(
        projectSchemaRange
            .values &&
        projectSchemaRange
            .values[0] &&
        projectSchemaRange
            .values[0][0] ||
        1
    );


const projectChunkCount =
    Number(
        projectChunkCountRange
            .values &&
        projectChunkCountRange
            .values[0] &&
        projectChunkCountRange
            .values[0][0] ||
        0
    );


let projectConfigText =
    "";


if (
    projectSchema >= 2 &&
    Number.isFinite(
        projectChunkCount
    ) &&
    projectChunkCount > 0
) {

    const projectChunkRange =
        settingsSheet
            .getRangeByIndexes(
                1,
                3,
                projectChunkCount,
                1
            );


    projectChunkRange.load(
        "values"
    );


    await context.sync();


    const chunkValues =
        projectChunkRange
            .values ||
        [];


    projectConfigText =
        chunkValues
            .map(
                function (row) {

                    return String(
                        (
                            row &&
                            row[0]
                        ) ||
                        ""
                    );

                }
            )
            .join("");

}
else {

    // Backward compatibility:
    // older dashboards stored the entire config in D2.

    projectConfigText =
        String(
            (
                legacyProjectConfigRange
                    .values &&
                legacyProjectConfigRange
                    .values[0] &&
                legacyProjectConfigRange
                    .values[0][0]
            ) ||
            ""
        );

}


projectConfigText =
    projectConfigText.trim();


console.log(
    "Power Dashboard project config loaded:",
    {
        schema:
            projectSchema,

        chunks:
            projectChunkCount,

        jsonLength:
            projectConfigText.length
    }
);


    if (
        projectConfigText
    ) {

        const projectConfig =
            JSON.parse(
                projectConfigText
            );


        if (
            projectConfig &&
            typeof projectConfig ===
                "object"
        ) {

            result.projectSnapshot =
                projectConfig;


            result.project =
                projectConfig.project ||
                {};


            result.kpis =
                Array.isArray(
                    projectConfig.kpis
                )
                    ? projectConfig.kpis
                    : [];


            result.charts =
                Array.isArray(
                    projectConfig.charts
                )
                    ? projectConfig.charts
                    : [];


            result.slicers =
                Array.isArray(
                    projectConfig.slicers
                )
                    ? projectConfig.slicers
                    : [];


            result.tables =
                Array.isArray(
                    projectConfig.tables
                )
                    ? projectConfig.tables
                    : [];


            result.canvasMode =
                projectConfig.canvasMode ||
                result.canvasMode ||
                "auto";


            result.canvasPreset =
                projectConfig.canvasPreset ||
                result.canvasPreset ||
                "window";


            result.canvasStartCell =
                projectConfig.canvasStartCell ||
                result.canvasStartCell ||
                "B2";


            result.canvasEndCell =
                projectConfig.canvasEndCell ||
                result.canvasEndCell ||
                "Y55";


            result.lockCanvas =
                projectConfig.lockCanvas !==
                false;


            console.log(
                "Full Power Dashboard project config loaded."
            );

        }

    }

}
catch (
    projectConfigError
) {

    console.warn(
        "Full dashboard project config could not be loaded. Falling back to legacy settings:",
        projectConfigError
    );

}

            // =================================================
            // RESTORE SOURCE METADATA + COLUMN DEFINITIONS
            // =================================================

            if (
                sourceSheetName &&
                configuredRange
            ) {

                try {

                    const sourceSheet =
                        workbook.worksheets
                            .getItem(
                                sourceSheetName
                            );


                    let sourceAddress =
                        configuredRange;


                    const separatorIndex =
                        configuredRange
                            .lastIndexOf("!");


                    if (
                        separatorIndex !== -1
                    ) {

                        sourceAddress =
                            configuredRange
                                .substring(
                                    separatorIndex + 1
                                )
                                .trim();

                    }


                    const sourceRange =
                        sourceSheet.getRange(
                            sourceAddress
                        );


                    sourceRange.load([
                        "values",
                        "rowCount",
                        "columnCount"
                    ]);


                    await context.sync();


                    const sourceValues =
                        sourceRange.values || [];


                    const headers =
                        sourceValues[0] || [];


                    const columnDefinitions =
                        [];


                    for (
                        let columnIndex = 0;
                        columnIndex <
                        sourceRange.columnCount;
                        columnIndex++
                    ) {

                        const columnValues =
                            [];


                        for (
                            let rowIndex = 1;
                            rowIndex <
                            sourceValues.length;
                            rowIndex++
                        ) {

                            columnValues.push(
                                sourceValues[
                                    rowIndex
                                ][
                                    columnIndex
                                ]
                            );

                        }


                        const detectedType =
    detectPowerDashboardValueType(
        columnValues
    );


const columnName =
    String(
        headers[
            columnIndex
        ] ||
        (
            "Column " +
            (
                columnIndex + 1
            )
        )
    ).trim();


const columnStats =
    calculatePowerDashboardColumnStatistics(
        columnValues,
        detectedType,
        []
    ); 


const semanticType =
    detectPowerDashboardSemanticType(
        columnName,
        detectedType,
        columnValues,
        [],
        columnStats
    );


columnDefinitions.push({

    index:
        columnIndex,

    name:
        columnName,

    type:
        detectedType,

    semanticType:
        semanticType,

    stats:
        columnStats

});

                    }

                                        const dataRows =
                        sourceValues.slice(1);


                    const duplicateRowAnalysis =
                        calculatePowerDashboardDuplicateRows(
                            dataRows
                        );


                    const dataQuality =
                        createPowerDashboardDataQualityWarnings(
                            columnDefinitions,
                            duplicateRowAnalysis
                        );

                                            const profilerResult = {
                        rowCount:
                            sourceRange.rowCount - 1,

                        columnCount:
                            sourceRange.columnCount,

                        columns:
                            columnDefinitions,

                        duplicateRows:
                            duplicateRowAnalysis,

                        dataQuality:
                            dataQuality
                    };

                    result.rowCount =
                        sourceRange.rowCount - 1;


                    result.columnCount =
                        sourceRange.columnCount;


                    result.headerDetected =
                        true;


                    result.dataTypeDetected =
                        true;


                                        result.columnDefinitions =
                        columnDefinitions;


                    result.duplicateRowAnalysis =
                        duplicateRowAnalysis;


                                        result.dataQuality =
                        dataQuality;


                    result.profilerResult =
                        profilerResult;


                    result.sourceValues =
                        sourceValues;

                }
                catch (sourceError) {

                    console.warn(
                        "Existing dashboard source could not be restored:",
                        sourceError
                    );

                }

            }


            return result;

        }
    );

}


// ============================================================
// READ POWER DASHBOARD SELECTION
// ============================================================

async function readPowerDashboardSelection(
    sourceAddress
) {

    return Excel.run(
        async function (context) {

            const workbook =
                context.workbook;

            const requestedAddress =
                String(
                    sourceAddress || ""
                ).trim();

            let sheet;
            let range;


            // =========================================
            // READ SAVED DASHBOARD SOURCE RANGE
            // =========================================

            if (requestedAddress) {

                const addressMatch =
                    requestedAddress.match(
                        /^(?:'((?:[^']|'')+)'|([^!]+))!(.+)$/
                    );

                if (!addressMatch) {

                    throw new Error(
                        "Saved dashboard source range is invalid: " +
                        requestedAddress
                    );

                }


                const sheetName =
                    String(
                        addressMatch[1] ||
                        addressMatch[2] ||
                        ""
                    ).replace(
                        /''/g,
                        "'"
                    );

                const rangeAddress =
                    String(
                        addressMatch[3] || ""
                    ).trim();


                if (
                    !sheetName ||
                    !rangeAddress
                ) {

                    throw new Error(
                        "Unable to identify the dashboard source worksheet or range."
                    );

                }


                sheet =
                    workbook.worksheets
                        .getItem(
                            sheetName
                        );

                range =
                    sheet.getRange(
                        rangeAddress
                    );

            }

            // =========================================
            // NORMAL SELECT RANGE
            // =========================================

            else {

                sheet =
                    workbook.worksheets
                        .getActiveWorksheet();

                range =
                    workbook
                        .getSelectedRange();

            }


            sheet.load("name");

            range.load([
                "address",
                "rowCount",
                "columnCount",
                "values",
                "numberFormat"
            ]);


            await context.sync();


            if (
                range.rowCount < 2
            ) {

                throw new Error(
                    "Please select headers and at least one data row."
                );

            }


            const values =
                range.values || [];


            const headers =
                values[0] || [];

            const columnDefinitions =
                [];


            for (
                let columnIndex = 0;
                columnIndex <
                range.columnCount;
                columnIndex++
            ) {

                const columnValues =
                    [];


                for (
                    let rowIndex = 1;
                    rowIndex <
                    values.length;
                    rowIndex++
                ) {

                    columnValues.push(
                        values[rowIndex][
                            columnIndex
                        ]
                    );

                }


                const columnNumberFormats =
    (
        range.numberFormat ||
        []
    )
        .slice(1)
        .map(
            function (row) {

                return Array.isArray(
                    row
                )
                    ? row[
                        columnIndex
                    ]
                    : "";

            }
        );


        const detectedType =
    detectPowerDashboardValueType(
        columnValues,
        columnNumberFormats
    );


const columnName =
    String(
        headers[
            columnIndex
        ] || (
            "Column " +
            (
                columnIndex + 1
            )
        )
    ).trim();


const columnStats =
    calculatePowerDashboardColumnStatistics(
        columnValues,
        detectedType,
        columnNumberFormats
    );


const semanticType =
    detectPowerDashboardSemanticType(
        columnName,
        detectedType,
        columnValues,
        columnNumberFormats,
        columnStats
    );


columnDefinitions.push({

    index:
        columnIndex,

    name:
        columnName,

    type:
        detectedType,

    semanticType:
        semanticType,

    stats:
        columnStats

});
            }

                        const dataRows =
                values.slice(1);


            const duplicateRowAnalysis =
                calculatePowerDashboardDuplicateRows(
                    dataRows
                );


            const dataQuality =
                createPowerDashboardDataQualityWarnings(
                    columnDefinitions,
                    duplicateRowAnalysis
                );

                            const profilerResult = {
                rowCount:
                    range.rowCount - 1,

                columnCount:
                    range.columnCount,

                columns:
                    columnDefinitions,

                duplicateRows:
                    duplicateRowAnalysis,

                dataQuality:
                    dataQuality
            };


            return {

                worksheet:
                    sheet.name,

                address:
                    range.address,

                rows:
                    range.rowCount - 1,

                totalRows:
                    range.rowCount,

                columns:
                    range.columnCount,

                headersDetected:
                    true,

                dataTypesDetected:
                    true,

                                columnDefinitions:
                    columnDefinitions,

                duplicateRowAnalysis:
                    duplicateRowAnalysis,

                dataQuality:
                    dataQuality,
                profilerResult:
                    profilerResult,

                sourceValues:
                    values

            };

        }
    );

}




// ============================================================
// SIMPLE TYPE DETECTOR
// ============================================================

function detectPowerDashboardValueType(
    values,
    numberFormats
) {

    const rawValues =
        Array.isArray(values)
            ? values
            : [];


    const formats =
        Array.isArray(numberFormats)
            ? numberFormats
            : [];


    const clean =
        rawValues.filter(
            function (value) {

                return (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                );

            }
        );


    if (
        clean.length === 0
    ) {

        return "blank";

    }


    let numbers = 0;
    let dates = 0;


    // ========================================================
    // EXCEL NUMBER FORMAT DATE DETECTION
    // ========================================================

    let dateFormatCount = 0;
    let checkedFormatCount = 0;


    formats.forEach(
        function (format) {

            const text =
                String(
                    format || ""
                )
                    .trim()
                    .toLowerCase();


            if (!text) {
                return;
            }


            checkedFormatCount++;


            // Remove quoted literals and bracket sections
            // such as [$-en-US].
            const normalized =
                text
                    .replace(
                        /"[^"]*"/g,
                        ""
                    )
                    .replace(
                        /\[[^\]]*\]/g,
                        ""
                    );


            const hasYear =
                /y/.test(
                    normalized
                );


            const hasMonth =
                /m/.test(
                    normalized
                );


            const hasDay =
                /d/.test(
                    normalized
                );


            if (
                (
                    hasYear &&
                    (
                        hasMonth ||
                        hasDay
                    )
                ) ||
                (
                    hasMonth &&
                    hasDay
                )
            ) {

                dateFormatCount++;

            }

        }
    );


    const mostlyDateFormatted =
        checkedFormatCount > 0 &&
        (
            dateFormatCount /
            checkedFormatCount
        ) >= 0.8;


    clean.forEach(
        function (value) {

            if (
                typeof value ===
                "number"
            ) {

                numbers++;

                return;

            }


            const text =
                String(value)
                    .trim();


            const looksLikeDate =
                (
                    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(
                        text
                    ) ||
                    /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(
                        text
                    ) ||
                    /^\d{1,2}[\s\-][A-Za-z]{3,9}[\s\-]\d{2,4}$/.test(
                        text
                    ) ||
                    /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}$/.test(
                        text
                    )
                );


            if (
                looksLikeDate &&
                !Number.isNaN(
                    Date.parse(text)
                )
            ) {

                dates++;

            }

        }
    );


    // ========================================================
    // EXCEL SERIAL DATES
    // ========================================================

    if (
        mostlyDateFormatted &&
        numbers / clean.length >= 0.8
    ) {

        return "date";

    }


    // ========================================================
    // TEXT DATES
    // ========================================================

    if (
        dates / clean.length >= 0.8
    ) {

        return "date";

    }


    // ========================================================
    // NORMAL NUMBERS
    // ========================================================

    if (
        numbers / clean.length >= 0.8
    ) {

        return "number";

    }


    return "text";

}

// ============================================================
// POWER DASHBOARD COLUMN STATISTICS
// ============================================================

function calculatePowerDashboardColumnStatistics(
    values,
    detectedType,
    numberFormats
) {

    const rawValues =
        Array.isArray(values)
            ? values
            : [];


    const formats =
        Array.isArray(numberFormats)
            ? numberFormats
            : [];


    const totalCount =
        rawValues.length;


    function isBlankValue(value) {

        return (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        );

    }


    const nonBlankValues =
        rawValues.filter(
            function (value) {

                return !isBlankValue(
                    value
                );

            }
        );


    const nonBlankCount =
        nonBlankValues.length;


    const blankCount =
        totalCount -
        nonBlankCount;


    const blankPercent =
        totalCount > 0
            ? Number(
                (
                    (
                        blankCount /
                        totalCount
                    ) * 100
                ).toFixed(2)
            )
            : 0;


    // --------------------------------------------------------
    // VALID / INVALID DETECTION
    // --------------------------------------------------------

    let validCount =
        0;


    let invalidCount =
        0;


    rawValues.forEach(
        function (value, index) {

            if (
                isBlankValue(
                    value
                )
            ) {

                return;

            }


            let isValid =
                true;


            // NUMBER / CURRENCY SOURCE COLUMN
            if (
                detectedType ===
                "number"
            ) {

                if (
                    typeof value ===
                    "number"
                ) {

                    isValid =
                        Number.isFinite(
                            value
                        );

                } else {

                    const normalizedValue =
                        String(value)
                            .replace(
                                /[â‚¹$Â£â‚¬Â¥,%\s,]/g,
                                ""
                            )
                            .trim();


                    isValid =
                        normalizedValue !== "" &&
                        Number.isFinite(
                            Number(
                                normalizedValue
                            )
                        );

                }

            }


            // DATE SOURCE COLUMN
            else if (
                detectedType ===
                "date"
            ) {

                if (
                    value instanceof Date
                ) {

                    isValid =
                        !Number.isNaN(
                            value.getTime()
                        );

                }

                else if (
                    typeof value ===
                    "number"
                ) {

                    // Excel serial dates.
                    isValid =
                        Number.isFinite(
                            value
                        ) &&
                        value > 0;

                }

                else {

                    const parsedDate =
                        Date.parse(
                            String(
                                value
                            ).trim()
                        );


                    isValid =
                        !Number.isNaN(
                            parsedDate
                        );

                }

            }


            // TEXT / CATEGORY / ID source values
            else {

                isValid =
                    true;

            }


            if (
                isValid
            ) {

                validCount += 1;

            } else {

                invalidCount += 1;

            }

        }
    );


    const invalidPercent =
        nonBlankCount > 0
            ? Number(
                (
                    (
                        invalidCount /
                        nonBlankCount
                    ) * 100
                ).toFixed(2)
            )
            : 0;


    // --------------------------------------------------------
    // UNIQUE / CARDINALITY
    // --------------------------------------------------------

    const uniqueValueKeys =
        new Set();


    nonBlankValues.forEach(
        function (value) {

            const normalizedValue =
                typeof value ===
                    "string"
                    ? value.trim()
                    : value;


            uniqueValueKeys.add(
                typeof normalizedValue +
                ":" +
                String(
                    normalizedValue
                )
            );

        }
    );


    const uniqueCount =
        uniqueValueKeys.size;


    const cardinalityPercent =
        nonBlankCount > 0
            ? Number(
                (
                    (
                        uniqueCount /
                        nonBlankCount
                    ) * 100
                ).toFixed(2)
            )
            : 0;


    // --------------------------------------------------------
    // MIN / MAX
    // --------------------------------------------------------

    let minimum =
        null;


    let maximum =
        null;


    if (
        detectedType ===
        "number"
    ) {

        const numericValues =
            nonBlankValues
                .map(
                    function (value) {

                        if (
                            typeof value ===
                            "number"
                        ) {

                            return value;

                        }


                        return Number(
                            String(value)
                                .replace(
                                    /[â‚¹$Â£â‚¬Â¥,%\s,]/g,
                                    ""
                                )
                                .trim()
                        );

                    }
                )
                .filter(
                    function (value) {

                        return Number.isFinite(
                            value
                        );

                    }
                );


        if (
            numericValues.length > 0
        ) {

            minimum =
                Math.min.apply(
                    null,
                    numericValues
                );


            maximum =
                Math.max.apply(
                    null,
                    numericValues
                );

        }

    }


    return {

        totalCount:
            totalCount,

        nonBlankCount:
            nonBlankCount,

        blankCount:
            blankCount,

        blankPercent:
            blankPercent,

        validCount:
            validCount,

        invalidCount:
            invalidCount,

        invalidPercent:
            invalidPercent,

        uniqueCount:
            uniqueCount,

        cardinalityPercent:
            cardinalityPercent,

        min:
            minimum,

        max:
            maximum

    };

}

// ============================================================
// POWER DASHBOARD DUPLICATE ROW DETECTION
// ============================================================

function calculatePowerDashboardDuplicateRows(
    rows
) {

    const rawRows =
        Array.isArray(rows)
            ? rows
            : [];


    const seenRows =
        new Map();


    const duplicateRowIndexes =
        [];


    let duplicateRowCount =
        0;


    rawRows.forEach(
        function (row, rowIndex) {

            const normalizedRow =
                Array.isArray(row)
                    ? row.map(
                        function (value) {

                            if (
                                value === null ||
                                value === undefined
                            ) {

                                return "";

                            }


                            if (
                                typeof value ===
                                "string"
                            ) {

                                return value.trim();

                            }


                            if (
                                value instanceof Date
                            ) {

                                return value.toISOString();

                            }


                            return value;

                        }
                    )
                    : [];


            const rowKey =
                JSON.stringify(
                    normalizedRow
                );


            if (
                seenRows.has(
                    rowKey
                )
            ) {

                duplicateRowCount += 1;


                duplicateRowIndexes.push(
                    rowIndex
                );

            } else {

                seenRows.set(
                    rowKey,
                    rowIndex
                );

            }

        }
    );


    return {

        totalRows:
            rawRows.length,

        uniqueRowCount:
            rawRows.length -
            duplicateRowCount,

        duplicateRowCount:
            duplicateRowCount,

        duplicateRowIndexes:
            duplicateRowIndexes

    };

}

// ============================================================
// POWER DASHBOARD DATA QUALITY WARNINGS
// ============================================================

function createPowerDashboardDataQualityWarnings(
    columnDefinitions,
    duplicateRowAnalysis
) {

    const columns =
        Array.isArray(columnDefinitions)
            ? columnDefinitions
            : [];


    const duplicateInfo =
        duplicateRowAnalysis || {};


    const warnings =
        [];


    // --------------------------------------------------------
    // COLUMN LEVEL WARNINGS
    // --------------------------------------------------------

    columns.forEach(
        function (column) {

            const columnName =
                String(
                    column &&
                    column.name
                        ? column.name
                        : "Unknown Column"
                );


            const stats =
                column &&
                column.stats
                    ? column.stats
                    : {};


            const semanticType =
                String(
                    column &&
                    column.semanticType
                        ? column.semanticType
                        : column &&
                          column.type
                            ? column.type
                            : ""
                ).toLowerCase();


            const blankCount =
                Number(
                    stats.blankCount || 0
                );


            const blankPercent =
                Number(
                    stats.blankPercent || 0
                );


            const invalidCount =
                Number(
                    stats.invalidCount || 0
                );


            const invalidPercent =
                Number(
                    stats.invalidPercent || 0
                );


            const uniqueCount =
                Number(
                    stats.uniqueCount || 0
                );


            const cardinalityPercent =
                Number(
                    stats.cardinalityPercent || 0
                );


            const nonBlankCount =
                Number(
                    stats.nonBlankCount || 0
                );


            // ------------------------------------------------
            // COMPLETELY BLANK COLUMN
            // ------------------------------------------------

            if (
                nonBlankCount === 0
            ) {

                warnings.push({

                    code:
                        "EMPTY_COLUMN",

                    severity:
                        "error",

                    scope:
                        "column",

                    column:
                        columnName,

                    message:
                        columnName +
                        " is completely blank."

                });


                return;

            }


            // ------------------------------------------------
            // BLANK VALUES
            // ------------------------------------------------

            if (
                blankCount > 0
            ) {

                warnings.push({

                    code:
                        "BLANK_VALUES",

                    severity:
                        blankPercent >= 20
                            ? "error"
                            : "warning",

                    scope:
                        "column",

                    column:
                        columnName,

                    count:
                        blankCount,

                    percent:
                        blankPercent,

                    message:
                        columnName +
                        " contains " +
                        blankCount +
                        " blank value" +
                        (
                            blankCount === 1
                                ? ""
                                : "s"
                        ) +
                        " (" +
                        blankPercent +
                        "%)."

                });

            }


            // ------------------------------------------------
            // INVALID VALUES
            // ------------------------------------------------

            if (
                invalidCount > 0
            ) {

                warnings.push({

                    code:
                        "INVALID_VALUES",

                    severity:
                        invalidPercent >= 10
                            ? "error"
                            : "warning",

                    scope:
                        "column",

                    column:
                        columnName,

                    count:
                        invalidCount,

                    percent:
                        invalidPercent,

                    message:
                        columnName +
                        " contains " +
                        invalidCount +
                        " invalid value" +
                        (
                            invalidCount === 1
                                ? ""
                                : "s"
                        ) +
                        " (" +
                        invalidPercent +
                        "%)."

                });

            }


            // ------------------------------------------------
            // POSSIBLE DUPLICATE IDENTIFIER
            // ------------------------------------------------

            if (
                semanticType ===
                    "id" &&
                uniqueCount <
                    nonBlankCount
            ) {

                const duplicateIdCount =
                    nonBlankCount -
                    uniqueCount;


                warnings.push({

                    code:
                        "DUPLICATE_ID_VALUES",

                    severity:
                        "warning",

                    scope:
                        "column",

                    column:
                        columnName,

                    count:
                        duplicateIdCount,

                    message:
                        columnName +
                        " contains " +
                        duplicateIdCount +
                        " repeated identifier value" +
                        (
                            duplicateIdCount === 1
                                ? ""
                                : "s"
                        ) +
                        "."

                });

            }


            // ------------------------------------------------
            // HIGH CARDINALITY CATEGORY
            // ------------------------------------------------

            if (
                semanticType ===
                    "category" &&
                nonBlankCount >= 20 &&
                cardinalityPercent >= 80
            ) {

                warnings.push({

                    code:
                        "HIGH_CARDINALITY_CATEGORY",

                    severity:
                        "info",

                    scope:
                        "column",

                    column:
                        columnName,

                    percent:
                        cardinalityPercent,

                    message:
                        columnName +
                        " has high cardinality (" +
                        cardinalityPercent +
                        "% unique values)."

                });

            }

        }
    );


    // --------------------------------------------------------
    // DATASET LEVEL â€” DUPLICATE ROWS
    // --------------------------------------------------------

    const duplicateRowCount =
        Number(
            duplicateInfo
                .duplicateRowCount || 0
        );


    if (
        duplicateRowCount > 0
    ) {

        warnings.push({

            code:
                "DUPLICATE_ROWS",

            severity:
                "warning",

            scope:
                "dataset",

            count:
                duplicateRowCount,

            message:
                "Dataset contains " +
                duplicateRowCount +
                " duplicate row" +
                (
                    duplicateRowCount === 1
                        ? ""
                        : "s"
                ) +
                "."

        });

    }


    // --------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------

    const errorCount =
        warnings.filter(
            function (warning) {

                return (
                    warning.severity ===
                    "error"
                );

            }
        ).length;


    const warningCount =
        warnings.filter(
            function (warning) {

                return (
                    warning.severity ===
                    "warning"
                );

            }
        ).length;


    const infoCount =
        warnings.filter(
            function (warning) {

                return (
                    warning.severity ===
                    "info"
                );

            }
        ).length;


    let qualityStatus =
        "good";


    if (
        errorCount > 0
    ) {

        qualityStatus =
            "poor";

    } else if (
        warningCount > 0
    ) {

        qualityStatus =
            "warning";

    }


    return {

        status:
            qualityStatus,

        totalWarnings:
            warnings.length,

        errorCount:
            errorCount,

        warningCount:
            warningCount,

        infoCount:
            infoCount,

        warnings:
            warnings

    };

}


// ============================================================
// POWER DASHBOARD SEMANTIC TYPE DETECTION
// ============================================================

function detectPowerDashboardSemanticType(
    columnName,
    detectedType,
    values,
    numberFormats,
    stats
) {

    const normalizedName =
        String(
            columnName || ""
        )
            .trim()
            .toLowerCase();


    const rawValues =
        Array.isArray(values)
            ? values
            : [];


    const formats =
        Array.isArray(numberFormats)
            ? numberFormats
            : [];


    const columnStats =
        stats || {};


    // --------------------------------------------------------
    // BLANK
    // --------------------------------------------------------

    if (
        detectedType ===
        "blank"
    ) {

        return "blank";

    }


    // --------------------------------------------------------
    // DATE
    // --------------------------------------------------------

    if (
        detectedType ===
        "date"
    ) {

        return "date";

    }


    // --------------------------------------------------------
    // ID / CODE
    // --------------------------------------------------------

    const idNamePattern =
        /(^|[\s_\-])(id|code|sku|ref|reference|invoice|order\s*id|customer\s*id|product\s*id|employee\s*id|transaction\s*id)([\s_\-]|$)/i;


    if (
        idNamePattern.test(
            normalizedName
        )
    ) {

        return "id";

    }


    const numberIdentifierPattern =
        /(^|[\s_\-])(order|invoice|account|customer|product|employee|transaction)[\s_\-]*(no|number)([\s_\-]|$)/i;


    if (
        numberIdentifierPattern.test(
            normalizedName
        )
    ) {

        return "id";

    }


    // --------------------------------------------------------
    // CURRENCY
    // --------------------------------------------------------

    const hasCurrencyFormat =
        formats.some(
            function (format) {

                const formatText =
                    String(
                        format || ""
                    );

                return (
                    formatText.indexOf("â‚¹") !== -1 ||
                    formatText.indexOf("$") !== -1 ||
                    formatText.indexOf("Â£") !== -1 ||
                    formatText.indexOf("â‚¬") !== -1 ||
                    formatText.indexOf("Â¥") !== -1 ||
                    /\[\$[^\]]*\]/i.test(
                        formatText
                    )
                );

            }
        );


    const currencyNamePattern =
        /(sales|revenue|profit|cost|price|amount|income|expense|turnover|value|balance|payment|salary|wage)/i;


    if (
        detectedType ===
            "number" &&
        (
            hasCurrencyFormat ||
            currencyNamePattern.test(
                normalizedName
            )
        )
    ) {

        return "currency";

    }


    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (
        detectedType ===
        "text"
    ) {

        const uniqueCount =
            Number(
                columnStats.uniqueCount || 0
            );


        const nonBlankCount =
            Number(
                columnStats.nonBlankCount || 0
            );


        const cardinalityPercent =
            Number(
                columnStats.cardinalityPercent || 0
            );


        const categoryNamePattern =
            /(category|state|zone|region|country|city|department|segment|status|type|class|group|product|brand|channel|gender)/i;


        if (
            categoryNamePattern.test(
                normalizedName
            )
        ) {

            return "category";

        }


        if (
            nonBlankCount > 0 &&
            (
                uniqueCount <= 30 ||
                cardinalityPercent <= 50
            )
        ) {

            return "category";

        }

    }


    // --------------------------------------------------------
    // NUMBER
    // --------------------------------------------------------

    if (
        detectedType ===
        "number"
    ) {

        return "number";

    }


    // --------------------------------------------------------
    // TEXT
    // --------------------------------------------------------

    return "text";

}


// ============================================================
// CREATE POWER DASHBOARD WORKBOOK
// PHASE 1 WORKING BUILD
// ============================================================

async function createPowerDashboardWorkbook(
    config,
    onProgress
) {

    function reportDashboardProgress(
        percent,
        stage,
        title,
        detail
    ) {

        if (
            typeof onProgress !==
            "function"
        ) {
            return;
        }

        try {

            onProgress({
                percent:
                    percent,

                stage:
                    stage,

                title:
                    title,

                detail:
                    detail || ""
            });

        }
        catch (progressError) {

            console.warn(
                "Dashboard progress callback failed:",
                progressError
            );

        }

    }

    // ============================================================
// SAFE REPLACEMENT BUILD / BACKUP IDENTIFIERS
//
// Function scope is required so failed Excel.run builds can
// be cleaned up or rolled back safely.
// ============================================================

const dashboardBuildToken =
    String(Date.now());

const stagedDashboardSheetName =
    "HXLT_Dash_" +
    dashboardBuildToken;

const stagedBackendSheetName =
    "HXLT_Back_" +
    dashboardBuildToken;

const stagedSettingsSheetName =
    "HXLT_Set_" +
    dashboardBuildToken;

const stagedBackendTableName =
    "HXLTBuildTable_" +
    dashboardBuildToken;

const backupDashboardSheetName =
    "HXLT_Old_Dash_" +
    dashboardBuildToken;

const backupBackendSheetName =
    "HXLT_Old_Back_" +
    dashboardBuildToken;

const backupSettingsSheetName =
    "HXLT_Old_Set_" +
    dashboardBuildToken;

const backupBackendTableName =
    "HXLTOldTable_" +
    dashboardBuildToken;


    reportDashboardProgress(
        3,
        "starting",
        "Starting Dashboard Builder",
        "Preparing dashboard configuration..."
    );

    return Excel.run(
        async function (context) {

            const workbook =
                context.workbook;


            // ============================================================
            // 1. LOCK SOURCE RANGE FROM DASHBOARD STUDIO
            // ============================================================

            const configuredRange =
                String(
                    config.dataRange || ""
                ).trim();


            if (
                !configuredRange ||
                configuredRange.indexOf("!") === -1
            ) {

                throw new Error(
                    "Dashboard source range is missing. Please select Excel data again."
                );

            }


            const separatorIndex =
                configuredRange.lastIndexOf("!");


            let sourceSheetName =
                configuredRange
                    .substring(
                        0,
                        separatorIndex
                    )
                    .trim();


            const sourceAddress =
                configuredRange
                    .substring(
                        separatorIndex + 1
                    )
                    .trim();


            if (
                sourceSheetName.startsWith("'") &&
                sourceSheetName.endsWith("'")
            ) {

                sourceSheetName =
                    sourceSheetName
                        .substring(
                            1,
                            sourceSheetName.length - 1
                        )
                        .replace(
                            /''/g,
                            "'"
                        );

            }


            const sourceSheet =
                workbook.worksheets
                    .getItem(
                        sourceSheetName
                    );


            const sourceRange =
                sourceSheet.getRange(
                    sourceAddress
                );


            sourceSheet.load("name");


            sourceRange.load([
                "values",
                "text",
                "rowCount",
                "columnCount",
                "address"
            ]);


            await context.sync();


            if (
                sourceRange.rowCount < 2
            ) {

                throw new Error(
                    "Dashboard source must contain headers and at least one data row."
                );

            }


            const sourceValues =
                sourceRange.values || [];

            const headers =
                sourceValues[0] || [];


                        const normalizedHeaders =
                headers.map(function (header) {
                    return String(header || "")
                        .trim()
                        .toLowerCase();
                });

            if (
                normalizedHeaders.some(function (header) {
                    return header === "";
                })
            ) {
                throw new Error(
                    "Dashboard source contains a blank header. " +
                    "Give every source column a name before building."
                );
            }

            const duplicateHeader =
                normalizedHeaders.find(function (header, index) {
                    return normalizedHeaders.indexOf(header) !== index;
                });

            if (duplicateHeader) {
                throw new Error(
                    "Dashboard source contains duplicate header: " +
                    duplicateHeader +
                    ". Rename duplicate columns before building."
                );
            }


            // ============================================================
// 1B. DASHBOARD CONFIGURATION PREFLIGHT
// Dashboard sheets à¤¤à¤¯à¤¾à¤° à¤•à¤°à¤£à¥à¤¯à¤¾à¤†à¤§à¥€ à¤ªà¥à¤°à¤¤à¥à¤¯à¥‡à¤• configured source
// column à¤…à¤¸à¥à¤¤à¤¿à¤¤à¥à¤µà¤¾à¤¤ à¤†à¤¹à¥‡ à¤•à¤¾ à¤¤à¥‡ verify à¤•à¤°à¤¾.
// ============================================================

function hasSourceHeader(columnName) {
    const normalized = String(columnName || "")
        .trim()
        .toLowerCase();

    return normalized !== "" &&
        normalizedHeaders.indexOf(normalized) !== -1;
}


function requireSourceHeader(columnName, ownerLabel) {
    if (!hasSourceHeader(columnName)) {
        throw new Error(
            ownerLabel +
            ' references missing source column "' +
            String(columnName || "") +
            '". Refresh the source range or update the dashboard object.'
        );
    }
}


const preflightKpis = Array.isArray(config.kpis)
    ? config.kpis
    : [];

const preflightCharts = Array.isArray(config.charts)
    ? config.charts
    : [];

const preflightSlicers = Array.isArray(config.slicers)
    ? config.slicers
    : [];

const preflightTables = Array.isArray(config.tables)
    ? config.tables
    : [];


preflightKpis.forEach(function (kpi, index) {
    if (!kpi || typeof kpi !== "object") {
        throw new Error(
            "KPI " + (index + 1) +
            " configuration is invalid."
        );
    }

    requireSourceHeader(
        kpi.column,
        "KPI " + (index + 1)
    );
});


preflightCharts.forEach(function (chart, index) {
    if (!chart || typeof chart !== "object") {
        throw new Error(
            "Chart " + (index + 1) +
            " configuration is invalid."
        );
    }

    requireSourceHeader(
        chart.xAxis,
        "Chart " + (index + 1) + " X-axis"
    );

    requireSourceHeader(
        chart.yAxis,
        "Chart " + (index + 1) + " Y-axis"
    );

    if (
        String(
            chart.secondaryYAxis || ""
        ).trim()
    ) {

        requireSourceHeader(
            chart.secondaryYAxis,
            "Chart " +
            (index + 1) +
            " secondary Y-axis"
        );

    }
});


preflightSlicers.forEach(function (slicer, index) {
    if (!slicer || typeof slicer !== "object") {
        throw new Error(
            "Slicer " + (index + 1) +
            " configuration is invalid."
        );
    }

    requireSourceHeader(
        slicer.column,
        "Slicer " + (index + 1)
    );
});


preflightTables.forEach(function (table, index) {
    if (!table || typeof table !== "object") {
        throw new Error(
            "Table " + (index + 1) +
            " configuration is invalid."
        );
    }

    requireSourceHeader(
        table.groupColumn,
        "Table " + (index + 1) + " group"
    );

    requireSourceHeader(
        table.valueColumn,
        "Table " + (index + 1) + " value"
    );
});


                        // ============================================================
            // 2. VERIFY OWNERSHIP + DELETE OLD GENERATED DASHBOARD SHEETS
            // ============================================================

            const generatedSheets = [
                "Dashboard",
                "Dash_Backend",
                "Dash_Settings"
            ];

            // ------------------------------------------------------------
// PHASE 9 TEMP - WORKBOOK SHEET DIAGNOSTIC
// ------------------------------------------------------------

const phase9WorkbookSheets =
    workbook.worksheets;

phase9WorkbookSheets.load(
    "items/name,items/visibility"
);

await context.sync();

const phase9WorkbookSheetInfo =
    phase9WorkbookSheets.items.map(
        function (sheet) {

            return (
                sheet.name +
                " [" +
                sheet.visibility +
                "]"
            );

        }
    );

console.log(
    "[PHASE 9] Workbook sheets:",
    phase9WorkbookSheetInfo
);


            // ------------------------------------------------------------
            // SAFETY GUARD:
            // Never allow a generated dashboard sheet to be used as source.
            // ------------------------------------------------------------

            const sourceIsGeneratedSheet =
                generatedSheets.some(function (sheetName) {
                    return sheetName.toLowerCase() ===
                        sourceSheet.name.toLowerCase();
                });

            if (sourceIsGeneratedSheet) {
                throw new Error(
                    "The selected source is a dashboard output sheet. " +
                    "Select the original data worksheet and build again."
                );
            }

            // ------------------------------------------------------------
            // LOAD EXISTING GENERATED SHEETS
            // ------------------------------------------------------------

            const existingGeneratedSheetObjects =
                generatedSheets.map(function (sheetName) {

                    const sheet =
                        workbook.worksheets
                            .getItemOrNullObject(
                                sheetName
                            );

                    sheet.load(
                        "name,isNullObject,visibility"
                    );

                    return {
                        name: sheetName,
                        sheet: sheet
                    };
                });

            await context.sync();

            let existingGeneratedSheets =
                existingGeneratedSheetObjects.filter(
                    function (entry) {
                        return !entry.sheet.isNullObject;
                    }
                );

            // ------------------------------------------------------------
            // OWNERSHIP VALIDATION
            //
            // If any Dashboard / Dash_Backend / Dash_Settings sheet already
            // exists, deletion is allowed ONLY when Dash_Settings!D1 contains
            // the Himanshu XL Tools ownership marker.
            // ------------------------------------------------------------

            if (
    existingGeneratedSheets.length > 0
) {

    const settingsEntry =
        existingGeneratedSheetObjects.find(
            function (entry) {
                return entry.name ===
                    "Dash_Settings";
            }
        );


    // ========================================================
    // PHASE 9 - ORPHAN BACKEND RECOVERY
    //
    // A failed/partial previous publish can leave only:
    //
    // Dash_Backend [VeryHidden]
    //
    // while Dashboard and Dash_Settings are missing.
    //
    // We recover ONLY when all of these are true:
    //
    // 1. Dash_Backend is the ONLY generated sheet.
    // 2. It is VeryHidden.
    // 3. It contains the Himanshu XL Tools final backend table:
    //    DashDataTable.
    //
    // Unknown/mixed states remain protected and are NOT deleted.
    // ========================================================

    const orphanBackendEntry =
        (
            existingGeneratedSheets.length === 1 &&
            existingGeneratedSheets[0].name ===
                "Dash_Backend"
        )
            ? existingGeneratedSheets[0]
            : null;


    const isBackendOnlyOrphanCandidate =
        !!orphanBackendEntry &&
        (
            !settingsEntry ||
            settingsEntry.sheet.isNullObject
        ) &&
        orphanBackendEntry.sheet.visibility ===
            Excel.SheetVisibility.veryHidden;


    if (
        isBackendOnlyOrphanCandidate
    ) {

        const orphanBackendTable =
            orphanBackendEntry
                .sheet
                .tables
                .getItemOrNullObject(
                    "DashDataTable"
                );

        orphanBackendTable.load(
            "name,isNullObject"
        );

        await context.sync();


        if (
            !orphanBackendTable.isNullObject
        ) {

            console.warn(
    "[PHASE 9] Recovering verified orphan Dash_Backend from a previous incomplete build."
);


// ------------------------------------------------------------
// PHASE 9 - SAFE ORPHAN BACKEND DELETE
//
// Dash_Backend may be VeryHidden after an interrupted publish.
// Restore it to Visible first, commit that state, and only then
// delete the verified orphan worksheet.
//
// This avoids deleting the worksheet while it is still in its
// internal VeryHidden state.
// ------------------------------------------------------------

orphanBackendEntry.sheet.visibility =
    Excel.SheetVisibility.visible;

await context.sync();


orphanBackendEntry.sheet.delete();

await context.sync();


// The orphan has been removed.
// Treat this as a clean workbook for the new build.
existingGeneratedSheets = [];

        }
        else {

            throw new Error(
                "A Dash_Backend sheet exists, but it could not be verified " +
                "as a Himanshu XL Tools orphan backend. " +
                "No existing sheets were deleted."
            );

        }

    }
    else {

        // ====================================================
        // NORMAL OWNED DASHBOARD VALIDATION
        // ====================================================

        if (
            !settingsEntry ||
            settingsEntry.sheet.isNullObject
        ) {

            throw new Error(
                "Dashboard-named sheets already exist, but their " +
                "Himanshu XL Tools ownership could not be verified. " +
                "No existing sheets were deleted. " +
                "Workbook sheets: " +
                phase9WorkbookSheetInfo.join(" | ")
            );

        }


        const ownershipMarkerRange =
            settingsEntry.sheet
                .getRange(
                    "D1"
                );


        ownershipMarkerRange.load(
            "values"
        );

        await context.sync();


        const ownershipMarker =
            String(
                (
                    ownershipMarkerRange.values &&
                    ownershipMarkerRange.values[0] &&
                    ownershipMarkerRange.values[0][0]
                ) ||
                ""
            ).trim();


        if (
            ownershipMarker !==
            "HXLT_PROJECT_CONFIG"
        ) {

            throw new Error(
                "Existing Dashboard sheets are not owned by " +
                "Himanshu XL Tools. " +
                "No existing sheets were deleted."
            );

        }


        // ----------------------------------------------------
        // OWNERSHIP CONFIRMED
        //
        // Existing owned dashboard remains alive until the new
        // staged dashboard has been built successfully.
        // ----------------------------------------------------

    }

}

                
            // ============================================================
            // 3. CREATE DASHBOARD SHEETS
            // ============================================================

            const dashboardSheet =
                workbook.worksheets.add(
                    stagedDashboardSheetName
                );


            const backendSheet =
                workbook.worksheets.add(
                    stagedBackendSheetName
                );


            const settingsSheet =
                workbook.worksheets.add(
                    stagedSettingsSheetName
                );


            // ============================================================
            // 4. COPY SOURCE DATA INTO BACKEND
            // ============================================================

            const backendRange =
                backendSheet.getRangeByIndexes(
                    0,
                    0,
                    sourceRange.rowCount,
                    sourceRange.columnCount
                );


            backendRange.values =
                sourceValues;


            const backendTable =
                backendSheet.tables.add(
                    backendRange,
                    true
                );


            backendTable.name =
                stagedBackendTableName;


            backendRange.format.autofitColumns();


            // ============================================================
            // 5. IDENTIFY IMPORTANT COLUMNS
            // ============================================================

            function findColumnByNames(
                candidates
            ) {

                const normalizedCandidates =
                    candidates.map(
                        function (name) {

                            return String(name)
                                .toLowerCase()
                                .replace(
                                    /[^a-z0-9]/g,
                                    ""
                                );

                        }
                    );


                for (
                    let i = 0;
                    i < headers.length;
                    i++
                ) {

                    const normalizedHeader =
                        String(
                            headers[i] || ""
                        )
                            .toLowerCase()
                            .replace(
                                /[^a-z0-9]/g,
                                ""
                            );


                    if (
                        normalizedCandidates.includes(
                            normalizedHeader
                        )
                    ) {

                        return i;

                    }

                }


                return -1;

            }


            const dateIndex =
                findColumnByNames([
                    "Date",
                    "Order Date",
                    "Sales Date"
                ]);


            const zoneIndex =
                findColumnByNames([
                    "Zone",
                    "Region"
                ]);


            const stateIndex =
                findColumnByNames([
                    "State"
                ]);


            const productIndex =
                findColumnByNames([
                    "Product",
                    "Product Name"
                ]);


            const customerIndex =
                findColumnByNames([
                    "Customer",
                    "Customer Name"
                ]);


            const quantityIndex =
                findColumnByNames([
                    "Quantity",
                    "Qty"
                ]);


            const grossSalesIndex =
                findColumnByNames([
                    "Gross Sales",
                    "GrossSales"
                ]);


            const netSalesIndex =
                findColumnByNames([
                    "Net Sales",
                    "NetSales",
                    "Sales"
                ]);


            const profitIndex =
                findColumnByNames([
                    "Profit",
                    "Total Profit"
                ]);


            // ============================================================
            // 6. HELPER FUNCTIONS
            // ============================================================

            function sumNumericColumn(
                columnIndex
            ) {

                if (
                    columnIndex < 0
                ) {

                    return 0;

                }


                let total = 0;


                for (
                    let row = 1;
                    row <
                    sourceValues.length;
                    row++
                ) {

                    const value =
                        sourceValues[
                            row
                        ][
                            columnIndex
                        ];


                    if (
                        typeof value ===
                        "number"
                    ) {

                        total += value;

                    }
                    else {

                        const parsed =
                            Number(value);


                        if (
                            !Number.isNaN(
                                parsed
                            )
                        ) {

                            total += parsed;

                        }

                    }

                }


                return total;

            }


            function uniqueCount(
                columnIndex
            ) {

                if (
                    columnIndex < 0
                ) {

                    return 0;

                }


                const values =
                    new Set();


                for (
                    let row = 1;
                    row <
                    sourceValues.length;
                    row++
                ) {

                    const value =
                        sourceValues[
                            row
                        ][
                            columnIndex
                        ];


                    if (
                        value !== null &&
                        value !== undefined &&
                        String(value).trim() !== ""
                    ) {

                        values.add(
                            String(value).trim()
                        );

                    }

                }


                return values.size;

            }


            function formatNumber(
                value
            ) {

                return Number(
                    value || 0
                ).toLocaleString(
                    "en-IN"
                );

            }


            function getCurrencySymbol() {

                switch (
                    String(
                        config.currency ||
                        "INR"
                    ).toUpperCase()
                ) {

                    case "USD":
                        return "$";

                    case "EUR":
                        return "â‚¬";

                    case "GBP":
                        return "Â£";

                    default:
                        return "â‚¹";

                }

            }


function writeKpiCard(
    rangeAddress,
    title,
    value,
    formatType,
    formula
) {

    const cardRange =
        dashboardSheet
            .getRange(
                rangeAddress
            );


    cardRange.merge();


    const cell =
        cardRange.getCell(
            0,
            0
        );

    const hasFormula =
    typeof formula === "string" &&
    formula.trim() !== "";


    const normalizedFormat =
        String(
            formatType || "Auto"
        ).toLowerCase();


    let formattedValue =
        formatNumber(value);


    if (
        normalizedFormat ===
        "currency"
    ) {

        formattedValue =
            getCurrencySymbol() +
            " " +
            formatNumber(value);

    }
    else if (
        normalizedFormat ===
        "percentage"
    ) {

        formattedValue =
            Number(value || 0)
                .toLocaleString(
                    "en-IN",
                    {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2
                    }
                ) +
            "%";

    }
    else if (
        normalizedFormat ===
        "number"
    ) {

        formattedValue =
            formatNumber(value);

    }


    const normalizedKpiTitle =
    String(
        title ||
        "KPI"
    )
        .trim()
        .toUpperCase();


    if (
    hasFormula
) {

    const formulaValue =
        formula.replace(
            /^=/,
            ""
        );

    let displayFormula =
        '="' +
        normalizedKpiTitle +
        '"&CHAR(10)&CHAR(10)&TEXT((' +
        formulaValue +
        '),"#,##0.00")';


    if (
        normalizedFormat ===
        "currency"
    ) {

        displayFormula =
            '="' +
            normalizedKpiTitle +
            '"&CHAR(10)&CHAR(10)&"' +
            getCurrencySymbol() +
            ' "&TEXT((' +
            formulaValue +
            '),"#,##0.00")';

    }
    else if (
        normalizedFormat ===
        "percentage"
    ) {

        displayFormula =
            '="' +
            normalizedKpiTitle +
            '"&CHAR(10)&CHAR(10)&TEXT((' +
            formulaValue +
            '),"0.00")&"%"';

    }


    cell.formulas = [[
    displayFormula
]];

}
else {

    cell.values = [[
    normalizedKpiTitle +
    "\n" +
    formattedValue
]];

}


        const kpiStyle =
        String(
            config.kpiStyle ||
            "Modern Cards"
        ).toLowerCase();


    const dashboardBackground =
        String(
            config.background ||
            "Light"
        ).toLowerCase();


    let kpiFillColor =
    "#FFFFFF";

let kpiFontColor =
    "#163A5F";


// Web-like Excel dashboard:
// keep KPI cards clean and readable on every theme.
if (
    dashboardBackground ===
    "dark"
) {

    kpiFillColor =
        "#FFFFFF";

    kpiFontColor =
        "#163A5F";

}


   let kpiFontSize =
    detectedCanvasPreset ===
        "compact"
        ? 11
        : (
            detectedCanvasPreset ===
                "wide"
                ? 14
                : 13
        );


if (
    kpiStyle ===
    "flat cards"
) {

    kpiFontSize =
        11;

}
else if (
    kpiStyle ===
    "compact cards"
) {

    kpiFontSize =
        10;

}


    cardRange.format.fill.color =
        kpiFillColor;


    cardRange.format.font.bold =
        true;


    cardRange.format.font.size =
        kpiFontSize;


    cardRange.format.font.color =
        kpiFontColor;


    cardRange.format
    .horizontalAlignment =
    "Center";


    cardRange.format
        .verticalAlignment =
        "Center";


    cardRange.format.wrapText =
        true;

    const normalizedTitle =
    String(
        title || ""
    ).toLowerCase();


let accentColor =
    "#8B5CF6";


if (
    normalizedTitle.includes(
        "gross"
    )
) {

    accentColor =
        "#3B82F6";

}
else if (
    normalizedTitle.includes(
        "profit"
    )
) {

    accentColor =
        "#22C55E";

}
else if (
    normalizedTitle.includes(
        "order"
    )
) {

    accentColor =
        "#A855F7";

}
else if (
    normalizedTitle.includes(
        "customer"
    )
) {

    accentColor =
        "#06B6D4";

}
else if (
    normalizedTitle.includes(
        "quantity"
    )
) {

    accentColor =
        "#F59E0B";

}    

    const borders =
        cardRange.format.borders;


    [
        "EdgeTop",
        "EdgeBottom",
        "EdgeLeft",
        "EdgeRight"
    ].forEach(
        function (borderName) {

            const border =
                borders.getItem(
                    borderName
                );

                        border.style =
                "Continuous";

            border.color =
    dashboardBackground ===
        "dark"
        ? "#243244"
        : kpiStyle ===
            "flat cards"
            ? "#E5E7EB"
            : "#D7E1E8";

        }
    );

   // ============================================================
// H4 â€” PROFESSIONAL KPI CARD ACCENT
// ============================================================
// Accent strip is always visible â€” Light and Dark dashboards.
// This gives all KPI cards a consistent web-dashboard look.
// ============================================================

const topBorder =
    borders.getItem(
        "EdgeTop"
    );

topBorder.style =
    "Continuous";

topBorder.color =
    accentColor;

topBorder.weight =
    "Medium";


// Clean professional outer border.
[
    "EdgeBottom",
    "EdgeLeft",
    "EdgeRight"
].forEach(
    function (borderName) {

        const border =
            borders.getItem(
                borderName
            );

        border.style =
            "Continuous";

        border.color =
            "#D7E1E8";

        border.weight =
            "Thin";
    }
);

}

            // ============================================================
// FILTER-AWARE KPI FORMULA ENGINE
//
// Native Excel slicers filter the backend table.
// SUBTOTAL recalculates using only visible filtered rows.
// ============================================================

     


            // ============================================================
// FILTER-AWARE KPI FORMULA ENGINE
//
// Native Excel slicers filter the backend table.
// SUBTOTAL recalculates using only visible filtered rows.
// ============================================================

function createDashboardKpiFormula(
    kpi
) {

    const columnName =
        String(
            kpi.column || ""
        ).trim();

    const aggregation =
        String(
            kpi.aggregation || "SUM"
        ).trim().toUpperCase();

    if (!columnName) {
        return "";
    }


    const escapedColumnName =
        columnName.replace(
            /]/g,
            "]]"
        );


    const tableReference =
        stagedBackendTableName +
        "[" +
        escapedColumnName +
        "]";


    let subtotalCode = null;


    switch (aggregation) {

        case "SUM":
            subtotalCode = 109;
            break;

        case "AVERAGE":
            subtotalCode = 101;
            break;

        case "COUNT":
            subtotalCode = 102;
            break;

        case "COUNTA":
            subtotalCode = 103;
            break;

        case "MIN":
            subtotalCode = 105;
            break;

        case "MAX":
            subtotalCode = 104;
            break;

        default:
            return "";
    }


    return (
        "=SUBTOTAL(" +
        subtotalCode +
        "," +
        tableReference +
        ")"
    );
}


            // ============================================================
            // DYNAMIC KPI CALCULATION ENGINE
            // ============================================================

function calculateDashboardKpi(kpi) {

    const columnName =
        String(
            kpi.column || ""
        ).trim();

    const aggregation =
        String(
            kpi.aggregation || "SUM"
        ).toUpperCase();

    const columnIndex =
        headers.findIndex(
            function (header) {

                return (
                    String(header)
                        .trim()
                        .toLowerCase() ===
                    columnName
                        .toLowerCase()
                );

            }
        );


    if (columnIndex < 0) {

        console.warn(
            "KPI column not found:",
            columnName
        );

        return 0;
    }


    const values = [];

    for (
        let rowIndex = 1;
        rowIndex < sourceValues.length;
        rowIndex++
    ) {

        const value =
            sourceValues[
                rowIndex
            ][
                columnIndex
            ];

        values.push(
            value
        );

    }


    const numericValues =
        values.filter(
            function (value) {

                return (
                    typeof value ===
                    "number" &&
                    Number.isFinite(value)
                );

            }
        );


    switch (aggregation) {

        case "SUM":

            return numericValues.reduce(
                function (
                    total,
                    value
                ) {

                    return (
                        total +
                        value
                    );

                },
                0
            );


        case "AVERAGE":

            if (
                numericValues.length === 0
            ) {

                return 0;

            }

            return (
                numericValues.reduce(
                    function (
                        total,
                        value
                    ) {

                        return (
                            total +
                            value
                        );

                    },
                    0
                ) /
                numericValues.length
            );


        case "COUNT":

            return numericValues.length;


        case "COUNTA":

            return values.filter(
                function (value) {

                    return (
                        value !== null &&
                        value !== undefined &&
                        String(value)
                            .trim() !== ""
                    );

                }
            ).length;


        case "MIN":

            return numericValues.length
                ? Math.min(
                    ...numericValues
                )
                : 0;


        case "MAX":

            return numericValues.length
                ? Math.max(
                    ...numericValues
                )
                : 0;


        case "UNIQUE COUNT":

            return new Set(
                values
                    .filter(
                        function (value) {

                            return (
                                value !== null &&
                                value !== undefined &&
                                String(value)
                                    .trim() !== ""
                            );

                        }
                    )
                    .map(
                        function (value) {

                            return String(
                                value
                            ).trim();

                        }
                    )
            ).size;


        default:

            return 0;

    }

}


            // ============================================================
            // 7. CALCULATE KPI VALUES
            // ============================================================

            const totalNetSales =
                sumNumericColumn(
                    netSalesIndex
                );


            const totalGrossSales =
                sumNumericColumn(
                    grossSalesIndex
                );


            const totalProfit =
                sumNumericColumn(
                    profitIndex
                );


            const totalQuantity =
                sumNumericColumn(
                    quantityIndex
                );


            const totalOrders =
                sourceRange.rowCount - 1;


            const totalCustomers =
                uniqueCount(
                    customerIndex
                );

// ============================================================
// RESPONSIVE DASHBOARD CANVAS ENGINE
// SCREEN -> CANVAS -> LAYOUT
// ============================================================

const dashboardCanvasMode =
    String(
        config.canvasMode ||
        "auto"
    ).toLowerCase();


const dashboardCanvasPreset =
    String(
        config.canvasPreset ||
        "window"
    ).toLowerCase();


// ============================================================
// CONTENT PROFILE
// ============================================================

const configuredKpiCount =
    Array.isArray(config.kpis)
        ? config.kpis.length
        : 0;


const configuredChartCount =
    Array.isArray(config.charts)
        ? config.charts.length
        : 0;


const configuredSlicerCount =
    Array.isArray(config.slicers)
        ? config.slicers.length
        : 0;


const configuredTableCount =
    Array.isArray(config.tables)
        ? config.tables.length
        : 0;

        // ============================================================
// EFFECTIVE DASHBOARD ITEM COUNTS
// ============================================================

// When no custom KPIs exist, the engine creates
// 6 fallback KPI cards.
const effectiveKpiCount =
    configuredKpiCount > 0
        ? Math.min(
            configuredKpiCount,
            12
        )
        : 6;


const dashboardContentScore =
    (
        configuredKpiCount
    ) +
    (
        configuredChartCount *
        2
    ) +
    (
        configuredSlicerCount *
        1.5
    ) +
    (
        configuredTableCount *
        2
    );


// ============================================================
// EXCEL WINDOW DETECTION
// ============================================================

let detectedWindowWidth =
    0;

let detectedWindowHeight =
    0;

let detectedWindowAspectRatio =
    1.6;

let dashboardScreenProfile =
    "standard";


try {

    if (
        typeof Office !==
            "undefined" &&
        Office.context &&
        Office.context.requirements &&
        Office.context.requirements
            .isSetSupported(
                "ExcelApiDesktop",
                "1.1"
            )
    ) {

        const dashboardActiveWindow =
            context.workbook
                .application
                .activeWindow;


        dashboardActiveWindow.load([
            "usableWidth",
            "usableHeight"
        ]);


        await context.sync();


        detectedWindowWidth =
            Number(
                dashboardActiveWindow
                    .usableWidth ||
                0
            );


        detectedWindowHeight =
            Number(
                dashboardActiveWindow
                    .usableHeight ||
                0
            );


        if (
            detectedWindowWidth > 0 &&
            detectedWindowHeight > 0
        ) {

            detectedWindowAspectRatio =
                detectedWindowWidth /
                detectedWindowHeight;

        }


        if (
            detectedWindowAspectRatio >=
            1.75
        ) {

            dashboardScreenProfile =
                "wide";

        }
        else if (
            detectedWindowAspectRatio <
            1.35
        ) {

            dashboardScreenProfile =
                "compact";

        }
        else {

            dashboardScreenProfile =
                "standard";

        }

    }

}
catch (
    dashboardWindowDetectionError
) {

    console.warn(
        "Dashboard window detection failed:",
        dashboardWindowDetectionError
    );

}


// ============================================================
// LAYOUT PROFILE
// ============================================================

// ============================================================
// HYBRID DASHBOARD â€” FIXED EXCEL CANVAS
// ============================================================
// View Dashboard remains responsive.
// Excel Dashboard uses one stable professional geometry.
// ============================================================

let detectedCanvasPreset =
    "wide";

const useFixedExcelDashboardCanvas =
    true;


// ============================================================
// DEFAULT / MANUAL CANVAS
// ============================================================

let dashboardCanvasStart =
    String(
        config.canvasStartCell ||
        "B2"
    )
        .trim()
        .toUpperCase();


let dashboardCanvasEnd =
    String(
        config.canvasEndCell ||
        "Y55"
    )
        .trim()
        .toUpperCase();


const dashboardCanvasLocked =
    config.lockCanvas !== false;


// ============================================================
// AUTO SCREEN-BASED CANVAS
// ============================================================

if (
    dashboardCanvasMode ===
    "auto"
) {

    dashboardCanvasStart =
        "B2";


    // Physical Excel dimensions used later
    // by the final formatting engine.

let autoColumnWidth =
    28;

let autoRowHeight =
    16;

let targetReadableZoom =
    0.78;


if (
    detectedCanvasPreset ===
    "wide"
) {

    autoColumnWidth =
        24;

    targetReadableZoom =
        0.74;

}
else if (
    detectedCanvasPreset ===
    "compact"
) {

    autoColumnWidth =
        32;

    targetReadableZoom =
        0.84;

}


    // Safe fallbacks if Excel window dimensions
    // could not be detected.

    const usableWidth =
        detectedWindowWidth > 0
            ? detectedWindowWidth
            : 900;


    const usableHeight =
        detectedWindowHeight > 0
            ? detectedWindowHeight
            : 480;


    // Calculate the largest physical dashboard
    // that remains readable on this Excel window.

    const targetCanvasWidth =
        (
            usableWidth /
            targetReadableZoom
        ) *
        0.92;


    const targetCanvasHeight =
        (
            usableHeight /
            targetReadableZoom
        ) *
        0.90;


    let autoColumnCount =
        Math.floor(
            targetCanvasWidth /
            autoColumnWidth
        );


    let autoRowCount =
        Math.floor(
            targetCanvasHeight /
            autoRowHeight
        );


    // ========================================================
    // WIDTH LIMITS
    // ========================================================

    // ========================================================
// RESPONSIVE WIDTH LIMITS
// Allow large Excel windows to use their available width.
// ========================================================

if (
    detectedCanvasPreset ===
    "wide"
) {

    // ========================================================
    // STEP 8A.1 â€” PROFESSIONAL WIDE DASHBOARD CANVAS
    // ========================================================
    // The previous 30â€“42 column limit compressed:
    // KPI cards, charts and the right-side slicer rail.
    //
    // Give a content-heavy dashboard enough horizontal space
    // before Excel zoom/readability logic is applied.
    // ========================================================

    const minimumProfessionalWideColumns = 48;
    const maximumProfessionalWideColumns = 60;

    autoColumnCount =
        Math.max(
            minimumProfessionalWideColumns,
            Math.min(
                maximumProfessionalWideColumns,
                autoColumnCount
            )
        );

}
else if (
    detectedCanvasPreset ===
    "compact"
) {

    autoColumnCount =
        Math.max(
            18,
            Math.min(
                26,
                autoColumnCount
            )
        );

}
else {

    autoColumnCount =
        Math.max(
            26,
            Math.min(
                34,
                autoColumnCount
            )
        );

}


    // ========================================================
    // HEIGHT LIMITS
    // This is the important part that prevents 35% zoom.
    // ========================================================

    let minimumRows =
        32;


    if (
        configuredTableCount > 0
    ) {

        minimumRows +=
            4;

    }


    if (
        configuredChartCount >=
        5
    ) {

        minimumRows +=
            3;

    }


    autoRowCount =
        Math.max(
            minimumRows,
            Math.min(
                44,
                autoRowCount
            )
        );


    // ========================================================
    // COLUMN NUMBER -> EXCEL COLUMN NAME
    // ========================================================

    function autoCanvasColumnName(
        columnNumber
    ) {

        let number =
            columnNumber;

        let name =
            "";


        while (
            number > 0
        ) {

            const remainder =
                (
                    number -
                    1
                ) %
                26;


            name =
                String.fromCharCode(
                    65 +
                    remainder
                ) +
                name;


            number =
                Math.floor(
                    (
                        number -
                        1
                    ) /
                    26
                );

        }


        return name;

    }


    // Canvas begins at B2.

    const startColumnNumber =
        2;


    const endColumnNumber =
        startColumnNumber +
        autoColumnCount -
        1;


    const endRowNumber =
        2 +
        autoRowCount -
        1;


    dashboardCanvasEnd =
        autoCanvasColumnName(
            endColumnNumber
        ) +
        String(
            endRowNumber
        );


    console.log(
        "Responsive Auto Canvas:",
        {
            windowWidth:
                detectedWindowWidth,

            windowHeight:
                detectedWindowHeight,

            aspectRatio:
                detectedWindowAspectRatio,

            screenProfile:
                dashboardScreenProfile,

            contentScore:
                dashboardContentScore,

            layout:
                detectedCanvasPreset,

            columns:
                autoColumnCount,

            rows:
                autoRowCount,

            canvas:
                dashboardCanvasStart +
                ":" +
                dashboardCanvasEnd
        }
    );

}


if (
    dashboardCanvasMode !==
"manual" &&
dashboardCanvasMode !==
"auto"
) {

    dashboardCanvasStart =
        "B2";

    switch (
    detectedCanvasPreset
) {

    case "wide":

    dashboardCanvasEnd =
        "AD58";

    break;


case "compact":

    dashboardCanvasEnd =
        "U45";

    break;

        case "16:9":

            dashboardCanvasEnd =
                "Y48";

            break;


        case "4:3":

            dashboardCanvasEnd =
                "U55";

            break;


        case "window":
        default:

            dashboardCanvasEnd =
                "Y55";

            break;

    }

}

            // ============================================================
// HYBRID DASHBOARD â€” FINAL FIXED CANVAS
// ============================================================

if (
    useFixedExcelDashboardCanvas
) {

    dashboardCanvasStart =
        "B2";

    dashboardCanvasEnd =
        "AD58";

}



            // ============================================================
// RESPONSIVE DASHBOARD CANVAS LAYOUT
// ============================================================

function parseDashboardCellAddress(
    address
) {

    const match =
        String(
            address || ""
        )
            .trim()
            .toUpperCase()
            .match(
                /^([A-Z]+)(\d+)$/
            );


    if (!match) {

        return null;

    }


    let columnNumber =
        0;


    for (
        let i = 0;
        i < match[1].length;
        i++
    ) {

        columnNumber =
            (
                columnNumber *
                26
            ) +
            (
                match[1]
                    .charCodeAt(i) -
                64
            );

    }


    return {

        column:
            columnNumber,

        row:
            Number(
                match[2]
            )

    };

}


function dashboardColumnName(
    columnNumber
) {

    let result =
        "";

    let value =
        Math.max(
            1,
            Number(
                columnNumber || 1
            )
        );


    while (
        value > 0
    ) {

        const remainder =
            (
                value - 1
            ) %
            26;

        result =
            String.fromCharCode(
                65 +
                remainder
            ) +
            result;

        value =
            Math.floor(
                (
                    value - 1
                ) /
                26
            );

    }


    return result;

}


function dashboardCellAddress(
    column,
    row
) {

    return (
        dashboardColumnName(
            column
        ) +
        Math.max(
            1,
            row
        )
    );

}


function createDashboardCanvasLayout(
    startAddress,
    endAddress
) {

    let start =
        parseDashboardCellAddress(
            startAddress
        );

    let end =
        parseDashboardCellAddress(
            endAddress
        );


    if (
        !start ||
        !end ||
        end.column <=
            start.column ||
        end.row <=
            start.row
    ) {

        start =
            parseDashboardCellAddress(
                "B2"
            );

        end =
            parseDashboardCellAddress(
                "Y55"
            );

    }


    const totalColumns =
        end.column -
        start.column +
        1;


    const totalRows =
        end.row -
        start.row +
        1;

       let filterWidthRatio =
    0.24;


if (
    detectedCanvasPreset ===
    "wide"
) {

    // Wider rail for 5 slicers on professional dashboards.
    filterWidthRatio =
        0.25;

}
else if (
    detectedCanvasPreset ===
    "compact"
) {

    filterWidthRatio =
        0.28;

}


    // Right-side filter rail:
    // approximately 28% of dashboard width.
    const filterColumns =
    Math.max(
        4,
        Math.round(
            totalColumns *
            filterWidthRatio
        )
    );


    const filterStartColumn =
        end.column -
        filterColumns +
        1;


    const chartAreaStartColumn =
        start.column;


    const chartAreaEndColumn =
        filterStartColumn -
        2;


    const chartAreaColumns =
        chartAreaEndColumn -
        chartAreaStartColumn +
        1;


    const chartGapColumns =
        2;


    const chartColumnWidth =
        Math.max(
            4,
            Math.floor(
                (
                    chartAreaColumns -
                    chartGapColumns
                ) /
                2
            )
        );


    const firstChartStartColumn =
        chartAreaStartColumn;


    const firstChartEndColumn =
        firstChartStartColumn +
        chartColumnWidth -
        1;


    const secondChartStartColumn =
        firstChartEndColumn +
        chartGapColumns +
        1;


    const secondChartEndColumn =
        chartAreaEndColumn;


    // Header + KPI area occupies the
    // first 18 rows relative to canvas.
        
    let maximumKpisPerRow =
    4;


if (
    detectedCanvasPreset ===
    "wide"
) {

    maximumKpisPerRow =
        6;

}
else if (
    detectedCanvasPreset ===
    "compact"
) {

    maximumKpisPerRow =
        3;

}


const actualKpisPerRow =
    Math.max(
        1,
        Math.min(
            effectiveKpiCount,
            maximumKpisPerRow
        )
    );


const kpiRowsUsed =
    Math.max(
        1,
        Math.ceil(
            effectiveKpiCount /
            actualKpisPerRow
        )
    );


const kpiCardRowHeight =
    6;

const kpiRowGap =
    1;


const chartStartRow =
    start.row +
    4 +
    (
        kpiRowsUsed *
        kpiCardRowHeight
    ) +
    (
        (
            kpiRowsUsed -
            1
        ) *
        kpiRowGap
    ) +
    2;


    // ============================================================
// AUTO SMART CHART / TABLE VERTICAL ALLOCATION
// ============================================================

let chartRowCount;


// Custom charts configured à¤…à¤¸à¤¤à¥€à¤² à¤¤à¤°
// actual chart count à¤µà¤¾à¤ªà¤°à¤¾.
if (
    configuredChartCount > 0
) {

    chartRowCount =
        Math.max(
            1,
            Math.min(
                3,
                Math.ceil(
                    configuredChartCount /
                    2
                )
            )
        );

}
else {

    // Preserve existing fallback behaviour
    // when no custom chart configuration exists.
    chartRowCount =
        detectedCanvasPreset ===
            "wide"
            ? 3
            : (
                detectedCanvasPreset ===
                    "compact"
                    ? 1
                    : 2
            );

}


// Reserve lower canvas space when Smart Tables exist.
let smartTableReserveRows =
    0;


if (
    configuredTableCount > 0
) {

    if (
        detectedCanvasPreset ===
        "wide"
    ) {

        smartTableReserveRows =
            12;

    }
    else if (
        detectedCanvasPreset ===
        "window"
    ) {

        smartTableReserveRows =
            10;

    }
    else {

        smartTableReserveRows =
            8;

    }

}


const chartBottomRow =
    Math.max(
        chartStartRow + 5,
        end.row -
        smartTableReserveRows
    );


const availableChartRows =
    Math.max(
        6,
        chartBottomRow -
        chartStartRow +
        1
    );


const chartGapRows =
    2;


const totalChartGapRows =
    chartGapRows *
    Math.max(
        0,
        chartRowCount - 1
    );


const usableChartRows =
    Math.max(
        chartRowCount,
        availableChartRows -
        totalChartGapRows
    );


// ============================================================
// HYBRID DASHBOARD â€” FIXED PROFESSIONAL CHART HEIGHT
// ============================================================

const minimumProfessionalChartRows =
    9;


const calculatedChartRowHeight =
    Math.max(
        1,
        Math.floor(
            usableChartRows /
            chartRowCount
        )
    );


const chartRowHeight =
    Math.max(
        minimumProfessionalChartRows,
        calculatedChartRowHeight
    );

const chartPositions =
    [];


for (
    let chartRowIndex = 0;
    chartRowIndex < chartRowCount;
    chartRowIndex++
) {

        const rowStart =
            chartStartRow +
            (
                chartRowIndex *
                (
                    chartRowHeight +
                    chartGapRows
                )
            );


        const rowEnd =
    Math.max(
        rowStart,
        Math.min(
            chartBottomRow,
            rowStart +
            chartRowHeight -
            1
        )
    );

        if (
    rowStart >
    chartBottomRow
) {

    break;

}

        chartPositions.push({

            start:
                dashboardCellAddress(
                    firstChartStartColumn,
                    rowStart
                ),

            end:
                dashboardCellAddress(
                    firstChartEndColumn,
                    rowEnd
                )

        });


        chartPositions.push({

            start:
                dashboardCellAddress(
                    secondChartStartColumn,
                    rowStart
                ),

            end:
                dashboardCellAddress(
                    secondChartEndColumn,
                    rowEnd
                )

        });

    }


    return {

        start:
            start,

        end:
            end,

        totalColumns:
            totalColumns,

        totalRows:
            totalRows,

        filterStartColumn:
            filterStartColumn,

        filterEndColumn:
            end.column,

        filterHeaderStartRow:
    chartStartRow,

filterHeaderEndRow:
    Math.min(
        chartBottomRow,
        chartStartRow + 1
    ),

filterStartRow:
    Math.min(
        chartBottomRow,
        chartStartRow + 2
    ),

filterEndRow:
    chartBottomRow,

smartTableStartRow:
    Math.min(
        end.row,
        chartBottomRow + 2
    ),

smartTableEndRow:
    end.row,

        chartPositions:
            chartPositions

    };

}




const dashboardLayout =
    createDashboardCanvasLayout(
        dashboardCanvasStart,
        dashboardCanvasEnd
    );

    // ============================================================
// NORMALIZE FINAL CANVAS BOUNDARY
// ============================================================

dashboardCanvasStart =
    dashboardCellAddress(
        dashboardLayout.start.column,
        dashboardLayout.start.row
    );


dashboardCanvasEnd =
    dashboardCellAddress(
        dashboardLayout.end.column,
        dashboardLayout.end.row
    );

    // ============================================================
// RESPONSIVE CANVAS RANGE ADDRESSES
// ============================================================

const dashboardCanvasRange =
    dashboardCellAddress(
        dashboardLayout.start.column,
        dashboardLayout.start.row
    ) +
    ":" +
    dashboardCellAddress(
        dashboardLayout.end.column,
        dashboardLayout.end.row
    );


const dashboardHeaderRange =
    dashboardCellAddress(
        dashboardLayout.start.column,
        dashboardLayout.start.row
    ) +
    ":" +
    dashboardCellAddress(
        dashboardLayout.end.column,
        Math.min(
            dashboardLayout.end.row,
            dashboardLayout.start.row + 2
        )
    );


const dashboardTitleRange =
    dashboardCellAddress(
        dashboardLayout.start.column,
        dashboardLayout.start.row
    ) +
    ":" +
    dashboardCellAddress(
        dashboardLayout.end.column,
        Math.min(
            dashboardLayout.end.row,
            dashboardLayout.start.row + 1
        )
    );


const dashboardBrandingEndColumn =
    Math.min(
        dashboardLayout.end.column,
        dashboardLayout.start.column +
        Math.max(
            4,
            Math.floor(
                dashboardLayout.totalColumns *
                0.38
            )
        )
    );


const dashboardBrandingRange =
    dashboardCellAddress(
        dashboardLayout.start.column,
        dashboardLayout.start.row + 2
    ) +
    ":" +
    dashboardCellAddress(
        dashboardBrandingEndColumn,
        dashboardLayout.start.row + 2
    );


const dashboardFilterPanelRange =
    dashboardCellAddress(
        dashboardLayout.filterStartColumn,
        dashboardLayout.filterHeaderStartRow
    ) +
    ":" +
    dashboardCellAddress(
        dashboardLayout.filterEndColumn,
        dashboardLayout.filterEndRow
    );


const dashboardFilterHeaderRange =
    dashboardCellAddress(
        dashboardLayout.filterStartColumn,
        dashboardLayout.filterHeaderStartRow
    ) +
    ":" +
    dashboardCellAddress(
        dashboardLayout.filterEndColumn,
        dashboardLayout.filterHeaderEndRow
    );

                // ============================================================
// RESPONSIVE KPI + CONTROL LAYOUT
// ============================================================

function createDashboardKpiPositions(
    layout
) {

    const positions =
        [];

   // ============================================================
// HYBRID DASHBOARD â€” FIXED KPI GRID
// ============================================================
// Excel Dashboard always uses a stable 3-column KPI grid.
// 6 KPIs = 3 cards on row 1 + 3 cards on row 2.
// ============================================================

const maximumCardsPerRow =
    3;


// Actual KPI cards should fill the available row.
// Example: 4 KPIs on Wide canvas = 4 equal-width cards,
// not 4 cards inside a 6-card grid.
const cardsPerRow =
    Math.max(
        1,
        Math.min(
            effectiveKpiCount,
            maximumCardsPerRow
        )
    );


const rowCount =
    Math.max(
        1,
        Math.ceil(
            effectiveKpiCount /
            cardsPerRow
        )
    );

    const startColumn =
    layout.start.column;

// KPI cards must stay inside the main content area.
// Do not allow KPI cards to consume the right-side
// slicer / filter rail.
const endColumn =
    Math.max(
        startColumn,
        layout.filterStartColumn - 2
    );

    const totalColumns =
        endColumn -
        startColumn +
        1;

    const baseWidth =
        Math.floor(
            totalColumns /
            cardsPerRow
        );

    const firstKpiRow =
        layout.start.row +
        4;

    const kpiCardRows =
        6;

    const rowGap =
        1;


    for (
        let rowIndex = 0;
        rowIndex < rowCount;
        rowIndex++
    ) {

        const startRow =
            firstKpiRow +
            (
                rowIndex *
                (
                    kpiCardRows +
                    rowGap
                )
            );

        const endRow =
            startRow +
            kpiCardRows -
            1;


        for (
            let cardIndex = 0;
            cardIndex < cardsPerRow;
            cardIndex++
        ) {

            const startCol =
                startColumn +
                (
                    cardIndex *
                    baseWidth
                );

            const endCol =
                cardIndex ===
                    cardsPerRow - 1
                    ? endColumn
                    : startCol +
                      baseWidth -
                      1;


            positions.push(
                dashboardCellAddress(
                    startCol,
                    startRow
                ) +
                ":" +
                dashboardCellAddress(
                    endCol,
                    endRow
                )
            );

        }

    }


    return positions;

}


function createDashboardControlLayout(
    layout
) {

    const startColumn =
        layout.start.column;

    const endColumn =
        layout.end.column;

    const totalColumns =
        endColumn -
        startColumn +
        1;


    // Keep left area free for subtitle / branding.
    const controlStartColumn =
        startColumn +
        Math.max(
            6,
            Math.floor(
                totalColumns *
                0.42
            )
        );


    const availableColumns =
        endColumn -
        controlStartColumn +
        1;


    // Theme label + Theme value + 4 buttons = 6 items.
    const itemCount =
        6;

    const itemWidth =
        Math.max(
            1,
            Math.floor(
                availableColumns /
                itemCount
            )
        );


    function getItemRange(
        index
    ) {

        const start =
            controlStartColumn +
            (
                index *
                itemWidth
            );

        const end =
            index ===
                itemCount - 1
                ? endColumn
                : Math.min(
                    endColumn,
                    start +
                    itemWidth -
                    1
                );


        return (
            dashboardCellAddress(
                start,
                layout.start.row + 2
            ) +
            ":" +
            dashboardCellAddress(
                end,
                layout.start.row + 2
            )
        );

    }


    return {

        themeLabel:
            getItemRange(0),

        themeValue:
            getItemRange(1),

        buttons: [

            {
                range:
                    getItemRange(2),

                text:
                    "Theme",

                color:
                    "#0B4F93"
                    },

            {
                range:
                    getItemRange(3),

                text:
                    "Refresh",

                color:
                "#0B4F93"
            },

            {
                range:
                    getItemRange(4),

                text:
                    "Export PDF",

                color:
                    "#D92D20"
            },

            {
                range:
                    getItemRange(5),

                text:
                    "Export PPT",

                color:
                    "#F57C00"
            }

        ]

    };

}


const dashboardKpiPositions =
    createDashboardKpiPositions(
        dashboardLayout
    );


const dashboardControlLayout =
    createDashboardControlLayout(
        dashboardLayout
    );


            // ============================================================
            // 8. DASHBOARD CANVAS
            // ============================================================

                    dashboardSheet.showGridlines =
                        false;

            // ============================================================
// PHASE 9 - APPLY FINAL CANVAS GEOMETRY BEFORE OBJECT RENDERING
//
// IMPORTANT:
// Charts and slicers are floating Excel objects.
// Their physical positions must be calculated only after the
// final dashboard column widths / row heights are established.
// ============================================================

const initialDashboardColumnRange =
    dashboardColumnName(
        dashboardLayout
            .start
            .column
    ) +
    ":" +
    dashboardColumnName(
        dashboardLayout
            .end
            .column
    );


// ============================================================
// HYBRID DASHBOARD â€” FIXED INITIAL EXCEL GEOMETRY
// ============================================================

const initialResponsiveColumnWidth =
    26;


dashboardSheet
    .getRange(
        initialDashboardColumnRange
    )
    .format.columnWidth =
    initialResponsiveColumnWidth;


const initialDashboardRowRange =
    dashboardLayout
        .start
        .row +
    ":" +
    dashboardLayout
        .end
        .row;


dashboardSheet
    .getRange(
        initialDashboardRowRange
    )
    .format.rowHeight =
     18;


// Commit final cell geometry before creating / positioning
// KPI cards, charts, slicers and smart tables.
await context.sync();


// ============================================================
// WEB-LIKE DASHBOARD - FINAL NAVY HEADER
// ============================================================

const webHeaderRange =
    dashboardSheet.getRange(
        dashboardHeaderRange
    );

webHeaderRange.format.fill.color =
    "#073B78";

webHeaderRange.format.font.color =
    "#FFFFFF";

webHeaderRange.format.verticalAlignment =
    "Center";


// ------------------------------------------------------------
// BRAND + DASHBOARD TITLE
// ------------------------------------------------------------

const webDashboardTitleRange =
    dashboardSheet.getRange(
        dashboardTitleRange
    );

webDashboardTitleRange.format.fill.color =
    "#073B78";

webDashboardTitleRange.format.font.color =
    "#FFFFFF";

webDashboardTitleRange.format.font.bold =
    true;

webDashboardTitleRange.format.font.size =
    16;

webDashboardTitleRange.format.wrapText =
    false;

webDashboardTitleRange.format.verticalAlignment =
    "Center";

webDashboardTitleRange.format.horizontalAlignment =
    "Left";

webDashboardTitleRange
    .getCell(
        0,
        0
    )
    .values = [[
        "HIMANSHU XL TOOLS  |  " +
        (
            config.dashboardTitle ||
            "Sales Performance Dashboard"
        )
    ]];


// ============================================================
// EXISTING DASHBOARD BACKGROUND LOGIC
// ============================================================

const dashboardBackground =
    String(
        config.background ||
        "Dark"
    ).toLowerCase();


let dashboardBackgroundColor =
    "#F8FAFC";


if (
    dashboardBackground ===
    "soft"
) {

    dashboardBackgroundColor =
        "#F1F5F9";

}
else if (
    dashboardBackground ===
    "dark"
) {

    dashboardBackgroundColor =
        "#07111D";

}


dashboardSheet
    .getRange(
        dashboardCanvasRange
    )
    .format.fill.color =
    "#F4F8FC";

    dashboardSheet
    .getRange(
        dashboardFilterPanelRange
    )
    .format.fill.color =
    "#F3F7FB";

const filterHeaderRange =
    dashboardSheet
        .getRange(
            dashboardFilterHeaderRange
        );


filterHeaderRange.merge();

filterHeaderRange.format.fill.color =
    "#0B4F93";

filterHeaderRange.format.font.color =
    "#FFFFFF";

filterHeaderRange.format.font.bold =
    true;

filterHeaderRange
    .format.font.size =
    12;

filterHeaderRange.format.horizontalAlignment =
    "Center";

filterHeaderRange.format.verticalAlignment =
    "Center";


filterHeaderRange
    .getCell(
        0,
        0
    )
    .values =
   [["FILTERS / SLICERS"]];

   const filterPanelBorders =
    dashboardSheet
        .getRange(
            dashboardFilterPanelRange
        )
        .format
        .borders;

[
    "EdgeTop",
    "EdgeBottom",
    "EdgeLeft",
    "EdgeRight"
].forEach(function (borderName) {

    const border =
        filterPanelBorders
            .getItem(borderName);

    border.style =
        "Continuous";

    border.color =
        "#D6E2EE";

    border.weight =
        "Thin";

});


filterHeaderRange
    .format.font.bold =
    true;





filterHeaderRange
    .format.font.color =
    "#FFFFFF";


filterHeaderRange
    .format.horizontalAlignment =
    "Left";


filterHeaderRange
    .format.verticalAlignment =
    "Center";





            // ============================================================
            // 9. TITLE AREA
            // ============================================================


                // Hybrid Dashboard:
// Header styling is already finalized by WEB-LIKE DASHBOARD - FINAL NAVY HEADER.
// Do not overwrite it here.

            dashboardSheet
    .getRange(
        dashboardTitleRange
    )
    .merge();


                


            dashboardSheet
                .getRange(
    dashboardTitleRange
)
                


            dashboardSheet
                .getRange(
    dashboardTitleRange
)
                .format.font.bold =
                true;


                        dashboardSheet
                .getRange(
    dashboardTitleRange
)
                .format.font.color =
                dashboardBackground ===
                    "dark"
                    ? "#FFFFFF"
                    : "#172A3A";


            dashboardSheet
                .getRange(
    dashboardTitleRange
)
                .format.verticalAlignment =
                "Center";


            dashboardSheet
                .getRange(
    dashboardTitleRange
)
                .format.horizontalAlignment =
                "Left";


                dashboardSheet
    .getRange(
        dashboardBrandingRange
    )
    .merge();


                dashboardSheet
    .getRange(
        dashboardBrandingRange
    )
    .getCell(
        0,
        0
    )
    .values = [[
        "HIMANSHU XL TOOLS  |  POWER DASHBOARD  |  Executive Business Overview"
    ]];


            dashboardSheet
                .getRange(
    dashboardBrandingRange
)
                .format.font.size =
                9;


                        dashboardSheet
                .getRange(
    dashboardBrandingRange
)
                .format.font.color =
                dashboardBackground ===
                    "dark"
                    ? "#CBD5E1"
                    : "#667085";


            // ============================================================
            // 10. TOP CONTROL BAR
            // ============================================================

                const themeLabelRange =
    dashboardSheet
        .getRange(
            dashboardControlLayout
                .themeLabel
        );


themeLabelRange.merge();


themeLabelRange
    .getCell(
        0,
        0
    )
    .values =
    [["Theme"]];


const themeValueRange =
    dashboardSheet
        .getRange(
            dashboardControlLayout
                .themeValue
        );


themeValueRange.merge();


themeValueRange
    .getCell(
        0,
        0
    )
    .values =
    [[
        String(
            config.theme ||
            "Ocean"
        )
            .charAt(0)
            .toUpperCase() +
        String(
            config.theme ||
            "Ocean"
        ).slice(1)
    ]];


        // ============================================================
// HYBRID DASHBOARD â€” THEME CONTROL STYLE
// ============================================================

themeLabelRange.format.fill.color =
    "#E8F1FA";

themeLabelRange.format.font.color =
    "#0B4F93";

themeLabelRange.format.font.bold =
    true;

themeLabelRange.format.font.size =
    10;

themeLabelRange.format.horizontalAlignment =
    "Center";

themeLabelRange.format.verticalAlignment =
    "Center";


themeValueRange.format.fill.color =
    "#FFFFFF";

themeValueRange.format.font.color =
    "#172A3A";

themeValueRange.format.font.bold =
    true;

themeValueRange.format.font.size =
    10;

themeValueRange.format.horizontalAlignment =
    "Center";

themeValueRange.format.verticalAlignment =
    "Center";


            const controlButtons =
    dashboardControlLayout
        .buttons;


            for (
    const button
    of controlButtons
) {

    const range =
        dashboardSheet
            .getRange(
                button.range
            );


    range.merge();


    range.getCell(
        0,
        0
    ).values =
        [[button.text]];


    // ========================================================
    // HYBRID DASHBOARD â€” PROFESSIONAL CONTROL BUTTON
    // ========================================================

    range.format.fill.color =
        button.color;


    range.format.font.color =
        "#FFFFFF";


    range.format.font.bold =
        true;


    range.format.font.size =
        10;


    range.format.wrapText =
        false;


    range.format.horizontalAlignment =
        "Center";


    range.format.verticalAlignment =
        "Center";


    const controlBorders =
        range.format.borders;


    [
        "EdgeTop",
        "EdgeBottom",
        "EdgeLeft",
        "EdgeRight"
    ].forEach(
        function (borderName) {

            const border =
                controlBorders.getItem(
                    borderName
                );


            border.style =
                "Continuous";


            border.color =
                "#D6E2EE";


            border.weight =
                "Thin";

        }
    );

}

            reportDashboardProgress(
    25,
    "kpis",
    "Creating KPI Cards",
    "Preparing dashboard KPI calculations..."
);



                        // ============================================================
            // 11. DYNAMIC KPI CARDS
            // ============================================================

            const configuredKpis =
                Array.isArray(config.kpis)
                    ? config.kpis
                    : [];


            // Dashboard KPI positions.
            // Maximum 12 KPI cards:
            // 6 cards on first row + 6 cards on second row.

            const dynamicKpiPositions =
    dashboardKpiPositions;


            if (configuredKpis.length > 0) {

                const numberOfKpis =
                    Math.min(
                        configuredKpis.length,
                        dynamicKpiPositions.length
                    );


                for (
                    let kpiIndex = 0;
                    kpiIndex < numberOfKpis;
                    kpiIndex++
                ) {

                    const kpi =
                        configuredKpis[
                            kpiIndex
                        ];


                    const result =
    calculateDashboardKpi(
        kpi
    );

const filterAwareFormula =
    createDashboardKpiFormula(
        kpi
    );


writeKpiCard(
    dynamicKpiPositions[
        kpiIndex
    ],
    kpi.title ||
        kpi.column ||
        "KPI",
    result,
    kpi.format ||
        "Auto",
    filterAwareFormula
);

                }

            }
            else {

                // --------------------------------------------------------
                // FALLBACK KPIs
                // Used when no custom KPI was configured in Studio.
                // --------------------------------------------------------

                writeKpiCard(
    dynamicKpiPositions[0],
    "TOTAL NET SALES",
    totalNetSales,
    "Currency"
);


writeKpiCard(
    dynamicKpiPositions[1],
    "TOTAL GROSS SALES",
    totalGrossSales,
    "Currency"
);


writeKpiCard(
    dynamicKpiPositions[2],
    "TOTAL PROFIT",
    totalProfit,
    "Currency"
);


writeKpiCard(
    dynamicKpiPositions[3],
    "TOTAL ORDERS",
    totalOrders,
    "Number"
);


writeKpiCard(
    dynamicKpiPositions[4],
    "UNIQUE CUSTOMERS",
    totalCustomers,
    "Number"
);


writeKpiCard(
    dynamicKpiPositions[5],
    "TOTAL QUANTITY",
    totalQuantity,
    "Number"
);

            }

            reportDashboardProgress(
    42,
    "charts",
    "Creating Dashboard Charts",
    "KPI cards complete. Building configured charts..."
);

                            // ============================================================
            // 12. DYNAMIC CHART ENGINE
            // ============================================================

            const configuredCharts =
                Array.isArray(config.charts)
                    ? config.charts
                    : [];


            // ============================================================
            // FIND COLUMN INDEX BY EXACT HEADER
            // ============================================================

            function findDashboardColumnIndex(
                columnName
            ) {

                const target =
                    String(
                        columnName || ""
                    )
                        .trim()
                        .toLowerCase();


                return headers.findIndex(
                    function (header) {

                        return (
                            String(
                                header || ""
                            )
                                .trim()
                                .toLowerCase() ===
                            target
                        );

                    }
                );

            }


            // ============================================================
            // CHART AGGREGATION
            // ============================================================

            function aggregateChartValues(
                values,
                aggregation
            ) {

                const mode =
                    String(
                        aggregation || "SUM"
                    ).toUpperCase();


                const numericValues =
                    values
                        .map(
                            function (value) {

                                if (
                                    typeof value ===
                                    "number"
                                ) {

                                    return value;

                                }


                                const parsed =
                                    Number(value);


                                return Number.isFinite(
                                    parsed
                                )
                                    ? parsed
                                    : null;

                            }
                        )
                        .filter(
                            function (value) {

                                return (
                                    value !== null
                                );

                            }
                        );


                switch (mode) {

                    case "AVERAGE":

                        if (
                            numericValues.length === 0
                        ) {

                            return 0;

                        }

                        return (
                            numericValues.reduce(
                                function (
                                    total,
                                    value
                                ) {

                                    return (
                                        total +
                                        value
                                    );

                                },
                                0
                            ) /
                            numericValues.length
                        );


                    case "COUNT":

                        return numericValues.length;


                    case "MIN":

                        return numericValues.length
                            ? Math.min(
                                ...numericValues
                            )
                            : 0;


                    case "MAX":

                        return numericValues.length
                            ? Math.max(
                                ...numericValues
                            )
                            : 0;


                    case "SUM":
                    default:

                        return numericValues.reduce(
                            function (
                                total,
                                value
                            ) {

                                return (
                                    total +
                                    value
                                );

                            },
                            0
                        );

                }

            }


            // ============================================================
            // MAP STUDIO CHART TYPE -> EXCEL CHART TYPE
            // ============================================================

            function getExcelDashboardChartType(
                chartType
            ) {

                switch (
                    String(
                        chartType || "Column"
                    ).toLowerCase()
                ) {

                    case "bar":

                        return Excel.ChartType
                            .barClustered;


                    case "line":

                        return Excel.ChartType
                            .line;


                    case "area":

                        return Excel.ChartType
                            .area;


                    case "pie":

                        return Excel.ChartType
                            .pie;


                    case "doughnut":

                        return Excel.ChartType
                            .doughnut;


                    case "scatter":

                        return Excel.ChartType
                            .xyscatter;


                    // Combo chart needs a separate
                    // series-level implementation.
                    // For now use Column as safe fallback.

                    case "combo":

                        return Excel.ChartType
                            .columnClustered;


                    case "column":
                    default:

                        return Excel.ChartType
                            .columnClustered;

                }

            }


            // ============================================================
            // CHART POSITIONS
            // ============================================================

                const chartPositions =
    dashboardLayout
        .chartPositions;


            // ============================================================
            // BUILD CONFIGURED CHARTS
            // ============================================================

            if (
                configuredCharts.length > 0
            ) {

                const maximumCharts =
                    Math.min(
                        configuredCharts.length,
                        chartPositions.length
                    );


                for (
                    let chartIndex = 0;
                    chartIndex <
                    maximumCharts;
                    chartIndex++
                ) {

                    const chartConfig =
                        configuredCharts[
                            chartIndex
                        ];


                    const xColumnIndex =
                        findDashboardColumnIndex(
                            chartConfig.xAxis
                        );

                    
                    const isComboChart =
    String(
        chartConfig.type || ""
    )
        .trim()
        .toLowerCase() ===
    "combo";


let secondaryYColumnIndex =
    isComboChart &&
    String(
        chartConfig.secondaryYAxis || ""
    ).trim()
        ? findDashboardColumnIndex(
            chartConfig.secondaryYAxis
        )
        : -1;


const yColumnIndex =
    findDashboardColumnIndex(
        chartConfig.yAxis
    );


// Primary X/Y columns are mandatory.
// A Combo chart secondary Y column is optional:
// if it cannot be resolved, safely reuse the primary Y column
// instead of dropping the entire chart.
if (
    xColumnIndex < 0 ||
    yColumnIndex < 0
) {

    console.warn(
        "Dashboard chart primary column missing:",
        chartConfig
    );

    continue;

}


if (
    isComboChart &&
    secondaryYColumnIndex < 0
) {

    console.warn(
        "Dashboard combo secondary Y column missing; " +
        "using primary Y column as fallback:",
        chartConfig
    );

    secondaryYColumnIndex =
        yColumnIndex;

}


                    // ====================================================
                    // GROUP Y VALUES BY X AXIS
                    // ====================================================

                    const groupMap =
                        new Map();

                    const secondaryGroupMap =
                        new Map();


                    for (
                        let rowIndex = 1;
                        rowIndex <
                        sourceValues.length;
                        rowIndex++
                    ) {

                        const rawCategory =
                            sourceValues[
                                rowIndex
                            ][
                                xColumnIndex
                            ];


                        const rawValue =
                            sourceValues[
                                rowIndex
                            ][
                                yColumnIndex
                            ];

                            const rawSecondaryValue =
    isComboChart
        ? sourceValues[
            rowIndex
        ][
            secondaryYColumnIndex
        ]
        : null;


                        let category =
                            rawCategory;


                        // Format Date values nicely.

                        if (
                            rawCategory instanceof
                            Date
                        ) {

                            category =
                                rawCategory
                                    .toLocaleDateString();

                        }
                        else if (
                            typeof rawCategory ===
                            "number" &&
                            String(
                                chartConfig.xAxis ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    "date"
                                )
                        ) {

                            const excelDate =
                                new Date(
                                    Math.round(
                                        (
                                            rawCategory -
                                            25569
                                        ) *
                                        86400 *
                                        1000
                                    )
                                );


                            if (
                                !Number.isNaN(
                                    excelDate.getTime()
                                )
                            ) {

                                category =
                                    excelDate
                                        .toLocaleDateString(
                                            "en-IN"
                                        );

                            }

                        }


                        category =
                            String(
                                category === null ||
                                category === undefined ||
                                category === ""
                                    ? "(Blank)"
                                    : category
                            );


                        if (
                            !groupMap.has(
                                category
                            )
                        ) {

                            groupMap.set(
                                category,
                                []
                            );

                        }


                        groupMap
                            .get(
                                category
                            )
                            .push(
                                rawValue
                            );

                        if (isComboChart) {

    if (
        !secondaryGroupMap.has(
            category
        )
    ) {

        secondaryGroupMap.set(
            category,
            []
        );

    }


    secondaryGroupMap
        .get(
            category
        )
        .push(
            rawSecondaryValue
        );

}

                    }


                    let chartRows =
    Array.from(
        groupMap.entries()
    )
        .map(
            function (entry) {

                const category =
                    entry[0];

                const primaryValue =
                    aggregateChartValues(
                        entry[1],
                        chartConfig
                            .aggregation
                    );

                if (!isComboChart) {

                    return [
                        category,
                        primaryValue
                    ];

                }


                const secondaryValues =
                    secondaryGroupMap.get(
                        category
                    ) || [];

                const secondaryValue =
                    aggregateChartValues(
                        secondaryValues,
                        chartConfig
                            .secondaryAggregation ||
                        "SUM"
                    );


                return [
                    category,
                    primaryValue,
                    secondaryValue
                ];

            }
        );


                    // ====================================================
                    // TOP / BOTTOM
                    // ====================================================

                    const topBottom =
                        String(
                            chartConfig.topBottom ||
                            "Show All"
                        );


                    if (
                        topBottom !==
                        "Show All"
                    ) {

                        const isBottom =
                            topBottom
                                .toLowerCase()
                                .startsWith(
                                    "bottom"
                                );


                        const limitMatch =
                            topBottom.match(
                                /\d+/
                            );


                        const limit =
                            limitMatch
                                ? Number(
                                    limitMatch[0]
                                )
                                : 5;


                        chartRows.sort(
                            function (a, b) {

                                return isBottom
                                    ? a[1] - b[1]
                                    : b[1] - a[1];

                            }
                        );


                        chartRows =
                            chartRows.slice(
                                0,
                                limit
                            );

                    }


                    if (
                        chartRows.length === 0
                    ) {

                        chartRows = [
                            [
                                "No Data",
                                0
                            ]
                        ];

                    }


                    // ====================================================
                    // WRITE CHART DATA TO BACKEND
                    // ====================================================

                    const backendColumn =
                        sourceRange.columnCount +
                        2 +
                        (
                            chartIndex * 3
                        );


                    const chartDataRows = [

    isComboChart
        ? [
            chartConfig.xAxis ||
            "Category",

            chartConfig.yAxis ||
            "Value",

            chartConfig.secondaryYAxis ||
            "Secondary Value"
        ]
        : [
            chartConfig.xAxis ||
            "Category",

            chartConfig.yAxis ||
            "Value"
        ],

    ...chartRows

];


                    const chartDataRange =
                        backendSheet
                            .getRangeByIndexes(

                                0,

                                backendColumn,

                                chartDataRows.length,
                                isComboChart ? 3 : 2

                            );


                    chartDataRange.values =
                        chartDataRows;


                    // ====================================================
                    // CREATE NATIVE EXCEL CHART
                    // ====================================================

                    const excelChartType =
                        getExcelDashboardChartType(
                            chartConfig.type
                        );


                    const excelChart =
                        dashboardSheet
                            .charts
                            .add(

                                excelChartType,

                                chartDataRange,

                                Excel.ChartSeriesBy
                                    .columns

                            );

                            if (isComboChart) {

    try {

        const primarySeries =
            excelChart.series
                .getItemAt(0);

        const secondarySeries =
            excelChart.series
                .getItemAt(1);


        primarySeries.chartType =
            Excel.ChartType
                .columnClustered;

        primarySeries.axisGroup =
            Excel.ChartAxisGroup
                .primary;


        secondarySeries.chartType =
            Excel.ChartType
                .line;

        secondarySeries.axisGroup =
            Excel.ChartAxisGroup
                .secondary;


        excelChart.legend.visible =
            true;

    }
    catch (
        comboChartError
    ) {

        console.warn(
            "Combo chart series formatting could not be applied:",
            comboChartError
        );

    }

}


                    excelChart.title.text =
                        chartConfig.title ||
                        (
                            chartConfig.yAxis +
                            " by " +
                            chartConfig.xAxis
                        );


                                        // ====================================================
                    // CHART APPEARANCE STYLE
                    // ====================================================

                    const chartStyle =
                        String(
                            config.chartStyle ||
                            "Clean"
                        ).toLowerCase();


                    // Default / Clean
                    excelChart.title
                        .format
                        .font
                        .bold =
                        true;

                    excelChart.title
                        .format
                        .font
                        .size =
                        12;

                    excelChart.title
                        .format
                        .font
                        .color =
                        dashboardBackground === "dark"
                            ? "#F8FAFC"
                            : "#1F5268";

                    excelChart.legend.visible =
                        false;


                    if (
                        chartStyle ===
                        "corporate"
                    ) {

                        excelChart.title
                            .format
                            .font
                            .bold =
                            true;

                        excelChart.title
                            .format
                            .font
                            .size =
                            14;

                        excelChart.title
                            .format
                            .font
                            .color =
                           dashboardBackground === "dark"
                                ? "#FFFFFF"
                                : "#172A3A";

                        excelChart.legend.visible =
                            true;

                    }
                    else if (
                        chartStyle ===
                        "minimal"
                    ) {

                        excelChart.title
                            .format
                            .font
                            .bold =
                            false;

                        excelChart.title
                            .format
                            .font
                            .size =
                            11;

                        excelChart.title
                            .format
                            .font
                            .color =
                            dashboardBackground === "dark"
                                ? "#CBD5E1"
                                : "#667085";

                        excelChart.legend.visible =
                            false;

                    }

                    if (
    dashboardBackground ===
    "dark"
) {

    try {

        excelChart.format.fill
            .setSolidColor(
                "#0D1B2A"
            );

        excelChart.format.line.color =
            "#243244";

    }
    catch (
        chartFormatError
    ) {

        console.warn(
            "Dark chart formatting could not be applied:",
            chartFormatError
        );

    }

}


                    const chartAccentColors = [
                        "#8B5CF6",
                        "#3B82F6",
                        "#22C55E",
                        "#06B6D4",
                        "#F59E0B",
                        "#EC4899"
                    ];

                    const chartAccentColor =
                        chartAccentColors[
                            chartIndex %
                            chartAccentColors.length
                        ];


                    // ====================================================
                    // DATA LABELS
                    // ====================================================

                                        try {

                        const series =
                            excelChart.series
                                .getItemAt(
                                    0
                                );


                            if (isComboChart) {

    try {

        const secondarySeries =
            excelChart.series
                .getItemAt(1);

        secondarySeries
            .dataLabels
            .showValue =
            String(
                chartConfig.dataLabels ||
                "Show"
            )
                .toLowerCase() ===
            "show";

    }
    catch (
        secondaryLabelError
    ) {

        console.warn(
            "Secondary chart labels could not be applied:",
            secondaryLabelError
        );

    }

}


                        series.dataLabels
                            .showValue =
                            String(
                                chartConfig
                                    .dataLabels ||
                                "Show"
                            )
                                .toLowerCase() ===
                            "show";


                        if (
                            dashboardBackground ===
                            "dark"
                        ) {

                            try {

                                series.format.fill
                                    .setSolidColor(
                                        chartAccentColor
                                    );

                                series.format.line.color =
                                    chartAccentColor;

                            }
                            catch (
                                seriesFormatError
                            ) {

                                console.warn(
                                    "Chart series accent could not be applied:",
                                    seriesFormatError
                                );

                            }

                        }

                    }
                                
                    catch (
                        dataLabelError
                    ) {

                        console.warn(
                            "Chart data labels could not be applied:",
                            dataLabelError
                        );

                    }


                    // ====================================================
                    // POSITION
                    // ====================================================

                    const position =
                        chartPositions[
                            chartIndex
                        ];


                    excelChart.setPosition(
                        position.start,
                        position.end
                    );


// ====================================================
// PROFESSIONAL WEB-LIKE CHART AXIS FORMATTING
// ====================================================

try {

    const categoryAxis =
        excelChart.axes
            .categoryAxis;

    const valueAxis =
        excelChart.axes
            .valueAxis;


    categoryAxis.format
        .font.color =
        "#5B6B7F";

    valueAxis.format
        .font.color =
        "#5B6B7F";


    valueAxis.majorGridlines
        .format
        .line.color =
        "#E2E8F0";


    categoryAxis.format
        .line.color =
        "#CBD5E1";

    valueAxis.format
        .line.color =
        "#CBD5E1";

}
catch (
    axisFormatError
) {

    console.warn(
        "Chart axes formatting could not be applied:",
        axisFormatError
    );

}

reportDashboardProgress(
    Math.round(
        42 +
        (
            (
                chartIndex + 1
            ) /
            maximumCharts
        ) * 20
    ),
    "charts",
    "Creating Dashboard Charts",
    "Chart " +
        (
            chartIndex + 1
        ) +
        " of " +
        maximumCharts +
        " complete"
);


                    console.log(
                        "Dashboard chart created:",
                        chartConfig.title
                    );

                    // ============================================================
// PHASE 9 - PER CHART RUNTIME COMMIT DIAGNOSTIC
// ============================================================

try {

    await context.sync();

}
catch (chartCommitError) {

    throw new Error(
        "Chart " +
        (chartIndex + 1) +
        " failed: " +
        (
            chartConfig.title ||
            "Untitled Chart"
        ) +
        " | Type: " +
        (
            chartConfig.type ||
            "Unknown"
        ) +
        " | " +
        (
            chartCommitError &&
            chartCommitError.message
                ? chartCommitError.message
                : String(chartCommitError)
        )
    );

}


const phase9ChartDiagnosticCollection =
    dashboardSheet.charts;

phase9ChartDiagnosticCollection.load(
    "items/name"
);

await context.sync();

console.log(
    "[PHASE 9] Chart runtime diagnostic:",
    {
        chartIndex: chartIndex,
        expectedTitle: chartConfig.title,
        expectedType: chartConfig.type,
        xAxis: chartConfig.xAxis,
        yAxis: chartConfig.yAxis,
        secondaryYAxis:
            chartConfig.secondaryYAxis || "",
        actualChartCount:
            phase9ChartDiagnosticCollection.items.length,
        actualChartNames:
            phase9ChartDiagnosticCollection.items.map(
                function (item) {
                    return item.name;
                }
            )
    }
);

                }

            }
            else {

                // ========================================================
                // NO CUSTOM CHARTS
                // ========================================================

                console.log(
                    "No custom dashboard charts configured."
                );

            }

            reportDashboardProgress(
    65,
    "slicers",
    "Creating Dashboard Filters",
    "Preparing configured slicers..."
);

                            // ============================================================
            // 15. DYNAMIC SLICER ENGINE
            // ============================================================

            let slicerCreated =
                false;


            const configuredSlicers =
                Array.isArray(
                    config.slicers
                )
                    ? config.slicers
                    : [];


            const slicerApiSupported =
                typeof Office !==
                    "undefined" &&
                Office.context &&
                Office.context.requirements &&
                Office.context.requirements
                    .isSetSupported(
                        "ExcelApi",
                        "1.10"
                    );


            if (
                slicerApiSupported &&
                configuredSlicers.length > 0
            ) {

                let createdSlicerCount =
                    0;


                for (
                    let slicerIndex = 0;
                    slicerIndex <
                    configuredSlicers.length;
                    slicerIndex++
                ) {

                    const slicerConfig =
                        configuredSlicers[
                            slicerIndex
                        ];

                    const slicerType =
    String(
        slicerConfig.type ||
        "Category Slicer"
    )
        .trim()
        .toLowerCase();


const timelineGrouping =
    String(
        slicerConfig.timelineGrouping ||
        "Month"
    ).trim();


const selectionMode =
    String(
        slicerConfig.selectionMode ||
        "Multi Select"
    ).trim();


const slicerConnection =
    String(
        slicerConfig.connection ||
        "All Dashboard Objects"
    ).trim();


const connectionTargets =
    slicerConfig.connectionTargets &&
    typeof slicerConfig.connectionTargets === "object"
        ? slicerConfig.connectionTargets
        : {
            kpis: true,
            charts: true,
            tables: true
        };


const requestedTimeline =
    slicerType.includes(
        "timeline"
    );


if (requestedTimeline) {

    console.info(
        "Excel native Timeline API is not available in the production " +
        "JavaScript API used by this renderer. Creating a standard slicer " +
        "for the same date field instead.",
        {
            column: slicerConfig.column,
            timelineGrouping: timelineGrouping
        }
    );

}


console.info(
    "Dashboard slicer configuration:",
    {
        type: slicerConfig.type,
        selectionMode: selectionMode,
        connection: slicerConnection,
        connectionTargets: connectionTargets
    }
);


                    const slicerColumnName =
                        String(
                            slicerConfig.column ||
                            ""
                        ).trim();


                    const slicerColumnIndex =
                        headers.findIndex(
                            function (header) {

                                return (
                                    String(
                                        header || ""
                                    )
                                        .trim()
                                        .toLowerCase() ===
                                    slicerColumnName
                                        .toLowerCase()
                                );

                            }
                        );


                    if (
                        slicerColumnIndex < 0
                    ) {

                        console.warn(
                            "Slicer column not found:",
                            slicerColumnName
                        );

                        continue;

                    }


                    try {

                        const slicerHeader =
                            String(
                                headers[
                                    slicerColumnIndex
                                ] ||
                                slicerColumnName
                            );


                        const excelSlicer =
                            dashboardSheet
                                .slicers
                                .add(

                                    backendTable,

                                    slicerHeader,

                                    dashboardSheet

                                );


                        // =================================================
                        // UNIQUE SLICER NAME
                        // =================================================

                        excelSlicer.name =
                            "HXLTBuildSlicer_" +
                            dashboardBuildToken +
                            "_" +
                            (
                                slicerIndex +
                                1
                            );


                        excelSlicer.caption =
                        
    requestedTimeline
        ? (
            slicerConfig.title ||
            slicerHeader
        ) +
        " (" +
        timelineGrouping +
        ")"
        : (
            slicerConfig.title ||
            slicerHeader
        );


        if (
    selectionMode
        .toLowerCase() ===
    "single select"
) {

    console.info(
        "Single Select requested for slicer '" +
        (
            slicerConfig.title ||
            slicerHeader
        ) +
        "'. Excel native slicer selection behavior is host-controlled."
    );

}

                        // =================================================
                        // POSITION
                        // =================================================

                        const isHorizontal =
                            String(
                                slicerConfig
                                    .orientation ||
                                "Vertical"
                            )
                                .toLowerCase() ===
                            "horizontal";


                                const filterStartCell =
    dashboardSheet
        .getRange(
            dashboardCellAddress(
                dashboardLayout
                    .filterStartColumn,
                dashboardLayout
                    .filterStartRow
            )
        );

const filterEndCell =
    dashboardSheet
        .getRange(
            dashboardCellAddress(
                dashboardLayout
                    .filterEndColumn,
                dashboardLayout
                    .filterEndRow
            )
        );


filterStartCell.load([
    "left",
    "top",
    "width",
    "height"
]);

filterEndCell.load([
    "left",
    "top",
    "width",
    "height"
]);


await context.sync();


const filterLeft =
    filterStartCell.left;

const filterTop =
    filterStartCell.top;

const filterRight =
    filterEndCell.left +
    filterEndCell.width;

const filterBottom =
    filterEndCell.top +
    filterEndCell.height;


const filterWidth =
    Math.max(
        120,
        filterRight -
        filterLeft
    );

const filterHeight =
    Math.max(
        120,
        filterBottom -
        filterTop
    );


if (isHorizontal) {

    const slicersPerRow =
        2;

    const slicerColumn =
        slicerIndex %
        slicersPerRow;

    const slicerRow =
        Math.floor(
            slicerIndex /
            slicersPerRow
        );


    const slicerGap =
        8;


    const slicerWidth =
        Math.max(
            90,
            (
                filterWidth -
                slicerGap
            ) /
            slicersPerRow
        );


    const slicerHeight =
        90;


    excelSlicer.left =
        filterLeft +
        (
            slicerColumn *
            (
                slicerWidth +
                slicerGap
            )
        );


    excelSlicer.top =
        filterTop +
        (
            slicerRow *
            (
                slicerHeight +
                slicerGap
            )
        );


    excelSlicer.width =
        slicerWidth;


    excelSlicer.height =
        slicerHeight;

}
else {

    // =========================================================
    // HYBRID DASHBOARD â€” FIXED RIGHT-SIDE SLICER RAIL
    // =========================================================

    const slicerGap =
        8;

    const slicerRailPadding =
        6;


    const visibleSlicerCount =
        Math.max(
            1,
            configuredSlicers.length
        );


    const usableSlicerHeight =
        Math.max(
            1,
            filterHeight -
            (
                slicerRailPadding * 2
            ) -
            (
                slicerGap *
                Math.max(
                    0,
                    visibleSlicerCount - 1
                )
            )
        );


    const slicerHeight =
        Math.min(
            84,
            Math.max(
                48,
                usableSlicerHeight /
                visibleSlicerCount
            )
        );


    const slicerWidth =
        Math.max(
            110,
            filterWidth -
            (
                slicerRailPadding * 2
            )
        );


    const slicerTop =
        filterTop +
        slicerRailPadding +
        (
            slicerIndex *
            (
                slicerHeight +
                slicerGap
            )
        );


    excelSlicer.left =
        filterLeft +
        slicerRailPadding;


    excelSlicer.top =
        slicerTop;


    excelSlicer.width =
        slicerWidth;


    excelSlicer.height =
        slicerHeight;

}


                        createdSlicerCount++;


                        slicerCreated =
                            true;

                            reportDashboardProgress(
    Math.round(
        65 +
        (
            createdSlicerCount /
            configuredSlicers.length
        ) * 10
    ),
    "slicers",
    "Creating Dashboard Filters",
    "Slicer " +
        createdSlicerCount +
        " of " +
        configuredSlicers.length +
        " complete"
);


                        console.log(
                            "Dashboard slicer created:",
                            slicerConfig.title ||
                            slicerHeader
                        );

                    }
                    catch (
                        slicerError
                    ) {

                        console.warn(
                            "Power Dashboard slicer could not be created:",
                            slicerConfig.title ||
                            slicerColumnName,
                            slicerError
                        );

                    }

                }


                console.log(
                    "Dashboard slicers created:",
                    createdSlicerCount
                );

            }
            else if (
                configuredSlicers.length === 0
            ) {

                console.log(
                    "No custom dashboard slicers configured."
                );

            }
            else {

                console.warn(
                    "Excel slicer API is not supported in this Excel version."
                );

            }

            reportDashboardProgress(
    77,
    "tables",
    "Building Smart Tables",
    "Creating dashboard table visuals..."
);


                       // ============================================================
            // 16. DYNAMIC SMART TABLE ENGINE
            // ============================================================

            const configuredTables =
                Array.isArray(
                    config.tables
                )
                    ? config.tables
                    : [];

            let renderedSmartTableCount =
                0;


            function getSmartTableLimit(
                limitData
            ) {

                const text =
                    String(
                        limitData ||
                        "Show All"
                    );


                const match =
                    text.match(
                        /\d+/
                    );


                return match
                    ? Number(
                        match[0]
                    )
                    : null;

            }


            function getSmartTableNumericIndexes() {

                const result = [];


                for (
                    let columnIndex = 0;
                    columnIndex <
                    headers.length;
                    columnIndex++
                ) {

                    let numericCount = 0;
                    let nonBlankCount = 0;


                    for (
                        let rowIndex = 1;
                        rowIndex <
                        sourceValues.length;
                        rowIndex++
                    ) {

                        const value =
                            sourceValues[
                                rowIndex
                            ][
                                columnIndex
                            ];


                        if (
                            value !== null &&
                            value !== undefined &&
                            String(value)
                                .trim() !== ""
                        ) {

                            nonBlankCount++;


                            if (
                                typeof value ===
                                "number" &&
                                Number.isFinite(
                                    value
                                )
                            ) {

                                numericCount++;

                            }

                        }

                    }


                    if (
                        nonBlankCount > 0 &&
                        numericCount /
                        nonBlankCount >=
                        0.8
                    ) {

                        result.push(
                            columnIndex
                        );

                    }

                }


                return result;

            }


            function getSmartTableCategoryIndex() {

                for (
                    let columnIndex = 0;
                    columnIndex <
                    headers.length;
                    columnIndex++
                ) {

                    let textCount = 0;
                    let nonBlankCount = 0;


                    for (
                        let rowIndex = 1;
                        rowIndex <
                        sourceValues.length;
                        rowIndex++
                    ) {

                        const value =
                            sourceValues[
                                rowIndex
                            ][
                                columnIndex
                            ];


                        if (
                            value !== null &&
                            value !== undefined &&
                            String(value)
                                .trim() !== ""
                        ) {

                            nonBlankCount++;


                            if (
                                typeof value ===
                                "string"
                            ) {

                                textCount++;

                            }

                        }

                    }


                    if (
                        nonBlankCount > 0 &&
                        textCount /
                        nonBlankCount >=
                        0.7
                    ) {

                        return columnIndex;

                    }

                }


                return 0;

            }


            function createAggregatedSmartTableRows(
                tableConfig
            ) {

                const categoryIndex =
                    getSmartTableCategoryIndex();


                const numericIndexes =
                    getSmartTableNumericIndexes()
                        .slice(
                            0,
                            5
                        );


                const grouped =
                    new Map();


                for (
                    let rowIndex = 1;
                    rowIndex <
                    sourceValues.length;
                    rowIndex++
                ) {

                    const category =
                        String(
                            sourceValues[
                                rowIndex
                            ][
                                categoryIndex
                            ] || "(Blank)"
                        ).trim();


                    if (
                        !grouped.has(
                            category
                        )
                    ) {

                        grouped.set(
                            category,
                            numericIndexes.map(
                                function () {
                                    return 0;
                                }
                            )
                        );

                    }


                    const totals =
                        grouped.get(
                            category
                        );


                    numericIndexes.forEach(
                        function (
                            columnIndex,
                            metricIndex
                        ) {

                            const value =
                                Number(
                                    sourceValues[
                                        rowIndex
                                    ][
                                        columnIndex
                                    ]
                                );


                            if (
                                Number.isFinite(
                                    value
                                )
                            ) {

                                totals[
                                    metricIndex
                                ] +=
                                    value;

                            }

                        }
                    );

                }


                let rows =
                    Array.from(
                        grouped.entries()
                    )
                        .map(
                            function (entry) {

                                return [
                                    entry[0],
                                    ...entry[1]
                                ];

                            }
                        );


                if (
                    numericIndexes.length >
                    0
                ) {

                    rows.sort(
                        function (a, b) {

                            return (
                                Number(
                                    b[1] || 0
                                ) -
                                Number(
                                    a[1] || 0
                                )
                            );

                        }
                    );

                }


                const limit =
                    getSmartTableLimit(
                        tableConfig.limitData
                    );


                if (
                    String(
                        tableConfig.limitData ||
                        ""
                    )
                        .toLowerCase()
                        .startsWith(
                            "bottom"
                        )
                ) {

                    rows.reverse();

                }


                if (limit) {

                    rows =
                        rows.slice(
                            0,
                            limit
                        );

                }


                const headerRow = [

                    String(
                        headers[
                            categoryIndex
                        ] ||
                        "Category"
                    ),

                    ...numericIndexes.map(
                        function (
                            columnIndex
                        ) {

                            return String(
                                headers[
                                    columnIndex
                                ] ||
                                "Value"
                            );

                        }
                    )

                ];


                return [
                    headerRow,
                    ...rows
                ];

            }


            function createRawSmartTableRows(
                tableConfig
            ) {

                const maximumColumns =
                    Math.min(
                        headers.length,
                        6
                    );


                const selectedHeaders =
                    headers.slice(
                        0,
                        maximumColumns
                    );


                let rows =
                    sourceValues
                        .slice(
                            1
                        )
                        .map(
                            function (row) {

                                return row.slice(
                                    0,
                                    maximumColumns
                                );

                            }
                        );


                const limit =
                    getSmartTableLimit(
                        tableConfig.limitData
                    );


                if (limit) {

                    if (
                        String(
                            tableConfig.limitData ||
                            ""
                        )
                            .toLowerCase()
                            .startsWith(
                                "bottom"
                            )
                    ) {

                        rows =
                            rows.slice(
                                -limit
                            );

                    }
                    else {

                        rows =
                            rows.slice(
                                0,
                                limit
                            );

                    }

                }


                return [
                    selectedHeaders,
                    ...rows
                ];

            }


                const smartTableBaseStartRow =
    dashboardLayout
        .smartTableStartRow -
    1;

const smartTableBaseStartColumn =
    dashboardLayout
        .start
        .column -
    1;

const smartTableCanvasEndRow =
    dashboardLayout
        .smartTableEndRow -
    1;


// ============================================================
// STEP 8A.5 â€” 2 Ã— 2 SMART TABLE GRID
// ============================================================

const smartTableGridColumns =
    configuredTables.length > 1
        ? 2
        : 1;

const smartTableGridRows =
    Math.max(
        1,
        Math.ceil(
            configuredTables.length /
            smartTableGridColumns
        )
    );

const smartTableGapColumns =
    1;

const smartTableGapRows =
    1;

const smartTableAvailableColumns =
    Math.max(
        2,
        dashboardLayout
            .filterStartColumn -
        dashboardLayout
            .start
            .column -
        1
    );

const smartTableAvailableRows =
    Math.max(
        2,
        smartTableCanvasEndRow -
        smartTableBaseStartRow +
        1
    );

const smartTableSlotColumns =
    Math.max(
        2,
        Math.floor(
            (
                smartTableAvailableColumns -
                (
                    smartTableGapColumns *
                    Math.max(
                        0,
                        smartTableGridColumns - 1
                    )
                )
            ) /
            smartTableGridColumns
        )
    );

const smartTableSlotRows =
    Math.max(
        3,
        Math.floor(
            (
                smartTableAvailableRows -
                (
                    smartTableGapRows *
                    Math.max(
                        0,
                        smartTableGridRows - 1
                    )
                )
            ) /
            smartTableGridRows
        )
    );


            if (
                configuredTables.length > 0
            ) {

                for (
                    let tableIndex = 0;
                    tableIndex <
                    configuredTables.length;
                    tableIndex++
                ) {

                    const tableConfig =
                        configuredTables[
                            tableIndex
                        ];


                    const tableTitle =
                        tableConfig.title ||
                        (
                            "Smart Table " +
                            (
                                tableIndex +
                                1
                            )
                        );


                    const smartTableGridColumn =
    tableIndex %
    smartTableGridColumns;

const smartTableGridRow =
    Math.floor(
        tableIndex /
        smartTableGridColumns
    );

const smartTableStartColumn =
    smartTableBaseStartColumn +
    (
        smartTableGridColumn *
        (
            smartTableSlotColumns +
            smartTableGapColumns
        )
    );

const smartTableStartRow =
    smartTableBaseStartRow +
    (
        smartTableGridRow *
        (
            smartTableSlotRows +
            smartTableGapRows
        )
    );


                    const dataEngine =
                        String(
                            tableConfig.dataEngine ||
                            "Aggregated"
                        );


                    const tableRows =
                        dataEngine
                            .toLowerCase() ===
                            "raw data"
                                ? createRawSmartTableRows(
                                    tableConfig
                                )
                                : createAggregatedSmartTableRows(
                                    tableConfig
                                );


                    if (
                        tableRows.length <
                        2
                    ) {

                        tableRows.push(
                            [
                                "No Data",
                                0
                            ]
                        );

                    }

                    const hasGrandTotal =
    String(
        tableConfig.grandTotal ||
        "Yes"
    )
        .toLowerCase() ===
    "yes";


const maxTableRowsInCanvas =
    Math.max(
        2,
        smartTableSlotRows -
        1 -
        (
            hasGrandTotal
                ? 1
                : 0
        )
    );


if (
    maxTableRowsInCanvas <
    2
) {

    console.warn(
        "Smart Table skipped because the dashboard canvas has no remaining space:",
        tableTitle
    );

    break;

}


if (
    tableRows.length >
    maxTableRowsInCanvas
) {

    tableRows.splice(
        maxTableRowsInCanvas
    );

}


                       const maxSmartTableColumns =
    Math.max(
        1,
        smartTableSlotColumns
    );


const columnCount =
    Math.max(
        1,
        Math.min(
            tableRows[0]
                .length,
            maxSmartTableColumns
        )
    );


for (
    let rowIndex = 0;
    rowIndex < tableRows.length;
    rowIndex++
) {

    tableRows[rowIndex] =
        tableRows[rowIndex]
            .slice(
                0,
                columnCount
            );

}


                    // ====================================================
                    // TABLE TITLE
                    // ====================================================

                        const titleRange =
    dashboardSheet
        .getRangeByIndexes(
            smartTableStartRow,
            smartTableStartColumn,
            1,
            columnCount
        );


                    titleRange.merge();


                    titleRange
                        .getCell(
                            0,
                            0
                        )
                        .values =
                        [[
                            tableTitle
                                .toUpperCase()
                        ]];


                    titleRange
                        .format
                        .font
                        .bold =
                        true;


                    titleRange
                    .format
                    .fill
                    .color =
                    "#0B4F93";

                    titleRange
                    .format
                    .font
                    .color =
                    "#FFFFFF";

                titleRange
                    .format
                    .font
                    .size =
                    11;

                titleRange
                    .format
                    .horizontalAlignment =
                    "Left";

                titleRange
                    .format
                    .verticalAlignment =
                    "Center";


                    // ====================================================
                    // TABLE DATA
                    // ====================================================

                    const dataStartRow =
                        smartTableStartRow +
                        1;


                        const tableRange =
    dashboardSheet
        .getRangeByIndexes(
            dataStartRow,
            smartTableStartColumn,
            tableRows.length,
            columnCount
        );


                    tableRange.values =
                        tableRows;

                    tableRange
                        .format
                        .fill
                        .color =
                        "#FFFFFF";

                    tableRange
                        .format
                        .font
                        .color =
                        "#334155";


                    tableRange
                        .format
                        .autofitColumns();

                    tableRange
                        .format
                        .columnWidth =
                        16;


                    tableRange
                        .format
                        .rowHeight =
                       22;


                    tableRange
                    .getRow(
                        0
                    )
                    .format
                    .fill
                    .color =
                    "#DCEAF7";

                    tableRange
                    .getRow(
                        0
                    )
                    .format
                    .font
                    .color =
                    "#163A5F";


                    tableRange
                        .getRow(
                            0
                        )
                        .format
                        .font
                        .bold =
                        true;


                    // ====================================================
                    // GRAND TOTAL
                    // ====================================================

                        if (
    hasGrandTotal &&
    tableRows.length >
    1
) {

                        const totalRow =
                            new Array(
                                columnCount
                            ).fill(
                                ""
                            );


                        totalRow[0] =
                            "Grand Total";


                        for (
                            let columnIndex = 1;
                            columnIndex <
                            columnCount;
                            columnIndex++
                        ) {

                            let total = 0;


                            for (
                                let rowIndex = 1;
                                rowIndex <
                                tableRows.length;
                                rowIndex++
                            ) {

                                const value =
                                    Number(
                                        tableRows[
                                            rowIndex
                                        ][
                                            columnIndex
                                        ]
                                    );


                                if (
                                    Number.isFinite(
                                        value
                                    )
                                ) {

                                    total += value;

                                }

                            }


                            totalRow[
                                columnIndex
                            ] =
                                total;

                        }


                            const grandTotalRange =
    dashboardSheet
        .getRangeByIndexes(
            dataStartRow +
            tableRows.length,
            smartTableStartColumn,
            1,
            columnCount
        );


                        grandTotalRange.values =
                            [
                                totalRow
                            ];


                        grandTotalRange
                            .format
                            .font
                            .bold =
                            true;


                        grandTotalRange
                            .format
                            .fill
                            .color =
                            "#EEF4F8";

                    }


                    // ====================================================
                    // VISUAL INDICATOR - SAFE BASIC FORMATTING
                    // ====================================================

                    const indicator =
                        String(
                            tableConfig
                                .visualIndicator ||
                            "None"
                        )
                            .toLowerCase();


                    if (
                        indicator !==
                        "none"
                    ) {

                        try {

                            const bodyRange =
                                dashboardSheet
                                    .getRangeByIndexes(
    dataStartRow + 1,
    smartTableStartColumn + 1,
    Math.max(
        1,
        tableRows.length - 1
    ),
    Math.max(
        1,
        columnCount - 1
    )
);


                            if (
                                indicator ===
                                "color scale"
                            ) {

                                const conditional =
                                    bodyRange
                                        .conditionalFormats
                                        .add(
                                            Excel
                                                .ConditionalFormatType
                                                .colorScale
                                        );


                                conditional
                                    .colorScale
                                    .criteria = {
                                        minimum: {
                                            color:
                                                "#FEE2E2",
                                            type:
                                                "LowestValue"
                                        },
                                        midpoint: {
                                            color:
                                                "#FEF3C7",
                                            formula:
                                                "=50",
                                            type:
                                                "Percent"
                                        },
                                        maximum: {
                                            color:
                                                "#DCFCE7",
                                            type:
                                                "HighestValue"
                                        }
                                    };

                            }

                        }
                        catch (
                            indicatorError
                        ) {

                            console.warn(
                                "Smart Table visual indicator could not be applied:",
                                indicatorError
                            );

                        }

                    }


                    console.log(
    "Dashboard smart table created:",
    tableTitle
);


renderedSmartTableCount++;




                }

            }
            else {

                console.log(
                    "No custom smart tables configured."
                );

            }


            // ============================================================
            // 17. DASHBOARD SUMMARY BOX
            // ============================================================

            dashboardSheet
                .getRange(
                    "P31:Y31"
                )
                .merge();


            dashboardSheet
                .getRange(
                    "P31"
                )
                .values =
                [["DASHBOARD SUMMARY"]];


            dashboardSheet
                .getRange(
                    "P31:Y31"
                )
                .format.font.bold =
                true;


            dashboardSheet
                .getRange(
                    "P31:Y31"
                )
                .format.fill.color =
                "#D9E8F3";


            dashboardSheet
                .getRange(
                    "P32:Y37"
                )
                .values = [

                    [
                        "Data Source",
                        configuredRange,
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],

                    [
                        "Total Rows",
                        sourceRange.rowCount - 1,
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],

                    [
                        "Total Columns",
                        sourceRange.columnCount,
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],

                    [
                        "Data Engine",
                        config.dataEngine ||
                        "Smart Classic",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],

                    [
                        "Theme",
                        config.theme ||
                        "Ocean",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],

                    [
                        "Slicer",
                        slicerCreated
                            ? "Zone"
                            : "Not Available",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ]

                ];


            // ============================================================
            // 18. SETTINGS SHEET
            // ============================================================

                settingsSheet
    .getRange(
        "A1:B21"
    )
    .values = [

                    [
                        "Setting",
                        "Value"
                    ],

                    [
                        "Dashboard Title",
                        config.dashboardTitle ||
                        "Sales Performance Dashboard"
                    ],

                    [
                        "Theme",
                        config.theme ||
                        "ocean"
                    ],

                    [
                        "Currency",
                        config.currency ||
                        "INR"
                    ],

                    [
                        "Gridlines",
                        config.gridlines ||
                        "hide"
                    ],

                    [
                        "Layout",
                        config.layout ||
                        "executive"
                    ],

                                       [
                        "Data Engine",
                        config.dataEngine ||
                        "classic"
                    ],
                    
                            [
    "Canvas Mode",
    dashboardCanvasMode
],

[
    "Canvas Preset",
    dashboardCanvasPreset
],

[
    "Canvas Start",
    dashboardCanvasStart
],

[
    "Canvas End",
    dashboardCanvasEnd
],

[
    "Lock Canvas",
    dashboardCanvasLocked
        ? "Yes"
        : "No"
],

                    [
                        "KPI Style",
                        config.kpiStyle ||
                        "Modern Cards"
                    ],

                    [
                        "Chart Style",
                        config.chartStyle ||
                        "Clean"
                    ],

                                        [
                        "Background",
                        config.background ||
                        "Light"
                    ],

                    [
                        "Protect Dashboard",
                        config.protectDashboard === false
                            ? "No"
                            : "Yes"
                    ],

                    [
                        "Hide Backend",
                        config.hideBackend === false
                            ? "No"
                            : "Yes"
                    ],

                    [
                        "Lock Settings",
                        config.lockSettings === true
                            ? "Yes"
                            : "No"
                    ],

                    [
                        "Source Sheet",
                        sourceSheet.name
                    ],

                    [
                        "Source Range",
                        configuredRange
                    ],

                    [
                        "Slicer Created",
                        slicerCreated
                            ? "Yes"
                            : "No"
                    ]

                ];

                        // ============================================================
// SAVE FULL POWER DASHBOARD PROJECT CONFIG
// ============================================================

let dashboardProjectSnapshot =
    null;


if (
    config.projectSnapshot &&
    typeof config.projectSnapshot ===
        "object"
) {

    dashboardProjectSnapshot =
        config.projectSnapshot;

}
else {

    dashboardProjectSnapshot = {

        project:
            config.project ||
            {},

        dataRange:
            configuredRange,

        dashboardTitle:
            config.dashboardTitle ||
            "Sales Performance Dashboard",

        theme:
            config.theme ||
            "ocean",

        currency:
            config.currency ||
            "INR",

        gridlines:
            config.gridlines ||
            "hide",

        layout:
            config.layout ||
            "executive",

        canvasMode:
            dashboardCanvasMode,

        canvasPreset:
            dashboardCanvasPreset,

        canvasStartCell:
            dashboardCanvasStart,

        canvasEndCell:
            dashboardCanvasEnd,

        lockCanvas:
            dashboardCanvasLocked,

        kpiStyle:
            config.kpiStyle ||
            "Modern Cards",

        chartStyle:
            config.chartStyle ||
            "Clean",

        background:
            config.background ||
            "Light",

        protectDashboard:
            config.protectDashboard !==
            false,

        hideBackend:
            config.hideBackend !==
            false,

        lockSettings:
            config.lockSettings ===
            true,

        dataEngine:
            config.dataEngine ||
            "classic",

        kpis:
            Array.isArray(
                config.kpis
            )
                ? config.kpis
                : [],

        charts:
            Array.isArray(
                config.charts
            )
                ? config.charts
                : [],

        slicers:
            Array.isArray(
                config.slicers
            )
                ? config.slicers
                : [],

        tables:
            Array.isArray(
                config.tables
            )
                ? config.tables
                : []

    };

}


const projectConfigJson =
    JSON.stringify(
        dashboardProjectSnapshot
    );


// ============================================================
// SAVE PROJECT CONFIG IN SAFE CHUNKS
//
// Excel cells have a text-size limit. The full dashboard
// project can exceed that limit because it contains KPIs,
// charts, slicers, tables, profiler/advisor state and source
// values. Store the JSON across multiple cells instead of D2.
// ============================================================

const PROJECT_CONFIG_CHUNK_SIZE =
    30000;


const projectConfigChunks =
    [];


for (
    let offset = 0;
    offset <
    projectConfigJson.length;
    offset +=
    PROJECT_CONFIG_CHUNK_SIZE
) {

    projectConfigChunks.push(
        projectConfigJson.slice(
            offset,
            offset +
            PROJECT_CONFIG_CHUNK_SIZE
        )
    );

}


if (
    projectConfigChunks.length === 0
) {

    projectConfigChunks.push(
        ""
    );

}


// Marker
settingsSheet
    .getRange(
        "D1"
    )
    .values = [[
        "HXLT_PROJECT_CONFIG"
    ]];


// Schema version
settingsSheet
    .getRange(
        "E1"
    )
    .values = [[
        "HXLT_PROJECT_SCHEMA"
    ]];


settingsSheet
    .getRange(
        "E2"
    )
    .values = [[
        "2"
    ]];


// Chunk count
settingsSheet
    .getRange(
        "F1"
    )
    .values = [[
        "HXLT_PROJECT_CHUNKS"
    ]];


settingsSheet
    .getRange(
        "F2"
    )
    .values = [[
        projectConfigChunks.length
    ]];


// Save chunks vertically starting at D2.
const projectChunkRange =
    settingsSheet.getRangeByIndexes(
        1,
        3,
        projectConfigChunks.length,
        1
    );


projectChunkRange.values =
    projectConfigChunks.map(
        function (chunk) {

            return [
                chunk
            ];

        }
    );


console.log(
    "Power Dashboard project config saved:",
    {
        jsonLength:
            projectConfigJson.length,

        chunks:
            projectConfigChunks.length
    }
);

            settingsSheet
                .getUsedRange()
                .format.autofitColumns();

                reportDashboardProgress(
    90,
    "formatting",
    "Applying Dashboard Design",
    "Finalizing theme, layout and workbook settings..."
);


            // ============================================================
            // 19. BACKEND / SETTINGS VISIBILITY
            // ============================================================

            
// ============================================================
// 19. STAGED SHEET VISIBILITY
// ============================================================
//
// IMPORTANT:
//
// These are temporary HXLT staged build sheets.
// Do NOT apply final Hidden / VeryHidden state here.
//
// Final visibility is applied only after the staged sheets
// have been successfully promoted to:
//
// Dashboard
// Dash_Backend
// Dash_Settings
//
// This avoids Excel API operations being performed against
// hidden staged objects during the remainder of the build.
// ============================================================

dashboardSheet.visibility =
    Excel.SheetVisibility.visible;

backendSheet.visibility =
    Excel.SheetVisibility.visible;

settingsSheet.visibility =
    Excel.SheetVisibility.visible;

                    // ============================================================
// 20. FINAL RESPONSIVE DASHBOARD FORMATTING
// ============================================================

const finalDashboardRange =
    dashboardSheet
        .getRange(
            dashboardCanvasRange
        );


// ============================================================
// CANVAS FONT / TEXT
// ============================================================

finalDashboardRange
    .format.wrapText =
    false;


finalDashboardRange
    .format.font.name =
    "Segoe UI";


// ============================================================
// RESPONSIVE COLUMN WIDTH
// ============================================================

const dashboardColumnRange =
    dashboardColumnName(
        dashboardLayout
            .start
            .column
    ) +
    ":" +
    dashboardColumnName(
        dashboardLayout
            .end
            .column
    );


// ============================================================
// HYBRID DASHBOARD â€” FIXED EXCEL COLUMN WIDTH
// ============================================================

const responsiveColumnWidth =
    26;

dashboardSheet
    .getRange(
        dashboardColumnRange
    )
    .format.columnWidth =
    responsiveColumnWidth;


// ============================================================
// RESPONSIVE BASE ROW HEIGHT
// ============================================================

const dashboardRowRange =
    dashboardLayout
        .start
        .row +
    ":" +
    dashboardLayout
        .end
        .row;


dashboardSheet
    .getRange(
        dashboardRowRange
    )
    .format.rowHeight =
    16;


// ============================================================
// HEADER HEIGHT
// ============================================================

const dashboardHeaderRows =
    dashboardLayout
        .start
        .row +
    ":" +
    Math.min(
        dashboardLayout
            .end
            .row,
        dashboardLayout
            .start
            .row +
        1
    );


dashboardSheet
    .getRange(
        dashboardHeaderRows
    )
    .format.rowHeight =
    30;


// ============================================================
// BRANDING / CONTROL ROW HEIGHT
// ============================================================

const dashboardControlRow =
    Math.min(
        dashboardLayout
            .end
            .row,
        dashboardLayout
            .start
            .row +
        2
    );


dashboardSheet
    .getRange(
        dashboardControlRow +
        ":" +
        dashboardControlRow
    )
    .format.rowHeight =
    22;


// ============================================================
// KPI AREA HEIGHT
// ============================================================

const dashboardKpiStartRow =
    Math.min(
        dashboardLayout
            .end
            .row,
        dashboardLayout
            .start
            .row +
        4
    );


const dashboardKpiEndRow =
    Math.min(
        dashboardLayout
            .end
            .row,
        dashboardLayout
            .start
            .row +
        16
    );


if (
    dashboardKpiEndRow >=
    dashboardKpiStartRow
) {

    dashboardSheet
        .getRange(
            dashboardKpiStartRow +
            ":" +
            dashboardKpiEndRow
        )
        .format.rowHeight =
        20;

}


// ============================================================
// DASHBOARD OUTER BORDER
// ============================================================

const dashboardBorderColor =
    "#D6E2EE";


[
    "EdgeTop",
    "EdgeBottom",
    "EdgeLeft",
    "EdgeRight"
].forEach(
    function (borderName) {

        const border =
            finalDashboardRange
                .format
                .borders
                .getItem(
                    borderName
                );


        border.style =
            "Continuous";


        border.color =
            dashboardBorderColor;

    }
);


// ============================================================
// CANVAS VIEW SETTINGS
// ============================================================

dashboardSheet.showGridlines =
    config.gridlines ===
    "show";


                reportDashboardProgress(
    95,
    "security",
    "Applying Dashboard Security",
    "Applying protection and final workbook settings..."
);


                            // ============================================================
            // 21. DASHBOARD SECURITY
            // ============================================================

            if (
                config.protectDashboard ===
                true
            ) {

                dashboardSheet.protection.protect({
                    allowFormatCells: false,
                    allowInsertRows: false,
                    allowDeleteRows: false,
                    allowSort: false,
                    allowAutoFilter: true
                });

            }


            if (
                config.lockSettings ===
                true
            ) {

                settingsSheet.protection.protect({
                    allowFormatCells: false,
                    allowInsertRows: false,
                    allowDeleteRows: false,
                    allowSort: false,
                    allowAutoFilter: false
                });

            }

            reportDashboardProgress(
    98,
    "finishing",
    "Finalizing Dashboard",
    "Activating the completed dashboard..."
);

                // ============================================================
// AUTO FIT DASHBOARD TO EXCEL WINDOW
// ============================================================

try {

    if (
        typeof Office !== "undefined" &&
        Office.context &&
        Office.context.requirements &&
        Office.context.requirements.isSetSupported(
            "ExcelApiDesktop",
            "1.1"
        )
    ) {

        const activeWindow =
            context.workbook.application
                .activeWindow;


        activeWindow.load([
            "usableWidth",
            "usableHeight",
            "zoom"
        ]);


        const canvasRange =
            dashboardSheet
                .getRange(
                    dashboardCanvasRange
                );


        canvasRange.load([
            "width",
            "height"
        ]);


        await context.sync();


        const horizontalZoom =
            (
                activeWindow.usableWidth /
                Math.max(
                    1,
                    canvasRange.width
                )
            ) *
            100;


        const verticalZoom =
            (
                activeWindow.usableHeight /
                Math.max(
                    1,
                    canvasRange.height
                )
            ) *
            100;


                // ============================================================
// SMART READABLE AUTO ZOOM
// ============================================================

const calculatedFitZoom =
    Math.floor(
        Math.min(
            horizontalZoom,
            verticalZoom
        ) *
        0.96
    );


let minimumReadableZoom =
    65;

let maximumReadableZoom =
    90;


if (
    detectedCanvasPreset ===
    "wide"
) {

    // Prefer readable dashboard content over extreme full-canvas shrink.
    minimumReadableZoom =
        65;

    maximumReadableZoom =
        85;

}
else if (
    detectedCanvasPreset ===
    "compact"
) {

    minimumReadableZoom =
        70;

    maximumReadableZoom =
        95;

}


const autoZoom =
    Math.max(
        minimumReadableZoom,
        Math.min(
            maximumReadableZoom,
            calculatedFitZoom
        )
    );


        if (
    useFixedExcelDashboardCanvas
) {

    activeWindow.zoom =
        70;

}
else {

    activeWindow.zoom =
        autoZoom;

}


        console.log(
            "Dashboard auto-fit zoom:",
            autoZoom
        );

    }

}
catch (
    dashboardZoomError
) {

    console.warn(
        "Dashboard auto-fit zoom could not be applied:",
        dashboardZoomError
    );

}

            // ============================================================
// PHASE 9 - FINAL RUNTIME RENDERER CERTIFICATION
//
// Do not report Dashboard Ready merely because configuration
// contains KPI / Chart / Slicer / Table definitions.
//
// Verify what Excel actually received before publishing.
// ============================================================

const expectedRuntimeKpiCount =
    configuredKpis.length > 0
        ? Math.min(
            configuredKpis.length,
            dynamicKpiPositions.length
        )
        : Math.min(
            6,
            dynamicKpiPositions.length
        );


const expectedRuntimeChartCount =
    configuredCharts.length > 0
        ? Math.min(
            configuredCharts.length,
            chartPositions.length
        )
        : 0;


const expectedRuntimeSlicerCount =
    slicerApiSupported
        ? configuredSlicers.length
        : 0;


const expectedRuntimeTableCount =
    configuredTables.length;


// ------------------------------------------------------------
// LOAD ACTUAL EXCEL OBJECT COLLECTIONS
// ------------------------------------------------------------

const runtimeChartCollection =
    dashboardSheet.charts;


const runtimeSlicerCollection =
    dashboardSheet.slicers;


runtimeChartCollection.load(
    "items/name"
);


runtimeSlicerCollection.load(
    "items/name"
);


const runtimeCanvasRange =
    dashboardSheet.getRange(
        dashboardCanvasRange
    );


runtimeCanvasRange.load([
    "left",
    "top",
    "width",
    "height"
]);


// ------------------------------------------------------------
// VERIFY KPI CELL CONTENT
// ------------------------------------------------------------

const runtimeKpiRanges =
    dynamicKpiPositions
        .slice(
            0,
            expectedRuntimeKpiCount
        )
        .map(
            function (rangeAddress) {

                const kpiRange =
                    dashboardSheet
                        .getRange(
                            rangeAddress
                        );


                kpiRange.load([
                    "values",
                    "formulas"
                ]);


                return kpiRange;

            }
        );


await context.sync();


const runtimeChartCount =
    runtimeChartCollection
        .items
        .length;


const runtimeSlicerCount =
    runtimeSlicerCollection
        .items
        .length;


const runtimeKpiCount =
    runtimeKpiRanges.filter(
        function (range) {

            const values =
                Array.isArray(
                    range.values
                )
                    ? range.values
                    : [];


            const formulas =
                Array.isArray(
                    range.formulas
                )
                    ? range.formulas
                    : [];


            const hasValue =
                values.some(
                    function (row) {

                        return (
                            Array.isArray(row) &&
                            row.some(
                                function (value) {

                                    return (
                                        String(
                                            value == null
                                                ? ""
                                                : value
                                        ).trim() !== ""
                                    );

                                }
                            )
                        );

                    }
                );


            const hasFormula =
                formulas.some(
                    function (row) {

                        return (
                            Array.isArray(row) &&
                            row.some(
                                function (formula) {

                                    return (
                                        String(
                                            formula == null
                                                ? ""
                                                : formula
                                        ).trim() !== ""
                                    );

                                }
                            )
                        );

                    }
                );


            return (
                hasValue ||
                hasFormula
            );

        }
    ).length;


// ------------------------------------------------------------
// COUNT VALIDATION
// ------------------------------------------------------------

if (
    runtimeKpiCount !==
    expectedRuntimeKpiCount
) {

    throw new Error(
        "Phase 9 runtime certification failed: " +
        "expected " +
        expectedRuntimeKpiCount +
        " KPI cards, but verified " +
        runtimeKpiCount +
        "."
    );

}


if (
    runtimeChartCount !==
    expectedRuntimeChartCount
) {

    throw new Error(
        "Phase 9 runtime certification failed: " +
        "expected " +
        expectedRuntimeChartCount +
        " charts, but Excel contains " +
        runtimeChartCount +
        "."
    );

}


if (
    runtimeSlicerCount !==
    expectedRuntimeSlicerCount
) {

    throw new Error(
        "Phase 9 runtime certification failed: " +
        "expected " +
        expectedRuntimeSlicerCount +
        " slicers, but Excel contains " +
        runtimeSlicerCount +
        "."
    );

}


if (
    renderedSmartTableCount !==
    expectedRuntimeTableCount
) {

    throw new Error(
        "Phase 9 runtime certification failed: " +
        "expected " +
        expectedRuntimeTableCount +
        " Smart Tables, but rendered " +
        renderedSmartTableCount +
        "."
    );

}


// ------------------------------------------------------------
// FLOATING OBJECT BOUNDARY VALIDATION
//
// Charts and slicers must remain inside the dashboard canvas.
// ------------------------------------------------------------

const runtimeCanvasLeft =
    runtimeCanvasRange.left;


const runtimeCanvasTop =
    runtimeCanvasRange.top;


const runtimeCanvasRight =
    runtimeCanvasLeft +
    runtimeCanvasRange.width;


const runtimeCanvasBottom =
    runtimeCanvasTop +
    runtimeCanvasRange.height;


const runtimeFloatingObjects = [
    ...runtimeChartCollection.items,
    ...runtimeSlicerCollection.items
];


runtimeFloatingObjects.forEach(
    function (item) {

        item.load([
            "name",
            "left",
            "top",
            "width",
            "height"
        ]);

    }
);


await context.sync();


const runtimeOutOfBoundsObjects =
    runtimeFloatingObjects.filter(
        function (item) {

            const right =
                item.left +
                item.width;


            const bottom =
                item.top +
                item.height;


            return (
                item.width <= 0 ||
                item.height <= 0 ||
                item.left <
                    runtimeCanvasLeft - 2 ||
                item.top <
                    runtimeCanvasTop - 2 ||
                right >
                    runtimeCanvasRight + 2 ||
                bottom >
                    runtimeCanvasBottom + 2
            );

        }
    );


if (
    runtimeOutOfBoundsObjects.length >
    0
) {

    throw new Error(
        "Phase 9 runtime certification failed: " +
        "dashboard object(s) outside the canvas: " +
        runtimeOutOfBoundsObjects
            .map(
                function (item) {
                    return item.name;
                }
            )
            .join(", ")
    );

}


console.log(
    "[PHASE 9] Runtime renderer certification PASS",
    {
        kpis:
            runtimeKpiCount,

        charts:
            runtimeChartCount,

        slicers:
            runtimeSlicerCount,

        tables:
            renderedSmartTableCount
    }
);

            // ============================================================
            // 22. DASHBOARD BUILD COMPLETE
            // ============================================================

// Do not activate the Dashboard sheet automatically.
// The user can open the dashboard explicitly from the Studio.

            // ============================================================
// FINAL PUBLISHED PROJECT METADATA SYNC
// ============================================================

const finalPublishedAt =
    new Date()
        .toISOString();


if (
    !dashboardProjectSnapshot.project ||
    typeof dashboardProjectSnapshot.project !==
        "object"
) {

    dashboardProjectSnapshot.project =
        {};

}


dashboardProjectSnapshot
    .project
    .publishedAt =
    finalPublishedAt;


dashboardProjectSnapshot
    .project
    .updatedAt =
    finalPublishedAt;


dashboardProjectSnapshot
    .project
    .lastSavedAt =
    finalPublishedAt;


dashboardProjectSnapshot
    .project
    .publishedVersion =
    Number(
        dashboardProjectSnapshot
            .project
            .publishedVersion ||
        0
    ) +
    1;


dashboardProjectSnapshot
    .project
    .status =
    "published";


dashboardProjectSnapshot
    .project
    .mode =
    "edit";


dashboardProjectSnapshot
    .project
    .isDirty =
    false;


    // ============================================================
// REWRITE FINAL PROJECT SNAPSHOT
//
// Keep the final published snapshot in the same chunked format.
// Never rewrite the complete JSON into a single Excel cell.
// ============================================================

const finalProjectConfigJson =
    JSON.stringify(
        dashboardProjectSnapshot
    );


const finalProjectConfigChunks =
    [];


for (
    let offset = 0;
    offset <
    finalProjectConfigJson.length;
    offset +=
    PROJECT_CONFIG_CHUNK_SIZE
) {

    finalProjectConfigChunks.push(
        finalProjectConfigJson.slice(
            offset,
            offset +
            PROJECT_CONFIG_CHUNK_SIZE
        )
    );

}


if (
    finalProjectConfigChunks.length === 0
) {

    finalProjectConfigChunks.push(
        ""
    );

}


// Keep schema in chunked-storage mode.
settingsSheet
    .getRange(
        "E2"
    )
    .values = [[
        "2"
    ]];


// Update final chunk count.
settingsSheet
    .getRange(
        "F2"
    )
    .values = [[
        finalProjectConfigChunks.length
    ]];


const finalProjectChunkRange =
    settingsSheet.getRangeByIndexes(
        1,
        3,
        finalProjectConfigChunks.length,
        1
    );


finalProjectChunkRange.values =
    finalProjectConfigChunks.map(
        function (chunk) {

            return [
                chunk
            ];

        }
    );


console.log(
    "Final Power Dashboard project snapshot saved:",
    {
        jsonLength:
            finalProjectConfigJson.length,

        chunks:
            finalProjectConfigChunks.length
    }
);


        // ============================================================
// FINAL STAGED BUILD SYNC
//
// The replacement dashboard must be fully committed before
// the existing owned dashboard is touched.
// ============================================================

await context.sync();


            // ============================================================
            // SAFE DASHBOARD PUBLISH
            // ============================================================

            // ------------------------------------------------------------
// STEP 1: MOVE EXISTING OWNED DASHBOARD TO BACKUP NAMES
// ------------------------------------------------------------

let oldBackendTable =
    null;


let previousDashboardVisibility =
    Excel.SheetVisibility.visible;


let previousBackendVisibility =
    Excel.SheetVisibility.veryHidden;


let previousSettingsVisibility =
    Excel.SheetVisibility.veryHidden;

if (
    existingGeneratedSheets.length > 0
) {

    const oldDashboardEntry =
        existingGeneratedSheets.find(
            function (entry) {
                return entry.name ===
                    "Dashboard";
            }
        );

    const oldBackendEntry =
        existingGeneratedSheets.find(
            function (entry) {
                return entry.name ===
                    "Dash_Backend";
            }
        );

    const oldSettingsEntry =
        existingGeneratedSheets.find(
            function (entry) {
                return entry.name ===
                    "Dash_Settings";
            }
        );

        if (
    oldDashboardEntry
) {

    previousDashboardVisibility =
        oldDashboardEntry
            .sheet
            .visibility;

}


if (
    oldBackendEntry
) {

    previousBackendVisibility =
        oldBackendEntry
            .sheet
            .visibility;

}


if (
    oldSettingsEntry
) {

    previousSettingsVisibility =
        oldSettingsEntry
            .sheet
            .visibility;

}


    if (
        oldBackendEntry
    ) {

        oldBackendTable =
            oldBackendEntry
                .sheet
                .tables
                .getItemOrNullObject(
                    "DashDataTable"
                );

        oldBackendTable.load(
              "name,isNullObject"
        );

        await context.sync();
    }


        // ------------------------------------------------------------
    // PHASE 9 - PREPARE OLD OWNED SHEETS FOR SAFE BACKUP RENAME
    //
    // Existing Dash_Backend / Dash_Settings may be VeryHidden
    // after the previous successful dashboard build.
    //
    // Before renaming them to temporary backup names, make the
    // owned sheets visible and commit that state first.
    //
    // The backup sheets remain temporary and are deleted after
    // the new staged dashboard is promoted successfully.
    // ------------------------------------------------------------

    if (
        oldDashboardEntry
    ) {
        oldDashboardEntry.sheet.visibility =
            Excel.SheetVisibility.visible;
    }

    if (
        oldBackendEntry
    ) {
        oldBackendEntry.sheet.visibility =
            Excel.SheetVisibility.visible;
    }

    if (
        oldSettingsEntry
    ) {
        oldSettingsEntry.sheet.visibility =
            Excel.SheetVisibility.visible;
    }

    await context.sync();


    if (
        oldDashboardEntry
    ) {
        oldDashboardEntry.sheet.name =
            backupDashboardSheetName;
    }

    if (
        oldBackendEntry
    ) {
        oldBackendEntry.sheet.name =
            backupBackendSheetName;

        if (
            oldBackendTable &&
            !oldBackendTable.isNullObject
        ) {
            oldBackendTable.name =
                backupBackendTableName;
        }
    }

    if (
        oldSettingsEntry
    ) {
        oldSettingsEntry.sheet.name =
            backupSettingsSheetName;
    }


    await context.sync();
}


        // ------------------------------------------------------------
        // STEP 2: PROMOTE STAGED DASHBOARD TO OFFICIAL NAMES
        // ------------------------------------------------------------

                    dashboardSheet.name =
                        "Dashboard";

                    backendSheet.name =
                        "Dash_Backend";

                    settingsSheet.name =
                        "Dash_Settings";

                    backendTable.name =
                        "DashDataTable";

                    await context.sync();

                    // ------------------------------------------------------------
// PHASE 9 - FINAL SHEET VISIBILITY ENFORCEMENT
//
// Re-apply visibility after staged sheets have been promoted
// to their official workbook names.
//
// Dashboard      -> Always Visible
// Dash_Backend   -> Visible only when Hide Backend = No
// Dash_Settings  -> Always VeryHidden
// ------------------------------------------------------------

dashboardSheet.visibility =
    Excel.SheetVisibility.visible;

if (
    config.hideBackend === false
) {

    backendSheet.visibility =
        Excel.SheetVisibility.visible;

}
else {

    backendSheet.visibility =
        Excel.SheetVisibility.veryHidden;

}

settingsSheet.visibility =
    Excel.SheetVisibility.veryHidden;

await context.sync();

                    // ------------------------------------------------------------
// STEP 3: REMOVE OLD BACKUP DASHBOARD ONLY AFTER SUCCESSFUL
// PROMOTION
//
// IMPORTANT:
// Backup cleanup is non-fatal. Once staged sheets have been
// successfully promoted to the official names, a cleanup
// failure must NOT roll back the new working dashboard.
// ------------------------------------------------------------

if (
    existingGeneratedSheets.length > 0
) {

    try {

        existingGeneratedSheets.forEach(
            function (entry) {
                entry.sheet.delete();
            }
        );

        await context.sync();

    }
    catch (
        backupCleanupError
    ) {

        console.warn(
            "Power Dashboard was published successfully, " +
            "but old backup sheets could not be fully removed:",
            backupCleanupError
        );

    }
}




                            reportDashboardProgress(
                    100,
                    "complete",
                    "Dashboard Ready",
                    "Power Dashboard created successfully."
                );

                            return {

                                project: {
                    ...dashboardProjectSnapshot.project
        },

                dashboardSheet:
                    "Dashboard",

                backendSheet:
                    "Dash_Backend",

                settingsSheet:
                    "Dash_Settings",

                sourceSheet:
                    sourceSheet.name,

                sourceRange:
                    configuredRange,

                rows:
                    sourceRange.rowCount - 1,
                    canvasMode:
    dashboardCanvasMode,

canvasPreset:
    dashboardCanvasPreset,

canvasStart:
    dashboardCanvasStart,

canvasEnd:
    dashboardCanvasEnd,

                columns:
                    sourceRange.columnCount,

                slicerCreated:
                    slicerCreated

            };

                    }
    )
    .catch(
        async function (dashboardBuildError) {

            console.error(
                "Power Dashboard build failed:",
                dashboardBuildError
            );

            try {

                await Excel.run(
                    async function (cleanupContext) {

                        const cleanupWorkbook =
                            cleanupContext.workbook;

                        const stagedDashboard =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    stagedDashboardSheetName
                                );

                        const stagedBackend =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    stagedBackendSheetName
                                );

                        const stagedSettings =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    stagedSettingsSheetName
                                );

                        const backupDashboard =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    backupDashboardSheetName
                                );

                        const backupBackend =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    backupBackendSheetName
                                );

                        const backupSettings =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    backupSettingsSheetName
                                );

                        const officialDashboard =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    "Dashboard"
                                );

                        const officialBackend =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    "Dash_Backend"
                                );

                        const officialSettings =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    "Dash_Settings"
                                );

                        stagedDashboard.load(
                            "name,isNullObject"
                        );

                        stagedBackend.load(
                            "name,isNullObject"
                        );

                        stagedSettings.load(
                            "name,isNullObject"
                        );

                        backupDashboard.load(
                            "name,isNullObject"
                        );

                        backupBackend.load(
                            "name,isNullObject"
                        );

                        backupSettings.load(
                            "name,isNullObject"
                        );

                        officialDashboard.load(
                            "name,isNullObject"
                        );

                        officialBackend.load(
                            "name,isNullObject"
                        );

                        officialSettings.load(
                            "name,isNullObject"
                        );

                        await cleanupContext.sync();

                        // --------------------------------------------
                        // CASE 1:
                        // Failure happened before publish started.
                        // Only staging sheets exist.
                        // --------------------------------------------

                        if (
                            !stagedDashboard.isNullObject
                        ) {
                            stagedDashboard.delete();
                        }

                        if (
                            !stagedBackend.isNullObject
                        ) {
                            stagedBackend.delete();
                        }

                        if (
                            !stagedSettings.isNullObject
                        ) {
                            stagedSettings.delete();
                        }


                        // --------------------------------------------
                        // CASE 2:
                        // Old dashboard was renamed to backup names,
                        // but staged promotion failed.
                        //
                        // Remove partially promoted new sheets first,
                        // then restore the old backup names.
                        // --------------------------------------------

                        if (
                            !backupDashboard.isNullObject
                        ) {

                            if (
                                !officialDashboard.isNullObject
                            ) {
                                officialDashboard.delete();
                            }

                            backupDashboard.name =
                                "Dashboard";
                        }

                        if (
                            !backupBackend.isNullObject
                        ) {

                            if (
                                !officialBackend.isNullObject
                            ) {
                                officialBackend.delete();
                            }

                            backupBackend.name =
                                "Dash_Backend";
                        }

                        if (
                            !backupSettings.isNullObject
                        ) {

                            if (
                                !officialSettings.isNullObject
                            ) {
                                officialSettings.delete();
                            }

                            backupSettings.name =
                                "Dash_Settings";
                        }

                        await cleanupContext.sync();

                        // ------------------------------------------------------------
// RESTORE PREVIOUS OWNED SHEET VISIBILITY
//
// Safe publish temporarily makes old generated sheets visible.
// If publish fails, rollback must restore their original state.
// ------------------------------------------------------------

const restoredDashboardSheet =
    cleanupWorkbook
        .worksheets
        .getItemOrNullObject(
            "Dashboard"
        );


const restoredBackendSheet =
    cleanupWorkbook
        .worksheets
        .getItemOrNullObject(
            "Dash_Backend"
        );


const restoredSettingsSheet =
    cleanupWorkbook
        .worksheets
        .getItemOrNullObject(
            "Dash_Settings"
        );


restoredDashboardSheet.load(
    "name,isNullObject"
);


restoredBackendSheet.load(
    "name,isNullObject"
);


restoredSettingsSheet.load(
    "name,isNullObject"
);


await cleanupContext.sync();


if (
    !restoredDashboardSheet.isNullObject
) {

    restoredDashboardSheet.visibility =
        previousDashboardVisibility;

}


if (
    !restoredBackendSheet.isNullObject
) {

    restoredBackendSheet.visibility =
        previousBackendVisibility;

}


if (
    !restoredSettingsSheet.isNullObject
) {

    restoredSettingsSheet.visibility =
        previousSettingsVisibility;

}


await cleanupContext.sync();


                        // --------------------------------------------
                        // Restore old backend table name if the old
                        // backend had already been moved to backup.
                        // --------------------------------------------

                        const restoredBackend =
                            cleanupWorkbook
                                .worksheets
                                .getItemOrNullObject(
                                    "Dash_Backend"
                                );

                        restoredBackend.load(
                            "name,isNullObject"
                        );

                        await cleanupContext.sync();

                        if (
                            !restoredBackend.isNullObject
                        ) {

                            const restoredOldTable =
                                restoredBackend
                                    .tables
                                    .getItemOrNullObject(
                                        backupBackendTableName
                                    );

                            restoredOldTable.load(
                                "name,isNullObject"
                            );

                            await cleanupContext.sync();

                            if (
                                !restoredOldTable.isNullObject
                            ) {
                                restoredOldTable.name =
                                    "DashDataTable";

                                await cleanupContext.sync();
                            }
                        }

                    }
                );

            }
            catch (
                dashboardCleanupError
            ) {

                console.error(
                    "Power Dashboard rollback cleanup failed:",
                    dashboardCleanupError
                );

            }


            reportDashboardProgress(
                100,
                "error",
                "Dashboard Build Failed",
                dashboardBuildError &&
                dashboardBuildError.message
                    ? dashboardBuildError.message
                    : String(
                        dashboardBuildError
                    )
            );


            throw dashboardBuildError;

        }
    );

}



function flashFillInfo(event) {

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const selected =
            workbook.getSelectedRange();

        selected.load([
            "address",
            "rowCount",
            "columnCount",
            "rowIndex",
            "columnIndex"
        ]);

        await context.sync();

        if (selected.rowCount < 1) {
            console.log(
                "Flash Fill: Please select cells."
            );
            return;
        }

        if (selected.columnCount !== 1) {
            console.log(
                "Flash Fill: Please select ONE target column only."
            );
            return;
        }

        const targetColumn =
            selected.columnIndex;

        if (targetColumn === 0) {
            console.log(
                "Flash Fill: Source column must be on the left."
            );
            return;
        }

        const sourceColumn =
            targetColumn - 1;

        const sheet =
            workbook.worksheets.getActiveWorksheet();

        const sourceRange =
            sheet.getRangeByIndexes(
                selected.rowIndex,
                sourceColumn,
                selected.rowCount,
                1
            );

        sourceRange.load("values");

        const headerCell =
            sheet.getCell(
                Math.max(
                    selected.rowIndex - 1,
                    0
                ),
                targetColumn
            );

        headerCell.load("values");

        await context.sync();

        const sourceValues =
            sourceRange.values;

        let header = "";

        if (
            headerCell.values &&
            headerCell.values[0]
        ) {
            header =
                String(
                    headerCell.values[0][0] || ""
                )
                .trim()
                .toLowerCase();
        }

        let mode = "first";

        if (
            header.includes("last") ||
            header.includes("surname") ||
            header.includes("family")
        ) {
            mode = "last";
        }

        const output = [];

        for (
            let i = 0;
            i < sourceValues.length;
            i++
        ) {

            const raw =
                sourceValues[i][0];

            if (
                raw === null ||
                raw === undefined
            ) {
                output.push([""]);
                continue;
            }

            const text =
                String(raw)
                    .trim()
                    .replace(/\s+/g, " ");

            if (text === "") {
                output.push([""]);
                continue;
            }

            const parts =
                text.split(" ");

            let result = parts[0];

            if (mode === "last") {
                result =
                    parts.length > 1
                        ? parts[parts.length - 1]
                        : parts[0];
            }

            output.push([
                result
            ]);
        }

        selected.values =
            output;

        await context.sync();

        console.log(
            "Flash Fill completed:",
            selected.address
        );

    })
    .catch(function (error) {

        console.error(
            "Flash Fill Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}


function textColumnsInfo(event) {

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const selected =
            workbook.getSelectedRange();

        selected.load([
            "address",
            "values",
            "rowCount",
            "columnCount",
            "rowIndex",
            "columnIndex"
        ]);

        await context.sync();

        if (selected.columnCount !== 1) {

            console.log(
                "Text to Columns: Please select ONE column only."
            );

            return;
        }

        const values =
            selected.values;

        const output = [];

        let maxColumns = 1;

        for (let i = 0; i < values.length; i++) {

            const raw =
                values[i][0];

            const text =
                raw === null || raw === undefined
                    ? ""
                    : String(raw).trim();

            const parts =
                text === ""
                    ? [""]
                    : text.split(/\s+/);

            output.push(parts);

            if (parts.length > maxColumns) {
                maxColumns = parts.length;
            }
        }

        for (let i = 0; i < output.length; i++) {

            while (output[i].length < maxColumns) {
                output[i].push("");
            }
        }

        const sheet =
            workbook.worksheets.getActiveWorksheet();

        const destination =
            sheet.getRangeByIndexes(
                selected.rowIndex,
                selected.columnIndex,
                selected.rowCount,
                maxColumns
            );

        destination.values =
            output;

        await context.sync();

        console.log(
            "Text to Columns completed:",
            selected.address
        );

    })
    .catch(function (error) {

        console.error(
            "Text to Columns Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}


function freezeTopRow(event) {

    Excel.run(async (context) => {

        const worksheet =
            context.workbook.worksheets
                .getActiveWorksheet();

        worksheet.freezePanes.freezeRows(1);

        await context.sync();

        console.log(
            "Freeze Panes: Top row frozen successfully."
        );

    })
    .catch(function (error) {

        console.error(
            "Freeze Panes Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}


function validationInfo(event) {

    Excel.run(async (context) => {

        const range =
            context.workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount",
            "values"
        ]);

        await context.sync();

        const values = range.values;

        if (
            !values ||
            values.length === 0 ||
            values[0].length === 0
        ) {

            console.log(
                "Data Validation: Please select cells."
            );

            return;
        }

        range.dataValidation.clear();

        const nonEmptyValues = [];

        for (let r = 0; r < values.length; r++) {

            for (let c = 0; c < values[r].length; c++) {

                const value =
                    values[r][c];

                if (
                    value !== null &&
                    value !== undefined &&
                    String(value).trim() !== ""
                ) {

                    nonEmptyValues.push(value);

                }
            }
        }

        if (nonEmptyValues.length === 0) {

            console.log(
                "Data Validation: No values found."
            );

            return;
        }

        let numericCount = 0;
        let textCount = 0;

        for (
            let i = 0;
            i < nonEmptyValues.length;
            i++
        ) {

            const value =
                nonEmptyValues[i];

            if (
                typeof value === "number" &&
                !isNaN(value)
            ) {

                numericCount++;

            } else {

                textCount++;

            }
        }

        /* TEXT DATA â†’ DROPDOWN */

        if (textCount >= numericCount) {

            const uniqueValues = [];

            for (
                let i = 0;
                i < nonEmptyValues.length;
                i++
            ) {

                const value =
                    String(
                        nonEmptyValues[i]
                    ).trim();

                if (
                    value !== "" &&
                    !uniqueValues.includes(value)
                ) {

                    uniqueValues.push(value);

                }
            }

            if (uniqueValues.length > 50) {

                console.log(
                    "Data Validation: Too many unique values."
                );

                return;
            }

            if (uniqueValues.length === 1) {

                console.log(
                    "Data Validation: Only one unique value found."
                );

                return;
            }

            const dropdownSource =
                uniqueValues
                    .map(function (value) {

                        return value.replace(
                            /"/g,
                            '""'
                        );

                    })
                    .join(",");

            range.dataValidation.rule = {

                list: {

                    inCellDropDown: true,

                    source: dropdownSource

                }

            };

            range.dataValidation.prompt = {

                showPrompt: true,

                title: "Himanshu XL Tools",

                message:
                    "Please select a value from the dropdown list."

            };

            range.dataValidation.errorAlert = {

                showAlert: true,

                title: "Invalid Value",

                message:
                    "Please select a value from the dropdown list.",

                style:
                    Excel.DataValidationAlertStyle.stop

            };

            await context.sync();

            console.log(
                "Smart Dropdown created:",
                range.address
            );

            return;
        }

        /* NUMERIC DATA â†’ RANGE VALIDATION */

        if (numericCount > 0) {

            const numericValues =
                nonEmptyValues
                    .map(function (value) {

                        return Number(value);

                    })
                    .filter(function (value) {

                        return !isNaN(value);

                    });

            if (numericValues.length === 0) {

                console.log(
                    "Data Validation: No valid numeric values."
                );

                return;
            }

            const minValue =
                Math.min.apply(
                    null,
                    numericValues
                );

            const maxValue =
                Math.max.apply(
                    null,
                    numericValues
                );

            range.dataValidation.rule = {

                decimal: {

                    formula1:
                        minValue.toString(),

                    formula2:
                        maxValue.toString(),

                    operator:
                        Excel.DataValidationOperator
                            .between

                }

            };

            range.dataValidation.prompt = {

                showPrompt: true,

                title: "Valid Number Range",

                message:
                    `Enter a number between ${minValue} and ${maxValue}.`

            };

            range.dataValidation.errorAlert = {

                showAlert: true,

                title: "Invalid Number",

                message:
                    `Please enter a number between ${minValue} and ${maxValue}.`,

                style:
                    Excel.DataValidationAlertStyle.stop

            };

            await context.sync();

            console.log(
                "Smart Number Validation applied:",
                range.address,
                minValue,
                maxValue
            );

        }

    })
    .catch(function (error) {

        console.error(
            "Data Validation Error:",
            error
        );

    })
    .finally(function () {

        event.completed();

    });

}



function conditionalFormatting(event) {

    reportToolStatus(
        "Conditional Formatting",
        "RUNNING",
        "Analyzing selected Excel data..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const range =
            workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount",
            "values",
            "rowIndex",
            "columnIndex"
        ]);

        await context.sync();


        /* =====================================================
           STEP 1 - VALIDATE SELECTION
           ===================================================== */

        if (
            range.rowCount < 2 ||
            range.columnCount < 1
        ) {

            const message =
                "Please select headers and at least one data row.";

            console.log(
                "Conditional Formatting:",
                message
            );

            await reportToolStatus(
                "Conditional Formatting",
                "ERROR",
                message
            );

            return;
        }


        const values =
            range.values;

        const headers =
            values[0];

        const sheet =
            workbook.worksheets
                .getActiveWorksheet();


        /* =====================================================
           STEP 2 - BUSINESS / NUMERIC COLUMN KEYWORDS
           ===================================================== */

        const metricKeywords = [
            "sales",
            "sale",
            "revenue",
            "amount",
            "price",
            "profit",
            "loss",
            "cost",
            "income",
            "total",
            "score",
            "marks",
            "quantity",
            "qty",
            "value",
            "salary",
            "target",
            "achievement",
            "percentage",
            "percent",
            "growth",
            "balance"
        ];


        /* =====================================================
           STEP 3 - FIND NUMERIC COLUMNS
           ===================================================== */

        const candidates = [];

        for (
            let c = 0;
            c < range.columnCount;
            c++
        ) {

            const header =
                String(
                    headers[c] || ""
                )
                    .trim()
                    .toLowerCase();

            let numericCount = 0;
            let nonEmptyCount = 0;


            for (
                let r = 1;
                r < values.length;
                r++
            ) {

                const value =
                    values[r][c];

                if (
                    value !== "" &&
                    value !== null &&
                    value !== undefined
                ) {

                    nonEmptyCount++;

                    const numericValue =
                        Number(value);

                    if (
                        !isNaN(numericValue)
                    ) {

                        numericCount++;

                    }

                }

            }


            const numericRatio =
                nonEmptyCount > 0
                    ? numericCount / nonEmptyCount
                    : 0;


            let keywordScore = 0;

            for (
                let k = 0;
                k < metricKeywords.length;
                k++
            ) {

                if (
                    header.includes(
                        metricKeywords[k]
                    )
                ) {

                    keywordScore += 10;

                }

            }


            if (
                numericCount > 0 &&
                numericRatio >= 0.6
            ) {

                candidates.push({

                    index: c,

                    header:
                        headers[c] ||
                        "Numeric Column",

                    numericCount:
                        numericCount,

                    numericRatio:
                        numericRatio,

                    keywordScore:
                        keywordScore

                });

            }

        }


        /* =====================================================
           STEP 4 - NO NUMERIC COLUMN FOUND
           ===================================================== */

        if (
            candidates.length === 0
        ) {

            const message =
                "No numeric business column found in the selected range.";

            console.log(
                "Conditional Formatting:",
                message
            );

            await reportToolStatus(
                "Conditional Formatting",
                "ERROR",
                message
            );

            return;
        }


        /* =====================================================
           STEP 5 - PICK BEST COLUMN
           ===================================================== */

        candidates.sort(
            function (a, b) {

                if (
                    b.keywordScore !==
                    a.keywordScore
                ) {

                    return (
                        b.keywordScore -
                        a.keywordScore
                    );

                }

                return (
                    b.numericCount -
                    a.numericCount
                );

            }
        );


        const selectedColumn =
            candidates[0];

        const columnIndex =
            selectedColumn.index;

        const headerName =
            String(
                selectedColumn.header ||
                "Numeric Column"
            );


        /* =====================================================
           STEP 6 - CREATE DATA RANGE
           HEADER EXCLUDED
           ===================================================== */

        const dataRange =
            sheet.getRangeByIndexes(

                range.rowIndex + 1,

                range.columnIndex +
                    columnIndex,

                range.rowCount - 1,

                1

            );

            dataRange.load("address");


        /* =====================================================
           STEP 7 - REMOVE OLD CONDITIONAL FORMATTING
           ===================================================== */

        dataRange
            .conditionalFormats
            .clearAll();


        /* =====================================================
           STEP 8 - COLOR SCALE
           LOW -> MID -> HIGH
           ===================================================== */

        const colorScale =
            dataRange
                .conditionalFormats
                .add(
                    Excel
                        .ConditionalFormatType
                        .colorScale
                );


        colorScale.colorScale.criteria = {

            minimum: {

                formula: null,

                type:
                    Excel
                        .ConditionalFormatColorCriterionType
                        .lowestValue,

                color:
                    "#F8696B"

            },

            midpoint: {

                formula:
                    "50",

                type:
                    Excel
                        .ConditionalFormatColorCriterionType
                        .percent,

                color:
                    "#FFEB84"

            },

            maximum: {

                formula: null,

                type:
                    Excel
                        .ConditionalFormatColorCriterionType
                        .highestValue,

                color:
                    "#63BE7B"

            }

        };


        /* =====================================================
           STEP 9 - DATA BAR
           ===================================================== */

        const dataBar =
            dataRange
                .conditionalFormats
                .add(
                    Excel
                        .ConditionalFormatType
                        .dataBar
                );


        dataBar.dataBar.showDataBarOnly =
            false;


        /* =====================================================
           STEP 10 - APPLY
           ===================================================== */

        await context.sync();


        /* =====================================================
           STEP 11 - SUCCESS REPORT
           ===================================================== */

        console.log(
            "Conditional Formatting applied:",
            {
                column:
                    headerName,

                range:
                    dataRange.address
            }
        );


        await reportToolStatus(
            "Conditional Formatting",
            "SUCCESS",
            "Applied to " +
            dataRange.address +
            " | Column: " +
            headerName
        );

    })
    .catch(function (error) {

        console.error(
            "Conditional Formatting Error:",
            error
        );


        reportToolStatus(
            "Conditional Formatting",
            "ERROR",
            error &&
            error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}



function pivotInfo(event) {

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const sourceRange =
            workbook.getSelectedRange();

        sourceRange.load([
            "address",
            "rowCount",
            "columnCount",
            "values"
        ]);

        await context.sync();

        if (
            sourceRange.rowCount < 2 ||
            sourceRange.columnCount < 2
        ) {
            throw new Error(
                "Please select headers and data."
            );
        }

        const values =
            sourceRange.values;

        const headers =
            values[0].map(function (value) {
                return String(value || "").trim();
            });

        const rowHeader =
            headers[0];

        const valueHeader =
            headers[headers.length - 1];

        if (!rowHeader || !valueHeader) {
            throw new Error(
                "Pivot Table requires valid headers."
            );
        }

        const suffix =
            Date.now()
                .toString()
                .slice(-6);

        const pivotSheet =
            workbook.worksheets.add(
                "HXL_Pivot_" + suffix
            );

        await context.sync();

        const pivotTable =
            pivotSheet.pivotTables.add(
                "HXL_PivotTable_" + suffix,
                sourceRange,
                "A3"
            );

        await context.sync();

        pivotTable.rowHierarchies.add(
            pivotTable.hierarchies.getItem(
                rowHeader
            )
        );

        const dataHierarchy =
            pivotTable.dataHierarchies.add(
                pivotTable.hierarchies.getItem(
                    valueHeader
                )
            );

        dataHierarchy.summarizeBy =
            Excel.AggregationFunction.sum;

        const title =
            pivotSheet.getRange("A1:D1");

        title.merge(false);

        title.getCell(0, 0).values = [[
            "Himanshu XL Tools - Pivot Table"
        ]];

        title.format.font.bold = true;
        title.format.font.size = 16;
        title.format.font.color = "#FFFFFF";
        title.format.fill.color = "#217346";
        title.format.horizontalAlignment =
            Excel.HorizontalAlignment.center;

        await context.sync();

        pivotSheet
            .getUsedRange()
            .format
            .autofitColumns();

        pivotSheet.activate();

        await context.sync();

        await reportToolStatus(
            "Pivot Table",
            "SUCCESS",
            "Pivot Table created successfully from " +
            sourceRange.address
        );

    })
    .catch(function (error) {

        console.error(
            "Pivot Table Error:",
            error
        );

        reportToolStatus(
            "Pivot Table",
            "ERROR",
            error && error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}


function sumifsInfo(event) {

    reportToolStatus(
        "SUMIFS",
        "RUNNING",
        "Creating SUMIFS analysis..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const range =
            workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount"
        ]);

        await context.sync();


        /* =========================================
           VALIDATION
        ========================================= */

        if (
            range.rowCount < 2 ||
            range.columnCount < 3
        ) {

            await reportToolStatus(
                "SUMIFS",
                "ERROR",
                "Please select Employee, Department and Sales data."
            );

            return;
        }


        const sheet =
            workbook.worksheets
                .getActiveWorksheet();


        /* =========================================
           CLEAR OLD RESULT
        ========================================= */

        sheet.getRange("E1:F4")
            .clear(
                Excel.ClearApplyTo.all
            );


        /* =========================================
           RESULT TABLE
        ========================================= */

        sheet.getRange("E1:F1")
            .merge(false);

        sheet.getRange("E1")
            .values = [
                ["SUMIFS SUMMARY"]
            ];

        sheet.getRange("E2:F4")
            .values = [
                ["Department", "Total Sales"],
                ["IT", ""],
                ["Sales", ""]
            ];


        /* =========================================
           SUMIFS FORMULAS
        ========================================= */

        sheet.getRange("F3")
            .formulas = [
                ['=SUMIFS(C:C,B:B,E3)']
            ];

        sheet.getRange("F4")
            .formulas = [
                ['=SUMIFS(C:C,B:B,E4)']
            ];


        /* =========================================
           FORMAT
        ========================================= */

        sheet.getRange("E1:F1")
            .format.font.bold = true;

        sheet.getRange("E1:F1")
            .format.fill.color =
            "#217346";

        sheet.getRange("E1:F1")
            .format.font.color =
            "#FFFFFF";

        sheet.getRange("E1:F1")
            .format.horizontalAlignment =
            Excel.HorizontalAlignment.center;


        sheet.getRange("E2:F2")
            .format.font.bold = true;

        sheet.getRange("E2:F2")
            .format.fill.color =
            "#D9EAD3";


        sheet.getRange("F3:F4")
            .numberFormat = [
                ["â‚¹#,##0"],
                ["â‚¹#,##0"]
            ];


        sheet.getRange("E1:F4")
            .format.autofitColumns();


        await context.sync();


        console.log(
            "SUMIFS completed:",
            range.address
        );


        await reportToolStatus(
            "SUMIFS",
            "SUCCESS",
            "SUMIFS summary created in E1:F4."
        );

    })
    .catch(function (error) {

        console.error(
            "SUMIFS Error:",
            error
        );


        reportToolStatus(
            "SUMIFS",
            "ERROR",
            error && error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}


function countifsInfo(event) {

    reportToolStatus(
        "COUNTIFS",
        "RUNNING",
        "Creating COUNTIFS analysis..."
    );

    Excel.run(async (context) => {

        const workbook =
            context.workbook;

        const range =
            workbook.getSelectedRange();

        range.load([
            "address",
            "rowCount",
            "columnCount"
        ]);

        await context.sync();


        /* =========================================
           VALIDATION
        ========================================= */

        if (
            range.rowCount < 2 ||
            range.columnCount < 3
        ) {

            await reportToolStatus(
                "COUNTIFS",
                "ERROR",
                "Please select Employee, Department and Sales data."
            );

            return;
        }


        const sheet =
            workbook.worksheets
                .getActiveWorksheet();


        /* =========================================
           CLEAR OLD RESULT
        ========================================= */

        sheet.getRange("H1:I5")
            .clear(
                Excel.ClearApplyTo.all
            );


        /* =========================================
           RESULT TABLE
        ========================================= */

        sheet.getRange("H1:I1")
            .merge(false);

        sheet.getRange("H1")
            .values = [
                ["COUNTIFS SUMMARY"]
            ];

        sheet.getRange("H2:I5")
            .values = [
                ["Department", "Employee Count"],
                ["IT", ""],
                ["Sales", ""],
                ["Finance", ""]
            ];


        /* =========================================
           COUNTIFS FORMULAS
        ========================================= */

        sheet.getRange("I3")
            .formulas = [
                ['=COUNTIFS(B:B,H3)']
            ];

        sheet.getRange("I4")
            .formulas = [
                ['=COUNTIFS(B:B,H4)']
            ];

        sheet.getRange("I5")
            .formulas = [
                ['=COUNTIFS(B:B,H5)']
            ];


        /* =========================================
           FORMAT
        ========================================= */

        sheet.getRange("H1:I1")
            .format.font.bold = true;

        sheet.getRange("H1:I1")
            .format.fill.color =
            "#217346";

        sheet.getRange("H1:I1")
            .format.font.color =
            "#FFFFFF";

        sheet.getRange("H1:I1")
            .format.horizontalAlignment =
            Excel.HorizontalAlignment.center;


        sheet.getRange("H2:I2")
            .format.font.bold = true;

        sheet.getRange("H2:I2")
            .format.fill.color =
            "#D9EAD3";


        sheet.getRange("I3:I5")
            .numberFormat = [
                ["0"],
                ["0"],
                ["0"]
            ];


        sheet.getRange("H1:I5")
            .format.autofitColumns();


        await context.sync();


        console.log(
            "COUNTIFS completed:",
            range.address
        );


        await reportToolStatus(
            "COUNTIFS",
            "SUCCESS",
            "COUNTIFS summary created in H1:I5."
        );

    })
    .catch(function (error) {

        console.error(
            "COUNTIFS Error:",
            error
        );

        reportToolStatus(
            "COUNTIFS",
            "ERROR",
            error && error.message
                ? error.message
                : String(error)
        );

    })
    .finally(function () {

        event.completed();

    });

}



let mergeFilesDialog = null;


function openMergeFilesDialog(event) {

    reportToolStatus(
        "Merge Files",
        "RUNNING",
        "Opening Merge Files Builder..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("merge-files.html"),
        {
            height: 70,
            width: 45,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Merge Files Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Merge Files",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Merge Files Builder."
                );


                event.completed();

                return;

            }


            mergeFilesDialog =
                asyncResult.value;


            mergeFilesDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleMergeFilesMessage
            );


            mergeFilesDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Merge Files dialog closed:",
                        args
                    );

                    mergeFilesDialog = null;

                }
            );


            console.log(
                "Merge Files Builder opened."
            );


            event.completed();

        }
    );

}



async function handleMergeFilesMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (
            !payload ||
            payload.type !==
                "HXL_MERGE_FILES"
        ) {

            return;

        }


        await reportToolStatus(
            "Merge Files",
            "RUNNING",
            "Writing merged data to Excel..."
        );


        const mergedRows =
            payload.rows;


        const outputSheetName =
            payload.outputSheetName ||
            "Merged_Data";


        if (
            !Array.isArray(mergedRows) ||
            mergedRows.length < 2
        ) {

            throw new Error(
                "No merged data received."
            );

        }


        const columnCount =
            mergedRows[0].length;


        if (columnCount < 1) {

            throw new Error(
                "Merged data contains no columns."
            );

        }


        await Excel.run(
            async function (context) {

                const workbook =
                    context.workbook;


                let outputSheet =
                    workbook
                        .worksheets
                        .getItemOrNullObject(
                            outputSheetName
                        );


                outputSheet.load(
                    "isNullObject"
                );


                await context.sync();


                if (
                    outputSheet.isNullObject
                ) {

                    outputSheet =
                        workbook
                            .worksheets
                            .add(
                                outputSheetName
                            );

                }


                const usedRange =
                    outputSheet
                        .getUsedRangeOrNullObject();


                usedRange.load(
                    "isNullObject"
                );


                await context.sync();


                if (
                    !usedRange.isNullObject
                ) {

                    usedRange.clear(
                        Excel.ClearApplyTo.all
                    );

                }


                const targetRange =
                    outputSheet
                        .getRangeByIndexes(
                            0,
                            0,
                            mergedRows.length,
                            columnCount
                        );


                targetRange.values =
                    mergedRows;


                const headerRange =
                    outputSheet
                        .getRangeByIndexes(
                            0,
                            0,
                            1,
                            columnCount
                        );


                headerRange.format.font.bold =
                    true;

                headerRange.format.font.color =
                    "#FFFFFF";

                headerRange.format.fill.color =
                    "#217346";


                targetRange
                    .format
                    .autofitColumns();

                targetRange
                    .format
                    .autofitRows();


                outputSheet.activate();


                await context.sync();

            }
        );


        await reportToolStatus(
            "Merge Files",
            "SUCCESS",
            "Merged " +
            payload.fileCount +
            " files, " +
            payload.dataRowCount +
            " rows into " +
            outputSheetName +
            "."
        );


        console.log(
            "Merge Files completed:",
            payload
        );


        if (mergeFilesDialog) {

            mergeFilesDialog.close();

            mergeFilesDialog = null;

        }


    } catch (error) {

        console.error(
            "Merge Files Parent Error:",
            error
        );


        await reportToolStatus(
            "Merge Files",
            "ERROR",
            error &&
            error.message
                ? error.message
                : String(error)
        );

    }

}


/* =========================================================
   SPLIT WORKBOOK
   ========================================================= */

let splitWorkbookDialog = null;


function openSplitWorkbookDialog(event) {

    reportToolStatus(
        "Split Workbook",
        "RUNNING",
        "Opening Split Workbook Builder..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("split-workbook.html"),
        {
            height: 70,
            width: 45,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Split Workbook Dialog Error:",
                    asyncResult.error
                );

                reportToolStatus(
                    "Split Workbook",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Split Workbook Builder."
                );

                event.completed();
                return;
            }


            splitWorkbookDialog =
                asyncResult.value;


            splitWorkbookDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleSplitWorkbookMessage
            );


            splitWorkbookDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function () {

                    splitWorkbookDialog = null;

                }
            );


            event.completed();

        }
    );

}


async function handleSplitWorkbookMessage(arg) {

    try {

        const payload =
            JSON.parse(arg.message);


        /* -----------------------------------------
           DIALOG READY â†’ SEND SHEET LIST
        ----------------------------------------- */

        if (
            payload.type ===
            "HXL_SPLIT_READY"
        ) {

            await Excel.run(
                async function (context) {

                    const sheets =
                        context.workbook.worksheets;

                    sheets.load(
                        "items/name"
                    );

                    await context.sync();


                    const sheetNames =
                        sheets.items.map(
                            function (sheet) {
                                return sheet.name;
                            }
                        );


                    if (splitWorkbookDialog) {

                        splitWorkbookDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_SPLIT_SHEETS",

                                sheets:
                                    sheetNames
                            })
                        );

                    }

                }
            );

            return;
        }


        /* -----------------------------------------
           EXPORT REQUEST
        ----------------------------------------- */

        if (
            payload.type !==
            "HXL_SPLIT_EXPORT"
        ) {

            return;
        }


        const selectedSheets =
            payload.sheets || [];


        if (
            selectedSheets.length === 0
        ) {

            throw new Error(
                "No worksheets selected."
            );

        }


        await reportToolStatus(
            "Split Workbook",
            "RUNNING",
            "Reading selected worksheets..."
        );


        const exportSheets = [];


        await Excel.run(
            async function (context) {

                const workbook =
                    context.workbook;


                for (
                    const sheetName
                    of selectedSheets
                ) {

                    const sheet =
                        workbook
                            .worksheets
                            .getItem(
                                sheetName
                            );


                    const usedRange =
                        sheet
                            .getUsedRangeOrNullObject();


                    usedRange.load([
                        "isNullObject",
                        "values",
                        "formulas"
                    ]);


                    await context.sync();


                    if (
                        usedRange.isNullObject
                    ) {

                        exportSheets.push({
                            name:
                                sheetName,

                            values:
                                []
                        });

                        continue;
                    }


                    /*
                       formulas contains values for
                       non-formula cells and formula text
                       for formula cells.
                    */

                    exportSheets.push({
                        name:
                            sheetName,

                        values:
                            usedRange.formulas
                    });

                }

            }
        );


        if (splitWorkbookDialog) {

            splitWorkbookDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_SPLIT_EXPORT_DATA",

                    sheets:
                        exportSheets
                })
            );

        }


        await reportToolStatus(
            "Split Workbook",
            "SUCCESS",
            selectedSheets.length +
            " worksheet(s) prepared for export."
        );


    } catch (error) {

        console.error(
            "Split Workbook Error:",
            error
        );


        reportToolStatus(
            "Split Workbook",
            "ERROR",
            error &&
            error.message
                ? error.message
                : String(error)
        );


        if (splitWorkbookDialog) {

            splitWorkbookDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_SPLIT_ERROR",

                    message:
                        error &&
                        error.message
                            ? error.message
                            : String(error)
                })
            );

        }

    }

}

// ============================================================
// HYBRID DASHBOARD â€” EXPORT DASHBOARD TO POWERPOINT
// ============================================================



async function getPowerDashboardPngBase64() {

    return Excel.run(
        async function (context) {

            const dashboardSheet =
    context.workbook.worksheets
        .getItemOrNullObject("Dashboard");

dashboardSheet.load(
    "isNullObject"
);

await context.sync();

if (
    dashboardSheet.isNullObject
) {

    throw new Error(
        "Dashboard is not built yet. Please click Build Dashboard first, then export PowerPoint."
    );

}


            const dashboardRange =
                dashboardSheet.getRange(
                    "B2:AD58"
                );


            const dashboardImage =
                dashboardRange.getImage();


            await context.sync();


            if (
                !dashboardImage.value
            ) {

                throw new Error(
                    "Dashboard image could not be created."
                );

            }


            return dashboardImage.value;

        }
    );

}

/* =========================================================
   EXPORT POWERPOINT
   ========================================================= */

let exportPptDialog = null;


function openExportPptDialog() {

    reportToolStatus(
        "Export PPT",
        "RUNNING",
        "Opening Export PowerPoint Builder..."
    );


    Office.context.ui.displayDialogAsync(
       getHxlAppUrl("export-ppt.html"),
        {
            height: 65,
            width: 42,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Export PPT Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Export PPT",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Export PowerPoint Builder."
                );


                return;

            }


            exportPptDialog =
                asyncResult.value;


            exportPptDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleExportPptMessage
            );


            exportPptDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function () {

                    exportPptDialog =
                        null;

                }
            );

        }
    );

}


async function handleExportPptMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (
            !payload ||
            payload.type !==
            "HXL_EXPORT_PPT"
        ) {

            return;

        }


        await reportToolStatus(
            "Export PPT",
            "RUNNING",
            "Creating dashboard image..."
        );


        const base64 =
            await getPowerDashboardPngBase64();


        if (!base64) {

            throw new Error(
                "Dashboard image data is empty."
            );

        }


        if (
            exportPptDialog
        ) {

            exportPptDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_EXPORT_PPT_DATA",

                    fileName:
                        payload.fileName ||
                        "HimanshuXLTools_Dashboard",

                    base64:
                        base64
                })
            );

        }


        await reportToolStatus(
            "Export PPT",
            "SUCCESS",
            "Dashboard sent to PowerPoint exporter."
        );

    }
    catch (error) {

        console.error(
            "Export PowerPoint Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        reportToolStatus(
            "Export PPT",
            "ERROR",
            message
        );


        if (
            exportPptDialog
        ) {

            exportPptDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_EXPORT_PPT_ERROR",

                    message:
                        message
                })
            );

        }

    }

}


/* =========================================================
   EXPORT PDF
   ========================================================= */

let exportPdfDialog = null;


function openExportPdfDialog(event) {

    reportToolStatus(
        "Export PDF",
        "RUNNING",
        "Opening Export PDF Builder..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("export-pdf.html"),
        {
            height: 65,
            width: 42,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Export PDF Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Export PDF",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Export PDF Builder."
                );


                event.completed();
                return;
            }


            exportPdfDialog =
                asyncResult.value;


            exportPdfDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleExportPdfMessage
            );


            exportPdfDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function () {

                    exportPdfDialog = null;

                }
            );


            event.completed();

        }
    );

}


async function handleExportPdfMessage(arg) {

    try {

        const payload =
            JSON.parse(arg.message);


        if (
            !payload ||
            payload.type !==
            "HXL_EXPORT_PDF"
        ) {

            return;

        }


        await reportToolStatus(
            "Export PDF",
            "RUNNING",
            "Generating PDF..."
        );


        Office.context.document.getFileAsync(
            Office.FileType.Pdf,
            {
                sliceSize: 4194304
            },
            function (result) {

                if (
                    result.status ===
                    Office.AsyncResultStatus.Failed
                ) {

                    sendExportPdfError(
                        result.error &&
                        result.error.message
                            ? result.error.message
                            : "Unable to create PDF."
                    );

                    return;

                }


                const file =
                    result.value;


                const slices = [];

                let currentSlice = 0;


                function readNextSlice() {

                    file.getSliceAsync(
                        currentSlice,
                        function (sliceResult) {

                            if (
                                sliceResult.status ===
                                Office.AsyncResultStatus.Failed
                            ) {

                                file.closeAsync();

                                sendExportPdfError(
                                    sliceResult.error &&
                                    sliceResult.error.message
                                        ? sliceResult.error.message
                                        : "Unable to read PDF data."
                                );

                                return;

                            }


                            const slice =
                                sliceResult.value;


                            slices.push(
                                new Uint8Array(
                                    slice.data
                                )
                            );


                            currentSlice++;


                            if (
                                currentSlice <
                                file.sliceCount
                            ) {

                                readNextSlice();
                                return;

                            }


                            const combined =
                                combineByteArrays(
                                    slices
                                );


                            const base64 =
                                byteArrayToBase64(
                                    combined
                                );


                            file.closeAsync();


                            if (
                                exportPdfDialog
                            ) {

                                exportPdfDialog.messageChild(
                                    JSON.stringify({
                                        type:
                                            "HXL_EXPORT_PDF_DATA",

                                        fileName:
                                            payload.fileName ||
                                            "HimanshuXLTools_Export",

                                        base64:
                                            base64
                                    })
                                );

                            }


                            reportToolStatus(
                                "Export PDF",
                                "SUCCESS",
                                "PDF generated successfully."
                            );

                        }
                    );

                }


                readNextSlice();

            }
        );


    } catch (error) {

        sendExportPdfError(
            error &&
            error.message
                ? error.message
                : String(error)
        );

    }

}


function combineByteArrays(
    arrays
) {

    let totalLength = 0;


    arrays.forEach(
        function (array) {
            totalLength +=
                array.length;
        }
    );


    const result =
        new Uint8Array(
            totalLength
        );


    let offset = 0;


    arrays.forEach(
        function (array) {

            result.set(
                array,
                offset
            );

            offset +=
                array.length;

        }
    );


    return result;

}


function byteArrayToBase64(
    bytes
) {

    let binary = "";

    const chunkSize =
        0x8000;


    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        const chunk =
            bytes.subarray(
                i,
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
            );


        binary +=
            String.fromCharCode.apply(
                null,
                chunk
            );

    }


    return btoa(binary);

}


function sendExportPdfError(
    message
) {

    console.error(
        "Export PDF Error:",
        message
    );


    reportToolStatus(
        "Export PDF",
        "ERROR",
        message
    );


    if (
        exportPdfDialog
    ) {

        exportPdfDialog.messageChild(
            JSON.stringify({
                type:
                    "HXL_EXPORT_PDF_ERROR",

                message:
                    message
            })
        );

    }

}


/* =========================================================
   BATCH RENAME
   ========================================================= */

let batchRenameDialog = null;


function openBatchRenameDialog(event) {

    reportToolStatus(
        "Batch Rename",
        "RUNNING",
        "Opening Batch Rename Builder..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("batch-rename.html"),
        {
            height: 72,
            width: 46,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Batch Rename Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Batch Rename",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Batch Rename Builder."
                );


                event.completed();
                return;
            }


            batchRenameDialog =
                asyncResult.value;


            batchRenameDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Batch Rename dialog closed:",
                        args
                    );

                    batchRenameDialog = null;

                }
            );


            reportToolStatus(
                "Batch Rename",
                "SUCCESS",
                "Batch Rename Builder opened."
            );


            event.completed();

        }
    );

}


let hideUnhideSheetsDialog = null;


function openHideUnhideSheetsDialog(event) {

    reportToolStatus(
        "Hide / Unhide Sheets",
        "RUNNING",
        "Opening Hide / Unhide Sheets..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("hide-unhide-sheets.html"),
        {
            height: 70,
            width: 45,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Hide / Unhide Sheets Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Hide / Unhide Sheets",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Hide / Unhide Sheets."
                );


                event.completed();

                return;
            }


            hideUnhideSheetsDialog =
                asyncResult.value;
                
                hideUnhideSheetsDialog.addEventHandler(
    Office.EventType.DialogMessageReceived,
    handleHideUnhideSheetsMessage
);


            hideUnhideSheetsDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Hide / Unhide Sheets dialog closed:",
                        args
                    );

                    hideUnhideSheetsDialog = null;
                }
            );


            console.log(
                "Hide / Unhide Sheets opened."
            );


            event.completed();
        }
    );
}



async function handleHideUnhideSheetsMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        /* =========================================
           GET WORKBOOK SHEETS
           ========================================= */

        if (
            payload.type ===
            "HXL_GET_SHEETS"
        ) {

            await Excel.run(
                async function (context) {

                    const sheets =
                        context
                            .workbook
                            .worksheets;


                    sheets.load(
                        "items/name"
                    );


                    await context.sync();


                    sheets.items.forEach(
                        function (sheet) {

                            sheet.load(
                                "visibility"
                            );

                        }
                    );


                    await context.sync();


                    const result =
                        sheets.items.map(
                            function (sheet) {

                                return {
                                    name:
                                        sheet.name,

                                    visibility:
                                        sheet.visibility ===
                                        Excel.SheetVisibility.hidden
                                            ? "Hidden"
                                            : "Visible"
                                };

                            }
                        );


                    if (
                        hideUnhideSheetsDialog
                    ) {

                        hideUnhideSheetsDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_SHEETS_DATA",

                                sheets:
                                    result
                            })
                        );

                    }

                }
            );


            return;

        }


        /* =========================================
           APPLY VISIBILITY
           ========================================= */

        if (
            payload.type ===
            "HXL_APPLY_SHEET_VISIBILITY"
        ) {

            const requestedSheets =
                Array.isArray(
                    payload.sheets
                )
                    ? payload.sheets
                    : [];


            const visibleCount =
                requestedSheets.filter(
                    function (item) {

                        return (
                            item.visibility ===
                            "Visible"
                        );

                    }
                ).length;


            if (
                visibleCount < 1
            ) {

                throw new Error(
                    "At least one worksheet must remain visible."
                );

            }


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    /*
                       Make requested visible sheets
                       visible first.
                    */

                    requestedSheets.forEach(
                        function (item) {

                            if (
                                item.visibility ===
                                "Visible"
                            ) {

                                const sheet =
                                    workbook
                                        .worksheets
                                        .getItem(
                                            item.name
                                        );


                                sheet.visibility =
                                    Excel.SheetVisibility.visible;

                            }

                        }
                    );


                    await context.sync();


                    /*
                       Then hide requested sheets.
                    */

                    requestedSheets.forEach(
                        function (item) {

                            if (
                                item.visibility ===
                                "Hidden"
                            ) {

                                const sheet =
                                    workbook
                                        .worksheets
                                        .getItem(
                                            item.name
                                        );


                                sheet.visibility =
                                    Excel.SheetVisibility.hidden;

                            }

                        }
                    );


                    await context.sync();

                }
            );


            await reportToolStatus(
                "Hide / Unhide Sheets",
                "SUCCESS",
                "Worksheet visibility updated."
            );


            if (
                hideUnhideSheetsDialog
            ) {

                hideUnhideSheetsDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_SHEETS_APPLIED"
                    })
                );

            }

        }


    } catch (error) {

        console.error(
            "Hide / Unhide Sheets Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Hide / Unhide Sheets",
            "ERROR",
            message
        );


        if (
            hideUnhideSheetsDialog
        ) {

            hideUnhideSheetsDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_SHEETS_ERROR",

                    message:
                        message
                })
            );

        }

    }

}


let protectSheetDialog = null;


function openProtectSheetDialog(event) {

    reportToolStatus(
        "Protect Sheet",
        "RUNNING",
        "Opening Protect Sheet..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("protect-sheet.html"),
        {
            height: 72,
            width: 46,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Protect Sheet Dialog Error:",
                    asyncResult.error
                );

                reportToolStatus(
                    "Protect Sheet",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Protect Sheet."
                );

                event.completed();
                return;
            }


            protectSheetDialog =
                asyncResult.value;


            protectSheetDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleProtectSheetMessage
            );


            protectSheetDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Protect Sheet dialog closed:",
                        args
                    );

                    protectSheetDialog = null;

                }
            );


            event.completed();

        }
    );

}


async function handleProtectSheetMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        /* =========================================
           GET SHEETS + PROTECTION STATUS
           ========================================= */

        if (
            payload.type ===
            "HXL_GET_PROTECT_SHEETS"
        ) {

            await Excel.run(
                async function (context) {

                    const sheets =
                        context
                            .workbook
                            .worksheets;


                    sheets.load(
                        "items/name"
                    );


                    await context.sync();


                    sheets.items.forEach(
                        function (sheet) {

                            sheet.protection.load(
                                "protected"
                            );

                        }
                    );


                    await context.sync();


                    const result =
                        sheets.items.map(
                            function (sheet) {

                                return {
                                    name:
                                        sheet.name,

                                    protected:
                                        !!sheet
                                            .protection
                                            .protected
                                };

                            }
                        );


                    if (
                        protectSheetDialog
                    ) {

                        protectSheetDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_PROTECT_SHEETS_DATA",

                                sheets:
                                    result
                            })
                        );

                    }

                }
            );


            return;

        }


        /* =========================================
           APPLY PROTECT / UNPROTECT
           ========================================= */

        if (
            payload.type ===
            "HXL_APPLY_PROTECT_SHEET"
        ) {

            const sheetName =
                payload.sheetName;


            const mode =
                payload.mode;


            const password =
                payload.password || "";


            const options =
                payload.options || {};


            if (!sheetName) {

                throw new Error(
                    "Worksheet name is required."
                );

            }


            await Excel.run(
                async function (context) {

                    const sheet =
                        context
                            .workbook
                            .worksheets
                            .getItem(
                                sheetName
                            );


                    if (
                        mode ===
                        "protect"
                    ) {

                        const protectionOptions = {

                            allowFormatCells:
                                !!options.allowFormatCells,

                            allowInsertRows:
                                !!options.allowInsertRows,

                            allowDeleteRows:
                                !!options.allowDeleteRows,

                            allowSort:
                                !!options.allowSort,

                            allowAutoFilter:
                                !!options.allowAutoFilter

                        };


                        sheet.protection.protect(
                            protectionOptions,
                            password
                        );

                    } else {

                        sheet.protection.unprotect(
                            password
                        );

                    }


                    await context.sync();

                }
            );


            await reportToolStatus(
                "Protect Sheet",
                "SUCCESS",
                mode === "protect"
                    ? "Worksheet protected successfully."
                    : "Worksheet unprotected successfully."
            );


            if (
                protectSheetDialog
            ) {

                protectSheetDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_PROTECT_SHEET_RESULT",

                        success:
                            true,

                        message:
                            mode === "protect"
                                ? "âœ… Worksheet protected successfully."
                                : "âœ… Worksheet unprotected successfully."
                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Protect Sheet Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Protect Sheet",
            "ERROR",
            message
        );


        if (
            protectSheetDialog
        ) {

            protectSheetDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_PROTECT_SHEET_RESULT",

                    success:
                        false,

                    message:
                        message
                })
            );

        }

    }

}


let renameSheetsDialog = null;


function openRenameSheetsDialog(event) {

    reportToolStatus(
        "Rename Sheets",
        "RUNNING",
        "Opening Rename Sheets..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("rename-sheets.html"),
        {
            height: 72,
            width: 46,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Rename Sheets Dialog Error:",
                    asyncResult.error
                );

                reportToolStatus(
                    "Rename Sheets",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Rename Sheets."
                );

                event.completed();
                return;
            }


            renameSheetsDialog =
                asyncResult.value;


            renameSheetsDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleRenameSheetsMessage
            );


            renameSheetsDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Rename Sheets dialog closed:",
                        args
                    );

                    renameSheetsDialog = null;

                }
            );


            event.completed();

        }
    );

}


async function handleRenameSheetsMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        /* =========================================
           GET SHEET NAMES
           ========================================= */

        if (
            payload.type ===
            "HXL_GET_RENAME_SHEETS"
        ) {

            await Excel.run(
                async function (context) {

                    const sheets =
                        context
                            .workbook
                            .worksheets;


                    sheets.load(
                        "items/name"
                    );


                    await context.sync();


                    const result =
                        sheets.items.map(
                            function (sheet) {

                                return {
                                    name:
                                        sheet.name
                                };

                            }
                        );


                    if (
                        renameSheetsDialog
                    ) {

                        renameSheetsDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_RENAME_SHEETS_DATA",

                                sheets:
                                    result
                            })
                        );

                    }

                }
            );


            return;

        }


        /* =========================================
           APPLY SHEET RENAMES
           ========================================= */

        if (
            payload.type ===
            "HXL_APPLY_RENAME_SHEETS"
        ) {

            const changes =
                Array.isArray(
                    payload.changes
                )
                    ? payload.changes
                    : [];


            if (
                changes.length === 0
            ) {

                throw new Error(
                    "No sheet rename changes received."
                );

            }


            await Excel.run(
                async function (context) {

                    const sheets =
                        context
                            .workbook
                            .worksheets;


                    sheets.load(
                        "items/name"
                    );


                    await context.sync();


                    const existingNames =
                        sheets.items.map(
                            function (sheet) {

                                return sheet.name;

                            }
                        );


                    const finalNames =
                        existingNames.slice();


                    changes.forEach(
                        function (change) {

                            const index =
                                finalNames.findIndex(
                                    function (name) {

                                        return (
                                            name ===
                                            change.oldName
                                        );

                                    }
                                );


                            if (
                                index === -1
                            ) {

                                throw new Error(
                                    'Worksheet "' +
                                    change.oldName +
                                    '" was not found.'
                                );

                            }


                            finalNames[index] =
                                change.newName;

                        }
                    );


                    const normalized =
                        finalNames.map(
                            function (name) {

                                return String(name)
                                    .toLowerCase();

                            }
                        );


                    const uniqueNames =
                        new Set(
                            normalized
                        );


                    if (
                        uniqueNames.size !==
                        normalized.length
                    ) {

                        throw new Error(
                            "Every worksheet must have a unique name."
                        );

                    }


                    /*
                       Temporary rename first.
                       This avoids collisions for swaps like:

                       Sales     -> Customers
                       Customers -> Sales
                    */

                    const temporaryChanges =
                        [];


                    for (
                        let i = 0;
                        i < changes.length;
                        i++
                    ) {

                        const change =
                            changes[i];


                        const sheet =
                            sheets.getItem(
                                change.oldName
                            );


                        const temporaryName =
                            "__HXL_TMP_" +
                            Date.now() +
                            "_" +
                            i;


                        sheet.name =
                            temporaryName;


                        temporaryChanges.push({
                            temporaryName:
                                temporaryName,

                            finalName:
                                change.newName
                        });

                    }


                    await context.sync();


                    for (
                        const change of temporaryChanges
                    ) {

                        const sheet =
                            sheets.getItem(
                                change.temporaryName
                            );


                        sheet.name =
                            change.finalName;

                    }


                    await context.sync();

                }
            );


            await reportToolStatus(
                "Rename Sheets",
                "SUCCESS",
                changes.length +
                " worksheet(s) renamed successfully."
            );


            if (
                renameSheetsDialog
            ) {

                renameSheetsDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_RENAME_SHEETS_RESULT",

                        success:
                            true,

                        message:
                            changes.length +
                            " worksheet(s) renamed successfully."
                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Rename Sheets Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Rename Sheets",
            "ERROR",
            message
        );


        if (
            renameSheetsDialog
        ) {

            renameSheetsDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_RENAME_SHEETS_RESULT",

                    success:
                        false,

                    message:
                        message
                })
            );

        }

    }

}



let copyMoveSheetDialog = null;


function openCopyMoveSheetDialog(event) {

    reportToolStatus(
        "Copy / Move Sheet",
        "RUNNING",
        "Opening Copy / Move Sheet..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("copy-move-sheet.html"),
        {
            height: 72,
            width: 46,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Copy / Move Sheet Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Copy / Move Sheet",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Copy / Move Sheet."
                );


                event.completed();
                return;
            }


            copyMoveSheetDialog =
                asyncResult.value;


            copyMoveSheetDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleCopyMoveSheetMessage
            );


            copyMoveSheetDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Copy / Move Sheet dialog closed:",
                        args
                    );

                    copyMoveSheetDialog = null;

                }
            );


            event.completed();

        }
    );

}


async function handleCopyMoveSheetMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        /* =========================================
           GET WORKSHEET NAMES
           ========================================= */

        if (
            payload.type ===
            "HXL_GET_COPY_MOVE_SHEETS"
        ) {

            await Excel.run(
                async function (context) {

                    const sheets =
                        context
                            .workbook
                            .worksheets;


                    sheets.load(
                        "items/name"
                    );


                    await context.sync();


                    const names =
                        sheets.items.map(
                            function (sheet) {

                                return sheet.name;

                            }
                        );


                    if (
                        copyMoveSheetDialog
                    ) {

                        copyMoveSheetDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_COPY_MOVE_SHEETS_DATA",

                                sheets:
                                    names
                            })
                        );

                    }

                }
            );


            return;

        }


        /* =========================================
           COPY / MOVE
           ========================================= */

        if (
            payload.type ===
            "HXL_APPLY_COPY_MOVE_SHEET"
        ) {

            const mode =
                payload.mode;


            const sourceSheetName =
                payload.sourceSheet;


            const position =
                payload.position || "end";


            const targetSheetName =
                payload.targetSheet || "";


            const newName =
                payload.newName || "";


            if (
                !sourceSheetName
            ) {

                throw new Error(
                    "Source worksheet is required."
                );

            }


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheets =
                        workbook.worksheets;


                    sheets.load(
                        "items/name,items/position"
                    );


                    await context.sync();


                    const sourceSheet =
                        sheets.getItem(
                            sourceSheetName
                        );


                    if (
                        mode === "copy"
                    ) {

                        if (!newName) {

                            throw new Error(
                                "New worksheet name is required."
                            );

                        }


                        const duplicate =
                            sheets.items.some(
                                function (sheet) {

                                    return (
                                        sheet.name
                                            .toLowerCase() ===
                                        newName
                                            .toLowerCase()
                                    );

                                }
                            );


                        if (duplicate) {

                            throw new Error(
                                "A worksheet with this name already exists."
                            );

                        }


                        let copiedSheet;


                        if (
                            position === "before"
                        ) {

                            if (!targetSheetName) {

                                throw new Error(
                                    "Target worksheet is required."
                                );

                            }


                            const targetSheet =
                                sheets.getItem(
                                    targetSheetName
                                );


                            copiedSheet =
                                sourceSheet.copy(
                                    Excel.WorksheetPositionType.before,
                                    targetSheet
                                );

                        } else if (
                            position === "after"
                        ) {

                            if (!targetSheetName) {

                                throw new Error(
                                    "Target worksheet is required."
                                );

                            }


                            const targetSheet =
                                sheets.getItem(
                                    targetSheetName
                                );


                            copiedSheet =
                                sourceSheet.copy(
                                    Excel.WorksheetPositionType.after,
                                    targetSheet
                                );

                        } else {

                            copiedSheet =
                                sourceSheet.copy(
                                    Excel.WorksheetPositionType.end
                                );

                        }


                        copiedSheet.name =
                            newName;


                        await context.sync();

                    } else if (
                        mode === "move"
                    ) {

                        if (
                            position === "before"
                        ) {

                            if (!targetSheetName) {

                                throw new Error(
                                    "Target worksheet is required."
                                );

                            }


                            const targetSheet =
                                sheets.getItem(
                                    targetSheetName
                                );


                            targetSheet.load(
                                "position"
                            );


                            await context.sync();


                            sourceSheet.position =
                                targetSheet.position;

                        } else if (
                            position === "after"
                        ) {

                            if (!targetSheetName) {

                                throw new Error(
                                    "Target worksheet is required."
                                );

                            }


                            const targetSheet =
                                sheets.getItem(
                                    targetSheetName
                                );


                            targetSheet.load(
                                "position"
                            );


                            await context.sync();


                            sourceSheet.position =
                                targetSheet.position + 1;

                        } else {

                            sourceSheet.position =
                                sheets.items.length - 1;

                        }


                        await context.sync();

                    } else {

                        throw new Error(
                            "Invalid Copy / Move mode."
                        );

                    }

                }
            );


            const message =
                mode === "copy"
                    ? 'Worksheet copied as "' +
                      newName +
                      '".'
                    : 'Worksheet "' +
                      sourceSheetName +
                      '" moved successfully.';


            await reportToolStatus(
                "Copy / Move Sheet",
                "SUCCESS",
                message
            );


            if (
                copyMoveSheetDialog
            ) {

                copyMoveSheetDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_COPY_MOVE_SHEET_RESULT",

                        success:
                            true,

                        message:
                            message
                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Copy / Move Sheet Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Copy / Move Sheet",
            "ERROR",
            message
        );


        if (
            copyMoveSheetDialog
        ) {

            copyMoveSheetDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_COPY_MOVE_SHEET_RESULT",

                    success:
                        false,

                    message:
                        message
                })
            );

        }

    }

}


let quickCleanDialog = null;


function openQuickCleanDialog(event) {

    reportToolStatus(
        "Quick Clean",
        "RUNNING",
        "Opening Quick Clean..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("quick-clean.html"),
        {
            height: 76,
            width: 48,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Quick Clean Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Quick Clean",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Quick Clean."
                );


                event.completed();
                return;
            }


            quickCleanDialog =
                asyncResult.value;


            quickCleanDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleQuickCleanMessage
            );


            quickCleanDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Quick Clean dialog closed:",
                        args
                    );

                    quickCleanDialog = null;

                }
            );


            event.completed();

        }
    );

}



async function handleQuickCleanMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET QUICK CLEAN INFO
        // =========================================

        if (
            payload.type ===
            "HXL_GET_QUICK_CLEAN_INFO"
        ) {

            await Excel.run(
                async function (context) {

                    const sheet =
                        context.workbook
                            .worksheets
                            .getActiveWorksheet();


                    const selection =
                        context.workbook
                            .getSelectedRange();


                    const usedRange =
                        sheet.getUsedRangeOrNullObject();


                    sheet.load("name");
                    selection.load(
    "address,rowIndex,columnIndex,rowCount,columnCount"
);


                    await context.sync();


                    if (
                        quickCleanDialog
                    ) {

                        quickCleanDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_QUICK_CLEAN_INFO",

                                sheetName:
                                    sheet.name,

                                selectionAddress:
                                    selection.address,

                                usedRangeAddress:
                                    usedRange.isNullObject
                                        ? "-"
                                        : usedRange.address
                            })
                        );

                    }

                }
            );


            return;

        }


        // =========================================
        // RUN QUICK CLEAN
        // =========================================

        if (
            payload.type ===
            "HXL_RUN_QUICK_CLEAN"
        ) {

            const rangeMode =
                payload.rangeMode ===
                "usedRange"
                    ? "usedRange"
                    : "selection";


            const options =
                payload.options || {};


            const result = {
                cellsCleaned: 0,
                blankRowsRemoved: 0,
                duplicateRowsRemoved: 0,
                numbersConverted: 0
            };


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    let targetRange;


                    if (
                        rangeMode ===
                        "usedRange"
                    ) {

                        targetRange =
                            sheet
                                .getUsedRangeOrNullObject();


                        targetRange.load(
                            "isNullObject"
                        );


                        await context.sync();


                        if (
                            targetRange.isNullObject
                        ) {

                            throw new Error(
                                "The active worksheet has no used range."
                            );

                        }

                    } else {

    const savedSelection =
        payload.selection;


    if (
        !savedSelection ||
        typeof savedSelection.rowIndex !== "number" ||
        typeof savedSelection.columnIndex !== "number" ||
        typeof savedSelection.rowCount !== "number" ||
        typeof savedSelection.columnCount !== "number"
    ) {

        throw new Error(
            "Selected range information is unavailable. Close Formula Tools, select the Excel range, and open Formula Tools again."
        );

    }


    targetRange =
        sheet.getRangeByIndexes(
            savedSelection.rowIndex,
            savedSelection.columnIndex,
            savedSelection.rowCount,
            savedSelection.columnCount
        );

}

                    targetRange.load(
                        "values,rowCount,columnCount,rowIndex,columnIndex,address"
                    );


                    await context.sync();


                    let values =
                        targetRange.values;


                    if (
                        !Array.isArray(values) ||
                        values.length === 0
                    ) {

                        throw new Error(
                            "No data found in the selected range."
                        );

                    }


                    // =====================================
                    // CLEAN TEXT / CONVERT NUMBERS
                    // =====================================

                    for (
                        let r = 0;
                        r < values.length;
                        r++
                    ) {

                        for (
                            let c = 0;
                            c < values[r].length;
                            c++
                        ) {

                            const original =
                                values[r][c];


                            let value =
                                original;


                            if (
                                typeof value ===
                                "string"
                            ) {

                                if (
                                    options.cleanCharacters
                                ) {

                                    const cleaned =
                                        value.replace(
                                            /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
                                            ""
                                        );


                                    if (
                                        cleaned !== value
                                    ) {

                                        value =
                                            cleaned;

                                        result.cellsCleaned++;

                                    }

                                }


                                if (
                                    options.trimSpaces
                                ) {

                                    const trimmed =
                                        value
                                            .trim()
                                            .replace(
                                                /\s+/g,
                                                " "
                                            );


                                    if (
                                        trimmed !== value
                                    ) {

                                        value =
                                            trimmed;

                                        result.cellsCleaned++;

                                    }

                                }


                                if (
                                    options.convertNumbers
                                ) {

                                    const normalized =
                                        value
                                            .replace(
                                                /,/g,
                                                ""
                                            )
                                            .trim();


                                    if (
                                        normalized !== "" &&
                                        /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(
                                            normalized
                                        )
                                    ) {

                                        const numberValue =
                                            Number(
                                                normalized
                                            );


                                        if (
                                            Number.isFinite(
                                                numberValue
                                            )
                                        ) {

                                            value =
                                                numberValue;

                                            result.numbersConverted++;

                                        }

                                    }

                                }

                            }


                            values[r][c] =
                                value;

                        }

                    }


                    // =====================================
                    // REMOVE COMPLETELY BLANK ROWS
                    // =====================================

                    if (
                        options.removeBlankRows
                    ) {

                        const beforeCount =
                            values.length;


                        values =
                            values.filter(
                                function (row) {

                                    return row.some(
                                        function (value) {

                                            return !(
                                                value === "" ||
                                                value === null ||
                                                typeof value ===
                                                    "undefined"
                                            );

                                        }
                                    );

                                }
                            );


                        result.blankRowsRemoved =
                            beforeCount -
                            values.length;

                    }


                    // =====================================
                    // REMOVE DUPLICATE ROWS
                    // =====================================

                    if (
                        options.removeDuplicates
                    ) {

                        const seen =
                            new Set();


                        const uniqueRows =
                            [];


                        values.forEach(
                            function (row) {

                                const key =
                                    JSON.stringify(
                                        row
                                    );


                                if (
                                    !seen.has(key)
                                ) {

                                    seen.add(key);

                                    uniqueRows.push(
                                        row
                                    );

                                } else {

                                    result.duplicateRowsRemoved++;

                                }

                            }
                        );


                        values =
                            uniqueRows;

                    }


                    if (
                        values.length === 0
                    ) {

                        targetRange.clear(
                            Excel.ClearApplyTo.contents
                        );


                        await context.sync();

                        return;

                    }


                    // =====================================
                    // WRITE CLEANED RESULT
                    // =====================================

                    targetRange.clear(
                        Excel.ClearApplyTo.contents
                    );


                    const outputRange =
                        sheet.getRangeByIndexes(
                            targetRange.rowIndex,
                            targetRange.columnIndex,
                            values.length,
                            targetRange.columnCount
                        );


                    outputRange.values =
                        values;


                    outputRange.format.autofitColumns();
                    outputRange.format.autofitRows();


                    await context.sync();

                }
            );


            await reportToolStatus(
                "Quick Clean",
                "SUCCESS",
                "Quick Clean completed."
            );


            if (
                quickCleanDialog
            ) {

                quickCleanDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_QUICK_CLEAN_RESULT",

                        success:
                            true,

                        result:
                            result
                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Quick Clean Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Quick Clean",
            "ERROR",
            message
        );


        if (
            quickCleanDialog
        ) {

            quickCleanDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_QUICK_CLEAN_RESULT",

                    success:
                        false,

                    message:
                        message
                })
            );

        }

    }

}


let fillBlanksDialog = null;


function openFillBlanksDialog(event) {

    reportToolStatus(
        "Fill Blanks",
        "RUNNING",
        "Opening Fill Blanks..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("fill-blanks.html"),
        {
            height: 76,
            width: 48,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Fill Blanks Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Fill Blanks",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Fill Blanks."
                );


                event.completed();
                return;
            }


            fillBlanksDialog =
                asyncResult.value;


            fillBlanksDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleFillBlanksMessage
            );


            fillBlanksDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Fill Blanks dialog closed:",
                        args
                    );

                    fillBlanksDialog = null;

                }
            );


            event.completed();

        }
    );

}



async function handleFillBlanksMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET INFO
        // =========================================

        if (
            payload.type ===
            "HXL_GET_FILL_BLANKS_INFO"
        ) {

            await Excel.run(
                async function (context) {

                    const sheet =
                        context.workbook
                            .worksheets
                            .getActiveWorksheet();


                    const selection =
                        context.workbook
                            .getSelectedRange();


                    const usedRange =
                        sheet.getUsedRangeOrNullObject();


                    sheet.load("name");
                    selection.load("address");

                    usedRange.load(
                        "isNullObject,address"
                    );


                    await context.sync();


                    if (
                        fillBlanksDialog
                    ) {

                        fillBlanksDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_FILL_BLANKS_INFO",

                                sheetName:
                                    sheet.name,

                                selectionAddress:
                                    selection.address,

                                usedRangeAddress:
                                    usedRange.isNullObject
                                        ? "-"
                                        : usedRange.address
                            })
                        );

                    }

                }
            );


            return;

        }


        // =========================================
        // RUN FILL BLANKS
        // =========================================

        if (
            payload.type ===
            "HXL_RUN_FILL_BLANKS"
        ) {

            const rangeMode =
                payload.rangeMode ===
                "usedRange"
                    ? "usedRange"
                    : "selection";


            const method =
                payload.method || "fixed";


            const fillValue =
                payload.value;


            const formula =
                payload.formula || "";


            let filledCount = 0;


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    let targetRange;


                    if (
                        rangeMode ===
                        "usedRange"
                    ) {

                        targetRange =
                            sheet
                                .getUsedRangeOrNullObject();


                        targetRange.load(
                            "isNullObject"
                        );


                        await context.sync();


                        if (
                            targetRange.isNullObject
                        ) {

                            throw new Error(
                                "The active worksheet has no used range."
                            );

                        }

                    } else {

                        targetRange =
                            workbook
                                .getSelectedRange();

                    }


                    targetRange.load(
                        "values,rowCount,columnCount,rowIndex,columnIndex"
                    );


                    await context.sync();


                    const values =
                        targetRange.values;


                    const rowCount =
                        targetRange.rowCount;


                    const columnCount =
                        targetRange.columnCount;


                    if (
                        !Array.isArray(values) ||
                        values.length === 0
                    ) {

                        throw new Error(
                            "No cells found in the selected range."
                        );

                    }


                    // =====================================
                    // FIXED VALUE
                    // =====================================

                    if (
                        method === "fixed"
                    ) {

                        for (
                            let r = 0;
                            r < rowCount;
                            r++
                        ) {

                            for (
                                let c = 0;
                                c < columnCount;
                                c++
                            ) {

                                const current =
                                    values[r][c];


                                if (
                                    current === "" ||
                                    current === null ||
                                    typeof current ===
                                        "undefined"
                                ) {

                                    values[r][c] =
                                        fillValue;

                                    filledCount++;

                                }

                            }

                        }


                        targetRange.values =
                            values;


                        await context.sync();

                    }


                    // =====================================
                    // VALUE ABOVE
                    // =====================================

                    else if (
                        method === "above"
                    ) {

                        for (
                            let c = 0;
                            c < columnCount;
                            c++
                        ) {

                            let previousValue = null;
                            let hasPrevious = false;


                            for (
                                let r = 0;
                                r < rowCount;
                                r++
                            ) {

                                const current =
                                    values[r][c];


                                const blank =
                                    current === "" ||
                                    current === null ||
                                    typeof current ===
                                        "undefined";


                                if (blank) {

                                    if (hasPrevious) {

                                        values[r][c] =
                                            previousValue;

                                        filledCount++;

                                    }

                                } else {

                                    previousValue =
                                        current;

                                    hasPrevious =
                                        true;

                                }

                            }

                        }


                        targetRange.values =
                            values;


                        await context.sync();

                    }


                    // =====================================
                    // VALUE BELOW
                    // =====================================

                    else if (
                        method === "below"
                    ) {

                        for (
                            let c = 0;
                            c < columnCount;
                            c++
                        ) {

                            let nextValue = null;
                            let hasNext = false;


                            for (
                                let r =
                                    rowCount - 1;
                                r >= 0;
                                r--
                            ) {

                                const current =
                                    values[r][c];


                                const blank =
                                    current === "" ||
                                    current === null ||
                                    typeof current ===
                                        "undefined";


                                if (blank) {

                                    if (hasNext) {

                                        values[r][c] =
                                            nextValue;

                                        filledCount++;

                                    }

                                } else {

                                    nextValue =
                                        current;

                                    hasNext =
                                        true;

                                }

                            }

                        }


                        targetRange.values =
                            values;


                        await context.sync();

                    }


                    // =====================================
                    // FORMULA
                    // =====================================

                    else if (
                        method === "formula"
                    ) {

                        if (
                            !formula ||
                            formula.charAt(0) !== "="
                        ) {

                            throw new Error(
                                "A valid Excel formula beginning with = is required."
                            );

                        }


                        for (
                            let r = 0;
                            r < rowCount;
                            r++
                        ) {

                            for (
                                let c = 0;
                                c < columnCount;
                                c++
                            ) {

                                const current =
                                    values[r][c];


                                const blank =
                                    current === "" ||
                                    current === null ||
                                    typeof current ===
                                        "undefined";


                                if (blank) {

                                    const cell =
                                        sheet
                                            .getCell(
                                                targetRange.rowIndex + r,
                                                targetRange.columnIndex + c
                                            );


                                    cell.formulas =
                                        [[formula]];


                                    filledCount++;

                                }

                            }

                        }


                        await context.sync();

                    } else {

                        throw new Error(
                            "Invalid Fill Blanks method."
                        );

                    }


                    targetRange
                        .format
                        .autofitColumns();


                    await context.sync();

                }
            );


            await reportToolStatus(
                "Fill Blanks",
                "SUCCESS",
                filledCount +
                " blank cell(s) filled."
            );


            if (
                fillBlanksDialog
            ) {

                fillBlanksDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_FILL_BLANKS_RESULT",

                        success:
                            true,

                        filledCount:
                            filledCount
                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Fill Blanks Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Fill Blanks",
            "ERROR",
            message
        );


        if (
            fillBlanksDialog
        ) {

            fillBlanksDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_FILL_BLANKS_RESULT",

                    success:
                        false,

                    message:
                        message
                })
            );

        }

    }

}


let formulaToolsDialog = null;


function openFormulaToolsDialog(event) {

    reportToolStatus(
        "Formula Tools",
        "RUNNING",
        "Opening Formula Tools..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("formula-tools.html"),
        {
            height: 76,
            width: 48,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Formula Tools Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Formula Tools",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Formula Tools."
                );


                event.completed();
                return;
            }


            formulaToolsDialog =
                asyncResult.value;


            formulaToolsDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleFormulaToolsMessage
            );


            formulaToolsDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Formula Tools dialog closed:",
                        args
                    );

                    formulaToolsDialog = null;

                }
            );


            event.completed();

        }
    );

}



async function handleFormulaToolsMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET FORMULA TOOLS INFO
        // =========================================

        if (
            payload.type ===
            "HXL_GET_FORMULA_TOOLS_INFO"
        ) {

            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    const selection =
                        workbook
                            .getSelectedRange();


                    const usedRange =
                        sheet
                            .getUsedRangeOrNullObject();


                    selection.load(
    "address,rowIndex,columnIndex,rowCount,columnCount"
);

                    usedRange.load(
                        "isNullObject,address"
                    );


                    await context.sync();


                    if (
                        formulaToolsDialog
                    ) {

                           formulaToolsDialog.messageChild(
    JSON.stringify({
        type:
            "HXL_FORMULA_TOOLS_INFO",

        selectionAddress:
            selection.address,

        selectionRowIndex:
            selection.rowIndex,

        selectionColumnIndex:
            selection.columnIndex,

        selectionRowCount:
            selection.rowCount,

        selectionColumnCount:
            selection.columnCount,

        usedRangeAddress:
            usedRange.isNullObject
                ? "-"
                : usedRange.address
    })
);
                    }

                }
            );


            return;

        }


        // =========================================
        // RUN FORMULA TOOL
        // =========================================

        if (
            payload.type ===
            "HXL_RUN_FORMULA_TOOL"
        ) {

            const rangeMode =
                payload.rangeMode ===
                "usedRange"
                    ? "usedRange"
                    : "selection";


            const operation =
                payload.operation || "show";


            let results = [];

            let message =
                "Formula operation completed.";


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    let targetRange;


                    if (
                        rangeMode ===
                        "usedRange"
                    ) {

                        targetRange =
                            sheet
                                .getUsedRangeOrNullObject();


                        targetRange.load(
                            "isNullObject"
                        );


                        await context.sync();


                        if (
                            targetRange.isNullObject
                        ) {

                            throw new Error(
                                "The active worksheet has no used range."
                            );

                        }

                    } else {

    const savedSelection =
        payload.selection;


    if (
        !savedSelection ||
        typeof savedSelection.rowIndex !== "number" ||
        typeof savedSelection.columnIndex !== "number" ||
        typeof savedSelection.rowCount !== "number" ||
        typeof savedSelection.columnCount !== "number"
    ) {

        throw new Error(
            "Selected range information is unavailable. Close Formula Tools, select the Excel range, and open Formula Tools again."
        );

    }


    targetRange =
        sheet.getRangeByIndexes(
            savedSelection.rowIndex,
            savedSelection.columnIndex,
            savedSelection.rowCount,
            savedSelection.columnCount
        );

}

                    targetRange.load(
                        "address,values,formulas,rowCount,columnCount,rowIndex,columnIndex"
                    );


                    await context.sync();


                    const values =
                        targetRange.values;


                    const formulas =
                        targetRange.formulas;


                    const rowCount =
                        targetRange.rowCount;


                    const columnCount =
                        targetRange.columnCount;


                    // =====================================
                    // SHOW FORMULAS
                    // =====================================

                    if (
                        operation === "show"
                    ) {

                        let formulaCount = 0;


                        for (
                            let r = 0;
                            r < rowCount;
                            r++
                        ) {

                            for (
                                let c = 0;
                                c < columnCount;
                                c++
                            ) {

                                const formula =
                                    formulas[r][c];


                                if (
                                    typeof formula ===
                                        "string" &&
                                    formula.charAt(0) === "="
                                ) {

                                    const cell =
                                        sheet.getCell(
                                            targetRange.rowIndex + r,
                                            targetRange.columnIndex + c
                                        );


                                    cell.load(
                                        "address"
                                    );


                                    await context.sync();


                                    results.push(
                                        cell.address +
                                        "  " +
                                        formula
                                    );


                                    formulaCount++;

                                }

                            }

                        }


                        message =
                            formulaCount +
                            " formula cell(s) found.";

                    }


                    // =====================================
                    // CONVERT FORMULAS TO VALUES
                    // =====================================

                    else if (
                        operation === "values"
                    ) {

                        let convertedCount = 0;


                        for (
                            let r = 0;
                            r < rowCount;
                            r++
                        ) {

                            for (
                                let c = 0;
                                c < columnCount;
                                c++
                            ) {

                                const formula =
                                    formulas[r][c];


                                if (
                                    typeof formula ===
                                        "string" &&
                                    formula.charAt(0) === "="
                                ) {

                                    formulas[r][c] =
                                        values[r][c];

                                    convertedCount++;

                                }

                            }

                        }


                        targetRange.formulas =
                            formulas;


                        await context.sync();


                        message =
                            convertedCount +
                            " formula cell(s) converted to values.";

                    }


                    // =====================================
                    // FILL FORMULA DOWN
                    // =====================================

                    else if (
                        operation === "fillDown"
                    ) {

                        if (
                            rowCount < 2
                        ) {

                            throw new Error(
                                "Select at least two rows for Fill Formula Down."
                            );

                        }


                        let sourceFormulaFound =
                            false;


                        for (
                            let c = 0;
                            c < columnCount;
                            c++
                        ) {

                            const topFormula =
                                formulas[0][c];


                            if (
                                typeof topFormula ===
                                    "string" &&
                                topFormula.charAt(0) === "="
                            ) {

                                sourceFormulaFound =
                                    true;


                                    const sourceCell =
    targetRange.getCell(
        0,
        c
    );

const columnRange =
    targetRange.getColumn(
        c
    );

columnRange.copyFrom(
    sourceCell,
    Excel.RangeCopyType.formulas
);

                            }

                        }


                        if (
                            !sourceFormulaFound
                        ) {

                            throw new Error(
                                "No formula found in the top row of the selected range."
                            );

                        }


                        await context.sync();


                        message =
                            "Formula(s) filled down successfully.";

                    }


                    // =====================================
                    // FILL FORMULA RIGHT
                    // =====================================

                    else if (
                        operation === "fillRight"
                    ) {

                        if (
                            columnCount < 2
                        ) {

                            throw new Error(
                                "Select at least two columns for Fill Formula Right."
                            );

                        }


                        let sourceFormulaFound =
                            false;


                        for (
                            let r = 0;
                            r < rowCount;
                            r++
                        ) {

                            const leftFormula =
                                formulas[r][0];


                            if (
                                typeof leftFormula ===
                                    "string" &&
                                leftFormula.charAt(0) === "="
                            ) {

                                sourceFormulaFound =
                                    true;


                                const rowRange =
                                    targetRange.getRow(
                                        r
                                    );


                                rowRange.fillRight();

                            }

                        }


                        if (
                            !sourceFormulaFound
                        ) {

                            throw new Error(
                                "No formula found in the left column of the selected range."
                            );

                        }


                        await context.sync();


                        message =
                            "Formula(s) filled right successfully.";

                    }


                    // =====================================
                    // FIND FORMULA ERRORS
                    // =====================================

                    else if (
                        operation === "errors"
                    ) {

                        const errorTokens =
                            [
                                "#DIV/0!",
                                "#N/A",
                                "#NAME?",
                                "#NULL!",
                                "#NUM!",
                                "#REF!",
                                "#VALUE!",
                                "#SPILL!",
                                "#CALC!"
                            ];


                        let errorCount = 0;


                        for (
                            let r = 0;
                            r < rowCount;
                            r++
                        ) {

                            for (
                                let c = 0;
                                c < columnCount;
                                c++
                            ) {

                                const value =
                                    values[r][c];


                                if (
                                    typeof value ===
                                        "string" &&
                                    errorTokens.indexOf(
                                        value
                                    ) !== -1
                                ) {

                                    const cell =
                                        sheet.getCell(
                                            targetRange.rowIndex + r,
                                            targetRange.columnIndex + c
                                        );


                                    cell.load(
                                        "address"
                                    );


                                    await context.sync();


                                    results.push(
                                        cell.address +
                                        "  " +
                                        value
                                    );


                                    errorCount++;

                                }

                            }

                        }


                        message =
                            errorCount +
                            " formula error(s) found.";

                    } else {

                        throw new Error(
                            "Invalid Formula Tools operation."
                        );

                    }

                }
            );


            await reportToolStatus(
                "Formula Tools",
                "SUCCESS",
                message
            );


            if (
                formulaToolsDialog
            ) {

                formulaToolsDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_FORMULA_TOOLS_RESULT",

                        success:
                            true,

                        message:
                            message,

                        results:
                            results
                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Formula Tools Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Formula Tools",
            "ERROR",
            message
        );


        if (
            formulaToolsDialog
        ) {

            formulaToolsDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_FORMULA_TOOLS_RESULT",

                    success:
                        false,

                    message:
                        message,

                    results:
                        []
                })
            );

        }

    }

}


let autoRefreshDialog = null;


function openAutoRefreshDialog(event) {

    reportToolStatus(
        "Auto Refresh",
        "RUNNING",
        "Opening Auto Refresh..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("auto-refresh.html"),
        {
            height: 78,
            width: 48,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Auto Refresh Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Auto Refresh",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Auto Refresh."
                );


                event.completed();
                return;
            }


            autoRefreshDialog =
                asyncResult.value;


            autoRefreshDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleAutoRefreshMessage
            );


            autoRefreshDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Auto Refresh dialog closed:",
                        args
                    );

                    autoRefreshDialog = null;

                }
            );


            event.completed();

        }
    );

}



async function handleAutoRefreshMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET AUTO REFRESH INFO
        // =========================================

        if (
            payload.type ===
            "HXL_GET_AUTO_REFRESH_INFO"
        ) {

            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    sheet.load("name");


                    await context.sync();


                    if (
                        autoRefreshDialog
                    ) {

                        autoRefreshDialog.messageChild(
                            JSON.stringify({
                                type:
                                    "HXL_AUTO_REFRESH_INFO",

                                workbookName:
                                    "Current Workbook",

                                sheetName:
                                    sheet.name
                            })
                        );

                    }

                }
            );


            return;

        }


        // =========================================
        // RUN REFRESH
        // =========================================

        if (
            payload.type ===
            "HXL_RUN_AUTO_REFRESH"
        ) {

            const targets =
                payload.targets || {};


            const refreshConnections =
                targets.connections === true;


            const refreshPivots =
                targets.pivots === true;


            const recalculate =
                targets.calculate === true;


            if (
                !refreshConnections &&
                !refreshPivots &&
                !recalculate
            ) {

                throw new Error(
                    "Select at least one refresh target."
                );

            }


            const warnings = [];


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    // =====================================
                    // DATA CONNECTIONS
                    // =====================================

                    if (
                        refreshConnections
                    ) {

                        try {

                            workbook
                                .dataConnections
                                .refreshAll();


                            await context.sync();

                        } catch (
                            connectionError
                        ) {

                            console.warn(
                                "Auto Refresh data connections:",
                                connectionError
                            );


                            warnings.push(
                                "Data Connections could not be refreshed."
                            );

                        }

                    }


                    // =====================================
                    // PIVOT TABLES
                    // =====================================

                    if (
                        refreshPivots
                    ) {

                        try {

                            workbook
                                .pivotTables
                                .refreshAll();


                            await context.sync();

                        } catch (
                            pivotError
                        ) {

                            console.warn(
                                "Auto Refresh PivotTables:",
                                pivotError
                            );


                            warnings.push(
                                "PivotTables could not be refreshed."
                            );

                        }

                    }


                    // =====================================
                    // RECALCULATE FORMULAS
                    // =====================================

                    if (
                        recalculate
                    ) {

                        try {

                            workbook
                                .application
                                .calculate(
                                    Excel.CalculationType.fullRebuild
                                );


                            await context.sync();

                        } catch (
                            calculationError
                        ) {

                            console.warn(
                                "Auto Refresh calculation:",
                                calculationError
                            );


                            warnings.push(
                                "Workbook formulas could not be recalculated."
                            );

                        }

                    }

                }
            );


            const time =
                new Date()
                    .toLocaleTimeString();


            let resultMessage =
                "Workbook refresh completed.";


            if (
                warnings.length > 0
            ) {

                resultMessage +=
                    " " +
                    warnings.join(" ");

            }


            await reportToolStatus(
                "Auto Refresh",
                warnings.length > 0
                    ? "WARNING"
                    : "SUCCESS",
                resultMessage
            );


            if (
                autoRefreshDialog
            ) {

                autoRefreshDialog.messageChild(
                    JSON.stringify({
                        type:
                            "HXL_AUTO_REFRESH_RESULT",

                        success:
                            true,

                        message:
                            resultMessage,

                        warnings:
                            warnings,

                        time:
                            time
                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Auto Refresh Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Auto Refresh",
            "ERROR",
            message
        );


        if (
            autoRefreshDialog
        ) {

            autoRefreshDialog.messageChild(
                JSON.stringify({
                    type:
                        "HXL_AUTO_REFRESH_RESULT",

                    success:
                        false,

                    message:
                        message
                })
            );

        }

    }

}


let aiFormulaDialog = null;


function openAIFormulaDialog(event) {

    reportToolStatus(
        "AI Formula",
        "RUNNING",
        "Opening AI Formula..."
    );


    Office.context.ui.displayDialogAsync(
                            getHxlAppUrl("ai-formula.html"),        
        {
            height: 78,
            width: 48,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "AI Formula Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "AI Formula",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open AI Formula."
                );


                event.completed();
                return;
            }


            aiFormulaDialog =
                asyncResult.value;


            aiFormulaDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleAIFormulaMessage
            );


            aiFormulaDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "AI Formula dialog closed:",
                        args
                    );

                    aiFormulaDialog = null;

                }
            );


            event.completed();

        }
    );

}



async function handleAIFormulaMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET CURRENT EXCEL SELECTION
        // =========================================

        if (
            payload.type ===
            "HXL_GET_AI_FORMULA_INFO"
        ) {

               console.log(
    "HXL AI GENERATE MESSAGE RECEIVED",
    payload
); 

            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    const selection =
                        workbook
                            .getSelectedRange();


                    sheet.load("name");


                    selection.load(
                        "address,rowIndex,columnIndex,rowCount,columnCount,values,formulas"
                    );


                    await context.sync();


                    if (
                        aiFormulaDialog
                    ) {

                        aiFormulaDialog.messageChild(
                            JSON.stringify({

                                type:
                                    "HXL_AI_FORMULA_INFO",

                                selectionAddress:
                                    selection.address,

                                selection: {

                                    sheetName:
                                        sheet.name,

                                    address:
                                        selection.address,

                                    rowIndex:
                                        selection.rowIndex,

                                    columnIndex:
                                        selection.columnIndex,

                                    rowCount:
                                        selection.rowCount,

                                    columnCount:
                                        selection.columnCount,

                                    values:
                                        selection.values,

                                    formulas:
                                        selection.formulas
                                }

                            })
                        );

                    }

                }
            );


            return;

        }


                    // =========================================
        // GENERATE AI FORMULA
        // OPENAI BACKEND
        // =========================================

        if (
            payload.type ===
            "HXL_GENERATE_AI_FORMULA"
        ) {

            const prompt =
                String(
                    payload.prompt || ""
                ).trim();


            const selection =
                payload.selection || {};


            if (!prompt) {

                throw new Error(
                    "Enter what you want to calculate."
                );

            }


            try {

                const response =
                    await fetch(
                        "https://himanshu-xl-tools-ai-backend.onrender.com/api/ai/formula",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    prompt:
                                        prompt,

                                    selection:
                                        selection
                                })
                        }
                    );


                let result;


                try {

                    result =
                        await response.json();

                } catch (jsonError) {

                    throw new Error(
                        "AI backend returned an invalid response."
                    );

                }


                if (
                    !response.ok ||
                    !result ||
                    result.success !== true
                ) {

                    throw new Error(
                        result &&
                        result.message
                            ? result.message
                            : "AI Formula generation failed."
                    );

                }


                const formula =
                    String(
                        result.formula || ""
                    ).trim();


                const explanation =
                    String(
                        result.explanation || ""
                    ).trim();


                if (
                    !formula ||
                    formula.charAt(0) !== "="
                ) {

                    throw new Error(
                        "AI backend returned an invalid Excel formula."
                    );

                }


                if (
                    aiFormulaDialog
                ) {

                    aiFormulaDialog.messageChild(
                        JSON.stringify({

                            type:
                                "HXL_AI_FORMULA_RESULT",

                            success:
                                true,

                            formula:
                                formula,

                            explanation:
                                explanation,

                            message:
                                "AI Formula generated successfully."

                        })
                    );

                }


                await reportToolStatus(
                    "AI Formula",
                    "SUCCESS",
                    "Formula generated successfully."
                );


            } catch (aiError) {

                console.error(
                    "AI Formula API Error:",
                    aiError
                );


                const message =
                    aiError &&
                    aiError.message
                        ? aiError.message
                        : String(aiError);


                if (
                    aiFormulaDialog
                ) {

                    aiFormulaDialog.messageChild(
                        JSON.stringify({

                            type:
                                "HXL_AI_FORMULA_RESULT",

                            success:
                                false,

                            message:
                                message

                        })
                    );

                }


                await reportToolStatus(
                    "AI Formula",
                    "ERROR",
                    message
                );

            }


            return;

        }


        // =========================================
        // INSERT GENERATED FORMULA
        // =========================================

        if (
            payload.type ===
            "HXL_INSERT_AI_FORMULA"
        ) {

            const formula =
                String(
                    payload.formula || ""
                ).trim();


            const selection =
                payload.selection;


            if (
                !formula ||
                formula.charAt(0) !== "="
            ) {

                throw new Error(
                    "The generated Excel formula is invalid."
                );

            }


            if (
                !selection ||
                typeof selection.rowIndex !== "number" ||
                typeof selection.columnIndex !== "number" ||
                typeof selection.rowCount !== "number" ||
                typeof selection.columnCount !== "number"
            ) {

                throw new Error(
                    "Excel selection information is unavailable."
                );

            }


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    let sheet;


                    if (
                        selection.sheetName
                    ) {

                        sheet =
                            workbook
                                .worksheets
                                .getItem(
                                    selection.sheetName
                                );

                    } else {

                        sheet =
                            workbook
                                .worksheets
                                .getActiveWorksheet();

                    }


                    const targetCell =
                        sheet.getCell(
                            selection.rowIndex,
                            selection.columnIndex
                        );


                    targetCell.formulas =
                        [
                            [
                                formula
                            ]
                        ];


                    await context.sync();

                }
            );


            await reportToolStatus(
                "AI Formula",
                "SUCCESS",
                "Formula inserted successfully."
            );


            if (
                aiFormulaDialog
            ) {

                aiFormulaDialog.messageChild(
                    JSON.stringify({

                        type:
                            "HXL_AI_FORMULA_INSERT_RESULT",

                        success:
                            true,

                        message:
                            "Formula inserted into the selected Excel cell."

                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "AI Formula Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "AI Formula",
            "ERROR",
            message
        );


        if (
            aiFormulaDialog
        ) {

            aiFormulaDialog.messageChild(
                JSON.stringify({

                    type:
                        "HXL_AI_FORMULA_RESULT",

                    success:
                        false,

                    message:
                        message

                })
            );

        }

    }

}


let explainFormulaDialog = null;


function openExplainFormulaDialog(event) {

    reportToolStatus(
        "Explain Formula",
        "RUNNING",
        "Opening Explain Formula..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("explain-formula.html"),
        {
            height: 78,
            width: 48,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Explain Formula Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Explain Formula",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Explain Formula."
                );


                event.completed();
                return;
            }


            explainFormulaDialog =
                asyncResult.value;


            explainFormulaDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleExplainFormulaMessage
            );


            explainFormulaDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Explain Formula dialog closed:",
                        args
                    );

                    explainFormulaDialog =
                        null;

                }
            );


            event.completed();

        }
    );

}



async function handleExplainFormulaMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET SELECTED FORMULA
        // =========================================

        if (
            payload.type ===
            "HXL_GET_EXPLAIN_FORMULA_INFO"
        ) {

            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    const selection =
                        workbook
                            .getSelectedRange();


                    sheet.load(
                        "name"
                    );


                    selection.load(
                        "address,rowIndex,columnIndex,rowCount,columnCount,values,formulas"
                    );


                    await context.sync();


                    if (
                        selection.rowCount !== 1 ||
                        selection.columnCount !== 1
                    ) {

                        throw new Error(
                            "Select exactly one Excel cell containing a formula."
                        );

                    }


                    const formula =
                        selection.formulas[0][0];


                    const value =
                        selection.values[0][0];


                    if (
                        explainFormulaDialog
                    ) {

                        explainFormulaDialog.messageChild(
                            JSON.stringify({

                                type:
                                    "HXL_EXPLAIN_FORMULA_INFO",

                                sheetName:
                                    sheet.name,

                                address:
                                    selection.address,

                                rowIndex:
                                    selection.rowIndex,

                                columnIndex:
                                    selection.columnIndex,

                                rowCount:
                                    selection.rowCount,

                                columnCount:
                                    selection.columnCount,

                                formula:
                                    formula,

                                value:
                                    value

                            })
                        );

                    }

                }
            );


            return;

        }


        // =========================================
        // EXPLAIN FORMULA
        // Gemini backend endpoint added next
        // =========================================

        if (
            payload.type ===
            "HXL_EXPLAIN_FORMULA"
        ) {

            const selection =
                payload.selection || {};


            const formula =
                String(
                    selection.formula || ""
                ).trim();


            if (
                !formula ||
                formula.charAt(0) !== "="
            ) {

                throw new Error(
                    "The selected cell does not contain an Excel formula."
                );

            }


            const response =
                await fetch(
                    "https://himanshu-xl-tools-ai-backend.onrender.com/api/ai/explain-formula",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                selection:
                                    selection
                            })
                    }
                );


            let result;


            try {

                result =
                    await response.json();

            } catch (jsonError) {

                throw new Error(
                    "AI backend returned an invalid Explain Formula response."
                );

            }


            if (
                !response.ok ||
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result &&
                    result.message
                        ? result.message
                        : "Explain Formula failed."
                );

            }


            const explanation =
                String(
                    result.explanation || ""
                ).trim();


            if (!explanation) {

                throw new Error(
                    "Gemini returned an empty formula explanation."
                );

            }


            if (
                explainFormulaDialog
            ) {

                explainFormulaDialog.messageChild(
                    JSON.stringify({

                        type:
                            "HXL_EXPLAIN_FORMULA_RESULT",

                        success:
                            true,

                        explanation:
                            explanation,

                        message:
                            "Formula explained successfully."

                    })
                );

            }


            await reportToolStatus(
                "Explain Formula",
                "SUCCESS",
                "Formula explained successfully."
            );


            return;

        }


    } catch (error) {

        console.error(
            "Explain Formula Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Explain Formula",
            "ERROR",
            message
        );


        if (
            explainFormulaDialog
        ) {

            explainFormulaDialog.messageChild(
                JSON.stringify({

                    type:
                        "HXL_EXPLAIN_FORMULA_RESULT",

                    success:
                        false,

                    message:
                        message

                })
            );

        }

    }

}


let fixFormulaDialog = null;


function openFixFormulaDialog(event) {

    reportToolStatus(
        "Fix Formula",
        "RUNNING",
        "Opening Fix Formula..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("fix-formula.html"),
        {
            height: 78,
            width: 48,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "Fix Formula Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "Fix Formula",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open Fix Formula."
                );


                event.completed();
                return;
            }


            fixFormulaDialog =
                asyncResult.value;


            fixFormulaDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleFixFormulaMessage
            );


            fixFormulaDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "Fix Formula dialog closed:",
                        args
                    );


                    fixFormulaDialog =
                        null;

                }
            );


            event.completed();

        }
    );

}



async function handleFixFormulaMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET SELECTED FORMULA
        // =========================================

        if (
            payload.type ===
            "HXL_GET_FIX_FORMULA_INFO"
        ) {

            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    const selection =
                        workbook
                            .getSelectedRange();


                    sheet.load(
                        "name"
                    );


                    selection.load(
                        "address,rowIndex,columnIndex,rowCount,columnCount,values,formulas"
                    );


                    await context.sync();


                    if (
                        selection.rowCount !== 1 ||
                        selection.columnCount !== 1
                    ) {

                        throw new Error(
                            "Select exactly one Excel cell containing a formula."
                        );

                    }


                    const formula =
                        selection.formulas[0][0];


                    const value =
                        selection.values[0][0];


                    if (
                        fixFormulaDialog
                    ) {

                        fixFormulaDialog.messageChild(
                            JSON.stringify({

                                type:
                                    "HXL_FIX_FORMULA_INFO",

                                sheetName:
                                    sheet.name,

                                address:
                                    selection.address,

                                rowIndex:
                                    selection.rowIndex,

                                columnIndex:
                                    selection.columnIndex,

                                rowCount:
                                    selection.rowCount,

                                columnCount:
                                    selection.columnCount,

                                formula:
                                    formula,

                                value:
                                    value

                            })
                        );

                    }

                }
            );


            return;

        }


        // =========================================
        // FIX FORMULA USING AI BACKEND
        // =========================================

        if (
            payload.type ===
            "HXL_FIX_FORMULA"
        ) {

            const selection =
                payload.selection || {};


            const formula =
                String(
                    selection.formula || ""
                ).trim();


            if (
                !formula ||
                formula.charAt(0) !== "="
            ) {

                throw new Error(
                    "The selected cell does not contain a valid Excel formula."
                );

            }


            const response =
                await fetch(
                    "https://himanshu-xl-tools-ai-backend.onrender.com/api/ai/fix-formula",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                selection:
                                    selection
                            })
                    }
                );


            let result;


            try {

                result =
                    await response.json();

            } catch (jsonError) {

                throw new Error(
                    "AI backend returned an invalid Fix Formula response."
                );

            }


            if (
                !response.ok ||
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result &&
                    result.message
                        ? result.message
                        : "Fix Formula failed."
                );

            }


            const fixedFormula =
                String(
                    result.fixedFormula || ""
                ).trim();


            const problem =
                String(
                    result.problem || ""
                ).trim();


            if (
                !fixedFormula ||
                fixedFormula.charAt(0) !== "="
            ) {

                throw new Error(
                    "Gemini returned an invalid corrected Excel formula."
                );

            }


            if (
                fixFormulaDialog
            ) {

                fixFormulaDialog.messageChild(
                    JSON.stringify({

                        type:
                            "HXL_FIX_FORMULA_RESULT",

                        success:
                            true,

                        problem:
                            problem ||
                            "Formula issue analyzed.",

                        fixedFormula:
                            fixedFormula,

                        message:
                            "Formula analyzed and corrected successfully."

                    })
                );

            }


            await reportToolStatus(
                "Fix Formula",
                "SUCCESS",
                "Corrected formula generated successfully."
            );


            return;

        }


        // =========================================
        // INSERT FIXED FORMULA
        // =========================================

        if (
            payload.type ===
            "HXL_INSERT_FIXED_FORMULA"
        ) {

            const fixedFormula =
                String(
                    payload.fixedFormula || ""
                ).trim();


            const selection =
                payload.selection || {};


            if (
                !fixedFormula ||
                fixedFormula.charAt(0) !== "="
            ) {

                throw new Error(
                    "The corrected Excel formula is invalid."
                );

            }


            if (
                typeof selection.rowIndex !== "number" ||
                typeof selection.columnIndex !== "number"
            ) {

                throw new Error(
                    "Excel selection information is unavailable."
                );

            }


            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    let sheet;


                    if (
                        selection.sheetName
                    ) {

                        sheet =
                            workbook
                                .worksheets
                                .getItem(
                                    selection.sheetName
                                );

                    } else {

                        sheet =
                            workbook
                                .worksheets
                                .getActiveWorksheet();

                    }


                    const targetCell =
                        sheet.getCell(
                            selection.rowIndex,
                            selection.columnIndex
                        );


                    targetCell.formulas =
                        [
                            [
                                fixedFormula
                            ]
                        ];


                    await context.sync();

                }
            );


            await reportToolStatus(
                "Fix Formula",
                "SUCCESS",
                "Fixed formula inserted successfully."
            );


            if (
                fixFormulaDialog
            ) {

                fixFormulaDialog.messageChild(
                    JSON.stringify({

                        type:
                            "HXL_FIX_FORMULA_INSERT_RESULT",

                        success:
                            true,

                        message:
                            "Fixed formula inserted into the selected Excel cell."

                    })
                );

            }


            return;

        }


    } catch (error) {

        console.error(
            "Fix Formula Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "Fix Formula",
            "ERROR",
            message
        );


        if (
            fixFormulaDialog
        ) {

            fixFormulaDialog.messageChild(
                JSON.stringify({

                    type:
                        "HXL_FIX_FORMULA_RESULT",

                    success:
                        false,

                    message:
                        message

                })
            );

        }

    }

}


// =========================================
// AI ANALYSIS
// =========================================

let aiAnalysisDialog = null;


function openAIAnalysisDialog(event) {

    reportToolStatus(
        "AI Analysis",
        "RUNNING",
        "Opening AI Analysis..."
    );


    Office.context.ui.displayDialogAsync(
        getHxlAppUrl("ai-analysis.html"),
        {
            height: 82,
            width: 55,
            displayInIframe: false
        },
        function (asyncResult) {

            if (
                asyncResult.status ===
                Office.AsyncResultStatus.Failed
            ) {

                console.error(
                    "AI Analysis Dialog Error:",
                    asyncResult.error
                );


                reportToolStatus(
                    "AI Analysis",
                    "ERROR",
                    asyncResult.error &&
                    asyncResult.error.message
                        ? asyncResult.error.message
                        : "Unable to open AI Analysis."
                );


                event.completed();
                return;
            }


            aiAnalysisDialog =
                asyncResult.value;


            aiAnalysisDialog.addEventHandler(
                Office.EventType.DialogMessageReceived,
                handleAIAnalysisMessage
            );


            aiAnalysisDialog.addEventHandler(
                Office.EventType.DialogEventReceived,
                function (args) {

                    console.log(
                        "AI Analysis dialog closed:",
                        args
                    );


                    aiAnalysisDialog =
                        null;

                }
            );


            event.completed();

        }
    );

}


async function handleAIAnalysisMessage(arg) {

    try {

        const payload =
            JSON.parse(
                arg.message
            );


        if (!payload) {
            return;
        }


        // =========================================
        // GET SELECTED RANGE
        // =========================================

        if (
            payload.type ===
            "HXL_GET_AI_ANALYSIS_INFO"
        ) {

            await Excel.run(
                async function (context) {

                    const workbook =
                        context.workbook;


                    const sheet =
                        workbook
                            .worksheets
                            .getActiveWorksheet();


                    const selection =
                        workbook
                            .getSelectedRange();


                    sheet.load(
                        "name"
                    );


                    selection.load(
                        "address,rowIndex,columnIndex,rowCount,columnCount,values"
                    );


                    await context.sync();


                    if (
                        selection.rowCount < 1 ||
                        selection.columnCount < 1
                    ) {

                        throw new Error(
                            "Select a non-empty Excel data range."
                        );

                    }


                    const values =
                        selection.values;


                    if (
                        !Array.isArray(values) ||
                        values.length === 0
                    ) {

                        throw new Error(
                            "The selected Excel range contains no data."
                        );

                    }


                    if (
                        aiAnalysisDialog
                    ) {

                        aiAnalysisDialog.messageChild(
                            JSON.stringify({

                                type:
                                    "HXL_AI_ANALYSIS_INFO",

                                sheetName:
                                    sheet.name,

                                address:
                                    selection.address,

                                rowIndex:
                                    selection.rowIndex,

                                columnIndex:
                                    selection.columnIndex,

                                rowCount:
                                    selection.rowCount,

                                columnCount:
                                    selection.columnCount,

                                values:
                                    values

                            })
                        );

                    }

                }
            );


            return;

        }


        // =========================================
        // RUN AI ANALYSIS
        // =========================================

        if (
            payload.type ===
            "HXL_RUN_AI_ANALYSIS"
        ) {

            const selection =
                payload.selection || {};


            const values =
                Array.isArray(
                    selection.values
                )
                    ? selection.values
                    : [];


            if (
                values.length === 0
            ) {

                throw new Error(
                    "No Excel data is available for AI analysis."
                );

            }


            const response =
                await fetch(
                    "https://himanshu-xl-tools-ai-backend.onrender.com/api/ai/analysis",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                selection:
                                    selection
                            })
                    }
                );


            let result;


            try {

                result =
                    await response.json();

            } catch (jsonError) {

                throw new Error(
                    "AI backend returned an invalid Analysis response."
                );

            }


            if (
                !response.ok ||
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result &&
                    result.message
                        ? result.message
                        : "AI Analysis failed."
                );

            }


            const analysis =
                String(
                    result.analysis || ""
                ).trim();


            if (!analysis) {

                throw new Error(
                    "Gemini returned an empty data analysis."
                );

            }


            if (
                aiAnalysisDialog
            ) {

                aiAnalysisDialog.messageChild(
                    JSON.stringify({

                        type:
                            "HXL_AI_ANALYSIS_RESULT",

                        success:
                            true,

                        analysis:
                            analysis,

                        message:
                            "AI analysis completed successfully."

                    })
                );

            }


            await reportToolStatus(
                "AI Analysis",
                "SUCCESS",
                "Selected Excel data analyzed successfully."
            );


            return;

        }


    } catch (error) {

        console.error(
            "AI Analysis Error:",
            error
        );


        const message =
            error &&
            error.message
                ? error.message
                : String(error);


        await reportToolStatus(
            "AI Analysis",
            "ERROR",
            message
        );


        if (
            aiAnalysisDialog
        ) {

            aiAnalysisDialog.messageChild(
                JSON.stringify({

                    type:
                        "HXL_AI_ANALYSIS_RESULT",

                    success:
                        false,

                    message:
                        message

                })
            );

        }

    }

}



function createLicensedCommand(
    toolName,
    command
) {

    return async function (event) {

        let commandStarted = false;

        try {

            const result =
                await runWithLicenseAccess(
                    async function () {

                        commandStarted = true;

                        command(event);
                    },
                    {
                        onDenied:
                            async function (access) {

                                await reportToolStatus(
                                    toolName,
                                    "LICENSE_REQUIRED",
                                    access.message ||
                                        "Himanshu XL Tools requires activation."
                                );

                                console.warn(
                                    "License access denied:",
                                    toolName,
                                    access.reasonCode
                                );
                            }
                    }
                );

            if (
                !result.executed &&
                !commandStarted
            ) {
                event.completed();
            }

        } catch (error) {

            console.error(
                "Licensed Command Error:",
                toolName,
                error
            );

            if (!commandStarted) {
                event.completed();
            }
        }
    };
}

Office.actions.associate("openTool", openTool);
Office.actions.associate("refreshTool", refreshTool);
Office.actions.associate("createTable", createLicensedCommand("createTable", createTable));
Office.actions.associate("removeDuplicates", createLicensedCommand("removeDuplicates", removeDuplicates));
Office.actions.associate("activateFilter", createLicensedCommand("activateFilter", activateFilter));
Office.actions.associate("createChart", createLicensedCommand("createChart", createChart));
Office.actions.associate("dashboardInfo", createLicensedCommand("dashboardInfo", dashboardInfo));
Office.actions.associate("createKPI", createLicensedCommand("createKPI", createKPI));

Office.actions.associate("vlookupInfo", createLicensedCommand("vlookupInfo", vlookupInfo));

Office.actions.associate("smartChartInfo", createLicensedCommand("smartChartInfo", smartChartInfo));
Office.actions.associate("powerDashboardInfo", createLicensedCommand("powerDashboardInfo", powerDashboardInfo));
Office.actions.associate("openPowerDashboardStudio", createLicensedCommand("openPowerDashboardStudio", openPowerDashboardStudio));
Office.actions.associate("flashFillInfo", createLicensedCommand("flashFillInfo", flashFillInfo));
Office.actions.associate("textColumnsInfo", createLicensedCommand("textColumnsInfo", textColumnsInfo));
Office.actions.associate("freezeTopRow", createLicensedCommand("freezeTopRow", freezeTopRow));
Office.actions.associate("validationInfo", createLicensedCommand("validationInfo", validationInfo));
Office.actions.associate("conditionalFormatting", createLicensedCommand("conditionalFormatting", conditionalFormatting));
Office.actions.associate("pivotInfo", createLicensedCommand("pivotInfo", pivotInfo));
Office.actions.associate("xlookupInfo", createLicensedCommand("xlookupInfo", xlookupInfo));
Office.actions.associate("sumifsInfo", createLicensedCommand("sumifsInfo", sumifsInfo));
Office.actions.associate("countifsInfo", createLicensedCommand("countifsInfo", countifsInfo));
Office.actions.associate("openMergeFilesDialog", createLicensedCommand("openMergeFilesDialog", openMergeFilesDialog));
Office.actions.associate("openSplitWorkbookDialog", createLicensedCommand("openSplitWorkbookDialog", openSplitWorkbookDialog));
Office.actions.associate("openExportPdfDialog", createLicensedCommand("openExportPdfDialog", openExportPdfDialog));
Office.actions.associate("openBatchRenameDialog", createLicensedCommand("openBatchRenameDialog", openBatchRenameDialog));
Office.actions.associate("openHideUnhideSheetsDialog", createLicensedCommand("openHideUnhideSheetsDialog", openHideUnhideSheetsDialog));
Office.actions.associate("openProtectSheetDialog", createLicensedCommand("openProtectSheetDialog", openProtectSheetDialog));
Office.actions.associate("openRenameSheetsDialog", createLicensedCommand("openRenameSheetsDialog", openRenameSheetsDialog));
Office.actions.associate("openCopyMoveSheetDialog", createLicensedCommand("openCopyMoveSheetDialog", openCopyMoveSheetDialog));
Office.actions.associate("openQuickCleanDialog", createLicensedCommand("openQuickCleanDialog", openQuickCleanDialog));
Office.actions.associate("openFillBlanksDialog", createLicensedCommand("openFillBlanksDialog", openFillBlanksDialog));
Office.actions.associate("openFormulaToolsDialog", createLicensedCommand("openFormulaToolsDialog", openFormulaToolsDialog));
Office.actions.associate("openAutoRefreshDialog", createLicensedCommand("openAutoRefreshDialog", openAutoRefreshDialog));
Office.actions.associate("openAIFormulaDialog", createLicensedCommand("openAIFormulaDialog", openAIFormulaDialog));
Office.actions.associate("openExplainFormulaDialog", createLicensedCommand("openExplainFormulaDialog", openExplainFormulaDialog));
Office.actions.associate("openFixFormulaDialog", createLicensedCommand("openFixFormulaDialog", openFixFormulaDialog));
Office.actions.associate("openAIAnalysisDialog", createLicensedCommand("openAIAnalysisDialog", openAIAnalysisDialog));



