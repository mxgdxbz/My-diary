#Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
from flask import jsonify
import os
import json
import openai
import logging
from dotenv import load_dotenv

# 初始化Firebase应用
initialize_app()

# 使用标准日志库
logging.basicConfig(level=logging.INFO)

# 获取Firestore数据库实例
db = firestore.client()

def get_openai_api_key():
    """获取 OpenAI API 密钥（优先使用 Secret Manager，本地开发则使用环境变量）"""
    # 检查是否在本地开发环境
    if os.environ.get('FUNCTIONS_EMULATOR') == 'true':
        # 本地开发环境，使用环境变量
        load_dotenv()  # 加载 .env 文件中的环境变量
        key = os.environ.get("OPENAI_API_KEY")
        if key:
            return key
        else:
            logging.error("本地开发环境中未设置 OPENAI_API_KEY 环境变量")
            return None
    else:
        # 生产环境，优先使用环境变量
        key = os.environ.get("OPENAI_API_KEY")
        if key:
            logging.info("从环境变量获取到 API 密钥")
            return key
            
        # 尝试使用 Secret Manager
        try:
            logging.info("尝试从 Secret Manager 获取 API 密钥")
            # 尝试导入 google-cloud-secretmanager
            try:
                from google.cloud import secretmanager
            except ImportError:
                logging.warning("google-cloud-secretmanager 未安装，无法使用 Secret Manager")
                return None
                
            # 尝试从环境变量获取项目ID，如果没有则使用默认值
            project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "diary-darling")
            logging.info(f"使用项目ID: {project_id} 访问 Secret Manager")
            
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{project_id}/secrets/openai-api-key/versions/latest"
            response = client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")
        except Exception as e:
            logging.error(f"无法获取 OpenAI API 密钥: {e}")
            return None

# 获取 API 密钥
openai_api_key = get_openai_api_key()

# 检查 API 密钥是否有效
if not openai_api_key:
    logging.error("无法获取 OpenAI API 密钥，请检查 Secret Manager 或环境变量配置")

@https_fn.on_request(cors=True)
def analyzeDiary(request):
    """分析用户日记并提供个性化回复"""
    # 处理OPTIONS请求（CORS预检）
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',  # 最好限制为您的应用域名
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    # 处理主请求
    if request.method != 'POST':
        return ('只允许POST方法', 405)
    
    # 改进验证逻辑 - 检查授权头
    auth_header = request.headers.get('Authorization', '')
    if not auth_header:
        logging.error("缺少授权头")
        return ('未授权访问', 401)
    
    # 提取并记录令牌信息（不打印完整令牌）
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]  # 提取令牌
        logging.info(f"收到令牌: {token[:10]}...")
    else:
        logging.error("授权头格式不正确")
    
    # 处理请求数据
    try:
        request_json = request.get_json(silent=True)
        if not request_json:
            logging.error("未提供JSON数据")
            return ('未提供JSON数据', 400)
        
        # 提取所有必要字段（确保与前端匹配）
        current_diary = request_json.get('diary', '')
        diary_id = request_json.get('diaryId', '')  # 确保提取 diaryId
        date = request_json.get('date', '')  # 确保提取 date
        user_id = request_json.get('userId', '')
        mood = request_json.get('mood', '')
        tags = request_json.get('tags', [])
        previous_diaries = request_json.get('previousDiaries', [])
        
        if not current_diary or not user_id:
            logging.error(f"缺少日记内容或用户ID: diary={bool(current_diary)}, userId={bool(user_id)}")
            return ('缺少日记内容或用户ID', 400)
        
        logging.info(f"收到用户 {user_id} 的日记分析请求")
    except Exception as e:
        logging.error(f"处理请求数据错误: {e}")
        return (f'无效的请求数据: {str(e)}', 400)
    
    # 生成个性化回复
    try:
        # 使用OpenAI API生成回复
        # 获取最新的API密钥（避免长时间运行实例可能的过期问题）
        current_api_key = get_openai_api_key()
        if not current_api_key:
            logging.error("无法获取 OpenAI API 密钥，请检查 Secret Manager 或环境变量配置")
            return ('服务器配置错误: 无法获取API密钥', 500)
            
        openai.api_key = current_api_key
        
        # 添加调试日志
        logging.info("OpenAI API密钥已配置")
        
        # 提取日记的时间顺序和情感
        diary_summary = summarize_previous_diaries(previous_diaries)
        emotion = get_emotion_from_mood(mood)
        
        # 构建提示
        prompt = create_prompt(current_diary, diary_summary, emotion, tags)
        
        logging.info(f"调用OpenAI API, 提示长度: {len(prompt)}")
        
        # 调用OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是用户的日记伙伴，名叫「日记精灵」。提供友好、积极、像好朋友一样的回复。你的回复应该：1) 表现出理解和共鸣 2) 给予适当的鼓励和支持 3) 根据用户的心情和内容，自然地融入1-2个与日记主题相关的书籍、电影、音乐或活动推荐 4) 使用轻松亲切的语气，就像朋友间的对话。直接称呼用户为'你'，不要使用'您'等正式称呼。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=600,
            top_p=0.95,
            frequency_penalty=0.5,
            presence_penalty=0.5,
        )
        
        analysis = response.choices[0].message['content'].strip()
        
        # 记录成功响应
        logging.info(f"成功为用户 {user_id} 生成日记分析, 长度: {len(analysis)}")
        
        # 返回结果
        return (json.dumps({"analysis": analysis}), 200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        })
    except Exception as e:
        logging.error(f"生成回复时出错: {e}")
        return (f'分析日记错误: {str(e)}', 500)

def get_emotion_from_mood(mood):
    """根据表情判断情感"""
    positive_moods = ['😊', '😍', '🥳', '😌']
    neutral_moods = ['🤔', '😴']
    negative_moods = ['😢', '😡', '🤒', '🥺']
    
    if mood in positive_moods:
        return "积极"
    elif mood in neutral_moods:
        return "中性"
    elif mood in negative_moods:
        return "消极"
    else:
        return "混合"

def summarize_previous_diaries(diaries):
    """总结用户之前的日记"""
    if not diaries:
        return "无历史日记"
    
    # 按日期排序，最近的排在前面
    sorted_diaries = sorted(diaries, key=lambda x: x.get('date', ''), reverse=True)
    
    # 取最近的5篇日记
    recent_diaries = sorted_diaries[:5]
    
    summary = []
    for diary in recent_diaries:
        content = diary.get('content', '').strip()
        date = diary.get('date', '')
        mood = diary.get('mood', '')
        
        # 截断内容(如果太长)
        if len(content) > 100:
            content = content[:97] + "..."
        
        summary.append(f"日期: {date}, 心情: {mood}, 内容: {content}")
    
    return "\n".join(summary)

def create_prompt(current_diary, diary_summary, emotion, tags):
    """创建提示"""
    tags_text = "无标签" if not tags else ", ".join([f"#{tag}" for tag in tags])
    
    return f"""
    用户今天的日记内容: {current_diary}
    
    用户今天的情绪: {emotion}
    
    用户使用的标签: {tags_text}
    
    用户之前的日记摘要: 
    {diary_summary}
    
    请根据以上信息，生成一个友好、温暖的回复，就像朋友之间的对话。
    在回复中，请考虑用户的情绪和日记内容，表达理解和共鸣。
    可以自然地融入相关的书籍、电影、音乐或活动的推荐，这些推荐应与用户的兴趣和当前情绪相符。
    确保回复是积极的，支持性的，并且个性化的。
    """