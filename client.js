const { SQSClient } = require('@aws-sdk/client-sqs')

const endpoint = process.env.AWS_ENDPOINT || ''
const options = { region: process.env.AWS_REGION }

if (endpoint) options.endpoint = endpoint

const sqsClient = new SQSClient(options)
module.exports = sqsClient
