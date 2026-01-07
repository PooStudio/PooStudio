window.addEventListener("load", () => {
    document.getElementById("year").textContent = "PooStudio " + new Date().getFullYear();

    const container = document.getElementById("three-container");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Deep space background

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights for realistic day/night effect
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(200, 0, 100);
    scene.add(sunLight);

    // Earth sphere
    const earthRadius = 100;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 128, 128);

    // Day texture (continents, oceans, clouds)
    const dayTexture = new THREE.TextureLoader().load('https://i.redd.it/x3pvhjw7lo661.jpg'); // High-res realistic day Earth with clouds

    // Night lights texture (city lights)
    const nightTexture = new THREE.TextureLoader().load('https://media.istockphoto.com/id/1282384231/vector/earth-night-map-vector-illustration-of-cities-lights-from-space-dark-globe.jpg?s=612x612&w=0&k=20&c=o5zVVqMb6InEd5jium06tvr8OGWvCrqapBZIu5qFGlw=');

    const earthMaterial = new THREE.MeshPhongMaterial({
        map: dayTexture,
        emissiveMap: nightTexture,
        emissive: 0xffffff,
        emissiveIntensity: 1.2,
        shininess: 10,
        specular: 0x222222
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Atmosphere glow for extra realism
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.08, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earth.add(atmosphere);

    // Add stars in the background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 800 + Math.random() * 200;
        starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Slow auto-rotation
    function animate() {
        requestAnimationFrame(animate);

        earth.rotation.y += 0.0005; // Gentle spin to show day/night cycle
        stars.rotation.y += 0.00005;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});