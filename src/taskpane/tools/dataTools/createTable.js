export async function createTable() {

    const status =
        document.getElementById("status");

    try {

        await Excel.run(async (context) => {

            const range =
                context.workbook.getSelectedRange();

            range.load([
                "address",
                "rowCount"
            ]);

            await context.sync();


            if (range.rowCount < 2) {

                if(status){
                    status.textContent =
                    "Please select data with headers.";
                }

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


            if(status){

                status.textContent =
                "Excel Table created successfully.";

            }


        });


    }
    catch(error){

        console.error(error);


        if(status){

            status.textContent =
            "Table Error: " + error.message;

        }

    }

}