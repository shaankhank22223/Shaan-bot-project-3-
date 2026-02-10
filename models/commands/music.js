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

async function getStreamFromURL(url) {
    const response = await axios.get(url, { 
        responseType: "stream",
        timeout: 100000 
    });
    return response.data;
}

function getVideoID(url) {
    const regex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "music", // 👈 Ab command ka naam 'music' hai
    version: "1.2.9",
    credits: "Shaan Khan", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube se Music download karein",
    commandCategory: "media",
    usages: "[Song name / URL]"
};

module.exports.run = async function({ api, args, event }) {
    let searchMsg;
    try {
        checkCredits(); // 🔐 Validation check

        const input = args.join(" ");
        if (!input) return api.sendMessage("❌ Song ka naam ya URL likho!", event.threadID, event.messageID);

        // Status update
        searchMsg = await api.sendMessage(`🔎 Search kar raha hoon... wait karein.`, event.threadID);

        let videoID, songTitle;
        
        // URL check ya Search logic
        if (input.includes("youtube.com") || input.includes("youtu.be")) {
            videoID = getVideoID(input);
            songTitle = "YouTube Music";
        } else {
            const result = await yts(input + " official audio");
            if (!result.videos.length) {
                if (searchMsg) api.unsendMessage(searchMsg.messageID);
                return api.sendMessage("❌ Result nahi mila!", event.threadID);
            }
            videoID = result.videos[0].videoId;
            songTitle = result.videos[0].title;
        }

        if (!videoID) {
            if (searchMsg) api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ Valid YouTube link nahi mila!", event.threadID);
        }

        // Render API link formation
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoID}`;
        const downloadUrl = `${MY_RENDER_API}/download?url=${encodeURIComponent(youtubeUrl)}`;

        const stream = await getStreamFromURL(downloadUrl);

        // Purana message delete karke audio bhejna
        if (searchMsg) api.unsendMessage(searchMsg.messageID);

        return api.sendMessage({
            body: `🎵 Title: ${songTitle}\n👤 Credits: Shaan Khan`,
            attachment: stream
        }, event.threadID, event.messageID);

    } catch (err) {
        console.error(err);
        if (searchMsg) api.unsendMessage(searchMsg.messageID);
        
        let msg = "⚠️ Error: API Response nahi de rahi. Render dashboard check karein.";
        if (err.message.includes("Credits Locked")) msg = err.message;

        return api.sendMessage(msg, event.threadID, event.messageID);
    }
};
