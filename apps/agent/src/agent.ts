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

// 3.4 Define a tool for creating dashboard layouts
const createDashboard = tool(
  (args) => {
    return `Created dashboard: ${args.title} with ${args.sections?.length || 0} sections.`;
  },
  {
    name: "createDashboard",
    description: "Create a dashboard layout with multiple interactive sections.",
    schema: z.object({
      title: z.string().describe("Dashboard title"),
      layout: z.enum(["grid", "columns", "rows"]).optional().describe("Layout type"),
      sections: z.array(z.object({
        type: z.enum(["metric", "chart", "table", "form"]),
        title: z.string(),
        data: z.any().optional(),
      })).describe("Dashboard sections"),
    }),
  },
);

// 3.5 Define a tool for interactive cards that can trigger actions
const createActionCard = tool(
  (args) => {
    return `Created action card: ${args.title} with ${args.actions?.length || 0} actions.`;
  },
  {
    name: "createActionCard",
    description: "Create an interactive card with buttons that can trigger agent actions.",
    schema: z.object({
      title: z.string().describe("Card title"),
      description: z.string().optional().describe("Card description"),
      actions: z.array(z.object({
        label: z.string(),
        action: z.string(),
        style: z.enum(["primary", "secondary", "danger"]).optional(),
      })).describe("Interactive buttons/actions"),
    }),
  },
);

// 3.6 Define a tool for creating multi-step workflows
const createWorkflow = tool(
  (args) => {
    return `Created workflow: ${args.title} with ${args.steps?.length || 0} steps.`;
  },
  {
    name: "createWorkflow",
    description: "Create a multi-step interactive workflow with progress tracking.",
    schema: z.object({
      title: z.string().describe("Workflow title"),
      currentStep: z.number().default(0).describe("Current step index"),
      steps: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(["form", "info", "action", "review"]),
        completed: z.boolean().default(false),
      })).describe("Workflow steps"),
    }),
  },
);

// 4. Put our tools into an array
const tools = [getWeather, showDataVisualization, createInteractiveForm, createDashboard, createActionCard, createWorkflow];

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
    content: `You are a helpful assistant that can generate interactive, composable UI components using Open-JSON-UI principles. 

Current proverbs: ${JSON.stringify(state.proverbs)}

Available tools for creating interactive visual experiences:
- getWeather: Create weather cards with live data
- showDataVisualization: Generate charts and data tables
- createInteractiveForm: Build forms with validation and submission
- createDashboard: Compose multiple components into dashboard layouts
- createActionCard: Create cards with interactive buttons that trigger actions
- createWorkflow: Build multi-step processes with progress tracking

🎨 DISPLAY OPTIONS:
You can display UI components in two ways:
1. **Chat Interface** (default): Components appear inline with conversation
2. **Main Canvas**: Use the "displayInMainCanvas" action to show components in the main application area for a more app-like experience

For layout composition, you can:
• Create dashboards with multiple sections (grid, columns, or rows)
• Build workflows with step-by-step interactions
• Design action cards that can trigger other tools
• Combine multiple components for complex interfaces

Example usage patterns:
- "Create a dashboard" -> Use createDashboard with multiple sections
- "Display weather in the main canvas" -> Use displayInMainCanvas with componentType="weather"
- "Show me a full-screen workflow" -> Use displayInMainCanvas with componentType="workflow"
- "Build a workflow for onboarding" -> Use createWorkflow with sequential steps  
- "Make an interactive weather app" -> Combine createActionCard + getWeather
- "Show me a data analysis dashboard" -> Use createDashboard with showDataVisualization sections

The UI components will automatically render with beautiful styling inspired by Open-JSON-UI design principles and full interactivity.

When users ask to display something "in the main area", "full screen", "in the canvas", or "as the main interface", use the displayInMainCanvas action to create an app-like experience.`,
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
