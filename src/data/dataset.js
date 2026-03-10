/**
 * CLARIVA Dyslexia-Friendly Reader - Configuration Dataset
 * Contains all font, spacing, color, and highlight settings.
 */

export const DATASET = {
    font: [
        "Arial",
        "Verdana",
        "Tahoma",
        "Century Gothic",
        "Trebuchet MS",
        "Calibri",
        "Open Sans",
        "Comic Sans MS",
    ],

    font_size: { min: 12, recommended: 16, max: 26 },
    letter_spacing: { min: 0.05, recommended: 0.15, max: 0.2 },
    word_spacing: { min: 0.1, recommended: 0.25, max: 0.35 },
    line_spacing: { min: 1.4, recommended: 1.5, max: 2.0 },

    background_colors: {
        "soft-cream": "#FFFDD0",
        "off-white": "#FAF9F6",
        "pastel-yellow": "#FEFFD2",
        "light-blue": "#E3F2FD",
        "light-peach": "#FFDAB9",
    },

    text_colors: {
        black: "#000000",
        "dark-blue": "#00008B",
        "dark-brown": "#5D4037",
    },

    highlight_colors: {
        vowels: "#3b82f6",
        mirror_letters1: "#2e7d32",
        mirror_letters2: "#c62828",
        similar_shapes1: "#6a1b9a",
        similar_shapes2: "#1565c0",
        similar_shapes3: "#ef6c00",
        thin_vertical1: "#283593",
        thin_vertical2: "#4527a0",
        tail_letters: "#00695c",
        similar_numbers: "#37474f",
    },

    confusing_letter_groups: {
        mirror_letters1: ["b", "d"],
        mirror_letters2: ["p", "q"],
        similar_shapes1: ["m", "n"],
        similar_shapes2: ["o", "u"],
        similar_shapes3: ["c", "e"],
        thin_vertical1: ["i", "j"],
        thin_vertical2: ["l", "t"],
        tail_letters: ["g", "y"],
        similar_numbers: ["6", "9"],
    },
};
