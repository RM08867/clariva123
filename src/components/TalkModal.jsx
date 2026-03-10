import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';

export default function TalkModal({ isOpen, onClose }) {
    const [entering, setEntering] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setEntering(true);
            const timer = setTimeout(() => setEntering(false), 20);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = () => {
        setEntering(true);
        setTimeout(() => onClose(), 300);
    };

    if (!isOpen) return null;

    return (
        <div className="talk-overlay">
            <div className={`talk-modal ${entering ? 'entering' : ''}`}>
                <div className="talk-icon-circle">
                    <Mic />
                </div>
                <h3 className="talk-title">AI TALK</h3>
                <p className="talk-desc">Listening for voice interaction...</p>
                <button className="talk-close-btn" onClick={handleClose}>
                    CLOSE
                </button>
            </div>
        </div>
    );
}
