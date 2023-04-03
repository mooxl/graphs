import { Select, Toggle, colors } from "cliffy";
import { Graph } from "./graph.ts";

export const verbose = await Toggle.prompt("Verbose?");

const graph = new Graph(
  await Select.prompt({
    message: "Choose a graph",
    options: ["1", "2", "3", "gross", "ganzGross", "ganzGanzGross"],
  })
);

while (true) {
  const command = await Select.prompt({
    message: "What do you want to see?",
    options: [
      { name: "Size of graph", value: "graphSize" },
      {
        name: "List of nodes",
        value: "graphNodes",
      },
      Select.separator("---------"),
      { name: "Size of subgraphs", value: "subgraphsSize" },
      { name: "List of subgraphs", value: "subgraphsNodes" },
    ],
  });
  switch (command) {
    case "graphSize":
      console.log(
        `The graph has ${colors.magenta(graph.size.toString())} nodes`
      );
      break;
    case "graphNodes":
      console.log(graph.nodes);
      break;
    case "subgraphsSize":
      console.log(
        `The graph has ${colors.magenta(
          graph.subGraphs.length.toString()
        )} subgraphs`
      );
      break;
    case "subgraphsNodes":
      console.log(graph.subGraphs);
      break;
  }
}
