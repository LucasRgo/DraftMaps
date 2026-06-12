const { spawn } = require('child_process');
const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const ip = getLocalIp();
process.env.EXPO_PUBLIC_LOCATIONS_API_BASE_URL = `http://${ip}:8787`;

const child = spawn('npx', ['expo', 'start'], {
    stdio: 'inherit',
    shell: true,
});

child.on('exit', (code) => {
    process.exit(code);
});
