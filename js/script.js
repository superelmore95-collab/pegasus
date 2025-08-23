// Update your API_BASE to point to your Cloudflare Worker
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
  window.location.reload();
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
            <img src="${user.avatar || 'images/default-avatar.png'}" alt="${user.name}" class="user-avatar">
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
  updateAuthUI();
});
