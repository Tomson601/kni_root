// This file handles the JavaScript functionality for the text-to-speech feature on the tts.html page.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tts-form');
  const textInput = document.getElementById('text-input');
  const langSelect = document.getElementById('lang-select');
  const slowInput = document.getElementById('slow-input');
  const progressContainer = document.getElementById('progress-container');
  const progressInner = document.getElementById('progress-inner');
  const progressText = document.getElementById('progress-text');
  const stopBtn = document.getElementById('stop-btn');
  const clearBtn = document.getElementById('clear-btn');

  let utterance = null;
  let progressInterval = null;

  function langCode(v){
    return v === 'pl' ? 'pl-PL' : (v === 'de' ? 'de-DE' : 'en-US');
  }

  function startProgressSimulation(estSec){
    progressContainer.style.display = 'block';
    progressInner.style.width = '0%';
    const start = Date.now();
    progressInterval = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const pct = Math.min(100, (elapsed / Math.max(0.1, estSec)) * 100);
      progressInner.style.width = pct + '%';
      progressText.textContent = pct < 100 ? 'Trwa odtwarzanie…' : 'Kończenie…';
      if (pct >= 100) clearInterval(progressInterval);
    }, 200);
  }

  function stopSpeech(){
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
    if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
    progressContainer.style.display = 'none';
    progressInner.style.width = '0%';
    progressText.textContent = '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text) return;
    // cancel previous
    stopSpeech();

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode(langSelect.value);
    utterance.rate = slowInput.checked ? 0.85 : 1.0;
    utterance.volume = 1;
    utterance.pitch = 1;

    // start simulated progress: estimate seconds by words / 3.5
    const words = text.split(/\s+/).length;
    const estSec = Math.max(3, words / 3.5 * (1 / utterance.rate));
    startProgressSimulation(estSec);

    utterance.onend = () => {
      if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
      progressInner.style.width = '100%';
      progressText.textContent = 'Zakończono';
      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressInner.style.width = '0%';
        progressText.textContent = '';
      }, 900);
    };

    utterance.onerror = () => {
      stopSpeech();
      alert('Wystąpił błąd odtwarzania mowy.');
    };

    speechSynthesis.speak(utterance);
  });

  stopBtn.addEventListener('click', stopSpeech);
  clearBtn.addEventListener('click', () => {
    stopSpeech();
    textInput.value = '';
  });

});