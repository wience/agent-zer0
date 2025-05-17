import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

// UI Components
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AIInsights, Insight } from '../components/ui/ai-insights';

// Types for Process Flow
interface FlowOption {
    id: string;
    label: string;
    description?: string;
    scriptText?: string;
}

interface FlowStep {
    title: string;
    subtitle?: string;
    options: FlowOption[];
    scriptSuggestion?: string;
}

interface FlowData {
    [key: string]: FlowStep;
}

// Process Flow Component
const ProcessFlow = () => {
    const [currentStep, setCurrentStep] = useState<string>('start');
    const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['Conversation Flow']);
    const [scriptDisplay, setScriptDisplay] = useState<string | null>(null);

    const flowData: FlowData = {
        start: {
            title: 'Escalated Call Received',
            subtitle: 'Begin by orienting yourself with customer information',
            scriptSuggestion: "Thank you for your patience. My name is [Agent Name] and I'll be helping you resolve this issue today. I understand you've been experiencing problems with your transaction. Let me take a moment to review your information.",
            options: [
                {
                    id: 'reviewInfo',
                    label: 'Review AI Transcript & Customer Info',
                    description: 'Check customer history, transaction details, and previous conversation'
                }
            ]
        },
        reviewInfo: {
            title: 'Review AI Transcript & Customer Info',
            subtitle: 'Understand the customers issue before proceeding',
            scriptSuggestion: "I've reviewed your information. I see you're having an issue with a failed transaction that mentions verification issues. Let me check your account status to understand what might be causing this.",
            options: [
                {
                    id: 'checkKYC',
                    label: 'Check Customer KYC Status',
                    description: 'Verify if customer has completed Know Your Customer requirements'
                }
            ]
        },
        checkKYC: {
            title: 'Check Customer KYC Status',
            subtitle: 'Determine if verification issues are KYC related',
            options: [
                {
                    id: 'kycIncomplete',
                    label: 'KYC Incomplete',
                    description: 'Customer has not completed verification requirements'
                },
                {
                    id: 'kycComplete',
                    label: 'KYC Complete',
                    description: 'Customer has completed all verification steps'
                }
            ]
        },
        kycIncomplete: {
            title: 'KYC Incomplete',
            subtitle: 'Guide customer through verification process',
            scriptSuggestion: "I've checked your account and found that your verification process is incomplete. To complete larger transactions, GCash requires full verification of your identity. Would you like me to guide you through the verification process now?",
            options: [
                {
                    id: 'explainDocuments',
                    label: 'Explain Document Requirements',
                    description: 'Detail which documents are needed and how to upload them',
                    scriptText: "To complete your verification, you'll need to upload a valid government ID (like a driver's license, passport, or SSS ID) and take a selfie for facial verification. You can do this by going to Profile > Verify Now in your GCash app."
                },
                {
                    id: 'endCallDocuments',
                    label: 'End Call After Document Instructions',
                    description: 'Conclude call after customer understands requirements',
                    scriptText: "Once you've uploaded these documents, your account should be verified within 24-48 hours. After that, you'll be able to make larger transactions without encountering this verification issue. Is there anything else I can help you with today?"
                }
            ]
        },
        kycComplete: {
            title: 'KYC Complete - Review Transaction Logs',
            subtitle: 'Check for system errors in transaction history',
            scriptSuggestion: "I see your account is fully verified. Let me check your transaction logs to identify what might be causing the verification error.",
            options: [
                {
                    id: 'systemErrors',
                    label: 'System Errors Detected',
                    description: 'Technical issues found in transaction logs'
                },
                {
                    id: 'noSystemErrors',
                    label: 'No System Errors',
                    description: 'No technical problems identified in logs'
                }
            ]
        },
        systemErrors: {
            title: 'System Errors Detected',
            subtitle: 'Handle technical issues requiring escalation',
            scriptSuggestion: "I've identified some technical issues in the system that are affecting your transaction. This would require attention from our technical team.",
            options: [
                {
                    id: 'escalateTechnical',
                    label: 'Escalate to Technical Team',
                    description: 'Create technical support ticket',
                    scriptText: "I'll need to escalate this to our technical support team. They'll investigate the system error that's preventing your transaction. I'm creating a support ticket for you right now."
                },
                {
                    id: 'informCustomerEscalation',
                    label: 'Inform Customer About Escalation',
                    description: 'Explain next steps after escalation',
                    scriptText: "Your case has been escalated to our technical team. They'll work on resolving this issue as soon as possible. You'll receive a notification once it's fixed, typically within 24-48 hours. Is there a preferred contact method for updates on this issue?"
                }
            ]
        },
        noSystemErrors: {
            title: 'No System Errors - Investigate Other Causes',
            subtitle: 'Explore user-specific issues and recent account activity',
            scriptSuggestion: "I don't see any system errors in your transaction logs. Let's look into other possible causes for this verification issue.",
            options: [
                {
                    id: 'askActivity',
                    label: 'Ask About Recent Account Activity',
                    description: 'Inquire about unusual login attempts or transactions',
                    scriptText: "Have you noticed any unusual activity on your account recently? For example, login attempts from unfamiliar devices or locations, or transactions you didn't authorize? Sometimes security measures can trigger verification requirements."
                },
                {
                    id: 'troubleshootingGuidance',
                    label: 'Provide Troubleshooting Guidance',
                    description: 'Offer solutions based on customer response',
                    scriptText: "Based on what you've shared, I recommend trying the following steps: 1) Log out and restart your GCash app, 2) Ensure you're using the latest app version, 3) Try the transaction again but with a smaller amount first to test. Would you like to try these steps while I stay on the line?"
                }
            ]
        },
        troubleshootingGuidance: {
            title: 'Troubleshooting Guidance',
            subtitle: 'Determine if issue is resolved after guidance',
            scriptSuggestion: "Let's see if those troubleshooting steps have helped with your transaction issue.",
            options: [
                {
                    id: 'issueResolved',
                    label: 'Issue Resolved',
                    description: 'Customer confirms problem is fixed',
                    scriptText: "I'm glad to hear the issue has been resolved! Your transaction has gone through successfully. Is there anything else you need help with today?"
                },
                {
                    id: 'issueNotResolved',
                    label: 'Issue Not Resolved',
                    description: 'Problem persists after troubleshooting',
                    scriptText: "I understand the issue hasn't been resolved yet. At this point, I recommend creating a support ticket to track this case more closely. Our specialized team will investigate this further and contact you within 24-48 hours. Would that be okay with you?"
                }
            ]
        },
        issueResolved: {
            title: 'Issue Resolved - Confirm Success',
            subtitle: 'Verify transaction completed successfully',
            scriptSuggestion: "Great! Let's confirm that your transaction has been processed correctly.",
            options: [
                {
                    id: 'confirmTransaction',
                    label: 'Confirm Successful Transfer',
                    description: 'Verify funds have been transferred correctly',
                    scriptText: "I can confirm that your transfer of ₱10,000 to account ending in 4567 has been successfully completed. The reference number is GC23102567890. I recommend keeping this reference number for your records."
                },
                {
                    id: 'endCallSuccess',
                    label: 'End Call After Confirmation',
                    description: 'Conclude call with satisfied customer',
                    scriptText: "Thank you for your patience throughout this process. Is there anything else I can help you with today? If not, please don't hesitate to contact GCash support if you have any questions in the future. Have a great day!"
                }
            ]
        },
        issueNotResolved: {
            title: 'Issue Not Resolved - Follow Up Support',
            subtitle: 'Offer additional assistance options',
            scriptSuggestion: "I understand this is frustrating. Let me offer some follow-up support options.",
            options: [
                {
                    id: 'createTicket',
                    label: 'Create Support Ticket',
                    description: 'Log detailed issue for specialized team',
                    scriptText: "I'm creating a detailed support ticket for your case right now. This will be assigned to our specialized payments team who can investigate deeper. Your ticket number is #GC-23478. You'll receive updates via SMS and email."
                },
                {
                    id: 'offerAlternatives',
                    label: 'Suggest Alternatives',
                    description: 'Provide workarounds for immediate needs',
                    scriptText: "While we work on resolving this issue, may I suggest some alternatives for your immediate needs? You could try using GCash's 'Request Money' feature and have the recipient send funds to you instead, or you might consider using a different payment method temporarily."
                },
                {
                    id: 'endCallTicket',
                    label: 'End Call With Next Steps',
                    description: 'Conclude call with clear follow-up plan',
                    scriptText: "A specialized agent will contact you within 24-48 hours regarding your ticket #GC-23478. In the meantime, if you have any questions or if the issue resolves itself, you can update us by replying to the confirmation email you'll receive shortly. Thank you for your patience, and I apologize for the inconvenience caused."
                }
            ]
        }
    };

    const handleOptionClick = (optionId: string) => {
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
        if (index === 0) {
            // Home
            setCurrentStep('start');
            setBreadcrumbs(['Conversation Flow']);
            setScriptDisplay(flowData['start'].scriptSuggestion || null);
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
                            setScriptDisplay(flowData['start'].scriptSuggestion || null);
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
    const [conversations, setConversations] = useState([
        {
            id: '1',
            customer: 'Maria Santos',
            status: 'active',
            priority: 'high',
            lastMessage: 'My GCash transfer failed with "verification issues" error',
            time: '2 mins ago'
        },
        {
            id: '2',
            customer: 'John Smith',
            status: 'waiting',
            priority: 'medium',
            lastMessage: 'Can\'t verify my account after uploading ID',
            time: '15 mins ago'
        },
        {
            id: '3',
            customer: 'Sarah Garcia',
            status: 'waiting',
            priority: 'high',
            lastMessage: 'Transfer failed but funds were deducted',
            time: '32 mins ago'
        }
    ]);

    const [selectedConversation, setSelectedConversation] = useState('1');
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

                    <div className="space-y-2">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConversation === conv.id
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-800">{conv.customer}</span>
                                    <Badge
                                        className={`${conv.priority === 'high'
                                            ? 'bg-red-500 text-white'
                                            : conv.priority === 'medium'
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-green-500 text-white'
                                            }`}
                                    >
                                        {conv.priority}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <Badge className={`${conv.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                                        }`}>
                                        {conv.status}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{conv.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main content area - Flow Diagram */}
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
                        <ProcessFlow />
                    </div>


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
                            conversationId={selectedConversation}
                            customerName="Maria Santos"
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
