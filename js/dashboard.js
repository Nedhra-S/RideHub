"use strict";
/* RideHub - Dashboard page logic */
(function () {
    const { $, esc, fmtDuration, load, save, toast } = RH;
    RH.init("dashboard");
    const rides = RH.getRides();
    // ---------- greeting ----------
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    $("#greeting").textContent = `${greet}, rider!`;
    // ---------- headline stats ----------
    const totalKm = rides.reduce((s, r) => s + r.km, 0);
    const totalMins = rides.reduce((s, r) => s + r.mins, 0);
    const calories = Math.round(totalKm * 28); // rough estimate: ~28 kcal per km
    const avgSpeed = totalMins ? totalKm / (totalMins / 60) : 0;
    $("#stat-km").textContent = totalKm.toFixed(0);
    $("#stat-rides").textContent = String(rides.length);
    $("#stat-time").textContent = fmtDuration(totalMins);
    $("#stat-speed").textContent = avgSpeed.toFixed(1);
    $("#stat-cal").textContent = calories.toLocaleString("en-IN");
    // ---------- weekly bar chart (SVG, last 7 days) ----------
    function drawWeekChart() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const iso = RH.isoDaysAgo(i);
            const d = new Date(iso + "T00:00:00");
            const km = rides.filter((r) => r.date === iso).reduce((s, r) => s + r.km, 0);
            days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), km });
        }
        const max = Math.max(10, ...days.map((d) => d.km));
        const W = 560, H = 220, padB = 32, padT = 22, gap = 14;
        const bw = (W - gap * (days.length + 1)) / days.length;
        let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distance ridden in the last 7 days">`;
        [0.5, 1].forEach((f) => {
            const y = padT + (H - padT - padB) * (1 - f);
            svg += `<line class="grid" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`;
        });
        days.forEach((d, i) => {
            const h = ((H - padT - padB) * d.km) / max;
            const x = gap + i * (bw + gap);
            const y = H - padB - h;
            svg += `<rect class="bar${d.km ? "" : " empty"}" x="${x}" y="${d.km ? y : H - padB - 3}" width="${bw}" height="${d.km ? h : 3}" rx="6"><title>${d.label}: ${d.km} km</title></rect>`;
            if (d.km)
                svg += `<text class="val" x="${x + bw / 2}" y="${y - 6}" text-anchor="middle">${d.km}</text>`;
            svg += `<text class="lbl" x="${x + bw / 2}" y="${H - 10}" text-anchor="middle">${d.label}</text>`;
        });
        svg += "</svg>";
        $("#week-chart").innerHTML = svg;
        const weekKm = days.reduce((s, d) => s + d.km, 0);
        $("#week-total").textContent = `${weekKm} km this week`;
    }
    drawWeekChart();
    // ---------- monthly goal ring ----------
    function drawGoal() {
        const goal = load("goal", 300);
        const now = new Date();
        const monthKm = rides
            .filter((r) => {
            const d = new Date(r.date + "T00:00:00");
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
            .reduce((s, r) => s + r.km, 0);
        const pct = Math.min(100, Math.round((monthKm / goal) * 100));
        const R = 54, C = 2 * Math.PI * R;
        $("#goal-ring").innerHTML =
            `<svg viewBox="0 0 140 140" role="img" aria-label="${pct}% of monthly goal">` +
                `<circle class="track" cx="70" cy="70" r="${R}"/>` +
                `<circle class="prog" cx="70" cy="70" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}" transform="rotate(-90 70 70)"/>` +
                `<text x="70" y="68" text-anchor="middle" class="big">${pct}%</text>` +
                `<text x="70" y="88" text-anchor="middle" class="small">${monthKm} / ${goal} km</text></svg>`;
        $("#goal-input").value = String(goal);
    }
    drawGoal();
    $("#goal-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = Number($("#goal-input").value);
        if (v >= 20 && v <= 5000) {
            save("goal", v);
            drawGoal();
            toast("Monthly goal updated");
        }
        else {
            toast("Enter a goal between 20 and 5000 km");
        }
    });
    // ---------- maintenance tracker ----------
    const parts = [
        { key: "chain", name: "Chain lube", every: 300 },
        { key: "brakes", name: "Brake pads check", every: 1000 },
        { key: "tyres", name: "Tyre replacement", every: 3000 },
    ];
    function drawMaintenance() {
        const base = load("service", {});
        $("#maint-list").innerHTML = parts
            .map((p) => {
            const since = Math.max(0, totalKm - (base[p.key] || 0));
            const pct = Math.min(100, Math.round((since / p.every) * 100));
            const state = pct >= 100 ? "due" : pct >= 75 ? "soon" : "ok";
            return (`<li><div class="row"><span>${p.name}</span><span class="tag ${state}">${state === "due" ? "Service due" : state === "soon" ? "Due soon" : "Good"}</span></div>` +
                `<div class="meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i class="${state}" style="width:${pct}%"></i></div>` +
                `<div class="row sub"><span>${since.toFixed(0)} / ${p.every} km</span>` +
                `<button class="link" data-part="${p.key}">Mark serviced</button></div></li>`);
        })
            .join("");
    }
    drawMaintenance();
    $("#maint-list").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-part]");
        if (!btn)
            return;
        const base = load("service", {});
        base[btn.dataset.part] = totalKm;
        save("service", base);
        drawMaintenance();
        toast("Marked as serviced");
    });
    // ---------- pre-ride checklist ----------
    const checks = ["Tyre pressure", "Chain lubed", "Brakes responsive", "Lights charged", "Helmet fastened", "Water bottle filled"];
    function drawChecklist() {
        const done = load("checklist", []);
        $("#checklist").innerHTML = checks
            .map((c, i) => `<li><label><input type="checkbox" data-i="${i}" ${done.includes(c) ? "checked" : ""}/> <span>${c}</span></label></li>`)
            .join("");
        const n = done.filter((c) => checks.includes(c)).length;
        $("#check-status").textContent = n === checks.length ? "All set - enjoy the ride!" : `${n}/${checks.length} checked`;
    }
    drawChecklist();
    $("#checklist").addEventListener("change", (e) => {
        const box = e.target;
        if (box.type !== "checkbox")
            return;
        const name = checks[Number(box.dataset.i)];
        let done = load("checklist", []);
        done = box.checked ? [...done, name] : done.filter((c) => c !== name);
        save("checklist", done);
        drawChecklist();
    });
    $("#check-reset").addEventListener("click", () => {
        save("checklist", []);
        drawChecklist();
    });
    // ---------- achievements ----------
    const longest = Math.max(0, ...rides.map((r) => r.km));
    const badges = [
        { icon: "🏁", name: "First 100 km", ok: totalKm >= 100 },
        { icon: "🔥", name: "500 km Club", ok: totalKm >= 500 },
        { icon: "⛰", name: "Hill Hunter", ok: rides.some((r) => /hill|ghat/i.test(r.route)) },
        { icon: "🚴", name: "50 km Day", ok: longest >= 50 },
        { icon: "📅", name: "10 Rides", ok: rides.length >= 10 },
        { icon: "🌅", name: "Century Rider", ok: longest >= 100 },
    ];
    $("#badges").innerHTML = badges
        .map((b) => `<li class="${b.ok ? "got" : ""}"><span class="ico">${b.icon}</span><span>${b.name}</span></li>`)
        .join("");
    // ---------- recent rides ----------
    const recent = [...rides].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    $("#recent-body").innerHTML = recent
        .map((r) => `<tr><td>${r.date}</td><td>${esc(r.route)}</td><td>${r.km} km</td><td>${fmtDuration(r.mins)}</td><td>${(r.km / (r.mins / 60)).toFixed(1)} km/h</td></tr>`)
        .join("");
    // ---------- rider's quote ----------
    const quotes = [
        "Keep the pedals turning and the road will sort out the rest.",
        "The best rides start before sunrise.",
        "Hills are just slow-motion downhills waiting to happen.",
        "Ride today, rest tomorrow, repeat.",
    ];
    $("#quote").textContent = quotes[new Date().getDate() % quotes.length];
})();
