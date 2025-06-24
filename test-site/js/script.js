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
async function fetchEnergyData() {
      const response = await fetch("https://clients.hakaienergy.ca/camosun/get_site_energy.php?t=DAY&r=-30%20days&f=json");
      const data = await response.json();
      return data;
    }

    function formatChartData(rawData) {
      const labels = rawData.map(item => item.measurement_date);
      const values = rawData.map(item => item.value);
      return { labels, values };
    }

    async function renderChart() {
      const rawData = await fetchEnergyData();
      const { labels, values } = formatChartData(rawData);

      const ctx = document.getElementById("energyChart").getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Daily Energy (Wh)",
            data: values,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
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

renderChart();
energyGenToggle.onclick = function(){
  energyChartVisibility();
}