console.log('start-post');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
    region: 'us-east-1',
    apiVersion: '2012-08-10'
});
const cisp = new AWS.CognitoIdentityServiceProvider({
    apiVersion: '2016-04-18'
});
const s3 = new AWS.S3();

exports.handler = (event, context, callback) => {
    console.log('event', event);
    const accessToken = event.accessToken;
    const cispParams = {
        "AccessToken": accessToken
    };

    cisp.getUser(cispParams, (err, result) => {
        if (err) {
            console.log(err);
            callback(err);
        } else {

            let malesArray;
            let mImagesArray;
            let femalesArray;
            let fImagesArray;
            const smokers = ['smoker', 'non-smoker'];
            const personalityTypes = ['Extrovert', 'Introvert'];
            const characters = ['Active', 'Lazy'];
            const behavings = ['Calm', 'Impulsive'];
            const lovePets = ['LovesPets', 'HatesPets', 'SomePets'];


            const paramsS3 = {
                Bucket: "dfym-permanent-files",
                Key: "pseudoUsers.txt"
            };
            s3.getObject(paramsS3, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    // console.log('pseudoUsers data = ', data);
                    // console.log('pseudoUsers.body = ', data.Body);
                    const pseudoUsers = data.Body.toString('ascii');
                    // console.log('pseudoUsers = ', pseudoUsers);
                    const pseudoUsersObj = JSON.parse(pseudoUsers);
                    // console.log('pseudoUsers females = ', pseudoUsersObj.femaleNames);
                    malesArray = pseudoUsersObj.maleNames.split(',');
                    mImagesArray = pseudoUsersObj.maleImages.split(',');
                    femalesArray = pseudoUsersObj.femaleNames.split(',');
                    fImagesArray = pseudoUsersObj.femaleImages.split(',');
                    console.log('array females = ', femalesArray);

                    let x = 0;
                    let criteriaSet;
                    for (const smoker of smokers) {
                        for (const personalityType of personalityTypes) {
                            for (const character of characters) {
                                for (const behaving of behavings) {
                                    for (const lovePet of lovePets) {
                                        criteriaSet = smoker + ';' + personalityType + ';' + character + ';' + behaving + ';' + lovePet;
                                        putToDynamoDB(callback, x, malesArray[x], mImagesArray[x], femalesArray[x], fImagesArray[x], criteriaSet);
                                        x++;
                                    }
                                }
                            }
                        }
                    }
                    callback(null, "done");
                }
            });
        }
    });
};

const putToDynamoDB = function (callback, id, maleName, mImage, femaleName, fImage, criteriaSet) {
    // const id = event.id;
    // const userName = event.userName;
    // const otherDetails = event.otherDetails;
    // console.log('event', event);
    // console.log('id', id);
    // console.log('userName', userName);
    // console.log('otherDetails', otherDetails);
    // console.log('AWS', AWS === null);
    // console.log('dynamodb', dynamodb === null);

    // callback(null, "Hi "+name+". Followings were recorded in DynamoDB "+interests);

    // callback, id, maleName, mImage, female, fImage, criteriaSet
    let params = {
        Item: {
            "UserID": {
                S: '' + id
            },
            "userNameM": {
                S: maleName
            },
            "mImage": {
                S: mImage
            },
            "userNameF": {
                S: femaleName
            },
            "fImage": {
                S: fImage
            },
            "criteriaSet": {
                S: criteriaSet
            }
        },

        TableName: "dcf-dfym2c-usersTable"
    };

    dynamodb.putItem(params, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            callback(err);
        } else {
            console.log(data); // successful response
            // callback(null, data);
        }
    });
}