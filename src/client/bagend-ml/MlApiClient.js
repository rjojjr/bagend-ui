import axios from "axios";
import ApiClient from "../ApiClient";

const MlApiClient = ({host, port}) => {

    const DEFAULT_HOST = 'bagend-ml';
    const DEFAULT_PORT = 8092;

    const client = axios.create({
        baseURL: `http://${host ? host : DEFAULT_HOST}:${port ? port : DEFAULT_PORT}/open/close/models/v1`
    });

    const apiClient = ApiClient({client});

    const getCollectivePredictions = (modelName, startDate, endDate, callback, failureCallback = () => {}) => {
        apiClient.get(
            `/collective/prediction?modelName=${modelName}&startDate=${startDate}&endDate=${endDate}`,
            callback,
            failureCallback
        );
    };

    const getCollectiveModels = (callback, failureCallback = () => {}) => {
        apiClient.get('/collective/meta', callback, failureCallback);
    };

    const createNewCollectiveModel = (name, stockTicker, callback, failureCallback = () => {}) => {
        apiClient.post('/collective/deep', {
            name,
            stockTicker
        }, callback,
            failureCallback);
    };

    return {
        getCollectivePredictions,
        getCollectiveModels,
        createNewCollectiveModel
    };
};

export default MlApiClient;
