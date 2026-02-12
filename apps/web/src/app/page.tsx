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

  return (
    <main style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}>
      <YourMainContent themeColor={themeColor} />
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Open-JSON-UI Assistant",
          initial: "👋 Hi! I'm your Open-JSON-UI assistant. I can create beautiful, interactive UI components inspired by OpenAI's declarative UI standard.\n\nTry these commands:\n- **Weather Card**: \"What's the weather in San Francisco?\"\n- **Data Visualization**: \"Show me sales data visualization\"\n- **Interactive Form**: \"Create a contact form\"\n- **Shared State**: \"Write a proverb about AI\"\n- **Theme**: \"Set the theme to green\"\n\nWatch as I generate beautiful UI components in real-time! ✨"
        }}
      />
    </main>
  );
}

// State of the agent, make sure this aligns with your agent's state.
type AgentState = {
  proverbs: string[];
}

function YourMainContent({ themeColor }: { themeColor: string }) {
  // 🪁 Shared State: https://docs.copilotkit.ai/coagents/shared-state
  const { state, setState } = useCoAgent<AgentState>({
    name: "starterAgent",
    initialState: {
      proverbs: [
        "CopilotKit may be new, but its the best thing since sliced bread.",
      ],
    },
  })

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/coagents/frontend-actions
  useCopilotAction({
    name: "addProverb",
    description: "Add a proverb to the list.",
    parameters: [{
      name: "proverb",
      description: "The proverb to add. Make it witty, short and concise.",
      required: true,
    }],
    handler: ({ proverb }) => {
      setState((prevState) => ({
        ...prevState,
        proverbs: [...(prevState?.proverbs || []), proverb],
      }));
    },
  }, [setState]);

  // 🪁 Backend Tool Rendering: Render agent tool calls with Open-JSON-UI inspired components
  useRenderToolCall({
    name: "getWeather",
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return <LoadingCard title="Getting Weather" description={`Fetching weather data for ${args.location}...`} />;
      }
      return <WeatherCard location={args.location} themeColor={themeColor} result={result} />;
    },
  });

  useRenderToolCall({
    name: "showDataVisualization",
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return <LoadingCard title="Creating Visualization" description={`Generating ${args.title}...`} />;
      }
      return <DataVisualizationCard title={args.title} items={args.items} themeColor={themeColor} />;
    },
  });

  useRenderToolCall({
    name: "createInteractiveForm",
    render: ({ status, args, result }) => {
      if (status === "inProgress") {
        return <LoadingCard title="Creating Form" description={`Building ${args.title}...`} />;
      }
      return <InteractiveFormCard title={args.title} description={args.description} fields={args.fields} themeColor={themeColor} />;
    },
  });

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="h-screen w-screen flex justify-center items-center flex-col transition-colors duration-300"
    >
      <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">Proverbs</h1>
        <p className="text-gray-200 text-center italic mb-6">This is a demonstrative page, but it could be anything you want! 🪁</p>
        <hr className="border-white/20 my-6" />
        <div className="flex flex-col gap-3">
          {state.proverbs?.map((proverb, index) => (
            <div
              key={index}
              className="bg-white/15 p-4 rounded-xl text-white relative group hover:bg-white/20 transition-all"
            >
              <p className="pr-8">{proverb}</p>
              <button
                onClick={() => setState({
                  ...state,
                  proverbs: state.proverbs?.filter((_, i) => i !== index),
                })}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity
                  bg-red-500 hover:bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {state.proverbs?.length === 0 && <p className="text-center text-white/80 italic my-8">
          No proverbs yet. Ask the assistant to add some!
        </p>}
      </div>
    </div>
  );
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
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-6 my-4 max-w-md shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 text-sm mb-4">{description}</p>
      )}

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Enter your email"
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
    </div>
  )
};
