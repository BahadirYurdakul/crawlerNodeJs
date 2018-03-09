//@flow

import * as URL from "url";
import CustomError from "../utils/CustomError";
import {CustomErrorCodes} from "../utils/CustomErrorCodes";
import {CustomUrlModel} from "../utils/CustomUrlModel";

class UrlHelper {
    static parseUrl(url : string) {
        try {
            let parsedUrl = URL.parse(url, true);
            parsedUrl.host ? parsedUrl.host = parsedUrl.host.replace(/^www\./, "") : null;
            parsedUrl.pathname ? parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "") : null;
            return parsedUrl;
        } catch (err) {
            console.error(`Error while parsing url, url: ${url}, err: ${err}`);
            throw new Error(`Error while parsing url, url: ${url}, err: ${err}`);
        }
    }

    static normalizeChildUrl(parentCustomUrl : CustomUrlModel, childLink : Object) {
        if (!childLink.href || childLink.href.startsWith('#')) {
            console.log(`Child link points the same page so not added. Link: ${childLink.href}`);
            throw new CustomError(`Child link points the same page so not added.`
                , CustomErrorCodes.childNormalizeError);
        }
        let childParsedUrl = UrlHelper.parseUrl(childLink.href);

        //IF url is not valid or parent pathname is equal to child pathname.
        if (!childParsedUrl) {
            console.error(`Child link can not be parsed so not added. Link: ${JSON.stringify(childLink.href)}`);
            throw new CustomError(`Child link can not be parsed so not added. Link: ${JSON.stringify(childLink.href)}`
                , CustomErrorCodes.childNormalizeError);
        }

        if(!childParsedUrl.protocol)
            childParsedUrl.protocol = parentCustomUrl.parsedUrl.protocol;

        if(!childParsedUrl.host)
            childParsedUrl.host = parentCustomUrl.parsedUrl.host;
        else {
            //IF the domain is different, then don't add.
            if(!isOnSameDomain(parentCustomUrl.parsedUrl.host, childParsedUrl.host))
                throw new CustomError(`Child link domain is different so not added.`
                    , CustomErrorCodes.childDomainDifferentError);
        }
        return new CustomUrlModel(childParsedUrl);
    }

    static parseParentUrl(requestedUrl : string) {
        const parentParsedUrl = UrlHelper.parseUrl(requestedUrl);
        if (!parentParsedUrl || !parentParsedUrl.host || !parentParsedUrl.protocol) {
            console.error(`Url missing information. url: ${requestedUrl}
                , parsed Url: ${JSON.stringify(parentParsedUrl)}`);
            throw new Error(`Url missing information. url: ${requestedUrl}
                , parsed Url: ${JSON.stringify(parentParsedUrl)}`);
        }
        return parentParsedUrl;
    }
}

function isOnSameDomain(parentUrlHost, childUrlHost) {
    return parentUrlHost === childUrlHost;
}

exports.UrlHelper = UrlHelper;