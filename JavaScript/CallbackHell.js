setTimeout(() => {
    console.log("step1");
    setTimeout(()=> {
        console.log("step2");
        setTimeout(()=> {
            console.log("step3");
            
        },2000)
    }, 2000)
}, 2000);