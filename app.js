const print = console.log.bind(console);
const debug = console.log.bind(console);

const config = require('config');
const fetch = require('node-fetch');
const colors = require('colors');
const ctx = require('axel');
const propertiesHandler = require('properties-reader');

/** Readable and Writable file */
const propsFileName = 'data.props';

const serviceUrl = config.get('Service.url');
const keys = config.get('Service.apiKey');
let properties = propertiesHandler(propsFileName);
let counter = +properties.get('counter.api.index');

if (counter >= keys.length) {
    print('You don\'t have a new key available. Please add another key');
}

/** Active API key */
const key = keys[counter];
const API_KEY_EXPIRED_MESSAGE = 'APIs key expired - Please try again. Going to use next valid key';

/** Allowed operations */
const HELP_OP = 'help';
const ALAH_OP = 'alah';
const TREND_OP = 'trend'
const operations = [HELP_OP, ALAH_OP, TREND_OP];

let args = process.argv; 
let operation = args[2];
let ticker = args[3];
let days = args[4];

const drawing = true;

if (key) {
    if (operations.indexOf(operation) >= 0) {
        if (operation === HELP_OP) {
            print('\n ----------------------------- Trading Utilities Help Menu --------------------------------------');
            print('| alah <stockSymbol> <numDays>: Average Low and Average High analysis. Use: node app.js alah JWN 2   |');
            print('| trend <stockSymbol> <numDays>: Trend indicator. Use: node app.js trend JWN 2                       |');
            print(' ------------------------------------------------------------------------------------------------\n');
        } else if (operation === ALAH_OP) {           // Average low and Average high in a days window range

            let wellDefinedDaysRange = true; // The input provided is a well defined range of days
            let daysArray;

            if (days) {
                daysArray = days.split(',');

                if (daysArray.length>=1 && daysArray.length<= 3) {
                    let prev = +daysArray[0];
                    
                    for (let i=1; i<daysArray.length; i++) {
                        wellDefinedDaysRange &= (prev > +daysArray[i]);
                        prev = +daysArray[i];
                    }
                } else {
                    wellDefinedDaysRange = false;
                }
            } else {
                wellDefinedDaysRange = false;
            }

            if (wellDefinedDaysRange) {
                averageMinMax(ticker, daysArray);
            } else {
                print('Number of days range shouldn\'t be more than 3 and descending order, comma separated.')
            }
           
            

        } else if(operation === TREND_OP) {    // Trend based on candle sticks
            trendPrediction(ticker, days);
        }
    } else {
        print(' ----------------------------------------------------------------------------------');
        print('| Unknown operation!!!                                                             |');
        print('| The allowed operations are:', operations);
        print('| Type `node app.js help` for details information about the operations             |');
        print(' ----------------------------------------------------------------------------------');
    }
} else {
    print('Invalid Key. Please check you have a valid key at index: ' + counter);
}


/**
 * Calculate the Average low and the Average high in a range of N days
 * @param {*} ticker 
 * @param {*} numDays 
 */
function averageMinMax(ticker, numDays) {
    let url1 = serviceUrl + '/historical-price-full/' + ticker + '?timeseries=' + numDays[0] + '&apikey=' + key;
    let url2 = serviceUrl + '/quote-short/' + ticker + '?apikey=' + key;

    let urls = [url1, url2];

    Promise.all(urls.map(function(url) {
        return fetch(url);
    } ))
    .then(function(responses) {
        return Promise.all( responses.map(function (response) { 
            return response.json(); 
        }))
    })
    .then(function(resultApis) { 
        let data = resultApis[0];

        if (data['Error Message']) {
            throw new Error(data['Error Message']);
        }

        let tickerPrice = resultApis[1][0];
        let prices = data.historical;

        let x = 10;
        let y = 2;

        if (drawing) ctx.clear(); 

        for (let i in numDays) {
            let length = +numDays[i];

            if (length < prices.length) {
                // extract sub-array 
                let subRangePrice = prices.slice(0, length);
                renderAveragesChart(tickerPrice, subRangePrice, x, y);
            } else {
                renderAveragesChart(tickerPrice, prices, x, y);

                renderTrendChart(prices, 10, 22);
            }

            x += 75; // Display to right
        }

        if (drawing) ctx.cursor.restore();

    }).catch(function(err) {  
        errorHanlder(err);
    });
}

/**
 * Given an array of json data render a chart 
 * @param {*} prices 
 */
function renderAveragesChart(tickerPrice, prices, x, y) {
    let total = prices.length;

    let daysRangeLabels = '[' + prices[prices.length-1].label + ' - ' + prices[0].label + ']';

    let result = {
        highest: Number.MIN_VALUE,
        medOpen: 0,
        medHigh: 0,
        medLow: 0,
        medClose: 0,
        lowest: Number.MAX_VALUE
    };

    for (let i in prices) {
        if (prices[i].high > result.highest) result.highest = prices[i].high;
        result.medOpen  += prices[i].open;
        result.medHigh  += prices[i].high;
        result.medLow   += prices[i].low;
        result.medClose += prices[i].close;
        if (prices[i].low < result.lowest) result.lowest = prices[i].low;
    }

    result.medOpen  = Math.floor(result.medOpen/total * 100) / 100
    result.medHigh  = Math.floor(result.medHigh/total * 100) / 100
    result.medLow   = Math.ceil(result.medLow/total * 100) / 100
    result.medClose = Math.ceil(result.medClose/total * 100) / 100

    let buyMessage = 'N/A';
    if (result.medClose > result.medOpen   // Closing price > Opening price
        && (Math.abs(result.highest-result.medHigh) < Math.abs(result.medLow-result.lowest)) // Average high price getting closer to highest price, while the Average low price is getting away from lowest price
    ) {
        buyMessage = 'This is a potential buy - uptrend, bullish'
    }

    // Build results order by price
    let report = [
        {
            label: 'Current Price',
            value: tickerPrice ? tickerPrice.price : 0,
            r: 0,
            g: 0,
            b: 0,
            fr: 255,
            fg: 255,
            fb: 255
        },
        {
            label: 'Avg Open',
            value: result.medOpen,
            r: 14,
            g: 181,
            b: 196,
            fr: 0,
            fg: 0,
            fb: 0
        },
        {
            label: 'Avg high',
            value: result.medHigh,
            r: 0,
            g: 143,
            b: 64,
            fr: 0,
            fg: 0,
            fb: 0
        },
        {
            label: 'Avg low',
            value: result.medLow,
            r: 244,
            g: 93,
            b: 58,
            fr: 0,
            fg: 0,
            fb: 0
        },
        {
            label: 'Avg Close (SMA)',
            value: result.medClose,
            r: 255,
            g: 162,
            b: 0,
            fr: 0,
            fg: 0,
            fb: 0
        },
        {
            label: 'Highest Price',
            value: result.highest,
            r: 9,
            g: 75,
            b: 0,
            fr: 255,
            fg: 255,
            fb: 255
        },
        {
            label: 'Lowest Price',
            value: result.lowest,
            r: 198,
            g: 9,
            b: 9,
            fr: 255,
            fg: 255,
            fb: 255
        }
    ];

    let sorted = report.sort(function(a, b) { 
        return b.value > a.value ?  1
                : b.value < a.value ? -1 
                : 0;                 
    });

    let w = 40;
    let h = 1;
    let offset = 2;
    
    if (drawing) {
        ctx.bg(255,255,0);
        ctx.fg(0,0,0);
        ctx.text(x, y, ' ' + ticker + ', ' + total + ' days range: ' + daysRangeLabels + ' - Avg Low & Avg High ');
    
        let yPos;
        for (let i=0; i<sorted.length; i++) {
            yPos = y + offset + (i+1)*2;
    
            let obj = sorted[i];
            ctx.bg(obj.r, obj.g, obj.b);
            ctx.fg(obj.fr, obj.fg, obj.fb);
            ctx.box(x, yPos, w, h);
            ctx.text(x+2, yPos, obj.label + ': ' + obj.value);
        }
    }
    

    //ctx.bg(255,255,0);
    //ctx.fg(0,0,0);
    //ctx.text(x, yPos + 4, ' Signal: ' + buyMessage + ' ');
}

/**
 * Display the trading trend in a range of N days
 * @param {*} ticker 
 * @param {*} days 
 */
function renderTrendChart(prices, x, y) {
    let numDays = prices.length;

    let daysRangeLabels = '[' + prices[prices.length-1].label + ' - ' + prices[0].label + ']';

    if (drawing) {
        ctx.bg(255,255,0);
        ctx.fg(0,0,0);
        ctx.text(x, y, ' ' + ticker + ', ' + numDays + ' days range: ' + daysRangeLabels + ' - Trading Trend ');
    }

    let xPos = x;
    let yPos = y+2;
    let w = 1;          // Bar width
    let maxH = 20;      // Max height of a bar.
    let colors = [];
     
    let minLow = Number.MAX_VALUE;
    let maxHigh = Number.MIN_VALUE;

    // find max and min price
    for (let i=0; i<prices.length; i++) {
        if (prices[i].high > maxHigh) {
            maxHigh = prices[i].high;
        }

        if (prices[i].low < minLow) {
            minLow = prices[i].low;
        }
    }

    let maxDelta = maxHigh-minLow;    // max variations of price
    let screenStep = maxDelta / maxH; // step to normalize prices into screen coordinates
    
    if (!drawing) {
        debug('Prices:', prices);
        debug('Max Price: ', maxHigh, ' Min Price: ', minLow);
    }
    

    for (var i = prices.length - 1; i>=0; i--) {  // prices are newest top array, so display from oldest to newest 
        let delta = prices[i].high - prices[i].low;
        let h = (delta / screenStep).toFixed(0);   //((maxH * delta) / maxDelta).toFixed(0);  // High of the bar to draw: (h:maxH = delta : MaxDelta)

        let yOffset = +((maxHigh - prices[i].high)/screenStep).toFixed(0);
        let yy = yPos + yOffset;

        if (!drawing) {
            debug('High: ' + prices[i].high, 'Low: ' + prices[i].low, 'Open: ' + prices[i].open, 'Close: ' + prices[i].close, 'Delta (H-L): ' + delta);
            debug('Max y pos: ' + yPos, 'Offset: ' + yOffset, 'Bar y pos: ' + yy, 'Bar height: ' + h);
        }

        if (prices[i].open > prices[i].close) {           // trending down

            colors = [241, 9, 9];   // Red
        } else if (prices[i].open < prices[i].close) {    // trending up

            colors = [0, 212, 20];   // Green
        } else {  // no trend;

            colors = [255, 252, 252];   // White
        }

        if (drawing) {
            if (h == 0) {
                ctx.bg(104,104,104);
                ctx.box(xPos, yy, w, 1);
            } else {
                ctx.bg(colors[0], colors[1], colors[2]);
                ctx.box(xPos, yy, w, h);
            }
        }

        xPos += 2
    }

    

    /*print('\n');
    let header = ' ------------ ' + ticker + ', ' + numDays + ' days range: ' + daysRangeLabels + ' - Trading Trend -----------';
    print(header);

    print('| Trend: ' + trendMarks);
    print(colors.brightYellow('| Trend with daily % variation [H-L]: ' + trendMarksPercentage));
    print('| Highs: ' + highs);
    print('| Lows: ' + lows);
    print('| Unchanged: ' + same);

    print(getFooterLine(header.length));
    print('\n');*/
}


// Utilities


/**
 * Build footer
 * @param {*} count 
 */
function getFooterLine(count) {
    let s = ' ';
    for (let i=0; i<count-1; i++) {
        s += '-';
    }
    return s;
}


function errorHanlder(error) {
    if (error.message.indexOf('Limit Reach') >= 0) {
        properties.set('counter.api.index', counter+1);

        properties.save(propsFileName, function then(err, data) {
            print('Increased index for next api key');
        });

        print('Fetch problem: ' + API_KEY_EXPIRED_MESSAGE);
    } else {
        print('Fetch problem: ' + error.message);
    }
}



    /*
    
    let url1 = serviceUrl + '/historical-price-full/' + ticker + '?timeseries=' + numDays + '&apikey=' + key;

    fetch(url1)
    .then(function(response) { 
        return response.json();
    }).then(function(result) {
        let prices = result.historical;
        debug(result);
    }).catch(function(err) {  
        print('Fetch problem: ' + err.message);
    });

    */

    /**
     * APIS:
     * 
     * Historical prices (5 years - a json object for each day):
     * https://financialmodelingprep.com/api/v3/historical-price-full/JWN?apikey=f2f676fefb4c5d12e9da7634d2067e4a
     * {
            "date" : "2015-06-29",
            "open" : 75.42,
            "high" : 75.77,
            "low" : 74.25,
            "close" : 74.3,
            "adjClose" : 59.18,
            "volume" : 1600500.0,
            "unadjustedVolume" : 1600500.0,
            "change" : -1.12,
            "changePercent" : -1.485,
            "vwap" : 74.77333,
            "label" : "June 29, 15",
            "changeOverTime" : -0.01485
        }
     * 
     */



     /*
     
        if (! display) {
            ctx.clear(); 
        } else {
            if (display === 'bottom') {
               x = +properties.get('screen.current.xPos');
               y = +properties.get('screen.current.yPos');
               y += 4;
            } else if (display === 'right') {
                x = +properties.get('screen.current.xPos');
                x += 75;
                y -= 2;
             }
        }
     

        properties.set('screen.current.xPos', x);
        properties.set('screen.current.yPos', yPos + 4);

        properties.save(propsFileName, function then(err, data) {});


      */