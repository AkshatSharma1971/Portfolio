/* ============================================================
   Akshat Sharma — Portfolio Script
   Pure Vanilla JS · No frameworks
   ============================================================ */

(function () {
    'use strict';

    /* ----------------------------------------------------------
       TOUCH DEVICE DETECTION
       ---------------------------------------------------------- */
    const isTouchDevice = () =>
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice()) {
        document.body.classList.add('touch-device');
    }

    /* ----------------------------------------------------------
       CUSTOM CURSOR
       ---------------------------------------------------------- */
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');

    let mouseX = -100, mouseY = -100;
    let outlineX = -100, outlineY = -100;

    if (!isTouchDevice()) {
        // Show cursor on first move
        let cursorVisible = false;
        function showCursor() {
            if (!cursorVisible) {
                cursorDot.style.opacity = '1';
                cursorOutline.style.opacity = '1';
                cursorVisible = true;
            }
        }

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top  = mouseY + 'px';
            showCursor();
        });

        // Smooth outline following
        function animateCursor() {
            outlineX += (mouseX - outlineX) * 0.12;
            outlineY += (mouseY - outlineY) * 0.12;
            cursorOutline.style.left = outlineX + 'px';
            cursorOutline.style.top  = outlineY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        // Hover effect on interactive elements
        const interactiveSelectors = 'a, button, .btn, .skill-card, .project-card, .hobby-card, .edu-card, .contact-link, .nav-link, .hamburger, input, textarea';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactiveSelectors)) {
                document.body.classList.add('cursor-hover');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactiveSelectors)) {
                document.body.classList.remove('cursor-hover');
            }
        });

        // Click effect
        document.addEventListener('mousedown', () => {
            document.body.classList.add('cursor-click');
        });
        document.addEventListener('mouseup', () => {
            document.body.classList.remove('cursor-click');
        });

        // Click ripple
        const rippleContainer = document.getElementById('clickRippleContainer');
        document.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'click-ripple';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';
            rippleContainer.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });

        // Button ripple position
        document.querySelectorAll('.btn').forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                btn.style.setProperty('--ripple-x', x + '%');
                btn.style.setProperty('--ripple-y', y + '%');
            });
        });

        // Hide cursor when it leaves the window
        document.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorOutline.style.opacity = '0';
            cursorVisible = false;
        });
        document.addEventListener('mouseenter', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top  = mouseY + 'px';
            showCursor();
        });
    }

    /* ----------------------------------------------------------
       PARTICLE SYSTEM (Canvas)
       ---------------------------------------------------------- */
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrameId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.hue = Math.random() > 0.5 ? 190 : 260; // cyan or purple
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            // subtle mouse repulsion
            const mx = this.x - mouseX, my = this.y - mouseY, md = Math.sqrt(mx * mx + my * my);
            if (md > 0 && md < 120) { const f = (1 - md / 120) * 0.6; this.x += (mx / md) * f; this.y += (my / md) * f; }
            if (this.x < 0 || this.x > canvas.width ||
                this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 100%, 60%, ${this.opacity})`;
            ctx.fill();
        }
    }

    function initParticles() {
        const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000));
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }
    initParticles();
    window.addEventListener('resize', initParticles);

    function drawConnections() {
        const maxDist = 120;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    const opacity = (1 - dist / maxDist) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p) => {
            p.update();
            p.draw();
        });
        drawConnections();
        animFrameId = requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // Reduce particles on mobile for performance
    if (isTouchDevice()) {
        cancelAnimationFrame(animFrameId);
        particles = particles.slice(0, 25);
        animateParticles();
    }

    /* ----------------------------------------------------------
       TYPING ANIMATION
       ---------------------------------------------------------- */
    const typingPhrases = [
        'a Developer',
        'an AI Enthusiast',
        'a Creative Builder',
        'a Problem Solver',
        'a Gamer'
    ];
    const typingElement = document.getElementById('typingText');
    let phraseIdx = 0, charIdx = 0, isDeleting = false;

    function typeEffect() {
        const current = typingPhrases[phraseIdx];
        if (!isDeleting) {
            typingElement.textContent = current.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === current.length) {
                isDeleting = true;
                setTimeout(typeEffect, 2000); // pause
                return;
            }
            setTimeout(typeEffect, 70);
        } else {
            typingElement.textContent = current.substring(0, charIdx - 1);
            charIdx--;
            if (charIdx === 0) {
                isDeleting = false;
                phraseIdx = (phraseIdx + 1) % typingPhrases.length;
                setTimeout(typeEffect, 500);
                return;
            }
            setTimeout(typeEffect, 40);
        }
    }
    typeEffect();

    /* ----------------------------------------------------------
       NAVIGATION — Sticky, Hamburger, Active Section
       ---------------------------------------------------------- */
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const allNavLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    // Create overlay for mobile menu
    const navOverlay = document.createElement('div');
    navOverlay.className = 'nav-overlay';
    document.body.appendChild(navOverlay);

    // Scroll — add scrolled class
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const st = window.scrollY;
        navbar.classList.toggle('scrolled', st > 50);
        lastScroll = st;
    }, { passive: true });

    // Hamburger toggle
    function toggleMenu(open) {
        const isOpen = open ?? !navLinks.classList.contains('open');
        navLinks.classList.toggle('open', isOpen);
        hamburger.classList.toggle('open', isOpen);
        navOverlay.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    hamburger.addEventListener('click', () => toggleMenu());
    navOverlay.addEventListener('click', () => toggleMenu(false));

    // Nav link click — close menu & smooth scroll
    allNavLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu(false);
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Active section highlighting
    const observerOptions = { root: null, rootMargin: '-30% 0px -60% 0px', threshold: 0 };
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                allNavLinks.forEach((link) => {
                    link.classList.toggle('active', link.dataset.section === id);
                });
            }
        });
    }, observerOptions);

    sections.forEach((sec) => {
        if (sec.id) sectionObserver.observe(sec);
    });

    // Footer & other smooth scroll links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        if (!anchor.classList.contains('nav-link')) {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        }
    });

    /* ----------------------------------------------------------
       SCROLL REVEAL (IntersectionObserver)
       ---------------------------------------------------------- */
    const revealElements = document.querySelectorAll('.reveal-up');
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealElements.forEach((el) => revealObserver.observe(el));

    /* ----------------------------------------------------------
       EDUCATION PROGRESS BAR ANIMATION
       ---------------------------------------------------------- */
    const progressFill = document.querySelector('.edu-progress-fill');
    if (progressFill) {
        const progressObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        progressFill.classList.add('animate');
                        progressObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );
        progressObserver.observe(progressFill);
    }

    /* ----------------------------------------------------------
       3D TILT EFFECT ON CARDS
       ---------------------------------------------------------- */
    if (!isTouchDevice()) {
        const tiltCards = document.querySelectorAll('[data-tilt]:not(.skill-card)');
        tiltCards.forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -6;
                const rotateY = ((x - centerX) / centerX) * 6;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    /* ----------------------------------------------------------
       IMAGE FALLBACK — Replace broken images with gradient
       ---------------------------------------------------------- */
    document.querySelectorAll('.skill-card-bg, .hobby-card-bg, .edu-card-bg').forEach((bg) => {
        const img = new Image();
        const url = bg.style.backgroundImage.replace(/url\(['"]?(.+?)['"]?\)/, '$1');
        img.onerror = () => {
            // Apply a fallback gradient if the image fails to load
            bg.style.backgroundImage = 'none';
            bg.style.background = `linear-gradient(135deg, ${getComputedStyle(document.documentElement).getPropertyValue('--bg-card')}, ${getComputedStyle(document.documentElement).getPropertyValue('--bg-surface')})`;
        };
        img.src = url;
    });

    /* ----------------------------------------------------------
       PERFORMANCE: Pause particles when tab is hidden
       ---------------------------------------------------------- */
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animFrameId);
        } else {
            animateParticles();
        }
    });

    /* ----------------------------------------------------------
       GAMING CARD — Toggle sub-boxes on click
       ---------------------------------------------------------- */
    const gamingCard = document.getElementById('gamingCard');
    const gamingSubboxes = document.getElementById('gamingSubboxes');

    if (gamingCard && gamingSubboxes) {
        gamingCard.addEventListener('click', (e) => {
            // Don't toggle if clicking a link inside
            if (e.target.closest('a')) return;
            gamingSubboxes.classList.toggle('open');
            // Scroll sub-boxes into view
            if (gamingSubboxes.classList.contains('open')) {
                setTimeout(() => {
                    gamingSubboxes.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        });
    }

    /* MUSIC CARD + player: see features.js */

})();
