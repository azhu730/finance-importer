const XLSX = require('xlsx');

// Column requirements per source
// Keys: actual column names in CSV (case-insensitive match)
// Values: normalized field names for processing
// Extra columns in CSV are ignored automatically
const SOURCE_CONFIGS = {
  AMEX: {
    columnMap: { 'Date': 'date', 'Description': 'transaction', 'Amount': 'amount', 'Category': 'upstream_category' }
    // Ignores: Post Date (and any other columns)
  },
  Venmo: {
    columnMap: { 'Datetime': 'date', 'Note': 'transaction', 'Amount (total)': 'amount' }
  },
  Discover: {
    columnMap: { 'Trans. Date': 'date', 'Description': 'transaction', 'Amount': 'amount', 'Category': 'upstream_category' }
  },
  'Wells Fargo': {
    positional: true, // Uses column positions instead of names
    positionalMap: { 0: 'date', 1: 'amount', 4: 'transaction' }
  }
};

function findColumnCaseInsensitive(headers, targetColumn) {
  return headers.find(h => (h || '').toLowerCase().trim() === targetColumn.toLowerCase().trim());
}

function excelDateToString(value) {
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const y = date.getUTCFullYear();
    return `${m}/${d}/${y}`;
  }
  if (value instanceof Date) {
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    const y = value.getUTCFullYear();
    return `${m}/${d}/${y}`;
  }
  return (value || '').toString().trim();
}

function parseAMEX(rows, headers) {
  const config = SOURCE_CONFIGS.AMEX;
  const colMap = {};
  
  // Find each required column (case-insensitive)
  for (const [csvCol, fieldName] of Object.entries(config.columnMap)) {
    const found = findColumnCaseInsensitive(headers, csvCol);
    if (!found) throw new Error(`AMEX format requires column "${csvCol}" but it was not found. Found columns: ${headers.join(', ')}`);
    colMap[fieldName] = found;  // Maps fieldName -> actual column name in CSV
  }

  return rows.map(row => {
    const date = (row[colMap.date] || '').trim();
    const transaction = (row[colMap.transaction] || '').trim();
    const amount = Math.abs(parseFloat((row[colMap.amount] || '0').toString().replace(/[$,\s]/g, '')) || 0);
    const upstream_category = (row[colMap.upstream_category] || '').trim();

    if (!date && !transaction) return null;
    if (transaction.toUpperCase() === 'MOBILE PAYMENT - THANK YOU') return null;
    return {
      id: generateId(),
      date,
      transaction,
      amount,
      payment: 'AMEX',
      upstream_category,
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function parseVenmo(rows, headers) {
  const config = SOURCE_CONFIGS.Venmo;
  const colMap = {};
  
  for (const [csvCol, fieldName] of Object.entries(config.columnMap)) {
    const found = findColumnCaseInsensitive(headers, csvCol);
    if (!found) throw new Error(`Venmo format requires column "${csvCol}" but it was not found. Found columns: ${headers.join(', ')}`);
    colMap[fieldName] = found;
  }

  return rows.map(row => {
    const datetime = row[colMap.date] || '';
    const date = datetime.split(' ')[0];
    const transaction = (row[colMap.transaction] || '').trim();
    const rawAmt = (row[colMap.amount] || '0').toString().replace(/[$,+\s]/g, '');
    const amount = Math.abs(parseFloat(rawAmt) || 0);

    if (!date && !transaction) return null;
    return {
      id: generateId(),
      date: date.trim(),
      transaction,
      amount,
      payment: 'Venmo',
      upstream_category: '',  // Always blank for Venmo
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function parseDiscover(rows, headers) {
  const config = SOURCE_CONFIGS.Discover;
  const colMap = {};
  
  for (const [csvCol, fieldName] of Object.entries(config.columnMap)) {
    const found = findColumnCaseInsensitive(headers, csvCol);
    if (!found) throw new Error(`Discover format requires column "${csvCol}" but it was not found. Found columns: ${headers.join(', ')}`);
    colMap[fieldName] = found;
  }

  return rows.map(row => {
    const date = excelDateToString(row[colMap.date]);
    const transaction = (row[colMap.transaction] || '').toString().trim();
    const upstream_category = (row[colMap.upstream_category] || '').toString().trim();
    const amount = Math.abs(parseFloat((row[colMap.amount] || '0').toString().replace(/[$,]/g, '')) || 0);

    const EXCLUDED_DESCRIPTIONS = [
      'INTERNET PAYMENT - THANK YOU',
      'CASHBACK BONUS REDEMPTION PYMT/STMT CRDT',
    ];
    if (!date && !transaction) return null;
    if (EXCLUDED_DESCRIPTIONS.includes(transaction.toUpperCase())) return null;
    return {
      id: generateId(),
      date,
      transaction,
      amount,
      payment: 'Discover',
      upstream_category,
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function parseWellsFargo(rows, headers) {
  const config = SOURCE_CONFIGS['Wells Fargo'];
  // Wells Fargo is positional; expect at least 5 columns
  if (headers.length < 5) {
    throw new Error(`Wells Fargo format expects at least 5 columns (Date, Amount, Description, ..., Description), but got ${headers.length}: ${headers.join(', ')}`);
  }

  return rows.map(row => {
    // Use column positions: 0=date, 1=amount, 4=transaction
    // Ignores columns at positions 2, 3, and any beyond 4
    const date = (row[headers[0]] || row.Date || '').trim();
    const amount = Math.abs(parseFloat((row[headers[1]] || row.Amount || '0').toString().replace(/[$,]/g, '')) || 0);
    const transaction = (row[headers[4]] || row[headers[2]] || row.Description || '').trim();

    if (!date && !transaction) return null;
    return {
      id: generateId(),
      date,
      transaction,
      amount,
      payment: 'Wells Fargo',
      upstream_category: '',
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function normalizeRow(raw, source) {
  // This function is deprecated; use source-specific parsers instead
  const keys = Object.keys(raw);
  let date = '', description = '', amount = 0, upstreamCategory = '';

  switch (source) {
    case 'AMEX':
      date             = raw['Date'] || raw['date'] || '';
      description      = raw['Description'] || raw['description'] || '';
      amount           = Math.abs(parseFloat((raw['Amount'] || '0').toString().replace(/[$,\s]/g, '')) || 0);
      upstreamCategory = raw['Category'] || raw['category'] || '';
      break;

    case 'Venmo': {
      const status = (raw['Status'] || '').toLowerCase();
      if (status && status !== 'complete') return null;
      date             = (raw['Datetime'] || '').split(' ')[0];
      description      = raw['Note'] || '';
      upstreamCategory = (raw['Type'] || '').toLowerCase();
      const rawAmt     = (raw['Amount (total)'] || raw['Amount'] || '0').toString().replace(/[$,+\s]/g, '');
      amount           = Math.abs(parseFloat(rawAmt) || 0);
      break;
    }

    case 'Discover':
      date             = raw['Trans. Date'] || raw['Trans Date'] || raw['Date'] || '';
      description      = raw['Description'] || raw['description'] || '';
      upstreamCategory = raw['Category'] || raw['category'] || '';
      amount           = Math.abs(parseFloat((raw['Amount'] || '0').toString().replace(/[$,]/g, '')) || 0);
      break;

    case 'Wells Fargo':
      date        = raw[keys[0]] || raw['Date'] || '';
      amount      = Math.abs(parseFloat((raw[keys[1]] || raw['Amount'] || '0').toString().replace(/[$,]/g, '')) || 0);
      description = raw[keys[4]] || raw[keys[2]] || raw['Description'] || '';
      break;

    default: {
      const dk = keys.find(k => /date/i.test(k))   || keys[0];
      const ak = keys.find(k => /amount|debit/i.test(k)) || keys[2];
      const tk = keys.find(k => /desc|name|note|memo/i.test(k)) || keys[1];
      const ck = keys.find(k => /categ/i.test(k));
      date             = raw[dk] || '';
      description      = raw[tk] || '';
      amount           = Math.abs(parseFloat((raw[ak] || '0').toString().replace(/[$,]/g, '')) || 0);
      upstreamCategory = ck ? (raw[ck] || '') : '';
    }
  }

  if (!date && !description) return null;

  return {
    id:               generateId(),
    date:             date.trim(),
    transaction:      description.trim(),
    amount,
    payment:          source,
    upstream_category: upstreamCategory.trim(),
    category:         '',
    sub_category:     '',
  };
}

function parseCSV(buffer, filename, userSource) {
  if (!userSource) throw new Error('Source is required (AMEX, Venmo, Discover, or Wells Fargo)');
  if (!SOURCE_CONFIGS[userSource]) {
    throw new Error(`Unknown source "${userSource}". Valid sources: AMEX, Venmo, Discover, Wells Fargo`);
  }

  if (userSource === 'Discover' && !filename.toLowerCase().endsWith('.csv')) {
    throw new Error('Discover only supports CSV files. Please export your statement as CSV.');
  }

  const isExcel = filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls');

  // Step 1: Read file into a workbook and worksheet
  let wb, ws;
  const fileHeader = buffer.slice(0, 5).toString('utf8').toLowerCase();
  const isHtmlDisguisedAsExcel = isExcel && fileHeader.startsWith('<html');
  if (isHtmlDisguisedAsExcel || !isExcel) {
    const text = buffer.toString('utf8');
    wb = XLSX.read(text, { type: 'string', raw: false });
  } else {
    wb = XLSX.read(buffer, { type: 'buffer' });
  }
  ws = wb.Sheets[wb.SheetNames[0]];

  // Step 2: Get all rows as raw arrays for header detection
  const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Step 3: Find the header row using source-specific column names
  const config = SOURCE_CONFIGS[userSource];
  const searchTerms = config.positional
    ? [] // Positional sources (Wells Fargo) have no named headers
    : Object.keys(config.columnMap).map(col => col.toLowerCase());

  console.log(`Raw rows count: ${rawRows.length}`);
  console.log(`Search terms for ${userSource}:`, searchTerms);
  let headerRow = 0;
  for (let i = 0; i < rawRows.length; i++) {
    const line = rawRows[i].map(v => (v || '').toString().toLowerCase()).join(',');
    if (searchTerms.length === 0) {
      if (line.trim()) { headerRow = i; break; }
    } else if (searchTerms.every(term => line.includes(term))) {
      headerRow = i;
      break;
    }
  }
  console.log(`Header row found at row ${headerRow + 1}`);

  // Step 4: Re-parse from the header row so headers become object keys
  const data = XLSX.utils.sheet_to_json(ws, { defval: '', range: headerRow });

  if (!data.length) throw new Error('No data rows found in file');

  const headers = Object.keys(data[0]);
  let rows;

  try {
    switch (userSource) {
      case 'AMEX':
        rows = parseAMEX(data, headers);
        break;
      case 'Venmo':
        rows = parseVenmo(data, headers);
        break;
      case 'Discover':
        rows = parseDiscover(data, headers);
        break;
      case 'Wells Fargo':
        rows = parseWellsFargo(data, headers);
        break;
      default:
        throw new Error(`Unsupported source: ${userSource}`);
    }
  } catch (e) {
    throw new Error(`Failed to parse ${userSource} format: ${e.message}`);
  }

  if (!rows.length) throw new Error(`No valid transactions found for ${userSource} format`);

  return { rows, source: userSource };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = { parseCSV };
