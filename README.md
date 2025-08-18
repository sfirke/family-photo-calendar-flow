
# Family Calendar - Modern Web Calendar Application

A sophisticated, privacy-focused family calendar application built with React and TypeScript. Features client-side encryption, automatic updates, security hardening, weather integration, photo backgrounds, and multiple calendar feed support.

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
- **Input Validation**: Comprehensive validation against XSS and injection attacks
- **Path Traversal Protection**: URL validation against directory traversal attacks
- **API Key Security**: Format validation and secure handling of API keys
- **No Server Required**: All data stored locally in your browser
- **PBKDF2 Key Derivation**: Industry-standard password-based encryption

### 🔄 Automatic Updates
- **Dual Update System**: Service Worker updates + GitHub Releases integration
- **Smart Detection**: Automatic detection of both immediate and upstream updates
- **Background Checks**: Hourly checks for GitHub releases with intelligent caching
- **Update Dashboard**: Comprehensive update status in settings with version comparison
- **Release Notes**: Display detailed release notes from GitHub releases
- **One-Click Updates**: Easy installation of service worker updates
- **Version Tracking**: Semantic version comparison and update type detection

### 🌤️ Weather Integration
- **Weather Overlays**: See weather information on calendar dates
- **National Weather Service Only**: Simplified to a single free provider (no API key required)
- **Location-Based**: Automatic geolocation with optional manual coordinates
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
- **LocalStorage** - Persistent data storage with encryption
- **IndexedDB** - Large data caching (photos, events)
- **Web Crypto API** - Client-side encryption

### Security Implementation
- **AES-256-GCM** - Authenticated encryption for data
- **PBKDF2** - Password-based key derivation (100,000 iterations)
- **Input Validation** - Comprehensive sanitization and validation
- **XSS Prevention** - Text sanitization and dangerous protocol detection
- **Random Salt Generation** - Unique encryption salt per user
- **Session-Based Keys** - Encryption keys never persisted

### Update Management
- **Version Manager** - Centralized version tracking and comparison
- **Update Manager** - Dual-layer update detection (Service Worker + GitHub)
- **GitHub Integration** - API integration for upstream release checking
- **Semantic Versioning** - Proper version comparison and update type detection
- **Caching System** - Intelligent caching of version data with hourly refresh

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

## Deployment (GitHub Pages)

This project is configured to deploy automatically to **GitHub Pages** when changes are pushed to the `main` branch.

### How it works

1. The workflow in `.github/workflows/deploy-pages.yml` runs on every push to `main` (and can be triggered manually).
2. It installs dependencies, lints, runs tests, and builds the site with a dynamic Vite base path of `/<repo-name>/`.
3. The built `dist` folder is uploaded as a Pages artifact and then deployed using the official `actions/deploy-pages` action.

### Accessing the site

Once enabled in your repository settings (Settings → Pages → Source: GitHub Actions), the site is configured for the custom domain:

```
https://calendar.willineau.com
```

Make sure you add the appropriate DNS records (see below).

### Local preview with the Pages base path

Local preview (custom domain uses root path so default preview works):

```bash
npm run build && npm run preview
```

### Notes

- A `.nojekyll` file is added during deployment to avoid GitHub Pages ignoring files that start with an underscore.
- Custom domain `CNAME` file (`public/CNAME`) ensures GitHub Pages serves at `calendar.willineau.com`.
- DNS: Create a CNAME record `calendar` pointing to `<username>.github.io` (e.g. `cardner.github.io`).
- If you fork this repo, change or remove the `CNAME` file; otherwise Pages will fail for the fork.

## ⚙️ Configuration

### Update System Setup
1. **GitHub Repository**: Configure in `src/utils/upstreamVersionManager.ts`
2. **Update Frequency**: Modify check intervals in version manager utilities
3. **Update Notifications**: Customize toast and notification settings

### Weather Setup

1. **Automatic Location**: Allow browser geolocation when prompted (no API key needed)
2. **Manual Coordinates (Optional)**: Enter latitude,longitude in Settings → Weather
3. **Privacy**: Coordinates are stored locally (encrypted if security enabled)

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

```text
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── calendar/       # Calendar-specific components
│   └── settings/       # Settings panel components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
│   ├── security/       # Encryption and security utilities
│   ├── googlePhotos/   # Photo integration utilities
│   ├── versionManager.ts        # Version tracking and comparison
│   ├── upstreamVersionManager.ts # GitHub API integration
│   └── updateManager.ts         # Update detection and management
├── services/           # External API services
├── types/              # TypeScript type definitions
└── data/               # Sample data and constants
```

### Key Components

#### Security System

- `SecurityContext.tsx` - Global security state management
- `secureStorage.ts` - Encrypted localStorage wrapper
- `encryption.ts` - Web Crypto API utilities
- `inputValidation.ts` - Input sanitization and validation

#### Update Management System

- `versionManager.ts` - Version tracking and comparison utilities
- `upstreamVersionManager.ts` - GitHub API integration and upstream checking
- `updateManager.ts` - Centralized update detection and management
- `useUpdateManager.tsx` - React hook for update management
- `UpdateNotification.tsx` - Update notification component
- `UpdateTab.tsx` - Settings panel for update management

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

### Input Security

- **Sanitization**: HTML and script tag removal from user inputs
- **URL Validation**: Protocol validation and path traversal prevention
- **API Key Validation**: Format validation and secure storage
- **XSS Prevention**: Content Security Policy and input filtering

### Data Protection

- **API Keys**: Weather and calendar service keys encrypted
- **Personal Data**: Zip codes and album URLs encrypted
- **Session Security**: Encryption keys exist only in memory
- **Local Storage**: All data remains on user's device

### Threat Model

- **Protects Against**: Local storage inspection, device theft, XSS attacks, injection attacks
- **Limitations**: Not protected against malware or browser vulnerabilities
- **Recovery**: No password recovery - users must remember passwords

## 🔄 Update Management

### Update Detection System

- **Service Worker Updates**: Immediate updates for app changes
- **GitHub Releases**: Upstream updates from the official repository
- **Automatic Checking**: Hourly checks for GitHub releases
- **Smart Caching**: Intelligent caching with configurable refresh intervals

### Update Process

1. **Background Detection**: Automatic checking during app usage
2. **User Notification**: Toast notifications and persistent update cards
3. **Release Information**: Display of release notes and version details
4. **One-Click Installation**: Easy update installation for service worker updates
5. **External Updates**: Direct links to GitHub releases for major updates

### Version Management

- **Semantic Versioning**: Proper version comparison (major.minor.patch)
- **Version Tracking**: Local version storage and comparison
- **Update Types**: Classification of updates as major, minor, or patch
- **Rollback Support**: Version history and rollback capabilities

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

### Update Configuration for Self-Hosting

1. **GitHub Repository**: Update repository details in `upstreamVersionManager.ts`
2. **Version File**: Ensure `public/version.json` is updated during build
3. **Service Worker**: Configure service worker for your domain

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
- **Security**: Follow security best practices for input validation
- **Updates**: Test update detection and notification systems
- **Comments**: Document complex algorithms and security code
- **Testing**: Add tests for new features

### Pull Request Process

1. **Update Documentation**: README, code comments, and type definitions
2. **Test Changes**: Ensure all tests pass
3. **Security Review**: Review any security-related changes carefully
4. **Update System**: Test update detection and notification
5. **Performance Check**: Verify no performance regressions

### Security Contributions

- **Encryption Changes**: Require careful review and testing
- **Input Validation**: Test against common attack vectors
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
- **Update Issues**: Check network connectivity and GitHub API rate limits
- **Security Errors**: Verify encryption setup and password complexity

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
- **GitHub API** - Release information and version tracking
- **React Community** - Excellent ecosystem and documentation

---

Built with ❤️ for families who value privacy, security, and functionality.
