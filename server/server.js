require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/earnings',     require('./routes/earnings'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/mappings',     require('./routes/mappings'));
app.use('/api/export',       require('./routes/export'));

// Stats summary (lightweight, lives here)
const db = require('./db/database');
app.get('/api/stats', (req, res) => {
  const total    = db.prepare('SELECT COUNT(*) as c FROM transactions').get().c;
  const uncatd   = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE category = '' OR category IS NULL").get().c;
  const spend    = db.prepare('SELECT COALESCE(SUM(amount),0) as s FROM transactions').get().s;
  const sources  = db.prepare('SELECT DISTINCT payment FROM transactions').all().map(r => r.payment);
  const topCats  = db.prepare("SELECT category, COALESCE(SUM(amount),0) as total FROM transactions WHERE category != '' GROUP BY category ORDER BY total DESC LIMIT 5").all();
  res.json({ total, uncategorized: uncatd, totalSpend: spend, sources, topCategories: topCats });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`\n  Server  →  http://localhost:${PORT}\n`));
