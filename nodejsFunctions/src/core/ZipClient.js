//@flow

//import {JSZip} from "jszip";
const JSZip = require("jszip");
import * as fs from "fs";

const zipOptions = {
    type: "nodebuffer",
    streamFiles: true,
    compression: "DEFLATE",
    compressionOptions: {
        level: 3
    }
};

class ZipClient {
    zip: Object;

    constructor() {
        this.zip = new JSZip();
    }

    deleteLocalFile(encodedPath: string) {
        let tempFilePath = "/tmp/" + encodedPath;
        return fs.unlink(tempFilePath, function (err) {
            if (err) {
                if (err.errno === -2) {
                    console.log(`No file found to delete at path: ${tempFilePath}. Continue...`);
                } else {
                    console.error(`failed to delete local file: path: ${tempFilePath}, err: ${JSON.stringify(err)}`);
                }
            } else {
                console.log(`successfully deleted local file at path: ${tempFilePath}`);
            }
        });
    }

    zipFile(encodedPath: string, content: string) {
        this.zip.file(encodedPath + ".txt", content);
        return this.zip.generateAsync(zipOptions)
            .catch(err => {
                console.error(`Error while zipping the file: path: ${encodedPath}, content: ${JSON.stringify(content)}
                    , err: ${err}`);
                throw new Error(`Error while zipping the file: path: ${encodedPath}, content: ${JSON.stringify(content)}
                    , err: ${err}`);
            });
    }

    writeFileToLocalStorage(encodedPath: string, content: Object) : Promise<*> {
        let tempFilePath = "/tmp/" + encodedPath;
        return new Promise((resolve,reject) => {
            let file = fs.createWriteStream(tempFilePath);
            file.on('error', err => {
                console.error(`Error while write zip to local storage: path: ${tempFilePath}
                    , content: ${JSON.stringify(content)}, err: ${JSON.stringify(err)}`);
                reject(`Error while write zip to local storage: path: ${tempFilePath}
                    , err: ${JSON.stringify(err)}, content: ${JSON.stringify(content)}`);
            });
            file.on('open', () => {
                file.write(content);
                file.end();
                console.log(`File written to local storage at path: ${tempFilePath}, content: ${JSON.stringify(content)}`);
                resolve();
            });
        });
    }
}

exports.ZipClient = new ZipClient();