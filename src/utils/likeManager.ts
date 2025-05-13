import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import { UseToastOptions } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';

interface LikeData {
  analysisId: string;
  userId: string;
  diaryId: string;
  analysis: string;
  timestamp: string;
}

interface HandleLikeParams {
  isLiked: boolean;
  selectedDiary: {
    id: string;
  } | null;
  aiAnalysis: string;
  analysisId: string;
  userId: string;
  toast: (options: UseToastOptions) => void;
}

interface LoadLikedAnalysisParams {
  diaryId: string;
  userId: string;
  setAiAnalysis: Dispatch<SetStateAction<string>>;
  setAnalysisId: Dispatch<SetStateAction<string>>;
  setIsLiked: Dispatch<SetStateAction<boolean>>;
  toast: (options: UseToastOptions) => void;
}

/**
 * 保存点赞数据到数据库
 * @param analysisId - 分析ID
 * @param userId - 用户ID
 * @param diaryId - 日记ID
 * @param analysis - AI分析内容
 * @returns Promise<void>
 */
export const saveLikeToDatabase = async (
  analysisId: string,
  userId: string,
  diaryId: string,
  analysis: string
): Promise<void> => {
  if (!userId || !diaryId || !analysisId) {
    throw new Error('Missing required data');
  }

  const likeData: LikeData = {
    analysisId,
    userId,
    diaryId,
    analysis,
    timestamp: new Date().toISOString()
  };

  const userLikeDoc = doc(db, `users/${userId}/likes/${analysisId}`);
  await setDoc(userLikeDoc, likeData);
};

/**
 * 检查用户是否已经对该 analysisId 点过赞
 * @param userId - 用户ID
 * @param analysisId - 分析ID
 * @returns Promise<boolean> - 返回是否已点赞
 */
export const hasUserLikedAnalysis = async (userId: string, analysisId: string): Promise<boolean> => {
  if (!userId || !analysisId) return false;
  const likeDocRef = doc(db, `users/${userId}/likes/${analysisId}`);
  const likeDocSnap = await getDoc(likeDocRef);
  return likeDocSnap.exists();
};

/**
 * 处理点赞操作
 * @param params - 处理点赞所需的参数
 * @returns Promise<boolean> - 返回点赞是否成功
 */
export const handleLike = async ({
  selectedDiary,
  aiAnalysis,
  analysisId,
  userId,
  toast
}: HandleLikeParams): Promise<boolean> => {
  if (!selectedDiary || !aiAnalysis) {
    toast({
      title: '请先启用聊一下',
      description: '生成AI分析后才能点赞',
      status: 'warning',
      duration: 3000,
      isClosable: true,
    });
    return false;
  }

  // 检查是否已点赞
  const alreadyLiked = await hasUserLikedAnalysis(userId, analysisId);
  if (alreadyLiked) {
    toast({
      title: '已点赞',
      description: '您已经点过赞了',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    return false;
  }

  try {
    await saveLikeToDatabase(
      analysisId,
      userId,
      selectedDiary.id,
      aiAnalysis
    );
    toast({
      title: 'Saved',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    return true;
  } catch (error) {
    console.error('Failed to save', error);
    
    if (error instanceof Error && error.message.includes('permission-denied')) {
      toast({
        title: '权限错误',
        description: '请检查 Firestore 规则设置',
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
    return false;
  }
};

/**
 * 加载用户已点赞的分析
 * @param params - 加载点赞分析所需的参数
 */
export const loadLikedAnalysis = async ({
  diaryId,
  userId,
  setAiAnalysis,
  setAnalysisId,
  setIsLiked,
  toast
}: LoadLikedAnalysisParams): Promise<void> => {
  try {
    if (!userId) return;
    
    // 首先尝试从用户特定的集合中查询
    let querySnapshot;
    
    try {
      // 查询用户特定路径
      const userLikesRef = collection(db, `users/${userId}/likes`);
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
      if (pathError instanceof Error && pathError.message.includes('index')) {
        console.error('Firestore索引错误:', pathError.message);
        
        // 从错误消息中提取创建索引的URL（如果有）
        const urlMatch = pathError.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
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
        return;
      }
      
      // 如果用户特定路径失败，尝试公共集合
      const likesRef = collection(db, 'likes');
      const publicQuery = query(
        likesRef,
        where('userId', '==', userId),
        where('diaryId', '==', diaryId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      try {
        querySnapshot = await getDocs(publicQuery);
        console.log('从公共路径查询点赞记录');
      } catch (publicError) {
        // 检查是否是索引错误
        if (publicError instanceof Error && publicError.message.includes('index')) {
          console.error('Firestore索引错误:', publicError.message);
          
          // 从错误消息中提取创建索引的URL（如果有）
          const urlMatch = publicError.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
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
          return;
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