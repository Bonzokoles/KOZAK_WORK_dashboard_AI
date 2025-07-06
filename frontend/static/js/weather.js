// weather.js - Enhanced with movie quotes and graphics
class WeatherWidget {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentCity = "Warsaw";
    this.weatherData = null;
    this.updateInterval = 300000; // 5 minutes
    this.refreshTimer = null;

    this.init();
  }

  init() {
    this.createWeatherHTML();
    this.setupEventListeners();
    this.loadWeatherData();
    this.startAutoRefresh();
  }

  createWeatherHTML() {
    this.container.innerHTML = `
            <div class="weather-widget">
                <div class="weather-header">
                    <h3>🌦️ Pogoda</h3>
                    <div class="weather-controls">
                        <input type="text" id="city-input" placeholder="Wprowadź miasto..." />
                        <button id="search-weather" class="weather-btn">
                            <i class="fas fa-search"></i>
                        </button>
                        <button id="refresh-weather" class="weather-btn">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>

                <div class="weather-content">
                    <div class="weather-loading" id="weather-loading">
                        <div class="loading-spinner"></div>
                        <p>Ładowanie danych pogodowych...</p>
                    </div>

                    <div class="weather-display" id="weather-display" style="display: none;">
                        <div class="weather-main">
                            <div class="weather-icon-container">
                                <div class="weather-icon" id="weather-icon">🌍</div>
                                <div class="weather-animation" id="weather-animation"></div>
                            </div>

                            <div class="weather-info">
                                <div class="weather-location" id="weather-location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>Lokalizacja</span>
                                </div>
                                <div class="weather-temperature" id="weather-temperature">--°C</div>
                                <div class="weather-description" id="weather-description">Ładowanie...</div>
                            </div>
                        </div>

                        <div class="weather-details">
                            <div class="weather-detail">
                                <i class="fas fa-thermometer-half"></i>
                                <span>Odczuwalna</span>
                                <span id="feels-like">--°C</span>
                            </div>
                            <div class="weather-detail">
                                <i class="fas fa-tint"></i>
                                <span>Wilgotność</span>
                                <span id="humidity">--%</span>
                            </div>
                            <div class="weather-detail">
                                <i class="fas fa-wind"></i>
                                <span>Wiatr</span>
                                <span id="wind-speed">-- m/s</span>
                            </div>
                            <div class="weather-detail">
                                <i class="fas fa-eye"></i>
                                <span>Widoczność</span>
                                <span id="visibility">-- km</span>
                            </div>
                        </div>

                        <div class="weather-sun-times">
                            <div class="sun-time">
                                <i class="fas fa-sun sunrise"></i>
                                <span>Wschód</span>
                                <span id="sunrise">--:--</span>
                            </div>
                            <div class="sun-time">
                                <i class="fas fa-sun sunset"></i>
                                <span>Zachód</span>
                                <span id="sunset">--:--</span>
                            </div>
                        </div>

                        <div class="movie-quote-section">
                            <div class="movie-quote" id="movie-quote">
                                <i class="fas fa-quote-left"></i>
                                <p class="quote-text" id="quote-text">Ładowanie cytatu...</p>
                                <div class="quote-attribution">
                                    <span id="quote-character">Character</span>,
                                    <span id="quote-movie">Movie</span>
                                    (<span id="quote-year">Year</span>)
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="weather-error" id="weather-error" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Nie udało się pobrać danych pogodowych</p>
                        <button id="retry-weather" class="weather-btn">Spróbuj ponownie</button>
                    </div>
                </div>

                <div class="weather-footer">
                    <span class="weather-timestamp" id="weather-timestamp">
                        Ostatnia aktualizacja: --:--
                    </span>
                </div>
            </div>
        `;
  }

  setupEventListeners() {
    const searchBtn = document.getElementById("search-weather");
    const refreshBtn = document.getElementById("refresh-weather");
    const retryBtn = document.getElementById("retry-weather");
    const cityInput = document.getElementById("city-input");

    searchBtn.addEventListener("click", () => this.searchWeather());
    refreshBtn.addEventListener("click", () => this.refreshWeather());
    retryBtn.addEventListener("click", () => this.loadWeatherData());

    cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.searchWeather();
      }
    });

    // Click on quote to get new random quote
    document.getElementById("movie-quote").addEventListener("click", () => {
      this.getRandomQuote();
    });
  }

  async loadWeatherData(city = null) {
    const targetCity = city || this.currentCity;

    this.showLoading();

    try {
      const response = await fetch(
        `/api/weather/${encodeURIComponent(targetCity)}`
      );
      const data = await response.json();

      if (data.success) {
        this.weatherData = data;
        this.currentCity = targetCity;
        this.displayWeatherData(data);
        this.hideError();
      } else {
        throw new Error(data.error || "Nieznany błąd");
      }
    } catch (error) {
      console.error("Weather load error:", error);
      this.showError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  displayWeatherData(data) {
    const { weather, graphics, movie_quote } = data;

    // Update main weather info
    document.getElementById("weather-location").innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${weather.city}, ${weather.country}</span>
        `;

    document.getElementById(
      "weather-temperature"
    ).textContent = `${weather.temperature}°C`;
    document.getElementById("weather-description").textContent =
      weather.description;

    // Update weather icon and animation
    const iconElement = document.getElementById("weather-icon");
    const animationElement = document.getElementById("weather-animation");

    iconElement.textContent = graphics.icon;
    iconElement.style.color = graphics.color;

    // Apply weather animation
    this.applyWeatherAnimation(
      animationElement,
      graphics.animation,
      graphics.gradient
    );

    // Update details
    document.getElementById(
      "feels-like"
    ).textContent = `${weather.feels_like}°C`;
    document.getElementById("humidity").textContent = `${weather.humidity}%`;
    document.getElementById(
      "wind-speed"
    ).textContent = `${weather.wind_speed} m/s`;
    document.getElementById("visibility").textContent = `${(
      weather.visibility / 1000
    ).toFixed(1)} km`;

    // Update sun times
    document.getElementById("sunrise").textContent = weather.sunrise;
    document.getElementById("sunset").textContent = weather.sunset;

    // Update movie quote
    this.displayMovieQuote(movie_quote);

    // Update timestamp
    const now = new Date();
    document.getElementById(
      "weather-timestamp"
    ).textContent = `Ostatnia aktualizacja: ${now.toLocaleTimeString("pl-PL")}`;

    // Show weather display
    document.getElementById("weather-display").style.display = "block";
  }

  displayMovieQuote(quote) {
    document.getElementById("quote-text").textContent = quote.quote;
    document.getElementById("quote-character").textContent = quote.character;
    document.getElementById("quote-movie").textContent = quote.movie;
    document.getElementById("quote-year").textContent = quote.year;

    // Add quote animation
    const quoteElement = document.getElementById("movie-quote");
    quoteElement.classList.add("quote-fade-in");
    setTimeout(() => {
      quoteElement.classList.remove("quote-fade-in");
    }, 1000);
  }

  applyWeatherAnimation(element, animationType, gradient) {
    // Clear previous animations
    element.className = "weather-animation";
    element.innerHTML = "";

    // Apply gradient background
    if (gradient && gradient.length >= 2) {
      element.style.background = `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;
    }

    switch (animationType) {
      case "rain":
        this.createRainAnimation(element);
        break;
      case "snow":
        this.createSnowAnimation(element);
        break;
      case "thunder":
        this.createThunderAnimation(element);
        break;
      case "fog":
        this.createFogAnimation(element);
        break;
      case "pulse":
        element.classList.add("pulse-animation");
        break;
      case "float":
        element.classList.add("float-animation");
        break;
      default:
        element.classList.add("default-animation");
    }
  }

  createRainAnimation(element) {
    element.classList.add("rain-animation");
    for (let i = 0; i < 20; i++) {
      const drop = document.createElement("div");
      drop.className = "rain-drop";
      drop.style.left = Math.random() * 100 + "%";
      drop.style.animationDelay = Math.random() * 2 + "s";
      drop.style.animationDuration = Math.random() * 1 + 0.5 + "s";
      element.appendChild(drop);
    }
  }

  createSnowAnimation(element) {
    element.classList.add("snow-animation");
    for (let i = 0; i < 15; i++) {
      const flake = document.createElement("div");
      flake.className = "snow-flake";
      flake.innerHTML = "❄";
      flake.style.left = Math.random() * 100 + "%";
      flake.style.animationDelay = Math.random() * 3 + "s";
      flake.style.animationDuration = Math.random() * 2 + 2 + "s";
      element.appendChild(flake);
    }
  }

  createThunderAnimation(element) {
    element.classList.add("thunder-animation");
    const lightning = document.createElement("div");
    lightning.className = "lightning-flash";
    element.appendChild(lightning);
  }

  createFogAnimation(element) {
    element.classList.add("fog-animation");
    for (let i = 0; i < 5; i++) {
      const fog = document.createElement("div");
      fog.className = "fog-cloud";
      fog.style.left = i * 20 + "%";
      fog.style.animationDelay = i * 0.5 + "s";
      element.appendChild(fog);
    }
  }

  showLoading() {
    document.getElementById("weather-loading").style.display = "block";
    document.getElementById("weather-display").style.display = "none";
    document.getElementById("weather-error").style.display = "none";
  }

  hideLoading() {
    document.getElementById("weather-loading").style.display = "none";
  }

  showError(message) {
    const errorElement = document.getElementById("weather-error");
    errorElement.querySelector("p").textContent =
      message || "Nie udało się pobrać danych pogodowych";
    errorElement.style.display = "block";
    document.getElementById("weather-display").style.display = "none";
  }

  hideError() {
    document.getElementById("weather-error").style.display = "none";
  }

  searchWeather() {
    const cityInput = document.getElementById("city-input");
    const city = cityInput.value.trim();
    if (city) {
      this.loadWeatherData(city);
      cityInput.value = "";
    }
  }

  refreshWeather() {
    this.loadWeatherData(this.currentCity);
  }

  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.refreshTimer = setInterval(
      () => this.refreshWeather(),
      this.updateInterval
    );
  }

  async getRandomQuote() {
    try {
      const condition = this.weatherData
        ? this.weatherData.graphics.condition
        : null;
      const url = condition
        ? `/api/weather/quote/${condition}`
        : "/api/weather/quote";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        this.displayMovieQuote(data.quote);
      }
    } catch (error) {
      console.error("Failed to get new quote:", error);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("weather-widget-container")) {
    new WeatherWidget("weather-widget-container");
  }
});
