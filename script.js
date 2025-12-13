/* ===========================================
script.js - unified behaviour for all pages
=========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Upload modal
    const plusIcon = document.getElementById('plus-icon');
    const uploadModal = document.getElementById('uploadModal');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const uploadForm = document.getElementById('uploadForm');

    if (plusIcon && uploadModal) {
        plusIcon.addEventListener('click', () => uploadModal.style.display = 'flex');
        if (modalClose) modalClose.addEventListener('click', () => uploadModal.style.display = 'none');
        if (modalCancel) modalCancel.addEventListener('click', () => uploadModal.style.display = 'none');
        window.addEventListener('click', (ev) => { if (ev.target === uploadModal) uploadModal.style.display = 'none'; });

        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('SUCCESS: (Mock) Video ready in your local demo UI.');
                uploadForm.reset();
                uploadModal.style.display = 'none';
            });
        }
    }

    // Initialize map tool size controller
    const toolSizeInput = document.getElementById('toolSize');
    const sizeValueSpan = document.getElementById('sizeValue');
    
    if (toolSizeInput && sizeValueSpan) {
        toolSizeInput.addEventListener('input', function() {
            sizeValueSpan.textContent = this.value;
            if (window.Map) {
                window.Map.drawSize = parseInt(this.value);
            }
        });
    }

    // Initialize zoom slider
    const zoomRange = document.getElementById('zoomRange');
    if (zoomRange) {
        zoomRange.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (window.Map && window.Map.minScale && window.Map.maxScale) {
                // Convert slider value (0-100) to actual scale
                const newScale = Map.minScale + (value / 100) * (Map.maxScale - Map.minScale);
                const oldScale = Map.scale;
                Map.scale = newScale;
                
                // Smooth center zoom
                const centerX = Map.canvas.width / 2;
                const centerY = Map.canvas.height / 2;
                const scaleFactor = Map.scale / oldScale;
                
                Map.panX = centerX - ((centerX - Map.panX) * scaleFactor);
                Map.panY = centerY - ((centerY - Map.panY) * scaleFactor);
                Map.draw();
            }
        });
    }

    // Initialize search functionality
    const mapSearchBtn = document.getElementById('mapSearchBtn');
    const mapSearchInput = document.getElementById('mapSearchInput');
    
    if (mapSearchBtn && mapSearchInput) {
        mapSearchBtn.addEventListener('click', searchLocation);
        mapSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchLocation();
        });
    }

    // Map close button
    const mapCloseBtn = document.getElementById('mapClose');
    const mapModal = document.getElementById('mapViewerModal');
    
    if (mapCloseBtn && mapModal) {
        mapCloseBtn.addEventListener('click', closeFullScreenMap);
    }

    // Responsive: ensure canvas sizing on resize
    window.addEventListener('resize', () => {
        if (window.Map && window.Map.canvas) {
            // redraw with new size if modal open
            if (document.getElementById('mapViewerModal') && 
                document.getElementById('mapViewerModal').style.display === 'flex') {
                window.Map.canvas.width = window.innerWidth;
                window.Map.canvas.height = window.innerHeight;
                window.Map.draw();
            }
        }
    });
});

/* -----------------------------
Video play: replace thumb with 
----------------------------- */
function playVideo(container, src) {
    // prevent multiple players
    if (container.querySelector('video')) return;

    // create video element
    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';

    // replace image with video
    container.innerHTML = '';
    container.appendChild(video);

    // pause other playing videos (optional)
    document.querySelectorAll('video').forEach(v => { if (v !== video) v.pause(); });
}

/* =================================
Map Module (pan, zoom, draw tools)
================================= */
const Map = {
    canvas: null,
    ctx: null,
    image: new Image(),
    scale: 1,
    minScale: 0.2,    // Slider 0 value
    maxScale: 3.2,    // Slider 100 value
    panX: 0,
    panY: 0,
    tool: 'pan',
    color: '#ff0000',
    drawSize: 8,
    history: [],
    current: null,
    isPointerDown: false,
    lastClientX: 0,
    lastClientY: 0,
    originalW: 0,
    originalH: 0,
    
    // Route specific properties
    routePoints: [],
    isDrawingRoute: false,
    
    // Touch/pinch zoom properties
    lastTouchDistance: 0,
    initialTouchDistance: 0,
    isPinching: false,
    pinchCenterX: 0,
    pinchCenterY: 0,
    
    // Search highlights
    searchHighlights: [],

    init: function(src) {
        this.canvas = document.getElementById('mapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.history = [];
        this.routePoints = [];
        this.searchHighlights = [];
        this.current = null;
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPointerDown = false;
        this.isDrawingRoute = false;
        this.isPinching = false;
        this.tool = 'pan';
        this.color = document.getElementById('tool-color') ? document.getElementById('tool-color').value : '#ff0000';
        this.drawSize = document.getElementById('toolSize') ? parseInt(document.getElementById('toolSize').value) : 8;

        if (!this.canvas) return;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.image = new Image();
        this.image.crossOrigin = "anonymous";
        
        this.image.onload = () => {
            this.originalW = this.image.width;
            this.originalH = this.image.height;
            
            // Calculate min scale to fit screen (slider 0 = full screen)
            const sx = this.canvas.width / this.originalW;
            const sy = this.canvas.height / this.originalH;
            this.minScale = Math.min(sx, sy) * 0.95;
            
            // Max scale is 5x of min scale (slider 100 = 5x zoom)
            this.maxScale = this.minScale * 5;
            
            // Set initial scale (slider 40 = middle point)
            this.scale = this.minScale + (this.maxScale - this.minScale) * 0.4;
            
            // Center the image
            this.panX = (this.canvas.width - this.originalW * this.scale) / 2;
            this.panY = (this.canvas.height - this.originalH * this.scale) / 2;
            
            // Update zoom slider to match initial scale
            const zoomRange = document.getElementById('zoomRange');
            if (zoomRange) {
                // Convert scale to slider value (0-100)
                const sliderValue = ((this.scale - this.minScale) / (this.maxScale - this.minScale)) * 100;
                zoomRange.value = Math.round(sliderValue);
            }
            
            this.draw();
        };
        
        this.image.src = src;
        
        // toolbox bindings
        this.bindTools();
        this.addPointerListeners();
        this.addTouchListeners();
    },

    bindTools: function() {
        const tools = ['pan', 'route', 'line', 'circle', 'dot', 'eraser'];
        tools.forEach(t => {
            const el = document.getElementById('tool-' + t);
            if (el) {
                el.onclick = () => {
                    this.tool = t;
                    // Reset route points when switching from route tool
                    if (t !== 'route') {
                        this.routePoints = [];
                        this.isDrawingRoute = false;
                    }
                    
                    document.querySelectorAll('#mapToolbox .neumorphic-tool-btn').forEach(b => b.classList.remove('active-tool'));
                    el.classList.add('active-tool');
                };
            }
        });
        
        const clearBtn = document.getElementById('tool-clear');
        if (clearBtn) clearBtn.onclick = () => { 
            this.history = []; 
            this.routePoints = [];
            this.searchHighlights = [];
            this.draw(); 
        };
        
        const colorEl = document.getElementById('tool-color');
        if (colorEl) colorEl.onchange = (e) => this.color = e.target.value;
        
        const sizeEl = document.getElementById('toolSize');
        if (sizeEl) {
            sizeEl.onchange = (e) => {
                this.drawSize = parseInt(e.target.value);
            };
        }
    },

    addPointerListeners: function(){
        const cvs = this.canvas;
        cvs.onpointerdown = (e) => this.pointerDown(e);
        cvs.onpointermove = (e) => this.pointerMove(e);
        cvs.onpointerup = (e) => this.pointerUp(e);
        cvs.onpointercancel = (e) => this.pointerUp(e);
        cvs.onwheel = (e) => this.handleWheel(e);
        cvs.ondblclick = (e) => { 
            if (this.tool === 'route') {
                this.handleRouteClick(e);
            }
        };
    },

    addTouchListeners: function() {
        const cvs = this.canvas;
        
        cvs.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Two finger touch - start pinch zoom
                e.preventDefault();
                this.isPinching = true;
                this.lastTouchDistance = this.getTouchDistance(e);
                this.initialTouchDistance = this.lastTouchDistance;
                
                // Calculate pinch center
                this.pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                this.pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            } else if (e.touches.length === 1) {
                // Single touch - start pan or draw
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('pointerdown', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.pointerDown(mouseEvent);
            }
        }, { passive: false });

        cvs.addEventListener('touchmove', (e) => {
            if (this.isPinching && e.touches.length === 2) {
                e.preventDefault();
                const touchDistance = this.getTouchDistance(e);
                
                // Smooth pinch zoom
                const scaleFactor = Math.pow(touchDistance / this.lastTouchDistance, 0.5);
                this.zoomAtPoint(this.pinchCenterX, this.pinchCenterY, scaleFactor);
                this.lastTouchDistance = touchDistance;
                
                // Update pinch center
                this.pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                this.pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                
                // Update zoom slider
                const zoomRange = document.getElementById('zoomRange');
                if (zoomRange) {
                    const sliderValue = ((this.scale - this.minScale) / (this.maxScale - this.minScale)) * 100;
                    zoomRange.value = Math.max(0, Math.min(100, Math.round(sliderValue)));
                }
            } else if (e.touches.length === 1) {
                const touch = e.touches[0];
                const mouseEvent = new MouseEvent('pointermove', {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
                this.pointerMove(mouseEvent);
            }
        }, { passive: false });

        cvs.addEventListener('touchend', (e) => {
            if (this.isPinching) {
                this.isPinching = false;
            }
            this.pointerUp(e);
        });
    },

    getTouchDistance: function(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    },

    zoomAtPoint: function(clientX, clientY, scaleFactor) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        const worldX = (mouseX - this.panX) / this.scale;
        const worldY = (mouseY - this.panY) / this.scale;
        
        const oldScale = this.scale;
        
        // Apply scale factor with min/max limits
        let newScale = this.scale * scaleFactor;
        if (newScale < this.minScale) newScale = this.minScale;
        if (newScale > this.maxScale) newScale = this.maxScale;
        
        this.scale = newScale;
        const actualScaleFactor = this.scale / oldScale;
        
        this.panX = mouseX - worldX * this.scale;
        this.panY = mouseY - worldY * this.scale;
        
        this.draw();
    },

    handleWheel: function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.zoomAtPoint(mouseX, mouseY, delta);
        
        // Update zoom slider
        const zoomRange = document.getElementById('zoomRange');
        if (zoomRange) {
            const sliderValue = ((this.scale - this.minScale) / (this.maxScale - this.minScale)) * 100;
            zoomRange.value = Math.max(0, Math.min(100, Math.round(sliderValue)));
        }
    },

    pointerDown: function(e){
        e.preventDefault();
        this.isPointerDown = true;
        this.lastClientX = e.clientX;
        this.lastClientY = e.clientY;
        const p = this.screenToMap(e.clientX, e.clientY);

        if (this.tool === 'line' || this.tool === 'eraser') {
            this.current = { tool: this.tool, color: this.color, points: [{x:p.x, y:p.y}] };
            this.history.push(this.current);
        } else if (this.tool === 'dot') {
            this.history.push({ tool: 'dot', color: this.color, size: this.drawSize, x: p.x, y: p.y });
            this.draw();
            this.isPointerDown = false;
        } else if (this.tool === 'circle') {
            this.current = { tool: 'circle', color: this.color, size: this.drawSize, x: p.x, y: p.y, x2: p.x, y2: p.y };
        } else if (this.tool === 'route') {
            this.handleRouteClick(e);
        }
    },

    handleRouteClick: function(e) {
        const p = this.screenToMap(e.clientX, e.clientY);
        
        if (!this.isDrawingRoute) {
            // Start new route
            this.routePoints = [{x: p.x, y: p.y}];
            this.isDrawingRoute = true;
            this.history.push({ 
                tool: 'route', 
                color: this.color, 
                points: [{x: p.x, y: p.y}],
                size: this.drawSize 
            });
        } else {
            // Continue route
            this.routePoints.push({x: p.x, y: p.y});
            // Update the last route item in history
            const lastRoute = this.history.findLast(item => item.tool === 'route');
            if (lastRoute) {
                lastRoute.points = [...this.routePoints];
            }
        }
        this.draw();
    },

    pointerMove: function(e){
        if (!this.isPointerDown || this.tool === 'route') return;
        const dx = e.clientX - this.lastClientX;
        const dy = e.clientY - this.lastClientY;
        const p = this.screenToMap(e.clientX, e.clientY);

        if (this.tool === 'pan') {
            this.panX += dx;
            this.panY += dy;
        } else if (this.tool === 'line' || this.tool === 'eraser') {
            if (this.current && this.current.points) {
                this.current.points.push({ x: p.x, y: p.y });
            }
        } else if (this.tool === 'circle') {
            if (this.current) {
                this.current.x2 = p.x;
                this.current.y2 = p.y;
            }
        }
        this.lastClientX = e.clientX;
        this.lastClientY = e.clientY;
        this.draw();
    },

    pointerUp: function(e){
        if (!this.isPointerDown) return;
        this.isPointerDown = false;
        if (this.tool === 'circle' && this.current) {
            if (this.current.x !== this.current.x2 || this.current.y !== this.current.y2) {
                this.history.push(this.current);
            }
            this.current = null;
        } else if (this.tool === 'route') {
            // Route is completed on clicks, not drag
            this.current = null;
        } else {
            this.current = null;
        }
        this.draw();
    },

    screenToMap: function(clientX, clientY){
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left - this.panX) / this.scale;
        const y = (clientY - rect.top - this.panY) / this.scale;
        return {x, y};
    },

    draw: function(){
        const c = this.ctx;
        c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        c.save();
        c.translate(this.panX, this.panY);
        c.scale(this.scale, this.scale);

        // draw image
        if (this.image && this.image.complete) {
            c.drawImage(this.image, 0, 0, this.originalW || this.image.width, this.originalH || this.image.height);
        }
        
        // draw search highlights
        this.drawSearchHighlights(c);
        
        // draw history
        for (let item of this.history) this.render(item, c);
        
        // draw current temporary
        if (this.current) this.render(this.current, c);
        
        // draw route points if in route mode
        if (this.tool === 'route' && this.routePoints.length > 0) {
            this.drawRoutePoints(c);
        }
        
        c.restore();
    },

    drawSearchHighlights: function(ctx) {
        for (let highlight of this.searchHighlights) {
            ctx.beginPath();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4 / this.scale;
            ctx.arc(highlight.x, highlight.y, 40 / this.scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Add label
            ctx.fillStyle = '#00ff00';
            ctx.font = `${16 / this.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(highlight.name, highlight.x, highlight.y - 50 / this.scale);
        }
    },

    drawRoutePoints: function(ctx) {
        if (this.routePoints.length < 2) return;
        
        ctx.beginPath();
        ctx.lineWidth = (this.drawSize / 2) / this.scale;
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([8 / this.scale, 8 / this.scale]);
        
        ctx.moveTo(this.routePoints[0].x, this.routePoints[0].y);
        for (let i = 1; i < this.routePoints.length; i++) {
            ctx.lineTo(this.routePoints[i].x, this.routePoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw route points as circles
        for (let point of this.routePoints) {
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(point.x, point.y, this.drawSize / this.scale, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw white center dot
            ctx.beginPath();
            ctx.fillStyle = 'white';
            ctx.arc(point.x, point.y, (this.drawSize / 2) / this.scale, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    render: function(item, ctx){
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (item.tool === 'line' || item.tool === 'eraser') {
            ctx.beginPath();
            ctx.lineWidth = (item.tool === 'eraser' ? 28 / this.scale : (item.size || this.drawSize) / this.scale);
            ctx.globalCompositeOperation = item.tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.strokeStyle = item.color;
            ctx.moveTo(item.points[0].x, item.points[0].y);
            for (let i = 1; i < item.points.length; i++) {
                ctx.lineTo(item.points[i].x, item.points[i].y);
            }
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        } else if (item.tool === 'dot') {
            ctx.beginPath();
            ctx.fillStyle = item.color;
            ctx.arc(item.x, item.y, (item.size || this.drawSize) / this.scale, 0, Math.PI * 2);
            ctx.fill();
        } else if (item.tool === 'circle') {
            ctx.beginPath();
            ctx.strokeStyle = item.color;
            ctx.lineWidth = ((item.size || this.drawSize) / 2) / this.scale;
            const r = Math.hypot(item.x2 - item.x, item.y2 - item.y);
            ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
            ctx.stroke();
        } else if (item.tool === 'route' && item.points && item.points.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = (item.size || this.drawSize) / this.scale;
            ctx.strokeStyle = item.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.setLineDash([8 / this.scale, 8 / this.scale]);
            
            ctx.moveTo(item.points[0].x, item.points[0].y);
            for (let i = 1; i < item.points.length; i++) {
                ctx.lineTo(item.points[i].x, item.points[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
    },
    
    addSearchHighlight: function(name, x, y) {
        this.searchHighlights.push({ name, x, y });
        this.draw();
    },
    
    clearSearchHighlights: function() {
        this.searchHighlights = [];
        this.draw();
    }
};

window.Map = Map;

/* =================================
Public Functions
================================= */
function openFullScreenMap(name, src) {
    const modal = document.getElementById('mapViewerModal');
    const mapNameEl = document.getElementById('mapName');
    if (modal) {
        modal.style.display = 'flex';
        if (mapNameEl) mapNameEl.textContent = name;
        Map.init(src);
        
        // Reset search input
        const searchInput = document.getElementById('mapSearchInput');
        if (searchInput) searchInput.value = '';
        
        // Clear previous highlights
        Map.clearSearchHighlights();
    }
}

function closeFullScreenMap(){
    const modal = document.getElementById('mapViewerModal');
    if (modal) modal.style.display = 'none';
    if (window.Map) {
        Map.history = [];
        Map.routePoints = [];
        Map.searchHighlights = [];
        Map.current = null;
    }
}

function zoomMap(factor){
    if (!window.Map || !window.Map.canvas || !window.Map.minScale || !window.Map.maxScale) return;
    const old = Map.scale;
    
    // Apply factor with min/max limits
    let newScale = Map.scale * factor;
    if (newScale < Map.minScale) newScale = Map.minScale;
    if (newScale > Map.maxScale) newScale = Map.maxScale;
    
    Map.scale = newScale;
    const scaleFactor = Map.scale / old;
    
    const centerX = Map.canvas.width / 2;
    const centerY = Map.canvas.height / 2;
    
    Map.panX = centerX - ((centerX - Map.panX) * scaleFactor);
    Map.panY = centerY - ((centerY - Map.panY) * scaleFactor);
    
    // Update zoom slider
    const zoomRange = document.getElementById('zoomRange');
    if (zoomRange) {
        const sliderValue = ((Map.scale - Map.minScale) / (Map.maxScale - Map.minScale)) * 100;
        zoomRange.value = Math.max(0, Math.min(100, Math.round(sliderValue)));
    }
    
    Map.draw();
}

/* =================================
Search Functionality
================================= */
function searchLocation() {
    const input = document.getElementById('mapSearchInput');
    if (!input || !input.value.trim() || !window.Map) return;
    
    const query = input.value.trim().toLowerCase();
    
    // Sample location database for different maps
    const locationDatabase = {
        'bermuda': {
            'clock tower': {x: 420, y: 350},
            'peak': {x: 600, y: 600},
            'factory': {x: 520, y: 620},
            'bridge': {x: 400, y: 500},
            'harbor': {x: 600, y: 300}
        },
        'alpine': {
            'summit': {x: 350, y: 150},
            'lodge': {x: 450, y: 400},
            'cable car': {x: 300, y: 350},
            'ski lift': {x: 400, y: 250}
        },
        'kalahari': {
            'oasis': {x: 300, y: 300},
            'canyon': {x: 500, y: 200},
            'ruins': {x: 400, y: 400}
        },
        'purgatory': {
            'gate': {x: 350, y: 250},
            'tower': {x: 450, y: 350},
            'arena': {x: 300, y: 400}
        },
        'nexterra': {
            'core': {x: 400, y: 300},
            'lab': {x: 500, y: 400},
            'generator': {x: 300, y: 350}
        },
        'solara': {
            'beacon': {x: 350, y: 250},
            'temple': {x: 450, y: 350},
            'garden': {x: 300, y: 400}
        }
    };
    
    // Get current map name
    const mapNameEl = document.getElementById('mapName');
    const currentMap = mapNameEl ? mapNameEl.textContent.toLowerCase() : 'bermuda';
    
    // Clear previous highlights
    Map.clearSearchHighlights();
    
    // Search in the current map's locations
    if (locationDatabase[currentMap] && locationDatabase[currentMap][query]) {
        const location = locationDatabase[currentMap][query];
        Map.addSearchHighlight(query.charAt(0).toUpperCase() + query.slice(1), location.x, location.y);
        
        // Center view on the location
        const centerX = Map.canvas.width / 2;
        const centerY = Map.canvas.height / 2;
        Map.panX = centerX - location.x * Map.scale;
        Map.panY = centerY - location.y * Map.scale;
        Map.draw();
    } else {
        // Search in all maps (fallback)
        let found = false;
        for (const map in locationDatabase) {
            if (locationDatabase[map][query]) {
                const location = locationDatabase[map][query];
                Map.addSearchHighlight(query.charAt(0).toUpperCase() + query.slice(1), location.x, location.y);
                found = true;
                break;
            }
        }
        
        if (!found) {
            alert('Location not found in database. Try: clock tower, peak, factory, bridge, etc.');
        }
    }
}