import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple 2-role system: Admin and Viewer
const USERS = {
    'admin@example.com': { password: 'admin123', name: 'Admin User', role: 'admin' },
    'viewer@example.com': { password: 'viewer123', name: 'Viewer User', role: 'viewer' }
};

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const emailRef = useRef(null);
    const navigate = useNavigate();

    // Auto-focus email field on mount
    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check credentials
        const user = USERS[email];
        if (user && user.password === password) {
            const userData = {
                email,
                name: user.name,
                role: user.role
            };

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('user', JSON.stringify(userData));

            // Set expiry based on "Remember Me"
            const expiry = rememberMe
                ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
                : Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            localStorage.setItem('authExpiry', expiry.toString());
            localStorage.setItem('lastActivity', Date.now().toString());

            navigate('/');
        } else {
            setError('Invalid credentials. Check demo credentials below.');
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%)'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '420px'
            }}>
                <h1 style={{
                    fontSize: '1.75rem',
                    marginBottom: '0.5rem',
                    color: 'var(--primary-blue)',
                    textAlign: 'center'
                }}>
                    Cloud Security Tool
                </h1>
                <p style={{
                    textAlign: 'center',
                    color: '#6c757d',
                    marginBottom: '2rem',
                    fontSize: '0.875rem'
                }}>
                    Sign in to access your dashboard
                </p>

                <form onSubmit={handleLogin}>
                    <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="email">Email Address</label>
                        <input
                            ref={emailRef}
                            id="email"
                            name="email"
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem', position: 'relative' }}>
                        <label htmlFor="password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{ width: '100%', paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    color: '#6c757d',
                                    padding: '0.25rem'
                                }}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >

                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <input
                                id="rememberMe"
                                name="rememberMe"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            Remember me
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(!showForgotPassword)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-blue)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                textDecoration: 'underline'
                            }}
                        >
                            Forgot password?
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            background: '#f8d7da',
                            color: '#721c24',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            border: '1px solid #f5c6cb'
                        }}>
                            {error}
                        </div>
                    )}

                    {showForgotPassword && (
                        <div style={{
                            background: '#fff3cd',
                            color: '#856404',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            border: '1px solid #ffeeba'
                        }}>
                            <strong>Demo Accounts:</strong><br />
                            <strong>Demo Accounts:</strong><br />
                            Check credentials below
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '0.625rem 1rem',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? (
                            <>
                                <span style={{
                                    display: 'inline-block',
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid #fff',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                    marginRight: '0.5rem'
                                }}></span>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#e7f3ff',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--primary-blue)',
                    border: '1px solid var(--primary-blue-light)'
                }}>
                    <strong>Demo Credentials:</strong><br />
                    <div style={{ marginTop: '0.5rem', lineHeight: '1.8' }}>
                        <strong>Admin</strong> (Full Access):<br />
                        admin@example.com / admin123<br />
                        <br />
                        <strong>Viewer</strong> (Read-Only):<br />
                        viewer@example.com / viewer123
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default Login;
