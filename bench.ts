import { Graph } from "./graph.ts";

Deno.bench("building 1", () => {
  new Graph("1", false);
});
Deno.bench("building 2", () => {
  new Graph("2", false);
});
Deno.bench("building 3", () => {
  new Graph("3", false);
});
Deno.bench("building gross", () => {
  new Graph("gross", false);
});
Deno.bench("building ganzGross", () => {
  new Graph("ganzGross", false);
});
Deno.bench("building ganzGanzGross", () => {
  new Graph("ganzGanzGross", false);
});
const one = new Graph("1", false);
const two = new Graph("2", false);
const three = new Graph("3", false);
const gross = new Graph("gross", false);
const ganzGross = new Graph("ganzGross", false);
const ganzGanzGross = new Graph("ganzGanzGross", false);
Deno.bench("subgraph 1", () => {
  one.subGraphs;
});
Deno.bench("subgraph 2", () => {
  two.subGraphs;
});
Deno.bench("subgraph 3", () => {
  three.subGraphs;
});
Deno.bench("subgraph gross", () => {
  gross.subGraphs;
});
Deno.bench("subgraph ganzGross", () => {
  ganzGross.subGraphs;
});
Deno.bench("subgraph ganzGanzGross", () => {
  ganzGanzGross.subGraphs;
});
