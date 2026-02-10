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
    name: " music",
    version: "1.2.6", // Updated version
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
        const input = args.join(" ");

        if (!input) return api.sendMessage("❌ Song ka naam ya URL likho!", event.threadID, event.messageID);

        // Searching message
        searchMsg = await api.sendMessage(`✅ Apki Request Jari Hai Please wait...`, event.threadID);

        // Check if input is a URL or Search Query
        if (input.includes("youtube.com") || input.includes("youtu.be")) {
            videoID = getVideoID(input);
            songTitle = "YouTube Music";
        } else {
            const result = await yts(input + " official audio");
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Koi result nahi mila!", event.threadID);
            }
            videoID = result.videos[0].videoId;
            songTitle = result.videos[0].title;
        }

        if (!videoID) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ Valid YouTube link nahi mila!", event.threadID);
        }

        // 🔥 FIX: Correct URL structure for Render API
        const youtubeLink = `https://www.youtube.com/watch?v=${videoID}`;
        const downloadUrl = `${MY_RENDER_API}/download?url=${encodeURIComponent(youtubeLink)}`;

        // Get the stream
        const audioStream = await getStreamFromURL(downloadUrl, `music.mp3`);

        // Message bhejne se pehle purana status delete karein
        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        return api.sendMessage({
            body: `🎵 Title: ${songTitle}\n👤 Credits: Shaan Khan`,
            attachment: audioStream
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error(err);
        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        let errorMsg = "⚠️ Error: API Response nahi de rahi. Render dashboard check karein ki server 'Active' hai ya nahi.";
        if (err.message.includes("Credits Locked")) errorMsg = err.message;
        
        return api.sendMessage(errorMsg, event.threadID, event.messageID);
    }
};
