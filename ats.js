/**
 * Automated Trading Setups
 */
const superagent = require('superagent');

/**
 * This function will generate a token used when loggin on
function generate_device_token() {
    var rands = [];

    for (var i in range(0, 16)) {
        var r = random.random();
        var rand = 4294967296.0 * r;
        console.log(rand);
        rands.push((int(rand) >> ((3 & i) << 3)) & 255)
    }

    var hexa = [];
    for (var i in range(0, 256)) {
        hexa.push(str(hex(i+256)).lstrip("0x").rstrip("L")[1:])
    }

    var id = '';
    for (var i in range(0, 16)) {
        id += hexa[rands[i]];

        if ((i == 3) || (i == 5) || (i == 7) || (i == 9)) {
            id += '-';
        }
            
    }

    return id
}*/

//console.log(generate_device_token());

superagent
  .post('https://api.robinhood.com/token/')
  .send({
      client_id: 'c82SH0WZOsabOXGP2sxqcj34FxkvfnWRZBKlBjFS',
      expires_in: 86400,
      grant_type: 'password',
      password: 'Giorgio@111141',
      scope: 'internal',
      username: 'sacchetto.diego@gmail.com',
      challenge_type: 'email',
      device_token: '522ea951-4ec1-4f88-8de8-9643d3207f2c'
       
   }) // sends a JSON post body
  .set('accept', 'application/json')
  .end((err, res) => {
      if (!err) {
        console.log('good');
      } else {
        console.log('bad');
      }
      
  });


