import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabseAuthClient } from '@/lib/supabase/auth';
import { GeminiService, FlowData, FlowOption, FlowStep, CXInsights } from '../services/gemini';

// UI Components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AIInsights, Insight } from '../components/ui/ai-insights';
import { CXInsightsPanel } from '../components/ui/cx-insights';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateFlow = async () => {
        if (!conversationTranscript || conversationTranscript.length === 0) {
            setError('No conversation data available to generate flow.');
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

    if (!flowData) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col items-center justify-center space-y-4">
                <p className="text-gray-600">No conversation flow available.</p>
                <Button
                    onClick={generateFlow}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                    disabled={!conversationTranscript || conversationTranscript.length === 0}
                >
                    Generate Flow
                </Button>
                {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col shadow-sm">
            {/* Header with controls */}
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                    {flowData?.[currentStep]?.title || 'Loading...'}
                </h3>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={generateFlow}
                        className="text-gray-600 hover:text-gray-800"
                        title="Refresh Flow"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                        </svg>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0 rounded-full"
                        title="Get Help"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </Button>
                </div>
            </div>

            {/* Error message if any */}
            {error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Rest of the component remains the same */}
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

            {flowData?.[currentStep]?.subtitle && (
                <p className="text-sm text-gray-600 mb-3">{flowData[currentStep].subtitle}</p>
            )}

            {scriptDisplay && (
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Suggested Response:</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-700 h-6"
                            onClick={() => navigator.clipboard.writeText(scriptDisplay)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            Copy
                        </Button>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{scriptDisplay}</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {flowData?.[currentStep]?.options.map((option: FlowOption) => (
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

            {currentStep !== 'start' && (
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 self-start text-gray-600"
                    onClick={() => {
                        const newBreadcrumbs = [...breadcrumbs];
                        newBreadcrumbs.pop();
                        setBreadcrumbs(newBreadcrumbs);

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

    // Add new state for CX insights
    const [cxInsights, setCXInsights] = useState<CXInsights | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    // Add subscription ref to maintain subscription across renders
    const subscriptionRef = useRef<any>(null);

    // Update handleInsightAction to match new signature
    const handleInsightAction = (action: string) => {
        if (action) {
            setCustomerQuery(action);
        }
    };

    // Modify useEffect to handle real-time updates
    useEffect(() => {
        async function fetchConversations() {
            try {
                setLoading(true);
                setInsightsLoading(true);

                const { data: conversationsData, error } = await supabseAuthClient.supabase
                    .from('conversations')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching conversations:', error);
                    return;
                }

                if (conversationsData && conversationsData.length > 0) {
                    // Transform the data to match our Conversation interface
                    const formattedConversations = conversationsData.map((conv): Conversation => {
                        const lastMsg = conv.conversation_data && conv.conversation_data.length > 0
                            ? conv.conversation_data[conv.conversation_data.length - 1].text
                            : 'No messages';

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

                    // Select the first conversation by default if none selected
                    if (formattedConversations.length > 0 && !selectedConversation) {
                        setSelectedConversation(formattedConversations[0].id);
                        setConversationTranscript(formattedConversations[0].conversation_data || []);

                        // Generate CX insights for the first conversation
                        try {
                            const geminiService = new GeminiService(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
                            const insights = await geminiService.generateCXInsights(formattedConversations[0].conversation_data || []);
                            setCXInsights(insights);
                        } catch (error) {
                            console.error('Error generating CX insights:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error in fetchConversations:', error);
            } finally {
                setLoading(false);
                setInsightsLoading(false);
            }
        }

        fetchConversations();

        // Set up a subscription to listen for new conversations and updates
        const conversationsSubscription = supabseAuthClient.supabase
            .channel('agent_conversations')
            .on(
                'postgres_changes' as any,
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations'
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Add new conversation to the list
                        const conv = payload.new;
                        const lastMsg = conv.conversation_data && conv.conversation_data.length > 0
                            ? conv.conversation_data[conv.conversation_data.length - 1].text
                            : 'No messages';

                        const newConversation: Conversation = {
                            id: conv.id,
                            status: conv.status || 'waiting',
                            lastMessage: lastMsg.slice(0, 60) + (lastMsg.length > 60 ? '...' : ''),
                            time: getRelativeTime(new Date(conv.created_at)),
                            conversation_data: conv.conversation_data
                        };

                        setConversations(prev => [newConversation, ...prev]);
                    } else if (payload.eventType === 'UPDATE' && payload.new) {
                        // Update existing conversation
                        setConversations(prevConversations =>
                            prevConversations.map(conv => {
                                if (conv.id === payload.new.id) {
                                    const lastMsg = payload.new.conversation_data && payload.new.conversation_data.length > 0
                                        ? payload.new.conversation_data[payload.new.conversation_data.length - 1].text
                                        : 'No messages';

                                    return {
                                        ...conv,
                                        status: payload.new.status || conv.status,
                                        lastMessage: lastMsg.slice(0, 60) + (lastMsg.length > 60 ? '...' : ''),
                                        conversation_data: payload.new.conversation_data,
                                        time: getRelativeTime(new Date(payload.new.created_at))
                                    };
                                }
                                return conv;
                            })
                        );

                        // Update transcript if this is the selected conversation
                        if (selectedConversation === payload.new.id) {
                            setConversationTranscript(payload.new.conversation_data);
                        }
                    } else if (payload.eventType === 'DELETE') {
                        // Remove conversation from list
                        setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));

                        // If this was the selected conversation, select the first available one
                        if (selectedConversation === payload.old.id) {
                            setConversations(prev => {
                                if (prev.length > 0) {
                                    setSelectedConversation(prev[0].id);
                                    setConversationTranscript(prev[0].conversation_data || []);
                                } else {
                                    setSelectedConversation(null);
                                    setConversationTranscript([]);
                                }
                                return prev;
                            });
                        }
                    }
                }
            )
            .subscribe();

        // Cleanup function
        return () => {
            if (conversationsSubscription) {
                conversationsSubscription.unsubscribe();
            }
        };
    }, [selectedConversation]); // Add selectedConversation as dependency

    // Modify sendAgentMessage to handle optimistic updates
    const sendAgentMessage = async (text: string) => {
        if (!selectedConversation) return;

        try {
            // Get current conversation
            const { data: currentConversation } = await supabseAuthClient.supabase
                .from('conversations')
                .select('conversation_data')
                .eq('id', selectedConversation)
                .single();

            if (!currentConversation) return;

            const newMessage = {
                role: 'assistant',
                text: text,
                created_at: new Date().toISOString()
            };

            // Add new message to conversation
            const updatedConversation = {
                conversation_data: [
                    ...currentConversation.conversation_data,
                    newMessage
                ]
            };

            // Optimistically update the UI
            setConversationTranscript(updatedConversation.conversation_data);

            // Update conversation in Supabase
            const { error } = await supabseAuthClient.supabase
                .from('conversations')
                .update(updatedConversation)
                .eq('id', selectedConversation);

            if (error) {
                console.error('Error sending agent message:', error);
                // Revert optimistic update on error
                setConversationTranscript(currentConversation.conversation_data);
            }
        } catch (error) {
            console.error('Error sending agent message:', error);
        }
    };

    // Add function to generate CX insights
    const generateCXInsights = async (conversationData: any[]) => {
        try {
            setInsightsLoading(true);
            const geminiService = new GeminiService(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
            const insights = await geminiService.generateCXInsights(conversationData);
            setCXInsights(insights);
        } catch (error) {
            console.error('Error generating CX insights:', error);
        } finally {
            setInsightsLoading(false);
        }
    };

    // Modify handleConversationSelect to include CX insights generation
    const handleConversationSelect = (convId: string) => {
        setSelectedConversation(convId);

        // Find the selected conversation and set its transcript
        const selectedConv = conversations.find(conv => conv.id === convId);
        if (selectedConv && selectedConv.conversation_data) {
            setConversationTranscript(selectedConv.conversation_data);
            // Generate new insights for the selected conversation
            generateCXInsights(selectedConv.conversation_data);
        } else {
            setConversationTranscript([]);
            setCXInsights(null);
        }
    };

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

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header - Fixed height */}
            <header className="flex-none bg-blue-600 text-white shadow-md">
                <div className="px-6 py-4 flex justify-between items-center">
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
                </div>
            </header>

            {/* Main Content - Flexible height with scroll */}
            <main className="flex-1 overflow-hidden p-6">
                <div className="h-full grid grid-cols-12 gap-6 max-w-[1920px] mx-auto">
                    {/* Left Sidebar - Conversations */}
                    <div className="col-span-3 flex flex-col h-full space-y-4 min-h-0">
                        {/* Search and Filters - Fixed height */}
                        <div className="flex-none bg-white rounded-lg shadow-sm p-4">
                            <h2 className="text-lg font-semibold mb-3">Active Conversations</h2>
                            <Input
                                type="search"
                                placeholder="Search conversations..."
                                className="bg-white border-gray-300 mb-3"
                            />
                            <div className="flex space-x-2">
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">All</Badge>
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer">Active</Badge>
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer">Pending</Badge>
                            </div>
                        </div>

                        {/* Conversation List - Scrollable */}
                        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 min-h-0 overflow-y-auto">
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10">
                                        No conversations yet
                                    </div>
                                ) : (
                                    conversations.map(conv => (
                                        <div
                                            key={conv.id}
                                            onClick={() => handleConversationSelect(conv.id)}
                                            className={`p-4 rounded-lg cursor-pointer transition-all ${selectedConversation === conv.id
                                                ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                                                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-gray-800">Wince {conv.id.slice(0, 8)}...</span>
                                                <Badge className={conv.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                                    {conv.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{conv.lastMessage}</p>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                <span>{conv.time}</span>
                                                <span>ID: {conv.id.slice(0, 6)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle Section - Flow and Transcript */}
                    <div className="col-span-6 flex flex-col h-full space-y-4 min-h-0">
                        {/* Flow Diagram - Fixed height */}
                        <div className="flex-none bg-white rounded-lg shadow-sm">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold">Support Guide</h2>
                                <p className="text-sm text-gray-500">Follow the steps to assist the customer</p>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto">
                                <ProcessFlow conversationTranscript={conversationTranscript} />
                            </div>
                        </div>

                        {/* Conversation Transcript - Flexible height with scroll */}
                        {selectedConversation && (
                            <div className="flex-1 bg-white rounded-lg shadow-sm flex flex-col min-h-0">
                                <div className="flex-none p-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold">Live Chat</h2>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" className="text-gray-600">
                                            Export
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto min-h-0">
                                    {conversationTranscript.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10">
                                            No messages yet
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {conversationTranscript.map((message, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                                                >
                                                    <div
                                                        className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                                            ? 'bg-gray-100 text-gray-800'
                                                            : 'bg-blue-500 text-white'
                                                            }`}
                                                    >
                                                        <div className="text-xs mb-1 opacity-75">
                                                            {message.role === 'user' ? 'Customer' : 'Agent'}
                                                        </div>
                                                        <p className="text-sm">{message.text}</p>
                                                        <div className="text-xs mt-1 opacity-75">
                                                            {new Date(message.created_at).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Add message input */}
                                <div className="flex-none p-4 border-t border-gray-200">
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Type your message..."
                                                    className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                            sendAgentMessage(e.currentTarget.value.trim());
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />
                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Attach file"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                                                        title="Send message"
                                                        onClick={() => {
                                                            const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                                                            if (input && input.value.trim()) {
                                                                sendAgentMessage(input.value.trim());
                                                                input.value = '';
                                                            }
                                                        }}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <span>Shift + Enter for new line</span>
                                                <span>•</span>
                                                <span>Enter to send</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button className="hover:text-blue-500 transition-colors" title="Quick responses">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                    </svg>
                                                </button>
                                                <button className="hover:text-blue-500 transition-colors" title="Emoji">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar - AI Insights */}
                    <div className="col-span-3 flex flex-col h-full space-y-4 min-h-0">
                        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-semibold">CX Insights</h2>
                                        <p className="text-sm text-gray-500">Real-time customer experience analysis</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => {
                                            if (selectedConversation) {
                                                const conv = conversations.find(c => c.id === selectedConversation);
                                                if (conv?.conversation_data) {
                                                    generateCXInsights(conv.conversation_data);
                                                }
                                            }
                                        }}
                                        disabled={insightsLoading || !selectedConversation}
                                    >
                                        <svg
                                            className={`w-4 h-4 ${insightsLoading ? 'animate-spin' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                            <div className="p-4">
                                {cxInsights ? (
                                    <CXInsightsPanel
                                        insights={cxInsights}
                                        onActionClick={handleInsightAction}
                                        isLoading={insightsLoading}
                                    />
                                ) : (
                                    <div className="text-center text-gray-500 py-10">
                                        {selectedConversation ? (
                                            <CXInsightsPanel
                                                insights={{
                                                    sentiment: { score: 0, label: '', confidence: 0, keyPhrases: [] },
                                                    profile: { customerType: '', engagementLevel: '', preferredChannels: [], recentInteractions: 0 },
                                                    issue: { category: '', priority: '', complexity: '', estimatedResolutionTime: '', similarPastIssues: 0 },
                                                    actionableInsights: [],
                                                    keyTakeaways: []
                                                }}
                                                isLoading={true}
                                            />
                                        ) : (
                                            'Select a conversation to view insights'
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AgentDashboard;

