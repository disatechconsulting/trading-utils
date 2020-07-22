/**
 * Technical Indicators
 */
const print = console.log.bind(console);
const debug = console.log.bind(console);

const nconf = require('nconf');
const fetch = require('node-fetch');

nconf.file({ file: 'config/default-local.json' });
const serviceUrl = nconf.get('ALPHAVANTAGE').url;
const key = nconf.get('ALPHAVANTAGE').apiKey;

let args = process.argv; 
let op = args[2];
let ticker = args[3];
let parma1 = args[4];

const ops = ['VWAP', 'RSI', 'SMA', 'ADX', 'AROON'];

if (ops.indexOf(op) >= 0) {
    
    if (op === ops[0]) {
        vwpa(ticker, 60, key);
    } else if (op === ops[1]) {
        rsi(ticker, 'daily', parma1, key);
    } else if (op === ops[2]) {
        sma(ticker, 'daily', parma1, key);
    } else if (op === ops[3]) {
        adx(ticker, 'daily', parma1, key);
    } else if (op === ops[4]) {
        aroon(ticker, 'daily', parma1, key);
    }
} else {
    print('Operation not recognized');
}


/**
 * This API returns the volume weighted average price (VWAP) for intraday time series.
 * @param {*} ticker 
 * @param {*} interval 
 * @param {*} key 
 */
function vwpa(ticker, interval, key) {
    let url1 = serviceUrl + '/query?function=VWAP&symbol=' + ticker + '&interval=' +interval + 'min&apikey=' + key;

    fetch(url1)
    .then(function(response) { 
        return response.json();
    }).then(function(data) {
        let values = data['Technical Analysis: VWAP'];
        let result = {
            title: 'VWAP - Volume Weighted Average Price',
            url: url1,
            ticker: ticker,
            days: 0,
            range: '',
            total: Object.keys(values).length,
            data: []
        }
        let i = 1;
        let todayDateStr;
        var obj;
        for (key in values) {
            let value = +values[key].VWAP;
            if (i===1) {
                todayDateStr = key.slice(0,10);
                obj = {
                    date: todayDateStr,
                    last_vwap: value,
                    min_vwap: Number.MAX_VALUE,
                    max_vwap: Number.MIN_VALUE, 
                    avg_vwap: 0
                }
            }

            if(key.indexOf(todayDateStr) == 0) {
                if (value < obj.min_vwap) {
                    obj.min_vwap = value;
                }
    
                if (value > obj.max_vwap) {
                    obj.max_vwap = value;
                }

                obj.avg_vwap += value;
    
                i++;
            } else {
                // Store the result
                obj.avg_vwap = +(obj.avg_vwap/(i-1)).toFixed(2);
                result.data.push(obj);

                // Iniitialize for next iteration
                i=2;
                todayDateStr = key.slice(0,10);
                obj = {
                    date: todayDateStr,
                    last_vwap: value,
                    min_vwap: Number.MAX_VALUE,
                    max_vwap: Number.MIN_VALUE, 
                    avg_vwap: 0
                }
                if (value < obj.min_vwap) {
                    obj.min_vwap = value;
                }
    
                if (value > obj.max_vwap) {
                    obj.max_vwap = value;
                }

                obj.avg_vwap += value;
            }
        }

        // Store the result
        obj.avg_vwap = +(obj.avg_vwap/(i-1)).toFixed(2);
        result.data.push(obj);

        result.days = result.data.length;
        result.range = result.data[0].date + ' - ' + result.data[result.data.length-1].date;
        print(result);

    }).catch(function(err) {  
        print('Fetch problem: ' + err.message);
    });
}

/**
 * Describes a momentum indicator that measures the magnitude of recent price changes in order to evaluate overbought or oversold conditions
 * @param {*} ticker 
 * @param {*} interval Time interval between two consecutive data points in the time series. The following values are supported: 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly
 * @param {*} timePeriod Number of data points used to calculate each RSI value. Positive integers are accepted (e.g., time_period=60, time_period=200)
 * @param {*} key 
 */
function rsi(ticker, interval, numDataPoints, key) {
    if (!isNaN(interval)) {
        interval += 'min';
    }
    let url1 = serviceUrl + '/query?function=RSI&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&series_type=close&apikey=' + key;

    fetch(url1)
    .then(function(response) { 
        return response.json();
    }).then(function(data) {
        let values = data['Technical Analysis: RSI'];
        let result = {
            title: 'RSI - Relative Strength Index',
            url: url1,
            ticker: ticker,
            days: 0,
            range: '',
            total: Object.keys(values).length,
            data: []
        }
        let i = 0;
        for (key in values) {
            let obj = {
                date: key,
                rsi: values[key].RSI
            }
            result.data.push(obj);
            i++;
            if (i==numDataPoints) {
                break;
            }
        }

        result.days = result.data.length;
        result.range = result.data[0].date + ' - ' + result.data[result.data.length-1].date
        print(result);

    }).catch(function(err) {  
        print('Fetch problem: ' + err.message);
    });
}

/**
 * 
 * @param {*} ticker 
 * @param {*} interval 
 * @param {*} numDataPoints 
 * @param {*} key 
 */
function sma(ticker, interval, numDataPoints, key) {
    if (!isNaN(interval)) {
        interval += 'min';
    }
    let url1 = serviceUrl + '/query?function=SMA&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&series_type=close&apikey=' + key;

    fetch(url1)
    .then(function(response) { 
        return response.json();
    }).then(function(data) {
        let values = data['Technical Analysis: SMA'];
        let result = {
            title: 'SMA - Simple Moving Average',
            url: url1,
            ticker: ticker,
            days: 0,
            range: '',
            total: Object.keys(values).length,
            data: []
        }
        let i = 0;
        for (key in values) {
            let obj = {
                date: key,
                sma: values[key].SMA
            }
            result.data.push(obj);
            i++;
            // if (i==numDataPoints) {
            //     break;
            // }
        }

        result.days = result.data.length;
        result.range = result.data[0].date + ' - ' + result.data[result.data.length-1].date
        print(result);

    }).catch(function(err) {  
        print('Fetch problem: ' + err.message);
    });
}

/**
 * ADX: average directional index
 * ADX values help traders identify the strongest and most profitable trends to trade. The values are also important for distinguishing between trending and non-trending conditions. Many traders will use ADX readings above 25 to suggest that the trend is strong enough for trend-trading strategies. Conversely, when ADX is below 25, many will avoid trend-trading strategies
 * @param {*} ticker 
 * @param {*} interval 
 * @param {*} numDataPoints 
 * @param {*} key 
 */
function adx(ticker, interval, numDataPoints, key) {
    if (!isNaN(interval)) {
        interval += 'min';
    }
    let url1 = serviceUrl + '/query?function=ADX&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&series_type=close&apikey=' + key;

    fetch(url1)
    .then(function(response) { 
        return response.json();
    }).then(function(data) {
        let values = data["Technical Analysis: ADX"];
        let result = {
            title: 'ADX - Average Directional Movement Index',
            description: 'ADX values help traders identify the strongest and most profitable trends to trade. The values are also important for distinguishing between trending and non-trending conditions. Many traders will use ADX readings above 25 to suggest that the trend is strong enough for trend-trading strategies. Conversely, when ADX is below 25, many will avoid trend-trading strategies',
            url: url1,
            ticker: ticker,
            days: 0,
            range: '',
            total: Object.keys(values).length,
            data: []
        }
        let i = 0;
        for (key in values) {
            let obj = {
                date: key,
                adx: values[key].ADX
            }
            result.data.push(obj);
            i++;
            // if (i==numDataPoints) {
            //     break;
            // }
        }

        result.days = result.data.length;
        result.range = result.data[0].date + ' - ' + result.data[result.data.length-1].date
        print(result);

    }).catch(function(err) {  
        print('Fetch problem: ' + err.message);
    });
}

/**
 * This API returns the Aroon (AROON) values
 * Indicator Movements Around the Key Levels, 30 and 70 - Movements above 70 indicate a strong trend, while movements below 30 indicate low trend strength. Movements between 30 and 70 indicate indecision. For example, if the bullish indicator remains above 70 while the bearish indicator remains below 30, the trend is definitively bullish
 * @param {*} ticker 
 * @param {*} interval 
 * @param {*} numDataPoints 
 * @param {*} key 
 */
function aroon(ticker, interval, numDataPoints, key) {
    if (!isNaN(interval)) {
        interval += 'min';
    }
    let url1 = serviceUrl + '/query?function=AROON&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&apikey=' + key;

    fetch(url1)
    .then(function(response) { 
        return response.json();
    }).then(function(data) {
        let values = data["Technical Analysis: AROON"];
        let result = {
            title: 'AROON - Bullish and Bearish Indexes',
            description: 'Indicator Movements Around the Key Levels, 30 and 70 - Movements above 70 indicate a strong trend, while movements below 30 indicate low trend strength. Movements between 30 and 70 indicate indecision. For example, if the bullish indicator remains above 70 while the bearish indicator remains below 30, the trend is definitively bullish',
            url: url1,
            ticker: ticker,
            days: 0,
            range: '',
            total: Object.keys(values).length,
            data: []
        }
        let i = 0;
        for (key in values) {
            let obj = {
                date: key,
                bullish: values[key]['Aroon Up'],
                bearish: values[key]['Aroon Down']
            }
            result.data.push(obj);
            i++;
            // if (i==numDataPoints) {
            //     break;
            // }
        }

        result.days = result.data.length;
        result.range = result.data[0].date + ' - ' + result.data[result.data.length-1].date
        print(result);

    }).catch(function(err) {  
        print('Fetch problem: ' + err.message);
    });
}