// ==UserScript==
// @name         ▶ Open YouTube Optimizer 2.0 (RU ver.)
// @version      2.0
// @description  Усовершенствованный скрипт для повышения производительности упрощения интерфейса YouTube.
// @author       | tg: @lag_cs | github: tglagcs |
// @match        https://*.youtube.com/*
// @match        https://*.youtube-nocookie.com/*
// @exclude      /^https?:\/\/\S+\.(txt|png|jpg|jpeg|gif|xml|svg|manifest|log|ini)[^\/]*$/
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @grant        unsafeWindow
// @license      MIT
// @icon         https://raw.githubusercontent.com/tglagcs/OYO/main/imgs/OYO%20ICO.png
// ==/UserScript==

(function () {
    'use strict';

    // For Chromium compatible
    try {
        if (window.trustedTypes && window.trustedTypes.createPolicy) {
            window.trustedTypes.createPolicy('default', {
                createHTML: (string) => string,
                createScript: (string) => string,
                createScriptURL: (string) => string,
            });
        }
    } catch (e) {}

    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    const DEFAULT_CONFIG = {
        // ⚡ Performance
        disableAnimations: true,
        throttleTimers: true,
        lazyLoadImages: true,
        memoryLeakFix: true,
        optimizeThumbnails: true,

        // 🎨 Appearance & Layout
        simplifyUI: true,
        disableBlurEffects: true,
        disableShadows: true,
        disableNotifications: true,

        // 🚫 Content Blocking
        removeAds: true,
        removeShorts: true,
        removeComments: true,
        removeTrending: true,
        removeLiveChat: true,
        removePromo: true,

        // 🎬 Player
        disableAutoplay: true,
        limitVideoQuality: true,
        maxQuality: '1080p',
        disablePlayerGradients: true,
        disablePlayerWatermarkAndAnnotations: true,
        removeInfoAndPlayerCards: true,
        removeEndScreen: true,

        // ⚙️ OYO Settings
        showSettingsButton: true,
    };

    function loadConfig() {
        try {
            const raw = GM_getValue('ytOptimizerConfig', null);

            if (raw === null || raw === undefined) {
                return {
                    ...DEFAULT_CONFIG
                };
            }

            let parsed;
            if (typeof raw === 'string') {
                parsed = JSON.parse(raw);
            } else if (typeof raw === 'object') {
                parsed = raw;
            } else {
                return {
                    ...DEFAULT_CONFIG
                };
            }

            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                return {
                    ...DEFAULT_CONFIG
                };
            }

            return {
                ...DEFAULT_CONFIG,
                ...parsed
            };
        } catch (e) {
            return {
                ...DEFAULT_CONFIG
            };
        }
    }

    function saveConfig(config) {
        try {
            if (!config || typeof config !== 'object' || Array.isArray(config)) {
                return false;
            }

            const configToSave = {};

            for (const key in DEFAULT_CONFIG) {
                if (config.hasOwnProperty(key)) {
                    configToSave[key] = config[key];
                } else {
                    configToSave[key] = DEFAULT_CONFIG[key];
                }
            }

            const configStr = JSON.stringify(configToSave);

            GM_setValue('ytOptimizerConfig', configStr);

            return true;
        } catch (e) {}
    }

    if (window.__ytOptimizerProInjected) return;
    window.__ytOptimizerProInjected = true;

    let CONFIG = loadConfig();

    function validateConfig(config) {
        const validConfig = {
            ...DEFAULT_CONFIG
        };
        let hasChanges = false;

        Object.keys(DEFAULT_CONFIG)
            .forEach(key => {
                if (config.hasOwnProperty(key)) {
                    const value = config[key];
                    const defaultValue = DEFAULT_CONFIG[key];

                    if (typeof value === typeof defaultValue) {
                        validConfig[key] = value;
                    } else {
                        hasChanges = true;
                    }
                } else {
                    hasChanges = true;
                }
            });
        if (hasChanges) {
            saveConfig(validConfig);
        }
        return validConfig;
    }

    CONFIG = validateConfig(CONFIG);

    // ============================================================================
    // CSS INJECTION
    // ============================================================================
    function injectAdvancedCSS() {
        const BASE_HIDE_SELECTORS = [
            'ytd-reel-shelf-renderer',
            'ytd-rich-shelf-renderer',
            'ytd-rich-section-renderer',
            'ytd-watch-next-secondary-results-renderer',
            'ytm-rich-shelf-renderer',
            'ytm-search ytm-shelf-renderer',
            'ytm-reel-shelf-renderer',
            'ytm-rich-section-renderer',
            'ytm-pivot-bar-item-renderer:has(> .pivot-shorts)',
            '.ytGridShelfViewModelHost'
        ].join(',');

        const hide = (selectors) => `${selectors} { display: none !important; }`;

        const rules = [];

        // ===== ADS =====
        if (CONFIG.removeAds) {
            rules.push(`
            #primary.ytd-watch-flexy { margin-top:0 !important; padding-top:0 !important; }
            #masthead-container { height:10px !important; min-height:10px !important; }
        `);

            rules.push(hide([
                'ytd-merch-shelf-renderer',
                'ytd-action-companion-ad-renderer',
                'ytd-display-ad-renderer',
                'ytd-video-masthead-ad-advertiser-info-renderer',
                'ytd-video-masthead-ad-primary-video-renderer',
                'ytd-in-feed-ad-layout-renderer',
                'ytd-ad-slot-renderer',
                'ytd-statement-banner-renderer',
                'ytd-banner-promo-renderer-background',
                'ytd-ads-engagement-panel-content-renderer',
                'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
                'ytd-rich-item-renderer:has(> #content > ytd-ad-slot-renderer)',
                '.ytd-video-masthead-ad-v3-renderer',
                '#player-ads.style-scope.ytd-watch-flexy',
                'yt-about-this-ad-renderer',
                'masthead-ad',
                'ad-slot-renderer',
                'yt-mealbar-promo-renderer',
                'tp-yt-iron-overlay-backdrop',
                '#masthead-ad',
                '#expandable-metadata',
                '#clarify-box',
                'statement-banner-style-type-compact',
                'ytm-promoted-sparkles-web-renderer',
                BASE_HIDE_SELECTORS
            ].join(',')));
        }

        if (CONFIG.removeShorts) {
            rules.push(hide([
                '[is-shorts]',
                '#shorts-container',
                'ytd-guide-entry-renderer[title="Shorts"]',
                '.ytd-mini-guide-entry-renderer[href="/shorts/"]',
                BASE_HIDE_SELECTORS
            ].join(',')));
        }

        if (CONFIG.simplifyUI) {
            rules.push(hide([
                'ytd-watch-flexy #related',
                '.ytp-fullscreen-grid-active.html5-video-player.ended-mode .ytp-fullscreen-grid-main-content',
                '#comment-teaser',
                'ytd-horizontal-card-list-renderer[modern-chapters][card-list-style=HORIZONTAL_CARD_LIST_STYLE_TYPE_ENGAGEMENT_PANEL_SECTION]',
                'ytd-video-description-infocards-section-renderer > #header',
                'ytd-video-description-infocards-section-renderer > #action-buttons',
                '#social-links.ytd-video-description-infocards-section-renderer',
                '#secondary',
                '#related',
                'ytd-watch-next-secondary-results-renderer',
                'ytd-mini-guide-renderer.ytd-app.style-scope',
                '#buttons > ytd-button-renderer.ytd-masthead.style-scope',
                '#voice-search-button',
                'img[src*="tia.png"]',
                '#country-code'
            ].join(',')));

            rules.push(`
            ytd-video-description-infocards-section-renderer { border-top: 0 !important; }
            ytd-watch-metadata.ytd-watch-flexy { padding-bottom: 36px !important; }
            ytd-watch-metadata.ytd-watch-flexy { padding-bottom: 36px !important; }
            input.ytSearchboxComponentInput[name="search_query"]::placeholder {
                color: transparent !important;
            }
        `);
        }

        if (CONFIG.removeComments) {
            rules.push(hide([
                '#comments.style-scope.ytd-watch-flexy',
                'ytd-comments',
                'ytd-comment-thread-renderer',
                '#comment-teaser'
            ].join(',')));
        }

        // ===== PLAYER SKELETONS =====
        rules.push(hide([
            '.ytd-ghost-grid-renderer',
            '.info-skeleton',
            '.meta-skeleton',
            '#ghost-cards',
            '#ghost-comment-section',
            '#related-skeleton'
        ].join(',')));

        if (CONFIG.disablePlayerGradients) {
            rules.push('.ytp-gradient-top,.ytp-gradient-bottom{height:0!important;padding:0!important;}');
        }

        if (CONFIG.disablePlayerWatermarkAndAnnotations) {
            rules.push(hide('.ytp-watermark,.annotation,.iv-branding,.video-annotations'));
        }

        if (CONFIG.disableBlurEffects) {
            rules.push(`
            ytm-mobile-topbar-renderer.frosted-glass,
            ytm-pivot-bar-renderer.frosted-glass,
            ytm-feed-filter-chip-bar-renderer.frosted-glass,
            #background.ytd-masthead, #frosted-glass.ytd-app {
                background: var(--yt-spec-base-background) !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
        `);
        }

        if (CONFIG.disableShadows) {
            rules.push('ytd-app *{box-shadow:none!important;text-shadow:none!important;}');
        }

        if (CONFIG.disableNotifications) {
            rules.push(hide('ytd-notification-topbar-button-renderer.ytd-masthead.style-scope'));
        }

        // ===== SIDEBAR PROMO =====
        rules.push(`
        ytd-guide-entry-renderer > a[href*="/feed/courses_destination"],
        ytd-guide-entry-renderer > a[href*="/podcasts"],
        ytd-guide-entry-renderer > a[href*="/feed/podcasts"] {
            display: ${CONFIG.removePromo ? 'none' : 'block'} !important;
        }
        #footer.style-scope.ytd-guide-renderer { display: ${CONFIG.removePromo ? 'none' : 'block'} !important; }
        ytd-guide-entry-renderer[title*="Premium"] { display: ${CONFIG.removePromo ? 'none' : 'flex'} !important; }
        ytd-guide-entry-renderer[title*="YouTube Music"] { display: ${CONFIG.removePromo ? 'none' : 'flex'} !important; }
    `);

        // ===== EXTRA REMOVALS =====
        if (CONFIG.removePromo) {
            rules.push(hide('ytd-merch-shelf-renderer'));
        }
        if (CONFIG.removeInfoAndPlayerCards) {
            rules.push(hide('ytd-video-description-infocards-section-renderer,.ytp-ce-element,.ytp-cards-teaser'));
        }
        if (CONFIG.removeEndScreen) {
            rules.push(hide('.html5-endscreen,.ytp-endscreen-content'));
        }
        if (CONFIG.removeLiveChat) {
            rules.push(hide('ytd-live-chat-frame,#chat,#live-chat-iframe'));
        }
        if (CONFIG.removeTrending) {
            rules.push(hide('a[href*="/feed/trending"],ytd-guide-entry-renderer[title*="Trending"]'));
        }

        // ===== INJECT / UPDATE STYLE =====
        const style = document.getElementById('yt-optimizer-advanced-css') || (() => {
            const s = document.createElement('style');
            s.id = 'yt-optimizer-advanced-css';
            document.head.appendChild(s);
            return s;
        })();

        const newCSS = rules.join('\n');
        if (style.textContent !== newCSS) {
            style.textContent = newCSS;
        }
    }

    // ============================================================================
    // ANIMATION DISABLER
    // ============================================================================
    const ANIMATIONS_CSS = `
    /* Disable most UI animations & transitions */
    html {
        scroll-behavior: auto !important;
    }

    ytd-app *,
        ytm-app *,
            #content *,
                #page-manager * {
                    animation: none !important;
                    transition: none !important;
                }

    /* Keep player stable */
    video,
        ytd-player,
        .html5-video-player,
            #movie_player {
                animation: initial !important;
                transition: initial !important;
            }

    /* Allow minimal button feedback */
    ytd-button-renderer,
        yt-icon-button,
        button,
        [role="button"] {
            transition: opacity 0.1s !important;
        }
    `;

    function disableAnimations() {
        if (!CONFIG.disableAnimations) {
            return;
        }

        let style = document.getElementById('yt-optimizer-animations');
        if (!style) {
            style = document.createElement('style');
            style.id = 'yt-optimizer-animations';
            document.head.appendChild(style);
        }

        if (style.textContent !== ANIMATIONS_CSS) {
            style.textContent = ANIMATIONS_CSS;
        }
    }

    // ============================================================================
    // MEMORY LEAK FIX
    // ============================================================================
    let __memoryLeakFixApplied = false;

    const _PromiseCtor = (async () => {}).constructor;
    const ytDOMWM = new WeakMap();

    const insp = (o) => (o && (o.polymerController || o.inst || o)) || 0;

    function getThumbnail(thumbnails) {
        if (!thumbnails || !thumbnails.length) {
            return null;
        }

        let best = null;
        let bestScore = 0;

        for (let i = 0; i < thumbnails.length; i++) {
            const t = thumbnails[i];
            const score = (t.width || 0) * (t.height || 0);
            if (score > bestScore) {
                bestScore = score;
                best = t;
            }
        }

        return best;
    }

    function applyMemoryLeakFix() {
        if (!CONFIG.memoryLeakFix) return;
        if (__memoryLeakFixApplied) return;

        __memoryLeakFixApplied = true;

        try {
            Object.defineProperty(Element.prototype, 'usePatchedLifecycles', {
                get() {
                    const val = ytDOMWM.get(this);

                    if (val === undefined) return true;

                    if (val === 0) return false;

                    if (val && !this.isConnected && !this.classList.contains('style-scope')) {
                        return false;
                    }

                    return val;
                },

                set(nv) {
                    let control = false;
                    const nodeName = (this.nodeName || '').toLowerCase();

                    switch (nodeName) {
                        case 'yt-attributed-string':
                        case 'yt-image':
                            control = !(this.classList && this.classList.length > 0);
                            break;

                        case 'yt-player-seek-continuation':
                        case 'yt-payments-manager':
                        case 'yt-visibility-monitor':
                        case 'yt-live-chat-replay-continuation':
                        case 'yt-reload-continuation':
                        case 'yt-timed-continuation':
                            control = true;
                            break;

                        case 'yt-img-shadow':
                            if (nv && CONFIG.optimizeThumbnails) {
                                const cnt = insp(this);
                                const thumb = getThumbnail(cnt?.__data?.thumbnail?.thumbnails);
                                const url0 = thumb?.url;

                                if (url0 && url0.length > 17) {
                                    control = true;

                                    _PromiseCtor.resolve(0).then(() => {
                                        const t2 = getThumbnail(cnt?.__data?.thumbnail?.thumbnails);
                                        const url = t2?.url || url0;
                                        if (cnt?.$.img) {
                                            cnt.$.img.src = `${url}`;
                                        }
                                    });
                                }
                            }
                            break;
                    }

                    if (control) {
                        nv = 0;
                    }

                    ytDOMWM.set(this, nv);
                    return true;
                },

                enumerable: false,
                configurable: true
            });
        } catch (e) {}
    }

    // ============================================================================
    // NOTIFICATION TITLE CLEANER
    // ============================================================================
    let __ytTitlePatched = false;

    function cleanNotificationTitles() {
        if (!CONFIG.disableNotifications) {
            return;
        }

        if (__ytTitlePatched) {
            return;
        }
        __ytTitlePatched = true;

        const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
        if (!desc || !desc.set || !desc.get) {
            return;
        }

        Object.defineProperty(Document.prototype, 'title', {
            get() {
                return desc.get.call(this);
            },
            set(newValue) {
                const cleaned = ('' + newValue)
                    .replace(/^\(\d+\)\s*/, '');
                return desc.set.call(this, cleaned);
            },
            configurable: true,
            enumerable: true
        });
    }

    // ============================================================================
    // TRAILER AUTOPLAY DISABLER
    // ============================================================================
    let __trailerAutoplayHooked = false;

    function disableTrailerAutoplay() {
        if (!CONFIG.disableAutoplay) {
            return;
        }

        if (__trailerAutoplayHooked) {
            return;
        }
        __trailerAutoplayHooked = true;

        const handler = (e) => {
            const video = e.target;
            if (!(video instanceof HTMLVideoElement)) {
                return;
            }

            const channel = document.querySelector('ytd-channel-video-player-renderer');
            if (channel && channel.contains(video)) {
                video.autoplay = false;
                video.pause();
            }
        };

        document.addEventListener('play', handler, true);
    }

    // ============================================================================
    // PREVENT AUTO-PAUSE WHEN TAB INACTIVE
    // ============================================================================
    let __preventAutoPauseHooked = false;

    function preventAutoPause() {
        if (__preventAutoPauseHooked) {
            return;
        }
        __preventAutoPauseHooked = true;

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const video = document.querySelector('video');
                if (video && video.paused === false) {
                    video.play()
                        .catch(() => {});
                }
            }
        });
    }

    // ============================================================================
    // URL PARAMETER CLEANER
    // ============================================================================
    let __urlCleanerHooked = false;

    function cleanUrlParameters() {
        if (__urlCleanerHooked) {
            return;
        }
        __urlCleanerHooked = true;

        const events = [
            'yt-navigate',
            'yt-navigate-start',
            'yt-page-type-changed',
            'yt-player-updated',
            'yt-page-data-fetched',
            'yt-navigate-finish'
        ];

        const clean = () => {
            if (!location.search.includes('pp=')) {
                return;
            }

            const newSearch = location.search.replace(/([?&])pp=[^=&?]+\b(&|)/, (a, p, q) => {
                return q ? p : '';
            });

            const newUrl = location.pathname + newSearch + location.hash;
            history.replaceState(history.state, '', newUrl);
        };

        const handler = () => {
            clean();
            Promise.resolve()
                .then(clean);
        };

        for (let i = 0; i < events.length; i++) {
            document.addEventListener(events[i], handler, false);
        }
    }

    // ============================================================================
    // TIMER OPTIMIZER
    // ============================================================================
    let __timersPatched = false;

    function optimizeTimers() {
        if (!CONFIG.throttleTimers) return;
        if (__timersPatched) return;
        __timersPatched = true;

        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const originalClearTimeout = window.clearTimeout;
        const originalClearInterval = window.clearInterval;

        const activeTasks = new Map();

        function now() {
            return performance.now();
        }

        function wrapTimer(originalFn, minDelay, hardMinDelay) {
            return function (callback, delay, ...args) {

                if (typeof callback !== 'function' || typeof delay !== 'number' || delay < minDelay) {
                    return originalFn(callback, delay, ...args);
                }

                const finalDelay = delay < hardMinDelay ? hardMinDelay : delay;

                const task = {
                    cb: callback,
                    args,
                    lastRun: 0,
                    cancelled: false
                };

                const id = originalFn(function tick() {
                    if (task.cancelled) return;

                    const t = now();

                    if (t - task.lastRun >= finalDelay - 5) {
                        task.lastRun = t;
                        try {
                            task.cb(...task.args);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }, finalDelay);

                activeTasks.set(id, task);
                return id;
            };
        }

        window.setInterval = wrapTimer(originalSetInterval, 1000, 2000);
        window.setTimeout = wrapTimer(originalSetTimeout, 200, 1000);

        window.clearInterval = function (id) {
            const task = activeTasks.get(id);
            if (task) {
                task.cancelled = true;
                activeTasks.delete(id);
            }
            return originalClearInterval(id);
        };

        window.clearTimeout = function (id) {
            const task = activeTasks.get(id);
            if (task) {
                task.cancelled = true;
                activeTasks.delete(id);
            }
            return originalClearTimeout(id);
        };

        try {
            window.setTimeout.toString = originalSetTimeout.toString.bind(originalSetTimeout);
            window.setInterval.toString = originalSetInterval.toString.bind(originalSetInterval);
            window.clearTimeout.toString = originalClearTimeout.toString.bind(originalClearTimeout);
            window.clearInterval.toString = originalClearInterval.toString.bind(originalClearInterval);
        } catch (e) {}
    }

    // ============================================================================
    // UI CLEANER
    // ============================================================================

    const BASE_HIDE_SELECTORS = {
        shorts: [
            '[is-shorts]',
            'ytd-reel-shelf-renderer',
            'ytd-reel-item-renderer',
            'a[href*="/shorts/"]'
        ],
        ads: [
            'ytd-display-ad-renderer',
            '.ytp-ad-module',
            '.video-ads'
        ],
        sidebar: [
            '#secondary',
            '#related',
            'ytd-watch-next-secondary-results-renderer'
        ],
        comments: [
            '#comments',
            'ytd-comments'
        ]
    };

    let __uiCleanerInitialized = false;

    function cleanUI() {
        if (!CONFIG.simplifyUI) return;
        if (__uiCleanerInitialized) return;
        __uiCleanerInitialized = true;

        let debounceTimer = null;
        let observer = null;
        let mutationCount = 0;

        const MAX_MUTATIONS = 2000;
        const DEBOUNCE_DELAY = 250;

        let combinedSelector = '';

        function rebuildSelector() {
            const parts = [];

            if (CONFIG.removeShorts) parts.push(...BASE_HIDE_SELECTORS.shorts);
            if (CONFIG.removeAds) parts.push(...BASE_HIDE_SELECTORS.ads);
            if (CONFIG.simplifyUI) parts.push(...BASE_HIDE_SELECTORS.sidebar);
            if (CONFIG.removeComments) parts.push(...BASE_HIDE_SELECTORS.comments);

            combinedSelector = parts.join(',');
        }

        function hideElements() {
            if (!document.body || !combinedSelector) return 0;

            let nodes;
            try {
                nodes = document.querySelectorAll(combinedSelector);
            } catch {
                return 0;
            }

            let hiddenCount = 0;

            for (let i = 0; i < nodes.length; i++) {
                const el = nodes[i];
                if (!el || el.__ytOptimizerHidden) continue;

                el.style.display = 'none';
                el.__ytOptimizerHidden = true;
                hiddenCount++;
            }

            return hiddenCount;
        }

        function scheduleCleanup(delay = DEBOUNCE_DELAY) {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(hideElements, delay);
        }

        observer = new MutationObserver((mutations) => {
            mutationCount++;
            if (mutationCount > MAX_MUTATIONS) {
                observer.disconnect();
                return;
            }

            for (const m of mutations) {
                if (m.type === 'childList' && m.addedNodes.length) {
                    scheduleCleanup();
                    break;
                }
            }
        });

        function startObserver() {
            if (!document.body) return;
            observer.observe(document.body, { childList: true, subtree: true });
        }

        let navDebounce = null;

        function onSPANavigation() {
            mutationCount = 0;
            rebuildSelector();
            if (navDebounce) clearTimeout(navDebounce);
            navDebounce = setTimeout(hideElements, 400);
        }

        document.addEventListener('yt-navigate-finish', onSPANavigation);
        document.addEventListener('yt-page-data-fetched', onSPANavigation);

        function cleanup() {
            if (debounceTimer) clearTimeout(debounceTimer);
            if (navDebounce) clearTimeout(navDebounce);
            if (observer) observer.disconnect();

            document.removeEventListener('yt-navigate-finish', onSPANavigation);
            document.removeEventListener('yt-page-data-fetched', onSPANavigation);
        }

        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);

        function runInitial() {
            setTimeout(hideElements, 500);
        }

        rebuildSelector();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runInitial, { once: true });
        } else {
            runInitial();
        }

        startObserver();

        window.__ytOptimizerCleanupUI = cleanup;
    }

    // ============================================================================
    // VIDEO QUALITY LIMITER
    // ============================================================================
    let __qualityLimiterInitialized = false;

    function setupQualityLimiter() {
        if (!CONFIG.limitVideoQuality) return;
        if (__qualityLimiterInitialized) return;
        __qualityLimiterInitialized = true;

        const qualityMap = {
            '144p': 'tiny',
            '240p': 'small',
            '360p': 'medium',
            '480p': 'large',
            '720p': 'hd720',
            '1080p': 'hd1080',
            '1440p': 'hd1440',
            '2160p': 'hd2160',
            '4320p': 'hd4320'
        };

        const targetQuality = qualityMap[CONFIG.maxQuality];
        if (!targetQuality) return;

        function tryApplyQuality() {
            const player = document.getElementById('movie_player') ||
                document.querySelector('.html5-video-player');

            if (!player) return false;

            try {
                if (typeof player.setPlaybackQualityRange === 'function') {
                    player.setPlaybackQualityRange(targetQuality, targetQuality);
                }
                if (typeof player.setPlaybackQuality === 'function') {
                    player.setPlaybackQuality(targetQuality);
                }
                return true;
            } catch {
                return false;
            }
        }

        const observer = new MutationObserver(() => {
            if (tryApplyQuality()) {}
        });

        function start() {
            tryApplyQuality();
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }

        start();

        document.addEventListener('yt-navigate-finish', () => {
            tryApplyQuality();
        });
    }

    // ============================================================================
    // PLAYER OPTIMIZER (CLEAN)
    // ============================================================================
    function optimizePlayer() {

        // ------------------------------------------------------------------------
        // Disable autoplay
        // ------------------------------------------------------------------------
        let __autoplayDisablerInitialized = false;

        function setupAutoplayDisabler() {
            if (!CONFIG.disableAutoplay) return;
            if (__autoplayDisablerInitialized) return;
            __autoplayDisablerInitialized = true;

            function tryDisableAutoplay() {
                const btn = document.querySelector('.ytp-autonav-toggle-button');
                if (!btn) return false;

                if (btn.getAttribute('aria-checked') === 'true') {
                    btn.click();
                }
                return true;
            }

            const observer = new MutationObserver(() => {
                tryDisableAutoplay();
            });

            function start() {
                tryDisableAutoplay();
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            }

            start();

            document.addEventListener('yt-navigate-finish', () => {
                tryDisableAutoplay();
            });
        }

        // ------------------------------------------------------------------------
        // Video quality limiter
        // ------------------------------------------------------------------------
        if (CONFIG.limitVideoQuality) {
            setupQualityLimiter();
        }
    }

    // ============================================================================
    // LAZY LOADING
    // ============================================================================
    function optimizeLazyLoading() {
        if (!CONFIG.lazyLoadImages) return;

        if (window.__ytOptimizerLazyInit) return;
        window.__ytOptimizerLazyInit = true;

        const io = new IntersectionObserver((entries) => {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                if (!entry.isIntersecting) continue;

                const img = entry.target;
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
                io.unobserve(img);
            }
        }, {
            rootMargin: '200px',
            threshold: 0.01
        });

        function observeImage(img) {
            if (!img || img.__ytOptimizerObserved) return;
            if (!img.hasAttribute('data-src')) return;

            img.__ytOptimizerObserved = true;
            io.observe(img);
        }

        const initial = document.querySelectorAll('img[data-src]');
        for (let i = 0; i < initial.length; i++) {
            observeImage(initial[i]);
        }

        const mo = new MutationObserver((mutations) => {
            for (let i = 0; i < mutations.length; i++) {
                const m = mutations[i];
                if (m.type !== 'childList' || m.addedNodes.length === 0) continue;

                for (let j = 0; j < m.addedNodes.length; j++) {
                    const node = m.addedNodes[j];
                    if (node.nodeType !== 1) continue;

                    if (node.tagName === 'IMG') {
                        observeImage(node);
                    } else {
                        const imgs = node.querySelectorAll && node.querySelectorAll('img[data-src]');
                        if (imgs && imgs.length) {
                            for (let k = 0; k < imgs.length; k++) {
                                observeImage(imgs[k]);
                            }
                        }
                    }
                }
            }
        });

        if (document.body) {
            mo.observe(document.body, { childList: true, subtree: true });
        }
    }

    // ============================================================================
    // SETTINGS UI
    // ============================================================================
    class SettingsUI {
        constructor() {
            this.isOpen = false;
            this.modal = null;
            this.overlay = null;
            this.settingsButton = null;
            this.isFullscreen = false;
            this.applyTimeout = null;

            this.cachedElements = new Map();
            this.activeTab = '⚡ Производительность';

            this.handleEscapeKey = this.handleEscapeKey.bind(this);
            this.handleOverlayClick = this.handleOverlayClick.bind(this);

            this.initialize();
        }

        injectStyles() {
            const styles = `
            .ytoo-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9998;
                backdrop-filter: blur(4px);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .ytoo-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background: #0f0f0f;
                color: white;
                border-radius: 16px;
                padding: 24px;
                width: 90%;
                max-width: 600px;
                height: 850px;
                overflow-y: auto;
                z-index: 9999;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 16px;
                line-height: 1.5;
            }

            .ytoo-modal-content {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .ytoo-header {
                margin-bottom: 24px;
                flex-shrink: 0;
            }

            .ytoo-title {
                margin: 0 0 12px 0;
                color: #fff;
                font-size: 28px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .ytoo-title-icon {
                background: linear-gradient(135deg, #ff0000, #cc0000);
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .ytoo-version {
                margin: 0;
                color: #aaa;
                font-size: 16px;
            }

            .ytoo-tabs-container {
                margin-bottom: 20px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            .ytoo-tabs-header {
                display: flex;
                overflow-x: auto;
                margin-bottom: 20px;
                gap: 5px;
                padding-bottom: 10px;
                flex-shrink: 0;
            }

            .ytoo-tab-button {
                padding: 10px 16px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                white-space: nowrap;
                font-size: 14px;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .ytoo-tab-button:hover {
                background: rgba(255,255,255,0.1);
            }

            .ytoo-tab-button.active {
                background: rgba(255,0,0,0.2);
                border: 1px solid rgba(255,0,0,0.3);
            }

            .ytoo-tab-content {
                background: #1a1a1a;
                border-radius: 10px;
                padding: 20px;
                height: 500px;
                overflow-y: auto;
                flex-grow: 1;
            }

            .ytoo-setting-group {
                margin-bottom: 20px;
            }

            .ytoo-setting-container {
                margin-bottom: 20px;
                padding: 16px;
                background: #2a2a2a;
                border-radius: 10px;
                border-left: 4px solid #ff0000;
                border: 1px solid #3a3a3a;
                transition: all 0.2s ease;
            }

            .ytoo-setting-container:hover {
                background: #333;
            }

            .ytoo-setting-container.disabled {
                opacity: 0.5;
                border-left-color: #666;
            }

            .ytoo-setting-container.checked {
                border-left-color: #4CAF50;
            }

            .ytoo-setting-row {
                display: flex;
                align-items: flex-start;
            }

            .ytoo-checkbox-container {
                flex-shrink: 0;
                margin-right: 16px;
            }

            .ytoo-checkbox {
                width: 22px;
                height: 22px;
                margin: 0;
                cursor: pointer;
                accent-color: #ff0000;
            }

            .ytoo-content-container {
                flex-grow: 1;
            }

            .ytoo-setting-label {
                display: block;
                font-weight: 600;
                color: #fff;
                margin-bottom: 6px;
                cursor: pointer;
                font-size: 16px;
            }

            .ytoo-setting-description {
                font-size: 14px;
                color: #aaa;
                line-height: 1.4;
            }

            .ytoo-status-container {
                flex-shrink: 0;
                margin-left: 16px;
                display: flex;
                align-items: center;
            }

            .ytoo-status-dot {
                display: inline-block;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #666;
                margin-right: 8px;
            }

            .ytoo-status-dot.checked {
                background: #4CAF50;
            }

            .ytoo-status-text {
                font-size: 12px;
                color: #666;
                font-weight: 600;
            }

            .ytoo-status-text.checked {
                color: #4CAF50;
            }

            .ytoo-select {
                width: 100%;
                padding: 12px 16px;
                background: #1a1a1a;
                color: white;
                border: 1px solid #444;
                border-radius: 8px;
                font-size: 16px;
                outline: none;
                transition: border-color 0.2s;
                cursor: pointer;
            }

            .ytoo-select:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .ytoo-actions {
                display: flex;
                gap: 16px;
                margin-top: 32px;
                padding-top: 24px;
                border-top: 2px solid #333;
                flex-shrink: 0;
            }

            .ytoo-apply-btn {
                flex: 1;
                padding: 16px 24px;
                background: linear-gradient(135deg, #ff0000, #cc0000);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                min-height: 56px;
            }

            .ytoo-apply-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(255, 0, 0, 0.3);
            }

            .ytoo-apply-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .ytoo-reset-btn {
                padding: 16px 24px;
                background: #333;
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.2s;
                font-weight: 500;
                min-height: 56px;
            }

            .ytoo-reset-btn:hover {
                background: #444;
            }

            .ytoo-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10001;
                font-size: 14px;
                font-weight: 500;
                transform: translateX(120%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .ytoo-notification.error {
                background: #f44336;
            }

            .ytoo-settings-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff0000, #cc0000, #990000);
                color: white;
                border: 2px solid white;
                font-size: 24px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
                overflow: hidden;
            }

            .ytoo-settings-button .tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                z-index: 10001;
                margin-bottom: 10px;
            }

            .ytoo-settings-button:hover .tooltip {
                opacity: 1;
            }

            .ytoo-settings-button:hover {
                transform: scale(1.15) rotate(15deg);
            }

            /* Scrollbar styling */
            .ytoo-tab-content::-webkit-scrollbar {
                width: 8px;
            }

            .ytoo-tab-content::-webkit-scrollbar-track {
                background: #1a1a1a;
                border-radius: 4px;
            }

            .ytoo-tab-content::-webkit-scrollbar-thumb {
                background: #444;
                border-radius: 4px;
            }

            .ytoo-tab-content::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
        `;

            const style = document.createElement('style');
            style.textContent = styles;
            style.id = 'ytoo-styles';

            const oldStyle = document.getElementById('ytoo-styles');
            if (oldStyle) {
                oldStyle.remove();
            }

            document.head.appendChild(style);
        }

        close() {
            if (!this.isOpen) return;

            this.modal.style.opacity = '0';
            this.modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
            this.overlay.style.opacity = '0';

            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.modal = null;
                this.overlay = null;
                this.isOpen = false;
                this.cachedElements.clear();

                this.removeGlobalEventListeners();
            }, 300);
        }

        handleEscapeKey(e) {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        }

        handleOverlayClick(e) {
            if (e.target === this.overlay && this.isOpen) {
                this.close();
            }
        }

        addGlobalEventListeners() {
            if (this.overlay) {
                this.overlay.addEventListener('click', this.handleOverlayClick);
            }
            document.addEventListener('keydown', this.handleEscapeKey);
        }

        removeGlobalEventListeners() {
            if (this.overlay) {
                this.overlay.removeEventListener('click', this.handleOverlayClick);
            }
            document.removeEventListener('keydown', this.handleEscapeKey);
        }

        createModal() {
            const oldModal = document.querySelector('.ytoo-modal');
            const oldOverlay = document.querySelector('.ytoo-modal-overlay');

            if (oldModal) oldModal.remove();
            if (oldOverlay) oldOverlay.remove();

            this.overlay = document.createElement('div');
            this.overlay.className = 'ytoo-modal-overlay';

            this.modal = document.createElement('div');
            this.modal.className = 'ytoo-modal';
        }

        open() {
            if (this.isOpen) return;

            this.createModal();

            const content = this.createModalContent();
            this.modal.appendChild(content);

            document.body.appendChild(this.overlay);
            document.body.appendChild(this.modal);

            requestAnimationFrame(() => {
                this.overlay.style.opacity = '1';
                this.modal.style.opacity = '1';
                this.modal.style.transform = 'translate(-50%, -50%) scale(1)';
            });

            this.isOpen = true;

            this.addGlobalEventListeners();

            this.setupEventDelegation();
        }

        setupEventDelegation() {
            if (!this.modal) return;

            this.modal.addEventListener('click', (e) => {
                const tabBtn = e.target.closest('.ytoo-tab-button');
                if (tabBtn) {
                    e.preventDefault();
                    this.handleTabClick(tabBtn);
                    return;
                }

                if (e.target.closest('#yt-optimizer-apply')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleApplyClick(e.target.closest('#yt-optimizer-apply'));
                    return;
                }

                if (e.target.closest('#yt-optimizer-reset')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleResetClick();
                    return;
                }

                const label = e.target.closest('label.ytoo-setting-label');
                if (label && label.htmlFor) {
                    const checkbox = document.getElementById(label.htmlFor);
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    return;
                }
            });

            this.modal.addEventListener('change', (e) => {
                if (e.target.classList.contains('ytoo-checkbox')) {
                    this.handleCheckboxChange(e.target);
                } else if (e.target.classList.contains('ytoo-select')) {
                    this.handleSelectChange(e.target);
                }
            });
        }

        handleTabClick(tabButton) {
            const tabs = this.modal.querySelectorAll('.ytoo-tab-button');
            tabs.forEach(tab => tab.classList.remove('active'));
            tabButton.classList.add('active');

            this.activeTab = tabButton.textContent;

            const tabContent = this.modal.querySelector('.ytoo-tab-content');
            if (tabContent) {
                this.updateTabContent(tabContent, this.activeTab);
            }
        }

        handleCheckboxChange(checkbox) {
            const key = checkbox.id.replace('setting-', '');
            CONFIG[key] = checkbox.checked;

            if (key === 'limitVideoQuality') {
                const qualitySelect = this.modal.querySelector('#setting-maxQuality');
                if (qualitySelect) {
                    qualitySelect.disabled = !checkbox.checked;
                    const container = qualitySelect.closest('.ytoo-setting-container');
                    if (container) {
                        container.classList.toggle('disabled', !checkbox.checked);
                    }
                }
            }

            if (key === 'showSettingsButton') {
                if (checkbox.checked) {
                    if (!this.settingsButton) {
                        this.createSettingsButton();
                    } else {
                        this.settingsButton.style.display = 'flex';
                    }
                } else if (this.settingsButton) {
                    this.settingsButton.style.display = 'none';
                }
            }

            const container = checkbox.closest('.ytoo-setting-container');
            if (container) {
                const statusDot = container.querySelector('.ytoo-status-dot');
                const statusText = container.querySelector('.ytoo-status-text');

                if (checkbox.checked) {
                    container.classList.add('checked');
                    if (statusDot) statusDot.classList.add('checked');
                    if (statusText) {
                        statusText.classList.add('checked');
                        statusText.textContent = 'ON';
                    }
                } else {
                    container.classList.remove('checked');
                    if (statusDot) statusDot.classList.remove('checked');
                    if (statusText) {
                        statusText.classList.remove('checked');
                        statusText.textContent = 'OFF';
                    }
                }
            }
        }

        handleSelectChange(select) {
            const key = select.id.replace('setting-', '');
            CONFIG[key] = select.value;
        }

        handleApplyClick(button) {
            if (this.applyTimeout) return;

            this.animateApplyButton(button);
            this.collectCurrentFormValues();

            const success = saveConfig(CONFIG);

            if (success) {
                this.showNotification('Settings saved successfully! Reloading page...', 'success');
                this.applyTimeout = setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                this.showNotification('Failed to save settings!', 'error');
            }
        }

        handleResetClick() {
            if (confirm('Reset all settings to default values? This will reload the page.')) {
                CONFIG = { ...DEFAULT_CONFIG };
                saveConfig(CONFIG);
                setTimeout(() => location.reload(), 500);
            }
        }

        animateApplyButton(button) {
            const originalContent = button.innerHTML;
            const originalBackground = button.style.background;

            button.disabled = true;
            button.style.transform = 'scale(0.95)';
            button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            button.innerHTML = '<span>✓</span><span>Saving...</span>';

            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                button.innerHTML = '<span>✓</span><span>Saved!</span>';

                setTimeout(() => {
                    if (button && button.parentNode) {
                        button.disabled = false;
                        button.style.transform = 'translateY(0)';
                        button.style.background = originalBackground;
                        button.innerHTML = originalContent;
                    }
                }, 1000);
            }, 300);
        }

        collectCurrentFormValues() {
            const checkboxes = this.modal.querySelectorAll('.ytoo-checkbox');
            const selects = this.modal.querySelectorAll('.ytoo-select');

            checkboxes.forEach(checkbox => {
                const key = checkbox.id.replace('setting-', '');
                CONFIG[key] = checkbox.checked;
            });

            selects.forEach(select => {
                const key = select.id.replace('setting-', '');
                CONFIG[key] = select.value;
            });
        }

        showNotification(message, type = 'success') {
            const oldNotification = document.querySelector('.ytoo-notification');
            if (oldNotification) oldNotification.remove();

            const notification = document.createElement('div');
            notification.className = `ytoo-notification ${type === 'error' ? 'error' : ''}`;
            notification.textContent = message;
            document.body.appendChild(notification);

            requestAnimationFrame(() => {
                notification.style.transform = 'translateX(0)';
            });

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.transform = 'translateX(120%)';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 3000);
        }

        initialize() {
            this.injectStyles();
            CONFIG = loadConfig();

            if (CONFIG.showSettingsButton) {
                this.createSettingsButton();
            }

            try {
                GM_registerMenuCommand('⚙ Open YouTube Optimizer Settings', () => this.open());
            } catch (e) {
            }

            this.setupFullscreenHandlers();
        }

        setupFullscreenHandlers() {
            const checkFullscreen = () => {
                const isFullscreen = !!(
                    document.fullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement ||
                    document.querySelector('.html5-video-player[fullscreen]') ||
                    document.querySelector('.html5-video-player.ytp-fullscreen')
                );

                if (this.isFullscreen !== isFullscreen) {
                    this.isFullscreen = isFullscreen;
                    this.updateButtonVisibility();
                }
            };

            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
                document.addEventListener(event, checkFullscreen);
            });

            document.addEventListener('yt-fullscreen-change', (e) => {
                this.isFullscreen = e.detail && e.detail.isFullscreen;
                this.updateButtonVisibility();
            });

            setTimeout(checkFullscreen, 100);
        }

        updateButtonVisibility() {
            if (this.settingsButton) {
                this.settingsButton.style.display = this.isFullscreen ? 'none' : 'flex';
            }
        }

        createSettingsButton() {
            if (document.getElementById('yt-optimizer-settings-btn')) {
                this.settingsButton = document.getElementById('yt-optimizer-settings-btn');
                return;
            }

            this.settingsButton = document.createElement('button');
            this.settingsButton.id = 'yt-optimizer-settings-btn';
            this.settingsButton.className = 'ytoo-settings-button';
            this.settingsButton.innerHTML = '⚡<span class="tooltip">Open YouTube Optimizer Settings</span>';
            this.settingsButton.setAttribute('aria-label', 'Open YouTube Optimizer Settings');
            this.settingsButton.setAttribute('type', 'button');

            this.settingsButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.open();
            });

            this.settingsButton.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });

            setTimeout(() => {
                this.settingsButton.style.opacity = '0';
                document.body.appendChild(this.settingsButton);
                requestAnimationFrame(() => {
                    this.settingsButton.style.transition = 'opacity 0.5s ease';
                    this.settingsButton.style.opacity = '1';
                });
            }, 1000);
        }

        createModalContent() {
            const container = document.createElement('div');
            container.className = 'ytoo-modal-content';

            const header = this.createHeader();
            container.appendChild(header);

            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'ytoo-tabs-container';

            const tabsHeader = document.createElement('div');
            tabsHeader.className = 'ytoo-tabs-header';

            const tabsContent = document.createElement('div');
            tabsContent.className = 'ytoo-tab-content';

            Object.keys(this.getCategories())
                .forEach(categoryName => {
                    const tabButton = document.createElement('button');
                    tabButton.className = `ytoo-tab-button ${categoryName === this.activeTab ? 'active' : ''}`;
                    tabButton.textContent = categoryName;
                    tabButton.dataset.category = categoryName;
                    tabsHeader.appendChild(tabButton);
                });

            tabsContainer.appendChild(tabsHeader);
            tabsContainer.appendChild(tabsContent);
            container.appendChild(tabsContainer);

            this.updateTabContent(tabsContent, this.activeTab);

            const actionsDiv = this.createActionButtons();
            container.appendChild(actionsDiv);

            return container;
        }

        createHeader() {
            const header = document.createElement('div');
            header.className = 'ytoo-header';

            const title = document.createElement('h2');
            title.className = 'ytoo-title';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'ytoo-title-icon';
            iconSpan.textContent = '⚡';

            const titleText = document.createTextNode(' Open YouTube Optimizer');
            title.appendChild(iconSpan);
            title.appendChild(titleText);

            const version = document.createElement('p');
            version.className = 'ytoo-version';
            version.textContent = 'Version 2.0';

            header.appendChild(title);
            header.appendChild(version);

            return header;
        }

        createActionButtons() {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'ytoo-actions';

            const applyBtn = document.createElement('button');
            applyBtn.id = 'yt-optimizer-apply';
            applyBtn.className = 'ytoo-apply-btn';
            applyBtn.setAttribute('type', 'button');
            applyBtn.innerHTML = '<span>✓</span><span>Apply and Reload</span>';

            const resetBtn = document.createElement('button');
            resetBtn.id = 'yt-optimizer-reset';
            resetBtn.className = 'ytoo-reset-btn';
            resetBtn.setAttribute('type', 'button');
            resetBtn.textContent = 'Reset to Defaults';

            actionsDiv.appendChild(applyBtn);
            actionsDiv.appendChild(resetBtn);

            return actionsDiv;
        }

        getCategories() {
            return {
                '⚡ Производительность': [
                    { key: 'disableAnimations', label: 'Отключить анимации', description: 'Убирает все CSS-анимации и переходы' },
                    { key: 'throttleTimers', label: 'Оптимизировать таймеры', description: 'Замедляет фоновые JavaScript-таймеры' },
                    { key: 'lazyLoadImages', label: 'Ленивая загрузка изображений', description: 'Оптимизирует загрузку изображений' },
                    { key: 'memoryLeakFix', label: 'Исправление утечек памяти', description: 'Исправляет утечки памяти на YouTube' },
                    { key: 'optimizeThumbnails', label: 'Оптимизировать превью', description: 'Улучшает загрузку миниатюр видео' },
                ],
                '🎨 Внешний вид': [
                    { key: 'simplifyUI', label: 'Упростить интерфейс', description: 'Минималистичный интерфейс YouTube' },
                    { key: 'disableBlurEffects', label: 'Отключить размытие', description: 'Убирает эффекты размытия фона' },
                    { key: 'disableShadows', label: 'Отключить тени', description: 'Убирает эффекты теней' },
                    { key: 'disableNotifications', label: 'Отключить уведомления', description: 'Скрывает бейджи уведомлений' },
                ],
                '🚫 Блокировка контента': [
                    { key: 'removeAds', label: 'Убрать рекламу', description: 'Блокирует рекламу' },
                    { key: 'removeShorts', label: 'Убрать Shorts', description: 'Полностью скрывает YouTube Shorts' },
                    { key: 'removeComments', label: 'Убрать комментарии', description: 'Скрывает раздел комментариев' },
                    { key: 'removeTrending', label: 'Убрать "В тренде"', description: 'Скрывает раздел популярного контента' },
                    { key: 'removeLiveChat', label: 'Убрать живой чат', description: 'Скрывает чат на трансляциях' },
                    { key: 'removePromo', label: 'Убрать промо-материалы', description: 'Скрывает промо-материалы YouTube' },
                ],
                '🎬 Плеер': [
                    { key: 'disableAutoplay', label: 'Отключить автовоспроизведение', description: 'Отключает автоматическое воспроизведение видео' },
                    { key: 'limitVideoQuality', label: 'Ограничить качество видео', description: 'Устанавливает максимальное качество видео' },
                    {
                        type: 'select',
                        key: 'maxQuality',
                        label: 'Максимальное качество',
                        options: [
                            { value: '360p', label: '360p' },
                            { value: '480p', label: '480p' },
                            { value: '720p', label: '720p (HD)' },
                            { value: '1080p', label: '1080p (Full HD)' },
                            { value: '1440p', label: '1440p (2K)' },
                            { value: '2160p', label: '2160p (4K)' }
                        ],
                        disabled: !CONFIG.limitVideoQuality
                    },
                    { key: 'disablePlayerGradients', label: 'Отключить градиенты плеера', description: 'Убирает градиенты в верхней/нижней части плеера' },
                    { key: 'disablePlayerWatermarkAndAnnotations', label: 'Отключить водяной знак и аннотации', description: 'Скрывает водяной знак YouTube и аннотации' },
                    { key: 'removeInfoAndPlayerCards', label: 'Убрать информационные и игровые карточки', description: 'Убирает информацию о видео и карточки в плеере' },
                    { key: 'removeEndScreen', label: 'Убрать завершающий экран', description: 'Скрывает рекомендации в конце видео' },
                ],
                '⚙️ Настройки OYO': [
                    { key: 'showSettingsButton', label: 'Показать кнопку настроек', description: 'Отображает плавающую кнопку настроек' },
                ],
            };
        }

        updateTabContent(container, categoryName) {
            const categories = this.getCategories();
            const settings = categories[categoryName];

            if (!settings) return;

            const fragment = document.createDocumentFragment();

            settings.forEach(setting => {
                const element = this.createSettingElement(setting);
                fragment.appendChild(element);
            });

            container.innerHTML = '';
            container.appendChild(fragment);
        }

        createSettingElement(setting) {
            const container = document.createElement('div');
            container.className = 'ytoo-setting-container';

            if (setting.disabled) {
                container.classList.add('disabled');
            }

            if (setting.type === 'select') {
                const label = document.createElement('label');
                label.className = 'ytoo-setting-label';
                label.textContent = setting.label;
                label.htmlFor = `setting-${setting.key}`;

                const select = document.createElement('select');
                select.id = `setting-${setting.key}`;
                select.className = 'ytoo-select';
                select.disabled = setting.disabled;

                setting.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    if (CONFIG[setting.key] === opt.value) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });

                container.appendChild(label);
                container.appendChild(select);

                if (setting.description) {
                    const description = document.createElement('div');
                    description.className = 'ytoo-setting-description';
                    description.textContent = setting.description;
                    container.appendChild(description);
                }
            } else {
                const isChecked = CONFIG[setting.key];
                if (isChecked) {
                    container.classList.add('checked');
                }

                const row = document.createElement('div');
                row.className = 'ytoo-setting-row';

                const checkboxContainer = document.createElement('div');
                checkboxContainer.className = 'ytoo-checkbox-container';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `setting-${setting.key}`;
                checkbox.className = 'ytoo-checkbox';
                checkbox.checked = isChecked;

                checkboxContainer.appendChild(checkbox);

                const contentContainer = document.createElement('div');
                contentContainer.className = 'ytoo-content-container';

                const label = document.createElement('label');
                label.className = 'ytoo-setting-label';
                label.htmlFor = `setting-${setting.key}`;
                label.textContent = setting.label;

                contentContainer.appendChild(label);

                if (setting.description) {
                    const description = document.createElement('div');
                    description.className = 'ytoo-setting-description';
                    description.textContent = setting.description;
                    contentContainer.appendChild(description);
                }

                const statusContainer = document.createElement('div');
                statusContainer.className = 'ytoo-status-container';

                const statusDot = document.createElement('span');
                statusDot.className = `ytoo-status-dot ${isChecked ? 'checked' : ''}`;

                const statusText = document.createElement('span');
                statusText.className = `ytoo-status-text ${isChecked ? 'checked' : ''}`;
                statusText.textContent = isChecked ? 'ON' : 'OFF';

                statusContainer.appendChild(statusDot);
                statusContainer.appendChild(statusText);

                row.appendChild(checkboxContainer);
                row.appendChild(contentContainer);
                row.appendChild(statusContainer);
                container.appendChild(row);
            }
            return container;
        }
    }
    window.ytOptimizerUI = new SettingsUI();

    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    function initialize() {
        const cleanupFunctions = [];

        const settingsUI = new SettingsUI();
        window.ytOptimizerUI = settingsUI;

        const optimizations = [
            { fn: applyMemoryLeakFix, name: 'Memory Leak Fix' },
            { fn: injectAdvancedCSS, name: 'Advanced CSS Injection' },
            { fn: disableAnimations, name: 'Animation Disabler' },
            { fn: cleanUI, name: 'UI Cleaner' },
            { fn: optimizeTimers, name: 'Timer Optimizer' },
            { fn: optimizePlayer, name: 'Player Optimizer' },
            { fn: optimizeLazyLoading, name: 'Lazy Load Optimization' },
            { fn: cleanNotificationTitles, name: 'Notification Cleaner' },
            { fn: disableTrailerAutoplay, name: 'Trailer Autoplay Disabler' },
            { fn: preventAutoPause, name: 'Auto-pause Prevention' },
            { fn: cleanUrlParameters, name: 'URL Parameter Cleaner' }
        ];

        function runOptimizations() {
            for (let i = 0; i < optimizations.length; i++) {
                const { fn, name } = optimizations[i];
                try {
                    const cleanup = fn();
                    if (typeof cleanup === 'function') {
                        cleanupFunctions.push(cleanup);
                    }
                } catch (error) {}
            }
        }

        function cleanupAll() {
            for (let i = 0; i < cleanupFunctions.length; i++) {
                try {
                    cleanupFunctions[i]();
                } catch (e) {}
            }
            cleanupFunctions.length = 0;
        }
        runOptimizations();

        // ------------------------------------------------------------------------
        // SPA Navigation handling (YouTube)
        // ------------------------------------------------------------------------
        let lastUrl = location.href;
        let spaTimer = 0;

        function handleSPANavigation() {
            if (location.href === lastUrl) return;

            if (spaTimer) {
                clearTimeout(spaTimer);
            }

            spaTimer = setTimeout(() => {
                const currentUrl = location.href;
                if (currentUrl === lastUrl) return;

                lastUrl = currentUrl;

                cleanupAll();

                runOptimizations();
            }, 200);
        }

        document.addEventListener('yt-navigate-finish', handleSPANavigation);
        document.addEventListener('yt-page-data-fetched', handleSPANavigation);

        const urlObserver = new MutationObserver(() => {
            handleSPANavigation();
        });

        urlObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // ------------------------------------------------------------------------
        // Global cleanup
        // ------------------------------------------------------------------------
        function globalCleanup() {
            cleanupAll();
            urlObserver.disconnect();

            if (window.__ytOptimizerCleanupUI) {
                try {
                    window.__ytOptimizerCleanupUI();
                } catch (e) {}
            }

            window.ytOptimizerUI = null;
        }

        window.addEventListener('beforeunload', globalCleanup, { once: true });
        window.addEventListener('pagehide', globalCleanup, { once: true });
    }

    // ============================================================================
    // STARTUP
    // ============================================================================
    function start() {
        initialize();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(start, 50);
        }, { once: true });
    } else {
        setTimeout(start, 50);
    }

})();
