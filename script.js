// waits for content being loaded
document.addEventListener("DOMContentLoaded", () => {

    // starting values
    let bounds = {
        lowerX: -2.4,
        upperX: 0.9,
        lowerY: -1.1,
        upperY: 1.1
    }
    let resolution = 1200;
    let depth = 25;
    let workers = 16;

    // keeps track of zoom
    scale = 1;

    // gets canvas
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = width();
    canvas.height = height();

    // display the plot
    plot(resolution, depth, bounds, workers, ctx);

    // listens for click
    document.getElementById("container").addEventListener("click", function(event) {
        // determines what fraction of the width/height was clicked and resizes according to bounds
        let centerX = bounds.lowerX + (bounds.upperX - bounds.lowerX) * (event.x / width());   
        let centerY = bounds.lowerY + (bounds.upperY - bounds.lowerY) * (event.y / height());   

        // resizes bounds
        bounds.lowerX = bounds.lowerX - (bounds.lowerX - centerX) * 0.5;
        bounds.upperX = bounds.upperX - (bounds.upperX - centerX) * 0.5;
        bounds.lowerY = bounds.lowerY - (bounds.lowerY - centerY) * 0.5;
        bounds.upperY = bounds.upperY - (bounds.upperY - centerY) * 0.5;

        // adjusts the scale
        scale *= 0.5;

        // increases depth - https://math.stackexchange.com/a/2589243
        depth = 50 + Math.pow(Math.log10(4/Math.abs(bounds.upperX - bounds.lowerX)), 5);

        // plots
        plot(resolution, depth, bounds, workers, ctx);
    });


    // allows for setting dragging
    let img = document.getElementById("drag-image")
    img.addEventListener("mousedown", () => {
        let exit = false;
        img.addEventListener("mouseup", () => {
            exit = true;
        });
        img.addEventListener("mouseover", (event) => {
            if (exit) {
                return;
            }
            let settingsDiv = document.getElementById("settings");

            settingsDiv.style.top = "20px";
            settingsDiv.style.left = "20px";
        });
        
    })
});

function plot(resolution, depth, bounds, workers, ctx) {
    let plot = new MandelPlot({
        width: width(),
        height: height()
    }, resolution, depth, {
        lowerX: bounds.lowerX,
        upperX: bounds.upperX,
        lowerY: bounds.lowerY,
        upperY: bounds.upperY
    }, workers);
    plot.display(ctx);
}

// returns width of screen
function width() {
    return document.documentElement.clientWidth;
}

// returns height of screen
function height() {
    return document.documentElement.clientHeight;
}