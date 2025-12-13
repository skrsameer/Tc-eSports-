function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Agar back page na ho
        window.location.href = "index.html";
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const grenadeBtn = document.getElementById('grenadeDrillsBtn');
    const utilityBtn = document.getElementById('utilityDrillsBtn');
    const videoFeed = document.getElementById('videoFeed');

    // Video Data Structure (Replace 'video_url' and 'poster_url' with actual links)
    const bomberVideos = {
        grenade: [
            { title: "Alvaro Grenade Damage Drill", desc: "Alvaro के साथ ग्रैनेड डैमेज की रेंज और टाइमिंग का अभ्यास।", url: "bomber_drill_1.mp4", poster: "bomber_thumb_1.jpg" },
            { title: "Cover Break Grenade Technique", desc: "कवर के पास फेंके गए ग्रैनेड से ग्लू वॉल के पीछे डैमेज देना।", url: "bomber_drill_2.mp4", poster: "bomber_thumb_2.jpg" },
            { title: "Precision Cooking Shots", desc: "ग्रैनेड को हाथ में 3 सेकंड तक 'Cook' करके फेंकने की ड्रिल।", url: "bomber_drill_3.mp4", poster: "bomber_thumb_3.jpg" }
        ],
        utility: [
            { title: "Flashbang Rush Timing", desc: "फ्लैशबैंग के परफेक्ट टाइमिंग के साथ Rusher को एंट्री दिलाना।", url: "utility_drill_1.mp4", poster: "utility_thumb_1.jpg" },
            { title: "Smoke Screen Rotation", desc: "सेफ ज़ोन में जाने के लिए स्मोक का उपयोग करके विजन को ब्लॉक करना।", url: "utility_drill_2.mp4", poster: "utility_thumb_2.jpg" },
            { title: "Utility Inventory Management", desc: "फाइट के बीच में ग्लू वॉल और ग्रैनेड को तेज़ी से स्वैप करना।", url: "utility_drill_3.mp4", poster: "utility_thumb_3.jpg" }
        ]
    };

    /**
     * वीडियो गैलरी को रेंडर करता है
     * @param {string} type - 'grenade' or 'utility'
     */
    const renderVideoFeed = (type) => {
        videoFeed.innerHTML = '';
        const videos = bomberVideos[type];

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
        
        const observerOptions = {
            root: null, 
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
    grenadeBtn.addEventListener('click', () => {
        renderVideoFeed('grenade');
    });

    utilityBtn.addEventListener('click', () => {
        renderVideoFeed('utility');
    });
});
