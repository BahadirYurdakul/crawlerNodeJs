//@flow

//import {Storage} from "@google-cloud/storage";
const Storage = require('@google-cloud/storage');

class CloudStorageClient {
    storage : Object;

    constructor() {
        this.storage = new Storage();
    }

    uploadData(path : string, bucketName : string) {
        let fullPath = "/tmp/" + path;
        return this.storage
            .bucket(bucketName)
            .upload(fullPath)
            .then(() => console.log(`${fullPath} uploaded to ${bucketName}.`))
            .catch(err => {
                console.error(`ERROR while store zip to cloud storage: path: ${fullPath}
                    , bucketName: ${bucketName}, err: ${err}`);
                throw new Error(`ERROR while store zip to cloud storage: path: ${fullPath}
                    , bucketName: ${bucketName}, err: ${err}`);
            });
    }
}

exports.CloudStorageClient = new CloudStorageClient();