// =====================================================
//  modals.js — open / close / populate modals
//  Depends on: UI, State
// =====================================================

const Modals = (() => {

    // ---- Book form modal ----

    function openBookForm(book = null) {
        const form = document.getElementById('bookForm');
        form.reset();
        document.getElementById('bookRating').value = '0';
        UI.updateStars(0);

        if (book) {
            document.getElementById('modalTitle').textContent  = 'Edit Book';
            document.getElementById('bookId').value            = book.id;
            document.getElementById('bookTitle').value         = book.title;
            document.getElementById('bookAuthor').value        = book.author;
            document.getElementById('bookGenre').value         = book.genre    || '';
            document.getElementById('bookPages').value         = book.pages    || '';
            document.getElementById('bookStatus').value        = book.status;
            document.getElementById('bookStart').value         = book.startDate || '';
            document.getElementById('bookEnd').value           = book.endDate  || '';
            document.getElementById('bookCover').value         = book.cover    || '';
            document.getElementById('bookNotes').value         = book.notes    || '';
            document.getElementById('bookRating').value        = book.rating   || 0;
            UI.updateStars(book.rating || 0);
        } else {
            document.getElementById('modalTitle').textContent  = 'Add New Book';
            document.getElementById('bookId').value            = '';
        }

        document.getElementById('bookModal').classList.add('open');
        setTimeout(() => document.getElementById('bookTitle').focus(), 100);
    }

    function closeBookForm() {
        document.getElementById('bookModal').classList.remove('open');
    }

    // ---- Detail modal ----

    function openDetail(book) {
        document.getElementById('detailContent').innerHTML = UI.renderDetail(book);
        document.getElementById('detailModal').classList.add('open');
    }

    function closeDetail() {
        document.getElementById('detailModal').classList.remove('open');
    }

    // ---- Read form values ----

    function readFormData() {
        return {
            title:     document.getElementById('bookTitle').value.trim(),
            author:    document.getElementById('bookAuthor').value.trim(),
            genre:     document.getElementById('bookGenre').value,
            pages:     parseInt(document.getElementById('bookPages').value) || null,
            status:    document.getElementById('bookStatus').value,
            startDate: document.getElementById('bookStart').value  || null,
            endDate:   document.getElementById('bookEnd').value    || null,
            cover:     document.getElementById('bookCover').value.trim()  || null,
            notes:     document.getElementById('bookNotes').value.trim()  || null,
            rating:    parseInt(document.getElementById('bookRating').value) || 0
        };
    }

    function getEditingId() {
        return document.getElementById('bookId').value || null;
    }

    return { openBookForm, closeBookForm, openDetail, closeDetail, readFormData, getEditingId };
})();