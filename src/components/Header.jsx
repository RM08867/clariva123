import React from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import { DATASET } from '../data/dataset';

export default function Header({ preferences, inputText, formattedContentRef, isLoading, statusMsg }) {

    const handleSave = () => {
        const bgColor = DATASET.background_colors[preferences.background_color];
        const textColor = DATASET.text_colors[preferences.text_color];
        const content = formattedContentRef.current?.innerHTML || '';

        const htmlContent = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '<title>CLARIVA Document</title>',
            '<style>',
            `body { background-color: ${bgColor}; color: ${textColor}; font-family: '${preferences.font}', sans-serif; font-size: ${preferences.font_size}px; line-height: ${preferences.line_spacing}; letter-spacing: ${preferences.letter_spacing}em; word-spacing: ${preferences.word_spacing}em; padding: 40px; white-space: pre-wrap; margin: 0; }`,
            '</style>',
            '</head>',
            `<body>${content}</body>`,
            '</html>',
        ].join('\n');

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'CLARIVA_Formatted.html';
        link.click();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: 'CLARIVA', text: inputText });
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="header-title">CLARIVA</h1>
                {isLoading && <Loader2 className="header-loader" />}
                <span className="status-msg">{statusMsg}</span>
            </div>
            <div className="header-actions">
                <button className="header-btn" onClick={handleSave} title="Save">
                    <Download />
                    <span>Save</span>
                </button>
                <button className="header-btn" onClick={handleShare} title="Share">
                    <Share2 />
                    <span>Share</span>
                </button>
            </div>
        </header>
    );
}
