"use client";
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.1s ease-out;
        }
        .modal-content {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          width: 400px;
          max-width: 90vw;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          padding: 24px;
          animation: slideUp 0.15s ease-out;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-color);
        }
        .close-btn {
          color: var(--text-secondary);
          padding: 4px;
          border-radius: 4px;
          transition: background 0.1s;
        }
        .close-btn:hover {
          background: var(--hover-bg);
          color: var(--text-color);
        }
        .modal-body {
          margin-bottom: 24px;
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
