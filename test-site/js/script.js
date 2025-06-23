// use <script src="jmcphail.github.io/ENS/test-site/js/script.js"></script> in RUNSAM




document.addEventListener("DOMContentLoaded", function () {
  const output = document.getElementById("output");
  output.textContent = "JavaScript is working! Edit js/script.js to get started.";
});

const energyGenToggle = document.getElementById("energyGenToggle");
const powerGenToggle = document.getElementById("powerGenToggle");
const energyGenElements = document.getElementById("energyChartElements");
const dailyEnergyButton = document.getElementById("dailyEnergyButton");
const monthlyEnergyButton = document.getElementById("monthlyEnergyButton");
const yearlyEnergyButton = document.getElementById("yearlyEnergyButton");

let isVisible = true;
energyGenToggle.onclick = function(){
  energyChartVisibility();
}

function energyChartVisibility(){
  if(isVisible){
    energyGenElements.classList.remove('show');
    energyGenElements.classList.add('hide');
    isVisible = false;
  }
  else{
    energyGenElements.classList.remove('hide');
    energyGenElements.classList.add('show');
    isVisible = true;
  }
}