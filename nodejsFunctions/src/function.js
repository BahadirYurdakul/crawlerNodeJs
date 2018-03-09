//@flow

import {crawler} from "./controllers/crawlerController";
const eventMaxAgeMs = require("./config").googleCloudEventMaxAgeMs;

exports.subscribe = (event : Object, callback : Function) => {
    console.log("Event triggered. Now controller ...");
    const eventAgeMs = Date.now() - Date.parse(event.timestamp);
    if (eventAgeMs > eventMaxAgeMs) {
        console.error(`Dropping event ${JSON.stringify(event)} with age[ms]: ${eventAgeMs}`);
        callback();
        return;
    }
    return crawler(event, callback);
};