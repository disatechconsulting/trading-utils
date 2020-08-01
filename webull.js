const print = console.log.bind(console);
const debug = console.log.bind(console);

const superagent = require('superagent');
const utf8 = require('utf8');
const md5 = require('md5');
const uuidv4 = require('uuid').v4;
const md5Hex = require('md5-hex');

let args = process.argv; 
let username = args[2];
let password = args[3];
let deviceID = args[3];

if (!deviceID) {
    deviceID = uuidv4();
    print(deviceID);
}

let hexDeviceId = deviceID.toString('hex');

const url_api = 'https://userapi.webull.com/api';

function getMFA(account, dId, callback) {
    debug(account, dId);

    let accountType = username.indexOf('@') > 0 ? 2 : 1;

    let headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
    };

    let url = url_api + '/passport/verificationCode/sendCode?account=' + '"+1-' + account + '"' 
                                                     + '&accountType=' + '"' + accountType + '"'  
                                                     + '&deviceId=' + '"' + dId + '"'
                                                     + '&codeType=5&regionCode=1';

    debug(url);

    superagent
        .get(url)
        .set(headers)
        .end((err, res) => {
            if (!err) {
                //var result = JSON.parse(res.text);
                print(result);
            } else {
                debug(err);
            }
            
    });
}




function login(username, password, dId) {
    if (username && password) {

        let accountType = username.indexOf('@') > 0 ? 2 : 1;
        
        // with webull md5 hash salted
        let pwd = utf8.encode('wl_app-a&b@!423^' + password);
        let md5_hash = md5(pwd);


       let data = {
            'account': '+1-' + username,
            'accountType': accountType,
            'deviceId': dId,
            'deviceName': 'default_string',
            'grade': 1,
            'pwd': md5_hash.toString('hex'),
            'regionId': 1
        };

        let headers = {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        };

        debug(username, md5_hash, accountType, dId);

        superagent
            .post(url_api + '/passport/login/v3/account')
            .send(data)
            .set(headers)
            .end((err, res) => {
                if (!err) {
                    //var result = JSON.parse(res.text);
                    print(res);
                } else {
                    print(err);
                    //debug(JSON.parse(err.response.text));
                }
        });
    }
}

//login(username, password, hexDeviceId);
getMFA(username, hexDeviceId);