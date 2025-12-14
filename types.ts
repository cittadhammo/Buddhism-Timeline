export enum Region {
  NORTH = 'Northern',
  CENTER = 'Central',
  SOUTH = 'Southern'
}

export interface Country {
  id: string;
  name: string;
  region: Region;
  yIndex: number; // 0 for India, positive for North, negative for South
  svgCode?: string; // Filename code for amcharts (e.g., 'japanLow')
}

export enum EventType {
  PERSON = 'Person',
  TEXT = 'Text',
  SCHOOL = 'School',
  EVENT = 'Event'
}

export interface HistoricalEvent {
  id: string;
  type: EventType;
  name: string;
  year: number; // Negative for BCE
  countryId: string;
  description?: string;
  importance?: number; // 1-10 scale for visual sizing
  endYear?: number; // For periods like schools or lifespans
}

export interface Link {
  sourceId: string;
  targetId: string;
  type: 'transmission' | 'influence';
}

export interface ChartData {
  countries: Country[];
  events: HistoricalEvent[];
  links: Link[];
}