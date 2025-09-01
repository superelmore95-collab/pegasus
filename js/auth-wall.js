// auth-wall.js - Content restriction system

const API_BASE = 'https://pegasus-backend.super-elmore95.workers.dev';

class AuthWall {
  constructor() {
    this.loginWall = document.getElementById('login-wall');
    this.protectedSections = document.querySelectorAll('.protected-content');
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    const user = localStorage.getItem('pegasus_user');
    const token = localStorage.getItem('pegasus_token');
    return !!(user && token);
  }
  
  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('pegasus_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  // Verify token with backend
  async verifyToken() {
    try {
      const token = localStorage.getItem('pegasus_token');
      if (!token) return false;
      
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }
  
  // Show login wall
  showLoginWall() {
    if (this.loginWall) {
      this.loginWall.style.display = 'block';
    }
    
    // Hide protected content
    this.protectedSections.forEach(section => {
      section.style.display = 'none';
    });
  }
  
  // Hide login wall
  hideLoginWall() {
    if (this.loginWall) {
      this.loginWall.style.display = 'none';
    }
    
    // Show protected content
    this.protectedSections.forEach(section => {
      section.style.display = 'block';
    });
  }
  
  // Initialize auth wall
  async init() {
    const isAuthenticated = this.isAuthenticated();
    
    if (isAuthenticated) {
      // Verify token is still valid
      const isValid = await this.verifyToken();
      
      if (isValid) {
        this.hideLoginWall();
        return true;
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('pegasus_user');
        localStorage.removeItem('pegasus_token');
        this.showLoginWall();
        return false;
      }
    } else {
      this.showLoginWall();
      return false;
    }
  }
  
  // Make authenticated requests
  async authFetch(url, options = {}) {
    const token = localStorage.getItem('pegasus_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
      // Token is invalid, clear storage and show login wall
      localStorage.removeItem('pegasus_user');
      localStorage.removeItem('pegasus_token');
      this.showLoginWall();
      throw new Error('Authentication failed');
    }
    
    return response;
  }
}

// Initialize auth wall when page loads
document.addEventListener('DOMContentLoaded', async () => {
  window.authWall = new AuthWall();
  await window.authWall.init();
  
  // If protected content needs to be loaded after authentication
  if (await window.authWall.init()) {
    // Load protected content here
    loadProtectedContent();
  }
});

// Example function to load protected content
async function loadProtectedContent() {
  try {
    const response = await window.authWall.authFetch(`${API_BASE}/api/content`);
    const content = await response.json();
    
    // Process and display the content
    console.log('Protected content loaded:', content);
    
    // Update your UI with the content
    updateContentUI(content);
  } catch (error) {
    console.error('Failed to load protected content:', error);
  }
}
