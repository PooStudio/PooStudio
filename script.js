window.addEventListener("load", () => {
    document.getElementById("year").textContent = new Date().getFullYear();

    const container = document.getElementById("three-container");
    if (!container) return;

    // Make container receive pointer events only when we want interaction
    container.style.pointerEvents = "auto";

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 1000);
    camera.position.set(0, 10, 180);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.background = "transparent";
    container.appendChild(renderer.domElement);

    const poopGroup = new THREE.Group();
    poopGroup.position.y = 25; // keeps it near top
    scene.add(poopGroup);

    // ────────────────────────────────────────────────
    // Your particle / geometry / material / points / lines code here
    // (same as before – I'm omitting it for brevity, keep your full version)
    // const PARTICLE_COUNT = 5200; ... all the way to poopGroup.add(lines);
    // ────────────────────────────────────────────────

    // Mouse state
    const pointer = { x: 0, y: 0, isOverCanvas: false, isDragging: false };
    let previousPointer = { x: 0, y: 0 };

    // Only track mouse when over the canvas
    container.addEventListener("mouseenter", () => { pointer.isOverCanvas = true; });
    container.addEventListener("mouseleave", () => { pointer.isOverCanvas = false; });

    container.addEventListener("mousemove", e => {
        if (!pointer.isOverCanvas) return;
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Optional: drag-to-rotate (feels more intentional, less scroll interference)
    container.addEventListener("mousedown", () => {
        pointer.isDragging = true;
        previousPointer = { x: pointer.x, y: pointer.y };
    });
    container.addEventListener("mouseup",   () => { pointer.isDragging = false; });
    container.addEventListener("mouseleave", () => { pointer.isDragging = false; });

    // Touch support (similar logic)
    container.addEventListener("touchstart", e => {
        pointer.isDragging = true;
        const touch = e.touches[0];
        pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        previousPointer = { x: pointer.x, y: pointer.y };
    }, { passive: false });
    container.addEventListener("touchmove", e => {
        if (!pointer.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    }, { passive: false });
    container.addEventListener("touchend",   () => { pointer.isDragging = false; });

    function updateConnections() {
        // your existing updateConnections function here (unchanged)
    }

    let time = 0;
    let frame = 0;

    function animate(now) {
        requestAnimationFrame(animate);
        time = now * 0.001;

        // Always spin slowly
        poopGroup.rotation.y += 0.0009;

        // Only apply mouse/touch rotation when interacting
        if (pointer.isOverCanvas || pointer.isDragging) {
            let deltaX = 0, deltaY = 0;
            if (pointer.isDragging) {
                deltaX = pointer.x - previousPointer.x;
                deltaY = pointer.y - previousPointer.y;
                previousPointer = { x: pointer.x, y: pointer.y };
            } else {
                // gentle follow only when hovering (much weaker)
                deltaX = pointer.x * 0.004;
                deltaY = pointer.y * 0.006;
            }

            poopGroup.rotation.y += deltaX * 1.2;
            poopGroup.rotation.x += deltaY * 1.0;
        }

        // Gentle breathing + wobble (unchanged)
        const pulse = 1 + Math.sin(time * 0.7) * 0.008;
        poopGroup.scale.setScalar(pulse);

        const pos = geometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const phase = time * 0.42 + i * 0.0075;
            pos[i3]     = basePositions[i3]     + Math.sin(phase)         * 0.85;
            pos[i3 + 1] = basePositions[i3 + 1] + Math.cos(phase * 1.4)   * 0.7;
            pos[i3 + 2] = basePositions[i3 + 2] + Math.sin(phase * 0.95)  * 0.8;
        }
        geometry.attributes.position.needsUpdate = true;

        if (frame++ % 4 === 0) updateConnections();

        // Camera gentle breathing, looking at group
        camera.position.y = 10 + Math.sin(time * 0.4) * 4;
        camera.lookAt(poopGroup.position.x, poopGroup.position.y - 10, poopGroup.position.z);

        renderer.render(scene, camera);
    }

    animate(0);

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});