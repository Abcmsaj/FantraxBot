const fs = require('fs');

function checkFile(filename) {
    fs.readFile(filename, 'utf-8', function (err, data) {
        if (err) {
            console.log(filename + ' does not exist')
            fs.writeFile(filename, '{}', { flag: 'w' }, function (err) {
                if (err) {
                    console.log('Attempted to create ' + filename + ' but was unsuccessful')
                } else {
                    console.log(filename + ' was created.')
                }
            })
        } else {
            console.log(filename + ' already exists.')
        }
    })
}

module.exports.checkFile = checkFile;