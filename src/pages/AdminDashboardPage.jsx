import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ visits: 0, tts: 0, stt: 0 });

    useEffect(() => {
        if (localStorage.getItem('adminLoggedIn') !== 'true') {
            navigate('/admin');
            return;
        }
        setStats({
            visits: parseInt(localStorage.getItem('visits')) || 0,
            tts: parseInt(localStorage.getItem('tts')) || 0,
            stt: parseInt(localStorage.getItem('stt')) || 0,
        });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        navigate('/features');
    };

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-header">CLARIVA – Admin Dashboard</div>
            <div className="admin-dashboard-cards">
                <div className="admin-card">
                    <h2>{stats.visits}</h2>
                    <p>Total Visits</p>
                </div>
                <div className="admin-card">
                    <h2>{stats.tts}</h2>
                    <p>Total TTS Usage</p>
                </div>
                <div className="admin-card">
                    <h2>{stats.stt}</h2>
                    <p>Total STT Usage</p>
                </div>
            </div>
            <div className="admin-logout">
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
}
