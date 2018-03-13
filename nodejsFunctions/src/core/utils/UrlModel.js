//@flow

class UrlModel {
    protocol: string;
    domain: string;
    host: string;
    hostPlusPath: string;
    protocolPlusHostPlusPath: string;

    constructor(parsedUrl: Object) {
        this.protocol = parsedUrl.protocol;
        this.host =  parsedUrl.host ?  parsedUrl.host.replace(/\/+$/, "/") : "";
        this.domain = getDomainFromHost(this.host);
        const pathWithoutSlashes = parsedUrl.path ? (parsedUrl.path).replace(/\/+$/, ""): "";
        this.hostPlusPath = parsedUrl.host + pathWithoutSlashes;
        this.protocolPlusHostPlusPath = parsedUrl.protocol + "//" + this.hostPlusPath;
    }
}

function getDomainFromHost(host: string){
    const splittedHost = host.split(".");
    return splittedHost.splice(splittedHost.length - 2)
        .reduce((acc, current) => acc + "." + current);
}

exports.UrlModel = UrlModel;