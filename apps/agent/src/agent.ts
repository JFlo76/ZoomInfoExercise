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
  // UI State Management
  uiState: Annotation<{
    components: Record<string, any>; // Component-specific state
    formData: Record<string, any>;   // Form field values
    appData: Record<string, any>;    // General application data
    lastUpdate: number;              // Timestamp of last state change
  }>,
});

// 2. Define the type for our agent state
export type AgentState = typeof AgentStateAnnotation.State;

// 3. Define a weather tool that returns JSON configuration
const getWeather = tool(
  (args) => {
    // Return JSON configuration for weather component
    const weatherComponent = {
      id: `weather-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "weather",
      location: args.location,
      temperature: "70°F",
      description: "Clear skies",
      humidity: "45%",
      windSpeed: "5 mph",
      feelsLike: "72°F",
      icon: "sun",
      title: `Weather in ${args.location}`,
    };

    return JSON.stringify(weatherComponent);
  },
  {
    name: "getWeather",
    description: "Get the weather for a given location. Returns JSON configuration for weather component.",
    schema: z.object({
      location: z.string().describe("The location to get weather for"),
    }),
  },
);

// 3.2 Define a tool for data visualization that returns JSON configuration
const showDataVisualization = tool(
  (args) => {
    // Return JSON configuration for data visualization component
    const dataVizComponent = {
      id: `dataviz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "dataVisualization",
      title: args.title,
      chartType: args.chartType || "table",
      data: args.items || [
        { label: "Sample Data", value: "No data provided" }
      ],
    };

    return JSON.stringify(dataVizComponent);
  },
  {
    name: "showDataVisualization",
    description: "Display data in a visual format like charts or tables. Returns JSON configuration for data visualization component.",
    schema: z.object({
      title: z.string().describe("Title for the data visualization"),
      chartType: z.enum(["bar", "line", "pie", "table"]).optional().describe("Type of chart to display"),
      items: z.array(z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        color: z.string().optional(),
      })).optional().describe("Array of data items to visualize"),
    }),
  },
);

// 3.3 Define a tool for interactive forms that returns JSON configuration
const createInteractiveForm = tool(
  (args) => {
    // Return JSON configuration for form component
    const formComponent = {
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "form",
      title: args.title,
      description: args.description,
      fields: args.fields || [
        { name: "example", type: "text", label: "Example Field", placeholder: "Enter text..." }
      ],
      submitButton: {
        text: "Submit",
        style: "primary"
      },
    };

    return JSON.stringify(formComponent);
  },
  {
    name: "createInteractiveForm",
    description: "Create an interactive form with inputs and buttons. Returns JSON configuration for form component.",
    schema: z.object({
      title: z.string().describe("Title for the form"),
      description: z.string().optional().describe("Description text for the form"),
      fields: z.array(z.object({
        name: z.string(),
        type: z.enum(["text", "email", "password", "number", "textarea", "select", "checkbox", "radio"]),
        label: z.string().optional(),
        placeholder: z.string().optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
      })).optional().describe("Form fields configuration"),
    }),
  },
);

// 3.4 Define a tool for creating dashboard layouts that returns JSON configuration
const createDashboard = tool(
  (args) => {
    // Return JSON configuration for dashboard component
    const dashboardComponent = {
      id: `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "dashboard",
      title: args.title,
      layout: args.layout || "grid",
      gridCols: 3,
      sections: (args.sections || []).map((section: any) => ({
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: section.type,
        title: section.title,
        component: {
          id: `${section.type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: section.type,
          title: section.title,
          ...section.data,
        },
      })),
    };

    return JSON.stringify(dashboardComponent);
  },
  {
    name: "createDashboard",
    description: "Create a dashboard layout with multiple interactive sections. Returns JSON configuration for dashboard component.",
    schema: z.object({
      title: z.string().describe("Dashboard title"),
      layout: z.enum(["grid", "columns", "rows"]).optional().describe("Layout type"),
      sections: z.array(z.object({
        type: z.enum(["metric", "chart", "table", "form", "weather", "actionCard"]),
        title: z.string(),
        data: z.any().optional(),
      })).describe("Dashboard sections"),
    }),
  },
);

// 3.5 Define a tool for interactive cards that returns JSON configuration
const createActionCard = tool(
  (args) => {
    // Return JSON configuration for action card component
    const actionCardComponent = {
      id: `actioncard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "actionCard",
      title: args.title,
      description: args.description,
      actions: (args.actions || []).map((action: any) => ({
        label: action.label,
        action: action.action,
        style: action.style || "primary",
      })),
    };

    return JSON.stringify(actionCardComponent);
  },
  {
    name: "createActionCard",
    description: "Create an interactive card with buttons that can trigger agent actions. Returns JSON configuration for action card component.",
    schema: z.object({
      title: z.string().describe("Card title"),
      description: z.string().optional().describe("Card description"),
      actions: z.array(z.object({
        label: z.string(),
        action: z.string(),
        style: z.enum(["primary", "secondary", "success", "warning", "danger"]).optional(),
      })).describe("Interactive buttons/actions"),
    }),
  },
);

// 3.6 Define a tool for creating multi-step workflows that returns JSON configuration
const createWorkflow = tool(
  (args) => {
    // Return JSON configuration for workflow component
    const workflowComponent = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "workflow",
      title: args.title,
      currentStep: args.currentStep || 0,
      steps: (args.steps || []).map((step: any, index: number) => ({
        id: `step-${index}-${Date.now()}`,
        title: step.title,
        description: step.description,
        type: step.type,
        completed: step.completed || false,
      })),
      showProgress: true,
    };

    return JSON.stringify(workflowComponent);
  },
  {
    name: "createWorkflow",
    description: "Create a multi-step interactive workflow with progress tracking. Returns JSON configuration for workflow component.",
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

const getUIState = tool(
  (args) => {
    // This tool will trigger the frontend action to get real-time state
    return JSON.stringify({
      action: "getUIState",
      stateKey: args.stateKey,
      message: "This tool will trigger the frontend getUIState action to fetch real-time form data and component states.",
      timestamp: Date.now()
    });
  },
  {
    name: "getUIState",
    description: "Get current UI state including real-time form data, component states, and app data. This tool triggers the frontend to provide the most up-to-date state information. Use this whenever you need to access form values or check what the user has entered.",
    schema: z.object({
      stateKey: z.string().optional().describe("Specific state section to get (formData, appData, components) or leave empty for all state"),
    }),
  },
);

const updateUIState = tool(
  (args) => {
    // This tool will be used by the agent to prepare state updates
    // The actual state update will be handled by the frontend action
    return JSON.stringify({
      stateKey: args.stateKey,
      data: args.data,
      action: "updateUIState",
      timestamp: Date.now()
    });
  },
  {
    name: "updateUIState",
    description: "Update UI state with new data. Use this to set form data, app data, or component states that should be accessible across the application.",
    schema: z.object({
      stateKey: z.string().describe("State section to update (formData, appData, components)"),
      data: z.any().describe("Data to store in the specified state section"),
    }),
  },
);

// 4. Put our tools into an array
const tools = [getWeather, showDataVisualization, createInteractiveForm, createDashboard, createActionCard, createWorkflow, getUIState, updateUIState];

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

  // 5.3 Define the system message with current UI state context
  let uiStateContext = "\n\n🔍 **Current UI State:** No state data available yet";

  if (state.uiState) {
    const { formData, appData, components, lastUpdate } = state.uiState;

    // Build detailed state context
    uiStateContext = `\n\n🔍 **CURRENT UI STATE - REAL-TIME ACCESS:**

**📝 FORM DATA (Real-time as user types):**
${Object.keys(formData).length > 0 ?
        Object.entries(formData).map(([formId, data]) =>
          `- Form "${formId}": ${JSON.stringify(data, null, 2)}`
        ).join('\n') :
        "- No forms filled yet"
      }

**⚙️ APP DATA:**
${Object.keys(appData).length > 0 ? JSON.stringify(appData, null, 2) : "- No app data stored yet"}

**🎛️ COMPONENT STATES:**
${Object.keys(components).length > 0 ? JSON.stringify(components, null, 2) : "- No component states stored yet"}

**⏱️ Last Updated:** ${new Date(lastUpdate).toLocaleString()}

**💡 IMPORTANT:** This state is updated in real-time as users interact with forms and components. You have immediate access to all form values without requiring form submission!`;
  }

  const systemMessage = new SystemMessage({
    content: `You are a helpful assistant that generates interactive, composable UI components using a JSON-based UI system with full state management capabilities.

Current proverbs: ${JSON.stringify(state.proverbs)}

🎯 **JSON-BASED UI SYSTEM & STATE MANAGEMENT**
All your tools now return structured JSON configurations that are automatically rendered in the user interface. The system maintains bidirectional state synchronization between UI components and chat interactions.

**🛠️ Available JSON UI Component Tools:**
- **getWeather**: Returns JSON config for weather cards with live data display
- **showDataVisualization**: Returns JSON config for charts, tables, and data visualizations  
- **createInteractiveForm**: Returns JSON config for forms with validation and submission handling
- **createDashboard**: Returns JSON config for multi-section dashboard layouts
- **createActionCard**: Returns JSON config for interactive cards with action buttons
- **createWorkflow**: Returns JSON config for multi-step processes with progress tracking

**📊 State Management Tools:**
- **getCurrentFormData**: Get real-time form data directly (USE THIS for form values!)
- **getUIState**: Read current UI state (form data, app data, component states) - USE THIS to access form values in real-time
- **updateUIState**: Update UI state that persists across interactions

**🎯 CRITICAL - Form Data Access:**
ALWAYS use getCurrentFormData action when users ask about form values they've entered! This includes questions like:
- "What did I enter in the name field?"
- "What email address did I provide?" 
- "Show me what I filled out"
- "What information did I submit?"

getCurrentFormData provides properly formatted form data without JSON parsing issues and includes comprehensive debugging information.

⚠️ **Troubleshooting**: If getCurrentFormData returns "No form data", the user needs to:
1. Fill out form fields (not just view them)
2. Ensure data is being typed/selected in inputs
3. Check that the form component is working properly

**Secondary Options**: Use getUIState('formData') for detailed state inspection if troubleshooting is needed.

🏗️ **State-Aware Architecture:**
• Form inputs are automatically saved to shared state
• Components can read and modify persistent app data
• User interactions in UI are accessible in subsequent chat messages
• State changes from agent are reflected immediately in UI
• Cross-component data sharing and synchronization

**📝 State Management Examples:**
- "What did I enter in the contact form?" → Use getUIState to check formData
- "Save this preference setting" → Use updateUIState to store appData
- "Remember my dashboard layout" → Store component configuration in state
- "Fill the form with my saved profile" → Retrieve appData and generate form with prefilled values

🎨 **Layout & Composition:**
• **Grid Dashboards**: Automatically arrange components in responsive grids
• **Column/Row Layouts**: Linear arrangements for sequential content  
• **Nested Components**: Workflows and dashboards can contain other components
• **Responsive Design**: All components adapt to different screen sizes

**🎯 State-Aware Interactions:**
When users mention:
- "What did I fill in earlier?" → IMMEDIATELY use getCurrentFormData action
- "What email did I enter?" → IMMEDIATELY use getCurrentFormData action  
- "What name did I type?" → IMMEDIATELY use getCurrentFormData action
- "Show me my form data" → IMMEDIATELY use getCurrentFormData action
- "What information did I submit?" → IMMEDIATELY use getCurrentFormData action
- "Show my form data" → Use getCurrentFormData action for reliable access
- "Show my previous entries" → Use getCurrentFormData for forms, getUIState for complete state
- "Update my profile with..." → Use updateUIState to save new data
- "Prefill the form with my info" → Use getCurrentFormData to retrieve data, then generate prefilled components

**⚡ ABSOLUTE PRIORITY**: For ANY question about form values entered by the user, your FIRST action must be getCurrentFormData - no exceptions! This provides the most reliable access to user-entered form data.

**⚡ CRITICAL**: For form data access, use getCurrentFormData action - it provides properly formatted results without JSON parsing issues. Only use getUIState for comprehensive state overview!

The system automatically renders all JSON configurations with beautiful, interactive React components styled with Tailwind CSS. Components appear instantly in the main canvas with full state synchronization!${uiStateContext}`,
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
