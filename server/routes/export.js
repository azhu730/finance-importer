const express = require('express');
const router  = express.Router();
const XLSX    = require('xlsx');
const db      = require('../db/database');

// GET /api/export  → downloads finance_import.xlsx
router.get('/', (req, res) => {
  const wb = XLSX.utils.book_new();

  // Transactions sheet
  const txHeaders = ['Date', 'Transaction', 'Category', 'Sub-Category', 'Amount', 'Payment', 'Notes', 'RecurringSub', 'UpstreamCategory'];
  const txRows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all()
    .map(r => [r.date, r.transaction, r.category, r.sub_category, r.amount, r.payment, r.notes, r.recurring_sub ? 'Yes' : 'No', r.upstream_category]);
  const txSheet = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  txSheet['!cols'] = [14, 32, 18, 20, 12, 14, 24, 14, 24].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

  // Earnings sheet
  const earnHeaders = ['Date', 'Description', 'Amount', 'Source', 'Notes'];
  const earnRows = db.prepare('SELECT * FROM earnings ORDER BY date DESC').all()
    .map(r => [r.date, r.description, r.amount, r.source, r.notes]);
  const earnSheet = XLSX.utils.aoa_to_sheet([earnHeaders, ...earnRows]);
  earnSheet['!cols'] = [14, 32, 14, 20, 32].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, earnSheet, 'Earnings');

  // Categories reference sheet
  const catRows = db.prepare('SELECT category, sub_category FROM categories ORDER BY category, sub_category').all()
    .map(r => [r.category, r.sub_category]);
  const catSheet = XLSX.utils.aoa_to_sheet([['Category', 'Sub-Category'], ...catRows]);
  catSheet['!cols'] = [{ wch: 18 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, catSheet, '_Categories');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="finance_import.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = router;
