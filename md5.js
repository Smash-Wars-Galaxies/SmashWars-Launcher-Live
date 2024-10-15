const crypto = require('crypto');
const fs = require('fs');
const log = require('electron-log');

function md5(file, cb) {
    var hash = crypto.createHash('md5'), 
    stream = fs.createReadStream(file);
    stream.on('data', data => hash.update(data, 'utf8'));
    stream.on('end', () => cb(hash.digest('hex')));
}

md5(process.argv[2], console.log);

log.info("Size:", fs.statSync(process.argv[2]).size);