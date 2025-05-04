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
