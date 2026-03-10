import React, { useState } from 'react';
import { Type, Palette, Highlighter, RotateCcw, Check } from 'lucide-react';
import { DATASET } from '../data/dataset';

export default function PreferencesDrawer({ isOpen, onClose, preferences, onUpdatePreferences, onReset }) {
    const [activeTab, setActiveTab] = useState('settings');

    const updatePref = (key, value) => {
        onUpdatePreferences({ ...preferences, [key]: value });
    };

    const toggleHighlight = (id) => {
        const list = preferences.active_highlights;
        const updated = list.includes(id) ? list.filter(i => i !== id) : [...list, id];
        onUpdatePreferences({ ...preferences, active_highlights: updated });
    };

    const toggleConfusingGroup = (groupId) => {
        const list = preferences.active_confusing_groups;
        const updated = list.includes(groupId) ? list.filter(i => i !== groupId) : [...list, groupId];
        onUpdatePreferences({ ...preferences, active_confusing_groups: updated });
    };

    const renderSlider = (title, min, max, step, value, onChange) => (
        <div>
            <label className="section-label">{title}</label>
            <input
                type="range"
                className="slider"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />
        </div>
    );

    const renderSettings = () => (
        <div className="animate-in zoom-in">
            <div className="section-group">
                <label className="section-label">Font Family</label>
                <div className="font-grid">
                    {DATASET.font.map((f) => (
                        <button
                            key={f}
                            className={`font-btn ${preferences.font === f ? 'active' : ''}`}
                            onClick={() => updatePref('font', f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            <div className="sliders-grid">
                {renderSlider('Font Size', DATASET.font_size.min, DATASET.font_size.max, 1, preferences.font_size, (v) => updatePref('font_size', v))}
                {renderSlider('Line Spacing', 1.2, 2.5, 0.1, preferences.line_spacing, (v) => updatePref('line_spacing', v))}
                {renderSlider('Letter Spacing', 0.05, 0.3, 0.01, preferences.letter_spacing, (v) => updatePref('letter_spacing', v))}
                {renderSlider('Word Spacing', 0.1, 0.5, 0.01, preferences.word_spacing, (v) => updatePref('word_spacing', v))}
            </div>
        </div>
    );

    const renderColors = () => (
        <div className="animate-in zoom-in">
            <div className="section-group">
                <label className="section-label">Background</label>
                <div className="color-flex">
                    {Object.entries(DATASET.background_colors).map(([name, hex]) => (
                        <button
                            key={name}
                            className={`color-swatch ${preferences.background_color === name ? 'active' : ''}`}
                            style={{ backgroundColor: hex }}
                            onClick={() => updatePref('background_color', name)}
                        />
                    ))}
                </div>
            </div>
            <div className="section-group">
                <label className="section-label">Text Color</label>
                <div className="color-flex">
                    {Object.entries(DATASET.text_colors).map(([name, hex]) => (
                        <button
                            key={name}
                            className={`color-swatch ${preferences.text_color === name ? 'active' : ''}`}
                            style={{ backgroundColor: hex }}
                            onClick={() => updatePref('text_color', name)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    const renderHighlights = () => {
        const globalModes = [
            { id: 'vowel_coloring', label: 'Vowel Coloring' },
            { id: 'first_letter_bold', label: 'Bold Starts' },
        ];

        return (
            <div className="animate-in zoom-in">
                <div className="section-group">
                    <label className="section-label">Global Modes</label>
                    <div className="highlight-grid">
                        {globalModes.map((mode) => {
                            const isActive = preferences.active_highlights.includes(mode.id);
                            return (
                                <button
                                    key={mode.id}
                                    className={`highlight-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => toggleHighlight(mode.id)}
                                >
                                    <span>{mode.label}</span>
                                    {isActive && <Check />}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="section-group">
                    <label className="section-label">Specific Letter Pairs</label>
                    <div className="pairs-grid">
                        {Object.entries(DATASET.confusing_letter_groups).map(([groupId, letters]) => {
                            const isActive = preferences.active_confusing_groups.includes(groupId);
                            const color = DATASET.highlight_colors[groupId];
                            return (
                                <button
                                    key={groupId}
                                    className={`pair-btn ${isActive ? 'active' : ''}`}
                                    style={{
                                        color: isActive ? 'white' : color,
                                        backgroundColor: isActive ? color : 'white',
                                    }}
                                    onClick={() => toggleConfusingGroup(groupId)}
                                >
                                    {letters.join('')}
                                    {isActive && <Check />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className={`drawer-overlay ${isOpen ? 'visible' : ''}`}
                onClick={onClose}
            />
            <div className={`pref-drawer drawer-transition ${isOpen ? 'drawer-open' : ''}`}>
                <button className="drawer-handle" onClick={onClose}>
                    <div className="drawer-handle-bar" />
                </button>

                <div className="drawer-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Type /> SETTINGS
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('colors')}
                    >
                        <Palette /> COLORS
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'highlights' ? 'active' : ''}`}
                        onClick={() => setActiveTab('highlights')}
                    >
                        <Highlighter /> HIGHLIGHTS
                    </button>
                    <button className="reset-btn" onClick={onReset}>
                        <RotateCcw /> RESET
                    </button>
                </div>

                <div className="tab-content no-scrollbar">
                    {activeTab === 'settings' && renderSettings()}
                    {activeTab === 'colors' && renderColors()}
                    {activeTab === 'highlights' && renderHighlights()}
                </div>
            </div>
        </>
    );
}
