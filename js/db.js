// =====================================================
//  db.js — HTTP API wrapper for file-based storage
//  All database operations live here, nothing else
//  touches the database directly.
// =====================================================

const DB = (() => {
    const API_URL = ''; // Same origin

    // Helper: handle API responses
    async function handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        if (response.status === 204) {
            return null;
        }
        return response.json();
    }

    // ---- Public API ----

    function getAll() {
        return fetch(`${API_URL}/api/books`).then(handleResponse);
    }

    function getById(id) {
        return fetch(`${API_URL}/api/books/${id}`).then(handleResponse);
    }

    function create(data) {
        return fetch(`${API_URL}/api/books`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(handleResponse);
    }

    function update(id, data) {
        return fetch(`${API_URL}/api/books/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(handleResponse);
    }

    function remove(id) {
        return fetch(`${API_URL}/api/books/${id}`, {
            method: 'DELETE'
        }).then(handleResponse);
    }

    function count() {
        return fetch(`${API_URL}/api/count`)
            .then(handleResponse)
            .then(data => data.count);
    }

    // Expose only what the rest of the app needs
    return { getAll, getById, create, update, remove, count };
})();