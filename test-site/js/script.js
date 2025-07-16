  // use <script src="jmcphail.github.io/ENS/test-site/js/script.js"></script> in RUNSAM

const slideElement = document.getElementById("contentSpace");
const chartDiv = document.getElementById("charts");
const chartToggle = document.getElementById("chartToggle");
const energyGenElements = document.getElementById("energyChartElements");
const dailyEnergyButton = document.getElementById("dailyEnergyButton");
const weeklyEnergyButton = document.getElementById("weeklyEnergyButton");
const monthlyEnergyButton = document.getElementById("monthlyEnergyButton");
const energyGenLabel = document.getElementById("energyGenLabel");
const powerTimeSlider = document.getElementById("powerTimeSlider");
const powerTimeSliderDisplay = document.getElementById("powerTimeSliderDisplay");
const currentPower = document.getElementById("currentPower");
const dailyEnergy = document.getElementById("dailyEnergy");
const monthlyEnergy = document.getElementById("monthlyEnergy");
const totalEnergy = document.getElementById("lifetimeEnergy");
const totalPower = document.getElementById("totalPower");

let currentElementIndex = 0;
let areChartsVisible = true;
let energyChartInstance = null;
let powerChartInstance = null;
let powerChartTimeout;
const BRIGHTNESSCHANGE = 25;
const DAILYTIMEINTERVAL = "30 days";
const WEEKLYTIMEINTERVAL = "3 months";
const MONTHLYTIMEINTERVAL = "12 months";

//from https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references
function getCO2(energy){
  const CO2 = energy * 9.9e-6;
  return CO2;
}
function getSmartphonesCharged(energy){
  const smartphones = (energy/0.019).toFixed(0);
  return smartphones;
}
function getTreeCount(energy){
  const CO2 = getCO2(energy);
  const trees = (CO2/0.06).toFixed(0);
  return trees;
}
function getGasolineGallons(energy){
  const CO2 = getCO2(energy);
  const gasolineLiters = CO2/0.002347;
  const gasolineGallons = gasolineLiters/3.785;
  return gasolineGallons.toFixed(2);
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
    for(i = 0; i < data.length; i++){
        const colorPercent = 50-(BRIGHTNESSCHANGE*(data[i]/largest));
        let chartColor = `hsl(96,100%,${colorPercent}%)`;
        chartColor = String(chartColor);
        colorArray.push(chartColor);
    }
    return colorArray;
}
function resetButtonColors(){
  document.querySelectorAll("#buttonRow button").forEach(button => {
    button.classList.remove("button-pressed");
    button.classList.remove("alternate-background-button");
    button.classList.add("button-default");
  });
}
function setPressedButtonColors(object){
  object.classList.remove("button-default");
  object.classList.add("button-pressed");
}
function setStyle() {
  resetButtonColors();
}
function setTotalPower(valueArray){
  let totalPowerValue = valueArray.reduce(sumArray);
  //power is every 15 minutes
  totalPowerValue /= 4000;
  totalPower.textContent = `${totalPowerValue.toFixed(2)} kWh`;
}
async function fetchEnergyData(timeInterval, timeRange){
  let url = `https://clients.hakaienergy.ca/camosun/get_site_energy.php?t=${timeInterval}&r=${timeRange}&f=json`
  url = String(url);
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
async function fetchPowerData(dataUrl){
  const response = await fetch(dataUrl);
  const data = await response.json();
  return data;
}
function formatChartData(rawData) {
  const labels = rawData.map(item => item.measurement_date);
  const values = rawData.map(item => item.value);
  return { labels, values };
}
async function getTotalEnergyProduced(){
  const response = await fetch("https://clients.hakaienergy.ca/camosun/api-update.php?api=systems_summary");
  const rawData = await response.json();
  return rawData.energy_lifetime;
}
async function getMonthlyEnergyProduced(){
  const rawData = await fetchEnergyData("DAY", "-1 month");
  const { labels, values } = formatChartData(rawData);
  const monthlyEnergy = values.reduce(sumArray);
  return monthlyEnergy;
}
async function getDailyEnergyProduced(){
  const response = await fetch("https://clients.hakaienergy.ca/camosun/api-update.php?api=systems_summary");
  const rawData = await response.json();
  return rawData.energy_today;
}
async function getCurrentPower(){
  const response = await fetch("https://clients.hakaienergy.ca/camosun/get_site_power.php?r=latest");
  const rawData = await response.json();
  return rawData[0].value;
}
async function setEnergies(){
  let dailyEnergyAmount = await getDailyEnergyProduced();
  dailyEnergyAmount /= 1000;
  dailyEnergy.textContent = `${dailyEnergyAmount.toFixed(2)} kWh`;
  let monthlyEnergyAmount = await getMonthlyEnergyProduced();
  monthlyEnergyAmount /= 1000;
  monthlyEnergy.textContent = `${monthlyEnergyAmount.toFixed(2)} kWh`;
  let totalEnergyAmount = await getTotalEnergyProduced();
  totalEnergyAmount /= 1000;
  totalEnergy.textContent = `${totalEnergyAmount.toFixed(2)} kWh`;
  let currentPowerAmount = await getCurrentPower();
  currentPowerAmount /= 1000;
  currentPower.textContent = `${currentPowerAmount.toFixed(2)} kW`;
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
    setTotalPower(values);
    powerChartInstance.data.labels = labels;
    powerChartInstance.data.datasets[0].label = `Power Generation (W) - Last ${hours} hours`;
    powerChartInstance.update();
  } else {
    setTotalPower(values);
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
  setStyle();
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  renderEnergyChart("DAY", formattedDailyInterval);
  sliderDecoration();
  renderPowerChart("https://clients.hakaienergy.ca/camosun/get_site_power.php?r=-72 hours",72)
  dailyEnergyButton.classList.remove("inactive-energy-button")
  setEnergies();
}

function getPowerUrl(hourCount){
  const url = `https://clients.hakaienergy.ca/camosun/get_site_power.php?r=-${hourCount} hours`;
  return url;
}
function destroyPopup(){
  document.getElementById("popupA").style.display = "none";
  document.getElementById("popupIFrameA").src = "";
}
chartToggle.onclick = function(){
  slideElement.classList.remove("slideToFirstFrame");
  slideElement.classList.remove("slideToSecondFrame");
  slideElement.classList.add("slideToCharts");
  resetButtonColors();
  setPressedButtonColors(chartToggle);
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
    slideElement.classList.remove("slideToCharts");
    slideElement.classList.add("slideToFirstFrame");
    const newElementIndex = this.getAttribute("data-index");
    resetButtonColors();
    setPressedButtonColors(this);
    const url = this.getAttribute("data-url");
    const title = this.getAttribute("data-title");

    const noCacheUrl = url + (url.includes('?') ? '&' : '?') + 'nocache=' + new Date().getTime();
    document.getElementById("popupIFrameA").src = noCacheUrl;

    document.getElementById("popupA").style.display = "block";
  });
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
document.querySelectorAll("#energyIntervalButtons button").forEach(button =>{
  button.classList.add("inactive-energy-button");
  button.addEventListener("click", () =>{
    document.querySelectorAll("#energyIntervalButtons button").forEach(button =>{
      button.classList.add("inactive-energy-button");
    })
    button.classList.remove("inactive-energy-button");
  })
})
window.addEventListener('resize', () => {
  if (energyChartInstance) {
    energyChartInstance.resize();
  }
  if (powerChartInstance) {
    powerChartInstance.resize();
  }
});
onStart();
