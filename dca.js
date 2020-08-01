/**
 * Dollar Cost Averaging Purchase Plan
 */

const ctx = require('axel');

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

// Calculate exit percentage from dollar cost average (moving target)
let incExitPricePerc = (((exitPrice - bestPrice)*100)/bestPrice)/100;

const K = 1-downPerc;

let sum = 0;
for (var i=0; i<=maxNumPurchases-1; i++) {
    sum += Math.pow(1+K, i);
}

const numberShares = Math.ceil(totalCost / (bestPrice * (1 + K * sum)));

let transactions = [];

let date = new Date();

transactions.push(transactionBuilder(numberShares, bestPrice, numberShares, bestPrice, 0, 
                                     numberShares * bestPrice, 
                                     date.toLocaleDateString() + ' - ' + date.toLocaleTimeString()));

for (var i=0; i<=maxNumPurchases-1; i++) {
    let quantity = +Math.pow(2, i) * numberShares;
    let price = +(Math.pow((1+K)/2, i) * bestPrice * K).toFixed(2);

    addAndCalculateAverage(transactions, quantity, price, i==maxNumPurchases-1, totalCost);
}

let lastTransaction = transactions[transactions.length-1];

let result = lossWithoutDCA(totalCost, bestPrice, lastTransaction, stopLossPerc);

let outputData = extractAsCSV(transactions, result, ticker);

printResultOnScreen(outputData);


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
        let addQty = Math.floor((maxInvestment - totCost)/prc);
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

    let t = transactionBuilder(qty, prc, totQty, avgPrc, totQty * (prc - avgPrc), totCost, ' ');

    transactions.push(t);
}

function addExitPriceAndProfit(t, incPerc) {
    t.Exit_Price = (t.Avg_Price * (1+incPerc)).toFixed(2);
    t.Trade_Profit = ((t.Total_Shares * t.Exit_Price) - t.Cumulative_Cost).toFixed(2);
    t.Completed_On = ''
}

function transactionBuilder(nsp, pp, ts, ap, cl, cc, ed) {
    let t = {
        Nun_Shares_Purchase: +nsp,
        Price_Purchase: +pp,
        Purchase_Cost: (nsp * pp).toFixed(2),
        Cumulative_Cost: (cc).toFixed(2),
        Total_Shares: +ts,
        Avg_Price: +ap,
        Current_Loss: (cl).toFixed(2),
        Executed_On: ed
    };

    addExitPriceAndProfit(t, incExitPricePerc);

    return t;
}

/**
 * Display results on screen
 */
function printResultOnScreen(data) {

    let layout0 = [
        { x : 2, bg: 255, br: 255, bb: 255 },
        { x : 17, bg: 255, br: 236, bb: 71 },
        { x : 41, bg: 255, br: 236, bb: 71 },
        { x : 60, bg: 255, br: 236, bb: 71 },
        { x : 78, bg: 71, br: 153, bb: 255 },
        { x : 98, bg: 71, br: 153, bb: 255 },
        { x : 115, bg: 71, br: 153, bb: 255 },
        { x : 129, bg: 255, br: 71, bb: 80 },
        { x : 146, bg: 2, br: 164, bb: 44 },
        { x : 161, bg: 2, br: 164, bb: 44 }
    ];

    let layout1 = [
        { x : 2, bg: 255, br: 255, bb: 255 },
        { x : 23, bg: 255, br: 255, bb: 255 },
    ];

    let y = 2;
    let layout = layout0;

    ctx.clear();

    ctx.bg(255, 255, 255);
    ctx.fg(0,0,0);

    ctx.text(layout[0].x, y,   fillTextwithSpaces(' Purchase: ' + ticker + ' plan with: $' + totalCost + ' max investment.', 90));
    ctx.text(layout[0].x, y+1, fillTextwithSpaces('    Initial purchase at price: $' + bestPrice, 90));
    ctx.text(layout[0].x, y+2, fillTextwithSpaces('    Next purchase when down: ' + args[5] + '% with max: ' + maxNumPurchases + ' additional cost averaging purchases.', 90));
    ctx.text(layout[0].x, y+3, fillTextwithSpaces('    If after ' + maxNumPurchases + ' DCA purchases, price drops: ' + args[7] + '% from average cost, exit.', 90));
    ctx.text(layout[0].x, y+4, fillTextwithSpaces('    Exit when price increases of: ' + (incExitPricePerc*100).toFixed(2) + '% from average cost', 90));

    y += 6;

    for (var j=0; j<data.length; j++) {
        let row = data[j];

        if (j==data.length-4) {
            layout = layout1;
        }

        if (j != data.length-5) { // empty row
            var c = 0;
            for (var i=0; i<row.length; i++) {
                if (i == 8 || i == 11) {
                    continue;
                } else {
                    ctx.bg(layout[c].bg, layout[c].br, layout[c].bb);
                    ctx.fg(0,0,0);
                    let text = '  ' + row[i] + '  ';

                    if (j==0) {
                        layout[c].textWidth = text.length;
                    } else if (j>0 && j<data.length-5) {
                        text = fillTextwithSpaces(text, layout[c].textWidth);
                    } else if (j>=data.length-4) {
                        if (i==0) {
                            text = fillTextwithSpaces(text, 20);
                            text += ': '
                        } else {
                            text = fillTextwithSpaces(text, 15);
                        }
                        
                    }
                    
                    ctx.text(layout[c].x, y, text);

                    c++;
                } 
            }
        }
        
        y += 1;
    }

    ctx.cursor.restore();
}

function fillTextwithSpaces(text, count) {
    let diff = count - text.length;
    if (diff > 0) {
        for (var i=0; i<diff; i++) {
            text += ' ';
        }
    }
    return text;
}

function lossWithoutDCA(tc, bp, lastTransaction, stopLoss) {
    let cp = lastTransaction.Price_Purchase;
    let avPrice = lastTransaction.Avg_Price;
    let numShares = Math.floor(tc / bp);
    let stopLossPrice = +(avPrice * (1-stopLoss)).toFixed(2);
    let loss = (numShares * (bp - stopLossPrice)).toFixed(2);
    let totalSharesPurchased = lastTransaction.Total_Shares;
    let totalLoss = Math.abs(lastTransaction.Cumulative_Cost - totalSharesPurchased*stopLossPrice).toFixed(2);

    let result = {
        'Stop_Loss_Price'  : stopLossPrice,
        'Loss_without_DCA' : loss,
        'Loss_with_DCA'    : totalLoss
    }

    return result;
}

function extractAsCSV(transactions, result, ticker) {
    let screenOutput = [];

    let obj = transactions[0];

    let headers = 'Purchase #';
    let emptyRow = ' ';
    for (var prop in obj) {
        headers += ',';
        emptyRow += ', '; 
        headers += prop;
    }

    print('\n----------------------------------------------------------------------------------------------------');
    print('Copy the following content and paste into a goggle sheet. Then select Data -> Split text to columns');
    print('----------------------------------------------------------------------------------------------------\n');

    print(headers);
    screenOutput.push(headers.split(','));

    for (var i=0; i<transactions.length; i++) {
        var t = transactions[i];

        let row = '' + (i+1);
        
        for (var prop in t) {
            row += ',';
            row += t[prop];
        }

        print(row);

        screenOutput.push(row.split(','));
    }

    print(emptyRow);
    screenOutput.push(emptyRow.split(','));

    var row = 'Ticker, ' + ticker + ', Max cost:, ' + totalCost + ', Perc. Down:, ' + downPerc + ', Num Purchases:, ' + maxNumPurchases + ', Perc. Stop:, ' + stopLossPerc + ', Exit Price:, ' + exitPrice;
    print(row);
    screenOutput.push(row.split(','));

    row = 'Stop Loss Price, ' + result.Stop_Loss_Price;
    print(row);
    screenOutput.push(row.split(','));

    row = 'Loss without DCA, ' + result.Loss_without_DCA;
    print(row);
    screenOutput.push(row.split(','));

    row = 'Loss with DCA, ' + result.Loss_with_DCA;
    print(row);
    screenOutput.push(row.split(','));

    row = 'Command t a ip pd nt pl ep, ' 
          + './dca.sh ' + ticker + ' ' + totalCost + ' ' + bestPrice + ' ' + downPerc + ' ' + maxNumPurchases + ' ' + stopLossPerc + ' ' + exitPrice;
    print(row);
    screenOutput.push(row.split(','));

    return screenOutput;
}