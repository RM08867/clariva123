import React, { useState, useEffect } from 'react';
import { Mic, X, AlignLeft, Type } from 'lucide-react';

export default function MicOptionsModal({
    isOpen,
    onClose,
    onStartWordPronounce,
    onStartSentencePronounce,
}) {
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

    const handlePronounceWord = () => {
        onClose();
        onStartWordPronounce();
    };

    const handlePronounceSentence = () => {
        onClose();
        onStartSentencePronounce();
    };

    if (!isOpen) return null;

    return (
        <div className="speaker-overlay" onClick={handleClose}>
            <div
                className={`speaker-modal ${entering ? 'entering' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    backgroundColor: '#E3F2FD', 
                    borderRadius: '24px', 
                    maxWidth: '420px',
                    border: 'none',
                    padding: '1.5rem',
                    boxShadow: '0 10px 40px rgba(30, 58, 138, 0.15)'
                }}
            >
                {/* Header */}
                <div className="speaker-modal-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div className="speaker-icon-circle" style={{ backgroundColor: '#ffffff', color: '#3b82f6', margin: '0 auto 0.75rem' }}>
                        <Mic size={24} />
                    </div>
                    <h3 className="speaker-title" style={{ fontSize: '1.5rem', color: '#1E3A8A', margin: 0 }}>Practice Pronunciation</h3>
                    <p className="speaker-desc" style={{ color: '#445C91', fontSize: '0.9rem' }}>Select how you want to practice</p>
                </div>

                {/* Options */}
                <div className="speaker-options" style={{ padding: '0' }}>
                    <button
                        className="speaker-option-btn word-btn"
                        onClick={handlePronounceWord}
                        style={{ backgroundColor: '#ffffff', border: '1px solid #dbeafe', borderRadius: '16px', marginBottom: '1rem' }}
                    >
                        <div className="speaker-option-icon word-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <Type />
                        </div>
                        <div className="speaker-option-text">
                            <span className="speaker-option-title" style={{ color: '#1E3A8A' }}>Pronounce a Word</span>
                            <span className="speaker-option-sub" style={{ color: '#445C91' }}>Click any word in the text</span>
                        </div>
                    </button>

                    <button
                        className="speaker-option-btn sentence-btn"
                        onClick={handlePronounceSentence}
                        style={{ backgroundColor: '#ffffff', border: '1px solid #dbeafe', borderRadius: '16px' }}
                    >
                        <div className="speaker-option-icon sentence-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                            <AlignLeft />
                        </div>
                        <div className="speaker-option-text">
                            <span className="speaker-option-title" style={{ color: '#1E3A8A' }}>Pronounce a Sentence</span>
                            <span className="speaker-option-sub" style={{ color: '#445C91' }}>Click a word to practice its sentence</span>
                        </div>
                    </button>
                </div>

                {/* Close Button */}
                <button 
                    className="speaker-close-btn" 
                    onClick={handleClose}
                    style={{ 
                        marginTop: '1.5rem', 
                        width: '100%', 
                        padding: '14px', 
                        backgroundColor: '#1E3A8A', 
                        color: 'white', 
                        borderRadius: '16px', 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    DONE
                </button>
            </div>
        </div>
    );
}
