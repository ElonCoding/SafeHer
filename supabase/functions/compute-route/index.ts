import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Point {
  lat: number;
  lng: number;
}

interface Node extends Point {
  id: string;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

// Haversine distance in km
function getDistance(p1: Point, p2: Point): number {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Synthetic graph generation for Delhi area
const nodes: Node[] = [];
const edges: Edge[] = [];
const GRID_SIZE = 10;
const START_LAT = 28.55;
const START_LNG = 77.15;
const STEP = 0.01;

for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    const id = `${i}-${j}`;
    nodes.push({
      id,
      lat: START_LAT + i * STEP,
      lng: START_LNG + j * STEP
    });

    if (i > 0) {
      const from = `${i - 1}-${j}`;
      const to = id;
      edges.push({ from, to, weight: getDistance(nodes.find(n => n.id === from)!, nodes.find(n => n.id === to)!) });
      edges.push({ from: to, to: from, weight: getDistance(nodes.find(n => n.id === from)!, nodes.find(n => n.id === to)!) });
    }
    if (j > 0) {
      const from = `${i}-${j - 1}`;
      const to = id;
      edges.push({ from, to, weight: getDistance(nodes.find(n => n.id === from)!, nodes.find(n => n.id === to)!) });
      edges.push({ from: to, to: from, weight: getDistance(nodes.find(n => n.id === from)!, nodes.find(n => n.id === to)!) });
    }
  }
}

function findNearestNode(p: Point): Node {
  let minDistance = Infinity;
  let nearest = nodes[0];
  for (const node of nodes) {
    const d = getDistance(p, node);
    if (d < minDistance) {
      minDistance = d;
      nearest = node;
    }
  }
  return nearest;
}

function dijkstra(startId: string, endId: string) {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const queue = new Set<string>();

  for (const node of nodes) {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    queue.add(node.id);
  }

  distances[startId] = 0;

  while (queue.size > 0) {
    let u: string | null = null;
    for (const nodeId of queue) {
      if (u === null || distances[nodeId] < distances[u]) {
        u = nodeId;
      }
    }

    if (u === endId || distances[u!] === Infinity) break;

    queue.delete(u!);

    const neighbors = edges.filter(e => e.from === u);
    for (const edge of neighbors) {
      const alt = distances[u!] + edge.weight;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = u;
      }
    }
  }

  const path: Point[] = [];
  let curr: string | null = endId;
  while (curr !== null) {
    const node = nodes.find(n => n.id === curr)!;
    path.unshift({ lat: node.lat, lng: node.lng });
    curr = previous[curr];
  }

  return {
    path,
    distance: distances[endId],
    time: distances[endId] * 15 // Roughly 15 min per km walk
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { origin, destination } = await req.json();

    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    const startNode = findNearestNode(origin);
    const endNode = findNearestNode(destination);

    const result = dijkstra(startNode.id, endNode.id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'An unknown error occurred' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
