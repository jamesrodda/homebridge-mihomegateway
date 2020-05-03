export declare const enum DeviceType {
  LEGACY = 'legacy',            // MIHO002
  MONITOR = 'monitor',          // MIHO004
  CONTROL = 'control',          // MIHO005
  HOUSE = 'house',              // MIHO006
  SOCKET = 'socket',            // MIHO007 (as well as all metallic variants)
  LIGHT = 'light',              // MIHO008 (as well as all metallic variants)
  DOUBLELIGHT = 'double_light', // MIHO009 (as well as all metallic variants)
  DIMMER = 'dimmer',            // MIHO010 (as well as all metallic variants)
  ETRV = 'etrv',                // MIHO013
  RELAY = 'relay',              // MIHO014, MIHO015
  MOTION = 'motion',            // MIHO032
  OPEN = 'open',                // MIHO033
  THERMOSTAT = 'thermostat',    // MIHO069
  CLICKER = 'clicker',          // MIHO089
  WIFIPLUG = 'wifiplug',        // MIHO109
  FOURGANG = 'fourgang',        // ENER010
}

export interface UserProfile {
  id: number;
  email_address: string;
  password_hash: string;
  admin: boolean;
  created_at: Date;
  updated_at: Date;
  first_name: string;
  last_name: string;
  unit_price: number;
  api_key: string;
}

export interface SubDevice {
  id: number;
  label: string;
  device_id: number;
  power_state: number;
  startup_mode: number;
  aggregated_hourly_at: Date;
  aggregated_daily_at: Date;
  device_type: DeviceType;
  remote_id: number;
  timer1_enabled?: any;
  timer1_on_time?: any;
  timer1_off_time?: any;
  timer1_monday?: any;
  timer1_tuesday?: any;
  timer1_wednesday?: any;
  timer1_thursday?: any;
  timer1_friday?: any;
  timer1_saturday?: any;
  timer1_sunday?: any;
  timer2_enabled?: any;
  timer2_on_time?: any;
  timer2_off_time?: any;
  timer2_monday?: any;
  timer2_tuesday?: any;
  timer2_wednesday?: any;
  timer2_thursday?: any;
  timer2_friday?: any;
  timer2_saturday?: any;
  timer2_sunday?: any;
  timer3_enabled?: any;
  timer3_on_time?: any;
  timer3_off_time?: any;
  timer3_monday?: any;
  timer3_tuesday?: any;
  timer3_wednesday?: any;
  timer3_thursday?: any;
  timer3_friday?: any;
  timer3_saturday?: any;
  timer3_sunday?: any;
  extra_data?: any;
  target_temperature?: any;
  voltage?: any;
  voltage_reported_at?: any;
  frequency?: any;
  real_power?: any;
  reactive_power?: any;
  created_at: Date;
  updated_at: Date;
  nest_thermostat_id?: any;
  rate_limit_tokens_used: number;
  rate_limit_tokens_updated_at: Date;
  socket1_label?: any;
  socket2_label?: any;
  socket3_label?: any;
  socket4_label?: any;
  power_state_1?: any;
  power_state_2?: any;
  power_state_3?: any;
  power_state_4?: any;
  hardware_version?: any;
  firmware_version?: any;
  energenie_thermostat_id?: any;
  container_number?: any;
  side?: any;
  controlling_thermostat_id?: any;
  optimise_warm_up_schedule: boolean;
  notifications_enabled: boolean;
  disconnected_at?: any;
  online: boolean;
  device_groups: DeviceGroup[];
  today_wh: number;
  today_wh_range: string;
  last_data_instant: number;
  unknown_state?: boolean;
  parent_device_last_seen_at: Date;
}

export interface DeviceGroup {
  id: number;
  name: string;
  user_id: number;
}