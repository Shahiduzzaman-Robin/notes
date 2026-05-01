"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Lock, Clock, Tag, AlignLeft, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicNoteView() {
  const { slug } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicNote = async () => {
      try {
        const res = await fetch(`/api/public/notes/${slug}`);
        if (!res.ok) throw new Error('Note not found or sharing is disabled');
        const data = await res.json();
        setNote(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicNote();
  }, [slug]);

  if (loading) return (
    <div className="public-container flex-center">
      <div className="glass-loader">Loading public note...</div>
    </div>
  );

  if (!note) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="icon-wrapper">
            <Lock size={40} strokeWidth={1.5} />
          </div>
          <h1>Note Private or Missing</h1>
          <p>This note is either not available or public sharing has been disabled by the owner.</p>
          <div className="brand-footer">Notes by Robin</div>
        </div>

        <style jsx>{`
          .error-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            padding: 20px;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .error-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            padding: 48px 32px;
            border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.05);
            max-width: 400px;
            width: 100%;
            text-align: center;
            animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .icon-wrapper {
            width: 80px;
            height: 80px;
            background: rgba(35, 131, 226, 0.1);
            color: var(--primary);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          h1 { margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; }
          p { margin: 0; font-size: 15px; color: #64748b; lineHeight: 1.6; }
          .brand-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(0,0,0,0.05); font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="public-container">
      <div className="public-note-card glass animate-fade-in">
        <header className="note-header">
          <div className="type-badge">
            <FileText size={14} />
            <span>Shared Note</span>
          </div>
          <h1>{note.title}</h1>
          <div className="note-meta">
            <div className="meta-item">
              <Calendar size={14} />
              <span>Created {format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
            </div>
            <div className="meta-item">
              <Clock size={14} />
              <span>Last updated {format(new Date(note.updatedAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </header>

        <div className="note-content prose" dangerouslySetInnerHTML={{ __html: note.content }} />
        
        <footer className="public-footer">
          <p>Shared via Notes by Robin</p>
        </footer>
      </div>

      <style jsx>{`
        .public-container {
          min-height: 100vh;
          background: var(--bg-color);
          display: flex;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-color);
        }

        .flex-center {
          align-items: center;
        }

        .public-note-card {
          width: 100%;
          max-width: 800px;
          padding: 60px;
          border-radius: 24px;
          height: fit-content;
        }

        .glass {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        }

        :global(.dark) .glass {
          background: rgba(17, 24, 39, 0.4);
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        h1 {
          font-size: 42px;
          font-weight: 800;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .note-meta {
          display: flex;
          gap: 20px;
          color: var(--text-secondary);
          font-size: 13px;
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .note-content {
          font-size: 17px;
          line-height: 1.7;
          color: var(--text-color);
        }

        .note-content :global(table) {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .note-content :global(table td),
        .note-content :global(table th) {
          min-width: 1em;
          border: 1px solid #e2e8f0;
          padding: 12px 15px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          text-align: left;
        }

        .note-content :global(table th) {
          font-weight: bold;
          text-align: left;
          background-color: #f8fafc;
        }

        .note-content :global(table p) {
          margin: 0;
        }

        .public-footer {
          margin-top: 60px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .error-card {
          padding: 40px;
          text-align: center;
          border-radius: 20px;
        }

        @media (max-width: 640px) {
          .public-note-card { padding: 30px 20px; }
          h1 { font-size: 32px; }
          .note-meta { flex-direction: column; gap: 8px; }
        }
      `}</style>
    </div>
  );
}
