import React, { useState, useEffect } from 'react';
import { Mic, Volume2, CheckCircle, XCircle } from 'lucide-react';
import { DATASET } from '../data/dataset';

export default function TalkModal({ 
    isOpen, 
    onClose, 
    targetWord = '', 
    mode = 'word',
    preferences = {} 
}) {
    const [entering, setEntering] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState(''); // 'correct' | 'wrong' | ''
    const [mispronouncedWords, setMispronouncedWords] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setEntering(true);
            setTranscript('');
            setFeedbackStatus('');
            setMispronouncedWords([]);
            const timer = setTimeout(() => setEntering(false), 20);
            return () => clearTimeout(timer);
        }
    }, [isOpen, mode, targetWord]);

    const handleClose = () => {
        setEntering(true);
        setTimeout(() => onClose(), 300);
    };

    const isFuzzyMatch = (target, spoken) => {
        const t = target.toLowerCase().replace(/[^a-z0-9]/g, '');
        const s = spoken.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!t || !s) return false;
        return t === s; // Exact match only — partial words not accepted
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }
        if (isListening) return;

        setFeedbackStatus('');
        setTranscript('');
        setMispronouncedWords([]);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 5;
        recognition.lang = preferences.voice_accent || 'en-IN';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => { setIsListening(false); setFeedbackStatus('error'); };

        recognition.onresult = (event) => {
            const results = event.results[0];

            if (mode === 'word') {
                let match = { transcript: results[0].transcript, correct: false };
                for (let i = 0; i < results.length; i++) {
                    if (isFuzzyMatch(targetWord, results[i].transcript)) {
                        match = { transcript: results[i].transcript, correct: true };
                        break;
                    }
                }
                setTranscript(match.transcript);
                setFeedbackStatus(match.correct ? 'correct' : 'wrong');

            } else {
                // passage mode
                const spoken = results[0].transcript;
                setTranscript(spoken);

                const targetWords = targetWord.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);
                const spokenWords = spoken.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/).filter(Boolean);
                const mispronounced = [];
                let tIdx = 0;

                for (const tw of targetWords) {
                    let found = false;
                    for (let j = tIdx; j < Math.min(tIdx + 5, spokenWords.length); j++) {
                        if (isFuzzyMatch(tw, spokenWords[j])) {
                            tIdx = j + 1;
                            found = true;
                            break;
                        }
                    }
                    if (!found) mispronounced.push(tw);
                }

                setMispronouncedWords(mispronounced);
                setFeedbackStatus(mispronounced.length === 0 && spokenWords.length > 0 ? 'correct' : 'wrong');
            }
        };

        recognition.start();
    };

    const speakWord = (word) => {
        if (!('speechSynthesis' in window)) return;
        const lang = preferences.voice_accent || 'en-IN';
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = lang;
        utterance.rate = preferences.playback_speed || 0.9;
        utterance.pitch = 1;
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.lang === lang)
            || voices.find(v => v.lang.startsWith(lang))
            || voices.find(v => v.lang.toLowerCase().includes('in'));
        if (match) utterance.voice = match;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    if (!isOpen) return null;

    const textStyle = {
        fontFamily: preferences.font || 'Open Sans, Arial, sans-serif',
        fontSize: (preferences.font_size || 18) + 'px',
        lineHeight: preferences.line_spacing || 1.5,
        letterSpacing: (preferences.letter_spacing || 0) + 'em',
        wordSpacing: (preferences.word_spacing || 0) + 'em',
        color: DATASET.text_colors[preferences.text_color] || '#1E3A8A',
    };

    const renderWord = (word, idx) => (
        <span key={idx} style={{ display: 'inline-block', marginRight: '0.25em' }}>
            {word.split('').map((char, cIdx) => {
                const lc = char.toLowerCase();
                const style = {};
                if (preferences.active_highlights?.includes('first_letter_bold') && cIdx === 0) style.fontWeight = '900';
                if (preferences.active_highlights?.includes('vowel_coloring') && 'aeiou'.includes(lc)) {
                    style.color = DATASET.highlight_colors.vowels;
                    style.fontWeight = 'bold';
                }
                Object.entries(DATASET.confusing_letter_groups || {}).forEach(([gId, letters]) => {
                    if (preferences.active_confusing_groups?.includes(gId) && letters.includes(lc)) {
                        style.color = DATASET.highlight_colors[gId];
                        style.fontWeight = 'bold';
                    }
                });
                return <span key={cIdx} style={style}>{char}</span>;
            })}
        </span>
    );

    return (
        <div className="talk-overlay" onClick={handleClose}>
            <div
                className={`talk-modal ${entering ? 'entering' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: '#E3F2FD',
                    color: '#1E3A8A',
                    border: 'none',
                    borderRadius: '28px',
                    boxShadow: '0 16px 48px rgba(30, 58, 138, 0.18)',
                    padding: '2rem',
                    maxWidth: '420px',
                    width: '100%',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        color: '#3b82f6',
                        width: '56px', height: '56px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 0.75rem',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                    }}>
                        <Mic size={28} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#102A63' }}>
                        Pronunciation Check
                    </h3>
                    <p style={{ color: '#445C91', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {mode === 'passage' ? 'Read this sentence aloud:' : 'Say this word clearly:'}
                    </p>
                </div>

                {/* Target Text Box */}
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '1.25rem 1.5rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    borderLeft: '4px solid #3b82f6',
                    ...textStyle,
                    textAlign: mode === 'passage' ? 'left' : 'center',
                }}>
                    {targetWord.split(/\s+/).map((w, i) => renderWord(w, i))}
                </div>

                {/* Mic Button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div
                        onClick={startListening}
                        style={{
                            cursor: isListening ? 'default' : 'pointer',
                            backgroundColor: isListening ? '#EF4444' : '#ffffff',
                            border: isListening ? 'none' : '3px solid #3b82f6',
                            width: '88px', height: '88px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isListening ? '0 0 28px rgba(239,68,68,0.4)' : '0 8px 20px rgba(59,130,246,0.12)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <Mic size={38} color={isListening ? '#ffffff' : '#3b82f6'} />
                    </div>
                    <p style={{
                        margin: 0,
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: isListening ? '#EF4444' : '#1E3A8A',
                    }}>
                        {isListening ? 'Listening...' : 'Tap to speak'}
                    </p>
                </div>

                {/* You pronounced */}
                {transcript && (
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.75)',
                        border: '1px dashed #93c5fd',
                        borderRadius: '14px',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        color: '#445C91',
                    }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '3px' }}>You said:</div>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>"{transcript}"</div>
                    </div>
                )}

                {/* Feedback: Correct */}
                {feedbackStatus === 'correct' && (
                    <div style={{
                        backgroundColor: '#ECFDF5',
                        border: '2px solid #10B981',
                        borderRadius: '16px',
                        padding: '1rem 1.25rem',
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                    }}>
                        <CheckCircle size={28} color="#10B981" style={{ marginBottom: '6px' }} />
                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#065F46' }}>
                            correct pronounciation ✅
                        </div>
                    </div>
                )}

                {/* Feedback: Wrong – Word Mode */}
                {feedbackStatus === 'wrong' && mode === 'word' && (
                    <div style={{
                        backgroundColor: '#FEF2F2',
                        border: '2px solid #FCA5A5',
                        borderRadius: '16px',
                        padding: '1rem 1.25rem',
                        textAlign: 'center',
                        marginBottom: '0.5rem',
                    }}>
                        <XCircle size={26} color="#EF4444" style={{ marginBottom: '6px' }} />
                        <div style={{ fontWeight: '700', color: '#991B1B', marginBottom: '0.75rem' }}>
                            wrong pronunciation ❌
                        </div>
                        <button
                            onClick={() => speakWord(targetWord)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.5rem', width: '100%', padding: '0.75rem',
                                background: '#3b82f6', color: 'white', border: 'none',
                                borderRadius: '12px', cursor: 'pointer',
                                fontWeight: '700', fontSize: '0.9rem',
                            }}
                        >
                            <Volume2 size={18} /> Hear correct pronunciation
                        </button>
                    </div>
                )}

                {/* Feedback: Wrong – Passage Mode */}
                {feedbackStatus === 'wrong' && mode === 'passage' && (
                    <div style={{
                        backgroundColor: '#FEF2F2',
                        border: '2px solid #FCA5A5',
                        borderRadius: '16px',
                        padding: '1rem 1.25rem',
                        marginBottom: '0.5rem',
                    }}>
                        <div style={{ fontWeight: '700', color: '#991B1B', textAlign: 'center', marginBottom: '0.75rem' }}>
                            ❌ Mispronounced words:
                        </div>
                        {mispronouncedWords.length > 0 ? (
                            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {mispronouncedWords.map((w, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        backgroundColor: '#ffffff', borderRadius: '10px', padding: '0.6rem 0.9rem',
                                    }}>
                                        <span style={{ fontWeight: '700', color: '#1E3A8A', textTransform: 'capitalize' }}>{w}</span>
                                        <button
                                            onClick={() => speakWord(w)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                background: '#3b82f6', color: 'white', border: 'none',
                                                borderRadius: '8px', padding: '5px 12px',
                                                cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700',
                                            }}
                                        >
                                            <Volume2 size={13} /> Listen
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
                                Could not detect spoken words. Please try again.
                            </p>
                        )}
                    </div>
                )}

                {/* Error */}
                {feedbackStatus === 'error' && (
                    <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '12px', padding: '0.75rem', textAlign: 'center', color: '#92400E', marginBottom: '0.5rem' }}>
                        Could not hear you. Please try again.
                    </div>
                )}

                {/* Done Button */}
                <button
                    onClick={handleClose}
                    style={{
                        marginTop: '1.25rem', width: '100%',
                        borderRadius: '16px', padding: '12px',
                        backgroundColor: '#1E3A8A', color: 'white',
                        fontWeight: 'bold', border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(30, 58, 138, 0.2)',
                        letterSpacing: '0.5px',
                    }}
                >
                    DONE
                </button>
            </div>
        </div>
    );
}
