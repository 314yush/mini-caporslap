# Debug Console

A visual console logger for viewing logs inside the Base app where the browser console isn't easily accessible.

## Features

- **Captures all console logs**: Intercepts `console.log`, `console.error`, `console.warn`, `console.info`, and `console.debug`
- **Visual panel**: Floating panel that displays logs with color coding
- **Keyboard shortcut**: Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to toggle
- **Auto-enabled in development**: Automatically enabled in development mode
- **Production toggle**: Enable in production by adding `?debug=true` to the URL or setting `localStorage.setItem('debug-console', 'true')`

## Usage

### Development Mode
The console is automatically enabled in development mode (`NODE_ENV === 'development'`).

### Production Mode
Enable the console in production using one of these methods:

1. **URL Parameter**: Add `?debug=true` to your URL
   ```
   https://mini.caporslap.fun?debug=true
   ```

2. **LocalStorage**: Open browser console and run:
   ```javascript
   localStorage.setItem('debug-console', 'true')
   ```
   Then refresh the page.

### Controls

- **Toggle Button**: Click the 🐛 button in the bottom-right corner
- **Keyboard Shortcut**: `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
- **Clear Logs**: Click the "Clear" button in the console header
- **Minimize/Expand**: Click the minimize button to collapse the panel
- **Close**: Click the ✕ button to close the panel

## Log Levels

Logs are color-coded by level:
- **Error** (red): `console.error()`
- **Warn** (amber): `console.warn()`
- **Info** (blue): `console.info()`
- **Debug** (purple): `console.debug()`
- **Log** (gray): `console.log()`

## Configuration

The console can be configured via props (currently defaults are used):

```tsx
<ConsoleLogger 
  maxLogs={100}  // Maximum number of logs to keep in memory
  enabled={true} // Whether to capture logs
/>
```

## Notes

- Logs are stored in memory and cleared on page refresh
- The console doesn't interfere with normal console output - it captures logs in addition to normal console behavior
- Maximum of 100 logs are kept (oldest logs are removed when limit is reached)




