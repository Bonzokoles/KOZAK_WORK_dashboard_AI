// --- Configuration ---
export const AppConfig = {
    gridStack: {
        cellHeight: 70,
        margin: 10,
        float: true,
    },
    updates: {
        widgetUpdateInterval: 5000, // ms
    },
    viewer: {
        initDelay: 1000, // ms
    },
    performance: {
        resizeDebounce: 200, // ms
    }
};

export const SELECTORS = {
    backgroundCanvas: 'bg-canvas',
    weatherWidgetContainer: 'weather-widget-container',
};

export const dashboardWidgets = [
  {
    id: "system-info",
    content: '<h4>System Info</h4><div id="system-info-content"></div>',
    w: 2,
    h: 2,
  },
  {
    id: "system-resources",
    content:
      '<h4>System Resources</h4><div id="system-resources-content"></div>',
    w: 4,
    h: 4,
  },
  {
    id: "network-stats",
    content: '<h4>Network Stats</h4><div id="network-stats-content"></div>',
    w: 3,
    h: 3,
  },
  {
    id: "top-processes",
    content: '<h4>Top Processes</h4><div id="top-processes-content"></div>',
    w: 3,
    h: 5,
  },
  {
    id: "weather",
    content: '<h4>Weather</h4><div id="weather-content"></div>',
    w: 2,
    h: 3,
  },
  {
    id: "3d-viewer",
    content:
      '<h4>3D Model Viewer</h4><div id="3d-viewer-content" style="height: 100%;"></div><div class="mt-2"><input type="text" class="form-control" id="3d-model-path" placeholder="Path to .glb model"><button class="btn btn-primary btn-sm mt-2" id="load-3d-model-btn">Load Model</button></div>',
    w: 6,
    h: 8,
  },
];
