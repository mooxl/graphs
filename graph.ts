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
  get nearestNeighbour() {
    const visited = new Uint8Array(this.size);
    let currentNode = 0;
    const path: Edge[] = [];
    visited[0] = 1;
    for (let i = 1; i < this.size; i++) {
      let nextEdge: Edge | null = null;
      let minWeight = Infinity;
      for (const edge of this.nodes[currentNode]) {
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
    for (const edge of this.nodes[currentNode]) {
      if (edge.to === 0) {
        path.push(edge);
        break;
      }
    }
    return path;
  }

  get doubleTree(): Edge[] {
    const mst = this.kruskal;
    const doubleMst: Edge[] = [];
    for (const edge of mst) {
      doubleMst.push(edge);
      doubleMst.push({ from: edge.to, to: edge.from, weight: edge.weight });
    }
    const eulerTour = this.eulerTour(doubleMst, 0);
    console.log(eulerTour);
    const visited = new Uint8Array(this.size);
    const path: Edge[] = [];
    let currentNode = 0;
    for (const edge of eulerTour) {
      if (!visited[edge.to]) {
        visited[edge.to] = 1;
        path.push(edge);
        currentNode = edge.to;
      }
    }
    for (const edge of this.nodes[currentNode]) {
      if (edge.to === 0) {
        path.push(edge);
        break;
      }
    }

    return path;
  }

  private eulerTour(edges: Edge[], start: number) {
    const visited = new Uint8Array(this.size);
    const stack = [start];
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
  }

  private findSetId(node: number, setId: number[]) {
    if (node !== setId[node]) {
      setId[node] = this.findSetId(setId[node], setId);
    }
    return setId[node];
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
