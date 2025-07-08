import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { dashboardWidgets } from '../config.js';

const BACKEND_URL = window.location.origin || "http://localhost:5000";

// Widget configurations
export const widgets = [
  {
    id: "system-info",
    title: "System Info",
    content: '<div class="widget-content" id="system-info-content"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>',
    w: 2,
    h: 2,
    x: 0,
    y: 0
  },
  {
    id: "system-resources",
    title: "System Resources",
    content: '<div class="widget-content" id="system-resources-content"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>',
    w: 4,
    h: 4,
    x: 2,
    y: 0
  },
  {
    id: "network-stats",
    title: "Network Stats",
    content: '<div class="widget-content" id="network-stats-content"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>',
    w: 3,
    h: 3,
    x: 6,
    y: 0
  },
  {
    id: "top-processes",
    title: "Top Processes",
    content: '<div class="widget-content" id="top-processes-content"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>',
    w: 3,
    h: 5,
    x: 6,
    y: 3
  },
  {
    id: "weather",
    title: "Weather",
    content: '<div class="widget-content" id="weather-content"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>',
    w: 2,
    h: 3,
    x: 0,
    y: 2
  },
  {
    id: "3d-viewer",
    title: "3D Model Viewer",
    content: '<div class="widget-content" id="3d-viewer-content" style="height: calc(100% - 50px);"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div><div class="mt-2"><input type="text" class="form-control" id="3d-model-path" placeholder="Path to .glb model"><button class="btn btn-primary btn-sm mt-2" id="load-3d-model-btn">Load Model</button></div>',
    w: 6,
    h: 8,
    x: 0,
    y: 5
  },
];

// Create a widget element
function createWidgetElement(widget) {
  const widgetEl = document.createElement('div');
  widgetEl.className = 'grid-stack-item';
  widgetEl.setAttribute('gs-w', widget.w);
  widgetEl.setAttribute('gs-h', widget.h);
  if (widget.x !== undefined) widgetEl.setAttribute('gs-x', widget.x);
  if (widget.y !== undefined) widgetEl.setAttribute('gs-y', widget.y);
  
  widgetEl.innerHTML = `
    <div class="widget">
      <div class="widget-header">
        <h5>${widget.title || widget.id.replace(/-/g, ' ')}</h5>
        <div class="widget-actions">
          <button class="btn btn-sm btn-link text-white refresh-widget" data-widget="${widget.id}" title="Refresh">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div class="widget-body">
        ${widget.content}
      </div>
    </div>
  `;
  return widgetEl;
}

export function loadWidgets(grid) {
  // Clear existing widgets
  grid.removeAll();
  
  // Add each widget to the grid
  widgets.forEach(widget => {
    const widgetEl = createWidgetElement(widget);
    grid.addWidget(widgetEl);
  });
  
  // Add event listeners for refresh buttons
  document.querySelectorAll('.refresh-widget').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const widgetId = e.target.closest('.refresh-widget').dataset.widget;
      updateWidget(widgetId);
    });
  });
  
  console.log('Widgets loaded successfully');
}

// Update a specific widget by ID
function updateWidget(widgetId) {
  switch(widgetId) {
    case 'system-info':
      return updateSystemInfo();
    case 'system-resources':
      return updateSystemResources();
    case 'network-stats':
      return updateNetworkStats();
    case 'top-processes':
      return updateTopProcesses();
    case 'weather':
      return updateWeather();
    case '3d-viewer':
      // 3D viewer is updated on user interaction
      return Promise.resolve();
    default:
      console.warn(`Unknown widget ID: ${widgetId}`);
      return Promise.resolve();
  }
}

export function updateWidgets() {
  // Update all widgets in parallel
  return Promise.all([
    updateSystemInfo(),
    updateSystemResources(),
    updateNetworkStats(),
    updateTopProcesses(),
    updateWeather()
  ]).catch(error => {
    console.error('Error updating widgets:', error);
  });
}

// Format uptime from seconds to human readable format
function formatUptime(seconds) {
  if (!seconds) return 'N/A';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  
  return parts.join(' ');
}

function updateSystemInfo() {
  const contentEl = document.getElementById('system-info-content');
  if (!contentEl) return Promise.resolve();
  
  // Show loading state
  contentEl.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  
  return fetch(`${BACKEND_URL}/api/system/info`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data && data.success && data.data) {
        const sysInfo = data.data;
        contentEl.innerHTML = `
          <div class="system-info">
            <div class="info-row">
              <span class="info-label">OS:</span>
              <span class="info-value">${sysInfo.os || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Hostname:</span>
              <span class="info-value">${sysInfo.hostname || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Uptime:</span>
              <span class="info-value">${formatUptime(sysInfo.uptime)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Python:</span>
              <span class="info-value">${sysInfo.python || 'N/A'}</span>
            </div>
          </div>
        `;
      } else {
        throw new Error('Invalid response format');
      }
    })
    .catch(error => {
      console.error('Error updating system info:', error);
      contentEl.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          Failed to load system info: ${error.message}
        </div>
      `;
    });
}

function updateSystemResources() {
  fetch(`/api/system/resources`)
    .then((response) => response.json())
    .then((response) => {
      if (response.success) {
        const data = response.data;
        const content = `
                  <p><strong>CPU:</strong> ${data.cpu_percent.toFixed(1)}%</p>
                  <div class="progress mb-2">
                      <div class="progress-bar" role="progressbar" style="width: ${
                        data.cpu_percent
                      }%" aria-valuenow="${
          data.cpu_percent
        }" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <p><strong>RAM:</strong> ${data.memory_percent.toFixed(
                    1
                  )}%</p>
                  <div class="progress mb-2">
                      <div class="progress-bar" role="progressbar" style="width: ${
                        data.memory_percent
                      }%" aria-valuenow="${
          data.memory_percent
        }" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <p><strong>Disk:</strong> ${data.disk_percent.toFixed(1)}%</p>
                  <div class="progress mb-2">
                      <div class="progress-bar" role="progressbar" style="width: ${
                        data.disk_percent
                      }%" aria-valuenow="${
          data.disk_percent
        }" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <p><strong>GPU:</strong> ${data.gpu_usage.toFixed(1)}%</p>
                  <div class="progress">
                      <div class="progress-bar" role="progressbar" style="width: ${
                        data.gpu_usage
                      }%" aria-valuenow="${
          data.gpu_usage
        }" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
              `;
        document.getElementById("system-resources-content").innerHTML = content;
      } else {
        console.error("Error fetching system resources:", response.error);
        document.getElementById("system-resources-content").innerHTML =
          "<p>Error loading data.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching system resources:", error);
      document.getElementById("system-resources-content").innerHTML =
        "<p>Error loading data.</p>";
    });
}

function updateNetworkStats() {
  fetch(`/api/network/stats`)
    .then((response) => response.json())
    .then((response) => {
      if (response.success) {
        const data = response.data;
        const content = `
                  <p><strong>Download:</strong> ${data.download.toFixed(
                    2
                  )} Mbps</p>
                  <p><strong>Upload:</strong> ${data.upload.toFixed(2)} Mbps</p>
                  <p><strong>Ping:</strong> ${data.ping.toFixed(2)} ms</p>
              `;
        document.getElementById("network-stats-content").innerHTML = content;
      } else {
        console.error("Error fetching network stats:", response.error);
        document.getElementById("network-stats-content").innerHTML =
          "<p>Error loading data.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching network stats:", error);
      document.getElementById("network-stats-content").innerHTML =
        "<p>Error loading data.</p>";
    });
}

function updateTopProcesses() {
  fetch(`/api/system/processes`)
    .then((response) => response.json())
    .then((response) => {
      if (response.success) {
        const data = response.data;
        let content = '<ul class="list-group">';
        data.forEach((p) => {
          content += `<li class="list-group-item d-flex justify-content-between align-items-center">
                      ${p.name}
                      <span class="badge bg-primary rounded-pill">${p.cpu_percent.toFixed(
                        1
                      )}%</span>
                  </li>`;
        });
        content += "</ul>";
        document.getElementById("top-processes-content").innerHTML = content;
      } else {
        console.error("Error fetching system processes:", response.error);
        document.getElementById("top-processes-content").innerHTML =
          "<p>Error loading data.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching system processes:", error);
      document.getElementById("top-processes-content").innerHTML =
        "<p>Error loading data.</p>";
    });
}

function updateWeather() {
  fetch(`/api/weather`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const weather = data.weather;
        const content = `
                <h5>${weather.city}</h5>
                <p>${weather.description}</p>
                <p><strong>Temp:</strong> ${weather.temperature}°C</p>
                <p><strong>Humidity:</strong> ${weather.humidity}%</p>
            `;
        document.getElementById("weather-content").innerHTML = content;
      } else {
        document.getElementById("weather-content").innerHTML = "<p>Error loading weather data.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching weather:", error);
      document.getElementById("weather-content").innerHTML = "<p>Error loading weather data.</p>";
    });
}

export function setupWindowControls(grid) {
  document.querySelectorAll(".window-btn.close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const widget = e.target.closest(".grid-stack-item");
      if (widget) {
        grid.removeWidget(widget);
      }
    });
  });

  document.querySelectorAll(".window-btn.minimize").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const window = e.target.closest(".window");
      const widget = e.target.closest(".grid-stack-item");
      window.classList.toggle("minimized");
      if (window.classList.contains("minimized")) {
        grid.update(widget, { h: 1 });
      } else {
        grid.update(widget, { h: 4 });
      }
    });
  });

  document.querySelectorAll(".window-btn.maximize").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const window = e.target.closest(".window");
      const widget = e.target.closest(".grid-stack-item");
      const isMaximized = window.classList.toggle("maximized");

      if (isMaximized) {
        widget.dataset.originalX = widget.getAttribute("gs-x");
        widget.dataset.originalY = widget.getAttribute("gs-y");
        widget.dataset.originalW = widget.getAttribute("gs-w");
        widget.dataset.originalH = widget.getAttribute("gs-h");
        grid.update(widget, { x: 0, y: 0, w: 12, h: 10 });
      } else {
        grid.update(widget, {
          x: parseInt(widget.dataset.originalX),
          y: parseInt(widget.dataset.originalY),
          w: parseInt(widget.dataset.originalW),
          h: parseInt(widget.dataset.originalH),
        });
      }
    });
  });
}

export function init3DViewer() {
  const container = document.getElementById("3d-viewer-content");
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.z = 5;

  let currentModel = null;

  function loadGLBModel(path) {
    if (currentModel) {
      scene.remove(currentModel);
      currentModel.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        currentModel = gltf.scene;
        scene.add(currentModel);
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5;
        camera.position.set(center.x, center.y, center.z + cameraZ);
        controls.target.set(center.x, center.y, center.z);
        controls.update();
      },
      undefined,
      (error) => {
        console.error("An error occurred loading the 3D model:", error);
        alert("Failed to load 3D model. Check console for details.");
      }
    );
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  document
    .getElementById("load-3d-model-btn")
    ?.addEventListener("click", () => {
      const modelPath = document.getElementById("3d-model-path").value;
      if (modelPath) {
        loadGLBModel(modelPath);
      } else {
        alert("Please enter a path to a .glb model file.");
      }
    });
}
