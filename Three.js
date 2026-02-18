window.addEventListener("load", () => {
    const container = document.getElementById("three-container");
    if (!container) return;

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    // ============== Y2K NEON FIRE SETUP ==============
    fetch('/api/active-users')
        .then(response => response.json())
        .then(data => {
            let activeUsers = data.count || 100;
            let HOT_RATIO = Math.min(0.12 + (activeUsers / 8000) * 0.28, 0.38); // more reactive

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

                const hue = 0.52 + heat[i] * 0.42; // cyan → purple → magenta
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

            // ============== LINKS ==============
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

            // ============== POSTUDIO HOLO TEXT (Y2K cycling) ==============
            const loader = new THREE.FontLoader();
            loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
                const textGeometry = new THREE.TextGeometry('Postudio', {
                    font: font,
                    size: isMobile ? 9.5 : 13.5,
                    height: 2.2,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 0.6,
                    bevelSize: 0.35,
                    bevelSegments: 6
                });
                textGeometry.computeBoundingBox();

                const textMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        color: { value: new THREE.Color(0x00ffff) },
                        time: { value: 0.0 },
                        opacity: { value: 0.92 }
                    },
                    vertexShader: `
                        varying vec3 vPosition;
                        void main() {
                            vPosition = position;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 color;
                        uniform float time;
                        uniform float opacity;
                        varying vec3 vPosition;
                        void main() {
                            float scan = sin(vPosition.y * 0.6 + time * 6.0) * 0.5 + 0.5;
                            float pulse = sin(time * 3.0) * 0.2 + 0.8;
                            vec3 holo = color * (1.0 + scan * 0.55 + pulse * 0.3);
                            float alpha = opacity * (0.65 + scan * 0.35);
                            gl_FragColor = vec4(holo, alpha);
                        }
                    `,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide
                });

                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(0, 8, SPHERE_RADIUS + 18);
                textMesh.name = 'postudioText';
                scene.add(textMesh);
            }, undefined, err => console.warn('Font fallback – text skipped', err));

            // ============== SMARTER LINK UPDATE (fast + natural) ==============
            function updateLinks() {
                let count = 0;
                const pos = nodeGeo.attributes.position.array;
                const maxNeighbors = isMobile ? 5 : 9;

                for (let i = 0; i < NODE_COUNT; i++) {
                    let connected = 0;
                    for (let attempt = 0; attempt < 75 && connected < maxNeighbors; attempt++) {
                        let j = Math.floor(Math.random() * NODE_COUNT);
                        if (j === i || j < i) continue; // avoid doubles

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

                            const hue = 0.48 + weight * 0.38; // cyan → hot magenta
                            const c = new THREE.Color().setHSL(hue, 0.96, 0.3 + weight * 0.68);

                            linkColors.set([c.r, c.g, c.b, c.r, c.g, c.b], count);

                            count += 6;
                            connected++;
                            if (count >= MAX_LINKS * 6) break;
                        }
                    }
                    if (count >= MAX_LINKS * 6) break;
                }

                linkGeo.setDrawRange(0, count / 3);
                if (linkGeo.attributes.position) linkGeo.attributes.position.needsUpdate = true;
                if (linkGeo.attributes.color) linkGeo.attributes.color.needsUpdate = true;
            }

            let frame = 0;
            let lastLinkUpdate = 0;

            function animate(t) {
                requestAnimationFrame(animate);
                const time = t * 0.001;

                // Slow dreamy spin + fire energy
                nodes.rotation.y += 0.00065;
                nodes.rotation.x += 0.00028;
                links.rotation.copy(nodes.rotation);

                // Holo text magic
                const textMesh = scene.getObjectByName('postudioText');
                if (textMesh) {
                    const hue = (time * 0.22) % 1.0;
                    textMesh.material.uniforms.color.value.setHSL(hue, 0.95, 0.88);
                    textMesh.material.uniforms.time.value = time;

                    textMesh.rotation.y = Math.sin(time * 0.4) * 0.12;
                    textMesh.position.y = 8 + Math.sin(time * 0.6) * 6;
                    const pulse = 1 + Math.sin(time * 1.8) * 0.08;
                    textMesh.scale.set(pulse, pulse, pulse);
                }

                // Node pulse + color shift (Y2K fire)
                const pos = nodeGeo.attributes.position.array;
                const col = nodeGeo.attributes.color.array;

                for (let i = 0; i < NODE_COUNT; i++) {
                    const i3 = i * 3;
                    const pulse = Math.sin(time * (2.2 + heat[i] * 3.8) + i) * 0.42;

                    pos[i3]     = basePositions[i3]     + pulse * 1.1;
                    pos[i3 + 1] = basePositions[i3 + 1] + pulse * 0.75;
                    pos[i3 + 2] = basePositions[i3 + 2] + pulse * 1.0;

                    const hue = 0.52 + heat[i] * 0.42 + pulse * 0.08;
                    const c = new THREE.Color().setHSL(hue, 0.96, 0.45 + heat[i] * 0.48 + Math.abs(pulse) * 0.2);

                    col[i3] = c.r;
                    col[i3 + 1] = c.g;
                    col[i3 + 2] = c.b;
                }

                nodeGeo.attributes.position.needsUpdate = true;
                nodeGeo.attributes.color.needsUpdate = true;

                // Smart link timing
                if (frame - lastLinkUpdate > (isMobile ? 7 : 5)) {
                    updateLinks();
                    lastLinkUpdate = frame;
                }

                // Live user sync every ~5 seconds
                if (frame % 280 === 0) {
                    fetch('/api/active-users')
                        .then(r => r.json())
                        .then(data => {
                            activeUsers = data.count || 100;
                            HOT_RATIO = Math.min(0.12 + (activeUsers / 8000) * 0.28, 0.38);
                            for (let i = 0; i < NODE_COUNT; i++) {
                                const isHot = Math.random() < HOT_RATIO;
                                heat[i] = isHot ? 0.75 + Math.random() * 0.25 : Math.random() * 0.45;
                            }
                            updateUserCount();
                        })
                        .catch(() => {});
                }

                camera.lookAt(0, 0, 0);
                renderer.render(scene, camera);
                frame++;
            }

            animate(0);

            // ============== RESIZE + USER COUNT ==============
            window.addEventListener("resize", () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            const userCountEl = document.getElementById('user-count');
            function updateUserCount() {
                if (!userCountEl) return;
                fetch('/api/active-users')
                    .then(r => r.json())
                    .then(d => {
                        userCountEl.textContent = `${d.count || 100} peeps online right now 🔥`;
                    })
                    .catch(() => {});
            }

            updateUserCount();

        })
        .catch(err => console.error('Three.js background init failed:', err));
});