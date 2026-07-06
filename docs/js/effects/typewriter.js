// import { terminalTexts } from '../data/terminalTexts.js';
const terminalTexts = require("../data/terminalTexts.js");

function typewriterEffect() {
  const terminalElement = $('#terminal-text');

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let currentText = '';

  function type() {
    const fullText = terminalTexts[textIndex];

    if (!isDeleting) {
      currentText = fullText.substring(0, charIndex + 1);
      charIndex++;

      if (charIndex === fullText.length) {
        isDeleting = true;
        setTimeout(type, CONFIG.terminalDelay);
        return;
      }
    } else {
      currentText = fullText.substring(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        textIndex = Math.floor(Math.random() * terminalTexts.length);
        setTimeout(type, 500);
        return;
      }
    }

    terminalElement.textContent = currentText;
    setTimeout(type, CONFIG.terminalSpeed);
  }

  type();
}

export default typewriterEffect;