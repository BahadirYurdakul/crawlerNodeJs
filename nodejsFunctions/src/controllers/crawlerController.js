//@flow

import {parseJSON} from "../core/helpers/JsonHelper";
import {UrlHelper} from "../core/helpers/UrlHelper";
import {CustomUrlModel} from "../core/utils/CustomUrlModel";
import {crawlService} from "../services/CrawlService";
import {CustomErrorCodes} from "../core/utils/CustomErrorCodes";

export function crawler(event: Object, callback: Function) {
    const data = Buffer.from(event.data.data, 'base64').toString();
    let customUrl: CustomUrlModel;
    try {
        let parsedData = parseJSON(data);
        let url = checkUrlStringExist(parsedData['url']);
        const parentParsedUrl = UrlHelper.parseParentUrl(url);
        customUrl = new CustomUrlModel(parentParsedUrl);
        console.log("Custom url extracted. custom url: " + JSON.stringify(customUrl));
    } catch (err) {
        //Validation errors cannot be handled, so do not try again.
        console.error("Error while validation. Err: " + err);
        callback();
        return;
    }

    //Calling Services
    return crawlService(customUrl)
        .then(() => callback())
        .catch(err => {
            //console.error(`Callback with error: ${err}`);
            callback(`Callback with error: ${err}`);
        });
}

function checkUrlStringExist(url: string) {
    if (typeof url !== "string") {
        console.error(`Json url missing or wrong type! url: ${JSON.stringify(url)}`);
        throw new Error(`Json url missing or wrong type! url: ${JSON.stringify(url)}`);
    }
    return url;
}