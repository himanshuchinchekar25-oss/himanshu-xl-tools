document
.getElementById("generateFormula")
.onclick = function(){

let prompt =
document.getElementById("formulaPrompt").value;


document.getElementById("formulaResult")
.innerHTML =
"Formula request: " + prompt;


};