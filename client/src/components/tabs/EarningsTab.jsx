import {
  Button, Text, Spinner,
  Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell,
  makeStyles, tokens,
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { useEarnings } from '../../hooks/useEarnings.js';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 20px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  content: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  tableCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    overflow: 'hidden',
    boxShadow: tokens.shadow4,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: '8px',
    color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '60px',
  },
});

function EarningRow({ row, onPatch, onDelete }) {
  return (
    <TableRow>
      <TableCell>
        <input
          type="date"
          defaultValue={row.date}
          onBlur={e => { if (e.target.value !== row.date) onPatch(row.id, { date: e.target.value }); }}
          style={{ border: 'none', background: 'transparent', fontSize: '13px', fontFamily: 'inherit', outline: 'none', width: '110px' }}
        />
      </TableCell>
      <TableCell>
        <input
          defaultValue={row.description}
          placeholder="Description…"
          onBlur={e => { if (e.target.value !== row.description) onPatch(row.id, { description: e.target.value }); }}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
        />
      </TableCell>
      <TableCell>
        <input
          type="number"
          defaultValue={row.amount || ''}
          placeholder="0.00"
          onBlur={e => { if (parseFloat(e.target.value) !== row.amount) onPatch(row.id, { amount: parseFloat(e.target.value) || 0 }); }}
          style={{ border: 'none', background: 'transparent', width: '100px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', textAlign: 'right' }}
        />
      </TableCell>
      <TableCell>
        <input
          defaultValue={row.source}
          placeholder="Employer, etc."
          onBlur={e => { if (e.target.value !== row.source) onPatch(row.id, { source: e.target.value }); }}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
        />
      </TableCell>
      <TableCell>
        <input
          defaultValue={row.notes}
          placeholder="Note…"
          onBlur={e => { if (e.target.value !== row.notes) onPatch(row.id, { notes: e.target.value }); }}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
        />
      </TableCell>
      <TableCell>
        <Button
          appearance="subtle"
          size="small"
          icon={<DeleteRegular style={{ color: tokens.colorPaletteRedForeground1 }} />}
          onClick={() => onDelete(row.id)}
          style={{ minWidth: 0 }}
        />
      </TableCell>
    </TableRow>
  );
}

export default function EarningsTab() {
  const s = useStyles();
  const { rows, loading, add, patch, remove } = useEarnings();

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <Button appearance="primary" size="small" icon={<AddRegular />} onClick={add}>
          Add Row
        </Button>
        <div style={{ flex: 1 }} />
        {rows.length > 0 && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Total: <strong>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </Text>
        )}
      </div>

      <div className={s.content}>
        {loading ? (
          <Spinner label="Loading earnings…" />
        ) : !rows.length ? (
          <div className={s.empty}>
            <div style={{ fontSize: '40px', opacity: 0.4, marginBottom: '8px' }}>💰</div>
            <Text size={400} weight="semibold">No earnings yet</Text>
            <Text size={200}>Click "Add Row" to log income — salary, freelance, dividends, reimbursements.</Text>
          </div>
        ) : (
          <div className={s.tableCard}>
            <Table size="small" style={{ width: '100%' }}>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell style={{ width: 120 }}>Date</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell style={{ width: 110 }}>Amount</TableHeaderCell>
                  <TableHeaderCell style={{ width: 140 }}>Source</TableHeaderCell>
                  <TableHeaderCell>Notes</TableHeaderCell>
                  <TableHeaderCell style={{ width: 40 }} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <EarningRow key={row.id} row={row} onPatch={patch} onDelete={remove} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
