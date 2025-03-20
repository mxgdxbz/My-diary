/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UNSPLASH_ACCESS_KEY: string;
  readonly VITE_DEFAULT_WALLPAPER_THEME: string;
  readonly VITE_ENABLE_LOCAL_FALLBACK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 