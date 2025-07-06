/**
 * @class WeatherWidget
 * A component to display weather information and a related movie quote.
 */
export class WeatherWidget {
    // Constants for configuration and selectors
    static DEFAULTS = {
        CITY: "Warsaw",
        UPDATE_INTERVAL_MS: 300000, // 5 minutes
    };

    static SELECTORS = {
        container: null, // Set in constructor
        cityInput: "#city-input",
        searchButton: "#search-weather",
        refreshButton: "#refresh-weather",
        retryButton: "#retry-weather",
        quoteContainer: "#movie-quote",
        loadingIndicator: "#weather-loading",
        displaySection: "#weather-display",
        errorSection: "#weather-error",
        errorMessage: "#weather-error p",
        location: "#weather-location",
        temperature: "#weather-temperature",
        description: "#weather-description",
        icon: "#weather-icon",
        feelsLike: "#feels-like",
        humidity: "#humidity",
        windSpeed: "#wind-speed",
        visibility: "#visibility",
        sunrise: "#sunrise",
        sunset: "#sunset",
        timestamp: "#weather-timestamp",
        quoteText: "#quote-text",
        quoteCharacter: "#quote-character",
        quoteMovie: "#quote-movie",
        quoteYear: "#quote-year",
    };

    /**
     * @param {string} containerId The ID of the DOM element to contain the widget.
     */
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`WeatherWidget: Container with ID "${containerId}" not found.`);
        }
        WeatherWidget.SELECTORS.container = `#${containerId}`;

        this.state = {
            currentCity: WeatherWidget.DEFAULTS.CITY,
            weatherData: null,
            error: null,
        };

        this.elements = {};
        this.refreshTimer = null;

        this._init();
    }

    /**
     * Initializes the widget by building the UI, caching elements, and fetching data.
     * @private
     */
    async _init() {
        this._createWeatherHTML();
        this._cacheDOMElements();
        this._setupEventListeners();
        await this.loadWeatherData();
        this._startAutoRefresh();
    }

    /**
     * Caches references to frequently used DOM elements.
     * @private
     */
    _cacheDOMElements() {
        for (const key in WeatherWidget.SELECTORS) {
            if (key !== 'container') {
                this.elements[key] = this.container.querySelector(WeatherWidget.SELECTORS[key]);
            }
        }
        this.elements.container = this.container;
    }

    /**
     * Sets up all event listeners for the widget.
     * @private
     */
    _setupEventListeners() {
        this.elements.searchButton?.addEventListener("click", () => this._handleSearch());
        this.elements.refreshButton?.addEventListener("click", () => this.refreshWeather());
        this.elements.retryButton?.addEventListener("click", () => this.loadWeatherData());
        this.elements.quoteContainer?.addEventListener("click", () => this._fetchRandomQuote());

        this.elements.cityInput?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                this._handleSearch();
            }
        });
    }

    /**
     * Fetches weather data from the API for a given city.
     * @param {string} [city=null] - The city to fetch weather for. Defaults to the current city.
     */
    async loadWeatherData(city = null) {
        const targetCity = city || this.state.currentCity;
        this._showLoading();

        try {
            const response = await fetch(`/api/weather/${encodeURIComponent(targetCity)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success) {
                this.state.weatherData = data;
                this.state.currentCity = targetCity;
                this.state.error = null;
                this._displayWeatherData();
                this._hideError();
            } else {
                throw new Error(data.error || "An unknown error occurred.");
            }
        } catch (error) {
            console.error("Weather load error:", error);
            this.state.error = error.message;
            this._showError(error.message);
        } finally {
            this._hideLoading();
        }
    }

    /**
     * Updates the DOM with the latest weather data from the state.
     * @private
     */
    _displayWeatherData() {
        const { weather, graphics, movie_quote } = this.state.weatherData;

        this._updateTextContent('location', `${weather.city}, ${weather.country}`, true);
        this._updateTextContent('temperature', `${weather.temperature}°C`);
        this._updateTextContent('description', weather.description);
        this._updateTextContent('icon', graphics.icon);
        this.elements.icon.style.color = graphics.color;
        this._updateTextContent('feelsLike', `${weather.feels_like}°C`);
        this._updateTextContent('humidity', `${weather.humidity}%`);
        this._updateTextContent('windSpeed', `${weather.wind_speed} m/s`);
        this._updateTextContent('visibility', `${(weather.visibility / 1000).toFixed(1)} km`);
        this._updateTextContent('sunrise', weather.sunrise);
        this._updateTextContent('sunset', weather.sunset);

        this._displayMovieQuote(movie_quote);

        const now = new Date();
        this._updateTextContent('timestamp', `Ostatnia aktualizacja: ${now.toLocaleTimeString("pl-PL")}`);

        this.elements.displaySection.style.display = "block";
    }

    /**
     * Updates the movie quote section in the DOM.
     * @param {object} quote - The quote object from the API.
     * @private
     */
    _displayMovieQuote(quote) {
        this._updateTextContent('quoteText', quote.quote);
        this._updateTextContent('quoteCharacter', quote.character);
        this._updateTextContent('quoteMovie', quote.movie);
        this._updateTextContent('quoteYear', quote.year);
    }

    /**
     * Fetches and displays a new random movie quote.
     * @private
     */
    async _fetchRandomQuote() {
        try {
            const condition = this.state.weatherData?.graphics?.condition;
            const url = condition ? `/api/weather/quote/${condition}` : "/api/weather/quote";
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch quote: ${response.statusText}`);
            const data = await response.json();
            if (data.success) {
                this._displayMovieQuote(data.data.quote);
            }
        } catch (error) {
            console.error("Failed to get new quote:", error);
            // Optionally show a small, non-intrusive error to the user
        }
    }

    /**
     * Handles the logic for searching for a new city.
     * @private
     */
    _handleSearch() {
        const city = this.elements.cityInput.value.trim();
        if (city) {
            this.loadWeatherData(city);
            this.elements.cityInput.value = "";
        }
    }

    /**
     * Refreshes the weather data for the current city.
     */
    refreshWeather() {
        this.loadWeatherData(this.state.currentCity);
    }

    /**
     * Starts the auto-refresh timer using a safe recursive setTimeout.
     * @private
     */
    _startAutoRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = setTimeout(async () => {
            await this.refreshWeather();
            this._startAutoRefresh(); // Reschedule after completion
        }, WeatherWidget.DEFAULTS.UPDATE_INTERVAL_MS);
    }

    /**
     * Helper to update the text content of a cached element.
     * @param {string} key - The key of the element in `this.elements`.
     * @param {string} text - The text to set.
     * @param {boolean} [isHTML=false] - Whether to set innerHTML instead of textContent.
     * @private
     */
    _updateTextContent(key, text, isHTML = false) {
        if (this.elements[key]) {
            this.elements[key][isHTML ? 'innerHTML' : 'textContent'] = text;
        }
    }

    // --- UI State Management ---

    _showLoading() {
        this.elements.loadingIndicator.style.display = "block";
        this.elements.displaySection.style.display = "none";
        this.elements.errorSection.style.display = "none";
    }

    _hideLoading() {
        this.elements.loadingIndicator.style.display = "none";
    }

    _showError(message) {
        this._updateTextContent('errorMessage', message || "Nie udało się pobrać danych pogodowych");
        this.elements.errorSection.style.display = "block";
        this.elements.displaySection.style.display = "none";
    }

    _hideError() {
        this.elements.errorSection.style.display = "none";
    }

    /**
     * Generates and injects the widget's HTML structure.
     * @private
     */
    _createWeatherHTML() {
        this.container.innerHTML = `
            <div class="weather-widget">
                <div class="weather-header">
                    <h3>🌦️ Pogoda</h3>
                    <div class="weather-controls">
                        <input type="text" id="city-input" placeholder="Wprowadź miasto..." />
                        <button id="search-weather" class="weather-btn"><i class="fas fa-search"></i></button>
                        <button id="refresh-weather" class="weather-btn"><i class="fas fa-sync-alt"></i></button>
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
                            </div>
                            <div class="weather-info">
                                <div class="weather-location" id="weather-location"><i class="fas fa-map-marker-alt"></i><span>Lokalizacja</span></div>
                                <div class="weather-temperature" id="weather-temperature">--°C</div>
                                <div class="weather-description" id="weather-description">Ładowanie...</div>
                            </div>
                        </div>
                        <div class="weather-details">
                            <div class="weather-detail"><i class="fas fa-thermometer-half"></i><span>Odczuwalna</span><span id="feels-like">--°C</span></div>
                            <div class="weather-detail"><i class="fas fa-tint"></i><span>Wilgotność</span><span id="humidity">--%</span></div>
                            <div class="weather-detail"><i class="fas fa-wind"></i><span>Wiatr</span><span id="wind-speed">-- m/s</span></div>
                            <div class="weather-detail"><i class="fas fa-eye"></i><span>Widoczność</span><span id="visibility">-- km</span></div>
                        </div>
                        <div class="weather-sun-times">
                            <div class="sun-time"><i class="fas fa-sun sunrise"></i><span>Wschód</span><span id="sunrise">--:--</span></div>
                            <div class="sun-time"><i class="fas fa-sun sunset"></i><span>Zachód</span><span id="sunset">--:--</span></div>
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
                    <span class="weather-timestamp" id="weather-timestamp">Ostatnia aktualizacja: --:--</span>
                </div>
            </div>
        `;
    }
}
