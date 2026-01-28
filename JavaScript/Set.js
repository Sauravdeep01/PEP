//! In JavaScript, Set is a built-in object that stores unique values (no duplicates).

// let numbers = new Set([1, 2, 3, 3, 4]);
// console.log(numbers); 



let s = new Set();
s.add(10);
s.add(20);
s.add(10);   // duplicate, ignored

console.log(s.has(20)); // true
console.log(s.size);   // 2

s.delete(10);
console.log(s);        // Set {20}

