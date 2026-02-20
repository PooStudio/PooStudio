window.addEventListener("load", () => {

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    fetch('/api/active-users')
        .then(r => r.json())
        .then(data => {

            const scene = new THREE.Scene();
            scene.background = null;
            scene.fog = new THREE.FogExp2(0xbfe9ff, 0.001); /* Reduced fog for softer blend */

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
            renderer.domElement.style.filter = "blur(1px)"; /* Added blur to canvas for overall blend */

            document.body.appendChild(renderer.domElement);

            const NODE_COUNT = isMobile ? 2200 : 3800; /* Increased nodes for more density */
            const positions = new Float32Array(NODE_COUNT * 3);
            const basePositions = new Float32Array(NODE_COUNT * 3);

            for (let i = 0; i < NODE_COUNT; i++) {
                const r = 100 * Math.cbrt(Math.random()); /* Slightly larger spread */
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = r * Math.cos(phi);
                const z = r * Math.sin(phi) * Math.sin(theta);

                positions.set([x, y, z], i * 3);
                basePositions.set([x, y, z], i * 3);
            }

            const nodeGeo = new THREE.BufferGeometry();
            nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

            const nodeMat = new THREE.PointsMaterial({
                size: isMobile ? 2.0 : 2.5, /* Smaller for finer blend */
                color: 0xaeefff,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                sizeAttenuation: true /* Added for distance-based sizing */
            });

            const nodes = new THREE.Points(nodeGeo, nodeMat);
            scene.add(nodes);

            // Add network connections with softer lines
            const pairs = [];
            const DIST_THRESH = isMobile ? 14 : 18; // Increased threshold for more connections

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
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

            const lineMat = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.2, // Lower opacity for subtler lines
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                linewidth: 1.5 /* Thicker but softer */
            });

            const networkLines = new THREE.LineSegments(lineGeo, lineMat);
            scene.add(networkLines);

            const STAR_COUNT = isMobile ? 15 : 25; /* More stars for added depth */
            const stars = [];

            for (let i = 0; i < STAR_COUNT; i++) {
                const geo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(-8, 0, 0)
                ]);

                const mat = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.85,
                    blending: THREE.AdditiveBlending
                });

                const star = new THREE.Line(geo, mat);

                star.position.set(
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 250,
                    (Math.random() - 0.5) * 200
                );

                star.userData.velocity = new THREE.Vector3(
                    -1.5 - Math.random() * 3, /* Slower velocity */
                    -0.4 - Math.random() * 0.8,
                    0
                );

                scene.add(star);
                stars.push(star);
            }

            let frame = 0;

            function animate(t) {
                requestAnimationFrame(animate);
                const time = t * 0.001;

                nodes.rotation.y += 0.00025; /* Slower rotation */
                nodes.rotation.x += 0.00008;
                nodes.position.y = Math.sin(time * 0.35) * 7; /* Softer movement */

                const pos = nodeGeo.attributes.position.array;
                for (let i = 0; i < NODE_COUNT; i++) {
                    const i3 = i * 3;
                    const pulse = Math.sin(time * 0.9 + i * 0.09) * 0.35; /* Softer, slower pulse */

                    pos[i3] = basePositions[i3] + pulse;
                    pos[i3 + 1] = basePositions[i3 + 1] + pulse;
                    pos[i3 + 2] = basePositions[i3 + 2] + pulse;
                }
                nodeGeo.attributes.position.needsUpdate = true;

                // Update network lines
                let k = 0;
                for (const [i, j] of pairs) {
                    const i3 = i * 3;
                    const j3 = j * 3;
                    linePositions[k++] = pos[i3];
                    linePositions[k++] = pos[i3 + 1];
                    linePositions[k++] = pos[i3 + 2];
                    linePositions[k++] = pos[j3];
                    linePositions[k++] = pos[j3 + 1];
                    linePositions[k++] = pos[j3 + 2];
                }
                lineGeo.attributes.position.needsUpdate = true;

                stars.forEach(star => {
                    star.position.add(star.userData.velocity);

                    if (star.position.x < -220 || star.position.y < -160) {
                        star.position.set(
                            200 + Math.random() * 120,
                            120 + Math.random() * 120,
                            (Math.random() - 0.5) * 200
                        );
                    }
                });

                camera.position.y = Math.sin(time * 0.25) * 10; /* Smoother, slower camera */
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