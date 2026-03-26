document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'en';
    const langToggleBtn = document.getElementById('langToggle');

    // --- Language Switcher ---
    function updateLanguage(lang) {
        currentLang = lang;
        langToggleBtn.textContent = lang === 'en' ? 'తెలుగు' : 'English';
        
        // Update font families based on language
        document.body.style.fontFamily = lang === 'en' ? "'Montserrat', sans-serif" : "'Noto Serif Telugu', serif";
        
        // Update language attributes and scaling
        document.documentElement.setAttribute('lang', lang);
        if (lang === 'te') {
            document.documentElement.classList.add('lang-te');
        } else {
            document.documentElement.classList.remove('lang-te');
        }

        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const keyPath = el.getAttribute('data-i18n');
            const keys = keyPath.split('.');
            let text = translations[lang];
            
            // traverse the json object
            keys.forEach(k => { text = text[k]; });
            
            if (text) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else {
                    el.textContent = text;
                }
            }
        });
    }

    langToggleBtn.addEventListener('click', () => {
        updateLanguage(currentLang === 'en' ? 'te' : 'en');
        
        // Close mobile menu if open
        const hamburger = document.getElementById('hamburger');
        const navLinksContainer = document.getElementById('navLinks');
        if (hamburger && navLinksContainer) {
            hamburger.classList.remove('active');
            navLinksContainer.classList.remove('active');
        }
    });

    // --- Scroll Spying (Intersection Observer) ---
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
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        
        if (scrollToTopBtn) {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all links
                navLinks.forEach(link => link.classList.remove('active'));
                // Add active class to the current intersecting section's link
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
        carouselInterval = setInterval(() => nextSlide(1), 4000); // Auto-slide every 4s
        
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
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto'; // Restore scrolling
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

        // Close when clicking outside the image
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
            if (e.key === 'ArrowRight') changeLightboxImage(1);
        });
    }

    // Initialize
    updateLanguage(currentLang);
});