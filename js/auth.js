// Enhanced Authentication System
const API_BASE = 'https://your-worker-url.workers.dev';

// Authentication functions
async function signIn(email, password, remember) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid credentials');
    }
    
    const data = await response.json();
    
    // Store user data and token
    if (remember) {
      localStorage.setItem('pegasus_user', JSON.stringify(data.user));
      localStorage.setItem('pegasus_token', data.token);
    } else {
      sessionStorage.setItem('pegasus_user', JSON.stringify(data.user));
      sessionStorage.setItem('pegasus_token', data.token);
    }
    
    // Update UI
    updateAuthUI();
    
    // Redirect to home page or intended destination
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'explore.html';
    window.location.href = redirectUrl;
    
  } catch (error) {
    throw new Error(error.message || 'Sign in failed. Please try again.');
  }
}

// Sign up function
async function signUp(name, email, password, confirmPassword) {
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }
    
    const data = await response.json();
    
    // Store user data and token
    localStorage.setItem('pegasus_user', JSON.stringify(data.user));
    localStorage.setItem('pegasus_token', data.token);
    
    // Update UI
    updateAuthUI();
    
    // Redirect to home page
    window.location.href = 'index.html';
    
  } catch (error) {
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
}

// Check if user is authenticated
function isAuthenticated() {
  const user = localStorage.getItem('pegasus_user') || sessionStorage.getItem('pegasus_user');
  const token = localStorage.getItem('pegasus_token') || sessionStorage.getItem('pegasus_token');
  
  return !!(user && token);
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('pegasus_user') || sessionStorage.getItem('pegasus_user');
  return userStr ? JSON.parse(userStr) : null;
}

// Get token
function getToken() {
  return localStorage.getItem('pegasus_token') || sessionStorage.getItem('pegasus_token');
}

// Sign out function
function signOut() {
  localStorage.removeItem('pegasus_user');
  localStorage.removeItem('pegasus_token');
  sessionStorage.removeItem('pegasus_user');
  sessionStorage.removeItem('pegasus_token');
  
  // Update UI
  updateAuthUI();
  
  // Redirect to home page
  window.location.href = 'index.html';
}

// Update UI based on authentication status
function updateAuthUI() {
  const authButtons = document.querySelector('.auth-buttons');
  const mobileAuth = document.querySelector('.mobile-auth');
  const userMenu = document.querySelector('.user-menu');
  
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
    }
    
    // Update mobile auth buttons
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <a href="profile.html" class="btn btn-outline">Profile</a>
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
        signOut();
      });
    }
    
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signOut();
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

// Protect routes that require authentication
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'signin.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

// Protect admin routes
function requireAdmin() {
  if (!isAuthenticated()) {
    window.location.href = 'signin.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  
  const user = getCurrentUser();
  if (user.role !== 'admin') {
    window.location.href = 'index.html';
    return false;
  }
  
  return true;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
  
  // Add mobile menu functionality
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }
});
