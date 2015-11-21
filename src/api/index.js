var express = require('express');
var bodyParser = require('body-parser');
var shortHash = require('short-hash');
var LocalStorage = LocalStorage;
var storage = new (require('node-localstorage').LocalStorage)('./storage');
var AWS = require("aws-sdk");
AWS.config.update({region: 'eu-west-1'});

var db = new AWS.DynamoDB.DocumentClient();

var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('index.html')
});

app.post('/shorten', function (req, res) {
    var url = req.body && req.body.url;
    if (!url) {
        return res.status(400).json({message: 'no URL'}).end();
    } else {
        var hash = shortHash(url);
        db.put({
            TableName: "short_links",
            Item: {"hash": hash, targetUrl: url}
        }, function () {
            storage.setItem(hash, url);
            res.json({hash: hash, shortUrl: process.env.HOST + hash, targetUrl: url});
        })
    }
});

function go(res, url) {
    if (url) {
        res.redirect(302, url);
    } else {
        res.status(404).send('Sorry, we cannot find that!');
    }
}

app.get('/:key', function (req, res) {
    var hash = req.params.key;
    var url = storage.getItem(hash);
    if (!url) {
        db.get(
            {TableName: "short_links", Key: {"hash": hash}},
            function (err, record) {
                url = record.targetUrl;
                url && storage.setItem(hash, url);
                go(res, url);
            });
    } else {
        go(res, url);
    }
});

var server = app.listen(process.env.PORT || 8888);