/**
 * Created by Miguel Pazo (https://miguelpazo.com)
 */
const {createLogger, format, transports} = require('winston');
const {combine, timestamp, printf} = format;
const dateFormat = require('dateformat');

const myFormat = printf(({level, message, label, timestamp}) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
    level: 'info',
    timestamp: true,
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [],
});

module.exports = {
    getLogger: (filename) => {
        if (process.env.NODE_ENV !== 'production') {
            logger.add(new transports.Console({}));
        } else {
            const dateless = new Date().getTime() - 5 * 60 * 60 * 1000;
            const date = dateFormat(new Date(dateless), "yyyymmdd_HHMMss");
            const logsPath = process.env.LOGS_PATH || __dirname + '/../output';

            logger.add(new transports.File({filename: `${logsPath}/${date}_${filename}_errors.log`, level: 'error', json: false}));
            logger.add(new transports.File({filename: `${logsPath}/${date}_${filename}_combined.log`}));
        }

        return logger;
    }
};
