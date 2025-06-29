
# Family Calendar - Modern Web Calendar Application

A sophisticated, privacy-focused family calendar application built with React and TypeScript. Features client-side encryption, weather integration, photo backgrounds, and multiple calendar feed support.

![Family Calendar Screenshot](public/placeholder.svg)

## 🌟 Features

### 📅 Calendar Management
- **Multiple View Modes**: Month, Week, and Timeline views with responsive design
- **iCal Feed Support**: Import external calendar feeds (Google Calendar, Outlook, etc.)
- **Local Event Management**: Create, edit, and delete events locally
- **Smart Event Filtering**: Filter events by calendar source
- **Recurring Events**: Full support for recurring event patterns

### 🔒 Security & Privacy
- **Client-Side Encryption**: AES-256-GCM encryption for sensitive data
- **Password Protection**: Secure your API keys and personal information
- **No Server Required**: All data stored locally in your browser
- **PBKDF2 Key Derivation**: Industry-standard password-based encryption

### 🌤️ Weather Integration
- **Weather Overlays**: See weather information on calendar dates
- **Multiple Providers**: Support for various weather API services
- **Location-Based**: Automatically shows weather for your zip code
- **Forecast Display**: Extended weather forecasts for planning

### 📸 Photo Backgrounds
- **Google Photos Integration**: Use your photo albums as rotating backgrounds
- **Dynamic Rotation**: Photos change automatically at configurable intervals
- **Cache Management**: Intelligent photo caching for offline usage
- **Privacy Focused**: Direct integration without third-party services

### 🔄 Synchronization
- **Background Sync**: Automatic calendar updates when online
- **Offline Support**: Full functionality without internet connection
- **PWA Support**: Install as a native app on any device
- **Service Worker**: Intelligent caching and background updates

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern React with hooks and context
- **TypeScript** - Full type safety and IntelliSense
- **Vite** - Fast development and optimized builds
- **Tailwind CSS** - Utility-first styling with responsive design
- **Shadcn/UI** - Beautiful, accessible component library

### Data Management
- **Context API** - Centralized state management
- **LocalStorage** - Persistent data storage
- **IndexedDB** - Large data caching (photos, events)
- **Web Crypto API** - Client-side encryption

### Security Implementation
- **AES-256-GCM** - Authenticated encryption for data
- **PBKDF2** - Password-based key derivation (100,000 iterations)
- **Random Salt Generation** - Unique encryption salt per user
- **Session-Based Keys** - Encryption keys never persisted

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- Modern web browser with Web Crypto API support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/family-calendar.git
   cd family-calendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

## ⚙️ Configuration

### Weather Setup
1. **Get API Key**: Sign up for a weather service (OpenWeatherMap, WeatherAPI, etc.)
2. **Configure Location**: Enter your zip code in Settings → Weather
3. **Add API Key**: Enter your API key (will be encrypted if security is enabled)

### Google Photos Setup
1. **Create Public Album**: Make a Google Photos album publicly shareable
2. **Copy Album URL**: Get the public sharing link
3. **Configure in App**: Settings → Photos → Album URL

### Calendar Feeds
1. **Get iCal URLs**: From Google Calendar, Outlook, or other providers
2. **Add Feeds**: Settings → Calendars → Add Calendar Feed
3. **Sync Settings**: Configure automatic sync intervals

### Security Setup
1. **Enable Security**: Settings → Security → Enable Security
2. **Set Password**: Choose a strong password (minimum 8 characters)
3. **Confirm Setup**: Your sensitive data will now be encrypted

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── calendar/       # Calendar-specific components
│   └── settings/       # Settings panel components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── security/       # Encryption and security utilities
│   └── googlePhotos/   # Photo integration utilities
├── services/           # External API services
├── types/              # TypeScript type definitions
└── data/               # Sample data and constants
```

### Key Components

#### Security System
- `SecurityContext.tsx` - Global security state management
- `secureStorage.ts` - Encrypted localStorage wrapper
- `encryption.ts` - Web Crypto API utilities

#### Calendar System
- `Calendar.tsx` - Main calendar component
- `useLocalEvents.tsx` - Local event management
- `useICalCalendars.tsx` - External calendar feeds

#### Settings System
- `SettingsModal.tsx` - Main configuration interface
- `SettingsContext.tsx` - Settings state management

### Testing
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Code Style
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **TypeScript** - Strict type checking enabled

## 🔐 Security Model

### Encryption Details
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with SHA-256 (100,000 iterations)
- **Salt**: Unique 128-bit random salt per user
- **IV**: Random 96-bit initialization vector per encryption

### Data Protection
- **API Keys**: Weather and calendar service keys encrypted
- **Personal Data**: Zip codes and album URLs encrypted
- **Session Security**: Encryption keys exist only in memory
- **No Server Storage**: All data remains on user's device

### Threat Model
- **Protects Against**: Local storage inspection, device theft
- **Limitations**: Not protected against malware or browser vulnerabilities
- **Recovery**: No password recovery - users must remember passwords

## 🌐 Deployment

### Lovable Platform (Recommended)
1. **Publish**: Click "Publish" in the Lovable editor
2. **Custom Domain**: Configure your domain in Project Settings
3. **SSL**: Automatic HTTPS certificate provisioning

### Self-Hosting
```bash
# Build for production
npm run build

# Deploy dist/ folder to your web server
# Ensure HTTPS is enabled for Web Crypto API
```

### Docker Deployment
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

## 🤝 Contributing

### Development Setup
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `npm install`
4. **Start development**: `npm run dev`

### Code Guidelines
- **TypeScript**: Use strict typing, avoid `any`
- **Components**: Keep components small and focused
- **Hooks**: Extract complex logic into custom hooks
- **Comments**: Document complex algorithms and security code
- **Testing**: Add tests for new features

### Pull Request Process
1. **Update Documentation**: README, code comments, and type definitions
2. **Test Changes**: Ensure all tests pass
3. **Security Review**: Review any security-related changes carefully
4. **Performance Check**: Verify no performance regressions

### Security Contributions
- **Encryption Changes**: Require careful review and testing
- **Key Management**: Follow established patterns
- **API Integration**: Validate all external data
- **Error Handling**: Avoid leaking sensitive information

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Web Crypto API**: Requires HTTPS in production
- **Storage Limits**: Browser localStorage ~5-10MB limit
- **Calendar Sync**: Check CORS policies for external feeds
- **Photo Loading**: Verify Google Photos album is public

### Getting Help
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Security**: Email security issues privately
- **Documentation**: Check wiki for detailed guides

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and updates.

## 🙏 Acknowledgments

- **Shadcn/UI** - Beautiful component library
- **Lucide React** - Comprehensive icon set
- **Date-fns** - Reliable date manipulation
- **Web Crypto API** - Browser-native encryption
- **React Community** - Excellent ecosystem and documentation

---

**Built with ❤️ for families who value privacy and functionality**
