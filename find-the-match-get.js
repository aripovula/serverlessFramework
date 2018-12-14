const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'us-east-1', apiVersion: '2012-08-10' });
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
const stepfunctions = new AWS.StepFunctions();

exports.handler = (event, context, callback) => {

    console.log('event = ', event);
    const accessToken = event.accessToken;
    const candidateID = event.candidateID;

    const cispParams = {
        "AccessToken": accessToken
    };
    cisp.getUser(cispParams, (err, result) => {
        if (err) {
            console.log(err);
            callback(err);
        } else {

            let dataAsJsObject = [];
            const type = event.type;
            if (type === 'all') {
                const params = {
                    TableName: 'dcf-dfym2c-usersTable'
                };

                dynamodb.scan(params, function (err, data) {
                    if (err) {
                        console.log(err);
                        callback(err);
                    } else {
                        console.log(data);

                        let i = 0;
                        data.Items.map((item) => {
                            let JsObjectItem = {
                                id: "" + item.UserID.S,
                                userName: "" + item.userName.S,
                                otherDetails: "" + item.otherDetails.S
                            };
                            // if (JsObjectItem.gender === 'female' && JsObjectItem.interests.includes('design')) {
                            dataAsJsObject.push(JsObjectItem);
                            // }
                        });
                        console.log(data);
                        console.log(dataAsJsObject);
                        callback(null, dataAsJsObject);
                    }
                });
            } else if (type === 'single') {
                console.log('in single mode');
                // 1. Trigger Step functions
                const params4step = {
                    stateMachineArn: process.env.statemachine_arn,
                    input: JSON.stringify({ "candidate_name": candidateID, "text": "Again Testings Step functions from Lambda", "voice": "Salli" })
                }

                stepfunctions.startExecution(params4step, function (err, data) {
                    if (err) {
                        console.log('err while executing step function', err);
                    } else {
                        console.log('started execution of step function', data);
                    }
                });

                // 2. Find the match and return
                const params = {
                    Key: {
                        "UserID": {
                            S: candidateID
                        }
                    },
                    TableName: 'dcf-dfym2c-usersTable'
                };

                dynamodb.getItem(params, function (err, data) {
                    if (err) {
                        console.log(err);
                        callback(err);
                    } else {
                        console.log(data);


                        callback(null, {
                            id: "" + data.Item.UserID.S,
                            userName: "" + data.Item.userName.S,
                            otherDetails: "" + data.Item.otherDetails.S
                        });
                    }
                });
            } else {
                callback('Get type is incorrect');
            }
        }
    });
};
