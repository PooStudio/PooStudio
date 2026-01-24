window.addEventListener("load", () => {
    const container = document.getElementById("three-container");
    if (!container) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.5,
        1000
    );
    camera.position.z = isMobile ? 220 : 300;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    let NODE_COUNT = isMobile ? 2200 : 4200; // Will adjust based on total users
    const MAX_LINKS = isMobile ? 4000 : 9000;
    const SPHERE_RADIUS = 85;
    const LINK_DISTANCE = isMobile ? 16 : 20;

    const HOT_RATIO = 0.1;
    const HOT_FORCE = 2.6;

    let positions, basePositions, colors, heat;

    // Country colors (add more as needed)
    const countryColors = {
        US: new THREE.Color(0x0000ff), // Blue
        CA: new THREE.Color(0xff0000), // Red
        // Add e.g., GB: new THREE.Color(0x00ff00)
    };

    function initNodes(data) {
        const total = data.total || 100;
        NODE_COUNT = Math.min(total, NODE_COUNT); // Cap nodes to total users
        positions = new Float32Array(NODE_COUNT * 3);
        basePositions = new Float32Array(NODE_COUNT * 3);
        colors = new Float32Array(NODE_COUNT * 3);
        heat = new Float32Array(NODE_COUNT);

        const countries = data.countries || {};
        const countryList = Object.entries(countries);
        let nodeIndex = 0;

        countryList.forEach(([country, count]) => {
            const countryCol = countryColors[country] || new THREE.Color(Math.random(), Math.random(), Math.random());
            for (let i = 0; i < Math.min(count, NODE_COUNT - nodeIndex); i++) {
                const idx = nodeIndex + i;
                const u = Math.random();
                const v = Math.random();

                const r = SPHERE_RADIUS * Math.cbrt(Math.random());
                const theta = u * Math.PI * 2;
                const phi = Math.acos(2 * v - 1);

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.cos(phi);
                const z = r * Math.sin(phi) * Math.sin(theta);

                positions.set([x, y, z], idx * 3);
                basePositions.set([x, y, z], idx * 3);

                const isHot = Math.random() < HOT_RATIO;
                heat[idx] = isHot ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4;

                // Blend with country color
                const col = countryCol.clone().multiplyScalar(0.5 + heat[idx] * 0.5);

                colors.set([col.r, col.g, col.b], idx * 3);
            }
            nodeIndex += count;
        });

        // Fill remaining with default if needed
        for (let i = nodeIndex; i < NODE_COUNT; i++) {
            // Similar loop as above, with default color
            const u = Math.random();
            const v = Math.random();

            const r = SPHERE_RADIUS * Math.cbrt(Math.random());
            const theta = u * Math.PI * 2;
            const phi = Math.acos(2 * v - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.cos(phi);
            const z = r * Math.sin(phi) * Math.sin(theta);

            positions.set([x, y, z], i * 3);
            basePositions.set([x, y, z], i * 3);

            const isHot = Math.random() < HOT_RATIO;
            heat[i] = isHot ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4;

            const col = new THREE.Color().setHSL(
                0.08 - heat[i] * 0.03,
                0.85,
                0.35 + heat[i] * 0.5
            );

            colors.set([col.r, col.g, col.b], i * 3);
        }
    }

    // Fetch and init
    fetch('/api/user-stats')
        .then(response => response.json())
        .then(data => {
            initNodes(data);

            const nodeGeo = new THREE.BufferGeometry();
            nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            nodeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

            const nodeMat = new THREE.PointsMaterial({
                size: isMobile ? 1.6 : 2.2,
                vertexColors: true,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const nodes = new THREE.Points(nodeGeo, nodeMat);
            scene.add(nodes);

            const linkPositions = new Float32Array(MAX_LINKS * 6);
            const linkColors = new Float32Array(MAX_LINKS * 6);

            const linkGeo = new THREE.BufferGeometry();
            linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
            linkGeo.setAttribute("color", new THREE.BufferAttribute(linkColors, 3));

            const linkMat = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const links = new THREE.LineSegments(linkGeo, linkMat);
            scene.add(links);

            function updateLinks() {
                let count = 0;
                const pos = nodeGeo.attributes.position.array;

                for (let i = 0; i < NODE_COUNT; i += 2) {
                    for (let j = i + 2; j < NODE_COUNT; j += 2) {
                        const i3 = i * 3;
                        const j3 = j * 3;

                        const dx = pos[i3] - pos[j3];
                        const dy = pos[i3 + 1] - pos[j3 + 1];
                        const dz = pos[i3 + 2] - pos[j3 + 2];
                        const d2 = dx*dx + dy*dy + dz*dz;

                        if (d2 < LINK_DISTANCE * LINK_DISTANCE) {
                            const strength = 1 - Math.sqrt(d2) / LINK_DISTANCE;
                            const weight = strength * (heat[i] + heat[j]) * 0.5;

                            linkPositions.set([
                                pos[i3], pos[i3+1], pos[i3+2],
                                pos[j3], pos[j3+1], pos[j3+2]
                            ], count * 6);

                            const c = new THREE.Color().setHSL(
                                0.08 - weight * 0.05,
                                0.9,
                                0.3 + weight * 0.6
                            );

                            linkColors.set([c.r, c.g, c.b, c.r, c.g, c.b], count * 6);

                            count++;
                            if (count >= MAX_LINKS) break;
                        }
                    }
                    if (count >= MAX_LINKS) break;
                }

                linkGeo.setDrawRange(0, count * 2);
                linkGeo.attributes.position.needsUpdate = true;
                linkGeo.attributes.color.needsUpdate = true;
            }

            let frame = 0;

            function animate(t) {
                requestAnimationFrame(animate);
                const time = t * 0.001;

                nodes.rotation.y += 0.0006;
                nodes.rotation.x += 0.0003;
                links.rotation.copy(nodes.rotation);

                const pos = nodeGeo.attributes.position.array;
                const col = nodeGeo.attributes.color.array;

                for (let i = 0; i < NODE_COUNT; i++) {
                    const i3 = i * 3;
                    const pulse = Math.sin(time * (1 + heat[i] * HOT_FORCE) + i) * 0.35;

                    pos[i3]     = basePositions[i3]     + pulse;
                    pos[i3 + 1] = basePositions[i3 + 1] + pulse * 0.8;
                    pos[i3 + 2] = basePositions[i3 + 2] + pulse;

                    // Update color with pulse
                    const baseCol = new THREE.Color(col[i3], col[i3+1], col[i3+2]);
                    const pulsedCol = baseCol.clone().multiplyScalar(1 + Math.abs(pulse) * 0.2);
                    col[i3] = pulsedCol.r;
                    col[i3 + 1] = pulsedCol.g;
                    col[i3 + 2] = pulsedCol.b;
                }

                nodeGeo.attributes.position.needsUpdate = true;
                nodeGeo.attributes.color.needsUpdate = true;

                if (frame++ % (isMobile ? 6 : 4) === 0) updateLinks();

                // Periodic refresh data
                if (frame % 600 === 0) { // ~10 secs
                    fetch('/api/user-stats')
                        .then(response => response.json())
                        .then(newData => initNodes(newData)); // Re-init if changes big
                }

                camera.lookAt(0, 0, 0);
                renderer.render(scene, camera);
            }

            animate(0);
        })
        .catch(error => console.error('Error:', error));

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});