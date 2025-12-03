import { useState, useEffect } from 'react';

function AccessReviews() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchAccessReviews();
    }, []);

    const fetchAccessReviews = async () => {
        try {
            const response = await fetch('http://localhost:8001/api/access-reviews');
            const result = await response.json();
            setData(result.data);
        } catch (error) {
            console.error('Error fetching access reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskBadge = (risk) => {
        const colors = {
            CRITICAL: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
            HIGH: { bg: '#fff3cd', text: '#856404', border: '#ffeeba' },
            MEDIUM: { bg: '#fff3cd', text: '#856404', border: '#ffeeba' },
            LOW: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' }
        };
        const color = colors[risk] || colors.LOW;
        return (
            <span style={{
                background: color.bg,
                color: color.text,
                border: `1px solid ${color.border}`,
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600'
            }}>
                {risk}
            </span>
        );
    };

    const filteredEntities = () => {
        if (!data) return [];
        const allEntities = [...data.users, ...data.roles];
        if (filter === 'all') return allEntities;
        return allEntities.filter(e => e.risk_level.toLowerCase() === filter);
    };

    if (loading) {
        return (
            <div className="card">
                <h2>Loading Access Reviews...</h2>
            </div>
        );
    }

    const entities = filteredEntities();

    return (
        <div className="access-reviews-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>User Access Reviews</h1>
                    <p style={{ color: '#6c757d' }}>Review IAM permissions and detect overprivileged access</p>
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3>Total Entities</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary-blue)' }}>
                        {data.summary.total_entities}
                    </div>
                    <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                        {data.summary.total_users} users • {data.summary.total_roles} roles
                    </p>
                </div>

                <div className="card">
                    <h3>Critical Risk</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#dc3545' }}>
                        {data.summary.critical_risk}
                    </div>
                    <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                        Require immediate review
                    </p>
                </div>

                <div className="card">
                    <h3>High Risk</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fd7e14' }}>
                        {data.summary.high_risk}
                    </div>
                    <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                        Need attention
                    </p>
                </div>

                <div className="card">
                    <h3>Medium/Low</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#28a745' }}>
                        {data.summary.medium_risk + data.summary.low_risk}
                    </div>
                    <p style={{ color: '#6c757d', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                        Acceptable risk
                    </p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setFilter('all')} className="btn" style={{ background: filter === 'all' ? 'var(--primary-blue)' : '#e9ecef', color: filter === 'all' ? 'white' : '#495057' }}>
                        All ({data.summary.total_entities})
                    </button>
                    <button onClick={() => setFilter('critical')} className="btn" style={{ background: filter === 'critical' ? '#dc3545' : '#f8d7da', color: filter === 'critical' ? 'white' : '#721c24' }}>
                        Critical ({data.summary.critical_risk})
                    </button>
                    <button onClick={() => setFilter('high')} className="btn" style={{ background: filter === 'high' ? '#fd7e14' : '#fff3cd', color: filter === 'high' ? 'white' : '#856404' }}>
                        High ({data.summary.high_risk})
                    </button>
                    <button onClick={() => setFilter('medium')} className="btn" style={{ background: filter === 'medium' ? '#ffc107' : '#fff3cd', color: filter === 'medium' ? 'white' : '#856404' }}>
                        Medium ({data.summary.medium_risk})
                    </button>
                    <button onClick={() => setFilter('low')} className="btn" style={{ background: filter === 'low' ? '#28a745' : '#d4edda', color: filter === 'low' ? 'white' : '#155724' }}>
                        Low ({data.summary.low_risk})
                    </button>
                </div>
            </div>

            <div className="card">
                <h2 style={{ marginBottom: '1rem' }}>Access Review Results ({entities.length})</h2>

                {entities.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                        No entities match the selected filter.
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="violations-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Name</th>
                                    <th>Risk Level</th>
                                    <th>Policies</th>
                                    <th>Risk Reasons</th>
                                    <th>Last Activity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entities.map((entity, index) => (
                                    <tr key={index}>
                                        <td>
                                            <span style={{
                                                background: entity.type === 'user' ? '#e7f3ff' : '#fff3e7',
                                                color: entity.type === 'user' ? 'var(--primary-blue)' : '#fd7e14',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                {entity.type}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{entity.name}</strong>
                                        </td>
                                        <td>{getRiskBadge(entity.risk_level)}</td>
                                        <td>
                                            {entity.total_policies} policies
                                            {entity.attached_policies.length > 0 && (
                                                <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                                    {entity.attached_policies.slice(0, 2).join(', ')}
                                                    {entity.attached_policies.length > 2 && '...'}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {entity.risk_reasons.length > 0 ? (
                                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
                                                    {entity.risk_reasons.map((reason, idx) => (
                                                        <li key={idx}>{reason}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span style={{ color: '#6c757d' }}>No issues detected</span>
                                            )}
                                        </td>
                                        <td>
                                            {entity.last_activity ? (
                                                new Date(entity.last_activity).toLocaleDateString()
                                            ) : (
                                                <span style={{ color: '#6c757d' }}>N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AccessReviews;
