import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { dashboardWidgets } from '../config.js';


export function loadWidgets(grid) {
  dashboardWidgets.forEach((widget) => {
    grid.addWidget({
      id: widget.id,
      w: widget.w,
      h: widget.h,
      content: `
                <div class="window">
                    <div class="window-header">
                        <span class="window-title">${widget.id.replace(
                          "-",
                          " "
                        )}</span>
                        <div class="window-controls">
                            <button class="window-btn minimize"></button>
                            <button class="window-btn maximize"></button>
                            <button class="window-btn close"></button>
                        </div>
                    </div>
                    <div class="window-content">
                        ${widget.content}
                    </div>
                </div>
            `,
    });
  });
}

export function updateWidgets() {
  updateSystemInfo();
  updateSystemResources();
  updateNetworkStats();
  updateTopProcesses();
  updateWeather();
}

function updateSystemInfo() {
  console.log("Attempting to fetch /api/system/info");
  fetch(`/api/system/info`)
    .then((response) => {
        console.log("Received response for /api/system/info:", response);
        return response.json();
    })
    .then((response) => {
      if (response.success) {
        const data = response.data;
        const content = `
                  <p><strong>Hostname:</strong> ${data.hostname}</p>
                  <p><strong>OS:</strong> ${data.os}</p>
                  <p><strong>Uptime:</strong> ${new Date(data.uptime * 1000)
                    .toISOString()
                    .substr(11, 8)}</p>
              `;
        document.getElementById("system-info-content").innerHTML = content;
      } else {
        console.error("Error fetching system info:", response.error);
        document.getElementById("system-info-content").innerHTML =
          "<p>Error loading data.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching system info:", error);
      document.getElementById("system-info-content").innerHTML =
        "<p>Error loading data.</p>";
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
