import React, { useEffect, useState } from 'react';
import { Box, Flex, Skeleton, Text, useToken, useColorMode } from '@chakra-ui/react';
import { useDynamicWallpaper } from '../utils/DynamicWallpaper';
import PullToRefresh from './PullToRefresh';
import { generateGradientBackground } from '../utils/LocalWallpapers';

interface WallpaperBackgroundProps {
  children: React.ReactNode;
  enablePullToRefresh?: boolean;
}

const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  children,
  enablePullToRefresh = true
}) => {
  const { wallpaper, isLoading, error, refreshWallpaper } = useDynamicWallpaper();
  const [opacity, setOpacity] = useState(0);
  const [delayedChildren, setDelayedChildren] = useState(false);
  const [brandColors] = useToken('colors', ['brand.500', 'brand.600']);
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // 在组件加载时记录调试信息，帮助定位问题
  useEffect(() => {
    console.log('WallpaperBackground 加载中...');
    
    // 检查环境变量
    const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    console.log('API Key 状态:', apiKey ? '已设置' : '未设置');
    
    // 检查本地壁纸图片
    const testImage = new Image();
    testImage.onload = () => console.log('本地图片测试加载成功:', testImage.src);
    testImage.onerror = (e) => console.error('本地图片测试加载失败:', testImage.src, e);
    testImage.src = '/wallpapers/forest.jpg';
    
    return () => {
      // 清理测试图片
      testImage.onload = null;
      testImage.onerror = null;
    };
  }, []);

  // 壁纸加载后的动画效果
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;
    let childrenTimeout: NodeJS.Timeout;
    
    if (!isLoading && wallpaper) {
      console.log('壁纸已加载，准备显示动画');
      // 延迟300ms显示壁纸 (渐变效果)
      animationTimeout = setTimeout(() => {
        setOpacity(1);
      }, 300);
      
      // 延迟1秒显示内容
      childrenTimeout = setTimeout(() => {
        setDelayedChildren(true);
      }, 1000);
    }
    
    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(childrenTimeout);
    };
  }, [isLoading, wallpaper]);

  // 强制刷新壁纸 - 简化刷新逻辑
  const handleRefresh = async () => {
    try {
      // 淡出效果
      setOpacity(0);
      setDelayedChildren(false);
      
      // 等待渐变消失
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 刷新壁纸
      await refreshWallpaper();
    } catch (error) {
      console.error('刷新壁纸失败:', error);
    }
  };

  // 获取背景样式
  const getBackgroundStyle = () => {
    if (!wallpaper || error) {
      // 默认渐变背景 (如果没有壁纸或发生错误)
      return {
        bg: isDark 
          ? `linear-gradient(135deg, #1A202C 0%, #2D3748 100%)`
          : `linear-gradient(135deg, #F9F7F4 0%, #E6DED5 100%)`,
      };
    }
    
    if (wallpaper.url) {
      // 带有壁纸的背景
      const darkModeFilter = isDark 
        ? 'brightness(0.6) hue-rotate(200deg)'
        : 'none'; 
        
      // 根据深色/浅色模式调整渐变叠加的颜色
      const overlayGradient = isDark
        ? 'linear-gradient(rgba(26, 32, 44, 0.75), rgba(45, 55, 72, 0.85))'
        : 'linear-gradient(rgba(249, 247, 244, 0.65), rgba(230, 222, 213, 0.75))';
      
      return {
        bgImage: `${overlayGradient}, url(${wallpaper.url})`,
        bgSize: 'cover',
        bgPosition: 'center',
        filter: darkModeFilter,
      };
    }
    
    // 回退到生成的渐变背景
    return {
      bg: isDark
        ? `linear-gradient(135deg, #1A202C 0%, #2D3748 100%)`
        : generateGradientBackground(wallpaper),
    };
  };

  // 主要内容渲染
  const renderMainContent = () => (
    <>
      {/* 壁纸背景层 */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        {...getBackgroundStyle()}
        opacity={opacity}
        transition="opacity 2s ease"
        zIndex={-1}
        data-wallpaper="true"
      />
      
      {/* 装饰性渐变叠加层 */}
      <Box 
        position="fixed" 
        top="5%" 
        left="10%" 
        width="40%" 
        height="40%" 
        borderRadius="full" 
        bg={`rgba(${brandColors[0].replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16))}, ${isDark ? '0.1' : '0.05'})`}
        filter="blur(70px)" 
        zIndex={-1}
      />
      <Box 
        position="fixed" 
        bottom="15%" 
        right="5%" 
        width="30%" 
        height="30%" 
        borderRadius="full" 
        bg={`rgba(${brandColors[1].replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16))}, ${isDark ? '0.15' : '0.08'})`}
        filter="blur(80px)" 
        zIndex={-1}
      />
      
      {/* 骨架屏加载状态 */}
      {isLoading && (
        <Flex 
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={2}
          direction="column"
          justify="center"
          align="center"
          bg={isDark ? "rgba(26, 32, 44, 0.8)" : "rgba(249, 247, 244, 0.8)"}
        >
          <Skeleton height="200px" width="80%" borderRadius="xl" my={4} />
          <Skeleton height="40px" width="50%" borderRadius="md" my={2} />
          <Skeleton height="20px" width="70%" borderRadius="md" my={1} />
          <Skeleton height="20px" width="60%" borderRadius="md" my={1} />
          
          <Text mt={6} color={isDark ? "whiteAlpha.800" : "neutrals.800"} fontSize="sm">
            正在加载您的专属壁纸...
          </Text>
        </Flex>
      )}
      
      {/* 壁纸信息 */}
      {wallpaper && wallpaper.url && (
        <Box
          position="fixed"
          right={3}
          bottom={3}
          fontSize="xs"
          color={isDark ? "whiteAlpha.700" : "neutrals.800"}
          bg={isDark ? "rgba(26, 32, 44, 0.5)" : "rgba(255, 255, 255, 0.5)"}
          p={1}
          px={2}
          borderRadius="md"
          opacity={0.7}
          _hover={{ opacity: 1 }}
          transition="opacity 0.3s"
          zIndex={1}
        >
          {wallpaper.photographer && (
            <>
              摄影: {wallpaper.photographerProfileUrl ? (
                <Text as="a" 
                  href={wallpaper.photographerProfileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  textDecor="underline"
                  _hover={{ color: "brand.500" }}
                >
                  {wallpaper.photographer}
                </Text>
              ) : (
                wallpaper.photographer
              )}
            </>
          )}
          {wallpaper.location && ` · ${wallpaper.location}`}
          {wallpaper.unsplashUrl && (
            <Text as="span" ml={1}>
               · 由 
              <Text as="a" 
                href={wallpaper.unsplashUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                textDecor="underline"
                _hover={{ color: "brand.500" }}
                ml={1}
              >
                Unsplash
              </Text>
              提供
            </Text>
          )}
        </Box>
      )}
      
      {/* 孩子组件，延迟显示动画 */}
      <Box
        opacity={!isLoading && delayedChildren ? 1 : 0}
        transform={!isLoading && delayedChildren ? "translateY(0)" : "translateY(20px)"}
        transition="all 1s ease"
        height="100%"
      >
        {children}
      </Box>
    </>
  );

  return (
    <Box 
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflow="auto"
      zIndex={0}
    >
      {enablePullToRefresh ? (
        <PullToRefresh onRefresh={handleRefresh}>
          {renderMainContent()}
        </PullToRefresh>
      ) : (
        renderMainContent()
      )}
    </Box>
  );
};

export default WallpaperBackground; 