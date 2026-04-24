const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { createWriteStream } = require('fs');

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data');
const COVERS_DIR = path.join(__dirname, 'covers');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');

// Ensure directories exist
async function ensureDirs() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(COVERS_DIR, { recursive: true });
}

// Read books from JSON file
async function readBooks() {
    try {
        const data = await fs.readFile(BOOKS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        }
        throw err;
    }
}

// Write books to JSON file
async function writeBooks(books) {
    await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Download image from URL
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        
        client.get(url, { timeout: 30000 }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                downloadImage(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const writeStream = createWriteStream(filepath);
            response.pipe(writeStream);
            
            writeStream.on('finish', () => {
                writeStream.close();
                resolve(filepath);
            });
            
            writeStream.on('error', reject);
        }).on('error', reject);
    });
}

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use('/covers', express.static(COVERS_DIR));

// GET all books
app.get('/api/books', async (req, res) => {
    try {
        const books = await readBooks();
        res.json(books);
    } catch (err) {
        console.error('Error reading books:', err);
        res.status(500).json({ error: 'Failed to read books' });
    }
});

// GET single book
app.get('/api/books/:id', async (req, res) => {
    try {
        const books = await readBooks();
        const book = books.find(b => b.id === req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (err) {
        console.error('Error reading book:', err);
        res.status(500).json({ error: 'Failed to read book' });
    }
});

// POST create book
app.post('/api/books', async (req, res) => {
    try {
        const books = await readBooks();
        
        const book = {
            ...req.body,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Download cover image if URL provided
        if (book.cover && book.cover.startsWith('http')) {
            try {
                const ext = path.extname(new URL(book.cover).pathname) || '.jpg';
                const filename = `${book.id}${ext}`;
                const filepath = path.join(COVERS_DIR, filename);
                await downloadImage(book.cover, filepath);
                book.cover = `/covers/${filename}`;
            } catch (err) {
                console.error('Failed to download cover:', err);
                // Keep original URL if download fails
            }
        }
        
        books.unshift(book);
        await writeBooks(books);
        res.status(201).json(book);
    } catch (err) {
        console.error('Error creating book:', err);
        res.status(500).json({ error: 'Failed to create book' });
    }
});

// PUT update book
app.put('/api/books/:id', async (req, res) => {
    try {
        const books = await readBooks();
        const index = books.findIndex(b => b.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        const existing = books[index];
        
        // Delete old cover if changing
        if (req.body.cover !== existing.cover && existing.cover && existing.cover.startsWith('/covers/')) {
            try {
                const oldPath = path.join(__dirname, existing.cover);
                await fs.unlink(oldPath);
            } catch (err) {
                // Ignore errors deleting old cover
            }
        }
        
        // Download new cover if URL provided
        let cover = req.body.cover;
        if (cover && cover.startsWith('http')) {
            try {
                const ext = path.extname(new URL(cover).pathname) || '.jpg';
                const filename = `${existing.id}${ext}`;
                const filepath = path.join(COVERS_DIR, filename);
                await downloadImage(cover, filepath);
                cover = `/covers/${filename}`;
            } catch (err) {
                console.error('Failed to download cover:', err);
                // Keep original URL if download fails
            }
        }
        
        const updated = {
            ...existing,
            ...req.body,
            id: existing.id,
            cover,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString()
        };
        
        books[index] = updated;
        await writeBooks(books);
        res.json(updated);
    } catch (err) {
        console.error('Error updating book:', err);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// DELETE book
app.delete('/api/books/:id', async (req, res) => {
    try {
        const books = await readBooks();
        const book = books.find(b => b.id === req.params.id);
        
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        // Delete cover file if local
        if (book.cover && book.cover.startsWith('/covers/')) {
            try {
                const coverPath = path.join(__dirname, book.cover);
                await fs.unlink(coverPath);
            } catch (err) {
                // Ignore errors deleting cover
            }
        }
        
        const filtered = books.filter(b => b.id !== req.params.id);
        await writeBooks(filtered);
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting book:', err);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

// GET book count
app.get('/api/count', async (req, res) => {
    try {
        const books = await readBooks();
        res.json({ count: books.length });
    } catch (err) {
        console.error('Error counting books:', err);
        res.status(500).json({ error: 'Failed to count books' });
    }
});

// Start server
async function start() {
    await ensureDirs();
    app.listen(PORT, () => {
        console.log(`📚 BookTracker Server running at http://localhost:${PORT}`);
        console.log(`📁 Data: ${DATA_DIR}`);
        console.log(`🖼️  Covers: ${COVERS_DIR}`);
    });
}

start().catch(console.error);
