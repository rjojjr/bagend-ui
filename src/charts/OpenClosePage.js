import React, {useEffect, useMemo, useState} from "react";
import WebScraperApiClient from "../client/bagend-web-scraper/WebScraperApiClient";
import {getToday} from "../util/DateUtils";
import MlApiClient from "../client/bagend-ml/MlApiClient";
import useToggle from "../hooks/useToggle";

const IS_LOCAL = true;

const OpenClosePage = () => {

    const mlClient = MlApiClient({host: IS_LOCAL ? 'localhost' : 'bagend_ml', port: 8092});
    const scrapperClient = WebScraperApiClient({host: IS_LOCAL ? 'localhost' : 'web_scraper', port: 8090});

    const [stockTickers, setStockTickers] = useState(() => []);
    const [tickerTargets, setTickerTargets] = useState(() => []);
    const [selectedTicker, setSelectedTicker] = useState(() => '');

    const [collectiveMlModels, setCollectiveMlModels] = useState(() => []);
    const [selectedModel, setSelectedModel] = useState(() => '');

    const reloadCollectiveModels = () => {
        const callback = (response) => setCollectiveMlModels(response.data.results);
        mlClient.getCollectiveModels(callback);
    };

    const reloadTickerTargets = () => {
        const callback = (response) => setTickerTargets(response.data.results);
        const failureCallback = (error) => alert(error);
       scrapperClient.getTickerTargets(callback, failureCallback);
    }

    useEffect(reloadCollectiveModels, []);

    useEffect(reloadTickerTargets, []);

    useEffect(() => {
        const callback = axiosResponse => setStockTickers(axiosResponse.data);
        scrapperClient.getAvailableStockTickers(callback);
    }, []);

    const createModel = (modelName, stockTicker) => {
        const createCallback = (response) => {
            if(response.status === 201){
                reloadCollectiveModels();
                alert(`Model ${modelName} created for stock ticker ${stockTicker}`);
                setSelectedModel(modelName);
                return;
            }
            alert(`Error creating model ${modelName} for stock ticker ${stockTicker}`);
        };

        const failureCallback = error => alert(`Error ${error} creating model ${modelName} for stock ticker ${stockTicker}`);

        mlClient.createNewCollectiveModel(modelName, stockTicker, createCallback, failureCallback);
    };

    const createTickerTarget = (priority, tickerSymbol, businessSector, companyName) => {
        const createCallback = (response) => {
            if(response.status === 201){
                reloadTickerTargets();
                alert(`Ticker ${tickerSymbol} created`);
                return;
            }
            alert(`Error creating stock ticker ${tickerSymbol}`);
        };

        const failureCallback = error => alert(`Error ${error} creating stock ticker ${tickerSymbol}`);

        scrapperClient.createTickerTarget(priority, tickerSymbol, businessSector, companyName, createCallback, failureCallback);
    };

    return (
        <div className={'App-center-container'}>
            <h2 className={'Flex Margin-10'}>Open/Close Stock Data</h2>
            <CreateModelForm onSubmit={createModel} tickers={stockTickers}/>
            <ViewTickers tickerTargets={tickerTargets} setSelectedTicker={setSelectedTicker}/>
            <ViewModels models={collectiveMlModels} setModel={setSelectedModel}/>
            <CreateTicker onSubmit={createTickerTarget}/>
            <ForecastViewer selectedModel={selectedModel} mlClient={mlClient}/>
        </div>
    );
};

export default OpenClosePage;

const ViewTickers = ({tickerTargets, setSelectedTicker}) => {

    const [show, setShow] = useState(() => false);

    const toggle = () => {
        setShow(!show);
    };

    const ShowTickers = ({stockTickers, show}) => {
        return (
            <div className={'App-center-container'}>
                {show && (
                    <table className={'Flex Margin-10'}>
                        <tbody>
                        <tr className={'Margin-10'}>
                            <th className={'Margin-10'}>
                                Ticker Symbol
                            </th>
                            <th className={'Margin-10'}>
                                Company Name
                            </th>
                            <th className={'Margin-10'}>
                                Business Sector
                            </th>
                            <th className={'Margin-10'}>
                                Priority
                            </th>
                            <th className={'Margin-10'}>
                            </th>
                        </tr>
                        {tickerTargets.map((ticker, index) => {
                            return <tr key={index} className={'Margin-10'}>
                                <td className={'Margin-10'}>{ticker.tickerSymbol}</td>
                                <td className={'Margin-10'}>{ticker.companyName}</td>
                                <td className={'Margin-10'}>{ticker.businessSector}</td>
                                <td className={'Margin-10'}>{ticker.priority}</td>
                                <td className={'Margin-10'}>
                                    <button className={'Margin-10'} onClick={(e) => setSelectedTicker(ticker.tickerSymbol)}>SELECT</button>
                                </td>
                            </tr>
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    return (
        <div className={'App-center-container App-card'}>
            <h3 className={'Flex Margin-10'} onClick={toggle}><b>Available Tickers</b></h3>
            <ShowTickers stockTickers={tickerTargets} show={show}/>
        </div>
    );
};

const ViewModels = ({models, setModel}) => {

    const {
        state,
        toggle
    } = useToggle();

    const select = name => {
        return (event) => {
            event.preventDefault();
            setModel(name);
        };
    };

    const ShowModels = ({models, show}) => {
        return (
            <div className={'App-center-container'}>
                {show && (
                    <table className={'Flex Margin-10'}>
                        <tbody>
                        <tr className={'Margin-10'}>
                            <th className={'Margin-10'}>
                                Ticker
                            </th>
                            <th className={'Margin-10'}>
                                Model Name
                            </th>
                            <th></th>
                        </tr>
                        {models.map((meta, index) => {
                            return <tr key={`available-models-${index}`} className={'Margin-10'}>
                                <td className={'Margin-10'}>{meta.stockTicker}</td>
                                <td className={'Margin-10'}>{meta.collectiveModelName}</td>
                                <td className={'Margin-10'}><button onClick={select(meta.collectiveModelName)}>SELECT FOR FORECAST</button></td>
                            </tr>
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        );
    };

    return (
        <div className={'App-center-container App-card'}>
            <h3 className={'Flex Margin-10'} onClick={toggle}><b>Available Collective Models</b></h3>
            <ShowModels models={models} show={state}/>
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
        <div className={'App-center-container Margin-10 App-card'}>
            <h3 className={'Flex'} onClick={toggle}><b>Create New Collective Model</b></h3>
            {show && (
                <form className={'Flex Margin-10'}  onSubmit={handleSubmit}>
                    <div className={'App-center-container'}>
                        <label className={'Flex Margin-10'} >
                            <div className={'App-row-container'}>
                                <span className={'Form-label'}>Model Name:</span>
                                <input type="text" value={modelName} onChange={event => {
                                    event.preventDefault();
                                    setModelName(event.target.value)
                                }} />
                            </div>
                        </label>

                        <label className={'Flex Margin-10'}>
                            <div className={'App-row-container'}>
                                <span className={'Form-label'}>Stock Ticker:</span>
                                <select value={ticker} defaultValue={tickers[0]} onChange={(event) => {
                                    event.preventDefault();
                                    setTicker(event.target.value)
                                }}>
                                    {tickers.map((symbol, index) => {
                                        return(<option key={`create-model-ticker-${index}`} value={symbol}>{symbol}</option>);
                                    })}
                                </select>
                            </div>
                        </label>
                        <input className={'Flex Margin-10'} type="submit" value="Submit" />
                    </div>
                </form>
            )}
        </div>
    );
};

const CreateTicker = ({onSubmit}) => {

    const [priority, setPriority] = useState(() => 100);
    const [tickerSymbol, setTickerSymbol] = useState(() => '');
    const [businessSector, setBusinessSector] = useState(() => '');
    const [companyName, setCompanyName] = useState(() => '');

    const [show, setShow] = useState(() => false);

    const toggle = () => {
        setShow(!show);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(priority, tickerSymbol, businessSector, companyName);
    };

    return (
        <div className={'App-center-container Margin-10 App-card'}>
            <h3 className={'Flex'} onClick={toggle}><b>Create New Ticker Target</b></h3>
            {show && (
                <form className={'Flex Margin-10'}  onSubmit={handleSubmit}>
                    <div className={'App-center-container'}>
                        <label className={'Flex Margin-10'} >
                            <div className={'App-row-container'}>
                                <span className={'Form-label'}>Priority:</span>
                                <input type="number" value={priority} onChange={event => {
                                    event.preventDefault();
                                    setPriority(event.target.value)
                                }} />
                            </div>
                        </label>

                        <label className={'Flex Margin-10'} >
                            <div className={'App-row-container'}>
                                <span className={'Form-label'}>Ticker Symbol:</span>
                                <input type="text" value={tickerSymbol} onChange={event => {
                                    event.preventDefault();
                                    setTickerSymbol(event.target.value);
                                }} />
                            </div>
                        </label>

                        <label className={'Flex Margin-10'} >
                            <div className={'App-row-container'}>
                                <span className={'Form-label'}>Business Sector:</span>
                                <input type="text" value={businessSector} onChange={event => {
                                    event.preventDefault();
                                    setBusinessSector(event.target.value);
                                }} />
                            </div>
                        </label>

                        <label className={'Flex Margin-10'} >

                            <div className={'App-row-container'}>
                                <span className={'Form-label'}>Company Name:</span>
                                <input type="text" value={companyName} onChange={event => {
                                    event.preventDefault();
                                    setCompanyName(event.target.value);
                                }} />
                            </div>
                        </label>

                        <input className={'Flex Margin-10'} type="submit" value="Submit" />
                    </div>
                </form>
            )}
        </div>
    );
};

const ForecastViewer = ({selectedModel, mlClient}) => {

    const [startDate, setStartDate] = useState(() => getToday());
    const [endDate, setEndDate] = useState(() => getToday());
    const [predictions, setPredictions] = useState(() => []);

    const {
        state,
        toggle
    } = useToggle();

    const getPredictions = () => {
        const callback = (response) => {
            if(response.status === 200){
                setPredictions(response.data);
                return;
            }
            alert("Error while fetching predictions");
        };

        if(!selectedModel){
            alert('A model must be selected!');
            return;
        }

        mlClient.getCollectivePredictions(selectedModel, startDate.trim(), endDate.trim(), callback, (error) => alert(error));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        getPredictions();
    };

    const ForecastParameters = ({startDate, endDate, setStartDate, setEndDate}) => {
        return (
            <div>
                <h4>Forecast Parameters</h4>
                <form className={'Flex Margin-10'}  onSubmit={handleSubmit}>
                    <div className={'App-center-container'}>
                        <table className={'Margin-10'}>
                            <tbody>
                            <tr>
                                <td>
                                    <span className={'Form-label'}>Start Date:</span>
                                </td>
                                <td>
                                    <input type="text" value={startDate} onChange={event => {
                                        event.preventDefault();
                                        setStartDate(event.target.value);
                                    }} />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className={'Form-label'}>End date:</span>
                                </td>
                                <td>
                                    <input type="text" value={endDate} onChange={event => {
                                        event.preventDefault();
                                        setEndDate(event.target.value);
                                    }} />
                                </td>
                            </tr>
                            </tbody>
                        </table>

                        {/*<label className={'Flex Margin-10'} >*/}
                        {/*    <div className={'App-row-container'}>*/}
                        {/*        <span className={'Form-label'}>End date:</span>*/}
                        {/*        <input type="text" value={endDate} onChange={event => {*/}
                        {/*            event.preventDefault();*/}
                        {/*            setEndDate(event.target.value);*/}
                        {/*        }} />*/}
                        {/*    </div>*/}
                        {/*</label>*/}

                        <input className={'Flex Margin-10'} type="submit" value="Submit" />
                    </div>
                </form>
            </div>
        );
    };

    const ForecastView = React.memo(({predictions}) => {

        const drawPrediction = (prediction, index) => {

            const getPropertyValue = (propertyName, properties) => {
                let wanted;
                properties.forEach(property => {
                    if(property.valueName === propertyName){
                        wanted = property.predictedValue;
                    }
                });
                return wanted;
            };

            return (
                <tr key={`forecast-prediction-${index}`} className={'Margin-10'}>
                    <td className={'Margin-10'}>
                        <tr>
                            <td>DATE</td>
                        </tr>
                        <tr>
                            <td>{prediction.date}</td>
                        </tr>
                    </td>
                    <td className={'Margin-10'}>
                        <table>
                            <tbody>
                            <tr>
                                <td>CLOSING PRICE</td>
                                <td>{getPropertyValue("ClosingPrice", prediction.predictions)}</td>
                            </tr>
                            <tr>
                                <td>AFTER HOURS CLOSING PRICE</td>
                                <td>{getPropertyValue("AfterHoursClosingPrice", prediction.predictions)}</td>
                            </tr>
                            <tr>
                                <td>HIGH</td>
                                <td>{getPropertyValue("High", prediction.predictions)}</td>
                            </tr>
                            <tr>
                                <td>LOW</td>
                                <td>{getPropertyValue("Low", prediction.predictions)}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            );
        }

        return (
            <div>
                {predictions.length && (
                    <table>
                        <tbody>
                        {predictions.map(drawPrediction)}
                        </tbody>
                    </table>
                )}
                {!predictions.length && (
                    <span><b>No Predictions Available</b></span>
                )}
            </div>
        );
    });

    return (
        <div className={'App-center-container Margin-10 App-card'}>
            <h3 className={'Flex'} onClick={toggle}><b>Forecasting</b></h3>
            {state && (
                <>
                    <span>Selected Model: <b>{selectedModel}</b></span>
                    {ForecastParameters({startDate, endDate, setStartDate, setEndDate})}

                    <ForecastView predictions={predictions}/>
                </>
            )}
        </div>
    );
};
