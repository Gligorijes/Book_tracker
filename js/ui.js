// =====================================================
//  ui.js — everything that touches the DOM
//  Pure render functions, no business logic.
// =====================================================

const UI = (() => {

    // ---- Tiny helpers ----

    function esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function stars(rating) {
        if (!rating) return '';
        const starSvg = '<svg class="star-filled" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        const emptyStar = '<svg class="star-empty" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        return starSvg.repeat(rating) + emptyStar.repeat(5 - rating);
    }

    function formatDate(str) {
        if (!str) return '—';
        return new Date(str).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    }

    function badgeClass(status) {
        const map = {
            reading:   'badge-reading',
            completed: 'badge-completed',
            planned:   'badge-planned',
            dropped:   'badge-dropped'
        };
        return map[status] || '';
    }

    // ---- Toast ----

    function showToast(message, type = 'success') {
        const icons   = { 
            success: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>', 
            error: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>', 
            info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' 
        };
        const container = document.getElementById('toastContainer');
        const toast   = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span> ${esc(message)}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ---- Sidebar counts ----

    function renderCounts(counts) {
        Object.keys(counts).forEach(key => {
            const el = document.getElementById(`count-${key}`);
            if (el) el.textContent = counts[key];
        });
    }

    // ---- Sidebar stats ----

    function renderStats(stats) {
        document.getElementById('stat-total').textContent  = stats.total;
        document.getElementById('stat-pages').textContent  = stats.pagesRead.toLocaleString();
        document.getElementById('stat-year').textContent   = stats.thisYear;
        const starIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align: middle; margin-left: 4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
        document.getElementById('stat-rating').innerHTML = stats.avgRating
            ? `${stats.avgRating} ${starIcon}` : '—';
    }

    // ---- Header ----

    const filterLabels = {
        all:       { title: 'All Books',          sub: 'Your complete library' },
        reading:   { title: 'Currently Reading',  sub: 'Books you\'re reading now' },
        completed: { title: 'Completed',           sub: 'Books you\'ve finished' },
        planned:   { title: 'Planned',             sub: 'Your reading wishlist' },
        dropped:   { title: 'Dropped',             sub: 'Books you gave up on' }
    };

    function renderHeader(filter) {
        const cfg = filterLabels[filter] || filterLabels.all;
        document.getElementById('headerTitle').textContent = cfg.title;
        document.getElementById('headerSub').textContent   = cfg.sub;
    }

    function renderNavActive(filter) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    // ---- Book grid ----

    function renderBooks(books) {
        const grid       = document.getElementById('booksGrid');
        const emptyState = document.getElementById('emptyState');

        grid.innerHTML = '';

        if (books.length === 0) {
            grid.style.display  = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display  = 'grid';
        emptyState.style.display = 'none';

        books.forEach((book, i) => {
            const card = buildCard(book, i);
            grid.appendChild(card);
        });
    }

    function buildCard(book, index) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.style.animationDelay = `${index * 0.045}s`;

        const coverStyle = book.cover
            ? `background-image: url('${esc(book.cover)}')`
            : '';

        card.innerHTML = `
            <div class="book-cover" style="${coverStyle}">
                ${book.cover ? '' : '<svg class="book-cover-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'}
                <span class="book-status-badge ${badgeClass(book.status)}">${book.status}</span>
            </div>
            <div class="book-info">
                <div class="book-title">${esc(book.title)}</div>
                <div class="book-author">by ${esc(book.author)}</div>
                <div class="book-meta">
                    ${book.genre  ? `<span class="book-genre-tag">${esc(book.genre)}</span>` : ''}
                    ${book.pages  ? `<span>${book.pages} pages</span>` : ''}
                    ${book.rating ? `<span class="book-rating">${stars(book.rating)}</span>` : ''}
                </div>
            </div>
            <div class="book-card-actions">
                <button class="card-action-btn" data-action="edit" data-id="${book.id}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                <button class="card-action-btn" data-action="status" data-id="${book.id}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></button>
                <button class="card-action-btn delete" data-action="delete" data-id="${book.id}" title="Delete"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
        `;

        return card;
    }

    // ---- Detail panel ----

    function renderDetail(book) {
        const coverClass = book.cover ? 'detail-cover has-cover' : 'detail-cover';
        const coverStyle = book.cover ? `background-image:url('${esc(book.cover)}')` : '';

        return `
            <div class="detail-top">
                <div class="${coverClass}" style="${coverStyle}">
                    ${book.cover ? '' : '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'}
                </div>
                <div class="detail-info">
                    <h2>${esc(book.title)}</h2>
                    <p class="detail-author">by ${esc(book.author)}</p>
                    <div class="detail-meta">
                        <div class="detail-meta-item">
                            <span class="meta-label">Status</span>
                            <span class="book-status-badge ${badgeClass(book.status)}">${book.status}</span>
                        </div>
                        ${book.genre ? `
                        <div class="detail-meta-item">
                            <span class="meta-label">Genre</span>
                            <span>${esc(book.genre)}</span>
                        </div>` : ''}
                        ${book.pages ? `
                        <div class="detail-meta-item">
                            <span class="meta-label">Pages</span>
                            <span>${book.pages.toLocaleString()}</span>
                        </div>` : ''}
                        ${book.rating ? `
                        <div class="detail-meta-item">
                            <span class="meta-label">Rating</span>
                            <span class="detail-rating">${stars(book.rating)}</span>
                        </div>` : ''}
                        ${book.startDate ? `
                        <div class="detail-meta-item">
                            <span class="meta-label">Started</span>
                            <span>${formatDate(book.startDate)}</span>
                        </div>` : ''}
                        ${book.endDate ? `
                        <div class="detail-meta-item">
                            <span class="meta-label">Finished</span>
                            <span>${formatDate(book.endDate)}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
            ${book.notes ? `
            <div class="detail-notes">
                <h4><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Notes</h4>
                <p>${esc(book.notes)}</p>
            </div>` : ''}
            <div class="detail-actions">
                <button class="detail-btn edit" data-action="edit" data-id="${book.id}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit</button>
                <button class="detail-btn" data-action="cycle-status" data-id="${book.id}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>Change Status</button>
                <button class="detail-btn delete" data-action="delete" data-id="${book.id}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Delete</button>
            </div>
        `;
    }

    // ---- Star rating widget ----

    function initStarWidget() {
        const stars  = document.querySelectorAll('#ratingInput .star');
        const hidden = document.getElementById('bookRating');

        stars.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const val = +star.dataset.value;
                stars.forEach(s => s.classList.toggle('hovered', +s.dataset.value <= val));
            });
            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hovered'));
            });
            star.addEventListener('click', () => {
                hidden.value = star.dataset.value;
                updateStars(+star.dataset.value);
            });
        });

        document.getElementById('ratingClear').addEventListener('click', () => {
            hidden.value = '0';
            updateStars(0);
        });
    }

    function updateStars(rating) {
        document.querySelectorAll('#ratingInput .star').forEach(s => {
            s.classList.toggle('active', +s.dataset.value <= rating);
        });
    }

    // Expose public surface
    return {
        showToast,
        renderCounts,
        renderStats,
        renderHeader,
        renderNavActive,
        renderBooks,
        renderDetail,
        initStarWidget,
        updateStars
    };
})();