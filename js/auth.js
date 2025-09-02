// auth.js - Enhanced Authentication System
class AuthManager {
  constructor() {
    this.API_BASE = window.PEGASUS_CONFIG ? window.PEGASUS_CONFIG.API_BASE : 'https://pegasus-backend.super-elmore95.workers.dev';
    this.init();
  }

  init() {
    this.updateAuthUI();
    this.setupScrollHeader();
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

  async signIn(email, password, remember) {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        return { 
          success: false, 
          error: text || `Server error: ${response.status} ${response.statusText}` 
        };
      }
      
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
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  async signUp(name, email, password) {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        return { 
          success: false, 
          error: text || `Server error: ${response.status} ${response.statusText}` 
        };
      }
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('pegasus_user', JSON.stringify(data.user));
        localStorage.setItem('pegasus_token', data.token);
        this.updateAuthUI();
        return { success: true, data };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
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
    
    if (this.isAuthenticated()) {
      const user = this.getCurrentUser();
      
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
        
        const logoutBtn = document.getElementById('logout-btn');
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (logoutBtn) {
          logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.signOut();
          });
        }
        
        if (userMenuBtn && userDropdown) {
          userMenuBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('show');
          });
          
          document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
              userDropdown.classList.remove('show');
            }
          });
        }
      }
    } else {
      if (authButtons) {
        authButtons.innerHTML = `
          <a href="signin.html" class="btn btn-outline">Sign In</a>
          <a href="signup.html" class="btn subscribe-btn">Subscribe</a>
        `;
      }
    }
  }

  async checkAuthStatus() {
    if (!this.isAuthenticated()) return false;
    
    try {
      const token = this.getToken();
      const response = await fetch(`${this.API_BASE}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        this.signOut();
        return false;
      }
      
      return response.ok;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  async addToFavorites(contentId, contentType) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };
      
      const response = await fetch(`${this.API_BASE}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contentId, contentType })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, favoriteId: data.favoriteId };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to add to favorites' };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  async removeFromFavorites(favoriteId) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };
      
      const response = await fetch(`${this.API_BASE}/api/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to remove from favorites' };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }

  async checkFavoriteStatus(contentId, contentType) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, isFavorited: false };
      
      const response = await fetch(`${this.API_BASE}/api/favorites/check?contentId=${contentId}&contentType=${contentType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, ...data };
      } else {
        return { success: false, isFavorited: false };
      }
    } catch (error) {
      return { success: false, isFavorited: false };
    }
  }

  async getFavorites() {
    try {
      const token = this.getToken();
      if (!token) return { success: false, favorites: [] };
      
      const response = await fetch(`${this.API_BASE}/api/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, favorites: data.favorites || [] };
      } else {
        return { success: false, favorites: [] };
      }
    } catch (error) {
      return { success: false, favorites: [] };
    }
  }

  async getComments(contentId, contentType) {
    try {
      const response = await fetch(`${this.API_BASE}/api/comments?contentId=${contentId}&contentType=${contentType}`);
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, comments: data };
      } else {
        return { success: false, comments: [] };
      }
    } catch (error) {
      return { success: false, comments: [] };
    }
  }

  async addComment(contentId, contentType, comment) {
    try {
      const token = this.getToken();
      if (!token) return { success: false, error: 'Not authenticated' };
      
      const response = await fetch(`${this.API_BASE}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contentId, contentType, comment })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, comment: data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to add comment' };
      }
    } catch (error) {
      return { success: false, error: 'Network error: ' + error.message };
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    if (!window.PEGASUS_CONFIG) {
      console.warn('PEGASUS_CONFIG not found, using defaults');
      window.PEGASUS_CONFIG = {
        API_BASE: 'https://pegasus-backend.super-elmore95.workers.dev',
        JWT_SECRET: 'pegasus-super-secret-key-change-in-production',
        APP_VERSION: '1.0.0'
      };
    }
    
    window.authManager = new AuthManager();
  } catch (error) {
    console.error('Failed to initialize AuthManager:', error);
  }
});
