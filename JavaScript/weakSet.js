// ! WeakSet in JavaScript stores objects only and holds them weakly (no memory leak).

let obj1 = { name: "A" };
let obj2 = { name: "B" };

let ws = new WeakSet();

ws.add(obj1);
ws.add(obj2);

console.log(ws.has(obj1)); // true
