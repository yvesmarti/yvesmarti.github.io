/* =============================================
   MAIN.JS — Animations & interactions
   Portfolio Yves Marti
   ============================================= */

(function () {
    'use strict';

    /* ------------------------------------------
       MENU MOBILE
    ------------------------------------------ */
    function initMobileMenu() {
        var toggle = document.getElementById('nav-toggle');
        var links  = document.querySelector('.nav-links');
        if (!toggle || !links) return;

        toggle.addEventListener('click', function () {
            links.classList.toggle('active');
        });
    }

    /* ------------------------------------------
       1. BARRE DE PROGRESSION DE LECTURE
    ------------------------------------------ */
    function initProgressBar() {
        var bar = document.getElementById('reading-progress');
        if (!bar) return;

        window.addEventListener('scroll', function () {
            var scrollTop  = window.scrollY || document.documentElement.scrollTop;
            var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
            if (docHeight <= 0) return;
            var progress   = Math.min(100, (scrollTop / docHeight) * 100);
            bar.style.width = progress + '%';
        }, { passive: true });
    }

    /* ------------------------------------------
       2. ANIMATIONS AU SCROLL (Intersection Observer)
    ------------------------------------------ */
    function initScrollAnimations() {
        // Fallback : tout afficher si IntersectionObserver absent
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
                el.classList.add('is-visible');
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // une seule fois
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        // Éléments marqués statiquement
        document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
            observer.observe(el);
        });

        // Items de timeline : cascade de 100 ms entre chaque
        document.querySelectorAll('.timeline-item').forEach(function (item, index) {
            item.classList.add('animate-on-scroll');
            item.style.transitionDelay = (index * 100) + 'ms';
            observer.observe(item);
        });
    }

    /* ------------------------------------------
       3. COMPTEURS ANIMÉS
    ------------------------------------------ */
    function animateCounter(el, target, suffix, duration) {
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed  = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);
            // Easing ease-out cubique : 1 − (1−t)³
            var eased    = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(step);
    }

    function initCounters() {
        var counters = document.querySelectorAll('.stat-counter');
        if (!counters.length) return;

        // Fallback sans IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            counters.forEach(function (el) {
                el.textContent = (el.dataset.target || '') + (el.dataset.suffix || '');
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var el      = entry.target;
                    var target  = parseInt(el.dataset.target, 10);
                    var suffix  = el.dataset.suffix || '';
                    animateCounter(el, target, suffix, 1500);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(function (counter) { observer.observe(counter); });
    }

    /* ------------------------------------------
       4. EFFET TYPEWRITER SUR LE HÉROS
    ------------------------------------------ */
    function initTypewriter() {
        var el = document.getElementById('hero-typewriter');
        if (!el) return;

        // Lire le texte existant (fallback sans JS conservé dans le HTML)
        var text = el.textContent.trim().replace(/\s+/g, ' ');
        el.textContent = '';

        // Conteneur texte + curseur
        var textNode = document.createElement('span');
        var cursor   = document.createElement('span');
        cursor.classList.add('typewriter-cursor');
        cursor.setAttribute('aria-hidden', 'true');

        el.appendChild(textNode);
        el.appendChild(cursor);

        var i = 0;

        // Démarrage après 500 ms
        setTimeout(function () {
            function type() {
                if (i < text.length) {
                    textNode.textContent += text[i];
                    i++;
                    setTimeout(type, 40);
                } else {
                    // Curseur disparaît à la fin
                    setTimeout(function () {
                        cursor.classList.add('done');
                    }, 800);
                }
            }
            type();
        }, 500);
    }

    /* ------------------------------------------
       5. PARALLAXE HÉROS
    ------------------------------------------ */
    function initParallax() {
        var bg   = document.querySelector('.hero-parallax-bg');
        var hero = document.querySelector('.hero');
        if (!bg || !hero) return;

        function isMobile() { return window.innerWidth <= 768; }

        window.addEventListener('scroll', function () {
            if (isMobile()) {
                bg.style.transform = '';
                return;
            }
            var scrollY     = window.scrollY || document.documentElement.scrollTop;
            var heroHeight  = hero.offsetHeight;

            // Ne pas calculer quand le héros est hors viewport
            if (scrollY > heroHeight) return;

            bg.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';
        }, { passive: true });
    }

    /* ------------------------------------------
       6. (skill bars removed)
    ------------------------------------------ */

    /* ------------------------------------------
       7. TIMELINE ANIMÉE — scroll-driven
          La ligne se dessine au défilement ;
          les points s'allument quand elle les atteint.
    ------------------------------------------ */
    function initAnimatedTimeline() {
        var timeline = document.getElementById('exp-timeline');
        var fill     = document.getElementById('tl-fill');
        if (!timeline || !fill) return;

        var items = Array.prototype.slice.call(
            timeline.querySelectorAll('.tl__item')
        );
        if (!items.length) return;

        var track = timeline.querySelector('.tl__track');
        if (!track) return;

        function update() {
            var tr = track.getBoundingClientRect();

            // Trigger à 62 % de la hauteur du viewport
            var trigger  = window.innerHeight * 0.62;

            // Progression : 0 quand le haut du track atteint le trigger,
            //               1 quand le bas du track atteint le trigger.
            var progress = (trigger - tr.top) / tr.height;
            progress = Math.max(0, Math.min(1, progress));

            fill.style.height = (progress * 100) + '%';

            // Position Y absolue (dans le viewport) du bas de la ligne tracée
            var fillBottomY = tr.top + progress * tr.height;

            items.forEach(function (item) {
                var dot = item.querySelector('.tl__dot');
                if (!dot) return;

                var dotRect   = dot.getBoundingClientRect();
                var dotCenter = dotRect.top + dotRect.height / 2;

                if (fillBottomY >= dotCenter && !item.classList.contains('is-lit')) {
                    item.classList.add('is-lit');
                }
            });
        }

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        // Premier passage après que le layout soit stabilisé
        setTimeout(update, 120);
    }

    /* ------------------------------------------
       INITIALISATION
    ------------------------------------------ */
    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initProgressBar();
        initScrollAnimations();
        initCounters();
        initTypewriter();
        initParallax();
        initAnimatedTimeline();
    });

}());
