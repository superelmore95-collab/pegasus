// auth-wall.js - Professional Content Restriction System
const API_BASE = 'https://pegasus-backend.super-elmore95.workers.dev';

class AuthWall {
  constructor() {
    this.loginWall = document.getElementById('login-wall');
    this.protectedSections = document.querySelectorAll('.protected-content');
    this.initLoginWall();
  }
  
  // Initialize professional login wall
  initLoginWall() {
    if (this.loginWall) {
      this.loginWall.innerHTML = `
        <div class="login-wall-overlay">
          <div class="login-wall-content">
            <div class="login-wall-header">
              <img src="images/pegasus-logo.png" alt="PEGASUS" class="login-wall-logo">
              <h2>Premium Content</h2>
            </div>
            <p>Access exclusive sports content with a PEGASUS subscription</p>
            <div class="login-wall-features">
              <div class="feature">
                <i class="fas fa-play-circle"></i>
                <span>Live & On-Demand Events</span>
              </div>
              <div class="feature">
                <i class="fas fa-trophy"></i>
                <span>Exclusive Championships</span>
              </div>
              <div class="feature">
                <i class="fas fa-hd"></i>
                <span>HD & 4K Streaming</span>
              </div>
            </div>
            <div class="login-wall-buttons">
              <a href="signin.html" class="btn btn-outline">Sign In</a>
              <a href="signup.html" class="btn subscribe-btn">Subscribe Now</a>
            </div>
          </div>
        </div>
      `;
      
      // Add CSS for the professional login wall
      this.addLoginWallStyles();
    }
  }
  
  // Add styles for professional login wall
  addLoginWallStyles() {
    const styles = `
      .login-wall-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 10, 18, 0.98);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(10px);
      }
      
      .login-wall-content {
        background: var(--card-bg);
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .login-wall-header {
        margin-bottom: 20px;
      }
      
      .login-wall-logo {
        height: 60px;
        margin-bottom: 15px;
      }
      
      .login-wall-content h2 {
        font-size: 24px;
        margin-bottom: 10px;
        color: var(--accent);
      }
      
      .login-wall-content p {
        color: var(--text-secondary);
        margin-bottom: 25px;
        font-size: 16px;
      }
      
      .login-wall-features {
        margin: 25px 0;
        text-align: left;
      }
      
      .login-wall-features .feature {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }
      
      .login-wall-features .feature i {
        color: var(--accent);
        font-size: 20px;
        margin-right: 12px;
        width: 24px;
      }
      
      .login-wall-features .feature span {
        color: var(--text);
        font-weight: 500;
        font-size: 14px;
      }
      
      .login-wall-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
      }
      
      @media (max-width: 480px) {
        .login-wall-buttons {
          flex-direction: column;
        }
        
        .login-wall-content {
          padding: 30px 20px;
        }
        
        .login-wall-features .feature {
          flex-direction: column;
          text-align: center;
        }
        
        .login-wall-features .feature i {
          margin-right: 0;
          margin-bottom: 8px;
        }
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
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
