document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize language from LocalStorage or default to 'en'
    let currentLang = window.persistedLang || localStorage.getItem('preferredLang') || 'en';
    const langToggleBtn = document.getElementById('langToggle');

    // --- FIX: Disable browser's native scroll restoration entirely.
    //     We handle it manually after BOTH translations and images are loaded. ---
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // --- FIX: Save scroll position just before the page unloads/refreshes ---
    window.addEventListener('beforeunload', () => {
        sessionStorage.setItem('scrollY_' + location.pathname, window.scrollY);
    });

    // --- FIX: Two-gate scroll restoration ---
    // Both gates must open before we scroll: (1) translations done, (2) page fully loaded.
    // This prevents restoring scroll before images/fonts have settled the page height.
    let translationsDone = false;
    let pageFull = false;
    const savedY = parseInt(sessionStorage.getItem('scrollY_' + location.pathname), 10);

    function tryRestoreScroll() {
        if (!savedY || !translationsDone || !pageFull) return;
        window.scrollTo({ top: savedY, behavior: 'instant' });
        sessionStorage.removeItem('scrollY_' + location.pathname);
    }

    // Gate 2: fires when all images/fonts/subresources are loaded
    if (document.readyState === 'complete') {
        pageFull = true;
    } else {
        window.addEventListener('load', () => {
            pageFull = true;
            tryRestoreScroll();
        }, { once: true });
    }

    // --- Async Language Switcher ---
    async function updateLanguage(lang, isInit = false) {
        try {
            const response = await fetch(`js/${lang}.json`);
            if (!response.ok) throw new Error(`Could not load ${lang}.json`);
            const langData = await response.json();

            currentLang = lang;
            localStorage.setItem('preferredLang', lang);

            langToggleBtn.textContent = lang === 'en' ? 'తెలుగు' : 'English';
            document.documentElement.setAttribute('lang', lang);

            document.body.style.fontFamily = lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Serif Telugu', serif";

            if (lang === 'te') {
                document.documentElement.classList.add('lang-te');
            } else {
                document.documentElement.classList.remove('lang-te');
            }

            // Update all data-i18n elements
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const keyPath = el.getAttribute('data-i18n');
                const keys = keyPath.split('.');
                let text = langData;
                keys.forEach(k => { if (text) text = text[k]; });
                if (text) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.placeholder = text;
                    } else {
                        el.textContent = text;
                    }
                }
            });

            // Gate 1: translations are now in the DOM
            if (isInit) {
                translationsDone = true;
                tryRestoreScroll();
            }

        } catch (error) {
            console.error("Translation Error:", error);
        }
    }

    // Initialize — isInit=true enables scroll restoration
    updateLanguage(currentLang, true);

    langToggleBtn.addEventListener('click', () => {
        const nextLang = currentLang === 'en' ? 'te' : 'en';
        updateLanguage(nextLang);

        const hamburger = document.getElementById('hamburger');
        const navLinksContainer = document.getElementById('navLinks');
        if (hamburger && navLinksContainer) {
            hamburger.classList.remove('active');
            navLinksContainer.classList.remove('active');
        }
    });

    // --- Scroll Spying ---
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    // --- Mobile Hamburger Menu ---
    const hamburger = document.getElementById('hamburger');
    const navLinksContainer = document.getElementById('navLinks');

    if (hamburger && navLinksContainer) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinksContainer.classList.remove('active');
            });
        });
    }

    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }

        if (scrollToTopBtn) {
            if (window.scrollY > 300) scrollToTopBtn.classList.add('show');
            else scrollToTopBtn.classList.remove('show');
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { threshold: 0.3, rootMargin: "-100px 0px 0px 0px" });

    sections.forEach(section => observer.observe(section));

    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Image Carousel ---
    let slideIndex = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    let carouselInterval;

    function showSlides(n) {
        if (!slides.length) return;
        if (n >= slides.length) slideIndex = 0;
        if (n < 0) slideIndex = slides.length - 1;
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[slideIndex].classList.add('active');
        if (dots[slideIndex]) dots[slideIndex].classList.add('active');
    }

    function nextSlide(n) {
        showSlides(slideIndex += n);
        resetInterval();
    }

    function currentSlide(n) {
        showSlides(slideIndex = n);
        resetInterval();
    }

    function resetInterval() {
        clearInterval(carouselInterval);
        carouselInterval = setInterval(() => nextSlide(1), 4000);
    }

    if (slides.length > 0) {
        showSlides(slideIndex);
        carouselInterval = setInterval(() => nextSlide(1), 4000);
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        if (prevBtn) prevBtn.addEventListener('click', () => nextSlide(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => nextSlide(1));
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => currentSlide(index));
        });
    }

    // --- Lightbox Feature ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const galleryImages = document.querySelectorAll('.gallery-item img');
    let currentLightboxIndex = 0;

    if (lightbox && lightboxImg && galleryImages.length > 0) {
        const closeBtn = document.querySelector('.lightbox-close');
        const prevBtn = document.querySelector('.lightbox-prev');
        const nextBtn = document.querySelector('.lightbox-next');

        function openLightbox(index) {
            currentLightboxIndex = index;
            lightboxImg.src = galleryImages[currentLightboxIndex].src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        function changeLightboxImage(direction) {
            currentLightboxIndex += direction;
            if (currentLightboxIndex < 0) currentLightboxIndex = galleryImages.length - 1;
            if (currentLightboxIndex >= galleryImages.length) currentLightboxIndex = 0;
            lightboxImg.src = galleryImages[currentLightboxIndex].src;
        }

        galleryImages.forEach((img, index) => {
            img.addEventListener('click', () => openLightbox(index));
        });

        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        if (prevBtn) prevBtn.addEventListener('click', () => changeLightboxImage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => changeLightboxImage(1));

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
            if (e.key === 'ArrowRight') changeLightboxImage(1);
        });
    }
});
