import { useState, useEffect } from 'react';
import { scanAWS } from '../services/api';

function ScanForm({ onScanComplete, onScanStart, onScanEnd }) {
    // Load saved settings from localStorage
    const [accountId, setAccountId] = useState(() => localStorage.getItem('aws_account_id') || '');
    const [region, setRegion] = useState(() => localStorage.getItem('aws_region') || 'us-east-1');
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState(null);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (accountId) localStorage.setItem('aws_account_id', accountId);
    }, [accountId]);

    useEffect(() => {
        localStorage.setItem('aws_region', region);
    }, [region]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!accountId || accountId.length !== 12) {
            setMessage({ type: 'error', text: 'Please enter a valid 12-digit AWS Account ID' });
            return;
        }

        try {
            setScanning(true);
            setMessage(null);
            if (onScanStart) onScanStart();

            const response = await scanAWS(accountId, region);
            setMessage({ type: 'success', text: `${response.message}. Scan completed successfully!` });

            // Refresh dashboard after a delay
            setTimeout(() => {
                onScanComplete();
                if (onScanEnd) onScanEnd();
            }, 5000);
        } catch (error) {
            console.error('Scan error:', error);
            if (onScanEnd) onScanEnd();
            setMessage({
                type: 'error',
                text: `Scan failed: ${error.response?.data?.detail || error.message}. Please check AWS credentials.`
            });
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
            <h2>Initiate AWS Security Scan</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="accountId">AWS Account ID</label>
                        <input
                            id="accountId"
                            name="accountId"
                            type="text"
                            placeholder="123456789012"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                            maxLength="12"
                            autoComplete="off"
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label htmlFor="region">AWS Region</label>
                        <select
                            id="region"
                            name="region"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            autoComplete="off"
                        >
                            <option value="us-east-1">US East (N. Virginia)</option>
                            <option value="us-east-2">US East (Ohio)</option>
                            <option value="us-west-1">US West (N. California)</option>
                            <option value="us-west-2">US West (Oregon)</option>
                            <option value="eu-west-1">EU (Ireland)</option>
                            <option value="eu-central-1">EU (Frankfurt)</option>
                            <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={scanning}
                            style={{ height: 'fit-content' }}
                        >
                            {scanning ? 'Scanning...' : 'Start Scan'}
                        </button>


                    </div>
                </div>
            </form>

            {message && (
                <div
                    style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '8px',
                        background: message.type === 'success' ? '#28a745' : '#dc3545',
                        color: 'white'
                    }}
                >
                    {message.text}
                </div>
            )}
        </div>
    );
}

export default ScanForm;
