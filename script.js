window.addEventListener("load", () => {
    document.getElementById("year").textContent = "PooStudio " + new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 12, 130);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Add some lighting for shine and depth
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2, 200);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // Group so lines and points rotate together perfectly
    const poopGroup = new THREE.Group();
    scene.add(poopGroup);

    const PARTICLE_COUNT = 6000; // More particles for fuller look
    const LOG_LENGTH = 120; // Longer for epic turd
    const BASE_RADIUS = 20; // Thicker base

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const u = Math.random();
        const s = Math.abs(Math.pow(u - 0.5, 0.5) * 2);

        let x = (s - 0.5) * LOG_LENGTH;
        const bend = Math.sin(s * Math.PI * 1.5) * 12; // More pronounced arch for coily feel

        const taper = 1 - Math.pow(Math.abs(s - 0.5) * 2, 1.8); // Smoother taper
        const lump = Math.sin(s * Math.PI * 18) * 4.5 + Math.sin(s * Math.PI * 8) * 3; // More lumpy for realism
        const noise = (Math.random() - 0.5) * 3;

        const radius = BASE_RADIUS * taper + lump + noise;
        const theta = Math.random() * Math.PI * 2;

        let posX = x + (Math.random() - 0.5) * 4;
        let posY = radius * Math.cos(theta) + bend + (Math.random() - 0.5) * 3.5;
        let posZ = radius * Math.sin(theta) + (Math.random() - 0.5) * 4;

        // Add creative twist for "full blown turd" spiral effect
        const twist_angle = posX * 0.08; // Stronger twist to make it coil like soft-serve
        const tempY = posY;
        const tempZ = posZ;
        posY = tempY * Math.cos(twist_angle) - tempZ * Math.sin(twist_angle);
        posZ = tempY * Math.sin(twist_angle) + tempZ * Math.cos(twist_angle);

        positions.set([posX, posY, posZ], i * 3);
        basePositions.set([posX, posY, posZ], i * 3);

        // Enhanced poop colors — varied browns with glossy highlights
        const hue = 0.06 + Math.random() * 0.04;
        const saturation = 0.7 + Math.random() * 0.3;
        const lightness = 0.12 + Math.random() * 0.12 + Math.max(0, lump) * 0.06;
        const c = new THREE.Color().setHSL(hue, saturation, lightness);
        colors.set([c.r, c.g, c.b], i * 3);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    poopGroup.add(points);

    // Lines for texture and connections
    const MAX_CONNECTIONS = 12000; // More for denser look
    const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({
            color: 0x1a0b00,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    poopGroup.add(lines);

    function updateConnections() {
        let idx = 0;
        const pos = geometry.attributes.position.array;
        const maxDistSq = 196; // Slightly larger for more connections

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT; j++) {
                const i3 = i * 3, j3 = j * 3;
                const dx = pos[i3] - pos[j3];
                const dy = pos[i3+1] - pos[j3+1];
                const dz = pos[i3+2] - pos[j3+2];
                if (dx*dx + dy*dy + dz*dz < maxDistSq) {
                    linePositions[idx++] = pos[i3];
                    linePositions[idx++] = pos[i3+1];
                    linePositions[idx++] = pos[i3+2];
                    linePositions[idx++] = pos[j3];
                    linePositions[idx++] = pos[j3+1];
                    linePositions[idx++] = pos[j3+2];
                    if (idx >= MAX_CONNECTIONS * 6) {
                        lineGeo.setDrawRange(0, idx / 3);
                        lineGeo.attributes.position.needsUpdate = true;
                        return;
                    }
                }
            }
        }
        lineGeo.setDrawRange(0, idx / 3);
        lineGeo.attributes.position.needsUpdate = true;
    }

    // Add PooStudio 3D text watermark with creativity (glowing red)
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new THREE.TextGeometry('PooStudio', {
            font: font,
            size: 12,
            height: 3,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelOffset: 0,
            bevelSegments: 5
        });
        const textMaterial = new THREE.MeshPhongMaterial({ color: 0xff4500, specular: 0xffffff, shininess: 100 });
        const text = new THREE.Mesh(textGeometry, textMaterial);
        text.position.set(-60, 60, -20); // Position above the turd
        scene.add(text);

        // Animate text glow pulse
        function animateText(t) {
            textMaterial.emissiveIntensity = 0.5 + Math.sin(t * 0.005) * 0.5;
        }
        // Call in animate loop below
    });

    let frame = 0;
    let time = 0;
    function animate(t) {
        requestAnimationFrame(animate);
        time = t * 0.001;

        // Stronger breathing for "full blown" effect
        const pulse = 1 + Math.sin(time * 1.2) * 0.012;
        poopGroup.scale.setScalar(pulse);

        // Enhanced organic wobble with twist animation
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = time * 0.8 + i * 0.01;
            let wobbleX = basePositions[i3] + Math.sin(phase) * 1.2;
            let wobbleY = basePositions[i3 + 1] + Math.cos(phase * 1.4) * 0.9;
            let wobbleZ = basePositions[i3 + 2] + Math.sin(phase * 1.0) * 1.0;

            // Animate twist for dynamic coiling
            const dynamic_twist = (wobbleX * 0.08) + Math.sin(time * 0.2) * 0.02;
            const tempY = wobbleY;
            const tempZ = wobbleZ;
            wobbleY = tempY * Math.cos(dynamic_twist) - tempZ * Math.sin(dynamic_twist);
            wobbleZ = tempY * Math.sin(dynamic_twist) + tempZ * Math.cos(dynamic_twist);

            pos[i3] = wobbleX;
            pos[i3 + 1] = wobbleY;
            pos[i3 + 2] = wobbleZ;
        }
        geometry.attributes.position.needsUpdate = true;

        // Faster smooth rotation for epic spin
        poopGroup.rotation.y += 0.004; // Faster spin to show off the full turd
        poopGroup.rotation.x = 0.18;

        camera.lookAt(0, 5, 0);

        if (frame++ % 3 === 0) updateConnections();

        // Animate text if loaded (safe call)
        if (typeof animateText === 'function') animateText(t);

        renderer.render(scene, camera);
    }

    animate(0);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});