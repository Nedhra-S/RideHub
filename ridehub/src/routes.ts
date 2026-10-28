/* RideHub - Routes page: search, filter, sort, favourites, details dialog */
(function () {
  const { $, $$, esc, load, save, toast } = RH;
  RH.init("routes");

  // Distances / climbs are approximate and for planning inspiration only.
  const routes: RoutePlan[] = [
    { id: 1, name: "ECR Sunrise Loop", region: "Chennai", km: 45, climb: 60, level: "Easy", bestTime: "5:00 - 8:00 AM", tip: "Flat, scenic coastal road. Start early to avoid traffic and heat." },
    { id: 2, name: "Pondicherry Coast Run", region: "Puducherry", km: 150, climb: 180, level: "Moderate", bestTime: "Oct - Feb", tip: "Great weekend ride. Plan a breakfast stop around Mahabalipuram." },
    { id: 3, name: "Yelagiri Hill Climb", region: "Tirupattur", km: 60, climb: 1050, level: "Hard", bestTime: "Nov - Feb", tip: "14 hairpin bends. Pace yourself and carry extra water." },
    { id: 4, name: "Kolli Hills Ghat", region: "Namakkal", km: 70, climb: 1200, level: "Hard", bestTime: "Oct - Jan", tip: "70 hairpin bends. Brake early and keep off the centre line." },
    { id: 5, name: "Kodaikanal Ghat Road", region: "Dindigul", km: 65, climb: 1900, level: "Hard", bestTime: "Sep - Feb", tip: "Long steady climb. Start before 7 AM to beat the fog and traffic." },
    { id: 6, name: "Coonoor - Ooty Tea Trail", region: "The Nilgiris", km: 35, climb: 750, level: "Moderate", bestTime: "Year round", tip: "Rolling tea estates. Carry a light rain jacket." },
    { id: 7, name: "Backwater Village Spin", region: "Kerala", km: 28, climb: 15, level: "Easy", bestTime: "Nov - Mar", tip: "Pancake flat. Ideal for relaxed rides and photography." },
    { id: 8, name: "Cauvery Riverside Trail", region: "Tiruchirappalli", km: 40, climb: 40, level: "Easy", bestTime: "Oct - Feb", tip: "Quiet village roads along the river. Watch for tractors." },
    { id: 9, name: "Coorg Coffee Country", region: "Karnataka", km: 90, climb: 1100, level: "Moderate", bestTime: "Oct - Mar", tip: "Winding roads through coffee estates. Good tyre grip matters in rain." },
  ];

  const favs = new Set<number>(load<number[]>("favs", []));
  const grid = $("#route-grid");
  const search = $("#search") as HTMLInputElement;
  const level = $("#level") as HTMLSelectElement;
  const sort = $("#sort") as HTMLSelectElement;
  const onlyFav = $("#only-fav") as HTMLInputElement;

  function levelClass(l: string): string {
    return l.toLowerCase();
  }

  function render(): void {
    const q = search.value.trim().toLowerCase();
    let list = routes.filter(
      (r) =>
        (!q || (r.name + " " + r.region).toLowerCase().includes(q)) &&
        (level.value === "All" || r.level === level.value) &&
        (!onlyFav.checked || favs.has(r.id))
    );
    if (sort.value === "km") list.sort((a, b) => a.km - b.km);
    if (sort.value === "climb") list.sort((a, b) => b.climb - a.climb);
    if (sort.value === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    $("#count").textContent = `${list.length} route${list.length === 1 ? "" : "s"} found`;
    if (!list.length) {
      grid.innerHTML = '<p class="empty">No routes match your filters. Try clearing the search.</p>';
      return;
    }
    grid.innerHTML = list
      .map(
        (r) =>
          `<article class="card route">` +
          `<div class="route-art ${levelClass(r.level)}"><svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 L30 35 L55 42 L90 15 L120 30 L150 8 L200 40 V60 H0Z"/></svg>` +
          `<span class="pill ${levelClass(r.level)}">${r.level}</span>` +
          `<button class="fav ${favs.has(r.id) ? "on" : ""}" data-fav="${r.id}" aria-label="Save ${esc(r.name)}" aria-pressed="${favs.has(r.id)}">${favs.has(r.id) ? "★" : "☆"}</button></div>` +
          `<div class="card-body"><h3>${esc(r.name)}</h3><p class="muted">${esc(r.region)}</p>` +
          `<ul class="facts"><li><b>${r.km}</b> km</li><li><b>${r.climb}</b> m climb</li></ul>` +
          `<button class="btn small" data-open="${r.id}">View details</button></div></article>`
      )
      .join("");
  }

  [search, level, sort, onlyFav].forEach((el) => el.addEventListener("input", render));
  $("#clear").addEventListener("click", () => {
    search.value = "";
    level.value = "All";
    sort.value = "default";
    onlyFav.checked = false;
    render();
  });

  const dialog = $("#route-dialog") as HTMLDialogElement;

  grid.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const favBtn = t.closest("[data-fav]") as HTMLElement | null;
    if (favBtn) {
      const id = Number(favBtn.dataset.fav);
      if (favs.has(id)) {
        favs.delete(id);
        toast("Removed from favourites");
      } else {
        favs.add(id);
        toast("Saved to favourites");
      }
      save("favs", Array.from(favs));
      render();
      return;
    }
    const openBtn = t.closest("[data-open]") as HTMLElement | null;
    if (openBtn) {
      const r = routes.find((x) => x.id === Number(openBtn.dataset.open));
      if (!r) return;
      const hours = r.km / (r.level === "Hard" ? 14 : r.level === "Moderate" ? 18 : 22);
      $("#dlg-title").textContent = r.name;
      $("#dlg-body").innerHTML =
        `<p class="muted">${esc(r.region)} · <span class="pill ${levelClass(r.level)}">${r.level}</span></p>` +
        `<div class="dlg-stats"><div><b>${r.km}</b><span>km</span></div><div><b>${r.climb}</b><span>m climb</span></div><div><b>${hours.toFixed(1)}</b><span>hrs (est.)</span></div></div>` +
        `<p><b>Best time:</b> ${esc(r.bestTime)}</p><p><b>Rider tip:</b> ${esc(r.tip)}</p>` +
        `<p class="note">Figures are approximate. Check the live route and weather before you go.</p>`;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
  });

  $("#dlg-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  render();
})();
