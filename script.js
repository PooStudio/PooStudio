window.addEventListener("load", () => {
    // Year
    document.getElementById("year").textContent = new Date().getFullYear();

    // Preloader with poo build-up
    const preloader = document.getElementById("preloader");
    const pooBuild = document.querySelector(".poo-build");
    let pooCount = 0;
    const pooInterval = setInterval(() => {
        if (pooCount < 20) {
            pooBuild.textContent += '💩';
            pooCount++;
        }
    }, 150);

    // Hide preloader with crash flicker
    setTimeout(() => {
        clearInterval(pooInterval);
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        document.body.style.overflow = 'auto';
    }, 4000);

    // Scroll detection - change vibe
    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight * 0.5) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
    });

    // Your plexus code (same as before) + poo chaos here
    // ... (paste the full Three.js plexus from last version)

    // Amp up particles in lower sections
    if (window.scrollY > 100) {
        setInterval(createParticle, 500); // More poo below
    }
});