window.addEventListener("load", () => {

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    fetch('/api/active-users')
        .then(r => r.json())
        .then(data => {

            let activeUsers = data.count || 100;
            let HOT_RATIO = Math.min(0.12 + (activeUsers / 8000) * 0.28, 0.38);

            const scene = new THREE.Scene();

            scene.background = null;
            scene.fog = new THREE.FogExp2(0xbfe9ff, 0.0016);

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

            // ⭐ TRUE BACKGROUND MODE
            renderer.domElement.style.position = "fixed";
            renderer.domElement.style.top = "0";
            renderer.domElement.style.left = "0";
            renderer.domElement.style.width = "100%";
            renderer.domElement.style.height = "100%";
            renderer.domElement.style.zIndex = "-1";
            renderer.domElement.style.pointerEvents = "none";

            document.body.appendChild(renderer.domElement);

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
                heat[i] = isHot ? 1 : 0.4;

                // aqua → sky blue → white glow
                const hue = 0.52 + Math.random() * 0.08;
                const col = new THREE.Color().setHSL(hue, 0.6, 0.72);

                colors.set([col.r, col.g, col.b], i * 3);
            }

            const nodeGeo = new THREE.BufferGeometry();
            nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
            nodeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

            const nodeMat = new THREE.PointsMaterial({
                size: isMobile ? 2.2 : 2.8,
                vertexColors: true,
                transparent: true,
                opacity: 0.9,
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
                opacity: 0.25,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const links = new THREE.LineSegments(linkGeo, linkMat);
            scene.add(links);

            function updateLinks() {
                let count = 0;
                const pos = nodeGeo.attributes.position.array;

                for (let i = 0; i < NODE_COUNT; i++) {
                    for (let j = i + 1; j < NODE_COUNT; j++) {
                        const i3 = i * 3;
                        const j3 = j * 3;

                        const dx = pos[i3] - pos[j3];
                        const dy = pos[i3 + 1] - pos[j3 + 1];
                        const dz = pos[i3 + 2] - pos[j3 + 2];
                        const d2 = dx*dx + dy*dy + dz*dz;

                        if (d2 < LINK_DISTANCE * LINK_DISTANCE) {
                            const c = new THREE.Color(0xaeefff);

                            linkPositions.set([
                                pos[i3], pos[i3+1], pos[i3+2],
                                pos[j3], pos[j3+1], pos[j3+2]
                            ], count);

                            linkColors.set([c.r, c.g, c.b, c.r, c.g, c.b], count);

                            count += 6;
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

                nodes.rotation.y += 0.00045;
                nodes.rotation.x += 0.00015;

                nodes.position.y = Math.sin(time * 0.5) * 8;
                nodes.position.x = Math.sin(time * 0.25) * 5;

                links.rotation.copy(nodes.rotation);
                links.position.copy(nodes.position);

                const pos = nodeGeo.attributes.position.array;
                for (let i = 0; i < NODE_COUNT; i++) {
                    const i3 = i * 3;
                    const pulse = Math.sin(time * 1.2 + i * 0.12) * 0.4;

                    pos[i3] = basePositions[i3] + pulse;
                    pos[i3 + 1] = basePositions[i3 + 1] + pulse;
                    pos[i3 + 2] = basePositions[i3 + 2] + pulse;
                }

                nodeGeo.attributes.position.needsUpdate = true;

                if (frame % 8 === 0) updateLinks();

                camera.position.y = Math.sin(time * 0.35) * 12;
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
