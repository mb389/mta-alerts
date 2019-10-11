const getCitibikeWaitTimes = require('./getCitibikeWaitTimes');
const getMtaWaitTimes = require('./getMtaWaitTimes');
const sendEmail = require('./emailSender');
const {
  mta: { stationChoices },
  requestSettings
} = require('./config');
require('dotenv').config();

const now = Date.now();
let text = '';

// Fetch MTA data
Promise.all(stationChoices.map(e => getMtaWaitTimes(...e)))
  .then(arr => {
    if (arr.length) {
      text += 'Subways\n';
      arr
        .filter(e => e)
        .forEach(el => {
          text += `${el[0].stationName}\n`;
          el.slice(0, 5).reduce(
            (acc, curr) =>
              (text += `${curr.routeId} - ${curr.arrivalTime} (${curr.waitTime} mins)\n`),
            ''
          );
          text += '\n';
        });
    }
    // return getCitibikeWaitTimes(text);
    return text;
  })
  .then(text => {
    console.log(text);
    // sendEmail('Commute Info', text);
  });
