import { GoogleGenAI, Type } from '@google/genai';

// Types for Process Flow
export interface FlowOption {
    id: string;
    label: string;
    description?: string;
    scriptText?: string;
}

export interface FlowStep {
    title: string;
    subtitle?: string;
    options: FlowOption[];
    scriptSuggestion?: string;
}

export interface FlowData {
    [key: string]: FlowStep;
}

export class GeminiService {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({
            apiKey: apiKey,
        });
    }

    async generateFlowData(conversationData: any[]): Promise<FlowData> {
        const config = {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    required: ["stepId", "title", "options"],
                    properties: {
                        stepId: {
                            type: Type.STRING,
                            description: "Unique identifier for this troubleshooting step"
                        },
                        title: {
                            type: Type.STRING,
                            description: "Clear title describing this step in the troubleshooting process"
                        },
                        subtitle: {
                            type: Type.STRING,
                            description: "Additional context or explanation for this step"
                        },
                        scriptSuggestion: {
                            type: Type.STRING,
                            description: "What the agent should say at this step"
                        },
                        options: {
                            type: Type.ARRAY,
                            description: "Possible next actions or paths based on findings in this step",
                            items: {
                                type: Type.OBJECT,
                                required: ["id", "label"],
                                properties: {
                                    id: {
                                        type: Type.STRING,
                                        description: "Identifier for this option, should relate to the next step"
                                    },
                                    label: {
                                        type: Type.STRING,
                                        description: "Clear description of this option"
                                    },
                                    description: {
                                        type: Type.STRING,
                                        description: "Detailed explanation of when to choose this option"
                                    },
                                    scriptText: {
                                        type: Type.STRING,
                                        description: "What to say when taking this option"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            systemInstruction: [
                {
                    text: `Analyze the conversation and create a step-by-step troubleshooting flow.
                    For each step:
                    1. Identify the key issue or check being performed
                    2. Provide clear instructions for the agent
                    3. Include relevant script suggestions
                    4. List possible outcomes and next steps
                    
                    The flow should be practical and directly related to solving the specific issue found in the conversation.
                    Start with a step that has stepId 'start' for the initial problem assessment.`
                }
            ]
        };

        const prompt = `
            Analyze this customer service conversation and create a practical troubleshooting flow.
            Break down the problem-solving process into clear steps, focusing on the specific issue being discussed.

            Conversation:
            ${conversationData.map(msg => `${msg.role}: ${msg.text}`).join('\n')}

            Create a flow that:
            1. Starts by identifying and confirming the specific issue
            2. Breaks down the troubleshooting into logical steps
            3. Includes verification steps to confirm the problem is resolved
            4. Provides clear scripts for communicating with the customer
            5. Considers different scenarios based on the customer's responses
            6. Ends with resolution confirmation or escalation if needed

            Make each step actionable and specific to this conversation's context.
            Focus on practical steps that directly address the issue being discussed.
        `;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config
            });

            // Access the text content correctly using first candidate
            const flowSteps = JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || '[]');

            // Convert array of steps to FlowData object
            const flowData: FlowData = {};
            for (const step of flowSteps) {
                flowData[step.stepId] = {
                    title: step.title,
                    subtitle: step.subtitle,
                    options: step.options,
                    scriptSuggestion: step.scriptSuggestion
                };
            }

            console.log('flowData', flowData);
            return flowData;
        } catch (error) {
            console.error('Error generating flow data:', error);
            throw error;
        }
    }
} 