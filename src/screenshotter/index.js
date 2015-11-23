var AWS = require("aws-sdk");
var webshot = require('webshot');
var fs = require('fs');

AWS.config.update({region: 'eu-west-1'});
var s3 = new AWS.S3();
var db = new AWS.DynamoDB.DocumentClient();

function makeScreenshot(url, hash, callback) {
    var fileName = hash + '.png';
    webshot(url, fileName, function (err) {
        if (err) {
            throw err;
        }
        var stream = fs.createReadStream(fileName);
        s3.upload({
            Bucket: 'yals-screenshots',
            Key: fileName,
            ACL: "public-read",
            ContentType: "image/png",
            Body: stream
        }, callback);
    });
}

exports.handler = function (data, context) {
    var item = data.Records[0].dynamodb.NewImage;
    var hash = item.hash.S;
    var targetUrl = item.targetUrl.S;
    var screenshotUrl = item.screenshotUrl.S;
    if (screenshotUrl){
        return context.success("Screenshot already taken");
    }
    makeScreenshot(hash, targetUrl, function(err, r) {
        if (err) {return context.fail(err)}
        db.put({
            TableName: "short_links",
            Item: {"hash": hash, screenshotUrl: r.Location}
        }, context.done);
    })
};