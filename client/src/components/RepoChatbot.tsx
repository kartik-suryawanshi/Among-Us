import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  X,
  Send,
  Bot,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { repositoryService } from '../services/repositoryService';
import type { Repository } from '../types/repository';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  chips?: string[];
}

export const RepoChatbot: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [repoParams, setRepoParams] = useState<{ owner: string; repo: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract owner/repo from URL: /repositories/:owner/:repo
  useEffect(() => {
    const match = location.pathname.match(/^\/repositories\/([^/]+)\/([^/]+)/);
    if (match) {
      const owner = decodeURIComponent(match[1]);
      const repo = decodeURIComponent(match[2]);
      setRepoParams({ owner, repo });

      // Fetch or sync repo data
      repositoryService
        .getRepository(owner, repo)
        .then((data) => setCurrentRepo(data))
        .catch(() => setCurrentRepo(null));
    } else {
      setRepoParams(null);
      setCurrentRepo(null);
    }
  }, [location.pathname]);

  // Reset or initialize greeting when repo context changes or on first open
  useEffect(() => {
    const greetingText = currentRepo
      ? `👋 Hi! I'm your **GitStory Repository Assistant** for **${currentRepo.name}** (${currentRepo.owner?.login || 'project'}).\n\nAsk me anything! For example: *What kind of project is this? Is it a YouTube clone, a hotel booking system like Airbnb, or a library? What tech stack does it use?*`
      : `👋 Welcome to **GitStory**! I'm your interactive assistant built by **Team Among-Us**.\n\nYou can ask me:\n- *What is GitStory and what can it do?*\n- *Who are the team members?*\n- *How do I explore a repository or play Story Mode?*\n- *Ask about any repository like expressjs/express!*`;

    const initialChips = currentRepo
      ? [
          '💡 What is this project?',
          '🏨 Is this an Airbnb / Hotel booking app?',
          '🎥 Is this a YouTube clone?',
          '🛠️ What tech stack does it use?',
        ]
      : [
          '🚀 What is GitStory?',
          '👥 Who made this project?',
          '🎬 How does Story Mode work?',
          '💡 Try an example repository',
        ];

    setMessages([
      {
        id: 'msg-init',
        sender: 'assistant',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: initialChips,
      },
    ]);
  }, [currentRepo, repoParams]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Knowledge base and query answering engine
  const generateAnswer = (query: string): { reply: string; nextChips?: string[] } => {
    const q = query.toLowerCase().trim();
    const repoName = currentRepo?.name?.toLowerCase() || repoParams?.repo?.toLowerCase() || '';
    const repoDesc = currentRepo?.description?.toLowerCase() || '';
    const repoTopics = currentRepo?.topics?.map((t) => t.toLowerCase()).join(' ') || '';
    const repoLang = currentRepo?.language || 'Various languages';

    // 1. HOTEL / AIRBNB BOOKING CLASSIFICATION
    if (
      q.includes('hotel') ||
      q.includes('airbnb') ||
      q.includes('booking') ||
      q.includes('reservation') ||
      q.includes('stay')
    ) {
      const isHotel =
        repoName.includes('hotel') ||
        repoName.includes('airbnb') ||
        repoName.includes('booking') ||
        repoDesc.includes('hotel') ||
        repoDesc.includes('airbnb') ||
        repoDesc.includes('booking') ||
        repoDesc.includes('reservation') ||
        repoTopics.includes('airbnb') ||
        repoTopics.includes('hotel');

      if (isHotel) {
        return {
          reply: `🏨 **Yes! This project is a Hotel / Accommodation Booking System (similar to Airbnb).**\n\n• **Core Purpose:** It is designed for searching property listings, viewing room details, and managing booking reservations.\n• **Repository:** \`${currentRepo?.name}\`\n• **Description:** ${currentRepo?.description || 'Hotel and property reservation management application.'}\n• **Built with:** ${repoLang}.`,
          nextChips: ['🛠️ What tech stack does it use?', '👥 Who are the contributors?'],
        };
      } else {
        return {
          reply: `❌ **No, this project is NOT a hotel booking management system or Airbnb clone.**\n\n${
            currentRepo
              ? `This repository is **${currentRepo.name}**:\n> *"${currentRepo.description || 'No description provided.'}"*\n\nIt is classified as **${
                  currentRepo.language ? `${currentRepo.language} Software / Tool` : 'an Open Source Project'
                }** rather than a booking app.\n\n*(Tip: If you're looking for an Airbnb clone or hotel booking project, try searching \`airbnb-clone\` in the search bar above!)*`
              : `GitStory is a **GitHub Repository Intelligence Platform**, not a hotel booking system! You can use GitStory to search for and analyze any hotel booking or Airbnb open-source repository.`
          }`,
          nextChips: ['💡 What is this project?', '🛠️ What tech stack does it use?'],
        };
      }
    }

    // 2. YOUTUBE / VIDEO CLONE CLASSIFICATION
    if (q.includes('youtube') || q.includes('video') || q.includes('stream') || q.includes('player')) {
      const isVideo =
        repoName.includes('youtube') ||
        repoName.includes('video') ||
        repoDesc.includes('youtube') ||
        repoDesc.includes('video') ||
        repoDesc.includes('stream') ||
        repoTopics.includes('youtube') ||
        repoTopics.includes('video');

      if (isVideo) {
        return {
          reply: `🎥 **Yes! This project is a Video Platform / YouTube Clone.**\n\n• **Core Purpose:** Designed for video streaming, playback, channel feeds, and media exploration.\n• **Repository:** \`${currentRepo?.name}\`\n• **Primary Language:** ${repoLang}.`,
          nextChips: ['🛠️ What tech stack does it use?', '📈 How active is development?'],
        };
      } else {
        return {
          reply: `❌ **No, this repository is NOT a YouTube clone or video streaming app.**\n\n${
            currentRepo
              ? `Currently viewing **${currentRepo.name}**:\n> *"${currentRepo.description || 'No description provided.'}"*\n\nIt is a **${repoLang}** project focused on software development / tooling.`
              : `You are on the GitStory homepage! GitStory helps you visualize GitHub repositories, commit histories, and code churn.`
          }`,
          nextChips: ['💡 What is this project?', '🚀 What is GitStory?'],
        };
      }
    }

    // 3. WHAT IS THIS PROJECT? (General classification)
    if (
      q.includes('what is this project') ||
      q.includes('what is this repo') ||
      q.includes('what does this do') ||
      q.includes('project overview') ||
      q.includes('explain this') ||
      q.includes('about this') ||
      q.includes('what is this')
    ) {
      if (currentRepo) {
        let category = 'Open Source Software Library';
        const combined = `${repoName} ${repoDesc} ${repoTopics}`;

        if (combined.includes('framework') || combined.includes('library')) {
          category = 'Framework / Software Library';
        } else if (combined.includes('clone') || combined.includes('airbnb') || combined.includes('booking')) {
          category = 'Full-Stack Web Application (Clone / Management System)';
        } else if (combined.includes('api') || combined.includes('backend') || combined.includes('server')) {
          category = 'Backend API / Web Service';
        } else if (combined.includes('cli') || combined.includes('tool') || combined.includes('utility')) {
          category = 'CLI Utility & Developer Tool';
        } else if (combined.includes('game') || combined.includes('among')) {
          category = 'Interactive Application / Game Simulation';
        }

        const stars = currentRepo.starsCount?.toLocaleString() || 0;
        const forks = currentRepo.forksCount?.toLocaleString() || 0;
        const issues = currentRepo.openIssuesCount?.toLocaleString() || 0;

        return {
          reply: `📦 **Project Identification for ${currentRepo.name}:**\n\n• **Category:** ${category}\n• **Description:** ${currentRepo.description || 'No description provided by the authors.'}\n• **Primary Language:** ${repoLang}\n• **Stars:** ⭐ ${stars} | **Forks:** 🍴 ${forks}\n• **Open Issues:** ⚠️ ${issues}\n• **Default Branch:** \`${currentRepo.defaultBranch || 'main'}\`\n\n*Use the interactive charts below to view its 52-week activity timeline and code churn hotspots!*`,
          nextChips: ['🛠️ What tech stack does it use?', '📈 How active is development?', '🎬 Play GitStory mode'],
        };
      } else {
        return {
          reply: `🚀 **This is GitStory!**\n\nGitStory is an interactive, visual repository intelligence explorer built for hackathons and software engineering teams.\n\n• **What it does:** Transforms raw GitHub commit histories into visual stories, 52-week activity velocity timelines, language distribution charts, contributor leaderboards, and code churn hotspots.\n• **Built by:** **Team Among-Us** (Kartik, Aniket, Purvesh)\n• **Try it out:** Search for any repo in the bar above (e.g. \`expressjs/express\` or \`facebook/react\`)!`,
          nextChips: ['👥 Who made this project?', '🎬 How does Story Mode work?', '💡 Try an example repository'],
        };
      }
    }

    // 4. TECH STACK QUESTIONS
    if (q.includes('tech stack') || q.includes('stack') || q.includes('languages') || q.includes('technology')) {
      if (currentRepo) {
        return {
          reply: `🛠️ **Tech Stack for ${currentRepo.name}:**\n\n• **Primary Language:** ${repoLang}\n• Check the **Language Breakdown** donut & bar chart on the page to see the exact byte percentages calculated from GitHub ground truth!`,
          nextChips: ['💡 What is this project?', '📈 How active is development?'],
        };
      } else {
        return {
          reply: `🛠️ **GitStory Tech Stack & Architecture:**\n\n• **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, Lucide Icons\n• **Data Visualization:** Recharts (SVG velocity charts) + HTML5 Canvas (Story Engine)\n• **Audio:** Native Web Audio API (real-time synthesizer sound effects)\n• **Backend:** Node.js 18+, Express.js (ES Modules)\n• **Caching & Persistence:** Redis (in-memory TTL cache) + PostgreSQL (analytics snapshots)\n• **Deployment:** Vercel (Edge CDN) + Render (API Web Service).`,
          nextChips: ['🚀 What is GitStory?', '👥 Who made this project?'],
        };
      }
    }

    // 5. ACTIVITY / VELOCITY QUESTIONS
    if (q.includes('active') || q.includes('activity') || q.includes('commits') || q.includes('velocity')) {
      if (currentRepo) {
        return {
          reply: `📈 **Activity & Evolution:**\n\n• GitStory dynamically fetches the **52-week commit activity timeline** from GitHub.\n• Look at the **Commit Activity Timeline** section to see which months had the highest development velocity and which day of the week the authors commit the most code!`,
          nextChips: ['💡 What is this project?', '👥 Who are the contributors?'],
        };
      } else {
        return {
          reply: `📈 GitStory provides **52-week activity velocity charts** and **Day-of-Week commit frequency breakdowns** for any public repository! Search for a repository to inspect its momentum.`,
          nextChips: ['💡 Try an example repository', '🚀 What is GitStory?'],
        };
      }
    }

    // 6. CONTRIBUTORS / TEAM
    if (q.includes('team') || q.includes('contributor') || q.includes('author') || q.includes('creator') || q.includes('who made')) {
      if (!currentRepo || q.includes('gitstory') || q.includes('among-us')) {
        return {
          reply: `👥 **Team Among-Us (GitStory Creators):**\n\n1. **Kartik Vijay Suryawanshi**\n2. **Aniket Vijay Vasane**\n3. **Purvesh Sanjay Mali**\n\n*Built for the hackathon with 54 passing automated tests, PostgreSQL persistence, and Redis caching!*`,
          nextChips: ['🚀 What is GitStory?', '🛠️ What tech stack does it use?'],
        };
      } else {
        return {
          reply: `👥 **Contributors for ${currentRepo.name}:**\n\n• Owner/Organization: **${currentRepo.owner?.login || 'Maintainers'}**\n• Check the **Contributor Statistics** leaderboard on this page to see top contributors, avatar cards, and their respective commit counts!`,
          nextChips: ['💡 What is this project?', '📈 How active is development?'],
        };
      }
    }

    // 7. STORY MODE EXPLANATION
    if (q.includes('story mode') || q.includes('trailer') || q.includes('animation') || q.includes('runner')) {
      return {
        reply: `🎬 **GitStory Mode:**\n\nGitStory Mode is an interactive canvas experience! It features:\n• **Particle Morphing Canvas:** Animated 60 FPS visual transitions.\n• **Commit Runner:** Walks through historical commits sequentially like a cinematic movie trailer.\n• **Sound Effects:** Generated natively via Web Audio API.\n\n*Click the **"Play Story"** button on any repository page to watch it live!*`,
        nextChips: ['🚀 What is GitStory?', '💡 What is this project?'],
      };
    }

    // 8. DEFAULT / SMART FALLBACK
    return {
      reply: currentRepo
        ? `🤖 I analyzed **${currentRepo.name}**:\n\n• **Description:** ${currentRepo.description || 'No description provided.'}\n• **Language:** ${repoLang}\n• **Stars:** ⭐ ${currentRepo.starsCount?.toLocaleString() || 0}\n\nFeel free to ask me: *"Is this an Airbnb/hotel booking app?"*, *"What tech stack does it use?"*, or *"How active is it?"*`
        : `🤖 I'm here to help you understand GitStory and any GitHub repository!\n\nYou can ask: *"What is this project?"*, *"Is this like Airbnb or a YouTube clone?"*, *"What tech stack does it use?"*, or click one of the quick suggestions below.`,
      nextChips: currentRepo
        ? ['💡 What is this project?', '🏨 Is this an Airbnb / Hotel app?', '🛠️ What tech stack does it use?']
        : ['🚀 What is GitStory?', '👥 Who made this project?', '💡 Try an example repository'],
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate smart thinking delay
    setTimeout(() => {
      const { reply, nextChips } = generateAnswer(query);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: nextChips,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    const greetingText = currentRepo
      ? `👋 Chat reset! Ask me anything about **${currentRepo.name}** (e.g. *What is this project? Is it a YouTube clone or an Airbnb hotel booking app?*).`
      : `👋 Chat reset! Ask me anything about **GitStory** or repositories you want to explore.`;

    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'assistant',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chips: currentRepo
          ? ['💡 What is this project?', '🏨 Is this an Airbnb app?', '🛠️ Tech stack?']
          : ['🚀 What is GitStory?', '👥 Who made this project?', '🎬 Story Mode?'],
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none">
      {/* Floating Action Button (Launcher) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-2xl border border-neutral-700/60 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          aria-label="Open GitStory Assistant Chat"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="text-xs font-semibold tracking-wide">
            {currentRepo ? `Ask about ${currentRepo.name}` : 'Ask AI Copilot'}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </button>
      )}

      {/* Expanded Chat Box Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[540px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-neutral-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-3.5 flex items-center justify-between border-b border-neutral-700">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold tracking-tight">GitStory Assistant</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">
                  {currentRepo ? `Context: ${currentRepo.name}` : 'Explore & Identify Repos'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-neutral-400">
              <button
                onClick={resetChat}
                className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="Restart chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Repo Context Badge */}
          {currentRepo && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-900">
              <span className="truncate font-medium">
                Inspecting: <strong className="font-semibold">{currentRepo.name}</strong> ({currentRepo.language || 'Code'})
              </span>
              <span className="text-emerald-700 font-mono text-[10px] shrink-0">⭐ {currentRepo.starsCount || 0}</span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-neutral-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-neutral-900 text-white rounded-br-none'
                      : 'bg-white text-neutral-800 border border-neutral-200/80 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line space-y-1">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('• ')) {
                        return (
                          <div key={idx} className="flex items-start space-x-1.5 pl-1 my-0.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{renderFormattedText(line.slice(2))}</span>
                          </div>
                        );
                      }
                      if (line.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="border-l-2 border-emerald-500 pl-2 italic text-neutral-600 my-1">
                            {line.slice(2)}
                          </blockquote>
                        );
                      }
                      return <p key={idx}>{renderFormattedText(line)}</p>;
                    })}
                  </div>
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-neutral-400' : 'text-neutral-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Suggestion Chips */}
                {msg.chips && msg.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {msg.chips.map((chip, chipIdx) => (
                      <button
                        key={chipIdx}
                        onClick={() => handleSendMessage(chip)}
                        className="text-[11px] bg-white hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 border border-neutral-200 hover:border-emerald-300 rounded-full px-2.5 py-1 font-medium transition-all duration-150 text-left shadow-2xs hover:shadow-xs"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-2xl px-3.5 py-2 w-fit shadow-xs">
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2.5 bg-white border-t border-neutral-200 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentRepo
                  ? `Ask about ${currentRepo.name} (e.g., is this Airbnb?)...`
                  : 'Ask about this project or GitStory...'
              }
              className="flex-1 bg-neutral-100 hover:bg-neutral-50 focus:bg-white text-xs text-neutral-800 rounded-xl px-3 py-2 border border-neutral-200 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim()}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-xs active:scale-95"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to render bold markdown (**text**)
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-neutral-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-neutral-100 text-neutral-800 font-mono px-1 py-0.5 rounded text-[10px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default RepoChatbot;
