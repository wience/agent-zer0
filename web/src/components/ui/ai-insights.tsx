import { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Button } from './button';

export interface Insight {
    id: string;
    type: 'suggestion' | 'warning' | 'info' | 'action';
    content: string;
    source?: string;
    confidence?: number;
    timestamp: Date;
}

interface AIInsightsProps {
    conversationId: string;
    customerName: string;
    onInsightAction?: (insight: Insight, action: string) => void;
}

export const AIInsights = ({
    conversationId,
    customerName,
    onInsightAction
}: AIInsightsProps) => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Simulated AI insights generation
    useEffect(() => {
        // This would normally fetch from an API
        const simulateInsights = () => {
            setIsAnalyzing(true);

            setTimeout(() => {
                const newInsights: Insight[] = [
                    {
                        id: '1',
                        type: 'info',
                        content: `${customerName} has contacted support 3 times in the past month about shipping issues.`,
                        source: 'Customer History',
                        confidence: 0.92,
                        timestamp: new Date()
                    },
                    {
                        id: '2',
                        type: 'suggestion',
                        content: 'Based on the conversation, this customer might qualify for our loyalty program discount.',
                        source: 'Policy Engine',
                        confidence: 0.85,
                        timestamp: new Date()
                    },
                    {
                        id: '3',
                        type: 'warning',
                        content: 'Customer sentiment is declining. Consider offering a quick resolution or escalation.',
                        source: 'Sentiment Analysis',
                        confidence: 0.78,
                        timestamp: new Date()
                    },
                    {
                        id: '4',
                        type: 'action',
                        content: 'Offer free expedited shipping as compensation for the delay.',
                        source: 'Resolution Engine',
                        confidence: 0.89,
                        timestamp: new Date()
                    }
                ];

                setInsights(newInsights);
                setIsAnalyzing(false);
            }, 1500);
        };

        simulateInsights();

        // In a real app, you might set up a subscription
        const intervalId = setInterval(() => {
            // Periodically add new insights based on conversation updates
            if (Math.random() > 0.7) {
                setInsights(prev => [
                    ...prev,
                    {
                        id: `new-${Date.now()}`,
                        type: 'suggestion' as const,
                        content: 'This customer might be interested in our new premium protection plan based on their purchase history.',
                        source: 'Cross-sell Engine',
                        confidence: 0.73,
                        timestamp: new Date()
                    }
                ]);
            }
        }, 10000);

        return () => clearInterval(intervalId);
    }, [conversationId, customerName]);

    // Get appropriate styling based on insight type
    const getInsightStyles = (type: Insight['type']) => {
        switch (type) {
            case 'suggestion':
                return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
            case 'warning':
                return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
            case 'info':
                return 'bg-sky-50 border-sky-200 hover:bg-sky-100';
            case 'action':
                return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    // Get badge color based on insight type
    const getBadgeColor = (type: Insight['type']) => {
        switch (type) {
            case 'suggestion':
                return 'bg-blue-600 text-white';
            case 'warning':
                return 'bg-amber-600 text-white';
            case 'info':
                return 'bg-sky-600 text-white';
            case 'action':
                return 'bg-emerald-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white">
                <div className="flex items-center">
                    <span className="text-lg font-medium">AI Insights</span>
                    <Badge className="ml-2 bg-white text-blue-600">Real-time</Badge>
                </div>
                {isAnalyzing && (
                    <div className="flex items-center">
                        <div className="animate-pulse h-3 w-3 bg-white rounded-full mr-2"></div>
                        <span className="text-sm text-white">Analyzing conversation...</span>
                    </div>
                )}
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
                {insights.length === 0 && isAnalyzing ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                        <p className="text-gray-500">Analyzing conversation patterns...</p>
                    </div>
                ) : insights.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No insights available yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {insights.map((insight) => (
                            <div
                                key={insight.id}
                                className={`p-3 rounded-lg border ${getInsightStyles(insight.type)}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <Badge className={getBadgeColor(insight.type)}>
                                        {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                                    </Badge>
                                    {insight.confidence && (
                                        <div className="flex items-center">
                                            <span className="text-xs text-gray-500 mr-1">Confidence:</span>
                                            <span className="text-xs font-medium text-gray-700">
                                                {Math.round(insight.confidence * 100)}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm mb-2 text-gray-700">{insight.content}</p>

                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                    <span>Source: {insight.source || 'AI Analysis'}</span>
                                    <span>{insight.timestamp.toLocaleTimeString()}</span>
                                </div>

                                {insight.type === 'action' && (
                                    <div className="mt-3 flex space-x-2">
                                        <Button
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => onInsightAction?.(insight, 'apply')}
                                        >
                                            Apply
                                        </Button>
                                        <Button
                                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700"
                                            onClick={() => onInsightAction?.(insight, 'dismiss')}
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}; 