import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function TradingJournal() {
  const [trades, setTrades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    entryTime: '00:00',
    exitTime: '00:00',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    type: 'LONG',
    lotSize: '',
    reason: ''
  });

  // Load trades from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('xauusdTrades');
    if (saved) setTrades(JSON.parse(saved));
  }, []);

  // Save trades to localStorage
  useEffect(() => {
    localStorage.setItem('xauusdTrades', JSON.stringify(trades));
  }, [trades]);

  const addTrade = (e) => {
    e.preventDefault();
    if (!formData.entryPrice || !formData.exitPrice || !formData.lotSize) return;

    const entryPrice = parseFloat(formData.entryPrice);
    const exitPrice = parseFloat(formData.exitPrice);
    const pips = Math.abs(exitPrice - entryPrice) * 10;
    const profit = formData.type === 'LONG' 
      ? (exitPrice - entryPrice) * parseFloat(formData.lotSize) * 100
      : (entryPrice - exitPrice) * parseFloat(formData.lotSize) * 100;

    const newTrade = {
      id: Date.now(),
      ...formData,
      pips: Math.round(pips * 10) / 10,
      profit: Math.round(profit * 100) / 100,
      roi: formData.lotSize ? Math.round((profit / (parseFloat(formData.lotSize) * 1000)) * 10000) / 100 : 0
    };

    setTrades([...trades, newTrade]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      entryTime: '00:00',
      exitTime: '00:00',
      entryPrice: '',
      exitPrice: '',
      stopLoss: '',
      takeProfit: '',
      type: 'LONG',
      lotSize: '',
      reason: ''
    });
    setShowForm(false);
  };

  const deleteTrade = (id) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  // Calculate stats
  const stats = {
    totalTrades: trades.length,
    winningTrades: trades.filter(t => t.profit > 0).length,
    losingTrades: trades.filter(t => t.profit < 0).length,
    winrate: trades.length ? Math.round((trades.filter(t => t.profit > 0).length / trades.length) * 100) : 0,
    totalProfit: Math.round(trades.reduce((sum, t) => sum + t.profit, 0) * 100) / 100,
    avgProfit: trades.length ? Math.round((trades.reduce((sum, t) => sum + t.profit, 0) / trades.length) * 100) / 100 : 0,
    maxProfit: trades.length ? Math.max(...trades.map(t => t.profit)) : 0,
    maxLoss: trades.length ? Math.min(...trades.map(t => t.profit)) : 0,
  };

  // Calculate running equity for chart
  let equity = 0;
  const equityData = trades.map((trade, idx) => {
    equity += trade.profit;
    return {
      index: idx + 1,
      equity: Math.round(equity * 100) / 100,
      profit: trade.profit
    };
  });

  return (
    <div style={{ 
      background: '#0a0e27', 
      color: '#e0e0e0', 
      padding: '1.5rem',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '28px', fontWeight: '600', color: '#fff' }}>XAUUSD Trading Journal</h1>
        <p style={{ margin: 0, color: '#888' }}>Track your Gold trading performance</p>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '2rem'
      }}>
        <KPICard label="Total Trades" value={stats.totalTrades} />
        <KPICard label="Winrate" value={`${stats.winrate}%`} color={stats.winrate >= 50 ? '#4ade80' : '#ef4444'} />
        <KPICard label="Total Profit" value={`$${stats.totalProfit.toFixed(2)}`} color={stats.totalProfit >= 0 ? '#4ade80' : '#ef4444'} />
        <KPICard label="Avg Profit" value={`$${stats.avgProfit.toFixed(2)}`} color={stats.avgProfit >= 0 ? '#4ade80' : '#ef4444'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Equity Curve */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: '500', color: '#e0e0e0' }}>Equity Curve</h3>
          {equityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="index" stroke="#666" tick={{ fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                  labelStyle={{ color: '#e0e0e0' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#3b82f6" 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              No trades yet
            </div>
          )}
        </div>

        {/* P&L Distribution */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '14px', fontWeight: '500', color: '#e0e0e0' }}>P&L Distribution</h3>
          {trades.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trades.map((t, i) => ({ index: i + 1, profit: t.profit }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="index" stroke="#666" tick={{ fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '4px' }}
                  labelStyle={{ color: '#e0e0e0' }}
                />
                <Bar 
                  dataKey="profit" 
                  fill="url(#gradientBar)"
                  isAnimationActive={false}
                />
                <defs>
                  <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              No trades yet
            </div>
          )}
        </div>
      </div>

      {/* Add Trade Button */}
      <button 
        onClick={() => setShowForm(!showForm)}
        style={{
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '1.5rem'
        }}
      >
        {showForm ? 'Cancel' : '+ New Trade'}
      </button>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={addTrade}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Entry Time</label>
                <input type="time" value={formData.entryTime} onChange={(e) => setFormData({...formData, entryTime: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Exit Time</label>
                <input type="time" value={formData.exitTime} onChange={(e) => setFormData({...formData, exitTime: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} style={inputStyle}>
                  <option>LONG</option>
                  <option>SHORT</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Entry Price</label>
                <input type="number" step="0.01" placeholder="2050.50" value={formData.entryPrice} onChange={(e) => setFormData({...formData, entryPrice: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Exit Price</label>
                <input type="number" step="0.01" placeholder="2055.75" value={formData.exitPrice} onChange={(e) => setFormData({...formData, exitPrice: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Stop Loss</label>
                <input type="number" step="0.01" placeholder="2045.00" value={formData.stopLoss} onChange={(e) => setFormData({...formData, stopLoss: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Take Profit</label>
                <input type="number" step="0.01" placeholder="2060.00" value={formData.takeProfit} onChange={(e) => setFormData({...formData, takeProfit: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Lot Size</label>
                <input type="number" step="0.01" placeholder="0.5" value={formData.lotSize} onChange={(e) => setFormData({...formData, lotSize: e.target.value})} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Reason</label>
              <textarea 
                placeholder="Technical support, news event, etc." 
                value={formData.reason} 
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                style={{...inputStyle, minHeight: '60px', fontFamily: 'inherit'}}
              />
            </div>

            <button 
              type="submit"
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginTop: '1rem'
              }}
            >
              Save Trade
            </button>
          </form>
        </div>
      )}

      {/* Trades Table */}
      {trades.length > 0 && (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', background: '#0f172a' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>Entry</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>Exit</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>Pips</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>Profit</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>ROI %</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontWeight: '500' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, idx) => (
                  <tr key={trade.id} style={{ borderBottom: '1px solid #1f2937', background: idx % 2 === 0 ? '#0f172a' : 'transparent' }}>
                    <td style={{ padding: '12px', color: '#e0e0e0' }}>{trade.date}</td>
                    <td style={{ padding: '12px', color: trade.type === 'LONG' ? '#4ade80' : '#ef4444', fontWeight: '500' }}>{trade.type}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0' }}>{trade.entryPrice}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0' }}>{trade.exitPrice}</td>
                    <td style={{ padding: '12px', color: '#e0e0e0' }}>{trade.pips}</td>
                    <td style={{ padding: '12px', color: trade.profit >= 0 ? '#4ade80' : '#ef4444', fontWeight: '500' }}>
                      ${trade.profit.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', color: trade.roi >= 0 ? '#4ade80' : '#ef4444' }}>{trade.roi.toFixed(2)}%</td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => deleteTrade(trade.id)}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, color = '#3b82f6' }) {
  return (
    <div style={{ 
      background: '#111827', 
      border: '1px solid #1f2937', 
      borderRadius: '8px', 
      padding: '1rem',
      textAlign: 'center'
    }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: '#888' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '20px', fontWeight: '600', color }}>{value}</p>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: '#0f172a',
  border: '1px solid #1f2937',
  borderRadius: '4px',
  padding: '8px',
  color: '#e0e0e0',
  fontSize: '13px',
  boxSizing: 'border-box'
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TradingJournal />
  </React.StrictMode>,
)
