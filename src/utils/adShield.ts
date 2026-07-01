/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Domain Whitelist for Security Sanitization
export const SHIELD_WHITELIST = [
  "myembed.biz",
  "image.tmdb.org",
  "api.themoviedb.org",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net",
  "lucide-react",
  window.location.hostname, // Allow current application domain
  "localhost",
  "127.0.0.1"
];

// Block list keywords for suspect links / domains
export const SUSPECT_KEYWORDS = [
  "bet", "cassino", "casino", "win", "slot", "double", "fortune", "tiger",
  "blaze", "1xbet", "adclick", "popads", "onclick", "doubleclick", "popunder"
];

export interface ShieldStats {
  popupsBlocked: number;
  redirectsPrevented: number;
  adsRemoved: number;
  suspectLinksCleaned: number;
}

export type ShieldMode = "strong" | "balanced" | "disabled";

class AdShieldEngine {
  private stats: ShieldStats = {
    popupsBlocked: 0,
    redirectsPrevented: 0,
    adsRemoved: 0,
    suspectLinksCleaned: 0,
  };

  private listeners: Array<(stats: ShieldStats) => void> = [];
  private observer: MutationObserver | null = null;
  private originalOpen: typeof window.open | null = null;
  private isHooked = false;

  constructor() {
    this.originalOpen = window.open;
  }

  // Subscribe to real-time blocked stats changes
  public subscribe(cb: (stats: ShieldStats) => void) {
    this.listeners.push(cb);
    cb({ ...this.stats });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.stats }));
  }

  // Increment popup block telemetry
  public incrementPopups() {
    this.stats.popupsBlocked += 1;
    this.notify();
  }

  // Increment redirect block telemetry
  public incrementRedirects() {
    this.stats.redirectsPrevented += 1;
    this.notify();
  }

  // Increment ad element removal telemetry
  public incrementAdsRemoved(count = 1) {
    this.stats.adsRemoved += count;
    this.notify();
  }

  // Increment suspect link sanitization telemetry
  public incrementLinksCleaned() {
    this.stats.suspectLinksCleaned += 1;
    this.notify();
  }

  // Reset counters
  public resetStats() {
    this.stats = {
      popupsBlocked: 0,
      redirectsPrevented: 0,
      adsRemoved: 0,
      suspectLinksCleaned: 0,
    };
    this.notify();
  }

  // Clean elements matched by ad selectors
  public cleanDOM() {
    const adSelectors = [
      ".ad", ".ads", ".popup", ".banner", ".sponsor", ".overlay",
      "[id*='ad-']", "[class*='ad-']", "[id*='banner']", "[class*='banner']",
      "[id*='pop-']", "[class*='pop-']", ".ad-container", ".advertisement",
      "iframe[src*='ad']", "iframe[src*='pop']", "a[href*='click']",
      "a[href*='bet']", "[class*='popunder']", "[class*='popup']"
    ];

    let removed = 0;
    adSelectors.forEach((selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          // Keep our main player elements of course
          if (
            el.id === "stream-player" ||
            el.closest(".fixed") ||
            el.closest("#root") && el.classList.contains("fixed")
          ) {
            return;
          }
          el.remove();
          removed++;
        });
      } catch (e) {
        // Safe check
      }
    });

    if (removed > 0) {
      this.incrementAdsRemoved(removed);
    }
  }

  // Is domain safe/whitelisted?
  public isDomainSafe(urlStr: string): boolean {
    if (!urlStr || urlStr === "about:blank") return true;
    try {
      // Handle relative paths
      if (urlStr.startsWith("/") || urlStr.startsWith(".")) return true;
      
      const url = new URL(urlStr);
      const hostname = url.hostname.toLowerCase();
      
      // Check if domain is in whitelist
      const isWhitelisted = SHIELD_WHITELIST.some((domain) =>
        hostname === domain || hostname.endsWith("." + domain)
      );

      if (isWhitelisted) return true;

      // Check if suspect words exist
      const hasSuspectWords = SUSPECT_KEYWORDS.some((word) =>
        urlStr.toLowerCase().includes(word)
      );

      return !hasSuspectWords;
    } catch (e) {
      // If URL parsing fails, check keywords
      const hasSuspectWords = SUSPECT_KEYWORDS.some((word) =>
        urlStr.toLowerCase().includes(word)
      );
      return !hasSuspectWords;
    }
  }

  // Initialize and attach standard client-side overrides
  public init() {
    if (this.isHooked) return;
    this.isHooked = true;

    // 1. Intercept window.open to prevent unexpected popups/tabs
    window.open = (url?: string | URL, target?: string, features?: string) => {
      const urlStr = url ? url.toString() : "";
      console.warn("🛡️ AdShield: Interceptado window.open para url:", urlStr);

      if (urlStr && !this.isDomainSafe(urlStr)) {
        console.error("🛡️ AdShield: Bloqueada abertura de URL suspeita:", urlStr);
        this.incrementPopups();
        return null;
      }

      // If it's a whitelisted domain or user-initiated to navigation, check if verified
      // Block loops of opening window
      this.incrementPopups();
      return null;
    };

    // 2. Prevent clickjacking pointer captures on parent body
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Intercept anchor tags
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href && !href.startsWith("#") && !href.startsWith("/")) {
          if (!this.isDomainSafe(href)) {
            e.preventDefault();
            e.stopPropagation();
            console.error("🛡️ AdShield: Bloqueado clique para URL proibida:", href);
            this.incrementLinksCleaned();
          }
        }
      }

      // Detect clicking an invisible cover click-jacking element
      const style = window.getComputedStyle(target);
      const isTransparent = style.opacity === "0" || style.backgroundColor === "rgba(0, 0, 0, 0)";
      const isFullOverlay = target.offsetWidth > window.innerWidth * 0.8 && target.offsetHeight > window.innerHeight * 0.8;
      
      if (isTransparent && isFullOverlay && !target.closest("#root") && target.id !== "stream-player") {
        e.preventDefault();
        e.stopPropagation();
        target.remove();
        console.warn("🛡️ AdShield: Elemento de click-jacking invisível removido.");
        this.incrementAdsRemoved(1);
      }
    }, true);

    // 3. Prevent external redirect window location hacks
    // Monitor window unload state to intercept malicious unload redirections
    let lastUnloadAttempt = 0;
    window.addEventListener("beforeunload", (e) => {
      const now = Date.now();
      // Block micro redirects in fast succession
      if (now - lastUnloadAttempt < 2000) {
        this.incrementRedirects();
        e.preventDefault();
        return "🛡️ AdShield detectou uma tentativa de redirecionamento automático.";
      }
      lastUnloadAttempt = now;
    });

    // 4. Create MutationObserver for dynamic injection elements
    this.observer = new MutationObserver((mutations) => {
      let runClean = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          runClean = true;
        }
      });
      if (runClean) {
        this.cleanDOM();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Run first cleaning
    this.cleanDOM();
    this.injectAntiAdStyles();
  }

  // Clean CSS styles - removes banners and mock elements automatically
  private injectAntiAdStyles() {
    const styleId = "adshield-anti-ad-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      /* AdShield CSS Overrides - Hides overlay containers, popunder frames, and floating ad elements */
      .ad, .ads, .popup_ad, .banner-ad, .sponsor-badge,
      iframe[src*="doubleclick"], iframe[src*="adsystem"],
      div[class*="ad-box"], div[class*="popunder"], div[id*="ad-container"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
      }
      
      /* Block clickjacking covers with high z-indices not belonging to the application foundation */
      body > div:not(#root):not(.portal-root):not([class*="fixed"]):not([class*="absolute"]) {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Deinitialize
  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.originalOpen) {
      window.open = this.originalOpen;
    }
    const style = document.getElementById("adshield-anti-ad-styles");
    if (style) style.remove();
    this.isHooked = false;
  }
}

export const adShield = new AdShieldEngine();
