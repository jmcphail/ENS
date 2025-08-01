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

let isTransitioning = false;
let  noCacheUrl = "";
let currentElementIndex = 0;
let energyChartInstance = null;
let powerChartInstance = null;
let powerChartTimeout;
const BRIGHTNESSCHANGE = 25;
// the range of each time interval (for example when daily energy is being displayed, it will display 30 different days in the chart)
const DAILYTIMEINTERVAL = "30 days";
const WEEKLYTIMEINTERVAL = "3 months";
const MONTHLYTIMEINTERVAL = "12 months";
// Time in ms that the slide animation inside of css takes + 100ms, see the css class towards the bottom with each slide animation for the value
const animationTime = 1600;

// Adds the inactive-energy-button class to each energy interval button
document.querySelectorAll("#energyIntervalButtons button").forEach(button =>{
  button.classList.add("inactive-energy-button");
  // Whenever one of the energy interval buttons are pressed, adds the inactive-energy-button class to each energy interval button and then removes the inactive-energy-button class from the selected button (the default values of each button are the green colours)
  button.addEventListener("click", () =>{
    document.querySelectorAll("#energyIntervalButtons button").forEach(button =>{
      button.classList.add("inactive-energy-button");
    })
    button.classList.remove("inactive-energy-button");
  })
})
// Calculates the avoided CO2 emissions from an energy value in kWh
function getCO2(energy){
  const CO2 = energy * 9.9e-6;
  return CO2;
}
// Calculates the amount of smartphones charged from an energy value in kWh
function getSmartphonesCharged(energy){
  const smartphones = (energy/0.019).toFixed(0);
  return smartphones;
}
// calculates the amount of "tree lifetimes" that the energy value in kWh avoids in CO2 emissions
function getTreeCount(energy){
  const CO2 = getCO2(energy);
  const trees = (CO2/0.06).toFixed(0);
  return trees;
}
// calculates the gallons of gasoline that the energy value in kWh avoids in CO2 emissions
function getGasolineGallons(energy){
  const CO2 = getCO2(energy);
  const gasolineLiters = CO2/0.002347;
  const gasolineGallons = gasolineLiters/3.785;
  return gasolineGallons.toFixed(2);
}
// a function used with the reduce method to return the sum of all elements in an array
function sumArray(accumulator, element){
  return accumulator + element;
}
// a function used with the reduce method to return the largest value in an array
function getLargest(previous, next){
    return Math.max(previous, next);
}
// compares each energy value in the data array with the largest value in the data array
// larger values become a darker green colour, smaller values become a lighter green colour
// returns an array of strings that represent the hsl colour codes for each data entry
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
// clears all css transformations (used to avoid conflicting transformations)
function clearTransforms(element){
  const classes = [
    "firstFramePos",
    "secondFramePos",
    "slideToCharts",
    "slide-right-iframe",
    "slide-left-iframe",
    "slide-right-chart",
    "slide-left-chart"
  ];
  classes.forEach(cls => slideElement.classList.remove(cls));

  // Trigger reflow to allow re-adding same class for repeated animations
  void slideElement.offsetWidth;
}
// resets all buttons on the main button row to the button-default class (white background with gray colour when hovered)
function resetButtonColors(){
  document.querySelectorAll("#buttonRow button").forEach(button => {
    button.classList.remove("button-pressed");
    button.classList.add("button-default");
  });
}
// gives the given object the button-pressed class (green background, white text, green shadow when hovered)
function setPressedButtonColors(object){
  object.classList.remove("button-default");
  object.classList.add("button-pressed");
}
// sets all elements to the correct styles on file start
function setStyle() {
  resetButtonColors();
  setPressedButtonColors(chartToggle);
  dailyEnergyButton.classList.remove("inactive-energy-button")
}
// gets the total energy throughout the entire interval of the power chart (divided by 1000 to go W to kW) (divided by 4 to go 15 minutes to 1 hr)
function setTotalPowerChartEnergy(valueArray){
  let totalPowerValue = valueArray.reduce(sumArray);
  totalPowerValue /= 4000;
  totalPower.textContent = `${totalPowerValue.toFixed(2)} kWh`;
}
// fetches energy data from API for time interval ("DAY", "WEEK", or "MONTH") within time range ("-1 month", "-18 days", etc...)
// returns array of objects {measurement_date: "2025-07-02", value: 249353} value is in Wh
async function fetchEnergyData(timeInterval, timeRange){
  let url = `https://clients.hakaienergy.ca/camosun/get_site_energy.php?t=${timeInterval}&r=${timeRange}&f=json`
  url = String(url);
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
// fetches the power data based on the power data url
// returns array of objects {measurement_date: '2025-07-29 10:30:00', value: 21272} value is in W
async function fetchPowerData(dataUrl){
  const response = await fetch(dataUrl);
  const data = await response.json();
  console.log(data);
  return data;
}
// creates labels out of the measurement dates in the array objects and values out of the values in the array objects
function formatChartData(rawData) {
  const labels = rawData.map(item => item.measurement_date);
  const values = rawData.map(item => item.value);
  return { labels, values };
}
// returns the total energy produced from the systems summary API
async function getTotalEnergyProduced(){
  const response = await fetch("https://clients.hakaienergy.ca/camosun/api-update.php?api=systems_summary");
  const rawData = await response.json();
  return rawData.energy_lifetime;
}
// returns the monthly energy produced by fetching the daily energy data for the last month and then summing it all
async function getMonthlyEnergyProduced(){
  const rawData = await fetchEnergyData("DAY", "-1 month");
  const { labels, values } = formatChartData(rawData);
  const monthlyEnergy = values.reduce(sumArray);
  return monthlyEnergy;
}
// returns the daily energy produced from the systems summary API
async function getDailyEnergyProduced(){
  const response = await fetch("https://clients.hakaienergy.ca/camosun/api-update.php?api=systems_summary");
  const rawData = await response.json();
  return rawData.energy_today;
}
// returns the most recently measured power value from the site power API
async function getCurrentPower(){
  const response = await fetch("https://clients.hakaienergy.ca/camosun/get_site_power.php?r=latest");
  const rawData = await response.json();
  return rawData[0].value;
}
// sets all energy and power values
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
// determines the time interval and sets it as a label (daily energy, weekly energy etc...)
// fetches the energy data and creates a chart that has labels of the measurement dates, values of the energy values during their respective intervals, and colours based on energy production (more production = darker green)
// renders a chartJS chart to display all of the information
async function renderEnergyChart(timeInterval, timeRange) {
  switch(timeInterval){
    case "DAY":
      lowerCaseTimeInterval = "Daily";
      break;
    case "WEEK":
      lowerCaseTimeInterval = "Weekly";
      break;
    case "MONTH":
      lowerCaseTimeInterval = "Monthly";
      break;
  };
  const rawData = await fetchEnergyData(timeInterval, timeRange);
  const { labels, values } = formatChartData(rawData);

  const ctx = document.getElementById("energyChart").getContext("2d");
  energyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: `${lowerCaseTimeInterval} Energy (Wh)`,
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
// creates a url based on the amount of hours of data that will be shown on the chart
// creates labels of the time values every 15 minutes
// creates values from the power values every 15 minutes
// updates the power chart if one exists and creates a new one if not
// adjusts the total energy value when interval changes
async function renderPowerChart(hours){
  const dataUrl = `https://clients.hakaienergy.ca/camosun/get_site_power.php?r=-${hours} hours`;
  const rawData = await fetchPowerData(dataUrl);
  const { labels, values } = formatChartData(rawData);

  if (powerChartInstance) {
    powerChartInstance.data.datasets[0].data = values;
    setTotalPowerChartEnergy(values);
    powerChartInstance.data.labels = labels;
    powerChartInstance.data.datasets[0].label = `Power Generation (W) - Last ${hours} hours`;
    powerChartInstance.update();
  } else {
    setTotalPowerChartEnergy(values);
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
// sets all charts and buttons to default values when website is loaded
async function onStart(){
  setStyle();
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  renderEnergyChart("DAY", formattedDailyInterval);
  sliderDecoration();
  renderPowerChart(72);
  setEnergies();
}
// when home button is pressed, slide bottom part of the website to the charts page if any other page is currently displayed
// sets the home button to be green and all other buttons to be white
chartToggle.onclick = function(){
  if(isTransitioning) return;
  clearTransforms(slideElement);

  if(currentElementIndex != 0){
    console.log("returning to chart");
    slideElement.classList.add("firstFramePos");  
    slideElement.classList.add("slide-left-chart"); 
    isTransitioning= true;
    setTimeout(() =>{isTransitioning = false}, animationTime)
  }
  resetButtonColors();
  setPressedButtonColors(chartToggle);
  currentElementIndex = 0;
}
// destroys the energy chart if one exists and then renders a new one that displays information for each day during the DAILYTIMEINTERVAL interval
// sets text content to show the total interval for which the daily energy data is displayed
dailyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedDailyInterval = `-${DAILYTIMEINTERVAL}`;
  renderEnergyChart("DAY", formattedDailyInterval);
  energyGenLabel.textContent = "Daily Energy Generation for last " + DAILYTIMEINTERVAL;
}
// destroys the energy chart if one exists and then renders a new one that displays information for each week during the WEEKLYTIMEINTERVAL interval
// sets text content to show the total interval for which the weekly energy data is displayed
weeklyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedWeeklyInterval = `-${WEEKLYTIMEINTERVAL}`;
  renderEnergyChart("WEEK", formattedWeeklyInterval);
  energyGenLabel.textContent = "Weekly Energy Generation for last " + WEEKLYTIMEINTERVAL;
}
// destroys the energy chart if one exists and then renders a new one that displays information for each month during the MONTHLYTIMEINTERVAL interval
// sets text content to show the total interval for which the monthly energy data is displayed
monthlyEnergyButton.onclick = function(){
  if(energyChartInstance){
    energyChartInstance.destroy();
  }
  const formattedMonthlyInterval = `-${MONTHLYTIMEINTERVAL}`;
  renderEnergyChart("MONTH", formattedMonthlyInterval);
  energyGenLabel.textContent = "Monthly Energy Generation for last " + MONTHLYTIMEINTERVAL;
}
// activataes whenever the power slider is adjusted
// moves the yellow trail to match the current location of the moving circle
// adjusts the text above to display the amount of hours that are selected
// sets the power chart to display the amount of hours that the slider is set to
powerTimeSlider.addEventListener('input', () => {
  sliderDecoration();
  const hours = powerTimeSlider.value;
  powerTimeSliderDisplay.textContent = `${hours} hrs`;

  clearTimeout(powerChartTimeout);
  powerChartTimeout = setTimeout(() => {
    renderPowerChart(hours);
  }, 25);
});
// activates whenever any of the iframe buttons are pressed (all buttons except for home button)
// the buttons do not do anything if the screen is currently sliding
// sets pressed button colours to green and all other buttons to white
// gets the url of the selected page (found in the html of each button) 
// if the index of the previous button is 0 (was on the home page), then the animation slides left (moving right) towards the left side iframe
// gets the element index of the previous button and the element index of the currently pressed button (based on the button location goes from 0 for home button to 6 for online survey)
// if the index of the button you just pressed is larger than the index of the previous button (the pressed button is to the right), then the animation teleports to the left iframe and then slides left (moving right) to the right iframe
// if the index of the button you just pressed is smaller than the index of the previous button (the pressed button is to the left), then the animation teleports to the right iframe and then slides right (moving left) to the left iframe
// in the middle of the slide (once the iframe that was teleported to is no longer visible), sets both iframes to the url of the button
document.querySelectorAll(".linkButton").forEach(button => {
  button.addEventListener("click", function () {
    if(isTransitioning){
      return;
    }
    resetButtonColors();
    setPressedButtonColors(this);
    const url = this.getAttribute("data-url");
    noCacheUrl = url + (url.includes('?') ? '&' : '?') + 'nocache=' + new Date().getTime();
    const newElementIndex = parseInt(this.getAttribute("data-index"), 10);
    if(currentElementIndex == 0){
      document.getElementById("popupIFrameA").src = noCacheUrl;
      clearTransforms(slideElement);
      slideElement.classList.add("slide-right-chart");
    }
    else if(newElementIndex > currentElementIndex){
      clearTransforms(slideElement);
      document.getElementById("popupIFrameB").src = noCacheUrl;
      console.log("element is to the right");
      slideElement.classList.add("firstFramePos");     
      slideElement.classList.add("slide-right-iframe");
    }
    else if(newElementIndex < currentElementIndex){
      clearTransforms(slideElement);
      document.getElementById("popupIFrameA").src = noCacheUrl;
      console.log("element is to the left");
      slideElement.classList.add("secondFramePos");
      slideElement.classList.add("slide-left-iframe")
    }
    isTransitioning = true;
    sliderTimeout = setTimeout(onSlideTransitionEnd, animationTime);
    currentElementIndex = newElementIndex;
  });
});
//sets the url of the other iframe to be the same as the current iframe
function onSlideTransitionEnd() {
  if (slideElement.classList.contains("slide-right-iframe")) {
    document.getElementById("popupIFrameA").src = noCacheUrl;
  } else {
    document.getElementById("popupIFrameB").src = noCacheUrl;
  }
  isTransitioning = false;
}
//sets the orange trail of the slider to go from the far left to the current location of the slider handle
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
// whenever the window is resized, resize both charts to match
window.addEventListener('resize', () => {
  if (energyChartInstance) {
    energyChartInstance.resize();
  }
  if (powerChartInstance) {
    powerChartInstance.resize();
  }
});

onStart();
