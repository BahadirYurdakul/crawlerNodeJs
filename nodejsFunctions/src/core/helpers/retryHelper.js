export function retryWrapper(maxRetries, fn: Promise) {
    console.log("Retry started. Max entries: " + maxRetries);
    return fn.catch(err => {
        if(maxRetries <= 0) {
            throw err;
        }
        return retryWrapper(maxRetries - 1, fn);
    });
}