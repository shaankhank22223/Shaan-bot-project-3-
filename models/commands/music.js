const axios = require("axios");
const yts = require("yt-search");

// 🔐 Credits Lock - Isko change karne par command block ho jayegi
function checkCredits() {
    const correctCredits = "Shaan Khan"; 
    if (module.exports.config.credits !== correctCredits) {
        throw new Error("❌ Credits Locked By Shaan Khan! Please restore original credits.");
    }
}

// Aapki Render API URL
const MY_RENDER_API = "https://yt-dlp-api-rdpx.onrender.com";

async function getStreamFromURL(url, pathName) {
    const response = await axios.get(url, { responseType: "stream" });
    response.data.path = pathName;
    return response.data;
}

function getVideoID(url) {
    const regex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "music",
    version: "1.2.5",
    credits: "Shaan Khan", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube se Official Music download karein",
    commandCategory: "media",
    usages: "[Song ka naam / URL]"
};

module.exports.run = async function({ api, args, event }) {
    try {
        checkCredits(); // 🔐 Validation check

        let videoID, searchMsg, songTitle;
        const input = args[0];

        if (input && (input.includes("youtube.com") || input.includes("youtu.be"))) {
            videoID = getVideoID(input);
            if (!videoID) return api.sendMessage("❌ Galat YouTube URL!", event.threadID, event.messageID);
        } else {
            const query = args.join(" ");
            if (!query) return api.sendMessage("❌ Song ka naam likho!", event.threadID, event.messageID);

            // Searching message changed as per your request
            searchMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, event.threadID);
            
            // Background mein "official audio" search karega taaki result sahi aaye
            const result = await yts(query + " official audio");
            if (!result.videos.length) return api.sendMessage("❌ Koi result nahi mila!", event.threadID);
            
            const selectedVideo = result.videos[0]; 
            videoID = selectedVideo.videoId;
            songTitle = selectedVideo.title;
        }

        // Render API Calling
        const downloadUrl = `${MY_RENDER_API}/download?url=https://www.youtube.com/watch?v=${videoID}`;

        // Stream bhejte waqt purana message delete karna
        if (searchMsg?.messageID) api.unsendMessage(searchMsg.messageID);

        return api.sendMessage({
            body: `🎵 Title: ${songTitle || "YouTube Music"}\n👤 Credits: Shaan Khan`,
            attachment: await getStreamFromURL(downloadUrl, `music.mp3`)
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error(err);
        let errorMsg = "⚠️ Error: API Response nahi de rahi. Render dashboard check karein.";
        if (err.message.includes("Credits Locked")) errorMsg = err.message;
        
        return api.sendMessage(errorMsg, event.threadID, event.messageID);
    }
};
