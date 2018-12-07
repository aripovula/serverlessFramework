const AWS = require('aws-sdk');
const s3 = new AWS.S3();

console.log('in S3LmdaFwd');
const forwardFrom = "ulugbek@aripov.info";
const forwardTo = "ulugbeks@gmail.com";

exports.handler = function (event, context, callback) {

  console.log('in S3LmdaFwd');
  const src_bkt = event.Records[0].s3.bucket.name;
  const src_key = event.Records[0].s3.object.key;

  s3.getObject({
    Bucket: src_bkt,
    Key: src_key
  }, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      callback(err);
    } else {
      // const msgBody = data.Body.toString('ascii');
      // console.log("Raw text:\n" + msgBody);

      const msgInfo = data.Body.toString('ascii');
      console.log("msgInfo json:\n" + msgInfo);

      if (msgInfo.includes('X-SES-Spam-Verdict: PASS') && msgInfo.includes('X-SES-Virus-Verdict: PASS')) {

        let email = msgInfo;
        let headers = "From: " + forwardFrom + "\r\n";
        headers += "Reply-To: " + forwardFrom + "\r\n";
        headers += "X-Original-To: " + forwardTo + "\r\n";
        headers += "To: " + forwardTo + "\r\n";
        headers += "Subject: NEW: Fwd from S3 \r\n";

        email = headers + "\r\n" + email;

        new AWS.SES().sendRawEmail({
          RawMessage: {
            Data: email
          }
        }, function (err, data) {
          if (err) {
            console.log('error', err);
            // context.fail(err);
            callback(err);
          }
          else {
            console.log('Sent with MessageId: ' + data.MessageId);
            // context.succeed();
            callback(null, data.MessageId);
          }
        });
        callback(null, null);
      } else {
        console.log('Message is spam or contains virus, ignoring.');
        //context.succeed();
        callback(null, data.MessageId);
        
      }
    }
  });

}