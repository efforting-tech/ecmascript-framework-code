// These themes were generated using ChatGPT from OpenAI

// Function to create 24-bit ANSI escape codes
function rgb(r, g, b) {
	return `\x1b[38;2;${r};${g};${b}m`;
}

const RESET = '\x1b[0m';

// Fruity color scheme 🍇🍊🍉🌈
export const fruityTheme = {
	tag: (s) => rgb(255, 140, 0) + s + RESET,       // 🍊 Orange for tags
	name: (s) => rgb(173, 216, 230) + s + RESET,    // 🌊 Light blue for attribute names
	string: (s) => rgb(144, 238, 144) + s + RESET,  // 🍏 Light green for attribute values
	number: (s) => rgb(255, 99, 71) + s + RESET,    // 🍉 Reddish-orange for numbers
	comment: (s) => rgb(169, 169, 169) + s + RESET, // ☁️ Gray for comments
	attr: (s) => rgb(255, 182, 193) + s + RESET,    // 🍓 Pink for unknown attributes
	punctuation: (s) => rgb(255, 215, 0) + s + RESET, // 🌟 Gold for `=`, `<`, `>`
};

// Neon fruity theme ⚡
export const neonTheme = {
  tag: (s) => rgb(255, 120, 0) + s + RESET,        // 🍊 Orange neon
  name: (s) => rgb(0, 255, 150) + s + RESET,       // 💚 Greenish neon
  string: (s) => rgb(0, 120, 255) + s + RESET,     // 💙 Blue neon
  number: (s) => rgb(255, 0, 140) + s + RESET,     // 💖 Pink neon
  comment: (s) => rgb(120, 255, 0) + s + RESET,    // 🍏 Green-yellow neon
  attr: (s) => rgb(200, 0, 255) + s + RESET,       // 🟣 Purple neon
  punctuation: (s) => rgb(255, 255, 100) + s + RESET, // 🌟 Yellow neon
};





