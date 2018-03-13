//@flow

import {CloudStorageClient} from "../core/gcloud/CloudStorageClient";
import {DataStoreClient} from "../core/gcloud/DataStoreClient";
import {RequestHelper} from "../core/helpers/RequestHelper";
import {UrlModel} from "../core/utils/UrlModel";
import {scrapeLinks} from "../core/helpers/ScrapeLinksHelper";

const config = require("../config");
import {ZipClient} from "../core/ZipClient";
import {LinkStatusKeys} from "../core/utils/LinkStatusKeys";
import ErrorWithCode from "../core/utils/ErrorWithCode";
import {ErrorCodes} from "../core/utils/ErrorCodes";
import {PubSubClient} from "../core/gcloud/PubSubClient";
import DataStoreWebsiteLinkModel from "../models/DataStoreWebsiteLinkModel";
import {UrlHelper} from "../core/helpers/UrlHelper";

export function crawlService(parsedParentUrl: UrlModel): Promise<*> {

    const parentDataStoreObject = DataStoreClient.parsedUrlToDataStoreModel(config.datastoreKind
        , parsedParentUrl, LinkStatusKeys.inProgress);

    return getStatus(parsedParentUrl.hostPlusPath)
        .then(status => lockOrSkipParent(status, parentDataStoreObject))
        .then(() => RequestHelper.requestWebsite(parsedParentUrl.protocolPlusHostPlusPath))
        .then(rawHtml => zipFileAndUploadToCloudStorage(parsedParentUrl.protocolPlusHostPlusPath, rawHtml))
        .then(rawHtml => storeChildsToDataStoreAndPublish(rawHtml, parsedParentUrl))
        .then(() => {
            return unlockParentToFinishTransaction(parentDataStoreObject, LinkStatusKeys.done);
        })
        .catch(err => {
            if (err.code === ErrorCodes.alreadyCrawledError) {
                console.log(`Url: ${parsedParentUrl.protocolPlusHostPlusPath}.Url is already crawled ${err.message}`);
            } else if (err.code === ErrorCodes.isInProgressError) {
                console.error(`Url: ${parsedParentUrl.protocolPlusHostPlusPath}
                    . Url is already in progress: ${err.message}`);
                throw new ErrorWithCode(`Url is already in progress so try again. Err: ${err.message}`
                    , ErrorCodes.isInProgressError);
            } else {
                console.error(`Url: ${parsedParentUrl.protocolPlusHostPlusPath}. Cannot handle error: ${err.message}`);
                return unlockParentToFinishTransaction(parentDataStoreObject, LinkStatusKeys.notCrawled)
                    .then(() => {
                        throw new ErrorWithCode(`Cannot handle error: ${err.message}`, ErrorCodes.serviceLayerError);
                    });
            }
        });
}

//carry to repo
function getStatus(link: string) {
    return DataStoreClient.getStatus(config.datastoreKind, link);
}

function lockOrSkipParent(status: string, parentDataStoreObject: DataStoreWebsiteLinkModel) {
    return new Promise(resolve => {
        if (status === LinkStatusKeys.done) {
            throw new ErrorWithCode(`Url is already crawled. Link: ${JSON.stringify(parentDataStoreObject.key)}`
                , ErrorCodes.alreadyCrawledError);
        } else if (status === LinkStatusKeys.inProgress) {
            throw new ErrorWithCode(`The link is in progress so try again. 
                Link: ${JSON.stringify(parentDataStoreObject.key)}`, ErrorCodes.isInProgressError);
        } else if (status === LinkStatusKeys.notCrawled) {
            lockParentOptimisticTransaction(parentDataStoreObject)
                .then(() => resolve());
        } else {
            DataStoreClient.upsertData(parentDataStoreObject)
                .then(() => resolve());
        }
    });
}

//carry to repo
function storeChildsToDataStoreAndPublish(rawHtml: string, parsedParentUrl: UrlModel): Promise<any> {
    return scrapeLinks(parsedParentUrl.protocolPlusHostPlusPath, rawHtml)
        .then((childSet: Set<string>) => {
            const parsedChildLinks = UrlHelper.getSameDomainParseUrls(childSet, parsedParentUrl);
            const childDataStoreEntities = convertUrlArrayToDataStoreEntities(parsedChildLinks);
            return DataStoreClient.insertData(childDataStoreEntities)
                .then(() => parsedChildLinks);
        }).then((parsedChildLinks: Array<UrlModel>) => {
            return sendLinksToPubSub(parsedChildLinks);
        });
}

//carry to repo
function convertUrlArrayToDataStoreEntities(parsedLinks: Map<string, UrlModel>): Array<Object> {
    const parsedUrlArray = [];
    parsedLinks.forEach(parsedUrl => {
        const dataStoreObject = DataStoreClient.parsedUrlToDataStoreModel(config.datastoreKind
            , parsedUrl, LinkStatusKeys.notCrawled);
        parsedUrlArray.push(dataStoreObject);
    });
    return parsedUrlArray;
}

//carry to repo
function lockParentOptimisticTransaction(parentObject: DataStoreWebsiteLinkModel): Promise<any> {
    const dataStoreObject = Object.assign({}, parentObject);
    dataStoreObject.data.status = LinkStatusKeys.inProgress;
    return DataStoreClient.upsertData(dataStoreObject);
}

//carry to repo
function unlockParentToFinishTransaction(parentObject: DataStoreWebsiteLinkModel, status: string): Promise<any> {
    const dataStoreObject = Object.assign({}, parentObject);
    dataStoreObject.data.status = status;
    return DataStoreClient.upsertData(dataStoreObject)
        .catch(err => {
            //It should not try again.
            console.error(`URL: ${JSON.stringify(parentObject.key)}. Cannot unlock parent.Err: ${JSON.stringify(err)}`);
        })
}

function zipFileAndUploadToCloudStorage(url: string, rawHtml: string): Promise<string> {
    const filePath = encodeURIComponent(url);
    return ZipClient.zipFile(filePath, rawHtml)
        .then(zipFile => ZipClient.writeFileToLocalStorage(filePath, zipFile))
        .then(() => CloudStorageClient.uploadData(filePath, config.storageBucketName))
        .then(() => ZipClient.deleteLocalFile(filePath))
        .then(() => rawHtml)
        .catch(err => {
            const errMessage = `Error while upload data to cloud storage. Path ${filePath}. Err: ${err}`;
            console.error(errMessage);
            throw new ErrorWithCode(errMessage, ErrorCodes.uploadToCloudStorageError);
        });
}

//carry to repo
function sendLinksToPubSub(parsedLinks: Array<UrlModel>) {
    let actions = [];
    return new Promise((resolve, reject) => {
        parsedLinks.forEach((parsedUrl: UrlModel) => {
            actions.push(PubSubClient.publishToPubSub(parsedUrl.protocolPlusHostPlusPath
                , config.pubsubTopicName, config.pubSubBatchingOptions));
        });
        Promise.all(actions)
            .then(() => console.log("all publishes finished."))
            .then(() => resolve())
            .catch(err => {
                console.error("Error occurred while publishing the links. Err: " + err);
                reject("Error occurred while publishing the links. Err: " + err);
            });
    });
}