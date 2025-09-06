// popup.js - Professional Content Access Popup System
class ContentPopup {
    constructor() {
        this.initPopup();
        this.bindEvents();
    }

    initPopup() {
        // Create popup structure
        const popupHTML = `
            <div class="popup-overlay" id="content-popup">
                <div class="content-popup">
                    <button class="popup-close" id="popup-close">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="popup-hero" id="popup-hero">
                        <div class="popup-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading content...</p>
                        </div>
                    </div>
                    
                    <div class="popup-info">
                        <h3 class="popup-title" id="popup-title">Content Title</h3>
                        <div class="popup-meta" id="popup-meta">
                            <span id="popup-category">Sports</span>
                            <span id="popup-views">0 views</span>
                        </div>
                    </div>
                    
                    <div class="popup-actions" id="popup-actions">
                        <!-- Content will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', popupHTML);
    }

    bindEvents() {
        // Close button
        document.getElementById('popup-close').addEventListener('click', () => {
            this.closePopup();
        });

        // Close when clicking outside
        document.getElementById('content-popup').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closePopup();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePopup();
            }
        });
    }

    async showContent(contentId, contentType) {
        // Show popup
        document.getElementById('content-popup').classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            // Load content details from API
            const content = await this.fetchContentDetails(contentId, contentType);
            
            // Update popup with content details
            this.updatePopupContent(content, contentType);
            
            // Check favorite status if logged in
            if (window.authManager && window.authManager.isAuthenticated()) {
                this.checkFavoriteStatus(contentId, contentType);
            }
        } catch (error) {
            console.error('Error loading content:', error);
            this.showError('Failed to load content details');
        }
    }

    async fetchContentDetails(contentId, contentType) {
        const API_BASE = window.PEGASUS_CONFIG ? window.PEGASUS_CONFIG.API_BASE : 'https://pegasus-backend.super-elmore95.workers.dev';
        const token = window.authManager ? window.authManager.getToken() : null;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}/api/content/${contentType}/${contentId}`, { headers });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    updatePopupContent(content, contentType) {
        // Update hero image
        const popupHero = document.getElementById('popup-hero');
        const thumbnail = content.thumbnail || content.thumbnail_url || 'https://via.placeholder.com/400x225';
        
        popupHero.innerHTML = `
            <img src="${thumbnail}" alt="${content.title || content.name}" onerror="this.src='https://via.placeholder.com/400x225'">
            <div class="popup-hero-overlay"></div>
            <div class="popup-badges">
                ${content.is_live ? '<div class="badge live">LIVE</div>' : ''}
                ${content.requires_premium ? '<div class="badge premium">PREMIUM</div>' : ''}
            </div>
        `;
        
        // Update title
        document.getElementById('popup-title').textContent = content.title || content.name;
        
        // Update metadata
        const popupCategory = document.getElementById('popup-category');
        const popupViews = document.getElementById('popup-views');
        
        popupCategory.textContent = content.category || 'Sports';
        
        if (contentType === 'live' || content.is_live) {
            popupViews.textContent = `${content.viewers_count || 0} watching`;
        } else {
            popupViews.textContent = `${content.views_count || content.view_count || 0} views`;
        }
        
        // Update action buttons based on auth status
        this.updateActionButtons(contentId, contentType);
    }

    updateActionButtons(contentId, contentType) {
        const popupActions = document.getElementById('popup-actions');
        const isAuthenticated = window.authManager && window.authManager.isAuthenticated();
        
        if (isAuthenticated) {
            // User is logged in - show favorite and play buttons
            popupActions.innerHTML = `
                <button class="btn-icon" id="popup-favorite">
                    <i class="far fa-heart"></i>
                </button>
                <a href="player.html?type=${contentType}&id=${contentId}" class="btn btn-primary">
                    <i class="fas fa-play"></i> Play Now
                </a>
            `;
            
            // Add event listener to favorite button
            document.getElementById('popup-favorite').addEventListener('click', () => {
                this.toggleFavorite(contentId, contentType);
            });
        } else {
            // User is not logged in - show sign in button
            popupActions.innerHTML = `
                <a href="signin.html?redirect=${encodeURIComponent(window.location.href)}" class="btn btn-primary">
                    Sign In to Access
                </a>
            `;
        }
    }

    async checkFavoriteStatus(contentId, contentType) {
        try {
            if (window.authManager && window.authManager.checkFavoriteStatus) {
                const result = await window.authManager.checkFavoriteStatus(contentId, contentType);
                
                if (result.success) {
                    const favoriteBtn = document.getElementById('popup-favorite');
                    
                    if (favoriteBtn) {
                        if (result.isFavorited) {
                            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                            favoriteBtn.classList.add('active');
                        } else {
                            favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
                            favoriteBtn.classList.remove('active');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    }

    async toggleFavorite(contentId, contentType) {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            alert('Please sign in to add favorites');
            window.location.href = 'signin.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        const favoriteBtn = document.getElementById('popup-favorite');
        
        try {
            // Show loading state
            favoriteBtn.disabled = true;
            const originalHtml = favoriteBtn.innerHTML;
            favoriteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            // Check current favorite status
            const statusResult = await window.authManager.checkFavoriteStatus(contentId, contentType);
            
            if (statusResult.success && statusResult.isFavorited) {
                // Remove from favorites
                const result = await window.authManager.removeFromFavorites(statusResult.favoriteId);
                
                if (result.success) {
                    favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
                    favoriteBtn.classList.remove('active');
                } else {
                    throw new Error(result.error);
                }
            } else {
                // Add to favorites
                const result = await window.authManager.addToFavorites(contentId, contentType);
                
                if (result.success) {
                    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
                    favoriteBtn.classList.add('active');
                } else {
                    throw new Error(result.error);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('An error occurred. Please try again.');
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        } finally {
            favoriteBtn.disabled = false;
        }
    }

    showError(message) {
        const popupHero = document.getElementById('popup-hero');
        const popupActions = document.getElementById('popup-actions');
        
        popupHero.innerHTML = `
            <div class="popup-loading">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
        
        popupActions.innerHTML = `
            <button class="btn" onclick="contentPopup.closePopup()">
                Close
            </button>
        `;
    }

    closePopup() {
        document.getElementById('content-popup').classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contentPopup = new ContentPopup();
    
    // Update content cards to use popup instead of direct links
    setTimeout(() => {
        const contentCards = document.querySelectorAll('.stream-card');
        
        contentCards.forEach(card => {
            // Get content ID and type from data attributes or URL
            const href = card.getAttribute('href');
            if (href && href.includes('player.html')) {
                const urlParams = new URLSearchParams(href.split('?')[1]);
                const type = urlParams.get('type');
                const id = urlParams.get('id');
                
                if (type && id) {
                    // Remove existing click behavior
                    card.removeAttribute('href');
                    card.style.cursor = 'pointer';
                    
                    // Add click handler for popup
                    card.addEventListener('click', () => {
                        window.contentPopup.showContent(id, type);
                    });
                }
            }
        });
    }, 1000);
});
