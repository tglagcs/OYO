# ⚡ Performance

### disableAnimations:
🎬 Disables most UI animations and transitions across the YouTube interface  
⚡ Forces instant scrolling by removing `scroll-behavior: smooth`  
🧱 Injects a single persistent `<style>` block instead of patching elements one by one  
🛡️ Keeps the video player stable by explicitly restoring its default animation/transition behavior  
🖱️ Preserves minimal visual feedback on buttons (opacity only) for usability

🔧 How it works:
- Defines a CSS rule set that:
    - Globally disables `animation` and `transition` inside main YouTube app containers
    - Forces `scroll-behavior: auto` to remove smooth scrolling overhead
    - Excludes the video player and related elements to avoid playback glitches
    - Re-enables a tiny opacity transition for buttons to keep UI feeling responsive
- On init:
    - Creates (or reuses) a `<style>` tag with id `yt-optimizer-animations`
    - Injects the CSS only if it changed (avoids unnecessary DOM writes)
    
🚀 Result:
- Instant UI responses (no animation queues)
- Less layout/paint/composite work for the browser
- Smoother scrolling on heavy pages
- Fewer frame drops on low-end or overloaded systems
- Overall snappier and more predictable UI behavior

### throttleTimers:
⏱️ Intercepts `setTimeout` and `setInterval` to throttle overly frequent timers  
🧠 Enforces minimum delays for background/low-value tasks to reduce CPU wakeups  
🧹 Tracks active timers in a `Map` to allow clean cancellation and avoid leaks  
♻️ Preserves original behavior for short or non-standard calls  
🕵️ Masks the patch by keeping original `.toString()` outputs (anti-detection)

🔧 How it works:
- Saves original:
    - `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`
- Wraps timers with a scheduler that:
    - Ignores non-function callbacks or weird delays
    - Enforces minimum delays:
        - `setTimeout`: min ~200ms, hard min ~1000ms
        - `setInterval`: min ~1000ms, hard min ~2000ms
    - Tracks last execution time using `performance.now()`
    - Skips executions if called too early
- Stores each task in a `Map`:
    - Allows proper cancellation
    - Prevents zombie timers from running
- Replaces `clearTimeout / clearInterval`:
    - Marks tasks as cancelled
    - Removes them from the map
- Restores native-looking `.toString()` to avoid breaking sites that inspect functions

🚀 Result:
- Drastically fewer timer wakeups in background and idle states
- Lower CPU usage on heavy pages (like YouTube SPA)
- Less battery drain on laptops
- Fewer micro-stutters caused by timer spam
- More stable performance during scrolling and navigation

### lazyLoadImages:
🖼️ Replaces native image lazy-loading with a controlled IntersectionObserver-based loader  
👀 Watches images with `data-src` and loads them only when they approach the viewport  
🧠 Prevents duplicate observers using a per-image flag (`__ytOptimizerObserved`)  
♻️ Uses a single shared `IntersectionObserver` for all images to reduce overhead  
🧬 Uses `MutationObserver` to automatically catch images added dynamically (infinite scroll, SPA navigation)

🔧 How it works:
- Creates one `IntersectionObserver` with a preload margin (`rootMargin: 200px`)
- When an image becomes visible:
    - Moves `data-src` → `src`
    - Removes `data-src`
    - Stops observing that image
- On init:
    - Scans all existing `img[data-src]`
    - Starts observing them
- Then:
    - Watches DOM mutations
    - Automatically attaches observer to newly added images
    
🚀 Result:
- Images load only when actually needed
- Less network + decode work offscreen
- Faster initial page load
- Smoother scrolling on heavy pages (like YouTube feeds)
- Lower memory and CPU spikes during navigation and infinite scroll

### memoryLeakFix:
🔧 Intercepts the internal YouTube Polymer `usePatchedLifecycles` flag  
🧹 Disables lifecycles for a set of utility and “garbage” components  
♻️ Uses `WeakMap` to store per-element state without blocking garbage collection  
🖼️ Hooks into `yt-img-shadow` to override thumbnail handling  
⚡ Manually injects the best available thumbnail and bypasses native update logic

🔧 How it works:
- Overrides `Element.prototype.usePatchedLifecycles` with custom getter/setter
- Stores per-element control flags in a `WeakMap`
- For selected YouTube components:
    - Forces lifecycles off to prevent redundant updates and leaks
- For detached or invalid DOM nodes:
    - Automatically disables lifecycle handling
- For `yt-img-shadow` (when `optimizeThumbnails` is enabled):
    - Reads internal Polymer data
    - Picks the highest-resolution thumbnail
    - Schedules a microtask to force `img.src` to the optimal URL
    - Disables native lifecycle updates for that component
    
🚀 Result:
- Fewer memory leaks
- Fewer unnecessary component re-creations
- Less CPU work during scrolling and navigation
- More stable and predictable RAM consumption
- Smoother behavior on heavy YouTube pages

### optimizeThumbnails:
🖼️ Intercepts YouTube’s `yt-img-shadow` component responsible for thumbnail rendering  
🧠 Bypasses native Polymer update lifecycle for thumbnails to avoid redundant re-renders  
🎯 Selects the best available thumbnail (highest resolution) from the provided list  
⚡ Manually forces the `<img>` element to use the optimal URL  
🧹 Prevents repeated internal updates by disabling component lifecycle handling

🔧 How it works:
- Triggers only when:
    - The component is being enabled (`nv` is truthy)
    - `CONFIG.optimizeThumbnails` is turned on
- Accesses the internal Polymer instance (`insp(this)`)
- Reads available thumbnails from `__data.thumbnail.thumbnails`
- Picks the largest one via `getThumbnail()`
- If a valid URL is found:
    - Sets `control = true` → disables native lifecycle logic for this component
    - Schedules a microtask via `Promise.resolve().then(...)` to:
        - Re-check the thumbnail list (in case it updated)
        - Force `cnt.$.img.src` to the best URL
        
🚀 Result:
- Always displays the highest-quality available thumbnail
- Fewer internal Polymer updates and reflows
- Less CPU work caused by thumbnail churn during scrolling
- More stable memory usage for image components
- Faster and more predictable thumbnail loading behavior

# 🎨 Appearance & Layout

### simplifyUI:
🧹 Hides non-essential YouTube UI panels and visual clutter  
🧱 Removes sidebars, related videos, mini-guide, engagement panels, and promo blocks  
🎯 Focuses the layout on the video and core content  
🖌️ Applies small CSS tweaks to clean up spacing and borders  
🙈 Removes minor visual noise (placeholders, icons, region badges, etc.)

🔧 How it works:
- When `CONFIG.simplifyUI` is enabled:
    - Injects CSS rules that `display: none` a large set of UI elements, including:
        - Related videos and secondary columns
        - Mini-guide and header buttons
        - Engagement / chapters panels
        - Comment teaser and info card headers/actions
        - Voice search button, social links, country code, promo images
    - Applies additional style tweaks:
        - Removes top border from the description info cards section
        - Adjusts bottom padding for the watch metadata block
        - Hides search input placeholder text to reduce visual noise
- All changes are done via CSS rules, without touching YouTube’s JS logic

🚀 Result:
- Much cleaner and more focused watch page
- Fewer distractions around the video
- Less DOM complexity on screen
- Slightly less layout/paint work for the browser
- A more “minimal mode” YouTube experience

### disableBlurEffects:
🧊 Disables frosted-glass / blur effects across YouTube UI surfaces  
⚡ Replaces `backdrop-filter` with a solid background color  
🧱 Targets top bars, pivot bars, filter bars, and app background layers  
🖌️ Forces consistent flat backgrounds using YouTube’s base theme color  
🧠 Avoids expensive blur and backdrop compositing operations

🔧 How it works:
- When `CONFIG.disableBlurEffects` is enabled:
    - Injects CSS rules for elements using the `frosted-glass` style and main background layers
    - Overrides:
        - `backdrop-filter`
        - `-webkit-backdrop-filter`  
            → sets them to `none`
    - Replaces translucent/blurred backgrounds with:
        - `background: var(--yt-spec-base-background)`
- All changes are done purely via CSS, no JS hooks involved

🚀 Result:
- Less GPU and compositor workload
- Fewer expensive blur passes and repaints
- More stable frame times during scrolling and UI transitions
- Lower power usage on laptops and mobile devices
- Cleaner, flatter, and more predictable UI rendering

### disableShadows:
🌫️ Disables box-shadows and text-shadows across the YouTube UI  
⚡ Removes expensive shadow rendering from all elements inside `ytd-app`  
🧱 Forces a fully flat UI style via a single global CSS rule  
🧠 Reduces GPU/compositor and paint workload caused by shadow effects

🔧 How it works:
- When `CONFIG.disableShadows` is enabled:
    - Injects one global CSS rule:
        - `ytd-app * { box-shadow: none !important; text-shadow: none !important; }`
    - This overrides any existing shadow styles in the YouTube interface
- No DOM manipulation or JS hooks — pure CSS override

🚀 Result:
- Less GPU and paint overhead
- Fewer expensive visual effects per frame
- More stable FPS during scrolling and transitions
- Slightly lower power consumption
- Cleaner, flatter, and more performance-oriented UI look

### disableNotifications:
🔕 Hides the YouTube notifications button from the top bar  
🧹 Cleans notification counters from the browser tab title  
🧠 Prevents YouTube from injecting “(N)” unread counts into `document.title`  
🛡️ Hooks into `Document.prototype.title` while preserving native behavior  
⚡ Avoids repeated patching with a one-time guard flag

🔧 How it works:
- When `CONFIG.disableNotifications` is enabled:
    - Injects CSS to hide:
        - `ytd-notification-topbar-button-renderer` in the masthead
    - Patches `Document.prototype.title`:
        - Wraps the original getter and setter
        - On `set`, removes leading `"(number) "` patterns (e.g. `(3) YouTube` → `YouTube`)
        - Forwards the cleaned title to the original setter
- Uses `__ytTitlePatched` flag to ensure the hook is applied only once
- Keeps original getter/setter behavior intact, only sanitizes the value

🚀 Result:
- No notification bell in the UI
- No unread counter spam in the tab title
- Cleaner browser tabs
- Fewer distracting visual signals
- Slightly less DOM/UI churn related to notification updates

# 🚫 Content Blocking

### removeAds: 
🚫 Hides YouTube ads, promos, and sponsored UI blocks across desktop and mobile layouts  
🧹 Removes ad slots, merch shelves, banners, in-feed ads, and engagement ad panels  
📵 Filters out Shorts shelves and rich promo sections via a shared base selector list  
🧱 Cleans up layout spacing after ad blocks are removed  
🖌️ Applies all changes purely via CSS (no network or JS request blocking)

🔧 How it works:
- Defines a base list of selectors (`BASE_HIDE_SELECTORS`) for:
    - Shorts shelves
    - Rich shelves/sections
    - Secondary results blocks
    - Promo grids and mobile shelves
- When `CONFIG.removeAds` is enabled:
    - Injects layout fix rules:
        - Removes extra top margin/padding from the main content
        - Shrinks the masthead container height to reclaim space
    - Injects a large `display: none` rule set that hides:
        - Video masthead ads
        - In-feed ad renderers
        - Ad slots and overlays
        - Merch shelves and promo banners
        - Engagement panel ads
        - “About this ad” blocks and statement banners
        - Mobile promoted and sparkles renderers
        - Plus everything from `BASE_HIDE_SELECTORS`
- Uses only CSS hiding, so YouTube logic remains untouched

🚀 Result:
- No visible ads or sponsored blocks in the UI
- Cleaner and more compact layouts
- Less visual clutter and fewer distractions
- Slightly less layout/paint work for the browser
- A more focused, content-first YouTube experience

### removeShorts: 
🚫 Removes YouTube Shorts from both desktop and mobile UI  
🧹 Hides Shorts shelves, containers, and navigation entries  
🧱 Filters out Shorts-related sections from guides, sidebars, and feeds  
🖌️ Reuses shared base selectors to also remove Shorts-like promo blocks  
⚙️ Implemented purely via CSS hiding rules

🔧 How it works:
- When `CONFIG.removeShorts` is enabled:
    - Injects CSS rules that hide:
        - Elements marked with `[is-shorts]`
        - `#shorts-container`
        - Shorts entry in the main guide
        - Shorts entry in the mini-guide
        - Plus everything covered by `BASE_HIDE_SELECTORS` (shelves/sections commonly used for Shorts and promos)
- Does not touch YouTube’s JS logic or routing — only removes UI visibility

🚀 Result:
- No Shorts in the feed, sidebars, or navigation
- Cleaner homepage and watch pages
- Less distraction and doomscroll bait
- Slightly simpler DOM on screen
- A more “long-form video only” YouTube experience

### removeComments: 
💬 Completely removes the comments section from YouTube watch pages  
🧹 Hides the main comments container, threads, and teaser blocks  
🧱 Eliminates comment-related DOM sections from rendering and layout  
🖌️ Implemented purely via CSS hiding rules (no JS logic changes)

🔧 How it works:
- When `CONFIG.removeComments` is enabled:
    - Injects CSS rules that hide:
        - `#comments` container on the watch page
        - `ytd-comments` root component
        - Individual `ytd-comment-thread-renderer` blocks
        - The comment teaser section
- Uses only `display: none`-style hiding via the shared `hide()` helper
- Does not interfere with YouTube’s internal comment loading logic — just removes it from view

🚀 Result:
- No comments visible under videos
- Cleaner and more compact watch pages
- Less distraction and less time spent doom-scrolling replies
- Slightly reduced DOM complexity on screen
- A more focused, content-only viewing experience

### removeTrending: 
📉 Removes the “Trending” section from YouTube navigation  
🧹 Hides both the sidebar entry and direct trending links  
🧱 Prevents the Trending feed from being accessed via the UI  
🖌️ Implemented purely via CSS hiding rules

🔧 How it works:
- When `CONFIG.removeTrending` is enabled:
    - Injects CSS rules that hide:
        - Any link pointing to `/feed/trending`
        - The guide entry renderer whose title contains “Trending”
- Does not block navigation at the routing level — only removes the UI entry points

🚀 Result:
- No Trending entry in the sidebar or menus
- Less algorithm-driven distraction
- Cleaner navigation UI
- More focus on subscriptions and direct searches
- A more intentional YouTube browsing experience

### removeLiveChat: 
💬 Removes live chat from YouTube live streams and premieres  
🧹 Hides the live chat frame, containers, and embedded iframe  
🧱 Eliminates chat-related UI from the watch page layout  
🖌️ Implemented purely via CSS hiding rules

🔧 How it works:
- When `CONFIG.removeLiveChat` is enabled:
    - Injects CSS rules that hide:
        - `ytd-live-chat-frame`
        - `#chat`
        - `#live-chat-iframe`
- This removes both the visible chat panel and the embedded chat iframe from the layout
- No changes to YouTube’s streaming logic — only UI visibility is affected

🚀 Result:
- No live chat panel during streams or premieres
- More space for the video and main content
- Fewer distractions during live viewing
- Slightly less DOM and iframe overhead
- A cleaner, more focused live stream layout

### removePromo: 
🎁 Hides promotional sections in YouTube’s sidebar and feed  
🧹 Removes links to Courses, Podcasts, Premium, YouTube Music, and merch shelves  
🧱 Cleans up the guide/sidebar from promo-heavy elements  
🖌️ Uses CSS to toggle visibility based on `CONFIG.removePromo`

🔧 How it works:
- Injects CSS rules that conditionally hide or show:
    - Guide entries linking to `/feed/courses_destination` and `/podcasts`
    - Premium and YouTube Music entries
    - The guide footer
    - Merch shelf renderers (`ytd-merch-shelf-renderer`)
- When `CONFIG.removePromo` is `true`, all targeted elements are set to `display: none !important`
- When `false`, visibility is restored to their default layout (`block` or `flex` as appropriate)
- Purely CSS-based, does not interfere with YouTube’s internal logic

🚀 Result:
- Less promo clutter in the sidebar and homepage
- Cleaner, more focused navigation
- Fewer distractions from subscriptions and core content
- Reduced DOM complexity for UI-heavy pages
- A more “ad-free / distraction-free” YouTube experience

# 🎬 Player

### disableAutoplay: 
⏹️ Disables autoplay for channel trailer videos on YouTube channels  
🧹 Prevents unwanted playback of introductory/trailer videos  
🧱 Targets only `ytd-channel-video-player-renderer` to avoid affecting regular video playback  
🖌️ Uses an event listener hook to pause trailers immediately when they start

🔧 How it works:
- When `CONFIG.disableAutoplay` is enabled:
    - Adds a `play` event listener on the `document` (capturing phase)
    - Checks if the `event.target` is an `HTMLVideoElement`
    - If the video is inside a `ytd-channel-video-player-renderer` (channel trailer):
        - Sets `video.autoplay = false`
        - Pauses the video immediately
- Uses `__trailerAutoplayHooked` to ensure the hook is applied only once

🚀 Result:
- Channel trailer videos do not autoplay when opening a channel
- Avoids unexpected sound/video distractions
- Reduces unnecessary network and CPU usage
- Gives the user more control over what plays first on a channel page

### limitVideoQuality: & maxQuality:
🎚️ Allows limiting the maximum playback quality on YouTube videos  
🧹 Forces a specific resolution regardless of YouTube’s automatic selection  
🧱 Integrates with the settings UI: enables/disables the `maxQuality` dropdown based on toggle  
⚙️ Hooks into the video player via JS to apply the target quality reliably

🔧 How it works:
- When `CONFIG.limitVideoQuality` is enabled:
    - Maps human-readable resolutions (`360p`, `720p`, etc.) to YouTube’s internal quality codes (`medium`, `hd720`, etc.)
    - Defines a function `tryApplyQuality()` to:
        - Access the video player (`movie_player` or `.html5-video-player`)
        - Call `setPlaybackQualityRange` and `setPlaybackQuality` to enforce the target quality
    - Uses a `MutationObserver` on `document.body`:
        - Re-applies the quality whenever the DOM changes (e.g., video reloads, player changes)
    - Listens to the `yt-navigate-finish` event:
        - Re-applies the quality after SPA navigation
    - Prevents multiple initializations via `__qualityLimiterInitialized` flag
- UI integration:
    - `limitVideoQuality` toggle enables/disables `maxQuality` select
    - Select options: `360p`, `480p`, `720p (HD)`, `1080p (Full HD)`, `1440p (2K)`, `2160p (4K)`
    
🚀 Result:
- Videos never exceed the selected maximum quality
- Reduces bandwidth usage for users with slow or limited connections
- Provides consistent video resolution across SPA navigation
- Full control over playback quality without relying on YouTube’s auto selection
- Works seamlessly with the settings UI

### disablePlayerGradients: 
🎨 Removes the top and bottom gradient overlays from the YouTube video player  
🧹 Eliminates visual fade effects that can obscure video edges  
⚡ Reduces unnecessary CSS rendering and repaint work  
🖌️ Implemented purely via CSS overrides

🔧 How it works:
- When `CONFIG.disablePlayerGradients` is enabled:
    - Injects CSS rules to hide the player gradient elements:
        - `.ytp-gradient-top`
        - `.ytp-gradient-bottom`
    - Sets `height: 0 !important` and `padding: 0 !important` to fully collapse the gradient bars
- No JavaScript hooks or modifications to player logic

🚀 Result:
- Cleaner, unobstructed view of the video
- Less visual distraction from gradient overlays
- Slightly improved rendering performance
- Full-width visibility of the video content

### disablePlayerWatermarkAndAnnotations: 
💧 Removes YouTube player watermarks, annotations, and branding overlays  
🧹 Hides visual distractions such as channel logos, clickable annotations, and interactive video elements  
🖌️ Implemented purely via CSS hiding rules

🔧 How it works:
- When `CONFIG.disablePlayerWatermarkAndAnnotations` is enabled:
    - Injects CSS rules to hide:
        - `.ytp-watermark` — YouTube branding watermark
        - `.annotation`, `.iv-branding`, `.video-annotations` — in-video annotations and overlays
- No changes to player logic or video playback

🚀 Result:
- Cleaner, unobstructed video display
- Removes distractions caused by annotations and branding
- Slightly improved performance by reducing overlay rendering
- More focused viewing experience

### removeInfoAndPlayerCards: 
📝 Removes in-video info cards, end-screen elements, and teaser cards  
🧹 Hides video description info cards, clickable end cards, and card teasers  
🖌️ Implemented purely via CSS hiding rules

🔧 How it works:
- When `CONFIG.removeInfoAndPlayerCards` is enabled:
    - Injects CSS rules to hide:
        - `ytd-video-description-infocards-section-renderer` — description-linked info cards
        - `.ytp-ce-element` — end-screen elements
        - `.ytp-cards-teaser` — teaser overlays for upcoming cards
- No changes to video playback or YouTube’s internal card logic

🚀 Result:
- Cleaner video playback with no distracting cards
- Less visual clutter on the player and under the video
- Fewer accidental clicks on info or teaser overlays
- More focused viewing experience

### removeEndScreen: 
🏁 Removes YouTube video end screens and suggested video overlays  
🧹 Hides all end-screen elements that appear when a video finishes  
🖌️ Implemented purely via CSS hiding rules

🔧 How it works:
- When `CONFIG.removeEndScreen` is enabled:
    - Injects CSS rules to hide:
        - `.html5-endscreen` — container for end-screen content
        - `.ytp-endscreen-content` — the actual video suggestions and overlays
- No changes to video playback logic — only UI visibility is affected

🚀 Result:
- No suggested video pop-ups after a video ends
- Cleaner viewing experience with uninterrupted focus
- Fewer distractions and accidental clicks on recommended content
- More control over what appears at the end of videos
