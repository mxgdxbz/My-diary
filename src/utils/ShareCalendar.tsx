import html2canvas from 'html2canvas';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { fetchRandomWallpaper } from './DynamicWallpaper';

// 分享功能开关 - 设置为 false 暂时禁用分享功能
export const SHARE_CALENDAR_ENABLED = false;

// Helper function for drawing rounded rectangles
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 分享日历功能
 * @param currentMonth 当前月份
 * @param language 当前语言
 * @param diaries 日记数据
 * @param getMoodColor 获取心情颜色的函数
 */
export const shareCalendar = async (
  currentMonth: Date,
  language: 'zh' | 'en', 
  diaries: Array<{id: string, date: string, mood: string}>,
  getMoodColor: (mood: string, opacity?: number) => string,
  toast: any
) => {
  // 检查分享功能是否启用
  if (!SHARE_CALENDAR_ENABLED) {
    toast({
      title: language === 'zh' ? '分享功能暂时不可用' : 'Share feature temporarily unavailable',
      description: language === 'zh' ? '我们正在完善分享功能，敬请期待' : 'We are improving the share feature. Stay tuned!',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    return;
  }

  try {
    // 调试信息：记录环境信息，有助于跟踪问题
    console.log(`ShareCalendar: 开始寻找日历元素, 当前月份: ${format(currentMonth, 'yyyy-MM')}`);

    // 获取壁纸 - 异步获取，不阻塞主流程
    let wallpaperImage: HTMLImageElement | null = null;
    try {
      const wallpaper = await fetchRandomWallpaper();
      if (wallpaper && wallpaper.url) {
        try {
          wallpaperImage = new Image();
          wallpaperImage.crossOrigin = "anonymous";
          wallpaperImage.src = wallpaper.url;
          await new Promise<void>((resolve, reject) => {
            if (wallpaperImage) {
              wallpaperImage.onload = () => resolve();
              wallpaperImage.onerror = (e) => reject(e);
            } else {
              reject(new Error('wallpaperImage is null'));
            }
          });
          console.log("ShareCalendar: 壁纸加载成功");
        } catch (error) {
          console.error("ShareCalendar: 壁纸加载失败", error);
          wallpaperImage = null;
        }
      }
    } catch (error) {
      console.error("ShareCalendar: 壁纸获取失败", error);
      wallpaperImage = null;
    }
    
    // 隐藏导航按钮和提示文字（创建并应用临时样式）
    const tempStyle = document.createElement('style');
    tempStyle.innerHTML = `
      .chakra-button[aria-label="Previous Month"],
      .chakra-button[aria-label="Next Month"],
      .chakra-button[aria-label="Today"],
      .chakra-button[aria-label="上个月"],
      .chakra-button[aria-label="下个月"],
      .chakra-button[aria-label="今天"],
      button:contains("上个月"),
      button:contains("下个月"),
      button:contains("今天"),
      button:contains("Previous Month"),
      button:contains("Next Month"),
      button:contains("Today"),
      .calendar-nav-button,
      .calendar-navigation,
      .calendar-controls,
      .toolbar-button,
      .month-nav,
      [role="navigation"],
      [class*="reminder-text"],
      [class*="hint-text"],
      button:has(svg),
      button.calendar-nav-button,
      .calendar-container [role="button"],
      .diary-calendar-layout [role="button"],
      .chakra-table + div > button,
      a[class*="nav"], 
      [class*="nav-button"],
      .chakra-stack button,
      .calendar-header button {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        z-index: -10 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(tempStyle);

    // 额外处理：先尝试移除导航按钮再截图
    try {
      const navButtons = document.querySelectorAll('button.calendar-nav-button, .calendar-container button, .chakra-stack button, button:has(svg)');
      console.log(`ShareCalendar: 找到 ${navButtons.length} 个导航按钮元素`);
      
      // 临时保存原始display状态
      const originalDisplayStates: Map<Element, string> = new Map();
      
      // 暂时隐藏这些元素
      navButtons.forEach(button => {
        originalDisplayStates.set(button, (button as HTMLElement).style.display);
        (button as HTMLElement).style.display = 'none';
      });
      
      // 在事件循环的下一帧继续执行，确保DOM更新
      setTimeout(() => {
        // 在完成后续处理时，确保还原原始状态
        const restoreNavButtons = () => {
          navButtons.forEach(button => {
            (button as HTMLElement).style.display = originalDisplayStates.get(button) || '';
          });
          console.log('ShareCalendar: 已还原导航按钮显示状态');
        };
        
        // 将恢复函数保存到全局，以便在任何地方都能访问
        window.restoreNavButtons = restoreNavButtons;
        
        // 设置安全超时，确保按钮最终会被恢复（30秒后）
        const safetyTimeout = setTimeout(() => {
          if (typeof window.restoreNavButtons === 'function') {
            window.restoreNavButtons();
            console.log('ShareCalendar: 通过安全超时恢复了导航按钮');
          }
        }, 30000);
        
        // 将safetyTimeout存储到window上，以便后续清理
        window.safetyRestoreTimeout = safetyTimeout;
        
        // 继续代码执行...
        // 之后的代码保持不变，但确保在处理完成后恢复按钮状态
        
        // 在各个关键点添加调用
        // 如在捕获成功后:
        // restoreNavButtons();
        
        // 或在错误处理中:
        // try { ... } catch (e) { restoreNavButtons(); throw e; }
      }, 100);
    } catch (error) {
      console.error('尝试隐藏导航按钮时出错:', error);
      // 继续执行，不要因为这个额外步骤失败而中断整个流程
    }
    
    // 尝试多种选择器找到日历元素
    let calendarElement = null;
    
    // 记录所有可能的选择器结果，便于调试
    const selectors = [
      { name: 'calendar-container', elements: document.querySelectorAll('.calendar-container') },
      { name: 'role=grid', elements: document.querySelectorAll('[role="grid"]') },
      { name: 'chakra-table', elements: document.querySelectorAll('table.chakra-table') },
      { name: 'diary-calendar-layout', elements: document.querySelectorAll('.diary-calendar-layout') },
      { name: 'simple-grid', elements: document.querySelectorAll('.chakra-simple-grid') },
      { name: 'grid elements', elements: document.querySelectorAll('.diary-grid, .calendar-grid, [class*="calendar-grid"]') },
      { name: 'react-calendar', elements: document.querySelectorAll('.react-calendar, [class*="react-calendar"]') },
      { name: 'month-container', elements: document.querySelectorAll('.month-container, [class*="month-container"]') },
      { name: 'chakra-stack with calendar', elements: document.querySelectorAll('.chakra-stack:has([role="grid"])') },
    ];
    
    // 记录找到的元素类型和数量
    selectors.forEach(selector => {
      if (selector.elements.length > 0) {
        console.log(`ShareCalendar: 找到 ${selector.name} 元素: ${selector.elements.length}个`);
      }
    });
    
    // 查找所有表格和网格，特别查找含日期数字的元素
    const tables = document.querySelectorAll('table');
    console.log(`ShareCalendar: 找到 ${tables.length} 个表格元素`);
    
    // 一系列可能包含日历的容器元素类型
    const possibleContainers = document.querySelectorAll('.chakra-container, main, [role="main"], .main-content, .content-area');
    console.log(`ShareCalendar: 找到 ${possibleContainers.length} 个可能的容器元素`);
    
    // 方法1: 优先使用带role="grid"的元素
    const calendarGrids = document.querySelectorAll('[role="grid"]');
    if (calendarGrids && calendarGrids.length > 0) {
      console.log('ShareCalendar: 找到日历网格元素');
      const parentContainer = calendarGrids[0].closest('.calendar-container, [class*="calendar"], .chakra-stack, .diary-app');
      if (parentContainer) {
        calendarElement = parentContainer;
        console.log('ShareCalendar: 使用网格元素的父容器');
      } else {
        calendarElement = calendarGrids[0];
        console.log('ShareCalendar: 使用网格元素本身');
      }
    } 
    // 方法2: 查找calendar-container
    else if (document.querySelector('.calendar-container')) {
      console.log('ShareCalendar: 找到日历容器元素');
      calendarElement = document.querySelector('.calendar-container');
    }
    

    
    // 最终检查
    if (!calendarElement) {
      console.log('ShareCalendar: 无法找到任何日历相关元素，将直接创建备用图片');
      
      // 记录完整的DOM结构以便于调试
      const rootElement = document.querySelector('#root') || document.body;
      const simplifiedDOM = simplifyDOM(rootElement);
      console.log('ShareCalendar: 简化的DOM结构:', simplifiedDOM);
      
      // 不返回错误，而是直接使用备用计划创建图片
      try {
        console.log("ShareCalendar: 直接使用备用计划创建分享图片");
        createFallbackCalendarImage(currentMonth, language, diaries, getMoodColor, toast, wallpaperImage);
        
        // 清理临时样式
        document.head.removeChild(tempStyle);
        
        return; // 使用备用计划，无需执行后续代码
      } catch (fallbackError) {
        console.error("ShareCalendar: 备用计划失败:", fallbackError);
        toast({
          title: language === 'zh' ? '无法生成分享图片' : 'Cannot generate share image',
          description: language === 'zh' ? '请稍后再试' : 'Please try again later',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        
        // 清理临时样式
        document.head.removeChild(tempStyle);
        
        return;
      }
    }
    
    console.log('ShareCalendar: 成功找到日历元素:', calendarElement);
    
    toast({
      title: language === 'zh' ? '正在生成分享图片...' : 'Generating share image...',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });

    try {
      // 使用html2canvas捕获日历元素
      const canvas = await html2canvas(calendarElement as HTMLElement, {
        backgroundColor: null,
        scale: 3, // 提高分辨率至3倍，获得更清晰的图像
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 0, // 避免图像加载超时
        onclone: (document) => {
          // 在复制的文档上应用额外样式以改进渲染
          const style = document.createElement('style');
          style.innerHTML = `
            * {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
            }
            [data-emoji], .emoji, span:has(img.emoji) {
              font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif !important;
              font-size: 120% !important;
            }
          `;
          document.head.appendChild(style);
          return document;
        }
      });
      
      // 调用restoreNavButtons以恢复按钮状态
      if (typeof window.restoreNavButtons === 'function') {
        window.restoreNavButtons();
        // 清理安全定时器
        if (window.safetyRestoreTimeout) {
          clearTimeout(window.safetyRestoreTimeout);
          window.safetyRestoreTimeout = undefined;
        }
      }
      
      // 创建一个更适合移动端的长方形画布（9:16比例）
      const styledCanvas = document.createElement('canvas');
      // 保持宽高比为9:16
      const canvasWidth = Math.max(canvas.width, 1080);
      const canvasHeight = Math.round(canvasWidth * 16 / 9);
      
      styledCanvas.width = canvasWidth;
      styledCanvas.height = canvasHeight;
      const ctx = styledCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }
      
      // 如果有壁纸，使用壁纸作为背景
      if (wallpaperImage) {
        // 填充整个画布
        const aspectRatio = wallpaperImage.width / wallpaperImage.height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (aspectRatio > canvasWidth/canvasHeight) { // 壁纸较宽
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * aspectRatio;
          drawX = (canvasWidth - drawWidth) / 2;
          drawY = 0;
        } else { // 壁纸较窄
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / aspectRatio;
          drawX = 0;
          drawY = (canvasHeight - drawHeight) / 2;
        }
        
        // 添加适当模糊效果，让日历内容更加突出
        ctx.filter = 'blur(10px)';
        ctx.drawImage(wallpaperImage, drawX, drawY, drawWidth, drawHeight);
        ctx.filter = 'none';
        
        // 添加半透明覆盖层，提高内容可读性 - 参照图片使用浅色背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        // 如果没有壁纸，使用浅色背景 - 参照图片
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      
      // 添加应用标题 - 参照图片中的"心情日历"标题
      ctx.font = `bold ${Math.round(canvasWidth * 0.06)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText(language === 'zh' ? '心情日历' : 'Mood Calendar', 120, 100);
      
      // 添加分享按钮 - 模拟图片右上角的分享按钮
      ctx.fillStyle = 'rgba(255, 200, 200, 0.2)';
      roundedRect(ctx, canvasWidth - 180, 65, 120, 50, 25);
      ctx.fill();
      
      ctx.font = `normal ${Math.round(canvasWidth * 0.035)}px system-ui`;
      ctx.fillStyle = '#e07979';
      ctx.textAlign = 'center';
      ctx.fillText(language === 'zh' ? '分享' : 'Share', canvasWidth - 120, 97);
      
      // 添加月份标题 - 参照图片中的"2025年03月"
      const monthYear = format(currentMonth, language === 'zh' ? 'yyyy年MM月' : 'MMMM yyyy');
      ctx.font = `bold ${Math.round(canvasWidth * 0.055)}px system-ui`;
      ctx.fillStyle = 'rgba(220, 100, 100, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(monthYear, canvasWidth / 2, 240);
      
      // 计算日历区域的位置和尺寸 - 由于移除了导航按钮，日历区域上移
      const calendarTop = 300; // 调整位置，原来是 buttonY + buttonHeight + 30
      const calendarWidth = canvasWidth - 240;  // 左右各留出120的边距
      const calendarX = 120;
      
      // 获取当月第一天是星期几和当月天数
      const daysInMonth = endOfMonth(currentMonth).getDate();
      const firstDayOfMonth = startOfMonth(currentMonth).getDay(); // 0 = 周日，1 = 周一...
      const weeksCount = Math.ceil((daysInMonth + firstDayOfMonth) / 7); // 计算需要几行显示完整月份
      
      // 计算单元格尺寸 - 参照图片设置合适的大小
      const cellWidth = calendarWidth / 7;
      const cellHeight = cellWidth;  // 保持正方形单元格
      const calendarHeight = cellHeight * (weeksCount + 1); // +1是为了星期标题行
      
      // 星期标题行
      const weekdays = language === 'zh' 
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // 绘制星期标题
      for (let i = 0; i < 7; i++) {
        const x = calendarX + i * cellWidth;
        const y = calendarTop;
        
        ctx.fillStyle = 'rgba(220, 100, 100, 0.4)';
        ctx.textAlign = 'center';
        ctx.font = `normal ${Math.round(canvasWidth * 0.04)}px system-ui`;
        ctx.fillText(weekdays[i], x + cellWidth/2, y + 35);
      }
      
      // 添加阴影效果，让日历更突出
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      
      // 绘制日历 - 使用截取的原始日历
      ctx.drawImage(
        canvas,
        calendarX,
        calendarTop + cellHeight,  // 留出星期标题的空间
        calendarWidth,
        calendarHeight - cellHeight  // 减去星期标题行的高度
      );
      
      // 重置阴影
      ctx.shadowColor = 'transparent';
      
      // 添加底部提示文本 - 参照图片
      ctx.font = `normal ${Math.round(canvasWidth * 0.03)}px system-ui`;
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(
        language === 'zh' ? '带有表情符号的日期表示该日有日记记录，点击可查看详情' : 'Dates with emojis indicate diary entries. Tap to view details.',
        canvasWidth / 2, 
        calendarTop + calendarHeight + 50
      );
      
      // 转换为可分享图片
      const imgData = styledCanvas.toDataURL('image/png');
      
      // 显示分享模态框
      showShareModal(imgData, language, toast);
      
      // 清理临时样式
      document.head.removeChild(tempStyle);
    } catch (htmlCanvasError) {
      console.error("html2canvas error:", htmlCanvasError);
      
      // 清理临时样式
      document.head.removeChild(tempStyle);
      
      // 恢复导航按钮显示状态
      if (typeof window.restoreNavButtons === 'function') {
        window.restoreNavButtons();
        // 清理安全定时器
        if (window.safetyRestoreTimeout) {
          clearTimeout(window.safetyRestoreTimeout);
          window.safetyRestoreTimeout = undefined;
        }
      }
      
      // 备用计划：创建一个简单的分享图片，不依赖于日历元素捕获
      try {
        console.log("使用备用计划创建分享图片");
        createFallbackCalendarImage(currentMonth, language, diaries, getMoodColor, toast, wallpaperImage);
        return; // 成功生成备用图片，结束函数
      } catch (fallbackError) {
        // 如果备用计划也失败，抛出组合错误
        console.error("Fallback plan also failed:", fallbackError);
        throw new Error(`Primary error: ${htmlCanvasError}\nFallback error: ${fallbackError}`);
      }
    }
  } catch (error) {
    console.error("Error generating share image:", error);
    
    // 恢复导航按钮显示状态 - 确保在所有错误处理路径中都能恢复
    if (typeof window.restoreNavButtons === 'function') {
      window.restoreNavButtons();
      // 清理安全定时器
      if (window.safetyRestoreTimeout) {
        clearTimeout(window.safetyRestoreTimeout);
        window.safetyRestoreTimeout = undefined;
      }
    }
    
    toast({
      title: language === 'zh' ? '生成分享图片失败' : 'Failed to generate share image',
      description: String(error),
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  }
};

/**
 * 显示分享模态框
 * @param imgData 图片数据URL
 * @param language 当前语言
 */
const showShareModal = (imgData: string, language: 'zh' | 'en', toast: any) => {
  // 检测是否为移动设备
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // 显示分享模态框
  const shareModalContainer = document.createElement('div');
  shareModalContainer.id = 'share-modal-container';
  shareModalContainer.style.position = 'fixed';
  shareModalContainer.style.top = '0';
  shareModalContainer.style.left = '0';
  shareModalContainer.style.width = '100%';
  shareModalContainer.style.height = '100%';
  shareModalContainer.style.display = 'flex';
  shareModalContainer.style.justifyContent = 'center';
  shareModalContainer.style.alignItems = 'center';
  shareModalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  shareModalContainer.style.zIndex = '9999';
  shareModalContainer.style.backdropFilter = 'blur(10px)';
  
  // 增加移动端特性
  if (isMobile) {
    shareModalContainer.style.overflowY = 'auto';
    (shareModalContainer.style as any).webkitOverflowScrolling = 'touch'; // 增加iOS滚动优化
  }
  
  document.body.appendChild(shareModalContainer);
  
  // 创建模态内容 - 调整尺寸以适应移动端
  const modalContent = document.createElement('div');
  modalContent.style.width = isMobile ? '95%' : '90%';
  modalContent.style.maxWidth = isMobile ? '100%' : '500px';
  modalContent.style.background = 'rgba(255, 255, 255, 0.95)';
  modalContent.style.borderRadius = isMobile ? '20px 20px 0 0' : '15px';
  modalContent.style.overflow = 'hidden';
  modalContent.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
  modalContent.style.color = '#333';
  modalContent.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  modalContent.style.border = '1px solid rgba(233, 175, 163, 0.3)';
  
  // 如果是移动设备，将模态框定位在屏幕底部
  if (isMobile) {
    modalContent.style.position = 'absolute';
    modalContent.style.bottom = '0';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translateX(-50%)';
    modalContent.style.marginBottom = '0';
    // 添加安全区域适配
    modalContent.style.paddingBottom = 'env(safe-area-inset-bottom, 20px)';
  }
  
  shareModalContainer.appendChild(modalContent);
  
  // 创建标题栏
  const header = document.createElement('div');
  header.style.padding = '16px 20px';
  header.style.borderBottom = '1px solid rgba(233, 175, 163, 0.2)';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.background = 'rgba(233, 175, 163, 0.1)';
  modalContent.appendChild(header);
  
  // 标题
  const title = document.createElement('h3');
  title.textContent = language === 'zh' ? '分享到' : 'Share to';
  title.style.margin = '0';
  title.style.fontSize = isMobile ? '18px' : '20px';
  title.style.fontWeight = 'bold';
  title.style.color = '#555';
  header.appendChild(title);
  
  // 关闭按钮
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = '#777';
  closeButton.style.fontSize = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '8px';
  closeButton.style.marginRight = '-8px';
  closeButton.style.height = '44px'; // 增加按钮高度，移动端更易点击
  closeButton.style.width = '44px';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  closeButton.onclick = () => {
    document.body.removeChild(shareModalContainer);
  };
  header.appendChild(closeButton);
  
  // 预览部分
  const previewSection = document.createElement('div');
  previewSection.style.padding = isMobile ? '15px' : '20px';
  previewSection.style.display = 'flex';
  previewSection.style.justifyContent = 'center';
  modalContent.appendChild(previewSection);
  
  // 预览图片 - 调整移动端最大高度
  const previewImg = document.createElement('img');
  previewImg.src = imgData;
  previewImg.style.maxWidth = '100%';
  previewImg.style.height = 'auto';
  previewImg.style.maxHeight = isMobile ? '300px' : '400px';
  previewImg.style.borderRadius = '8px';
  previewImg.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  previewImg.style.border = '1px solid rgba(233, 175, 163, 0.3)';
  
  // 添加图片加载动画
  previewImg.style.opacity = '0';
  previewImg.style.transition = 'opacity 0.3s ease';
  previewImg.onload = () => {
    previewImg.style.opacity = '1';
  };
  
  previewSection.appendChild(previewImg);
  
  // 分享选项
  const shareOptions = document.createElement('div');
  shareOptions.style.padding = isMobile ? '10px 15px 25px' : '10px 20px 20px';
  modalContent.appendChild(shareOptions);
  
  // 帮助函数：创建分享按钮，增强移动端体验
  const createShareButton = (icon: string, text: string, color: string, onClick: () => void) => {
    const button = document.createElement('button');
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.padding = isMobile ? '14px 16px' : '12px 18px';
    button.style.margin = '10px 0';
    button.style.backgroundColor = 'rgba(233, 175, 163, 0.1)';
    button.style.border = 'none';
    button.style.borderRadius = '12px';
    button.style.width = '100%';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s ease';
    button.style.color = '#555';
    button.style.textAlign = 'left';
    button.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    
    // 更大的触摸区域，符合移动端设计规范
    if (isMobile) {
      button.style.minHeight = '54px';
    }
    
    // 悬停效果
    if (!isMobile) {
      // 桌面端才应用悬停效果
      button.onmouseover = () => {
        button.style.backgroundColor = 'rgba(233, 175, 163, 0.2)';
        button.style.transform = 'translateY(-2px)';
      };
      button.onmouseout = () => {
        button.style.backgroundColor = 'rgba(233, 175, 163, 0.1)';
        button.style.transform = 'translateY(0)';
      };
    }
    
    // 添加触摸反馈
    button.ontouchstart = () => {
      button.style.backgroundColor = 'rgba(233, 175, 163, 0.2)';
      button.style.transform = 'scale(0.98)';
    };
    button.ontouchend = () => {
      button.style.backgroundColor = 'rgba(233, 175, 163, 0.1)';
      button.style.transform = 'scale(1)';
    };
    
    // 图标
    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    iconSpan.style.fontSize = isMobile ? '26px' : '24px';
    iconSpan.style.marginRight = '12px';
    iconSpan.style.display = 'inline-block';
    iconSpan.style.width = isMobile ? '30px' : '24px';
    iconSpan.style.textAlign = 'center';
    button.appendChild(iconSpan);
    
    // 文本
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    textSpan.style.fontSize = '16px';
    textSpan.style.fontWeight = '500';
    button.appendChild(textSpan);
    
    // 添加边框
    button.style.borderLeft = `3px solid ${color}`;
    
    button.onclick = onClick;
    
    return button;
  };
  
  // 帮助函数：下载图片
  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = imgData;
    a.download = 'mood-calendar.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: language === 'zh' ? '图片已下载' : 'Image downloaded',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 分享按钮集合
  const shareButtonsConfig = [
    // Instagram 按钮
    {
      icon: '📱',
      text: language === 'zh' ? '分享到 Instagram 故事' : 'Share to Instagram Story',
      color: '#E1306C',
      action: () => {
        // 在移动设备上，Instagram 分享最好使用下载图片
        if (isMobile) {
          toast({
            title: language === 'zh' ? '请保存图片后在 Instagram 中上传' : 'Save the image and upload in Instagram',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
          downloadImage();
        } else {
          toast({
            title: language === 'zh' ? '请在移动设备上使用该功能' : 'This works best on mobile devices',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          downloadImage();
        }
        
        // 关闭模态框
        document.body.removeChild(shareModalContainer);
      }
    },
    
    // 微信按钮
    {
      icon: '💬',
      text: language === 'zh' ? '分享到微信' : 'Share to WeChat',
      color: '#07C160',
      action: () => {
        // 微信需要先下载图片
        downloadImage();
        toast({
          title: language === 'zh' ? '图片已保存，请打开微信分享' : 'Image saved. Open WeChat to share',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // 关闭模态框
        document.body.removeChild(shareModalContainer);
      }
    },
    
    // 复制到剪贴板按钮
    {
      icon: '📋',
      text: language === 'zh' ? '复制到剪贴板' : 'Copy to Clipboard',
      color: '#FF9500',
      action: async () => {
        try {
          const blob = await (await fetch(imgData)).blob();
          
          // 检查是否支持ClipboardItem API
          if (typeof ClipboardItem !== 'undefined' && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob
              })
            ]);
            
            toast({
              title: language === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          } else {
            // 回退到下载选项
            console.log('当前浏览器不支持ClipboardItem API，使用下载功能代替');
            toast({
              title: language === 'zh' ? '当前浏览器不支持复制图片，已下载图片' : 'This browser does not support copying images, downloading instead',
              status: 'info',
              duration: 3000,
              isClosable: true,
            });
            downloadImage();
          }
        } catch (err) {
          console.error("Could not copy image: ", err);
          downloadImage();
        }
        
        // 关闭模态框
        document.body.removeChild(shareModalContainer);
      }
    },
    
    // 直接下载按钮 - 更明显的选项给用户
    {
      icon: '💾',
      text: language === 'zh' ? '保存到相册' : 'Save to Photos',
      color: '#007AFF',
      action: () => {
        downloadImage();
        // 关闭模态框
        document.body.removeChild(shareModalContainer);
      }
    }
  ];
  
  // 为移动端添加原生分享API支持
  if (isMobile && navigator.share) {
    shareButtonsConfig.unshift({
      icon: '🔗',
      text: language === 'zh' ? '使用系统分享' : 'Share via...',
      color: '#5E5CE6',
      action: async () => {
        try {
          // 尝试使用Web Share API
          const blob = await (await fetch(imgData)).blob();
          const file = new File([blob], 'mood-calendar.png', { type: 'image/png' });
          
          await navigator.share({
            title: language === 'zh' ? '我的心情日记' : 'My Mood Diary',
            text: language === 'zh' ? '查看我的月度心情记录' : 'Check out my monthly mood diary',
            files: [file]
          });
          
          toast({
            title: language === 'zh' ? '分享成功' : 'Shared successfully',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } catch (error: any) {
          console.error('Error sharing:', error);
          if (error.name !== 'AbortError') {
            // 如果不是用户取消，回退到下载
            downloadImage();
          }
        }
        
        // 关闭模态框
        document.body.removeChild(shareModalContainer);
      }
    });
  }
  
  // 添加所有按钮
  shareButtonsConfig.forEach(config => {
    shareOptions.appendChild(
      createShareButton(config.icon, config.text, config.color, config.action)
    );
  });
  
  // 为移动端添加底部安全距离
  if (isMobile) {
    const safeAreaSpacer = document.createElement('div');
    safeAreaSpacer.style.height = 'env(safe-area-inset-bottom, 10px)';
    modalContent.appendChild(safeAreaSpacer);
  }
};

// 添加辅助函数 - 简化DOM结构用于调试输出
function simplifyDOM(element: Element, depth = 0, maxDepth = 3): any {
  if (depth > maxDepth) return '...';
  
  const children = Array.from(element.children).map(child => 
    simplifyDOM(child, depth + 1, maxDepth)
  );
  
  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || undefined,
    class: element.className || undefined,
    children: children.length ? children : undefined
  };
}

// 新增：完全独立的备用图片生成函数 - 修改以接受壁纸参数
function createFallbackCalendarImage(
  currentMonth: Date,
  language: 'zh' | 'en',
  diaries: Array<{id: string, date: string, mood: string}>,
  _getMoodColor: (mood: string, opacity?: number) => string,
  toast: any,
  wallpaperImage: HTMLImageElement | null = null
) {
  console.log("ShareCalendar: 创建备用日历图片");
  
  // 创建一个更适合移动端的长方形画布 (16:9比例，与屏幕截图更接近)
  const fallbackCanvas = document.createElement('canvas');
  const fallbackWidth = 1080;
  const fallbackHeight = 1920;
  fallbackCanvas.width = fallbackWidth;
  fallbackCanvas.height = fallbackHeight;
  const fallbackCtx = fallbackCanvas.getContext('2d', { alpha: true });
  
  if (!fallbackCtx) {
    throw new Error('无法获取画布上下文');
  }
  
  // 启用图像平滑以获得更好的渲染质量
  fallbackCtx.imageSmoothingEnabled = true;
  fallbackCtx.imageSmoothingQuality = 'high';
  
  // 如果有壁纸，使用壁纸作为背景（保持使用unsplash图片）
  if (wallpaperImage) {
    // 填充整个画布，确保壁纸覆盖整个区域
    const aspectRatio = wallpaperImage.width / wallpaperImage.height;
    let drawWidth, drawHeight, drawX, drawY;
    
    if (aspectRatio > fallbackWidth/fallbackHeight) { // 壁纸较宽
      drawHeight = fallbackHeight;
      drawWidth = fallbackHeight * aspectRatio;
      drawX = (fallbackWidth - drawWidth) / 2;
      drawY = 0;
    } else { // 壁纸较窄
      drawWidth = fallbackWidth;
      drawHeight = fallbackWidth / aspectRatio;
      drawX = 0;
      drawY = (fallbackHeight - drawHeight) / 2;
    }
    
    // 添加模糊效果，让日历内容更加突出
    fallbackCtx.filter = 'blur(8px)';
    fallbackCtx.drawImage(wallpaperImage, drawX, drawY, drawWidth, drawHeight);
    fallbackCtx.filter = 'none';
    
    // 添加半透明覆盖层，提高内容可读性 - 参照图片使用浅色背景
    fallbackCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    fallbackCtx.fillRect(0, 0, fallbackWidth, fallbackHeight);
  } else {
    // 如果没有壁纸，使用浅色背景 - 参照图片
    fallbackCtx.fillStyle = '#f5f5f5';
    fallbackCtx.fillRect(0, 0, fallbackWidth, fallbackHeight);
  }
  
  // 添加应用标题 - 参照图片中的"心情日历"标题
  fallbackCtx.font = `bold ${Math.round(fallbackWidth * 0.06)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  fallbackCtx.fillStyle = '#333';
  fallbackCtx.textAlign = 'left';
  fallbackCtx.fillText(language === 'zh' ? '心情日历' : 'Mood Calendar', 120, 100);
  
  // 添加分享按钮 - 模拟图片右上角的分享按钮
  fallbackCtx.fillStyle = 'rgba(255, 200, 200, 0.2)';
  roundedRect(fallbackCtx, fallbackWidth - 180, 65, 120, 50, 25);
  fallbackCtx.fill();
  
  fallbackCtx.font = `normal ${Math.round(fallbackWidth * 0.035)}px system-ui`;
  fallbackCtx.fillStyle = '#e07979';
  fallbackCtx.textAlign = 'center';
  fallbackCtx.fillText(language === 'zh' ? '分享' : 'Share', fallbackWidth - 120, 97);
  
  // 添加月份标题 - 参照图片中的"2025年03月"
  const monthYear = format(currentMonth, language === 'zh' ? 'yyyy年MM月' : 'MMMM yyyy');
  fallbackCtx.font = `bold ${Math.round(fallbackWidth * 0.055)}px system-ui`;
  fallbackCtx.fillStyle = 'rgba(220, 100, 100, 0.7)';
  fallbackCtx.textAlign = 'center';
  fallbackCtx.fillText(monthYear, fallbackWidth / 2, 240);
  
  // 计算日历区域的位置和尺寸
  const calendarTop = 300; // 调整位置，原来是 buttonY + buttonHeight + 30
  const calendarWidth = fallbackWidth - 240;  // 左右各留出120的边距
  const calendarLeft = 120;
  
  // 计算当月第一天是星期几和当月天数
  const firstDayOfMonth = startOfMonth(currentMonth);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0-6, 0 = 星期日
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // 计算需要显示的行数（包括上个月和下个月的日期）
  const weeksInMonth = Math.ceil((daysInMonth + firstDayWeekday) / 7);
  
  // 绘制星期标题 - 参照图片中的日、一、二、三...
  const weekdays = language === 'zh' 
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // 计算单元格尺寸 - 参照图片设置合适的大小
  const cellWidth = calendarWidth / 7;
  const cellHeight = cellWidth;  // 保持正方形单元格
  const calendarHeight = cellHeight * (weeksInMonth + 1); // +1是为了星期标题行
  
  // 绘制星期标题栏
  for (let i = 0; i < 7; i++) {
    const x = calendarLeft + i * cellWidth;
    const y = calendarTop;
    
    fallbackCtx.fillStyle = 'rgba(220, 100, 100, 0.4)';
    fallbackCtx.textAlign = 'center';
    fallbackCtx.font = `normal ${Math.round(fallbackWidth * 0.04)}px system-ui`;
    fallbackCtx.fillText(weekdays[i], x + cellWidth/2, y + 35);
  }
  
  // 获取当月所有日期的心情数据
  const monthMoods: Record<number, string> = {};
  diaries.forEach(diary => {
    const diaryDate = parseISO(diary.date);
    if (diaryDate.getMonth() === currentMonth.getMonth() && 
        diaryDate.getFullYear() === currentMonth.getFullYear()) {
      monthMoods[diaryDate.getDate()] = diary.mood;
    }
  });
  
  // 获取上个月和下个月的部分日期 - 日历显示时需要
  const prevMonth = new Date(currentMonth);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const daysInPrevMonth = endOfMonth(prevMonth).getDate();
  
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  // 绘制日期网格 - 精确模仿图片中的布局
  let nextMonthDay = 1;
  
  for (let row = 0; row < weeksInMonth; row++) {
    for (let col = 0; col < 7; col++) {
      const dayIndex = row * 7 + col;
      const dayFromMonthStart = dayIndex - firstDayWeekday;
      
      const x = calendarLeft + col * cellWidth;
      const y = calendarTop + (row + 1) * cellHeight;
      
      // 计算日期和是否属于当前月
      let displayDay;
      let isCurrentMonth = true;
      
      if (dayFromMonthStart < 0) {
        // 上个月的日期
        displayDay = daysInPrevMonth + dayFromMonthStart + 1;
        isCurrentMonth = false;
      } else if (dayFromMonthStart >= daysInMonth) {
        // 下个月的日期
        displayDay = nextMonthDay++;
        isCurrentMonth = false;
      } else {
        // 当月的日期
        displayDay = dayFromMonthStart + 1;
      }
      
      // 绘制日期单元格 - 参照图片样式
      if (isCurrentMonth) {
        // 当月日期的单元格 - 有心情记录的使用浅色背景
        if (monthMoods[displayDay]) {
          fallbackCtx.fillStyle = 'rgba(255, 230, 230, 0.5)';
          roundedRect(fallbackCtx, x + 5, y + 5, cellWidth - 10, cellHeight - 10, 10);
          fallbackCtx.fill();
          
          // 绘制表情 - 居中显示
          fallbackCtx.font = `${Math.round(cellWidth * 0.5)}px "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`;
          fallbackCtx.textAlign = 'center';
          fallbackCtx.textBaseline = 'middle';
          fallbackCtx.fillText(monthMoods[displayDay], x + cellWidth/2, y + cellHeight/2 + 5);
        } else {
          // 无心情记录的日期 - 使用白色背景
          fallbackCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          roundedRect(fallbackCtx, x + 5, y + 5, cellWidth - 10, cellHeight - 10, 10);
          fallbackCtx.fill();
        }
        
        // 绘制日期数字 - 左上角显示
        fallbackCtx.textBaseline = 'top';
        fallbackCtx.font = `bold ${Math.round(cellWidth * 0.25)}px system-ui`;
        fallbackCtx.fillStyle = '#333';
        fallbackCtx.textAlign = 'left';
        fallbackCtx.fillText(displayDay.toString(), x + 15, y + 12);
      } else {
        // 非当月日期 - 使用淡灰色背景
        fallbackCtx.fillStyle = 'rgba(240, 240, 240, 0.5)';
        roundedRect(fallbackCtx, x + 5, y + 5, cellWidth - 10, cellHeight - 10, 10);
        fallbackCtx.fill();
        
        // 绘制日期数字 - 浅灰色
        fallbackCtx.textBaseline = 'top';
        fallbackCtx.font = `bold ${Math.round(cellWidth * 0.25)}px system-ui`;
        fallbackCtx.fillStyle = '#aaa';
        fallbackCtx.textAlign = 'left';
        fallbackCtx.fillText(displayDay.toString(), x + 15, y + 12);
      }
    }
  }
  
  // 添加底部提示文本 - 参照图片
  fallbackCtx.font = `normal ${Math.round(fallbackWidth * 0.03)}px system-ui`;
  fallbackCtx.fillStyle = '#999';
  fallbackCtx.textAlign = 'center';
  fallbackCtx.textBaseline = 'alphabetic';
  fallbackCtx.fillText(
    language === 'zh' ? '带有表情符号的日期表示该日有日记记录，点击可查看详情' : 'Dates with emojis indicate diary entries. Tap to view details.',
    fallbackWidth / 2, 
    calendarTop + calendarHeight + 50
  );
  
  // 使用备用画布生成分享图片
  const imgData = fallbackCanvas.toDataURL('image/png');
  showShareModal(imgData, language, toast);
}

// 声明全局变量类型
declare global {
  interface Window {
    restoreNavButtons?: () => void;
    safetyRestoreTimeout?: NodeJS.Timeout;
  }
} 