import { format } from "duration";
import { colors } from "cliffy";
import { Graph } from "./graph.ts";
import { Edge } from "./types.ts";
import { balanced } from "./main.ts";

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
    for (const edge of graph.nodes[node].edges!) {
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
      return balanced ? edge.capacity! : edge.weight;
    }
  }
  return 0;
};

const createSuperSourceSinkGraph = (graph: Graph) => {
  const newGraph = structuredClone(graph);
  const superSource = newGraph.size;
  const superSink = newGraph.size + 1;
  newGraph.nodes.push({ balance: 0, edges: [] }, { balance: 0, edges: [] });
  for (let i = 0; i < newGraph.size; i++) {
    const node = newGraph.nodes[i];
    if (node.balance > 0) {
      newGraph.nodes[superSource].edges.push({
        from: superSource,
        to: i,
        weight: 0,
        capacity: node.balance,
        flow: 0,
      });
      newGraph.nodes[superSource].balance += node.balance;
      node.balance = 0;
    } else if (node.balance < 0) {
      newGraph.nodes[i].edges.push({
        from: i,
        to: superSink,
        weight: 0,
        capacity: -node.balance,
        flow: 0,
      });
      newGraph.nodes[superSink].balance += node.balance;
      node.balance = 0;
    }
  }
  newGraph.size += 2;
  return newGraph;
};

const addFlow = (originalGraph: Graph, bFlowGraph: Graph) => {
  const newGraph: Graph = structuredClone(originalGraph);
  for (let i = 0; i < newGraph.size; i++) {
    for (let j = 0; j < newGraph.nodes[i].edges.length; j++) {
      const edge = newGraph.nodes[i].edges[j];
      const bFlowEdge = bFlowGraph.nodes[i].edges[j];
      edge.flow = bFlowEdge.flow;
    }
  }
  return newGraph;
};

const createResidualGraph = (bFlowGraph: Graph) => {
  const residualGraph = structuredClone(bFlowGraph) as Graph;
  for (let i = 0; i < residualGraph.size; i++) {
    const node = residualGraph.nodes[i];
    for (const edge of node.edges) {
      if (edge.flow! > 0) {
        const reverseEdge = {
          from: edge.to,
          to: edge.from,
          weight: -edge.weight,
          capacity: edge.flow,
          flow: 0,
        };
        residualGraph.nodes[edge.to].edges.push(reverseEdge);
      }
      edge.capacity! -= edge.flow!;
      edge.flow = 0;
    }
    node.edges = node.edges.filter((edge) => edge.capacity! > 0);
  }
  return residualGraph;
};

const adjustBFlowAlongCycle = (bFlowGraph: Graph, cycle: number[]) => {
  let minCapacity = Infinity;
  for (let i = 0; i < cycle.length - 1; i++) {
    const from = cycle[i];
    const to = cycle[i + 1];
    const edge = bFlowGraph.nodes[from].edges.find((edge) => edge.to === to);
    if (edge && edge.capacity! < minCapacity) {
      minCapacity = edge.capacity!;
    }
  }
  for (let i = 0; i < cycle.length - 1; i++) {
    const from = cycle[i];
    const to = cycle[i + 1];
    const edge = bFlowGraph.nodes[from].edges.find((edge) => edge.to === to);
    if (edge) {
      edge.flow! += minCapacity;
    }
    const reverseEdge = bFlowGraph.nodes[to].edges.find(
      (edge) => edge.to === from
    );
    if (reverseEdge) {
      reverseEdge.flow! -= minCapacity;
    }
  }
  return bFlowGraph;
};

const calculateMinimalCost = (bFlowGraph: Graph) => {
  let minimalCost = 0;
  for (const node of bFlowGraph.nodes) {
    for (const edge of node.edges) {
      minimalCost += edge.weight * edge.flow!;
    }
  }
  return minimalCost;
};

const adjustInitialFlow = (graph: Graph) => {
  const newGraph = structuredClone(graph);
  for (const node of newGraph.nodes) {
    node.balance = 0;
    for (const edge of node.edges) {
      if (edge.weight < 0) {
        edge.flow = edge.capacity;
      }
    }
  }
  for (const node of newGraph.nodes) {
    for (const edge of node.edges) {
      newGraph.nodes[edge.to].balance += edge.flow!;
      newGraph.nodes[edge.from].balance -= edge.flow!;
    }
  }
  return newGraph;
};

const findSourceAndSink = (residualGraph: Graph, originalGraph: Graph) => {
  let source = null;
  let sink = null;
  for (let i = 0; i < residualGraph.size; i++) {
    const balanceDifference =
      originalGraph.nodes[i].balance - residualGraph.nodes[i].balance;
    if (balanceDifference > 0) {
      if (
        source === null ||
        balanceDifference >
          originalGraph.nodes[source].balance -
            residualGraph.nodes[source].balance
      ) {
        source = i;
      }
    } else if (balanceDifference < 0) {
      if (
        sink === null ||
        balanceDifference <
          originalGraph.nodes[sink].balance - residualGraph.nodes[sink].balance
      ) {
        sink = i;
      }
    }
  }
  return { source, sink };
};
const adjustFlowAlongPath = (
  graph: Graph,
  path: number[],
  source: number,
  sink: number,
  originalGraph: Graph
) => {
  let minResidualCapacity = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = graph.nodes[from].edges.find((edge) => edge.to === to);
    if (edge && edge.capacity! < minResidualCapacity) {
      minResidualCapacity = edge.capacity!;
    }
  }
  const sourceBalanceDifference =
    originalGraph.nodes[source].balance - graph.nodes[source].balance;
  const sinkBalanceDifference =
    graph.nodes[sink].balance - originalGraph.nodes[sink].balance;
  const flowAdjustment = Math.min(
    minResidualCapacity,
    sourceBalanceDifference,
    sinkBalanceDifference
  );
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const edge = graph.nodes[from].edges.find((edge) => edge.to === to);
    if (edge) {
      edge.flow! += flowAdjustment;
    }
    const reverseEdge = graph.nodes[to].edges.find((edge) => edge.to === from);
    if (reverseEdge) {
      reverseEdge.flow! -= flowAdjustment;
    }
  }
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
  createSuperSourceSinkGraph,
  addFlow,
  createResidualGraph,
  adjustBFlowAlongCycle,
  calculateMinimalCost,
  adjustInitialFlow,
  findSourceAndSink,
  adjustFlowAlongPath,
  logWeight,
};
