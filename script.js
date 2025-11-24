/**
 * script.js
 * Main application logic for Community Support Finder App.
 */

document.addEventListener("DOMContentLoaded", () => {

    /* DOM Elements */
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const mainApp = document.getElementById("mainApp");
    const authContainer = document.getElementById("authContainer");
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const radiusInput = document.getElementById("radiusInput");
    const categoryInput = document.getElementById("categoryInput");
    const resultsContainer = document.getElementById("resultsContainer");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
    const saveButtonClass = "save-btn";

    const statResults = document.getElementById("statResults");
    const statSaved = document.getElementById("statSaved");
    const statCategory = document.getElementById("statCategory");
    const statCache = document.getElementById("statCache");

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const showRegisterLink = document.getElementById("showRegisterLink");
    const showLoginLink = document.getElementById("showLoginLink");

    const showSearchResults = document.getElementById("showSearchResults");
    const showSavedResults = document.getElementById("showSavedResults");
    const sortSelect = document.getElementById("sortSelect");

    const mapModal = document.getElementById("mapModal");
    const closeMapModal = document.getElementById("closeMapModal");
    const mapModalTitle = document.getElementById("mapModalTitle");

    const useLocationBtn = document.getElementById("useLocationBtn");
    const locationInput = document.getElementById("locationInput");
    const saveLocationBtn = document.getElementById("saveLocationBtn");
    const locationDisplay = document.getElementById("locationDisplay");
    const presetLocationSelect = document.getElementById("presetLocationSelect");

    /* State Management */
    let currentView = "search"; // "search" or "saved"
    let currentSearchResults = [];
    let currentDisplayResults = [];
    let leafletMap = null;
    let currentLocation = DEFAULT_LOCATION;

    /* Category Mapping */
    const CATEGORY_MAP = {
        "food": "restaurant",
        "shelter": "lodging",
        "health": "hospital",
        "education": "school",
        "legal": "courthouse",
        "community services": ""
    };

    /* Initialize Location on Load */
    function initializeLocation() {
        const stored = getStoredLocation();
        if (stored && stored.lat && stored.lng) {
            currentLocation = stored;
            updateLocationDisplay(stored.lat, stored.lng);
        } else {
            updateLocationDisplay(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
        }
    }

    function updateLocationDisplay(lat, lng) {
        locationDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    /* Preset Location Selection */
    presetLocationSelect.addEventListener("change", (e) => {
        const value = e.target.value;
        if (!value) return;

        const parts = value.split(",").map(p => p.trim());
        if (parts.length !== 2) return;

        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        if (isNaN(lat) || isNaN(lng)) return;

        currentLocation = saveLocation(lat, lng);
        updateLocationDisplay(lat, lng);
        if (locationInput) {
            locationInput.value = "";
        }
        
        // Reset dropdown to default
        presetLocationSelect.value = "";
    });

    /* Use Device Location */
    useLocationBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        useLocationBtn.textContent = "📍 Getting Location...";
        useLocationBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                currentLocation = saveLocation(lat, lng);
                updateLocationDisplay(lat, lng);
                useLocationBtn.textContent = "📍 Use My Location";
                useLocationBtn.disabled = false;
                alert("Location updated successfully!");
            },
            (error) => {
                useLocationBtn.textContent = "📍 Use My Location";
                useLocationBtn.disabled = false;
                let errorMsg = "Unable to retrieve your location.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMsg = "Location access denied. Please enable location permissions.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMsg = "Location information is unavailable.";
                } else if (error.code === error.TIMEOUT) {
                    errorMsg = "Location request timed out.";
                }
                alert(errorMsg);
            }
        );
    });

    /* Save Manual Location */
    saveLocationBtn.addEventListener("click", () => {
        const input = locationInput.value.trim();
        if (!input) {
            alert("Please enter a location in the format: lat,lng");
            return;
        }

        const parts = input.split(",").map(p => p.trim());
        if (parts.length !== 2) {
            alert("Invalid format. Please use: lat,lng (e.g., 37.7749,-122.4194)");
            return;
        }

        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        if (isNaN(lat) || isNaN(lng)) {
            alert("Invalid coordinates. Please enter valid numbers.");
            return;
        }

        if (lat < -90 || lat > 90) {
            alert("Latitude must be between -90 and 90.");
            return;
        }

        if (lng < -180 || lng > 180) {
            alert("Longitude must be between -180 and 180.");
            return;
        }

        currentLocation = saveLocation(lat, lng);
        updateLocationDisplay(lat, lng);
        locationInput.value = "";
        alert("Location saved successfully!");
    });

    /* Pre-login: Switch Forms */
    showRegisterLink.addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
    });

    showLoginLink.addEventListener("click", e => {
        e.preventDefault();
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
    });

    /* Authentication */
    function showMainApp() {
        authContainer.style.display = "none";
        mainApp.style.display = "block";
        initializeLocation();
        updateSavedCount();
    }

    loginBtn.addEventListener("click", () => {
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value.trim();
        if (!email || !password) return alert("Fill in all fields");
        showMainApp();
    });

    registerBtn.addEventListener("click", () => {
        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value.trim();
        if (!name || !email || !password) return alert("Fill in all fields");
        showMainApp();
    });

    function logout() {
        mainApp.style.display = "none";
        authContainer.style.display = "flex";
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
    }
    window.logout = logout;

    /* API Key Save */
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener("click", () => {
            const key = apiKeyInput.value.trim();
            if (!key) return alert("API key cannot be empty.");
            saveApiKey(key);
            alert("API key saved successfully!");
        });
    }

    /* Fetch Resources */
    async function fetchResources(query, radius, category) {
        const loc = currentLocation;
        const cacheKey = `${query}_${radius}_${category}_${loc.lat}_${loc.lng}`;
        const cachedData = getCache(cacheKey);
        if (cachedData) {
            statCache.textContent = "Cached ✓";
            return cachedData;
        }

        statCache.textContent = "Fetching...";
        const apiKey = getApiKey();
        if (!apiKey) {
            alert("Please enter your TrueWay API key.");
            return [];
        }

        const url = new URL(TRUEWAY_API_BASE_URL);
        url.searchParams.append("location", `${loc.lat},${loc.lng}`);
        url.searchParams.append("radius", radius);
        if (category) url.searchParams.append("type", category);
        url.searchParams.append("language", "en");

        try {
            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": apiKey,
                    "X-RapidAPI-Host": TRUEWAY_API_HOST
                }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const results = data.results || [];
            setCache(cacheKey, results);
            statCache.textContent = "Active ✓";
            return results;
        } catch (error) {
            console.error("API fetch error:", error);
            statCache.textContent = "Error ❌";
            return [];
        }
    }

    /* Sort Resources */
    function sortResources(resources, sortType) {
        const sorted = [...resources];
        if (sortType === "az") {
            sorted.sort((a, b) => {
                const nameA = (a.name || "").toLowerCase();
                const nameB = (b.name || "").toLowerCase();
                return nameA.localeCompare(nameB);
            });
        } else if (sortType === "za") {
            sorted.sort((a, b) => {
                const nameA = (a.name || "").toLowerCase();
                const nameB = (b.name || "").toLowerCase();
                return nameB.localeCompare(nameA);
            });
        }
        return sorted;
    }

    /* Display Results */
    function displayResults(resources, categoryInputValue = "All") {
        resultsContainer.innerHTML = "";
        currentDisplayResults = resources;

        if (currentView === "search") {
            statResults.textContent = resources.length;
            statCategory.textContent = categoryInputValue || "All";
        } else {
            statResults.textContent = resources.length;
            statCategory.textContent = "Saved";
        }

        if (!resources.length) {
            resultsContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 20px; font-size: 1.1rem;">No ${currentView === "saved" ? "saved" : ""} resources found.</p>`;
            return;
        }

        resources.forEach(resource => {
            const card = document.createElement("div");
            card.className = "resource-card";

            const name = resource.name || "No Name";
            const address = resource.address || resource.formatted_address || "No Address";
            const phone = resource.phone_number || resource.formatted_phone_number || "";
            const website = resource.website || "";
            const lat = resource.location?.lat || resource.lat;
            const lng = resource.location?.lng || resource.lng;

            const savedResources = JSON.parse(localStorage.getItem(LS_SAVED_RESOURCES) || "[]");
            const isSaved = savedResources.some(r => r.place_id === resource.place_id);

            let cardHTML = `<h3>${name}</h3>`;

            if (website) {
                cardHTML += `<p><span class="info-label">Website:</span> <a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a></p>`;
            }

            if (phone) {
                cardHTML += `<p><span class="info-label">Phone:</span> ${phone}</p>`;
            }

            cardHTML += `<p><span class="info-label">Address:</span> ${address}</p>`;

            cardHTML += `<div class="card-actions">`;

            if (currentView === "search") {
                cardHTML += `<button class="${saveButtonClass}" data-id="${resource.place_id}" ${isSaved ? "disabled" : ""}>
                    ${isSaved ? "Saved ✓" : "Save 💾"}
                </button>`;
            } else {
                cardHTML += `<button class="remove-btn" data-id="${resource.place_id}">Remove 🗑️</button>`;
            }

            if (lat && lng) {
                cardHTML += `<button class="map-btn" data-lat="${lat}" data-lng="${lng}" data-name="${name}">View Map 🗺️</button>`;
            }

            cardHTML += `</div>`;

            card.innerHTML = cardHTML;
            resultsContainer.appendChild(card);
        });
        updateSavedCount();
    }

    function updateSavedCount() {
        const savedResources = JSON.parse(localStorage.getItem(LS_SAVED_RESOURCES) || "[]");
        statSaved.textContent = savedResources.length;
    }

    function saveResource(placeId) {
        const savedResources = JSON.parse(localStorage.getItem(LS_SAVED_RESOURCES) || "[]");
        const resource = currentSearchResults.find(r => r.place_id === placeId);

        if (!resource) return;

        const saveData = {
            place_id: placeId,
            name: resource.name || "No Name",
            address: resource.formatted_address || "No Address",
            phone_number: resource.formatted_phone_number || "",
            website: resource.website || "",
            lat: resource.location?.lat || resource.lat,
            lng: resource.location?.lng || resource.lng
        };

        savedResources.push(saveData);
        localStorage.setItem(LS_SAVED_RESOURCES, JSON.stringify(savedResources));

        const btn = document.querySelector(`[data-id="${placeId}"].${saveButtonClass}`);
        if (btn) {
            btn.textContent = "Saved ✓";
            btn.disabled = true;
        }
        updateSavedCount();
    }

    function removeResource(placeId) {
        let savedResources = JSON.parse(localStorage.getItem(LS_SAVED_RESOURCES) || "[]");
        savedResources = savedResources.filter(r => r.place_id !== placeId);
        localStorage.setItem(LS_SAVED_RESOURCES, JSON.stringify(savedResources));
        updateSavedCount();
        showSavedResourcesView();
    }

    /* View Toggle */
    function showSearchResultsView() {
        currentView = "search";
        showSearchResults.classList.add("active");
        showSavedResults.classList.remove("active");
        const sortType = sortSelect.value;
        const sorted = sortResources(currentSearchResults, sortType);
        displayResults(sorted, categoryInput.value || "All");
    }

    function showSavedResourcesView() {
        currentView = "saved";
        showSavedResults.classList.add("active");
        showSearchResults.classList.remove("active");
        const savedResources = JSON.parse(localStorage.getItem(LS_SAVED_RESOURCES) || "[]");
        const sortType = sortSelect.value;
        const sorted = sortResources(savedResources, sortType);
        displayResults(sorted, "Saved");
    }

    showSearchResults.addEventListener("click", showSearchResultsView);
    showSavedResults.addEventListener("click", showSavedResourcesView);

    /* Sort Event */
    sortSelect.addEventListener("change", () => {
        const sortType = sortSelect.value;
        const sorted = sortResources(currentDisplayResults, sortType);
        displayResults(sorted, currentView === "saved" ? "Saved" : (categoryInput.value || "All"));
    });

    /* Event Listeners */
    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const query = searchInput.value.trim() || DEFAULT_CATEGORY;
        let radius = parseInt(radiusInput.value) || DEFAULT_RADIUS_METERS;
        radius = Math.min(Math.max(radius, 1), 10000);

        const categoryInputValue = categoryInput.value.trim().toLowerCase();
        const categoryType = CATEGORY_MAP[categoryInputValue] || "";

        const results = await fetchResources(query, radius, categoryType);
        currentSearchResults = results;

        // Switch to search results view
        currentView = "search";
        showSearchResults.classList.add("active");
        showSavedResults.classList.remove("active");

        const sortType = sortSelect.value;
        const sorted = sortResources(results, sortType);
        displayResults(sorted, categoryInputValue);
    });

    resultsContainer.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains(saveButtonClass)) {
            const placeId = e.target.dataset.id;
            saveResource(placeId);
        }

        if (e.target && e.target.classList.contains("remove-btn")) {
            const placeId = e.target.dataset.id;
            removeResource(placeId);
        }

        if (e.target && e.target.classList.contains("map-btn")) {
            const lat = parseFloat(e.target.dataset.lat);
            const lng = parseFloat(e.target.dataset.lng);
            const name = e.target.dataset.name;
            openMapModal(lat, lng, name);
        }
    });

    /* Map Modal */
    function openMapModal(lat, lng, name) {
        mapModalTitle.textContent = name || "Location Map";
        mapModal.classList.remove("hidden");

        setTimeout(() => {
            if (leafletMap) {
                leafletMap.remove();
            }

            leafletMap = L.map('map').setView([lat, lng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(leafletMap);

            L.marker([lat, lng]).addTo(leafletMap)
                .bindPopup(name || "Location")
                .openPopup();
        }, 100);
    }

    closeMapModal.addEventListener("click", () => {
        mapModal.classList.add("hidden");
        if (leafletMap) {
            leafletMap.remove();
            leafletMap = null;
        }
    });

    mapModal.addEventListener("click", (e) => {
        if (e.target === mapModal) {
            mapModal.classList.add("hidden");
            if (leafletMap) {
                leafletMap.remove();
                leafletMap = null;
            }
        }
    });
});