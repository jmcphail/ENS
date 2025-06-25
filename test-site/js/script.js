  // use <script src="jmcphail.github.io/ENS/test-site/js/script.js"></script> in RUNSAM

const output = document.getElementById("output");
output.textContent = "JavaScript is working! Edit js/script.js to get started.";

const energyGenToggle = document.getElementById("energyGenToggle");
const powerGenToggle = document.getElementById("powerGenToggle");
const energyGenElements = document.getElementById("energyChartElements");
const dailyEnergyButton = document.getElementById("dailyEnergyButton");
const weeklyEnergyButton = document.getElementById("weeklyEnergyButton");
const monthlyEnergyButton = document.getElementById("monthlyEnergyButton");
const energyGenLabel = document.getElementById("energyGenLabel");
const powerTimeSlider = document.getElementById("powerTimeSlider");
const powerTimeSliderDisplay = document.getElementById("powerTimeSliderDisplay");

let isVisible = true;
let energyChartInstance = null;
let powerChartInstance = null;
let powerChartTimeout;
const BRIGHTNESSCHANGE = 25;
const DAILYTIMEINTERVAL = "30 days";
const WEEKLYTIMEINTERVAL = "3 months";
const MONTHLYTIMEINTERVAL = "12 months";


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
        maintainAspectRatio: false
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
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
  }
  else{
    console.log(labels);
    console.log(values);
    let ctx = document.getElementById("powerChart").getContext("2d");
    powerChartInstance = new Chart(ctx, {
      type: "line",
      data:{
        labels: labels,
        datasets: [{
          label: `Power Generation (W) - Last ${hours} hours`,
          data: values,
          fill: true,
          borderColor: 'rgb(235, 212, 9)',
          backgroundColor: 'rgb(255, 233, 111)',
          tension: 0.5
        }]
      }
    })
    }
  }

function onStart(){
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  renderEnergyChart("DAY", formattedDailyInterval);
}

function getPowerUrl(hourCount){
  const url = `https://clients.hakaienergy.ca/camosun/get_site_power.php?r=-${hourCount} hours`;
  return url;
}

energyGenToggle.onclick = function(){
  energyChartVisibility();
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
  const hoursNow = powerTimeSlider.value;
  powerTimeSliderDisplay.textContent = `${hoursNow} hrs`;

  clearTimeout(powerChartTimeout);
  powerChartTimeout = setTimeout(() => {
    const hours = hoursNow; 
    const url = getPowerUrl(hours);
    renderPowerChart(url, hours);
  }, 25);
});

onStart();
