self.addEventListener("message", (event) => {

    // obtains parameters
    let colors = event.data.colors;
    let screen = event.data.screen;
    let adder = event.data.adder;
    let width = event.data.width;
    let counts = event.data.counts;

    // obtains canvas and shows it
    let canvas = new OffscreenCanvas(screen.width, screen.height);
    let ctx = canvas.getContext('2d');

    // settings
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = "transparent";

    // fills colors
    colors.forEach((row, y) => {
        row.forEach((color, x) => {

            // finds new bounds
            let newX = Math.floor((x / counts.x) * screen.width);
            let newY = Math.floor(((y + adder) / counts.y) * screen.height);

            // filsl the rectangle
            ctx.fillStyle = color;
            ctx.fillRect(newX, newY, width, width);
        })
    })
    
    // sends the image bitmap to the main program so that it can be added to the main graph
    let bm = canvas.transferToImageBitmap();
    self.postMessage([bm, adder]);
    self.close();
})