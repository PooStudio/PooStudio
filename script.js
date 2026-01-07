window.addEventListener("load", () => {
    document.getElementById("year").textContent = "PooStudio " + new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4; // Pulled back – perfect distance for a mesmerizing central blob

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // High-res sphere base for smooth morphing
    const geometry = new THREE.SphereGeometry(1.2, 256, 256);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0.0 },
            colorShift: { value: 0.0 }
        },
        vertexShader: `
            uniform float time;
            uniform float colorShift;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying float vDisplacement;

            void main() {
                vNormal = normal;
                vPosition = position;
                
                float dispStrength = 0.6 + sin(time * 0.5) * 0.2;
                float freq1 = 5.0 + sin(time * 0.3) * 1.5;
                float freq2 = 8.0;
                
                float displacement = sin(position.x * freq1 + time * 1.8) * 0.15;
                displacement += sin(position.y * freq2 + time * 2.2) * 0.12;
                displacement += sin(position.z * freq1 * 1.4 + time * 1.5) * 0.1;
                
                vDisplacement = displacement * dispStrength;
                
                vec3 newPosition = position + normal * (displacement * dispStrength);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying float vDisplacement;
            uniform float time;
            uniform float colorShift;

            void main() {
                // Dynamic neon gradient: purple → cyan → pink → brown twist for PooStudio vibes
                vec3 baseColor = vec3(0.4, 0.1, 0.8); // Deep purple base
                vec3 accent1 = vec3(0.0, 0.9, 1.0);   // Cyan glow
                vec3 accent2 = vec3(1.0, 0.4, 0.8);   // Hot pink
                vec3 pooTwist = vec3(0.4, 0.25, 0.1); // Subtle brown undertone
                
                float mixFactor = sin(vPosition.y * 3.0 + time * 1.2 + colorShift) * 0.5 + 0.5;
                float glowPulse = sin(time * 2.0 + vDisplacement * 10.0) * 0.5 + 0.5;
                
                vec3 color = mix(baseColor, accent1, mixFactor);
                color = mix(color, accent2, sin(vPosition.x * 4.0 + time * 1.5) * 0.5 + 0.5);
                color = mix(color, pooTwist, glowPulse * 0.3);
                
                // Rim lighting for extra depth and glow
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float rim = 1.0 - dot(vNormal, lightDir);
                rim = pow(rim, 2.5);
                
                color += vec3(0.3, 0.6, 1.0) * rim * 1.5;
                color += vec3(0.8, 0.2, 0.6) * pow(rim, 4.0); // Pink rim highlight
                
                gl_FragColor = vec4(color * 1.4 + vDisplacement * 0.3, 1.0);
            }
        `,
        side: THREE.DoubleSide,
        wireframe: false
    });

    const blob = new THREE.Mesh(geometry, material);
    scene.add(blob);

    // Outer subtle glow halo
    const glowGeo = new THREE.SphereGeometry(1.4, 64, 64);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x8844ff,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    blob.add(glow);

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        material.uniforms.time.value = time;
        material.uniforms.colorShift.value = time * 0.8;

        // Slow, majestic spin in place
        blob.rotation.y += 0.003;
        blob.rotation.x += 0.0015;

        // Gentle breathing scale
        blob.scale.setScalar(1 + Math.sin(time * 0.7) * 0.08);

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});