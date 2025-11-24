/* TrueWay Places API Configuration */
const TRUEWAY_API_BASE_URL = "https://trueway-places.p.rapidapi.com/FindPlacesNearby";
const TRUEWAY_API_HOST = "trueway-places.p.rapidapi.com";

/* Cache Settings */
const CACHE_DURATION_MINUTES = 30;

/* localStorage Keys */
const LS_API_KEY = "truewayApiKey";
const LS_SAVED_RESOURCES = "savedResources";
const LS_CACHE_PREFIX = "communityCache_";
const LS_LOCATION = "community_location";

/* Default Search Settings */
const DEFAULT_RADIUS_METERS = 5000;
const DEFAULT_CATEGORY = "community services";
const DEFAULT_LOCATION = { lat: 37.783366, lng: -122.402325 };

/* Cache utility */
function getCache(key) {
    const cacheItem = localStorage.getItem(LS_CACHE_PREFIX + key);
    if (!cacheItem) return null;
    const parsed = JSON.parse(cacheItem);
    const now = new Date().getTime();
    if (now - parsed.timestamp > CACHE_DURATION_MINUTES * 60 * 1000) {
        localStorage.removeItem(LS_CACHE_PREFIX + key);
        return null;
    }
    return parsed.data;
}

function setCache(key, data) {
    const cacheItem = { timestamp: new Date().getTime(), data };
    localStorage.setItem(LS_CACHE_PREFIX + key, JSON.stringify(cacheItem));
}

function getApiKey() {
    return localStorage.getItem(LS_API_KEY);
}

function saveApiKey(key) {
    localStorage.setItem(LS_API_KEY, key);
}

function deleteApiKey() {
    localStorage.removeItem(LS_API_KEY);
}

function getStoredLocation() {
    const stored = localStorage.getItem(LS_LOCATION);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function saveLocation(lat, lng) {
    const location = { lat, lng };
    localStorage.setItem(LS_LOCATION, JSON.stringify(location));
    return location;
}