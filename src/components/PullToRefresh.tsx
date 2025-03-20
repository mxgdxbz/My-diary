import React, { useState, useEffect, ReactNode } from 'react';
import { Box, Text, Spinner, Flex } from '@chakra-ui/react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  pullDistance?: number;
  bgColor?: string;
  textColor?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullDistance = 120,
  bgColor = 'rgba(255, 255, 255, 0.3)',
  textColor = 'gray.700'
}) => {
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [_touchIdentifier, setTouchIdentifier] = useState<number | null>(null);
  
  // 计算下拉距离
  const pullY = currentY && startY ? currentY - startY : 0;
  const pullPercent = Math.min(100, (pullY / pullDistance) * 100);
  
  // 处理触摸开始事件
  const handleTouchStart = (e: TouchEvent) => {
    // 仅当页面滚动到顶部时才启用下拉刷新
    if (window.scrollY === 0 && e.touches.length === 2) {
      // 记录双指触摸的中心点Y坐标
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      setStartY(centerY);
      setCurrentY(centerY);
      setPulling(true);
      setTouchIdentifier(e.touches[0].identifier);
    }
  };

  // 处理触摸移动事件
  const handleTouchMove = (e: TouchEvent) => {
    if (!pulling || refreshing) return;

    // 确认是双指触摸
    if (e.touches.length === 2) {
      // 计算双指触摸的中心点Y坐标
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      setCurrentY(centerY);
      
      // 防止页面滚动
      if (pullY > 5) {
        e.preventDefault();
      }
    } else {
      // 如果不是双指触摸，取消下拉
      setPulling(false);
    }
  };

  // 处理触摸结束事件
  const handleTouchEnd = async (_e: TouchEvent) => {
    // 检查是否完成了足够的下拉距离
    if (pulling && pullY >= pullDistance) {
      setRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setRefreshing(false);
      }
    }
    
    // 重置状态
    setPulling(false);
    setStartY(null);
    setCurrentY(null);
    setTouchIdentifier(null);
  };

  // 添加和移除触摸事件监听器
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pulling, refreshing, pullY, startY]);

  return (
    <Box position="relative" h="100%">
      {/* 刷新指示器 */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bg={bgColor}
        zIndex={1000}
        h={`${Math.max(0, pullY)}px`}
        opacity={pulling || refreshing ? 1 : 0}
        transition={pulling ? 'none' : 'all 0.3s ease'}
        transform={refreshing ? 'none' : `translateY(-${refreshing ? 0 : pullY}px)`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderBottomRadius="md"
        boxShadow={pulling || refreshing ? 'md' : 'none'}
      >
        <Flex direction="column" align="center" justify="center">
          {refreshing ? (
            <Spinner color={textColor} size="md" />
          ) : (
            <>
              <Box
                transform={`rotate(${Math.min(180, pullPercent * 1.8)}deg)`}
                transition="transform 0.1s ease"
                mb={2}
              >
                <Box as="span" fontSize="24px">
                  ↓
                </Box>
              </Box>
              <Text color={textColor} fontSize="sm">
                {pullPercent >= 100 ? '释放刷新壁纸' : '下拉刷新壁纸'}
              </Text>
            </>
          )}
        </Flex>
      </Box>
      
      {/* 子组件 */}
      {children}
    </Box>
  );
};

export default PullToRefresh;