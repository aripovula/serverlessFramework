const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'us-east-1', apiVersion: '2012-08-10' });
const cisp = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
const stepfunctions = new AWS.StepFunctions();

exports.handler = (event, context, callback) => {

    console.log('event = ', event);
    const accessToken = event.accessToken;
    const candidateID = event.candidateID;
    const criteriaSet = decodeURIComponent(event.criteriaSet);

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
                                criteriaSet: "" + item.criteriaSet.S,
                                userName: "" + item.userNameF.S,
                                userImage: "" + item.fImage.S
                            };
                            // if (JsObjectItem.gender === 'female' && JsObjectItem.interests.includes('design')) {
                            dataAsJsObject.push(JsObjectItem);
                            // }
                        });
                        data.Items.map((item) => {
                            const idMales = parseInt(item.UserID.S, 10) + 48;
                            let JsObjectItem = {
                                id: "" + idMales,
                                criteriaSet: "" + item.criteriaSet.S,
                                userName: "" + item.userNameM.S,
                                userImage: "" + item.mImage.S
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
                const criteriaSetObj = JSON.parse(criteriaSet);

                // 1. Trigger Step functions
                const firstName = criteriaSetObj.firstName;
                const nickname = criteriaSetObj.nickname;
                const requestedGender = criteriaSetObj.genderFind;
                const voice = requestedGender == 'male' ? 'Matthew' : 'Salli';

                const params4step = {
                    stateMachineArn: process.env.statemachine_arn,
                    input: JSON.stringify({
                        "candidateID": candidateID,
                        "text": "Hi " + firstName + "! Do you mind if I call you " + nickname + "? I am glad we got in touch. Can you send me your photo ?",
                        "voice": voice
                    })
                }

                stepfunctions.startExecution(params4step, function (err, data) {
                    if (err) {
                        console.log('err while executing step function', err);
                    } else {
                        console.log('started execution of step function', data);
                    }
                });

                // 2. Find the match and return
                const isASmokerFind = criteriaSetObj.isASmokerFind;
                let personalityTypeFind = criteriaSetObj.personalityTypeFind;
                let characterFind = criteriaSetObj.characterFind;
                let behavingFind = criteriaSetObj.behavingFind;
                let lovePetsFind = criteriaSetObj.lovePetsFind;

                personalityTypeFind = personalityTypeFind.replace("rather sociable (extrovert)", "Extrovert");
                personalityTypeFind = personalityTypeFind.replace("rather on my own (introvert)", "Introvert");
                characterFind = characterFind.replace("rather active (outdoor, sports)", "Active");
                characterFind = characterFind.replace("rather lazy", "Lazy");
                behavingFind = behavingFind.replace("impulsive", "Impulsive");
                behavingFind = behavingFind.replace("calm", "Calm");
                lovePetsFind = lovePetsFind.replace("yes", "LovesPets");
                lovePetsFind = lovePetsFind.replace("no", "HatesPets");
                lovePetsFind = lovePetsFind.replace("depends", "SomePets");

                let criteriaSetFromUser = isASmokerFind + ';'
                    + personalityTypeFind + ';'
                    + characterFind + ';'
                    + behavingFind + ';'
                    + lovePetsFind;
                criteriaSetFromUser = criteriaSetFromUser.trim();
                // smoker;Extrovert;Active;Calm;LovesPets
                // smoker;rather sociable (extrovert);rather lazy;impulsive;no
                console.log('criteriaSetFromUser = -' + criteriaSetFromUser + '-', criteriaSetFromUser.length);
                const newT = "abcTest";
                console.log('newT = -' + newT + '-', newT.length);
                const params = {
                    TableName: 'dcf-dfym2c-usersTable',
                    IndexName: "criteriaSet-index",
                    KeyConditionExpression: "criteriaSet = :a",
                    ExpressionAttributeValues: {
                        ":a": {
                            S: criteriaSetFromUser
                        }
                    },
                    ProjectionExpression: "userNameM, userNameF, mImage, fImage",
                    ScanIndexForward: false
                };

                dynamodb.query(params, function (err, data) {
                    if (err) {
                        console.log(err, criteriaSetFromUser);
                        callback({ err: err, text: criteriaSetFromUser });
                    } else {
                        console.log('single = ', data.Items[0]);
                        const simulatedDeviationOnOtherFactors = Math.round(Math.random() * (10 - 4) + 4);
                        if (requestedGender == 'male') {
                            callback(null, JSON.stringify({
                                searchText: criteriaSetFromUser,
                                name: data.Items[0].userNameM.S,
                                image: 'https://' + data.Items[0].mImage.S,
                                matchRate: 100 - simulatedDeviationOnOtherFactors
                            }));
                        } else {
                            callback(null, JSON.stringify({
                                searchText: criteriaSetFromUser,
                                name: data.Items[0].userNameF.S,
                                image: 'https://' + data.Items[0].fImage.S,
                                matchRate: 100 - simulatedDeviationOnOtherFactors
                            }));
                        }
                    }
                });
            } else {
                callback('Get type is incorrect');
            }
        }
    });
};
