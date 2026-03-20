const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

// GET /api/categories  → { Food: ['Bars', 'Groceries', ...], ... }
router.get('/', (req, res) => {
  const rows   = db.prepare('SELECT category, sub_category FROM categories ORDER BY category, sub_category').all();
  const groups = {};
  rows.forEach(({ category, sub_category }) => {
    if (!groups[category]) groups[category] = [];
    groups[category].push(sub_category);
  });
  res.json(groups);
});

// POST /api/categories  — add a new category/sub-category pair
router.post('/', (req, res) => {
  const { category, subCategory } = req.body;
  if (!category?.trim() || !subCategory?.trim())
    return res.status(400).json({ error: 'category and subCategory are required' });
  db.prepare('INSERT OR IGNORE INTO categories (category, sub_category) VALUES (?, ?)').run(category.trim(), subCategory.trim());
  res.status(201).json({ ok: true });
});

// DELETE /api/categories  — remove a sub-category
router.delete('/', (req, res) => {
  const { category, subCategory } = req.body;
  if (!category || !subCategory) return res.status(400).json({ error: 'category and subCategory required' });
  db.prepare('DELETE FROM categories WHERE category = ? AND sub_category = ?').run(category, subCategory);
  res.json({ ok: true });
});

module.exports = router;
