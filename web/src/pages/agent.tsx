import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabseAuthClient } from '@/lib/supabase/auth';
import { GeminiService, FlowData, FlowOption, FlowStep } from '../services/gemini';

// UI Components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AIInsights, Insight } from '../components/ui/ai-insights';

// Types for Conversation
interface ConversationMessage {
    role: string;
    text: string;
    created_at: string;
}

interface Conversation {
    id: string;
    status: string;
    lastMessage: string;
    time: string;
    conversation_data: ConversationMessage[];
}

// Process Flow types are imported from gemini service

// Process Flow Component
const ProcessFlow = ({ conversationTranscript }: { conversationTranscript: ConversationMessage[] }) => {
    const [currentStep, setCurrentStep] = useState<string>('start');
    const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['Conversation Flow']);
    const [scriptDisplay, setScriptDisplay] = useState<string | null>(null);
    const [flowData, setFlowData] = useState<FlowData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateFlow = async () => {
            if (!conversationTranscript || conversationTranscript.length === 0) {
                setFlowData(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const geminiService = new GeminiService(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
                const generatedFlowData = await geminiService.generateFlowData(conversationTranscript);

                setFlowData(generatedFlowData);

                // Reset to start when flow data changes
                setCurrentStep('start');
                setBreadcrumbs(['Conversation Flow']);
                setScriptDisplay(generatedFlowData.start?.scriptSuggestion || null);
            } catch (err) {
                console.error('Error generating flow:', err);
                setError('Failed to generate conversation flow. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        generateFlow();
    }, [conversationTranscript]);

    const handleOptionClick = (optionId: string) => {
        if (!flowData) return;

        const selectedOption = flowData[currentStep].options.find(opt => opt.id === optionId);

        if (flowData[optionId]) {
            // Navigate to next step
            setCurrentStep(optionId);
            setBreadcrumbs([...breadcrumbs, flowData[optionId].title]);
            setScriptDisplay(flowData[optionId].scriptSuggestion || null);
        } else if (selectedOption?.scriptText) {
            // Display script text for final step
            setScriptDisplay(selectedOption.scriptText);
        }
    };

    const navigateToBreadcrumb = (index: number) => {
        if (!flowData) return;

        if (index === 0) {
            // Home
            setCurrentStep('start');
            setBreadcrumbs(['Conversation Flow']);
            setScriptDisplay(flowData['start']?.scriptSuggestion || null);
        } else {
            // Find the step that corresponds to this breadcrumb
            const steps = Object.keys(flowData);
            const targetStep = steps.find(step => flowData[step].title === breadcrumbs[index]);

            if (targetStep) {
                setCurrentStep(targetStep);
                setBreadcrumbs(breadcrumbs.slice(0, index + 1));
                setScriptDisplay(flowData[targetStep].scriptSuggestion || null);
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="text-gray-600">Generating conversation flow...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-600">{error}</p>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!flowData || !flowData[currentStep]) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex items-center justify-center">
                <p className="text-gray-600">No conversation flow available. Start a conversation to generate flow.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col shadow-sm">
            {/* Header with help icon */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                    {flowData[currentStep].title}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0 rounded-full"
                    title="Get Help"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </Button>
            </div>

            {/* Simplified breadcrumb */}
            <div className="mb-3 flex flex-wrap items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                        {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                        <button
                            onClick={() => navigateToBreadcrumb(index)}
                            className={`hover:text-blue-600 px-1 py-0.5 rounded ${index === breadcrumbs.length - 1 ? 'font-medium bg-blue-50 text-blue-700' : ''}`}
                        >
                            {crumb}
                        </button>
                    </div>
                ))}
            </div>

            {/* Current step subtitle */}
            {flowData[currentStep].subtitle && (
                <p className="text-sm text-gray-600 mb-3">{flowData[currentStep].subtitle}</p>
            )}

            {/* Script suggestion with cleaner design */}
            {scriptDisplay && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                    <div className="flex justify-between">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Suggested Response:</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-700 h-6 -mt-1"
                            onClick={() => navigator.clipboard.writeText(scriptDisplay)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            Copy
                        </Button>
                    </div>
                    <p className="text-sm text-gray-700">{scriptDisplay}</p>
                </div>
            )}

            {/* Options with improved visual hierarchy */}
            <div className="space-y-2 mt-1">
                {flowData[currentStep].options.map((option: FlowOption) => (
                    <button
                        key={option.id}
                        className="w-full p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 
                                   text-left transition-colors flex items-start space-x-3 focus:outline-none 
                                   focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                        onClick={() => handleOptionClick(option.id)}
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        </div>
                        <div>
                            <div className="font-medium text-gray-800">{option.label}</div>
                            {option.description && (
                                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Simple back button */}
            {currentStep !== 'start' && (
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 self-start text-gray-600"
                    onClick={() => {
                        // Go back to previous step
                        const newBreadcrumbs = [...breadcrumbs];
                        newBreadcrumbs.pop();
                        setBreadcrumbs(newBreadcrumbs);

                        // Find the previous step
                        const prevStepTitle = newBreadcrumbs[newBreadcrumbs.length - 1];
                        if (prevStepTitle === 'Conversation Flow') {
                            setCurrentStep('start');
                            setScriptDisplay(flowData['start']?.scriptSuggestion || null);
                        } else {
                            const steps = Object.keys(flowData);
                            const prevStep = steps.find(step => flowData[step].title === prevStepTitle);
                            if (prevStep) {
                                setCurrentStep(prevStep);
                                setScriptDisplay(flowData[prevStep].scriptSuggestion || null);
                            }
                        }
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back
                </Button>
            )}
        </div>
    );
};

const AgentDashboard = () => {
    const [customerQuery, setCustomerQuery] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [conversationTranscript, setConversationTranscript] = useState<ConversationMessage[]>([]);

    const [suggestedResponses, setSuggestedResponses] = useState([
        'I understand you\'re having an issue with a failed transaction due to verification issues. I\'ll help you troubleshoot this problem.',
        'I\'ll check your account\'s verification status to see why your transaction is being blocked. Could you please confirm the reference number of the failed transaction?',
        'Let me look into why you\'re receiving a verification error. First, I need to check if your KYC (Know Your Customer) verification is complete in our system.'
    ]);

    const [customerInsights, setCustomerInsights] = useState({
        sentiment: 'frustrated',
        loyalty: 'verified user (1+ year)',
        previousIssues: 0,
        suggestedActions: ['Check KYC status', 'Verify recent login activity']
    });

    // Handle AI insight actions
    const handleInsightAction = (insight: Insight, action: string) => {
        console.log(`Action ${action} taken on insight:`, insight);

        // Add the action to the response if it's an "apply" action
        if (action === 'apply') {
            if (insight.type === 'action') {
                setCustomerQuery(insight.content);
            }
        }
    };

    // Fetch conversations from Supabase
    useEffect(() => {
        async function fetchConversations() {
            try {
                setLoading(true);

                const { data: conversationsData, error } = await supabseAuthClient.supabase
                    .from('conversations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching conversations:', error);
                    return;
                }

                console.log('conversationsData', conversationsData);
                if (conversationsData && conversationsData.length > 0) {
                    // Transform the data to match our Conversation interface
                    const formattedConversations = conversationsData.map((conv): Conversation => {
                        // Get the last message from conversation_data
                        const lastMsg = conv.conversation_data && conv.conversation_data.length > 0
                            ? conv.conversation_data[conv.conversation_data.length - 1].text
                            : 'No messages';

                        // Format relative time
                        const timeAgo = getRelativeTime(new Date(conv.created_at));

                        return {
                            id: conv.id,
                            status: conv.status || 'waiting',
                            lastMessage: lastMsg.slice(0, 60) + (lastMsg.length > 60 ? '...' : ''),
                            time: timeAgo,
                            conversation_data: conv.conversation_data
                        };
                    });

                    setConversations(formattedConversations);

                    // Select the first conversation by default
                    if (formattedConversations.length > 0 && !selectedConversation) {
                        setSelectedConversation(formattedConversations[0].id);
                        setConversationTranscript(formattedConversations[0].conversation_data || []);
                    }
                }
            } catch (error) {
                console.error('Error in fetchConversations:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchConversations();

        // Set up a subscription to listen for new conversations
        const subscription = supabseAuthClient.supabase
            .channel('conversations_channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'conversations'
            }, (payload) => {
                // When a new conversation is added, refresh the list
                fetchConversations();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Helper function to determine priority based on content
    const getPriorityFromContent = (content: string): string => {
        const urgentKeywords = ['urgent', 'emergency', 'failed', 'error', 'issue', 'problem'];
        const mediumKeywords = ['help', 'assistance', 'question', 'confused'];

        const lowerContent = content.toLowerCase();

        if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'high';
        } else if (mediumKeywords.some(keyword => lowerContent.includes(keyword))) {
            return 'medium';
        }

        return 'low';
    };

    // Helper function to format relative time
    const getRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds} secs ago`;
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)} mins ago`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        } else {
            return `${Math.floor(diffInSeconds / 86400)} days ago`;
        }
    };

    // Handle conversation selection
    const handleConversationSelect = (convId: string) => {
        setSelectedConversation(convId);

        // Find the selected conversation and set its transcript
        const selectedConv = conversations.find(conv => conv.id === convId);
        if (selectedConv && selectedConv.conversation_data) {
            setConversationTranscript(selectedConv.conversation_data);
        } else {
            setConversationTranscript([]);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
            <Toaster position="top-right" reverseOrder={false} />

            {/* Header */}
            <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white">
                <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold">GCash Support Console</h1>
                    <Badge className="bg-white text-blue-600">AI-Powered</Badge>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Online</span>
                    </div>
                    <Button className="bg-white text-blue-600 hover:bg-gray-100">Settings</Button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left sidebar - Conversations */}
                <div className="w-1/5 border-r border-gray-200 overflow-y-auto p-4 bg-white">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-2 text-gray-800">Active Conversations</h2>
                        <Input
                            type="search"
                            placeholder="Search conversations..."
                            className="bg-white border-gray-300"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {conversations.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    No conversations yet
                                </div>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        onClick={() => handleConversationSelect(conv.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConversation === conv.id
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-800">Wince {conv.id.slice(0, 8)}...</span>
                                            <Badge
                                                className={`${conv.status === 'active'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-500 text-white'}`}
                                            >
                                                {conv.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                                        <div className="flex justify-end items-center mt-2">
                                            <span className="text-xs text-gray-500">{conv.time}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Main content area - Flow Diagram and Transcript */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Flow Diagram */}
                    <div className="flex-1 p-4 overflow-hidden flex flex-col">
                        <div className="mb-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Support Cheat Sheet</h2>
                            <div className="text-sm text-gray-500">
                                Interactive guide for agents
                            </div>
                        </div>

                        {/* Process Flow Component */}
                        <ProcessFlow conversationTranscript={conversationTranscript} />
                    </div>

                    {/* Conversation Transcript Section */}
                    {selectedConversation && (
                        <div className="p-4 border-t border-gray-200">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">Customer Transcript</h3>
                            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                                {conversationTranscript.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10">
                                        No transcript available
                                    </div>
                                ) : (
                                    conversationTranscript.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`mb-3 p-3 rounded-lg ${message.role === 'user'
                                                ? 'bg-blue-100 ml-10'
                                                : 'bg-gray-100 mr-10'
                                                }`}
                                        >
                                            <div className="font-semibold text-xs text-gray-700 mb-1">
                                                {message.role === 'user' ? 'Customer' : 'AI Assistant'}
                                            </div>
                                            <p className="text-sm">{message.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right sidebar - Customer info & AI insights */}
                <div className="w-1/5 border-l border-gray-200 p-4 overflow-y-auto bg-white">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Customer Profile</h2>
                        <div className="bg-white rounded-lg p-3 mb-2 border border-gray-200 shadow-sm">
                            <div className="flex items-center mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg mr-3 text-white">
                                    MS
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-800">Maria Santos</h3>
                                    <p className="text-xs text-gray-500">GCash user since 2022</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-gray-500">Account Type:</p>
                                    <p className="text-gray-800">Semi-Verified</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Phone:</p>
                                    <p className="text-gray-800">+63 917 123 4567</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Transaction Details</h2>
                        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Reference No:</span>
                                    <span className="font-medium text-gray-800">GC23102567890</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount:</span>
                                    <span className="font-medium text-gray-800">₱10,000.00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date/Time:</span>
                                    <span className="font-medium text-gray-800">Oct 25, 2023 3:45 PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Type:</span>
                                    <span className="font-medium text-gray-800">Send Money (GCash to GCash)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <Badge className="bg-red-100 text-red-800 border border-red-200">Failed</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Error:</span>
                                    <span className="text-red-600 font-medium">Transaction failed due to verification issues</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Insights Component */}
                    <div className="mb-6">
                        <AIInsights
                            conversationId={selectedConversation ?? ''}
                            customerName="Customer"
                            onInsightAction={handleInsightAction}
                        />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-3 text-gray-800">Transaction History</h2>
                        <div className="space-y-2">
                            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">GC23102567890</span>
                                    <Badge className="bg-red-100 text-red-800 border border-red-200">Failed</Badge>
                                </div>
                                <p className="text-sm text-gray-700">Send Money - ₱10,000.00</p>
                                <p className="text-xs text-gray-500">Oct 25, 2023 3:45 PM</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">GC23102398765</span>
                                    <Badge className="bg-green-100 text-green-800 border border-green-200">Success</Badge>
                                </div>
                                <p className="text-sm text-gray-700">Cash In (7-Eleven) - ₱2,000.00</p>
                                <p className="text-xs text-gray-500">Oct 23, 2023 10:12 AM</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-800">GC23102087654</span>
                                    <Badge className="bg-green-100 text-green-800 border border-green-200">Success</Badge>
                                </div>
                                <p className="text-sm text-gray-700">Pay Bills (PLDT) - ₱1,499.00</p>
                                <p className="text-xs text-gray-500">Oct 20, 2023 5:30 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;

