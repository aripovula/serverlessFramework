'use strict';

module.exports.hello = async (event, context, callback) => {

const now = new Date();
const message = `Time now is ${now}`;

console.log(message);

callback(null, message);

  // return {
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     message: `Hey ${event.pathParameters.name}`
  //     , input: event,
  //   }),
  // };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
