import { useState, useEffect } from 'react';

function MonitoringSettings() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        enabled: false,
        interval_hours: 24,
        account_id: '',
        region: 'us-east-1'
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await fetch('http://localhost:8001/api/monitoring/status');
            const data = await response.json();
            setStatus(data);
            setConfig(prev => ({
                ...prev,
                enabled: data.enabled,
                interval_hours: data.interval_hours
            }));
        } catch (error) {
            console.error('Error fetching monitoring status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('http://localhost:8001/api/monitoring/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                alert('Monitoring settings saved successfully!');
                fetchStatus();
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const formatNextScan = (isoString) => {
        if (!isoString) return 'Not scheduled';
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="card">
                <h2>Continuous Monitoring Settings</h2>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="card">
            <h2 style={{ marginBottom: '0.5rem' }}>Continuous Monitoring Settings</h2>
            <p style={{ color: '#6c757d', fontSize: '0.875rem', marginBottom: '2rem' }}>
                Configure automated compliance scans (Admin only)
            </p>

            <div style={{
                background: config.enabled ? '#d4edda' : '#f8d7da',
                border: `1px solid ${config.enabled ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: config.enabled ? '#155724' : '#721c24' }}>
                        Monitoring {config.enabled ? 'Enabled' : 'Disabled'}
                    </h3>
                </div>
                {config.enabled && status?.next_scan && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#155724' }}>
                        Next scan: {formatNextScan(status.next_scan)}
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>
                        <input
                            id="enableMonitoring"
                            name="enableMonitoring"
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        Enable Automated Scans
                    </label>
                    <p style={{ margin: '0.5rem 0 0 2rem', fontSize: '0.875rem', color: '#6c757d' }}>
                        Automatically scan accounts at regular intervals
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                        Scan Frequency
                    </label>
                    <select
                        id="scanFrequency"
                        name="scanFrequency"
                        value={config.interval_hours}
                        onChange={(e) => setConfig({ ...config, interval_hours: parseInt(e.target.value) })}
                        style={{
                            width: '100%',
                            padding: '0.625rem',
                            borderRadius: '6px',
                            border: '1px solid #ced4da',
                            fontSize: '0.95rem'
                        }}
                    >
                        <option value={6}>Every 6 hours</option>
                        <option value={12}>Every 12 hours</option>
                        <option value={24}>Every 24 hours (Daily)</option>
                    </select>
                </div>

                <div style={{
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Default Scan Target (Optional)</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                AWS Account ID
                            </label>
                            <input
                                id="defaultAccountId"
                                name="defaultAccountId"
                                type="text"
                                autoComplete="off"
                                value={config.account_id}
                                onChange={(e) => setConfig({ ...config, account_id: e.target.value })}
                                placeholder="123456789012"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    borderRadius: '6px',
                                    border: '1px solid #ced4da',
                                    fontSize: '0.95rem'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                AWS Region
                            </label>
                            <select
                                value={config.region}
                                onChange={(e) => setConfig({ ...config, region: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    borderRadius: '6px',
                                    border: '1px solid #ced4da',
                                    fontSize: '0.95rem'
                                }}
                            >
                                <option value="us-east-1">us-east-1</option>
                                <option value="us-west-2">us-west-2</option>
                                <option value="eu-west-1">eu-west-1</option>
                            </select>
                        </div>
                    </div>

                    <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#6c757d' }}>
                        Leave blank to use most recent scan target. Uses default AWS credentials.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem', alignSelf: 'flex-start' }}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            <div style={{
                marginTop: '2rem',
                background: '#e7f3ff',
                border: '1px solid var(--primary-blue-light)',
                borderRadius: '8px',
                padding: '1rem'
            }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--primary-blue)' }}>
                    <strong>Note:</strong> Automated scans will create scan history records for compliance tracking and trend analysis.
                </p>
            </div>
        </div>
    );
}

export default MonitoringSettings;
