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
    function mapToColor(depthReached, depth) {
        let quotient = depthReached / depth;

        // checks if its in the set
        if (quotient < 0) {
            return "rgb(0, 0, 0)"
        }

        // if its closer, go from blue to white
        else if (quotient > 0.5) {
            let value = Math.floor(256 - 2 * (1 - quotient) * 256);
            return `rgb(${value}, ${value}, 256)`;
        }
        
        // if its farther, go from black to blue
        else {
            let value = Math.floor(256 * (quotient * 2));
            return `rgb(0, 0, ${value})`
        }
        
    }

    // creates the colors and points
    let points = event.data[0];
    let depth = event.data[1];
    let colors = new Array();

    // goes through every point and calculates the color
    points.forEach((row) => {

        let colorRow = new Array();

        row.forEach((element) => {

            // determines how far it was able to go
            let depthReached = test(new Complex(element.x, element.y), depth);

            // gets color
            let color = mapToColor(depthReached, depth);

            // adds colors to array
            colorRow.push(color);

        });

        colors.push(colorRow);
    });

    self.postMessage([colors, event.data[2]]);
    self.close();
})