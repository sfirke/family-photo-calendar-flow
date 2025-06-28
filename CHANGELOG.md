
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
