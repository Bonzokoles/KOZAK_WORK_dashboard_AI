
const BACKEND_URL = 'http://localhost:5000';
let grid;

document.addEventListener('DOMContentLoaded', function() {
    grid = GridStack.init({
        cellHeight: 70,
        margin: 10,
    });

    loadWidgets();
    setInterval(updateWidgets, 5000);

    // AI Chat configuration
    const aiChatHeader = document.querySelector('.chat-header h6');
    if (aiChatHeader) {
        aiChatHeader.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('aiChatConfigModal'));
            modal.show();
            // New: Fetch and populate AI models when modal is shown
            fetchAiModels();
        });
    }

    const saveAiConfigBtn = document.getElementById('save-ai-config');
    if (saveAiConfigBtn) {
        saveAiConfigBtn.addEventListener('click', () => {
            const modelPath = document.getElementById('ai-model-path').value;
            const ollamaApiKey = document.getElementById('ollama-api-key').value;
            const openaiApiKey = document.getElementById('openai-api-key').value;
            const mcpServerUrl = document.getElementById('mcp-server-url').value;
            const systemPrompt = document.getElementById('system-prompt').value;
            const files = document.getElementById('file-upload').files;
            let filePaths = [];
            for (let i = 0; i < files.length; i++) {
                filePaths.push(files[i].name);
            }
            // New: Get selected AI model
            const selectedAiModel = document.getElementById('ai-model-select').value;


            const config = {
                model_path: modelPath,
                ollama_api_key: ollamaApiKey,
                openai_api_key: openaiApiKey,
                mcp_server_url: mcpServerUrl,
                system_prompt: systemPrompt,
                file_paths: filePaths,
                selected_ai_model: selectedAiModel // New: Add selected model to config
            };

            fetch(`${BACKEND_URL}/api/config/ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('AI configuration saved successfully!');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('aiChatConfigModal'));
                    modal.hide();
                } else {
                    alert('Error saving AI configuration.');
                }
            });
        });
    }

    // New: Event listener for install model button
    const installModelBtn = document.getElementById('install-model-btn');
    if (installModelBtn) {
        installModelBtn.addEventListener('click', () => {
            const modelName = document.getElementById('ai-model-install').value.trim();
            if (modelName) {
                installAiModel(modelName);
            } else {
                alert('Please enter a model name or path to install.');
            }
        });
    }

    // AI Tools Management
    const aiToolsLink = document.getElementById('ai-tools-link');
    if (aiToolsLink) {
        aiToolsLink.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = new bootstrap.Modal(document.getElementById('aiToolManagementModal'));
            modal.show();
            loadAiTools(); // Load tools when modal is shown
        });
    }

    // 3D App link
    const threeDAppLink = document.getElementById('3d-app-link');
    if (threeDAppLink) {
        threeDAppLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('http://localhost:3050', '_blank'); // Open 3D app in new tab
        });
    }
});

const widgets = [
    { id: 'system-info', content: '<h4>System Info</h4><div id="system-info-content"></div>', w: 2, h: 2 },
    { id: 'system-resources', content: '<h4>System Resources</h4><div id="system-resources-content"></div>', w: 4, h: 4 },
    { id: 'network-stats', content: '<h4>Network Stats</h4><div id="network-stats-content"></div>', w: 3, h: 3 },
    { id: 'top-processes', content: '<h4>Top Processes</h4><div id="top-processes-content"></div>', w: 3, h: 5 },
    { id: 'weather', content: '<h4>Weather</h4><div id="weather-content"></div>', w: 2, h: 3 },
];

function loadWidgets() {
    widgets.forEach(widget => {
        grid.addWidget({
            id: widget.id,
            w: widget.w,
            h: widget.h,
            content: `<div class="card text-white bg-dark h-100"><div class="card-body">${widget.content}</div></div>`
        });
    });
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
        .then(response => response.json())
        .then(data => {
            const content = `
                <p><strong>Hostname:</strong> ${data.hostname}</p>
                <p><strong>OS:</strong> ${data.os}</p>
                <p><strong>Uptime:</strong> ${new Date(data.uptime * 1000).toISOString().substr(11, 8)}</p>
            `;
            document.getElementById('system-info-content').innerHTML = content;
        });
}

function updateSystemResources() {
    fetch(`${BACKEND_URL}/api/system/resources`)
        .then(response => response.json())
        .then(data => {
            const content = `
                <p><strong>CPU:</strong> ${data.cpu_percent.toFixed(1)}%</p>
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: ${data.cpu_percent}%" aria-valuenow="${data.cpu_percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p><strong>RAM:</strong> ${data.memory_percent.toFixed(1)}%</p>
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: ${data.memory_percent}%" aria-valuenow="${data.memory_percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p><strong>Disk:</strong> ${data.disk_percent.toFixed(1)}%</p>
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: ${data.disk_percent}%" aria-valuenow="${data.disk_percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p><strong>GPU:</strong> ${data.gpu_usage.toFixed(1)}%</p>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${data.gpu_usage}%" aria-valuenow="${data.gpu_usage}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            `;
            document.getElementById('system-resources-content').innerHTML = content;
        });
}

function updateNetworkStats() {
    fetch(`${BACKEND_URL}/api/network/stats`)
        .then(response => response.json())
        .then(data => {
            const content = `
                <p><strong>Download:</strong> ${data.download.toFixed(2)} Mbps</p>
                <p><strong>Upload:</strong> ${data.upload.toFixed(2)} Mbps</p>
                <p><strong>Ping:</strong> ${data.ping.toFixed(2)} ms</p>
            `;
            document.getElementById('network-stats-content').innerHTML = content;
        });
}

function updateTopProcesses() {
    fetch(`${BACKEND_URL}/api/system/processes`)
        .then(response => response.json())
        .then(data => {
            let content = '<ul class="list-group">';
            data.forEach(p => {
                content += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${p.name}
                    <span class="badge bg-primary rounded-pill">${p.cpu_percent.toFixed(1)}%</span>
                </li>`;
            });
            content += '</ul>';
            document.getElementById('top-processes-content').innerHTML = content;
        });
}

function updateWeather() {
    fetch(`${BACKEND_URL}/api/weather`)
        .then(response => response.json())
        .then(data => {
            const content = `
                <h5>${data.name}</h5>
                <p>${data.weather[0].description}</p>
                <p><strong>Temp:</strong> ${data.main.temp}°C</p>
                <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
            `;
            document.getElementById('weather-content').innerHTML = content;
        });
}

// New: Function to fetch AI models from backend
function fetchAiModels() {
    fetch(`${BACKEND_URL}/api/ai/list_models`)
        .then(response => response.json())
        .then(data => {
            const selectElement = document.getElementById('ai-model-select');
            selectElement.innerHTML = ''; // Clear existing options
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                selectElement.appendChild(option);
            });
            // Optionally, pre-select the currently configured model
            // (This would require fetching current config from backend)
        })
        .catch(error => {
            console.error('Error fetching AI models:', error);
            alert('Could not fetch AI models. Check server logs.');
        });
}

// New: Function to install AI model
function installAiModel(modelName) {
    fetch(`${BACKEND_URL}/api/ai/install_model`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model_name: modelName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Model '${modelName}' installed successfully!`);
            fetchAiModels(); // Refresh the list of models
        } else {
            alert(`Error installing model '${modelName}': ${data.error || 'Unknown error'}`);
        }
    })
    .catch(error => {
        console.error('Error installing AI model:', error);
        alert(`Error installing model '${modelName}'. Check server logs.`);
    });
}

// New: Function to load AI tools dynamically
function loadAiTools() {
    fetch(`${BACKEND_URL}/api/ai_tools`)
        .then(response => response.json())
        .then(tools => {
            const aiToolsGrid = document.querySelector('.ai-tools-grid'); // Assuming this element exists in dashboard.html
            if (!aiToolsGrid) return;

            aiToolsGrid.innerHTML = ''; // Clear existing tools

            tools.forEach((tool, index) => {
                const toolCard = document.createElement('div');
                toolCard.classList.add('ai-tool-card');
                toolCard.innerHTML = `
                    <i class="fas ${tool.icon}"></i>
                    <h6>${tool.name}</h6>
                    <p>${tool.description || ''}</p>
                    <button class="btn btn-primary btn-sm launch-ai-tool" data-url="${tool.url}">Launch</button>
                    <button class="btn btn-info btn-sm edit-ai-tool" data-id="${index}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-ai-tool" data-id="${index}">Delete</button>
                `;
                aiToolsGrid.appendChild(toolCard);
            });

            // Add event listeners for dynamically created buttons
            document.querySelectorAll('.launch-ai-tool').forEach(button => {
                button.addEventListener('click', function() {
                    window.open(this.dataset.url, '_blank');
                });
            });

            document.querySelectorAll('.edit-ai-tool').forEach(button => {
                button.addEventListener('click', function() {
                    // Implement edit logic (e.g., open a modal with tool details)
                    alert('Edit tool with ID: ' + this.dataset.id);
                });
            });

            document.querySelectorAll('.delete-ai-tool').forEach(button => {
                button.addEventListener('click', function() {
                    deleteAiTool(this.dataset.id);
                });
            });

            // Add "Add New Tool" button
            const addToolCard = document.createElement('div');
            addToolCard.classList.add('ai-tool-card');
            addToolCard.innerHTML = `
                <i class="fas fa-plus"></i>
                <h6>Add New Tool</h6>
                <p>Add a custom AI tool</p>
                <button class="btn btn-success btn-sm" id="add-new-ai-tool-btn">Add</button>
            `;
            aiToolsGrid.appendChild(addToolCard);

            document.getElementById('add-new-ai-tool-btn')?.addEventListener('click', showAddToolDialog);
        })
        .catch(error => {
            console.error('Error loading AI tools:', error);
        });
}

// Placeholder for showAddToolDialog (from previous steps, needs to be moved/adapted)
function showAddToolDialog() {
    alert('Implement add new AI tool dialog');
    // This function needs to be properly implemented to show a modal for adding new tools
    // and then call addAiTool(toolData)
}

// Placeholder for addAiTool
function addAiTool(toolData) {
    fetch(`${BACKEND_URL}/api/ai_tools`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('AI tool added successfully!');
            loadAiTools(); // Refresh list
        } else {
            alert('Error adding AI tool: ' + (data.error || 'Unknown error'));
        }
    });
}

// Placeholder for deleteAiTool
function deleteAiTool(toolId) {
    if (confirm('Are you sure you want to delete this AI tool?')) {
        fetch(`${BACKEND_URL}/api/ai_tools/${toolId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('AI tool deleted successfully!');
                loadAiTools(); // Refresh list
            } else {
                alert('Error deleting AI tool: ' + (data.error || 'Unknown error'));
            }
        });
    }
}

const widgets = [
    { id: 'system-info', content: '<h4>System Info</h4><div id="system-info-content"></div>', w: 2, h: 2 },
    { id: 'system-resources', content: '<h4>System Resources</h4><div id="system-resources-content"></div>', w: 4, h: 4 },
    { id: 'network-stats', content: '<h4>Network Stats</h4><div id="network-stats-content"></div>', w: 3, h: 3 },
    { id: 'top-processes', content: '<h4>Top Processes</h4><div id="top-processes-content"></div>', w: 3, h: 5 },
    { id: 'weather', content: '<h4>Weather</h4><div id="weather-content"></div>', w: 2, h: 3 },
];

function loadWidgets() {
    widgets.forEach(widget => {
        grid.addWidget({
            id: widget.id,
            w: widget.w,
            h: widget.h,
            content: `<div class="card text-white bg-dark h-100"><div class="card-body">${widget.content}</div></div>`
        });
    });
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
        .then(response => response.json())
        .then(data => {
            const content = `
                <p><strong>Hostname:</strong> ${data.hostname}</p>
                <p><strong>OS:</strong> ${data.os}</p>
                <p><strong>Uptime:</strong> ${new Date(data.uptime * 1000).toISOString().substr(11, 8)}</p>
            `;
            document.getElementById('system-info-content').innerHTML = content;
        });
}

function updateSystemResources() {
    fetch(`${BACKEND_URL}/api/system/resources`)
        .then(response => response.json())
        .then(data => {
            const content = `
                <p><strong>CPU:</strong> ${data.cpu_percent.toFixed(1)}%</p>
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: ${data.cpu_percent}%" aria-valuenow="${data.cpu_percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p><strong>RAM:</strong> ${data.memory_percent.toFixed(1)}%</p>
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: ${data.memory_percent}%" aria-valuenow="${data.memory_percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p><strong>Disk:</strong> ${data.disk_percent.toFixed(1)}%</p>
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" style="width: ${data.disk_percent}%" aria-valuenow="${data.disk_percent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <p><strong>GPU:</strong> ${data.gpu_usage.toFixed(1)}%</p>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${data.gpu_usage}%" aria-valuenow="${data.gpu_usage}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            `;
            document.getElementById('system-resources-content').innerHTML = content;
        });
}

function updateNetworkStats() {
    fetch(`${BACKEND_URL}/api/network/stats`)
        .then(response => response.json())
        .then(data => {
            const content = `
                <p><strong>Download:</strong> ${data.download.toFixed(2)} Mbps</p>
                <p><strong>Upload:</strong> ${data.upload.toFixed(2)} Mbps</p>
                <p><strong>Ping:</strong> ${data.ping.toFixed(2)} ms</p>
            `;
            document.getElementById('network-stats-content').innerHTML = content;
        });
}

function updateTopProcesses() {
    fetch(`${BACKEND_URL}/api/system/processes`)
        .then(response => response.json())
        .then(data => {
            let content = '<ul class="list-group">';
            data.forEach(p => {
                content += `<li class="list-group-item d-flex justify-content-between align-items-center">
                    ${p.name}
                    <span class="badge bg-primary rounded-pill">${p.cpu_percent.toFixed(1)}%</span>
                </li>`;
            });
            content += '</ul>';
            document.getElementById('top-processes-content').innerHTML = content;
        });
}

function updateWeather() {
    fetch(`${BACKEND_URL}/api/weather`)
        .then(response => response.json())
        .then(data => {
            const content = `
                <h5>${data.name}</h5>
                <p>${data.weather[0].description}</p>
                <p><strong>Temp:</strong> ${data.main.temp}°C</p>
                <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
            `;
            document.getElementById('weather-content').innerHTML = content;
        });
}
