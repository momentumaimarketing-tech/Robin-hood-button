
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, LiveSession, LiveServerMessage, Modality, Type, GenerateVideosOperation, Blob } from '@google/genai';
import { Feature, FeatureId, ChatMessage, GroundingChunk, ApiKeyStore } from './types';
import { fileToBase64, blobToBase64, decode, decodeAudioData, encode } from './utils';
import { Icon } from './components/Icons';

// --- Constants ---

const FEATURES: Feature[] = [
  { id: 'dashboard', name: 'Wealth Overview', description: 'Monitor your AI asset production and campaign health.', icon: 'dashboard', category: 'Operational' },
  { id: 'socialStrategist', name: 'Traffic Engine', description: 'Automated viral traffic generation for X, IG, and LinkedIn.', icon: 'socialStrategist', category: 'Strategic' },
  { id: 'podFactory', name: 'Product Factory', description: 'High-margin Print-on-Demand design & listing engine.', icon: 'podFactory', category: 'Creative' },
  { id: 'affiliateStudio', name: 'Affiliate Studio', description: 'Generate high-conversion product reviews and landing copy.', icon: 'affiliateStudio', category: 'Strategic' },
  { id: 'imageGenerator', name: 'Visual Asset Lab', description: 'Market-ready imagery and marketing visuals.', icon: 'imageGenerator', category: 'Creative' },
  { id: 'videoGenerator', name: 'Cinematic Ad Gen', description: 'VEO-powered video commercials for social ads.', icon: 'videoGenerator', category: 'Creative' },
  { id: 'researcher', name: 'Market Intel', description: 'Real-time trend analysis via Google Search & Maps.', icon: 'researcher', category: 'Operational' },
  { id: 'chatbot', name: 'Executive Assistant', description: '24/7 strategic advisor and customer support automation.', icon: 'chatbot', category: 'Operational' },
  { id: 'liveAssistant', name: 'Voice Concierge', description: 'Real-time voice interface for executive command.', icon: 'liveAssistant', category: 'Operational' },
  { id: 'vault', name: 'Integrations Vault', description: 'Secure management for Stripe, PayPal, and Social APIs.', icon: 'vault', category: 'Control' },
];

// --- Helper Components ---

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
    </div>
);

const ViewContainer: React.FC<{ feature: Feature; children: React.ReactNode }> = ({ feature, children }) => (
    <div className="p-4 sm:p-6 lg:p-10 w-full h-full overflow-y-auto bg-gray-950">
        <div className="flex items-center space-x-3 mb-2">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-gray-900 border border-gray-800 ${
                feature.category === 'Strategic' ? 'text-amber-500' : 
                feature.category === 'Creative' ? 'text-emerald-500' : 'text-indigo-500'
            }`}>
                {feature.category}
            </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center tracking-tight">
            <Icon name={feature.icon} className="w-8 h-8 mr-4 text-emerald-500" />
            {feature.name}
        </h2>
        <p className="text-gray-500 mb-8 text-base sm:text-lg max-w-2xl font-medium">{feature.description}</p>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
        </div>
    </div>
);

const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode, variant?: 'primary' | 'secondary' | 'danger' | 'robinhood' }> = ({ onClick, disabled, children, variant = 'primary' }) => {
    const base = "w-full px-6 py-4 font-black text-white rounded-xl transition-all duration-300 transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 uppercase tracking-widest text-sm shadow-xl";
    const styles = {
        primary: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20 focus:ring-emerald-500",
        secondary: "bg-gray-800 hover:bg-gray-700 border border-gray-700 focus:ring-gray-600",
        danger: "bg-rose-600 hover:bg-rose-500 shadow-rose-900/20 focus:ring-rose-500",
        robinhood: "bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 shadow-emerald-500/10 hover:shadow-emerald-500/20 focus:ring-amber-500 animate-pulse-slow",
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}>
            {children}
        </button>
    );
};

// --- Feature Views ---

const VaultView: React.FC<{feature: Feature}> = ({ feature }) => {
    const [keys, setKeys] = useState<ApiKeyStore[]>([]);
    const [newProvider, setNewProvider] = useState('');
    const [newKey, setNewKey] = useState('');
    const [category, setCategory] = useState<ApiKeyStore['category']>('payment');

    useEffect(() => {
        const saved = localStorage.getItem('wealth_vault_keys');
        if (saved) setKeys(JSON.parse(saved));
    }, []);

    const saveKeys = (newKeys: ApiKeyStore[]) => {
        setKeys(newKeys);
        localStorage.setItem('wealth_vault_keys', JSON.stringify(newKeys));
    };

    const addKey = () => {
        if (!newProvider || !newKey) return;
        saveKeys([...keys, { provider: newProvider, key: newKey, category }]);
        setNewProvider('');
        setNewKey('');
    };

    const deleteKey = (index: number) => {
        saveKeys(keys.filter((_, i) => i !== index));
    };

    return (
        <ViewContainer feature={feature}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 shadow-2xl backdrop-blur-md">
                    <h3 className="text-xl font-black mb-6 text-white flex items-center italic uppercase">
                        <Icon name="plus" className="w-5 h-5 mr-2 text-emerald-400" />
                        New Integration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Provider</label>
                            <input value={newProvider} onChange={e => setNewProvider(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Stripe, X, Gumroad..." />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">API Secret</label>
                            <input value={newKey} onChange={e => setNewKey(e.target.value)} type="password" className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="••••••••••••••••" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">System Role</label>
                            <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none">
                                <option value="payment">Payment Gateway</option>
                                <option value="social">Social Traffic</option>
                                <option value="ecommerce">Sales / POD</option>
                                <option value="other">Utility</option>
                            </select>
                        </div>
                        <ActionButton onClick={addKey}>Secure Connect</ActionButton>
                    </div>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden backdrop-blur-md">
                    <h3 className="text-xl font-black mb-6 text-white italic uppercase">Active Vault</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {keys.length === 0 && <p className="text-gray-600 italic text-sm">Vault empty. Initialize integrations to begin automated wealth capture.</p>}
                        {keys.map((k, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-950 rounded-2xl border border-gray-800 group hover:border-emerald-500/50 transition-all duration-300">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2.5 rounded-xl ${k.category === 'payment' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                                        <Icon name={k.category === 'payment' ? 'money' : 'socialStrategist'} className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-black text-white text-sm uppercase tracking-tight">{k.provider}</div>
                                        <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{k.category}</div>
                                    </div>
                                </div>
                                <button onClick={() => deleteKey(i)} className="text-gray-700 hover:text-rose-500 p-2 transition-colors">
                                    <Icon name="trash" className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ViewContainer>
    );
};

const DashboardView: React.FC<{feature: Feature, onRobinHood: () => void}> = ({ feature, onRobinHood }) => {
    return (
        <ViewContainer feature={feature}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Asset Capacity', value: '∞ Unlimited', icon: 'podFactory', color: 'emerald' },
                    { label: 'Neural Traffic', value: 'High Bandwidth', icon: 'socialStrategist', color: 'amber' },
                    { label: 'Vault Security', value: 'AES-256 Latency', icon: 'vault', color: 'indigo' },
                    { label: 'Alpha Status', value: 'Market Dominant', icon: 'money', color: 'emerald' },
                ].map((stat, i) => (
                    <div key={i} className="bg-gray-900/40 p-6 rounded-3xl border border-gray-800 flex flex-col items-center text-center backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
                        <div className={`p-4 rounded-2xl bg-${stat.color}-950 text-${stat.color}-400 mb-4 shadow-inner`}>
                            <Icon name={stat.icon} className="w-8 h-8" />
                        </div>
                        <div className="text-xl font-black text-white tracking-tighter">{stat.value}</div>
                        <div className="text-[10px] text-gray-500 font-black uppercase mt-1 tracking-[0.2em]">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-gray-900 to-emerald-950 border border-emerald-500/20 rounded-[2.5rem] p-10 flex flex-col justify-center shadow-2xl">
                    <h3 className="text-3xl font-black text-white mb-4 italic tracking-tight uppercase">Master Control</h3>
                    <p className="text-gray-400 mb-8 leading-relaxed font-medium">
                        The Robin Hood AI engine is primed for execution. Deploy high-margin assets or query the Executive Advisor for a market-disrupting move.
                    </p>
                    <div className="max-w-xs">
                        <ActionButton variant="robinhood" onClick={onRobinHood}>ROBIN HOOD</ActionButton>
                    </div>
                </div>
                <div className="bg-gray-900/30 border border-gray-800 rounded-[2.5rem] p-10 backdrop-blur-sm">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest italic">Live Feed</h3>
                    <ul className="space-y-6">
                        <li className="flex items-start space-x-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                            <div>
                                <div className="text-sm font-black text-white uppercase tracking-tight">System Ready</div>
                                <div className="text-xs text-gray-500 mt-1">Gemini 3 Pro Executive Layer fully synchronized.</div>
                            </div>
                        </li>
                        <li className="flex items-start space-x-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-2 shadow-[0_0_10px_#f59e0b]"></div>
                            <div>
                                <div className="text-sm font-black text-white uppercase tracking-tight">Vault Operational</div>
                                <div className="text-xs text-gray-500 mt-1">Routing secure telemetry to 0 active integrations.</div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </ViewContainer>
    );
};

const PodFactoryView: React.FC<{feature: Feature}> = ({ feature }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<{ image: string; title: string; desc: string } | null>(null);

    const generateProduct = async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setResults(null);
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
            const strategyResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Create a high-converting Print-on-Demand product listing for: "${prompt}". Return a JSON object with keys: "title", "description".`,
                config: { responseMimeType: 'application/json' }
            });
            const strategy = JSON.parse(strategyResponse.text);

            const imgResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: `Vectorized design for a high-end apparel product, white background, high-resolution minimalist aesthetic: ${prompt}`,
                config: { imageConfig: { aspectRatio: '1:1' } }
            });

            let b64 = '';
            for (const part of imgResponse.candidates[0].content.parts) {
                if (part.inlineData) b64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            setResults({ image: b64, title: strategy.title, desc: strategy.description });
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    return (
        <ViewContainer feature={feature}>
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 shadow-2xl">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Design Parameter</label>
                        <textarea 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)} 
                            className="w-full h-40 bg-gray-950 border border-gray-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none font-medium" 
                            placeholder="Describe your market-dominating design concept..."
                        />
                        <div className="mt-8">
                            <ActionButton variant="robinhood" onClick={generateProduct} disabled={isLoading}>
                                {isLoading ? 'Extracting Wealth...' : 'ROBIN HOOD'}
                            </ActionButton>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-gray-900/50 rounded-[2rem] border border-gray-800 p-8 min-h-[550px] flex items-center justify-center backdrop-blur-sm relative overflow-hidden">
                    {isLoading ? (
                        <div className="text-center z-10">
                            <LoadingSpinner />
                            <p className="mt-6 text-emerald-400 font-black tracking-[0.3em] text-xs animate-pulse uppercase italic">Processing Factory Output...</p>
                        </div>
                    ) : results ? (
                        <div className="w-full flex flex-col md:flex-row gap-12 z-10">
                            <div className="w-full md:w-1/2 aspect-square bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform hover:scale-[1.02] transition-transform duration-500">
                                <img src={results.image} className="w-full h-full object-cover" alt="Asset Design" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                <h4 className="text-3xl font-black text-white tracking-tight leading-tight uppercase italic underline decoration-emerald-500/50 decoration-4 underline-offset-8">{results.title}</h4>
                                <div className="p-6 bg-gray-950/80 rounded-2xl border border-gray-800">
                                    <p className="text-gray-400 text-sm leading-relaxed font-medium">{results.desc}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button className="bg-gray-800 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-700 transition-colors border border-gray-700">Get RAW</button>
                                    <button className="bg-emerald-600/20 text-emerald-400 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600/30 transition-colors border border-emerald-500/30">Auto Publish</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-700 max-w-sm">
                            <Icon name="podFactory" className="w-20 h-20 mx-auto mb-6 opacity-10" />
                            <p className="font-black uppercase tracking-widest text-xs opacity-40">Awaiting Manufacturing Sequence</p>
                        </div>
                    )}
                </div>
            </div>
        </ViewContainer>
    );
};

const ChatbotView: React.FC<{feature: Feature, initialPrompt?: string}> = ({ feature, initialPrompt }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY as string});
        chatRef.current = ai.chats.create({
            model: 'gemini-3-pro-preview',
            config: { systemInstruction: "You are the Executive AI Advisor for a wealth creation factory. Your goal is to help the user scale their business, optimize marketing, and generate profit. Be decisive, data-driven, and brief. Use bold headers for action items." }
        });
        if (initialPrompt) {
            handleSend(initialPrompt);
        }
    }, [initialPrompt]);

    const handleSend = async (msgOverride?: string) => {
        const msg = msgOverride || prompt;
        if (!msg || isLoading) return;
        if (!msgOverride) setPrompt('');
        setMessages(prev => [...prev, { role: 'user', text: msg }]);
        setIsLoading(true);
        try {
            const result = await chatRef.current!.sendMessage({ message: msg });
            setMessages(prev => [...prev, { role: 'model', text: result.text }]);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    return (
        <ViewContainer feature={feature}>
            <div className="flex flex-col h-[calc(100vh-20rem)] bg-gray-900/50 rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="h-full flex items-center justify-center text-center opacity-20">
                            <div>
                                <Icon name="chatbot" className="w-16 h-16 mx-auto mb-4" />
                                <p className="font-black uppercase tracking-[0.4em] text-xs italic">Encrypted Secure Line Established</p>
                            </div>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[85%] p-6 rounded-[2rem] ${m.role === 'user' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'bg-gray-950 border border-gray-800 text-gray-300 font-medium'}`}>
                                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><LoadingSpinner /></div>}
                </div>
                <div className="p-6 bg-gray-950 border-t border-gray-800">
                    <div className="flex space-x-4">
                        <input 
                            value={prompt} 
                            onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Executive command..." 
                            className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all" 
                        />
                        <button onClick={() => handleSend()} className="bg-gradient-to-r from-amber-500 to-emerald-600 p-4 rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95 group">
                            <Icon name="socialStrategist" className="w-7 h-7 text-white rotate-45 group-hover:rotate-0 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </ViewContainer>
    );
};

// --- Main App Component ---

const App = () => {
    const [activeFeature, setActiveFeature] = useState<FeatureId>('dashboard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [chatbotInitialPrompt, setChatbotInitialPrompt] = useState<string | undefined>(undefined);

    const triggerRobinHoodStrategy = () => {
        setChatbotInitialPrompt("Give me a one-sentence high-level wealth strategy I should execute right now based on current market trends.");
        setActiveFeature('chatbot');
    };

    const CurrentView = () => {
        const feature = FEATURES.find(f => f.id === activeFeature) as Feature;
        switch (activeFeature) {
            case 'dashboard': return <DashboardView feature={feature} onRobinHood={triggerRobinHoodStrategy} />;
            case 'vault': return <VaultView feature={feature} />;
            case 'podFactory': return <PodFactoryView feature={feature} />;
            case 'chatbot': return <ChatbotView feature={feature} initialPrompt={chatbotInitialPrompt} />;
            default: return <div className="p-20 text-center">
                <Icon name="stop" className="w-16 h-16 mx-auto mb-6 text-gray-800" />
                <p className="text-gray-600 font-black uppercase tracking-widest italic">Module Integration Pending</p>
            </div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white font-sans selection:bg-emerald-500/40">
            {/* Sidebar */}
            <aside className={`fixed lg:relative z-50 flex-shrink-0 w-80 bg-gray-950 border-r border-gray-900 shadow-[20px_0_50px_rgba(0,0,0,0.3)] h-full transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-500 ease-in-out`}>
                <div className="p-10 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-900/30 border border-emerald-400/20">
                            <Icon name="money" className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">ROBIN HOOD <br/><span className="text-emerald-500 text-sm not-italic tracking-[0.3em]">ENGINE</span></h1>
                    </div>
                </div>
                
                <nav className="mt-2 px-6 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        {FEATURES.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => { setActiveFeature(f.id); setIsMenuOpen(false); setChatbotInitialPrompt(undefined); }}
                                className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 group ${
                                    activeFeature === f.id 
                                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-lg' 
                                    : 'text-gray-600 hover:text-gray-300 hover:bg-gray-900/50'
                                }`}
                            >
                                <Icon name={f.icon} className={`w-5 h-5 mr-4 transition-colors ${activeFeature === f.id ? 'text-emerald-400' : 'text-gray-700 group-hover:text-emerald-500'}`} />
                                <span className="text-xs font-black uppercase tracking-widest">{f.name}</span>
                                {activeFeature === f.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></div>}
                            </button>
                        ))}
                    </div>
                    
                    <div className="mt-12 p-8 bg-gray-900/30 rounded-[2rem] border border-gray-900">
                        <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">Neural Grid</div>
                        <div className="flex items-center space-x-3 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                            <span>Fully Operational</span>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="lg:hidden p-6 bg-gray-950 border-b border-gray-900 flex justify-between items-center z-40">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase">ROBIN HOOD AI</h1>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-3 text-gray-500 hover:text-white bg-gray-900 rounded-2xl border border-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                </header>
                <div className="flex-1 relative overflow-hidden bg-gray-950">
                    <CurrentView />
                </div>
            </main>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1f2937;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #10b981;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.95; transform: scale(0.99); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}} />
        </div>
    );
};

export default App;
