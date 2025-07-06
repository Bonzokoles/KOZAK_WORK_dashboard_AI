// 3d_visualizations.js - Enhanced with missing objects
class DataVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;

    // 3D Objects (missing from original)
    this.blueCube = null;
    this.blackRectangle = null;
    this.grayGround = null;
    this.pointCloud = null;

    // Animation controls
    this.clock = new THREE.Clock();
    this.animationSpeed = 1.0;

    this.init();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLights();
    this.createObjects();
    this.createControls();
    this.startAnimation();
    this.handleResize();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a); // Dark background
    this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 100);
  }

  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.appendChild(this.renderer.domElement);
  }

  createLights() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // Main directional light with neon blue tint
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);

    // Point light for dramatic effect
    const pointLight = new THREE.PointLight(0x00ffff, 0.8, 30);
    pointLight.position.set(0, 8, 0);
    this.scene.add(pointLight);
  }

  createObjects() {
    this.createGrayGround();
    this.createBlueCube();
    this.createBlackRectangle();
    this.createPointCloud();
  }

  createGrayGround() {
    // Gray ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.8,
    });

    this.grayGround = new THREE.Mesh(groundGeometry, groundMaterial);
    this.grayGround.rotation.x = -Math.PI / 2;
    this.grayGround.position.y = -2;
    this.grayGround.receiveShadow = true;

    // Add subtle grid pattern
    const gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x444444);
    gridHelper.position.y = -1.99;

    this.scene.add(this.grayGround);
    this.scene.add(gridHelper);
  }

  createBlueCube() {
    // Animated blue cube with neon glow
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0088ff,
      emissive: 0x002244,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });

    this.blueCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.blueCube.position.set(-3, 1, 0);
    this.blueCube.castShadow = true;

    // Add wireframe for cyberpunk effect
    const wireframeGeometry = new THREE.EdgesGeometry(cubeGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      linewidth: 2,
    });
    const wireframe = new THREE.LineSegments(
      wireframeGeometry,
      wireframeMaterial
    );
    this.blueCube.add(wireframe);

    this.scene.add(this.blueCube);
  }

  createBlackRectangle() {
    // Black rectangular object
    const rectangleGeometry = new THREE.BoxGeometry(4, 1, 1.5);
    const rectangleMaterial = new THREE.MeshPhongMaterial({
      color: 0x111111,
      emissive: 0x001122,
      shininess: 50,
      transparent: true,
      opacity: 0.95,
    });

    this.blackRectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
    this.blackRectangle.position.set(3, 0.5, 0);
    this.blackRectangle.castShadow = true;

    // Add glowing edges
    const edgesGeometry = new THREE.EdgesGeometry(rectangleGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      opacity: 0.6,
      transparent: true,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.blackRectangle.add(edges);

    this.scene.add(this.blackRectangle);
  }

  createPointCloud() {
    // Enhanced point cloud for data visualization
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Distribute points in a spherical pattern
      const radius = 8 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Neon color variations
      const colorIntensity = 0.5 + Math.random() * 0.5;
      colors[i3] = 0;
      colors[i3 + 1] = colorIntensity;
      colors[i3 + 2] = colorIntensity;
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    pointGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pointMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    this.pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    this.scene.add(this.pointCloud);
  }

  createControls() {
    // Add orbit controls for better interaction
    if (window.THREE && THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(
        this.camera,
        this.renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 30;
      this.controls.minDistance = 5;
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    // Animate blue cube - rotation and floating
    if (this.blueCube) {
      this.blueCube.rotation.x = elapsedTime * 0.5;
      this.blueCube.rotation.y = elapsedTime * 0.3;
      this.blueCube.position.y = 1 + Math.sin(elapsedTime * 2) * 0.3;
    }

    // Animate black rectangle - subtle rotation
    if (this.blackRectangle) {
      this.blackRectangle.rotation.y = Math.sin(elapsedTime * 0.8) * 0.2;
      this.blackRectangle.rotation.z = Math.sin(elapsedTime * 0.6) * 0.1;
    }

    // Animate point cloud - rotation and pulsing
    if (this.pointCloud) {
      this.pointCloud.rotation.y = elapsedTime * 0.1;
      this.pointCloud.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;

      // Pulsing effect
      const scale = 1 + Math.sin(elapsedTime * 1.5) * 0.1;
      this.pointCloud.scale.set(scale, scale, scale);
    }

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  startAnimation() {
    this.animate();
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  handleResize() {
    window.addEventListener("resize", () => {
      if (!this.container) return;

      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  // Performance optimization
  dispose() {
    this.stopAnimation();

    // Clean up geometries and materials
    this.scene.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.renderer.dispose();

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  // API for external control
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  toggleObject(objectName, visible) {
    const object = this[objectName];
    if (object) {
      object.visible = visible;
    }
  }

  resetCamera() {
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
    if (this.controls) {
      this.controls.reset();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const visualizer = new DataVisualizer("visualization-container");

  // Make globally accessible for debugging
  window.dataVisualizer = visualizer;

  console.log("🎯 3D Visualization Enhanced with:", {
    "Blue Cube": "✅ Animated floating cube with neon glow",
    "Black Rectangle": "✅ Rotating rectangular object",
    "Gray Ground": "✅ Ground plane with grid pattern",
    "Point Cloud": "✅ Animated particle system",
    Performance: "✅ Optimized rendering and cleanup",
  });
});
