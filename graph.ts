import { format } from "duration";
import { colors } from "cliffy";
import { BinaryHeap } from "collections/binary_heap.ts";

type Edge = { from: number; to: number; weight: number };

type PartialTour = {
  path: number[];
  lowerBound: number;
};
export class Graph {
  size: number;
  nodes: Edge[][];

  constructor(graph: string) {
    const start = performance.now();
    const lines = Deno.readTextFileSync(`./graphs/${graph}.txt`).split("\r\n");
    this.size = +lines.shift()!;
    this.nodes = Array.from({ length: this.size }, () => []);
    for (const line of lines) {
      const [from, to, weight] = line.split("\t").map((value) => +value);
      this.nodes[from].push({ from, to, weight });
      this.nodes[to]!.push({ from: to, to: from, weight });
    }
    this.logTime("Graph built in", start, performance.now());
  }

  get subGraphs() {
    const start = performance.now();
    const visited = new Uint8Array(this.size);
    const subgraphs: number[][] = [];
    for (let i = 0; i < this.size; i++) {
      if (!visited[i]) {
        visited[i] = 1;
        subgraphs.push(this.dfs(i, visited));
      }
    }
    this.logTime("Subgraphs created in", start, performance.now());
    return subgraphs;
  }

  get prim() {
    const start = performance.now();
    const visited = new Uint8Array(this.size);
    const mst: Edge[] = [];
    const heap = new BinaryHeap<Edge>((a, b) => a.weight - b.weight);
    heap.push({ from: 0, to: 0, weight: 0 });
    while (!heap.isEmpty()) {
      const edge = heap.pop()!;
      if (!visited[edge.to]) {
        visited[edge.to] = 1;
        mst.push(edge);
        for (const neighbor of this.nodes[edge.to]) {
          if (!visited[neighbor.to]) {
            heap.push(neighbor);
          }
        }
      }
    }
    this.logTime("MST created in", start, performance.now());
    return mst;
  }

  get kruskal() {
    const start = performance.now();
    const mst: Edge[] = [];
    const setId = Array.from({ length: this.size }, (_, i) => i);
    const heap = new BinaryHeap<Edge>((a, b) => a.weight - b.weight);
    for (const nodes of this.nodes) {
      heap.push(...nodes);
    }
    while (!heap.isEmpty()) {
      const edge = heap.pop()!;
      const setIdFrom = this.findSetId(edge.from, setId);
      const setIdTo = this.findSetId(edge.to, setId);
      if (setIdFrom !== setIdTo) {
        mst.push(edge);
        setId[setIdFrom] = setIdTo;
      }
    }
    this.logTime("MST created in", start, performance.now());
    return mst;
  }

  private findSetId(node: number, setId: number[]) {
    if (node !== setId[node]) {
      setId[node] = this.findSetId(setId[node], setId);
    }
    return setId[node];
  }

  get nearestNeighbor() {
    const start = performance.now();
    const visited = new Uint8Array(this.size);
    const path: Edge[] = [];
    visited[0] = 1;
    while (visited.includes(0)) {
      let nearestNeighbor: Edge | undefined;
      for (const edge of this.nodes[path[path.length - 1]?.to || 0]) {
        if (!visited[edge.to]) {
          if (!nearestNeighbor || edge.weight < nearestNeighbor.weight) {
            nearestNeighbor = edge;
          }
        }
      }
      path.push(nearestNeighbor!);
      visited[nearestNeighbor!.to] = 1;
    }
    path.push(
      this.nodes[path[path.length - 1].to].find(
        (edge) => edge.to === path[0].from
      )!
    );
    this.logTime("Path created in", start, performance.now());
    return path;
  }

  get tsp() {
    const start = performance.now();
    const nodes = Array.from({ length: this.size }, (_, i) => i);
    let minCost = Infinity;
    let minPath: Edge[] = [];
    const permutations = this.permute(nodes.slice(1));
    for (const perm of permutations) {
      const path = [nodes[0], ...perm, nodes[0]];
      let cost = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const edge = this.nodes[path[i]].find((e) => e.to === path[i + 1])!;
        cost += edge.weight;
      }
      if (cost < minCost) {
        minCost = cost;
        minPath = path
          .map((n, i) => ({
            from: n,
            to: path[i + 1],
            weight:
              this.nodes[n].find((e) => e.to === path[i + 1])?.weight || 0,
          }))
          .slice(0, -1);
      }
    }
    this.logTime("Optimal path found in", start, performance.now());
    return minPath;
  }

  private permute(nodes: number[]): number[][] {
    const result: number[][] = [];
    const counters = new Array(nodes.length).fill(0);
    result.push([...nodes]);
    let i = 0;
    while (i < nodes.length) {
      if (counters[i] < i) {
        if (i % 2 === 0) {
          [nodes[0], nodes[i]] = [nodes[i], nodes[0]];
        } else {
          [nodes[counters[i]], nodes[i]] = [nodes[i], nodes[counters[i]]];
        }
        result.push([...nodes]);
        counters[i]++;
        i = 0;
      } else {
        counters[i] = 0;
        i++;
      }
    }
    return result;
  }

  private dfs(start: number, visited: Uint8Array) {
    const stack = [start];
    const subgraph = [];
    while (stack.length) {
      const node = stack.pop()!;
      visited[node] = 1;
      subgraph.push(node);
      for (const edge of this.nodes[node]!) {
        if (!visited[edge.to]) {
          visited[edge.to] = 1;
          stack.push(edge.to);
        }
      }
    }
    return subgraph;
  }

  private logTime(text: string, start: number, end: number) {
    console.log(
      `${text} ${colors.magenta(format(end - start, { ignoreZero: true }))}`
    );
  }
}
