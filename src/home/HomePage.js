import React from "react";
import OpenClosePage from "../charts/OpenClosePage";

const HomePage = () => {

    return (
        <div>
            <h1>ML Stock Predictor</h1>
            <p>This app predicts stock prices</p>
            <OpenClosePage/>
        </div>
    );
};

export default HomePage;
