interface SystemStats {
    cpuUsage: number;
    cpuTemp: number;
    memoryUsed: number;
    memoryTotal: number;
    diskUsed: number;
    diskTotal: number;
    uptime: string;
}
export declare function getSystemStats(): Promise<SystemStats>;
export {};
//# sourceMappingURL=system-stats.d.ts.map