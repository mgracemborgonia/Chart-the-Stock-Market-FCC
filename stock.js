const express = require("express");
const http = require("http");
const axios = require("axios");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const path = require("path");
require("dotenv").config();

app.use(express.static("public"));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});
let stocks = {};
const fetchStockData = (symbol) => {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    return axios.get(url)
    .then(response => {
        console.log("API rensonse: ", response.data);
        const timeSeries = response.data["Time Series (5min)"]
        if(!timeSeries){
            console.error("Time Series (5min) was not found")
            return null;
        }
        const prices = Object.entries(timeSeries)
        .map(([timestamp, entry]) => ({
            time: timestamp,
            price: parseFloat(entry['4. close'])
        })).reverse();
        return {symbol, data: prices};
    }).catch(error => {
        console.error(error);
        return null;
    });
};

io.on("connection", (socket) => {
    console.log("User connected.");
    socket.emit("update-stocks", stocks);
    socket.on("add-stock-symbol", (symbol) => {
        const currentSymbols = Object.keys(stocks);
        if(currentSymbols.length >= 3){
            socket.emit("error-message", "Limit of 3 stocks reached.");
        	return;
        }
        if(currentSymbols.includes(symbol)){
            socket.emit("error-message", "Symbol already added.");
        	return;
        }
        if(!stocks[symbol]){
            fetchStockData(symbol)
            .then(fetchData => {
                if(fetchData){
                    stocks[symbol] = fetchData;
                    io.emit("update-stocks", stocks);
                }
            });
        };
    });
    socket.on("remove-stock-symbol", (symbol) => {
        if(stocks[symbol]){
            delete stocks[symbol];
            io.emit("update-stocks", stocks);
        };
    });
    socket.on("disconnect", () => {
        console.log("User disconnected.");
    });
});
server.listen(process.env.PORT || 3000, () => {
    console.log("Server 3000 is listening.");
    if(process.env.NODE_ENV === "test"){
        console.log('Running Tests...');
    };
});