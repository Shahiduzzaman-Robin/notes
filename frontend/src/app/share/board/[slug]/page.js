"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Kanban, Calendar, CheckCircle2, Circle, Clock, Lock } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicBoardView() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicBoard = async () => {
      try {
        const res = await fetch(`/api/public/boards/${slug}`);
        if (!res.ok) throw new Error('Board not found or sharing is disabled');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicBoard();
  }, [slug]);

  if (loading) return (
    <div className="public-container flex-center">
      <div className="glass-loader">Loading public workflow...</div>
    </div>
  );

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="icon-wrapper">
            <Lock size={40} strokeWidth={1.5} />
          </div>
          <h1>Workflow Private or Missing</h1>
          <p>This workflow is either not available or public sharing has been disabled by the owner.</p>
          <div className="brand-footer">Notes by <a href="https://facebook.com/mds.zamanrobin/" target="_blank" rel="noopener noreferrer" className="dev-link">Robin</a></div>
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
            color: #2383e2;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          h1 { margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; }
          p { margin: 0; font-size: 15px; color: #64748b; line-height: 1.6; }
          .brand-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(0,0,0,0.05); font-size: 13px; font-weight: 600; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; }
        `}</style>
      </div>
    );
  }

  const { board, tasks } = data;

  return (
    <div className="public-container">
      <div className="board-wrapper animate-fade-in">
        <header className="board-header glass">
          <div className="type-badge">
            <Kanban size={14} />
            <span>Shared Workflow</span>
          </div>
          <h1>{board.name}</h1>
          <div className="board-meta">
            <div className="meta-item">
              <Calendar size={14} />
              <span>Created {format(new Date(board.createdAt), 'MMM d, yyyy')}</span>
            </div>
            <div className="meta-item">
              <CheckCircle2 size={14} />
              <span>{tasks.length} Tasks</span>
            </div>
          </div>
        </header>

        <div className="kanban-board-container">
          {board.columns.sort((a, b) => a.order - b.order).map(column => (
            <div key={column.id} className="kanban-column glass">
              <div className="column-header">
                <div className="column-info">
                  <span className={`status-dot ${column.id}`}></span>
                  <h3>{column.title}</h3>
                  <span className="task-count">{tasks.filter(t => t.columnId === column.id).length}</span>
                </div>
              </div>

              <div className="task-list">
                {tasks
                  .filter(t => t.columnId === column.id)
                  .sort((a, b) => a.order - b.order)
                  .map(task => (
                    <div key={task._id} className="task-card glass">
                      <div className="task-main">
                        <div className="task-check">
                          {column.id === 'done' ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} opacity={0.3} />}
                        </div>
                        <span className="task-content">{task.content}</span>
                      </div>
                      <div className="task-footer">
                         <div className="task-meta">
                            <Clock size={10} />
                            <span>{format(new Date(task.updatedAt), 'MMM d')}</span>
                         </div>
                      </div>
                    </div>
                  ))}
                {tasks.filter(t => t.columnId === column.id).length === 0 && (
                  <div className="empty-column-msg">No tasks in this stage</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <footer className="public-footer">
          <p>Shared via Notes by <a href="https://facebook.com/mds.zamanrobin/" target="_blank" rel="noopener noreferrer" className="dev-link">Robin</a> • Professional Workflow Tracking</p>
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

        .flex-center { align-items: center; }

        .board-wrapper {
          width: 100%;
          max-width: 1200px;
        }

        .board-header {
          padding: 40px;
          border-radius: 24px;
          margin-bottom: 40px;
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
          margin-bottom: 16px;
        }

        h1 {
          font-size: 36px;
          font-weight: 800;
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
        }

        .board-meta {
          display: flex;
          gap: 20px;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .meta-item { display: flex; align-items: center; gap: 6px; }

        .kanban-board-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 60px;
        }

        .kanban-column {
          padding: 20px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: fit-content;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .column-info { display: flex; align-items: center; gap: 8px; }

        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.todo { background: #94a3b8; }
        .status-dot.in-progress { background: #3b82f6; }
        .status-dot.done { background: #10b981; }

        h3 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .task-count { font-size: 12px; opacity: 0.5; font-weight: 600; }

        .task-list { display: flex; flex-direction: column; gap: 12px; }

        .task-card {
          padding: 16px;
          border-radius: 12px;
          background: var(--bg-color);
        }

        .task-main { display: flex; gap: 12px; align-items: flex-start; }
        .task-content { font-size: 14px; line-height: 1.5; font-weight: 500; }

        .task-footer { margin-top: 12px; display: flex; justify-content: flex-end; }
        .task-meta { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-secondary); opacity: 0.7; }

        .text-success { color: #10b981; }
        .empty-column-msg { text-align: center; font-size: 12px; color: var(--text-secondary); opacity: 0.5; padding: 20px 0; }

        .public-footer {
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .dev-link {
          color: inherit;
          text-decoration: none;
          font-weight: 700;
          transition: all 0.2s;
          border-bottom: 1px solid transparent;
        }

        .dev-link:hover {
          color: #2383e2;
          border-bottom-color: #2383e2;
        }

        .error-card { padding: 40px; text-align: center; border-radius: 20px; }

        @media (max-width: 768px) {
          .kanban-board-container { grid-template-columns: 1fr; }
          .board-header { padding: 30px 20px; }
          h1 { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
