import React, { useEffect, useState } from 'react';
import './ReviewerDashboard.css';

interface Stats {
  totalApplications: number;
  reviewed: number;
  perJobCounts: Record<string, number>;
  decisionCounts: Record<string, number>;
}

interface Application {
  id: string;
  applicantId?: string;
  jobId?: string;
  submissionDate?: string;
  question1?: string;
  question2?: string;
  question3?: string;
  resumeText?: string;
  jobApplicationText?: string;
  currentStatus?: boolean;
}

const ReviewerDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [decision, setDecision] = useState('Qualified');
  const [reviewerId, setReviewerId] = useState('reviewer-1');
  const [reasoningLog, setReasoningLog] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, reviewsRes] = await Promise.all([
        fetch('/api/reviewer/stats'),
        fetch('/api/reviewer/applications'),
        fetch('/api/reviewer/reviews')
      ]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      } else {
        console.error('Failed to fetch stats');
      }
      if (appsRes.ok) {
        const a = await appsRes.json();
        setApplications(a);
      } else {
        console.error('Failed to fetch applications');
      }
      if (reviewsRes.ok) {
        const r = await reviewsRes.json();
        const map: Record<string, any> = {};
        r.forEach((item: any) => { if (item.id) map[item.id] = item; });
        setReviewsMap(map);
      } else {
        console.error('Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const finalize = async (appId: string) => {
    try {
      const res = await fetch(`/api/reviewer/finalize/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewerId, reasoningLog })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to finalize');
      }
      alert('Finalized successfully');
      // refresh
      fetchAll();
      setSelectedApp(null);
    } catch (err) {
      console.error('Error finalizing:', err);
      alert('Failed to finalize. See console for details.');
    }
  };

  // Quick finalize a record as Qualified with a default reviewer id
  const finalizeQuick = async (appId: string) => {
    try {
      const payload = { decision: 'Qualified', reviewerId: 'quick-confirm', reasoningLog: 'Quick confirmed via dashboard' };
      const res = await fetch(`/api/reviewer/finalize/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to finalize (quick)');
      }
      alert('Quick confirm successful');
      fetchAll();
    } catch (err) {
      console.error('Error quick-finalizing:', err);
      alert('Failed to quick confirm. See console for details.');
    }
  };

  // helper removed (not used) to avoid lint warnings

  try {
    const sparkPoints = stats ? Object.values(stats.perJobCounts || {}).map((v, i) => `${(i/(Object.keys(stats.perJobCounts||{}).length||1))*300},${100 - (Math.min(100, (v as number) * 3))}`).join(' ') : '';

    return (
      <div
        className="reviewer-dashboard"
        style={{
          minHeight: '100vh',
        }}
      >
        <header className="rd-header">
          <h2>Reviewer Dashboard</h2>
          <div className="rd-sub">Manage applications & human reviews</div>
        </header>

        {loading && <div className="rd-loading">Loading...</div>}

        {!loading && stats && (
          <section className="rd-stats-grid">
            <div className="rd-card rd-card-large">
              <div className="rd-card-title">Total Applications</div>
              <div className="rd-card-value">{stats.totalApplications}</div>
            </div>
            <div className="rd-card rd-card-large">
              <div className="rd-card-title">Reviewed</div>
              <div className="rd-card-value">{stats.reviewed}</div>
            </div>
            <div className="rd-card">
              <div className="rd-card-title">Qualified</div>
              <div className="rd-card-value">{stats.decisionCounts?.Qualified || 0}</div>
            </div>
            <div className="rd-card">
              <div className="rd-card-title">Not Qualified</div>
              <div className="rd-card-value">{stats.decisionCounts?.NotQualified || 0}</div>
            </div>
            <div className="rd-card">
              <div className="rd-card-title">Human Review</div>
              <div className="rd-card-value">{stats.decisionCounts?.HumanReviewRequested || 0}</div>
            </div>
          </section>
        )}

        <main className="rd-main">
          <section className="rd-left">
            <div className="rd-chart-card rd-card">
              <div className="rd-card-title">Applications over time</div>
              <svg className="rd-sparkline" viewBox="0 0 300 100" preserveAspectRatio="none">
                {/* Simple placeholder sparkline built from perJobCounts */}
                <polyline fill="none" stroke="#444444" strokeWidth="3" points={sparkPoints} />
              </svg>
            </div>

            <div className="rd-list-card rd-card">
              <div className="rd-card-title">Needs Review</div>
              <ul className="rd-list">
                {applications.filter(a => !a.currentStatus).map(app => (
                  <li key={app.id} className="rd-list-item">
                    <div className="rd-list-left">
                      <div className="rd-list-name">{app.applicantId || '—'}</div>
                      <div className="rd-list-sub">{app.jobId} • {app.submissionDate}</div>
                    </div>
                    <div className="rd-list-actions">
                      {reviewsMap[app.id] && reviewsMap[app.id].decision && reviewsMap[app.id].decision.toLowerCase().includes('human') && (
                        <span className="badge">Human</span>
                      )}
                      <button className="btn small" onClick={() => setSelectedApp(app)}>Review</button>
                      <button className="btn small ghost" onClick={() => finalizeQuick(app.id)}>Quick</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rd-list-card rd-card">
              <div className="rd-card-title">Confirmed</div>
              <ul className="rd-list">
                {applications.filter(a => a.currentStatus).map(app => (
                  <li key={app.id} className="rd-list-item">
                    <div className="rd-list-left">
                      <div className="rd-list-name">{app.applicantId || '—'}</div>
                      <div className="rd-list-sub">{app.jobId} • {app.submissionDate}</div>
                    </div>
                    <div className="rd-list-actions">
                      {/* show AI decision if present */}
                      {reviewsMap[app.id] && reviewsMap[app.id].decision ? (
                        <span className="badge">AI: {String(reviewsMap[app.id].decision)}</span>
                      ) : (
                        <span className="badge" style={{background: '#262733'}}>Reviewed</span>
                      )}
                      <button className="btn small" onClick={() => setSelectedApp(app)}>View</button>
                      <button className="btn small ghost" onClick={() => setSelectedApp(app)}>Re-review</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="rd-right rd-card">
            <div className="rd-card-title">Selected Application</div>
            {!selectedApp && <div className="rd-empty">Select an application to review</div>}
            {selectedApp && (
              <div className="rd-selected rd-selected--card">
                {reviewsMap[selectedApp.id] && (
                  <div className="rd-ai-review">
                    <div className="rd-ai-review__label">AI Review</div>
                    <div className="rd-ai-review__decision">{String(reviewsMap[selectedApp.id].decision || 'No decision')}</div>
                    <div className="rd-ai-review__reason">{String(reviewsMap[selectedApp.id].reasoningLog || '')}</div>
                  </div>
                )}
                <div className="rd-field rd-field--mb">
                  <span className="rd-field__label">Applicant</span>
                  <div className="rd-field__value rd-field__value--main">{selectedApp.applicantId}</div>
                </div>
                <div className="rd-field rd-field--mb">
                  <span className="rd-field__label">Job</span>
                  <div className="rd-field__value">{selectedApp.jobId}</div>
                </div>
                <div className="rd-field rd-field--mb">
                  <span className="rd-field__label">Q1</span>
                  <div className="rd-pre rd-pre--q">{selectedApp.question1}</div>
                </div>
                <div className="rd-field rd-field--mb">
                  <span className="rd-field__label">Q2</span>
                  <div className="rd-pre rd-pre--q">{selectedApp.question2}</div>
                </div>
                <div className="rd-field rd-field--mb">
                  <span className="rd-field__label">Q3</span>
                  <div className="rd-pre rd-pre--q">{selectedApp.question3}</div>
                </div>
                <div className="rd-field rd-field--mb-lg">
                  <span className="rd-field__label">Resume</span>
                  <div className="rd-pre small rd-pre--resume">{selectedApp.resumeText}</div>
                </div>

                <div className="rd-form rd-form--mb">
                  <label className="rd-form__label">Decision</label>
                  <select value={decision} onChange={(e) => setDecision(e.target.value)} className="rd-form__input">
                    <option>Qualified</option>
                    <option>Not Qualified</option>
                    <option>Human Review Requested</option>
                  </select>

                  <label className="rd-form__label">Reviewer ID</label>
                  <input value={reviewerId} onChange={e => setReviewerId(e.target.value)} className="rd-form__input" />

                  <label className="rd-form__label">Notes</label>
                  <textarea value={reasoningLog} onChange={e => setReasoningLog(e.target.value)} className="rd-form__input rd-form__textarea" />

                  <div className="rd-actions rd-actions--mb">
                    <button className="btn rd-actions__btn" onClick={() => finalize(selectedApp.id)}>Finalize</button>
                    <button className="btn ghost rd-actions__btn" onClick={() => setSelectedApp(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </main>
      </div>
    );
  } catch (e) {
    console.error('ReviewerDashboard render error:', e);
    return (
      <div style={{ padding: 20 }}>
        <h3>Reviewer Dashboard Error</h3>
        <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>{String(e)}</pre>
      </div>
    );
  }
};

export default ReviewerDashboard;
