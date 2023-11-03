const devcert = require('devcert');
const fs = require('fs');

if (!fs.existsSync('./certs')) {
  fs.mkdirSync('./certs');
}

const domains = ['my-cool-domain.local'];

devcert
  .certificateFor(domains, { getCaPath: true })
  .then(({ key, cert, caPath }) => {
    fs.writeFileSync('./certs/devcert.key', key);
    fs.writeFileSync('./certs/devcert.cert', cert);
    fs.writeFileSync('./certs/.capath', caPath);
  })
  .catch(console.error);
