import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, ChakraProvider, VStack, Heading, 
  Input, Textarea, Button, HStack, Image, 
  useToast, FormControl, FormLabel, Flex,

  Text, Divider, Card, CardBody, CardHeader,
  SimpleGrid, Badge, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, useDisclosure,
  Menu, MenuButton, MenuList, MenuItem,
  Tag, TagLabel, TagCloseButton, Wrap, WrapItem,
  extendTheme, Center, Switch, Grid, GridItem,
  Icon, useColorMode, IconButton, Spinner, Tooltip,
  Editable, EditablePreview, EditableInput
} from '@chakra-ui/react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, addDays, isSameDay, isSameMonth } from 'date-fns';
import { ChevronDownIcon, CalendarIcon, SettingsIcon, StarIcon, AddIcon, EditIcon, ExternalLinkIcon, CheckIcon } from '@chakra-ui/icons';
import { db, auth, storage } from './FirebaseConfig';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaShare, FaPen, FaEye, FaCalendarAlt } from 'react-icons/fa';
import { shareCalendar } from './utils/ShareCalendar';

// 引入动态壁纸相关组件
import WallpaperBackground from './components/WallpaperBackground';
// 导入心情颜色映射
import { moodColors } from './utils/LocalWallpapers';
// 导入自定义布局样式
import '../DiaryLayout.css';
// 导入登录页面组件
import LoginPage from './components/LoginPage';

// 添加自定义字体
const CustomStyles = () => (
  <style>
    {`
    @font-face {
      font-family: 'Forte';
      src: url('/FORTE.TTF') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    `}
  </style>
);

// 获取心情对应的颜色，带默认值
const getMoodColor = (mood: string, opacity: number = 1): string => {
  // 确保emoji存在于映射中，否则使用默认颜色
  const baseColor = moodColors[mood as keyof typeof moodColors] || '#E9AFA3';
  
  // 如果需要透明度，添加透明度
  if (opacity < 1) {
    // 提取RGB部分
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  return baseColor;
};

// 语言配置
type Language = 'zh' | 'en';

// 添加更多常用表情符号
const commonEmojis: string[] = ['🎯', '✨', '🚀', '💪', '📚', '🧠', '🏃', '🌱', '💼', '🌟', '❤️', '🔥', '🙌', '✅', '🎨'];

// 翻译文本映射
const translations = {
  zh: {
    myDiary: '我的日记',
    welcome: '欢迎回来',
    consecutiveDays: '连续记录',
    days: '天',
    writeDiary: '写日记',
    viewDiary: '查看日记',
    moodCalendar: '心情日历',
    date: '日期',
    mood: '今日心情',
    content: '今日记录',
    addTag: '添加标签',
    inputTag: '输入标签...',
    add: '添加',
    addImage: '添加图片',
    save: '保存日记',
    noDiaries: '暂无日记记录',
    allDiaries: '全部日记',
    tag: '标签',
    close: '关闭',
    edit: '编辑',
    like: '点赞',
    liked: '已赞',
    diaryReminder: '日记提醒',
    enableReminder: '启用每日提醒',
    reminderTime: '提醒时间',
    accountInfo: '账号信息',
    username: '用户名',
    email: '用户邮箱',
    userId: '用户ID',
    cancel: '取消',
    saveSettings: '保存设置',
    logout: '退出',
    settings: '设置',
    chatAbout: '聊一下',
    editingDiary: '您正在编辑',
    cancelEdit: '取消编辑',
    diaryDate: '',
    tagTip: '',
    contentPlaceholder: '写下今天的心情和故事... 可以使用 #工作 #生活 等标签',
    previousMonth: '上个月',
    nextMonth: '下个月',
    today: '今天',
    calendarTip: '带有表情符号的日期表示该日有日记记录，点击可查看详情',
    clickChat: '点击"聊一下"按钮，启动AI聊天。',
    recordLife: '记录生活点滴',
    login: '登录',
    register: '注册',
    emailPlaceholder: '请输入注册邮箱',
    passwordPlaceholder: '请输入密码',
    usernamePlaceholder: '请创建用户名',
    confirmPassword: '确认密码',
    confirmPasswordPlaceholder: '请再次输入密码',
    emailInput: '电子邮箱',
    emailInputPlaceholder: '请输入邮箱',
    passwordInputPlaceholder: '请创建密码',
    password: '密码',
    sun: '日',
    mon: '一',
    tue: '二',
    wed: '三',
    thu: '四',
    fri: '五',
    sat: '六',
    goalPlaceholder: '分享一下这周的小目标吧',
    share: '分享'
  },
  en: {
    myDiary: 'My Diary',
    welcome: 'Welcome back',
    consecutiveDays: 'Consecutive',
    days: 'Days',
    writeDiary: 'Write Diary',
    viewDiary: 'View Diary',
    moodCalendar: 'Mood Calendar',
    date: 'Date',
    mood: 'Mood',
    content: 'Content',
    addTag: 'Add Tag',
    inputTag: 'Input tag...',
    add: 'Add',
    addImage: 'Add Image',
    save: 'Save',
    noDiaries: 'No diary records',
    allDiaries: 'All Diaries',
    tag: 'Tag',
    close: 'Close',
    edit: 'Edit',
    like: 'Like',
    liked: 'Liked',
    diaryReminder: 'Diary Reminder',
    enableReminder: 'Enable Daily Reminder',
    reminderTime: 'Reminder Time',
    accountInfo: 'Account Info',
    username: 'Username',
    email: 'Email',
    userId: 'User ID',
    cancel: 'Cancel',
    saveSettings: 'Save Settings',
    logout: 'Logout',
    settings: 'Settings',
    chatAbout: 'AI Chat',
    editingDiary: 'You are editing',
    cancelEdit: 'Cancel Edit',
    diaryDate: 'diary',
    tagTip: '',
    contentPlaceholder: 'Write about your day... You can use tags like #work #life',
    previousMonth: 'Previous',
    nextMonth: 'Next',
    today: 'Today',
    calendarTip: 'Dates with emoji have diary entries, click to view details',
    clickChat: 'Click "AI Chat" button to start AI conversation.',
    recordLife: 'Record your life moments',
    login: 'Login',
    register: 'Register',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    usernamePlaceholder: 'Create a username',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter password again',
    emailInput: 'Email',
    emailInputPlaceholder: 'Enter your email',
    passwordInputPlaceholder: 'Create a password',
    password: 'Password',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    goalPlaceholder: 'Share your goals for this week',
    share: 'Share'
  }
};

// 定义玻璃拟态主题
const theme = extendTheme({
  colors: {
    brand: {
      50: '#FDF0ED',  // 珊瑚粉超浅色
      100: '#F9DED7', // 珊瑚粉浅色
      200: '#F1C7BD', // 珊瑚粉中浅色 
      300: '#EDB9AD', // 珊瑚粉中色
      400: '#E9AFA3', // 珊瑚粉 - 主色调
      500: '#E39A8B', // 珊瑚粉加深
      600: '#CC7D6E', // 珊瑚粉深色
      700: '#B56151', // 珊瑚粉极深色
      800: '#96483A', // 褐色过渡
      900: '#7A3A2F', // 深褐色
    },
    neutrals: {
      50: '#FFFFFF',  // 纯白
      100: '#F9F9FA',
      200: '#F0F1F3',
      300: '#E6E8EC',
      400: '#D1D6DF',
      500: '#B7BEC9',
      600: '#8E99AA',
      700: '#646F83',
      800: '#3A405A', // 深海蓝
      900: '#1F2233', // 深蓝黑
    },
  },
  styles: {
    global: {
      body: {
        bg: 'neutrals.50', 
        color: 'neutrals.900',
        backgroundImage: 'url(/bg-pattern.png)', // 可选：添加微妙的背景图案
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorScheme === "teal" ? "brand.500" : 
               props.colorScheme === "gray" ? "neutrals.800" : undefined,
          color: "white",
          _hover: {
            bg: props.colorScheme === "teal" ? "brand.600" : 
                 props.colorScheme === "gray" ? "neutrals.900" : undefined,
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
          transition: 'all 0.2s',
        }),
        glass: {
          bg: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 'lg',
          color: 'neutrals.900',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.25)',
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          },
          transition: 'all 0.2s',
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 'xl',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          transition: 'all 0.3s ease',
        },
      },
      variants: {
        glass: {
          container: {
            bg: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 'xl',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'all 0.3s ease',
            _hover: {
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
            },
          }
        }
      },
      defaultProps: {
        variant: 'glass',
      }
    },
    Input: {
      variants: {
        glass: {
          field: {
            bg: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 'md',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            _hover: {
              borderColor: 'brand.400',
            },
            _focus: {
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px #E9AFA3',
            },
          }
        }
      },
      defaultProps: {
        variant: 'glass',
      }
    },
    Textarea: {
      variants: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 'md',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          _hover: {
            borderColor: 'brand.400',
          },
          _focus: {
            borderColor: 'brand.400',
            boxShadow: '0 0 0 1px #E9AFA3',
          },
        }
      },
      defaultProps: {
        variant: 'glass',
      }
    },
    Box: {
      variants: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 'xl',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        }
      }
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'rgba(255, 255, 255, 0.85)',
          borderRadius: 'xl',
          boxShadow: 'xl',
        }
      }
    },
    Tabs: {
      variants: {
        'soft-rounded': {
          tab: {
            borderRadius: 'full',
            fontWeight: 'medium',
            _selected: {
              color: 'white',
              bg: 'brand.500',
            }
          }
        },
        enclosed: {
          tab: {
            _selected: {
              color: 'brand.700',
              borderColor: 'brand.500',
              borderBottomColor: 'white',
            }
          }
        },
        glass: {
          tab: {
            borderRadius: 'md',
            fontWeight: 'medium',
            bg: 'rgba(255, 255, 255, 0.3)',
            _selected: {
              color: 'white',
              bg: 'brand.500',
            }
          },
          tablist: {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            mb: '1em',
          }
        }
      },
    },
    Text: {
      baseStyle: {
        fontFamily: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
      },
      variants: {
        cursive: {
          fontFamily: `'Ma Shan Zheng', '尔雅趣宋体', cursive`,
        },
        leira: {
          fontFamily: `'Leira-Regular', 'Leira', cursive`,
        },
        forte: {
          fontFamily: `'Forte', cursive`,
        }
      }
    },
    Heading: {
      baseStyle: {
        fontFamily: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
      },
      variants: {
        cursive: {
          fontFamily: `'Ma Shan Zheng', '尔雅趣宋体', cursive`,
        },
        leira: {
          fontFamily: `'Leira-Regular', 'Leira', cursive`,
        },
        forte: {
          fontFamily: `'Forte', cursive`,
        }
      }
    }
  },
  fonts: {
    heading: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif`,
    cursive: `'Ma Shan Zheng', '尔雅趣宋体', cursive`,
    leira: `'Leira-Regular', 'Leira', cursive`,
    forte: `'Forte', cursive`,
    bodoni: `'Bodoni MT', 'Bodoni', serif`,
  },
});

// 用户认证状态
interface User {
  id: string;
  name: string;
  email?: string;
  preferences?: {
    reminderTime?: string;
    reminderEnabled?: boolean;
    shortGoal?: string;
    shortGoalEmoji?: string;
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

// Custom bottom tab bar component
const BottomTabBar = ({ 
  activeTab, 
  setActiveTab, 
  language, 
  t 
}: { 
  activeTab: number, 
  setActiveTab: (index: number) => void, 
  language: Language,
  t: (key: keyof typeof translations.zh) => string
}) => {
  const tabItems = [
    { icon: FaPen, label: t('writeDiary') },
    { icon: FaEye, label: t('viewDiary') },
    { icon: FaCalendarAlt, label: t('moodCalendar') }
  ];

  return (
    <Box
      position="sticky"
      bottom="26px"
      left={0}
      right={0}
      zIndex={20}
      padding="0"
      width="100%"
      display="flex"
      justifyContent="center"
      background="transparent"
      pointerEvents="none"
    >
      <Flex
        justify="space-around"
        align="center"
        bg="rgba(255, 255, 255, 0.15)"
        backdropFilter="blur(10px)"
        borderRadius="full"
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
        border="1px solid rgba(255, 255, 255, 0.3)"
        p={2}
        mb={4}
        transition="all 0.3s ease"
        width="90%"
        maxWidth="500px"
        pointerEvents="auto"
      >
        {tabItems.map((item, index) => (
          <Box
            key={index}
            onClick={() => setActiveTab(index)}
            py={2}
            px={4}
            borderRadius="full"
            bg={activeTab === index ? "rgba(255, 255, 255, 0.3)" : "transparent"}
            cursor="pointer"
            position="relative"
            transform={activeTab === index ? "translateY(-2px)" : "translateY(0)"}
            transition="all 0.3s ease"
            _hover={{
              bg: "rgba(255, 255, 255, 0.2)",
            }}
          >
            <Flex 
              direction="column" 
              align="center" 
              justify="center"
              transition="all 0.3s ease"
            >
              <Icon 
                as={item.icon} 
                fontSize={activeTab === index ? "18px" : "20px"}
                color={activeTab === index ? "brand.500" : "gray.600"}
                mb={activeTab === index ? 1 : 0}
                transition="all 0.3s ease"
              />
              
              {activeTab === index && (
                <Text 
                  fontSize="xs" 
                  fontWeight="medium" 
                  color="brand.500"
                  fontFamily={language === 'en' ? "bodoni" : "inherit"}
                  transition="all 0.3s ease"
                >
                  {item.label}
                </Text>
              )}
            </Flex>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

function App() {
  const { colorMode } = useColorMode();
  // 添加语言选择状态
  const [language, setLanguage] = useState<Language>('zh');
  
  // 翻译函数
  const t = (key: keyof typeof translations.zh): string => {
    return translations[language][key];
  };
  
  // 切换语言函数
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };
  
  // 状态管理
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMood, setSelectedMood] = useState<string>('😊');
  const [content, setContent] = useState<string>('');
  // 添加短期目标状态
  const [shortGoal, setShortGoal] = useState<string>('');
  // 添加短期目标emoji状态
  const [shortGoalEmoji, setShortGoalEmoji] = useState<string>('🎯');
  // 添加输入框交互状态
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
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
  // 添加状态用于判断输入框是否处于编辑状态
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);
  // 添加状态来区分编辑类型：短期目标编辑或日记编辑
  const [editingType, setEditingType] = useState<'goal' | 'diary' | null>(null);

  const [isLiked, setIsLiked] = useState(false);

  // 添加一个用于存储分析ID的状态
  const [analysisId, setAnalysisId] = useState<string>('');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  // 添加状态用于判断背景是否较浅
  const [isLightBackground, setIsLightBackground] = useState<boolean>(false);
  // 引用当前壁纸URL
  const wallpaperUrlRef = useRef<string | null>(null);
  
  // 处理短期目标编辑完成的函数
  const handleGoalEditComplete = () => {
    setTimeout(() => {
      // 只有当输入框和emoji菜单都未激活时才退出编辑模式
      if (!isInputFocused && !isEmojiMenuOpen) {
        setIsEditing(false);
      }
    }, 200);
  };

  // 焦点输入框的函数
  const focusInput = () => {
    // 确保编辑模式开启
    setIsEditing(true);
    setIsInputFocused(true);
    // 设置编辑类型为目标编辑
    setEditingType('goal');
    
    // 简化聚焦逻辑，使用更安全的方法
    try {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log("成功聚焦到输入框");
        } else {
          console.warn("找不到输入框引用");
        }
      }, 200);
    } catch (e) {
      console.error("聚焦操作失败:", e);
    }
  };

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
            // 恢复短期目标
            if (fullUser.preferences.shortGoal) {
              setShortGoal(fullUser.preferences.shortGoal);
            }
            // 恢复短期目标emoji
            if (fullUser.preferences.shortGoalEmoji) {
              setShortGoalEmoji(fullUser.preferences.shortGoalEmoji);
            }
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

  // 获取本地时间
  const getFormattedDate = () => {
    const now = new Date();
    return format(now, 'MM/dd');
  };

  // 处理登录成功的逻辑 - 整合后的函数
  const handleLoginSuccess = async (userId: string) => {
    setIsLoggedIn(true);
    await loadDiaries(userId);
    
    // 如果有其他需要在登录成功后初始化的内容，可以在这里添加
  };

  // 加载日记函数
  const loadDiaries = async (userId: string) => {
    try {
      const loadedDiaries = await loadDiariesFromFirestore(userId);
      setDiaries(loadedDiaries);
    } catch (error) {
      console.error("加载日记失败:", error);
    }
  };

  // 处理登录的处理函数
  const handleLogin = async () => {
    if (loginForm.username && loginForm.password) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, loginForm.username, loginForm.password);
        
        // 使用整合后的登录成功处理函数
        if (userCredential.user) {
          await handleLoginSuccess(userCredential.user.uid);
        }
        
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

  // 处理注册的处理函数
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
    setEditingType('diary'); // 设置编辑类型为diary
    setActiveTab(0); // 切换到写日记标签页
    onDetailClose(); // 关闭详情模态框
    
    toast({
      title: "正在编辑日记",
      description: `您正在编辑模式`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // 取消编辑
  const cancelEditing = () => {
    setIsEditing(false);
    setEditingDiary(null);
    setEditingType(null); // 重置编辑类型
  };
  
  // 打开日记详情
  const openDiaryDetail = (diary: DiaryEntry) => {
    setSelectedDiary(diary);
    // 清除之前的AI分析，防止显示到其他日记
    setAiAnalysis('');
    setIsLiked(false);
    setAnalysisId('');
    
    // 检查是否有已点赞的分析，如果有则加载
    loadLikedAnalysis(diary.id);
    
    onDetailOpen();
  };

  // 添加处理Firestore索引错误的辅助函数
  const handleFirestoreIndexError = (error: any): boolean => {
    // 检查是否是缺少索引的错误
    if (error && error.message && error.message.includes('index')) {
      console.error('Firestore索引错误:', error.message);
      
      // 从错误消息中提取创建索引的URL（如果有）
      const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
      const indexUrl = urlMatch ? urlMatch[0] : null;
      
      // 显示带有索引创建链接的错误提示
      toast({
        title: 'Firestore索引需要创建',
        description: indexUrl 
          ? '点击此消息创建索引，然后重试操作。' 
          : '请联系管理员创建必要的Firestore索引。',
        status: 'error',
        duration: 10000,
        isClosable: true,
        onCloseComplete: () => {
          if (indexUrl) {
            window.open(indexUrl, '_blank');
          }
        }
      });
      return true;
    }
    return false;
  };

  // 添加加载已点赞分析的函数
  const loadLikedAnalysis = async (diaryId: string) => {
    try {
      if (!user || !auth.currentUser) return;
      
      // 首先尝试从用户特定的集合中查询
      let querySnapshot;
      
      try {
        // 查询用户特定路径
        const userLikesRef = collection(db, `users/${auth.currentUser.uid}/likes`);
        const userQuery = query(
          userLikesRef,
          where('diaryId', '==', diaryId),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        
        querySnapshot = await getDocs(userQuery);
        console.log('从用户特定路径查询点赞记录');
      } catch (pathError) {
        console.log('从用户路径查询失败，尝试公共集合:', pathError);
        
        // 检查是否是索引错误
        if (handleFirestoreIndexError(pathError)) {
          return; // 如果是索引错误，直接返回
        }
        
        // 如果用户特定路径失败，尝试公共集合
        const likesRef = collection(db, 'likes');
        const publicQuery = query(
          likesRef,
          where('userId', '==', auth.currentUser.uid),
          where('diaryId', '==', diaryId),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        
        try {
          querySnapshot = await getDocs(publicQuery);
          console.log('从公共路径查询点赞记录');
        } catch (publicError) {
          // 检查是否是索引错误
          if (handleFirestoreIndexError(publicError)) {
            return; // 如果是索引错误，直接返回
          }
          throw publicError; // 否则，继续抛出错误
        }
      }
      
      if (!querySnapshot.empty) {
        // 找到了点赞记录
        const likeDoc = querySnapshot.docs[0].data();
        const analysisId = likeDoc.analysisId;
        
        // 查询点赞记录对应的分析内容
        if (likeDoc.analysis) {
          // 如果点赞记录中直接包含分析内容
          setAiAnalysis(likeDoc.analysis);
          setAnalysisId(analysisId);
          setIsLiked(true);
          console.log('从点赞记录中加载分析成功');
          
          // 显示提示
          toast({
            title: '已加载您之前收藏的分析',
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
        } else {
          console.log('找到点赞记录，但需要实现从其他集合加载分析内容的逻辑');
          // 这里可能需要从另一个集合中查询分析内容
          // 目前先显示一个提示让用户知道曾经点过赞
          toast({
            title: '您曾经对这篇日记的分析点过赞',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('加载点赞分析失败:', error);
      // 不需要向用户显示此错误，因为这是静默加载
    }
  };

  // 更新生成AI分析函数，增加错误处理和日志记录
  const generateAiAnalysis = async () => {
    if (!selectedDiary) return;
    
    setIsAnalyzing(true);
    
    try {
      // 检查 API 端点 - 确保项目 ID 正确
      const apiUrl = 'https://us-central1-diary-darling.cloudfunctions.net/analyzeDiaryWithAI';
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
      console.log("AI分析API响应状态:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI分析API错误:", errorText);
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
      
      // 检查是否使用了基本分析（非AI分析）
      if (data.message) {
        // 显示基本分析提示
        toast({
          title: '使用了基本分析',
          description: data.message,
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      } else {
        // 显示分析成功的提示
        toast({
          title: 'AI分析完成',
          description: '基于人工智能的分析已准备就绪，点击"赞"保存分析',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
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

  // 核心保存函数
  const saveLikeToDatabase = async (analysisId: string) => {
    if (!user || !auth.currentUser || !selectedDiary) {
      throw new Error('Missing required data');
    }

    const likeData = {
      analysisId,
      userId: auth.currentUser.uid,
      diaryId: selectedDiary.id,
      analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    };

    const userLikesRef = collection(db, `users/${auth.currentUser.uid}/likes`);
    await addDoc(userLikesRef, likeData);
  };

  // 用户交互处理函数
  const handleLike = async () => {
    if (isLiked) {
      toast({
        title: '点赞已保存',
        description: '感谢您的反馈',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (!selectedDiary || !aiAnalysis) {
      toast({
        title: '请先启用聊一下',
        description: '生成AI分析后才能点赞',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const finalAnalysisId = analysisId || `analysis_${selectedDiary.id}_${Date.now()}`;
      await saveLikeToDatabase(finalAnalysisId);
      setIsLiked(true);
      
      toast({
        title: '已保存分析结果',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('点赞处理失败:', error);
      
      if (error instanceof Error && error.message.includes('permission-denied')) {
        toast({
          title: '权限错误',
          description: '请检查 index-ai.js 中的 Firestore 规则设置',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: '保存失败',
          description: error instanceof Error ? error.message : '未知错误',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
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
            reminderEnabled,
            shortGoal,
            shortGoalEmoji
          }
        };
        
        setUser(updatedUser);
        
        // 3. 将用户数据保存到Firestore (唯一数据源)
        await setDoc(doc(db, 'users', user.id), {
          name: user.name,
          email: user.email,
          preferences: {
            reminderTime,
            reminderEnabled,
            shortGoal,
            shortGoalEmoji
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

  // 添加自动保存短期目标的功能
  useEffect(() => {
    // 当短期目标变化时，自动保存到用户文档
    if (user && auth.currentUser && (shortGoal !== user.preferences?.shortGoal || shortGoalEmoji !== user.preferences?.shortGoalEmoji)) {
      const autoSaveGoal = async () => {
        try {
          await setDoc(doc(db, 'users', user.id), {
            preferences: {
              ...(user.preferences || {}),
              shortGoal,
              shortGoalEmoji
            }
          }, { merge: true });
          
          // 更新本地用户状态
          setUser(prev => prev ? {
            ...prev,
            preferences: {
              ...(prev.preferences || {}),
              shortGoal,
              shortGoalEmoji
            }
          } : null);
          
        } catch (error) {
          console.error("自动保存短期目标失败:", error);
        }
      };
      
      // 使用防抖延迟保存，避免频繁更新
      const timeoutId = setTimeout(autoSaveGoal, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [shortGoal, shortGoalEmoji, user]);

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
    
    // 添加照片验证 - 如果没有照片则提示用户并终止保存
    if (!imagePreview && !_image) {
      toast({
        title: '上传照片才能保存哦',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (user && auth.currentUser) {
      // 获取用户ID
      const userId = auth.currentUser.uid;
      console.log("保存日记使用用户ID:", userId);
      
      // 保留原有图片URL（如果是编辑模式）
      let imageUrl = isEditing && editingDiary ? editingDiary.imageUrl : undefined;
      
      // 准备日记对象（不含新图片）
      let diaryToSave: DiaryEntry;
      
      try {
        // 尝试上传图片（如果有新图片）
        if (_image) {
          try {
            // 创建存储引用
            const imagePath = `diary-images/${userId}/${Date.now()}_${_image.name}`;
            const storageRef = ref(storage, imagePath);
            
            // 上传图片
            await uploadBytes(storageRef, _image);
            
            // 获取下载URL
            imageUrl = await getDownloadURL(storageRef);
            console.log("图片已上传, URL:", imageUrl);
          } catch (imageError) {
            // 图片上传失败，但继续保存日记
            console.error("图片上传失败:", imageError);
            toast({
              title: '图片上传失败',
              description: '日记内容将被保存，但没有新图片',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
            // 保留原有图片URL（如果有）
          }
        }
        
        // 创建或更新日记对象
        if (isEditing && editingDiary) {
          // 更新现有日记
          diaryToSave = {
            ...editingDiary,
            date: selectedDate,
            mood: selectedMood,
            content,
            tags,
            userId,
            imageUrl
          };
        } else {
          // 创建新日记
          diaryToSave = {
            id: `local_${Date.now()}`,
            date: selectedDate,
            mood: selectedMood,
            content,
            userId,
            tags,
            createdAt: new Date().toISOString(),
            imageUrl
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
        
        // 重置表单状态
        if (!isEditing) {
          setContent('');
          setTags([]);
          setImage(null);
          setImagePreview(null);
          setSelectedMood('😊');
        } else {
          // 退出编辑模式
          setIsEditing(false);
          setEditingDiary(null);
          setEditingType(null); // 重置编辑类型
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
          setSelectedMood('😊');
          setContent('');
          setTags([]);
          setImage(null);
          setImagePreview(null);
        }
      } catch (error) {
        console.error("保存日记错误:", error);
        toast({
          title: '保存失败，请重试',
          description: '无法保存日记内容',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Function to handle calendar sharing
  const handleShareCalendar = async () => {
    // 调用独立的分享功能模块
    await shareCalendar(currentMonth, language, diaries, getMoodColor, toast);
  };
  
  const getDiaryForDate = (date: Date) => {
    return diaries.find((diary) => isSameDay(parseISO(diary.date), date)) || null;
  };
  
  // 前进到下个月
  const nextMonth = () => {
    setCurrentMonth(addDays(endOfMonth(currentMonth), 1));
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
    // 使用翻译后的星期标题
    const weekdays = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
    const today = new Date();
    
    return (
      <Box 
        p={{ base: 2, sm: 4 }} 
        borderRadius="xl" 
        boxShadow="md" 
        mb={4}
        bg="rgba(255, 255, 255, 0.2)"
        overflowX={{ base: "visible", md: "visible" }}
      >
        {/* 月份导航栏 - 优化移动端显示 */}
        <Flex 
          direction="column"
          justify="center" 
          align="center" 
          mb={2}
          gap={2}
        >
          <Heading 
            size={{ base: "sm", sm: "md" }}
            color="brand.600"
            textAlign="center"
            fontFamily={language === 'zh' ? "inherit" : "bodoni"}
            mb={1}
          >
            {format(currentMonth, 'yyyy年MM月')}
          </Heading>
          
          {/* 将月份导航按钮放在年月标题下方并排显示 */}
          <Flex 
            width="100%" 
            justify="center" 
            gap={2}
          >
            <Button 
              size={{ base: "xs", sm: "sm" }}
              onClick={prevMonth} 
              colorScheme="brand" 
              variant="outline" 
              bg="rgba(255, 255, 255, 0.2)"
              flex="1"
              maxW="140px"
            >
              {t('previousMonth')}
            </Button>
            
            <Button 
              size={{ base: "xs", sm: "sm" }}
              onClick={nextMonth} 
              colorScheme="brand" 
              variant="outline" 
              bg="rgba(255, 255, 255, 0.2)"
              flex="1"
              maxW="140px"
            >
              {t('nextMonth')}
            </Button>
            
            <Button 
              size={{ base: "xs", sm: "sm" }}
              onClick={resetToCurrentMonth} 
              colorScheme="brand" 
              bg={`${getMoodColor('😊', 0.2)}`}
              color="brand.700"
              border={`1px solid ${getMoodColor('😊', 0.4)}`}
              flex="1"
              maxW="120px"
            >
              {t('today')}
            </Button>
          </Flex>
        </Flex>
        
        {/* 星期标题行 - 缩小文字大小和内边距以适应移动端 */}
        <Box minW={{ base: "100%", md: "auto" }}>
          <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={1}>
            {weekdays.map((day, index) => (
              <GridItem 
                key={index} 
                textAlign="center" 
                fontWeight="bold" 
                p={{ base: 0.5, sm: 2 }} 
                color="brand.600"
                fontSize={{ base: "xs", sm: "sm" }}
              >
                {day}
              </GridItem>
            ))}
          </Grid>
          
          {/* 日期网格 - 缩小内容显示和内边距以适应移动端 */}
          <Grid templateColumns="repeat(7, 1fr)" gap={1}>
            {days.map((day: Date, index: number) => {
              const diary = getDiaryForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              
              return (
                <GridItem 
                  key={index} 
                  textAlign="center" 
                  p={{ base: 0.5, sm: 2 }}
                  borderRadius="md"
                  bg={isToday 
                    ? "rgba(233, 175, 163, 0.3)" 
                    : diary && isCurrentMonth 
                      ? getMoodColor(diary.mood, 0.25)
                      : isCurrentMonth 
                        ? "rgba(255, 255, 255, 0.2)" 
                        : "rgba(245, 245, 245, 0.1)"}
                  cursor={diary ? "pointer" : "default"}
                  onClick={() => diary && openDiaryDetail(diary)}
                  _hover={diary ? { 
                    bg: diary ? getMoodColor(diary.mood, 0.4) : "rgba(233, 175, 163, 0.2)", 
                    transform: "translateY(-2px)", 
                    boxShadow: "sm" 
                  } : {}}
                  position="relative"
                  transition="all 0.2s"
                  boxShadow={diary ? `0 2px 8px ${getMoodColor(diary.mood, 0.25)}` : "none"}
                  minH={{ base: "30px", sm: "50px" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <VStack spacing={{ base: 0, sm: 1 }} w="100%">
                    <Text 
                      fontSize={{ base: "2xs", sm: "sm" }}
                      fontWeight={isToday ? "bold" : "normal"}
                      color={isToday ? "brand.700" : isCurrentMonth ? "neutrals.900" : "neutrals.800"}
                    >
                      {day.getDate()}
                    </Text>
                    {diary && (
                      <Text 
                        fontSize={{ base: "sm", sm: "xl" }} 
                        title="点击查看日记"
                        lineHeight="1"
                      >
                        {diary.mood}
                      </Text>
                    )}
                  </VStack>
                </GridItem>
              );
            })}
          </Grid>
        </Box>
        
        <Text fontSize={{ base: "2xs", sm: "xs" }} mt={2} textAlign="center" color="neutrals.800">
          {t('calendarTip')}
        </Text>
      </Box>
    );
  };

  // 检测背景亮度的函数
  const detectBackgroundBrightness = (imageUrl: string) => {
    if (!imageUrl || imageUrl === wallpaperUrlRef.current) return;
    
    wallpaperUrlRef.current = imageUrl;
    
    const img = document.createElement('img');
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      
      try {
        // 获取图像中心区域的像素数据
        const centerX = Math.floor(img.width / 2);
        const centerY = Math.floor(img.height / 3); // 取上部1/3处(标题栏位置)
        const radius = Math.floor(Math.min(img.width, img.height) / 8);
        
        const imageData = ctx.getImageData(
          centerX - radius, 
          centerY - radius, 
          radius * 2, 
          radius * 2
        );
        
        // 计算区域平均亮度
        let totalBrightness = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          
          // 计算像素亮度 (人眼感知权重: R=0.299, G=0.587, B=0.114)
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += brightness;
          pixelCount++;
        }
        
        const averageBrightness = totalBrightness / pixelCount;
        console.log("背景平均亮度:", averageBrightness);
        
        // 亮度阈值: 0-255，大于128认为是浅色背景
        setIsLightBackground(averageBrightness > 180);
      } catch (error) {
        console.error("背景亮度检测失败:", error);
      }
    };
    
    img.onerror = () => {
      console.error("背景图片加载失败:", imageUrl);
    };
    
    img.src = imageUrl;
  };
  
  // 当壁纸更改时检测亮度
  useEffect(() => {
    const wallpaperElement = document.querySelector("[data-wallpaper='true']") as HTMLElement;
    if (wallpaperElement) {
      const style = getComputedStyle(wallpaperElement);
      const bgImage = style.backgroundImage;
      
      // 提取背景图片URL
      const match = bgImage.match(/url\(["']?(.*?)["']?\)/);
      if (match && match[1]) {
        detectBackgroundBrightness(match[1]);
      } else {
        setIsLightBackground(false);
      }
    }
  }, []);
  
  // 在渲染主应用部分添加壁纸监听
  useEffect(() => {
    // 创建MutationObserver监听DOM变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target as HTMLElement;
          if (element.getAttribute('data-wallpaper') === 'true') {
            const style = getComputedStyle(element);
            const bgImage = style.backgroundImage;
            
            const match = bgImage.match(/url\(["']?(.*?)["']?\)/);
            if (match && match[1]) {
              detectBackgroundBrightness(match[1]);
            }
          }
        }
      });
    });
    
    // 延迟初始化观察器，等待壁纸渲染
    setTimeout(() => {
      const wallpaperElement = document.querySelector("[data-wallpaper='true']");
      if (wallpaperElement) {
        observer.observe(wallpaperElement, { attributes: true });
      }
    }, 2000);
    
    return () => observer.disconnect();
  }, []);
  
  // 渲染主应用
  const renderMainApp = () => (
    <Box minH="100vh" p={4} pb="120px">
      {/* 顶部导航栏 */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        p={4}
        mb={4}
      >
        {/* existing header code */}
        <HStack spacing={4}>
          <Icon as={CalendarIcon} 
            color={isLightBackground ? "brand.800" : "brand.500"} 
            w={6} h={6} 
            filter={isLightBackground ? "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" : "none"}
            transition="all 0.3s ease" 
          />
          <Text 
            fontSize={{ base: "xl", sm: "2xl" }}
            fontFamily={language === 'zh' ? "cursive" : "forte"}
            color={isLightBackground ? "brand.800" : "brand.500"}
            fontWeight="bold"
            textShadow={isLightBackground ? "0 1px 2px rgba(0,0,0,0.5), 0 0 1px rgba(0,0,0,0.5)" : "0 2px 4px rgba(0,0,0,0.1)"}
            transition="all 0.3s ease"
          >
            {t('myDiary')}
          </Text>
        </HStack>
          
        {/* 右侧设置按钮和退出按钮 */}
        <HStack spacing={4}>
          {/* 添加语言切换按钮 */}
          <Tooltip label={language === 'zh' ? 'Switch to English' : '切换到中文'}>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleLanguage}
              color="neutrals.800"
              _hover={{ color: "brand.500" }}
              transition="all 0.3s ease"
              fontWeight="medium"
            >
              {language === 'zh' ? 'EN' : '中'}
            </Button>
          </Tooltip>
          
          <IconButton
            aria-label={t('settings')}
            icon={<SettingsIcon />}
            onClick={onSettingsOpen}
            variant="ghost"
            color="neutrals.800"
            _hover={{ color: "brand.500", transform: "rotate(45deg)" }}
            transition="all 0.3s ease"
          />
          
          <Button 
            size="sm" 
            onClick={handleLogout} 
            colorScheme="brand"
          >
            {t('logout')}
          </Button>
        </HStack>
      </Flex>

      {/* 欢迎信息和连续记录天数 */}
      <Flex
        mb={6}
        p={4}
        borderRadius="xl"
        align="center"
        justify="space-between"
        flexDirection={{ base: "column", sm: "row" }}
        gap={{ base: 4, sm: 0 }}
        color={colorMode === 'dark' ? "whiteAlpha.900" : "gray.700"}
        textShadow="0 2px 4px rgba(0,0,0,0.1)"
      >
        {/* existing welcome message */}
        <VStack align="flex-start" spacing={2} flex="1">
          <Text 
            fontSize={{ base: "md", sm: "lg" }}
            fontFamily={language === 'en' ? "forte" : "inherit"}
            fontWeight={language === 'en' ? "normal" : "medium"}
          >
            {t('welcome')}, {user?.name}！
          </Text>
          
          {/* existing editable goal section */}
          {isEditing || !shortGoal ? (
            <Flex 
              align="center" 
              width={{ base: "100%", sm: "auto" }}
              position="relative"
              zIndex={2}
              flex="1"
            >
              <Menu 
                closeOnSelect={true}
                onOpen={() => {
                  setIsEmojiMenuOpen(true);
                }}
                onClose={() => {
                  setIsEmojiMenuOpen(false);
                  if (isEditing) {
                    // 调用focusInput函数而不是直接使用ref
                    focusInput();
                  }
                }}
              >
                <MenuButton
                  as={Button}
                  aria-label="选择表情"
                  mr={2}
                  height="32px"
                  minW="32px"
                  p={0}
                  borderRadius="full"
                  fontSize="lg"
                  bg="rgba(255, 255, 255, 0.2)"
                  border="1px solid rgba(255, 255, 255, 0.15)"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.3)",
                    borderColor: "brand.400",
                  }}
                  _active={{
                    bg: "rgba(255, 255, 255, 0.4)",
                  }}
                  transition="all 0.2s ease"
                  cursor="pointer"
                >
                  {shortGoalEmoji}
                </MenuButton>
                <MenuList
                  bg="rgba(255, 255, 255, 0.9)"
                  backdropFilter="blur(10px)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  borderRadius="md"
                  boxShadow="lg"
                  p={2}
                  zIndex={10}
                >
                  <SimpleGrid columns={5} spacing={2}>
                    {commonEmojis.map((emojiItem: string) => (
                      <Button
                        key={emojiItem}
                        onClick={() => {
                          setShortGoalEmoji(emojiItem);
                          // 选择表情后调用focusInput
                          setTimeout(() => focusInput(), 10);
                        }}
                        fontSize="xl"
                        height="36px"
                        width="36px"
                        p={0}
                        bg={shortGoalEmoji === emojiItem ? "rgba(233, 175, 163, 0.2)" : "transparent"}
                        _hover={{ bg: "rgba(233, 175, 163, 0.1)" }}
                        borderRadius="md"
                        cursor="pointer"
                      >
                        {emojiItem}
                      </Button>
                    ))}
                  </SimpleGrid>
                </MenuList>
              </Menu>
              
              {/* 回到Chakra Input但添加必要的样式属性 */}
              <Editable
                defaultValue={shortGoal || ''}
                value={shortGoal}
                onChange={(value) => setShortGoal(value)}
                placeholder={language === 'zh' ? "分享一下这周的小目标吧" : "Share your goals for this week"}
                fontSize="14px"
                width="auto"
                maxWidth={{ base: "100%", sm: shortGoal ? `${Math.max(320, Math.min(600, shortGoal.length * 12))}px` : "320px" }}
                bg="rgba(255, 255, 255, 0.2)"
                px={4}
                py={1}
                borderRadius="full"
                border="1px solid rgba(255, 255, 255, 0.15)"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.3)",
                  borderColor: "brand.400",
                  boxShadow: "0 2px 6px rgba(233, 175, 163, 0.2)"
                }}
                onFocus={() => {
                  setIsEditing(true);
                  setIsInputFocused(true);
                }}
                onBlur={() => {
                  setIsInputFocused(false);
                  handleGoalEditComplete();
                }}
                onClick={(e) => e.stopPropagation()}
                cursor="text"
                zIndex={3}
              >
                <EditablePreview 
                  cursor="text"
                  px={0}
                  py={0}
                  _hover={{ cursor: "text" }}
                />
                <EditableInput 
                  ref={inputRef}
                  px={0}
                  py={0}
                  cursor="text"
                  _focus={{ cursor: "text" }}
                  _hover={{ cursor: "text" }}
                  maxLength={40}
                />
              </Editable>

              <IconButton
                aria-label={isEditing ? "保存目标" : "编辑目标"}
                icon={isEditing ? <CheckIcon /> : <EditIcon />}
                size="sm"
                variant="ghost"
                colorScheme="brand"
                onClick={() => {
                  console.log("编辑按钮被点击，当前编辑状态:", isEditing);
                  // 直接切换编辑状态
                  const newEditingState = !isEditing;
                  setIsEditing(newEditingState);
                  // 设置编辑类型为goal
                  setEditingType(newEditingState ? 'goal' : null);
                  
                  // 如果是从编辑状态切换到非编辑状态（点击对勾确认），不做特殊处理
                  // formattedDate 在非编辑状态下会自动显示
                  
                  // 如果切换到编辑模式，尝试聚焦输入框
                  if (newEditingState && inputRef.current) {
                    // 使用setTimeout确保DOM更新后再聚焦
                    setTimeout(() => {
                      if (inputRef.current) {
                        inputRef.current.focus();
                        console.log("输入框已聚焦");
                      }
                    }, 100);
                  }
                }}
                ml={2}
              />
            </Flex>
          ) : (
            <Flex align="center" width="100%">
              {/* 表情符号独立模块 */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg="rgba(255, 255, 255, 0.25)"
                border="1px solid rgba(233, 175, 163, 0.2)"
                boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                p={2}
                height="40px"
                width="40px"
                mr={3}
                transition="all 0.3s ease"
                _hover={{
                  bg: "rgba(255, 255, 255, 0.35)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(233, 175, 163, 0.2)"
                }}
                cursor="pointer"
                onClick={() => {
                  setIsEditing(true);
                  focusInput();
                }}
              >
                <Text fontSize="xl" lineHeight="1">{shortGoalEmoji}</Text>
              </Box>
              
              {/* 目标文本独立模块 */}
              <Box
                borderRadius="full"
                px={4}
                py={1}
                bg="rgba(255, 255, 255, 0.25)"
                border="1px solid rgba(233, 175, 163, 0.2)"
                boxShadow="0 2px 8px rgba(0,0,0,0.05)"
                cursor="pointer"
                transition="all 0.3s ease"
                flex="1"
                maxWidth={{ base: "100%", sm: shortGoal ? `${Math.max(280, Math.min(500, shortGoal.length * 12))}px` : "280px" }}
                _hover={{
                  bg: "rgba(255, 255, 255, 0.35)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(233, 175, 163, 0.2)"
                }}
                role="button"
                tabIndex={0}
                aria-label={language === 'zh' ? "编辑目标" : "Edit goal"}
                onClick={() => {
                  setIsEditing(true);
                  focusInput();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setIsEditing(true);
                    focusInput();
                  }
                }}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text
                  fontFamily={language === 'en' ? "bodoni" : "inherit"}
                  fontWeight="medium"
                  fontSize="sm"
                  letterSpacing="0.4px"
                  color="brand.700"
                  textShadow="0 1px 2px rgba(255,255,255,0.5)"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  width="calc(100% - 30px)"
                >
                  {shortGoal}
                  <Box as="span" 
                    fontSize="xs" 
                    ml={2} 
                    opacity={0.8} 
                    fontStyle="italic"
                    color="gray.600"
                    flexShrink={0}
                    display="inline-block"
                  >
                    {typeof getFormattedDate === 'function' ? `on ${getFormattedDate()}` : ''}
                  </Box>
                </Text>
                <IconButton
                  aria-label="编辑目标"
                  icon={<EditIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="brand"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setEditingType('goal');
                    focusInput();
                  }}
                  ml={1}
                />
              </Box>
            </Flex>
          )}
        </VStack>

        {/* 连续打卡标签 */}
        <HStack spacing={3}>
          <Text
            fontSize={{ base: "xs", sm: "sm" }}
            color="brand.700"
            fontFamily={language === 'en' ? "forte" : "inherit"}
            fontWeight={language === 'en' ? "normal" : "medium"}
          >
            {t('consecutiveDays')}
          </Text>
          <Badge 
            py={1} 
            px={3} 
            colorScheme="pink" 
            borderRadius="full" 
            fontSize={{ base: "xs", sm: "sm" }}
            bg="rgba(233, 175, 163, 0.2)"
            color="brand.700"
            fontFamily={language === 'en' ? "forte" : "inherit"}
            fontWeight={language === 'en' ? "normal" : "medium"}
            textTransform="none"
          >
            {consecutiveDays} {t('days')}
          </Badge>
        </HStack>
      </Flex>

      {/* Replace with Custom Tab Panels */}
      <Box>
        {/* Tab Panels Content */}
        <Box>
          {/* 写日记面板 */}
          {activeTab === 0 && (
            <Box p={0}>
              <Box
                p={6}
                borderRadius="xl"
                bg="rgba(255, 255, 255, 0.2)"
                boxShadow="lg"
                border="1px solid rgba(255, 255, 255, 0.2)"
                transform="translateY(0)"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-5px)",
                  boxShadow: "xl"
                }}
              >
                <VStack spacing={4} align="stretch">
                  {isEditing && activeTab === 0 && editingType === 'diary' && (
                    <Box bg="rgba(254, 252, 191, 0.6)" p={3} borderRadius="md">
                      <HStack spacing={3}>
                        <CalendarIcon color="brand.500" />
                        <Text>{t('editingDiary')} {editingDiary && editingDiary.date ? format(parseISO(editingDiary.date), 'yyyy年MM月dd日') : ''} {t('diaryDate')}</Text>
                      </HStack>
                      <Button size="sm" mt={2} onClick={cancelEditing}>{t('cancelEdit')}</Button>
                    </Box>
                  )}
                  
                  <Box className="diary-main-content">
                    <FormControl>
                      <FormLabel fontFamily={language === 'en' ? "bodoni" : "inherit"}>{t('mood')}</FormLabel>
                      <HStack spacing={2} wrap="wrap">
                        {moodEmojis.map((emoji) => (
                          <Button 
                            key={emoji}
                            onClick={() => setSelectedMood(emoji)}
                            variant={selectedMood === emoji ? "solid" : "outline"}
                            bg={selectedMood === emoji ? getMoodColor(emoji) : "rgba(255, 255, 255, 0.3)"}
                            color={selectedMood === emoji ? "white" : "gray.700"}
                            borderColor={getMoodColor(emoji, 0.5)}
                            _hover={{ 
                              bg: selectedMood === emoji ? getMoodColor(emoji) : getMoodColor(emoji, 0.2),
                              transform: "translateY(-2px)"
                            }}
                            fontSize="20px"
                            transition="all 0.2s ease"
                          >
                            {emoji}
                          </Button>
                        ))}
                      </HStack>
                    </FormControl>

                    <FormControl mt={4}>
                      <FormLabel fontFamily={language === 'en' ? "bodoni" : "inherit"}>{t('content')} {t('tagTip')}</FormLabel>
                      <Textarea 
                        placeholder={t('contentPlaceholder')}
                        size="lg" 
                        minH="200px"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        bg="rgba(255, 255, 255, 0.3)"
                        border="1px solid rgba(255, 255, 255, 0.2)"
                        borderRadius="md"
                        _hover={{ borderColor: "brand.500" }}
                        _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                      />
                    </FormControl>
                  </Box>

                  {/* Bottom Blocks Row - Redesigned Layout */}
                  <Grid className="diary-bottom-layout">
                    {/* Left Block - Image Upload (Full Height) */}
                    <Box className="image-upload-area">
                      <FormControl h="100%">
                        <FormLabel fontFamily={language === 'en' ? "bodoni" : "inherit"} fontSize={{ base: "sm", sm: "md" }}>{t('addImage')}</FormLabel>
                        <Flex direction="column" align="center" justify="center" h="100%">
                          {!imagePreview ? (
                            <>
                              <Box 
                                className="image-dropzone" 
                                as="label" 
                                htmlFor="image-upload"
                                cursor="pointer"
                                p={{ base: 2, sm: 4 }}
                              >
                                <Icon as={AddIcon} boxSize={{ base: 6, sm: 8 }} color="gray.400" mb={{ base: 1, sm: 3 }} />
                                <Text fontSize={{ base: "xs", sm: "sm" }} color="gray.500">点击选择图片</Text>
                              </Box>
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                p={1}
                                bg="rgba(255, 255, 255, 0.2)"
                                borderRadius="md"
                                hidden
                                id="image-upload"
                              />
                            </>
                          ) : (
                            <Box position="relative" w="100%" h="100%">
                              <Image 
                                src={imagePreview} 
                                alt="日记图片预览" 
                                objectFit="contain"
                                maxH={{ base: "150px", sm: "200px" }}
                                borderRadius="md"
                                mx="auto"
                              />
                              <IconButton
                                aria-label="Remove image"
                                icon={<AddIcon transform="rotate(45deg)" />}
                                size="sm"
                                colorScheme="brand"
                                position="absolute"
                                top={0}
                                right={0}
                                onClick={() => {
                                  setImage(null);
                                  setImagePreview(null);
                                }}
                              />
                            </Box>
                          )}
                        </Flex>
                      </FormControl>
                    </Box>

                    {/* Right Top Block - Tag */}
                    <Box className="tag-area">
                      <FormControl>
                        <FormLabel fontFamily={language === 'en' ? "bodoni" : "inherit"} fontSize={{ base: "sm", sm: "md" }}>{t('addTag')}</FormLabel>
                        <Flex>
                          <Input 
                            placeholder={t('inputTag')}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            mr={2}
                            bg="rgba(255, 255, 255, 0.3)"
                            border="1px solid rgba(255, 255, 255, 0.2)"
                            _hover={{ borderColor: "brand.500" }}
                            _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                            fontSize={{ base: "xs", sm: "md" }}
                            p={{ base: 1, sm: 2 }}
                            height={{ base: "32px", sm: "40px" }}
                          />
                          <IconButton
                            aria-label="Add tag"
                            icon={<AddIcon />}
                            onClick={addTag}
                            colorScheme="brand"
                            isDisabled={!tagInput || tags.includes(tagInput)}
                            _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                            transition="all 0.2s"
                            borderRadius="full"
                            size="sm"
                          />
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
                    </Box>

                    {/* Right Bottom Block - Date - Adding the missing date picker component */}
                    <Box className="date-area">
                      <FormControl>
                        <FormLabel fontFamily={language === 'en' ? "bodoni" : "inherit"} mb={0} fontSize={{ base: "sm", sm: "md" }}>{t('date')}</FormLabel>
                        <Flex>
                          <Input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            bg="rgba(255, 255, 255, 0.3)"
                            border="1px solid rgba(255, 255, 255, 0.2)"
                            _hover={{ borderColor: "brand.500" }}
                            _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                            id="date-input"
                            mr={2}
                            fontSize={{ base: "xs", sm: "md" }}
                            p={{ base: 1, sm: 2 }}
                            height={{ base: "32px", sm: "40px" }}
                            sx={{
                              // 隐藏日期输入框的日历图标
                              '::-webkit-calendar-picker-indicator': {
                                display: 'none'
                              },
                              '::-webkit-inner-spin-button': { 
                                display: 'none'
                              },
                              '::-webkit-clear-button': {
                                display: 'none'
                              }
                            }}
                          />
                          <IconButton
                            aria-label="Select date"
                            icon={<CalendarIcon />}
                            colorScheme="brand"
                            onClick={() => {
                              // 创建一个虚拟点击事件来触发日期选择器
                              const dateInput = document.getElementById('date-input');
                              if (dateInput) {
                                const event = new MouseEvent('click', {
                                  view: window,
                                  bubbles: true,
                                  cancelable: true
                                });
                                dateInput.dispatchEvent(event);
                              }
                            }}
                            _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                            transition="all 0.2s"
                            borderRadius="full"
                            size="sm"
                          />
                        </Flex>
                      </FormControl>
                    </Box>
                  </Grid>

                  <Button 
                    className="save-button"
                    colorScheme="teal" 
                    size="lg" 
                    onClick={handleSaveDiary}
                    mt={4}
                  >
                    {t('save')}
                  </Button>
                </VStack>
              </Box>
            </Box>
          )}
          
          {/* 历史记录面板 */}
          {activeTab === 1 && (
            <Box>
              <Box
                p={6}
                borderRadius="xl"
                bg="rgba(255, 255, 255, 0.2)"
                boxShadow="lg"
                border="1px solid rgba(255, 255, 255, 0.2)"
              >
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading as="h2" size="md" fontFamily={language === 'zh' ? "cursive" : "bodoni"}>{t('myDiary')}</Heading>
                  <HStack spacing={2}>
                    <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm" bg="rgba(255, 255, 255, 0.3)">
                        {selectedTag ? `${t('tag')}: #${selectedTag}` : t('allDiaries')}
                      </MenuButton>
                        <MenuList bg="rgba(255, 255, 255, 0.8)">
                        <MenuItem onClick={() => setSelectedTag(null)}>{t('allDiaries')}</MenuItem>
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
                    <Text textAlign="center" py={10} color="neutrals.800">
                    {t('noDiaries')}
                  </Text>
                ) : (
                  <SimpleGrid columns={[1, null, 2]} spacing={4}>
                    {filteredDiaries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(diary => (
                        <Card 
                          key={diary.id} 
                          variant="glass" 
                          cursor="pointer" 
                          onClick={() => openDiaryDetail(diary)}
                          _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
                          transition="all 0.3s ease"
                          bg="rgba(255, 255, 255, 0.3)"
                          borderLeft={`3px solid ${getMoodColor(diary.mood)}`}
                        >
                        <CardHeader pb={2}>
                          <Flex justify="space-between" align="center">
                            <HStack>
                              <Text fontSize="2xl">{diary.mood}</Text>
                              <Text fontWeight="bold">{format(parseISO(diary.date), 'yyyy年MM月dd日')}</Text>
                            </HStack>
                              <Text fontSize="sm" color="neutrals.800">
                              {format(parseISO(diary.createdAt), 'HH:mm')}
                            </Text>
                          </Flex>
                        </CardHeader>
                        <CardBody pt={0}>
                          <Text noOfLines={3}>{diary.content}</Text>
                          {diary.tags && diary.tags.length > 0 && (
                            <HStack mt={2} spacing={2} wrap="wrap">
                              {diary.tags.map(tag => (
                                  <Badge key={tag} colorScheme="brand" bg="rgba(233, 175, 163, 0.2)" color="brand.700">#{tag}</Badge>
                              ))}
                            </HStack>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
              </Box>
            </Box>
          )}
          
          {/* "心情日历"的标签页 */}
          {activeTab === 2 && (
            <Box>
              <Box
                p={6}
                borderRadius="xl"
                bg="rgba(255, 255, 255, 0.2)"
                boxShadow="lg"
                border="1px solid rgba(255, 255, 255, 0.2)"
              >
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center" mb={3}>
                    <Heading as="h2" size="md" fontFamily={language === 'zh' ? "cursive" : "bodoni"}>
                      {t('moodCalendar')}
                    </Heading>
                    <Button
                      leftIcon={<Icon as={FaShare} />}
                      colorScheme="brand"
                      size="sm"
                      bg={`${getMoodColor('😊', 0.2)}`}
                      color="brand.700"
                      border={`1px solid ${getMoodColor('😊', 0.4)}`}
                      onClick={handleShareCalendar}
                    >
                      {t('share')}
                    </Button>
                  </Flex>
                  <Box className="calendar-container">
                    {renderCalendar()}
                  </Box>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                     
                  </Text>
                </VStack>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Bottom Tab Bar */}
      <BottomTabBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        language={language} 
        t={t}
      />
      
      {/* 日记详情模态框 */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(8px)" />
        <ModalContent 
          bg="rgba(255, 255, 255, 0.86)"
          borderRadius="xl"
          boxShadow="xl"
          border="1px solid rgba(255, 255, 255, 0.3)"
          color="gray.800"
        >
          {selectedDiary && (
            <>
              <ModalHeader 
                bg="rgba(255, 255, 255, 0.9)" 
                borderTopRadius="xl"
                borderLeft={selectedDiary && `4px solid ${getMoodColor(selectedDiary.mood)}`}
              >
                <HStack>
                  <Text fontSize="2xl">{selectedDiary.mood}</Text>
                  <Text fontFamily={language === 'en' ? "inherit" : "inherit"}>
                    {selectedDiary && selectedDiary.date ? format(parseISO(selectedDiary.date), 'yyyy年MM月dd日') : ''}
                  </Text>
                </HStack>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={4}>
                  <Text whiteSpace="pre-wrap">{selectedDiary.content}</Text>
                  
                  {selectedDiary.imageUrl && (
                    <Box
                      borderRadius="lg"
                      overflow="hidden"
                      boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
                      borderWidth="1px"
                      borderColor="gray.100"
                      bg="white"
                      p="3"
                      maxW="100%"
                      mx="auto"
                      position="relative"
                    >
                      <Image 
                        src={selectedDiary.imageUrl} 
                        alt="日记图片" 
                        borderRadius="md"
                        objectFit="cover"
                        width="100%"
                        maxH="400px"
                        fallback={<Center h="300px" bg="gray.50"><Spinner /></Center>}
                      />
                      <Box 
                        position="absolute" 
                        bottom="6px" 
                        right="6px"
                        bg="white"
                        p="1"
                        borderRadius="full"
                        opacity="0.8"
                        _hover={{ opacity: "1" }}
                      >
                        <IconButton
                          aria-label="查看原图"
                          icon={<ExternalLinkIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(selectedDiary.imageUrl, '_blank')}
                        />
                      </Box>
                    </Box>
                  )}
                  
                  {selectedDiary.tags && selectedDiary.tags.length > 0 && (
                    <HStack mt={2} spacing={2} wrap="wrap">
                      {selectedDiary.tags.map(tag => (
                        <Badge key={tag} colorScheme="brand" bg="rgba(233, 175, 163, 0.1)" color="brand.700">#{tag}</Badge>
                      ))}
                    </HStack>
                  )}
                  
                  <Divider my={2} />
                  
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm" fontFamily={language === 'en' ? "bodoni" : "inherit"}>{t('chatAbout')}</Heading>
                      <Button 
                        size="sm" 
                        leftIcon={<StarIcon />} 
                        colorScheme="brand"
                        onClick={generateAiAnalysis}
                        isLoading={isAnalyzing}
                      >
                        {t('chatAbout')}
                      </Button>
                    </Flex>
                    
                    {aiAnalysis ? (
                      <Box 
                        p={3} 
                        borderRadius="xl" 
                        position="relative"
                        bg="rgba(255, 255, 255, 0.3)"
                        border="1px solid rgba(255, 255, 255, 0.2)"
                        boxShadow="sm"
                      >
                        <Text whiteSpace="pre-wrap">{aiAnalysis}</Text>
                      </Box>
                    ) : (
                      <Text color="neutrals.800" fontSize="sm">
                        {t('clickChat')}
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
                  {t('edit')}
                </Button>
                <Button 
                  variant="glass" 
                  mr={3}
                  onClick={handleLike}
                  aria-label={t('like')}
                  color={isLiked ? "red.500" : "neutrals.800"}
                  _hover={{ color: isLiked ? "red.600" : "brand.500" }}
                >
                  <span style={{ fontSize: "1.0rem", marginRight: "4px" }}>❤️</span>
                  {isLiked ? t('liked') : t('like')}
                </Button>
                <Button variant="glass" onClick={onDetailClose}>
                  {t('close')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* 设置模态框 */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(10px)" />
        <ModalContent
          bg="rgba(255, 255, 255, 0.85)"
          borderRadius="xl"
          boxShadow="xl"
          border="1px solid rgba(255, 255, 255, 0.3)"
          backdropFilter="blur(10px)"
        >
          <ModalHeader fontWeight="bold" color="gray.700" fontFamily={language === 'en' ? "bodoni" : "inherit"}>{t('settings')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Heading size="sm" color="gray.700" fontFamily={language === 'en' ? "bodoni" : "inherit"}>{t('diaryReminder')}</Heading>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="reminder-toggle" mb="0" color="gray.700" fontWeight="medium">
                  {t('enableReminder')}
                </FormLabel>
                <Switch 
                  id="reminder-toggle" 
                  isChecked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                />
              </FormControl>
              
              <FormControl isDisabled={!reminderEnabled}>
                <FormLabel>{t('reminderTime')}</FormLabel>
                <Input 
                  type="time" 
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  bg="rgba(255, 255, 255, 0.3)"
                />
              </FormControl>

              <Divider />
              
              <Heading size="sm" fontFamily={language === 'en' ? "bodoni" : "inherit"}>{t('accountInfo')}</Heading>
              
              <FormControl>
                <FormLabel>{t('username')}</FormLabel>
                <Input 
                  value={user?.name || ''} 
                  onChange={(e) => setUser(prev => prev ? {...prev, name: e.target.value} : null)}
                  bg="rgba(255, 255, 255, 0.3)"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>{t('email')}</FormLabel>
                <Input 
                  value={user?.email || ''} 
                  isReadOnly
                  bg="rgba(255, 255, 255, 0.2)"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>{t('userId')}</FormLabel>
                <Input 
                  value={user?.id || ''} 
                  isReadOnly
                  bg="rgba(255, 255, 255, 0.2)"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSettingsClose}>
              {t('cancel')}
            </Button>
            <Button colorScheme="teal" onClick={saveSettings}>
              {t('saveSettings')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );

  // 使用壁纸背景包装应用内容
  return (
    <ChakraProvider theme={theme}>
      <CustomStyles />
      <WallpaperBackground enablePullToRefresh={isLoggedIn}>
        {isLoggedIn ? renderMainApp() : (
          <LoginPage 
            language={language} 
            toggleLanguage={toggleLanguage}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            registerForm={registerForm}
            setRegisterForm={setRegisterForm}
            isRegistering={isRegistering}
            setIsRegistering={setIsRegistering}
            handleLogin={handleLogin}
            handleRegister={handleRegister}
            t={t as (key: any) => string}
          />
        )}
      </WallpaperBackground>
    </ChakraProvider>
  );
}

export default App;
