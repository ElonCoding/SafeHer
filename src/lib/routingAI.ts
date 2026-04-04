// src/lib/routingAI.ts
import { toast } from "sonner";

export interface AIRouteRecommendation {
  routeIndex: number;
  route: google.maps.DirectionsRoute;
  safetyScore: number;
  durationMs: number;
  distanceMeters: number;
  aiLabel: "Safest & Fastest" | "Fastest" | "Safest" | "Alternative";
  warnings: string[];
}

export const getAIOptimizedRoutes = async (
  origin: google.maps.LatLng | string,
  destination: google.maps.LatLng | string,
): Promise<AIRouteRecommendation[]> => {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error("Google Maps API not loaded."));
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        drivingOptions: {
          departureTime: new Date(), // Required for traffic modeling
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (response, status) => {
        if (status !== window.google.maps.DirectionsStatus.OK || !response) {
          toast.error("Failed to calculate routes.");
          reject(new Error("Routing failed"));
          return;
        }

        const recommendations = response.routes.map((route, idx) => {
          return scoreRoute(route, idx);
        });

        // Sort by compound AI score (we want highest safety and lowest duration/distance)
        recommendations.sort((a, b) => {
           // We assign a heavy weight to safety (70%) and rest to speed (30%)
           const aScore = (a.safetyScore * 0.7) - ((a.durationMs / 60000) * 0.3);
           const bScore = (b.safetyScore * 0.7) - ((b.durationMs / 60000) * 0.3);
           return bScore - aScore;
        });

        // Label them intelligently
        if (recommendations.length > 0) {
            recommendations[0].aiLabel = "Safest & Fastest";
            if (recommendations.length > 1) {
                // Check if the second route is significantly faster
                if (recommendations[1].durationMs < recommendations[0].durationMs - 300000) {
                    recommendations[1].aiLabel = "Fastest";
                    recommendations[0].aiLabel = "Safest";
                } else {
                    recommendations[1].aiLabel = "Alternative";
                }
            }
        }

        resolve(recommendations);
      }
    );
  });
};

/**
 * Heuristic scoring engine to simulate AI safety learning
 * In a real application, this would calculate intersections with global danger zone polygons
 * via a spatial database (like PostGIS). 
 */
function scoreRoute(route: google.maps.DirectionsRoute, index: number): AIRouteRecommendation {
  const leg = route.legs[0];
  let safetyScore = 100;
  const warnings: string[] = [];

  // 1. Analyze time of day (AI factor: Night routes get stricter scoring)
  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 20 || currentHour <= 5;
  
  if (isNightTime) {
      safetyScore -= 5;
      warnings.push("Night time travel detected");
  }

  // 2. Analyze route complexity
  if (leg.steps.length > 20) {
      safetyScore -= 10;
      warnings.push("High number of turns, complex route");
  }

  // 3. Simulated Danger Zone Intersection
  // If the route passes exactly through certain high-risk longitudes (Mocking local ML model)
  const boundsCenter = route.bounds.getCenter();
  if (boundsCenter.lng() > 77.21 && boundsCenter.lng() < 77.22) {
      safetyScore -= 15;
      warnings.push("Passes through a medium-risk area");
  }
  
  if (boundsCenter.lat() > 28.61 && boundsCenter.lat() < 28.62) {
      safetyScore -= 25;
      warnings.push("Route intersects with a high-risk reported zone");
  }

  // 4. Traffic conditions
  const durationInTraffic = leg.duration_in_traffic?.value || leg.duration?.value || 0;
  const normalDuration = leg.duration?.value || 0;
  
  if (durationInTraffic > normalDuration * 1.3) {
      safetyScore -= 10;
      warnings.push("Heavy traffic congestion detected");
  }

  // Normalize score
  safetyScore = Math.max(0, Math.min(100, safetyScore));

  return {
    routeIndex: index,
    route,
    safetyScore,
    durationMs: durationInTraffic * 1000,
    distanceMeters: leg.distance?.value || 0,
    aiLabel: "Alternative", // to be overwritten by sorter
    warnings,
  };
}
