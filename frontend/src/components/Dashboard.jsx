import { useState, useEffect } from 'react';
import { getDashboard } from '../services/api';
import ComplianceScore from './ComplianceScore';
import Statistics from './Statistics';
import ViolationsList from './ViolationsList';
import ScanForm from './ScanForm';

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const dashboardData = await getDashboard();
            setData(dashboardData);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleScanComplete = () => {
        fetchDashboardData();
        setIsScanning(false);
    };

    // Calculate time ago for last scanned
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Never';

        const now = new Date();
        const scanTime = new Date(timestamp);
        const diffMs = now - scanTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins === 1) return '1 minute ago';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours === 1) return '1 hour ago';
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    if (loading) {
        return (
            <div className="card">
                <h2>Loading Dashboard...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card" style={{ borderColor: '#f5c6cb', background: '#f8d7da' }}>
                <h2 style={{ color: '#721c24' }}>Error</h2>
                <p style={{ color: '#721c24' }}>{error}</p>
                <button onClick={fetchDashboardData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    const lastScanTime = data.violations?.[0]?.timestamp || data.summary?.last_scan;

    return (
        <div>
            {/* Header with Last Scanned */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="last-scanned">
                    <span>🕐</span>
                    <span>
                        <strong>Last scanned:</strong> {getTimeAgo(lastScanTime)}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={fetchDashboardData}
                        className="btn"
                        disabled={loading}
                        style={{
                            background: 'transparent',
                            border: '2px solid var(--primary-blue)',
                            color: 'var(--primary-blue)',
                            padding: '0.6rem 1.2rem',
                            fontWeight: '600',
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => window.open(`http://localhost:8001/api/report/pdf?account_id=${data.summary?.account_id || ''}`, '_blank')}
                            className="btn btn-success"
                        >
                            Download Report
                        </button>
                    )}
                </div>
            </div>

            {/* Scan Form (Admin Only) */}
            {isAdmin && (
                <div style={{ marginBottom: '2rem' }}>
                    <ScanForm
                        onScanStart={() => setIsScanning(true)}
                        onScanEnd={() => setIsScanning(false)}
                        onScanComplete={handleScanComplete}
                    />
                </div>
            )}

            {/* Dashboard Components */}
            <div style={{ marginBottom: '1.5rem' }}>
                <ComplianceScore
                    score={data.compliance_score}
                    totalRules={data.summary.total_rules}
                    passingRules={data.summary.compliant_rules}
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <Statistics
                    critical={data.summary.critical_violations}
                    high={data.summary.high_violations}
                    medium={data.summary.medium_violations}
                    low={data.summary.low_violations}
                />
            </div>

            {/* Violations List */}
            <div className="card">
                <h2>Security Violations</h2>
                <ViolationsList violations={data.violations} />
            </div>
        </div>
    );
}

export default Dashboard;
