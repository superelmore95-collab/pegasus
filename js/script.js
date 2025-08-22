// Initialize mobile menu functionality
const initMobileMenu = () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
      
      // Toggle body scroll when menu is open
      if (navLinks.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    });
    
    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = 'auto';
      });
    });
  }
};

// Hero Slider
const initHeroSlider = () => {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dot');
  
  if (slides.length > 0 && dots.length > 0) {
    let currentSlide = 0;
    
    // Show initial slide
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    
    // Auto slide
    const slideInterval = setInterval(() => {
      goToSlide((currentSlide + 1) % slides.length);
    }, 5000);
    
    // Dot click events
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        goToSlide(index);
        clearInterval(slideInterval);
      });
    });
    
    function goToSlide(index) {
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      
      currentSlide = index;
      
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }
  }
};

// Active navigation link
const setActiveLink = () => {
  const navLinks = document.querySelectorAll('.nav-links a');
  const currentPage = window.location.pathname.split('/').pop();
  
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });
};

// Card hover animations
const initCardHover = () => {
  const streamCards = document.querySelectorAll('.stream-card');
  streamCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px)';
      card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    });
  });
};

// Initialize all functions when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initMobileMenu();
  initHeroSlider();
  setActiveLink();
  initCardHover();
});
