/**
 * Automated Trading Setups
 */
const print = console.log.bind(console);
const debug = console.log.bind(console);

const fs = require('fs');
const nconf = require('nconf');
const superagent = require('superagent');

nconf.file({ file: 'config/default-local.json' });

var apiKey = nconf.get('ALPACA').apiKey;
var secret = nconf.get('ALPACA').apiSecret;
var url_api = nconf.get('ALPACA').url_api;
var url_data = nconf.get('ALPACA').url_data;

function getAccountInfo() {
    superagent
        .get(url_api + '/v2/account')
        .set({
            'APCA-API-KEY-ID': apiKey,
            'APCA-API-SECRET-KEY': secret
        })
        .end((err, res) => {
            if (!err) {
                var result = JSON.parse(res.text);
                print(result);
            } else {
                debug(JSON.parse(err.response.text));
            }
            
    });
}

function getListOrders() {
    superagent
        .get(url_api + '/v2/orders?status=open')
        .set({
            'APCA-API-KEY-ID': apiKey,
            'APCA-API-SECRET-KEY': secret
        })
        .end((err, res) => {
            if (!err) {
                var result = JSON.parse(res.text);
                print(result);
            } else {
                debug(JSON.parse(err.response.text));
            }
            
    });
}

function getLastQuoteForStock(ticker) {
    superagent
        .get(url_data + '/v1/last_quote/stocks/' + ticker)
        .set({
            'APCA-API-KEY-ID': apiKey,
            'APCA-API-SECRET-KEY': secret
        })
        .end((err, res) => {
            if (!err) {
                var result = JSON.parse(res.text);
                print(result);
            } else {
                debug(err);
            }
            
    });
}

function bracketOrderAtMarket(ticker, numShares, lossPrice, limitPrice, profitPrice) {
    superagent
    .post(url_api + '/v2/orders')
    .send({
        side: "buy",
        symbol: ticker,
        type: "market",
        qty: numShares,
        time_in_force: "gtc",
        order_class: "bracket",
        take_profit: {
          limit_price: profitPrice
        },
        stop_loss: {
          stop_price: lossPrice,
          limit_price: limitPrice
        }
    })
    .set({
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secret
    })
    .end((err, res) => {
        if (!err) {
            var result = JSON.parse(res.text);
            print(result);
        } else {
            debug(JSON.parse(err.response.text));
        }
    });
}

//bracketOrderAtMarket("AMD", 1, 50, 49, 60);

getLastQuoteForStock('PD');