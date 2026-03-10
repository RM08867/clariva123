import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (localStorage.getItem('adminLoggedIn') === 'true') {
            navigate('/admin/dashboard');
        }
    }, [navigate]);

    const handleLogin = () => {
        if (username === 'admin' && password === 'clariva123') {
            localStorage.setItem('adminLoggedIn', 'true');
            navigate('/admin/dashboard');
        } else {
            setError('Invalid username or password.');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                <div className="admin-main-title">CLARIVA</div>
                <div className="admin-sub-title">Admin Login</div>
                <input
                    type="text"
                    placeholder="Username or Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleLogin}>Login</button>
                {error && <div className="admin-error">{error}</div>}
            </div>
        </div>
    );
}
