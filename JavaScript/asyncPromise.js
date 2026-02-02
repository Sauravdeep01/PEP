function getData() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("Data mil gaya")
        }, 2000);
    })
 }

 async function fetchData() {
    console.log("Fetching...");
    let data = await getData()
    console.log(data);
    
 }

 fetchData()