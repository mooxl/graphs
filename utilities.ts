import { format } from "duration";
import { colors } from "cliffy";
import { Graph } from "./graph.ts";
import { Edge } from "./types.ts";

const getTourWeight = (graph: Graph, path: number[]) => {
  let weight = 0;
  for (let i = 1; i < path.length; i++) {
    const edge = graph.nodes[path[i - 1]].edges.find(
      (edge: Edge) => edge.to === path[i]
    )!;
    weight += edge.weight;
  }
  return weight;
};

const pathToEdges = (graph: Graph, path: number[]) => {
  const edges: Edge[] = [];
  for (let i = 1; i < path.length; i++) {
    const edge = graph.nodes[path[i - 1]].edges.find(
      (edge: Edge) => edge.to === path[i]
    )!;
    edges.push(edge);
  }
  return edges;
};

const permute = function* (nodes: number[], start = 0): Generator<number[]> {
  if (start >= nodes.length) {
    yield nodes;
  } else {
    for (let i = start; i < nodes.length; i++) {
      [nodes[start], nodes[i]] = [nodes[i], nodes[start]];
      yield* permute(nodes, start + 1);
      [nodes[start], nodes[i]] = [nodes[i], nodes[start]];
    }
  }
};

const eulerTour = (graph: Graph, edges: Edge[]) => {
  const visited = new Uint8Array(graph.size);
  const stack = [0];
  const tour: Edge[] = [];
  while (stack.length) {
    const currentNode = stack.pop()!;
    for (const edge of edges) {
      if (edge.from === currentNode && !visited[edge.to]) {
        visited[edge.to] = 1;
        stack.push(edge.to);
        tour.push(edge);
      }
    }
  }
  return tour;
};

const findSetId = (node: number, setId: number[]) => {
  if (node !== setId[node]) {
    setId[node] = findSetId(setId[node], setId);
  }
  return setId[node];
};

const dfs = (graph: Graph, start: number, visited: Uint8Array) => {
  const stack = [start];
  const subgraph = [];
  while (stack.length) {
    const node = stack.pop()!;
    visited[node] = 1;
    subgraph.push(node);
    for (const edge of graph.nodes[node]!.edges) {
      if (!visited[edge.to]) {
        visited[edge.to] = 1;
        stack.push(edge.to);
      }
    }
  }
  return subgraph;
};

const bfs = (
  graph: Graph,
  start: number,
  end: number,
  parents: number[]
): boolean => {
  const visited = new Uint8Array(graph.size);
  const queue: number[] = [];
  queue.push(start);
  visited[start] = 1;
  while (queue.length) {
    const node = queue.shift()!;
    for (const edge of graph.nodes[node].edges) {
      if (!visited[edge.to] && residualCapacity(graph, node, edge.to) > 0) {
        queue.push(edge.to);
        visited[edge.to] = 1;
        parents[edge.to] = node;
        if (edge.to === end) return true;
      }
    }
  }
  return false;
};

const residualCapacity = (graph: Graph, from: number, to: number) => {
  for (const edge of graph.nodes[from].edges) {
    if (edge.to === to) {
      return edge.weight;
    }
  }
  return 0;
};

const logTime = (text: string, start: number, end: number) => {
  console.log(
    `${text} ${colors.magenta(format(end - start, { ignoreZero: true }))}`
  );
};

const logWeight = (edges: Edge[]) => {
  let weight = 0;
  for (const edge of edges) {
    weight += edge.weight;
  }
  return colors.cyan(weight.toFixed(2));
};

export {
  logTime,
  dfs,
  permute,
  findSetId,
  eulerTour,
  pathToEdges,
  getTourWeight,
  bfs,
  residualCapacity,
  logWeight,
};
