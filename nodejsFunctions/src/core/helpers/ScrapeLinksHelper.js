//@flow

import {UrlHelper} from "./UrlHelper";
const linkscrape = require('linkscrape');


export function scrapeLinks(parentUrl: string, rawHtml : string) : Promise<*> {
    return new Promise((resolve) => {
        linkscrape(parentUrl, rawHtml, function (links) {
            console.log("Now linkscrape parentUrl is " + parentUrl);
            const childUrlSet = new Set();
            links.forEach(scrapedLink => {
                if (scrapedLink.link && UrlHelper.isUrlValid(scrapedLink.link)) {
                    childUrlSet.add(scrapedLink.link);
                } else {
                    console.log(`Child link not added at linkscrape. ChildLink: ${scrapedLink.href}.`);
                }
            });
            resolve(childUrlSet);
        });
    });
}

