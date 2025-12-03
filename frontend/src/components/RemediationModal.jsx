import { useState } from 'react';

function RemediationModal({ violation, onClose }) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🔧 Remediation Steps</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="remediation-content">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4>Resource Information</h4>
                        <p><strong>Type:</strong> {violation.resource_type}</p>
                        <p><strong>ID:</strong> <code>{violation.resource_id}</code></p>
                        <p><strong>Severity:</strong> <span className={`severity-badge severity-${violation.severity.toLowerCase()}`}>{violation.severity}</span></p>
                        <p><strong>Framework:</strong> {violation.compliance_framework}</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h4>Description</h4>
                        <p>{violation.description}</p>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0 }}>Remediation Steps</h4>
                            <button
                                onClick={() => copyToClipboard(violation.remediation)}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                            >
                                {copied ? '✓ Copied!' : '📋 Copy Commands'}
                            </button>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', overflow: 'auto', border: '1px solid #dee2e6' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Courier New, monospace', fontSize: '0.875rem' }}>
                                {violation.remediation}
                            </pre>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#e7f3ff', borderRadius: '6px', border: '1px solid #0d6efd' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#0d6efd' }}>
                            <strong>💡 Tip:</strong> Click "Copy Commands" above, then paste into your terminal or AWS Console to fix this violation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RemediationModal;
