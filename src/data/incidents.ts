import { type Category } from "./incidentTypes";

export interface IncidentMarker {
  id: string;
  category: Category;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  lat: number;
  lng: number;
  locationName: string;
  upvotes: number;
  createdAt: string;
}

// Shared demo incidents used across map and incidents page
export const DEMO_INCIDENTS: IncidentMarker[] = [
  {
    id: "1",
    category: "harassment",
    severity: "high",
    title: "Verbal harassment near bus stop",
    lat: 28.6195,
    lng: 77.2080,
    locationName: "Connaught Place Bus Stop, Delhi",
    upvotes: 14,
    createdAt: "2h ago",
  },
  {
    id: "2",
    category: "poor_lighting",
    severity: "medium",
    title: "Dark alley near market",
    lat: 28.6280,
    lng: 77.2250,
    locationName: "Chandni Chowk Lane, Delhi",
    upvotes: 23,
    createdAt: "5h ago",
  },
  {
    id: "3",
    category: "suspicious_activity",
    severity: "medium",
    title: "Unauthorized taxi drivers",
    lat: 28.6420,
    lng: 77.2190,
    locationName: "Old Delhi Station",
    upvotes: 8,
    createdAt: "1d ago",
  },
  {
    id: "4",
    category: "theft",
    severity: "high",
    title: "Phone snatching on road",
    lat: 28.5700,
    lng: 77.2130,
    locationName: "Sarai Kale Khan Road",
    upvotes: 31,
    createdAt: "2d ago",
  },
  {
    id: "5",
    category: "stalking",
    severity: "critical",
    title: "Repeated stalking reports",
    lat: 28.6050,
    lng: 77.2250,
    locationName: "Lodhi Garden Area",
    upvotes: 19,
    createdAt: "6h ago",
  },
];
