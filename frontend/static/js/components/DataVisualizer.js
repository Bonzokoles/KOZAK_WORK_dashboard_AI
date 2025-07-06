/**
 * DataVisualizer class for 3D visualization using Three.js
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class DataVisualizer {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.points = [];
        this.animationFrame = null;
        this.dataPoints = [];

        this.init();
    }

    init() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();

        // Set up camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;

        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById(this.canvasId),
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // Initialize controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
    }

    createDataPoints(count = 100) {
        // Clear existing points
        this.points.forEach(point => this.scene.remove(point));
        this.points = [];

        // Create geometry for instanced points
        const geometry = new THREE.SphereGeometry(0.25, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });

        // Create random points in 3D space
        for (let i = 0; i < count; i++) {
            const point = new THREE.Mesh(geometry, material.clone());

            // Random position
            point.position.x = (Math.random() - 0.5) * 100;
            point.position.y = (Math.random() - 0.5) * 100;
            point.position.z = (Math.random() - 0.5) * 100;

            // Random color based on position
            point.material.color.setHSL(
                Math.abs(point.position.x) / 100,
                0.8,
                0.5
            );

            // Store initial position for animation
            point.userData.initialY = point.position.y;
            point.userData.phase = Math.random() * Math.PI * 2;
            point.userData.speed = 0.5 + Math.random();

            this.points.push(point);
            this.scene.add(point);
        }
    }

    updateDataPoints(data) {
        // Update points based on new data
        this.points.forEach((point, index) => {
            if (data && data[index]) {
                const value = data[index];
                point.position.y = point.userData.initialY + Math.sin(value) * 5;
                point.material.color.setHSL(value, 0.8, 0.5);
            }
        });
    }

    animate() {
        this.animationFrame = requestAnimationFrame(() => this.animate());

        // Animate points
        const time = Date.now() * 0.001;
        this.points.forEach(point => {
            point.position.y = point.userData.initialY +
                Math.sin(time * point.userData.speed + point.userData.phase) * 2;

            // Slowly rotate color
            const hue = (Math.sin(time * 0.1 + point.userData.phase) + 1) / 2;
            point.material.color.setHSL(hue, 0.8, 0.5);
        });

        // Update controls
        this.controls.update();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        // Clean up resources
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Dispose geometries and materials
        this.points.forEach(point => {
            point.geometry.dispose();
            point.material.dispose();
            this.scene.remove(point);
        });

        // Clear arrays
        this.points = [];
        this.dataPoints = [];

        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
    }

    setPointColor(index, color) {
        if (this.points[index]) {
            this.points[index].material.color.set(color);
        }
    }

    setPointSize(index, size) {
        if (this.points[index]) {
            this.points[index].scale.set(size, size, size);
        }
    }

    setPointPosition(index, x, y, z) {
        if (this.points[index]) {
            this.points[index].position.set(x, y, z);
            this.points[index].userData.initialY = y;
        }
    }

    addDataPoint(value) {
        this.dataPoints.push(value);
        if (this.dataPoints.length > this.points.length) {
            this.dataPoints.shift();
        }
        this.updateDataPoints(this.dataPoints);
    }

    clearData() {
        this.dataPoints = [];
        this.points.forEach(point => {
            point.position.y = point.userData.initialY;
            point.material.color.setHSL(0.33, 0.8, 0.5);
        });
    }

    setAnimationSpeed(speed) {
        this.points.forEach(point => {
            point.userData.speed = speed * point.userData.speed / Math.abs(point.userData.speed);
        });
    }

    setCameraPosition(x, y, z) {
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }

    enableControls(enabled) {
        this.controls.enabled = enabled;
    }

    setBackgroundColor(color) {
        this.scene.background = new THREE.Color(color);
    }
}
