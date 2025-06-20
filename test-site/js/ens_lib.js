document.addEventListener("DOMContentLoaded", function () {
  const superH3 = document.getElementById("superH3");
  superH3.textContent = "JavaScript is working!";
});

//Testing RunSam

const myH1 = document.getElementById("myH1");
const testButton = document.getElementById("testButton");

testButton.onclick = function(){
  myH1.textContent = "This Test";
}