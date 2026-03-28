# 📺 Stack Tube - YouTube Tab Manager

**One extension, zero tab chaos.**

Stack Tube transforms your scattered YouTube tabs into organized collections. Save, stack, and queue your videos without leaving your browser.

## 🎯 The Problem

You're browsing YouTube recommendations. You open 5-10 tabs to watch later. Now:
- You can't drag them into one organized view
- You can't save them as a group
- You lose them when you close the browser

## ✨ The Solution

**Stack Tube** gives you:
1. **Select & Stack**: See all YouTube tabs, multi-select them
2. **Save Locally**: Store collections in your browser
3. **Share Anywhere**: Generate shareable links or export files
4. **Import Easily**: Import from URLs, text, or JSON
5. **Quick Queue**: Sidebar with drag-and-drop playlist (Phase 3)

---

## 🎯 Key Features

### Storage Options (BOTH Supported)
- **Local Storage**: Collections saved in browser (private, instant)
- **Shareable Links**: Generate URLs to share with others
- **Export/Import**: JSON files for backup and portability

### Core Functionality
- Multi-select YouTube tabs
- One-click save to collections
- Share via URL, plain text, or JSON
- Import from multiple sources
- Open entire collections instantly
- Manage and organize collections

## 🚀 Quick Start

### Installation (Development)
1. Clone this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `stacktube` folder
6. The extension icon appears in your toolbar 🎉

### Usage
1. Open some YouTube videos in tabs
2. Click the Stack Tube icon
3. Select the videos you want to save
4. Click "Save Collection"
5. Name your collection
6. Done! Your videos are saved.

## 🏗️ Current Status

**Build 1 - MVP** (In Progress)
- [x] Basic manifest and popup
- [ ] Tab selection UI
- [ ] Save collections
- [ ] Open saved collections
- [ ] Sidebar queue (Phase 3)

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for full roadmap.

## 🛠️ Tech Stack

- **Chrome Extension** (Manifest V3)
- **Vanilla JavaScript** (ES6+)
- **Chrome Storage API**
- **CSS3** (no frameworks)

## 📁 Project Structure

```
stacktube/
├── manifest.json         # Extension configuration
├── popup.html           # Main popup UI
├── popup.js             # Popup logic
├── background.js        # Service worker
├── styles/
│   └── popup.css       # Popup styling
├── utils/
│   └── youtube-parser.js # URL utilities
├── assets/
│   └── footage.png      # Extension icon
├── PROJECT_PLAN.md      # Development roadmap
├── CONTEXT.md           # Technical documentation
└── README.md            # This file
```

## 🎨 Features

### Phase 1 (Current)
- [x] Extension boilerplate
- [ ] Display YouTube tabs
- [ ] Multi-select tabs
- [ ] Save tab collections
- [ ] Open collections

### Phase 2 (Next)
- [ ] Manage saved collections
- [ ] Export/import collections
- [ ] Shareable collection links

### Phase 3 (Future)
- [ ] Sidebar with queue
- [ ] Drag-and-drop interface
- [ ] Auto-play queue

## 🤝 Contributing

This is a solo project for now, but open to collaboration!

1. Check [PROJECT_PLAN.md](./PROJECT_PLAN.md) for tasks
2. Read [CONTEXT.md](./CONTEXT.md) for code conventions
3. Create a branch and submit a PR

## 📝 Development Notes

### Testing
- Test with 0 tabs, 1 tab, and 10+ YouTube tabs
- Test save/load persistence
- Check console for errors in popup and background page

### Debugging
1. Right-click extension icon → "Inspect popup" (for popup.js)
2. Go to `chrome://extensions` → Click "service worker" (for background.js)

## 🔐 Privacy

Stack Tube:
- Stores data **locally only** on your device
- Does **not** track your browsing
- Does **not** send data to any server
- Only accesses YouTube tabs (no other sites)

## 📜 License

MIT License - See LICENSE file (to be added)

## 🐛 Known Issues

- None yet! (First build in progress)

## 💡 Inspiration

Born from a simple problem: "Why can't I just drag these YouTube recommendations into one list?"

## 🎯 Vision

Make YouTube tab management as easy as creating a playlist - but faster.

---

Built with ❤️ by [Your Name]
