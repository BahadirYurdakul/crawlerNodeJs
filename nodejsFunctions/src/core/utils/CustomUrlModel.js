//@flow

class CustomUrlModel {
    hostPathname : string;
    protocolHostPathname : string;
    parsedUrl : Object;

    constructor(parsedUrl : Object) {
        this.parsedUrl = parsedUrl;
        this.hostPathname = (parsedUrl.host + "/" + parsedUrl.pathname).replace(/\/\/+/g, "/");
        this.protocolHostPathname = parsedUrl.protocol + "//" + this.hostPathname;
    }
}

exports.CustomUrlModel = CustomUrlModel;