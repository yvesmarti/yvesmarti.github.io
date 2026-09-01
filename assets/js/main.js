/* =============================================
   MAIN.JS — Animations & interactions
   Portfolio Yves Marti
   ============================================= */

(function () {
    'use strict';

    /* ------------------------------------------
       CONFIGURATION EMAILJS
       Valeurs issues de dashboard.emailjs.com.
       La clé publique est faite pour être exposée
       côté client : c'est la restriction de domaine
       (Account > Security) qui protège le quota.
       Le template doit exposer les variables
       {{from_name}}, {{from_email}} et {{message}}.
    ------------------------------------------ */
    var EMAILJS_PUBLIC_KEY  = 'zOB8cgDsJRWpfpIUX';
    var EMAILJS_SERVICE_ID  = 'service_v4drsbl';
    var EMAILJS_TEMPLATE_ID = 'template_9do6ims';

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

        var ticking = false;

        function update() {
            var scrollTop  = window.scrollY || document.documentElement.scrollTop;
            var docHeight  = document.documentElement.scrollHeight - window.innerHeight;
            ticking = false;
            if (docHeight <= 0) return;
            var progress   = Math.min(100, (scrollTop / docHeight) * 100);
            bar.style.width = progress + '%';
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
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

        // Cartes de compétences : apparition en cascade (animation découplée du survol
        // pour ne pas retarder hover/filtrage ; délai plafonné pour les grilles longues)
        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.querySelectorAll('.skill-card').forEach(function (card, index) {
            card.classList.add('skill-reveal');
            if (!reduceMotion) {
                card.style.animationDelay = ((index % 8) * 60) + 'ms';
            }
            observer.observe(card);
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

        // Texte existant conservé comme fallback sans JS
        var text = el.textContent.trim().replace(/\s+/g, ' ');

        // Mouvement réduit : afficher la tagline d'un bloc, sans animation
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) {
            el.textContent = text;
            return;
        }

        // Révélation mot à mot, en cascade
        var words = text.split(' ');
        el.textContent = '';

        words.forEach(function (word, idx) {
            var span = document.createElement('span');
            span.className = 'hero-word';
            span.textContent = word;
            span.style.animationDelay = (300 + idx * 55) + 'ms';
            el.appendChild(span);
            if (idx < words.length - 1) {
                el.appendChild(document.createTextNode(' '));
            }
        });
    }

    /* ------------------------------------------
       5. PARALLAXE HÉROS
    ------------------------------------------ */
    function initParallax() {
        var bg   = document.querySelector('.hero-parallax-bg');
        var hero = document.querySelector('.hero');
        if (!bg || !hero) return;

        function isMobile() { return window.innerWidth <= 768; }

        var ticking = false;

        function update() {
            ticking = false;
            if (isMobile()) {
                bg.style.transform = '';
                return;
            }
            var scrollY     = window.scrollY || document.documentElement.scrollTop;
            var heroHeight  = hero.offsetHeight;

            // Ne pas calculer quand le héros est hors viewport
            if (scrollY > heroHeight) return;

            bg.style.transform = 'translateY(' + (scrollY * 0.3) + 'px)';
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(update);
                ticking = true;
            }
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
       LIGHTBOX (mécanique partagée)
       Ouverture/fermeture d'une modale : verrou du
       scroll, piège de focus, Échap, clic sur le fond.
       Utilisée par le parcours et les compétences.
    ------------------------------------------ */
    function createLightbox(modal, closeSelector) {
        var box = modal ? modal.querySelector('[role="dialog"]') : null;
        if (!box) return null;

        var FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

        var lastTrigger  = null;
        var savedPadding = '';
        var onClosed     = null;

        function open(trigger, afterClose) {
            lastTrigger = trigger || null;
            onClosed    = afterClose || null;

            // Verrouillage du scroll. On garde `overflow: hidden` plutôt qu'un
            // `position: fixed` sur le body : ce dernier remettrait window.scrollY
            // à 0, ce qui ferait sauter la timeline horizontale (update() mappe
            // scrollY sur le translateX du track). On compense la largeur de
            // l'ascenseur pour éviter le décalage horizontal de la page.
            var scrollbar = window.innerWidth - document.documentElement.clientWidth;
            savedPadding = document.body.style.paddingRight;
            if (scrollbar > 0) document.body.style.paddingRight = scrollbar + 'px';
            document.documentElement.style.overflow = 'hidden';

            modal.hidden = false;
            // Force un reflow pour que la transition d'ouverture se déclenche.
            void modal.offsetWidth;
            modal.classList.add('is-open');

            var closeBtn = modal.querySelector(closeSelector + '[aria-label]');
            if (closeBtn) closeBtn.focus();
        }

        function close() {
            if (modal.hidden) return;

            modal.classList.remove('is-open');
            document.documentElement.style.overflow = '';
            document.body.style.paddingRight = savedPadding;

            var cleanup = onClosed;
            onClosed = null;

            var finish = function () {
                // Une autre carte peut avoir été ouverte pendant l'animation de
                // fermeture : dans ce cas on ne vide pas le contenu tout juste posé.
                if (modal.classList.contains('is-open')) return;
                modal.hidden = true;
                if (cleanup) cleanup();
            };

            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                finish();
            } else {
                setTimeout(finish, 200);
            }

            if (lastTrigger) {
                lastTrigger.focus();
                lastTrigger = null;
            }
        }

        function trapFocus(e) {
            var items = box.querySelectorAll(FOCUSABLE);
            if (!items.length) return;
            var first = items[0];
            var last  = items[items.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        modal.addEventListener('click', function (e) {
            if (e.target.closest(closeSelector)) close();
        });

        document.addEventListener('keydown', function (e) {
            if (modal.hidden) return;
            if (e.key === 'Escape') {
                close();
            } else if (e.key === 'Tab') {
                trapFocus(e);
            }
        });

        return { open: open, close: close };
    }

    // Texte d'un sous-élément, vide si absent.
    function textOf(scope, selector) {
        var el = scope.querySelector(selector);
        return el ? el.textContent.trim() : '';
    }

    /* ------------------------------------------
       LIGHTBOX DÉTAIL DU PARCOURS
       Ouvre le contenu détaillé d'une étape de
       la timeline (#parcours) dans une modale.
    ------------------------------------------ */
    function initTimelineDetails() {
        var modal = document.getElementById('htl-modal');
        var track = document.getElementById('htl-track');
        if (!modal || !track) return;

        var elPeriod = document.getElementById('htl-modal-period');
        var elTitle  = document.getElementById('htl-modal-title');
        var elOrg    = document.getElementById('htl-modal-org');
        var elBody   = document.getElementById('htl-modal-body');
        if (!elPeriod || !elTitle || !elOrg || !elBody) return;

        var lightbox = createLightbox(modal, '[data-htl-close]');
        if (!lightbox) return;

        track.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-htl-more]');
            if (!btn) return;

            var item = btn.closest('.htl-item');
            var card = btn.closest('.htl-card');
            var tpl  = card ? card.querySelector('.htl-details-tpl') : null;
            if (!item || !card || !tpl) return;

            elPeriod.textContent = textOf(card, '.htl-period');
            elTitle.textContent  = textOf(card, '.htl-title');
            elOrg.textContent    = textOf(card, '.htl-org');

            elBody.innerHTML = '';
            elBody.appendChild(tpl.content.cloneNode(true));

            modal.classList.remove('htl-modal--exp', 'htl-modal--edu');
            modal.classList.add(item.classList.contains('htl-item--edu')
                ? 'htl-modal--edu'
                : 'htl-modal--exp');

            lightbox.open(btn, function () { elBody.innerHTML = ''; });
        });
    }

    /* ------------------------------------------
       LIGHTBOX DÉTAIL DES COMPÉTENCES
       Ouvre le détail d'une carte de compétence
       (#skill-modal) au clic ou au clavier.
    ------------------------------------------ */
    function initSkillDetails() {
        var modal = document.getElementById('skill-modal');
        var grid  = document.querySelector('.skills-grid');
        if (!modal || !grid) return;

        var elIcon  = document.getElementById('skill-modal-icon');
        var elTag   = document.getElementById('skill-modal-tag');
        var elTitle = document.getElementById('skill-modal-title');
        var elBody  = document.getElementById('skill-modal-body');
        if (!elIcon || !elTag || !elTitle || !elBody) return;

        var lightbox = createLightbox(modal, '[data-skill-close]');
        if (!lightbox) return;

        function open(card) {
            var tpl = card.querySelector('.skill-details-tpl');
            if (!tpl) return;

            elIcon.textContent  = textOf(card, '.skill-card-icon');
            elTag.textContent   = card.getAttribute('data-categorie') || '';
            elTitle.textContent = textOf(card, '.skill-card-name');

            elBody.innerHTML = '';
            elBody.appendChild(tpl.content.cloneNode(true));

            // La modale reprend la couleur de la compétence (bordure, puces).
            modal.style.setProperty('--card-color', card.style.getPropertyValue('--card-color').trim());

            lightbox.open(card, function () { elBody.innerHTML = ''; });
        }

        grid.addEventListener('click', function (e) {
            var card = e.target.closest('.skill-card[data-detail]');
            if (card) open(card);
        });

        // role="button" impose de gérer Entrée et Espace au clavier.
        grid.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
            var card = e.target.closest('.skill-card[data-detail]');
            if (!card) return;
            e.preventDefault();
            open(card);
        });
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
       FORMULAIRE DE CONTACT (EmailJS)
    ------------------------------------------ */
    function initContactForm() {
        var form = document.getElementById('contact-form');
        if (!form) return;

        var submit   = document.getElementById('cf-submit');
        var status   = document.getElementById('cf-status');
        var honeypot = document.getElementById('cf-website');
        var sending  = false;

        function setStatus(message, state) {
            status.textContent = message;
            status.className = 'cf-status' + (state ? ' is-' + state : '');
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (sending) return;

            // Piège anti-spam : un humain ne voit jamais ce champ.
            // On sort en silence pour ne pas renseigner le robot.
            if (honeypot && honeypot.value !== '') return;

            if (!form.checkValidity()) {
                setStatus('Merci de remplir tous les champs correctement.', 'error');
                form.reportValidity();
                return;
            }

            if (typeof emailjs === 'undefined') {
                setStatus("Le service d'envoi n'a pas pu être chargé. Passez par LinkedIn ci-dessous.", 'error');
                return;
            }

            sending = true;
            submit.disabled = true;
            setStatus('Envoi en cours...', 'pending');

            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                from_name:  form.elements['from_name'].value.trim(),
                from_email: form.elements['from_email'].value.trim(),
                message:    form.elements['message'].value.trim()
            }, { publicKey: EMAILJS_PUBLIC_KEY })
                .then(function () {
                    form.reset();
                    setStatus('Message envoyé, merci ! Je vous réponds rapidement.', 'success');
                })
                .catch(function (err) {
                    setStatus("L'envoi a échoué. Réessayez ou passez par LinkedIn ci-dessous.", 'error');
                    if (window.console) console.error('EmailJS :', err);
                })
                .then(function () {
                    // Joue le rôle d'un finally : le .catch() renvoie une promesse résolue.
                    sending = false;
                    submit.disabled = false;
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
        initTimelineDetails();
        initSkillFilters();
        initSkillDetails();
        initRecommandedFilters();
        initContactForm();
    });

}());
