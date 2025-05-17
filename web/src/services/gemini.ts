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

// New CX Insights Types
export interface CustomerSentiment {
    score: number;  // -1 to 1
    label: string;  // negative, neutral, positive
    confidence: number;
    keyPhrases: string[];
}

export interface CustomerProfile {
    customerType: string;  // new, returning, loyal
    engagementLevel: string;  // low, medium, high
    preferredChannels: string[];
    recentInteractions: number;
}

export interface IssueAnalysis {
    category: string;
    priority: string;
    complexity: string;
    estimatedResolutionTime: string;
    similarPastIssues: number;
}

export interface ActionableInsight {
    type: string;  // immediate, short-term, long-term
    recommendation: string;
    impact: string;
    confidence: number;
}

export interface CXInsights {
    sentiment: CustomerSentiment;
    profile: CustomerProfile;
    issue: IssueAnalysis;
    actionableInsights: ActionableInsight[];
    keyTakeaways: string[];
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

    async generateCXInsights(conversationData: any[]): Promise<CXInsights> {
        const config = {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                required: ["sentiment", "profile", "issue", "actionableInsights", "keyTakeaways"],
                properties: {
                    sentiment: {
                        type: Type.OBJECT,
                        required: ["score", "label", "confidence", "keyPhrases"],
                        properties: {
                            score: { type: Type.NUMBER },
                            label: { type: Type.STRING },
                            confidence: { type: Type.NUMBER },
                            keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    },
                    profile: {
                        type: Type.OBJECT,
                        required: ["customerType", "engagementLevel", "preferredChannels", "recentInteractions"],
                        properties: {
                            customerType: { type: Type.STRING },
                            engagementLevel: { type: Type.STRING },
                            preferredChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
                            recentInteractions: { type: Type.NUMBER }
                        }
                    },
                    issue: {
                        type: Type.OBJECT,
                        required: ["category", "priority", "complexity", "estimatedResolutionTime", "similarPastIssues"],
                        properties: {
                            category: { type: Type.STRING },
                            priority: { type: Type.STRING },
                            complexity: { type: Type.STRING },
                            estimatedResolutionTime: { type: Type.STRING },
                            similarPastIssues: { type: Type.NUMBER }
                        }
                    },
                    actionableInsights: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            required: ["type", "recommendation", "impact", "confidence"],
                            properties: {
                                type: { type: Type.STRING },
                                recommendation: { type: Type.STRING },
                                impact: { type: Type.STRING },
                                confidence: { type: Type.NUMBER }
                            }
                        }
                    },
                    keyTakeaways: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            },
            systemInstruction: [
                {
                    text: `Analyze the customer service conversation to extract comprehensive CX insights.
                    Focus on:
                    1. Sentiment Analysis: Detect emotional tone, key phrases, and overall satisfaction
                    2. Customer Profiling: Identify customer type, engagement patterns, and interaction history
                    3. Issue Analysis: Categorize problem, assess complexity, and estimate resolution time
                    4. Actionable Insights: Generate data-driven recommendations for immediate and long-term improvements
                    5. Key Takeaways: Summarize critical points and patterns from the interaction
                    
                    Ensure insights are:
                    - Specific and contextual to the conversation
                    - Quantifiable where possible
                    - Actionable for customer service improvement
                    - Focused on enhancing customer experience`
                }
            ]
        };

        const prompt = `
            Analyze this customer service conversation and generate comprehensive CX insights.
            Focus on understanding the customer's experience, needs, and potential areas for improvement.

            Conversation:
            ${conversationData.map(msg => `${msg.role}: ${msg.text}`).join('\n')}

            Generate insights that:
            1. Accurately capture customer sentiment and emotional state
            2. Profile the customer based on interaction patterns
            3. Analyze the issue's nature and complexity
            4. Provide actionable recommendations
            5. Identify key patterns and learning points

            Ensure all insights are specific to this conversation and provide practical value for improving customer experience.
        `;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config
            });

            const insights = JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
            console.log('insights', insights);
            return insights;
        } catch (error) {
            console.error('Error generating CX insights:', error);
            throw error;
        }
    }
} 