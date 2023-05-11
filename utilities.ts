import { format } from "duration";
import { colors } from "cliffy";
import { Graph } from "./graph.ts";
import { Edge } from "./types.ts";

const getTourWeight = (graph: Graph, path: number[]) => {
  let weight = 0;
  for (let i = 1; i < path.length; i++) {
    const edge = graph.nodes[path[i - 1]].find(
      (edge: Edge) => edge.to === path[i]
    )!;
    weight += edge.weight;
  }
  return weight;
};

const pathToEdges = (graph: Graph, path: number[]) => {
  const edges: Edge[] = [];
  for (let i = 1; i < path.length; i++) {
    const edge = graph.nodes[path[i - 1]].find(
      (edge: Edge) => edge.to === path[i]
    )!;
    edges.push(edge);
  }
  return edges;
};

const permute = (nodes: number[]) => {
  if (nodes.length === 1) return [nodes];
  const result: number[][] = [];
  for (let i = 0; i < nodes.length; i++) {
    const first = nodes[i];
    const rest = [...nodes.slice(0, i), ...nodes.slice(i + 1)];
    const innerPermutations = permute(rest);

    for (let j = 0; j < innerPermutations.length; j++) {
      result.push([first, ...innerPermutations[j]]);
    }
  }
  return result;
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
    for (const edge of graph.nodes[node]!) {
      if (!visited[edge.to]) {
        visited[edge.to] = 1;
        stack.push(edge.to);
      }
    }
  }
  return subgraph;
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
  findSetId,
  eulerTour,
  permute,
  pathToEdges,
  getTourWeight,
  logWeight,
};
