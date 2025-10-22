// This file handles the JavaScript functionality for the text-to-speech feature on the tts.html page.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tts-form');
  const textInput = document.getElementById('text-input');
  const langSelect = document.getElementById('lang-select');
  const slowInput = document.getElementById('slow-input');
  const result = document.getElementById('result');
  const clearBtn = document.getElementById('clear-btn');

  // Zmień na swój endpoint backendu
  const API_URL = 'http://127.0.0.1:5000/tts';

  clearBtn.addEventListener('click', () => {
    textInput.value = '';
    langSelect.selectedIndex = 0;
    slowInput.checked = false;
    result.innerHTML = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    result.innerHTML = 'Wysyłanie...';

    const payload = {
      text: textInput.value.trim(),
      lang: langSelect.value,
      slow: !!slowInput.checked
    };

    if (!payload.text) {
      result.innerHTML = '<em>Wprowadź tekst.</em>';
      return;
    }

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Błąd serwera: ${resp.status} ${txt}`);
      }

      // jeśli backend zwraca plik audio jako blob
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.startsWith('audio/') || contentType === 'application/octet-stream') {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);

        result.innerHTML = `
          <audio controls src="${url}"></audio>
          <div style="margin-top:0.5em;"><a id="download-link" href="${url}" download="tts_output.${getExtensionFromType(contentType)}">Pobierz plik</a></div>
        `;
        return;
      }

      // jeśli backend zwraca JSON z polem url albo base64
      const data = await resp.json();
      if (data.url) {
        result.innerHTML = `
          <audio controls src="${data.url}"></audio>
          <div style="margin-top:0.5em;"><a href="${data.url}" target="_blank" rel="noopener">Otwórz / pobierz</a></div>
        `;
        return;
      }

      if (data.base64) {
        const blob = base64ToBlob(data.base64, data.contentType || 'audio/mpeg');
        const url = URL.createObjectURL(blob);
        result.innerHTML = `
          <audio controls src="${url}"></audio>
          <div style="margin-top:0.5em;"><a href="${url}" download="tts_output.${getExtensionFromType(data.contentType || 'audio/mpeg')}">Pobierz</a></div>
        `;
        return;
      }

      result.innerHTML = '<em>Otrzymano nieoczekiwaną odpowiedź.</em>';
    } catch (err) {
      console.error(err);
      result.innerHTML = `<em>Błąd: ${err.message}</em>`;
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