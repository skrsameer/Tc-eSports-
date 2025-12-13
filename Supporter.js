function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Agar back page na ho
        window.location.href = "index.html";
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const damageBtn = document.getElementById('damageSupporterDrillsBtn');
    const utilityBtn = document.getElementById('utilitySupporterDrillsBtn');
    const videoFeed = document.getElementById('videoFeed');

    // Video Data Structure (Replace 'video_url' and 'poster_url' with actual links)
    const supporterVideos = {
        damage: [
            { title: "Mid-Range Spray Control", desc: "AR गन्स के साथ सटीक स्प्रे और रिकॉइल कंट्रोल।", url: "damage_drill_1.mp4", poster: "damage_thumb_1.jpg" },
            { title: "Sniper Quick Scope Practice", desc: "AWM/M82B के साथ तेज़ स्कोप-इन और फायर।", url: "damage_drill_2.mp4", poster: "damage_thumb_2.jpg" },
            { title: "Target Prioritization", desc: "क्लोज फाइट में सबसे खतरनाक एनिमी को पहले नॉक करना।", url: "damage_drill_3.mp4", poster: "damage_thumb_3.jpg" }
        ],
        utility: [
            { title: "Defensive Gloo Wall Setup", desc: "नॉक टीममेट को रिवाइव देने के लिए परफेक्ट शील्ड बनाना।", url: "utility_drill_1.mp4", poster: "utility_thumb_1.jpg" },
            { title: "Advanced Grenade Bounce", desc: "दीवारों से ग्रैनेड को उछालकर (Bounce) कवर में बैठे एनिमी पर फेंकना।", url: "utility_drill_2.mp4", poster: "utility_thumb_2.jpg" },
            { title: "Treatment Gun Mastery", desc: "चलते हुए टीममेट्स को तेजी से हील करना।", url: "utility_drill_3.mp4", poster: "utility_thumb_3.jpg" }
        ]
    };

    /**
     * वीडियो गैलरी को रेंडर करता है
     * @param {string} type - 'damage' or 'utility'
     */
    const renderVideoFeed = (type) => {
        videoFeed.innerHTML = '';
        const videos = supporterVideos[type];

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
    damageBtn.addEventListener('click', () => {
        renderVideoFeed('damage');
    });

    utilityBtn.addEventListener('click', () => {
        renderVideoFeed('utility');
    });
});
