const ANIMATIONTIME = 1000;
const BUFFERTIME = 100;

// returns depth based on difference between bounds
function getDepth(bounds) {    // https://math.stackexchange.com/a/2589243
    return 50 + Math.pow(Math.log10(4/Math.abs(bounds.upperX - bounds.lowerX)), 5);
}

// waits for content being loaded
document.addEventListener("DOMContentLoaded", () => {

    function zoomOut() {
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

    // sets settings style based on if its on safari
    if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') <= -1) {
        document.getElementById("animation").style.left = "36%";
        document.getElementById("color").style.top = "5%";
        document.getElementById("warning").removeAttribute("hidden"); // show warning message to switch to chrome
    }

    // starting values
    let bounds = {};
    resetBounds(bounds); 
    displayBounds(bounds);

    let depth = getDepth(bounds);    // inital depth

    // gets canvas
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    // display the plot
    plot(depth, bounds, ctx);

    // stores old zoom value
    let oldSettings = new Array();

    // listens for page resize
    window.addEventListener('resize', () => {

        // checks if there is another graph in queue
        if (document.getElementById("queue-manager").innerHTML === "stop") {
            return;
        }

        // pauses making of other graphs
        document.getElementById("queue-manager").innerHTML = "stop";

        // clears the zoomed background canvas
        clearZoomeds(oldSettings);
        
        // resizes the canvas and plots a new one
        resizeCanvas(canvas);

        // changes bounds to be more accurate
        let yMag = (bounds.upperX - bounds.lowerX) / width() * height();
        let centerY = (bounds.upperY + bounds.lowerY) / 2;
        bounds.lowerY = centerY - yMag / 2;
        bounds.upperY = centerY + yMag / 2;

        // displays new bounds
        displayBounds(bounds);

        plot(depth, bounds, ctx);
    });

    // listens for click
    document.getElementById("container").addEventListener("click", async function(event) {

        // checks if there is another graph in queue
        if (document.getElementById("queue-manager").innerHTML === "stop") {
            return;
        }

        clearError();

        // pauses making of other graphs
        document.getElementById("queue-manager").innerHTML = "stop";

        // gets zoom scale
        let zoom = getZoom();

        // performs visual zoom
        await new Promise((resolve, reject) => {
            zoomCanvas(event.x, event.y, zoom, oldSettings.length + 1);
            setTimeout(() => {
                resolve();
            }, Math.max(0, animated() ? 1500 - getResolution() : 0));
        });

        // determines what fraction of the width/height was clicked and resizes according to bounds
        let centerX = bounds.lowerX + (bounds.upperX - bounds.lowerX) * (event.x / width());   
        let centerY = bounds.lowerY + (bounds.upperY - bounds.lowerY) * (event.y / height());   

        // stores old settings
        oldSettings.push({
            centerX: centerX,
            centerY: centerY,
            zoom: zoom
        });

        // displays where it was clicked
        document.getElementById("center-x").innerHTML = centerX;
        document.getElementById("center-y").innerHTML = -1 * centerY;

        changeBounds(bounds, centerX, centerY, zoom);

        // increases depth
        depth = getDepth(bounds);

        // plots
        plot(depth, bounds, ctx);

    });

    document.getElementById("zoom-out").addEventListener("click", () => {

        zoomOut();

    });

    document.getElementById("reset").addEventListener("click", async () => {

        // checks if there is another graph in the queue
        if (document.getElementById("queue-manager").innerHTML === "stop") {
            return;
        }

        while (zoomOut()) { 
            await new Promise((resolve, reject) => {
                setTimeout(resolve, animated() ? ANIMATIONTIME + BUFFERTIME : 0);
            })
        }

        // clears everything under
        clearZoomeds(oldSettings);

        // resets bounds
        resetBounds(bounds);
        displayBounds(bounds);

        // calc new depth
        depth = getDepth(bounds);

        // plots bnew graph
        plot(depth, bounds, ctx);
    })

    // allows for setting dragging
    dragSettings(document.getElementById("drag-image-settings"), document.getElementById("settings"));
    dragSettings(document.getElementById("drag-image-info"), document.getElementById("information"));

    // function for clicking on help
    let onHelp = false;
    document.getElementById("help-image").addEventListener("click", () => {
        onHelp = !onHelp;
        toggleInfo(onHelp);
    });
    document.getElementById("x-button").addEventListener("click", () => {
        onHelp = false;
        toggleInfo(false);  // false because it is not on the page
    });

    // updates all sliders
    Array.from(document.getElementsByClassName("slider")).forEach((slider) => {

        // initial update
        document.getElementById(slider.id + "-value").innerHTML = slider.value;

        // future updatess
        slider.oninput = () => {
            document.getElementById(slider.id + "-value").innerHTML = slider.value;
        }
    });

    // detects apply new settings button click
    document.getElementById("reload").addEventListener("click", () => {
        clearError();

        // plots with updated settings
        plot(depth, bounds, ctx);
    });

    // detects use new bounds setting
    document.getElementById("custom").addEventListener("click", () => {
        
        // div for error message
        let err = document.getElementById("error-message");
        err.innerHTML = null;

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
        bounds.lowerY = upperY * -1;    // idk why this works but i guess it does
        bounds.upperY = lowerY * -1;

        // increases depth - https://math.stackexchange.com/a/2589243
        depth = getDepth(bounds);

        // clears old settings and zooms
        clearZoomeds(oldSettings);

        // plots
        plot(depth, bounds, ctx);

    })
});

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