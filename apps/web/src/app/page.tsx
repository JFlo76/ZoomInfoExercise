"use client";

import { useCoAgent, useCopilotAction, useRenderToolCall } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";

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

// Simplified state for canvas components only
type AgentState = {
  // Removed proverbs - now we only track canvas components
}

function YourMainContent({ themeColor }: { themeColor: string }) {
  // 🪁 Shared State: https://docs.copilotkit.ai/coagents/shared-state
  const { state, setState } = useCoAgent<AgentState>({
    name: "starterAgent",
    initialState: {},
  })

  // State to track generated UI components in main canvas
  const [canvasComponents, setCanvasComponents] = useState<Array<{
    id: string;
    type: string;
    props: any;
    timestamp: number;
  }>>([]);

  // Helper function to add component to canvas
  const addToCanvas = (type: string, props: any) => {
    const newComponent = {
      id: `canvas-${Date.now()}-${Math.random()}`,
      type,
      props,
      timestamp: Date.now(),
    };
    setCanvasComponents(prev => [...prev, newComponent]);
  };

  // 🪁 Action to clear the canvas
  useCopilotAction({
    name: "clearCanvas",
    description: "Clear all components from the main canvas.",
    parameters: [],
    handler: () => {
      setCanvasComponents([]);
    },
  });

  // 🪁 Backend Tool Rendering: Auto-display components in main canvas
  useRenderToolCall({
    name: "getWeather",
    render: ({ status, args, result }) => {
      if (status === "complete") {
        addToCanvas("weather", { location: args.location, result });
      }
      return null; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "showDataVisualization",
    render: ({ status, args, result }) => {
      if (status === "complete") {
        addToCanvas("dataVisualization", { title: args.title, items: args.items });
      }
      return null; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "createInteractiveForm",
    render: ({ status, args, result }) => {
      if (status === "complete") {
        addToCanvas("form", { title: args.title, description: args.description, fields: args.fields });
      }
      return null; // Don't render in chat - show in canvas instead
    },
  });

  // 🪁 New Interactive & Layout Tools - Auto-display in canvas
  useRenderToolCall({
    name: "createDashboard",
    render: ({ status, args, result }) => {
      if (status === "complete") {
        addToCanvas("dashboard", { title: args.title, layout: args.layout, sections: args.sections });
      }
      return null; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "createActionCard",
    render: ({ status, args, result }) => {
      if (status === "complete") {
        addToCanvas("actionCard", { title: args.title, description: args.description, actions: args.actions });
      }
      return null; // Don't render in chat - show in canvas instead
    },
  });

  useRenderToolCall({
    name: "createWorkflow",
    render: ({ status, args, result }) => {
      if (status === "complete") {
        addToCanvas("workflow", { title: args.title, currentStep: args.currentStep, steps: args.steps });
      }
      return null; // Don't render in chat - show in canvas instead
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
              Generated UI Canvas
            </h1>
            <p className="text-gray-200 italic text-sm">
              Dynamic UI components created by your agent appear here automatically! 🎨
            </p>
          </div>

          {/* Clear button */}
          {canvasComponents.length > 0 && (
            <button
              onClick={() => setCanvasComponents([])}
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
            /* Render canvas components */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {canvasComponents.map((component) => (
                <CanvasComponent
                  key={component.id}
                  type={component.type}
                  props={component.props}
                  themeColor={themeColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Canvas component renderer for main area
function CanvasComponent({ type, props, themeColor }: {
  type: string;
  props: any;
  themeColor: string;
}) {
  switch (type) {
    case "weather":
      return <WeatherCard location={props.location} themeColor={themeColor} result={props.result} />;

    case "dashboard":
      return <DashboardCard title={props.title} layout={props.layout} sections={props.sections} themeColor={themeColor} />;

    case "form":
      return <InteractiveFormCard title={props.title} description={props.description} fields={props.fields} themeColor={themeColor} />;

    case "workflow":
      return <WorkflowCard title={props.title} currentStep={props.currentStep} steps={props.steps} themeColor={themeColor} />;

    case "actionCard":
      return <ActionCard title={props.title} description={props.description} actions={props.actions} themeColor={themeColor} />;

    case "dataVisualization":
      return <DataVisualizationCard title={props.title} items={props.items} themeColor={themeColor} />;

    default:
      return (
        <div className="bg-white/10 border border-white/20 rounded-xl p-6 my-4">
          <div className="text-white">
            <h3 className="font-bold mb-2">Unknown Component: {type}</h3>
            <pre className="text-xs bg-black/20 p-2 rounded">
              {JSON.stringify(props, null, 2)}
            </pre>
          </div>
        </div>
      );
  }
}

// Simple sun icon for the weather card
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-yellow-200">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" stroke="currentColor" />
    </svg>
  );
}

// Loading card component for in-progress tool calls
function LoadingCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 my-4 max-w-md animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

// Weather card component with Open-JSON-UI inspired styling
function WeatherCard({ location, themeColor, result }: { location?: string, themeColor: string, result?: string }) {
  return (
    <div className="bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 rounded-xl p-6 my-4 max-w-md shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-sky-900 capitalize">Weather in {location}</h3>
          <p className="text-sky-700 text-sm">Current conditions</p>
        </div>
        <div className="text-4xl">🌤️</div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold text-sky-900">70°F</div>
        <div className="text-right">
          <p className="text-sky-800 font-medium">Clear skies</p>
          <p className="text-sky-600 text-sm">Feels like 72°</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sky-200">
        <div className="bg-white/50 rounded-lg p-3">
          <p className="text-sky-600 text-xs font-medium uppercase tracking-wide">Humidity</p>
          <p className="text-sky-900 font-bold text-lg">45%</p>
        </div>
        <div className="bg-white/50 rounded-lg p-3">
          <p className="text-sky-600 text-xs font-medium uppercase tracking-wide">Wind</p>
          <p className="text-sky-900 font-bold text-lg">5 mph</p>
        </div>
      </div>
    </div>
  );
}

// Data visualization card component
function DataVisualizationCard({ title, items, themeColor }: {
  title: string;
  items?: Array<{ label: string; value: string }>;
  themeColor: string;
}) {
  const sampleData = items || [
    { label: "Revenue", value: "$124K" },
    { label: "Users", value: "2.3K" },
    { label: "Growth", value: "+12%" },
    { label: "Conversion", value: "3.4%" },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-4 max-w-md shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-2xl">📊</div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>

      <div className="space-y-3">
        {sampleData.map((item, index) => (
          <div
            key={index}
            className={`flex justify-between items-center p-3 rounded-lg ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
              }`}
          >
            <span className="text-gray-700 font-medium">{item.label}</span>
            <span className="text-emerald-600 font-bold text-lg">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Interactive form card component  
function InteractiveFormCard({ title, description, fields, themeColor }: {
  title: string;
  description?: string;
  fields?: Array<{ name: string; type: string; placeholder?: string }>;
  themeColor: string;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    console.log('Form submitted:', formData);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-xl p-6 my-4 max-w-md shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 text-sm mb-4">{description}</p>
      )}

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-green-800 font-medium">Form submitted successfully!</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              placeholder="Enter your name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

// Dashboard card component for composing multiple sections
function DashboardCard({ title, layout = "grid", sections, themeColor }: {
  title: string;
  layout?: "grid" | "columns" | "rows";
  sections?: Array<{ type: string; title: string; data?: any }>;
  themeColor: string;
}) {
  const layoutClass = {
    grid: "grid grid-cols-2 gap-4",
    columns: "flex flex-row gap-4",
    rows: "flex flex-col gap-4"
  }[layout];

  const sampleSections = sections || [
    { type: "metric", title: "Total Revenue", data: "$142,350" },
    { type: "metric", title: "Active Users", data: "2,847" },
    { type: "chart", title: "Sales Trend", data: "↗️ +12%" },
    { type: "table", title: "Recent Orders", data: "24 new" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 my-4 max-w-4xl shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-2xl">📊</div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>

      <div className={layoutClass}>
        {sampleSections.map((section, index) => (
          <DashboardSection key={index} {...section} themeColor={themeColor} />
        ))}
      </div>
    </div>
  );
}

// Individual dashboard section component
function DashboardSection({ type, title, data, themeColor }: {
  type: string;
  title: string;
  data?: any;
  themeColor: string;
}) {
  const icons = {
    metric: "📈",
    chart: "📊",
    table: "📋",
    form: "📝"
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[120px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icons[type as keyof typeof icons] || "📄"}</span>
        <h4 className="font-semibold text-gray-700 text-sm">{title}</h4>
      </div>

      {type === "metric" && (
        <div className="text-2xl font-bold text-blue-600">
          {typeof data === 'object' ? JSON.stringify(data) : data}
        </div>
      )}

      {type === "chart" && (
        <div className="flex items-center justify-center h-16 bg-blue-50 rounded text-blue-600">
          {/* Handle data visualization items */}
          {data && typeof data === 'object' && data.items ? (
            <div className="text-xs text-center">
              <div className="font-medium">📊 Chart</div>
              <div>{data.items.length} items</div>
            </div>
          ) : (
            <span>{typeof data === 'object' ? JSON.stringify(data) : data}</span>
          )}
        </div>
      )}

      {type === "table" && (
        <div className="text-sm text-gray-600">
          <div className="bg-white rounded p-2">
            {/* Handle table data properly */}
            {data && typeof data === 'object' && data.items ? (
              <div className="space-y-1">
                {data.items.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
                {data.items.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{data.items.length - 3} more...
                  </div>
                )}
              </div>
            ) : (
              <span>{typeof data === 'object' ? JSON.stringify(data) : data}</span>
            )}
          </div>
        </div>
      )}

      {type === "form" && (
        <div className="text-xs text-gray-600">
          <div className="bg-white rounded p-2">
            📝 Interactive Form
          </div>
        </div>
      )}
    </div>
  );
}

// Action card component with interactive buttons
function ActionCard({ title, description, actions, themeColor }: {
  title: string;
  description?: string;
  actions?: Array<{ label: string; action: string; style?: string }>;
  themeColor: string;
}) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setSelectedAction(action);
    console.log('Action triggered:', action);

    // Show feedback and reset
    setTimeout(() => setSelectedAction(null), 2000);
  };

  const getButtonStyle = (style?: string) => {
    const styles = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
      danger: "bg-red-600 hover:bg-red-700 text-white"
    };
    return styles[style as keyof typeof styles] || styles.primary;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 my-4 max-w-md shadow-lg">
      <h3 className="text-xl font-bold text-blue-900 mb-2">{title}</h3>
      {description && (
        <p className="text-blue-700 text-sm mb-4">{description}</p>
      )}

      {selectedAction ? (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
          <div className="text-lg mb-1">✨</div>
          <p className="text-green-800 text-sm">Action "{selectedAction}" triggered!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions?.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action.action)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${getButtonStyle(action.style)}`}
            >
              {action.label}
            </button>
          )) || (
              <>
                <button
                  onClick={() => handleAction("weather")}
                  className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  🌤️ Check Weather
                </button>
                <button
                  onClick={() => handleAction("data")}
                  className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
                >
                  📊 View Data
                </button>
              </>
            )}
        </div>
      )}
    </div>
  );
}

// Workflow card component for multi-step processes
function WorkflowCard({ title, currentStep = 0, steps, themeColor }: {
  title: string;
  currentStep: number;
  steps?: Array<{ title: string; description?: string; type: string; completed: boolean }>;
  themeColor: string;
}) {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const sampleSteps = steps || [
    { title: "Setup", description: "Configure your preferences", type: "info", completed: false },
    { title: "Profile", description: "Complete your profile", type: "form", completed: false },
    { title: "Verification", description: "Verify your email", type: "action", completed: false },
    { title: "Complete", description: "You're all set!", type: "review", completed: false },
  ];

  const handleStepComplete = () => {
    setCompletedSteps([...completedSteps, activeStep]);
    if (activeStep < sampleSteps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const getStepIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) return "✅";
    const icons = {
      info: "ℹ️",
      form: "📝",
      action: "⚡",
      review: "🔍"
    };
    return icons[type as keyof typeof icons] || "📄";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 my-4 max-w-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Step {activeStep + 1} of {sampleSteps.length}</span>
          <span>{Math.round(((activeStep + 1) / sampleSteps.length) * 100)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((activeStep + 1) / sampleSteps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {sampleSteps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = completedSteps.includes(index);

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all ${isActive
                ? 'border-blue-300 bg-blue-50'
                : isCompleted
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getStepIcon(step.type, isCompleted)}</span>
                <div className="flex-1">
                  <h4 className={`font-medium ${isActive ? 'text-blue-800' : isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className={`text-sm ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {isActive && !isCompleted && (
                <div className="mt-3">
                  <button
                    onClick={handleStepComplete}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Complete Step
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completedSteps.length === sampleSteps.length && (
        <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-green-800 font-medium">Workflow completed!</p>
        </div>
      )}
    </div>
  );
}
