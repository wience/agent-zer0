# Agent-Zer0 🤖

> Your AI-powered customer service sidekick that never sleeps, never complains, and always has the right answer (well, almost always 😉)

## 🚀 Project Overview

Meet Agent-Zer0 - the customer service platform that's like having a team of super-smart agents working 24/7, but without the coffee breaks! We've combined cutting-edge AI with a sleek interface to create something that's not just another boring customer service tool.

### What's in the Box? 🎁

#### Web Application (`/web`) - Your Command Center
Think of it as your mission control, but way cooler:
- Next.js 14 (because we like to live on the edge)
- TypeScript (for those who love their code as organized as their sock drawer)
- Tailwind CSS (making things pretty, one class at a time)
- AI-powered conversation analysis (your digital mind reader)
- Real-time conversation flow management (like GPS for customer conversations)
- Interactive agent dashboard (your personal control room)
- Customer conversation insights (because we love data as much as you do)
- Automated response suggestions (your AI wingman)
- Modern UI components (because looks do matter)
- Supabase integration (your data's cozy home)

#### Crawler (`/crawler`) - The Knowledge Hunter
Our very own digital archaeologist:
- Python-based crawler (digging through docs like a pro)
- JSON processing (making data dance)
- PDF and HTML parsing (because we speak all languages)
- Data cleaning utilities (because nobody likes messy data)

## ✨ Key Features

### Web Application - The Cool Stuff
- Real-time conversation analysis (like having X-ray vision for customer needs)
- AI-powered response suggestions (your personal script writer)
- Interactive conversation flow management (your conversation GPS)
- Customer support dashboard (your mission control)
- Automated workflow generation (because automation is the future)
- Real-time data streaming (keeping you in the loop)
- Document processing (your digital librarian)
- User authentication (keeping the bad guys out)
- Performance analytics (because we love a good graph)

### Crawler - The Behind-the-Scenes Hero
- Automated documentation processing (your digital archaeologist)
- Knowledge base building (creating your AI's brain)
- JSON data transformation (making data dance)
- PDF and HTML parsing (because we're multilingual)
- Data cleaning utilities (your digital janitor)

## 🛠️ Getting Started

### Prerequisites
- Node.js (Latest LTS version - we're not savages)
- Python 3.x (The snake that powers our crawler)
- pnpm (Because we're modern like that)
- Git (For all your version control needs)

### Web Application Setup
1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up your secret sauce (environment variables):
   Create a `.env` file in the web directory:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the party:
   ```bash
   pnpm dev
   ```

### Crawler Setup
1. Time to crawl:
   ```bash
   cd crawler
   ```

2. Install Python goodies:
   ```bash
   pip install -r requirements.txt
   ```

3. Let it loose:
   ```bash
   python crawl.py
   ```

## 💻 Development

### Web Application
- `pnpm dev` - Start the development party
- `pnpm build` - Package it up nice and neat
- `pnpm start` - Let's get this show on the road
- `pnpm lint` - Keep it clean, folks
- `pnpm format` - Make it pretty

### Crawler
- `python crawl.py` - Release the crawler
- `python clean_gcash_files.py` - Clean up time

## 🤝 Contributing

Want to join the party? Here's how:

1. Fork it (like a pro)
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request (and let's make it awesome)

## 📜 License

This project is licensed under the terms included in the LICENSE file. TL;DR: Be cool, don't be a jerk.

## 🙏 Acknowledgments

- OpenAI for making AI conversations possible
- Google Gemini for being our conversation analysis guru
- Next.js team for the amazing framework
- All the open-source heroes who made this possible
- Coffee (lots and lots of coffee) ☕