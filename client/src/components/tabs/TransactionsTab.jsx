import { useState, useCallback, useEffect } from 'react';
import {
  Input, Select, Button, Spinner, Text,
  Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell,
  TableCellLayout, Tooltip, makeStyles, tokens,
} from '@fluentui/react-components';
import { ArrowSortRegular, CheckmarkCircleRegular, CircleRegular } from '@fluentui/react-icons';
import { useTransactions } from '../../hooks/useTransactions.js';
import { useCategories } from '../../hooks/useCategories.js';
import { patchTransaction } from '../../api/client.js';
import SourceBadge from '../shared/SourceBadge.jsx';
import ExcludedTransactionsModal from '../ExcludedTransactionsModal.jsx';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
    padding: '8px 20px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  spacer: { flex: 1 },
  tableWrap: {
    flex: 1, overflow: 'auto', padding: '16px 20px',
  },
  tableCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    overflow: 'hidden',
    boxShadow: tokens.shadow4,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: '8px', color: tokens.colorNeutralForeground3,
    padding: '60px 40px', textAlign: 'center',
  },
  emptyIcon: { fontSize: '40px', opacity: 0.4, marginBottom: '8px' },
  pg: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 20px', backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  pgBtn: {
    minWidth: 0, padding: '2px 10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: 'none', cursor: 'pointer', fontSize: tokens.fontSizeBase200,
  },
  pgBtnActive: {
    backgroundColor: tokens.colorBrandBackground,
    borderColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
});

function InlineSelect({ value, options, onChange, placeholder = '—' }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{
        border: 'none', background: 'transparent', width: '100%',
        fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', padding: 0,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TransactionRow({ row, catGroups, catNames, onPatch }) {
  const subOpts = row.category ? (catGroups[row.category] || []) : [];

  return (
    <TableRow>
      <TableCell>
        <Text size={200}>{row.date}</Text>
      </TableCell>
      <TableCell>
        <input
          defaultValue={row.transaction}
          onBlur={e => { if (e.target.value !== row.transaction) onPatch(row.id, { transaction: e.target.value }); }}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
        />
      </TableCell>
      <TableCell>
        <InlineSelect
          value={row.category}
          options={catNames}
          onChange={val => onPatch(row.id, { category: val, sub_category: '' })}
        />
      </TableCell>
      <TableCell>
        <InlineSelect
          value={row.sub_category}
          options={subOpts}
          onChange={val => onPatch(row.id, { sub_category: val })}
        />
      </TableCell>
      <TableCell>
        <Text size={200} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {(v => (v < 0 ? '-' : '') + '$' + Math.abs(v).toFixed(2))(+row.amount || 0)}
        </Text>
      </TableCell>
      <TableCell>
        <Tooltip content={row.recurring_sub ? 'Recurring — click to unset' : 'Not recurring — click to set'} relationship="label">
          <Button
            appearance="subtle"
            size="small"
            icon={row.recurring_sub ? <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1 }} /> : <CircleRegular />}
            onClick={() => onPatch(row.id, { recurring_sub: row.recurring_sub ? 0 : 1 })}
            style={{ minWidth: 0 }}
          />
        </Tooltip>
      </TableCell>
      <TableCell><SourceBadge source={row.payment} /></TableCell>
      <TableCell>
        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{row.upstream_category}</Text>
      </TableCell>
      <TableCell>
        <input
          defaultValue={row.notes}
          placeholder="add note…"
          onBlur={e => { if (e.target.value !== row.notes) onPatch(row.id, { notes: e.target.value }); }}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: tokens.colorNeutralForeground3 }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function TransactionsTab({ onDataChange, onRegisterRefresh, excludedItems = [], onExcludedInserted }) {
  const s = useStyles();
  const [showExcluded, setShowExcluded] = useState(false);
  const { rows, total, page, pages, loading, filters, updateFilter, toggleSort, goToPage, refresh } = useTransactions();

  useEffect(() => {
    onRegisterRefresh?.(() => goToPage(1));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { groups: catGroups, names: catNames } = useCategories();

  const handlePatch = useCallback(async (id, fields) => {
    await patchTransaction(id, fields);
    refresh();
    onDataChange();
  }, [refresh, onDataChange]);

  const pgButtons = () => {
    const btns = [];
    const lo = Math.max(1, page - 2);
    const hi = Math.min(pages, page + 2);
    for (let p = lo; p <= hi; p++) {
      btns.push(
        <button
          key={p}
          className={`${s.pgBtn} ${p === page ? s.pgBtnActive : ''}`}
          onClick={() => goToPage(p)}
        >{p}</button>
      );
    }
    return btns;
  };

  return (
    <div className={s.root}>
      {/* Toolbar */}
      <div className={s.toolbar}>
        <Input
          placeholder="Search transactions…"
          value={filters.search}
          onChange={(_, d) => updateFilter('search', d.value)}
          style={{ width: '220px' }}
          size="small"
        />
        <Select
          size="small"
          value={filters.source}
          onChange={(_, d) => updateFilter('source', d.value)}
        >
          <option value="">All sources</option>
          {['AMEX', 'Venmo', 'Wells Fargo', 'Discover'].map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select
          size="small"
          value={filters.category}
          onChange={(_, d) => updateFilter('category', d.value)}
        >
          <option value="">All categories</option>
          {catNames.map(c => <option key={c}>{c}</option>)}
        </Select>
        <div className={s.spacer} />
        {loading && <Spinner size="extra-small" />}
        {excludedItems.length > 0 && (
          <Button
            size="small"
            appearance="subtle"
            style={{ color: tokens.colorPaletteYellowForeground1 }}
            onClick={() => setShowExcluded(true)}
          >
            {excludedItems.length} rows Excluded
          </Button>
        )}
        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{total} rows</Text>
      </div>

      {/* Table */}
      <div className={s.tableWrap}>
        {!total && !loading ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>📊</div>
            <Text size={400} weight="semibold">No transactions yet</Text>
            <Text size={200}>Upload CSV files from the sidebar to get started.</Text>
          </div>
        ) : (
          <div className={s.tableCard}>
            <Table size="small" style={{ width: '100%' }}>
              <TableHeader>
                <TableRow>
                  {[
                    { key: 'date', label: 'Date', w: 96, sortable: true },
                    { key: 'transaction', label: 'Transaction', sortable: false },
                    { key: 'category', label: 'Category', w: 130, sortable: false },
                    { key: 'sub_category', label: 'Sub-Category', w: 150, sortable: false },
                    { key: 'amount', label: 'Amount', w: 88, sortable: true },
                    { key: 'recurring_sub', label: 'Recurring', w: 72, sortable: false },
                    { key: 'payment', label: 'Source', w: 90, sortable: false },
                    { key: 'upstream_category', label: 'Upstream', sortable: false },
                    { key: 'notes', label: 'Notes', sortable: false },
                  ].map(col => (
                    <TableHeaderCell
                      key={col.key}
                      style={{ width: col.w, cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                      onClick={() => col.sortable && toggleSort(col.key)}
                    >
                      <TableCellLayout
                        media={col.sortable ? <ArrowSortRegular style={{ fontSize: 12 }} /> : undefined}
                      >
                        {col.label}
                      </TableCellLayout>
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TransactionRow
                    key={row.id}
                    row={row}
                    catGroups={catGroups}
                    catNames={catNames}
                    onPatch={handlePatch}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className={s.pg}>
          <Text size={100} style={{ color: tokens.colorNeutralForeground3, flex: 1 }}>
            Page {page} of {pages}
          </Text>
          <button className={s.pgBtn} onClick={() => goToPage(page - 1)} disabled={page === 1}>‹</button>
          {pgButtons()}
          <button className={s.pgBtn} onClick={() => goToPage(page + 1)} disabled={page === pages}>›</button>
        </div>
      )}

      {showExcluded && (
        <ExcludedTransactionsModal
          items={excludedItems}
          onDismiss={() => setShowExcluded(false)}
          onInserted={inserted => { onExcludedInserted?.(inserted); setShowExcluded(false); }}
        />
      )}
    </div>
  );
}
