const { spawn } = require("child_process");
let botProcess = null;

function startBot(reason = "Panel start") {
  if (botProcess) return;
  console.log("[BOT]", reason);

  botProcess = spawn("node", ["MrUzairXxX-MTX.js"], {
    stdio: "inherit",
    shell: true
  });

  botProcess.on("exit", () => {
    botProcess = null;
  });
}

function stopBot() {
  if (!botProcess) return;
  botProcess.kill("SIGTERM");
  botProcess = null;
}

module.exports = { startBot, stopBot };
