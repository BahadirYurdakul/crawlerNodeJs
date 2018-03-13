//@flow

import {parseJSON} from "../core/helpers/JsonHelper";
import {UrlHelper} from "../core/helpers/UrlHelper";
import {crawlService} from "../services/CrawlService";
import {ErrorCodes} from "../core/utils/ErrorCodes";
import ErrorWithCode from "../core/utils/ErrorWithCode";

export function crawler(event: Object, callback: Function) {
    try {
        if (!event.data) {
            console.error(`Request body cannot be null`);
            callback();
            return;
        }
        const data = Buffer.from(event.data.data, 'base64').toString();
        const parsedData = parseJSON(data);
        const url = checkUrlStringExist(parsedData['url']);
        const parentParsedUrl = UrlHelper.parseUrl(url);
        if (UrlHelper.isUrlValid(parentParsedUrl)) {
            throw new ErrorWithCode(`Parent url is not valid to request. 
                Parent link: ${parentParsedUrl.protocolPlusHostPlusPath}`, ErrorCodes.parentUrlNotValid);
        }
        console.log(`Parsing url success. Parsed url: ${JSON.stringify(parentParsedUrl)}`);
        //Call Service Layer
        return crawlService(parentParsedUrl)
            .then(() => callback())
            .catch(err => callback(`Error in url: ${JSON.stringify(parentParsedUrl.protocolPlusHostPlusPath)} 
                . Err: ${err}`));
    } catch (err) {
        //Validation errors cannot be handled, so do not try again.
        console.error(`Error while validation. Err: ${JSON.stringify(err)}`);
        callback();
    }
}

function checkUrlStringExist(url: string) {
    if (typeof url !== "string") {
        console.error(`Json url missing or wrong type! url: ${JSON.stringify(url)}`);
        throw new Error(`Json url missing or wrong type! url: ${JSON.stringify(url)}`);
    }
    return url;
}