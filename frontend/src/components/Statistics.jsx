import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function Statistics({ totalResources, compliant, nonCompliant, lastScan, critical, high, medium, low }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const pieData = [
        { name: 'Compliant', value: compliant, color: '#10b981' },
        { name: 'Non-Compliant', value: nonCompliant, color: '#ef4444' }
    ];

    const barData = [
        { name: 'Critical', value: critical, color: '#ef4444' },
        { name: 'High', value: high, color: '#f97316' },
        { name: 'Medium', value: medium, color: '#f59e0b' },
        { name: 'Low', value: low, color: '#3b82f6' }
    ];

    return (
        <div className="card">
            <h2>Security Statistics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
                {/* Compliance Overview */}
                <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                    <h3 style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '1rem', color: '#64748b' }}>Resource Compliance</h3>
                    <ResponsiveContainer width="99%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Violations by Severity */}
                <div style={{ height: '300px', width: '100%', minWidth: 0 }}>
                    <h3 style={{ textAlign: 'center', fontSize: '1rem', marginBottom: '1rem', color: '#64748b' }}>Violations by Severity</h3>
                    <ResponsiveContainer width="99%" height="100%">
                        <BarChart data={barData}>
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis allowDecimals={false} fontSize={12} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="stats-grid" style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <div className="stat-box">
                    <div className="stat-number" style={{ color: 'var(--primary-blue)' }}>
                        {totalResources}
                    </div>
                    <div className="stat-label">Total Resources</div>
                </div>

                <div className="stat-box">
                    <div className="stat-number" style={{ color: '#10b981' }}>
                        {compliant}
                    </div>
                    <div className="stat-label">Compliant</div>
                </div>

                <div className="stat-box">
                    <div className="stat-number" style={{ color: '#ef4444' }}>
                        {nonCompliant}
                    </div>
                    <div className="stat-label">Non-Compliant</div>
                </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    <strong>Last Scan:</strong> {formatDate(lastScan)}
                </p>
            </div>
        </div>
    );
}

export default Statistics;
