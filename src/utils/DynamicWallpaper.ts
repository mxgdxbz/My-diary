import { useEffect, useState } from 'react';
import { getLocalWallpaperByTheme, getRandomLocalWallpaper } from './LocalWallpapers';

// 从环境变量获取Unsplash API密钥
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

// 在开发环境打印调试信息
if (import.meta.env.DEV) {
  console.log('Unsplash API Key status:', UNSPLASH_ACCESS_KEY ? 'Set' : 'Not set');
}

// 定义壁纸相关接口
export interface Wallpaper {
  id: string;
  url: string;
  blurHash?: string;
  altDescription?: string;
  photographer?: string;
  location?: string;
  photographerProfileUrl?: string; // 摄影师Unsplash主页URL
  unsplashUrl?: string; // 图片在Unsplash的URL
}

// 图片分类主题 - 从环境变量中读取，如果未设置则使用默认值
const defaultThemes = 'beach, sky, sunset, sunrise, cloud, flower, tree, mountain, city, lake, garden, pet, human';
const themesString = import.meta.env.VITE_DEFAULT_WALLPAPER_THEME || defaultThemes;
export const wallpaperThemes = themesString.split(',').map((theme: string) => theme.trim());

// 获取默认主题
export const getDefaultTheme = (): string => {
  return wallpaperThemes[Math.floor(Math.random() * wallpaperThemes.length)];
};

// 应用名称用于UTM跟踪
const APP_NAME = 'about_me_page';

// 获取壁纸URL - 直接使用Unsplash随机图片API
export const getWallpaperUrl = async (theme?: string): Promise<string> => {
  // 如果没有提供主题，则随机选择一个
  const query = theme || getDefaultTheme();
  
  // 构建Unsplash随机图片API URL
  // 根据文档，我们可以使用query参数来过滤图片
  const apiUrl = `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // 返回regular尺寸的图片URL
    return data.urls.regular;
  } catch (error) {
    console.error('Error fetching wallpaper from Unsplash:', error);
    // 返回一个默认图片URL作为备用
    return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e';
  }
};

// 从Unsplash获取随机壁纸，如果失败则使用本地壁纸
export const fetchRandomWallpaper = async (
  theme: string = getDefaultTheme()
): Promise<Wallpaper> => {
  try {
    // 检查API密钥是否有效 - 修改检查逻辑
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY.trim() === '') {
      console.warn('未找到Unsplash API密钥，使用本地壁纸');
      return getLocalWallpaperByTheme(theme);
    }
    
    // 构建API URL
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(theme)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}&_cache=${Date.now()}`;
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
    
    // 发起请求
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Version': 'v1',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wallpaper: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 验证返回的数据包含必要的字段
    if (!data.urls || !data.urls.regular) {
      throw new Error('Invalid response from Unsplash API');
    }
    
    // 构建UTM参数
    const utmParams = `utm_source=${APP_NAME}&utm_medium=referral`;
    
    // 获取摄影师信息和照片链接
    const photographerUsername = data.user?.username || 'unsplash';
    const photographerProfileUrl = `https://unsplash.com/@${photographerUsername}?${utmParams}`;
    const unsplashUrl = `${data.links?.html || `https://unsplash.com/photos/${data.id}`}?${utmParams}`;
    
    // 构建壁纸对象
    const wallpaper: Wallpaper = {
      id: data.id,
      url: data.urls.regular,
      blurHash: data.blur_hash || undefined,
      altDescription: data.alt_description || theme,
      photographer: data.user?.name || 'Unknown',
      location: data.location?.name || undefined,
      photographerProfileUrl: photographerProfileUrl,
      unsplashUrl: unsplashUrl
    };
    
    return wallpaper;
  } catch (error) {
    console.error('Error fetching wallpaper from Unsplash, using local fallback:', error);
    
    // 返回本地壁纸
    return getLocalWallpaperByTheme(theme);
  }
};

// React Hook用于动态壁纸
export const useDynamicWallpaper = (defaultTheme?: string) => {
  const [wallpaper, setWallpaper] = useState<Wallpaper | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalWallpaper, setUseLocalWallpaper] = useState(false);
  
  // 加载新壁纸的函数
  const loadWallpaper = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 使用随机主题获取壁纸
      const newWallpaper = await fetchRandomWallpaper(defaultTheme || getDefaultTheme());
      setWallpaper(newWallpaper);
      setUseLocalWallpaper(newWallpaper.id.startsWith('local-'));
    } catch (err) {
      console.error('Error loading wallpaper:', err);
      setError('无法加载壁纸。请检查您的网络连接或稍后再试。');
      
      // 使用本地壁纸作为后备
      const localWallpaper = getRandomLocalWallpaper();
      setWallpaper(localWallpaper);
      setUseLocalWallpaper(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 组件挂载时加载壁纸
  useEffect(() => {
    loadWallpaper();
  }, [defaultTheme]);
  
  return { 
    wallpaper, 
    isLoading, 
    error, 
    useLocalWallpaper,
    refreshWallpaper: () => loadWallpaper() 
  };
}; 