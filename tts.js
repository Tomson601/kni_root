// This file handles the JavaScript functionality for the text-to-speech feature on the tts.html page.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tts-form');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const textInput = document.getElementById('text-input');
  const langSelect = document.getElementById('lang-select');
  const slowInput = document.getElementById('slow-input');
  const resultDiv = document.getElementById('result');
  const clearBtn = document.getElementById('clear-btn');

  // Zmień na swój endpoint backendu
  const API_URL = 'https://kniupp.pl/api/tts/';

  clearBtn.addEventListener('click', () => {
    textInput.value = '';
    langSelect.selectedIndex = 0;
    slowInput.checked = false;
    resultDiv.innerHTML = '';
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    const payload = {
      text: textInput.value.trim(),
      lang: langSelect.value,
      slow: !!slowInput.checked
    };

    if (!payload.text) {
      resultDiv.innerHTML = '<em>Wprowadź tekst.</em>';
      return;
    }

    // Ustal czas animacji na podstawie liczby znaków (np. 30ms na znak, min 1s, max 10s)
    const textLength = payload.text.length;
    const totalTime = Math.min(10000, Math.max(1000, textLength * 30)); // od 1s do 10s

    let progress = 0;
    let finished = false;
    const step = 99.9 / (totalTime / 50); // co 50ms, max 99.9%

    const interval = setInterval(() => {
        if (progress < 99.9 && !finished) {
            progress += step;
            if (progress > 99.9) progress = 99.9;
            progressBar.style.width = progress + '%';
            progressText.textContent = progress.toFixed(1) + '%';
        }
    }, 50);

    // Fetch do backendu
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        finished = true;
        clearInterval(interval);
        progressBar.style.width = '100%';
        progressText.textContent = '100%';

        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`Błąd serwera: ${response.status} ${txt}`);
        }

        // jeśli backend zwraca plik audio jako blob
        const contentType = response.headers.get('content-type') || '';
        if (contentType.startsWith('audio/') || contentType === 'application/octet-stream') {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);

          resultDiv.innerHTML = `
            <audio controls src="${url}"></audio>
            <div style="margin-top:0.5em;"><a id="download-link" href="${url}" download="tts_output.${getExtensionFromType(contentType)}">Pobierz plik</a></div>
          `;
          return;
        }

        // jeśli backend zwraca JSON z polem url albo base64
        const data = await response.json();
        if (data.url) {
          resultDiv.innerHTML = `
            <audio controls src="${data.url}"></audio>
            <div style="margin-top:0.5em;"><a href="${data.url}" target="_blank" rel="noopener">Otwórz / pobierz</a></div>
          `;
          return;
        }

        if (data.base64) {
          const blob = base64ToBlob(data.base64, data.contentType || 'audio/mpeg');
          const url = URL.createObjectURL(blob);
          resultDiv.innerHTML = `
            <audio controls src="${url}"></audio>
            <div style="margin-top:0.5em;"><a href="${url}" download="tts_output.${getExtensionFromType(data.contentType || 'audio/mpeg')}">Pobierz</a></div>
          `;
          return;
        }

        resultDiv.innerHTML = '<em>Otrzymano nieoczekiwaną odpowiedź.</em>';
      } catch (err) {
        finished = true;
        clearInterval(interval);
        progressBar.style.width = '100%';
        progressText.textContent = 'Błąd';
        console.error(err);
        resultDiv.innerHTML = `<em>Błąd: ${err.message}</em>`;
      }
  });

  function base64ToBlob(base64, contentType = '', sliceSize = 512) {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  function getExtensionFromType(contentType) {
    if (!contentType) return 'bin';
    if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3';
    if (contentType.includes('wav')) return 'wav';
    if (contentType.includes('ogg')) return 'ogg';
    return 'bin';
  }
});