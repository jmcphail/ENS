  // use <script src="jmcphail.github.io/ENS/test-site/js/script.js"></script> in RUNSAM

const chartToggle = document.getElementById("chartToggle");
const energyGenElements = document.getElementById("energyChartElements");
const dailyEnergyButton = document.getElementById("dailyEnergyButton");
const weeklyEnergyButton = document.getElementById("weeklyEnergyButton");
const monthlyEnergyButton = document.getElementById("monthlyEnergyButton");
const energyGenLabel = document.getElementById("energyGenLabel");
const powerTimeSlider = document.getElementById("powerTimeSlider");
const powerTimeSliderDisplay = document.getElementById("powerTimeSliderDisplay");
const chartDiv = document.getElementById("charts");

let areChartsVisible = true;
let isBackgroundImageVisible = false;
let backgroundImageSwitcher = 1;
let energyChartInstance = null;
let powerChartInstance = null;
let powerChartTimeout;
const BRIGHTNESSCHANGE = 25;
const DAILYTIMEINTERVAL = "30 days";
const WEEKLYTIMEINTERVAL = "3 months";
const MONTHLYTIMEINTERVAL = "12 months";


function chartsVisibility(){
  if(areChartsVisible){
    powerChartElements.classList.remove('show');
    powerChartElements.classList.add('hide');
    energyGenElements.classList.remove('show');
    energyGenElements.classList.add('hide');
    chartToggle.textContent = "Show Charts"
    areChartsVisible = false;
  }
  else{
    powerChartElements.classList.remove('hide');
    powerChartElements.classList.add('show');
    energyGenElements.classList.remove('hide');
    energyGenElements.classList.add('show');
    chartToggle.textContent = "Show Background Image"
    areChartsVisible = true;
  }
}
function backgroundImageVisibility(){
  if(isBackgroundImageVisible){
    chartDiv.classList.remove(`background-image${backgroundImageSwitcher}`);
    isBackgroundImageVisible = false;
  }
  else{
    if(backgroundImageSwitcher == 1){
      backgroundImageSwitcher = 2;
    }
    else{
      backgroundImageSwitcher = 1;
    }
    chartDiv.classList.add(`background-image${backgroundImageSwitcher}`);
    isBackgroundImageVisible = true;
  }
}
//from https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references
function getSmartphonesCharged(energy){
  const smartphones = (energy/0.019).toFixed(0);
  return smartphones;
}
function getCO2(energy){
  const CO2 = energy*(1.375**(-4));
  return CO2;
}
function getTreeCount(energy){
  const CO2 = getCO2(energy);
  const trees = (CO2/0.06).toFixed(0);
}
function getGasolineGallons(energy){
  const CO2 = getCO2(energy);
  const gasoline = (CO2/8.887**(-3)).toFixed(2);
}
function sumArray(accumulator, element){
  return accumulator + element;
}
function getLargest(previous, next){
    return Math.max(previous, next);
}

function getBackgroundColor(data){
    let i;
    let colorArray = [];
    const largest = data.reduce(getLargest);
    console.log(largest);
    for(i = 0; i < data.length; i++){
        const colorPercent = 50-(BRIGHTNESSCHANGE*(data[i]/largest));
        console.log(colorPercent);
        let chartColor = `hsl(96,100%,${colorPercent}%)`;
        chartColor = String(chartColor);
        colorArray.push(chartColor);
    }
    console.log(colorArray);
    return colorArray;
}

async function fetchEnergyData(timeInterval, timeRange){
  let url = `https://clients.hakaienergy.ca/camosun/get_site_energy.php?t=${timeInterval}&r=${timeRange}&f=json`
  url = String(url);
  const response = await fetch(url);
  const data = await response.json();
  console.log(data);
  return data;
}
async function fetchPowerData(dataUrl){
  const response = await fetch(dataUrl);
  const data = await response.json();
  console.log(data);
  return data;
}
function formatChartData(rawData) {
  const labels = rawData.map(item => item.measurement_date);
  const values = rawData.map(item => item.value);
  return { labels, values };
}
async function getTotalEnergyProduced(){
  const rawData = await fetchEnergyData("DAY", "all");
  const { labels, values } = formatChartData(rawData);
  totalEnergy = values.reduce(sumArray);
  return totalEnergy;
}
async function getMonthlyEnergyProduced(){
  const rawData = await fetchEnergyData("DAY", "-1 month");
  const { labels, values } = formatChartData(rawData);
  monthlyEnergy = values.reduce(sumArray);
  console.log(`Monthly Energy: ${monthlyEnergy}`);
  return monthlyEnergy;
}

async function renderEnergyChart(timeInterval, timeRange) {
  const rawData = await fetchEnergyData(timeInterval, timeRange);
  const { labels, values } = formatChartData(rawData);

  const ctx = document.getElementById("energyChart").getContext("2d");
  energyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Daily Energy (Wh)",
        data: values,
        backgroundColor: getBackgroundColor(values),
        maintainAspectRatio: true,
        animation: {
      duration: 1000,
      easing: "easeOutQuart"
    },
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          ticks: {
            callback: value => value.toLocaleString() + " Wh"
          },
          beginAtZero: true
        }
      }
    }
  });
}

async function renderPowerChart(dataUrl, hours){
  const rawData = await fetchPowerData(dataUrl);
  const { labels, values } = formatChartData(rawData);

  if (powerChartInstance) {
    powerChartInstance.data.datasets[0].data = values;
    powerChartInstance.data.labels = labels;
    powerChartInstance.data.datasets[0].label = `Power Generation (W) - Last ${hours} hours`;
    powerChartInstance.update();
  } else {
    console.log(labels);
    console.log(values);
    const ctx = document.getElementById("powerChart").getContext("2d");

    powerChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: `Power Generation (W) - Last ${hours} hours`,
          data: values,
          fill: true,
          borderColor: 'rgb(235, 212, 9)',
          backgroundColor: 'rgb(255, 233, 111)',
          tension: 0.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            min: 0,
            ticks: {
              callback: label => `${label / 1000}K`,
              font: { size: 24 }
            }
          },
          x: {
            display: false
          }
        }
      }
    });
  }
}

async function onStart(){
  chartsVisibility()
  backgroundImageVisibility()
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  document.getElementById("popup").style.display = "none";
  renderEnergyChart("DAY", formattedDailyInterval);
  sliderDecoration();
  renderPowerChart("https://clients.hakaienergy.ca/camosun/get_site_power.php?r=-72 hours",72)
  const totalEnergy = await getTotalEnergyProduced();
  console.log(totalEnergy);
  const monthlyEnergy = getMonthlyEnergyProduced();
}

function getPowerUrl(hourCount){
  const url = `https://clients.hakaienergy.ca/camosun/get_site_power.php?r=-${hourCount} hours`;
  return url;
}

chartToggle.onclick = function(){
  chartsVisibility()
  backgroundImageVisibility()
}

dailyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  renderEnergyChart("DAY", formattedDailyInterval);
  energyGenLabel.textContent = "Daily Energy Generation for last " + DAILYTIMEINTERVAL;
}

weeklyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedWeeklyInterval = `-${WEEKLYTIMEINTERVAL}`;
  renderEnergyChart("WEEK", formattedWeeklyInterval);
  energyGenLabel.textContent = "Weekly Energy Generation for last " + WEEKLYTIMEINTERVAL;
}

monthlyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedMonthlyInterval = `-${MONTHLYTIMEINTERVAL}`;
  renderEnergyChart("MONTH", formattedMonthlyInterval);
  energyGenLabel.textContent = "Monthly Energy Generation for last " + MONTHLYTIMEINTERVAL;
}

powerTimeSlider.addEventListener('input', () => {
  sliderDecoration();
  const hoursNow = powerTimeSlider.value;
  powerTimeSliderDisplay.textContent = `${hoursNow} hrs`;

  clearTimeout(powerChartTimeout);
  powerChartTimeout = setTimeout(() => {
    const hours = hoursNow; 
    const url = getPowerUrl(hours);
    renderPowerChart(url, hours);
  }, 25);
});
document.querySelectorAll(".linkButton").forEach(button => {
  button.addEventListener("click", function () {
    const url = this.getAttribute("data-url");
    const title = this.getAttribute("data-title");

    const noCacheUrl = url + (url.includes('?') ? '&' : '?') + 'nocache=' + new Date().getTime();
    document.getElementById("popupIFrame").src = noCacheUrl;
    document.getElementById("popupTitle").textContent = title;

    document.getElementById("popup").style.display = "block";
  });
});

document.querySelector(".closePopupButton").addEventListener("click", function () {
  document.getElementById("popup").style.display = "none";
  document.getElementById("popupIFrame").src = ""; // stop playback if video, etc.
});

window.addEventListener("click", function (event) {
  const modal = document.getElementById("popup");
  if (event.target === modal) {
    modal.style.display = "none";
    document.getElementById("popupIFrame").src = "";
  }
});
function sliderDecoration() {
  const value = powerTimeSlider.value;
  const max = powerTimeSlider.max;
  const percent = (value / max) * 100;

  powerTimeSlider.style.background = `
    linear-gradient(to right,
      orange 0%,
      orange ${percent-1.2}%,
      #ebe9e7 ${percent-1.2}%,
      #ebe9e7 100%)`;
}
onStart();
