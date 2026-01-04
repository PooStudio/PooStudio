window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById('three-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const particleCount = 2500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const radius = 18 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = (radius + Math.random() * 8 - 4) * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const color = new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 0.4, 0.6 + Math.random() * 0.3);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const maxLines = 5000;
    const linePositions = new Float32Array(maxLines * 6);
    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.15 });
    const lines = new THREE.LineSegments(linesGeo, lineMat);
    scene.add(lines);

    function updateLines() {
        let index = 0;
        const pos = geometry.attributes.position.array;
        for (let i = 0; i < particleCount && index < maxLines * 6; i++) {
            for (let j = i + 1; j < particleCount && index < maxLines * 6; j++) {
                const dx = pos[i*3] - pos[j*3];
                const dy = pos[i*3+1] - pos[j*3+1];
                const dz = pos[i*3+2] - pos[j*3+2];
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (dist < 10) {
                    linePositions[index++] = pos[i*3];
                    linePositions[index++] = pos[i*3+1];
                    linePositions[index++] = pos[i*3+2];
                    linePositions[index++] = pos[j*3];
                    linePositions[index++] = pos[j*3+1];
                    linePositions[index++] = pos[j*3+2];
                }
            }
        }
        linesGeo.setDrawRange(0, index / 3);
        linesGeo.attributes.position.needsUpdate = true;
    }

    camera.position.z = 80;

    const mouse = { x: 0, y: 0 };
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    function animate() {
        requestAnimationFrame(animate);
        points.rotation.y += 0.0004;
        lines.rotation.y += 0.0004;
        points.rotation.x += mouse.y * 0.0002;
        updateLines();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});