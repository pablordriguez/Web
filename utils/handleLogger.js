require("dotenv").config();
const { IncomingWebhook } = require("@slack/webhook");

const slackUrl = process.env.SLACK_WEBHOOK;

const webHook = slackUrl ? new IncomingWebhook(slackUrl) : null;

const loggerStream = {
  write: (message) => {
    if (!webHook) {
      console.warn("⚠ SLACK_WEBHOOK not defined. Log not sent.");
      return;
    }

    webHook.send({
      text: `*[Error detected]*\n\`\`\`${message.trim()}\`\`\``,
    });
  },
};

module.exports = loggerStream; 