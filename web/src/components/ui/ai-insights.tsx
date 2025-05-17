import { useState, useEffect } from 'react';
import { Badge } from './badge';
import { Button } from './button';

export interface Insight {
    type: 'sentiment' | 'customer' | 'action';
    content: string;
    priority: 'low' | 'medium' | 'high';
}

interface AIInsightsProps {
    insights: Insight[];
    onAction: (insight: Insight, action: string) => void;
}

export const AIInsights = ({
    insights,
    onAction
}: AIInsightsProps) => {
    // Get appropriate styling based on insight type
    const getInsightStyles = (type: Insight['type']) => {
        switch (type) {
            case 'sentiment':
                return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
            case 'customer':
                return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
            case 'action':
                return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    // Get badge color based on priority
    const getBadgeColor = (priority: Insight['priority']) => {
        switch (priority) {
            case 'high':
                return 'bg-red-600 text-white';
            case 'medium':
                return 'bg-amber-600 text-white';
            case 'low':
                return 'bg-blue-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    return (
        <div className="space-y-3">
            {insights.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No insights available yet.</p>
                </div>
            ) : (
                insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg border ${getInsightStyles(insight.type)}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Badge className={getBadgeColor(insight.priority)}>
                                {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                            </Badge>
                        </div>

                        <p className="text-sm mb-2 text-gray-700">{insight.content}</p>

                        {insight.type === 'action' && (
                            <div className="mt-3 flex space-x-2">
                                <Button
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => onAction(insight, 'apply')}
                                >
                                    Apply
                                </Button>
                                <Button
                                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    onClick={() => onAction(insight, 'dismiss')}
                                >
                                    Dismiss
                                </Button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}; 