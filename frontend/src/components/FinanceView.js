"use client";
import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
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

// Custom Dropdown Component
function CustomSelect({ value, onChange, options, icon: Icon, labelPrefix = "", variant = "ghost" }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`custom-select-container ${variant}`}>
      <button 
        type="button" 
        className={`custom-select-trigger ${isOpen ? 'active' : ''} ${variant}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {Icon && <Icon size={14} className="trigger-icon" />}
        <span className="trigger-text">{labelPrefix}{selectedOption.label}</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="select-overlay" onClick={() => setIsOpen(false)} />
          <div className="select-menu">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`select-item ${value === opt.value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
                {value === opt.value && <div className="selected-dot" />}
              </button>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .custom-select-container {
          position: relative;
          width: 100%;
          display: block;
        }

        .custom-select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-color);
          font-size: 13px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          width: 100%;
        }

        .custom-select-trigger.input {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          padding: 8px 12px;
          height: 38px;
          min-width: 120px;
          justify-content: space-between;
          font-weight: 500;
        }

        .custom-select-trigger:hover, .custom-select-trigger.active {
          background: var(--hover-bg);
        }

        .custom-select-trigger.input:hover {
          border-color: var(--primary);
        }

        .trigger-icon {
          color: var(--text-secondary);
          opacity: 0.7;
        }

        .chevron {
          color: var(--text-secondary);
          opacity: 0.5;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .select-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .select-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 180px;
          background: var(--sidebar-bg);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          padding: 6px;
          z-index: 1001;
          animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .select-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-color);
          font-size: 13px;
          text-align: left;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.1s;
        }

        .select-item:hover {
          background: var(--hover-bg);
        }

        .select-item.selected {
          font-weight: 600;
          color: var(--primary);
        }

        .selected-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
        }
      `}</style>
    </div>
  );
}

export default function FinanceView() {
  const { theme } = useTheme();
  const { transactions = [], addTransaction, deleteTransaction, globalSearchQuery, setGlobalSearchQuery } = useStore();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);
  const [filterRange, setFilterRange] = useState('last50');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [details, setDetails] = useState('');
  const [expandedTx, setExpandedTx] = useState(null);
  const [editingDetails, setEditingDetails] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Categories list
  const categories = ['General', 'Food', 'Transport', 'Salary', 'Shopping', 'Rent', 'Entertainment', 'Health', 'Travel', 'Habits'];

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Combined search filter (Local Finance Search OR Global Search)
      const combinedQuery = (searchQuery || globalSearchQuery).toLowerCase();
      const matchesSearch = t.description.toLowerCase().includes(combinedQuery) ||
                           t.category.toLowerCase().includes(combinedQuery);
      if (!matchesSearch) return false;

      // Category filter
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;

      // Type filter
      if (filterType !== 'all' && t.type !== filterType) return false;

      // Time range filter
      const txDate = new Date(t.date);
      const now = new Date();
      if (filterRange === 'today') {
        return txDate.toDateString() === now.toDateString();
      } else if (filterRange === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else if (filterRange === 'last30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return txDate >= thirtyDaysAgo && txDate <= now;
      } else if (filterRange === 'last50') {
        const fiftyDaysAgo = new Date();
        fiftyDaysAgo.setDate(now.getDate() - 50);
        return txDate >= fiftyDaysAgo && txDate <= now;
      } else if (filterRange === 'year') {
        return txDate.getFullYear() === now.getFullYear();
      } else if (filterRange === 'custom') {
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return txDate >= start && txDate <= end;
      }
      return true;
    });
  }, [transactions, searchQuery, globalSearchQuery, filterRange, filterCategory, filterType, startDate, endDate]);

  // Analytics based on FILTERED transactions
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [filteredTransactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    await addTransaction({
      description,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date(date),
      details
    });

    setDescription('');
    setAmount('');
    setDetails('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleUpdateDetails = async (txId) => {
    setIsSavingDetails(true);
    try {
      await useStore.getState().updateTransaction(txId, { details: editingDetails });
      setIsSavingDetails(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (error) {
      console.error('Failed to update details:', error);
      setIsSavingDetails(false);
    }
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

          <div className="filter-bar">
            <div className="filter-row-top">
              <CustomSelect 
                value={filterRange} 
                onChange={setFilterRange}
                icon={Calendar}
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'last30', label: 'Last 30 Days' },
                  { value: 'last50', label: 'Last 50 Days' },
                  { value: 'month', label: 'This Month' },
                  { value: 'year', label: 'This Year' },
                  { value: 'custom', label: 'Custom Range' },
                ]}
              />

              <CustomSelect 
                value={filterCategory} 
                onChange={setFilterCategory}
                icon={TagIcon}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map(c => ({ value: c, label: c }))
                ]}
              />
            </div>

            {filterRange === 'custom' && (
              <div className="custom-date-range">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                  title="From Date"
                />
                <span className="date-sep">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                  title="To Date"
                />
              </div>
            )}

            <CustomSelect 
              value={filterType} 
              onChange={setFilterType}
              icon={Filter}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'income', label: 'Income Only' },
                { value: 'expense', label: 'Expense Only' },
              ]}
            />
          </div>

          <div className="form-wrapper">
            <form className="quick-add-form" onSubmit={handleSubmit}>
              <div className="form-main">
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
                <CustomSelect 
                  value={category} 
                  onChange={setCategory}
                  variant="input"
                  options={categories.map(c => ({ value: c, label: c }))}
                />
                <div className="type-toggle-wrapper">
                  <div className="type-toggle">
                    <button 
                      type="button" 
                      className={type === 'income' ? 'active income' : ''} 
                      onClick={() => setType('income')}
                    >
                      <TrendingUp size={14} />
                      <span>Income</span>
                    </button>
                    <button 
                      type="button" 
                      className={type === 'expense' ? 'active expense' : ''} 
                      onClick={() => setType('expense')}
                    >
                      <TrendingDown size={14} />
                      <span>Expense</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-details">
                <textarea 
                  placeholder="Add more details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={1}
                />
              </div>
              <button type="submit" className="add-btn"><Plus size={18} /> Add Transaction</button>
            </form>
          </div>

          <div className="transaction-list">
            {filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <PieChart size={48} opacity={0.2} />
                <p>No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map(tx => (
                <div key={tx._id} className={`transaction-wrapper ${expandedTx === tx._id ? 'expanded' : ''}`}>
                  <div className="transaction-item" onClick={() => {
                    if (expandedTx === tx._id) {
                      setExpandedTx(null);
                    } else {
                      setExpandedTx(tx._id);
                      setEditingDetails(tx.details || '');
                    }
                  }}>
                    <div className={`tx-icon ${tx.type}`}>
                      {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div className="tx-info">
                      <div className="tx-desc-row">
                        <span className="tx-desc">{tx.description}</span>
                        {tx.details && <span className="tx-details-preview">{tx.details.substring(0, 40)}{tx.details.length > 40 ? '...' : ''}</span>}
                      </div>
                      <div className="tx-meta">
                        <span className="tx-category">{tx.category}</span>
                        <span className="meta-dot">•</span>
                        <span className="tx-date">{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                        {tx.details && <span className="meta-dot">•</span>}
                        {tx.details && <span className="tx-has-details">Has notes</span>}
                      </div>
                    </div>
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                    </div>
                    <div className="tx-actions">
                      <ChevronRight size={16} className="expand-icon" />
                      <button className="delete-tx" onClick={(e) => {
                        e.stopPropagation();
                        setTxToDelete(tx);
                        setIsDeleteModalOpen(true);
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {expandedTx === tx._id && (
                    <div className="tx-details-expanded">
                      <div className="details-editor">
                        <h6>Notes & Details</h6>
                        <textarea 
                          placeholder="Add more details about this transaction..."
                          value={editingDetails}
                          onChange={(e) => setEditingDetails(e.target.value)}
                        />
                        <div className="editor-footer">
                          {showSavedToast && <span className="save-success-msg">Changes saved!</span>}
                          <button 
                            className="save-details-btn"
                            disabled={isSavingDetails || editingDetails === (tx.details || '')}
                            onClick={() => handleUpdateDetails(tx._id)}
                          >
                            {isSavingDetails ? 'Saving...' : 'Save Notes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
          overflow-x: hidden; /* Prevent horizontal drift */
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

        .filter-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .filter-group select {
          background: transparent;
          border: none;
          color: var(--text-color);
          font-size: 13px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        }

        .filter-group select:hover {
          color: var(--primary);
        }

        .custom-date-range {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--hover-bg);
          padding: 4px 12px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .custom-date-range input {
          background: transparent;
          border: none;
          color: var(--text-color);
          font-size: 12px;
          font-weight: 500;
          outline: none;
        }

        .date-sep {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .quick-add-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .form-main {
          display: flex;
          gap: 12px;
        }

        .form-details textarea {
          width: 100%;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 8px 12px;
          border-radius: 8px;
          outline: none;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          min-height: 40px;
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

        .form-main input:first-child { flex: 2; }
        .form-main input:nth-child(2) { flex: 1; }

        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(var(--calendar-invert, 1));
          cursor: pointer;
        }

        .type-toggle-wrapper {
          flex: 1;
        }

        .type-toggle {
          display: flex;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 3px;
          height: 40px;
        }
        
        .type-toggle button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .type-toggle button.active.income { 
          background: #10b981; 
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        
        .type-toggle button.active.expense { 
          background: #f43f5e; 
          color: white;
          box-shadow: 0 4px 12px rgba(244, 63, 94, 0.2);
        }

        .add-btn {
          background: var(--primary);
          color: white;
          border: none;
          height: 40px;
          padding: 0 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          font-size: 14px;
          margin-top: 4px;
        }

        .add-btn:hover { 
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .transaction-wrapper {
          border-radius: 12px;
          border: 1px solid transparent;
          transition: all 0.2s;
          background: var(--bg-color);
        }

        .transaction-wrapper.expanded {
          background: var(--hover-bg);
          border-color: var(--border-color);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 12px;
        }

        .transaction-item:hover {
          background: var(--hover-bg);
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

        .tx-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .tx-desc-row { display: flex; align-items: baseline; gap: 12px; }
        .tx-desc { font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tx-details-preview { font-size: 11px; color: var(--text-secondary); opacity: 0.6; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px; }
        .tx-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
        .meta-dot { opacity: 0.3; }
        .tx-has-details { color: var(--primary); font-weight: 600; font-size: 10px; text-transform: uppercase; }

        .tx-amount { font-weight: 700; font-size: 15px; flex-shrink: 0; }
        .tx-amount.income { color: #10b981; }
        .tx-amount.expense { color: #f43f5e; }

        .tx-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .expand-icon {
          color: var(--text-secondary);
          transition: transform 0.2s;
          opacity: 0.5;
        }

        .transaction-wrapper.expanded .expand-icon {
          transform: rotate(90deg);
          opacity: 1;
        }

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

        .tx-details-expanded {
          padding: 0 16px 16px 68px;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .details-editor {
          padding: 12px;
          background: var(--bg-color);
          border-radius: 8px;
          border-left: 3px solid var(--primary);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .details-editor h6 {
          margin: 0;
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .details-editor textarea {
          background: var(--hover-bg);
          border: 1px solid var(--border-color);
          color: var(--text-color);
          padding: 8px 12px;
          border-radius: 6px;
          outline: none;
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
        }

        .editor-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
        }

        .save-success-msg {
          font-size: 11px;
          color: #10b981;
          font-weight: 600;
          animation: fadeIn 0.3s ease-out;
        }

        .save-details-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .save-details-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

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

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .finance-container {
            padding: 20px 12px;
            width: 100%;
            overflow-x: hidden;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .stat-card {
            padding: 16px;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
          }

          .search-box {
            width: 100%;
          }

          .filter-bar {
            flex-direction: column;
            gap: 8px;
            padding-bottom: 12px;
            align-items: stretch;
          }

          .filter-row-top {
            display: flex;
            gap: 8px;
            width: 100%;
          }

          .filter-row-top .custom-select-container {
            flex: 1;
            width: 50%; /* Explicit share */
            min-width: 0;
          }

          .custom-select-trigger {
            width: 100%;
            justify-content: space-between;
            background: var(--hover-bg);
            border: 1px solid var(--border-color);
            height: 38px;
            padding: 6px 8px;
            font-size: 12px;
          }

          .custom-select-trigger .trigger-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .form-main {
            flex-direction: column;
            gap: 10px;
          }

          .form-main .custom-select-container {
            width: 100%;
            display: block;
          }

          .form-main input, .form-main select, .type-toggle {
            width: 100%;
          }

          .add-btn {
            width: 100%;
            height: 44px;
            margin-top: 8px;
          }

          .transaction-item {
            gap: 12px;
            padding: 12px;
          }

          .tx-icon {
            width: 32px;
            height: 32px;
            flex-shrink: 0;
          }

          .tx-desc {
            font-size: 13px;
          }

          .tx-details-preview {
            display: none; /* Hide preview on mobile to save space */
          }

          .tx-meta {
            font-size: 10px;
          }

          .tx-amount {
            font-size: 14px;
          }

          .tx-details-expanded {
            padding-left: 12px;
          }

          .delete-tx {
            opacity: 0.6; /* Always show a bit on mobile since no hover */
          }
          
          .custom-date-range {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
