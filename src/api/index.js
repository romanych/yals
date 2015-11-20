var express = require('express');
var bodyParser = require('body-parser');
var shortHash = require('short-hash');
var LocalStorage = LocalStorage;
var storage = new (require('node-localstorage').LocalStorage)('./storage');

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
        storage.setItem(hash, url);
        res.json({hash: hash, shortUrl: process.env.HOST + hash, targetUrl: url});
    }
});

app.get('/:key', function (req, res) {
    var url = storage.getItem(req.params.key);
    if (url) {
        res.redirect(302, url);
    } else {
        res.status(404).send('Sorry, we cannot find that!');
    }
});

var server = app.listen(process.env.PORT || 8888);