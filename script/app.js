const $currentStateCelsius = document.querySelector(".weather-state-celcius");
const $currentStateLocation = document.querySelector(".weather-state-location");
const $currentStateIcon = document.querySelector("#weather-state-icon");
const $currentTime = document.querySelector(".weather-current-time");
const $searchForm = document.querySelector("#searchform");
const $searchInput = document.querySelector("#city");
const $map = document.querySelector("#map");
const $windArrow = document.querySelector(".wind-arrow");
const $themeToggle = document.querySelector("#theme-toggle");
const $weatherApp = document.querySelector(".weather-app");

const renderData = (data) => {
  $currentStateCelsius.innerText = data.current.temp_c + "°";
  $currentStateLocation.innerText = `${data.location.name}, ${data.location.country}`;
  $currentStateIcon.src = "https:" + data.current.condition.icon;
  $currentTime.innerText = data.forecast.forecastday[0].astro.sunset;
  $map.src = `https://maps.google.com/maps?q=${data.location.name}%20Dates%10Products&amp;t=&amp;z=12&amp&output=embed`;
  $windArrow.style.transform = `rotate(${data.current.wind_degree}deg)`;
  renderChart(data);
};

const renderChart = (data) => {
  let delayed;
  const hours = data.forecast.forecastday[0].hour.map(
    (hourChange) => hourChange.time.split(" ")[1]
  );
  const temps = data.forecast.forecastday[0].hour.map(
    (hourChange) => hourChange.temp_c
  );
  document.querySelector(".chart-wrapper").innerHTML =
    '<canvas id="myChart"></canvas>';
  const ctx = document.getElementById("myChart");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [
        {
          label: `Weather data for ${data.location.name}`,
          data: temps,
          borderColor: "blueviolet",
          borderWidth: 3,
          backgroundColor: "#fff",
        },
      ],
    },
    options: {
      animation: {
        onComplete: () => {
          delayed = true;
        },
        delay: (context) => {
          let delay = 0;
          if (
            context.type === "data" &&
            context.mode === "default" &&
            !delayed
          ) {
            delay = context.dataIndex * 300 + context.datasetIndex * 100;
          }
          return delay;
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 16,
            },
          },
        },
        y: {
          beginAtZero: false,
        },
      },
    },
  });
};

const loadWeatherData = async (city) => {
  const response = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=644f6ce0ca9e401ebb891832211707&q=${city}&days=7&aqi=yes&alerts=yes`
  );
  const data = await response.json();
  renderData(data);
};

loadWeatherData("Tashkent");

const searchCityWeather = (e) => {
  e.preventDefault();

  loadWeatherData($searchInput.value);
};

const changeTheme = () => {
  if ($themeToggle.checked) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
  checkTheme();
};

const checkTheme = () => {
  const currentThemeState = localStorage.getItem("theme");
  console.log(currentThemeState);
  if (currentThemeState === "light") {
    $weatherApp.setAttribute("theme", "light");
    $themeToggle.checked = false;
  } else {
    $weatherApp.setAttribute("theme", "dark");
    $themeToggle.checked = true;
  }
};

checkTheme();

$searchForm.addEventListener("submit", searchCityWeather);
$themeToggle.addEventListener("change", changeTheme);
