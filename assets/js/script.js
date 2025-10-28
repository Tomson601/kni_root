// ...new file...
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const navList = document.querySelector('.nav-list');
  if (toggle && navList) {
    toggle.addEventListener('click', () => {
      const showing = navList.classList.toggle('show');
      toggle.setAttribute('aria-expanded', String(showing));
    });
    // close nav when link clicked (mobile)
    navList.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') navList.classList.remove('show');
    });
  }

  // reveal on scroll (prefer reduced motion respected)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  }

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Image modal (works if index.html has #img-modal)
  const modal = document.getElementById('img-modal');
  const modalImg = document.getElementById('modal-img');
  if (modal && modalImg) {
    document.querySelectorAll('img[data-modal="true"]').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        modalImg.src = img.src;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
    });
    modal.addEventListener('click', () => {
      modal.style.display = 'none';
      modalImg.src = '';
      document.body.style.overflow = '';
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.style.display = 'none';
        modalImg.src = '';
        document.body.style.overflow = '';
      }
    });
  }
});