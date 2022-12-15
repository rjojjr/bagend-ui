const ApiClient = ({client}) => {
    const get = (url, callback, failureCallback = () => {}) => {
        client({
            url,
            method: "GET",
            headers: {
                // Add any auth token here
                // authorization: "your token comes here",
            }
        })
            .then((response) => callback(response))
            .catch(error => {
                console.log(error);
                failureCallback(error);
            });
    };

    const post = (url, data, callback, failureCallback = () => {}) => {
        client({
            url,
            method: "POST",
            headers: {},
            data: data,
        })
            .then((response) => callback(response))
            .catch(error => {
                console.log(error);
                failureCallback(error);
            });
    };

    return {
        get,
        post
    };
};

export default ApiClient;
