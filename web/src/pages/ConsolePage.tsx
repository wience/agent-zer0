/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL: string =
  process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

const OPENAI_API_KEY: string =
  process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

import { useEffect, useRef, useCallback, useState } from 'react';

import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/conversation_config.js';
import { WavRenderer } from '../utils/wav_renderer';

import { X, Edit, Zap, ArrowUp, ArrowDown, Mic, MicOff, MessageCircle, PhoneCall, Phone, Square } from 'react-feather';
import { Button } from '../components/button/Button';
import { Toggle } from '../components/toggle/Toggle';
import { supabseAuthClient } from '@/lib/supabase/auth';
import appConfig from '@/config/app-config';
import { UserIcon } from 'lucide-react';

/**
 * Type for result from get_weather() function call
 */
interface Coordinates {
  lat: number;
  lng: number;
  location?: string;
  temperature?: {
    value: number;
    units: string;
  };
  wind_speed?: {
    value: number;
    units: string;
  };
}

/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

// Add type for payload
interface ConversationPayload {
  new?: {
    conversation_data: any[];
    id: string;
    status: string;
  };
  eventType: string;
}

// Add this type for better message handling
interface ChatMessage {
  role: string;
  text: string;
  created_at: string;
  formatted?: {
    text?: string;
    transcript?: string;
  };
}

export function ConsolePage() {
  const clientRef = useRef<RealtimeClient | null>(null);
  const [isWaitingForAIResponse, setIsWaitingForAIResponse] = useState(false);
  const [isConversationLogOpen, setIsConversationLogOpen] = useState(false);
  const [isChattingWithAgent, setIsChattingWithAgent] = useState(false);
  const [agentChatId, setAgentChatId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Initialize RealtimeClient immediately on component mount
  useEffect(() => {
    // Debug log to see what's in the environment variable
    console.log('OPENAI_API_KEY value:', OPENAI_API_KEY);
    console.log('Environment variables available:', process.env);

    try {
      if (LOCAL_RELAY_SERVER_URL || OPENAI_API_KEY) {
        clientRef.current = new RealtimeClient(
          LOCAL_RELAY_SERVER_URL
            ? { url: LOCAL_RELAY_SERVER_URL }
            : {
              apiKey: OPENAI_API_KEY,
              dangerouslyAllowAPIKeyInBrowser: true,
            },
        );
        console.log('RealtimeClient initialized successfully');
      } else {
        console.error('No API key or relay server URL provided');
      }
    } catch (error) {
      console.error('Failed to initialize RealtimeClient:', error);
    }
  }, []);

  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 }),
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 }),
  );

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   * - memoryKv is for set_memory() function
   * - coords, marker are for get_weather() function
   */
  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [canPushToTalk, setCanPushToTalk] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [, setMemoryKv] = useState<{ [key: string]: any }>({});
  const [, setCoords] = useState<Coordinates | null>({
    lat: 37.775593,
    lng: -122.418137,
  });
  const [, setMarker] = useState<Coordinates | null>(null);

  // Add state for agent chat messages
  const [agentChatMessages, setAgentChatMessages] = useState<ChatMessage[]>([]);

  // Add state for input message
  const [inputMessage, setInputMessage] = useState('');

  /**
   * Utility for formatting the timing of logs
   */
  const formatTime = useCallback((timestamp: string) => {
    const startTime = startTimeRef.current;
    const t0 = new Date(startTime).valueOf();
    const t1 = new Date(timestamp).valueOf();
    const delta = t1 - t0;
    const hs = Math.floor(delta / 10) % 100;
    const s = Math.floor(delta / 1000) % 60;
    const m = Math.floor(delta / 60_000) % 60;
    const pad = (n: number) => {
      let s = n + '';
      while (s.length < 2) {
        s = '0' + s;
      }
      return s;
    };
    return `${pad(m)}:${pad(s)}.${pad(hs)}`;
  }, []);

  /**
   * Display API key information
   */
  const showAPIKeyInfo = useCallback(() => {
    console.log('API key is managed through environment variables');
  }, []);

  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();

    // Connect to realtime API
    await client.connect();
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello I need to contact the support team!`,
        // text: `For testing purposes, I want you to list ten car brands. Number each item, e.g. "one (or whatever number you are one): the item name".`
      },
    ]);

    // Set state variables
    startTimeRef.current = new Date().toISOString();
    setIsConnected(true);
    setRealtimeEvents([]);
    setItems(client.conversation.getItems());

    if (client.getTurnDetectionType() === 'server_vad') {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
  }, []);

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setRealtimeEvents([]);
    setItems([]);
    setMemoryKv({});
    setCoords({
      lat: 37.775593,
      lng: -122.418137,
    });
    setMarker(null);

    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');
    client.deleteItem(id);
  }, []);

  /**
   * In push-to-talk mode, start recording
   * .appendInputAudio() for each sample
   */
  const startRecording = async () => {
    setIsRecording(true);
    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const trackSampleOffset = await wavStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      await client.cancelResponse(trackId, offset);
    }
    await wavRecorder.record((data) => {
      client.appendInputAudio(data.mono);
    });
  };

  /**
   * In push-to-talk mode, stop recording
   */
  const stopRecording = async () => {
    setIsRecording(false);
    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');
    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.pause();
    if (client.inputAudioBuffer.byteLength > 0) {
      // commit the input audio buffer to the server
      client.realtime.send('input_audio_buffer.commit', {});
      client.conversation.queueInputAudio(client.inputAudioBuffer);
      client.inputAudioBuffer = new Int16Array(0);
    }
  };

  /**
   * Toggle between starting and stopping recording
   */
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
      // After user stops recording, they need to wait for AI response
      setIsWaitingForAIResponse(true);
    } else {
      // Only allow starting recording if not waiting for AI response
      if (!isWaitingForAIResponse) {
        await startRecording();
      }
    }
  };

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async (value: string) => {
    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');
    const wavRecorder = wavRecorderRef.current;
    if (value === 'none' && wavRecorder.getStatus() === 'recording') {
      await wavRecorder.pause();
    }
    client.updateSession({
      turn_detection: value === 'none' ? null : { type: 'server_vad' },
    });
    if (value === 'server_vad' && client.isConnected()) {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
    setCanPushToTalk(value === 'none');
  };

  const injectContext = async (transcript: string) => {
    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');

    transcript = transcript.trim();
    if (transcript.length === 0) {
      console.log(`Empty transcript - can't generate context`);
      return;
    }
    console.log(`Triggering context API for ${transcript}`);

    try {
      const response = await fetch(
        `/api/context?query=${encodeURIComponent(transcript)}&openAIApiKey=${encodeURIComponent(OPENAI_API_KEY)}`,
      );

      if (!response.ok) {
        console.error(`HTTP error: ${response.status}`);
        return; // Don't throw, just log and continue
      }

      const data = await response.json();
      console.log(`Received context API response: ${data.message}`);
      client.sendUserMessageContent([
        {
          type: 'input_text',
          text: data.message,
        },
      ]);
      if (client.getTurnDetectionType() === null) {
        // if we are not in push-to-talk mode, create a response
        client.createResponse();
      }
    } catch (error) {
      console.error('Error in injectContext:', error);
    }
  };

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]'),
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  /**
   * Set up render loops for the visualization canvas
   */
  useEffect(() => {
    let isLoaded = true;

    const wavRecorder = wavRecorderRef.current;
    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const wavStreamPlayer = wavStreamPlayerRef.current;
    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth;
            clientCanvas.height = clientCanvas.offsetHeight;
          }
          clientCtx = clientCtx || clientCanvas.getContext('2d');
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              clientCanvas,
              clientCtx,
              result.values,
              '#FFFFFF',
              10,
              0,
              8,
            );
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth;
            serverCanvas.height = serverCanvas.offsetHeight;
          }
          serverCtx = serverCtx || serverCanvas.getContext('2d');
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            const result = wavStreamPlayer.analyser
              ? wavStreamPlayer.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              serverCanvas,
              serverCtx,
              result.values,
              '#FFFFFF',
              10,
              0,
              8,
            );
          }
        }
        window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, []);

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;
    if (!client) return;

    // Set instructions
    client.updateSession({ instructions: instructions });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

    // Add tools
    client.addTool(
      {
        name: 'set_memory',
        description: 'Saves important data about the user into memory.',
        parameters: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description:
                'The key of the memory value. Always use lowercase and underscores, no other characters.',
            },
            value: {
              type: 'string',
              description: 'Value can be anything represented as a string',
            },
          },
          required: ['key', 'value'],
        },
      },
      async ({ key, value }: { [key: string]: any }) => {
        setMemoryKv((memoryKv) => {
          const newKv = { ...memoryKv };
          newKv[key] = value;
          return newKv;
        });
        return { ok: true };
      },
    );
    client.addTool(
      {
        name: 'get_weather',
        description:
          'Retrieves the weather for a given lat, lng coordinate pair. Specify a label for the location.',
        parameters: {
          type: 'object',
          properties: {
            lat: {
              type: 'number',
              description: 'Latitude',
            },
            lng: {
              type: 'number',
              description: 'Longitude',
            },
            location: {
              type: 'string',
              description: 'Name of the location',
            },
          },
          required: ['lat', 'lng', 'location'],
        },
      },
      async ({ lat, lng, location }: { [key: string]: any }) => {
        setMarker({ lat, lng, location });
        setCoords({ lat, lng, location });
        const result = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`,
        );
        const json = await result.json();
        const temperature = {
          value: json.current.temperature_2m as number,
          units: json.current_units.temperature_2m as string,
        };
        const wind_speed = {
          value: json.current.wind_speed_10m as number,
          units: json.current_units.wind_speed_10m as string,
        };
        setMarker({ lat, lng, location, temperature, wind_speed });
        return json;
      },
    );

    // handle realtime events from client + server for event logging
    client.on('realtime.event', async (realtimeEvent: RealtimeEvent) => {
      if (
        realtimeEvent.event.type ===
        'conversation.item.input_audio_transcription.completed'
      ) {
        console.log(
          'conversation.item.input_audio_transcription.completed',
          realtimeEvent,
        );
        // transcript of a user message is available
        await injectContext(realtimeEvent.event.transcript);
      }
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          // if we receive multiple events in a row, aggregate them for display purposes
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });
    client.on('error', (event: any) => console.error(event));
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });
    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000,
        );
        item.formatted.file = wavFile;
      }

      // Check if this is an AI response completion
      if (item.role === 'assistant' && item.status === 'completed') {
        // AI has responded, user can speak again
        setIsWaitingForAIResponse(false);

        // Check if the response suggests transferring to a human agent
        if (item.formatted.transcript && 
            item.formatted.transcript.toLowerCase().includes('would you like me to transfer you to a human agent')) {
          setShowTransferModal(true);
        }
      }

      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, [clientRef.current]);

  // Add subscription ref to maintain subscription across renders
  const subscriptionRef = useRef<any>(null);

  // Add useEffect to handle real-time updates
  useEffect(() => {
    // Cleanup previous subscription if exists
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Modify sendToAgent to handle message format conversion
  const sendToAgent = async () => {
    const client = clientRef.current;
    if (!client) throw new Error('RealtimeClient is not initialized');

    const conversationItems = client.conversation.getItems();
    if (conversationItems.length === 0) return;

    try {
      // Format the conversation for storage
      const formattedConversation = conversationItems.map(item => ({
        role: item.role,
        text: item.formatted.transcript || item.formatted.text || '',
        created_at: new Date().toISOString()
      }));

      // Insert conversation into Supabase
      const { data, error } = await supabseAuthClient.supabase
        .from('conversations')
        .insert({
          conversation_data: formattedConversation,
          status: 'new'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending conversation to agent:', error);
        return;
      }

      console.log('Conversation sent to agent successfully:', data);

      // Set the chat ID and switch to agent chat mode
      setAgentChatId(data.id);
      setIsChattingWithAgent(true);
      setAgentChatMessages(data.conversation_data);

      // Unsubscribe from previous subscription if exists
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      // Create new subscription
      subscriptionRef.current = supabseAuthClient.supabase
        .channel(`conversation_${data.id}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `id=eq.${data.id}`
          },
          (payload: ConversationPayload) => {
            console.log('Received real-time update:', payload);

            if (payload.eventType === 'UPDATE' && payload.new?.conversation_data) {
              console.log('Updated conversation data:', payload.new.conversation_data);
              setAgentChatMessages(payload.new.conversation_data);
            }
          }
        )
        .subscribe();

    } catch (error) {
      console.error('Error sending conversation to agent:', error);
    }
  };

  // Modify sendMessageToAgent to use the new message format
  const sendMessageToAgent = async (text: string) => {
    if (!agentChatId) return;

    try {
      // Get current conversation
      const { data: currentConversation } = await supabseAuthClient.supabase
        .from('conversations')
        .select('conversation_data')
        .eq('id', agentChatId)
        .single();

      if (!currentConversation) return;

      const newMessage: ChatMessage = {
        role: 'user',
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
      setAgentChatMessages(updatedConversation.conversation_data);

      // Update conversation in Supabase
      const { error } = await supabseAuthClient.supabase
        .from('conversations')
        .update(updatedConversation)
        .eq('id', agentChatId);

      if (error) {
        console.error('Error sending message to agent:', error);
        // Revert optimistic update on error
        setAgentChatMessages(currentConversation.conversation_data);
      }
    } catch (error) {
      console.error('Error sending message to agent:', error);
    }
  };

  // Add cleanup when chat ends
  const endChat = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    setIsChattingWithAgent(false);
    setAgentChatId(null);
    setAgentChatMessages([]);
  };

  // Add function to handle message sending
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendMessageToAgent(inputMessage.trim());
      setInputMessage('');
    }
  };

  // Add function to handle input key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Render the application
   */
  return (
    <div data-component="ConsolePage" className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* GCash Header */}
      <header className="w-full p-5 border-b border-gray-200 flex justify-between items-center bg-blue-600 text-white">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">GCash Support Center</h1>
          <div className="bg-white text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {isChattingWithAgent ? 'Live Agent' : 'AI-Powered'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span>Online</span>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center flex-1 py-8">
        {isChattingWithAgent ? (
          // Agent Chat UI
          <div className="flex-1 flex flex-col p-4 pb-24 w-full max-w-4xl bg-white rounded-lg shadow-lg mb-20">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-gray-700">Live Chat with Agent</span>
              </div>
              <div className="text-sm text-gray-500">
                {agentChatMessages.length} messages
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto my-4 space-y-4 px-2 scroll-smooth"
              style={{ maxHeight: 'calc(100vh - 400px)' }}
            >
              {agentChatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-500">
                  <svg
                    className="w-12 h-12 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p>Starting chat with agent...</p>
                  <p className="text-sm">Please wait while we connect you</p>
                </div>
              ) : (
                agentChatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-sm ${message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      <div className="text-xs mb-1 opacity-75 flex items-center space-x-1">
                        {message.role === 'user' ? (
                          <>
                            <span>You</span>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>Agent</span>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                            </svg>
                          </>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      <div className="text-xs mt-1 opacity-75">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="flex flex-col space-y-3 mt-auto pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Type your message..."
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className={`p-2 rounded-full transition-colors ${inputMessage.trim()
                        ? 'text-blue-500 hover:bg-blue-50'
                        : 'text-gray-300 cursor-not-allowed'
                        }`}
                      title="Send message"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={endChat}
                className="w-full p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>End Chat</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Wave Visualization Container */}
            <div className="w-64 max-w-md mb-8">
              <div className="rounded-lg shadow-lg overflow-hidden border-2 border-blue-500">
                <div className="h-48 bg-blue-900 rounded relative">
                  <div className="bg-blue-700 text-white px-3 py-2 flex items-center justify-between">
                    <span className="font-medium">
                      {isRecording ? "Listening..." : "GCash Virtual Assistant"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                    </div>
                  </div>

                  <div className={`absolute inset-0 pt-10 ${isRecording ? 'block' : 'hidden'}`}>
                    <canvas ref={clientCanvasRef} className="w-full h-full" />
                  </div>

                  <div className={`absolute inset-0 pt-10 ${!isRecording ? 'block' : 'hidden'}`}>
                    <canvas ref={serverCanvasRef} className="w-full h-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col items-center space-y-4">
              {!isConnected ? (
                <button
                  onClick={connectConversation}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-8 py-3 flex items-center shadow-lg transition duration-300"
                >
                  <PhoneCall className="h-5 w-5 mr-2" />
                  <span>Connect to GCash Support</span>
                </button>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-3">
                    {canPushToTalk && (
                      <button
                        onClick={toggleRecording}
                        disabled={!isRecording && isWaitingForAIResponse}
                        className={`${isRecording
                          ? 'bg-red-500 hover:bg-red-600'
                          : isWaitingForAIResponse
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                          } text-white font-medium rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition duration-300`}
                      >
                        {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                      </button>
                    )}

                    <button
                      onClick={disconnectConversation}
                      disabled={isRecording}
                      className={`${isRecording ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white font-medium rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition duration-300`}
                    >
                      <Phone className="h-6 w-6 transform rotate-135" />
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <div className="text-sm text-blue-700 font-medium">
                    {isWaitingForAIResponse ?
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing your request...
                      </span> :
                      <span className="flex items-center">
                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                        Ready to help
                      </span>
                    }
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Conversation Log Button */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setIsConversationLogOpen(!isConversationLogOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center transition duration-300"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          Call Logs
        </button>
      </div>

      {/* Conversation Log Popup */}
      {isConversationLogOpen && (
        <div className="fixed bottom-20 right-4 w-96 md:w-1/3 max-w-2xl max-h-96 bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
            <h3 className="font-medium flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              GCash Support Chat History
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={sendToAgent}
                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center"
              >
                <UserIcon className="h-4 w-4 mr-1" />
                Send to Agent
              </button>
              <button
                onClick={() => setIsConversationLogOpen(false)}
                className="text-white hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-80 p-3 bg-gray-50">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-6 flex flex-col items-center">
                <MessageCircle className="h-8 w-8 text-blue-300 mb-2" />
                <p>No conversation yet</p>
                <p className="text-xs text-blue-500 mt-1">Connect to start calling with GCash support</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className={`mb-3 p-3 rounded-lg ${item.role === 'user'
                      ? 'bg-blue-100 ml-4'
                      : 'bg-white border border-blue-200 mr-4 shadow-sm'
                      }`}
                  >
                    <div className="font-semibold text-xs mb-1 flex items-center">
                      {item.role === 'user' ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center mr-1 text-xs">U</div>
                          <span className="text-blue-800">You</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full bg-blue-800 text-white flex items-center justify-center mr-1 text-xs">G</div>
                          <span className="text-blue-800">GCash Support</span>
                        </>
                      )}
                    </div>
                    <div className="text-gray-800">
                      {item.formatted.transcript || item.formatted.text || '(processing...)'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-blue-800">Transfer to Live Agent</h3>
            <p className="mb-6 text-gray-700">Would you like to be transferred to a live customer support agent?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  sendToAgent();
                  setShowTransferModal(false);
                  disconnectConversation();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center"
              >
                <UserIcon className="h-5 w-5 mr-2" />
                Connect with Agent
              </button>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  disconnectConversation();
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg shadow transition-colors flex items-center justify-center"
              >
                <Phone className="h-5 w-5 mr-2 transform rotate-135" />
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsolePage;
