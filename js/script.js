// script.js - Main Application Script
class PegasusApp {
  constructor() {
    this.API_BASE = window.PEGASUS_CONFIG.API_BASE;
    this.init();
  }

  init() {
    this.hidePreloader();
    this.setupEventListeners();
    
    // Initialize components based on page
    if (document.querySelector('.hero-slider')) {
      this.initHeroSlider();
    }
    
    if (document.getElementById('live-content')) {
      this.loadContent('live', 'live-content', 'all', 4);
    }
    
    if (document.getElementById('vod-content')) {
      this.loadContent('vod', 'vod-content', 'all', 4);
    }
    
    if (document.getElementById('highlights-content')) {
      this.loadContent('highlight', 'highlights-content', 'all', 4);
    }
  }

  hidePreloader() {
    setTimeout(() => {
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.classList.add('hide');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 500);
      }
    }, 1000);
  }

  setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
      });
    }
  }

  initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    
    if (slides.length === 0) return;
    
    function showSlide(n) {
      slides.forEach(slide => slide.classList.remove('active'));
      dots.forEach(dot => dot.classList.remove('active'));
      
      currentSlide = (n + slides.length) % slides.length;
      
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }
    
    // Auto advance slides
    setInterval(() => {
      showSlide(currentSlide + 1);
    }, 5000);
    
    // Add click events to dots
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
      });
    });
  }

  async loadContent(type, containerId, filter = 'all', limit = 8) {
    try {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      // Show loading state
      container.innerHTML = `
        <div class="loading-placeholder">
          <div class="loading-spinner"></div>
          <p>Loading content...</p>
        </div>
      `;
      
      let url = `${this.API_BASE}/api/content`;
      if (type !== 'all') {
        url += `?type=${type}`;
      }
      
      if (filter !== 'all') {
        url += `${type !== 'all' ? '&' : '?'}category=${filter}`;
      }
      
      url += `${filter !== 'all' || type !== 'all' ? '&' : '?'}limit=${limit}`;
      
      const token = window.authManager ? window.authManager.getToken() : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const content = await response.json();
      const contentArray = content[type] || [];
      
      // Clear container
      container.innerHTML = '';
      
      if (contentArray.length === 0) {
        container.innerHTML = '<p class="no-content">No content available</p>';
        return;
      }
      
      // Add content to container
      contentArray.forEach(item => {
        const card = document.createElement('a');
        card.href = `player.html?type=${type}&id=${item.id}`;
        card.className = 'stream-card';
        
        const isLive = item.is_live || false;
        const viewsText = isLive ? 
          `${item.viewers_count || 0} watching` : 
          `${item.views_count || item.view_count || 0} views`;
        
        card.innerHTML = `
          <div class="card-img">
            <img src="${item.thumbnail || item.thumbnail_url}" alt="${item.title || item.name}" onerror="this.src='https://via.placeholder.com/400x225'">
            ${isLive ? '<div class="live-badge">LIVE</div>' : ''}
            ${item.requires_premium ? '<div class="premium-badge">PREMIUM</div>' : ''}
          </div>
          <div class="card-content">
            <h3 class="card-title">${item.title || item.name}</h3>
            <div class="card-meta">
              <span>${item.category || 'Sports'}</span>
              <span class="card-views">${viewsText}</span>
            </div>
          </div>
        `;
        
        container.appendChild(card);
      });
    } catch (error) {
      console.error('Error loading content:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<p class="error-message">Failed to load content. Please try again later.</p>';
      }
    }
  }

  async checkPremiumAccess() {
    try {
      const token = window.authManager ? window.authManager.getToken() : null;
      if (!token) return false;
      
      const response = await fetch(`${this.API_BASE}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.user.subscription_status === 'active';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }

  async checkContentAccess(contentId, contentType) {
    try {
      const token = window.authManager ? window.authManager.getToken() : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${this.API_BASE}/api/content/${contentType}/${contentId}`, { headers });
      
      if (response.status === 403) {
        return { accessible: false, reason: 'premium' };
      } else if (response.status === 401) {
        return { accessible: false, reason: 'auth' };
      } else if (response.ok) {
        return { accessible: true };
      } else {
        return { accessible: false, reason: 'unknown' };
      }
    } catch (error) {
      console.error('Error checking content access:', error);
      return { accessible: false, reason: 'error' };
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pegasusApp = new PegasusApp();
});
