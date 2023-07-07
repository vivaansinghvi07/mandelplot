const ANIMATIONTIME = 1000;
const BUFFERTIME = 100;

// waits for content being loaded
document.addEventListener("DOMContentLoaded", () => {

    // sets settings style based on if its on safari
    if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') <= -1) {
        document.getElementById("animation").style.left = "36%";
        document.getElementById("color").style.top = "5%";
        document.getElementById("warning").removeAttribute("hidden"); // show warning message to switch to chrome
    }

    // pauses making of other graphs
    document.getElementById("queue-manager").innerHTML = "stop";

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

        setTimeout(() => {
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
        }, BUFFERTIME);
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

        zoomOut(bounds, oldSettings);

    });

    document.getElementById("reset").addEventListener("click", async () => {

        // checks if there is another graph in the queue
        if (document.getElementById("queue-manager").innerHTML === "stop") {
            return;
        }

        while (zoomOut(bounds, oldSettings)) { 
            await new Promise((resolve, reject) => {
                setTimeout(resolve, animated() ? ANIMATIONTIME + BUFFERTIME * 2 : 0);
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
        
        // checks if there is another graph in the queue
        if (document.getElementById("queue-manager").innerHTML === "stop") {
            return;
        }
        
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
        let undefCount = 0;

        // gets bound values
        let vals = ["x-lower", "x-upper", "y-lower", "y-upper"].map((element, idx) => {

            // gets value
            let val = document.getElementById(element).value;
            if (val.length === 0) {     // check if empty
                undefCount++;
            }

            return val;
        });

        // error for undefined value
        if (undefCount > 1) {
            err.innerHTML = "You cannot have more than one empty bound!";
            return;
        }

        // checks for non-numerical
        let nonNumCount = 0;

        // checks if there are non-numerical things
        vals = vals.map((val) => {
            // gets number and checks if its not a number
            let num = parseFloat(val);
            if (isNaN(num)) {
                nonNumCount++;
            }
            return num;
        });

        // exits
        if (nonNumCount > undefCount) {
            err.innerHTML = "You cannot have non-numerical bounds!";
            return;
        }

        // maps to bound numbers
        let [lowerX, upperX, lowerY, upperY] = vals;

        // determines validity
        if (isNaN(lowerY) || isNaN(upperY)) {
            if (upperX < lowerX) {
                err.innerHTML = "Your x-axis has an upper bound smaller than its lower bound!"; 
                return;
            }
            if (isNaN(lowerY)) {
                lowerY = upperY - height()/width() * (upperX-lowerX);
                document.getElementById("y-lower").value = lowerY;
            } else {
                upperY = lowerY + height()/width() * (upperX-lowerX);
                document.getElementById("y-upper").value = upperY;
            }
        } else if (isNaN(lowerX) || isNaN(upperX)) {
            if (upperY < lowerY) {
                err.innerHTML = "Your y-axis has an upper bound smaller than its lower bound!"; 
                return;
            }
            if (isNaN(lowerX)) {
                lowerX = upperX - width()/height() * (upperY-lowerY);
                document.getElementById("x-lower").value = lowerX;
            } else if (isNaN(upperX)) {
                upperX = lowerX + width()/height() * (upperY-lowerY);
                document.getElementById("x-upper").value = upperX;
            }
        } else if (upperX < lowerX || upperY < lowerY) {
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
