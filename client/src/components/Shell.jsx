import { Button, TabList, Tab, Badge, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowDownloadRegular, SparkleRegular } from '@fluentui/react-icons';
import { exportXlsx, categorizeBatch } from '../api/client.js';
import { useState } from 'react';

const useStyles = makeStyles({
  topbar: {
    backgroundColor: tokens.colorBrandBackground,
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    flexShrink: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  sub: {
    fontSize: tokens.fontSizeBase200,
    opacity: 0.7,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  spacer: { flex: 1 },
  nav: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '0 20px',
    flexShrink: 0,
  },
});

export default function Shell({ activeTab, onTabChange, stats, onRefresh }) {
  const s = useStyles();
  const [aiLoading, setAiLoading] = useState(false);

  async function handleAI() {
    setAiLoading(true);
    try {
      const result = await categorizeBatch([]);
      await onRefresh();
      alert(`Auto-categorized ${result.categorized} transactions.`);
    } catch (e) {
      alert('AI categorization failed: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <div className={s.topbar}>
        <div className={s.logo}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="3" width="16" height="14" rx="2" stroke="white" strokeWidth="1.5"/>
            <path d="M2 7h16" stroke="white" strokeWidth="1.5"/>
            <path d="M6 11h2M9 11h5M6 14h2M9 14h3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className={s.title}>Finance Importer</span>
          <span className={s.sub}>for Power BI</span>
        </div>

        <div className={s.spacer} />

        <Button
          appearance="subtle"
          icon={<SparkleRegular />}
          disabled={!stats?.uncategorized || aiLoading}
          onClick={handleAI}
          style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          {aiLoading ? 'Categorizing…' : `Auto-categorize${stats?.uncategorized ? ` (${stats.uncategorized})` : ''}`}
        </Button>

        <Button
          appearance="subtle"
          icon={<ArrowDownloadRegular />}
          disabled={!stats?.total}
          onClick={exportXlsx}
          style={{ color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          Export .xlsx
        </Button>
      </div>

      <div className={s.nav}>
        <TabList
          selectedValue={activeTab}
          onTabSelect={(_, d) => onTabChange(d.value)}
        >
          <Tab value="transactions">
            Transactions{' '}
            {stats?.total > 0 && (
              <Badge appearance="tint" color="brand" size="small" style={{ marginLeft: 6 }}>
                {stats.total}
              </Badge>
            )}
          </Tab>
          <Tab value="mapping">
            Category Mapping{' '}
            {stats?.uncategorized > 0 && (
              <Badge appearance="tint" color="warning" size="small" style={{ marginLeft: 6 }}>
                {stats.uncategorized}
              </Badge>
            )}
          </Tab>
          <Tab value="earnings">Earnings</Tab>
        </TabList>
      </div>
    </>
  );
}
