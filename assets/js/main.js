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
       - masqué en scrollant vers le bas, visible en remontant
    ------------------------------------------ */
    function initNavScroll() {
        var nav = document.getElementById('nav');
        if (!nav) return;

        var lastScrollY   = window.scrollY || 0;
        var ticking       = false;
        var PILL_TRIGGER  = 80;   // px avant activation de la pill
        var HIDE_TRIGGER  = 220;  // px avant activation du masquage

        function update() {
            var currentY = window.scrollY || document.documentElement.scrollTop;
            var scrolled = currentY > PILL_TRIGGER;

            // Pill flottante
            nav.classList.toggle('nav--scrolled', scrolled);

            // Masquer / afficher selon la direction du scroll
            if (currentY > HIDE_TRIGGER) {
                if (currentY > lastScrollY) {
                    nav.classList.add('nav--hidden');
                } else {
                    nav.classList.remove('nav--hidden');
                }
            } else {
                nav.classList.remove('nav--hidden');
            }

            lastScrollY = currentY;
            ticking     = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });

        // Passe initial (cas où la page est ouverte déjà scrollée)
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
       ISOLINES TOPOGRAPHIQUES (hero)
    ------------------------------------------ */
    function initIsolines() {
        var canvas = document.getElementById('isoline-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var time = 0;
        var GRID = 7;

        // Permutation table pour le bruit de Perlin
        var perm = new Uint8Array(512);
        (function () {
            var i, j, tmp;
            for (i = 0; i < 256; i++) perm[i] = i;
            for (i = 255; i > 0; i--) {
                j = Math.floor(Math.random() * (i + 1));
                tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
            }
            for (i = 0; i < 256; i++) perm[256 + i] = perm[i];
        }());

        function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
        function lerpN(a, b, t) { return a + t * (b - a); }

        function grad(h, x, y) {
            h &= 3;
            var u = h < 2 ? x : y;
            var v = h < 2 ? y : x;
            return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
        }

        function perlin(x, y) {
            var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
            x -= Math.floor(x); y -= Math.floor(y);
            var u = fade(x), v = fade(y);
            var a = perm[X] + Y, b = perm[X + 1] + Y;
            return lerpN(
                lerpN(grad(perm[a],     x,     y), grad(perm[b],     x - 1, y),     u),
                lerpN(grad(perm[a + 1], x,     y - 1), grad(perm[b + 1], x - 1, y - 1), u),
                v
            );
        }

        function octave(x, y, oct) {
            var val = 0, amp = 1, freq = 1, max = 0;
            for (var o = 0; o < oct; o++) {
                val += perlin(x * freq, y * freq) * amp;
                max += amp; amp *= 0.5; freq *= 2;
            }
            return val / max;
        }

        function resize() {
            if (canvas.offsetWidth === 0) return;
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function buildField(w, h, t) {
            var cols = Math.ceil(w / GRID) + 1;
            var rows = Math.ceil(h / GRID) + 1;
            var field = new Float32Array(cols * rows);
            var peaks = [
                { x: 0.70 + Math.sin(t * 0.08) * 0.07, y: 0.40 + Math.cos(t * 0.06) * 0.11 },
                { x: 0.89 + Math.cos(t * 0.10) * 0.05, y: 0.24 + Math.sin(t * 0.07) * 0.09 },
                { x: 0.78 + Math.sin(t * 0.05) * 0.09, y: 0.73 + Math.cos(t * 0.09) * 0.09 }
            ];
            for (var row = 0; row < rows; row++) {
                for (var col = 0; col < cols; col++) {
                    var nx = col / cols, ny = row / rows;
                    var val = 0;
                    for (var p = 0; p < peaks.length; p++) {
                        var dx = nx - peaks[p].x, dy = ny - peaks[p].y;
                        val += Math.exp(-(dx * dx + dy * dy) * 10);
                    }
                    val += octave(nx * 4 + t * 0.12, ny * 4 + t * 0.10, 3) * 0.35;
                    field[row * cols + col] = val;
                }
            }
            return { field: field, cols: cols, rows: rows };
        }

        function lerpEdge(a, b, va, vb, thr) {
            return a + (b - a) * (thr - va) / (vb - va);
        }

        function drawContour(field, cols, rows, threshold) {
            ctx.beginPath();
            for (var row = 0; row < rows - 1; row++) {
                for (var col = 0; col < cols - 1; col++) {
                    var tl = field[row * cols + col],
                        tr = field[row * cols + col + 1],
                        bl = field[(row + 1) * cols + col],
                        br = field[(row + 1) * cols + col + 1];
                    var cfg = (tl > threshold ? 8 : 0) | (tr > threshold ? 4 : 0) |
                              (br > threshold ? 2 : 0) | (bl > threshold ? 1 : 0);
                    if (cfg === 0 || cfg === 15) continue;
                    var x0 = col * GRID, y0 = row * GRID;
                    var tX  = lerpEdge(x0, x0 + GRID, tl, tr, threshold), tY  = y0;
                    var rX  = x0 + GRID, rY  = lerpEdge(y0, y0 + GRID, tr, br, threshold);
                    var bX  = lerpEdge(x0, x0 + GRID, bl, br, threshold), bY  = y0 + GRID;
                    var lX  = x0, lY  = lerpEdge(y0, y0 + GRID, tl, bl, threshold);
                    switch (cfg) {
                        case 1: case 14: ctx.moveTo(lX,lY); ctx.lineTo(bX,bY); break;
                        case 2: case 13: ctx.moveTo(rX,rY); ctx.lineTo(bX,bY); break;
                        case 3: case 12: ctx.moveTo(lX,lY); ctx.lineTo(rX,rY); break;
                        case 4: case 11: ctx.moveTo(tX,tY); ctx.lineTo(rX,rY); break;
                        case 6: case 9:  ctx.moveTo(tX,tY); ctx.lineTo(bX,bY); break;
                        case 7: case 8:  ctx.moveTo(tX,tY); ctx.lineTo(lX,lY); break;
                        case 5:  ctx.moveTo(tX,tY); ctx.lineTo(rX,rY); ctx.moveTo(lX,lY); ctx.lineTo(bX,bY); break;
                        case 10: ctx.moveTo(tX,tY); ctx.lineTo(lX,lY); ctx.moveTo(rX,rY); ctx.lineTo(bX,bY); break;
                    }
                }
            }
            ctx.stroke();
        }

        function draw(t) {
            var w = canvas.width, h = canvas.height;
            if (!w || !h) return;
            ctx.clearRect(0, 0, w, h);
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var data = buildField(w, h, t);
            var LEVELS = 16;
            for (var i = 0; i < LEVELS; i++) {
                var thr = 0.08 + i * 0.09;
                var isAccent = (i === 3 || i === 9);
                var isMid    = (i % 4 === 1);
                if (isAccent) {
                    ctx.strokeStyle = isDark ? 'rgba(90,173,138,0.72)' : 'rgba(93,163,126,0.70)';
                    ctx.lineWidth = 1.5;
                } else if (isMid) {
                    ctx.strokeStyle = isDark ? 'rgba(90,173,138,0.30)' : 'rgba(93,163,126,0.32)';
                    ctx.lineWidth = 1.0;
                } else {
                    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.068)';
                    ctx.lineWidth = 0.7;
                }
                drawContour(data.field, data.cols, data.rows, thr);
            }
        }

        resize();
        window.addEventListener('resize', function () { resize(); }, { passive: true });

        draw(0);
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
        initIsolines();
    });

}());
