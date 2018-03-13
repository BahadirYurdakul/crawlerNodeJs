//@flow

import Datastore from "@google-cloud/datastore";
import {ErrorCodes} from "../utils/ErrorCodes";
import {UrlModel} from "../utils/UrlModel";
import DataStoreWebsiteLinkModel from "../../models/DataStoreWebsiteLinkModel";
import {LinkStatusKeys} from "../utils/LinkStatusKeys";

class DataStoreClient {
    datastore: Object;

    constructor() {
        this.datastore = new Datastore();
    }

    getStatus(kind: string, link: string) {
        const key = this.constructDataStoreKey(kind, link);
        let query = this.datastore
            .createQuery(kind)
            .filter('__key__', '=', key)
            .limit(1);

        return this.datastore.runQuery(query).then(results => {
            if (!results || results[0].length < 1)
                return LinkStatusKeys.notFound;
            return results[0][0]['status'];
        }).catch(err => {
            console.error(`Error while query Data Store: kind: ${kind}, error: ${JSON.stringify(err)}`);
            throw new Error(`Error while query Data Store: kind: ${kind}, error: ${JSON.stringify(err)}`);
        });
    };

    constructDataStoreKey(kind: string, name: string) {
        return this.datastore.key([kind, name]);
    }

    insertData(entities: Array<Object> | Object) {
        return this.datastore
            .insert(entities)
            .then(() => console.log(`Saved entities: ${JSON.stringify(entities)}`))
            .catch(err => {
                if (err['code'] === ErrorCodes.entityAlreadyExistsErrorCode) {
                    console.log("Entity already exist so it is not inserted again");
                } else {
                    console.error(`ERROR while insert entities to Data Store: 
                    error: ${JSON.stringify(err)}. Now rollback...
                        , entities: ${JSON.stringify(entities)}`);
                    throw new Error(`ERROR while insert entities to Data Store: error: ${JSON.stringify(err)}
                        , entities: ${JSON.stringify(entities)}`);
                }
            });
    }

    parsedUrlToDataStoreModel(kind: string, parsedUrl: UrlModel, status: string): DataStoreWebsiteLinkModel {
        const key = this.datastore.key([kind, parsedUrl.hostPlusPath]);
        return new DataStoreWebsiteLinkModel(key, parsedUrl, status);
    }

    upsertData(entity: Object) {
        return this.datastore
            .upsert(entity)
            .then(() => console.log(`Saved entity. Link: ${JSON.stringify(entity.key)}, status: ${entity.data.status}.`))
            .catch(err => {
                console.error(`ERROR while update entity in Data Store: link: ${JSON.stringify(entity.key)}
                , status: ${entity.data.status}, entity ${JSON.stringify(entity)}, error ${JSON.stringify(err)}`);
                throw new Error(`ERROR while update entity in Data Store: entity ${JSON.stringify(entity)}, 
                    error ${JSON.stringify(err)}`);
            });
    };
}

exports.DataStoreClient = new DataStoreClient();