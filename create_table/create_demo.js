/**
 * Created by Miguel Pazo (https://miguelpazo.com)
 */
const fs = require('fs');
const AWS = require('aws-sdk');

let config = null;

if (fs.existsSync(__dirname + '/../config/config.json')) {
    config = require(__dirname + '/../config/config.json');
}

const db = new AWS.DynamoDB({
    apiVersion: '2012-08-10',
    region: config ? config.region : process.env.DYNAMODB_REGION,
    accessKeyId: config ? config.accessKeyId : process.env.DYNAMODB_ACCESS_KEY,
    secretAccessKey: config ? config.secretAccessKey : process.env.DYNAMODB_SECRET_KEY,
    maxRetries: 10
});

const dynamodbTable = 'demo3';

const tableParams = {
    AttributeDefinitions: [
        {
            AttributeName: 'email',
            AttributeType: 'S'
        },
        {
            AttributeName: 'created_at',
            AttributeType: 'N'
        }
    ],
    KeySchema: [
        {
            AttributeName: 'email',
            KeyType: 'HASH'
        },
        {
            AttributeName: 'created_at',
            KeyType: 'RANGE'
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    },
    TableName: dynamodbTable,
    StreamSpecification: {
        StreamEnabled: false
    }
};

db.createTable(tableParams, function (err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data);
    }
});
