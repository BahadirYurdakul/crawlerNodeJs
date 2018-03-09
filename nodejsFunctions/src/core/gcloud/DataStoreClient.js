//@flow

import Datastore from "@google-cloud/datastore";
import {CustomErrorCodes} from "../utils/CustomErrorCodes";
import {CustomUrlModel} from "../utils/CustomUrlModel";
import DataStoreWebsiteLinkModel from "../../models/DataStoreWebsiteLinkModel";
import {LinkStatusKeys} from "../utils/LinkStatusKeys";

class DataStoreClient {
    datastore: Object;

    constructor() {
        this.datastore = new Datastore();
    }

    searchCrawled(kind: string, link: string) {
        const key = this.datastore.key([kind, link]);
        let query = this.datastore
            .createQuery(kind)
            .filter('__key__', '=', key)
            .limit(1);

        return this.datastore.runQuery(query).then(results => {
            if (!results || results[0].length < 1 )
                return LinkStatusKeys.notFound;
            return results[0][0]['status'];
        }).catch(err => {
            console.error(`Error while query Data Store: kind: ${kind}, error: ${JSON.stringify(err)}`);
            throw new Error(`Error while query Data Store: kind: ${kind}, error: ${JSON.stringify(err)}`);
        });
    };

    insertData(entities: Array<DataStoreWebsiteLinkModel>) {
        return this.datastore
            .insert(entities)
            .then(() => console.log(`Saved entities: ${JSON.stringify(entities)}`))
            .catch(err => {
                if (err['code'] === CustomErrorCodes.entityAlreadyExistsErrorCode) {
                    console.log("Entity already exist so it is not inserted again");
                } else {
                    console.error(`ERROR while insert entities to Data Store: 
                    error: ${JSON.stringify(err)}. Now rollback...
                    , entities: ${JSON.stringify(entities)}`);
                    throw new Error(`ERROR while insert entities to Data Store: entities: ${JSON.stringify(entities)}, 
                        error: ${JSON.stringify(err)}`);
                }
            });
    }

    formatMapToDataStoreModel(kind: string, parsedUrlsMaps: Map<string,CustomUrlModel>, parentHostPathname: string
                              , status: string) {
        let entities = [];
        parsedUrlsMaps.forEach((childParsedCustomUrl: CustomUrlModel) => {
            let child = this.formatSingleObjectToDataStoreModel(kind, childParsedCustomUrl, parentHostPathname, status);
            entities.push(child);
        });
        return entities;
    }

    formatSingleObjectToDataStoreModel(kind: string, CustomUrl: CustomUrlModel, parentHostPathname: string
                                       , status: string) {
        const key = this.datastore.key([kind, CustomUrl.hostPathname]);
        return new DataStoreWebsiteLinkModel(key, CustomUrl.parsedUrl
            , CustomUrl.hostPathname, status);
    }

    updateData(entity: DataStoreWebsiteLinkModel) {
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