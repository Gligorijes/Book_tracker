// =====================================================
//  state.js — single source of truth for UI state
//  Books data comes from DB; filter/search/sort
//  lives here in memory.
// =====================================================

const State = (() => {
    let books         = [];   // in-memory copy of the DB
    let currentFilter = 'all';
    let searchQuery   = '';
    let sortBy        = 'newest';

    // ---- Getters ----

    function getBooks()         { return books; }
    function getCurrentFilter() { return currentFilter; }
    function getSearchQuery()   { return searchQuery; }
    function getSortBy()        { return sortBy; }

    // ---- Setters ----

    function setBooks(arr)          { books = arr; }
    function setFilter(f)           { currentFilter = f; }
    function setSearchQuery(q)      { searchQuery = q; }
    function setSortBy(s)           { sortBy = s; }

    // Sync in-memory array after a DB write
    function addBook(book)          { books.unshift(book); }
    function removeBook(id)         { books = books.filter(b => b.id !== id); }
    function replaceBook(updated)   {
        const i = books.findIndex(b => b.id === updated.id);
        if (i !== -1) books[i] = updated;
    }

    // ---- Derived data ----

    function getFiltered() {
        let result = [...books];

        if (currentFilter !== 'all') {
            result = result.filter(b => b.status === currentFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b =>
                b.title.toLowerCase().includes(q)  ||
                b.author.toLowerCase().includes(q) ||
                (b.genre && b.genre.toLowerCase().includes(q))
            );
        }

        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
            case 'title':
                result.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'title-desc':
                result.sort((a, b) => b.title.localeCompare(a.title)); break;
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            case 'pages':
                result.sort((a, b) => (b.pages || 0) - (a.pages || 0)); break;
        }

        return result;
    }

    function getCounts() {
        const counts = { all: books.length };
        ['reading', 'completed', 'planned', 'dropped'].forEach(s => {
            counts[s] = books.filter(b => b.status === s).length;
        });
        return counts;
    }

    function getStats() {
        const completed   = books.filter(b => b.status === 'completed');
        const currentYear = new Date().getFullYear();

        const pagesRead = books
            .filter(b => b.status === 'completed' || b.status === 'reading')
            .reduce((sum, b) => sum + (b.pages || 0), 0);

        const thisYear = completed.filter(b =>
            b.endDate && new Date(b.endDate).getFullYear() === currentYear
        ).length;

        const rated     = books.filter(b => b.rating > 0);
        const avgRating = rated.length
            ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1)
            : null;

        return { total: books.length, pagesRead, thisYear, avgRating };
    }

    return {
        getBooks, getCurrentFilter, getSearchQuery, getSortBy,
        setBooks, setFilter, setSearchQuery, setSortBy,
        addBook, removeBook, replaceBook,
        getFiltered, getCounts, getStats
    };
})();