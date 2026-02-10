const axios = require("axios");
const yts = require("yt-search");

// 🔐 CREDITS LOCK (OFFICIAL)
function checkCredits() {
    const correctCredits = "SHAAN-KHAN";
    if (module.exports.config.credits !== correctCredits) {
        throw new Error("❌ Credits Locked By SHAAN-KHAN");
    }
}

// 🔐 ENCRYPTED GROUP SYSTEM
const encryptedGroups = [
    "MTIzNDU2Nzg5MA==" // base64 threadID (example)
];

function decrypt(text) {
    return Buffer.from(text, "base64").toString("utf-8");
}

function allowGroup(threadID) {
    return encryptedGroups.some(e => decrypt(e) === threadID);
}

// 🌐 Base API
const baseApiUrl = async () => {
    const base = await axios.get(
        "https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json"
    );
    return base.data.api;
};

(async () => {
    global.apis = {
        diptoApi: await baseApiUrl()
    };
})();

// 🎧 Stream
async function getStreamFromURL(url, pathName) {
    const res = await axios.get(url, { responseType: "stream" });
    res.data.path = pathName;
    return res.data;
}

// 🎥 YouTube ID
function getVideoID(url) {
    const regex =
        /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))((\w|-){11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

module.exports.config = {
    name: "yt",
    version: "2.1.0",
    credits: "SHAAN-KHAN", // 🔐 DO NOT CHANGE
    hasPermssion: 0,
    cooldowns: 5,
    description: "YouTube se MP3 download",
    commandCategory: "media",
    usages: "[song name | youtube link]"
};

module.exports.run = async function ({ api, args, event }) {
    try {
        checkCredits();

        // 🔐 GROUP CHECK
        if (!allowGroup(event.threadID)) {
            return api.sendMessage(
                "🔒 Ye command is group mein allowed nahi hai!",
                event.threadID
            );
        }

        // 😄 SEARCH REACTION
        api.setMessageReaction("⌛", event.messageID, () => {}, true);

        let videoID;
        let info;
        const url = args[0];

        if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
            videoID = getVideoID(url);
            if (!videoID)
                return api.sendMessage("❌ Invalid YouTube URL!", event.threadID);
            info = await yts({ videoId: videoID });
        } else {
            const query = args.join(" ");
            if (!query)
                return api.sendMessage(
                    "❌ Song ka naam ya YouTube link do!",
                    event.threadID
                );

            const search = await yts(query);
            const video = search.videos[0];
            if (!video)
                return api.sendMessage("❌ Koi result nahi mila!", event.threadID);

            videoID = video.videoId;
            info = video;
        }

        // 📩 FIRST INFO MESSAGE
        await api.sendMessage(
            `🎵 ${info.title}\n👤 ${info.author?.name || "YouTube Artist"}\n\n⏳ Music prepare ho rahi hai...`,
            event.threadID
        );

        // 🎧 DOWNLOAD
        const { data } = await axios.get(
            `${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`
        );

        // 🎶 SEND SONG
        await api.sendMessage(
            {
                body:
`🎶 ${info.title}

»»𝑶𝑾𝑵𝑬𝑹««★™
»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 👉 MUSIC`,
                attachment: await getStreamFromURL(
                    data.downloadLink,
                    `${info.title}.mp3`
                )
            },
            event.threadID
        );

        // ✅ DONE REACTION
        api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
        console.error(err);
        api.sendMessage(
            "⚠️ Error aa gaya, baad mein try karo!",
            event.threadID
        );
    }
};