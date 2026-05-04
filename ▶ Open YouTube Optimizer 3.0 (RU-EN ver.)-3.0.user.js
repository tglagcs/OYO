// ==UserScript==
// @name         ▶ Open YouTube Optimizer 3.0 (RU/EN ver.)
// @name:ru      ▶ Open YouTube Optimizer 3.0 (RU/EN вер.)
// @version      3.0
// @description  Advanced script to improve YouTube performance and simplify interface (with search, change indicators, color theme switcher, per-option unsaved warning, preview on color change)
// @description:ru Усовершенствованный скрипт для повышения производительности и упрощения интерфейса YouTube (с поиском, индикаторами изменений, переключателем цветовой темы, предпросмотром цвета, всплывающими подсказками)
// @author       | tg: @lag_cs | github: tglagcs | (адаптация и фикс автоплея: DeepSeek)
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
// @namespace https://greasyfork.org/users/1561081
// @downloadURL https://update.greasyfork.org/scripts/562908/%E2%96%B6%20Open%20YouTube%20Optimizer%2020%20%28EN%20ver%29.user.js
// @updateURL https://update.greasyfork.org/scripts/562908/%E2%96%B6%20Open%20YouTube%20Optimizer%2020%20%28EN%20ver%29.meta.js
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
        disableAnimations: false,
        throttleTimers: false,
        lazyLoadImages: false,
        memoryLeakFix: false,
        optimizeThumbnails: false,
        blockNonH264: false,
        limitFps30: false,

        // 🎨 Appearance & Layout
        simplifyUI: false,
        disableBlurEffects: false,
        disableShadows: false,
        disableNotifications: false,

        // 🚫 Content Blocking
        removeAds: false,
        removeShorts: false,
        removeComments: false,
        removeTrending: false,
        removeLiveChat: false,
        removePromo: false,

        // 🎬 Player
        disableAutoplay: false,
        pauseOnLoad: false,
        limitVideoQuality: false,
        maxQuality: '2160p',
        minQuality: '144p',
        disablePlayerGradients: false,
        disablePlayerWatermarkAndAnnotations: false,
        removeInfoAndPlayerCards: false,
        removeEndScreen: false,

        // ⚙️ OYO Settings
        showSettingsButton: true,
        language: 'ru', // 'ru' or 'en'
        accentColor: 'red',
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
    // CODEC & FPS RESTRICTIONS (h264ify style)
    // ============================================================================
    function applyCodecRestrictions() {
        if (!CONFIG.blockNonH264 && !CONFIG.limitFps30) return;

        const mediaSource = window.MediaSource;
        if (!mediaSource) return;

        const originalIsTypeSupported = mediaSource.isTypeSupported.bind(mediaSource);

        const DISALLOWED_TYPES_REGEX = /webm|vp8|vp9|av01/i;
        const FRAME_RATE_REGEX = /framerate=(\d+)/;

        mediaSource.isTypeSupported = (type) => {
            if (typeof type !== 'string') return false;

            if (CONFIG.blockNonH264 && DISALLOWED_TYPES_REGEX.test(type)) {
                return false;
            }

            if (CONFIG.limitFps30) {
                const frameRateMatch = FRAME_RATE_REGEX.exec(type);
                if (frameRateMatch && parseInt(frameRateMatch[1], 10) > 30) {
                    return false;
                }
            }

            return originalIsTypeSupported(type);
        };
    }

    applyCodecRestrictions();

    // ============================================================================
    // CSS INJECTION
    // ============================================================================
    function injectAdvancedCSS() {
        const BASE_HIDE_SELECTORS = [
            'ytd-reel-shelf-renderer',
            'ytd-rich-shelf-renderer',
            'ytd-rich-section-renderer',
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
    // PAUSE ON LOAD
    // ============================================================================
    function pauseOnLoad() {
        if (!CONFIG.pauseOnLoad) return;

        let protectionActive = true;
        let userInteracted = false;
        let observer = null;
        let interval = null;
        let timeout = null;

        function disableProtection() {
            if (!protectionActive) return;
            protectionActive = false;
            userInteracted = true;
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            console.log('OYO: Защита отключена (пользователь взаимодействовал с плеером)');
        }

        function pauseIfAutoPlaying() {
            if (!protectionActive || userInteracted) return false;
            const video = document.querySelector('video');
            if (video && !video.paused) {
                video.pause();
                console.log('OYO: Автозапуск заблокирован');
                return true;
            }
            return false;
        }

        function setupClickListener() {
            document.addEventListener('click', function onClick(e) {
                const isPlayerClick = e.target.closest('.html5-video-player, .ytp-play-button, video, .ytp-player-content');
                if (isPlayerClick && protectionActive && !userInteracted) {
                    userInteracted = true;
                    disableProtection();
                }
            }, true);
        }

        pauseIfAutoPlaying();
        setupClickListener();

        observer = new MutationObserver(function() {
            pauseIfAutoPlaying();
        });
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }

        interval = setInterval(function() {
            if (!protectionActive || userInteracted) {
                clearInterval(interval);
                interval = null;
                return;
            }
            pauseIfAutoPlaying();
        }, 300);

        timeout = setTimeout(function() {
            if (protectionActive && !userInteracted) {
                console.log('OYO: Защита отключена по таймауту (15 сек)');
                disableProtection();
            }
        }, 15000);
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

        if (!window.__ytTimersCleanupAdded) {
            const cleanup = () => activeTasks.clear();
            window.addEventListener('beforeunload', cleanup);
            window.addEventListener('pagehide', cleanup);
            window.__ytTimersCleanupAdded = true;
        }

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
    let __qualityMenuObserver = null;

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

        const targetMinStr = CONFIG.minQuality;
        const targetMaxStr = CONFIG.maxQuality;
        const targetMin = qualityMap[targetMinStr];
        const targetMax = qualityMap[targetMaxStr];
        if (!targetMin || !targetMax) return;

        const qualityOrder = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
        const minIndex = qualityOrder.indexOf(targetMinStr);
        const maxIndex = qualityOrder.indexOf(targetMaxStr);

        function tryApplyRange() {
            const player = document.getElementById('movie_player') ||
                           document.querySelector('.html5-video-player');
            if (!player) return;
            try {
                if (typeof player.setPlaybackQualityRange === 'function') {
                    player.setPlaybackQualityRange(targetMin, targetMax);
                } else if (typeof player.setPlaybackQuality === 'function') {
                    player.setPlaybackQuality(targetMax); // fallback
                }
            } catch (e) {}
        }

        function blockOutOfRangeMenuItems() {
            const menu = document.querySelector('.ytp-quality-menu .ytp-panel-menu');
            if (!menu) return;

            const items = menu.querySelectorAll('.ytp-menuitem');
            items.forEach(item => {
                const labelElement = item.querySelector('.ytp-menuitem-label');
                if (!labelElement) return;
                const label = labelElement.textContent;
                const match = label.match(/(\d+p)/);
                if (!match) return;
                const q = match[1];
                const idx = qualityOrder.indexOf(q);
                if (idx === -1) return;

                if (idx < minIndex || idx > maxIndex) {
                    item.style.pointerEvents = 'none';
                    item.style.opacity = '0.4';
                    item.setAttribute('disabled', 'disabled');
                } else {
                    item.style.pointerEvents = 'auto';
                    item.style.opacity = '1';
                    item.removeAttribute('disabled');
                }
            });
        }

        tryApplyRange();

        __qualityMenuObserver = new MutationObserver(() => {
            blockOutOfRangeMenuItems();
        });
        if (document.body) {
            __qualityMenuObserver.observe(document.body, { childList: true, subtree: true });
        }

        document.addEventListener('yt-navigate-finish', () => {
            setTimeout(() => {
                tryApplyRange();
                blockOutOfRangeMenuItems();
            }, 1000);
        });

        document.addEventListener('yt-page-data-fetched', () => {
            setTimeout(blockOutOfRangeMenuItems, 500);
        });
    }

    // ============================================================================
    // PLAYER OPTIMIZER
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

            function disableAutoplayIfNeeded() {
                const btn = document.querySelector('.ytp-autonav-toggle-button');
                if (!btn) return;

                if (btn.getAttribute('aria-checked') === 'true') {
                    btn.click();
                }
            }

            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        disableAutoplayIfNeeded();
                    }
                    if (mutation.type === 'attributes' && mutation.attributeName === 'aria-checked') {
                        if (mutation.target.classList.contains('ytp-autonav-toggle-button')) {
                            disableAutoplayIfNeeded();
                        }
                    }
                }
            });

            function start() {
                disableAutoplayIfNeeded();
                if (document.body) {
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['aria-checked']
                    });
                }
            }

            start();

            document.addEventListener('yt-navigate-finish', () => {
                setTimeout(disableAutoplayIfNeeded, 300);
            });
        }

        // ------------------------------------------------------------------------
        // Video quality limiter
        // ------------------------------------------------------------------------
        if (CONFIG.limitVideoQuality) {
            setupQualityLimiter();
        }

        setupAutoplayDisabler();
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
            this.activeTab = CONFIG.language === 'ru' ? '⚡ Производительность' : '⚡ Performance';
            this.currentLanguage = CONFIG.language || 'ru';

            this.activeCategoryId = 'performance';

            this.initialConfig = null;
            this.workingConfig = null;
            this.hasChanges = false;
            this.searchInput = null;
            this.searchTerm = '';
            this.tabChangeMap = new Map();

            this.tooltip = null;
            this.tooltipTarget = null;

            this.searchActive = false;
            this.previousActiveTab = this.activeTab;
            this.parentChildMap = this.buildParentChildMap();

            this.handleEscapeKey = this.handleEscapeKey.bind(this);
            this.handleOverlayClick = this.handleOverlayClick.bind(this);

            this.initialize();
        }

        buildParentChildMap() {
            return {
                'limitVideoQuality': ['maxQuality', 'minQuality']
            };
        }

        getCategories() {
            const colorOptions = [
                { value: 'red', label: this.currentLanguage === 'ru' ? 'Красный' : 'Red' },
                { value: 'blue', label: this.currentLanguage === 'ru' ? 'Синий' : 'Blue' }
            ];

            const qualityOptions = [
                { value: '144p', label: '144p' },
                { value: '240p', label: '240p' },
                { value: '360p', label: '360p' },
                { value: '480p', label: '480p' },
                { value: '720p', label: '720p (HD)' },
                { value: '1080p', label: '1080p (Full HD)' },
                { value: '1440p', label: '1440p (2K)' },
                { value: '2160p', label: '2160p (4K)' }
            ];

            const categories = {
                en: {
                    '⚡ Performance': [
                        { key: 'disableAnimations', label: 'Disable animations', description: 'Removes all CSS animations and transitions' },
                        { key: 'throttleTimers', label: 'Optimize timers', description: 'Slows down background JavaScript timers' },
                        { key: 'lazyLoadImages', label: 'Lazy load images', description: 'Optimizes image loading performance' },
                        { key: 'memoryLeakFix', label: 'Memory leak fix', description: 'Fixes YouTube memory leaks' },
                        { key: 'optimizeThumbnails', label: 'Optimize thumbnails', description: 'Improves thumbnail loading' },
                        { key: 'blockNonH264', label: 'Block VP8/VP9/AV1 codecs', description: 'Force H.264 (reduces CPU load)' },
                        { key: 'limitFps30', label: 'Limit video to 30 FPS', description: 'Prevents high frame rate streams (reduces CPU load)' },
                    ],
                    '🎨 Appearance & Layout': [
                        { key: 'simplifyUI', label: 'Simplify interface', description: 'Minimalist YouTube experience' },
                        { key: 'disableBlurEffects', label: 'Disable blur effects', description: 'Removes background blur' },
                        { key: 'disableShadows', label: 'Disable shadows', description: 'Removes shadow effects' },
                        { key: 'disableNotifications', label: 'Disable notifications', description: 'Hides notification badges' },
                    ],
                    '🚫 Content Blocking': [
                        { key: 'removeAds', label: 'Remove ads', description: 'Blocks advertisements' },
                        { key: 'removeShorts', label: 'Remove Shorts', description: 'Hides YouTube Shorts completely' },
                        { key: 'removeComments', label: 'Remove comments', description: 'Hides comment sections' },
                        { key: 'removeTrending', label: 'Remove trending', description: 'Hides trending section' },
                        { key: 'removeLiveChat', label: 'Remove live chat', description: 'Hides live chat on streams' },
                        { key: 'removePromo', label: 'Remove promotions', description: 'Hides youtube promotions' },
                    ],
                    '🎬 Player': [
                        { key: 'disableAutoplay', label: 'Disable autoplay', description: 'Prevents automatic video playback' },
                        { key: 'pauseOnLoad', label: 'Pause video on page load', description: 'Automatically pauses video when you open a video page (until first click on player)' },
                        { key: 'limitVideoQuality', label: 'Limit video quality', description: 'Sets maximum and minimum video quality' },
                        {
                            type: 'select',
                            key: 'maxQuality',
                            label: 'Maximum quality',
                            options: qualityOptions,
                            disabled: !CONFIG.limitVideoQuality
                        },
                        {
                            type: 'select',
                            key: 'minQuality',
                            label: 'Minimum quality',
                            options: qualityOptions,
                            disabled: !CONFIG.limitVideoQuality
                        },
                        { key: 'disablePlayerGradients', label: 'Disable player gradients', description: 'Removes top/bottom gradients' },
                        { key: 'disablePlayerWatermarkAndAnnotations', label: 'Disable watermark and annotations', description: 'Hides YouTube watermark and annotations' },
                        { key: 'removeInfoAndPlayerCards', label: 'Remove info and player cards', description: 'Removes video info and player cards' },
                        { key: 'removeEndScreen', label: 'Remove end screen', description: 'Hides end screen recommendations' },
                    ],
                    '⚙️ OYO Settings': [
                        { key: 'showSettingsButton', label: 'Show settings button', description: 'Displays floating settings button' },
                        {
                            type: 'select',
                            key: 'accentColor',
                            label: 'Interface color',
                            options: colorOptions,
                        },
                    ],
                },
                ru: {
                    '⚡ Производительность': [
                        { key: 'disableAnimations', label: 'Отключить анимации', description: 'Убирает все CSS-анимации и переходы' },
                        { key: 'throttleTimers', label: 'Оптимизировать таймеры', description: 'Замедляет фоновые таймеры JavaScript' },
                        { key: 'lazyLoadImages', label: 'Ленивая загрузка изображений', description: 'Оптимизирует загрузку картинок' },
                        { key: 'memoryLeakFix', label: 'Исправление утечек памяти', description: 'Устраняет утечки памяти на YouTube' },
                        { key: 'optimizeThumbnails', label: 'Оптимизация миниатюр', description: 'Улучшает загрузку превью' },
                        { key: 'blockNonH264', label: 'Блокировать кодеки VP8/VP9/AV1', description: 'Принудительно H.264 (снижает нагрузку на процессор)' },
                        { key: 'limitFps30', label: 'Ограничить видео до 30 FPS', description: 'Запрещает потоки с высокой частотой кадров (снижает нагрузку на процессор)' },
                    ],
                    '🎨 Внешний вид и макет': [
                        { key: 'simplifyUI', label: 'Упростить интерфейс', description: 'Минималистичный YouTube' },
                        { key: 'disableBlurEffects', label: 'Отключить эффекты размытия', description: 'Убирает фоновое размытие' },
                        { key: 'disableShadows', label: 'Отключить тени', description: 'Убирает эффекты теней' },
                        { key: 'disableNotifications', label: 'Отключить уведомления', description: 'Скрывает значки уведомлений' },
                    ],
                    '🚫 Блокировка контента': [
                        { key: 'removeAds', label: 'Убрать рекламу', description: 'Блокирует рекламные блоки' },
                        { key: 'removeShorts', label: 'Убрать Shorts', description: 'Полностью скрывает YouTube Shorts' },
                        { key: 'removeComments', label: 'Убрать комментарии', description: 'Скрывает раздел комментариев' },
                        { key: 'removeTrending', label: 'Убрать тренды', description: 'Скрывает раздел "В тренде"' },
                        { key: 'removeLiveChat', label: 'Убрать прямой эфир', description: 'Скрывает чат на стримах' },
                        { key: 'removePromo', label: 'Убрать промо', description: 'Скрывает промо-блоки YouTube' },
                    ],
                    '🎬 Плеер': [
                        { key: 'disableAutoplay', label: 'Отключить автовоспроизведение', description: 'Предотвращает автоматическое воспроизведение следующего видео' },
                        { key: 'pauseOnLoad', label: 'Пауза при загрузке видео', description: 'Автоматически ставит видео на паузу при открытии страницы (до первого клика по плееру)' },
                        { key: 'limitVideoQuality', label: 'Ограничить качество видео', description: 'Устанавливает максимальное и минимальное качество видео' },
                        {
                            type: 'select',
                            key: 'maxQuality',
                            label: 'Максимальное качество',
                            options: qualityOptions,
                            disabled: !CONFIG.limitVideoQuality
                        },
                        {
                            type: 'select',
                            key: 'minQuality',
                            label: 'Минимальное качество',
                            options: qualityOptions,
                            disabled: !CONFIG.limitVideoQuality
                        },
                        { key: 'disablePlayerGradients', label: 'Отключить градиенты плеера', description: 'Убирает верхние/нижние градиенты' },
                        { key: 'disablePlayerWatermarkAndAnnotations', label: 'Отключить водяной знак и аннотации', description: 'Скрывает водяной знак YouTube и аннотации' },
                        { key: 'removeInfoAndPlayerCards', label: 'Убрать карточки информации', description: 'Удаляет информационные карточки в плеере' },
                        { key: 'removeEndScreen', label: 'Убрать конечный экран', description: 'Скрывает рекомендации в конце видео' },
                    ],
                    '⚙️ Настройки OYO': [
                        { key: 'showSettingsButton', label: 'Показать кнопку настроек', description: 'Отображает плавающую кнопку настроек' },
                        {
                            type: 'select',
                            key: 'accentColor',
                            label: 'Цвет интерфейса',
                            options: colorOptions,
                        },
                    ],
                }
            };
            return categories[this.currentLanguage] || categories.ru;
        }

        getAllSettings() {
            const categories = this.getCategories();
            const all = [];
            for (const cat in categories) {
                all.push(...categories[cat]);
            }
            return all;
        }

        filterSettingsWithChildren(settings, term) {
            if (!term) return [];
            const lowerTerm = term.toLowerCase();
            const matchedKeys = new Set();
            const parentChild = this.parentChildMap;
            const allSettings = this.getAllSettings();
            const keyToSetting = {};
            allSettings.forEach(s => { if (s.key) keyToSetting[s.key] = s; });

            allSettings.forEach(s => {
                if (!s.key) return;
                const label = s.label.toLowerCase();
                const desc = (s.description || '').toLowerCase();
                if (label.includes(lowerTerm) || desc.includes(lowerTerm)) {
                    matchedKeys.add(s.key);
                    if (parentChild[s.key]) {
                        parentChild[s.key].forEach(childKey => matchedKeys.add(childKey));
                    }
                }
            });

            const result = [];
            matchedKeys.forEach(key => {
                const setting = keyToSetting[key];
                if (setting) result.push(setting);
            });
            return result;
        }

        updateWarningIcon(container, key) {
            if (!container) return;
            const warningSpan = container.querySelector('.ytoo-warning');
            if (!warningSpan) return;

            const isChanged = this.initialConfig && (this.workingConfig[key] !== this.initialConfig[key]);

            if (isChanged) {
                warningSpan.style.display = 'inline-block';
            } else {
                warningSpan.style.display = 'none';
            }
        }

        injectStyles() {
            const root = document.documentElement;
            if (!root.style.getPropertyValue('--ytoo-primary')) {
                this.updateCSSVariables(CONFIG.accentColor);
            }

            const styles = `
            .ytoo-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9998;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .ytoo-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #0f0f0f;
                color: white;
                border-radius: 12px;
                padding: 12px;
                width: 90%;
                max-width: 500px;
                height: 545px;
                max-height: 545px;
                overflow: hidden;
                z-index: 9999;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                opacity: 0;
                transition: opacity 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
            }

            .ytoo-modal-content {
                height: 100%;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .ytoo-header {
                margin-bottom: 10px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .ytoo-title-container {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-grow: 1;
            }

            .ytoo-title {
                margin: 0;
                color: #fff;
                font-size: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ytoo-title-icon {
                background: linear-gradient(135deg, var(--ytoo-gradient-start), var(--ytoo-gradient-end));
                width: 28px;
                height: 28px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                line-height: 1;
            }

            .ytoo-version {
                margin: 0;
                color: #aaa;
                font-size: 12px;
            }

            .ytoo-header-buttons {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ytoo-lang-switch {
                background: #2a2a2a;
                border: 1px solid #444;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
                height: 24px;
                box-sizing: border-box;
            }

            .ytoo-lang-switch:hover {
                background: #3a3a3a;
            }

            .ytoo-close-btn {
                background: none;
                border: none;
                color: #aaa;
                font-size: 24px;
                line-height: 1;
                cursor: pointer;
                padding: 0 4px;
                transition: color 0.2s;
            }

            .ytoo-close-btn:hover {
                color: #fff;
            }

            .ytoo-search-box {
                margin-bottom: 8px;
                padding: 0px;
                flex-shrink: 0;
            }

            .ytoo-search-box input {
                width: 100%;
                padding: 4px 8px;
                background: #2a2a2a;
                border: 1px solid #444;
                color: white;
                border-radius: 4px;
                font-size: 12px;
                outline: none;
                transition: border-color 0.2s;
                box-sizing: border-box;
            }
            .ytoo-search-box input:focus {
                border-color: var(--ytoo-primary);
            }

            .ytoo-tabs-container {
                margin-bottom: 8px;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                overflow: hidden;
            }

            .ytoo-tabs-header {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 8px;
                gap: 4px;
                padding-bottom: 5px;
                flex-shrink: 0;
            }

            .ytoo-tab-button {
                padding: 5px 10px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s ease, border-color 0.2s ease;
                flex: 0 1 auto;
                white-space: nowrap;
                position: relative;
            }

            .ytoo-tab-button:hover {
                background: rgba(255,255,255,0.1);
            }

            .ytoo-tab-button.active {
                background: rgba(var(--ytoo-accent-rgb), 0.2);
                border: 1px solid rgba(var(--ytoo-accent-rgb), 0.3);
            }

            .ytoo-tab-indicator {
                position: absolute;
                top: 2px;
                right: 2px;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #FFD700;
                display: none;
            }
            .ytoo-tab-button.has-changes .ytoo-tab-indicator {
                display: block;
            }

            .ytoo-tab-content {
                background: #1a1a1a;
                border-radius: 8px;
                padding: 10px;
                flex-grow: 1;
                overflow-y: auto;
                min-height: 0;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .ytoo-setting-container {
                margin-bottom: 0;
                padding: 8px;
                background: #2a2a2a;
                border-radius: 8px;
                border-left: 3px solid var(--ytoo-primary);
                border: 1px solid #3a3a3a;
                transition: background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
                display: flex;
                align-items: center;
                position: relative;
            }

            .ytoo-setting-container:hover {
                background: #333;
            }

            .ytoo-setting-container.disabled {
                opacity: 0.5;
                border-left-color: #666;
            }

            .ytoo-setting-container.checked {
                border-left-color: var(--ytoo-primary);
            }

            .ytoo-setting-row {
                display: flex;
                align-items: center;
                flex: 1;
                width: 100%;
            }

            .ytoo-checkbox-container {
                flex-shrink: 0;
                margin-right: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 0;
                width: 16px;
                height: 16px;
            }

            .ytoo-checkbox {
                width: 16px !important;
                height: 16px !important;
                margin: 0 !important;
                cursor: pointer;
                accent-color: var(--ytoo-primary);
                flex-shrink: 0;
                box-sizing: border-box;
            }

            .ytoo-content-container {
                flex-grow: 1;
            }

            .ytoo-setting-label {
                display: block;
                font-weight: 600;
                color: #fff;
                margin-bottom: 3px;
                cursor: pointer;
                font-size: 13px;
            }

            .ytoo-setting-description {
                font-size: 12px;
                color: #aaa;
                line-height: 1.3;
                font-weight: 400;
            }

            .ytoo-warning {
                display: none;
                margin-left: 8px;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: #FFD700;
                color: #000;
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                line-height: 18px;
                cursor: help;
                flex-shrink: 0;
            }

            .ytoo-status-container {
                flex-shrink: 0;
                margin-left: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 0;
            }

            .ytoo-status-dot {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #666;
                margin-right: 5px;
                flex-shrink: 0;
            }

            .ytoo-status-dot.checked {
                background: var(--ytoo-primary);
            }

            .ytoo-status-text {
                font-size: 10px;
                color: #666;
                font-weight: 600;
                line-height: 1;
            }

            .ytoo-status-text.checked {
                color: var(--ytoo-primary);
            }

            .ytoo-select {
                width: 100%;
                padding: 6px 10px;
                background: #1a1a1a;
                color: white;
                border: 1px solid #444;
                border-radius: 6px;
                font-size: 12px;
                outline: none;
                transition: border-color 0.2s;
                cursor: pointer;
                line-height: 1.2;
                display: flex;
                align-items: center;
            }

            .ytoo-select:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .ytoo-actions {
                display: flex;
                gap: 8px;
                margin-top: 0;
                padding: 8px 10px;
                flex-shrink: 0;
            }

            .ytoo-apply-btn {
                flex: 1;
                padding: 8px 12px;
                background: linear-gradient(135deg, var(--ytoo-gradient-start), var(--ytoo-gradient-end));
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                min-height: 36px;
            }

            .ytoo-apply-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 10px rgba(var(--ytoo-accent-rgb), 0.3);
            }

            .ytoo-apply-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }

            .ytoo-reset-btn {
                padding: 8px 12px;
                background: #333;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: background 0.2s;
                font-weight: 500;
                min-height: 36px;
            }

            .ytoo-reset-btn:hover {
                background: #444;
            }

            .ytoo-notification {
                position: fixed;
                top: 10px;
                right: 10px;
                background: var(--ytoo-primary);
                color: white;
                padding: 10px 16px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10001;
                font-size: 12px;
                font-weight: 500;
                transform: translateX(120%);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .ytoo-notification.error {
                background: #f44336;
            }

            .ytoo-settings-button {
                position: fixed;
                bottom: 15px;
                right: 15px;
                z-index: 10000;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--ytoo-gradient-start), var(--ytoo-gradient-end));
                color: white;
                border: 2px solid white;
                font-size: 20px;
                cursor: pointer;
                transition: transform 0.3s, box-shadow 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
                overflow: hidden;
                line-height: 1;
            }

            .ytoo-settings-button .tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                z-index: 10001;
                margin-bottom: 8px;
            }

            .ytoo-settings-button:hover .tooltip {
                opacity: 1;
            }

            .ytoo-settings-button:hover {
                transform: scale(1.1) rotate(10deg);
            }

            .ytoo-settings-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }

            .ytoo-custom-tooltip {
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                white-space: nowrap;
                z-index: 100000;
                pointer-events: none;
                transform: translate(-50%, -100%);
                margin-top: -5px;
            }

            .ytoo-tab-content::-webkit-scrollbar {
                width: 6px;
            }

            .ytoo-tab-content::-webkit-scrollbar-track {
                background: #1a1a1a;
                border-radius: 3px;
            }

            .ytoo-tab-content::-webkit-scrollbar-thumb {
                background: #444;
                border-radius: 3px;
            }

            .ytoo-tab-content::-webkit-scrollbar-thumb:hover {
                background: #555;
            }
        `;

            const style = document.getElementById('ytoo-styles');
            if (style) {
                style.textContent = styles;
            } else {
                const newStyle = document.createElement('style');
                newStyle.id = 'ytoo-styles';
                newStyle.textContent = styles;
                document.head.appendChild(newStyle);
            }
        }

        updateCSSVariables(color) {
            const root = document.documentElement;
            if (color === 'red') {
                root.style.setProperty('--ytoo-primary', '#FF0000');
                root.style.setProperty('--ytoo-gradient-start', '#FF0000');
                root.style.setProperty('--ytoo-gradient-end', '#CC0000');
                root.style.setProperty('--ytoo-accent-rgb', '255, 0, 0');
            } else {
                root.style.setProperty('--ytoo-primary', '#007BA7');
                root.style.setProperty('--ytoo-gradient-start', '#007BA7');
                root.style.setProperty('--ytoo-gradient-end', '#005A7A');
                root.style.setProperty('--ytoo-accent-rgb', '0, 123, 167');
            }
        }

        updateTabIndicators() {
            if (!this.modal) return;
            const categories = this.getCategories();
            const categoryNames = Object.keys(categories);
            const tabButtons = this.modal.querySelectorAll('.ytoo-tab-button');

            const keysPerTab = {};
            categoryNames.forEach(cat => {
                keysPerTab[cat] = categories[cat].map(s => s.key).filter(k => k !== 'language');
            });

            tabButtons.forEach(btn => {
                const cat = btn.dataset.category;
                if (!cat) return;
                const keys = keysPerTab[cat] || [];
                let hasChangesInTab = false;
                for (const key of keys) {
                    if (this.workingConfig[key] !== this.initialConfig?.[key]) {
                        hasChangesInTab = true;
                        break;
                    }
                }
                if (hasChangesInTab) {
                    btn.classList.add('has-changes');
                    if (!btn.querySelector('.ytoo-tab-indicator')) {
                        const indicator = document.createElement('span');
                        indicator.className = 'ytoo-tab-indicator';
                        btn.appendChild(indicator);
                    }
                } else {
                    btn.classList.remove('has-changes');
                    const ind = btn.querySelector('.ytoo-tab-indicator');
                    if (ind) ind.remove();
                }
            });
        }

        filterSettings(settings) {
            if (!this.searchTerm) return settings;
            const term = this.searchTerm.toLowerCase();
            return settings.filter(setting => {
                if (setting.type === 'select') {
                    return setting.label.toLowerCase().includes(term) ||
                           (setting.description && setting.description.toLowerCase().includes(term));
                } else {
                    return setting.label.toLowerCase().includes(term) ||
                           (setting.description && setting.description.toLowerCase().includes(term));
                }
            });
        }

        updateTabContent(container, categoryName) {
            if (this.searchActive && this.searchTerm.trim() !== '') {
                const matched = this.filterSettingsWithChildren(this.getAllSettings(), this.searchTerm);
                const fragment = document.createDocumentFragment();

                if (matched.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.className = 'ytoo-setting-container';
                    noResults.style.textAlign = 'center';
                    noResults.style.padding = '20px';
                    noResults.textContent = this.currentLanguage === 'ru' ? 'Ничего не найдено' : 'No results found';
                    fragment.appendChild(noResults);
                } else {
                    matched.forEach(setting => {
                        const element = this.createSettingElement(setting);
                        fragment.appendChild(element);
                    });
                }

                container.innerHTML = '';
                container.appendChild(fragment);
            } else {
                const categories = this.getCategories();
                let settings = categories[categoryName] || [];
                settings = this.filterSettings(settings);

                const fragment = document.createDocumentFragment();

                if (settings.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.className = 'ytoo-setting-container';
                    noResults.style.textAlign = 'center';
                    noResults.style.padding = '20px';
                    noResults.textContent = this.currentLanguage === 'ru' ? 'Ничего не найдено' : 'No results found';
                    fragment.appendChild(noResults);
                } else {
                    settings.forEach(setting => {
                        const element = this.createSettingElement(setting);
                        fragment.appendChild(element);
                    });
                }

                container.innerHTML = '';
                container.appendChild(fragment);
            }

            this.updateAllWarnings();
            this.updateTabIndicators();
            this.attachTooltipHandlers();
        }

        showTooltip(text, x, y, target) {
            if (this.tooltip) this.hideTooltip();
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'ytoo-custom-tooltip';
            this.tooltip.textContent = text;
            this.tooltip.style.left = x + 'px';
            this.tooltip.style.top = y + 'px';
            this.tooltipTarget = target || null;
            document.body.appendChild(this.tooltip);
        }

        hideTooltip() {
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
                this.tooltipTarget = null;
            }
        }

        attachTooltipHandlers() {
            const warnings = this.modal.querySelectorAll('.ytoo-warning');
            warnings.forEach(warning => {
                warning.addEventListener('mouseenter', (e) => {
                    const rect = warning.getBoundingClientRect();
                    const tooltipText = this.currentLanguage === 'ru'
                        ? 'Есть не сохраненные изменения'
                        : 'There are unsaved changes';
                    this.showTooltip(tooltipText, rect.left + rect.width / 2, rect.top, e.target);
                });
                warning.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
            });

            const langBtn = this.modal.querySelector('.ytoo-lang-switch');
            if (langBtn) {
                langBtn.addEventListener('mouseenter', (e) => {
                    const rect = langBtn.getBoundingClientRect();
                    const tooltipText = this.currentLanguage === 'ru'
                        ? 'Switch to English'
                        : 'Сменить на Русский';
                    this.showTooltip(tooltipText, rect.left + rect.width / 2, rect.top, e.target);
                });
                langBtn.addEventListener('mouseleave', () => {
                    this.hideTooltip();
                });
            }
        }

        close() {
            if (this.hasUnsavedChanges()) {
                this.updateCSSVariables(this.initialConfig.accentColor);
            }

            if (!this.isOpen) return;
            this.hideTooltip();
            this.modal.style.opacity = '0';
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
                this.searchTerm = '';

                this.removeGlobalEventListeners();
            }, 300);
        }

        hasUnsavedChanges() {
            if (!this.initialConfig) return false;
            for (const key in DEFAULT_CONFIG) {
                if (key === 'language') continue;
                if (this.workingConfig[key] !== this.initialConfig[key]) {
                    return true;
                }
            }
            return false;
        }

        closeWithCheck() {
            if (this.hasUnsavedChanges()) {
                const msg = this.currentLanguage === 'ru'
                    ? 'У вас есть несохранённые изменения. Применить сейчас?'
                    : 'You have unsaved changes. Apply now?';
                if (confirm(msg)) {
                    const applyBtn = this.modal.querySelector('#yt-optimizer-apply');
                    if (applyBtn) this.handleApplyClick(applyBtn);
                } else {
                    this.close();
                }
            } else {
                this.close();
            }
        }

        handleEscapeKey(e) {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeWithCheck();
            }
        }

        handleOverlayClick(e) {
            if (e.target === this.overlay && this.isOpen) {
                this.closeWithCheck();
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

            this.initialConfig = JSON.parse(JSON.stringify(CONFIG));
            this.workingConfig = JSON.parse(JSON.stringify(CONFIG));
            this.hasChanges = false;
            this.searchTerm = '';
            this.searchActive = false;

            this.createModal();

            const content = this.createModalContent();
            this.modal.appendChild(content);

            document.body.appendChild(this.overlay);
            document.body.appendChild(this.modal);

            requestAnimationFrame(() => {
                this.overlay.style.opacity = '1';
                this.modal.style.opacity = '1';
            });

            this.isOpen = true;

            this.addGlobalEventListeners();

            this.setupEventDelegation();

            const searchInput = this.modal.querySelector('.ytoo-search-box input');
            if (searchInput) {
                this.searchInput = searchInput;

                searchInput.addEventListener('input', (e) => {
                    const newTerm = e.target.value;
                    this.searchTerm = newTerm;
                    if (newTerm.trim() !== '') {
                        this.searchActive = true;
                    } else {
                        this.searchActive = false;
                    }
                    const tabContent = this.modal.querySelector('.ytoo-tab-content');
                    if (tabContent) {
                        this.updateTabContent(tabContent, this.activeTab);
                    }
                });

            }

            setTimeout(() => {
                this.updateAllWarnings();
                this.attachTooltipHandlers();
            }, 0);
        }

        updateAllWarnings() {
            if (!this.modal) return;
            const containers = this.modal.querySelectorAll('.ytoo-setting-container');
            containers.forEach(container => {
                const checkbox = container.querySelector('.ytoo-checkbox');
                if (checkbox) {
                    const key = checkbox.id.replace('setting-', '');
                    this.updateWarningIcon(container, key);
                } else {
                    const select = container.querySelector('.ytoo-select');
                    if (select) {
                        const key = select.id.replace('setting-', '');
                        this.updateWarningIcon(container, key);
                    }
                }
            });
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

                if (e.target.closest('.ytoo-close-btn')) {
                    e.preventDefault();
                    this.closeWithCheck();
                    return;
                }

                if (e.target.closest('.ytoo-lang-switch')) {
                    e.preventDefault();
                    this.toggleLanguage();
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

        toggleLanguage() {
            const currentActiveId = this.activeCategoryId;

            this.currentLanguage = this.currentLanguage === 'ru' ? 'en' : 'ru';
            this.workingConfig.language = this.currentLanguage;

            const categories = this.getCategories();
            const categoryNames = Object.keys(categories);
            const categoryIds = ['performance', 'appearance', 'blocking', 'player', 'settings'];

            const tabsHeader = this.modal.querySelector('.ytoo-tabs-header');
            if (tabsHeader) {
                tabsHeader.innerHTML = '';

                categoryNames.forEach((cat, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'ytoo-tab-button';
                    btn.textContent = cat;
                    btn.dataset.category = cat;
                    btn.dataset.categoryId = categoryIds[index];
                    tabsHeader.appendChild(btn);
                });

                let activeButton = null;
                tabsHeader.querySelectorAll('.ytoo-tab-button').forEach(btn => {
                    if (btn.dataset.categoryId === currentActiveId) {
                        activeButton = btn;
                    }
                });

                if (activeButton) {
                    activeButton.classList.add('active');
                    this.activeTab = activeButton.textContent;
                    this.activeCategoryId = currentActiveId;
                } else {
                    const firstBtn = tabsHeader.querySelector('.ytoo-tab-button');
                    if (firstBtn) {
                        firstBtn.classList.add('active');
                        this.activeTab = firstBtn.textContent;
                        this.activeCategoryId = firstBtn.dataset.categoryId;
                    }
                }
            }

            const tabContent = this.modal.querySelector('.ytoo-tab-content');
            if (tabContent) {
                this.updateTabContent(tabContent, this.activeTab);
            }

            const langBtn = this.modal.querySelector('.ytoo-lang-switch');
            if (langBtn) {
                langBtn.textContent = this.currentLanguage === 'ru' ? 'RU' : 'EN';
            }

            const versionEl = this.modal.querySelector('.ytoo-version');
            if (versionEl) {
                versionEl.textContent = this.currentLanguage === 'ru' ? 'Версия 3.0 (RU/EN)' : 'Version 3.0 (RU/EN)';
            }

            const applyBtn = this.modal.querySelector('#yt-optimizer-apply');
            const resetBtn = this.modal.querySelector('#yt-optimizer-reset');
            if (applyBtn) {
                applyBtn.innerHTML = this.currentLanguage === 'ru'
                    ? '<span>✓</span><span>Применить и перезагрузить</span>'
                    : '<span>✓</span><span>Apply and Reload</span>';
            }
            if (resetBtn) {
                resetBtn.textContent = this.currentLanguage === 'ru' ? 'Сбросить' : 'Reset';
            }

            if (this.tooltip && this.tooltipTarget && document.body.contains(this.tooltipTarget)) {
                let newText = '';
                if (this.tooltipTarget.classList.contains('ytoo-lang-switch')) {
                    newText = this.currentLanguage === 'ru' ? 'Switch to English' : 'Сменить на Русский';
                } else if (this.tooltipTarget.classList.contains('ytoo-warning')) {
                    newText = this.currentLanguage === 'ru' ? 'Есть не сохраненные изменения' : 'There are unsaved changes';
                }
                if (newText) {
                    this.tooltip.textContent = newText;
                }
            }
        }

        handleTabClick(tabButton) {
            if (tabButton.classList.contains('active')) return;

            this.searchActive = false;
            this.searchTerm = '';
            if (this.searchInput) {
                this.searchInput.value = '';
            }

            const tabs = this.modal.querySelectorAll('.ytoo-tab-button');
            tabs.forEach(tab => tab.classList.remove('active'));
            tabButton.classList.add('active');

            this.activeTab = tabButton.textContent;
            this.activeCategoryId = tabButton.dataset.categoryId;

            const tabContent = this.modal.querySelector('.ytoo-tab-content');
            if (tabContent) {
                this.updateTabContent(tabContent, this.activeTab);
            }
        }

        handleCheckboxChange(checkbox) {
            const key = checkbox.id.replace('setting-', '');
            this.workingConfig[key] = checkbox.checked;

            if (key === 'limitVideoQuality') {
                const maxSelect = this.modal.querySelector('#setting-maxQuality');
                const minSelect = this.modal.querySelector('#setting-minQuality');
                if (maxSelect) {
                    maxSelect.disabled = !checkbox.checked;
                    const container = maxSelect.closest('.ytoo-setting-container');
                    if (container) container.classList.toggle('disabled', !checkbox.checked);
                }
                if (minSelect) {
                    minSelect.disabled = !checkbox.checked;
                    const container = minSelect.closest('.ytoo-setting-container');
                    if (container) container.classList.toggle('disabled', !checkbox.checked);
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
                        statusText.textContent = this.currentLanguage === 'ru' ? 'ВКЛ' : 'ON';
                    }
                } else {
                    container.classList.remove('checked');
                    if (statusDot) statusDot.classList.remove('checked');
                    if (statusText) {
                        statusText.classList.remove('checked');
                        statusText.textContent = this.currentLanguage === 'ru' ? 'ВЫКЛ' : 'OFF';
                    }
                }
            }

            this.hasChanges = true;
            this.updateTabIndicators();
            const container2 = checkbox.closest('.ytoo-setting-container');
            if (container2) {
                this.updateWarningIcon(container2, key);
            }
        }

        handleSelectChange(select) {
            const key = select.id.replace('setting-', '');
            this.workingConfig[key] = select.value;

            if (key === 'maxQuality' || key === 'minQuality') {
                const maxVal = key === 'maxQuality' ? select.value : this.workingConfig.maxQuality;
                const minVal = key === 'minQuality' ? select.value : this.workingConfig.minQuality;

                const qualityOrder = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
                const maxIndex = qualityOrder.indexOf(maxVal);
                const minIndex = qualityOrder.indexOf(minVal);

                if (minIndex > maxIndex) {
                    if (key === 'minQuality') {
                        this.workingConfig.minQuality = maxVal;
                        const minSelect = this.modal.querySelector('#setting-minQuality');
                        if (minSelect) minSelect.value = maxVal;
                    } else if (key === 'maxQuality') {
                        this.workingConfig.maxQuality = minVal;
                        const maxSelect = this.modal.querySelector('#setting-maxQuality');
                        if (maxSelect) maxSelect.value = minVal;
                    }
                }
            }

            if (key === 'accentColor') {
                this.updateCSSVariables(select.value);
            }

            this.hasChanges = true;
            this.updateTabIndicators();
            const container = select.closest('.ytoo-setting-container');
            if (container) {
                this.updateWarningIcon(container, key);
            }
        }

        handleApplyClick(button) {
            if (this.applyTimeout) return;

            this.animateApplyButton(button);

            Object.assign(CONFIG, this.workingConfig);
            const success = saveConfig(CONFIG);

            if (success) {
                const msg = this.currentLanguage === 'ru'
                    ? 'Настройки сохранены! Перезагрузка...'
                    : 'Settings saved! Reloading...';
                this.showNotification(msg, 'success');
                this.applyTimeout = setTimeout(() => {
                    location.reload();
                }, 1500);
                this.hasChanges = false;
                this.initialConfig = JSON.parse(JSON.stringify(CONFIG));
                this.updateTabIndicators();
            } else {
                const msg = this.currentLanguage === 'ru' ? 'Ошибка сохранения!' : 'Save failed!';
                this.showNotification(msg, 'error');
            }
        }

        handleResetClick() {
            const currentAccent = this.workingConfig.accentColor;
            const confirmMsg = this.currentLanguage === 'ru'
                ? 'Сбросить все настройки на значения по умолчанию? Цвет интерфейса останется текущим. Страница будет перезагружена.'
                : 'Reset all settings to defaults? Interface color will remain as is. Page will reload.';
            if (confirm(confirmMsg)) {
                this.workingConfig = { ...DEFAULT_CONFIG };
                this.workingConfig.accentColor = currentAccent;
                this.workingConfig.language = this.currentLanguage;
                Object.assign(CONFIG, this.workingConfig);
                saveConfig(CONFIG);
                setTimeout(() => location.reload(), 500);
            }
        }

        animateApplyButton(button) {
            const originalContent = button.innerHTML;
            const originalBackground = button.style.background;

            const gradientStart = getComputedStyle(document.documentElement).getPropertyValue('--ytoo-gradient-start').trim() || '#007BA7';
            const gradientEnd = getComputedStyle(document.documentElement).getPropertyValue('--ytoo-gradient-end').trim() || '#005A7A';

            button.disabled = true;
            button.style.transform = 'scale(0.95)';
            button.style.background = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
            button.innerHTML = this.currentLanguage === 'ru'
                ? '<span>✓</span><span>Сохраняем...</span>'
                : '<span>✓</span><span>Saving...</span>';

            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.style.background = `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`;
                button.innerHTML = this.currentLanguage === 'ru'
                    ? '<span>✓</span><span>Сохранено!</span>'
                    : '<span>✓</span><span>Saved!</span>';

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
            }, 2000);
        }

        initialize() {
            this.injectStyles();
            CONFIG = loadConfig();
            this.updateCSSVariables(CONFIG.accentColor);

            if (CONFIG.showSettingsButton) {
                this.createSettingsButton();
            }

            try {
                const menuText = this.currentLanguage === 'ru'
                    ? '⚙ Открыть настройки OYO'
                    : '⚙ Open OYO Settings';
                GM_registerMenuCommand(menuText, () => this.open());
            } catch (e) {}

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
            const tooltipText = this.currentLanguage === 'ru' ? 'Открыть настройки OYO' : 'Open OYO Settings';
            this.settingsButton.innerHTML = `<span class="ytoo-settings-icon">⚡</span><span class="tooltip">${tooltipText}</span>`;
            this.settingsButton.setAttribute('aria-label', tooltipText);
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

            const searchBox = document.createElement('div');
            searchBox.className = 'ytoo-search-box';
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = this.currentLanguage === 'ru' ? 'Поиск...' : 'Search...';
            searchBox.appendChild(searchInput);
            container.appendChild(searchBox);

            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'ytoo-tabs-container';

            const tabsHeader = document.createElement('div');
            tabsHeader.className = 'ytoo-tabs-header';

            const categories = this.getCategories();
            const categoryNames = Object.keys(categories);
            const categoryIds = ['performance', 'appearance', 'blocking', 'player', 'settings'];

            categoryNames.forEach((cat, index) => {
                const btn = document.createElement('button');
                btn.className = `ytoo-tab-button ${cat === this.activeTab ? 'active' : ''}`;
                btn.textContent = cat;
                btn.dataset.category = cat;
                btn.dataset.categoryId = categoryIds[index];
                tabsHeader.appendChild(btn);
            });

            const tabsContent = document.createElement('div');
            tabsContent.className = 'ytoo-tab-content';

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

            const titleContainer = document.createElement('div');
            titleContainer.className = 'ytoo-title-container';

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
            version.textContent = this.currentLanguage === 'ru' ? 'Версия 3.0 (RU/EN)' : 'Version 3.0 (RU/EN)';

            titleContainer.appendChild(title);
            titleContainer.appendChild(version);

            const headerButtons = document.createElement('div');
            headerButtons.className = 'ytoo-header-buttons';

            const langSwitch = document.createElement('button');
            langSwitch.className = 'ytoo-lang-switch';
            langSwitch.textContent = this.currentLanguage === 'ru' ? 'RU' : 'EN';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'ytoo-close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.title = this.currentLanguage === 'ru' ? 'Закрыть' : 'Close';

            headerButtons.appendChild(langSwitch);
            headerButtons.appendChild(closeBtn);

            header.appendChild(titleContainer);
            header.appendChild(headerButtons);

            return header;
        }

        createActionButtons() {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'ytoo-actions';

            const applyBtn = document.createElement('button');
            applyBtn.id = 'yt-optimizer-apply';
            applyBtn.className = 'ytoo-apply-btn';
            applyBtn.setAttribute('type', 'button');
            applyBtn.innerHTML = this.currentLanguage === 'ru'
                ? '<span>✓</span><span>Применить и перезагрузить</span>'
                : '<span>✓</span><span>Apply and Reload</span>';

            const resetBtn = document.createElement('button');
            resetBtn.id = 'yt-optimizer-reset';
            resetBtn.className = 'ytoo-reset-btn';
            resetBtn.setAttribute('type', 'button');
            resetBtn.textContent = this.currentLanguage === 'ru' ? 'Сбросить' : 'Reset';

            actionsDiv.appendChild(applyBtn);
            actionsDiv.appendChild(resetBtn);

            return actionsDiv;
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
                    if (this.workingConfig[setting.key] === opt.value) {
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

                const warningSpan = document.createElement('span');
                warningSpan.className = 'ytoo-warning';
                warningSpan.textContent = '!';
                container.appendChild(warningSpan);
            } else {
                const isChecked = this.workingConfig[setting.key];
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
                statusText.textContent = this.currentLanguage === 'ru'
                    ? (isChecked ? 'ВКЛ' : 'ВЫКЛ')
                    : (isChecked ? 'ON' : 'OFF');

                statusContainer.appendChild(statusDot);
                statusContainer.appendChild(statusText);

                row.appendChild(checkboxContainer);
                row.appendChild(contentContainer);
                row.appendChild(statusContainer);

                container.appendChild(row);

                const warningSpan = document.createElement('span');
                warningSpan.className = 'ytoo-warning';
                warningSpan.textContent = '!';
                container.appendChild(warningSpan);
            }
            return container;
        }
    }

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
            { fn: cleanUrlParameters, name: 'URL Parameter Cleaner' },
            { fn: pauseOnLoad, name: 'Pause on Load' }
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
