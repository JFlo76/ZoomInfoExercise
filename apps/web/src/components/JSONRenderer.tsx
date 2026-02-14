/**
 * Dynamic JSON-based UI Component Renderer
 * This component renders UI components from JSON configurations
 */

import React, { useState } from 'react';
import { UIComponent, parseUIComponent } from '../schemas/ui-schemas';

interface JSONRendererProps {
    json: string | UIComponent;
    themeColor?: string;
    currentState?: {
        components: Record<string, any>;
        formData: Record<string, any>;
        appData: Record<string, any>;
        lastUpdate: number;
    };
    onStateUpdate?: (stateKey: string, data: any) => void;
    onAction?: (action: string, params?: any) => void;
}

export function JSONRenderer({ json, themeColor = "#6366f1", currentState, onStateUpdate, onAction }: JSONRendererProps) {
    try {
        const component = typeof json === 'string' ? parseUIComponent(JSON.parse(json)) : json;

        const componentProps = {
            component,
            themeColor,
            currentState,
            onStateUpdate,
            onAction
        };

        switch (component.type) {
            case 'weather':
                return <WeatherComponent {...componentProps} />;

            case 'dataVisualization':
                return <DataVisualizationComponent {...componentProps} />;

            case 'form':
                return <FormComponent {...componentProps} />;

            case 'actionCard':
                return <ActionCardComponent {...componentProps} />;

            case 'dashboard':
                return <DashboardComponent {...componentProps} />;

            case 'workflow':
                return <WorkflowComponent {...componentProps} />;

            default:
                return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
                        <h3 className="font-bold">Unknown Component Type</h3>
                        <p>Component type "{(component as any).type}" is not supported.</p>
                    </div>
                );
        }
    } catch (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
                <h3 className="font-bold">JSON Parsing Error</h3>
                <p>Failed to parse component JSON: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
        );
    }
}

// Weather Component
interface ComponentProps {
    component: any;
    themeColor: string;
    currentState?: {
        components: Record<string, any>;
        formData: Record<string, any>;
        appData: Record<string, any>;
        lastUpdate: number;
    };
    onStateUpdate?: (stateKey: string, data: any) => void;
    onAction?: (action: string, params?: any) => void;
}

function WeatherComponent({ component, themeColor, currentState, onStateUpdate }: ComponentProps) {
    const getWeatherIcon = (icon?: string) => {
        switch (icon) {
            case 'sun': return '☀️';
            case 'cloud': return '☁️';
            case 'rain': return '🌧️';
            case 'snow': return '❄️';
            default: return '🌤️';
        }
    };

    return (
        <div className="bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 rounded-xl p-6 max-w-md shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-sky-900">{component.title}</h3>
                    <p className="text-sky-700 text-sm">Current conditions</p>
                </div>
                <div className="text-4xl">{getWeatherIcon(component.icon)}</div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-sky-800">Temperature:</span>
                    <span className="font-semibold text-sky-900">{component.temperature}</span>
                </div>
                {component.feelsLike && (
                    <div className="flex justify-between">
                        <span className="text-sky-800">Feels like:</span>
                        <span className="font-semibold text-sky-900">{component.feelsLike}</span>
                    </div>
                )}
                {component.humidity && (
                    <div className="flex justify-between">
                        <span className="text-sky-800">Humidity:</span>
                        <span className="font-semibold text-sky-900">{component.humidity}</span>
                    </div>
                )}
                {component.windSpeed && (
                    <div className="flex justify-between">
                        <span className="text-sky-800">Wind:</span>
                        <span className="font-semibold text-sky-900">{component.windSpeed}</span>
                    </div>
                )}
            </div>

            {component.description && (
                <p className="text-sky-700 text-sm mt-4 pt-4 border-t border-sky-200">
                    {component.description}
                </p>
            )}
        </div>
    );
}

// Data Visualization Component
function DataVisualizationComponent({ component, themeColor, currentState, onStateUpdate }: ComponentProps) {
    if (component.chartType === 'table' || !component.chartType) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{component.title}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 text-gray-700 font-semibold">Label</th>
                                <th className="text-right py-2 px-3 text-gray-700 font-semibold">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {component.data?.map((item: any, index: number) => (
                                <tr key={index} className="border-b border-gray-100">
                                    <td className="py-2 px-3 text-gray-800">{item.label}</td>
                                    <td className="py-2 px-3 text-right text-gray-900 font-medium">{item.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Simple bar chart visualization
    if (component.chartType === 'bar') {
        const maxValue = Math.max(...(component.data?.map((item: any) => Number(item.value)) || [1]));

        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{component.title}</h3>
                <div className="space-y-3">
                    {component.data?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-20 text-sm text-gray-700 truncate">{item.label}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                <div
                                    className="h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                                    style={{
                                        backgroundColor: item.color || themeColor,
                                        width: `${(Number(item.value) / maxValue) * 100}%`
                                    }}
                                >
                                    {item.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{component.title}</h3>
            <p className="text-gray-600">Chart type "{component.chartType}" not yet implemented.</p>
        </div>
    );
}

// Form Component
function FormComponent({
    component,
    themeColor,
    currentState,
    onStateUpdate,
    onAction
}: ComponentProps) {
    // Initialize form data from shared state or empty
    const savedFormData = currentState?.formData?.[component.id] || {};
    const [formData, setFormData] = useState<Record<string, any>>(savedFormData);

    const handleInputChange = (name: string, value: any) => {
        const newFormData = { ...formData, [name]: value };
        setFormData(newFormData);

        // Update shared state in real-time
        if (onStateUpdate) {
            console.log(`📝 Form ${component.id} updating field ${name}:`, value);
            console.log('📝 Complete form data:', newFormData);
            onStateUpdate('formData', { [component.id]: newFormData });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Update the SAME form data entry with submitted status
        const submittedData = {
            ...formData,
            submitted: true,
            submittedAt: new Date().toISOString()
        };

        if (onStateUpdate) {
            console.log(`✅ Form ${component.id} submitted:`, submittedData);
            // Keep the same component ID so agent can find the data
            onStateUpdate('formData', { [component.id]: submittedData });
        }

        if (onAction) {
            onAction(component.onSubmit || 'formSubmit', { formData: submittedData, formId: component.id });
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{component.title}</h3>
            {component.description && (
                <p className="text-gray-600 text-sm mb-4">{component.description}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {component.fields?.map((field: any, index: number) => (
                    <div key={index}>
                        {field.label && (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        )}

                        {field.type === 'textarea' ? (
                            <textarea
                                name={field.name}
                                placeholder={field.placeholder}
                                required={field.required}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                            />
                        ) : field.type === 'select' ? (
                            <select
                                name={field.name}
                                required={field.required}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                            >
                                <option value="">Select an option</option>
                                {field.options?.map((option: string, optIndex: number) => (
                                    <option key={optIndex} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type}
                                name={field.name}
                                placeholder={field.placeholder}
                                required={field.required}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                            />
                        )}
                    </div>
                ))}

                <button
                    type="submit"
                    className="w-full py-2 px-4 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: themeColor }}
                >
                    {component.submitButton?.text || 'Submit'}
                </button>
            </form>
        </div>
    );
}

// Action Card Component
function ActionCardComponent({ component, themeColor, currentState, onStateUpdate, onAction }: ComponentProps) {
    const getButtonStyle = (style: string) => {
        switch (style) {
            case 'secondary': return 'bg-gray-500 hover:bg-gray-600';
            case 'success': return 'bg-green-500 hover:bg-green-600';
            case 'warning': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'danger': return 'bg-red-500 hover:bg-red-600';
            default: return 'hover:opacity-90';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{component.title}</h3>
            {component.description && (
                <p className="text-gray-600 text-sm mb-4">{component.description}</p>
            )}

            <div className="space-y-2">
                {component.actions?.map((action: any, index: number) => (
                    <button
                        key={index}
                        onClick={() => onAction && onAction(action.action, action.params)}
                        className={`w-full py-2 px-4 rounded-lg font-medium text-white transition-colors ${getButtonStyle(action.style)}`}
                        style={action.style === 'primary' ? { backgroundColor: themeColor } : undefined}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Dashboard Component
function DashboardComponent({ component, themeColor, currentState, onStateUpdate, onAction }: ComponentProps) {
    const getGridClasses = () => {
        if (component.layout === 'columns') return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        if (component.layout === 'rows') return 'flex flex-col gap-6';
        return `grid grid-cols-1 md:grid-cols-${component.gridCols || 3} gap-6`;
    };

    return (
        <div className="bg-gray-50 p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{component.title}</h2>
            <div className={getGridClasses()}>
                {component.sections?.map((section: any, index: number) => (
                    <div key={index}>
                        <JSONRenderer
                            json={section.component}
                            themeColor={themeColor}
                            onAction={onAction}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Workflow Component
function WorkflowComponent({ component, themeColor, currentState, onStateUpdate, onAction }: ComponentProps) {
    // Get saved workflow progress from shared state or use default
    const savedProgress = currentState?.components?.[component.id] || { currentStep: component.currentStep || 0 };
    const [currentStep, setCurrentStep] = useState(savedProgress.currentStep);

    const updateWorkflowProgress = (step: number) => {
        setCurrentStep(step);

        // Update shared state with workflow progress
        if (onStateUpdate) {
            onStateUpdate('components', {
                [component.id]: {
                    currentStep: step,
                    completedSteps: Array.from({ length: step + 1 }, (_, i) => i),
                    lastUpdated: new Date().toISOString(),
                    title: component.title
                }
            });
        }
    };

    const nextStep = () => {
        if (currentStep < component.steps.length - 1) {
            updateWorkflowProgress(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            updateWorkflowProgress(currentStep - 1);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{component.title}</h3>

            {component.showProgress && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Step {currentStep + 1} of {component.steps.length}</span>
                        <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / component.steps.length) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: themeColor,
                                width: `${((currentStep + 1) / component.steps.length) * 100}%`
                            }}
                        />
                    </div>
                </div>
            )}

            {component.steps[currentStep] && (
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        {component.steps[currentStep].title}
                    </h4>
                    {component.steps[currentStep].description && (
                        <p className="text-gray-600 mb-4">{component.steps[currentStep].description}</p>
                    )}

                    {/* Render step-specific content */}
                    {component.steps[currentStep].component && (
                        <JSONRenderer
                            json={component.steps[currentStep].component}
                            themeColor={themeColor}
                            currentState={currentState}
                            onStateUpdate={onStateUpdate}
                            onAction={onAction}
                        />
                    )}
                </div>
            )}

            <div className="flex justify-between">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={nextStep}
                    disabled={currentStep === component.steps.length - 1}
                    className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: themeColor }}
                >
                    {currentStep === component.steps.length - 1 ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
}

export default JSONRenderer;