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
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
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
        const icons   = { success: '✓', error: '✕', info: 'ℹ' };
        const container = document.getElementById('toastContainer');
        const toast   = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || ''}</span> ${esc(message)}`;
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
        document.getElementById('stat-rating').textContent = stats.avgRating
            ? `${stats.avgRating} ★` : '—';
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
                ${book.cover ? '' : '<span class="book-cover-placeholder">📖</span>'}
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
                <button class="card-action-btn" data-action="edit"   data-id="${book.id}">✏️ Edit</button>
                <button class="card-action-btn" data-action="status" data-id="${book.id}">🔄 Status</button>
                <button class="card-action-btn delete" data-action="delete" data-id="${book.id}">🗑️</button>
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
                    ${book.cover ? '' : '📖'}
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
                <h4>📝 Notes</h4>
                <p>${esc(book.notes)}</p>
            </div>` : ''}
            <div class="detail-actions">
                <button class="detail-btn edit"   data-action="edit"         data-id="${book.id}">✏️ Edit</button>
                <button class="detail-btn"         data-action="cycle-status" data-id="${book.id}">🔄 Change Status</button>
                <button class="detail-btn delete"  data-action="delete"       data-id="${book.id}">🗑️ Delete</button>
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