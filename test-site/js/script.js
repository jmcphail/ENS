// use <script src="jmcphail.github.io/ENS/test-site/js/script.js"></script> in RUNSAM




document.addEventListener("DOMContentLoaded", function () {
  const output = document.getElementById("output");
  output.textContent = "JavaScript is working! Edit js/script.js to get started.";
});

//Testing RunSam
const myH1 = document.getElementById("myH1");
const testButton = document.getElementById("testButton");
const buttonHeader = document.getElementById("buttonHeader");
myH1.textContent = "The Javascript works!";
testButton.onclick = function(){
  buttonHeader.textContent = "The button works!";
}
