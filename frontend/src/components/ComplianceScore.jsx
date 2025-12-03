import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

function ComplianceScore({ score, totalRules, passingRules }) {
    const data = [{ name: 'score', value: score, fill: 'var(--primary-blue)' }];

    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981'; // Success Green
        if (score >= 60) return '#f59e0b'; // Warning Orange
        return '#ef4444'; // Danger Red
    };

    const circleColor = getScoreColor(score);

    return (
        <div className="card" style={{ height: '100%' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#64748b' }}>Overall Security Compliance</h2>

            <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                {/* Background Track */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="80%"
                            outerRadius="100%"
                            barSize={15}
                            data={[{ value: 100, fill: '#f1f5f9' }]}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                clockWise
                                dataKey="value"
                                cornerRadius={10}
                                fill="#f1f5f9"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>

                {/* Score Progress */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="80%"
                            outerRadius="100%"
                            barSize={15}
                            data={[{ value: score, fill: circleColor }]}
                            startAngle={90}
                            endAngle={90 - (360 * score / 100)}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                clockWise
                                dataKey="value"
                                cornerRadius={10}
                                fill={circleColor}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>

                {/* Center Text */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 10
                }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1e293b' }}>
                        {score}%
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Score</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#10b981' }}>{passingRules}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Passing Rules</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#64748b' }}>{totalRules}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Rules</div>
                </div>
            </div>
        </div>
    );
}

export default ComplianceScore;
