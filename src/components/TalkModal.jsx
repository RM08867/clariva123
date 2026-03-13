import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, Volume2, Check } from 'lucide-react';

export default function TalkModal({ isOpen, onClose, targetWord = '', mode = 'word' }) {
    const [entering, setEntering] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState('');
    const [mispronouncedWord, setMispronouncedWord] = useState('');

    useEffect(() => {
        if (isOpen) {
            setEntering(true);
            setTranscript('');
            setFeedbackStatus('');
            setMispronouncedWord(mode === 'word' ? targetWord : '');
            const timer = setTimeout(() => setEntering(false), 20);
            return () => clearTimeout(timer);
        } else {
            // Stop listening when closed to prevent mic staying on
            if (window.speechRecognitionInstance) {
                window.speechRecognitionInstance.stop();
            }
            setIsListening(false);
        }
    }, [isOpen, targetWord]);

    const handleClose = () => {
        if (isListening && window.speechRecognitionInstance) {
            window.speechRecognitionInstance.stop();
        }
        setIsListening(false);
        setEntering(true);
        setTimeout(() => onClose(), 300);
    };

    const toggleListening = () => {
        if (isListening) {
            window.speechRecognitionInstance?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support the Web Speech API. Please try Chrome or Edge.");
            return;
        }

        const recognition = new SpeechRecognition();
        window.speechRecognitionInstance = recognition;
        recognition.lang = 'en-IN'; // Indian English
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setFeedbackStatus('');
            setTranscript('');
        };

        recognition.onresult = (event) => {
            const spokenText = event.results[0][0].transcript.trim().toLowerCase();
            const cleanSpoken = spokenText.replace(/[.,!?()[\]{}"']/g, '').replace(/\s+/g, ' ').trim();
            setTranscript(cleanSpoken);
            
            const cleanTarget = targetWord.replace(/[.,!?()[\]{}"']/g, '').replace(/\s+/g, ' ').toLowerCase().trim();

            if (mode === 'word') {
                if (cleanSpoken === cleanTarget) {
                    setFeedbackStatus('correct');
                } else {
                    setFeedbackStatus('wrong');
                }
            } else if (mode === 'passage') {
                // For passage mode, we want to ensure that 'you' doesn't match 'your'.
                // We split the target into words and check if the spoken phrase exists as a whole sequence of words.
                const targetWords = cleanTarget.split(/\s+/);
                const spokenWords = cleanSpoken.split(/\s+/);
                
                let isMatch = false;
                // Check if spokenWords sequence exists as a contiguous block in targetWords
                for (let i = 0; i <= targetWords.length - spokenWords.length; i++) {
                    const slice = targetWords.slice(i, i + spokenWords.length);
                    if (slice.join(' ') === cleanSpoken) {
                        isMatch = true;
                        break;
                    }
                }

                if (isMatch) {
                    setFeedbackStatus('correct');
                    setMispronouncedWord('');
                } else {
                    setFeedbackStatus('wrong');
                    
                    const targetWordsArr = cleanTarget.split(/\s+/);
                    const spokenWordsArr = cleanSpoken.split(/\s+/);
                    
                    if (spokenWordsArr.length === 0) {
                        setMispronouncedWord(targetWordsArr[0]);
                        return;
                    }

                    // Best fit alignment logic
                    let bestWindowIdx = 0;
                    let maxMatches = -1;
                    
                    for (let i = 0; i <= targetWordsArr.length - spokenWordsArr.length; i++) {
                        let matches = 0;
                        for (let j = 0; j < spokenWordsArr.length; j++) {
                            if (targetWordsArr[i + j] === spokenWordsArr[j]) {
                                matches++;
                            }
                        }
                        // Prioritize windows that start with a match if match counts are equal
                        if (matches > maxMatches || (matches === maxMatches && targetWordsArr[i] === spokenWordsArr[0])) {
                            maxMatches = matches;
                            bestWindowIdx = i;
                        }
                    }

                    // Find the first mismatch within the best window
                    let targetFeedback = targetWordsArr[bestWindowIdx]; // Default to start of window
                    for (let j = 0; j < spokenWordsArr.length; j++) {
                        if (targetWordsArr[bestWindowIdx + j] !== spokenWordsArr[j]) {
                            targetFeedback = targetWordsArr[bestWindowIdx + j];
                            break;
                        }
                    }
                    
                    setMispronouncedWord(targetFeedback || targetWordsArr[0]);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
            setFeedbackStatus('wrong');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const playCorrectPronunciation = () => {
        if ('speechSynthesis' in window) {
            // Play only the specific mispronounced word (or the target word in word mode)
            const textToPlay = mispronouncedWord || targetWord;
            const utterance = new SpeechSynthesisUtterance(textToPlay);
            utterance.lang = 'en-IN'; // Request Indian English

            const voices = window.speechSynthesis.getVoices();
            const indianVoice = voices.find(v => v.lang === 'en-IN');
            if (indianVoice) {
                utterance.voice = indianVoice;
            }

            window.speechSynthesis.speak(utterance);
        } else {
            alert("Text-to-speech is not supported in this browser.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="talk-overlay">
            <div className={`talk-modal ${entering ? 'entering' : ''}`}>
                <h3 className="talk-title">Pronunciation Check</h3>
                <p className="talk-desc" style={{ marginBottom: '1rem', color: '#666' }}>
                    {mode === 'passage' ? 'Read any passage from the text:' : 'Click the mic and say this word:'}
                </p>
                <div style={{ 
                    fontSize: mode === 'passage' ? '1.2rem' : '2rem', 
                    fontWeight: 'bold', 
                    marginBottom: '1.5rem', 
                    color: '#333',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    padding: mode === 'passage' ? '0.5rem' : '0',
                    backgroundColor: mode === 'passage' ? '#f9f9f9' : 'transparent',
                    borderRadius: '8px',
                    border: mode === 'passage' ? '1px solid #eee' : 'none',
                    textAlign: mode === 'passage' ? 'left' : 'center'
                }}>
                    "{targetWord}"
                </div>

                <div 
                    className={`talk-icon-circle ${isListening ? 'listening' : ''}`} 
                    onClick={toggleListening}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease', transform: isListening ? 'scale(1.1)' : 'scale(1)', backgroundColor: isListening ? '#ffebee' : '#f0f0f0', margin: '0 auto' }}
                    title={isListening ? "Stop Listening" : "Start Listening"}
                >
                    <Mic color={isListening ? '#d32f2f' : '#666'} />
                </div>
                
                {isListening && <p style={{ color: '#d32f2f', fontWeight: 'bold', marginTop: '1rem' }}>Listening...</p>}
                
                {transcript && (
                    <div style={{ marginTop: '1rem', fontStyle: 'italic', color: '#666', maxHeight: '100px', overflowY: 'auto' }}>
                        You said: "{transcript}"
                    </div>
                )}

                {feedbackStatus === 'correct' && targetWord && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '8px', color: '#2e7d32' }}>
                        <p style={{ fontWeight: 'bold', margin: '0' }}>✅ Pronunciation is correct!</p>
                    </div>
                )}

                {feedbackStatus === 'wrong' && targetWord && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>❌ Pronunciation is wrong.</p>
                        <button 
                            onClick={playCorrectPronunciation}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', marginBottom: '0' }}
                        >
                            <Volume2 size={18} /> Hear correct pronunciation
                        </button>
                    </div>
                )}

                <button className="talk-close-btn" onClick={handleClose} style={{ marginTop: '1.5rem', width: '100%' }}>
                    CLOSE
                </button>
            </div>
        </div>
    );
}
