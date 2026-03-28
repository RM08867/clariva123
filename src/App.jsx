import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TextDisplay from './components/TextDisplay';
import PreferencesDrawer from './components/PreferencesDrawer';
import InputBar from './components/InputBar';
import TalkModal from './components/TalkModal';
import SpeakerModal from './components/SpeakerModal';
import MicOptionsModal from './components/MicOptionsModal';
import WordOptionsModal from './components/WordOptionsModal';
import PlaybackControls from './components/PlaybackControls';
import { DEFAULT_PREFS } from './data/defaults';
import { generateTTS } from './utils/api';

import IntroPage from './pages/IntroPage';
import FeaturesPage from './pages/FeaturesPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { incrementFeatureCount } from './utils/supabase';

/**
 * Extract the sentence containing the clicked word from the full text,
 * using line and word indices to resolve duplicates.
 */
function findSentenceByContext(fullText, clickedWord, lineIdx, wordIdx) {
    const lines = fullText.split('\n');
    const targetLine = lines[lineIdx];
    if (!targetLine) return clickedWord;

    const sentences = targetLine.split(/(?<=[.!?])\s+/);
    let currentWordGlobalIdx = 0;
    
    // Split line into words to find the global index of the clicked word
    const lineWords = targetLine.split(/\s+/).filter(Boolean);
    
    for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).filter(Boolean);
        const sentenceEndIdx = currentWordGlobalIdx + sentenceWords.length;
        
        if (wordIdx >= currentWordGlobalIdx && wordIdx < sentenceEndIdx) {
            return sentence.trim();
        }
        currentWordGlobalIdx = sentenceEndIdx;
    }
    
    return targetLine.trim(); // Fallback to full line
}

function ReaderPage() {
    const [preferences, setPreferences] = useState({ ...DEFAULT_PREFS });
    const [inputText, setInputText] = useState('');
    const [displayText, setDisplayText] = useState('CLARIVA');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [talkModalOpen, setTalkModalOpen] = useState(false);
    const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
    const [wordOptionsModalOpen, setWordOptionsModalOpen] = useState(false);
    const [micOptionsModalOpen, setMicOptionsModalOpen] = useState(false);
    const [wordSelectMode, setWordSelectMode] = useState(false);
    const [lineSelectMode, setLineSelectMode] = useState(false);
    const [selectionMode, setSelectionMode] = useState('pronounce'); // 'read' or 'pronounce'
    const [selectedLineIdx, setSelectedLineIdx] = useState(null);
    const [selectedWord, setSelectedWord] = useState('');
    const [selectedWordData, setSelectedWordData] = useState({ word: '', sentence: '', lineIdx: 0, wordIdx: 0 });
    const [talkMode, setTalkMode] = useState('word');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showPlaybackControls, setShowPlaybackControls] = useState(false);
    const audioRef = useRef(null);
    const utteranceRef = useRef(null);
    const playbackTypeRef = useRef(null);
    const currentCharIndexRef = useRef(0);
    const currentTextRef = useRef('');

    useEffect(() => {
        incrementFeatureCount('visits');
    }, []);
    const formattedContentRef = useRef(null);

    const handleReset = useCallback(() => {
        setPreferences(JSON.parse(JSON.stringify(DEFAULT_PREFS)));
    }, []);

    // Send button: copies input to display text and clears input
    const handleSend = useCallback(() => {
        if (inputText.trim()) {
            setDisplayText(inputText.trim());
            setInputText('');
        }
    }, [inputText]);

    /**
     * Stop any ongoing playback.
     */
    const stopPlayback = useCallback(() => {
        if (playbackTypeRef.current === 'audio' && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        if (playbackTypeRef.current === 'browser') {
            window.speechSynthesis?.cancel();
            utteranceRef.current = null;
        }
        playbackTypeRef.current = null;
        setIsPlaying(false);
        setShowPlaybackControls(false);
    }, []);

    const handlePause = useCallback(() => {
        if (playbackTypeRef.current === 'audio' && audioRef.current) {
            audioRef.current.pause();
        }
        if (playbackTypeRef.current === 'browser') {
            window.speechSynthesis?.pause();
        }
        setIsPlaying(false);
    }, []);

    const handleResume = useCallback(() => {
        if (playbackTypeRef.current === 'audio' && audioRef.current) {
            audioRef.current.play();
        }
        if (playbackTypeRef.current === 'browser') {
            window.speechSynthesis?.resume();
        }
        setIsPlaying(true);
    }, []);

    const handleSpeedChange = useCallback((newSpeed) => {
        setPlaybackSpeed(newSpeed);
        if (playbackTypeRef.current === 'audio' && audioRef.current) {
            audioRef.current.playbackRate = newSpeed;
        } else if (playbackTypeRef.current === 'browser' && window.speechSynthesis) {
            // Web Speech API doesn't support live rate changes, so we restart from current index
            window.speechSynthesis.cancel();
            
            const targetLang = preferences.voice_accent || 'en-IN';
            const remainingText = currentTextRef.current.slice(currentCharIndexRef.current);
            if (remainingText.trim()) {
                const utterance = new SpeechSynthesisUtterance(remainingText);
                utterance.lang = targetLang;
                utterance.rate = newSpeed;
                utterance.pitch = 1;

                const voices = window.speechSynthesis.getVoices();
                const indianVoice = voices.find(v => v.lang === targetLang)
                    || voices.find(v => v.lang.startsWith(targetLang))
                    || voices.find(v => v.lang.toLowerCase().includes('in'))
                    || voices.find(v => v.lang.toLowerCase().includes('hi'));
                if (indianVoice) {
                    utterance.voice = indianVoice;
                }

                const sliceStart = currentCharIndexRef.current;
                utterance.onboundary = (event) => {
                    // event.charIndex is relative to the remainingText
                    currentCharIndexRef.current = sliceStart + event.charIndex;
                };

                utterance.onend = () => {
                    if (window.speechSynthesis.speaking) return; // Ignore if another one started
                    setIsPlaying(false);
                    setShowPlaybackControls(false);
                    playbackTypeRef.current = null;
                    utteranceRef.current = null;
                };

                utterance.onerror = () => {
                    setIsPlaying(false);
                    setShowPlaybackControls(false);
                };

                utteranceRef.current = utterance;
                window.speechSynthesis.speak(utterance);
            }
        }
    }, [playbackSpeed]);

    /**
     * Core TTS function — tries Gemini first, falls back to browser Speech API.
     */
    const speakText = useCallback(async (text) => {
        if (!text) return;
        stopPlayback();

        incrementFeatureCount('tts');

        setIsLoading(true);
        setStatusMsg('Generating voice...');

        try {
            const audio = await generateTTS(text);
            audio.playbackRate = playbackSpeed;
            audioRef.current = audio;
            playbackTypeRef.current = 'audio';
            setIsPlaying(true);
            setShowPlaybackControls(true);
            setIsLoading(false);
            setStatusMsg('Playing audio...');

            await new Promise((resolve) => {
                audio.onended = () => {
                    setIsPlaying(false);
                    setShowPlaybackControls(false);
                    playbackTypeRef.current = null;
                    audioRef.current = null;
                    resolve();
                };
                audio.onerror = () => {
                    setIsPlaying(false);
                    setShowPlaybackControls(false);
                    resolve();
                };
                audio.play();
            });
            setStatusMsg('');
        } catch (err) {
            console.warn('Gemini TTS failed, using browser speech:', err);
            setStatusMsg('Using browser voice...');
            setIsLoading(false);

            try {
                currentTextRef.current = text;
                currentCharIndexRef.current = 0;

                await new Promise((resolve, reject) => {
                    if (!window.speechSynthesis) {
                        reject(new Error('Speech synthesis not supported'));
                        return;
                    }
                    window.speechSynthesis.cancel();

                    const targetLang = preferences.voice_accent || 'en-IN';
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = targetLang;
                    utterance.rate = playbackSpeed;
                    utterance.pitch = 1;

                    const voices = window.speechSynthesis.getVoices();
                    const indianVoice = voices.find(v => v.lang === targetLang)
                        || voices.find(v => v.lang.startsWith(targetLang))
                        || voices.find(v => v.lang.toLowerCase().includes('in'))
                        || voices.find(v => v.lang.toLowerCase().includes('hi'));
                    if (indianVoice) {
                        utterance.voice = indianVoice;
                    }

                    utteranceRef.current = utterance;
                    playbackTypeRef.current = 'browser';
                    setIsPlaying(true);
                    setShowPlaybackControls(true);

                    utterance.onboundary = (event) => {
                        currentCharIndexRef.current = event.charIndex;
                    };

                    utterance.onend = () => {
                        // If we are still speaking (e.g. because of a speed-change restart), 
                        // don't resolve yet or clean up state that might be used by the new utterance.
                        // However, since handleSpeedChange replaces utteranceRef.current, we check if this is still the active one.
                        if (utteranceRef.current !== utterance) return;

                        setIsPlaying(false);
                        setShowPlaybackControls(false);
                        playbackTypeRef.current = null;
                        utteranceRef.current = null;
                        resolve();
                    };
                    utterance.onerror = (e) => {
                        if (utteranceRef.current !== utterance) return;
                        setIsPlaying(false);
                        setShowPlaybackControls(false);
                        reject(e);
                    };
                    window.speechSynthesis.speak(utterance);
                });
                setStatusMsg('');
            } catch (fallbackErr) {
                console.error('All TTS failed:', fallbackErr);
                setStatusMsg('Voice generation failed');
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatusMsg(''), 3000);
        }
    }, [playbackSpeed, stopPlayback]);

    const handleReadAloud = useCallback(async (text) => {
        setSpeakerModalOpen(false);
        await speakText(text);
    }, [speakText]);

    const handleStartWordSelect = useCallback((mode = 'read') => {
        setSelectionMode(mode);
        setWordSelectMode(true);
        setLineSelectMode(false);
        setStatusMsg(mode === 'read' ? 'Click a word to read it aloud' : 'Click a word to check pronunciation');
    }, []);

    const handleStartLineSelect = useCallback((mode = 'read') => {
        setSelectionMode(mode);
        setLineSelectMode(true);
        setWordSelectMode(false);
        setStatusMsg(mode === 'read' ? 'Click a word to read its sentence' : 'Click a word to check sentence pronunciation');
    }, []);

    const handleWordClick = useCallback(async (word, lineIdx, wordIdx) => {
        incrementFeatureCount('stt');
        if (lineSelectMode || wordSelectMode) {
            const isLine = lineSelectMode;
            const isRead = selectionMode === 'read';

            setLineSelectMode(false);
            setWordSelectMode(false);
            setStatusMsg('');

            const targetText = isLine ? findSentenceByContext(displayText, word, lineIdx, wordIdx) : word;

            if (isRead) {
                await speakText(targetText);
            } else {
                setSelectedWord(targetText);
                setTalkMode(isLine ? 'passage' : 'word');
                setTalkModalOpen(true);
            }
        } else {
            // Default click opens options modal
            const sentence = findSentenceByContext(displayText, word, lineIdx, wordIdx);
            setSelectedWordData({ word, sentence, lineIdx, wordIdx });
            setSelectedWord(word);
            setWordOptionsModalOpen(true);
        }
    }, [lineSelectMode, wordSelectMode, selectionMode, displayText, findSentenceByContext, speakText]);

    const handleWordLongPress = useCallback((word, lineIdx, wordIdx) => {
        const sentence = findSentenceByContext(displayText, word, lineIdx, wordIdx);
        setSelectedWordData({ word, sentence, lineIdx, wordIdx });
        setWordOptionsModalOpen(true);
    }, [displayText]);

    return (
        <div className="reader-layout">
            <Header
                preferences={preferences}
                inputText={displayText}
                formattedContentRef={formattedContentRef}
                isLoading={isLoading}
                statusMsg={statusMsg}
            />

            <TextDisplay
                preferences={preferences}
                inputText={displayText}
                contentRef={formattedContentRef}
                onWordClick={handleWordClick}
                onWordLongPress={handleWordLongPress}
                wordSelectMode={wordSelectMode}
                lineSelectMode={lineSelectMode}
                selectedLineIdx={selectedLineIdx}
                onLineClick={setSelectedLineIdx}
            />

            <PlaybackControls
                isVisible={showPlaybackControls}
                isPlaying={isPlaying}
                speed={playbackSpeed}
                onPause={handlePause}
                onResume={handleResume}
                onSpeedChange={handleSpeedChange}
                onStop={stopPlayback}
            />

            <PreferencesDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                preferences={preferences}
                onUpdatePreferences={(newPrefs) => {
                    incrementFeatureCount('visits');
                    setPreferences(newPrefs);
                }}
                onReset={handleReset}
            />

            <InputBar
                inputText={inputText}
                onTextChange={setInputText}
                onSend={handleSend}
                onOpenDrawer={() => setDrawerOpen(true)}
                onOpenTalkModal={() => setMicOptionsModalOpen(true)}
                onOpenSpeakerModal={() => speakText(displayText)}
                setLoading={setIsLoading}
                setStatus={setStatusMsg}
            />

            <TalkModal
                isOpen={talkModalOpen}
                onClose={() => setTalkModalOpen(false)}
                targetWord={selectedWord}
                mode={talkMode}
                preferences={preferences}
                onTranscriptConfirm={(newText) => {
                    setInputText(inputText + ' ' + newText);
                    setTalkModalOpen(false);
                }}
            />

            <SpeakerModal
                isOpen={speakerModalOpen}
                onClose={() => setSpeakerModalOpen(false)}
                fullText={displayText}
                onReadAloud={handleReadAloud}
                onStartWordSelect={() => handleStartWordSelect('read')}
                onStartLineSelect={() => handleStartLineSelect('read')}
            />

            <MicOptionsModal
                isOpen={micOptionsModalOpen}
                onClose={() => setMicOptionsModalOpen(false)}
                onStartWordPronounce={() => handleStartWordSelect('pronounce')}
                onStartSentencePronounce={() => handleStartLineSelect('pronounce')}
            />

            <WordOptionsModal
                isOpen={wordOptionsModalOpen}
                onClose={() => setWordOptionsModalOpen(false)}
                word={selectedWordData.word}
                sentence={selectedWordData.sentence}
                onSpeak={speakText}
                onStop={stopPlayback}
                onSpeedChange={handleSpeedChange}
                currentSpeed={playbackSpeed}
                preferences={preferences}
            />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<IntroPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/reader" element={<ReaderPage />} />
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Routes>
        </BrowserRouter>
    );
}
