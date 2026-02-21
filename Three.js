window.addEventListener("load", () => {

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    fetch('/api/active-users')
        .then(r => r.json())
        .then(data => {

            const scene = new THREE.Scene();
            scene.background = null;
            scene.fog = new THREE.FogExp2(0xbfe9ff, 0.0006); // Further reduced fog for even brighter, more vibrant scene

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

            renderer.domElement.style.position = "fixed";
            renderer.domElement.style.top = "0";
            renderer.domElement.style.left = "0";
            renderer.domElement.style.width = "100%";
            renderer.domElement.style.height = "100%";
            renderer.domElement.style.zIndex = "-1";
            renderer.domElement.style.pointerEvents = "none";
            renderer.domElement.style.filter = "blur(0.6px)"; // Slightly softer blur for euphoric glow

            document.body.appendChild(renderer.domElement);

            const NODE_COUNT = isMobile ? 2200 : 3800; // Increased for denser, more euphoric network
            const positions = new Float32Array(NODE_COUNT * 3);
            const basePositions = new Float32Array(NODE_COUNT * 3);
            const colors = new Float32Array(NODE_COUNT * 3); // Added for colorful nodes

            for (let i = 0; i < NODE_COUNT; i++) {
                const r = 100 * Math.cbrt(Math.random()); // Slightly larger spread for more dynamic feel
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.cos(phi);
                const z = r * Math.sin(phi) * Math.sin(theta);

                positions.set([x, y, z], i * 3);
                basePositions.set([x, y, z], i * 3);

                // Assign random bright colors for euphoria
                const hue = Math.random();
                const color = new THREE.Color().setHSL(hue, 1, 0.7);
                colors.set([color.r, color.g, color.b], i * 3);
            }

            const nodeGeo = new THREE.BufferGeometry();
            nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            nodeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3)); // Vertex colors for variety

            const nodeMat = new THREE.PointsMaterial({
                size: isMobile ? 2.8 : 3.5, // Larger points for brighter impact
                vertexColors: true, // Use vertex colors
                transparent: true,
                opacity: 0.98, // Almost full opacity for vibrancy
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const nodes = new THREE.Points(nodeGeo, nodeMat);
            scene.add(nodes);

            const pairs = [];
            const DIST_THRESH = isMobile ? 14 : 18; // Increased for more connections, euphoric web

            for (let i = 0; i < NODE_COUNT; i++) {
                for (let j = i + 1; j < NODE_COUNT; j++) {
                    const i3 = i * 3;
                    const j3 = j * 3;
                    const dx = basePositions[i3] - basePositions[j3];
                    const dy = basePositions[i3 + 1] - basePositions[j3 + 1];
                    const dz = basePositions[i3 + 2] - basePositions[j3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist < DIST_THRESH) {
                        pairs.push([i, j]);
                    }
                }
            }

            const linePositions = new Float32Array(pairs.length * 6);
            const lineColors = new Float32Array(pairs.length * 6); // Added colors for lines
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
            lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

            const lineMat = new THREE.LineBasicMaterial({
                vertexColors: true, // Colorful lines
                transparent: true,
                opacity: 0.35, // Slightly brighter lines
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const networkLines = new THREE.LineSegments(lineGeo, lineMat);
            scene.add(networkLines);

            const STAR_COUNT = isMobile ? 20 : 35; // Increased for more shooting stars, adding euphoria
            const stars = [];
            const trailLength = 10; // Trail segments per star for shooting star effect

            for (let i = 0; i < STAR_COUNT; i++) {
                const starGroup = new THREE.Group(); // Group for star and its trail

                // Main star head (brighter point)
                const headGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]);
                const headMat = new THREE.PointsMaterial({
                    size: isMobile ? 4 : 5,
                    color: 0xffffff,
                    transparent: true,
                    opacity: 1,
                    blending: THREE.AdditiveBlending
                });
                const head = new THREE.Points(headGeo, headMat);
                starGroup.add(head);

                // Trail: fading lines/points behind
                for (let j = 1; j <= trailLength; j++) {
                    const trailGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-j * 2, 0, 0)]);
                    const trailMat = new THREE.PointsMaterial({
                        size: 3 - (j * 0.2), // Smaller towards tail
                        color: 0xffffff,
                        transparent: true,
                        opacity: 1 - (j / trailLength) * 0.8, // Fading opacity
                        blending: THREE.AdditiveBlending
                    });
                    const trailPoint = new THREE.Points(trailGeo, trailMat);
                    starGroup.add(trailPoint);
                }

                starGroup.position.set(
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 250,
                    (Math.random() - 0.5) * 200
                );

                // Random rotation for varied directions
                starGroup.rotation.z = Math.random() * Math.PI * 2;

                starGroup.userData.velocity = new THREE.Vector3(
                    -3 - Math.random() * 6, // Faster for shooting star feel
                    -0.8 - Math.random() * 1.2,
                    0
                ).applyAxisAngle(new THREE.Vector3(0, 0, 1), starGroup.rotation.z); // Apply direction

                // Random color for euphoria
                const starColor = new THREE.Color().setHSL(Math.random(), 1, 0.8);
                head.material.color = starColor;
                starGroup.children.slice(1).forEach(trail => trail.material.color = starColor);

                scene.add(starGroup);
                stars.push(starGroup);
            }

            let frame = 0;

            function animate(t) {
                requestAnimationFrame(animate);
                const time = t * 0.001;

                nodes.rotation.y += 0.00045; // Slightly faster for energy
                nodes.rotation.x += 0.00018;
                nodes.position.y = Math.sin(time * 0.55) * 12; // More pronounced movement

                const pos = nodeGeo.attributes.position.array;
                for (let i = 0; i < NODE_COUNT; i++) {
                    const i3 = i * 3;
                    const pulse = Math.sin(time * 1.3 + i * 0.13) * 0.55; // Stronger, faster pulse for euphoria

                    pos[i3] = basePositions[i3] + pulse;
                    pos[i3 + 1] = basePositions[i3 + 1] + pulse;
                    pos[i3 + 2] = basePositions[i3 + 2] + pulse;
                }
                nodeGeo.attributes.position.needsUpdate = true;

                let k = 0;
                let c = 0;
                for (const [i, j] of pairs) {
                    const i3 = i * 3;
                    const j3 = j * 3;

                    // Positions
                    linePositions[k++] = pos[i3];
                    linePositions[k++] = pos[i3 + 1];
                    linePositions[k++] = pos[i3 + 2];
                    linePositions[k++] = pos[j3];
                    linePositions[k++] = pos[j3 + 1];
                    linePositions[k++] = pos[j3 + 2];

                    // Interpolate colors between connected nodes for smooth gradients
                    const colorI = new THREE.Color().fromArray(colors, i3);
                    const colorJ = new THREE.Color().fromArray(colors, j3);
                    lineColors[c++] = colorI.r; lineColors[c++] = colorI.g; lineColors[c++] = colorI.b;
                    lineColors[c++] = colorJ.r; lineColors[c++] = colorJ.g; lineColors[c++] = colorJ.b;
                }
                lineGeo.attributes.position.needsUpdate = true;
                lineGeo.attributes.color.needsUpdate = true;

                stars.forEach(starGroup => {
                    starGroup.position.add(starGroup.userData.velocity);

                    if (starGroup.position.x < -220 || starGroup.position.y < -160 || starGroup.position.x > 220 || starGroup.position.y > 160) {
                        starGroup.position.set(
                            200 + Math.random() * 120 * (Math.random() > 0.5 ? 1 : -1), // Random start from left/right/top/bottom
                            120 + Math.random() * 120 * (Math.random() > 0.5 ? 1 : -1),
                            (Math.random() - 0.5) * 200
                        );

                        // Update velocity based on new random direction
                        starGroup.rotation.z = Math.random() * Math.PI * 2;
                        starGroup.userData.velocity = new THREE.Vector3(
                            -3 - Math.random() * 6,
                            -0.8 - Math.random() * 1.2,
                            0
                        ).applyAxisAngle(new THREE.Vector3(0, 0, 1), starGroup.rotation.z);

                        // Randomize color on reset for variety
                        const newColor = new THREE.Color().setHSL(Math.random(), 1, 0.8);
                        starGroup.children.forEach(child => child.material.color = newColor);
                    }
                });

                camera.position.y = Math.sin(time * 0.4) * 16; // More dynamic camera for immersive euphoria
                camera.lookAt(0, 0, 0);

                renderer.render(scene, camera);
                frame++;
            }

            animate(0);

            window.addEventListener("resize", () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

        })
        .catch(err => console.error("Three.js init failed:", err));
});