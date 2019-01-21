const { emailRecipients } = require('./config');

require('dotenv').config();
const Mailjet = require('node-mailjet').connect(
  process.env.MAILJET_PUBLIC,
  process.env.MAILJET_SECRET
);

module.exports = (subject, text) => {
  Mailjet.post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: 'mbushoy@gmail.com'
          },
          To: emailRecipients.map(email => ({ Email: email })),
          Subject: subject,
          TextPart: text
        }
      ]
    })
    .then(() => console.log('Email sent!'));
};
