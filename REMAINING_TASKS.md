# Remaining Tasks for Jimbodash+start

This document outlines the remaining tasks to enhance the Jimbodash+start application, focusing on frontend integration and dynamic functionalities.

## 1. AI Tools Management (Frontend - `frontend/static/js/dashboard.js`)

The backend (`backend/server.py`) now supports CRUD operations for AI tools via `/api/ai_tools` endpoints. The `frontend/templates/dashboard.html` has a new modal (`aiToolManagementModal`) for managing these tools.

**Objective:** Implement the JavaScript logic in `dashboard.js` to interact with these new backend endpoints and manage AI tools dynamically within the `aiToolManagementModal`.

**Tasks:**

### 1.1. Implement `loadAiTools()` Function

This function should fetch the list of AI tools from the backend and populate the `ai-tools-list` div within the `aiToolManagementModal`.

```javascript
// In frontend/static/js/dashboard.js

// ... existing code ...

function loadAiTools() {
    fetch(`${BACKEND_URL}/api/ai_tools`)
        .then(response => response.json())
        .then(tools => {
            const aiToolsList = document.getElementById('ai-tools-list');
            if (!aiToolsList) return;

            aiToolsList.innerHTML = ''; // Clear existing tools

            tools.forEach((tool, index) => {
                const toolItem = document.createElement('div');
                toolItem.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');
                toolItem.innerHTML = `
                    <span><i class="${tool.icon} me-2"></i>${tool.name}</span>
                    <div>
                        <button class="btn btn-primary btn-sm me-1 launch-ai-tool" data-url="${tool.url}">Launch</button>
                        <button class="btn btn-info btn-sm me-1 edit-ai-tool" data-id="${index}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-ai-tool" data-id="${index}">Delete</button>
                    </div>
                `;
                aiToolsList.appendChild(toolItem);
            });
            
            // Add event listener for "Add New Tool" button
            const addToolButton = document.createElement('button');
            addToolButton.classList.add('btn', 'btn-success', 'btn-sm', 'mt-3');
            addToolButton.textContent = 'Add New Tool';
            addToolButton.addEventListener('click', () => showAddEditToolDialog());
            aiToolsList.appendChild(addToolButton);

            // Attach event listeners to dynamically created buttons
            document.querySelectorAll('.launch-ai-tool').forEach(button => {
                button.addEventListener('click', function() {
                    window.open(this.dataset.url, '_blank');
                });
            });

            document.querySelectorAll('.edit-ai-tool').forEach(button => {
                button.addEventListener('click', function() {
                    const toolId = this.dataset.id;
                    // Fetch the specific tool data to populate the form for editing
                    fetch(`${BACKEND_URL}/api/ai_tools`)
                        .then(res => res.json())
                        .then(allTools => {
                            const tool = allTools[toolId];
                            showAddEditToolDialog(tool, toolId);
                        });
                });
            });

            document.querySelectorAll('.delete-ai-tool').forEach(button => {
                button.addEventListener('click', function() {
                    deleteAiTool(this.dataset.id);
                });
            });
        })
        .catch(error => {
            console.error('Error loading AI tools:', error);
            alert('Could not load AI tools. Check server logs.');
        });
}
```

### 1.2. Implement `showAddEditToolDialog()` Function

This function will populate the form (`ai-tool-form`) within the modal for editing an existing tool, or clear it for adding a new one.

```javascript
// In frontend/static/js/dashboard.js

// ... existing code ...

function showAddEditToolDialog(tool = null, toolId = null) {
    const form = document.getElementById('ai-tool-form');
    form.reset();
    document.getElementById('tool-id').value = ''; // Clear hidden ID field

    if (tool) {
        document.getElementById('tool-id').value = toolId;
        document.getElementById('tool-name').value = tool.name;
        document.getElementById('tool-url').value = tool.url;
        document.getElementById('tool-icon').value = tool.icon;
        document.getElementById('tool-description').value = tool.description;
    }
}
```

### 1.3. Implement `addAiTool()` Function

This function will send a POST request to the backend to add a new AI tool.

```javascript
// In frontend/static/js/dashboard.js

// ... existing code ...

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
            document.getElementById('ai-tool-form').reset(); // Clear form
            document.getElementById('tool-id').value = ''; // Clear hidden ID
        } else {
            alert('Error adding AI tool: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error adding AI tool:', error);
        alert('Error adding AI tool. Check server logs.');
    });
}
```

### 1.4. Implement `updateAiTool()` Function

This function will send a PUT request to the backend to update an existing AI tool.

```javascript
// In frontend/static/js/dashboard.js

// ... existing code ...

function updateAiTool(toolId, toolData) {
    fetch(`${BACKEND_URL}/api/ai_tools/${toolId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('AI tool updated successfully!');
            loadAiTools(); // Refresh list
            document.getElementById('ai-tool-form').reset(); // Clear form
            document.getElementById('tool-id').value = ''; // Clear hidden ID
        } else {
            alert('Error updating AI tool: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error updating AI tool:', error);
        alert('Error updating AI tool. Check server logs.');
    });
}
```

### 1.5. Implement `deleteAiTool()` Function

This function will send a DELETE request to the backend to delete an AI tool.

```javascript
// In frontend/static/js/dashboard.js

// ... existing code ...

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
        })
        .catch(error => {
            console.error('Error deleting AI tool:', error);
            alert('Error deleting AI tool. Check server logs.');
        });
    }
}
```

### 1.6. Attach Event Listeners for the AI Tool Form

Ensure the form submission and cancel button listeners are correctly attached when the DOM is loaded.

```javascript
// In frontend/static/js/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...

    const aiToolForm = document.getElementById('ai-tool-form');
    if (aiToolForm) {
        aiToolForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const toolId = document.getElementById('tool-id').value;
            const toolData = {
                name: document.getElementById('tool-name').value,
                url: document.getElementById('tool-url').value,
                icon: document.getElementById('tool-icon').value,
                description: document.getElementById('tool-description').value
            };

            if (toolId) {
                updateAiTool(toolId, toolData);
            } else {
                addAiTool(toolData);
            }
        });
    }

    document.getElementById('cancel-edit-tool')?.addEventListener('click', () => {
        document.getElementById('ai-tool-form').reset();
        document.getElementById('tool-id').value = '';
    });

    // ... existing DOMContentLoaded code ...
});
```

## 2. 3D Visualization Integration (Frontend - `frontend/static/js/dashboard.js`)

The 3D application is assumed to be running on `http://localhost:3050`. The dashboard now has a "Aplikacja 3D" link.

**Objective:** Implement the logic to display a 3D model within the dashboard, allowing the user to specify a local file path.

**Tasks:**

### 2.1. Add a 3D Model Widget to `dashboard.js` `widgets` array

Add a new widget definition for 3D visualization.

```javascript
// In frontend/static/js/dashboard.js

const widgets = [
    // ... existing widgets ...
    { id: '3d-viewer', content: '<h4>3D Model Viewer</h4><div id="3d-viewer-content" style="height: 100%;"></div><div class="mt-2"><input type="text" class="form-control" id="3d-model-path" placeholder="Path to .glb model"><button class="btn btn-primary btn-sm mt-2" id="load-3d-model-btn">Load Model</button></div>', w: 6, h: 8 },
];
```

### 2.2. Implement 3D Model Loading Logic

This will involve using Three.js (already included) and `GLTFLoader` (which needs to be imported or loaded from CDN) to load a `.glb` model.

```javascript
// In frontend/static/js/dashboard.js

// Add this import at the top of the file if not already present
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // You might need to adjust the path or load from CDN

// ... existing code ...

// Function to initialize and load 3D model
function init3DViewer() {
    const container = document.getElementById('3d-viewer-content');
    if (!container) return;

    // Basic Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
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
            currentModel.traverse(object => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        const loader = new THREE.GLTFLoader();
        loader.load(path, (gltf) => {
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
        }, undefined, (error) => {
            console.error('An error occurred loading the 3D model:', error);
            alert('Failed to load 3D model. Check console for details.');
        });
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Event listener for load button
    document.getElementById('load-3d-model-btn')?.addEventListener('click', () => {
        const modelPath = document.getElementById('3d-model-path').value;
        if (modelPath) {
            loadGLBModel(modelPath);
        } else {
            alert('Please enter a path to a .glb model file.');
        }
    });
}

// Call init3DViewer when the DOM is ready and the widget is added
document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...

    // After grid.addWidget for '3d-viewer'
    // You might need to ensure the '3d-viewer-content' div is rendered before calling init3DViewer
    // A simple setTimeout can work for testing, but a more robust solution might involve GridStack events
    setTimeout(init3DViewer, 1000); // Delay to ensure the div is in DOM
});
```

### 2.3. Load GLTFLoader from CDN

Add the GLTFLoader script to `dashboard.html` if it's not already part of `three.min.js` or `gridstack-all.js`.

```html
<!-- In frontend/templates/dashboard.html -->
<!-- Add this after your existing Three.js script -->
<script src="https://unpkg.com/three@0.152.0/examples/js/loaders/GLTFLoader.js"></script>
```

## 3. Ulepszenia Innych Przycisków (Ideas)

### 3.1. Analiza tekstu (`analysis-link`)

*   **Integracja z AI Chat**: Po kliknięciu, otwiera sekcję czatu AI, ale z predefiniowanym promptem systemowym ukierunkowanym na analizę tekstu (np. "Jesteś ekspertem od analizy tekstu. Przeanalizuj dostarczony tekst pod kątem...").
*   **Wgrywanie plików tekstowych**: Umożliwienie użytkownikowi wgrania pliku `.txt`, `.docx`, `.pdf` do analizy. Backend musiałby przetworzyć plik na tekst i przekazać do AI.
*   **Podsumowanie/Ekstrakcja kluczowych słów**: Wyświetlanie wyników analizy w dedykowanym widżecie.

### 3.2. Narzędzia (`utilities-link`)

*   **Dynamiczne ładowanie narzędzi**: Podobnie jak w przypadku narzędzi AI, stworzyć backendowe API do zarządzania ogólnymi narzędziami (np. kalkulatory, konwertery jednostek, narzędzia do szyfrowania/deszyfrowania).
*   **Widżety narzędzi**: Każde narzędzie może być osobnym widżetem w GridStack, który użytkownik może dodawać do dashboardu.
*   **Uruchamianie skryptów**: Możliwość uruchamiania predefiniowanych skryptów Pythona/Bash z poziomu dashboardu (z zachowaniem ostrożności i zabezpieczeń).

### 3.3. Przeglądarki (`browsers-link`)

*   **Lista ulubionych przeglądarek/zakładek**: Umożliwienie użytkownikowi dodawania ulubionych stron internetowych lub uruchamiania konkretnych przeglądarek z predefiniowanymi profilami.
*   **Wbudowana przeglądarka**: Opcjonalnie, widżet z wbudowaną, uproszczoną przeglądarką internetową (np. iframe).
*   **Integracja z historią przeglądania**: (Bardzo zaawansowane i wymagające uprawnień) Wyświetlanie statystyk użycia przeglądarek lub historii przeglądania.

---
This `REMAINING_TASKS.md` file should provide a clear roadmap for further development.
