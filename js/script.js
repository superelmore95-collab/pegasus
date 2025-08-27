// script.js - Main Application Script
class PegasusApp {
  constructor() {
    this.API_BASE = window.PEGASUS_CONFIG ? window.PEGASUS_CONFIG.API_BASE : 'https://pegasus-backend.super-elmore95.workers.dev';
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
      const params = new URLSearchParams();
      
      if (type !== 'all') {
        params.append('type', type);
      }
      
      if (filter !== 'all') {
        params.append('category', filter);
      }
      
      params.append('limit', limit);
      
      url += `?${params.toString()}`;
      
      const token = window.authManager ? window.authManager.getToken() : null;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, { headers });
      
      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const content = await response.json();
      
      // Handle different response structures
      let contentArray = [];
      if (content[type]) {
        contentArray = content[type];
      } else if (Array.isArray(content)) {
        contentArray = content;
      } else if (content.data && Array.isArray(content.data)) {
        contentArray = content.data;
      }
      
      // Clear container
      container.innerHTML = '';
      
      if (contentArray.length === 0) {
        container.innerHTML = '<p class="no-content">No content available</p>';
        return;
      }
      
      // Add content to container
      contentArray.forEach(item => {
        const card = document.createElement('a');
        
        // Determine content type for URL
        let itemType = 'vod';
        if (item.is_live) itemType = 'live';
        if (item.type === 'highlight') itemType = 'highlight';
        if (item.type === 'channel') itemType = 'channel';
        
        card.href = `player.html?type=${itemType}&id=${item.id}`;
        card.className = 'stream-card';
        
        const isLive = item.is_live || false;
        const viewsText = isLive ? 
          `${item.viewers_count || 0} watching` : 
          `${item.views_count || item.view_count || 0} views`;
        
        card.innerHTML = `
          <div class="card-img">
            <img src="${item.thumbnail || item.thumbnail_url || 'https://via.placeholder.com/400x225'}" 
                 alt="${item.title || item.name}" 
                 onerror="this.src='https://via.placeholder.com/400x225'">
            ${isLive ? '<div class="live-badge">LIVE</div>' : ''}
            ${item.requires_premium || item.is_premium ? '<div class="premium-badge">PREMIUM</div>' : ''}
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
        container.innerHTML = `
          <p class="error-message">
            Failed to load content. ${error.message || 'Please try again later.'}
          </p>
        `;
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

// Initialize app when DOM is loaded with error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Ensure config is available
    if (!window.PEGASUS_CONFIG) {
      console.warn('PEGASUS_CONFIG not found, using defaults');
      window.PEGASUS_CONFIG = {
        API_BASE: 'https://pegasus-backend.super-elmore95.workers.dev',
        JWT_SECRET: 'pegasus-super-secret-key-change-in-production',
        APP_VERSION: '1.0.0'
      };
    }
    
    window.pegasusApp = new PegasusApp();
  } catch (error) {
    console.error('Failed to initialize PegasusApp:', error);
  }
});
