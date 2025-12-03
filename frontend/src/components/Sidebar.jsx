import { useNavigate, useLocation } from 'react-router-dom';

function Sidebar({ user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        { label: 'Dashboard', path: '/' },
        ...(isAdmin ? [
            { label: 'Access Reviews', path: '/access-reviews' },
            { label: 'Scan History', path: '/history' },
            { label: 'Settings', path: '/settings' }
        ] : [])
    ];

    return (
        <div style={{
            width: '260px',
            background: 'var(--sidebar-bg)',
            color: 'var(--sidebar-text)',
            display: 'flex',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>
            {/* Brand */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h1 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                    CloudGuardian
                </h1>
                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                    Enterprise Compliance
                </p>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                background: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: location.pathname === item.path ? 'white' : 'inherit',
                                border: 'none',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '0.9rem',
                                fontWeight: location.pathname === item.path ? '600' : '400',
                                transition: 'all 0.2s'
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* User Profile */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--primary-blue)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                    }}>
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.name || 'User'}
                        </div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                            {user?.role || 'Viewer'}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                    Sign Out
                </button>
            </div>
        </div >
    );
}

export default Sidebar;
