// Authentication functions
const API_BASE = 'https://pegasus-backend.super-elmore95.workers.dev';

// Sign in function
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
      throw new Error('Invalid credentials');
    }
    
    const data = await response.json();
    
    // Store user data and token
    if (remember) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } else {
      sessionStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('token', data.token);
    }
    
    // Redirect to home page
    window.location.href = 'index.html';
    
  } catch (error) {
    alert(error.message || 'Sign in failed. Please try again.');
  }
}

// Sign up function
async function signUp(name, email, password, confirmPassword) {
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
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
      throw new Error('Registration failed');
    }
    
    const data = await response.json();
    
    // Store user data and token
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    
    // Redirect to home page
    window.location.href = 'index.html';
    
  } catch (error) {
    alert(error.message || 'Registration failed. Please try again.');
  }
}

// Check if user is authenticated
function isAuthenticated() {
  const user = localStorage.getItem('user') || sessionStorage.getItem('user');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  return !!(user && token);
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Sign out function
function signOut() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  
  window.location.href = 'index.html';
}

// Protect routes that require authentication
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'signin.html';
    return false;
  }
  return true;
}

// Protect admin routes
function requireAdmin() {
  if (!isAuthenticated()) {
    window.location.href = 'signin.html';
    return false;
  }
  
  const user = getCurrentUser();
  if (user.role !== 'admin') {
    window.location.href = 'index.html';
    return false;
  }
  
  return true;
}