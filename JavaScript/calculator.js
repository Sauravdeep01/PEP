const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function sum(x, y) {
    return x + y;
}

function sub(x, y) {
    return x - y;
}

function Divide(x, y) {
    return x / y;
}

function Mul(x, y) {
    return x * y;
}

// Take inputs
rl.question("Enter first number: ", (a) => {
    rl.question("Enter second number: ", (b) => {
        rl.question("Enter operation (+, -, *, /): ", (op) => {

            a = Number(a);
            b = Number(b);

            let result;

            if (op === "+") {
                result = sum(a, b);
            }
            else if (op === "-") {
                result = sub(a, b);
            }
            else if (op === "*") {
                result = Mul(a, b);
            }
            else if (op === "/") {
                result = Divide(a, b);
            }
            else {
                console.log("❌ Invalid operation");
                rl.close();
                return;
            }

            console.log("✅ Result:", result);
            rl.close();
        });
    });
});
