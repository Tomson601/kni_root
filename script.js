let currentIndex = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  currentIndex = index;
}

function nextSlide() {
  let newIndex = (currentIndex + 1) % slides.length;
  showSlide(newIndex);
}

// Automatyczne przesuwanie co 5s
setInterval(nextSlide, 5000);

// Obsługa kliknięcia w kropki
dots.forEach(dot => {
  dot.addEventListener('click', () => {
    const index = parseInt(dot.getAttribute('data-index'));
    showSlide(index);
  });
});

document.addEventListener('DOMContentLoaded', function() {
    const quizBtn = document.querySelector('.quiz');
    if (quizBtn) {
        quizBtn.addEventListener('click', function() {
            window.open('https://kniupp.pl/phishing_quiz/', '_blank');
        });
    }

    const img = document.querySelector('img[alt="Otwarte spotkanie KNI UPP"]');
    const modal = document.getElementById('img-modal');
    const modalImg = document.getElementById('modal-img');

    if (img && modal && modalImg) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function() {
            modal.style.display = 'flex';
            modalImg.src = img.src;
        });
        modal.addEventListener('click', function() {
            modal.style.display = 'none';
            modalImg.src = '';
        });
    }
});

