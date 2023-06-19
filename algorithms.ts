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
  bfs,
  residualCapacity,
  createSuperSourceSinkGraph,
  addFlow,
  createResidualGraph,
  adjustBFlowAlongCycle,
  calculateMinimalCost,
} from "./utilities.ts";
import { balanced } from "./main.ts";

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
      for (const neighbor of graph.nodes[edge.to].edges) {
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
    heap.push(...nodes.edges);
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
    for (const edge of graph.nodes[currentNode].edges) {
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
  for (const edge of graph.nodes[currentNode].edges) {
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
  for (const edge of graph.nodes[currentNode].edges) {
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
      const edge = graph.nodes[path[i]].edges.find(
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
            graph.nodes[n].edges.find((edge: Edge) => edge.to === path[i + 1])
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
      for (const edge of graph.nodes[path[path.length - 1]].edges) {
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

const dijkstra = (graph: Graph, startNode: number) => {
  const start = performance.now();
  const distances = Array(graph.size).fill(Infinity);
  distances[startNode] = 0;
  const visited = new Uint8Array(graph.size);
  const heap = new BinaryHeap<Edge>((a: Edge, b: Edge) => a.weight - b.weight);
  heap.push({ from: startNode, to: startNode, weight: 0 });
  while (!heap.isEmpty()) {
    const { to } = heap.pop()!;
    if (visited[to]) continue;
    visited[to] = 1;
    for (const neighbor of graph.nodes[to].edges) {
      if (!visited[neighbor.to]) {
        const newDistance = distances[to] + neighbor.weight;
        if (newDistance < distances[neighbor.to]) {
          distances[neighbor.to] = newDistance;
          heap.push({ from: to, to: neighbor.to, weight: newDistance });
        }
      }
    }
  }
  logTime("Dijkstra finished in", start, performance.now());
  return distances;
};

const bellmanFord = (graph: Graph, startNode: number) => {
  const start = performance.now();
  const distances = Array(graph.size).fill(Infinity);
  const predecessors = Array(graph.size).fill(-1);
  distances[startNode] = 0;
  for (let i = 0; i < graph.size - 1; i++) {
    for (let j = 0; j < graph.size; j++) {
      for (const edge of graph.nodes[j].edges) {
        const newDistance = distances[edge.from] + edge.weight;
        if (newDistance < distances[edge.to]) {
          distances[edge.to] = newDistance;
          predecessors[edge.to] = edge.from; // Aktualisiere das predecessors Array
        }
      }
    }
  }
  for (let j = 0; j < graph.size; j++) {
    for (const edge of graph.nodes[j].edges) {
      const newDistance = distances[edge.from] + edge.weight;
      if (newDistance < distances[edge.to]) {
        const negativeCycle = [];
        let currentNode = edge.to;
        for (let i = 0; i < graph.size; i++) {
          currentNode = predecessors[currentNode];
        }
        let cycleNode = currentNode;
        do {
          negativeCycle.push(cycleNode);
          cycleNode = predecessors[cycleNode];
        } while (cycleNode !== currentNode);
        negativeCycle.push(cycleNode);
        return { nodes: negativeCycle.reverse(), negative: true };
      }
    }
  }
  logTime("Bellman-Ford finished in", start, performance.now());
  return { nodes: distances, negative: false };
};

const edmondsKarp = (graph: Graph, source: number, sink: number) => {
  const start = performance.now();
  const newGraph: Graph = structuredClone(graph);
  const parents = new Array(graph.size).fill(-1);
  let maxFlow = 0;
  while (bfs(newGraph, source, sink, parents)) {
    let pathFlow = Infinity;
    for (let v = sink; v !== source; v = parents[v]) {
      const u = parents[v];
      pathFlow = Math.min(pathFlow, residualCapacity(newGraph, u, v));
    }
    for (let v = sink; v !== source; v = parents[v]) {
      const u = parents[v];
      const forwardEdge = newGraph.nodes[u].edges.find((edge) => edge.to === v);
      const backwardEdge = newGraph.nodes[v].edges.find(
        (edge) => edge.to === u
      );
      if (forwardEdge) {
        balanced
          ? (forwardEdge.capacity! -= pathFlow)
          : (forwardEdge.weight -= pathFlow);
        forwardEdge.flow! += pathFlow;
      }
      backwardEdge
        ? (balanced
            ? (backwardEdge.capacity! -= pathFlow)
            : (backwardEdge.weight -= pathFlow),
          (backwardEdge.flow! -= pathFlow))
        : newGraph.nodes[v].edges.push({
            from: v,
            to: u,
            weight: pathFlow,
            capacity: pathFlow,
            flow: pathFlow,
          });
    }
    maxFlow += pathFlow;
  }
  logTime("Edmonds-Karp finished in", start, performance.now());

  return { maxFlow, newGraph };
};

const cycleCanceling = (graph: Graph) => {
  const start = performance.now();
  const newGraph = structuredClone(graph) as Graph;
  const superGraph = createSuperSourceSinkGraph(newGraph);
  const { newGraph: superBFlowGraph, maxFlow } = edmondsKarp(
    superGraph,
    superGraph.size - 2,
    superGraph.size - 1
  );
  const superSourceBalance = superBFlowGraph.nodes[superGraph.size - 2].balance;
  const superSinkBalance = -superBFlowGraph.nodes[superGraph.size - 1].balance;
  if (
    maxFlow !== superSourceBalance ||
    maxFlow !== superSinkBalance ||
    superSourceBalance !== superSinkBalance
  ) {
    console.log("No flow found");
    return;
  }
  let bFlowGraph = addFlow(graph, superBFlowGraph);
  while (true) {
    const residualGraph = createResidualGraph(bFlowGraph);
    const { nodes: negativeCycle, negative } = bellmanFord(residualGraph, 0);
    if (!negative) {
      const minimalCost = calculateMinimalCost(bFlowGraph);
      logTime("Cycle-Canceling finished in", start, performance.now());
      return minimalCost;
    }
    bFlowGraph = adjustBFlowAlongCycle(bFlowGraph, negativeCycle);
  }
};

const successiveShortestPath = (graph: Graph) => {
  return 0;
};

export {
  subGraphs,
  prim,
  kruskal,
  nearestNeighbour,
  doubleTree,
  bruteForce,
  branchAndBound,
  dijkstra,
  bellmanFord,
  edmondsKarp,
  cycleCanceling,
  successiveShortestPath,
};
