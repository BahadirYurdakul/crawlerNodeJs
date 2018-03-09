//@flow

import {UrlHelper} from "./UrlHelper";
const linkscrape = require('linkscrape');
import {CustomUrlModel} from "../utils/CustomUrlModel";


export function scrapeLinks(customParentUrl : CustomUrlModel, rawHtml : string) : Promise<*> {
    return new Promise((resolve) => {
        linkscrape(customParentUrl.protocolHostPathname, rawHtml, function (links) {
            let sameDomainParsedUrlsMap = new Map();
            links.forEach(link => {
                try {
                    let childCustomUrl = UrlHelper.normalizeChildUrl(customParentUrl, link);
                    sameDomainParsedUrlsMap.set(childCustomUrl.hostPathname, childCustomUrl);
                } catch (err) {
                    console.error(`Child link not added at linkscrape. ChildLink: ${link.href}
                    , ParentLink: ${customParentUrl.hostPathname}, err: ${err}`);
                }
            });
            resolve(sameDomainParsedUrlsMap);
        });
    });
}

