window.addEventListener("load", () => {
    const container = document.getElementById("three-container");
    if (!container) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    // ======== SOFT FADE-IN OVERLAY (FRUTIGER AERO STYLE) ========
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "radial-gradient(circle at 50% 40%, rgba(120,255,255,0.25), rgba(0,0,0,0.95))";
    overlay.style.backdropFilter = "blur(18px)";
    overlay.style.zIndex = "9999";
    overlay.style.transition = "opacity 1.4s ease";
    document.body.appendChild(overlay);

    fetch('/api/active-users')
        .then(response => response.json())
        .then(data => {
            let activeUsers = data.count || 100;
            let HOT_RATIO = Math.min(0.12 + (activeUsers / 8000) * 0.28, 0.38);

            const scene = new THREE.Scene();

            const camera = new THREE.PerspectiveCamera(
                66,
                window.innerWidth / window.innerHeight,
                0.5,
                1200
            );
            camera.position.z = isMobile ? 240 : 190;

            const renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance"
            });
            renderer.setPixelRatio(DPR);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 0);
            container.appendChild(renderer.domElement);

            const NODE_COUNT = isMobile ? 2400 : 4600;
            const MAX_LINKS = isMobile ? 8000 : 16000;
            const SPHERE_RADIUS = 92;
            const LINK_DISTANCE = isMobile ? 18 : 23;

            const positions = new Float32Array(NODE_COUNT * 3);
            const basePositions = new Float32Array(NODE_COUNT * 3);
            const colors = new Float32Array(NODE_COUNT * 3);
            const heat = new Float32Array(NODE_COUNT);

            for (let i = 0; i < NODE_COUNT; i++) {
                const r = SPHERE_RADIUS * Math.cbrt(Math.random());
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.cos(phi);
                const z = r * Math.sin(phi) * Math.sin(theta);

                positions.set([x, y, z], i * 3);
                basePositions.set([x, y, z], i * 3);

                const isHot = Math.random() < HOT_RATIO;
                heat[i] = isHot ? 0.75 + Math.random() * 0.25 : Math.random() * 0.45;

                const hue = 0.52 + heat[i] * 0.42;
                const col = new THREE.Color().setHSL(hue, 0.95, 0.42 + heat[i] * 0.52);

                colors.set([col.r, col.g, col.b], i * 3);
            }

            const nodeGeo = new THREE.BufferGeometry();
            nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            nodeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

            const nodeMat = new THREE.PointsMaterial({
                size: isMobile ? 1.8 : 2.4,
                vertexColors: true,
                transparent: true,
                opacity: 0.97,
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
                opacity: 0.42,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const links = new THREE.LineSegments(linkGeo, linkMat);
            scene.add(links);

            const loader = new THREE.FontLoader();
            loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
                const textGeometry = new THREE.TextGeometry('Postudio', {
                    font: font,
                    size: isMobile ? 9.5 : 13.5,
                    height: 2.2,
                    bevelEnabled: true,
                    bevelThickness: 0.6,
                    bevelSize: 0.35,
                    bevelSegments: 6
                });

                const textMaterial = new THREE.MeshBasicMaterial({
                    color: 0x7fffff,
                    transparent: true,
                    opacity: 0.92
                });

                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(0, 8, SPHERE_RADIUS + 18);
                textMesh.name = 'postudioText';
                scene.add(textMesh);
            });

            function updateLinks() {
                let count = 0;
                const pos = nodeGeo.attributes.position.array;
                const maxNeighbors = isMobile ? 5 : 9;

                for (let i = 0; i < NODE_COUNT; i++) {
                    let connected = 0;
                    for (let attempt = 0; attempt < 75 && connected < maxNeighbors; attempt++) {
                        let j = Math.floor(Math.random() * NODE_COUNT);
                        if (j === i || j < i) continue;

                        const i3 = i * 3;
                        const j3 = j * 3;
                        const dx = pos[i3] - pos[j3];
                        const dy = pos[i3 + 1] - pos[j3 + 1];
                        const dz = pos[i3 + 2] - pos[j3 + 2];
                        const d2 = dx*dx + dy*dy + dz*dz;

                        if (d2 < LINK_DISTANCE * LINK_DISTANCE) {
                            const strength = 1 - Math.sqrt(d2) / LINK_DISTANCE;
                            const weight = strength * (heat[i] + heat[j]) * 0.6;

                            linkPositions.set([
                                pos[i3], pos[i3+1], pos[i3+2],
                                pos[j3], pos[j3+1], pos[j3+2]
                            ], count);

                            const c = new THREE.Color().setHSL(0.55 + weight * 0.3, 0.9, 0.55);
                            linkColors.set([c.r, c.g, c.b, c.r, c.g, c.b], count);

                            count += 6;
                            connected++;
                            if (count >= MAX_LINKS * 6) break;
                        }
                    }
                    if (count >= MAX_LINKS * 6) break;
                }

                linkGeo.setDrawRange(0, count / 3);
                linkGeo.attributes.position.needsUpdate = true;
                linkGeo.attributes.color.needsUpdate = true;
            }

            let frame = 0;

            function animate(t) {
                requestAnimationFrame(animate);
                const time = t * 0.001;

                // ===== FLOATING BOB EFFECT =====
                const floatY = Math.sin(time * 0.6) * 6;
                const floatX = Math.sin(time * 0.3) * 4;

                nodes.rotation.y += 0.0006;
                nodes.rotation.x += 0.00025;
                nodes.position.y = floatY;
                nodes.position.x = floatX;

                links.rotation.copy(nodes.rotation);
                links.position.copy(nodes.position);

                camera.position.y = Math.sin(time * 0.4) * 10;
                camera.lookAt(0, 0, 0);

                const pos = nodeGeo.attributes.position.array;
                const col = nodeGeo.attributes.color.array;

                for (let i = 0; i < NODE_COUNT; i++) {
                    const i3 = i * 3;
                    const pulse = Math.sin(time * (2 + heat[i] * 3) + i) * 0.4;

                    pos[i3] = basePositions[i3] + pulse;
                    pos[i3 + 1] = basePositions[i3 + 1] + pulse;
                    pos[i3 + 2] = basePositions[i3 + 2] + pulse;

                    const c = new THREE.Color().setHSL(0.52 + heat[i] * 0.42, 0.95, 0.5 + Math.abs(pulse) * 0.3);
                    col[i3] = c.r;
                    col[i3 + 1] = c.g;
                    col[i3 + 2] = c.b;
                }

                nodeGeo.attributes.position.needsUpdate = true;
                nodeGeo.attributes.color.needsUpdate = true;

                if (frame % 6 === 0) updateLinks();

                renderer.render(scene, camera);
                frame++;

                // fade overlay away once running
                if (overlay && frame === 20) {
                    overlay.style.opacity = "0";
                    setTimeout(() => overlay.remove(), 1500);
                }
            }

            animate(0);

            window.addEventListener("resize", () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

        })
        .catch(err => console.error('Three.js background init failed:', err));
});
