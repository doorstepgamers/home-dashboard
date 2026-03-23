export interface VictronData {
    device_type: 'mppt' | 'shunt';
    pv_voltage?: number;
    pv_current?: number;
    pv_power?: number;
    battery_voltage?: number;
    battery_current?: number;
    battery_power?: number;
    load_current?: number;
    yield_today?: number;
    yield_total?: number;
    efficiency?: number;
    temperature?: number;
    state_of_operation?: string;
    error_code?: string;
    state_of_charge?: number;
    time_to_go?: number;
    raw_data: Record<string, string>;
}
export declare function initializeVictronReader(): Promise<void>;
export declare function readVictronData(): Promise<VictronData | null>;
export declare function closeVictronReader(): void;
export declare function isVictronConnected(): boolean;
//# sourceMappingURL=victron-reader.d.ts.map