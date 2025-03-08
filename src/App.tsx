import React, { useState, useEffect } from 'react';
import { 
  Box, ChakraProvider, Container, VStack, Heading, 
  Input, Textarea, Button, HStack, Image, 
  useToast, FormControl, FormLabel, Flex,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Text, Divider, Card, CardBody, CardHeader,
  SimpleGrid, Badge, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, useDisclosure,
  Menu, MenuButton, MenuList, MenuItem,
  Tag, TagLabel, TagCloseButton, Wrap, WrapItem,
  extendTheme, Center
} from '@chakra-ui/react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ChevronDownIcon, CalendarIcon, SettingsIcon, StarIcon, AddIcon, EditIcon } from '@chakra-ui/icons';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
//import { initializeApp } from "firebase/app";
//import { getFirestore } from "firebase/firestore";
//import { getAnalytics } from "firebase/analytics";
//import { getAuth } from "firebase/auth";

// 在import下方添加Firebase配置
// eslint-disable-next-line @typescript-eslint/no-unused-vars

// 定义主题
const theme = extendTheme({
  colors: {
    brand: {
      50: "#FEF5E7",
      100: "#FDE8C4",
      200: "#FBDBA1",
      300: "#F9CD7E",
      400: "#F7C05B",
      500: "#EA6C3C", // 主要橙红色
      600: "#D9603B",
      700: "#C7543A",
      800: "#B64939",
      900: "#A43D38",
    },
  },
  styles: {
    global: {
      body: {
        bg: '#F9F2E8', // 米色背景
        color: '#4A321F', // 深褐色文字
      },
    },
  },
  components: {
    Button: {
      baseStyle: {},
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === "teal" ? "brand.500" : undefined,
          color: props.colorScheme === "teal" ? "white" : undefined,
          _hover: {
            bg: props.colorScheme === "teal" ? "brand.600" : undefined,
          },
        }),
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          boxShadow: 'sm',
        },
      },
    },
  },
  fonts: {
    heading: `'Ma Shan Zheng', '尔雅趣宋体', cursive`,
  },
});

// 模拟用户认证状态
interface User {
  id: string;
  name: string;
  email?: string;
  preferences?: {
    reminderTime?: string;
    reminderEnabled?: boolean;
  }
}

// 日记条目接口
interface DiaryEntry {
  id: string;
  date: string;
  mood: string;
  content: string;
  imageUrl?: string;
  userId: string;
  tags: string[];
  createdAt: string;
}

// 心情表情数组
const moodEmojis = ['😊', '😍', '🥳', '😌', '🤔', '😢', '😡', '😴', '🤒', '🥺'];

// 从localStorage加载数据
const loadDiariesFromStorage = (userId: string): DiaryEntry[] => {
  const stored = localStorage.getItem(`diaries_${userId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored diaries", e);
    }
  }
  return [];
};

// 保存数据到localStorage
const saveDiariesToStorage = (userId: string, diaries: DiaryEntry[]) => {
  localStorage.setItem(`diaries_${userId}`, JSON.stringify(diaries));
};

function App() {
  // 状态管理
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMood, setSelectedMood] = useState<string>('😊');
  const [content, setContent] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // 标签相关状态
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  
  // 查看日记详情的模态框
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  
  // 设置模态框
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

  const toast = useToast();

  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);

  // 从localStorage加载用户数据
  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsLoggedIn(true);
        
        // 加载设置
        if (userData.preferences) {
          setReminderTime(userData.preferences.reminderTime || '20:00');
          setReminderEnabled(userData.preferences.reminderEnabled || false);
        }
        
        // 加载日记
        const storedDiaries = loadDiariesFromStorage(userData.id);
        setDiaries(storedDiaries);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  // 检查提醒
  useEffect(() => {
    if (isLoggedIn && reminderEnabled) {
      const checkTime = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime === reminderTime) {
          toast({
            title: '日记提醒',
            description: '别忘了今天记录你的一天！',
            status: 'info',
            duration: 9000,
            isClosable: true,
          });
        }
      };
      
      const interval = setInterval(checkTime, 60000); // 每分钟检查一次
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, reminderEnabled, reminderTime, toast]);

  // 当content变化时，提取已有标签
  useEffect(() => {
    const tagRegex = /#(\w+)/g;
    const extractedTags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      if (!tags.includes(match[1])) {
        extractedTags.push(match[1]);
      }
    }
    
    if (extractedTags.length > 0) {
      setTags(prevTags => [...new Set([...prevTags, ...extractedTags])]);
    }
  }, [content]);

  // 使用useEffect计算连续记录天数
  useEffect(() => {
    if (user && diaries.length > 0) {
      const today = new Date();
      const sortedDiaries = [...diaries].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      let days = 1;
      let lastDate = new Date(sortedDiaries[0].date);
      
      // 检查最近的日记是否是今天的
      const isToday = format(lastDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      
      if (!isToday) {
        days = 0;
      }
      
      // 计算连续天数
      for (let i = 1; i < sortedDiaries.length; i++) {
        const currentDate = new Date(sortedDiaries[i].date);
        const diffDays = differenceInDays(lastDate, currentDate);
        
        if (diffDays === 1) {
          days++;
          lastDate = currentDate;
        } else {
          break;
        }
      }
      
      setConsecutiveDays(days);
    }
  }, [diaries, user]);

  // 模拟登录功能
  const handleLogin = () => {
    if (loginForm.username && loginForm.password) {
      const newUser = {
        id: '1', // 在实际应用中应该是动态生成的
        name: loginForm.username,
        preferences: {
          reminderTime: '20:00',
          reminderEnabled: true
        }
      };
      
      setIsLoggedIn(true);
      setUser(newUser);
      
      // 保存用户信息到localStorage
      localStorage.setItem('current_user', JSON.stringify(newUser));
      
      // 加载用户偏好设置
      setReminderTime('20:00');
      setReminderEnabled(true);
      
      // 加载日记
      const storedDiaries = loadDiariesFromStorage(newUser.id);
      setDiaries(storedDiaries);
      
      toast({
        title: '登录成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: '登录失败',
        description: '请输入用户名和密码',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 处理注册功能
  const handleRegister = () => {
    if (!registerForm.username || !registerForm.email || !registerForm.password) {
      toast({
        title: '注册失败',
        description: '请填写所有必填字段',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: '密码不匹配',
        description: '两次输入的密码不一致',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // 在实际应用中，这里会向API发送注册请求
    toast({
      title: '注册成功',
      description: '请使用新账号登录',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    setIsRegistering(false);
    setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
  };

  // 处理登出功能
  const handleLogout = () => {
    localStorage.removeItem('current_user');
    
    setIsLoggedIn(false);
    setUser(null);
    setDiaries([]);
    // 重置表单
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedMood('😊');
    setContent('');
    setImage(null);
    setImagePreview(null);
    setActiveTab(0);
    setTags([]);
  };

  // 处理图片上传
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      
      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  // 添加标签
  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      // 在内容中添加标签
      setContent(prev => `${prev} #${tagInput} `);
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    // 从内容中删除标签
    setContent(prev => prev.replace(new RegExp(`#${tag}\\s*`, 'g'), ''));
  };

  // 编辑日记的函数
  const editDiary = (diary: DiaryEntry) => {
    setEditingDiary(diary);
    setSelectedDate(diary.date);
    setSelectedMood(diary.mood);
    setContent(diary.content);
    setTags(diary.tags || []);
    setImagePreview(diary.imageUrl || null);
    setIsEditing(true);
    setActiveTab(0); // 切换到写日记标签页
    onDetailClose(); // 关闭详情模态框
    
    toast({
      title: "正在编辑日记",
      description: `您正在编辑 ${format(parseISO(diary.date), 'yyyy年MM月dd日')} 的日记`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 取消编辑
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingDiary(null);
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedMood('😊');
    setContent('');
    setTags([]);
    setImage(null);
    setImagePreview(null);
  };
  
  // 更新handleSubmit函数以处理编辑模式
  const handleSubmit = () => {
    if (!user) return;
    
    if (!content.trim()) {
      toast({
        title: '内容不能为空',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const now = new Date();
    let updatedDiaries = [...diaries];
    
    if (isEditing && editingDiary) {
      // 编辑现有日记
      const index = updatedDiaries.findIndex(d => d.id === editingDiary.id);
      
      if (index !== -1) {
        updatedDiaries[index] = {
          ...editingDiary,
          date: selectedDate,
          mood: selectedMood,
          content: content,
          imageUrl: imagePreview || undefined,
          tags: tags
        };
        
        toast({
          title: '日记已更新',
          description: '您的日记已成功更新',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // 退出编辑模式
      setIsEditing(false);
      setEditingDiary(null);
    } else {
      // 创建新日记
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: selectedDate,
        mood: selectedMood,
        content: content,
        imageUrl: imagePreview || undefined,
        userId: user.id,
        tags: tags,
        createdAt: now.toISOString()
      };
      
      updatedDiaries = [newEntry, ...updatedDiaries];
      
      toast({
        title: '日记已保存',
        description: '您的日记已成功保存',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 重置表单
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setSelectedMood('😊');
      setContent('');
      setTags([]);
      setImage(null);
      setImagePreview(null);
    }
    
    // 更新状态并保存到localStorage
    setDiaries(updatedDiaries);
    saveDiariesToStorage(user.id, updatedDiaries);
  };

  // 打开日记详情
  const openDiaryDetail = (diary: DiaryEntry) => {
    setSelectedDiary(diary);
    onDetailOpen();
  };

  // 生成AI分析
  const generateAiAnalysis = () => {
    if (!selectedDiary) return;
    
    setIsAnalyzing(true);
    
    // 模拟AI分析 - 在实际应用中这里会调用API
    setTimeout(() => {
      const mood = selectedDiary.mood;
      let analysis = '';
      
      // 根据心情表情生成不同的分析
      if (['😊', '😍', '🥳', '😌'].includes(mood)) {
        analysis = `您的日记流露出积极的情绪。您似乎度过了愉快的一天！\n\n观察：您的写作风格显示出乐观态度，用词积极向上。\n\n建议：继续保持这种积极心态，也许可以思考是什么让您如此开心，以便在未来重现这些积极体验。`;
      } else if (['🤔'].includes(mood)) {
        analysis = `您的日记反映出一种思考的状态。似乎有些事情正在您的脑海中盘旋。\n\n观察：您的写作表明您正在分析或评估某个情况。\n\n建议：尝试列出您正在考虑的问题的利弊，有时候写下来能帮助理清思路。`;
      } else if (['😢', '😡', '🤒', '🥺'].includes(mood)) {
        analysis = `您的日记透露出一些消极或压力的情绪。\n\n观察：从您的描述中，我们能感受到您正在经历挑战或困难。\n\n建议：请记住这些感受是暂时的，尝试一些轻松的活动或与朋友交流可能会帮助您缓解压力。自我关爱对您现在特别重要。`;
      } else {
        analysis = `感谢您记录今天的心情和经历！\n\n观察：您的日记帮助您追踪生活中的重要时刻。\n\n建议：定期记录可以帮助您更好地了解自己的情绪模式和生活变化。继续保持这个好习惯！`;
      }
      
      // 分析标签
      if (selectedDiary.tags && selectedDiary.tags.length > 0) {
        analysis += `\n\n标签分析：您经常使用 ${selectedDiary.tags.map(t => `#${t}`).join(', ')} 等标签。这表明这些领域在您的生活中占有重要位置。`;
      }
      
      setAiAnalysis(analysis);
      setIsAnalyzing(false);
    }, 1500);
  };

  // 保存用户设置
  const saveSettings = () => {
    if (user) {
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          reminderTime,
          reminderEnabled
        }
      };
      
      // 更新状态
      setUser(updatedUser);
      
      // 保存到localStorage
      localStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      toast({
        title: '设置已保存',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onSettingsClose();
    }
  };

  // 筛选日记
  const filteredDiaries = selectedTag 
    ? diaries.filter(diary => diary.tags?.includes(selectedTag))
    : diaries;

  // 获取所有标签
  const allTags = Array.from(new Set(diaries.flatMap(diary => diary.tags || [])));

  // 渲染认证表单
  const renderAuthForm = () => (
    <VStack spacing={6} align="stretch" boxShadow="md" p={6} borderRadius="md" bg="white">
      <Center>
        <Heading 
          as="h1" 
          size="xl" 
          textAlign="center" 
          fontFamily="'Comic Sans MS', cursive" 
          color="brand.500"
        >
          我的日记
        </Heading>
      </Center>
      <Text textAlign="center" color="gray.600">记录生活点滴</Text>
      
      <Tabs variant="soft-rounded" colorScheme="brand" index={isRegistering ? 1 : 0}>
        <TabList mb="1em">
          <Tab width="50%" onClick={() => setIsRegistering(false)}>登录</Tab>
          <Tab width="50%" onClick={() => setIsRegistering(true)}>注册</Tab>
        </TabList>
        <TabPanels>
          {/* 登录表单 */}
          <TabPanel>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>用户名</FormLabel>
                <Input 
                  placeholder="请输入用户名" 
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>密码</FormLabel>
                <Input 
                  type="password" 
                  placeholder="请输入密码" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </FormControl>
              
              <Button colorScheme="teal" width="100%" onClick={handleLogin} mt={2}>
                登录
              </Button>
            </VStack>
          </TabPanel>
          
          {/* 注册表单 */}
          <TabPanel>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>用户名</FormLabel>
                <Input 
                  placeholder="请创建用户名" 
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>电子邮箱</FormLabel>
                <Input 
                  type="email" 
                  placeholder="请输入邮箱" 
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>密码</FormLabel>
                <Input 
                  type="password" 
                  placeholder="请创建密码" 
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>确认密码</FormLabel>
                <Input 
                  type="password" 
                  placeholder="请再次输入密码" 
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                />
              </FormControl>
              
              <Button colorScheme="teal" width="100%" onClick={handleRegister} mt={2}>
                注册
              </Button>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );

  // 渲染主应用
  const renderMainApp = () => (
    <VStack spacing={6} align="stretch">
      {/* 新导航栏布局 */}
      <Box as="nav" bg="white" py={3} px={5} borderBottom="1px solid" borderColor="gray.200">
        <Flex align="center" justify="space-between">
          {/* 左侧链接和标题 */}
          <HStack spacing={8}>
            <Button 
              variant="ghost" 
              leftIcon={<CalendarIcon />} 
              onClick={() => setActiveTab(0)}
              color={activeTab === 0 ? "brand.500" : "gray.600"}
              _hover={{ color: "brand.500" }}
            >
              写日记
            </Button>
            
            {/* 向左移动的标题 */}
            <Heading 
              as="h1" 
              size="lg" 
              fontFamily="'Ma Shan Zheng', '尔雅趣宋体', cursive" 
              color="brand.500"
              ml={4}
            >
              我的日记
            </Heading>
          </HStack>
          
          {/* 右侧设置按钮和退出按钮 */}
          <HStack spacing={4}>
            <Button 
              variant="ghost" 
              leftIcon={<SettingsIcon />} 
              onClick={onSettingsOpen}
              color="gray.600"
              _hover={{ color: "brand.500" }}
            >
              设置
            </Button>
            
            <Button 
              size="sm" 
              onClick={handleLogout} 
              colorScheme="brand"
            >
              退出
            </Button>
          </HStack>
        </Flex>
      </Box>
      
      {/* 欢迎信息和连续记录天数 */}
      <Box bg="brand.50" p={4} borderRadius="md" boxShadow="sm">
        <Flex justify="space-between" align="center">
          <Text fontWeight="medium">欢迎回来, {user?.name}！</Text>
          <HStack>
            <Text>连续记录: </Text>
            <Badge colorScheme="brand" fontSize="md" borderRadius="full" px={3}>
              {consecutiveDays} 天
            </Badge>
          </HStack>
        </Flex>
      </Box>

      <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="brand">
        <TabList>
          <Tab _selected={{ color: 'brand.700', borderColor: 'brand.500', borderBottomColor: 'white' }}>写日记</Tab>
          <Tab _selected={{ color: 'brand.700', borderColor: 'brand.500', borderBottomColor: 'white' }}>查看日记</Tab>
        </TabList>
        
        <TabPanels>
          {/* 写日记面板 */}
          <TabPanel>
            <VStack spacing={4} align="stretch" boxShadow="md" p={6} borderRadius="md" bg="white">
              {isEditing && (
                <Box bg="yellow.100" p={3} borderRadius="md">
                  <Text>您正在编辑 {format(parseISO(editingDiary!.date), 'yyyy年MM月dd日')} 的日记</Text>
                  <Button size="sm" mt={2} onClick={cancelEditing}>取消编辑</Button>
                </Box>
              )}
              
              <FormControl>
                <FormLabel>日期</FormLabel>
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>今日心情</FormLabel>
                <HStack spacing={2} wrap="wrap">
                  {moodEmojis.map((emoji) => (
                    <Button 
                      key={emoji}
                      onClick={() => setSelectedMood(emoji)}
                      variant={selectedMood === emoji ? "solid" : "outline"}
                      colorScheme={selectedMood === emoji ? "teal" : "gray"}
                      fontSize="20px"
                    >
                      {emoji}
                    </Button>
                  ))}
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>今日记录 (可使用 #标签 添加标签)</FormLabel>
                <Textarea 
                  placeholder="写下今天的心情和故事... 可以使用 #工作 #生活 等标签" 
                  size="lg" 
                  minH="200px"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </FormControl>

              {/* 标签输入部分 */}
              <FormControl>
                <FormLabel>添加标签</FormLabel>
                <Flex>
                  <Input 
                    placeholder="输入标签..." 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    mr={2}
                  />
                  <Button 
                    onClick={addTag} 
                    leftIcon={<AddIcon />}
                    colorScheme="teal"
                    isDisabled={!tagInput || tags.includes(tagInput)}
                  >
                    添加
                  </Button>
                </Flex>
                
                {tags.length > 0 && (
                  <Wrap mt={2} spacing={2}>
                    {tags.map(tag => (
                      <WrapItem key={tag}>
                        <Tag 
                          size="md" 
                          borderRadius="full" 
                          variant="solid" 
                          colorScheme="brand"
                        >
                          <TagLabel>#{tag}</TagLabel>
                          <TagCloseButton onClick={() => removeTag(tag)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>添加图片</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  p={1}
                />
                {imagePreview && (
                  <Box mt={2}>
                    <Image 
                      src={imagePreview} 
                      alt="日记图片预览" 
                      maxH="200px" 
                      borderRadius="md"
                    />
                  </Box>
                )}
              </FormControl>

              <Button 
                colorScheme="teal" 
                size="lg" 
                onClick={handleSubmit}
                mt={4}
              >
                保存日记
              </Button>
            </VStack>
          </TabPanel>
          
          {/* 历史记录面板 */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading as="h2" size="md">我的日记</Heading>
                <HStack spacing={2}>
                  <Menu>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm">
                      {selectedTag ? `标签: #${selectedTag}` : '全部日记'}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => setSelectedTag(null)}>全部日记</MenuItem>
                      <Divider />
                      {allTags.map(tag => (
                        <MenuItem key={tag} onClick={() => setSelectedTag(tag)}>
                          #{tag}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Menu>
                </HStack>
              </Flex>
              
              {filteredDiaries.length === 0 ? (
                <Text textAlign="center" py={10} color="gray.500">
                  暂无日记记录
                </Text>
              ) : (
                <SimpleGrid columns={[1, null, 2]} spacing={4}>
                  {filteredDiaries.map(diary => (
                    <Card key={diary.id} variant="outline" cursor="pointer" 
                          onClick={() => openDiaryDetail(diary)}
                          _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                          transition="all 0.2s">
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <Text fontSize="2xl">{diary.mood}</Text>
                            <Text fontWeight="bold">{format(parseISO(diary.date), 'yyyy年MM月dd日')}</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.500">
                            {format(parseISO(diary.createdAt), 'HH:mm')}
                          </Text>
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text noOfLines={3}>{diary.content}</Text>
                        {diary.tags && diary.tags.length > 0 && (
                          <HStack mt={2} spacing={2} wrap="wrap">
                            {diary.tags.map(tag => (
                              <Badge key={tag} colorScheme="brand">#{tag}</Badge>
                            ))}
                          </HStack>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* 日记详情模态框 */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          {selectedDiary && (
            <>
              <ModalHeader>
                <HStack>
                  <Text fontSize="2xl">{selectedDiary.mood}</Text>
                  <Text>{format(parseISO(selectedDiary.date), 'yyyy年MM月dd日')}</Text>
                </HStack>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={4}>
                  <Text whiteSpace="pre-wrap">{selectedDiary.content}</Text>
                  
                  {selectedDiary.imageUrl && (
                    <Image 
                      src={selectedDiary.imageUrl} 
                      alt="日记图片" 
                      borderRadius="md"
                    />
                  )}
                  
                  {selectedDiary.tags && selectedDiary.tags.length > 0 && (
                    <HStack mt={2} spacing={2} wrap="wrap">
                      {selectedDiary.tags.map(tag => (
                        <Badge key={tag} colorScheme="brand">#{tag}</Badge>
                      ))}
                    </HStack>
                  )}
                  
                  <Divider my={2} />
                  
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm">AI分析与建议</Heading>
                      <Button 
                        size="sm" 
                        leftIcon={<StarIcon />} 
                        colorScheme="purple"
                        onClick={generateAiAnalysis}
                        isLoading={isAnalyzing}
                      >
                        生成分析
                      </Button>
                    </Flex>
                    
                    {aiAnalysis ? (
                      <Box p={3} bg="gray.50" borderRadius="md">
                        <Text whiteSpace="pre-wrap">{aiAnalysis}</Text>
                      </Box>
                    ) : (
                      <Text color="gray.500" fontSize="sm">
                        点击"生成分析"按钮，让AI帮你分析这篇日记的情感和内容。
                      </Text>
                    )}
                  </Box>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button 
                  colorScheme="brand" 
                  mr={3} 
                  leftIcon={<EditIcon />}
                  onClick={() => editDiary(selectedDiary)}
                >
                  编辑
                </Button>
                <Button variant="ghost" onClick={onDetailClose}>
                  关闭
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* 设置模态框 */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>设置</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Heading size="sm">提醒设置</Heading>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="reminder-toggle" mb="0">
                  启用每日提醒
                </FormLabel>
                <Input 
                  type="checkbox" 
                  id="reminder-toggle"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>提醒时间</FormLabel>
                <Input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  disabled={!reminderEnabled}
                />
              </FormControl>
              
              <Divider />
              
              <Heading size="sm">账号信息</Heading>
              
              <FormControl>
                <FormLabel>用户名</FormLabel>
                <Input value={user?.name || ''} isReadOnly />
              </FormControl>
              
              <FormControl>
                <FormLabel>用户ID</FormLabel>
                <Input value={user?.id || ''} isReadOnly />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSettingsClose}>
              取消
            </Button>
            <Button colorScheme="teal" onClick={saveSettings}>
              保存设置
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );

  return (
    <ChakraProvider theme={theme}>
      <Container maxW="container.md" py={8}>
        {!isLoggedIn ? renderAuthForm() : renderMainApp()}
      </Container>
    </ChakraProvider>
  );
}

export default App;
