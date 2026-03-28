import React, { useRef, useState, useEffect } from 'react';
import { FilePlus, Camera, Image, Volume2, Mic, Settings, Send, X, Aperture } from 'lucide-react';
import { extractTextFromImage, extractTextFromPdf } from '../utils/api';
import { incrementFeatureCount } from '../utils/supabase';
export default function InputBar({
    inputText,
    onTextChange,
    onSend,
    onOpenDrawer,
    onOpenTalkModal,
    onOpenSpeakerModal,
    setLoading,
    setStatus,
}) {
    const galleryInputRef = useRef(null);
    const pdfInputRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);

    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [capturing, setCapturing] = useState(false);

    const handleTextInput = (e) => {
        onTextChange(e.target.value);
    };



    /**
     * Handles image files from gallery upload.
     */
    const handleImageFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            setLoading(true);
            setStatus('Scanning image...');
            try {
                const base64 = ev.target.result.split(',')[1];
                const mimeType = file.type || 'image/png';
                const text = await extractTextFromImage(base64, mimeType, setStatus);
                if (text) {
                    onTextChange(text);
                    setStatus('Text extracted! Press Send to format.');
                } else {
                    setStatus('No text found in image');
                }
            } catch (err) {
                console.error('OCR Error:', err);
                setStatus(`Image scan failed: ${err.message}`);
            } finally {
                setLoading(false);
                setTimeout(() => setStatus(''), 5000);
            }
        };
        reader.onerror = () => {
            setStatus('Failed to read image file');
            setLoading(false);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    /**
     * Processes a captured image blob (from camera).
     */
    const processImageBlob = async (blob) => {
        const reader = new FileReader();
        reader.onload = async (ev) => {
            setLoading(true);
            setStatus('Scanning image...');
            try {
                const base64 = ev.target.result.split(',')[1];
                const text = await extractTextFromImage(base64, 'image/png', setStatus);
                if (text) {
                    onTextChange(text);
                    setStatus('Text extracted! Press Send to format.');
                } else {
                    setStatus('No text found in image');
                }
            } catch (err) {
                setStatus(`Image scan failed: ${err.message}`);
            } finally {
                setLoading(false);
                setTimeout(() => setStatus(''), 5000);
            }
        };
        reader.readAsDataURL(blob);
    };

    /**
     * Handles PDF upload.
     */
    const handlePdfChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setStatus('Reading PDF...');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const text = await extractTextFromPdf(arrayBuffer);
            if (text && text.trim()) {
                onTextChange(text);
                setStatus('PDF text extracted! Press Send to format.');
            } else {
                setStatus('No readable text found in PDF');
            }
        } catch (err) {
            setStatus('PDF reading failed');
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(''), 5000);
        }
        e.target.value = '';
    };

    /**
     * Opens system camera using getUserMedia (works on desktop and mobile).
     */
    const openCamera = async () => {
        setCameraError('');
        setCameraOpen(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setCameraError('No camera found on this device.');
            } else {
                setCameraError(`Camera error: ${err.message}`);
            }
        }
    };

    /**
     * Captures a photo from the live camera stream.
     */
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        setCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            closeCamera();
            await processImageBlob(blob);
            setCapturing(false);
        }, 'image/png');
    };

    /**
     * Closes the camera and stops the stream.
     */
    const closeCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraOpen(false);
        setCameraError('');
    };

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <>
            {/* Camera Modal */}
            {cameraOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '1rem', padding: '1rem',
                }}>
                    <div style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '640px',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>📷 Camera</h3>
                            <button
                                onClick={closeCamera}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {cameraError ? (
                            <div style={{
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FCA5A5',
                                borderRadius: '12px',
                                padding: '1rem',
                                color: '#991B1B',
                                textAlign: 'center',
                                fontSize: '0.9rem',
                            }}>
                                {cameraError}
                            </div>
                        ) : (
                            <video
                                ref={videoRef}
                                style={{
                                    width: '100%',
                                    borderRadius: '12px',
                                    backgroundColor: '#000',
                                    maxHeight: '360px',
                                    objectFit: 'cover',
                                }}
                                playsInline
                                muted
                            />
                        )}

                        {/* Hidden canvas for capture */}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {!cameraError && (
                            <button
                                onClick={capturePhoto}
                                disabled={capturing}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '0.5rem', padding: '0.85rem 1.5rem',
                                    backgroundColor: capturing ? '#94a3b8' : '#2563eb',
                                    color: 'white', border: 'none',
                                    borderRadius: '14px', cursor: capturing ? 'not-allowed' : 'pointer',
                                    fontWeight: '700', fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                                }}
                            >
                                <Aperture size={20} />
                                {capturing ? 'Processing...' : 'Capture & Extract Text'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="input-bar">
                {/* Hidden file inputs */}
                <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageFile}
                />
                <input
                    type="file"
                    ref={pdfInputRef}
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                />

                <div className="input-file-group">
                    <button className="icon-btn" onClick={() => pdfInputRef.current?.click()} title="Upload PDF">
                        <FilePlus />
                    </button>
                    <button className="icon-btn" onClick={openCamera} title="Take Photo (Camera)">
                        <Camera />
                    </button>
                    <button className="icon-btn" onClick={() => galleryInputRef.current?.click()} title="Upload Image from Gallery">
                        <Image />
                    </button>
                </div>

                <textarea
                    className="text-input"
                    placeholder="Type or scan text... (Press Send button to format)"
                    value={inputText}
                    onChange={handleTextInput}
                    rows={2}
                />

                <button
                    className="send-btn"
                    onClick={() => { if (inputText.trim()) onSend(); }}
                    title="Send to Format"
                    disabled={!inputText.trim()}
                >
                    <Send />
                </button>

                <div className="input-action-group">
                    <button className="tts-btn" onClick={onOpenSpeakerModal} title="Text to Speech">
                        <Volume2 />
                    </button>
                    <button className="mic-btn" onClick={() => {
                        const sttCount = parseInt(localStorage.getItem('stt')) || 0;
                        localStorage.setItem('stt', sttCount + 1);
                        onOpenTalkModal();
                    }} title="Voice Input">
                        <Mic />
                    </button>
                    <button className="settings-btn" onClick={onOpenDrawer} title="Settings">
                        <Settings />
                    </button>
                </div>
            </div>
        </>
    );
}
