import React, {useEffect, useState} from "react";
import WebScraperApiClient from "../client/bagend-web-scraper/WebScraperApiClient";
import {getToday} from "../util/DateUtils";
import MlApiClient from "../client/bagend-ml/MlApiClient";

const OpenClosePage = () => {

    const mlClient = MlApiClient({host: '192.168.1.139', port: 8092});
    const scrapperClient = WebScraperApiClient({host: '192.168.1.139', port: 8090});

    const [stockTickers, setStockTickers] = useState(() => []);
    const [selectedTicker, setSelectedTicker] = useState(() => '');
    const [startDate, setStartDate] = useState(() => getToday());
    const [endDate, setEndDate] = useState(() => getToday());

    const [collectiveMlModels, setCollectiveMlModels] = useState(() => []);
    const [selectedModel, setSelectedModel] = useState(() => '');

    const reloadCollectiveModels = () => {
        const callback = (response) => setCollectiveMlModels(response.data.results);
        mlClient.getCollectiveModels(callback);
    };

    useEffect(reloadCollectiveModels, []);

    useEffect(() => {
        const callback = axiosResponse => setStockTickers(axiosResponse.data);
        scrapperClient.getAvailableStockTickers(callback);
    }, []);

    const createModel = (modelName, stockTicker) => {
        const createCallback = (response) => {
            if(response.status === 201){
                alert(`Model ${modelName} created for stock ticker ${stockTicker}`);
                setSelectedModel(modelName);
                reloadCollectiveModels();
                return;
            }
            alert(`Error creating model ${modelName} for stock ticker ${stockTicker}`);
        };

        const failureCallback = error => alert(`Error ${error} creating model ${modelName} for stock ticker ${stockTicker}`);

        mlClient.createNewCollectiveModel(modelName, stockTicker, createCallback, failureCallback);
    };

    return (
        <>
            <h2>Open/Close Stock Data</h2>
            <CreateModelForm onSubmit={createModel} tickers={stockTickers}/>
            <ViewTickers stockTickers={stockTickers} setSelectedTicker={setSelectedTicker}/>
            <ViewModels models={collectiveMlModels}/>
        </>
    );
};

export default OpenClosePage;

const ViewTickers = ({stockTickers, setSelectedTicker}) => {

    const [show, setShow] = useState(() => false);

    const toggle = () => {
        setShow(!show);
    };

    const ShowTickers = ({stockTickers, show}) => {
        return (
            show && (
                <table>
                    <tbody>
                    <tr>
                        <th>
                            Available Stock Tickers
                        </th>
                    </tr>
                    {stockTickers.map((ticker, index) => {
                        return <tr key={index}>
                            <td>{ticker}</td>
                            <button onClick={(e) => setSelectedTicker(ticker)}>SELECT</button>
                        </tr>
                    })}
                    </tbody>
                </table>
            ));
    };

    return (
        <div>
            <h3 onClick={toggle}><b>Available Tickers</b></h3>
            <ShowTickers stockTickers={stockTickers} show={show}/>
        </div>
    );
};

const ViewModels = ({models}) => {

    const [show, setShow] = useState(() => false);

    const toggle = () => {
        setShow(!show);
    };

    const ShowModels = ({models, show}) => {
        return (
            show && (
                <table>
                    <tbody>
                    <tr>
                        <th>
                            Ticker
                        </th>
                        <th>
                            Model Name
                        </th>
                    </tr>
                    {models.map((meta, index) => {
                        return <tr key={`available-models-${index}`}>
                            <td>{meta.stockTicker}</td>
                            <td>{meta.collectiveModelName}</td>
                        </tr>
                    })}
                    </tbody>
                </table>
            ));
    };

    return (
        <div>
            <h3 onClick={toggle}><b>Available Collective Models</b></h3>
            <ShowModels models={models} show={show}/>
        </div>
    );
};

const CreateModelForm = ({onSubmit, tickers}) => {

    const [modelName, setModelName] = useState(() => '');
    const [ticker, setTicker] = useState(tickers[0]);

    const [show, setShow] = useState(() => false);

    const toggle = () => {
        setShow(!show);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(modelName, ticker ? ticker : tickers[0]);
    };

    return (
        <>
            <h3 onClick={toggle}><b>Create New Collective Model</b></h3>
            {show && (
                <form onSubmit={handleSubmit}>
                    <label>
                        Model Name:
                        <input type="text" value={modelName} onChange={event => {
                            event.preventDefault();
                            setModelName(event.target.value)
                        }} />
                    </label>

                    <label>
                        Stock Ticker:
                        <select value={ticker} defaultValue={tickers[0]} onChange={(event) => {
                            event.preventDefault();
                            setTicker(event.target.value)
                        }}>
                            {tickers.map((symbol, index) => {
                                return(<option key={`create-model-ticker-${index}`} value={symbol}>{symbol}</option>);
                            })}
                        </select>
                    </label>
                    <input type="submit" value="Submit" />
                </form>
            )}
        </>
    );
};
