const provider = require("../config/apn");
const apn = require("apn");                // APN library

async function sendVoipPush(voipToken, callerName, phoneNumber) {
    const note = new apn.Notification();

    note.topic = "com.kamalassociates.aapnasmartgate.dev";
    note.pushType = "voip";
    note.priority = 10;

    note.payload = {
        callerName,
        handle: phoneNumber,
        hasVideo: false,
    };

    const result = await provider.send(note, voipToken);

    console.log("APNs Result??????????????????:", result);

    return result;
}

module.exports = sendVoipPush;