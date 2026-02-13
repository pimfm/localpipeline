export interface RescueTimeDailySummary {
  id: number;
  date: string;
  productivity_pulse: number;
  very_productive_percentage: number;
  productive_percentage: number;
  neutral_percentage: number;
  distracting_percentage: number;
  very_distracting_percentage: number;
  all_productive_percentage: number;
  all_distracting_percentage: number;
  total_hours: number;
  very_productive_hours: number;
  productive_hours: number;
  neutral_hours: number;
  distracting_hours: number;
  very_distracting_hours: number;
}

export interface RescueTimeDataResponse {
  rows: [string, number, number, number][];
  row_headers: string[];
}
