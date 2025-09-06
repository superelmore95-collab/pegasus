// script.js - Main Application Script with Popup Integration
class PegasusApp {
  constructor() {
    this.API_BASE = window.PEGASUS_CONFIG ? window.PEGASUS_CONFIG.API_BASE : 'https://pegasus-backend.super-elmore95.workers.dev';
    this.mobileMenuInitialized = false;
    this.init();
  }

  init() {
    this.hidePreloader();
    this.initMobileMenu();
    this.setupScrollHeader();
    
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
    
    // Add this line to load channels
    if (document.getElementById('channels-content')) {
      this.loadContent('channel', 'channels-content', 'all', 4);
    }
    
    // Setup content cards for popup
    this.setupContentCards();
  }

  setupContentCards() {
    const contentCards = document.querySelectorAll('.stream-card');
    
    contentCards.forEach(card => {
      // Remove existing click handlers
      card.replaceWith(card.cloneNode(true));
      
      // Add new click handler
      card.addEventListener('click', function(e) {
        e.preventDefault();
        
        const contentId = this.getAttribute('data-content-id');
        const contentType = this.getAttribute('data-content-type');
        
        if (contentId && contentType) {
          // Use the global function from vod.html
          if (typeof window.showContentPopup === 'function') {
            window.showContentPopup(contentId, contentType);
          } else {
            // Fallback to direct navigation if popup function is not available
            window.location.href = `player.html?type=${contentType}&id=${contentId}`;
          }
        }
      });
    });
  }

  setupScrollHeader() {
    const header = document.querySelector('header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
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

  initMobileMenu() {
    // Only initialize once to prevent conflicts
    if (this.mobileMenuInitialized) return;
    
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
      // Remove any existing event listeners to avoid duplicates
      const newHamburger = hamburger.cloneNode(true);
      hamburger.parentNode.replaceChild(newHamburger, hamburger);
      
      // Add new event listener
      newHamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileMenu();
      });
      
      // Close menu when clicking on links
      const navItems = navLinks.querySelectorAll('a');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          this.closeMobileMenu();
        });
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!newHamburger.contains(e.target) && !navLinks.contains(e.target) && navLinks.classList.contains('active')) {
          this.closeMobileMenu();
        }
      });
      
      this.mobileMenuInitialized = true;
    }
  }

  toggleMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    
    // Toggle body scroll when menu is open
    if (navLinks.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
      this.updateMobileAuthUI();
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  }

  updateMobileAuthUI() {
    const mobileAuth = document.querySelector('.mobile-auth');
    if (!mobileAuth) return;
    
    const user = this.getCurrentUser();
    
    if (user) {
      // User is logged in - show user menu
      mobileAuth.innerHTML = `
        <div class="user-menu-mobile">
          <a href="profile.html" class="btn btn-outline"><i class="fas fa-user"></i> Profile</a>
          <a href="favorites.html" class="btn btn-outline"><i class="fas fa-heart"></i> Favorites</a>
          ${user.role === 'admin' ? '<a href="admin.html" class="btn btn-outline"><i class="fas fa-cog"></i> Admin</a>' : ''}
          <button class="btn btn-outline" id="mobile-logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      `;
      
      // Add logout event
      const logoutBtn = document.getElementById('mobile-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.signOut();
        });
      }
    } else {
      // User is not logged in - show sign in/up buttons
      mobileAuth.innerHTML = `
        <a href="signin.html" class="btn btn-outline">Sign In</a>
        <a href="signup.html" class="btn subscribe-btn">Subscribe</a>
      `;
    }
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('pegasus_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  signOut() {
    localStorage.removeItem('pegasus_user');
    localStorage.removeItem('pegasus_token');
    localStorage.removeItem('pegasus_expiration');
    this.closeMobileMenu();
    this.updateMobileAuthUI();
    
    // Update the desktop UI as well
    if (window.authManager) {
      window.authManager.updateAuthUI();
    }
    
    // Reload the page to reflect changes
    window.location.reload();
  }

  initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const arrows = document.querySelectorAll('.arrow');
    const progressBar = document.querySelector('.mini-progress-bar');
    let currentSlide = 0;
    let slideInterval;
    let progressInterval;
    
    if (slides.length === 0) return;
    
    function showSlide(n) {
      // Clear any existing intervals
      clearInterval(slideInterval);
      clearInterval(progressInterval);
      
      // Hide all slides
      slides.forEach(slide => slide.classList.remove('active'));
      
      // Handle wrap-around for slide index
      currentSlide = (n + slides.length) % slides.length;
      
      // Show the current slide
      slides[currentSlide].classList.add('active');
      
      // Reset and start progress bar
      if (progressBar) {
        progressBar.style.width = '0%';
        startProgressBar();
      }
      
      // Restart auto-advance
      startSlideShow();
    }
    
    function startProgressBar() {
      let width = 0;
      progressInterval = setInterval(() => {
        if (width >= 100) {
          clearInterval(progressInterval);
          showSlide(currentSlide + 1);
        } else {
          width += 0.5; // Adjust speed as needed
          if (progressBar) {
            progressBar.style.width = width + '%';
          }
        }
      }, 50);
    }
    
    function startSlideShow() {
      slideInterval = setInterval(() => {
        showSlide(currentSlide + 1);
      }, 10000); // Change slide every 10 seconds
    }
    
    // Set up arrow click events
    if (arrows.length > 0) {
      arrows[0].addEventListener('click', () => {
        showSlide(currentSlide - 1);
      });
      
      arrows[1].addEventListener('click', () => {
        showSlide(currentSlide + 1);
      });
    }
    
    // Start the slideshow
    startSlideShow();
    if (progressBar) startProgressBar();
    
    // Pause slideshow on hover
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
        clearInterval(progressInterval);
      });
      
      hero.addEventListener('mouseleave', () => {
        startSlideShow();
        if (progressBar) startProgressBar();
      });
    }
    
    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (hero) {
      hero.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, false);
      
      hero.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, false);
    }
    
    function handleSwipe() {
      if (touchEndX < touchStartX - 50) {
        // Swipe left - next slide
        showSlide(currentSlide + 1);
      }
      
      if (touchEndX > touchStartX + 50) {
        // Swipe right - previous slide
        showSlide(currentSlide - 1);
      }
    }
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
        const text = await response.text();
        return { 
          success: false, 
          error: text || `Server error: ${response.status} ${response.statusText}` 
        };
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
        
        card.href = 'javascript:void(0)';
        card.className = 'stream-card';
        card.setAttribute('data-content-id', item.id);
        card.setAttribute('data-content-type', itemType);
        
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
            <div class="card-content">
              <h3 class="card-title">${item.title || item.name}</h3>
              <div class="card-meta">
                <span>${item.category || 'Sports'}</span>
                <span class="card-views">${viewsText}</span>
              </div>
            </div>
          </div>
        `;
        
        // Add click event to show popup
        card.addEventListener('click', function() {
          if (typeof window.showContentPopup === 'function') {
            window.showContentPopup(item.id, itemType);
          } else {
            // Fallback to direct navigation if popup function is not available
            window.location.href = `player.html?type=${itemType}&id=${item.id}`;
          }
        });
        
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
    // Ensure preloader is hidden even if there's an error
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
});
