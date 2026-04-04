import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

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

function dijkstra(nodes: Node[], edges: Edge[], startId: string, endId: string) {
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

    if (u === endId || u === null || distances[u] === Infinity) break;

    queue.delete(u);

    const neighbors = edges.filter(e => e.from === u);
    for (const edge of neighbors) {
      const alt = distances[u] + edge.weight;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = u;
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = endId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return { path, distance: distances[endId] };
}

Deno.test("Dijkstra finds shortest path in simple graph", () => {
  const testNodes: Node[] = [
    { id: "A", lat: 0, lng: 0 },
    { id: "B", lat: 0, lng: 1 },
    { id: "C", lat: 1, lng: 1 },
  ];
  const testEdges: Edge[] = [
    { from: "A", to: "B", weight: 10 },
    { from: "B", to: "C", weight: 10 },
    { from: "A", to: "C", weight: 50 },
  ];

  const result = dijkstra(testNodes, testEdges, "A", "C");
  assertEquals(result.path, ["A", "B", "C"]);
  assertEquals(result.distance, 20);
});

Deno.test("Dijkstra returns direct path if shorter", () => {
  const testNodes: Node[] = [
    { id: "A", lat: 0, lng: 0 },
    { id: "B", lat: 0, lng: 1 },
    { id: "C", lat: 1, lng: 1 },
  ];
  const testEdges: Edge[] = [
    { from: "A", to: "B", weight: 30 },
    { from: "B", to: "C", weight: 30 },
    { from: "A", to: "C", weight: 10 },
  ];

  const result = dijkstra(testNodes, testEdges, "A", "C");
  assertEquals(result.path, ["A", "C"]);
  assertEquals(result.distance, 10);
});
