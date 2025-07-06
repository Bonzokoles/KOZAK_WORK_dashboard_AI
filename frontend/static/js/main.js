import { GridStack } from 'gridstack';
import { DataVisualizer } from './components/DataVisualizer.js';
import { WeatherWidget } from './components/WeatherWidget.js';
import { AppConfig, SELECTORS } from './config.js';
import {
    loadWidgets,
    updateWidgets,
    setupWindowControls,
    init3DViewer
} from './components/dashboard.js';

/**
 * Debounce function to limit the rate at which a function gets called.
 * @param {Function} func The function to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};


// --- Main Application Class ---
class DashboardApp {
    constructor(config) {
        this.config = config;
        this.grid = null;
        this.visualizer = null;
        this.lastUpdateTime = 0;
    }

    async init() {
        document.addEventListener("DOMContentLoaded", () => this.setup());
    }

    async setup() {
        try {
            this.init3DBackground();
            this.initGrid();
            this.loadDashboardWidgets();
            this.initWeatherWidget();
            await this.initDelayed3DViewer();
            this.startWidgetUpdates();
            this.setupEventListeners();
        } catch (error) {
            console.error("An error occurred during setup:", error);
        }
    }

    setupEventListeners() {
        const debouncedResize = debounce(() => {
            if (this.visualizer) {
                this.visualizer.handleResize();
            }
        }, this.config.performance.resizeDebounce);

        window.addEventListener('resize', debouncedResize);
    }

    init3DBackground() {
        try {
            const canvas = document.getElementById(SELECTORS.backgroundCanvas);
            if (canvas) {
                this.visualizer = new DataVisualizer(SELECTORS.backgroundCanvas);
                this.visualizer.createDataPoints();
                this.visualizer.animate();
            } else {
                console.warn("3D background canvas not found. Skipping initialization.");
            }
        } catch (error) {
            console.error("Failed to initialize 3D background:", error);
        }
    }

    initGrid() {
        try {
            console.log("Attempting to initialize GridStack with options:", this.config.gridStack);
            this.grid = GridStack.init(this.config.gridStack);
            console.log("GridStack initialized:", this.grid);
        } catch (error) {
            console.error("Failed to initialize GridStack:", error);
        }
    }

    loadDashboardWidgets() {
        if (!this.grid) {
            console.warn("Grid not initialized. Skipping widget loading.");
            return;
        }
        loadWidgets(this.grid);
        setupWindowControls(this.grid);
    }

    initWeatherWidget() {
        try {
            const weatherContainer = document.getElementById(SELECTORS.weatherWidgetContainer);
            if (weatherContainer) {
                new WeatherWidget(SELECTORS.weatherWidgetContainer);
            } else {
                console.warn("Weather widget container not found.");
            }
        } catch (error) {
            console.error("Failed to initialize Weather Widget:", error);
        }
    }

    initDelayed3DViewer() {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.grid) {
                    try {
                        init3DViewer(this.grid);
                    } catch (error) {
                        console.error("Failed to initialize 3D Viewer:", error);
                    }
                }
                resolve();
            }, this.config.viewer.initDelay);
        });
    }

    startWidgetUpdates() {
        let lastTimestamp = 0;
        const updateLoop = (timestamp) => {
            if (!lastTimestamp) {
                lastTimestamp = timestamp;
            }
            const elapsed = timestamp - lastTimestamp;
            if (elapsed >= this.config.updates.widgetUpdateInterval) {
                updateWidgets();
                lastTimestamp = timestamp;
            }
            requestAnimationFrame(updateLoop);
        };
        requestAnimationFrame(updateLoop);
    }
}

// --- App Initialization ---
const app = new DashboardApp(AppConfig);
app.init();
