import fs from 'fs';
import moment from 'moment'

// Read the JSON file
fs.readFile('./parsed_all_transactions.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    // Parse JSON data
    const transactions = JSON.parse(data);
   // Define the start and end dates
    const startDate = parseDateString("11/07/2024:10:17");
    const endDate = parseDateString("19/07/2024:11:23");

    // Filter transactions between the start and end dates
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = parseDateString(transaction.date);
      return transactionDate > startDate && transactionDate <= endDate;
    })

    console.log(filteredTransactions.length)

    // Write the updated transactions to a new fJSON file
    fs.writeFile('./transactions_supervisedMode_2.json', JSON.stringify(filteredTransactions, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('Updated transactions saved to updated_transactions.json');
    });
});
const parseDateString = (dateString) => {
    const format = "DD/MM/YYYY:HH:mm";
    const date = moment(dateString, format)
        .set("second", 0)
        .set("millisecond", 0);

    // Check if the date is valid and return the Date object
    if (date.isValid()) {
      return date.toDate();
    } else {
      throw new Error("Invalid Date");
    }
  };


  const dateString = "09/07/2024:09:15";
  const parsedDate = parseDateString(dateString);

  console.log(parsedDate.toString()); // Output: Tue Sep 09 2024 09:15:00 GMT+0000 (Coordinated Universal Time)
