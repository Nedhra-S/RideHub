"use strict";
/* RideHub - Gear Shop: filter, sort, cart drawer with totals (stored in localStorage) */
(function () {
    const { $, $$, esc, inr, load, save, toast } = RH;
    RH.init("gear");
    // Demo products only - generic items, no real brands or real checkout.
    const products = [
        { id: 1, name: "AeroShell Helmet", category: "Safety", price: 2499, rating: 4.6, icon: "⛑", blurb: "Lightweight, 18 vents, adjustable fit dial." },
        { id: 2, name: "Beam 800 Front Light", category: "Safety", price: 1299, rating: 4.4, icon: "🔦", blurb: "USB-C rechargeable, 6 modes, 10 hr runtime." },
        { id: 3, name: "Tail Flash Pro", category: "Safety", price: 799, rating: 4.5, icon: "🔴", blurb: "Bright rear light with auto brake flash." },
        { id: 4, name: "Padded Gel Gloves", category: "Comfort", price: 899, rating: 4.3, icon: "🧤", blurb: "Gel palms reduce hand fatigue on long rides." },
        { id: 5, name: "Bib Shorts Elite", category: "Comfort", price: 2199, rating: 4.7, icon: "🩳", blurb: "Quick-dry fabric with all-day padded chamois." },
        { id: 6, name: "Hydration Bottle 750ml", category: "Comfort", price: 349, rating: 4.2, icon: "🧴", blurb: "BPA-free, easy squeeze, fits standard cages." },
        { id: 7, name: "Mini Pump + Patch Kit", category: "Tools", price: 599, rating: 4.4, icon: "🛠", blurb: "Pocket pump with puncture repair essentials." },
        { id: 8, name: "Multi-Tool 16-in-1", category: "Tools", price: 749, rating: 4.5, icon: "🔧", blurb: "Allen keys, chain breaker, spoke wrench." },
        { id: 9, name: "Chain Lube Set", category: "Tools", price: 449, rating: 4.1, icon: "🛢", blurb: "All-weather lube and degreaser combo." },
        { id: 10, name: "GPS Ride Computer", category: "Tech", price: 5999, rating: 4.6, icon: "📍", blurb: "Tracks speed, distance and elevation offline." },
        { id: 11, name: "Phone Handlebar Mount", category: "Tech", price: 499, rating: 4.0, icon: "📱", blurb: "Shock-absorbing mount for most phones." },
        { id: 12, name: "Heart Rate Strap", category: "Tech", price: 1999, rating: 4.3, icon: "❤", blurb: "Bluetooth strap, works with common ride apps." },
    ];
    let cart = load("cart", []);
    const grid = $("#product-grid");
    const cat = $("#category");
    const sort = $("#sort");
    const search = $("#search");
    function stars(n) {
        const full = Math.round(n);
        return "★".repeat(full) + "☆".repeat(5 - full);
    }
    function renderProducts() {
        const q = search.value.trim().toLowerCase();
        const list = products.filter((p) => (cat.value === "All" || p.category === cat.value) && (!q || p.name.toLowerCase().includes(q)));
        if (sort.value === "low")
            list.sort((a, b) => a.price - b.price);
        if (sort.value === "high")
            list.sort((a, b) => b.price - a.price);
        if (sort.value === "rating")
            list.sort((a, b) => b.rating - a.rating);
        grid.innerHTML = list.length
            ? list
                .map((p) => `<article class="card product"><div class="prod-art" aria-hidden="true">${p.icon}</div>` +
                `<div class="card-body"><span class="pill cat">${p.category}</span><h3>${esc(p.name)}</h3>` +
                `<p class="muted">${esc(p.blurb)}</p>` +
                `<div class="row"><span class="stars" aria-label="${p.rating} out of 5">${stars(p.rating)} <small>${p.rating}</small></span><strong>${inr(p.price)}</strong></div>` +
                `<button class="btn small" data-add="${p.id}">Add to cart</button></div></article>`)
                .join("")
            : '<p class="empty">No products match your search.</p>';
    }
    function persist() {
        save("cart", cart);
        RH.updateCartBadge();
        renderCart();
    }
    function renderCart() {
        const body = $("#cart-items");
        if (!cart.length) {
            body.innerHTML = '<p class="empty">Your cart is empty. Add some gear!</p>';
        }
        else {
            body.innerHTML = cart
                .map((i) => {
                const p = products.find((x) => x.id === i.id);
                return (`<div class="cart-row"><span class="ico" aria-hidden="true">${p.icon}</span>` +
                    `<div class="grow"><strong>${esc(p.name)}</strong><br/><small>${inr(p.price)} each</small></div>` +
                    `<div class="qty"><button data-dec="${p.id}" aria-label="Decrease">-</button><span>${i.qty}</span><button data-inc="${p.id}" aria-label="Increase">+</button></div>` +
                    `<button class="link" data-rm="${p.id}" aria-label="Remove ${esc(p.name)}">Remove</button></div>`);
            })
                .join("");
        }
        const subtotal = cart.reduce((s, i) => s + products.find((p) => p.id === i.id).price * i.qty, 0);
        const discount = subtotal >= 5000 ? Math.round(subtotal * 0.1) : 0;
        $("#subtotal").textContent = inr(subtotal);
        $("#discount").textContent = discount ? "-" + inr(discount) : inr(0);
        $("#total").textContent = inr(subtotal - discount);
        $("#discount-note").textContent = discount ? "10% club discount applied" : "Spend ₹5,000+ to get 10% off";
    }
    grid.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-add]");
        if (!btn)
            return;
        const id = Number(btn.dataset.add);
        const found = cart.find((i) => i.id === id);
        if (found)
            found.qty += 1;
        else
            cart.push({ id, qty: 1 });
        persist();
        toast("Added to cart");
    });
    $("#cart-items").addEventListener("click", (e) => {
        const t = e.target;
        const id = Number(t.dataset.inc || t.dataset.dec || t.dataset.rm);
        if (!id)
            return;
        const item = cart.find((i) => i.id === id);
        if (!item)
            return;
        if (t.dataset.inc)
            item.qty += 1;
        if (t.dataset.dec)
            item.qty -= 1;
        if (t.dataset.rm || item.qty <= 0)
            cart = cart.filter((i) => i.id !== id);
        persist();
    });
    $("#checkout").addEventListener("click", () => {
        if (!cart.length) {
            toast("Your cart is empty");
            return;
        }
        cart = [];
        persist();
        toast("Demo order placed - thanks! (no real payment)");
    });
    [cat, sort, search].forEach((el) => el.addEventListener("input", renderProducts));
    // cart drawer open / close (also opens from the #cart link in the header)
    const drawer = $("#cart-drawer");
    function setDrawer(open) {
        drawer.classList.toggle("open", open);
        drawer.setAttribute("aria-hidden", String(!open));
    }
    $("#open-cart").addEventListener("click", () => setDrawer(true));
    $("#close-cart").addEventListener("click", () => setDrawer(false));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape")
            setDrawer(false);
    });
    if (location.hash === "#cart")
        setDrawer(true);
    window.addEventListener("hashchange", () => setDrawer(location.hash === "#cart"));
    renderProducts();
    renderCart();
})();
