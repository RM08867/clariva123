import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IntroPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            const handleMetadata = () => {
                const duration = video.duration;
                video.playbackRate = duration / 5;
            };
            video.addEventListener('loadedmetadata', handleMetadata);
            return () => video.removeEventListener('loadedmetadata', handleMetadata);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/features');
        }, 5000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="intro-page">
            <div className="intro-container">
                <div className="intro-left">
                    <div className="intro-brand">
                        {'CLARIVA'.split('').map((letter, i) => (
                            <span key={i} style={{ animationDelay: `${0.3 + i * 0.3}s` }}>
                                {letter}
                            </span>
                        ))}
                    </div>
                    <div className="intro-tagline">A Dyslexia Friendly Reader</div>
                </div>
                <div className="intro-right">
                    <video ref={videoRef} autoPlay muted playsInline>
                        <source src="/assets/Video_Generation_Without_Watermark.mp4" type="video/mp4" />
                    </video>
                </div>
            </div>
        </div>
    );
}
