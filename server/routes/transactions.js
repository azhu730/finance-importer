const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const db       = require('../db/database');
const { parseCSV }        = require('../services/csvParser');
const { categorizeBatch } = require('../services/categorizer');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/transactions
router.get('/', (req, res) => {
  const { page = 1, limit = 50, search = '', source = '', category = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = {};

  if (search) {
    conditions.push('("transaction" LIKE @s OR upstream_category LIKE @s OR category LIKE @s OR notes LIKE @s)');
    params.s = `%${search}%`;
  }
  if (source)   { conditions.push('payment = @source');    params.source = source; }
  if (category) { conditions.push('category = @category'); params.category = category; }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM transactions ${where}`).get(params).c;
  const rows  = db.prepare(`SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT @limit OFFSET @offset`)
                  .all({ ...params, limit: parseInt(limit), offset });

  res.json({ rows, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) || 1 });
});

// POST /api/transactions/upload
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    const userSource = req.body.source;
    if (!userSource) return res.status(400).json({ error: 'Source is required' });
    const { rows, source } = parseCSV(req.file.buffer, req.file.originalname, userSource);

    // Apply saved mappings
    const mappings = {};
    db.prepare('SELECT upstream_key, category, sub_category FROM category_mappings').all()
      .forEach(m => { mappings[m.upstream_key] = { category: m.category, subCategory: m.sub_category }; });

    const withMappings = rows.map(r => {
      const key     = (r.upstream_category || '').toLowerCase().trim();
      const mapping = mappings[key];
      return mapping ? { ...r, category: mapping.category, sub_category: mapping.subCategory } : r;
    });

    const insert = db.prepare(`
      INSERT OR IGNORE INTO transactions
        (id, date, "transaction", category, sub_category, amount, payment, upstream_category)
      VALUES
        (@id, @date, @transaction, @category, @sub_category, @amount, @payment, @upstream_category)
    `);
    db.transaction(() => withMappings.forEach(r => insert.run(r)))();

    res.json({ inserted: withMappings.length, source });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/transactions/categorize  — AI batch categorization
router.post('/categorize', async (req, res) => {
  try {
    const { ids = [] } = req.body;
    const rows = ids.length
      ? db.prepare(`SELECT * FROM transactions WHERE id IN (${ids.map(() => '?').join(',')}) AND (category = '' OR category IS NULL)`).all(...ids)
      : db.prepare("SELECT * FROM transactions WHERE (category = '' OR category IS NULL) LIMIT 150").all();

    if (!rows.length) return res.json({ categorized: 0 });

    const categories = db.prepare('SELECT category, sub_category FROM categories ORDER BY category, sub_category').all();
    const results    = await categorizeBatch(rows, categories);

    const update = db.prepare('UPDATE transactions SET category = ?, sub_category = ? WHERE id = ?');
    db.transaction(() => results.forEach(r => update.run(r.category, r.subCategory, r.id)))();

    res.json({ categorized: results.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/transactions/:id
router.patch('/:id', (req, res) => {
  const allowed = ['date', 'transaction', 'category', 'sub_category', 'amount', 'payment', 'notes', 'recurring_sub', 'upstream_category'];
  const fields  = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: 'No valid fields provided' });
  const set = fields.map(k => `${k === 'transaction' ? '"transaction"' : k} = @${k}`).join(', ');
  db.prepare(`UPDATE transactions SET ${set} WHERE id = @id`).run({ ...req.body, id: req.params.id });
  res.json({ ok: true });
});

// DELETE /api/transactions  — clear all (must be before /:id)
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM transactions').run();
  res.json({ ok: true });
});

// DELETE /api/transactions/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
