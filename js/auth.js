// auth.js - Enhanced Authentication System
class AuthManager {
  constructor() {
    this.API_BASE = window.PEGASUS_CONFIG.API_BASE;
    this.init();
  }

  init() {
    this.updateAuthUI();
    this.setupEventListeners();
  }

  async signIn(email, password, remember) {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('pegasus_user', JSON.stringify(data.user));
        localStorage.setItem('pegasus_token', data.token);
        
        if (remember) {
          const expiration = new Date();
          expiration.setDate(expiration.getDate() + 30);
          localStorage.setItem('pegasus_expiration', expiration.toISOString());
        }
        
        this.updateAuthUI();
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async signUp(name, email, password) {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('pegasus_user', JSON.stringify(data.user));
        localStorage.setItem('pegasus_token', data.token);
        this.updateAuthUI();
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  isAuthenticated() {
    const user = localStorage.getItem('pegasus_user');
    const token = localStorage.getItem('pegasus_token');
    return !!(user && token);
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('pegasus_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken() {
    return localStorage.getItem('pegasus_token');
  }

  signOut() {
    localStorage.removeItem('pegasus_user');
    localStorage.removeItem('pegasus_token');
    localStorage.removeItem('pegasus_expiration');
    this.updateAuthUI();
    window.location.href = 'index.html';
  }

  updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const mobileAuth = document.querySelector('.mobile-auth');
    
    if (this.isAuthenticated()) {
      const user = this.getCurrentUser();
      
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
      const userMenuBtn = document.getElementById('user-menu-btn');
      const userDropdown = document.getElementById('user-dropdown');
      
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.signOut();
        });
      }
      
      if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.signOut();
        });
      }
      
      if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', () => {
          userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
          }
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
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authManager = new AuthManager();
});
