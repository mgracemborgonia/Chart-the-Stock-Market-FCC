const canvas = document.getElementById("stockChart");
const ctx = canvas.getContext("2d");
const symbol = document.getElementById("inputSymbol");
const message = document.getElementById("message");
let socket = io();
let stockData = {};
let chart;
function updateChart(){
    const sampleStock = Object.values(stockData)[0];
    if(chart) {
        chart.destroy();
    };
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: sampleStock?.data.map(d => {
                const date = new Date(d.time);
                return date.toLocaleString()
            }) || [],
            datasets: Object.values(stockData).map(stock => ({
                label: stock.symbol,
                data: stock.data.map(d => d.price),
                fill: false,
                borderColor: randomColor(),
                tension: 0.1
            }))
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {size: 15}
                    }
                }
            },
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Time",
                        color: "green",
                        font: {
                            size: 20, 
                            weight: 600
                        }
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: "Price ($)",
                        color: "blue",
                        font: {
                            size: 20, 
                            weight: 600
                        }
                    }
                }
            }
        }
    });
};
function addSymbol(){
    if(symbol.value){
        const currentSymbols = Object.keys(stockData);
        if(currentSymbols.length >= 3){
            message.innerText = "You can input up to 3 symbols.";
            symbol.value = "";
            return;
        }
        if(currentSymbols.includes(symbol.value)){
            message.innerText = "You have already input a symbol.";
            symbol.value = "";
            return;
        }
        socket.emit("add-stock-symbol", symbol.value);
        message.innerText = "";
        symbol.value = "";
    };
};
function removeSymbol(){
    if(symbol.value){
        socket.emit("remove-stock-symbol", symbol.value);
        symbol.value = "";
        message.innerText = "";
    };
};
socket.on("update-stocks", (data) => {
    stockData = data;
    updateChart();
});
socket.on("error-message", (msg) => {
    message.innerText = msg;
});
function randomColor(){
    const color = ["red","blue","yellow"];
    const lineColor = Math.floor(Math.random() * color.length);
    return color[lineColor];
};