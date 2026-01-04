const container = document.getElementById("three-container");
const scene = new THREE.Scene();

// white background like the reference image
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setClearColor(0xffffff, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 14, 90);

// lighting - a soft key + fill to create subtle specular highlights
const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(40, 80, 20);
dir.castShadow = false;
scene.add(dir);

const rim = new THREE.DirectionalLight(0xffffff, 0.25);
rim.position.set(-60, 40, -40);
scene.add(rim);

// Build a lathe-style "soft-serve" / stacked swirl silhouette and then add
// small surface ripple/bumpiness to mimic the photo reference.
function buildTurdMesh() {
    // Build profile points for LatheGeometry (x = radius, y = height)
    const profile = [];
    const TURD_HEIGHT = 42;
    const baseRadius = 40;
    const rings = 120;
    for (let i = 0; i <= rings; i++) {
        const t = i / rings; // 0..1 bottom->top
        // height runs from -TURD_HEIGHT/2 to +TURD_HEIGHT/2
        const y = -TURD_HEIGHT * 0.5 + t * TURD_HEIGHT;

        // radius profile: large base, then stacked taper with a small spike at top
        // Use smoothstep-like taper + small bulges (the ring shapes)
        const taper = 1 - Math.pow(t, 1.7) * 0.96; // main taper
        const bulge = Math.sin(t * Math.PI * 6) * (1.6 + 0.6 * (1 - t)); // ring lumps
        const radius = Math.max(0.6, baseRadius * taper + bulge);

        // reduce tube thickness toward top
        const finalRadius = radius * (0.9 - t * 0.6);

        profile.push(new THREE.Vector2(finalRadius, y));
    }

    // create lathe (rotationally symmetric body)
    const segments = 160;
    const latheGeo = new THREE.LatheGeometry(profile, segments);

    // add small per-vertex distortions (radial bumps & small randomness) to mimic
    // the rough wet surface on the reference. This preserves the silhouette while
    // creating the textured look.
    const pos = latheGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);

        // compute angle and radial distance
        const ang = Math.atan2(vz, vx);
        const rad = Math.sqrt(vx * vx + vz * vz);

        // displacement is a function of height and angular frequency so lumps
        // align as rings and slight helical micro-variation
        const ringFreq = 6.0; // number of rings along height
        const helixFreq = 3.6; // twist effect frequency
        const baseBump = Math.sin(vy * (ringFreq * 0.28) + ang * helixFreq) * (0.6 + 0.4 * Math.cos(vy * 0.2));
        const micro = (Math.random() - 0.5) * 0.12;

        // apply as radial outward displacement (keep shape stable)
        const disp = baseBump * 0.6 + micro;
        const newRad = Math.max(0.001, rad + disp);

        pos.setX(i, Math.cos(ang) * newRad);
        pos.setZ(i, Math.sin(ang) * newRad);
        // tiny vertical wobble for natural look
        pos.setY(i, vy + Math.sin(ang * 7 + vy * 0.15) * 0.28);
    }
    latheGeo.computeVertexNormals();

    // material: brown, slightly glossy, clearcoat for wet sheen
    // color chosen to match the reference: warm brown
    const color = new THREE.Color().setHSL(0.08, 0.68, 0.29);
    const mat = new THREE.MeshPhysicalMaterial({
        color: color,
        roughness: 0.45,
        metalness: 0.0,
        clearcoat: 0.25,
        clearcoatRoughness: 0.28,
        reflectivity: 0.35,
        // small sheen and subsurface-like warmth:
        sheen: 0.06
    });

    const mesh = new THREE.Mesh(latheGeo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // scale down a bit for camera framing
    mesh.scale.setScalar(0.55);

    // position so bottom sits near y = -12
    mesh.position.y = -6;

    return mesh;
}

const turd = buildTurdMesh();
scene.add(turd);

// subtle ground ellipse shadow to match reference's soft drop shadow
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.08, transparent: true });
const shadowGeo = new THREE.CircleGeometry(42 * 0.55, 32);
const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
shadowMesh.rotation.x = -Math.PI / 2;
shadowMesh.position.y = -18;
scene.add(shadowMesh);

// pointer interaction for subtle parallax/tilt
const pointer = { x: 0, y: 0 };
let touchActive = false;
const updatePointer = (e) => {
    if (e.touches) {
        touchActive = true;
        const t = e.touches[0];
        pointer.x = (t.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(t.clientY / window.innerHeight) * 2 + 1;
    } else {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
};
window.addEventListener("mousemove", updatePointer);
window.addEventListener("touchmove", updatePointer, { passive: true });
window.addEventListener("touchstart", updatePointer, { passive: true });

// animate
let last = 0;
function animate(t) {
    requestAnimationFrame(animate);
    const time = t * 0.001;
    // gentle bob/rotation
    turd.rotation.y = Math.sin(time * 0.08) * 0.12;
    turd.rotation.x = pointer.y * 0.08;
    turd.rotation.z = pointer.x * 0.06;

    // camera slight follow
    camera.position.x += (pointer.x * 22 - camera.position.x) * 0.03;
    camera.position.y += (pointer.y * 7 + 12 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    // subtle pulsing to simulate life & moisture
    const pulse = 1 + Math.sin(time * 1.6) * 0.006;
    turd.scale.setScalar(0.55 * pulse);

    renderer.render(scene, camera);
}
animate(0);

// handle resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
});
