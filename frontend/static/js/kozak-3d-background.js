/**
 * KOZAK 3D Background Engine
 * Advanced geometric abstractions with space-age aesthetics
 */

class KOZAK3DBackground {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
        this.geometricShapes = [];
        this.animationId = null;
        
        this.config = {
            particleCount: 150,
            shapeCount: 12,
            colors: {
                primary: 0x00d4ff,   // Cyber blue
                secondary: 0xff6b35, // Electric orange  
                accent: 0x9d4edd,    // Purple
                grid: 0x0066cc       // Deep blue
            },
            animation: {
                speed: 0.002,
                floatAmplitude: 2,
                rotationSpeed: 0.01
            }
        };
        
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLighting();
        this.createGeometricField();
        this.createParticleSystem();
        this.createFloatingShapes();
        this.startAnimation();
        this.handleResize();
    }

    setupRenderer() {
        const canvas = document.getElementById('bg-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Enhanced rendering
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 50);
        
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 50, 200);
    }

    setupLighting() {
        // Ambient lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(this.config.colors.primary, 1);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Accent lights
        const light1 = new THREE.PointLight(this.config.colors.secondary, 0.8, 100);
        light1.position.set(-30, 20, -10);
        this.scene.add(light1);

        const light2 = new THREE.PointLight(this.config.colors.accent, 0.6, 80);
        light2.position.set(30, -20, 10);
        this.scene.add(light2);
    }

    createGeometricField() {
        // Создаем сетку из линий
        const gridSize = 100;
        const divisions = 20;
        
        const gridHelper = new THREE.GridHelper(gridSize, divisions, 
            this.config.colors.grid, this.config.colors.grid);
        gridHelper.position.y = -20;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);

        // Вертикальная сетка
        const verticalGrid = new THREE.GridHelper(gridSize, divisions, 
            this.config.colors.grid, this.config.colors.grid);
        verticalGrid.rotateZ(Math.PI / 2);
        verticalGrid.position.z = -20;
        verticalGrid.material.opacity = 0.2;
        verticalGrid.material.transparent = true;
        this.scene.add(verticalGrid);
    }

    createParticleSystem() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.config.particleCount * 3);
        const colors = new Float32Array(this.config.particleCount * 3);
        const sizes = new Float32Array(this.config.particleCount);

        const colorPalette = [
            new THREE.Color(this.config.colors.primary),
            new THREE.Color(this.config.colors.secondary),
            new THREE.Color(this.config.colors.accent)
        ];

        for (let i = 0; i < this.config.particleCount; i++) {
            const i3 = i * 3;
            
            // Позиции
            positions[i3] = (Math.random() - 0.5) * 200;
            positions[i3 + 1] = (Math.random() - 0.5) * 200;
            positions[i3 + 2] = (Math.random() - 0.5) * 200;

            // Цвета
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Размеры
            sizes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Добавляем мягкое движение
                    mvPosition.x += sin(time + position.y * 0.01) * 2.0;
                    mvPosition.y += cos(time + position.x * 0.01) * 1.5;
                    
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float dist = distance(gl_PointCoord, vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - (dist * 2.0);
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createFloatingShapes() {
        const shapes = [
            { geometry: new THREE.OctahedronGeometry(2), count: 4 },
            { geometry: new THREE.TetrahedronGeometry(3), count: 3 },
            { geometry: new THREE.IcosahedronGeometry(2.5), count: 3 },
            { geometry: new THREE.DodecahedronGeometry(2), count: 2 }
        ];

        shapes.forEach(shape => {
            for (let i = 0; i < shape.count; i++) {
                const material = new THREE.MeshPhongMaterial({
                    color: this.getRandomColor(),
                    transparent: true,
                    opacity: 0.7,
                    shininess: 100,
                    wireframe: Math.random() > 0.5
                });

                const mesh = new THREE.Mesh(shape.geometry, material);
                
                // Случайная позиция
                mesh.position.set(
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 80
                );

                // Случайное вращение
                mesh.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );

                // Сохраняем изначальную позицию для анимации
                mesh.userData = {
                    originalPosition: mesh.position.clone(),
                    rotationSpeed: {
                        x: (Math.random() - 0.5) * 0.02,
                        y: (Math.random() - 0.5) * 0.02,
                        z: (Math.random() - 0.5) * 0.02
                    },
                    floatSpeed: Math.random() * 0.02 + 0.01
                };

                this.geometricShapes.push(mesh);
                this.scene.add(mesh);
            }
        });
    }

    getRandomColor() {
        const colors = [
            this.config.colors.primary,
            this.config.colors.secondary,
            this.config.colors.accent
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animate(time) {
        this.animationId = requestAnimationFrame((t) => this.animate(t));

        const elapsedTime = time * 0.001;

        // Анимация частиц
        if (this.particles && this.particles.material.uniforms) {
            this.particles.material.uniforms.time.value = elapsedTime;
            this.particles.rotation.y += this.config.animation.speed;
        }

        // Анимация геометрических фигур
        this.geometricShapes.forEach(shape => {
            const userData = shape.userData;
            
            // Вращение
            shape.rotation.x += userData.rotationSpeed.x;
            shape.rotation.y += userData.rotationSpeed.y;
            shape.rotation.z += userData.rotationSpeed.z;

            // Плавание вверх-вниз
            shape.position.y = userData.originalPosition.y + 
                Math.sin(elapsedTime * userData.floatSpeed) * this.config.animation.floatAmplitude;
        });

        // Плавное движение камеры
        this.camera.position.x += (Math.sin(elapsedTime * 0.0005) * 50 - this.camera.position.x) * 0.001;
        this.camera.position.y += (Math.cos(elapsedTime * 0.0003) * 20 - this.camera.position.y) * 0.001;
        
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    startAnimation() {
        this.animate(0);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Очистка ресурсов
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        this.renderer.dispose();
    }
}

// Инициализация при загрузке страницы
let kozak3D = null;

document.addEventListener('DOMContentLoaded', () => {
    try {
        kozak3D = new KOZAK3DBackground();
        console.log('KOZAK 3D Background initialized successfully');
    } catch (error) {
        console.error('Failed to initialize KOZAK 3D Background:', error);
    }
});

// Экспорт для возможного использования в других модулях
window.KOZAK3DBackground = KOZAK3DBackground;
