// Player page specific functionality
const API_BASE = 'https://pegasus-backend.super-elmore95.workers.dev';

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
        
        // Load content from API
        const response = await fetch(`${API_BASE}/api/content`);
        const content = await response.json();
        
        // Find the specific content
        let contentItem;
        if (type === 'live') {
            contentItem = content.live.find(item => item.id == id);
        } else if (type === 'vod') {
            contentItem = content.vod.find(item => item.id == id);
        } else if (type === 'highlight') {
            contentItem = content.highlights.find(item => item.id == id);
        }
        
        if (!contentItem) {
            throw new Error('Content not found');
        }
        
        // Update the page with the content
        updatePlayerContent(contentItem, type);
        
        // Load related content
        loadRelatedContent(type, content);
        
    } catch (error) {
        console.error('Error loading player content:', error);
        document.getElementById('player-title').textContent = 'Error loading content';
        document.getElementById('player-status').textContent = 'Content not available';
    }
}

// Function to update the player with content
function updatePlayerContent(content, type) {
    // Update page title
    document.title = `${content.title} | PEGASUS`;
    
    // Update player title
    document.getElementById('player-title').textContent = content.title;
    
    // Update player metadata
    if (type === 'live') {
        document.getElementById('player-status').textContent = 'Live';
        document.getElementById('player-viewers').textContent = `${content.viewers || 0} watching`;
    } else {
        document.getElementById('player-status').textContent = 'On Demand';
        document.getElementById('player-viewers').textContent = `${content.views || 0} views`;
    }
    
    // Update video player
    const videoPlayer = document.getElementById('video-player');
    videoPlayer.innerHTML = content.embed_code || `
        <video controls autoplay>
            <source src="videos/sample-${type}.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    `;
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
    }
    
    if (relatedItems.length === 0) {
        relatedContainer.innerHTML = '<p>No related content available</p>';
        return;
    }
    
    // Clear previous content
    relatedContainer.innerHTML = '';
    
    // Add related content
    relatedItems.forEach(item => {
        const card = document.createElement('a');
        card.href = `player.html?type=${type}&id=${item.id}`;
        card.className = 'stream-card';
        
        card.innerHTML = `
            <div class="card-img">
                <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/400x225'">
                ${type === 'live' ? '<div class="live-badge">LIVE</div>' : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <div class="card-meta">
                    <span>${item.category || 'Sports'}</span>
                    <span class="card-views">${type === 'live' ? `${item.viewers || 0} watching` : `${item.views || 0} views`}</span>
                </div>
            </div>
        `;
        
        relatedContainer.appendChild(card);
    });
}

// Initialize player when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadPlayerContent();
});
