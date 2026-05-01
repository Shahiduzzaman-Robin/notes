"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Calendar, Clock } from 'lucide-react';
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

  if (error) return (
    <div className="public-container flex-center">
      <div className="error-card glass">
        <h2>Note Not Available</h2>
        <p>{error}</p>
      </div>
    </div>
  );

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
