require("dotenv").config();
const Mailjet = require("node-mailjet").connect(
  process.env.MAILJET_PUBLIC,
  process.env.MAILJET_SECRET
);

module.exports = (subject, text) => {
  console.log(subject, text, typeof process.env.MAILJET_PUBLIC);
  Mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "mbushoy@gmail.com",
          Name: "Me"
        },
        To: [
          {
          Email: "mbushoy@gmail.com",
          Name: "Me"
          }
        ],
        Subject: subject,
        TextPart: text,
      }
    ]
  });
};