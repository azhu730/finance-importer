import { useState } from 'react';
import {
  Select, Text, Spinner, MessageBar, MessageBarBody,
  makeStyles, tokens,
} from '@fluentui/react-components';
import { useMappings } from '../../hooks/useMappings.js';
import { useCategories } from '../../hooks/useCategories.js';

const useStyles = makeStyles({
  root: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  content: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  grid: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' },
  hdr: {
    display: 'grid',
    gridTemplateColumns: '1fr 24px 1fr 1fr',
    gap: '8px',
    padding: '0 12px',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 24px 1fr 1fr',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '8px 12px',
  },
  rowUnmapped: {
    borderColor: tokens.colorPaletteYellowBorder1,
    backgroundColor: tokens.colorPaletteYellowBackground1,
  },
  srcLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  arrow: { textAlign: 'center', color: tokens.colorNeutralForeground3 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: '8px',
    color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '60px',
  },
});

function MappingRow({ upstream, mapped, catGroups, catNames, onSave }) {
  const s = useStyles();
  const [selectedCat, setSelectedCat] = useState(mapped?.category || '');
  const [selectedSub, setSelectedSub] = useState(mapped?.subCategory || '');
  const subOpts = selectedCat ? (catGroups[selectedCat] || []) : [];

  function handleCatChange(cat) {
    setSelectedCat(cat);
    setSelectedSub(''); // reset sub when category changes
    if (!cat) onSave(upstream, '', '');
  }

  function handleSubChange(sub) {
    setSelectedSub(sub);
    if (selectedCat && sub) onSave(upstream, selectedCat, sub);
  }

  return (
    <div className={`${s.row} ${!mapped ? s.rowUnmapped : ''}`}>
      <Text className={s.srcLabel} title={upstream}>{upstream}</Text>
      <span className={s.arrow}>→</span>
      <Select
        size="small"
        value={selectedCat}
        onChange={(_, d) => handleCatChange(d.value)}
        style={{ width: '100%' }}
      >
        <option value="">— Category —</option>
        {catNames.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>
      <Select
        size="small"
        value={selectedSub}
        onChange={(_, d) => handleSubChange(d.value)}
        style={{ width: '100%' }}
        disabled={!selectedCat}
      >
        <option value="">— Sub-Category —</option>
        {subOpts.map(sub => <option key={sub} value={sub}>{sub}</option>)}
      </Select>
    </div>
  );
}

export default function MappingTab({ onDataChange }) {
  const s = useStyles();
  const { upstreams, saved, loading, unmappedCount, save } = useMappings();
  const { groups: catGroups, names: catNames } = useCategories();

  async function handleSave(upstream, category, subCategory) {
    await save(upstream, category, subCategory);
    onDataChange();
  }

  return (
    <div className={s.root}>
      <div className={s.content}>
        {loading ? (
          <Spinner label="Loading mappings…" />
        ) : !upstreams.length ? (
          <div className={s.empty}>
            <div style={{ fontSize: '40px', opacity: 0.4, marginBottom: '8px' }}>🗂️</div>
            <Text size={400} weight="semibold">No upstream categories yet</Text>
            <Text size={200}>Upload CSVs first — source categories will appear here.</Text>
          </div>
        ) : (
          <>
            <MessageBar intent={unmappedCount ? 'warning' : 'success'}>
              <MessageBarBody>
                {unmappedCount
                  ? `${unmappedCount} upstream categor${unmappedCount > 1 ? 'ies' : 'y'} not yet mapped — assign them below to auto-fill matching transactions.`
                  : 'All upstream categories are mapped.'}
              </MessageBarBody>
            </MessageBar>

            <div className={s.grid}>
              <div className={s.hdr}>
                <span>Upstream (source)</span>
                <span />
                <span>Category</span>
                <span>Sub-Category</span>
              </div>
              {upstreams.map(u => (
                <MappingRow
                  key={u}
                  upstream={u}
                  mapped={saved[u.toLowerCase().trim()]}
                  catGroups={catGroups}
                  catNames={catNames}
                  onSave={handleSave}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
