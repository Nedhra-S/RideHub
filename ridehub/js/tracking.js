"use strict";

(function () {
    const $ = (selector) => document.querySelector(selector);

    if (window.RH && typeof window.RH.init === "function") {
        window.RH.init("tracking");
    }

    const status = $("#tracking-status");
    const bikeSelect = $("#bike-name");
    const saveButton = $("#save-location");
    const showButton = $("#show-last");
    const myLocationButton = $("#my-location");
    const workshopButton = $("#find-workshops");
    const lastLocationLink = $("#open-last");
    const workshopLink = $("#workshop-search");

    const STORAGE_KEY = "lastBikeLocation";

    let marker = null;

    // Initialize map centered on Vellore.
    const map = L.map("map").setView([12.9698, 79.1559], 13);

    // Map tiles that do not require a CARTO API key.
    L.tileLayer(
        "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        {
            subdomains: ["a", "b", "c"],
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors | Tiles: HOT'
        }
    ).addTo(map);

    // Ensure the map fits its container.
    function refreshMap() {
        setTimeout(function () {
            map.invalidateSize();
        }, 250);
    }

    window.addEventListener("load", refreshMap);
    window.addEventListener("resize", refreshMap);

    // Save and load locations.
    function saveLocation(point) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(point));
            return true;
        } catch (error) {
            console.error("Location saving failed:", error);
            return false;
        }
    }

    function loadLocation() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error("Location loading failed:", error);
            return null;
        }
    }

    // Display a location on the map.
    function showPoint(point, label) {
        if (
            !point ||
            !Number.isFinite(Number(point.lat)) ||
            !Number.isFinite(Number(point.lng))
        ) {
            status.textContent = "Invalid location data.";
            return;
        }

        const lat = Number(point.lat);
        const lng = Number(point.lng);

        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(label);

        map.setView([lat, lng], 16);
        marker.openPopup();

        refreshMap();
    }

    // Get the current GPS position.
    function getCurrentLocation(callback) {
        if (!navigator.geolocation) {
            status.textContent =
                "Your browser does not support location services.";
            return;
        }

        status.textContent =
            "Getting your location... Please allow GPS access.";

        navigator.geolocation.getCurrentPosition(
            function (position) {
                callback({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    at: new Date().toISOString()
                });
            },
            function (error) {
                const messages = {
                    1: "Location permission denied. Allow location access in your browser.",
                    2: "Your location is unavailable. Check your device location settings.",
                    3: "Location request timed out. Please try again."
                };

                status.textContent =
                    messages[error.code] ||
                    "Unable to get your current location.";
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            }
        );
    }

    // Create a link to the saved location.
    function updateLocationLink(point) {
        if (!lastLocationLink || !point) return;

        lastLocationLink.href =
            "https://www.openstreetmap.org/?mlat=" +
            point.lat +
            "&mlon=" +
            point.lng +
            "#map=17/" +
            point.lat +
            "/" +
            point.lng;

        lastLocationLink.hidden = false;
    }

    // SAVE CURRENT LOCATION
    saveButton.addEventListener("click", function () {
        getCurrentLocation(function (point) {
            point.bike = bikeSelect.value;

            if (!saveLocation(point)) {
                status.textContent =
                    "Could not save the location in browser storage.";
                return;
            }

            showPoint(point, "Last seen: " + point.bike);

            status.textContent =
                "Location saved for " +
                point.bike +
                " at " +
                new Date(point.at).toLocaleString();

            updateLocationLink(point);

            if (window.RH && typeof window.RH.toast === "function") {
                window.RH.toast("Last-seen location saved");
            }
        });
    });

    // SHOW LAST-SAVED LOCATION
    showButton.addEventListener("click", function () {
        const point = loadLocation();

        if (!point) {
            status.textContent =
                "No location saved yet. Press Save current location first.";
            return;
        }

        showPoint(point, "Last seen: " + point.bike);

        status.textContent =
            "Last seen: " +
            point.bike +
            " · " +
            new Date(point.at).toLocaleString();

        updateLocationLink(point);
    });

    // SHOW CURRENT LOCATION
    myLocationButton.addEventListener("click", function () {
        getCurrentLocation(function (point) {
            showPoint(point, "Your current location");

            status.textContent =
                "Current location: " +
                point.lat.toFixed(5) +
                ", " +
                point.lng.toFixed(5);
        });
    });

    // FIND NEARBY MOTORCYCLE WORKSHOPS
    workshopButton.addEventListener("click", function () {
        getCurrentLocation(function (point) {
            showPoint(point, "You are here");

            const query = encodeURIComponent(
                "motorcycle repair workshop near " +
                point.lat +
                "," +
                point.lng
            );

            const url =
                "https://www.openstreetmap.org/search?query=" + query;

            if (workshopLink) {
                workshopLink.href = url;
                workshopLink.hidden = false;
            }

            status.textContent =
                "Opening nearby workshop search results.";

            window.open(url, "_blank", "noopener");
        });
    });

    // Restore the previously saved location.
    const previousLocation = loadLocation();

    if (previousLocation) {
        status.textContent =
            "Last seen: " +
            previousLocation.bike +
            " · " +
            new Date(previousLocation.at).toLocaleString();

        updateLocationLink(previousLocation);

        showPoint(
            previousLocation,
            "Last seen: " + previousLocation.bike
        );
    }

    refreshMap();
})();