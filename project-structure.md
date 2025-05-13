# Diary Darling Project Structure

## Root Directory
```
diary-darling/
├── dist/                      # Build output directory
├── src/                       # Source code directory
├── functions/                 # Firebase Cloud Functions
├── public/                    # Static assets
├── scripts/                   # Build and utility scripts
├── python-functions/          # Python-based cloud functions
├── appdiary/                  # App-specific configurations
├── extensions/               # Firebase extensions
├── dataconnect/              # Data connection configurations
├── dataconnect-generated/    # Generated data connection files
├── .firebase/                # Firebase deployment cache
├── .cursor/                  # Cursor IDE configuration
├── node_modules/             # Node.js dependencies
├── .git/                     # Git repository data
```

## Source Code Structure (src/)
```
src/
├── components/               # React components
│   ├── BackgroundBrightnessDetector.tsx
│   ├── LoginPage.tsx
│   ├── PullToRefresh.tsx
│   └── WallpaperBackground.tsx
├── utils/                    # Utility functions
│   ├── DynamicWallpaper.ts
│   ├── LocalWallpapers.ts
│   ├── ShareCalendar.tsx
│   └── likeManager.ts
├── config/                   # Configuration files
│   ├── FirebaseConfig.tsx
│   └── theme.ts
├── styles/                   # CSS and style files
├── types/                    # TypeScript type definitions
├── App.tsx                   # Main application component
└── main.tsx                  # Application entry point
```

## Configuration Files
```
├── .env                      # Environment variables
├── .firebaserc              # Firebase project configuration
├── firebase.json            # Firebase configuration
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
├── database.rules.json      # Realtime Database rules
├── firestore.indexes.json   # Firestore indexes
├── apphosting.yaml          # App hosting configuration
├── remoteconfig.template.json # Remote config template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # Node-specific TypeScript config
└── .eslintrc.cjs            # ESLint configuration
```

## Key Features
- React-based frontend with TypeScript
- Firebase backend integration
- Cloud Functions for serverless operations
- Dynamic wallpaper system
- Calendar sharing functionality
- Like/Unlike system for diary entries
- Pull-to-refresh functionality
- Responsive design with Chakra UI
- Multi-language support (Chinese/English)
- Diary entry management with images
- Mood tracking and calendar view
- User authentication and profile management

## Development Tools
- Vite for build tooling
- TypeScript for type safety
- ESLint for code linting
- Chakra UI for component library
- Firebase for backend services
- Git for version control 