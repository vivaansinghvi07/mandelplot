class MandelPlot {

    // creates a new plot element with the
    constructor(screen, density, depth, bounds, workers, color) {

        // sets the bounds for the plot
        this.bounds = bounds;  

        // stores screen width and height
        this.screen =  screen;

        // sets the width of each point in pixels
        this.pointWidth = screen.width / density;

        // sets the depth 
        this.depth = depth;

        // sets the number of workers generating layout
        this.workers = workers;
        this.colors = new Array(workers);
        this.colors2D = null;   // stores colors in a pure 2d array, not a list of arrays of arrays

        // counts to make sure the thing is ready to display
        this.displayCount = 0;
        
        // stores plot number
        this.plotsDone = 0;

        // stores color
        this.color = color;

        // determines height density
        this.counts = {
            x: density,
            y: parseInt(Math.floor(screen.height / this.pointWidth))
        }

        // stores the indexes at which the workers will work
        this.workerIndeces = new Array();
        for (let i = 0; i < workers; i++) {
            this.workerIndeces[i] = Math.floor(this.counts.y / this.workers * (i + 1));
        }

        // creates new array of rows and colors
        this.rows = new Array(this.counts.y);   
        for (let i = 0; i < this.counts.y; i++) {
            this.rows[i] = new Array(this.counts.x);
        }

        // generates the points to analyze
        this.generateComplexPoints();

    }

    // generate an array of points
    generateComplexPoints() {
        
        // go through the array and calculate a point for each thing
        this.rows.forEach((row, y) => {
            for (let x = 0; x < this.counts.x; x++) {
                row[x] = this.calcPoint(y, x);
            }
        });

    }

    // calculates the point at the location given
    calcPoint(y, x) {
        return {
            x: this.bounds.lowerX + (this.bounds.upperX - this.bounds.lowerX) / this.counts.x * x,
            y: this.bounds.lowerY + (this.bounds.upperY - this.bounds.lowerY) / this.counts.y * y
        }
    }

    // uses multithreading to determine the colors at each location
    display(ctx) {

        // finds colors
        for (let i = 0; i < this.workers; i++) {

            // creates worker and rows on which it will perform work
            let worker = new Worker('src/worker/color-finder-worker.js');
            let material = new Array();

            // adds the arrays to the materials
            for (let rowCount = (i === 0) ? 0 : this.workerIndeces[i - 1]; rowCount < this.workerIndeces[i]; rowCount++) {
                material.push(this.rows[rowCount]);
            }

            // sends and receievs message from the worker
            worker.addEventListener('message', (event) => {
                this.colors[event.data.id] = event.data.colors;
                this.displayCount++;

                // checks if displayable
                if (this.displayCount == this.workers) {
                    worker.terminate();
                    this.displayGraph(ctx);
                }
            });
            worker.postMessage({
                points: material, 
                depth: this.depth, 
                id: i,
                scheme: this.color
            });
        }
        
    }

    displayGraph(ctx) {
        
        // stores colors into 2d array
        this.colors2D = new Array();
        for (let i = 0; i < this.workers; i++) {
            this.colors[i].forEach((row) => {
                this.colors2D.push(row);
            })
        }

        // checks if browser is safari (doesn't support workers)
        if (navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') <= -1) {    
            this.withoutWorkers(ctx);
        } else {
            this.withWorkers(ctx);
        }
         
    }

    /**
     *  NOTE: THIS IS FOR GRAPHING WITHOUT WORKERS 
     *  WEAK WITH HIGHER RESOLUTIONS
     *  BETTER WITH LOWER RESOLUTIONS
     */

    withoutWorkers(ctx) {
        this.colors2D.forEach((row, y) => {
            row.forEach((color, x) => {

                // calcualtes spot for rectangle
                let newX = Math.floor((x / this.counts.x) * this.screen.width);
                let newY = Math.floor((y / this.counts.y) * this.screen.height);
                let width = Math.floor(this.pointWidth * 1.5);
                
                // plots rectangle
                ctx.fillStyle = color;
                ctx.fillRect(newX, newY, width, width);

                // allows for further geenration
                document.getElementById("queue-manager").innerHTML = "continue";
            })
        })
    }

    /**
     * NOTE: THIS IS HERE IN CASE YOU WANT TO USE WEB WORKERS TO GENERATE.
     * IT IS ABOUT THE SAME TO DO AS ABOVE, BUT THIS IS MORE CAPABLE OF HIGHER RESOLUTIONS.
     * BITMAPS ARE HARD.
     */
    
    // finds colors
    withWorkers(ctx) {

        for (let i = 0; i < this.workers; i++) {

            // creates worker and rows on which it will perform work
            let worker = new Worker('src/worker/plotter-worker.js');
            let material = new Array();

            // adds the arrays to the materials
            for (let rowCount = (i === 0) ? 0 : this.workerIndeces[i - 1]; rowCount <= Math.min(this.counts.y-1, this.workerIndeces[i]); rowCount++) {
                material.push(this.colors2D[rowCount]);
            }

            // sends and receievs message from the worker
            worker.postMessage({
                colors: material,
                adder: i,
                screen: this.screen,
                width: this.pointWidth * 2,
                counts: this.counts,
                workers: this.workers
            });

            worker.addEventListener("message", (event) => {

                // maximize size
                let top = this.screen.height / this.workers * event.data[1];
                let left = 0;

                // draws image only if its the right plot
                ctx.drawImage(event.data[0], left, top);

                // increases plots
                this.plotsDone++;
                if (this.plotsDone == this.workers) {
                    document.getElementById("queue-manager").innerHTML = "continue";
                }

            });
        }
    }
}

