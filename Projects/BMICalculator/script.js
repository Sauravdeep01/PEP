function calculateBMI(){
    let weight = document.getElementById("weight").value;
    let height = document.getElementById("height").value;

    if(weight === "" || height === ""){
        document.getElementById("result").innerText = "Please enter all values";
        return;
    }

    height = height / 100;   // convert cm to meter

    let bmi = weight / (height * height);
    bmi = bmi.toFixed(2);

    let result = "Your BMI is " + bmi;

    if(bmi < 18.5){
        result += " (Underweight)";
    }
    else if(bmi < 25){
        result += " (Normal)";
    }
    else{
        result += " (Overweight)";
    }

    document.getElementById("result").innerText = result;
}
