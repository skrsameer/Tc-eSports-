function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Agar back page na ho
        window.location.href = "index.html"; 
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // HTML से IDs को प्राप्त करें
    const sniperBtn = document.getElementById('sniperDrillsBtn');
    const iglBtn = document.getElementById('iglDrillsBtn');
    const videoFeed = document.getElementById('videoFeed');

    // वीडियो डेटा (असली URL से बदलें)
    const sniperIglVideos = {
        sniper: [
            { title: "Quick-Scope and Switch Drill", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "SDa.mp4", poster: "sniper_thumb_1.jpg" },
            { title: "Close Range Jump fire and Switch Drill", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "SDb.mp4", poster: "sniper_thumb_2.jpg" },
            { title: "Jump fire Switch cover Drill", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "SDc.mp4", poster: "sniper_thumb_3.jpg" },
            { title: "Long Range speed fire and Switch Drill", desc: "Daily 5 से 10 मिनट प्रेक्टिस करें", url: "SDd.mp4", poster: "sniper_thumb_2.jpg" }
        ],
        igl: [
            { title: "Zone Prediction and Rotation Plan", desc: "मैप पर अगले ज़ोन की भविष्यवाणी करना और रोटेशन का रूट बनाना।", url: "igl_drill_1.mp4", poster: "igl_thumb_1.jpg" },
            { title: "Covered Communication Drill", desc: "फाइट के दौरान शांति से, स्पष्ट और संक्षिप्त कॉल-आउट देना।", url: "igl_drill_2.mp4", poster: "igl_thumb_2.jpg" },
            { title: "High-Ground Launchpad Escape", desc: "लॉन्चपैड का उपयोग करके तेज़ी से नई हाइट एडवांटेज पोजीशन पर जाना।", url: "igl_drill_3.mp4", poster: "igl_thumb_3.jpg" }
        ]
    };

    /**
     * वीडियो गैलरी को रेंडर करता है
     * @param {string} type - 'sniper' or 'igl'
     */
    const renderVideoFeed = (type) => {
        videoFeed.innerHTML = '';
        const videos = sniperIglVideos[type];

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

        // **यह लाइन वीडियो कंटेनर को display: none से बदलकर grid करती है**
        videoFeed.style.display = 'grid'; 
        setupIntersectionObserver();
    };

    // Intersection Observer Setup (यह सुनिश्चित करता है कि वीडियो स्क्रॉल करने पर चलते रहें)
    const setupIntersectionObserver = () => {
        const videoElements = videoFeed.querySelectorAll('video');
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.6 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(error => {
                        console.warn("Video auto-play blocked:", error);
                    });
                } else {
                    video.pause();
                }
            });
        }, observerOptions);

        videoElements.forEach(video => {
            observer.observe(video);
        });
    };

    // Event Listeners for Buttons
    sniperBtn.addEventListener('click', () => {
        renderVideoFeed('sniper');
    });

    iglBtn.addEventListener('click', () => {
        renderVideoFeed('igl');
    });
});
