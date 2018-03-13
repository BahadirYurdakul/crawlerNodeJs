//@flow

import * as URL from "url";
import ErrorWithCode from "../utils/ErrorWithCode";
import {ErrorCodes} from "../utils/ErrorCodes";
import {UrlModel} from "../utils/UrlModel";

class UrlHelper {
    static parseUrl(url: string): UrlModel {
        try {
            const parsedUrl = URL.parse(url, true);
            parsedUrl.host ? parsedUrl.host = parsedUrl.host.replace(/^www\./, "") : null;
            parsedUrl.pathname ? parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "") : null;
            return new UrlModel(parsedUrl);
        } catch (err) {
            console.error(`Error while parsing url, url: ${url}, err: ${err}`);
            throw new ErrorWithCode(`Error while parsing url, url: ${url}, err: ${err}`, ErrorCodes.parseUrlError);
        }
    }

    static isUrlValid(parsedUrl: UrlModel): boolean {
        return !parsedUrl || !parsedUrl.host || !parsedUrl.protocol;
    }

    static getSameDomainParseUrls(links: Set<string>, parentParsedUrl: UrlModel): Map<string, UrlModel> {
        const parsedLinks = new Map();
        links.forEach(childLink => {
            const childParsedUrl = this.parseUrl(childLink);
            if (childParsedUrl.hostPlusPath !== parentParsedUrl.hostPlusPath
                && isOnSameDomain(childParsedUrl.domain, parentParsedUrl.domain)) {
                parsedLinks.set(childParsedUrl.hostPlusPath, childParsedUrl);
            }
        });
        return parsedLinks;
    }
}

function isOnSameDomain(parentUrlDomain: string, childUrlDomain: string) {
    return parentUrlDomain === childUrlDomain;
}

exports.UrlHelper = UrlHelper;