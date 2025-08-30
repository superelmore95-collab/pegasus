// Player page specific functionality
const API_BASE = window.PEGASUS_CONFIG ? window.PEGASUS_CONFIG.API_BASE : 'https://pegasus-backend.super-elmore95.workers.dev';

// Global variables to store current content info
let currentContentId = null;
let currentContentType = null;
let currentFavoriteId = null;

// Function to load player content based on URL parameters
async function loadPlayerContent() {
    try {
        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const id = urlParams.get('id');
        
        if (!type || !id) {
            throw new Error('Missing type or id parameter');
        }
        
        // Store for favorite functionality
        currentContentId = id;
        currentContentType = type;
        
        // Load content from API
        const token = window.authManager ? window.authManager.getToken() : null;
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}/api/content`, { headers });
        const content = await response.json();
        
        // Find the specific content
        let contentItem;
        if (type === 'live') {
            contentItem = content.live.find(item => item.id == id);
        } else if (type === 'vod') {
            contentItem = content.vod.find(item => item.id == id);
        } else if (type === 'highlight') {
            contentItem = content.highlights.find(item => item.id == id);
        } else if (type === 'channel') {
            contentItem = content.channels.find(item => item.id == id);
        }
        
        if (!contentItem) {
            throw new Error('Content not found');
        }
        
        // Update the page with the content
        updatePlayerContent(contentItem, type);
        
        // Load related content
        loadRelatedContent(type, content);
        
        // Check favorite status if user is logged in
        if (window.authManager && window.authManager.isAuthenticated()) {
            checkFavoriteStatus();
        }
        
    } catch (error) {
        console.error('Error loading player content:', error);
        document.getElementById('player-title').textContent = 'Error loading content';
        document.getElementById('player-status').textContent = 'Content not available';
    }
}

// Check if content is favorited
async function checkFavoriteStatus() {
    if (!currentContentId || !currentContentType) return;
    
    try {
        const result = await window.authManager.checkFavoriteStatus(currentContentId, currentContentType);
        if (result.success) {
            currentFavoriteId = result.favoriteId;
            const favoriteBtn = document.getElementById('favorite-btn');
            if (favoriteBtn) {
                if (result.isFavorited) {
                    favoriteBtn.classList.add('active');
                    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
                } else {
                    favoriteBtn.classList.remove('active');
                    favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
                }
            }
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
}

// Toggle favorite status
async function toggleFavorite() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        alert('Please sign in to add favorites');
        window.location.href = 'signin.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    const favoriteBtn = document.getElementById('favorite-btn');
    if (!favoriteBtn) return;
    
    try {
        // Show loading state
        favoriteBtn.disabled = true;
        const originalHtml = favoriteBtn.innerHTML;
        favoriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        if (currentFavoriteId) {
            // Remove from favorites
            const result = await window.authManager.removeFromFavorites(currentFavoriteId);
            if (result.success) {
                favoriteBtn.classList.remove('active');
                favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
                currentFavoriteId = null;
            } else {
                alert('Error: ' + result.error);
                favoriteBtn.innerHTML = originalHtml;
            }
        } else {
            // Add to favorites
            const result = await window.authManager.addToFavorites(currentContentId, currentContentType);
            if (result.success) {
                favoriteBtn.classList.add('active');
                favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
                currentFavoriteId = result.favoriteId;
            } else {
                alert('Error: ' + result.error);
                favoriteBtn.innerHTML = originalHtml;
            }
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('An error occurred. Please try again.');
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
    } finally {
        favoriteBtn.disabled = false;
    }
}

// Function to update the player with content
function updatePlayerContent(content, type) {
    // Update page title
    document.title = `${content.title || content.name} | PEGASUS`;
    
    // Update player title
    document.getElementById('player-title').textContent = content.title || content.name;
    
    // Update player metadata
    if (type === 'live' || (type === 'channel' && content.is_live)) {
        document.getElementById('player-status').textContent = 'Live';
        document.getElementById('player-viewers').textContent = `${content.viewers_count || 0} watching`;
    } else {
        document.getElementById('player-status').textContent = 'On Demand';
        document.getElementById('player-viewers').textContent = `${content.views_count || content.view_count || 0} views`;
    }
    
    // Update video player
    const videoPlayer = document.getElementById('video-player');
    
    // Clear previous content
    videoPlayer.innerHTML = '';
    
    // Add content type badge
    const typeBadge = document.createElement('div');
    typeBadge.className = `content-type-badge content-type-${type}`;
    typeBadge.textContent = type.toUpperCase();
    videoPlayer.appendChild(typeBadge);
    
    if (content.embed_code) {
        // Create wrapper for embed code
        const embedWrapper = document.createElement('div');
        embedWrapper.innerHTML = content.embed_code;
        
        // Make all embedded content responsive
        const iframes = embedWrapper.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
        });
        
        // Also handle video tags
        const videos = embedWrapper.querySelectorAll('video');
        videos.forEach(video => {
            video.style.position = 'absolute';
            video.style.top = '0';
            video.style.left = '0';
            video.style.width = '100%';
            video.style.height = '100%';
            video.setAttribute('controls', 'true');
            video.setAttribute('autoplay', 'true');
        });
        
        videoPlayer.appendChild(embedWrapper);
    } else if (content.thumbnail || content.thumbnail_url) {
        // Fallback to thumbnail if no embed code
        videoPlayer.innerHTML += `
            <div class="thumbnail-fallback">
                <img src="${content.thumbnail || content.thumbnail_url}" alt="${content.title || content.name}">
                <div class="play-button-overlay">
                    <i class="fas fa-play-circle"></i>
                </div>
            </div>
        `;
    } else {
        // Show error if no content available
        videoPlayer.innerHTML += `
            <div class="loading-placeholder">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <p>Content unavailable</p>
            </div>
        `;
    }
    
    // Show/hide download button based on content type
    const downloadBtn = document.getElementById('download-btn');
    if (type === 'vod' || type === 'highlight') {
        downloadBtn.style.display = 'inline-block';
    } else {
        downloadBtn.style.display = 'none';
    }
}

// Function to load related content
function loadRelatedContent(type, content) {
    const relatedContainer = document.getElementById('related-content');
    
    let relatedItems = [];
    if (type === 'live') {
        relatedItems = content.live.filter(item => item.id != window.location.search.split('=')[1]).slice(0, 4);
    } else if (type === 'vod') {
        relatedItems = content.vod.filter(item => item.id != window.location.search.split('=')[1]).slice(0, 4);
    } else if (type === 'highlight') {
        relatedItems = content.highlights.filter(item => item.id != window.location.search.split('=')[1]).slice(0, 4);
    } else if (type === 'channel') {
        relatedItems = content.channels.filter(item => item.id != window.location.search.split('=')[1]).slice(0, 4);
    }
    
    if (relatedItems.length === 0) {
        relatedContainer.innerHTML = '<p>No related content available</p>';
        return;
    }
    
    // Clear previous content
    relatedContainer.innerHTML = '';
    
    // Add related content
    relatedItems.forEach(item => {
        const itemType = item.is_live ? 'live' : (item.type || 'vod');
        const card = document.createElement('a');
        card.href = `player.html?type=${itemType}&id=${item.id}`;
        card.className = 'stream-card';
        
        card.innerHTML = `
            <div class="card-img">
                <img src="${item.thumbnail || item.thumbnail_url}" alt="${item.title || item.name}" onerror="this.src='https://via.placeholder.com/400x225'">
                ${itemType === 'live' ? '<div class="live-badge">LIVE</div>' : ''}
                ${item.requires_premium ? '<div class="premium-badge">PREMIUM</div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title || item.name}</h3>
                <div class="card-meta">
                    <span>${item.category || 'Sports'}</span>
                    <span class="card-views">${itemType === 'live' ? `${item.viewers_count || 0} watching` : `${item.views_count || item.view_count || 0} views`}</span>
                </div>
            </div>
        `;
        
        relatedContainer.appendChild(card);
    });
}

// Initialize player when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Load player content
    loadPlayerContent();
    
    // Set up share button
    document.getElementById('share-btn').addEventListener('click', function(e) {
        e.preventDefault();
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href
            }).catch(console.error);
        } else {
            alert('Share feature not available in your browser. Copy this URL: ' + window.location.href);
        }
    });
    
    // Set up favorite button
    document.getElementById('favorite-btn').addEventListener('click', function(e) {
        e.preventDefault();
        toggleFavorite();
    });
    
    // Set up download button
    document.getElementById('download-btn').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Download feature would be implemented here. This would vary based on your backend capabilities.');
    });
    
    // Set up related content tabs
    const relatedTabs = document.querySelectorAll('.related-tab');
    relatedTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            relatedTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Filter content
            const type = this.getAttribute('data-type');
            filterRelatedContent(type);
        });
    });
});

// Function to filter related content by type
function filterRelatedContent(type) {
    const relatedContainer = document.getElementById('related-content');
    
    if (!window.allRelatedContent || window.allRelatedContent.length === 0) {
        relatedContainer.innerHTML = '<p>No related content found.</p>';
        return;
    }
    
    let filteredContent = window.allRelatedContent;
    
    if (type !== 'all') {
        filteredContent = window.allRelatedContent.filter(item => {
            if (type === 'live') return item.is_live;
            if (type === 'vod') return !item.is_live && item.type !== 'highlight';
            if (type === 'highlight') return item.type === 'highlight';
            return true;
        });
    }
    
    if (filteredContent.length > 0) {
        relatedContainer.innerHTML = filteredContent.map(item => {
            const isLive = item.is_live || false;
            const itemType = isLive ? 'live' : (item.type || 'vod');
            return `
                <a href="player.html?type=${itemType}&id=${item.id}" class="stream-card">
                    <div class="card-img">
                        <img src="${item.thumbnail || item.thumbnail_url}" alt="${item.title || item.name}" onerror="this.src='https://via.placeholder.com/400x225'">
                        ${isLive ? '<div class="live-badge">LIVE</div>' : ''}
                        <div class="content-type-badge content-type-${itemType}">${itemType.toUpperCase()}</div>
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${item.title || item.name}</h3>
                        <div class="card-meta">
                            <span>${item.category || 'Sports'}</span>
                            <span class="card-views">${item.views_count || item.viewers_count || 0} ${isLive ? 'watching' : 'views'}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    } else {
        relatedContainer.innerHTML = '<p>No related content found for this category.</p>';
    }
}
