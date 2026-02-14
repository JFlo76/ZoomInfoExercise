"use client";

import { useCoAgent, useCopilotAction, useRenderToolCall } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState, useRef, useEffect } from "react";
import { JSONRenderer } from "../components/JSONRenderer";
import { UIComponent, parseUIComponent } from "../schemas/ui-schemas";

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/guides/frontend-actions
  useCopilotAction({
    name: "setThemeColor",
    description: "Set the theme color of the page.",
    parameters: [{
      name: "themeColor",
      description: "The theme color to set. Make sure to pick nice colors.",
      required: true,
    }],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  // Add action to trigger other agent tools
  useCopilotAction({
    name: "triggerAgentAction",
    description: "Trigger another agent action from a UI component.",
    parameters: [{
      name: "action",
      description: "The action to trigger",
      required: true,
    }, {
      name: "params",
      description: "Parameters for the action",
      required: false,
    }],
    handler({ action, params }) {
      console.log(`Triggering agent action: ${action}`, params);
      // This would trigger another agent action
    },
  });

  return (
    <main style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}>
      <YourMainContent themeColor={themeColor} />
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Dynamic UI Generator",
          initial: "👋 Hi! I can create interactive, composable UI components that automatically appear in your main canvas!\n\n**🚀 All components appear automatically in the main area - no special commands needed!**\n\n**Try these:**\n- **Weather**: \"What's the weather in Tokyo?\"\n- **Dashboard**: \"Create a project dashboard\"\n- **Workflow**: \"Build an onboarding workflow\"\n- **Forms**: \"Create a registration form\"\n- **Action Cards**: \"Make an action card interface\"\n- **Data Viz**: \"Show me sales data visualization\"\n- **Mixed Layouts**: \"Create a dashboard with weather and forms\"\n\n**✨ Features:**\n• Auto-display in main canvas\n• Interactive components with real functionality\n• Multiple layout options (grid, columns, rows)\n• Step-by-step workflows\n• Form submissions & validations\n\nWatch your UI come to life automatically! 🎨"
        }}
      />
    </main>
  );
}

// Enhanced state for canvas components and UI state management
type AgentState = {
  // Canvas components
  canvasComponents?: Array<{
    id: string;
    componentId: string;
    json: UIComponent;
    timestamp: number;
  }>;
  // UI State Management
  uiState?: {
    components: Record<string, any>; // Component-specific state  
    formData: Record<string, any>;   // Form field values
    appData: Record<string, any>;    // General application data
    lastUpdate: number;              // Timestamp of last state change
  };
}

function YourMainContent({ themeColor }: { themeColor: string }): React.JSX.Element {
  // 🪁 Shared State: https://docs.copilotkit.ai/coagents/shared-state
  const { state, setState } = useCoAgent<AgentState>({
    name: "starterAgent",
    initialState: {
      uiState: {
        components: {},
        formData: {},
        appData: {},
        lastUpdate: Date.now(),
      }
    },
  });

  // Create a ref to store the most current state for immediate agent access
  const currentStateRef = useRef(state.uiState || {
    components: {},
    formData: {},
    appData: {},
    lastUpdate: Date.now()
  });

  // Update ref whenever state changes
  useEffect(() => {
    if (state.uiState) {
      currentStateRef.current = state.uiState;
      console.log('🔄 State ref updated:', currentStateRef.current);
    }
  }, [state.uiState]);

  // State to track generated UI components in main canvas
  const [canvasComponents, setCanvasComponents] = useState<Array<{
    id: string; // Unique canvas component ID
    componentId: string; // Original component ID for state management
    json: UIComponent;
    timestamp: number;
  }>>([]);

  // Use ref to track processed tool results to prevent duplicates
  const processedResults = useRef<Set<string>>(new Set());

  // Add React import for useEffect
  const React = require('react');

  // 🪁 State Management Actions
  useCopilotAction({
    name: "updateUIState",
    description: "Update UI state (form data, app data, component states) that persists across interactions.",
    parameters: [{
      name: "stateKey",
      description: "State section to update: formData, appData, or components",
      required: true,
    }, {
      name: "data",
      description: "Data to store in the specified state section",
      required: true,
    }],
    handler({ stateKey, data }) {
      console.log(`Updating UI state: ${stateKey}`, data);
      setState(prev => {
        const currentState = prev || {};
        const currentUIState = currentState.uiState || {
          components: {},
          formData: {},
          appData: {},
          lastUpdate: Date.now()
        };

        return {
          ...currentState,
          uiState: {
            ...currentUIState,
            [stateKey]: {
              ...(currentUIState[stateKey as keyof typeof currentUIState] as Record<string, any> || {}),
              ...(typeof data === 'object' && data !== null ? data : {})
            },
            lastUpdate: Date.now(),
          }
        };
      });
    },
  });

  useCopilotAction({
    name: "getUIState",
    description: "Get current UI state to access form data, app data, or component states. This provides real-time access to all form values and component states without requiring form submission.",
    parameters: [{
      name: "stateKey",
      description: "Specific state section to get: formData, appData, components, or leave empty for all",
      required: false,
    }],
    handler({ stateKey }) {
      console.log('🔍 getUIState called by agent with stateKey:', stateKey);
      const currentState = state.uiState || { components: {}, formData: {}, appData: {}, lastUpdate: 0 };

      console.log('🔍 Agent querying UI state:', stateKey || 'ALL');
      console.log('📊 Current state available:', currentState);
      console.log('📝 Current form data specifically:', currentState.formData);

      if (stateKey) {
        const sectionData = currentState[stateKey as keyof typeof currentState];
        console.log(`📊 Returning ${stateKey} data:`, sectionData);

        // Create a descriptive response for the agent
        if (stateKey === 'formData') {
          const formEntries = Object.entries(sectionData as Record<string, any> || {});
          console.log('📝 Form entries for agent:', formEntries);

          if (formEntries.length === 0) {
            return "No form data has been entered yet. Debug: FormData section is empty in state.";
          }

          let response = "Current form data:\n";
          formEntries.forEach(([formId, formData]) => {
            response += `\n📝 Form ID: ${formId}\n`;
            if (typeof formData === 'object' && formData !== null) {
              Object.entries(formData).forEach(([field, value]) => {
                response += `  • ${field}: ${value}\n`;
              });
            }
          });
          return response;
        }

        return sectionData;
      }

      console.log('📊 Returning full UI state:', currentState);

      // Create a comprehensive response for the agent
      let response = "Complete UI State Summary:\n\n";

      // Form data summary
      const formEntries = Object.entries(currentState.formData || {});
      if (formEntries.length > 0) {
        response += "📝 FORM DATA:\n";
        formEntries.forEach(([formId, formData]) => {
          response += `  Form ID: ${formId}\n`;
          if (typeof formData === 'object' && formData !== null) {
            Object.entries(formData).forEach(([field, value]) => {
              response += `    • ${field}: ${value}\n`;
            });
          }
        });
      } else {
        response += "📝 FORM DATA: No forms filled yet\n";
      }

      // App data summary
      const appEntries = Object.entries(currentState.appData || {});
      if (appEntries.length > 0) {
        response += "\n⚙️ APP DATA:\n" + JSON.stringify(currentState.appData, null, 2);
      } else {
        response += "\n⚙️ APP DATA: No app data stored yet";
      }

      // Component states summary
      const componentEntries = Object.entries(currentState.components || {});
      if (componentEntries.length > 0) {
        response += "\n🎛️ COMPONENT STATES:\n" + JSON.stringify(currentState.components, null, 2);
      } else {
        response += "\n🎛️ COMPONENT STATES: No component states stored yet";
      }

      response += `\n\n⏱️ Last Updated: ${new Date(currentState.lastUpdate).toLocaleString()}`;

      return response;
    },
  });

  useCopilotAction({
    name: "clearCanvas",
    description: "Clear all components from the main canvas.",
    parameters: [],
    handler: () => {
      setCanvasComponents([]);
      processedResults.current.clear();
    },
  });

  // Debug action to show current UI state
  useCopilotAction({
    name: "debugUIState",
    description: "Show the current UI state for debugging purposes.",
    parameters: [],
    handler: () => {
      const currentState = state.uiState || { components: {}, formData: {}, appData: {}, lastUpdate: 0 };
      console.log('🔍 DEBUG: Current UI State:', currentState);

      const debugInfo = {
        message: "UI State Debug Information",
        formDataCount: Object.keys(currentState.formData || {}).length,
        appDataCount: Object.keys(currentState.appData || {}).length,
        componentStateCount: Object.keys(currentState.components || {}).length,
        lastUpdate: new Date(currentState.lastUpdate).toISOString(),
        fullState: currentState
      };

      console.log('🔍 DEBUG INFO:', debugInfo);
      return JSON.stringify(debugInfo, null, 2);
    },
  });

  // Direct action for agent to get live state data without JSON parsing issues
  useCopilotAction({
    name: "getCurrentFormData",
    description: "Get current form data directly for agent access. Returns formatted string with all form values entered by the user.",
    parameters: [],
    handler: () => {
      console.log('🎯 getCurrentFormData called by agent');

      // Use the most current state from ref AND the hook state
      const hookState = state.uiState || { components: {}, formData: {}, appData: {}, lastUpdate: 0 };
      const refState = currentStateRef.current;

      console.log('🎯 Hook state when agent queries:', hookState);
      console.log('🎯 Ref state when agent queries:', refState);

      // Use the state with the most recent timestamp or fall back to hook state
      const currentState = (refState.lastUpdate > hookState.lastUpdate) ? refState : hookState;

      console.log('🎯 Selected state for agent:', currentState);
      console.log('🎯 Form data specifically:', currentState.formData);

      const formEntries = Object.entries(currentState.formData || {});
      console.log('🎯 Form entries found:', formEntries.length);
      console.log('🎯 Form entries details:', formEntries);

      if (formEntries.length === 0) {
        console.log('😨 No form data found in state');
        console.log('🔍 Debug - Hook state form data:', hookState.formData);
        console.log('🔍 Debug - Ref state form data:', refState.formData);
        return "No form data has been entered yet. Make sure users have filled out forms and interacted with form fields. Debug: Check console for state updates.";
      }

      let response = "📝 CURRENT FORM DATA:\n\n";
      formEntries.forEach(([formId, formData]) => {
        console.log(`📝 Processing form ${formId}:`, formData);
        response += `Form ID: ${formId}\n`;
        if (typeof formData === 'object' && formData !== null) {
          Object.entries(formData).forEach(([field, value]) => {
            response += `  • ${field}: "${value}"\n`;
          });
        }
        response += "\n";
      });

      response += `Last updated: ${new Date(currentState.lastUpdate).toLocaleString()}`;
      console.log('🎯 Returning to agent:', response);
      return response;
    },
  });

  // Helper function to update UI state from components
  const updateStateFromComponent = (stateKey: string, data: any) => {
    console.log(`📝 updateStateFromComponent called:`, { stateKey, data });
    console.log('📊 Current state before local update:', state.uiState);

    setState(prev => {
      const currentState = prev || {};
      const currentUIState = currentState.uiState || {
        components: {},
        formData: {},
        appData: {},
        lastUpdate: Date.now()
      };

      const updatedUIState = {
        ...currentUIState,
        [stateKey]: {
          ...(currentUIState[stateKey as keyof typeof currentUIState] as Record<string, any> || {}),
          ...(typeof data === 'object' && data !== null ? data : {})
        },
        lastUpdate: Date.now(),
      };

      console.log('📊 Updated UI state:', updatedUIState);
      console.log('📝 Form data in updated state:', updatedUIState.formData);

      return {
        ...currentState,
        uiState: updatedUIState
      };
    });
  };

  // Helper function to create a simple hash from result data
  const createResultHash = (result: any, toolName: string) => {
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
    return `${toolName}-${btoa(resultStr).substring(0, 20)}`; // Simple hash using base64
  };

  // Helper function to add component to canvas from JSON (deferred to avoid setState during render)
  const addToCanvas = (jsonData: string | object, resultHash: string = '') => {
    console.log('addToCanvas called with:', jsonData);

    // If we have a result hash, check if we've already processed this exact result
    if (resultHash && processedResults.current.has(resultHash)) {
      console.log('Result already processed, skipping:', resultHash);
      return;
    }

    // Defer the state update to avoid setState during render
    setTimeout(() => {
      try {
        // Handle both string and object inputs
        const component = typeof jsonData === 'string'
          ? parseUIComponent(JSON.parse(jsonData))
          : parseUIComponent(jsonData);

        console.log('Parsed component:', component);

        // Create unique canvas component with both component ID and timestamp
        const canvasId = `${component.id}-canvas-${Date.now()}`;
        const newComponent = {
          id: canvasId, // Unique canvas ID
          componentId: component.id, // Original component ID for state management
          json: component,
          timestamp: Date.now(),
        };

        // Check if component with same componentId already exists to prevent duplicates
        setCanvasComponents(prev => {
          const existingIndex = prev.findIndex(c => c.componentId === component.id);
          if (existingIndex !== -1) {
            console.log('Component with same ID already exists, replacing:', component.id);
            // Replace existing component instead of duplicating
            const updated = [...prev];
            updated[existingIndex] = newComponent;
            return updated;
          } else {
            console.log('Adding new component to canvas:', newComponent);
            return [...prev, newComponent];
          }
        });

        // Mark this result as processed if we have a hash
        if (resultHash) {
          processedResults.current.add(resultHash);
        }
      } catch (error) {
        console.error('Failed to parse component JSON:', error);
      }
    }, 0);
  };

  // 🪁 Backend Tool Rendering: Auto-display components in main canvas using JSON
  useRenderToolCall({
    name: "getWeather",
    render: ({ status, result }) => {
      console.log('getWeather render called:', status, result);
      if (status === "complete" && result) {
        const resultHash = createResultHash(result, "getWeather");
        addToCanvas(result, resultHash);
      }
      return <></>; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "showDataVisualization",
    render: ({ status, result }) => {
      console.log('showDataVisualization render called:', status, result);
      if (status === "complete" && result) {
        const resultHash = createResultHash(result, "showDataVisualization");
        addToCanvas(result, resultHash);
      }
      return <></>; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "createInteractiveForm",
    render: ({ status, result }) => {
      console.log('createInteractiveForm render called:', status, result);
      if (status === "complete" && result) {
        const resultHash = createResultHash(result, "createInteractiveForm");
        addToCanvas(result, resultHash);
      }
      return <></>; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "createDashboard",
    render: ({ status, result }) => {
      console.log('createDashboard render called:', status, result);
      if (status === "complete" && result) {
        const resultHash = createResultHash(result, "createDashboard");
        addToCanvas(result, resultHash);
      }
      return <></>; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "createActionCard",
    render: ({ status, result }) => {
      console.log('createActionCard render called:', status, result);
      if (status === "complete" && result) {
        const resultHash = createResultHash(result, "createActionCard");
        addToCanvas(result, resultHash);
      }
      return <></>; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "createWorkflow",
    render: ({ status, result }) => {
      console.log('createWorkflow render called:', status, result);
      if (status === "complete" && result) {
        const resultHash = createResultHash(result, "createWorkflow");
        addToCanvas(result, resultHash);
      }
      return <></>; // Don't render in chat - show in canvas instead
    },
  });

  // Special handler for getUIState tool calls to provide real-time state access
  useRenderToolCall({
    name: "getUIState",
    render: ({ status, result }) => {
      if (status === "complete" && result) {
        console.log('🔍 getUIState tool called from agent:', result);

        // The getUIState tool returns a JSON object, but we need to provide actual state data
        // Instead of parsing the tool result, directly provide current UI state
        const currentState = state.uiState || { components: {}, formData: {}, appData: {}, lastUpdate: 0 };

        console.log('📊 Current UI state when agent requests it:', currentState);

        // Create a user-friendly display of the current state
        let stateDisplay = "Current UI State:\n\n";

        // Show form data
        const formEntries = Object.entries(currentState.formData || {});
        if (formEntries.length > 0) {
          stateDisplay += "📝 FORM DATA:\n";
          formEntries.forEach(([formId, formData]) => {
            stateDisplay += `  Form: ${formId}\n`;
            if (typeof formData === 'object' && formData !== null) {
              Object.entries(formData).forEach(([field, value]) => {
                stateDisplay += `    ${field}: ${value}\n`;
              });
            }
          });
        } else {
          stateDisplay += "📝 FORM DATA: No form data entered yet\n";
        }

        // Show app data if any
        if (Object.keys(currentState.appData || {}).length > 0) {
          stateDisplay += "\n⚙️ APP DATA:\n" + JSON.stringify(currentState.appData, null, 2);
        }

        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900 text-sm mb-4">
            <div className="font-bold mb-2">📊 Current UI State (Agent Access):</div>
            <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded font-mono">
              {stateDisplay}
            </pre>
          </div>
        );
      }
      return <></>; // Don't render anything for incomplete states
    },
  });

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="h-screen w-screen flex justify-center items-center flex-col transition-colors duration-300"
    >
      <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Generated UI Canvas ({canvasComponents.length} components)
            </h1>
            <p className="text-gray-200 italic text-sm">
              Dynamic UI components created by your agent appear here automatically! 🎨
            </p>
          </div>

          {/* Clear button */}
          {canvasComponents.length > 0 && (
            <button
              onClick={() => {
                setCanvasComponents([]);
                processedResults.current.clear();
              }}
              className="bg-red-500/80 hover:bg-red-600/80 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-all"
            >
              🗑️ Clear Canvas
            </button>
          )}
        </div>

        <hr className="border-white/20 my-6" />

        {/* Dynamic Canvas View */}
        <div className="min-h-[500px]">
          {canvasComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <div className="text-white/80">
                <h3 className="text-xl font-semibold mb-2">Dynamic UI Canvas</h3>
                <p className="text-sm max-w-md">
                  Ask the assistant to create components and they'll appear here automatically!<br /><br />
                  <strong>Try:</strong><br />
                  "What's the weather in Tokyo?"<br />
                  "Create a project dashboard"<br />
                  "Build an onboarding workflow"<br />
                  "Show me a contact form"
                </p>
              </div>
            </div>
          ) : (
            /* Render canvas components using JSON-based system */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {canvasComponents.map((component) => {
                console.log('Rendering component with canvas ID:', component.id, 'component ID:', component.componentId);
                return (
                  <JSONRenderer
                    key={component.id} // Use unique canvas ID as React key
                    json={component.json}
                    themeColor={themeColor}
                    currentState={state.uiState || { components: {}, formData: {}, appData: {}, lastUpdate: 0 }}
                    onStateUpdate={(stateKey, data) => {
                      console.log(`🔄 Component ${component.componentId} updating state:`, stateKey, data);
                      console.log('📊 State before update:', state.uiState);

                      // SINGLE state update to prevent conflicts
                      setState(prev => {
                        const currentState = prev || {};
                        const currentUIState = currentState.uiState || {
                          components: {},
                          formData: {},
                          appData: {},
                          lastUpdate: Date.now()
                        };

                        const updatedState = {
                          ...currentState,
                          uiState: {
                            ...currentUIState,
                            [stateKey]: {
                              ...(currentUIState[stateKey as keyof typeof currentUIState] as Record<string, any> || {}),
                              ...(typeof data === 'object' && data !== null ? data : {})
                            },
                            lastUpdate: Date.now(),
                          }
                        };

                        console.log('🔄 Updated shared agent state:', updatedState.uiState);
                        console.log('📝 Form data after update:', updatedState.uiState.formData);

                        // Also update the ref for immediate agent access
                        currentStateRef.current = updatedState.uiState;
                        console.log('📝 Updated state ref:', currentStateRef.current);

                        return updatedState;
                      });
                    }}
                    onAction={(action, params) => {
                      console.log(`Action triggered: ${action}`, params);
                      // Handle component actions here - could trigger agent actions
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}