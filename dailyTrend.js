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

const ops = ['VWAP', 'RSI', 'SMA', 'ADX', 'AROON', 'BBAND', 'TREND'];

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
    } else if (op === ops[5]) {
        bband(ticker, 'daily', parma1, key);
    } else if (op === ops[6]) {
        trend(ticker, 'daily', parma1, key);
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

/**
 * BBAND: Bollinger Bands "the Squeeze." The bands, "are driven by volatility, and the Squeeze is a pure reflection of that volatility."
 * When Bollinger Bands are far apart, volatility is high. When they are close together, it is low. A Squeeze is triggered when volatility reaches a six-month low and is identified when Bollinger Bands® reach a six-month minimum distance apart.
 * @param {*} ticker 
 * @param {*} interval 
 * @param {*} numDataPoints 
 * @param {*} key 
 */
function bband(ticker, interval, numDataPoints, key) {
    if (!isNaN(interval)) {
        interval += 'min';
    }
    let url1 = serviceUrl + '/query?function=BBANDS&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&series_type=close&nbdevup=3&nbdevdn=3&apikey=' + key;

    fetch(url1)
    .then(function(response) { 
        return response.json();
    }).then(function(data) {
        let values = data["Technical Analysis: BBANDS"];
        let result = {
            title: 'BBAND - Bollinger Bands - Squeeze.',
            description: 'When Bollinger Bands are far apart, volatility is high. When they are close together, it is low. A Squeeze is triggered when volatility reaches a six-month low and is identified when Bollinger Bands® reach a six-month minimum distance apart.',
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
                upperBand: values[key]['Real Upper Band'],
                middleBand: values[key]['Real Middle Band'],
                lowerBand: values[key]['Real Lower Band']
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

function getData(data, key) {
    let i=0;
    while (i < data.length) {
        if (data[i][key]) {
            return data[i][key];
        } else {
            i++;
        }
    }
    return undefined;
}

function trend(ticker, interval, numDataPoints, key) {

    let url1 = serviceUrl + '/query?function=SMA&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&series_type=close&apikey=' + key;
    let url2 = serviceUrl + '/query?function=ADX&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&series_type=close&apikey=' + key;
    let url3 = serviceUrl + '/query?function=AROON&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&apikey=' + key;
    let url4 = serviceUrl + '/query?function=BBANDS&symbol=' + ticker + '&interval=' + interval + '&time_period=' + numDataPoints + '&series_type=close&nbdevup=3&nbdevdn=3&apikey=' + key;

    let keys = ['Technical Analysis: SMA', 'Technical Analysis: ADX', 'Technical Analysis: AROON', 'Technical Analysis: BBANDS'];

    let urls = [url1, url2, url3, url4];

    Promise.all(urls.map(function(url) {
        return fetch(url);
    } ))
    .then(function(responses) {
        return Promise.all( responses.map(function (response) { 
            return response.json(); 
        }))
    })
    .then(function(resultApis) { 
        if (resultApis.length === keys.length) {
            let smaData = getData(resultApis, keys[0]);
            let adxData = getData(resultApis, keys[1]);
            let aroonData = getData(resultApis, keys[2]);
            let bbandsData = getData(resultApis, keys[3]);

            let result = {
                sma: 'SMA - Simple Moving Average - Buy if belowe the SMA value',
                adx: 'ADX - Average Directional Movement Index - Above 25 => trend is strong enough for trend-trading. Below 25, avoid trend-trading strategies',
                aroon: 'AROON - Bullish and Bearish Indexes - Movements above 70 => strong trend. Movements below 30 => low trend strength. Movements between 30 and 70 => indecision. (For example, if the bullish indicator remains above 70 while the bearish indicator remains below 30, the trend is definitively bullish)',
                bbands: 'BBANDS - Bollinger Bands - Squeeze - When BBANDS are far apart, volatility is high. When they are close together, it is low. A Squeeze is triggered when volatility reaches a six-month low and is identified when BBANDS reach a six-month minimum distance apart',
                ticker: ticker,
                days: 0,
                range: '',
                total: Object.keys(smaData).length,
                data: []
            }
            let i = 0;
           // print(smaData);
            for (var key in smaData) {
                let obj = {
                    date: key,
                    sma: smaData[key].SMA,
                    adx: adxData[key] ? adxData[key].ADX : 'n/a',
                    aroon: {
                        bullish: aroonData[key] ? aroonData[key]['Aroon Up'] : 'n/a',
                        bearish: aroonData[key] ? aroonData[key]['Aroon Down'] : 'n/a'
                    },
                    bband: {
                        upperBand: bbandsData[key] ? bbandsData[key]['Real Upper Band'] : 'n/a',
                        middleBand: bbandsData[key] ? bbandsData[key]['Real Middle Band'] : 'n/a',
                        lowerBand: bbandsData[key] ? bbandsData[key]['Real Lower Band'] : 'n/a'
                    }
                }
                result.data.push(obj);
                i++;
                if (i==10) {
                     break;
                }
            }
    
            result.days = result.data.length;
            result.range = result.data[0].date + ' - ' + result.data[result.data.length-1].date
            print(JSON.stringify(result, null, 4));

        } else {
            print('Some data didn\'t retrieve sucessfully');
        }
    }).catch(function(err) {  
        print('Fetch problem: ' + err.message);
    });
}