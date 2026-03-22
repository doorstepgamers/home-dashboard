export interface DeviceStatus {
    id: string;
    device_name: string;
    last_seen: string;
    system_info: Record<string, any>;
    ip_address?: string;
    created_at: string;
    updated_at: string;
}
export interface Database {
    public: {
        Tables: {
            device_status: {
                Row: DeviceStatus;
                Insert: Omit<DeviceStatus, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<DeviceStatus, 'id' | 'created_at'>>;
            };
        };
    };
}
//# sourceMappingURL=database.d.ts.map