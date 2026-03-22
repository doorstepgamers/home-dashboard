import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import { statfs } from 'fs';
const execAsync = promisify(exec);
const statfsAsync = promisify(statfs);
async function getCPUTemp() {
    try {
        const { stdout } = await execAsync('cat /sys/class/thermal/thermal_zone0/temp');
        return parseInt(stdout.trim()) / 1000;
    }
    catch {
        return 0;
    }
}
async function getCPUUsage() {
    try {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - ~~(100 * idle / total);
        return usage;
    }
    catch {
        return 0;
    }
}
async function getDiskUsage() {
    try {
        const stats = await statfsAsync('/');
        const total = (stats.blocks * stats.bsize) / (1024 ** 3);
        const free = (stats.bfree * stats.bsize) / (1024 ** 3);
        const used = total - free;
        return { used, total };
    }
    catch {
        return { used: 0, total: 0 };
    }
}
function getMemoryUsage() {
    const total = os.totalmem() / (1024 ** 3);
    const free = os.freemem() / (1024 ** 3);
    const used = total - free;
    return { used, total };
}
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    else {
        return `${minutes}m`;
    }
}
export async function getSystemStats() {
    const [cpuUsage, cpuTemp, disk] = await Promise.all([
        getCPUUsage(),
        getCPUTemp(),
        getDiskUsage(),
    ]);
    const memory = getMemoryUsage();
    const uptime = formatUptime(os.uptime());
    return {
        cpuUsage,
        cpuTemp,
        memoryUsed: memory.used,
        memoryTotal: memory.total,
        diskUsed: disk.used,
        diskTotal: disk.total,
        uptime,
    };
}
//# sourceMappingURL=system-stats.js.map