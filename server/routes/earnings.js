const express = require('express');
const router  = express.Router();
const db      = require('../db/database');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// GET /api/earnings
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM earnings ORDER BY date DESC, created_at DESC').all());
});

// POST /api/earnings
router.post('/', (req, res) => {
  const { date = '', description = '', amount = 0, source = '', notes = '' } = req.body;
  const id = uid();
  db.prepare('INSERT INTO earnings (id, date, description, amount, source, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, date, description, parseFloat(amount) || 0, source, notes);
  res.status(201).json({ id });
});

// PATCH /api/earnings/:id
router.patch('/:id', (req, res) => {
  const allowed = ['date', 'description', 'amount', 'source', 'notes'];
  const fields  = Object.keys(req.body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: 'No valid fields provided' });
  const set = fields.map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE earnings SET ${set} WHERE id = @id`).run({ ...req.body, id: req.params.id });
  res.json({ ok: true });
});

// DELETE /api/earnings/:id
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM earnings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
