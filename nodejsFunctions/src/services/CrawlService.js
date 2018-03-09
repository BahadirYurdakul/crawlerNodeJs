//@flow

import {CloudStorageClient} from "../core/gcloud/CloudStorageClient";
import {DataStoreClient} from "../core/gcloud/DataStoreClient";
import {RequestHelper} from "../core/helpers/RequestHelper";
import {CustomUrlModel} from "../core/utils/CustomUrlModel";
import {scrapeLinks} from "../core/helpers/ScrapeLinksHelper";
const config = require("../config");
import {ZipClient} from "../core/ZipClient";
import {LinkStatusKeys} from "../core/utils/LinkStatusKeys";
import CustomError from "../core/utils/CustomError";
import {CustomErrorCodes} from "../core/utils/CustomErrorCodes";
import {PubSubClient} from "../core/gcloud/PubSubClient";
import DataStoreWebsiteLinkModel from "../models/DataStoreWebsiteLinkModel";

export function crawlService(customParentUrl : CustomUrlModel) : Promise<*> {
    let rawHtml = "";
    let sameDomainChildUrlsMap;
    let dataStoreFormattedParent: DataStoreWebsiteLinkModel;
    let encodedParentUrl = encodeURIComponent(customParentUrl.protocolHostPathname);
    return DataStoreClient.searchCrawled(config.datastoreKind, customParentUrl.hostPathname)
        .then(status => decideWhetherCrawl(status, customParentUrl.hostPathname))
        .then(() => formatSingleObjectDataStoreEntity(customParentUrl, LinkStatusKeys.inProgress))
        .then(parent => dataStoreFormattedParent = parent)
        .then(() => DataStoreClient.updateData(dataStoreFormattedParent))
        .then(() => RequestHelper.requestWebsite(customParentUrl.protocolHostPathname))
        .then(html => rawHtml = html)
        .then(() =>  ZipClient.zipFile(encodedParentUrl, rawHtml))
        .then(zipFile => ZipClient.writeFileToLocalStorage(encodedParentUrl, zipFile))
        .then(() => CloudStorageClient.uploadData(encodedParentUrl, config.storageBucketName))
        .then(() => scrapeLinks(customParentUrl, rawHtml))
        .then(map => sameDomainChildUrlsMap = map)
        .then(() => formatMultipleDataStoreEntities(sameDomainChildUrlsMap, customParentUrl.hostPathname
            , LinkStatusKeys.notCrawled))
        .then(entities => DataStoreClient.insertData(entities))
        .then(() => sendToPubSub(sameDomainChildUrlsMap))
        .then(() => dataStoreFormattedParent.data.status = LinkStatusKeys.done)
        .then(() => DataStoreClient.updateData(dataStoreFormattedParent))
        .catch(err => handleError(err))
        .then(() => ZipClient.deleteLocalFile(encodedParentUrl));
}

function formatMultipleDataStoreEntities(map: Map<string,CustomUrlModel>, parentHostPathname, status: string) {
    console.log("Success. " + map.size + " links found.");
    return DataStoreClient.formatMapToDataStoreModel(config.datastoreKind, map
        , parentHostPathname, status);
}

function formatSingleObjectDataStoreEntity(customParentUrl: CustomUrlModel, status: string) {
    return DataStoreClient.formatSingleObjectToDataStoreModel(config.datastoreKind, customParentUrl
        , customParentUrl.hostPathname, status);
}

function sendToPubSub(map: Map<string,CustomUrlModel>){
    let actions = [];
    return new Promise((resolve, reject) => {
        map.forEach((parsedUrl: CustomUrlModel) => {
            actions.push(PubSubClient.publishToPubSub(parsedUrl.protocolHostPathname
                , config.pubsubTopicName,config.pubSubBatchingOptions));
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

function decideWhetherCrawl(status: string, link: string) {
    if (!status) {
        console.error(`Data Store status can not be empty. Link: ${link}`);
        throw new Error(`Data Store status can not be empty. Link: ${link}`);
    } else if (status === LinkStatusKeys.done) {
        console.log(`Link has been already crawled. Link: ${link}`);
        throw new CustomError(`Link has been already crawled. Link: ${link}`, CustomErrorCodes.alreadyCrawledError);
    } else if (status === LinkStatusKeys.inProgress) {
        console.log(`Link is in progress. Link: ${link}`);
        throw new CustomError(`Link is in progress. Link: ${link}. Try again later.`, CustomErrorCodes.isInProgressError);
    } else {
        return true;
    }
}

function handleError(err) {
    if (err['code'] === CustomErrorCodes.alreadyCrawledError) {
        console.log("Url is already crawled");
    } else if (err['code'] === CustomErrorCodes.childDomainDifferentError) {
        console.log("The child link has different domain address.");
    } else {
        console.log(err);
        throw err;
    }
}