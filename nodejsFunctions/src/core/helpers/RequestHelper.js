const request = require('request-promise-native');

class RequestHelper {
    static requestWebsite(url : string) : Promise<*> {
        return request({
            uri: url,
            json: true
        }).catch(err => {
            console.error(`Error while requesting webpage. Url: ${url}. Err: ${JSON.stringify(err)}`);
            throw new Error(`Error while requesting webpage. Url: ${url}. Err: ${JSON.stringify(err)}`);
        });
    }
}

exports.RequestHelper = RequestHelper;