# 📚 BookTracker

A modern, fast, and privacy-focused personal library management application. Track your reading progress, organize your book collection, and discover insights about your reading habits — all stored locally in your browser.

![BookTracker Screenshot](screenshot.png)

## ✨ Features

- **📖 Book Management**: Add, edit, and delete books from your library
- **📊 Reading Status Tracking**: Organize books by status — All, Reading, Completed, Planned, or Dropped
- **🔍 Search & Sort**: Instantly search by title, author, or genre; sort by newest, oldest, rating, or page count
- **⭐ Rating System**: Rate books with a 5-star rating system
- **📈 Reading Statistics**: Track total books, pages read, books completed this year, and average rating
- **📝 Personal Notes**: Add notes, thoughts, and favorite quotes for each book
- **🖼️ Cover Images**: Add book covers via URL for visual organization
- **📅 Date Tracking**: Record start and end dates for reading sessions
- **🌙 Dark Theme**: Beautiful dark UI with modern design aesthetics
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **💾 Local Storage**: All data stored locally using IndexedDB — no server, no account required
- **⌨️ Keyboard Shortcuts**: `Ctrl+N` to add a new book, `Esc` to close modals

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or build process required — pure client-side application

### Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/yourusername/booktracker.git
   ```

2. Open `index.html` in your browser:
   - Double-click the file, or
   - Use a local development server (recommended):
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Node.js
     npx serve
     
     # PHP
     php -S localhost:8000
     ```

3. Visit `http://localhost:8000` in your browser

### Quick Start

The app comes with **sample data** pre-loaded on first launch. You can:
- Click any book card to view details
- Use the "Add Book" button to add your own books
- Filter by status using the sidebar navigation
- Search for books using the search box
- Sort books using the dropdown menu

## 🏗️ Architecture

BookTracker follows a **modular JavaScript architecture** with clear separation of concerns:

```
js/
├── db.js      # IndexedDB wrapper — all data persistence
├── state.js   # In-memory state management — filters, search, sort
├── ui.js      # DOM rendering — cards, stats, modals
├── modals.js  # Modal handling — forms, detail view
└── app.js     # Event wiring, business logic, initialization
```

### Data Model

Each book contains:
- `id` — Unique identifier
- `title`, `author` — Required book info
- `genre`, `pages` — Optional metadata
- `status` — `planned` | `reading` | `completed` | `dropped`
- `rating` — 0-5 stars
- `startDate`, `endDate` — Reading dates
- `cover` — URL to cover image
- `notes` — Personal notes
- `createdAt`, `updatedAt` — Timestamps

### Storage

- **IndexedDB** (`BookTrackerDB` v1) — Persistent browser storage
- **Object Store**: `books` with indexes on `status` and `createdAt`
- All data stays on your device — complete privacy

## 🎨 Design System

**Color Palette:**
- Primary: `#6c63ff` (Purple accent)
- Background: `#0f0f14` (Dark)
- Card: `#22222e` (Elevated)
- Text: `#e8e8ed` (Primary), `#9999aa` (Secondary)

**Status Colors:**
- Reading: Blue `#60a5fa`
- Completed: Green `#4ade80`
- Planned: Yellow `#fbbf24`
- Dropped: Red `#f87171`

**Typography:**
- Font: Inter (Google Fonts)
- Size Scale: 15px base, modular scale for headings

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | Add new book |
| `Esc` | Close modals |
| `Enter` | Submit forms |

## 📁 Project Structure

```
book_tracker/
├── index.html          # Main application entry
├── css/
│   └── styles.css      # All styles (1000+ lines)
├── js/
│   ├── db.js           # IndexedDB operations
│   ├── state.js        # State management
│   ├── ui.js           # UI rendering
│   ├── modals.js       # Modal controls
│   └── app.js          # App initialization & events
└── README.md           # This file
```

## 🔧 Customization

### Changing the Default Books

Edit the `seedIfEmpty()` function in `js/app.js`:

```javascript
const samples = [
    {
        title: 'Your Book Title',
        author: 'Author Name',
        genre: 'Fiction',
        pages: 300,
        status: 'planned',
        rating: 0,
        cover: 'https://example.com/cover.jpg',
        notes: 'Your notes here'
    }
    // Add more books...
];
```

### Adding Custom Genres

Edit the genre `<select>` in `index.html` (line ~125):

```html
<option>Your Custom Genre</option>
```

### Styling Changes

All CSS uses CSS custom properties (variables) at the top of `css/styles.css`:

```css
:root {
    --accent: #6c63ff;        /* Change primary color */
    --bg-primary: #0f0f14;   /* Change background */
    --radius: 12px;           /* Change border radius */
    /* ... */
}
```

## 🌐 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires IndexedDB support (all modern browsers).

## 📝 License

MIT License — free to use, modify, and distribute.

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Export/Import functionality
- Reading goal tracking
- Book cover image upload (currently URL-only)
- Reading session timer
- Multi-language support

## 🐛 Known Issues

- Cover images rely on external URLs — broken links show placeholder
- No sync between devices (by design — privacy-focused)
- Large libraries (>1000 books) may experience performance degradation

---

**Built with vanilla JavaScript, HTML, CSS, and ☕**