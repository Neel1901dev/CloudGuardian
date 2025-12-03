import { useState } from 'react';
import RemediationModal from './RemediationModal';

function ViolationsList({ violations }) {
    const [selectedViolation, setSelectedViolation] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const handleViewRemediation = (violation) => {
        setSelectedViolation(violation);
        setShowModal(true);
    };

    const getSeverityBadge = (severity) => {
        const className = `severity-badge severity-${severity.toLowerCase()}`;
        return (
            <span className={`tooltip ${className}`}>
                {severity}
                <span className="tooltip-text">
                    {severity === 'CRITICAL' && 'Immediate action required - High security risk'}
                    {severity === 'HIGH' && 'Address soon - Significant security concern'}
                    {severity === 'MEDIUM' && 'Should be fixed - Moderate security issue'}
                    {severity === 'LOW' && 'Low priority - Minor security improvement'}
                </span>
            </span>
        );
    };

    // Filter violations by severity and search query
    const filteredViolations = violations?.filter(v => {
        const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter;
        const matchesSearch = !searchQuery ||
            v.resource_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.violation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.compliance_framework.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSeverity && matchesSearch;
    }) || [];

    if (!violations || violations.length === 0) {
        return (
            <div className="card">
                <h2>No Violations Found</h2>
                <p>All resources are compliant! Great job maintaining security standards.</p>
            </div>
        );
    }

    // Count violations by severity
    const counts = violations.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <div className="card">
                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ margin: 0 }}>Security Violations ({filteredViolations.length})</h2>

                        {/* Search Box */}
                        <input
                            type="text"
                            className="search-box"
                            placeholder="🔍 Search violations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ maxWidth: '300px' }}
                        />
                    </div>

                    {/* Severity Filter Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSeverityFilter('ALL')}
                            className={`btn ${severityFilter === 'ALL' ? 'btn-primary' : ''}`}
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.875rem',
                                background: severityFilter === 'ALL' ? 'var(--primary-blue)' : '#f8f9fa',
                                color: severityFilter === 'ALL' ? 'white' : '#495057',
                                border: '1px solid #dee2e6'
                            }}
                        >
                            All ({violations.length})
                        </button>
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                            counts[sev] > 0 && (
                                <button
                                    key={sev}
                                    onClick={() => setSeverityFilter(sev)}
                                    className={`btn ${severityFilter === sev ? 'btn-primary' : ''}`}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.875rem',
                                        background: severityFilter === sev ? 'var(--primary-blue)' : '#f8f9fa',
                                        color: severityFilter === sev ? 'white' : '#495057',
                                        border: '1px solid #dee2e6'
                                    }}
                                >
                                    {sev} ({counts[sev]})
                                </button>
                            )
                        ))}
                    </div>
                </div>

                {filteredViolations.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                        <p>No violations match your search criteria.</p>
                    </div>
                ) : (
                    <table className="violations-table">
                        <thead>
                            <tr>
                                <th>Severity</th>
                                <th>Resource</th>
                                <th>Resource ID</th>
                                <th>Violation</th>
                                <th>
                                    <span className="tooltip">
                                        Framework
                                        <span className="tooltip-text">Compliance framework reference (NIST SP 800-53 or ISO 27001)</span>
                                    </span>
                                </th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredViolations.map((violation, index) => (
                                <tr key={index} onClick={() => handleViewRemediation(violation)}>
                                    <td>{getSeverityBadge(violation.severity)}</td>
                                    <td>{violation.resource_type}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {violation.resource_id}
                                    </td>
                                    <td>{violation.violation}</td>
                                    <td style={{ fontSize: '0.875rem' }}>{violation.compliance_framework}</td>
                                    <td>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewRemediation(violation);
                                            }}
                                        >
                                            View Fix
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && selectedViolation && (
                <RemediationModal
                    violation={selectedViolation}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedViolation(null);
                    }}
                />
            )}
        </>
    );
}

export default ViolationsList;
