let promise = new Promise((resolve, reject) => {
    let success = true;

    if(success){
        resolve("Task completed!");
    } else {
        reject("Task failed!");
    }
});

promise
.then((result) => {
    console.log(result);     // Task completed!
})
.catch((error) => {
    console.log(error);      // Task failed!
});



//!Promise cherry 

// Promise chaining means connecting multiple promises so that they run one after another.
// When one promise finishes, its result is passed to the next promise.

// It is used to handle asynchronous operations in a clean way and to avoid writing messy nested callbacks (callback hell).