const { spawn } = require("child_process");
const os = require("os");

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    const candidates = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                candidates.push({ name, address: iface.address });
            }
        }
    }
    const preferred = candidates.find(
        (c) =>
            c.name.startsWith("wl") ||
            c.name.startsWith("en") ||
            c.name.startsWith("eth") ||
            c.address.startsWith("192.168.") ||
            c.address.startsWith("10.")
    );
    return preferred || candidates[0];
}

const chosen = getLocalIp();

if (chosen) {
    const apiUrl = `http://${chosen.address}:8787`;
    process.env.EXPO_PUBLIC_LOCATIONS_API_BASE_URL = apiUrl;
    console.log(`🔗 API URL: ${apiUrl}`);
}

const child = spawn("npx", ["expo", "start"], {
    stdio: "inherit",
    shell: true,
});

child.on("exit", (code) => {
    process.exit(code);
});
