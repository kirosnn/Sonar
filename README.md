# Sonar

Sonar is a fast, minimalist Windows browser designed for smooth performance, visual clarity, and privacy by default. Built with Electron, it offers a streamlined web browsing experience with a focus on usability and aesthetics.

## Features

- **Minimalist Interface**: Clean and distraction-free design.
- **Tab Management**: Efficient tab handling with smooth animations.
- **Theme Support**: Automatic light and dark mode switching based on system preferences.
- **Custom New Tab**: Fast access to search and popular sites.
- **Smart Suggestions**: Intelligent URL and search suggestions.
- **Privacy Focused**: Designed with privacy in mind.

## Installation

To run Sonar locally, you'll need [Node.js](https://nodejs.org/) installed on your machine.

1. Clone the repository:
   ```bash
   git clone https://github.com/kirosnn/sonar.git
   cd sonar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Building

To build the application for Windows:

- **Portable Version**:
  ```bash
  npm run build
  ```

- **Installer (NSIS)**:
  ```bash
  npm run build:installer
  ```

## Project Structure

- `src/`: Source code for the application.
  - `modules/`: Core logic and managers (Navigation, Tabs, Themes, etc.).
  - `pages/`: HTML and CSS for browser pages (New Tab, 404).
  - `assets/`: Static assets like CSS and images.
  - `data/`: JSON data files for suggestions and sites.
- `scripts/`: Utility scripts.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
