"use client";
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Search,
  Filter,
  PieChart,
  Calendar,
  Tag as TagIcon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useStore from '../store/useStore';
import { format } from 'date-fns';
import Modal from './Modal';

export default function FinanceView() {
  const { theme } = useTheme();
  const { transactions = [], addTransaction, deleteTransaction } = useStore();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  // Categories list
  const categories = ['General', 'Food', 'Transport', 'Salary', 'Shopping', 'Rent', 'Entertainment', 'Health', 'Travel'];

  // Analytics
  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [transactions]);

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    await addTransaction({
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date(date)
    });

    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="finance-container" style={{ '--calendar-invert': theme === 'dark' ? 1 : 0 }}>
      <header className="finance-header">
        <div className="stats-grid">
          <div className="stat-card balance">
            <div className="stat-icon"><Wallet size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Total Balance</span>
              <h2 className="stat-value">৳{stats.balance.toLocaleString()}</h2>
            </div>
          </div>
          <div className="stat-card income">
            <div className="stat-icon"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Total Income</span>
              <h2 className="stat-value text-success">+৳{stats.income.toLocaleString()}</h2>
            </div>
          </div>
          <div className="stat-card expense">
            <div className="stat-icon"><TrendingDown size={24} /></div>
            <div className="stat-info">
              <span className="stat-label">Total Expenses</span>
              <h2 className="stat-value text-danger">-৳{stats.expenses.toLocaleString()}</h2>
            </div>
          </div>
        </div>
      </header>

      <div className="finance-content">
        <div className="ledger-section">
          <div className="section-header">
            <h3>Recent Transactions</h3>
            <div className="header-actions">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <form className="quick-add-form" onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="What was it for?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <input 
              type="number" 
              placeholder="Amount" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="date-input"
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="type-toggle">
              <button 
                type="button" 
                className={type === 'income' ? 'active income' : ''} 
                onClick={() => setType('income')}
              >In</button>
              <button 
                type="button" 
                className={type === 'expense' ? 'active expense' : ''} 
                onClick={() => setType('expense')}
              >Out</button>
            </div>
            <button type="submit" className="add-btn"><Plus size={18} /></button>
          </form>

          <div className="transaction-list">
            {filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <PieChart size={48} opacity={0.2} />
                <p>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map(tx => (
                <div key={tx._id} className="transaction-item">
                  <div className={`tx-icon ${tx.type}`}>
                    {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div className="tx-info">
                    <span className="tx-desc">{tx.description}</span>
                    <div className="tx-meta">
                      <span className="tx-category">{tx.category}</span>
                      <span className="meta-dot">•</span>
                      <span className="tx-date">{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className={`tx-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                  </div>
                  <button className="delete-tx" onClick={() => {
                    setTxToDelete(tx);
                    setIsDeleteModalOpen(true);
                  }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Transaction?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn-danger" onClick={async () => {
              if (txToDelete) {
                await deleteTransaction(txToDelete._id);
                setIsDeleteModalOpen(false);
                setTxToDelete(null);
              }
            }}>Delete</button>
          </>
        }
      >
        <p>Are you sure you want to delete this transaction?</p>
        {txToDelete && (
          <div className="delete-preview">
            <span className="preview-desc">{txToDelete.description}</span>
            <span className={`preview-amount ${txToDelete.type}`}>
              {txToDelete.type === 'income' ? '+' : '-'}৳{txToDelete.amount.toLocaleString()}
            </span>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .finance-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: var(--sidebar-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--hover-bg);
          color: var(--primary);
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .stat-value {
          margin: 4px 0 0 0;
          font-size: 24px;
          font-weight: 700;
        }

        .text-success { color: #10b981; }
        .text-danger { color: #f43f5e; }

        .ledger-section {
          background: var(--bg-color);
          border-radius: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          padding: 8px 12px;
          border-radius: 10px;
          width: 240px;
        }

        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-color);
          font-size: 13px;
          width: 100%;
        }

        .quick-add-form {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .quick-add-form input, .quick-add-form select {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 8px 12px;
          border-radius: 8px;
          outline: none;
          font-size: 14px;
        }

        .quick-add-form input:first-child { flex: 2; }
        .quick-add-form input:nth-child(2) { flex: 1; }

        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(var(--calendar-invert, 1));
          cursor: pointer;
        }

        .type-toggle {
          display: flex;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2px;
        }

        .type-toggle button {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .type-toggle button.active.income { background: #10b981; color: white; }
        .type-toggle button.active.expense { background: #f43f5e; color: white; }

        .add-btn {
          background: var(--primary);
          color: white;
          border: none;
          width: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .add-btn:hover { opacity: 0.9; }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid transparent;
          transition: all 0.2s;
          cursor: pointer;
        }

        .transaction-item:hover {
          background: var(--hover-bg);
          border-color: var(--border-color);
        }

        .tx-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tx-icon.income { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .tx-icon.expense { background: rgba(244, 63, 94, 0.1); color: #f43f5e; }

        .tx-info { flex: 1; display: flex; flex-direction: column; }
        .tx-desc { font-weight: 500; font-size: 14px; }
        .tx-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
        .meta-dot { opacity: 0.3; }

        .tx-amount { font-weight: 700; font-size: 15px; }
        .tx-amount.income { color: #10b981; }
        .tx-amount.expense { color: #f43f5e; }

        .delete-tx {
          opacity: 0;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .transaction-item:hover .delete-tx { opacity: 1; }
        .delete-tx:hover { color: #f43f5e; }

        .empty-state {
          padding: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary);
        }

        .btn-secondary {
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-danger {
          background: #f43f5e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .delete-preview {
          margin-top: 12px;
          padding: 12px;
          background: var(--hover-bg);
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-desc { font-weight: 500; }
        .preview-amount.income { color: #10b981; font-weight: 700; }
        .preview-amount.expense { color: #f43f5e; font-weight: 700; }

        @media (max-width: 768px) {
          .quick-add-form { flex-direction: column; }
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
