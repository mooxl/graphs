import { format } from "duration";
import { colors } from "cliffy";
import { Graph } from "./graph.ts";
import { Edge } from "./types.ts";
import { edmondsKarp } from "./algorithms.ts";

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
      return edge.capacity;
    }
  }
  return 0;
};

const generateMaxFlow = (graph: Graph) => {
  const newGraph: Graph = structuredClone(graph);
  newGraph.size += 2;
  newGraph.nodes.push({ balance: 0, edges: [] });
  newGraph.nodes.push({ balance: 0, edges: [] });
  const supersource = newGraph.size - 2;
  const supersink = newGraph.size - 1;
  const sourceNodes = [];
  const sinkNodes = [];
  for (let i = 0; i < newGraph.size - 2; i++) {
    if (newGraph.nodes[i].balance > 0) {
      sourceNodes.push(i);
    } else if (newGraph.nodes[i].balance < 0) {
      sinkNodes.push(i);
    }
  }
  for (const sourceNode of sourceNodes) {
    newGraph.nodes[supersource].edges.push({
      from: supersource,
      to: sourceNode,
      weight: 0,
      capacity: newGraph.nodes[sourceNode].balance,
      flow: 0,
    });
    newGraph.nodes[supersource].balance += newGraph.nodes[sourceNode].balance;
    newGraph.nodes[sourceNode].balance = 0;
  }
  for (const sinkNode of sinkNodes) {
    newGraph.nodes[sinkNode].edges.push({
      from: sinkNode,
      to: supersink,
      weight: 0,
      capacity: Math.abs(newGraph.nodes[sinkNode].balance),
      flow: 0,
    });
    newGraph.nodes[supersink].balance += newGraph.nodes[sinkNode].balance;
    newGraph.nodes[sinkNode].balance = 0;
  }
  const { flowGraph } = edmondsKarp(newGraph, supersource, supersink);
  flowGraph.nodes = flowGraph.nodes.map((node) => {
    node.edges = node.edges.filter(
      (edge) => edge.from !== supersource && edge.to !== supersink
    );
    return node;
  });
  flowGraph.nodes.splice(supersource, 1);
  flowGraph.nodes.splice(supersink - 1, 1);
  flowGraph.size -= 2;
  return { flowGraph, supersource, supersink };
};
const generateMaxFlowWithSuper = (graph: Graph) => {
  const newGraph: Graph = structuredClone(graph);
  newGraph.size += 2;
  newGraph.nodes.push({ balance: 0, edges: [] });
  newGraph.nodes.push({ balance: 0, edges: [] });
  const supersource = newGraph.size - 2;
  const supersink = newGraph.size - 1;
  const sourceNodes = [];
  const sinkNodes = [];
  for (let i = 0; i < newGraph.size - 2; i++) {
    if (newGraph.nodes[i].balance > 0) {
      sourceNodes.push(i);
    } else if (newGraph.nodes[i].balance < 0) {
      sinkNodes.push(i);
    }
  }
  for (const sourceNode of sourceNodes) {
    newGraph.nodes[supersource].edges.push({
      from: supersource,
      to: sourceNode,
      weight: 0,
      capacity: newGraph.nodes[sourceNode].balance,
      flow: 0,
    });
    newGraph.nodes[supersource].balance += newGraph.nodes[sourceNode].balance;
    newGraph.nodes[sourceNode].balance = 0;
  }
  for (const sinkNode of sinkNodes) {
    newGraph.nodes[sinkNode].edges.push({
      from: sinkNode,
      to: supersink,
      weight: 0,
      capacity: Math.abs(newGraph.nodes[sinkNode].balance),
      flow: 0,
    });
    newGraph.nodes[supersink].balance += newGraph.nodes[sinkNode].balance;
    newGraph.nodes[sinkNode].balance = 0;
  }
  const { flowGraph } = edmondsKarp(newGraph, supersource, supersink);

  return { flowGraph, supersource, supersink };
};

const generateResidualGraph = (graph: Graph) => {
  const residualGraph: Graph = structuredClone(graph);

  for (let i = 0; i < graph.size; i++) {
    for (const edge of graph.nodes[i].edges) {
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

  return residualGraph;
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
  generateResidualGraph,
  logWeight,
  generateMaxFlow,
  generateMaxFlowWithSuper,
};
