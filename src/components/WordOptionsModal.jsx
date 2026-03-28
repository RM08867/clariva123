import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Mic, X, Play, Square, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function WordOptionsModal({
    isOpen,
    onClose,
    word,
    sentence,
    onSpeak,
    onStop,
    onSpeedChange,
    currentSpeed,
    preferences = {}
}) {
    const [view, setView] = useState('main'); // 'main', 'read', 'pronounce'
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
    const [entering, setEntering] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setEntering(true);
            setView('main');
            setFeedback(null);
            setTranscript('');
            const timer = setTimeout(() => setEntering(false), 20);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = () => {
        setEntering(true);
        setTimeout(() => {
            onClose();
            if (window.speechRecognitionInstance) {
                window.speechRecognitionInstance.stop();
            }
        }, 300);
    };


    const handlePronounce = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        window.speechRecognitionInstance = recognition;
        recognition.lang = preferences.voice_accent || 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 5; // Get multiple possibilities

        recognition.onstart = () => {
            setIsListening(true);
            setFeedback(null);
            setTranscript('');
        };

        recognition.onresult = (event) => {
            const results = event.results[0];
            const cleanTarget = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            let bestMatch = { transcript: results[0].transcript, correct: false };

            // Check ALL alternatives with a simple, forgiving match
            for (let i = 0; i < results.length; i++) {
                const transcript = results[i].transcript.toLowerCase().trim();
                const cleanResult = transcript.replace(/[^a-z0-9]/g, '');
                
                // Exact match only — full word must match
                if (cleanResult === cleanTarget) {
                    bestMatch = { transcript, correct: true };
                    break;
                }
            }
            
            setTranscript(bestMatch.transcript);
            if (bestMatch.correct) {
                setFeedback({ type: 'success', message: 'correct pronounciation' });
            } else {
                setFeedback({ type: 'error', message: 'wrong' });
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            setFeedback({ type: 'error', message: 'Speech recognition failed' });
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
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
                        {view === 'read' ? <Volume2 size={24} /> : view === 'pronounce' ? <Mic size={24} /> : <Play size={24} />}
                    </div>
                    <h3 className="speaker-title" style={{ fontSize: '1.5rem', color: '#1E3A8A', margin: 0 }}>{word}</h3>
                    <p className="speaker-desc" style={{ color: '#445C91', fontSize: '0.9rem' }}>
                        {view === 'main' ? 'Choose an option' : view === 'read' ? 'Speech Controls' : 'Practice Pronunciation'}
                    </p>
                </div>

                <div className="speaker-options" style={{ padding: '0' }}>
                    {view === 'main' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button 
                                className="speaker-option-btn word-btn" 
                                onClick={() => setView('read')}
                                style={{ backgroundColor: '#ffffff', border: '1px solid #dbeafe', borderRadius: '16px' }}
                            >
                                <div className="speaker-option-icon word-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}><Volume2 /></div>
                                <div className="speaker-option-text">
                                    <span className="speaker-option-title" style={{ color: '#1E3A8A' }}>read out loud</span>
                                </div>
                            </button>
                            <button 
                                className="speaker-option-btn sentence-btn" 
                                onClick={() => {
                                    setFeedback(null);
                                    setTranscript('');
                                    setView('pronounce');
                                }}
                                style={{ backgroundColor: '#ffffff', border: '1px solid #dbeafe', borderRadius: '16px', transition: 'transform 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div className="speaker-option-icon sentence-icon" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}><Mic /></div>
                                <div className="speaker-option-text">
                                    <span className="speaker-option-title" style={{ color: '#1E3A8A', fontWeight: '700' }}>check pronounciation</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {view === 'read' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="modal-action-btn" style={{ flex: 1, padding: '14px', borderRadius: '12px' }} onClick={() => onSpeak(word)}>
                                    read the word
                                </button>
                                <button className="modal-action-btn" style={{ flex: 1, padding: '14px', borderRadius: '12px' }} onClick={() => onSpeak(sentence)}>
                                    read the sentence
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #dbeafe' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1E3A8A' }}>Speed:</span>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={currentSpeed} 
                                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                                    style={{ flex: 1, accentColor: '#3b82f6' }}
                                />
                                <span style={{ minWidth: '40px', textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>{currentSpeed}x</span>
                            </div>

                            <button className="modal-stop-btn" onClick={onStop} style={{ padding: '14px', borderRadius: '12px' }}>
                                <Square size={18} fill="currentColor" /> STOP READING
                            </button>

                            <button className="modal-back-btn" onClick={() => setView('main')} style={{ color: '#445C91' }}>
                                <RotateCcw size={16} /> BACK TO OPTIONS
                            </button>
                        </div>
                    )}

                    {view === 'pronounce' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
                            <div 
                                className={`talk-icon-circle ${isListening ? 'listening' : ''}`}
                                onClick={handlePronounce}
                                style={{ 
                                    cursor: 'pointer',
                                    backgroundColor: isListening ? '#EF4444' : '#ffffff',
                                    border: isListening ? 'none' : '3px solid #3b82f6',
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: isListening ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 10px 25px rgba(59, 130, 246, 0.1)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <Mic color={isListening ? '#ffffff' : '#3b82f6'} size={40} />
                            </div>
                            <p style={{ fontWeight: '800', color: '#1E3A8A', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                                {isListening ? 'Listening...' : 'tap to pronounce'}
                            </p>

                            {transcript && (
                                <div style={{ 
                                    fontStyle: 'italic', 
                                    color: '#445C91', 
                                    textAlign: 'center', 
                                    backgroundColor: 'rgba(255,255,255,0.8)', 
                                    padding: '1rem', 
                                    borderRadius: '16px', 
                                    width: '100%',
                                    border: '1px dashed #dbeafe',
                                    animation: 'slideUp 0.3s ease'
                                }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px' }}>You pronounced:</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>"{transcript}"</div>
                                </div>
                            )}

                            {feedback && (
                                <div style={{ 
                                    width: '100%', 
                                    padding: '1.5rem', 
                                    borderRadius: '20px', 
                                    backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                                    color: feedback.type === 'success' ? '#065F46' : '#991B1B',
                                    textAlign: 'center',
                                    border: `2px solid ${feedback.type === 'success' ? '#10B981' : '#FCA5A5'}`,
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                                    animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: feedback.type === 'error' ? '1rem' : '0' }}>
                                        {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} color="#ef4444" />}
                                        <span style={{ color: feedback.type === 'success' ? '#059669' : '#ef4444' }}>
                                            {feedback.message}
                                        </span>
                                    </div>
                                    
                                    {feedback.type === 'error' && (
                                        <button 
                                            onClick={() => onSpeak(word)}
                                            style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                padding: '12px',
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                width: '100%',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <Volume2 size={16} /> hear correct version
                                        </button>
                                    )}
                                </div>
                            )}

                            <button className="modal-back-btn" onClick={() => setView('main')} style={{ color: '#445C91' }}>
                                <RotateCcw size={16} /> BACK TO OPTIONS
                            </button>
                        </div>
                    )}
                </div>

                {/* Close Button at the bottom */}
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
