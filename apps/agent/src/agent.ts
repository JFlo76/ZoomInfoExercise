/**
 * This is the main entry point for the agent.
 * It defines the workflow graph, state, tools, nodes and edges.
 */

import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  convertActionsToDynamicStructuredTools,
  CopilotKitStateAnnotation,
} from "@copilotkit/sdk-js/langgraph";
import { Annotation } from "@langchain/langgraph";

// 1. Define our agent state, which includes CopilotKit state to
//    provide actions to the state.
const AgentStateAnnotation = Annotation.Root({
  ...CopilotKitStateAnnotation.spec, // CopilotKit state annotation already includes messages, as well as frontend tools
  proverbs: Annotation<string[]>,
});

// 2. Define the type for our agent state
export type AgentState = typeof AgentStateAnnotation.State;

// 3. Define a simple tool to get the weather statically
const getWeather = tool(
  (args) => {
    return `The weather for ${args.location} is 70 degrees, clear skies, 45% humidity, 5 mph wind, and feels like 72 degrees.`;
  },
  {
    name: "getWeather",
    description: "Get the weather for a given location.",
    schema: z.object({
      location: z.string().describe("The location to get weather for"),
    }),
  },
);

// 3.2 Define a tool for data visualization
const showDataVisualization = tool(
  (args) => {
    return `Generated data visualization: ${args.title} with ${args.items?.length || 0} data points.`;
  },
  {
    name: "showDataVisualization",
    description: "Display data in a visual format like charts or tables.",
    schema: z.object({
      title: z.string().describe("Title for the data visualization"),
      items: z.array(z.object({
        label: z.string(),
        value: z.string(),
      })).optional().describe("Array of data items to visualize"),
    }),
  },
);

// 3.3 Define a tool for interactive forms
const createInteractiveForm = tool(
  (args) => {
    return `Created interactive form: ${args.title}`;
  },
  {
    name: "createInteractiveForm",
    description: "Create an interactive form with inputs and buttons.",
    schema: z.object({
      title: z.string().describe("Title for the form"),
      description: z.string().optional().describe("Description text for the form"),
      fields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        placeholder: z.string().optional(),
      })).optional().describe("Form fields configuration"),
    }),
  },
);

// 4. Put our tools into an array
const tools = [getWeather, showDataVisualization, createInteractiveForm];

// 5. Define the chat node, which will handle the chat logic
async function chat_node(state: AgentState, config: RunnableConfig) {
  // 5.1 Define the model, lower temperature for deterministic responses
  const model = new ChatOpenAI({ temperature: 0, model: "gpt-4o" });

  // 5.2 Bind the tools to the model, include CopilotKit actions. This allows
  //     the model to call tools that are defined in CopilotKit by the frontend.
  const modelWithTools = model.bindTools!([
    ...convertActionsToDynamicStructuredTools(state.copilotkit?.actions ?? []),
    ...tools,
  ]);

  // 5.3 Define the system message, which will be used to guide the model, in this case
  //     we also add in the language to use from the state.
  const systemMessage = new SystemMessage({
    content: `You are a helpful assistant that can generate interactive UI components. 

Current proverbs: ${JSON.stringify(state.proverbs)}

Available tools for creating visual experiences:
- getWeather: Get weather information and display it in a beautiful weather card
- showDataVisualization: Create charts and tables for data presentation
- createInteractiveForm: Build forms for user input

When users ask for weather, data, or forms, use the appropriate tools. The UI components will be automatically rendered with beautiful styling inspired by Open-JSON-UI design principles.

Example usage:
- "What's the weather in SF?" -> Use getWeather
- "Show me sales data" -> Use showDataVisualization with sample data
- "Create a contact form" -> Use createInteractiveForm`,
  });

  // 5.4 Invoke the model with the system message and the messages in the state
  const response = await modelWithTools.invoke(
    [systemMessage, ...state.messages],
    config,
  );

  // 5.5 Return the response, which will be added to the state
  return {
    messages: response,
  };
}

// 6. Define the function that determines whether to continue or not,
//    this is used to determine the next node to run
function shouldContinue({ messages, copilotkit }: AgentState) {
  // 6.1 Get the last message from the state
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // 7.2 If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    // Actions are the frontend tools coming from CopilotKit
    const actions = copilotkit?.actions;
    const toolCallName = lastMessage.tool_calls![0].name;

    // 7.3 Only route to the tool node if the tool call is not a CopilotKit action
    if (!actions || actions.every((action) => action.name !== toolCallName)) {
      return "tool_node";
    }
  }

  // 6.4 Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the workflow graph
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("chat_node", chat_node)
  .addNode("tool_node", new ToolNode(tools))
  .addEdge(START, "chat_node")
  .addEdge("tool_node", "chat_node")
  .addConditionalEdges("chat_node", shouldContinue as any);

const memory = new MemorySaver();

export const graph = workflow.compile({
  checkpointer: memory,
});
