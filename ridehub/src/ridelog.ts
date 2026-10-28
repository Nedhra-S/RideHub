/* RideHub - Ride Log: add / delete rides, live summary, CSV export */
(function () {
  const { $, esc, fmtDuration, toast } = RH;
  RH.init("ridelog");

  let rides: Ride[] = RH.getRides();

  const form = $("#ride-form") as HTMLFormElement;
  const dateEl = $("#r-date") as HTMLInputElement;
  const routeEl = $("#r-route") as HTMLInputElement;
  const kmEl = $("#r-km") as HTMLInputElement;
  const minsEl = $("#r-mins") as HTMLInputElement;
  const bikeEl = $("#r-bike") as HTMLSelectElement;
  const preview = $("#speed-preview");

  dateEl.value = RH.isoDaysAgo(0);
  dateEl.max = RH.isoDaysAgo(0);

  function updatePreview(): void {
    const km = Number(kmEl.value);
    const mins = Number(minsEl.value);
    preview.textContent = km > 0 && mins > 0 ? `Average speed: ${(km / (mins / 60)).toFixed(1)} km/h` : "Average speed will show here";
  }
  kmEl.addEventListener("input", updatePreview);
  minsEl.addEventListener("input", updatePreview);

  function setError(id: string, msg: string): void {
    $("#err-" + id).textContent = msg;
  }

  function validate(): boolean {
    let ok = true;
    setError("route", "");
    setError("km", "");
    setError("mins", "");
    if (routeEl.value.trim().length < 3) {
      setError("route", "Enter a route name (min 3 characters)");
      ok = false;
    }
    const km = Number(kmEl.value);
    if (!(km > 0 && km <= 500)) {
      setError("km", "Distance must be between 0.1 and 500 km");
      ok = false;
    }
    const mins = Number(minsEl.value);
    if (!(mins >= 5 && mins <= 1500)) {
      setError("mins", "Duration must be 5 - 1500 minutes");
      ok = false;
    }
    return ok;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    const ride: Ride = {
      id: Date.now(),
      date: dateEl.value || RH.isoDaysAgo(0),
      route: routeEl.value.trim(),
      km: Math.round(Number(kmEl.value) * 10) / 10,
      mins: Math.round(Number(minsEl.value)),
      bike: bikeEl.value,
    };
    rides.push(ride);
    RH.saveRides(rides);
    form.reset();
    dateEl.value = RH.isoDaysAgo(0);
    updatePreview();
    render();
    toast("Ride saved!");
  });

  function render(): void {
    const sorted = [...rides].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const km = rides.reduce((s, r) => s + r.km, 0);
    const mins = rides.reduce((s, r) => s + r.mins, 0);
    $("#sum-rides").textContent = String(rides.length);
    $("#sum-km").textContent = km.toFixed(1);
    $("#sum-time").textContent = fmtDuration(mins);
    $("#sum-best").textContent = rides.length ? Math.max(...rides.map((r) => r.km)) + " km" : "-";

    $("#log-body").innerHTML = sorted.length
      ? sorted
          .map(
            (r) =>
              `<tr><td>${r.date}</td><td>${esc(r.route)}</td><td>${esc(r.bike)}</td><td>${r.km} km</td><td>${fmtDuration(r.mins)}</td>` +
              `<td>${(r.km / (r.mins / 60)).toFixed(1)}</td>` +
              `<td><button class="link danger" data-del="${r.id}" aria-label="Delete ride on ${r.date}">Delete</button></td></tr>`
          )
          .join("")
      : '<tr><td colspan="7" class="empty">No rides yet. Add your first ride above!</td></tr>';
  }

  $("#log-body").addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-del]") as HTMLElement | null;
    if (!btn) return;
    rides = rides.filter((r) => r.id !== Number(btn.dataset.del));
    RH.saveRides(rides);
    render();
    toast("Ride deleted");
  });

  $("#export").addEventListener("click", () => {
    const rows = [["Date", "Route", "Bike", "Distance_km", "Duration_min"]].concat(
      rides.map((r) => [r.date, '"' + r.route.replace(/"/g, '""') + '"', r.bike, String(r.km), String(r.mins)])
    );
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ridehub-rides.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("CSV downloaded");
  });

  $("#reset").addEventListener("click", () => {
    if (confirm("Reset the log back to the demo rides?")) {
      try {
        localStorage.removeItem("ridehub.rides");
      } catch {
        /* ignore */
      }
      rides = RH.getRides();
      render();
      toast("Demo data restored");
    }
  });

  updatePreview();
  render();
})();
