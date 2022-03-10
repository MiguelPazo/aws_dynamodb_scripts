/**
 * Created by Miguel Pazo (https://miguelpazo.com)
 */
const fs = require('fs');
const AWS = require('aws-sdk');
const logger = require('./../server/logger').getLogger('insert_demo');
const lineByLineReader = require('line-by-line');

let config = null;

if (fs.existsSync(__dirname + '/../config/config.json')) {
    config = require(__dirname + '/../config/config.json');
}

const dynamodbTable = 'demo';
const separator = '-@@-';
const sizeBatch = 25;
const beginLine = 2;

// file from .sh file config
const csvFile = process.env.FILE_TO_LOAD;

// for test purpose
// const csvFile = __dirname + '/../output/data.csv';

const dbClient = new AWS.DynamoDB.DocumentClient({
    region: config ? config.region : process.env.DYNAMODB_REGION,
    accessKeyId: config ? config.accessKeyId : process.env.DYNAMODB_ACCESS_KEY,
    secretAccessKey: config ? config.secretAccessKey : process.env.DYNAMODB_SECRET_KEY,
    maxRetries: 10
});

let dataInsert = [];

const insert = async () => {
    const params = {
        RequestItems: {}
    };

    params.RequestItems[dynamodbTable] = [];

    for await (item of dataInsert) {
        params.RequestItems[dynamodbTable].push({
            PutRequest: {
                Item: item
            }
        });
    }

    await dbClient.batchWrite(params).promise();
}

const readLine = () => {
    return new Promise(async (resolve, reject) => {
        logger.info('Start reading file');

        let currLine = 0;
        let countErrors = 0;

        const lr = new lineByLineReader(csvFile, {
            encoding: 'utf-8',
            skipEmptyLines: true
        });

        lr.on('error', function (err) {
            logger.info(err);
        });

        lr.on('line', async function (line) {
            currLine++;
            lr.pause();

            logger.info(`Processing line ${currLine}`);

            if (currLine >= beginLine) {
                try {
                    if (line) {
                        const parts = line.split(separator);

                        const data = {
                            email: parts[0] ? parts[0].trim() : '',
                            created_at: parts[1].trim() ? parseInt(parts[1].trim()) : '',
                        }

                        dataInsert.push(data);
                    }
                } catch (err) {
                    countErrors++;
                    logger.error(`Error in line ${currLine} \n${err.stack}`);
                }

                if (dataInsert.length === sizeBatch) {
                    await insert();
                    dataInsert = [];
                }
            }
            lr.resume();
        });

        lr.on('end', async function () {
            if (dataInsert.length > 0) {
                await insert();
            }

            logger.info(`Finish load data, errors: ${countErrors}`);
        });
    });
}

void async function () {
    await readLine();
}();
