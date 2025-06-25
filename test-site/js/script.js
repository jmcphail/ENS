// use <script src="jmcphail.github.io/ENS/test-site/js/script.js"></script> in RUNSAM




document.addEventListener("DOMContentLoaded", function () {
  const output = document.getElementById("output");
  output.textContent = "JavaScript is working! Edit js/script.js to get started.";
});

const energyGenToggle = document.getElementById("energyGenToggle");
const powerGenToggle = document.getElementById("powerGenToggle");
const energyGenElements = document.getElementById("energyChartElements");
const dailyEnergyButton = document.getElementById("dailyEnergyButton");
const weeklyEnergyButton = document.getElementById("weeklyEnergyButton");
const monthlyEnergyButton = document.getElementById("monthlyEnergyButton");
const energyGenLabel = document.getElementById("energyGenLabel");

let isVisible = true;
let energyChartInstance = null;
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
function formatChartData(rawData) {
  const labels = rawData.map(item => item.measurement_date);
  const values = rawData.map(item => item.value);
  return { labels, values };
}
async function renderChart(timeInterval, timeRange) {
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
function onStart(){
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  renderChart("DAY", formattedDailyInterval);
}
energyGenToggle.onclick = function(){
  energyChartVisibility();
}

dailyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  renderChart("DAY", formattedDailyInterval);
  energyGenLabel.textContent = "Daily Energy Generation for last " + DAILYTIMEINTERVAL;
}
weeklyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedWeeklyInterval = `-${WEEKLYTIMEINTERVAL}`;
  renderChart("WEEK", formattedWeeklyInterval);
  energyGenLabel.textContent = "Weekly Energy Generation for last " + WEEKLYTIMEINTERVAL;
}
monthlyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedMonthlyInterval = `-${MONTHLYTIMEINTERVAL}`;
  renderChart("MONTH", formattedMonthlyInterval);
  energyGenLabel.textContent = "Monthly Energy Generation for last " + MONTHLYTIMEINTERVAL;
}

onStart();