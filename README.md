# Daily Diary App

A modern, feature-rich daily diary application built with React and Firebase, allowing users to create, manage, and customize their personal diary entries.

## 🚀 Features

- 📝 Create and manage daily diary entries
- 🎨 Modern and responsive UI using Chakra UI
- 🔥 Real-time data synchronization with Firebase
- 📱 Cross-platform compatibility
- 🔒 Secure authentication and data storage
- 📅 Date-based entry organization

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Chakra UI
- **Backend/Database**: Firebase
- **State Management**: React Hooks
- **Date Handling**: date-fns
- **Additional Libraries**: 
  - html2canvas for content capture
  - framer-motion for animations
  - react-icons for UI icons

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account and project setup

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daily-diary-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
daily-diary-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main application component
│   ├── FirebaseConfig.tsx  # Firebase configuration
│   └── main.tsx       # Application entry point
├── public/            # Static assets
├── functions/         # Firebase Cloud Functions
└── dist/             # Production build output
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run style-check` - Check code style
- `npm run predeploy` - Run checks before deployment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Thanks to all contributors and users of this application
- Special thanks to the React and Firebase communities 