const getCitibikeWaitTimes = require('./getCitibikeWaitTimes');
const getMtaWaitTimes = require('./getMtaWaitTimes');
const sendEmail = require('./emailSender');

getMtaWaitTimes()
  .then(getCitibikeWaitTimes)
  .then(text => {
    console.log(text);
    // sendEmail('Commute Info', text);
  });
