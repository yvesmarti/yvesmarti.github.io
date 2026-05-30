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

        // Fermer le menu mobile quand on clique sur un lien
        links.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                links.classList.remove('active');
            });
        });
    }

    /* ------------------------------------------
       NAV SCROLL BEHAVIOR
       - pill flottante après 80 px
    ------------------------------------------ */
    function initNavScroll() {
        var nav = document.getElementById('nav');
        if (!nav) return;

        var ticking = false;
        var PILL_TRIGGER = 80;

        function update() {
            var currentY = window.scrollY || document.documentElement.scrollTop;
            var scrolled = currentY > PILL_TRIGGER;
            nav.classList.toggle('nav--scrolled', scrolled);
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });

        update();
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
       DARK MODE TOGGLE
    ------------------------------------------ */
    function initDarkMode() {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            if (window.HeroBg) window.HeroBg.setTheme(next !== 'light');
        });
    }

    /* ------------------------------------------
       HORIZONTAL SCROLLING TIMELINE
       Converts vertical scroll to horizontal
       translation inside #parcours.
    ------------------------------------------ */
    function initHorizontalTimeline() {
        var section  = document.getElementById('parcours');
        var track    = document.getElementById('htl-track');
        var progFill = document.getElementById('htl-progress-fill');
        var axisFill = document.getElementById('htl-axis-fill');

        if (!section || !track || !progFill) return;

        var isMobile = function () { return window.innerWidth <= 768; };

        var maxScrollX = 0;
        var scrollMultiplier = 1.5;
        // Extra scroll distance (in viewport-heights) during which the track stays
        // fully scrolled on the last item before vertical scrolling resumes.
        var endPauseVh = 1.2;
        var maxDuree = 1;
        var segData  = [];
        var mobileObserver = null;

        function calcMaxDuree() {
            var els = track.querySelectorAll('.htl-item[data-duree]');
            maxDuree = 1;
            for (var k = 0; k < els.length; k++) {
                var d = parseInt(els[k].getAttribute('data-duree'), 10) || 1;
                if (d > maxDuree) maxDuree = d;
            }
        }

        function setDurationFill(item) {
            var fill = item.querySelector('.htl-duration-fill');
            if (!fill) return;
            var duree = parseInt(item.getAttribute('data-duree'), 10) || 1;
            fill.style.width = Math.round((duree / maxDuree) * 100) + '%';
        }

        function setupSegBars(items) {
            segData = [];
            var threshold = window.innerWidth * 0.5;
            for (var i = 0; i < items.length; i++) {
                var bar  = items[i].querySelector('.htl-seg-bar');
                var fill = items[i].querySelector('.htl-seg-fill');
                if (!bar || !fill || i === items.length - 1) {
                    if (bar) bar.style.display = 'none';
                    segData.push(null);
                    continue;
                }
                var dotX     = items[i].offsetLeft + items[i].offsetWidth * 0.5;
                var nextDotX = items[i + 1].offsetLeft + items[i + 1].offsetWidth * 0.5;
                bar.style.width = (nextDotX - dotX) + 'px';
                segData.push({
                    fill:  fill,
                    start: Math.max(0, dotX - threshold),
                    end:   Math.max(1, nextDotX - threshold)
                });
            }
        }

        function setupMobileObserver() {
            if (mobileObserver) mobileObserver.disconnect();
            var mobileItems = track.querySelectorAll('.htl-item');
            if ('IntersectionObserver' in window) {
                mobileObserver = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            setDurationFill(entry.target);
                            mobileObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.15 });
                mobileItems.forEach(function (item) { mobileObserver.observe(item); });
            } else {
                mobileItems.forEach(function (item) {
                    item.classList.add('is-visible');
                    setDurationFill(item);
                });
            }
        }

        function setup() {
            calcMaxDuree();
            if (isMobile()) {
                section.style.height = '';
                setupMobileObserver();
                return;
            }
            if (mobileObserver) { mobileObserver.disconnect(); mobileObserver = null; }
            maxScrollX = Math.max(0, track.scrollWidth - window.innerWidth);
            var endPausePx = window.innerHeight * endPauseVh;
            section.style.height = 'calc(100vh + ' + (maxScrollX * scrollMultiplier + endPausePx) + 'px)';
            var items = track.querySelectorAll('.htl-item');
            setupSegBars(items);
        }

        function update() {
            if (isMobile()) return;

            var sectionTop = section.getBoundingClientRect().top + window.scrollY;
            var scrolled   = window.scrollY - sectionTop;
            var progress   = maxScrollX > 0
                ? Math.max(0, Math.min(1, scrolled / (maxScrollX * scrollMultiplier)))
                : 0;
            var currentX = progress * maxScrollX;

            track.style.transform = 'translateX(' + (-currentX) + 'px)';

            var pct = progress * 100;
            progFill.style.width = pct + '%';
            if (axisFill) axisFill.style.width = pct + '%';

            // Animate segment bars on the axis
            for (var s = 0; s < segData.length; s++) {
                if (!segData[s]) continue;
                var seg    = segData[s];
                var segPct = seg.end > seg.start
                    ? Math.max(0, Math.min(1, (currentX - seg.start) / (seg.end - seg.start)))
                    : 0;
                seg.fill.style.width = (segPct * 100) + '%';
            }

            // Reveal items as they slide into view
            var items = track.querySelectorAll('.htl-item');
            for (var i = 0; i < items.length; i++) {
                if (items[i].offsetLeft - currentX < window.innerWidth * 0.82) {
                    if (!items[i].classList.contains('is-visible')) {
                        items[i].classList.add('is-visible');
                        setDurationFill(items[i]);
                    }
                }
            }
        }

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () { setup(); update(); }, 100);
        });

        window.addEventListener('scroll', update, { passive: true });

        setup();
        update();
    }

    /* ------------------------------------------
       FILTRES COMPÉTENCES
    ------------------------------------------ */
    function initSkillFilters() {
        var buttons = document.querySelectorAll('.filter-btn');
        var cards   = document.querySelectorAll('.skill-card[data-categorie]');
        if (!buttons.length || !cards.length) return;

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var filter = btn.getAttribute('data-filter');

                buttons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                cards.forEach(function (card) {
                    if (filter === 'Toutes' || card.getAttribute('data-categorie') === filter) {
                        card.classList.remove('dimmed');
                    } else {
                        card.classList.add('dimmed');
                    }
                });
            });
        });
    }

    /* ------------------------------------------
       FILTRES OUTILS RECOMMANDÉS
    ------------------------------------------ */
    function initRecommandedFilters() {
        var buttons = document.querySelectorAll('.rec-filter-btn');
        var cards   = document.querySelectorAll('.rec-card[data-tags]');
        if (!buttons.length || !cards.length) return;

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var filter = btn.getAttribute('data-filter');

                buttons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                cards.forEach(function (card) {
                    var tags = card.getAttribute('data-tags').split(',');
                    if (filter === 'Tous' || tags.indexOf(filter) !== -1) {
                        card.classList.remove('dimmed');
                    } else {
                        card.classList.add('dimmed');
                    }
                });
            });
        });
    }

    /* ------------------------------------------
       INITIALISATION
    ------------------------------------------ */
    document.addEventListener('DOMContentLoaded', function () {
        initMobileMenu();
        initDarkMode();
        initNavScroll();
        initProgressBar();
        initScrollAnimations();
        initCounters();
        initTypewriter();
        initParallax();
        initAnimatedTimeline();
        initHorizontalTimeline();
        initSkillFilters();
        initRecommandedFilters();
    });

}());
