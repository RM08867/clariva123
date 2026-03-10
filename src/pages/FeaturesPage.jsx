import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function FeaturesPage() {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Text Formatting',
            desc: 'The text formatting feature enables users to personalize font style, spacing, and color to create a comfortable and dyslexia-friendly reading environment. This adaptive layout reduces visual stress and improves readability.',
            img: '/assets/tform.jpeg',
            alt: 'Text Formatting Settings',
        },
        {
            title: 'Text-to-Speech',
            desc: 'The text-to-speech feature allows users to listen to words either by long-pressing individual text or by using a read-aloud option for continuous audio support. This enhances comprehension, reinforces word recognition, and supports multisensory learning.',
            img: '/assets/ttos.jpeg',
            alt: 'Text to Speech',
            reverse: true,
        },
        {
            title: 'Speech-to-Text',
            desc: "The speech-to-text feature evaluates the user's pronunciation by converting spoken words into text and instantly providing feedback through a pop-up. This interactive correction mechanism helps users practice accurate pronunciation and build reading confidence.",
            img: '/assets/stot.png',
            alt: 'Speech to Text',
        },
        {
            title: 'Text Highlighting',
            desc: 'The first letter is made bold along with highlighting vowels and confusing letter pairs.',
            img: '/assets/form.jpeg',
            alt: 'Text Highlighting',
            reverse: true,
        },
    ];

    const facts = [
        '1 in 10 people worldwide experience dyslexia.',
        'It affects reading, not intelligence.',
        'Multisensory learning improves retention.',
        'Early support builds confidence.',
    ];

    return (
        <div className="features-page">
            {/* Navbar */}
            <nav className="features-navbar">
                <h2 className="features-navbar-title">CLARIVA</h2>
                <div className="features-nav-links">
                    <a href="#features">Features</a>
                    <a href="#facts">Facts</a>
                    <Link to="/admin">Admin</Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="features-hero">
                <div className="hero-circle small" />
                <div className="hero-circle large" />
                <h1>CLARIVA</h1>
                <div className="hero-subtitle">A Dyslexia Friendly Reader</div>
                <p>
                    Dyslexia-friendly reading assistant with intelligent formatting,
                    audio support, pronunciation guidance, and smart highlighting.
                </p>
            </section>

            {/* Features */}
            <section id="features" className="features-container">
                {features.map((feat, idx) => (
                    <div key={idx} className={`feature-row ${feat.reverse ? 'reverse' : ''}`}>
                        <div className="feature-text">
                            <h2>{feat.title}</h2>
                            <p>{feat.desc}</p>
                        </div>
                        <div className="feature-visual-box">
                            <img src={feat.img} alt={feat.alt} />
                        </div>
                    </div>
                ))}
            </section>

            {/* Facts */}
            <section id="facts" className="features-container">
                <h2 className="facts-heading">Facts About Dyslexia</h2>
                <div className="facts-grid">
                    {facts.map((fact, idx) => (
                        <div key={idx} className="fact-card">{fact}</div>
                    ))}
                </div>
            </section>

            {/* Next Button */}
            <button className="next-btn" onClick={() => navigate('/reader')}>
                Next →
            </button>
        </div>
    );
}
