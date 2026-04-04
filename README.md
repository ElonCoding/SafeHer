# Safe-Her 🛡️

Safe-Her is a comprehensive personal safety application designed to provide security and peace of mind. Built with React, Vite, and Supabase, it offers real-time tracking, emergency assistance, and community-driven safety features.

## 🌟 Key Features

- **SOS Emergency System**: Instant emergency alerts with one-tap SOS functionality.
- **Live Tracking**: Real-time location sharing with trusted contacts (Guardians).
- **Safe Routes**: Navigation assistance focused on well-lit and safe paths.
- **Incident Reporting**: Community-driven reporting of safety incidents in the area.
- **Guardians Management**: Easily manage and connect with your emergency contacts.
- **Trip History**: Keep track of your past journeys and safety status.
- **Service Directory**: Quick access to local safety services and emergency numbers.

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI, Framer Motion
- **State Management**: TanStack Query (React Query)
- **Backend/Auth**: Supabase
- **Maps**: Leaflet
- **Testing**: Vitest, Playwright

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ElonCoding/Safe-Her.git
   cd Safe-Her
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Set up configuration:
   Add a `config.toml` file in the root directory with the following content:
   ```toml
   [database]
   supabase_url = "your_supabase_url"
   supabase_anon_key = "your_supabase_anon_key"
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run test`: Run unit tests with Vitest
- `npm run lint`: Run ESLint for code quality
- `npm run preview`: Preview the production build locally

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and intended for personal safety use.
