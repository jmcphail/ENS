// use <script src="jmcphail.github.io/ENS/test-site/js/script.js"></script> in RUNSAM




document.addEventListener("DOMContentLoaded", function () {
  const output = document.getElementById("output");
  output.textContent = "JavaScript is working! Edit js/script.js to get started.";
});

energyGenToggle = document.getElementById("energyGenToggle");
powerGenToggle = document.getElementById("powerGenToggle");
energyGenElements = document.getElementById("energyChartElements");
dailyEnergyButton = document.getElementById("dailyEnergyButton");
monthlyEnergyButton = document.getElementById("monthlyEnergyButton");
yearlyEnergyButton = document.getElementById("yearlyEnergyButton");

isVisible = true;
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