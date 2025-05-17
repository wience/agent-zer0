import { CXInsights } from '@/services/gemini';
import { Badge } from './badge';

interface CXInsightsProps {
    insights: CXInsights;
    onActionClick?: (action: string) => void;
    isLoading?: boolean;
}

const SkeletonLoader = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Sentiment Analysis Skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-6 w-40 bg-gray-200 rounded"></div>
                        <div className="h-5 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-5 w-24 bg-gray-200 rounded"></div>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-6 w-20 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Profile Skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Issue Analysis Skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="h-5 w-28 bg-gray-200 rounded"></div>
                                <div className="h-6 w-24 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actionable Insights Skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="h-5 w-24 bg-gray-200 rounded"></div>
                                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Takeaways Skeleton */}
            <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <ul className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex items-start space-x-2">
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export const CXInsightsPanel: React.FC<CXInsightsProps> = ({ insights, onActionClick, isLoading }) => {
    if (isLoading) {
        return <SkeletonLoader />;
    }

    const getSentimentColor = (score: number) => {
        if (score > 0.3) return 'bg-green-100 text-green-800';
        if (score < -0.3) return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Sentiment Analysis */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Customer Sentiment</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <Badge className={getSentimentColor(insights.sentiment.score)}>
                            {insights.sentiment.label} ({Math.round(insights.sentiment.confidence * 100)}% confidence)
                        </Badge>
                        <span className="text-sm text-gray-500">Score: {insights.sentiment.score.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600">Key Phrases:</p>
                        <div className="flex flex-wrap gap-2">
                            {insights.sentiment.keyPhrases.map((phrase, index) => (
                                <Badge key={index} variant="default" className="text-xs">
                                    {phrase}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Profile */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Customer Profile</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-medium">{insights.profile.customerType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Engagement</p>
                            <p className="font-medium">{insights.profile.engagementLevel}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Recent Interactions</p>
                            <p className="font-medium">{insights.profile.recentInteractions}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Channels</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {insights.profile.preferredChannels.map((channel, index) => (
                                    <Badge key={index} variant="default" className="text-xs">
                                        {channel}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Issue Analysis */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Issue Analysis</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Category</span>
                            <Badge>{insights.issue.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Priority</span>
                            <Badge className={getPriorityColor(insights.issue.priority)}>
                                {insights.issue.priority}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Complexity</span>
                            <Badge variant="default">{insights.issue.complexity}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Est. Resolution Time</span>
                            <span className="text-sm font-medium">{insights.issue.estimatedResolutionTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Similar Past Issues</span>
                            <span className="text-sm font-medium">{insights.issue.similarPastIssues}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actionable Insights */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Actionable Insights</h3>
                <div className="space-y-2">
                    {insights.actionableInsights.map((insight, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                            onClick={() => onActionClick?.(insight.recommendation)}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant="default" className="text-xs">
                                    {insight.type}
                                </Badge>
                                <Badge variant="default" className="text-xs">
                                    {Math.round(insight.confidence * 100)}% confidence
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-800 mb-2">{insight.recommendation}</p>
                            <p className="text-xs text-gray-500">Impact: {insight.impact}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Key Takeaways</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <ul className="space-y-2">
                        {insights.keyTakeaways.map((takeaway, index) => (
                            <li key={index} className="flex items-start space-x-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span className="text-sm text-gray-700">{takeaway}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}; 