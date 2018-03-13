//@flow

import {UrlModel} from "../core/utils/UrlModel";

export default class DataStoreWebsiteLinkModel {
    key: string;
    data: {
        protocol: string,
        domain: string,
        status: string
    };

    constructor(key: string, childParsedUrl: UrlModel, status: string) {
        this.key = key;
        this.data = {
            protocol: childParsedUrl.protocol,
            domain: childParsedUrl.domain,
            status: status
        };
    }
}