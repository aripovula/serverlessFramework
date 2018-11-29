const AWS = require('aws-sdk');
var s3 = new AWS.S3();

const forwardFrom = "ulugbek@aripov.info";
const forwardTo = "ulugbeks@gmail.com";

exports.handler = function (event, context, callback) {

  var src_bkt = event.Records[0].s3.bucket.name;
  var src_key = event.Records[0].s3.object.key;

  s3.getObject({
    Bucket: src_bkt,
    Key: src_key
  }, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err);
    } else {
      const msgBody = data.Body.toString('ascii');
      console.log("Raw text:\n" + msgBody);

      var msgInfo = JSON.parse(msgBody);
      console.log("msgInfo json:\n" + msgInfo);

      if (msgInfo.receipt.spamVerdict.status === 'FAIL' || msgInfo.receipt.virusVerdict.status === 'FAIL') {

        var email = msgInfo;
        let headers = "From: " + forwardFrom + "\r\n";
        headers += "Reply-To: " + forwardFrom + "\r\n";
        headers += "X-Original-To: " + forwardTo + "\r\n";
        headers += "To: " + forwardTo + "\r\n";
        headers += "Subject: NEW: Fwd from S3 \r\n";



        new AWS.SES().sendRawEmail({
          RawMessage: {
            Data: email
          }
        }, function (err, data) {
          if (err) context.fail(err);
          else {
            console.log('Sent with MessageId: ' + data.MessageId);
            context.succeed();
          }
        });
        callback(null, null);
      } else {
        console.log('Message is spam or contains virus, ignoring.');
        context.succeed();
      }
    }
  });

}