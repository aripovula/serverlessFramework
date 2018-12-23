const AWS = require('aws-sdk');
const cisp = new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18'
});
const stepfunctions = new AWS.StepFunctions();

exports.handler = (event, context, callback) => {
    console.log('event =', event);
    const accessToken = event.accessToken;
    const cispParams = {
        "AccessToken": accessToken
    };
    cisp.getUser(cispParams, (err, result) => {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            const type = event.type;
            if (type == 'check') {
                const docClient = new AWS.DynamoDB.DocumentClient();
                const pollyS3id = event.candidateID;
                const params = {
                    TableName: process.env.DB_TABLE_NAME
                };

                if (!pollyS3id || pollyS3id === '') {
                    docClient.scan(params, (err, data) => {
                        if (err) {
                            // context.succeed({ success: false, error: err });
                            callback(err);
                        } else {
                            // context.succeed({ success: true, data: data.Items });
                            callback(null, data.Items);
                        }
                    });
                } else {
                    params.Key = {
                        "id": pollyS3id
                    };
                    docClient.get(params, (err, data) => {
                        if (err) {
                            // context.succeed({ success: false, error: err });
                            callback(err);
                        } else {
                            // context.succeed({ success: true, data: data.Item });
                            callback(null, data.Item);
                        }
                    });
                }
            } else if (type == 'addNew') {
                // 1. Trigger Step functions
                const paramsStr = decodeURIComponent(event.params);
                const params = JSON.parse(paramsStr);
                const requestedGender = params.gender;
                const voice = requestedGender == 'male' ? 'Matthew' : 'Salli';
                const textToSynth = params.text;
                console.log('params=', params);
                console.log('params.text=', params.text);
                console.log('text=', textToSynth);
                const params4step = {
                    stateMachineArn: process.env.statemachine_arn,
                    input: JSON.stringify({
                        "candidateID": event.candidateID,
                        "text": textToSynth,
                        "voice": voice
                    })
                }
                console.log('params4step=', params4step);
                stepfunctions.startExecution(params4step, function (err, data) {
                    if (err) {
                        console.log('err while executing step function', err);
                        callback('addErr=', err);
                    } else {
                        console.log('started execution of step function', data);
                        callback(null, 'Steps started');
                    }
                });
            }

        }
    });
}