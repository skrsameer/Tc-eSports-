function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Agar back page na ho
        window.location.href = "index.html"; 
    }
}document.addEventListener('DOMContentLoaded', () => {
    const primaryBtn = document.getElementById('primaryRusherDrillsBtn');
    const secondaryBtn = document.getElementById('secondaryRusherDrillsBtn');
    const videoFeed = document.getElementById('videoFeed');

    // Video Data Structure (Replace 'video_url' and 'poster_url' with actual links)
    const rusherVideos = {
        primary: [
            { title: "Gloo Wall cover fire Drills", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "PD1.mp4", poster: "primary_thumb_1.jpg" },
            { title: "Back fire Drills", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "PD2.mp4", poster: "primary_thumb_2.jpg" },
            { title: "M590 Jump One tap Drills", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "PD3.mp4", poster: "primary_thumb_3.jpg" }
        ],
        secondary: [
            { title: "Team Backup & Support Fire", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "SD1.mp4", poster: "secondary_thumb_1.jpg" },
            { title: "Mid Range Headshot Drills", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "SD2.mp4", poster: "secondary_thumb_2.jpg" },
            { title: "Long Range scope on headshot Drills", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "SD3.mp4", poster: "secondary_thumb_3.jpg" }
        ]
    };

    /**
     * वीडियो गैलरी को रेंडर करता है
     * @param {string} type - 'primary' or 'secondary'
     */
    const renderVideoFeed = (type) => {
        videoFeed.innerHTML = '';
        const videos = rusherVideos[type];

        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.classList.add('video-card');
            
            // Video Element Setup (Auto-play muted, loop)
            videoCard.innerHTML = `
                <video muted loop playsinline poster="${video.poster}">
                    <source src="${video.url}" type="video/mp4">
                    आपका ब्राउज़र वीडियो टैग को सपोर्ट नहीं करता।
                </video>
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <p>${video.desc}</p>
                </div>
            `;
            videoFeed.appendChild(videoCard);
        });

        videoFeed.style.display = 'grid'; // Show the video feed
        
        // Setup Intersection Observer for In-View Auto-play
        setupIntersectionObserver();
    };

    // Intersection Observer Setup
    const setupIntersectionObserver = () => {
        const videoElements = videoFeed.querySelectorAll('video');
        
        // Configuration: Video starts playing when 60% of it is visible
        const observerOptions = {
            root: null, // relative to the viewport
            rootMargin: '0px',
            threshold: 0.6 // 60% visibility
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    // Start playing if in view
                    video.play().catch(error => {
                        console.log("Video auto-play blocked:", error);
                        // Optional: Show a play button icon if auto-play fails
                    });
                } else {
                    // Pause if out of view
                    video.pause();
                }
            });
        }, observerOptions);

        videoElements.forEach(video => {
            observer.observe(video);
        });
    };

    // Event Listeners for Buttons
    primaryBtn.addEventListener('click', () => {
        renderVideoFeed('primary');
    });

    secondaryBtn.addEventListener('click', () => {
        renderVideoFeed('secondary');
    });
});
