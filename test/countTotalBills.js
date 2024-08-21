import fs from 'fs';

// Read the JSON file
fs.readFile('./transactions_supervisedMode_2.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    // Parse JSON data
    const transactions = JSON.parse(data);
    let totalWithdrawFinal =
        {
            "ILS200": 0,
            "ILS50": 0,
            "ILS100": 0,
            "c": 0
          }
      let totalWithdraInline =
      {
          "ILS200": 0,
          "ILS50": 0,
          "ILS100": 0,
          "c": 0
        }
        let totalWithdraInlinePlusFinal =
        {
            "ILS200": 0,
            "ILS50": 0,
            "ILS100": 0,
            "c": 0
          }
    let totalDeposit ={
        "ILS20": 0,
        "ILS50": 0,
        "ILS100": 0,
        "ILS200": 0
      }
      let totalRejected ={
        "ILS20": 0,
        "ILS50": 0,
        "ILS100": 0,
        "ILS200": 0
      }
    transactions.map(transaction =>{
        if(transaction.type === 'WITHDRAWN'){
            totalWithdrawFinal["ILS200"] = transaction.summaryIls["ILS200"] +    totalWithdrawFinal["ILS200"]
            totalWithdrawFinal["ILS50"] =  transaction.summaryIls["ILS50"] +   totalWithdrawFinal["ILS50"]
            totalWithdrawFinal["ILS100"] =  transaction.summaryIls["ILS100"] +  totalWithdrawFinal["ILS100"]
        }
        if(transaction.type === 'DEPOSIT'){
            totalDeposit["ILS20"] =transaction.summaryIls.final["ILS20"] +  totalDeposit["ILS20"]
            totalDeposit["ILS50"] = transaction.summaryIls.final["ILS50"] +  totalDeposit["ILS50"]
            totalDeposit["ILS100"] = transaction.summaryIls.final["ILS100"] +  totalDeposit["ILS100"]
            totalDeposit["ILS200"] = transaction.summaryIls.final["ILS200"] +  totalDeposit["ILS200"]
            const totalAccepted = getTotals(transaction.summaryIls.accepteds)
            console.log(JSON.stringify(totalAccepted))
            totalRejected["ILS20"] = totalRejected["ILS20"]+ (totalAccepted["ILS20"]-  transaction.summaryIls.final["ILS20"] )
            totalRejected["ILS50"] = totalRejected["ILS50"]+ (totalAccepted["ILS50"]-  transaction.summaryIls.final["ILS50"] )
            totalRejected["ILS100"] = totalRejected["ILS100"]+ (totalAccepted["ILS100"]-  transaction.summaryIls.final["ILS100"] )
            totalRejected["ILS200"] = totalRejected["ILS200"]+ (totalAccepted["ILS200"]-  transaction.summaryIls.final["ILS200"] )

        }

    })
    const finalJson = { totalWithdrawFinal, totalDeposit, totalRejected}

    // Write the updated transactions to a new fJSON file
    fs.writeFile('./total_sup_2.json', JSON.stringify(finalJson, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('Updated transactions saved to updated_transactions.json');
    });
});

function getTotals(data) {
    // Initialize an object to store the totals
    const totals = {};

    // Check if the input data has an 'accepteds' array
    if (Array.isArray(data)) {
        // Iterate over each item in the 'accepteds' array
        data.forEach(item => {
            // Iterate over each key in the item object
            for (const [key, value] of Object.entries(item)) {
                // Add the value to the corresponding total in the 'totals' object
                if (totals[key] === undefined) {
                    totals[key] = 0;
                }
                totals[key] += value;
            }
        });
    }

    return totals;
}
