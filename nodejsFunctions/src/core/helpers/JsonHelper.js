export function parseJSON(data){
    try {
        return JSON.parse(data);
    } catch (err) {
        console.error(`ERROR occurred while parsing JSON. data: ${data}, err: ${err}`);
        throw Error(`ERROR occurred while parsing JSON. data: ${data}, err: ${err}`);
    }
}