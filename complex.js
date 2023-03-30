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
        return Math.sqrt(Math.pow(this.a) + Math.pow(this.b));
    }
}