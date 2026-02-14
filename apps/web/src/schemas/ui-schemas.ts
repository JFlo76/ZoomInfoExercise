/**
 * JSON-based UI Component Schemas
 * These define the structure for dynamically generated UI components
 */

import { z } from "zod";

// Base component schema
const BaseComponentSchema = z.object({
    id: z.string(),
    type: z.string(),
    title: z.string().optional(),
    className: z.string().optional(),
    style: z.record(z.string()).optional(),
});

// Weather component schema
export const WeatherComponentSchema = BaseComponentSchema.extend({
    type: z.literal("weather"),
    location: z.string(),
    temperature: z.string().optional(),
    description: z.string().optional(),
    humidity: z.string().optional(),
    windSpeed: z.string().optional(),
    feelsLike: z.string().optional(),
    icon: z.string().optional(),
});

// Data visualization component schema
export const DataVisualizationSchema = BaseComponentSchema.extend({
    type: z.literal("dataVisualization"),
    chartType: z.enum(["bar", "line", "pie", "table"]).optional().default("table"),
    data: z.array(z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        color: z.string().optional(),
    })),
    xAxis: z.string().optional(),
    yAxis: z.string().optional(),
});

// Form field schema
const FormFieldSchema = z.object({
    name: z.string(),
    type: z.enum(["text", "email", "password", "number", "textarea", "select", "checkbox", "radio"]),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    required: z.boolean().optional().default(false),
    options: z.array(z.string()).optional(), // For select/radio
    validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
        message: z.string().optional(),
    }).optional(),
});

// Interactive form component schema
export const FormComponentSchema = BaseComponentSchema.extend({
    type: z.literal("form"),
    description: z.string().optional(),
    fields: z.array(FormFieldSchema),
    submitButton: z.object({
        text: z.string().default("Submit"),
        style: z.enum(["primary", "secondary", "success", "danger"]).optional().default("primary"),
    }).optional(),
    onSubmit: z.string().optional(), // Action to trigger on submit
});

// Action button schema
const ActionButtonSchema = z.object({
    label: z.string(),
    action: z.string(), // Action to trigger
    params: z.record(z.any()).optional(),
    style: z.enum(["primary", "secondary", "success", "warning", "danger"]).optional().default("primary"),
    size: z.enum(["sm", "md", "lg"]).optional().default("md"),
    disabled: z.boolean().optional().default(false),
    icon: z.string().optional(),
});

// Action card component schema
export const ActionCardSchema = BaseComponentSchema.extend({
    type: z.literal("actionCard"),
    description: z.string().optional(),
    image: z.string().optional(),
    actions: z.array(ActionButtonSchema),
    variant: z.enum(["default", "outlined", "elevated"]).optional().default("default"),
});

// Dashboard section schema
const DashboardSectionSchema = z.object({
    id: z.string(),
    type: z.enum(["metric", "chart", "table", "form", "weather", "actionCard"]),
    title: z.string(),
    span: z.object({
        cols: z.number().min(1).max(12).optional().default(1),
        rows: z.number().min(1).max(6).optional().default(1),
    }).optional(),
    component: z.union([
        WeatherComponentSchema,
        DataVisualizationSchema,
        FormComponentSchema,
        ActionCardSchema,
        z.object({ type: z.literal("metric"), value: z.string(), unit: z.string().optional() }),
    ]),
});

// Dashboard component schema
export const DashboardSchema = BaseComponentSchema.extend({
    type: z.literal("dashboard"),
    layout: z.enum(["grid", "columns", "rows"]).optional().default("grid"),
    sections: z.array(DashboardSectionSchema),
    gridCols: z.number().min(1).max(12).optional().default(3),
    gap: z.enum(["sm", "md", "lg"]).optional().default("md"),
});

// Workflow step schema
const WorkflowStepSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(["form", "info", "action", "review"]),
    completed: z.boolean().default(false),
    component: z.union([
        FormComponentSchema,
        ActionCardSchema,
        z.object({ type: z.literal("info"), content: z.string() }),
    ]).optional(),
});

// Workflow component schema
export const WorkflowSchema = BaseComponentSchema.extend({
    type: z.literal("workflow"),
    currentStep: z.number().default(0),
    steps: z.array(WorkflowStepSchema),
    showProgress: z.boolean().optional().default(true),
    allowSkip: z.boolean().optional().default(false),
});

// Union of all component schemas
export const UIComponentSchema = z.union([
    WeatherComponentSchema,
    DataVisualizationSchema,
    FormComponentSchema,
    ActionCardSchema,
    DashboardSchema,
    WorkflowSchema,
]);

// Export types
export type WeatherComponent = z.infer<typeof WeatherComponentSchema>;
export type DataVisualizationComponent = z.infer<typeof DataVisualizationSchema>;
export type FormComponent = z.infer<typeof FormComponentSchema>;
export type ActionCardComponent = z.infer<typeof ActionCardSchema>;
export type DashboardComponent = z.infer<typeof DashboardSchema>;
export type WorkflowComponent = z.infer<typeof WorkflowSchema>;
export type UIComponent = z.infer<typeof UIComponentSchema>;

// Component registry for validation and creation
export const ComponentRegistry = {
    weather: WeatherComponentSchema,
    dataVisualization: DataVisualizationSchema,
    form: FormComponentSchema,
    actionCard: ActionCardSchema,
    dashboard: DashboardSchema,
    workflow: WorkflowSchema,
} as const;

// Utility function to validate and parse component JSON
export function parseUIComponent(json: unknown): UIComponent {
    return UIComponentSchema.parse(json);
}

// Utility function to create component with defaults
export function createComponent(type: keyof typeof ComponentRegistry, data: Partial<UIComponent>): UIComponent {
    const schema = ComponentRegistry[type];
    const defaultData = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        ...data,
    };

    return schema.parse(defaultData) as UIComponent;
}