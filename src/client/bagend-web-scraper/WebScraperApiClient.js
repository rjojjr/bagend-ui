import axios from "axios";
import ApiClient from "../ApiClient";

const WebScraperApiClient = ({host, port}) => {

    const DEFAULT_HOST = 'web_scraper';
    const DEFAULT_PORT = 8090;

    const client = axios.create({
        baseURL: `http://${host ? host : DEFAULT_HOST}:${port ? port : DEFAULT_PORT}/data/target/api/v1`
    });

    const apiClient = ApiClient({client});

    const getAvailableStockTickers = (callback, failureCallback = () => {}) => {
        apiClient.get('/tickers', callback, failureCallback);
    };

    return {
        getAvailableStockTickers
    };

};

export default WebScraperApiClient;
