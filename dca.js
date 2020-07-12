const print = console.log.bind(console);

let args = process.argv; 

// Variables for the equation
let ticker = args[2];                // Ticker
let totalCost = +args[3];            // Total cost willing to spend on this position
let bestPrice = +args[4];            // Best price detected using SMA tool 
let downPerc = +args[5]/100;         // Percentage loss to trigger next DCA purchase
let maxNumPurchases = +args[6];      // Max number of purchases to do
let stopLossPerc = +args[7]/100;     // Stop loss percentage
let exitPrice = +args[8];            // Exit price

let incExitPricePerc = (((exitPrice - bestPrice)*100)/bestPrice)/100;

print('\n -----------------------------------------------------------------------------------');
print('| Purchase: ' + ticker + ' plan with: $' + totalCost + ' max investment.');
print('|      Initial purchase at price: $' + bestPrice);
print('|      Next purchase when down: ' + args[5] + '% with max: ' + maxNumPurchases + ' additional cost averaging purchases.');
print(' -----------------------------------------------------------------------------------');

const K = 1-downPerc;

let sum = 0;
for (var i=0; i<=maxNumPurchases-1; i++) {
    sum += Math.pow(1+K, i);
}

const numberShares = (totalCost / (bestPrice * (1 + K * sum))).toFixed(0);

let transactions = [];

let date = new Date();

transactions.push({
    Nun_Shares_Purchase: +numberShares,
    Price_Purchase: +bestPrice,
    Total_Shares: +numberShares,
    Avg_Price: +bestPrice,
    Purchase_Cost: +(+numberShares * bestPrice).toFixed(2),
    Current_Loss: 0,
    Cumulative_Cost: +(+numberShares * bestPrice).toFixed(2),
    Executed_On: date.toLocaleDateString() + ' - ' + date.toLocaleTimeString()
});

addExitPriceAndProfit(transactions[0], incExitPricePerc);

printLineReport('Initial', transactions[0]);

for (var i=0; i<=maxNumPurchases-1; i++) {
    let quantity = +Math.pow(2, i) * numberShares;
    let price = +(Math.pow((1+K)/2, i) * bestPrice * K).toFixed(2);

    addAndCalculateAverage(transactions, quantity, price, i==maxNumPurchases-1, totalCost);
    
    printLineReport(i+1, transactions[i+1]);
}

let lastTransaction = transactions[transactions.length-1];

let result = lossWithoutDCA(totalCost, bestPrice, lastTransaction, stopLossPerc);

extractAsCSV(transactions, result, ticker);


function addAndCalculateAverage(ts, qty, prc, lastPurchase, maxInvestment) {
    let totQty = qty;
    let totCost = qty * prc;

    // Calculate cumulative values
    for (var i in ts) {
        totQty += ts[i].Nun_Shares_Purchase;
        totCost += ts[i].Nun_Shares_Purchase * ts[i].Price_Purchase;
    }

    // On the last purchase round up number of shares that bring total cost as close as possible to max investable amount
    if (lastPurchase) {
        let addQty = +((maxInvestment - totCost)/prc).toFixed(0);
        qty += addQty;
        totQty = qty;
        totCost = qty * prc;
        // Re-calculate cumulative values
        for (var i in ts) {
            totQty += ts[i].Nun_Shares_Purchase;
            totCost += ts[i].Nun_Shares_Purchase * ts[i].Price_Purchase;
        }
    }

    // Calculate average purchase price
    let avgPrc = +(totCost/totQty).toFixed(2);

    let t = {
        Nun_Shares_Purchase: qty,
        Price_Purchase: prc,
        Total_Shares: totQty,
        Avg_Price: avgPrc,
        Purchase_Cost: +(qty*prc).toFixed(2),
        Current_Loss: +(totQty * (prc - avgPrc)).toFixed(2),
        Cumulative_Cost: +totCost.toFixed(2),
        Executed_On: ' '
    };

    addExitPriceAndProfit(t, incExitPricePerc);

    transactions.push(t);
}

function addExitPriceAndProfit(t, incPerc) {
    t.Exit_Price = (t.Avg_Price * (1+incPerc)).toFixed(2);
    t.Trade_Profit = ((t.Total_Shares * t.Exit_Price) - t.Cumulative_Cost).toFixed(2);
    t.Completed_On = ''
}

function printLineReport(iteration, data) {
    print('\n---------------- Purchase #: ' + iteration + ' ----------------------');
    print('Buy ' + data.Nun_Shares_Purchase + ' shares @ price: $' + data.Price_Purchase);
    print('      - Total Number of Shares: ' + data.Total_Shares);
    print('      - Average Purchase Price: $' + data.Avg_Price);
    print('      - Purchase amount:        $' + data.Purchase_Cost);
    print('      - Current Loss:         - $' + Math.abs(data.Current_Loss));
    print('      - Total Cost Invested:    $' + data.Cumulative_Cost);
    print('');
    print('      - Exit Price:             $' + data.Exit_Price);
    print('      - Trade Profit:           $' + data.Trade_Profit);
    print('-----------------------------------------------------\n');
}

function lossWithoutDCA(tc, bp, lastTransaction, stopLoss) {
    let cp = lastTransaction.Price_Purchase;
    let avPrice = lastTransaction.Avg_Price;
    let numShares = Math.floor(tc / bp);
    let stopLossPrice = +(avPrice * (1-stopLoss)).toFixed(2);
    let loss = (numShares * (bp - stopLossPrice)).toFixed(2);
    let totalSharesPurchased = lastTransaction.Total_Shares;
    let totalLoss = Math.abs(lastTransaction.Cumulative_Cost - totalSharesPurchased*stopLossPrice).toFixed(2);

    print('\n--------------------------------------------');
    print(' Stop Loss Price:         $' + stopLossPrice);
    print(' Loss without DCA:      - $' + loss);
    print(' Loss with DCA:         - $' + totalLoss);
    print('--------------------------------------------\n');

    let result = {
        'Stop_Loss_Price'  : stopLossPrice,
        'Loss_without_DCA' : loss,
        'Loss_with_DCA'    : totalLoss
    }

    return result;
}

function extractAsCSV(transactions, result, ticker) {
    let obj = transactions[0];

    let headers = 'Purchase #';
    let emptyRow = ' ';
    for (var prop in obj) {
        headers += ', ';
        emptyRow += ', '; 
        headers += prop;
    }

    print('\n----------------------------------------------------------------------------------------------------');
    print('Copy the following content and paste into a goggle sheet. Then select Data -> Split text to columns');
    print('----------------------------------------------------------------------------------------------------\n');

    print(headers);

    for (var i=0; i<transactions.length; i++) {
        var t = transactions[i];

        let row = '' + (i+1);
        
        for (var prop in t) {
            row += ', ';
            row += t[prop];
        }

        print(row);
    }

    print(emptyRow);
    print('Ticker, ' + ticker);
    print('Stop Loss Price, ' + result.Stop_Loss_Price);
    print('Loss without DCA, ' + result.Loss_without_DCA);
    print('Loss with DCA, ' + result.Loss_with_DCA);
}