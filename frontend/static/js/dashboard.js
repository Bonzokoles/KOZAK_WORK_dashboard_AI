const BACKEND_URL = "http://localhost:5000";
let grid;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize 3D Background
  const visualizer = new window.DataVisualizer("bg-canvas");
  visualizer.createDataPoints();
  visualizer.animate();

  grid = GridStack.init({
    cellHeight: 70,
    margin: 10,
    float: true, // Allow widgets to float
  });

  loadWidgets();
  setInterval(updateWidgets, 5000);

  // AI Tool Form Event Listeners
  const aiToolForm = document.getElementById("ai-tool-form");
  if (aiToolForm) {
    aiToolForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const toolId = document.getElementById("tool-id").value;
      const toolData = {
        name: document.getElementById("tool-name").value,
        url: document.getElementById("tool-url").value,
        icon: document.getElementById("tool-icon").value,
        description: document.getElementById("tool-description").value,
        category: document.getElementById("tool-category").value,
        enabled: document.getElementById("tool-enabled").checked,
      };

      if (toolId) {
        updateAiTool(toolId, toolData);
      } else {
        addAiTool(toolData);
      }
    });
  }

  const cancelEditToolBtn = document.getElementById("cancel-edit-tool");
  if (cancelEditToolBtn) {
    cancelEditToolBtn.addEventListener("click", () => {
      document.getElementById("ai-tool-form").reset();
      document.getElementById("tool-id").value = "";
    });
  }

  // AI Chat configuration
  const aiChatHeader = document.querySelector(".chat-header h6");
  if (aiChatHeader) {
    aiChatHeader.addEventListener("click", () => {
      const modal = new bootstrap.Modal(
        document.getElementById("aiChatConfigModal")
      );
      modal.show();
      // New: Fetch and populate AI models when modal is shown
      fetchAiModels();
    });
  }

  const saveAiConfigBtn = document.getElementById("save-ai-config");
  if (saveAiConfigBtn) {
    saveAiConfigBtn.addEventListener("click", () => {
      const modelPath = document.getElementById("ai-model-path").value;
      const ollamaApiKey = document.getElementById("ollama-api-key").value;
      const openaiApiKey = document.getElementById("openai-api-key").value;
      const mcpServerUrl = document.getElementById("mcp-server-url").value;
      const systemPrompt = document.getElementById("system-prompt").value;
      const files = document.getElementById("file-upload").files;
      let filePaths = [];
      for (let i = 0; i < files.length; i++) {
        filePaths.push(files[i].name);
      }
      // New: Get selected AI model
      const selectedAiModel = document.getElementById("ai-model-select").value;

      const config = {
        model_path: modelPath,
        ollama_api_key: ollamaApiKey,
        openai_api_key: openaiApiKey,
        mcp_server_url: mcpServerUrl,
        system_prompt: systemPrompt,
        file_paths: filePaths,
        selected_ai_model: selectedAiModel, // New: Add selected model to config
      };

      fetch(`${BACKEND_URL}/api/config/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            alert("AI configuration saved successfully!");
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("aiChatConfigModal")
            );
            modal.hide();
          } else {
            alert("Error saving AI configuration.");
          }
        });
    });
  }

  // New: Event listener for install model button
  const installModelBtn = document.getElementById("install-model-btn");
  if (installModelBtn) {
    installModelBtn.addEventListener("click", () => {
      const modelName = document
        .getElementById("ai-model-install")
        .value.trim();
      if (modelName) {
        installAiModel(modelName);
      } else {
        alert("Please enter a model name or path to install.");
      }
    });
  }

  // AI Tools Management
  const aiToolsLink = document.getElementById("ai-tools-link");
  if (aiToolsLink) {
    aiToolsLink.addEventListener("click", (e) => {
      e.preventDefault();
      const modal = new bootstrap.Modal(
        document.getElementById("aiToolManagementModal")
      );
      modal.show();
      loadAiTools(); // Load tools when modal is shown
    });
  }

  // 3D App link
  const threeDAppLink = document.getElementById("3d-app-link");
  if (threeDAppLink) {
    threeDAppLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.open("http://localhost:3050", "_blank"); // Open 3D app in new tab
    });
  }

  // Initialize 3D Viewer with delay to ensure DOM is ready
  setTimeout(init3DViewer, 1000);
});


function loadWidgets() {
  widgets.forEach((widget) => {
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

  setupWindowControls();
}

function updateWidgets() {
  updateSystemInfo();
  updateSystemResources();
  updateNetworkStats();
  updateTopProcesses();
  updateWeather();
}

function updateSystemInfo() {
  fetch(`${BACKEND_URL}/api/system/info`)
    .then((response) => response.json())
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
  fetch(`${BACKEND_URL}/api/system/resources`)
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
  fetch(`${BACKEND_URL}/api/network/stats`)
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
  fetch(`${BACKEND_URL}/api/system/processes`)
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
  fetch(`${BACKEND_URL}/api/weather`)
    .then((response) => response.json())
    .then((data) => {
      const content = `
                <h5>${data.name}</h5>
                <p>${data.weather[0].description}</p>
                <p><strong>Temp:</strong> ${data.main.temp}°C</p>
                <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
            `;
      document.getElementById("weather-content").innerHTML = content;
    });
}

// New: Function to fetch AI models from backend
function fetchAiModels() {
  fetch(`${BACKEND_URL}/api/ai/list_models`)
    .then((response) => response.json())
    .then((data) => {
      const selectElement = document.getElementById("ai-model-select");
      selectElement.innerHTML = ""; // Clear existing options
      data.models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        selectElement.appendChild(option);
      });
      // Optionally, pre-select the currently configured model
      // (This would require fetching current config from backend)
    })
    .catch((error) => {
      console.error("Error fetching AI models:", error);
      alert("Could not fetch AI models. Check server logs.");
    });
}

// New: Function to install AI model
function installAiModel(modelName) {
  fetch(`${BACKEND_URL}/api/ai/install_model`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model_name: modelName }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert(`Model '${modelName}' installed successfully!`);
        fetchAiModels(); // Refresh the list of models
      } else {
        alert(
          `Error installing model '${modelName}': ${
            data.error || "Unknown error"
          }`
        );
      }
    })
    .catch((error) => {
      console.error("Error installing AI model:", error);
      alert(`Error installing model '${modelName}'. Check server logs.`);
    });
}

function loadAiTools() {
  fetch(`${BACKEND_URL}/api/ai_tools`)
    .then((response) => response.json())
    .then((data) => {
      const aiToolsList = document.getElementById("ai-tools-list");
      if (!aiToolsList) return;

      aiToolsList.innerHTML = ""; // Clear existing tools
      const tools = data.tools || {};

      for (const toolId in tools) {
        const tool = tools[toolId];
        if (tool.enabled) {
          const toolItem = document.createElement("div");
          toolItem.classList.add(
            "d-flex",
            "justify-content-between",
            "align-items-center",
            "mb-2"
          );
          toolItem.innerHTML = `
                        <span><i class="${tool.icon} me-2"></i>${tool.name} (${tool.category})</span>
                        <div>
                            <button class="btn btn-primary btn-sm me-1 launch-ai-tool" data-url="${tool.url}">Launch</button>
                            <button class="btn btn-info btn-sm me-1 edit-ai-tool" data-id="${toolId}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-ai-tool" data-id="${toolId}">Delete</button>
                        </div>
                    `;
          aiToolsList.appendChild(toolItem);
        }
      }

      // Attach event listeners to dynamically created buttons
      document.querySelectorAll(".launch-ai-tool").forEach((button) => {
        button.addEventListener("click", function () {
          window.open(this.dataset.url, "_blank");
        });
      });

      document.querySelectorAll(".edit-ai-tool").forEach((button) => {
        button.addEventListener("click", function () {
          const toolId = this.dataset.id;
          const tool = tools[toolId];
          document.getElementById("tool-id").value = toolId;
          document.getElementById("tool-name").value = tool.name;
          document.getElementById("tool-url").value = tool.url;
          document.getElementById("tool-icon").value = tool.icon;
          document.getElementById("tool-description").value = tool.description;
          document.getElementById("tool-category").value = tool.category;
          document.getElementById("tool-enabled").checked = tool.enabled;
        });
      });

      document.querySelectorAll(".delete-ai-tool").forEach((button) => {
        button.addEventListener("click", function () {
          deleteAiTool(this.dataset.id);
        });
      });
    })
    .catch((error) => {
      console.error("Error loading AI tools:", error);
      alert("Could not load AI tools. Check server logs.");
    });
}

function deleteAiTool(toolId) {
  if (confirm("Are you sure you want to delete this AI tool?")) {
    fetch(`${BACKEND_URL}/api/ai_tools/${toolId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("AI tool deleted successfully!");
          loadAiTools(); // Refresh list
        } else {
          alert("Error deleting AI tool: " + (data.error || "Unknown error"));
        }
      });
  }
}

function updateAiTool(toolId, toolData) {
  fetch(`${BACKEND_URL}/api/ai_tools/${toolId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toolData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("AI tool updated successfully!");
        loadAiTools(); // Refresh list
        document.getElementById("ai-tool-form").reset(); // Clear form
        document.getElementById("tool-id").value = ""; // Clear hidden ID
      } else {
        alert("Error updating AI tool: " + (data.error || "Unknown error"));
      }
    })
    .catch((error) => {
      console.error("Error updating AI tool:", error);
      alert("Error updating AI tool. Check server logs.");
    });
}

function setupWindowControls() {
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
        // Restore to original height - this might need to be stored
        grid.update(widget, { h: 4 }); // Assuming a default height
      }
    });
  });

  document.querySelectorAll(".window-btn.maximize").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const window = e.target.closest(".window");
      const widget = e.target.closest(".grid-stack-item");
      const isMaximized = window.classList.toggle("maximized");

      if (isMaximized) {
        // Store original size and position
        widget.dataset.originalX = widget.getAttribute("gs-x");
        widget.dataset.originalY = widget.getAttribute("gs-y");
        widget.dataset.originalW = widget.getAttribute("gs-w");
        widget.dataset.originalH = widget.getAttribute("gs-h");
        grid.update(widget, { x: 0, y: 0, w: 12, h: 10 }); // Maximize
      } else {
        // Restore from stored data
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

function init3DViewer() {
  const container = document.getElementById("3d-viewer-content");
  if (!container) return;

  // Basic Three.js setup
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

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  // OrbitControls for interaction
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  camera.position.z = 5;

  let currentModel = null;

  // Function to load GLB model
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

    const loader = new THREE.GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        currentModel = gltf.scene;
        scene.add(currentModel);
        // Optional: Fit camera to model
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Add some padding
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

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Event listener for load button
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
