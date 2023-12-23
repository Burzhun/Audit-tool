const fs = require('fs');
exports.showLog = function (req, res) {
	fs.readFile('logs.txt','utf8',function(err, data){
        if(!err){
            res.send(
                data.replace(/(?:\r\n|\r|\n)/g, '\n')
            );
        }
    });
};