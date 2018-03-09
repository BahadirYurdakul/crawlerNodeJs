//@flow

const PubSub = require('@google-cloud/pubsub');

class PubSubClient {
    pubSub : Object;

    constructor() {
        this.pubSub = new PubSub();
    }

    publishToPubSub(link: string, topicName: string, batchingOptions: Object) {
        const data = {url: link};
        const dataBuffer = Buffer.from(JSON.stringify(data));
        return this.pubSub
            .topic(topicName)
            .publisher({batching: batchingOptions})
            .publish(dataBuffer)
            .then(results => console.log(`Link: ${link} published. Result: ${JSON.stringify(results)}`))
            .catch(err => {
                    console.error(`ERROR while publish message: topicName: ${topicName}
                        , data: ${JSON.stringify(data)}, err: ${JSON.stringify(err)}`);
                    throw new Error(`ERROR while publish message: topicName: ${topicName}
                        , data: ${JSON.stringify(data)}, err: ${JSON.stringify(err)}`);
                }
            );
    }
}

exports.PubSubClient = new PubSubClient();