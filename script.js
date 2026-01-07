window.addEventListener("load", () => {
    document.getElementById("year").textContent = "PooStudio " + new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Abstract morphing shape using a high-segment sphere with displacement shader
    const geometry = new THREE.SphereGeometry(1.5, 128, 128);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            amplitude: { value: 0.5 }
        },
        vertexShader: `
            uniform float time;
            uniform float amplitude;
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec3 pos = position;
                float dist = length(pos);
                float freq = 4.0 + sin(time * 0.2) * 2.0;
                float disp = sin(dist * freq + time * 1.5) * amplitude;
                disp += sin(dist * (freq * 2.3) + time * 2.1) * (amplitude * 0.6);
                pos += normal * disp;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            void main() {
                vec3 colorA = vec3(0.1, 0.0, 0.3); // Deep purple
                vec3 colorB = vec3(0.0, 0.8, 1.0); // Cyan glow
                vec3 colorC = vec3(1.0, 0.2, 0.8); // Hot pink accents
                float mix1 = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
                float mix2 = sin(vUv.y * 8.0 - time * 1.3) * 0.5 + 0.5;
                vec3 color = mix(colorA, colorB, mix1);
                color = mix(color, colorC, mix2 * 0.4);
                gl_FragColor = vec4(color * 1.5, 1.0);
            }
        `,
        wireframe: false,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add subtle post-processing glow (using additive points or bloom simulation)
    const glowGeometry = new THREE.SphereGeometry(1.8, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    // Gentle auto-rotation
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        material.uniforms.time.value = time;

        mesh.rotation.y += 0.002;
        mesh.rotation.x += 0.001;

        // Pulsing amplitude for breathing morph
        material.uniforms.amplitude.value = 0.4 + Math.sin(time * 0.8) * 0.2;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});