import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ScanHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch('http://localhost:8001/api/history');
            const data = await response.json();
            setHistory(data.history || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#28a745';
        if (score >= 70) return '#ffc107';
        return '#dc3545';
    };

    if (loading) {
        return (
            <div className="card">
                <h2>Scan History & Evidence</h2>
                <p>Loading scan history...</p>
            </div>
        );
    }

    return (
        <div className="scan-history-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Scan History & Evidence</h1>
                    <p style={{ color: '#6c757d' }}>View past compliance scans and track security trends</p>
                </div>
            </div>
            <div className="card">
                {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                        <p>No scan history yet. Run your first scan to start collecting evidence!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.map((scan, index) => (
                            <div
                                key={scan.id}
                                style={{
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    padding: '1.25rem',
                                    background: index === 0 ? '#f8f9fa' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => navigate(`/history/${scan.scan_id}`)}
                                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                                                Scan #{scan.scan_id.substring(0, 8)}
                                            </h3>
                                            {index === 0 && (
                                                <span style={{
                                                    background: 'var(--primary-blue)',
                                                    color: 'white',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600'
                                                }}>
                                                    LATEST
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6c757d' }}>
                                            {formatDate(scan.timestamp)} • {scan.triggered_by.toUpperCase()} SCAN
                                        </p>
                                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                                            {scan.account_id} ({scan.region})
                                        </p>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div
                                            style={{
                                                fontSize: '2rem',
                                                fontWeight: '700',
                                                color: getScoreColor(scan.compliance_score)
                                            }}
                                        >
                                            {scan.compliance_score}%
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                            Compliance Score
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '1rem',
                                    marginTop: '1rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid #e9ecef'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Total Resources</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{scan.total_resources}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Violations</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc3545' }}>
                                            {scan.violation_count}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Critical</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#dc3545' }}>
                                            {scan.severity_breakdown.critical}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>High</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fd7e14' }}>
                                            {scan.severity_breakdown.high}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ScanHistory;

