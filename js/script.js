// PEGASUS Backend API URL
const API_BASE = 'https://pegasus-backend.super-elmore95.workers.dev';

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

// Function to test the backend connection
async function testBackend() {
  try {
    const testUrl = `${API_BASE}/api/test`;
    console.log('Testing connection to:', testUrl);
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Backend connection successful:', data);
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
}

// Function to load content from backend
async function loadContent() {
  try {
    const contentUrl = `${API_BASE}/api/content`;
    console.log('Loading content from:', contentUrl);
    
    const response = await fetch(contentUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const content = await response.json();
    console.log('Content loaded successfully:', content);
    
    // Update the website with the loaded content
    updateContentSections(content);
    
  } catch (error) {
    console.error('Error loading content:', error);
    // Fallback to hardcoded content if backend fails
    loadFallbackContent();
  }
}

// Function to update content sections on the page
function updateContentSections(content) {
  // Update live streams section
  if (content.live && content.live.length > 0) {
    updateSection('live-section', content.live, 'live');
  }
  
  // Update VOD section
  if (content.vod && content.vod.length > 0) {
    updateSection('vod-section', content.vod, 'vod');
  }
  
  // Update highlights section
  if (content.highlights && content.highlights.length > 0) {
    updateSection('highlights-section', content.highlights, 'highlight');
  }
}

// Function to update a specific section
function updateSection(sectionId, items, type) {
  const section = document.querySelector(`#${sectionId} .stream-grid`);
  if (!section) {
    console.warn(`Section ${sectionId} not found`);
    return;
  }
  
  // Clear existing content
  section.innerHTML = '';
  
  // Add new content
  items.forEach(item => {
    const card = createStreamCard(item, type);
    section.appendChild(card);
  });
}

// Function to create a stream card
function createStreamCard(item, type) {
  const card = document.createElement('a');
  card.href = `player.html?type=${type}&id=${item.id}`;
  card.className = 'stream-card';
  
  card.innerHTML = `
    <div class="card-img">
      <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/400x225'">
      ${type === 'live' ? '<div class="live-badge">LIVE</div>' : ''}
    </div>
    <div class="card-content">
      <h3 class="card-title">${item.title}</h3>
      <div class="card-meta">
        <span>${item.category || 'Sports'}</span>
        <span class="card-views">${type === 'live' ? `${item.viewers || 0} watching` : `${item.views || 0} views`}</span>
      </div>
    </div>
  `;
  
  return card;
}

// Fallback content if backend fails
function loadFallbackContent() {
  console.log('Loading fallback content');
  
  // Sample fallback data
  const fallbackData = {
    live: [
      {
        id: 1,
        title: "Manchester United vs Liverpool",
        description: "Premier League match",
        thumbnail: "https://via.placeholder.com/400x225",
        category: "Football",
        viewers: 24500
      }
    ],
    vod: [
      {
        id: 1,
        title: "Champions League Highlights",
        description: "Best moments from the final",
        thumbnail: "https://via.placeholder.com/400x225",
        category: "Football",
        views: 1200000
      }
    ],
    highlights: [
      {
        id: 1,
        title: "Goal of the Season",
        description: "Top goals from this season",
        thumbnail: "https://via.placeholder.com/400x225",
        category: "Football",
        views: 2400000
      }
    ]
  };
  
  updateContentSections(fallbackData);
}

// Initialize all functions when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('PEGASUS website initialized');
  
  initMobileMenu();
  initHeroSlider();
  setActiveLink();
  initCardHover();
  
  // Only load content if we're on a page that needs it
  if (document.querySelector('.stream-grid')) {
    // Test the backend connection and load content
    testBackend().then(success => {
      if (success) {
        // If backend is working, load content
        loadContent();
      } else {
        console.warn('Backend is not available, using fallback content');
        loadFallbackContent();
      }
    });
  }
});
