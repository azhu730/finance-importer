import { useState, useRef } from 'react';
import Shell from './components/Shell.jsx';
import Sidebar from './components/Sidebar.jsx';
import TransactionsTab from './components/tabs/TransactionsTab.jsx';
import MappingTab from './components/tabs/MappingTab.jsx';
import EarningsTab from './components/tabs/EarningsTab.jsx';
import { useStats } from './hooks/useStats.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('transactions');
  const { stats, refreshStats } = useStats();
  const txRefreshRef = useRef(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Shell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
        onRefresh={refreshStats}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar stats={stats} onUploaded={() => { refreshStats(); txRefreshRef.current?.(); }} />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'transactions' && <TransactionsTab onDataChange={refreshStats} onRegisterRefresh={fn => { txRefreshRef.current = fn; }} />}
          {activeTab === 'mapping'      && <MappingTab      onDataChange={refreshStats} />}
          {activeTab === 'earnings'     && <EarningsTab />}
        </main>
      </div>
    </div>
  );
}
