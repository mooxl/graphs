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
  generateMaxFlow,
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
  heap.push({ from: 0, to: 0, weight: 0, capacity: 0, flow: 0 });
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
    doubleMst.push({
      from: edge.to,
      to: edge.from,
      weight: edge.weight,
      capacity: 0,
      flow: 0,
    });
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
          capacity: 0,
          flow: 0,
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
  heap.push({
    from: startNode,
    to: startNode,
    weight: 0,
    capacity: 0,
    flow: 0,
  });
  while (!heap.isEmpty()) {
    const { to } = heap.pop()!;
    if (visited[to]) continue;
    visited[to] = 1;
    for (const neighbor of graph.nodes[to].edges) {
      if (!visited[neighbor.to]) {
        const newDistance = distances[to] + neighbor.weight;
        if (newDistance < distances[neighbor.to]) {
          distances[neighbor.to] = newDistance;
          heap.push({
            from: to,
            to: neighbor.to,
            weight: newDistance,
            capacity: 0,
            flow: 0,
          });
        }
      }
    }
  }
  logTime("Dijkstra finished in", start, performance.now());
  return distances;
};

const bellmanFord = (graph: Graph, startNode: number) => {
  const start = performance.now();
  const distances: number[] = Array(graph.size).fill(Infinity);
  const predecessors = Array(graph.size).fill(-1);
  distances[startNode] = 0;
  for (let i = 0; i < graph.size - 1; i++) {
    for (let j = 0; j < graph.size; j++) {
      for (const edge of graph.nodes[j].edges) {
        const newDistance = distances[edge.from] + edge.weight;
        if (newDistance < distances[edge.to]) {
          distances[edge.to] = newDistance;
          predecessors[edge.to] = edge.from;
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
  const flowGraph: Graph = structuredClone(graph);
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
      const forwardEdgeFlowGraph = flowGraph.nodes[u].edges.find(
        (edge) => edge.to === v
      );
      const backwardEdge = newGraph.nodes[v].edges.find(
        (edge) => edge.to === u
      );
      if (forwardEdge) {
        forwardEdge.capacity -= pathFlow;
        forwardEdge.flow += pathFlow;
        if (forwardEdgeFlowGraph) {
          forwardEdgeFlowGraph.flow += pathFlow;
        }
      }
      if (backwardEdge) {
        backwardEdge.capacity -= pathFlow;
        backwardEdge.flow += pathFlow;
      } else {
        newGraph.nodes[v].edges.push({
          from: v,
          to: u,
          weight: 0,
          capacity: pathFlow,
          flow: -pathFlow,
        });
      }
    }
    maxFlow += pathFlow;
  }
  if (
    flowGraph.nodes[source].balance + flowGraph.nodes[sink].balance !== 0 ||
    flowGraph.nodes[source].edges.reduce(
      (acc, edge) => acc - edge.flow,
      flowGraph.nodes[source].balance
    ) !== 0
  ) {
    throw new Error("No possible b-flow found");
  }
  logTime("Edmonds-Karp finished in", start, performance.now());
  return { maxFlow, flowGraph };
};

const cycleCanceling = (graph: Graph) => {
  // Generate an initial b-flow.
  const { flowGraph } = generateMaxFlow(graph);

  while (true) {
    // Generate the residual graph.
    const residualGraph: Graph = structuredClone(flowGraph);
    for (let i = 0; i < flowGraph.size; i++) {
      for (const edge of flowGraph.nodes[i].edges) {
        // Add the residual capacity of the edge to the residual graph.
        const residualEdge = residualGraph.nodes[edge.from].edges.find(
          (e) => e.to === edge.to
        );
        if (residualEdge) {
          residualEdge.capacity = edge.capacity - edge.flow;
        } else {
          residualGraph.nodes[edge.from].edges.push({
            from: edge.from,
            to: edge.to,
            weight: edge.weight,
            capacity: edge.capacity - edge.flow,
            flow: 0,
          });
        }

        // Add the reverse edge to the residual graph with flow as capacity.
        const reverseEdge = residualGraph.nodes[edge.to].edges.find(
          (e) => e.to === edge.from
        );
        if (reverseEdge) {
          reverseEdge.capacity = edge.flow;
        } else {
          residualGraph.nodes[edge.to].edges.push({
            from: edge.to,
            to: edge.from,
            weight: -edge.weight,
            capacity: edge.flow,
            flow: 0,
          });
        }
      }
    }
    console.log(residualGraph);
    // Find a negative cycle using Bellman-Ford on the residual graph.
    const { nodes, negative } = bellmanFord(residualGraph, 0);

    // If no negative cycle was found, we are done.
    if (!negative) {
      break;
    }

    // Find the minimum residual capacity over the edges of the cycle.
    let minResidual = Infinity;
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];

      const edge = residualGraph.nodes[from].edges.find(
        (edge) => edge.to === to
      )!;
      if (edge.capacity < minResidual) {
        minResidual = edge.capacity;
      }
    }

    // Augment the flow along the cycle in the original graph.
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];

      const edge = flowGraph.nodes[from].edges.find((edge) => edge.to === to)!;
      edge.flow += minResidual;

      // Decrease the flow of the reverse edge if it exists.
      const reverseEdge = flowGraph.nodes[to].edges.find(
        (edge) => edge.to === from
      );
      if (reverseEdge) {
        reverseEdge.flow -= minResidual;
      }
    }
  }

  return { flowGraph };
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
};
