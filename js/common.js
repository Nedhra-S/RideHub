"use strict";
/* RideHub - shared code: types, storage, seed data, header/footer, theme, toast.
   Written as a plain script (no imports) so the site also works by double-clicking the HTML files. */
var RH;
(function (RH) {
    // ---------- storage helpers (wrapped in try/catch: storage can be blocked) ----------
    function load(key, fallback) {
        try {
            const raw = localStorage.getItem("ridehub." + key);
            return raw ? JSON.parse(raw) : fallback;
        }
        catch {
            return fallback;
        }
    }
    RH.load = load;
    function save(key, value) {
        try {
            localStorage.setItem("ridehub." + key, JSON.stringify(value));
        }
        catch {
            /* ignore */
        }
    }
    RH.save = save;
    // ---------- small utilities ----------
    function esc(text) {
        return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
    RH.esc = esc;
    function $(sel, root = document) {
        return root.querySelector(sel);
    }
    RH.$ = $;
    function $$(sel, root = document) {
        return Array.from(root.querySelectorAll(sel));
    }
    RH.$$ = $$;
    function isoDaysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().slice(0, 10);
    }
    RH.isoDaysAgo = isoDaysAgo;
    function inr(n) {
        return "₹" + n.toLocaleString("en-IN");
    }
    RH.inr = inr;
    function fmtDuration(mins) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
    }
    RH.fmtDuration = fmtDuration;
    // ---------- ride data (seeded once so the dashboard is never empty) ----------
    function getRides() {
        const stored = load("rides", null);
        if (stored)
            return stored;
        const seed = [
            { id: 1, date: isoDaysAgo(0), route: "ECR Highway Ride", km: 127, mins: 90, bike: "KTM Duke 390" },
            { id: 2, date: isoDaysAgo(1), route: "City Commute", km: 38, mins: 45, bike: "Yamaha MT-15" },
            { id: 3, date: isoDaysAgo(2), route: "Yelagiri Road Trip", km: 152, mins: 120, bike: "Yamaha R15 V4" },
            { id: 4, date: isoDaysAgo(4), route: "Pondicherry Coast Run", km: 228, mins: 180, bike: "Royal Enfield Hunter 350" },
            { id: 5, date: isoDaysAgo(5), route: "Evening Highway Ride", km: 85, mins: 60, bike: "TVS Apache RTR 200" },
            { id: 6, date: isoDaysAgo(8), route: "Kolli Hills Ghat", km: 102, mins: 120, bike: "KTM RC 390" },
            { id: 7, date: isoDaysAgo(12), route: "ECR Sunrise Loop", km: 76, mins: 60, bike: "Bajaj Pulsar NS200" },
            { id: 8, date: isoDaysAgo(17), route: "Weekend Ride", km: 170, mins: 120, bike: "Honda Hornet 2.0" },
        ];
        save("rides", seed);
        return seed;
    }
    RH.getRides = getRides;
    function saveRides(rides) {
        save("rides", rides);
    }
    RH.saveRides = saveRides;
    // ---------- header / footer ----------
    const PAGES = [
        { file: "index.html", key: "dashboard", label: "Dashboard" },
        { file: "routes.html", key: "routes", label: "Routes" },
        { file: "tracking.html", key: "tracking", label: "Map & Tracking" },
        { file: "gear.html", key: "gear", label: "Gear Shop" },
        { file: "ridelog.html", key: "ridelog", label: "Ride Log" },
        { file: "contact.html", key: "contact", label: "Join the Club" },
    ];
    const LOGO = '<svg class="logo-bike" viewBox="0 0 200 110" width="96" height="53" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
        '<g stroke-width="6"><circle cx="38" cy="80" r="22"/><circle cx="164" cy="80" r="22"/></g>' +
        '<g stroke-width="1.8" opacity=".7"><circle cx="38" cy="80" r="14"/><circle cx="164" cy="80" r="14"/>' +
        '<path d="M38 66V94M24 80H52M28 70L48 90M48 70L28 90M164 66V94M150 80H178M154 70L174 90M174 70L154 90"/></g>' +
        '<circle cx="38" cy="80" r="4" fill="currentColor" stroke="none"/><circle cx="164" cy="80" r="4" fill="currentColor" stroke="none"/>' +
        '<circle cx="164" cy="80" r="8" stroke-width="2"/>' +
        '<path d="M164 80L142 34" stroke-width="5"/>' +
        '<path d="M170 80L148 36" stroke-width="2.5" opacity=".7"/>' +
        '<path d="M147 52Q162 45 178 56" stroke-width="4.5"/>' +
        '<path d="M138 27L121 20L115 22" stroke-width="4.5"/>' +
        '<path d="M139 30L155 33L152 42L139 40Z" fill="currentColor" stroke-width="2"/>' +
        '<g stroke-width="3.4"><path d="M136 38L86 72"/><path d="M68 52L86 72"/></g>' +
        '<path d="M86 74L38 80" stroke-width="6"/>' +
        '<path d="M21 31L56 41L102 41L110 33C121 24 133 27 141 34L136 46C124 42 113 46 104 54L58 52Z" fill="currentColor" stroke-width="2.5"/>' +
        '<path d="M90 58L123 54L129 78L98 84Z" fill="currentColor" stroke-width="2.5"/>' +
        '<g style="stroke:var(--surface)" stroke-width="2.2"><path d="M103 59L108 82M112 57.5L117 80.5M121 56L125 78"/></g>' +
        '<path d="M106 88L72 93" stroke-width="6"/>' +
        '</svg>';
    function cartCount() {
        return load("cart", []).reduce((s, i) => s + i.qty, 0);
    }
    RH.cartCount = cartCount;
    function updateCartBadge() {
        const b = document.getElementById("cart-badge");
        if (b) {
            const n = cartCount();
            b.textContent = String(n);
            b.hidden = n === 0;
        }
    }
    RH.updateCartBadge = updateCartBadge;
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const btn = document.getElementById("theme-toggle");
        if (btn)
            btn.textContent = theme === "dark" ? "☀ Light" : "☾ Dark";
    }
    function init(activeKey) {
        const header = document.getElementById("site-header");
        if (header) {
            const links = PAGES.map((p) => `<a href="${p.file}" class="${p.key === activeKey ? "active" : ""}"${p.key === activeKey ? ' aria-current="page"' : ""}>${p.label}</a>`).join("");
            header.innerHTML =
                `<div class="wrap nav">` +
                    `<a class="brand" href="index.html">${LOGO}<span>Ride<b>Hub</b></span></a>` +
                    `<button class="menu-btn" id="menu-btn" aria-label="Toggle menu" aria-expanded="false">☰</button>` +
                    `<nav id="nav-links" aria-label="Main">${links}</nav>` +
                    `<div class="nav-tools">` +
                    `<a class="cart-link" href="gear.html#cart" aria-label="Cart">🛒<span id="cart-badge" class="badge" hidden>0</span></a>` +
                    `<button class="btn ghost small" id="theme-toggle">☾ Dark</button>` +
                    `</div></div>`;
        }
        const footer = document.getElementById("site-footer");
        if (footer) {
            footer.innerHTML =
                `<div class="wrap foot">` +
                    `<div><strong>RideHub</strong><p>A motorcycle companion for ride logs, bike tracking and nearby workshop discovery.</p></div>` +
                    `<div><strong>Pages</strong><p>${PAGES.map((p) => `<a href="${p.file}">${p.label}</a>`).join(" · ")}</p></div>` +
                    `<div><strong>Ride safe</strong><p>Helmet on, lights on, phone away. Respect traffic and every rider.</p></div>` +
                    `</div>`;
        }
        // theme: saved choice -> else system preference
        const saved = load("theme", null);
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(saved || (prefersDark ? "dark" : "light"));
        const toggle = document.getElementById("theme-toggle");
        toggle?.addEventListener("click", () => {
            const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
            save("theme", next);
            applyTheme(next);
            document.dispatchEvent(new CustomEvent("ridehub:theme"));
        });
        const menuBtn = document.getElementById("menu-btn");
        const nav = document.getElementById("nav-links");
        menuBtn?.addEventListener("click", () => {
            const open = nav?.classList.toggle("open");
            menuBtn.setAttribute("aria-expanded", String(!!open));
        });
        updateCartBadge();
    }
    RH.init = init;
    // ---------- toast ----------
    function toast(message) {
        let box = document.getElementById("toast");
        if (!box) {
            box = document.createElement("div");
            box.id = "toast";
            box.setAttribute("role", "status");
            document.body.appendChild(box);
        }
        box.textContent = message;
        box.classList.add("show");
        window.setTimeout(() => box && box.classList.remove("show"), 2400);
    }
    RH.toast = toast;
})(RH || (RH = {}));
