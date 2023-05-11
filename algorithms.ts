import { Graph } from "./graph.ts";
import { BinaryHeap } from "collections/binary_heap.ts";
import { Edge, PartialTour } from "./types.ts";
import {
  logTime,
  dfs,
  getTourWeight,
  pathToEdges,
  findSetId,
  eulerTour,
  permute,
} from "./utilities.ts";

const subGraphs = (graph: Graph) => {
  const start = performance.now();
  const visited = new Uint8Array(graph.size);
  const subgraphs: number[][] = [];
  for (let i = 0; i < graph.size; i++) {
    if (!visited[i]) {
      visited[i] = 1;
      subgraphs.push(dfs(graph, i, visited));
    }
  }
  logTime("Subgraphs created in", start, performance.now());
  return subgraphs;
};

const prim = (graph: Graph) => {
  const start = performance.now();
  const visited = new Uint8Array(graph.size);
  const mst: Edge[] = [];
  const heap = new BinaryHeap<Edge>((a: Edge, b: Edge) => a.weight - b.weight);
  heap.push({ from: 0, to: 0, weight: 0 });
  while (!heap.isEmpty()) {
    const edge = heap.pop()!;
    if (!visited[edge.to]) {
      visited[edge.to] = 1;
      mst.push(edge);
      for (const neighbor of graph.nodes[edge.to]) {
        if (!visited[neighbor.to]) {
          heap.push(neighbor);
        }
      }
    }
  }
  logTime("MST created in", start, performance.now());
  return mst;
};

const kruskal = (graph: Graph) => {
  const start = performance.now();
  const mst: Edge[] = [];
  const setId = Array.from({ length: graph.size }, (_, i) => i);
  const heap = new BinaryHeap<Edge>((a: Edge, b: Edge) => a.weight - b.weight);
  for (const nodes of graph.nodes) {
    heap.push(...nodes);
  }
  while (!heap.isEmpty()) {
    const edge = heap.pop()!;
    const setIdFrom = findSetId(edge.from, setId);
    const setIdTo = findSetId(edge.to, setId);
    if (setIdFrom !== setIdTo) {
      mst.push(edge);
      setId[setIdFrom] = setIdTo;
    }
  }
  logTime("MST created in", start, performance.now());
  return mst;
};

const nearestNeighbour = (graph: Graph) => {
  const start = performance.now();
  const visited = new Uint8Array(graph.size);
  let currentNode = 0;
  const path: Edge[] = [];
  visited[0] = 1;
  for (let i = 1; i < graph.size; i++) {
    let nextEdge: Edge | null = null;
    let minWeight = Infinity;
    for (const edge of graph.nodes[currentNode]) {
      if (!visited[edge.to] && edge.weight < minWeight) {
        minWeight = edge.weight;
        nextEdge = edge;
      }
    }
    if (nextEdge !== null) {
      visited[nextEdge.to] = 1;
      path.push(nextEdge);
      currentNode = nextEdge.to;
    }
  }
  for (const edge of graph.nodes[currentNode]) {
    if (edge.to === 0) {
      path.push(edge);
      break;
    }
  }
  logTime("Optimal path found in", start, performance.now());
  return path;
};

const doubleTree = (graph: Graph) => {
  const start = performance.now();
  const mst = kruskal(graph);
  const doubleMst: Edge[] = [];
  for (const edge of mst) {
    doubleMst.push(edge);
    doubleMst.push({ from: edge.to, to: edge.from, weight: edge.weight });
  }
  const tour = eulerTour(graph, doubleMst);
  const visited = new Uint8Array(graph.size);
  const path: Edge[] = [];
  let currentNode = 0;
  for (const edge of tour) {
    if (!visited[edge.to]) {
      visited[edge.to] = 1;
      path.push(edge);
      currentNode = edge.to;
    }
  }
  for (const edge of graph.nodes[currentNode]) {
    if (edge.to === 0) {
      path.push(edge);
      break;
    }
  }
  logTime("Optimal path found in", start, performance.now());
  return path;
};

const bruteForce = (graph: Graph) => {
  const start = performance.now();
  const nodes = Array.from({ length: graph.size }, (_, i) => i);
  let minCost = Infinity;
  let minPath: Edge[] = [];
  const permutations = permute(nodes.slice(1));
  for (const perm of permutations) {
    const path = [nodes[0], ...perm, nodes[0]];
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const edge = graph.nodes[path[i]].find(
        (edge: Edge) => edge.to === path[i + 1]
      )!;
      cost += edge.weight;
    }
    if (cost < minCost) {
      minCost = cost;
      minPath = path
        .map((n, i) => ({
          from: n,
          to: path[i + 1],
          weight:
            graph.nodes[n].find((edge: Edge) => edge.to === path[i + 1])
              ?.weight || 0,
        }))
        .slice(0, -1);
    }
  }
  logTime("Optimal path found in", start, performance.now());
  return minPath;
};

const branchAndBound = (graph: Graph) => {
  const start = performance.now();
  let bestTour: Edge[] = [];
  let bestTourWeight = Infinity;
  const queue = new BinaryHeap<PartialTour>(
    (a: PartialTour, b: PartialTour) => a.lowerBound - b.lowerBound
  );
  queue.push({ path: [0], lowerBound: 0 });
  while (!queue.isEmpty()) {
    const { path, lowerBound } = queue.pop()!;
    if (path.length === graph.size) {
      const tourWeight = getTourWeight(graph, path.concat(0));
      if (tourWeight < bestTourWeight) {
        bestTour = pathToEdges(graph, path.concat(0));
        bestTourWeight = tourWeight;
      }
    } else {
      for (const edge of graph.nodes[path[path.length - 1]]) {
        if (!path.includes(edge.to)) {
          const newPath = path.concat(edge.to);
          const newLowerBound = lowerBound + edge.weight;
          if (newLowerBound < bestTourWeight) {
            queue.push({ path: newPath, lowerBound: newLowerBound });
          }
        }
      }
    }
  }
  logTime("Optimal path found in", start, performance.now());
  return bestTour;
};

export {
  subGraphs,
  prim,
  kruskal,
  nearestNeighbour,
  doubleTree,
  bruteForce,
  branchAndBound,
};
