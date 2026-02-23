# # 🃏 Point Poker

A simple, elegant planning poker app for agile teams to estimate story points collaboratively.

## 🚀 Live Demo

**[Try it now!](https://felladin.github.io/point_poker/)**

## ✨ Features

- 🎴 Fibonacci sequence voting (1, 2, 3, 5, 8, 13, 21)
- 👥 Multi-player support with unique session codes
- 🔗 Shareable invite links for team collaboration
- 🎯 Simultaneous vote reveal
- 📊 Automatic average and suggestion
- 🔄 Quick reset for new votes
- 📱 Responsive design
- 🎨 Beautiful, modern UI
- 🎫 Jira ticket tracking
- 📜 Local voting history

## 🛠️ Usage

### Single Player (Local Mode)

1. Visit the [live app](https://felladin.github.io/point_poker/)
2. Enter your name and click "Join Session"
3. Input the Jira ticket number (e.g., PROJ-123)
4. Select your story point estimate
5. Click "Stop & Reveal" to see the result

### Multiplayer (Online Mode)

1. Visit the [live app](https://felladin.github.io/point_poker/)
2. Enter your name and click "Join Session"
3. Click **"Create New Session"** to generate a unique session code
4. Share the **invite link** or **session code** with your team
5. Team members open the link or enter the code to join
6. The host enters a Jira ticket number and starts voting
7. All players select their estimates — votes stay hidden
8. The host clicks "Stop & Reveal" to show all votes
9. Review the average and suggested story points
10. Click "Reset Votes" to start the next estimation

> **Note:** Multiplayer mode requires Firebase setup (see below).

## 🔥 Firebase Setup (for Multiplayer)

To enable multiplayer sessions, you need a free Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or use an existing one)
3. In your project, go to **Project Settings** → **General** → **Your apps**
4. Click the web icon (`</>`) to add a web app
5. Copy the `firebaseConfig` object from the setup screen
6. Open `firebase-config.js` in this repository and replace the placeholder values with your config
7. In the Firebase Console, go to **Realtime Database** → **Create Database**
8. Choose a location and start in **test mode** (or set custom rules below)
9. Set the database rules to:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

That's it! The app will automatically detect the Firebase configuration and enable the multiplayer session controls.

## 💻 Local Development

> **Note:** This app uses ES modules, which require files to be served over HTTP.
> Opening `index.html` directly (via `file://`) will cause an error like
> *"Can't use import outside a module"*. Use a local server instead:

```bash
# Clone the repository
git clone https://github.com/felladin/point_poker.git

# Navigate to the folder
cd point_poker

# Install dependencies (requires Node.js and npm)
npm install

# Start the local server
npm start
