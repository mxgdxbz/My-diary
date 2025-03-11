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
  extendTheme, Center, Switch, Grid, GridItem
} from '@chakra-ui/react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, addDays, isSameDay, isSameMonth } from 'date-fns';
import { ChevronDownIcon, CalendarIcon, SettingsIcon, StarIcon, AddIcon, EditIcon } from '@chakra-ui/icons';
import { db, auth } from './FirebaseConfig';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';


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

// 改进日记加载函数
const loadDiariesFromFirestore = async (userId: string): Promise<DiaryEntry[]> => {
  try {
    console.log("加载用户日记, 用户ID:", userId); // 调试日志
    
    const diariesRef = collection(db, 'diaries');
    const q = query(diariesRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const diaries: DiaryEntry[] = [];
    querySnapshot.forEach((doc) => {
      diaries.push({ id: doc.id, ...doc.data() } as DiaryEntry);
    });
    
    console.log(`找到 ${diaries.length} 条日记`); // 调试日志
    return diaries;
  } catch (error) {
    console.error("加载日记错误:", error);
    return [];
  }
};

// 替换 saveDiariesToStorage 函数
const saveDiaryToFirestore = async (diary: DiaryEntry): Promise<void> => {
  try {
    if (diary.id && diary.id.startsWith('local_')) {
      // 新日记，需要添加到Firestore
      const { id, ...diaryWithoutId } = diary;
      const docRef = await addDoc(collection(db, 'diaries'), diaryWithoutId);
      diary.id = docRef.id;
    } else if (diary.id) {
      // 更新已有日记
      await updateDoc(doc(db, 'diaries', diary.id), { ...diary });
    }
  } catch (error) {
    console.error("Error saving diary:", error);
  }
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

  const [isLiked, setIsLiked] = useState(false);

  // 添加一个用于存储分析ID的状态
  const [analysisId, setAnalysisId] = useState<string>('');

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 在App组件中添加Firebase Auth状态监听
  useEffect(() => {
    // 监听认证状态变化
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // 用户已登录
        console.log("Firebase用户已登录:", firebaseUser);
        
        // 从Firebase Auth获取基本信息
        const basicUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '用户',
          email: firebaseUser.email || '',
        };
        
        // 从Firestore获取用户首选项
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            // 合并Firestore中的用户数据
            const userData = userDoc.data();
            const fullUser = {
              ...basicUser,
              preferences: userData.preferences || {
                reminderTime: '20:00',
                reminderEnabled: false
              }
            };
            setUser(fullUser);
            
            // 设置偏好
            setReminderTime(fullUser.preferences.reminderTime);
            setReminderEnabled(fullUser.preferences.reminderEnabled);
          } else {
            // 用户在Firestore中不存在，使用基本信息
            setUser({
              ...basicUser,
              preferences: {
                reminderTime: '20:00',
                reminderEnabled: false
              }
            });
          }
        } catch (error) {
          console.error("加载用户数据失败:", error);
          setUser(basicUser);
        }
        
        // 加载日记
        const loadedDiaries = await loadDiariesFromFirestore(firebaseUser.uid);
        setDiaries(loadedDiaries);
        
        setIsLoggedIn(true);
      } else {
        // 用户未登录
        setUser(null);
        setIsLoggedIn(false);
        setDiaries([]);
      }
    });
    
    // 清理函数
    return () => unsubscribe();
  }, []);

  // 检查提醒
  useEffect(() => {
    if (isLoggedIn && reminderEnabled) {
      const checkTime = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime === reminderTime) {
          // 显示提醒toast
          toast({
            title: '日记提醒',
            description: '别忘了今天记录你的一天！',
            status: 'info',
            duration: 9000,
            isClosable: true,
          });
          
          // 发送邮件提醒
          if (user?.email) {
            // 实际应用中，这里会调用后端API发送邮件
            console.log(`发送提醒邮件到: ${user.email}`);
            // 可以使用Firebase Functions实现此功能
          }
        }
      };
      
      const interval = setInterval(checkTime, 60000); // 每分钟检查一次
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, reminderEnabled, reminderTime, toast, user]);

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

  // 修改登录函数以使用基于邮箱的ID
  const handleLogin = async () => {
    if (loginForm.username && loginForm.password) {
      try {
        await signInWithEmailAndPassword(auth, loginForm.username, loginForm.password);
        // Firebase Auth状态变化监听器会自动处理剩余操作
        
        toast({
          title: '登录成功',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: '登录失败',
          description: '邮箱或密码错误',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // 修改用户注册函数
  const handleRegister = async () => {
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
        title: '注册失败',
        description: '两次输入的密码不一致',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      // 创建用户
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        registerForm.email, 
        registerForm.password
      );
      
      // 手动处理可能的错误
      if (!userCredential.user) {
        throw new Error("用户创建失败");
      }
      
      // 更新用户个人资料，设置显示名称
      await updateProfile(userCredential.user, {
        displayName: registerForm.username
      });
      
      // 在 Firestore 创建用户文档
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: registerForm.username,
        email: registerForm.email,
        preferences: {
          reminderTime: '20:00',
          reminderEnabled: false
        }
      });
      
      toast({
        title: '注册成功',
        description: '请使用新账号登录',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 自动填充登录表单
      setLoginForm({
        username: registerForm.email,
        password: ''
      });
      
      setIsRegistering(false);
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: '注册失败',
        description: '注册过程中出现错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 处理登出功能
  const handleLogout = async () => {
    try {
      await auth.signOut();
      // auth.onAuthStateChanged会自动处理登出后的状态
      toast({
        title: '已登出',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("登出失败:", error);
    }
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
  
  // 打开日记详情
  const openDiaryDetail = (diary: DiaryEntry) => {
    setSelectedDiary(diary);
    onDetailOpen();
  };

  // 更新生成AI分析函数，增加错误处理和日志记录
  const generateAiAnalysis = async () => {
    if (!selectedDiary) return;
    
    setIsAnalyzing(true);
    
    try {
      // 检查 API 端点 - 确保项目 ID 正确
      const apiUrl = 'https://us-central1-diary-darling.cloudfunctions.net/analyzeDiary';
      console.log("开始调用 API: ", apiUrl);
      
      // 获取用户的历史日记
      const userDiaries = diaries.filter(d => d.userId === user?.id);
      
      // 打印请求详情以便调试
      console.log("发送的数据:", {
        diary: selectedDiary.content,
        diaryId: selectedDiary.id,
        date: selectedDiary.date,
        mood: selectedDiary.mood,
        userId: user?.id,
        tags: selectedDiary.tags,
      });
      
      // 确保获取新的令牌
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error("无法获取认证令牌，请确保用户已登录");
      }
      
      // 调用 Firebase Function
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          diary: selectedDiary.content,
          diaryId: selectedDiary.id,
          date: selectedDiary.date,
          mood: selectedDiary.mood,
          userId: user?.id,
          tags: selectedDiary.tags,
          previousDiaries: userDiaries.map(d => ({
            id: d.id,
            content: d.content,
            date: d.date,
            mood: d.mood,
            tags: d.tags
          }))
        }),
      });
      
      // 检查响应状态
      console.log("API响应状态:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API错误:", errorText);
        throw new Error(`API响应错误: ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("API返回数据:", data);
      
      // 使用返回的分析数据
      setAiAnalysis(data.analysis);
      
      // 生成并保存分析ID用于点赞功能
      const newAnalysisId = `analysis_${selectedDiary.id}_${Date.now()}`;
      setAnalysisId(newAnalysisId);
      
      setIsAnalyzing(false);
    } catch (error) {
      console.error('AI分析请求失败:', error);
      setIsAnalyzing(false);
      toast({
        title: 'AI分析生成失败',
        description: `请稍后再试。错误: ${error instanceof Error ? error.message : '未知错误'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // 添加保存点赞到数据库的函数
  const saveLikeToDatabase = async (analysisId: string) => {
    try {
      if (!user || !auth.currentUser) return;
      
      // 在Firestore中保存点赞记录
      await addDoc(collection(db, 'likes'), {
        analysisId,
        userId: auth.currentUser.uid,
        diaryId: selectedDiary?.id,
        timestamp: new Date().toISOString()
      });
      
      console.log('点赞已保存到数据库');
      
      // 可选：显示点赞成功的提示
      toast({
        title: '谢谢您的反馈',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('保存点赞失败:', error);
      toast({
        title: '反馈保存失败',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // 修改保存设置函数，移除本地存储
  const saveSettings = async () => {
    if (user) {
      try {
        // 1. 更新Firebase Auth用户资料
        const currentUser = auth.currentUser;
        if (currentUser) {
          await updateProfile(currentUser, {
            displayName: user.name
          });
        }
        
        // 2. 更新本地状态
        const updatedUser = {
          ...user,
          preferences: {
            ...user.preferences,
            reminderTime,
            reminderEnabled
          }
        };
        
        setUser(updatedUser);
        
        // 3. 将用户数据保存到Firestore (唯一数据源)
        await setDoc(doc(db, 'users', user.id), {
          name: user.name,
          email: user.email,
          preferences: {
            reminderTime,
            reminderEnabled
          }
        }, { merge: true });
        
        toast({
          title: '设置已保存',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        onSettingsClose();
      } catch (error) {
        console.error("Error updating user profile:", error);
        toast({
          title: '保存设置失败',
          description: '无法更新用户资料',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // 筛选日记
  const filteredDiaries = selectedTag 
    ? diaries.filter(diary => diary.tags?.includes(selectedTag))
    : diaries;

  // 获取所有标签
  const allTags = Array.from(new Set(diaries.flatMap(diary => diary.tags || [])));

  // 改进日记保存函数
  const handleSaveDiary = async () => {
    if (!content.trim()) {
      toast({
        title: '内容不能为空',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (user && auth.currentUser) {
      try {
        const userId = auth.currentUser.uid; // 直接从Firebase Auth获取
        console.log("保存日记使用用户ID:", userId); // 调试日志
        
        let diaryToSave: DiaryEntry;
        
        if (isEditing && editingDiary) {
          // 更新现有日记
          diaryToSave = {
            ...editingDiary,
            date: selectedDate,
            mood: selectedMood,
            content,
            tags,
            userId // 确保用户ID正确
          };
        } else {
          // 创建新日记
          diaryToSave = {
            id: `local_${Date.now()}`,
            date: selectedDate,
            mood: selectedMood,
            content,
            userId, // 使用Firebase Auth的用户ID
            tags,
            createdAt: new Date().toISOString(),
          };
        }
        
        // 保存到Firestore并加载更新后的日记
        await saveDiaryToFirestore(diaryToSave);
        const updatedDiaries = await loadDiariesFromFirestore(userId);
        setDiaries(updatedDiaries);
        
        // 添加保存成功的提示
        toast({
          title: '日记已保存',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("保存日记错误:", error);
        toast({
          title: '保存失败，请重试',
          description: '无法保存日记',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    
    // 可选：将点赞状态保存到数据库
    if (!isLiked) {
      try {
        await saveLikeToDatabase(analysisId);
      } catch (error) {
        console.error('保存点赞失败:', error);
      }
    }
  };

  // 获取日历显示所需的日期数组
  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = [];
    
    // 获取月初是星期几 (0 = 星期日, 1 = 星期一, ..., 6 = 星期六)
    const startDay = start.getDay();
    
    // 添加上个月的日期（从月初向前填充）
    for (let i = 0; i < startDay; i++) {
      days.push(addDays(start, -startDay + i));
    }
    
    // 添加当前月份的日期
    let currentDate = start;
    while (currentDate <= end) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    // 如果需要，添加下个月的日期，使总数为 7 的倍数
    const daysNeeded = 42 - days.length; // 6 行 × 7 列 = 42
    for (let i = 1; i <= daysNeeded; i++) {
      days.push(addDays(end, i));
    }
    
    return days;
  };
  
  // 找出某一天的日记条目
  const getDiaryForDate = (date: Date) => {
    return diaries.find((diary) => isSameDay(parseISO(diary.date), date)) || null;
  };
  
  // 前进到下个月
  const nextMonth = () => {
    setCurrentMonth(addDays(endOfMonth(currentMonth), 1));
  };
  
  // 后退到上个月
  const prevMonth = () => {
    setCurrentMonth(addDays(startOfMonth(currentMonth), -1));
  };
  
  // 返回到当前月份
  const resetToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  // 渲染日历的函数
  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date();
    
    return (
      <Box bg="white" p={4} borderRadius="md" boxShadow="md" mb={4}>
        <Flex justify="space-between" align="center" mb={4}>
          <Button size="sm" onClick={prevMonth} colorScheme="brand" variant="outline">上个月</Button>
          <Heading size="md" color="brand.600">{format(currentMonth, 'yyyy年MM月')}</Heading>
          <HStack>
            <Button size="sm" onClick={nextMonth} colorScheme="brand" variant="outline">下个月</Button>
            <Button size="sm" onClick={resetToCurrentMonth} colorScheme="brand">今天</Button>
          </HStack>
        </Flex>
        
        <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
          {weekdays.map((day, index) => (
            <GridItem key={index} textAlign="center" fontWeight="bold" p={2} color="brand.600">
              {day}
            </GridItem>
          ))}
        </Grid>
        
        <Grid templateColumns="repeat(7, 1fr)" gap={1}>
          {days.map((day, index) => {
            const diary = getDiaryForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, today);
            
            return (
              <GridItem 
                key={index} 
                textAlign="center" 
                p={2}
                borderRadius="md"
                bg={isToday ? "brand.100" : diary && isCurrentMonth ? "brand.50" : isCurrentMonth ? "white" : "gray.50"}
                border={isToday ? "2px solid" : "none"}
                borderColor="brand.500"
                opacity={isCurrentMonth ? 1 : 0.5}
                cursor={diary ? "pointer" : "default"}
                onClick={() => diary && openDiaryDetail(diary)}
                _hover={diary ? { bg: "brand.100" } : {}}
                position="relative"
                transition="all 0.2s"
              >
                <VStack spacing={1}>
                  <Text 
                    fontSize="sm" 
                    fontWeight={isToday ? "bold" : "normal"}
                    color={isToday ? "brand.700" : isCurrentMonth ? "black" : "gray.500"}
                  >
                    {day.getDate()}
                  </Text>
                  {diary && (
                    <Text fontSize="xl" title="点击查看日记">
                      {diary.mood}
                    </Text>
                  )}
                </VStack>
              </GridItem>
            );
          })}
        </Grid>
        
        <Text fontSize="xs" mt={2} textAlign="center" color="gray.500">
          带有表情符号的日期表示该日有日记记录，点击可查看详情
        </Text>
      </Box>
    );
  };

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
                <FormLabel>邮箱</FormLabel>
                <Input 
                  type="email"
                  placeholder="请输入注册邮箱" 
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
          <Tab _selected={{ color: 'brand.700', borderColor: 'brand.500', borderBottomColor: 'white' }}>心情日历</Tab>
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
                onClick={handleSaveDiary}
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
                  {filteredDiaries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(diary => (
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
          
          {/* "心情日历"的标签页 */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">心情日历</Heading>
              <Box>
                {renderCalendar()}
              </Box>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                带有表情符号的日期表示该日有日记记录，点击可查看详情～
              </Text>
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
                      <Heading size="sm">聊一下</Heading>
                      <Button 
                        size="sm" 
                        leftIcon={<StarIcon />} 
                        colorScheme="purple"
                        onClick={generateAiAnalysis}
                        isLoading={isAnalyzing}
                      >
                        聊一下
                      </Button>
                    </Flex>
                    
                    {aiAnalysis ? (
                      <Box p={3} bg="gray.50" borderRadius="md" position="relative">
                        <Text whiteSpace="pre-wrap">{aiAnalysis}</Text>
                        <Button 
                          position="absolute"
                          right="3"
                          bottom="3"
                          variant="ghost"
                          onClick={handleLike}
                          aria-label="点赞"
                          color={isLiked ? "red.500" : "gray.400"}
                          _hover={{ color: isLiked ? "red.600" : "gray.600" }}
                        >
                          <span style={{ fontSize: "1.5rem" }}>👍</span>
                        </Button>
                      </Box>
                    ) : (
                      <Text color="gray.500" fontSize="sm">
                        点击"聊一下"按钮，启动AI聊天。
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
              <Heading size="sm">日记提醒</Heading>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="reminder-toggle" mb="0">
                  启用每日提醒
                </FormLabel>
                <Switch 
                  id="reminder-toggle" 
                  isChecked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                />
              </FormControl>
              
              <FormControl isDisabled={!reminderEnabled}>
                <FormLabel>提醒时间</FormLabel>
                <Input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </FormControl>
              
              <Divider />
              
              <Heading size="sm">账号信息</Heading>
              
              <FormControl>
                <FormLabel>用户名</FormLabel>
                <Input 
                  value={user?.name || ''} 
                  onChange={(e) => setUser(prev => prev ? {...prev, name: e.target.value} : null)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>用户邮箱</FormLabel>
                <Input value={user?.email || ''} isReadOnly />
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
