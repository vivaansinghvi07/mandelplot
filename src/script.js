// waits for content being loaded
document.addEventListener("DOMContentLoaded", () => {

    // starting values
    let bounds = {
        lowerX: -2.4,
        upperX: 0.9,
        lowerY: -1.1,
        upperY: 1.1
    }
    let depth = 30;     // arbitrary inital depth

    // gets canvas
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    canvas.width = width();
    canvas.height = height();

    // display the plot
    plot(getResolution(), depth, bounds, getWorkers(), ctx);

    // listens for click
    document.getElementById("container").addEventListener("click", function(event) {

        // checks if there is another graph in queue
        if (document.getElementById("queue-manager").innerHTML === "stop") {
            return;
        }

        // gets zoom scale
        let zoom = getZoom();

        // performs visual zoom
        zoomCanvas(event.x, event.y, zoom);

        // determines what fraction of the width/height was clicked and resizes according to bounds
        let centerX = bounds.lowerX + (bounds.upperX - bounds.lowerX) * (event.x / width());   
        let centerY = bounds.lowerY + (bounds.upperY - bounds.lowerY) * (event.y / height());   

        // resizes bounds
        bounds.lowerX = bounds.lowerX - (bounds.lowerX - centerX) * zoom;
        bounds.upperX = bounds.upperX - (bounds.upperX - centerX) * zoom;
        bounds.lowerY = bounds.lowerY - (bounds.lowerY - centerY) * zoom;
        bounds.upperY = bounds.upperY - (bounds.upperY - centerY) * zoom;

        // increases depth - https://math.stackexchange.com/a/2589243
        depth = 50 + Math.pow(Math.log10(4/Math.abs(bounds.upperX - bounds.lowerX)), 4.7);

        // resizes width and height
        canvas.width = width();
        canvas.height = height();

        // plots
        plot(getResolution(), depth, bounds, getWorkers(), ctx);

    });

    // allows for setting dragging
    dragSettings(document.getElementById("settings"));

    // updates all sliders
    Array.from(document.getElementsByClassName("slider")).forEach((slider) => {

        // initial update
        document.getElementById(slider.id + "-value").innerHTML = slider.value;

        // future updatess
        slider.oninput = function() {
            document.getElementById(slider.id + "-value").innerHTML = slider.value;
        }
    })
});

function plot(resolution, depth, bounds, workers, ctx) {

    // pauses making of other graphs
    document.getElementById("queue-manager").innerHTML = "stop";

    let plt = new MandelPlot({
        width: width(),
        height: height()
    }, resolution, depth, {
        lowerX: bounds.lowerX,
        upperX: bounds.upperX,
        lowerY: bounds.lowerY,
        upperY: bounds.upperY
    }, workers);
    plt.display(ctx);
}

// returns width of screen
function width() {
    return document.documentElement.clientWidth;
}

// returns height of screen
function height() {
    return document.documentElement.clientHeight;
}

// returns resolution according to settings
function getResolution() {
    return parseInt(document.getElementById("resolution").value);
}

// returns worker count according to settings
function getWorkers() {
    return parseInt(document.getElementById("workers").value);
}

// returns zoom scale
function getZoom() {
    return parseInt(document.getElementById("zoom").value) / 100;
}

// zooms the canvas by the zoom factor into the values given
function zoomCanvas(x, y, zoom) {
    // gets new canvas
    let newCanvas = document.getElementById("zoomed-canvas");
    let newCtx = newCanvas.getContext('2d');

    // gets old canvas
    let oldCanvas = document.getElementById("canvas");
    let oldCtx = oldCanvas.getContext('2d');

    // sets width and height
    newCanvas.width = width();
    newCanvas.height = height();

    // copies canvas
    newCtx.drawImage(oldCanvas, 0, 0);

    // clear old canvas
    oldCtx.clearRect(0, 0, width(), height());

    // gets scale factor
    let scale = 1 / (1 - zoom);

    // calculate new position
    let dx = (x - (width() / 2)) * (scale - 1);
    let dy = (y - (height() / 2)) * (scale - 1);

    // restores defaults before animation
    newCanvas.style.transform = "scale(1)";
    newCanvas.style.left = "0";
    newCanvas.style.top = "0";
 
    anime({
        targets: newCanvas,
        left: `${-dx}px`,
        top: `${-dy}px` ,
        scale: `${scale}`,
        easing: 'linear',
        duration: 1000
    });
}