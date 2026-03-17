// ===== DOM REFERENCES =====
const $currentStateCelsius = document.querySelector(".weather-state-celcius");
const $currentStateLocation = document.querySelector(".weather-state-location");
const $currentStateIcon = document.querySelector("#weather-state-icon");
const $currentName = document.querySelector(".weather-current-name");
const $conditionText = document.querySelector(".weather-condition-text");
const $feelsLike = document.querySelector(".weather-feelslike");
const $searchForm = document.querySelector("#searchform");
const $searchInput = document.querySelector("#city");
const $map = document.querySelector("#map");
const $windArrow = document.querySelector(".wind-arrow");
const $themeToggle = document.querySelector("#theme-toggle");
const $geoBtn = document.querySelector("#geo-btn");
const $weatherApp = document.querySelector(".weather-app");
const $errorMessage = document.querySelector("#error-message");
const $loadingSpinner = document.querySelector("#loading-spinner");
const $humidity = document.querySelector(".humidity");
const $uv = document.querySelector(".uv");
const $sunset = document.querySelector(".sunset");
const $sunrise = document.querySelector(".sunrise");
const $airPressure = document.querySelector(".air-pressure-value");
const $windSpeed = document.querySelector(".wind-speed");
const $visibility = document.querySelector(".visibility");
const $forecastCards = document.querySelector("#forecast-cards");

// Track Chart.js instance to prevent memory leaks
let chartInstance = null;

// ===== WEATHER-BASED ACCENT COLORS =====
function setWeatherTheme(conditionText) {
  const text = conditionText.toLowerCase();
  let accent, glow;

  if (text.includes("sunny") || text.includes("clear")) {
    accent = "#FFB347";
    glow = "rgba(255, 179, 71, 0.15)";
  } else if (text.includes("cloud") || text.includes("overcast")) {
    accent = "#90CAF9";
    glow = "rgba(144, 202, 249, 0.15)";
  } else if (text.includes("rain") || text.includes("drizzle")) {
    accent = "#4FC3F7";
    glow = "rgba(79, 195, 247, 0.15)";
  } else if (text.includes("snow") || text.includes("blizzard")) {
    accent = "#E3F2FD";
    glow = "rgba(227, 242, 253, 0.2)";
  } else if (text.includes("storm") || text.includes("thunder")) {
    accent = "#CE93D8";
    glow = "rgba(206, 147, 216, 0.15)";
  } else if (text.includes("fog") || text.includes("mist")) {
    accent = "#B0BEC5";
    glow = "rgba(176, 190, 197, 0.15)";
  } else {
    accent = "#4FC3F7";
    glow = "rgba(79, 195, 247, 0.15)";
  }

  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-glow", glow);
}

// ===== UI HELPERS =====
const showError = (message) => {
  $errorMessage.textContent = message;
  $errorMessage.classList.add("visible");
  setTimeout(() => {
    $errorMessage.classList.remove("visible");
  }, 5000);
};

const showLoading = () => {
  $loadingSpinner.classList.add("visible");
};

const hideLoading = () => {
  $loadingSpinner.classList.remove("visible");
};

// ===== DATE FORMATTING =====
const formatDate = (localtimeStr) => {
  const date = new Date(localtimeStr);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return {
    time: `${hour12}:${minutes} ${ampm}`,
    date: `${dayName}, ${monthName} ${dayNum}`,
  };
};

const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

// ===== RENDER WEATHER DATA =====
const renderData = (data) => {
  // Dynamic accent color based on condition
  setWeatherTheme(data.current.condition.text);

  // Hero section
  $currentStateCelsius.innerText = data.current.temp_c + "°";
  $currentStateLocation.innerText = `${data.location.name}, ${data.location.country}`;
  $currentStateIcon.src = "https:" + data.current.condition.icon;
  $currentStateIcon.alt = data.current.condition.text;
  $conditionText.innerText = data.current.condition.text;

  // Date
  const formatted = formatDate(data.location.localtime);
  $currentName.innerText = formatted.date;

  // Hero pills — include icon HTML + value
  $feelsLike.innerHTML = `<i class="bi bi-thermometer-half"></i> ${data.current.feelslike_c}°`;
  $windSpeed.innerHTML = `<i class="bi bi-wind"></i> ${data.current.wind_kph} km/h`;
  $humidity.innerHTML = `<i class="bi bi-droplet-half"></i> ${data.current.humidity}%`;

  // Detail cards
  $uv.innerText = data.current.uv + " / 10";
  $airPressure.innerText = data.current.pressure_mb + " hPa";
  $visibility.innerText = data.current.vis_km + " km";
  $sunset.innerText = data.forecast.forecastday[0].astro.sunset;
  $sunrise.innerText = data.forecast.forecastday[0].astro.sunrise;

  // Map
  $map.src = `https://maps.google.com/maps?q=${encodeURIComponent(data.location.name)}&t=&z=12&output=embed`;

  // Wind compass (hidden element, keeps data)
  $windArrow.style.transform = `rotate(${data.current.wind_degree}deg)`;

  renderChart(data);
  renderForecast(data);
};

// ===== CHART =====
const renderChart = (data) => {
  const hours = data.forecast.forecastday[0].hour.map(
    (h) => h.time.split(" ")[1]
  );
  const temps = data.forecast.forecastday[0].hour.map((h) => h.temp_c);

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = document.getElementById("myChart");

  // Get current accent color for the chart line
  const accent =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim() || "#4FC3F7";
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--text-muted")
      .trim() || "rgba(255,255,255,0.25)";
  const gridColor = "rgba(255, 255, 255, 0.04)";

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [
        {
          data: temps,
          borderColor: accent,
          borderWidth: 2,
          pointBackgroundColor: accent,
          pointRadius: 2,
          pointHoverRadius: 5,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "transparent";
            const gradient = c.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom
            );
            gradient.addColorStop(0, accent + "33");
            gradient.addColorStop(1, "transparent");
            return gradient;
          },
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: "easeOutQuart",
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.7)",
          titleFont: { family: "DM Sans", size: 12 },
          bodyFont: { family: "DM Sans", size: 14, weight: "500" },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.parsed.y}°C`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            font: { family: "DM Sans", size: 11 },
            color: textColor,
            maxTicksLimit: 12,
          },
          border: { display: false },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            font: { family: "DM Sans", size: 11 },
            color: textColor,
          },
          border: { display: false },
        },
      },
    },
  });
};

// ===== FORECAST =====
const renderForecast = (data) => {
  const days = data.forecast.forecastday;
  $forecastCards.innerHTML = "";

  days.forEach((day, index) => {
    const dayName = index === 0 ? "Today" : getDayName(day.date);
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <p class="forecast-day">${dayName}</p>
      <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" />
      <p class="forecast-condition">${day.day.condition.text}</p>
      <div class="forecast-temps">
        <span class="forecast-high">${Math.round(day.day.maxtemp_c)}°</span>
        <span class="forecast-low">${Math.round(day.day.mintemp_c)}°</span>
      </div>
    `;
    $forecastCards.appendChild(card);
  });
};

// ===== API CALL =====
const isLocalhost = !location.hostname.includes(".vercel.app");

const loadWeatherData = async (city) => {
  showLoading();
  $errorMessage.classList.remove("visible");

  try {
    const weatherUrl = isLocalhost
      ? `https://api.weatherapi.com/v1/forecast.json?key=${CONFIG.API_KEY}&q=${encodeURIComponent(city)}&days=7&aqi=no&alerts=no`
      : `/api/weather?q=${encodeURIComponent(city)}&days=7`;

    const response = await fetch(weatherUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message =
        errorData?.error?.message ||
        "City not found. Please try another search.";
      showError(message);
      hideLoading();
      return;
    }

    const data = await response.json();
    renderData(data);
  } catch (error) {
    showError("Network error. Please check your connection and try again.");
  } finally {
    hideLoading();
  }
};

// ===== GEOLOCATION =====
const loadByGeolocation = () => {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      loadWeatherData(`${latitude},${longitude}`);
    },
    () => {
      showError("Location access denied. Please search manually.");
    }
  );
};

// ===== THEME =====
const toggleTheme = () => {
  const current = $weatherApp.getAttribute("theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("theme", next);
  $weatherApp.setAttribute("theme", next);
};

const applyTheme = () => {
  const saved = localStorage.getItem("theme") || "dark";
  $weatherApp.setAttribute("theme", saved);
};

// ===== SEARCH =====
const searchCityWeather = (e) => {
  e.preventDefault();
  const city = $searchInput.value.trim();
  if (!city) {
    showError("Please enter a city name.");
    return;
  }
  loadWeatherData(city);
};

// ===== INIT =====
applyTheme();
loadWeatherData("Tashkent");

$searchForm.addEventListener("submit", searchCityWeather);
$themeToggle.addEventListener("click", toggleTheme);
$geoBtn.addEventListener("click", loadByGeolocation);
