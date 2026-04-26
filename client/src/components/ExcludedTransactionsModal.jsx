import { useState } from 'react';
import {
  Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent,
  Button, Checkbox, Text, makeStyles, tokens,
} from '@fluentui/react-components';
import { insertSelected } from '../api/client.js';

const useStyles = makeStyles({
  intro: {
    display: 'block',
    marginBottom: '12px',
    color: tokens.colorNeutralForeground3,
  },
  list: {
    maxHeight: '360px',
    overflowY: 'auto',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':last-child': { borderBottom: 'none' },
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  meta: {
    color: tokens.colorNeutralForeground3,
  },
  reason: {
    color: tokens.colorNeutralForeground4,
  },
});

export default function ExcludedTransactionsModal({ items, onDismiss, onInserted }) {
  const s = useStyles();
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(false);

  function toggle(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const selected = items.filter(item => checked[item.id]);

  async function handleAddSelected() {
    setLoading(true);
    try {
      await insertSelected(selected);
      onInserted(selected);
      onDismiss();
    } catch (e) {
      alert(`Error adding transactions: ${e.message}`);
      setLoading(false);
    }
  }

  return (
    <Dialog open modalType="modal">
      <DialogSurface style={{ maxWidth: '520px', width: '90vw' }}>
        <DialogBody>
          <DialogTitle>Excluded Transactions</DialogTitle>
          <DialogContent>
            <Text size={200} className={s.intro}>
              The following entries were excluded because they are payments or cashback rewards.
              Check any you'd like to add to the table.
            </Text>
            <div className={s.list}>
              {items.map(item => (
                <div key={item.id} className={s.row}>
                  <Checkbox
                    checked={!!checked[item.id]}
                    onChange={() => toggle(item.id)}
                  />
                  <div className={s.info}>
                    <Text size={200} weight="semibold">{item.transaction}</Text>
                    <Text size={100} className={s.meta}>
                      {item.date} · {item.payment} · {(v => (v < 0 ? '-' : '') + '$' + Math.abs(v).toFixed(2))(+item.amount || 0)}
                    </Text>
                    <Text size={100} className={s.reason}>{item.reason}</Text>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onDismiss}>Dismiss</Button>
            <Button
              appearance="primary"
              disabled={selected.length === 0 || loading}
              onClick={handleAddSelected}
            >
              {loading ? 'Adding…' : `Add Selected (${selected.length})`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
