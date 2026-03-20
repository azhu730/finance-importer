const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// GET /api/mappings  → { upstreams: [...], saved: { key: {category, subCategory} } }
router.get('/', (req, res) => {
  const upstreams = db.prepare(
    "SELECT DISTINCT upstream_category FROM transactions WHERE upstream_category != '' ORDER BY upstream_category"
  ).all().map(r => r.upstream_category);

  const saved = {};
  db.prepare('SELECT upstream_key, category, sub_category FROM category_mappings').all()
    .forEach(r => { saved[r.upstream_key] = { category: r.category, subCategory: r.sub_category }; });

  res.json({ upstreams, saved });
});

// PUT /api/mappings  — upsert one mapping rule + back-fill existing transactions
router.put('/', (req, res) => {
  const { upstreamKey, category, subCategory } = req.body;
  if (!upstreamKey) return res.status(400).json({ error: 'upstreamKey is required' });

  const key = upstreamKey.toLowerCase().trim();

  db.prepare(`
    INSERT INTO category_mappings (upstream_key, category, sub_category, updated_at)
    VALUES (@k, @c, @s, datetime('now'))
    ON CONFLICT(upstream_key) DO UPDATE SET category = @c, sub_category = @s, updated_at = datetime('now')
  `).run({ k: key, c: category, s: subCategory });

  // Back-fill transactions that match this upstream key
  db.prepare(
    "UPDATE transactions SET category = ?, sub_category = ? WHERE LOWER(TRIM(upstream_category)) = ?"
  ).run(category, subCategory, key);

  res.json({ ok: true });
});

// DELETE /api/mappings/:key  — remove a saved mapping rule
router.delete('/:key', (req, res) => {
  db.prepare('DELETE FROM category_mappings WHERE upstream_key = ?').run(req.params.key.toLowerCase().trim());
  res.json({ ok: true });
});

module.exports = router;
