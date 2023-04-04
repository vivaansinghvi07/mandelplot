// waits for content being loaded
document.addEventListener("DOMContentLoaded", () => {

    // sets settings style based on if its on safari
    if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') <= -1) {
        document.getElementById("animation").style.left = "36%";
        document.getElementById("color").style.top = "5%";
    }

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
    resizeCanvas(canvas);

    // display the plot
    plot(getResolution(), depth, bounds, getWorkers(), ctx, getColor());

    // listens for click
    document.getElementById("container").addEventListener("click", async function(event) {

        // checks if there is another graph in queue
        if (document.getElementById("queue-manager").innerHTML === "stop") {
            return;
        }

        // pauses making of other graphs
        document.getElementById("queue-manager").innerHTML = "stop";

        // gets zoom scale
        let zoom = getZoom();

        // performs visual zoom
        await new Promise((resolve, reject) => {
            zoomCanvas(event.x, event.y, zoom);
            setTimeout(() => {
                resolve();
            }, Math.max(0, animated() ? 1500 - getResolution() : 0));
        });

        // determines what fraction of the width/height was clicked and resizes according to bounds
        let centerX = bounds.lowerX + (bounds.upperX - bounds.lowerX) * (event.x / width());   
        let centerY = bounds.lowerY + (bounds.upperY - bounds.lowerY) * (event.y / height());   

        // resizes bounds
        bounds.lowerX = bounds.lowerX - (bounds.lowerX - centerX) * zoom;
        bounds.upperX = bounds.upperX - (bounds.upperX - centerX) * zoom;
        bounds.lowerY = bounds.lowerY - (bounds.lowerY - centerY) * zoom;
        bounds.upperY = bounds.upperY - (bounds.upperY - centerY) * zoom;

        // displays bounds
        document.getElementById("x-lower").value = bounds.lowerX;
        document.getElementById("x-upper").value = bounds.upperX;
        document.getElementById("y-upper").value = bounds.lowerY * -1;  // idk why this works but if it works dont fix it
        document.getElementById("y-lower").value = bounds.upperY * -1;

        // increases depth - https://math.stackexchange.com/a/2589243
        depth = 75 + Math.pow(Math.log10(4/Math.abs(bounds.upperX - bounds.lowerX)), 4);

        // resizes width and height
        resizeCanvas(canvas);

        // plots
        plot(getResolution(), depth, bounds, getWorkers(), ctx, getColor());

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
    });

    // detects apply new settings button click
    document.getElementById("reload").addEventListener("click", () => {
        // plots with updated settings
        plot(getResolution(), depth, bounds, getWorkers(), ctx, getColor());
    });

    // detects use new bounds setting
    document.getElementById("custom").addEventListener("click", () => {
        
        // div for error message
        let err = document.getElementById("error-message");

        // checks if there is an undeinfed value
        let undefined = false;

        // gets bound values
        let vals = ["x-lower", "x-upper", "y-lower", "y-upper"].map((element) => {

            // gets value
            let val = document.getElementById(element).value;
            if (val.length === 0) {     // check if empty
                undefined = true;
            }

            return val;
        });

        // error for undefined value
        if (undefined) {
            err.innerHTML = "Please do not enter empty bounds!";
            return;
        }

        // checks for non-numerical
        let nonNum = false;

        // checks if there are non-numerical things
        vals = vals.map((val) => {
            // gets number and checks if its not a number
            let num = parseFloat(val);
            if (isNaN(num)) {
                nonNum = true;
            }
            return num;
        });

        // exits
        if (nonNum) {
            err.innerHTML = "You cannot have non-numerical bounds!";
            return;
        }

        // maps to bound numbers
        let [lowerX, upperX, lowerY, upperY] = vals;

        // determines validity
        if (upperX < lowerX || upperY < lowerY) {
            err.innerHTML = "Your upper bounds can't be smaller than your lower bounds!";
            return;
        }

        // sets bounds
        bounds.lowerX = lowerX;
        bounds.upperX = upperX;
        bounds.lowerY = upperY * -1;
        bounds.upperY = lowerY * -1;

        // increases depth - https://math.stackexchange.com/a/2589243
        depth = 75 + Math.pow(Math.log10(4/Math.abs(bounds.upperX - bounds.lowerX)), 4);

        // resizes width and height
        resizeCanvas(canvas);

        // plots
        plot(getResolution(), depth, bounds, getWorkers(), ctx, getColor());

    })
});

function plot(resolution, depth, bounds, workers, ctx, color) {

    // creates new plot with defined settings
    let plt = new MandelPlot({
        width: width(),
        height: height()
    }, resolution, depth, {
        lowerX: bounds.lowerX,
        upperX: bounds.upperX,
        lowerY: bounds.lowerY,  // these are swapped to avoid reversing
        upperY: bounds.upperY   // ^^
    }, workers, color);

    // displays plot
    plt.display(ctx);
}

// returns width of screen
function width() {
    return window.innerWidth;
}

// returns height of screen
function height() {
    return window.innerHeight;
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

// returns if its animated
function animated() {
    return document.getElementById("animation").checked;
}

// retursn color
function getColor() {
    return document.getElementById("color").value;
}

// resizes canvas 
function resizeCanvas(canvas) {
    canvas.width = width();
    canvas.height = height();
}

// zooms the canvas by the zoom factor into the values given
async function zoomCanvas(x, y, zoom) {

    // gets new canvas
    let newCanvas = document.getElementById("zoomed-canvas");
    let newCtx = newCanvas.getContext('2d');

    // gets old canvas
    let oldCanvas = document.getElementById("canvas");
    let oldCtx = oldCanvas.getContext('2d');

    // sets width and height
    newCanvas.width = width();
    newCanvas.height = height();
    
    // copies old to new canvas
    await new Promise((resolve, reject) => {
        newCtx.drawImage(oldCanvas, 0, 0);

        // clear old canvas
        oldCtx.clearRect(0, 0, width(), height());
        resolve();
    });

    // gets scale factor
    let scale = 1 / (1 - zoom);

    // calculate new position
    let dx = (x - (width() / 2)) * (scale - 1);
    let dy = (y - (height() / 2)) * (scale - 1);

    // restores defaults before animation
    newCanvas.style.transform = "scale(1)";
    newCanvas.style.left = "0";
    newCanvas.style.top = "0";
 
    // performs animation
    setTimeout(() => {
        anime({
            targets: newCanvas,
            left: `${-dx}px`,
            top: `${-dy}px` ,
            scale: `${scale}`,
            easing: 'linear',
            duration: animated() ? 1000 : 0     // sets animation if necessary
        });
    }, Math.max(0, getResolution() - 2000));
}