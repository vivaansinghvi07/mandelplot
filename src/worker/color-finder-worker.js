self.addEventListener('message', (event) => {
    class Complex {
        // new complex number in the form a _ bi
        constructor(a, b) {
            this.a = a;
            this.b = b;
        }
    
        // squares itself
        square() {
            // temp value so that a doesnt get overwritten 
            let tempA = this.a;
    
            // performs (a+bi)(a+bi) = a^2 + 2abi - b^2
            this.a = Math.pow(this.a, 2) - Math.pow(this.b, 2);
            this.b = tempA * this.b * 2;
        }
    
        // adds another complex number to itself
        add(other) {
            this.a += other.a;
            this.b += other.b;
        }
    
        // determines the magnitude of the number
        mag() {
            // performs sqrt(a^2 + b^2)
            return Math.sqrt(Math.pow(this.a, 2) + Math.pow(this.b, 2));
        }
    }

    // function for testing if a value is in the set
    function test(c, depth) {

        // initializes complex 
        let z = new Complex(0, 0);

        // repeats iterations
        for (let d = 0; d < depth; d++) {
            z.square();
            z.add(c);

            // checks if magnitude goes to very large number
            if (z.mag() > 1000) {
                return d;    // returns max depth it was able to reach
            }
        }

        // returns -1 for depth, indicating a success (strange i know)
        return -1;
    }

    // function for mapping thing to color
    function mapToColor(depthReached, depth, scheme) {

        // for the red, blue, green, color options
        function rgbColor(depthReached, depth, color) {
            let quotient = depthReached / depth;

            // checks if its in the set
            if (quotient < 0) {
                return "rgb(0, 0, 0)"
            }

            // if its closer, go from blue to white
            else if (quotient > 0.5) {
                let value = Math.floor(255 - 2 * (1 - quotient) * 255);
                return `rgb(${color !== "red" ? value: 255}, ${color !== "green" ? value: 255}, ${color !== "blue" ? value: 255})`;
            }
            
            // if its farther, go from black to blue
            else {
                let value = Math.floor(255 * (quotient * 2));
                return `rgb(${color === "red" ? value: 0}, ${color === "green" ? value: 0}, ${color === "blue" ? value: 0})`
            }
        }

        // for black and white / inverted color options
        function blackWhite(depthReached, depth, color) {
            let quotient = depthReached / depth;

            // checks if its in the set
            if (quotient < 0) {
                return color === "blackwhite" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
            }

            // otherwise makes it a gradient
            let value = color === "blackwhite" ? Math.floor(255 * quotient) : Math.floor(255 * (1 - quotient));
            return `rgb(${value}, ${value}, ${value})`;
        }

        // cycles through colors for rainbow
        function rainbow(depthReached) {

            // checks for max depth reached
            if (depthReached === -1) {
                return 'rgb(0, 0, 0)';
            }

            // returns corresponding rainbow value
            return [
                "rgb(255, 0, 0)",
                "rgb(255, 165, 0)",
                "rgb(255, 255, 0)",
                "rgb(0, 128, 0)",
                "rgb(0, 0, 255)",
                "rgb(75, 0, 130)",
                "rgb(238, 130, 238)"
            ][Math.floor(depthReached/5) % 7];

        }
        
        // checks if the "rgb" color method is used
        if (scheme === "blue" || scheme === "red" || scheme === "green") {
            return rgbColor(depthReached, depth, scheme);
        } else if (scheme === "inverted" || scheme === "blackwhite") {
            return blackWhite(depthReached, depth, scheme);
        } else if (scheme === "rainbow") {
            return rainbow(depthReached);
        }
        
    }

    // loads settings
    let points = event.data.points;
    let depth = event.data.depth;
    let scheme = event.data.scheme;

    // new array for colors
    let colors = new Array();

    // goes through every point and calculates the color
    points.forEach((row) => {

        let colorRow = new Array();

        row.forEach((element) => {

            // determines how far it was able to go
            let depthReached = test(new Complex(element.x, element.y), depth);

            // gets color
            let color = mapToColor(depthReached, depth, scheme);

            // adds colors to array
            colorRow.push(color);

        });

        colors.push(colorRow);
    });

    self.postMessage({
        colors: colors,
        id: event.data.id
    });
    self.close();
})