
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.2] - 2024-12-29

### Added
- Enhanced update status dashboard with comprehensive version information
- Improved GitHub API integration with better error handling
- Advanced version comparison utilities for semantic versioning
- Enhanced upstream update notifications with release notes display

### Changed
- Refined update manager with better separation of concerns
- Improved caching mechanisms for upstream version data
- Enhanced user experience for version checking and updates
- Better fallback strategies for update detection

### Technical
- Final refinements to GitHub API integration
- Enhanced update manager architecture
- Improved error handling and user feedback systems

## [1.4.1] - 2024-12-29

### Added
- Comprehensive input validation system for security
- XSS prevention with text sanitization utilities
- Path traversal protection for URL validation
- API key format validation and security checks
- Enhanced error handling with security-focused messaging

### Security
- Input sanitization for user-provided data
- URL validation against dangerous protocols
- Protection against directory traversal attacks
- Secure handling of API keys and sensitive configuration

### Technical
- Security utilities for input validation
- Enhanced error handling without information leakage
- Improved validation for external data sources

## [1.4.0] - 2024-12-29

### Added
- Dual update system (Service Worker + GitHub Releases)
- Automatic GitHub release detection and comparison
- Smart update notifications with toast integration
- Version comparison dashboard in settings
- Background update checks with configurable intervals
- Release notes integration from GitHub API

### Changed
- Enhanced update notification system with persistent cards
- Improved update detection with two-layer approach
- Better user experience for update management
- Enhanced settings interface for update controls

### Technical
- GitHub API integration with rate limiting
- Enhanced update manager architecture
- Improved caching and fallback mechanisms
- Better separation of service worker vs upstream updates

## [1.3.0] - 2024-12-29

### Added
- GitHub Releases API integration for upstream version checking
- Upstream version comparison system with semantic versioning
- Hourly update checks for GitHub releases
- Enhanced update detection with dual-layer system
- Version caching and intelligent refresh mechanisms

### Changed
- Improved update manager with upstream integration
- Enhanced version tracking and comparison utilities
- Better update notification flow with multiple sources

### Technical
- GitHub API integration with proper error handling
- Enhanced version management utilities
- Improved caching strategies for version data
- Better separation of local vs upstream version tracking

## [1.2.0] - 2024-12-28

### Added
- Comprehensive responsive design implementation
- Mobile-first layout approach with progressive enhancement
- Touch-friendly controls and navigation for mobile devices
- Responsive typography system that scales across all screen sizes
- Adaptive calendar views optimized for different device sizes
- Smart navigation that adapts to mobile and desktop contexts
- Full-screen modal support for mobile devices
- Flexible spacing system using responsive Tailwind classes

### Changed
- Redesigned main layout to be fully responsive across all device sizes
- Updated calendar components (Month, Week, Timeline) for mobile optimization
- Enhanced settings modal with responsive tabs and mobile-friendly interface
- Improved calendar header with stacked controls on mobile devices
- Optimized button sizes and spacing for touch interaction
- Enhanced weather display and event cards for mobile screens

### Technical
- Implemented mobile-first CSS approach using Tailwind responsive prefixes
- Added comprehensive breakpoint system for phones, tablets, and desktops
- Optimized component layouts for iPhone 11, Google Pixel, iPad, and desktop screens
- Enhanced touch target sizes to meet accessibility standards (minimum 44px)
- Improved viewport handling and responsive container sizing

## [1.1.0] - 2024-12-28

### Added
- Background calendar synchronization using service workers
- Periodic background sync support (when browser supports it)
- Manual background sync trigger functionality
- Background sync status indicators and notifications
- TypeScript declarations for Background Sync API
- Enhanced service worker with calendar sync capabilities

### Changed
- Calendar feeds now sync automatically in the background
- Improved offline calendar data availability
- Better sync error handling and user feedback

### Technical
- Added Background Sync API type definitions
- Enhanced service worker with sync event handlers
- Background sync hooks and utilities
- Sync queue management for offline scenarios

## [1.0.0] - 2024-01-01

### Added
- Enhanced version tracking system with semantic versioning
- Automatic changelog generation and management
- AI change tracking with detailed metadata
- "What's New" modal for version updates
- Comprehensive version information display in settings
- Build-time version generation system

### Changed
- Improved update notification system with better UX
- Enhanced service worker cache management
- Better error handling for version checks
- More detailed version information display

### Technical
- Automated version management without modifying package.json
- Change tracking system for AI modifications
- Version comparison utilities
- Build information integration

### Features
- Monthly, weekly, and timeline calendar views
- Google Photos integration
- iCal calendar feed support
- Local event management
- Responsive design with dark/light themes
- Weather information display
- Install prompt for PWA
- Initial release of Family Photo Calendar
- Calendar view with multiple layout options
- Photo slideshow integration
- Weather widget
- Settings management
- Offline support with service worker
- Progressive Web App (PWA) capabilities
