const fs = require("fs");
const crypto = require("crypto");

console.log("1: Start of Script");

// Timer (Handled by libuv - Timers phase)
setTimeout(() => {
    console.log("2: Timer callback executed");
}, 0);

// Immediate (Check phase)
setImmediate(() => {
    console.log("3: setImmediate callback executed");
});

// File System (Handled by libuv Thread Pool)
fs.readFile(__filename, () => {
    console.log("4: File read completed (I/O callback)");
});

// CPU Intensive Task (Thread Pool - crypto)
crypto.pbkdf2("password", "salt", 100000, 64, "sha512", () => {
    console.log("5: Crypto task completed (Thread Pool)");
});

console.log("6: End of Script");
