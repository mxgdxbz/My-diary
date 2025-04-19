import React from 'react';
import { 
  Box, VStack, Heading, Input, Button, 
  FormControl, FormLabel, 
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Text, Center
} from '@chakra-ui/react';

// 语言配置类型
type Language = 'zh' | 'en';

// 导入翻译类型，与App.tsx中保持一致
type TranslationKeys = 'myDiary' | 'welcome' | 'consecutiveDays' | 'days' | 'writeDiary' | 
  'viewDiary' | 'moodCalendar' | 'date' | 'mood' | 'content' | 'addTag' | 'inputTag' | 'add' | 
  'addImage' | 'save' | 'noDiaries' | 'allDiaries' | 'tag' | 'close' | 'edit' | 'like' | 'liked' | 
  'diaryReminder' | 'enableReminder' | 'reminderTime' | 'accountInfo' | 'username' | 'email' | 
  'userId' | 'cancel' | 'saveSettings' | 'logout' | 'settings' | 'chatAbout' | 'editingDiary' | 
  'cancelEdit' | 'diaryDate' | 'tagTip' | 'contentPlaceholder' | 'previousMonth' | 'nextMonth' | 
  'today' | 'calendarTip' | 'clickChat' | 'recordLife' | 'login' | 'register' | 'emailPlaceholder' | 
  'passwordPlaceholder' | 'usernamePlaceholder' | 'confirmPassword' | 'confirmPasswordPlaceholder' | 
  'emailInput' | 'emailInputPlaceholder' | 'passwordInputPlaceholder' | 'password' | 'sun' | 'mon' | 
  'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'goalPlaceholder' | 'share';

interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LoginPageProps {
  language: Language;
  toggleLanguage: () => void;
  loginForm: LoginForm;
  setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>;
  registerForm: RegisterForm;
  setRegisterForm: React.Dispatch<React.SetStateAction<RegisterForm>>;
  isRegistering: boolean;
  setIsRegistering: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogin: () => Promise<void>;
  handleRegister: () => Promise<void>;
  t: (key: TranslationKeys) => string;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  language, 
  toggleLanguage, 
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  isRegistering,
  setIsRegistering,
  handleLogin,
  handleRegister,
  t
}) => {
  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        width="90%"
        maxWidth="450px"
        p={8}
        borderRadius="xl"
        bg="rgba(255, 255, 255, 0.2)"
        boxShadow="xl"
        border="1px solid rgba(255, 255, 255, 0.3)"
      >
        <VStack spacing={6} align="stretch">
          <Center>
            <Heading 
              as="h1" 
              size="xl" 
              textAlign="center" 
              fontFamily={language === 'zh' ? "'Comic Sans MS', cursive" : "forte"} 
              color="brand.500"
            >
              {t('myDiary')}
            </Heading>
          </Center>
          <Text textAlign="center" color="neutrals.800">{t('recordLife')}</Text>
          
          {/* 添加语言切换按钮 */}
          <Center>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleLanguage}
              color="brand.500"
              _hover={{ color: "brand.600" }}
              transition="all 0.3s ease"
              fontWeight="medium"
            >
              {language === 'zh' ? 'Switch to English' : '切换到中文'}
            </Button>
          </Center>
      
          <Tabs variant="soft-rounded" colorScheme="brand" index={isRegistering ? 1 : 0}>
            <TabList mb="1em">
              <Tab width="50%" onClick={() => setIsRegistering(false)}>{t('login')}</Tab>
              <Tab width="50%" onClick={() => setIsRegistering(true)}>{t('register')}</Tab>
            </TabList>
            <TabPanels>
              {/* 登录表单 */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>{t('email')}</FormLabel>
                    <Input 
                      type="email"
                      placeholder={t('emailPlaceholder')} 
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      bg="rgba(255, 255, 255, 0.3)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      _hover={{ borderColor: "brand.500" }}
                      _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>{t('password')}</FormLabel>
                    <Input 
                      type="password" 
                      placeholder={t('passwordPlaceholder')} 
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      bg="rgba(255, 255, 255, 0.3)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      _hover={{ borderColor: "brand.500" }}
                      _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                    />
                  </FormControl>
                  
                  <Button colorScheme="teal" width="100%" onClick={handleLogin} mt={2}>
                    {t('login')}
                  </Button>
                </VStack>
              </TabPanel>
              
              {/* 注册表单 */}
              <TabPanel>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>{t('username')}</FormLabel>
                    <Input 
                      placeholder={t('usernamePlaceholder')} 
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                      bg="rgba(255, 255, 255, 0.3)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      _hover={{ borderColor: "brand.500" }}
                      _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>{t('email')}</FormLabel>
                    <Input 
                      type="email" 
                      placeholder={t('emailInputPlaceholder')} 
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      bg="rgba(255, 255, 255, 0.3)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      _hover={{ borderColor: "brand.500" }}
                      _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>{t('password')}</FormLabel>
                    <Input 
                      type="password" 
                      placeholder={t('passwordInputPlaceholder')} 
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      bg="rgba(255, 255, 255, 0.3)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      _hover={{ borderColor: "brand.500" }}
                      _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>{t('confirmPassword')}</FormLabel>
                    <Input 
                      type="password" 
                      placeholder={t('confirmPasswordPlaceholder')} 
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                      bg="rgba(255, 255, 255, 0.3)"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      _hover={{ borderColor: "brand.500" }}
                      _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #EA6C3C" }}
                    />
                  </FormControl>
                  
                  <Button colorScheme="teal" width="100%" onClick={handleRegister} mt={2}>
                    {t('register')}
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </Box>
  );
};

export default LoginPage; 