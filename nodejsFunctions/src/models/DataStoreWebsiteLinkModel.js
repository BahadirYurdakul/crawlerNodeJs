//@flow

export default class DataStoreWebsiteLinkModel {
    key : string;
    data: {
        protocol: string,
        domain: string,
        status: string
    };

    constructor(key : string, childParsedUrl : Object, childHostPathname : string, status: string) {
        this.key = key;
        this.data = {
            protocol: childParsedUrl.protocol,
            domain: childParsedUrl.host,
            status: status
        };
    }
}