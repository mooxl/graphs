import { Graph } from "./graph.ts";

const graph = new Graph("ganzGross");

console.log(graph.subGraphs.length);

Deno.bench("subGraphs", () => {
  const graph = new Graph("gross").subGraphs;
});
