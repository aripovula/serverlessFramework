console.log('start-get');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'us-east-1', apiVersion: '2012-08-10' });
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

exports.handler = (event, context, callback) => {
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
                                name: "" + item.name.S,
                                gender: "" + item.gender.S,
                                interests: "" + item.interests.S
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
                            name: "" + data.Item.name.S,
                            gender: "" + data.Item.gender.S,
                            interests: "" + data.Item.interests.S
                        });
                    }
                });
            } else {
                callback('Get type is incorrect');
            }
        }
    });
};
