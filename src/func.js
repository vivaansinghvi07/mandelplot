function plot(depth, bounds, ctx) {

    // creates new plot with defined settings
    let plt = new MandelPlot({
        width: width(),
        height: height()
    }, getResolution(), depth, {
        lowerX: bounds.lowerX,
        upperX: bounds.upperX,
        lowerY: bounds.lowerY,  
        upperY: bounds.upperY   
    }, getWorkers(), getColor());

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

// returns depth based on difference between bounds
function getDepth(bounds) {    // https://math.stackexchange.com/a/2589243
    return 100 + Math.pow(Math.log10(4/Math.abs(bounds.upperX - bounds.lowerX)), 5);
}

// resizes canvas 
function resizeCanvas(canvas) {
    canvas.width = width();
    canvas.height = height();
}

// clears the error message
function clearError() {
    document.getElementById("error-message").innerHTML = null;
}

// toggles showing of information page
function toggleInfo(show) {
    // toggles showing
    let info = document.getElementById("information");
    if (show) {
        info.removeAttribute("hidden");
    } else {
        info.setAttribute("hidden", "hidden");
    }
}


// displays bounds
function displayBounds(bounds) {
    document.getElementById("x-lower").value = bounds.lowerX;
    document.getElementById("x-upper").value = bounds.upperX;
    document.getElementById("y-upper").value = bounds.lowerY * -1;  // idk why this works but if it works dont fix it
    document.getElementById("y-lower").value = bounds.upperY * -1;
}

// changes and displays bounds
function changeBounds(bounds, centerX, centerY, zoom) {
    // resizes bounds
    bounds.lowerX = bounds.lowerX - (bounds.lowerX - centerX) * zoom;
    bounds.upperX = bounds.upperX - (bounds.upperX - centerX) * zoom;
    bounds.lowerY = bounds.lowerY - (bounds.lowerY - centerY) * zoom;
    bounds.upperY = bounds.upperY - (bounds.upperY - centerY) * zoom;

    displayBounds(bounds);
}

function resetBounds(bounds) {

    // sets x-coords
    bounds.lowerX = -2.4;   // THESE ARE SUBJECT TO CHANGE
    bounds.upperX = 0.9;

    // determines the magnitude of the y-coords
    let yMag = (bounds.upperX - bounds.lowerX) / width() * height(); 
    
    // assigns bound values centered around 0
    bounds.lowerY = - yMag / 2;
    bounds.upperY = yMag / 2;

}

// zooms the canvas by the zoom factor into the values given
async function zoomCanvas(x, y, zoom, idNumber) {

    // gets new canvas
    let newCanvas = document.createElement("canvas");
    newCanvas.setAttribute("id", `zoomed-canvas${idNumber}`);
    document.getElementById("zoomeds").appendChild(newCanvas);
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
            easing: 'easeInQuad',
            duration: animated() ? ANIMATIONTIME : 0     // sets animation if necessary
        });
    }, Math.max(0, getResolution() - 2000));
}

async function zoomOutCanvas(idNumber) {
    // gets the zoomed canvas
    let zoomedCanvas = document.getElementById(`zoomed-canvas${idNumber}`);

    // clears old canvas
    let oldCtx = document.getElementById("canvas").getContext('2d');
    oldCtx.clearRect(0, 0, width(), height());

    // animates undoing the zooming
    await new Promise((resolve, reject) => {
        setTimeout(() => {
            anime({
                targets: zoomedCanvas,
                scale: 1,
                top: 0,
                left: 0,
                easing: 'easeOutQuad',
                duration: animated() ? ANIMATIONTIME : 0
            });
        }, BUFFERTIME);
        setTimeout(() => {
            oldCtx.drawImage(zoomedCanvas, 0, 0);
            zoomedCanvas.remove();
            resolve();
        }, animated() ? ANIMATIONTIME + BUFFERTIME : 0);
    });
}

// clears old settings and the zoomeds thing
function clearZoomeds(settings) {
    document.getElementById("zoomeds").innerHTML = null;
    settings = new Array();
}

function zoomOut(bounds, oldSettings) {
    // checks if there is another graph in queue or if there is nothing to zoom out
    if (document.getElementById("queue-manager").innerHTML === "stop" || oldSettings.length === 0 || !document.getElementById("zoomeds").innerHTML) {
        return false;
    }

    // pauses making of other graphs
    document.getElementById("queue-manager").innerHTML = "stop";

    clearError();
    
    let settings = oldSettings.pop();
    
    // resets bounds to what they previously were
    let zoom = - 1 / (1 - settings.zoom) + 1;
    changeBounds(bounds, settings.centerX, settings.centerY, zoom);

    zoomOutCanvas(oldSettings.length + 1);

    // pauses making of other graphs
    document.getElementById("queue-manager").innerHTML = "continue";

    return true;
}