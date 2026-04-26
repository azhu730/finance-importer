import { useRef, useState } from 'react';
import { Button, Divider, Text, Spinner, makeStyles, tokens } from '@fluentui/react-components';
import { DeleteRegular } from '@fluentui/react-icons';
import { uploadCSV, clearTransactions } from '../api/client.js';
import { useCategories } from '../hooks/useCategories.js';
import StatCard from './shared/StatCard.jsx';
import FileChip from './shared/FileChip.jsx';

const useStyles = makeStyles({
  sidebar: {
    width: '288px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
  },
  section: {
    padding: '14px 16px',
  },
  sectionLabel: {
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    marginBottom: '10px',
    display: 'block',
  },
  dropZone: {
    border: `1.5px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px 14px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  dropZoneActive: {
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  dropZoneDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  dzIcon: { fontSize: '24px', display: 'block', marginBottom: '6px' },
  dzText: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  dzHint: { fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground4, marginTop: '4px' },
  fileList: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  catItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 0',
    fontSize: tokens.fontSizeBase200,
  },
});

const SOURCE_OPTIONS = ['AMEX', 'Venmo', 'Discover', 'Wells Fargo'];

export default function Sidebar({ stats, onUploaded }) {
  const s = useStyles();
  const inputRef = useRef(null);
  const [dragOver, setDragOver]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const { names: catNames, groups } = useCategories();
  const isSourceSelected = selectedSource && selectedSource !== '';

  const acceptedExtensions = selectedSource === 'Discover' ? ['.csv'] : ['.csv', '.xlsx'];

  async function handleFiles(files) {
    setUploading(true);
    const results = [];
    for (const file of Array.from(files)) {
      if (!acceptedExtensions.some(ext => file.name.endsWith(ext))) continue;
      try {
        const res = await uploadCSV(file, selectedSource);
        results.push({ name: file.name, source: res.source, count: res.inserted });
      } catch (e) {
        alert(`Error uploading ${file.name}: ${e.message}`);
      }
    }
    setUploadedFiles(prev => [...prev, ...results]);
    setUploading(false);
    onUploaded();
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleClearAll() {
    if (!confirm('Delete all transactions from the database? This cannot be undone.')) return;
    await clearTransactions();
    setUploadedFiles([]);
    onUploaded();
  }

  function removeFileChip(i) {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  const spend = stats?.totalSpend
    ? '$' + stats.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$0.00';

  return (
    <aside className={s.sidebar}>

      {/* Upload */}
      <div className={s.section}>
        <Text className={s.sectionLabel}>Upload Source Files</Text>
        <select
          value={selectedSource}
          onChange={e => setSelectedSource(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: `1px solid ${tokens.colorNeutralStroke2}`,
            fontSize: tokens.fontSizeBase200,
          }}
        >
          <option value="" disabled>Select a Source</option>
          {SOURCE_OPTIONS.map(src => <option key={src} value={src}>{src}</option>)}
        </select>
        <div
          className={`${s.dropZone} ${dragOver && isSourceSelected ? s.dropZoneActive : ''} ${!isSourceSelected ? s.dropZoneDisabled : ''}`}
          onClick={() => isSourceSelected && inputRef.current?.click()}
          onDragOver={e => { if (isSourceSelected) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => isSourceSelected && onDrop(e)}
        >
          <input ref={inputRef} type="file" accept={acceptedExtensions.join(',')} multiple disabled={!isSourceSelected} style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)} />
          {uploading
            ? <Spinner size="small" label="Uploading…" />
            : <>
                <span className={s.dzIcon}>📂</span>
                <Text className={s.dzText}>{isSourceSelected ? <><strong>Browse</strong> or <strong>Drag & Drop</strong></> : 'Select a source first'}</Text>
                {isSourceSelected && <>
                  <br />
                  <Text className={s.dzHint}>Supported File Formats: {acceptedExtensions.join(', ')}</Text>
                </>}
              </>
          }
        </div>
        {uploadedFiles.length > 0 && (
          <div className={s.fileList}>
            {uploadedFiles.map((f, i) => (
              <FileChip key={i} file={f} onRemove={() => removeFileChip(i)} />
            ))}
          </div>
        )}
      </div>

      <Divider />

      {/* Stats */}
      <div className={s.section}>
        <Text className={s.sectionLabel}>Summary</Text>
        <div className={s.statsGrid}>
          <StatCard label="Transactions" value={stats?.total ?? 0}         color={tokens.colorBrandForeground1} />
          <StatCard label="Unmapped"     value={stats?.uncategorized ?? 0} color={tokens.colorPaletteYellowForeground1} />
          <StatCard label="Total spend"  value={spend} />
          <StatCard label="Sources"      value={stats?.sources?.length ?? 0} />
        </div>
      </div>

      <Divider />

      {/* Category reference */}
      <div className={s.section} style={{ flex: 1 }}>
        <Text className={s.sectionLabel}>Categories</Text>
        <div style={{ maxHeight: '260px', overflowY: 'auto', paddingRight: '16px', marginRight: '-16px' }}>
          {catNames.map(cat => (
            <div key={cat} className={s.catItem}>
              <Text size={200} weight="semibold">{cat}</Text>
              <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>{groups[cat]?.length}</Text>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Clear all */}
      <div className={s.section}>
        <Button
          appearance="subtle"
          icon={<DeleteRegular />}
          disabled={!stats?.total}
          onClick={handleClearAll}
          style={{ width: '100%', justifyContent: 'flex-start', color: tokens.colorPaletteRedForeground1 }}
        >
          Clear all transactions
        </Button>
      </div>

    </aside>
  );
}
