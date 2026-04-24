// =====================================================
//  app.js — init, event wiring, business logic
//  Depends on: DB, State, UI, Modals
// =====================================================

const STATUS_CYCLE = ['planned', 'reading', 'completed', 'dropped'];

// ---- Full re-render ----

function renderAll() {
    UI.renderBooks(State.getFiltered());
    UI.renderCounts(State.getCounts());
    UI.renderStats(State.getStats());
}

// ---- Business logic ----

async function handleSaveBook(e) {
    e.preventDefault();

    const data = Modals.readFormData();
    const id   = Modals.getEditingId();

    if (!data.title || !data.author) {
        UI.showToast('Please fill in title and author', 'error');
        return;
    }

    try {
        if (id) {
            const updated = await DB.update(id, data);
            State.replaceBook(updated);
            UI.showToast(`"${data.title}" updated!`);
        } else {
            const created = await DB.create(data);
            State.addBook(created);
            UI.showToast(`"${data.title}" added to your library!`);
        }

        Modals.closeBookForm();
        renderAll();

    } catch (err) {
        console.error(err);
        UI.showToast('Something went wrong. Try again.', 'error');
    }
}

async function handleDeleteBook(id) {
    const book = State.getBooks().find(b => b.id === id);
    if (!book) return;
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    try {
        await DB.remove(id);
        State.removeBook(id);
        Modals.closeDetail();
        renderAll();
        UI.showToast(`"${book.title}" deleted`, 'info');
    } catch (err) {
        console.error(err);
        UI.showToast('Could not delete book.', 'error');
    }
}

async function handleCycleStatus(id) {
    const book = State.getBooks().find(b => b.id === id);
    if (!book) return;

    const next    = STATUS_CYCLE[(STATUS_CYCLE.indexOf(book.status) + 1) % STATUS_CYCLE.length];
    const updates = { ...book, status: next };

    if (next === 'reading'   && !book.startDate)
        updates.startDate = new Date().toISOString().split('T')[0];
    if (next === 'completed' && !book.endDate)
        updates.endDate   = new Date().toISOString().split('T')[0];

    try {
        const updated = await DB.update(id, updates);
        State.replaceBook(updated);
        renderAll();
        UI.showToast(`"${book.title}" → ${next}`);

        // Refresh detail view if it's open for this book
        if (document.getElementById('detailModal').classList.contains('open')) {
            Modals.openDetail(updated);
        }
    } catch (err) {
        console.error(err);
        UI.showToast('Could not update status.', 'error');
    }
}

// ---- Filter / search / sort ----

function handleFilterChange(filter) {
    State.setFilter(filter);
    UI.renderHeader(filter);
    UI.renderNavActive(filter);
    renderAll();
}

// ---- Event wiring ----

function wireEvents() {
    // Add book buttons
    document.getElementById('btnAdd').addEventListener('click',
        () => Modals.openBookForm());
    document.getElementById('btnAddEmpty').addEventListener('click',
        () => Modals.openBookForm());

    // Book form
    document.getElementById('bookForm').addEventListener('submit', handleSaveBook);
    document.getElementById('modalClose').addEventListener('click', Modals.closeBookForm);
    document.getElementById('btnCancel').addEventListener('click',  Modals.closeBookForm);

    // Detail modal
    document.getElementById('detailClose').addEventListener('click', Modals.closeDetail);

    // Click outside modal to close
    document.getElementById('bookModal').addEventListener('click', e => {
        if (e.target === document.getElementById('bookModal')) Modals.closeBookForm();
    });
    document.getElementById('detailModal').addEventListener('click', e => {
        if (e.target === document.getElementById('detailModal')) Modals.closeDetail();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { Modals.closeBookForm(); Modals.closeDetail(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); Modals.openBookForm(); }
    });

    // Nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleFilterChange(btn.dataset.filter);
            if (window.innerWidth <= 900) toggleSidebar();
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', e => {
        State.setSearchQuery(e.target.value);
        renderAll();
    });

    // Sort
    document.getElementById('sortSelect').addEventListener('change', e => {
        State.setSortBy(e.target.value);
        renderAll();
    });

    // Card action buttons (delegated)
    document.getElementById('booksGrid').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        e.stopPropagation();

        const { action, id } = btn.dataset;
        if (action === 'edit') {
            const book = State.getBooks().find(b => b.id === id);
            Modals.openBookForm(book);
        }
        if (action === 'status') handleCycleStatus(id);
        if (action === 'delete') handleDeleteBook(id);
    });

    // Card click → detail
    document.getElementById('booksGrid').addEventListener('click', e => {
        if (e.target.closest('.book-card-actions')) return;
        const card = e.target.closest('.book-card');
        if (!card) return;
        const id   = card.querySelector('[data-id]')?.dataset.id;
        if (!id)   return;
        const book = State.getBooks().find(b => b.id === id);
        if (book)  Modals.openDetail(book);
    });

    // Detail actions (delegated)
    document.getElementById('detailContent').addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const { action, id } = btn.dataset;
        if (action === 'edit') {
            Modals.closeDetail();
            const book = State.getBooks().find(b => b.id === id);
            setTimeout(() => Modals.openBookForm(book), 200);
        }
        if (action === 'cycle-status') handleCycleStatus(id);
        if (action === 'delete')       handleDeleteBook(id);
    });

    // Mobile sidebar
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
}

// ---- Mobile sidebar ----

let sidebarOverlay = null;

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');

    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    sidebarOverlay.classList.toggle('active', sidebar.classList.contains('open'));
}

// ---- Sample data (only if library is empty) ----

async function seedIfEmpty() {
    const total = await DB.count();
    if (total > 0) return;

    const samples = [
        {
            title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', pages: 688,
            status: 'completed', rating: 5, startDate: '2024-01-10', endDate: '2024-02-15',
            cover: 'https://covers.openlibrary.org/b/id/12467202-L.jpg',
            notes: 'An absolute masterpiece. The world-building is unparalleled.'
        },
        {
            title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Sci-Fi', pages: 496,
            status: 'completed', rating: 5, startDate: '2024-03-01', endDate: '2024-03-20',
            cover: 'https://covers.openlibrary.org/b/id/10590669-L.jpg',
            notes: 'Fun, gripping, and surprisingly emotional.'
        },
        {
            title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', pages: 320,
            status: 'completed', rating: 4, startDate: '2024-04-05', endDate: '2024-04-18',
            cover: 'https://covers.openlibrary.org/b/id/12645114-L.jpg',
            notes: 'Practical and well-written. The 1% improvement concept stuck with me.'
        },
        {
            title: 'The Way of Kings', author: 'Brandon Sanderson', genre: 'Fantasy', pages: 1007,
            status: 'reading', rating: 0, startDate: '2025-01-05',
            cover: 'https://covers.openlibrary.org/b/id/8550598-L.jpg',
            notes: 'Currently on chapter 40. The magic system is incredible.'
        },
        {
            title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', pages: 443,
            status: 'reading', rating: 0, startDate: '2025-01-15',
            cover: 'https://covers.openlibrary.org/b/id/8479576-L.jpg',
        },
        {
            title: 'Neuromancer', author: 'William Gibson', genre: 'Sci-Fi', pages: 271,
            status: 'planned', rating: 0,
            cover: 'https://covers.openlibrary.org/b/id/12746288-L.jpg',
            notes: 'Recommended by a friend. Classic cyberpunk.'
        },
        {
            title: 'Infinite Jest', author: 'David Foster Wallace', genre: 'Fiction', pages: 1079,
            status: 'dropped', rating: 2, startDate: '2024-06-01',
            cover: 'https://covers.openlibrary.org/b/id/12889189-L.jpg',
            notes: 'Got 300 pages in. Too dense for me right now. Maybe later.'
        }
    ];

    for (const s of samples) {
        const book = await DB.create(s);
        State.addBook(book);
    }
}

// ---- Boot ----

async function init() {
    try {
        UI.initStarWidget();
        wireEvents();

        const books = await DB.getAll();
        State.setBooks(books);

        await seedIfEmpty();

        renderAll();
    } catch (err) {
        console.error('Failed to start BookTracker:', err);
    }
}

document.addEventListener('DOMContentLoaded', init);