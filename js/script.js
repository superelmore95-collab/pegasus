// Global API base URL - Replace with your actual Worker URL
const API_BASE = 'https://pegasus-backend.super-elmore95.workers.dev';

// Authentication functions
async function signUp(name, email, password) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store the token and user data
      localStorage.setItem('pegasus_token', data.token);
      localStorage.setItem('pegasus_user', JSON.stringify(data.user));
      
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

async function signIn(email, password) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store the token and user data
      localStorage.setItem('pegasus_token', data.token);
      localStorage.setItem('pegasus_user', JSON.stringify(data.user));
      
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

function getCurrentUser() {
  const userData = localStorage.getItem('pegasus_user');
  return userData ? JSON.parse(userData) : null;
}

function getToken() {
  return localStorage.getItem('pegasus_token');
}

function isAuthenticated() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem('pegasus_token');
  localStorage.removeItem('pegasus_user');
  window.location.href = 'index.html';
}

// Example of making an authenticated request
async function getUserProfile() {
  const token = getToken();
  
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Update UI based on authentication status
function updateAuthUI() {
  const authButtons = document.querySelector('.auth-buttons');
  const mobileAuth = document.querySelector('.mobile-auth');
  
  if (isAuthenticated()) {
    const user = getCurrentUser();
    
    // Update desktop auth buttons
    if (authButtons) {
      authButtons.innerHTML = `
        <div class="user-menu">
          <button class="user-btn" id="user-menu-btn">
            <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <span>${user.name}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="user-dropdown" id="user-dropdown">
            <a href="profile.html"><i class="fas fa-user"></i> Profile</a>
            <a href="favorites.html"><i class="fas fa-heart"></i> Favorites</a>
            ${user.role === 'admin' ? '<a href="admin.html"><i class="fas fa-cog"></i> Admin</a>' : ''}
            <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
        </div>
      `;
      
      // Add event listeners for the dropdown
      const userMenuBtn = document.getElementById('user-menu-btn');
      const userDropdown = document.getElementById('user-dropdown');
      
      if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking elsewhere
        document.addEventListener('click', () => {
          userDropdown.classList.remove('show');
        });
      }
    }
    
    // Update mobile auth buttons
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <a href="profile.html" class="btn btn-outline">Profile</a>
        <a href="favorites.html" class="btn btn-outline">Favorites</a>
        <a href="#" id="mobile-logout-btn" class="btn">Logout</a>
      `;
    }
    
    // Add logout handlers
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
    
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  } else {
    // User is not logged in
    if (authButtons) {
      authButtons.innerHTML = `
        <a href="signin.html" class="btn btn-outline">Sign In</a>
        <a href="signup.html" class="btn">Subscribe</a>
      `;
    }
    
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <a href="signin.html" class="btn btn-outline">Sign In</a>
        <a href="signup.html" class="btn">Subscribe</a>
      `;
    }
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Only show preloader on index.html
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    // Initialize preloader - fixed to always hide
    setTimeout(() => {
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.classList.add('hide');
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 500);
      }
    }, 1000);
  } else {
    // Hide preloader immediately on other pages
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.display = 'none';
    }
  }
  
  updateAuthUI();
  
  // Initialize mobile menu
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }
  
  // Initialize hero slider if exists
  if (document.querySelector('.hero-slider')) {
    initHeroSlider();
  }
  
  // Load channel content on index.html if channel section exists
  if (document.getElementById('channel-content')) {
    loadChannels();
  }
});

// Hero slider functionality
function initHeroSlider() {
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

// Load channels for index.html
async function loadChannels() {
  try {
    const container = document.getElementById('channel-content');
    if (!container) return;
    
    const response = await fetch(`${API_BASE}/api/content?type=channel&limit=4`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const content = await response.json();
    const channels = content.channels || [];
    
    // Clear container
    container.innerHTML = '';
    
    if (channels.length === 0) {
      container.innerHTML = '<p class="no-content">No channels available</p>';
      return;
    }
    
    // Add channels to container
    channels.forEach(channel => {
      const card = document.createElement('a');
      card.href = `player.html?type=channel&id=${channel.id}`;
      card.className = 'stream-card';
      
      card.innerHTML = `
        <div class="card-img">
          <img src="${channel.thumbnail_url}" alt="${channel.name}" onerror="this.src='https://via.placeholder.com/400x225'">
          ${channel.is_live ? '<div class="live-badge">LIVE</div>' : ''}
        </div>
        <div class="card-content">
          <h3 class="card-title">${channel.name}</h3>
          <div class="card-meta">
            <span>${channel.category || 'Sports'}</span>
            <span class="card-views">${channel.viewers_count || 0} watching</span>
          </div>
        </div>
      `;
      
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading channels:', error);
    const container = document.getElementById('channel-content');
    if (container) {
      container.innerHTML = '<p class="error-message">Failed to load channels. Please try again later.</p>';
    }
  }
}

// Content loading functions
async function loadContent(type, containerId, filter = 'all', limit = 8) {
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
    
    let url = `${API_BASE}/api/content`;
    if (type !== 'all') {
      url += `?type=${type}`;
    }
    
    if (filter !== 'all') {
      url += `${type !== 'all' ? '&' : '?'}category=${filter}`;
    }
    
    url += `${filter !== 'all' || type !== 'all' ? '&' : '?'}limit=${limit}`;
    
    const token = getToken();
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

// Check if user has premium access
async function checkPremiumAccess() {
  try {
    const token = getToken();
    if (!token) return false;
    
    const response = await fetch(`${API_BASE}/api/user/profile`, {
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

// Check content access
async function checkContentAccess(contentId, contentType) {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}/api/content/${contentType}/${contentId}`, { headers });
    
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

// Favorites functionality
async function addToFavorites(contentId, contentType) {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(`${API_BASE}/api/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ contentId, contentType })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

async function removeFromFavorites(favoriteId) {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(`${API_BASE}/api/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

async function getFavorites() {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(`${API_BASE}/api/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.favorites };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Check if content is favorited
async function isContentFavorited(contentId, contentType) {
  try {
    const favoritesResult = await getFavorites();
    if (!favoritesResult.success) return false;
    
    return favoritesResult.data.some(fav => 
      fav.content_id == contentId && fav.content_type === contentType
    );
  } catch (error) {
    console.error('Error checking favorites:', error);
    return false;
  }
}
