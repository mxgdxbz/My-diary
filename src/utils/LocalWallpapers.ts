import { Wallpaper } from './DynamicWallpaper';

// 用于在Unsplash API不可用时提供本地壁纸
const localWallpapers: Wallpaper[] = [
  {
    id: 'local-1',
    url: '/wallpapers/forest.jpg',
    altDescription: '森林风景',
    photographer: '本地图片',
    location: '本地资源'
  },
  {
    id: 'local-2',
    url: '/wallpapers/beach.jpg',
    altDescription: '海滩风景',
    photographer: '本地图片',
    location: '本地资源'
  },
  {
    id: 'local-3',
    url: '/wallpapers/mountains.jpg',
    altDescription: '山脉风景',
    photographer: '本地图片',
    location: '本地资源'
  },
  {
    id: 'local-4',
    url: '/wallpapers/city.jpg',
    altDescription: '城市风景',
    photographer: '本地图片',
    location: '本地资源'
  },
  {
    id: 'local-5',
    url: '/wallpapers/garden.jpg',
    altDescription: '花园风景',
    photographer: '本地图片',
    location: '本地资源'
  },
  {
    id: 'local-6',
    url: '/wallpapers/pet.jpg',
    altDescription: '宠物',
    photographer: '本地图片',
    location: '本地资源'
  },
  {
    id: 'local-7',
    url: '/wallpapers/people.jpg',
    altDescription: '人物',
    photographer: '本地图片',
    location: '本地资源'
  },
  // 默认渐变背景 (用于在线和本地资源都不可用时)
  {
    id: 'local-gradient-1',
    url: '',
    altDescription: '淡米色渐变',
    photographer: '系统默认',
    location: '内置资源'
  }
];

// 获取一张随机本地壁纸
export const getRandomLocalWallpaper = (): Wallpaper => {
  // 选择一个随机索引
  const randomIndex = Math.floor(Math.random() * localWallpapers.length);
  return localWallpapers[randomIndex];
};

// 根据主题获取相关的本地壁纸
export const getLocalWallpaperByTheme = (theme: string): Wallpaper => {
  let matchingWallpapers: Wallpaper[] = [];
  
  // 尝试匹配主题关键词
  if (theme.includes('森林') || theme.includes('树') || theme.includes('绿')) {
    matchingWallpapers = localWallpapers.filter(wp => 
      wp.altDescription?.includes('森林') || wp.id === 'local-1'
    );
  } else if (theme.includes('海') || theme.includes('滩') || theme.includes('水')) {
    matchingWallpapers = localWallpapers.filter(wp => 
      wp.altDescription?.includes('海滩') || wp.id === 'local-2'
    );
  } else if (theme.includes('山') || theme.includes('脉')) {
    matchingWallpapers = localWallpapers.filter(wp => 
      wp.altDescription?.includes('山') || wp.id === 'local-3'
    );
  } else if (theme.includes('城') || theme.includes('市') || theme.includes('建筑')) {
    matchingWallpapers = localWallpapers.filter(wp => 
      wp.altDescription?.includes('城市') || wp.id === 'local-4'
    );
  } else if (theme.includes('花') || theme.includes('园')) {
    matchingWallpapers = localWallpapers.filter(wp => 
      wp.altDescription?.includes('花园') || wp.id === 'local-5'
    );
  }
  
  // 如果没有匹配的壁纸，返回任意一张
  if (matchingWallpapers.length === 0) {
    return getRandomLocalWallpaper();
  }
  
  // 从匹配的壁纸中随机选择一张
  const randomIndex = Math.floor(Math.random() * matchingWallpapers.length);
  return matchingWallpapers[randomIndex];
};

// 检查本地壁纸文件是否存在
export const checkLocalWallpaperExists = async (wallpaper: Wallpaper): Promise<boolean> => {
  // 如果是渐变背景，直接返回true
  if (!wallpaper.url || wallpaper.url === '') {
    return true;
  }
  
  try {
    // 尝试加载图片
    const response = await fetch(wallpaper.url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('Failed to check local wallpaper:', error);
    return false;
  }
};

// 生成渐变背景CSS
export const generateGradientBackground = (wallpaper: Wallpaper): string => {
  if (wallpaper.id === 'local-gradient-1') {
    return 'linear-gradient(135deg, #F9F7F4 0%, #E6DED5 100%)';
  } else if (wallpaper.id === 'local-gradient-2') {
    return 'linear-gradient(135deg, #E6F4F9 0%, #D5E6E9 100%)';
  } else {
    // 默认米色渐变
    return 'linear-gradient(135deg, #F9F7F4 0%, #E6DED5 100%)';
  }
};

// 心情颜色映射更新
export const moodColors = {
  '😊': '#E9AFA3',  // 珊瑚粉 - 开心
  '😍': '#E39A8B',  // 珊瑚粉加深 - 爱
  '🥳': '#F1C7BD',  // 珊瑚粉中浅色 - 庆祝
  '😌': '#EDB9AD',  // 珊瑚粉中色 - 放松
  '🤔': '#B7BEC9',  // 中性色 - 思考
  '😢': '#99B2DD',  // 淡雅蓝 - 悲伤
  '😡': '#B56151',  // 珊瑚粉极深色 - 生气
  '😴': '#FDF0ED',  // 珊瑚粉超浅色 - 疲倦
  '🤒': '#E6E8EC',  // 浅灰色 - 不适
  '🥺': '#CC7D6E',  // 珊瑚粉深色 - 担忧
}; 