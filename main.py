import sqlite3
import os
import dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain.callbacks import get_openai_callback
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationSummaryBufferMemory
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
from fastapi.responses import FileResponse
from jordan_prompt import template as default_prompt

# Load environment variables
dotenv.load_dotenv()

# Fetch the OpenAI API key from the environment variable
MY_OPENAI_KEY = os.getenv("MY_OPENAI_KEY")

# Check if the API key is set
if MY_OPENAI_KEY is None:
    raise ValueError("Please set the MY_OPENAI_KEY environment variable.")

# Initialize the FastAPI app
app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://jordanopotato-98a1485ac275.herokuapp.com"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
import psycopg2
from psycopg2.extras import RealDictCursor

# Fetch DATABASE_URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

def init_db():
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    # Modify the users table to include a prompt column
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            prompt TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            user_id INTEGER PRIMARY KEY,
            summary TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

init_db()

# Pydantic models
class LoginRequest(BaseModel):
    username: str

class MessageRequest(BaseModel):
    message: str
    user_id: int

class MessageResponse(BaseModel):
    reply: str
    user_id: int

class LoginResponse(BaseModel):
    user_id: int
    summary: str

# Memory storage per user
conversations = {}
def get_user_by_id(user_id: int):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def get_user_id(username: str):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE name = %s", (username,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def create_user(username: str):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (name, prompt) VALUES (%s, %s) RETURNING id", (username, default_prompt))
    user_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()
    return user_id

def get_or_create_user(username: str):
    user_id = get_user_id(username)
    if not user_id:
        user_id = create_user(username)
    return user_id

def get_conversation_summary(user_id: int):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    cursor.execute("SELECT summary FROM conversations WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else ""

def update_conversation_summary(user_id: int, summary: str):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conversations (user_id, summary) VALUES (%s, %s)
        ON CONFLICT (user_id) DO UPDATE SET summary = EXCLUDED.summary
    """, (user_id, summary))
    conn.commit()
    cursor.close()
    conn.close()

def get_user_prompt(user_id: int):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    cursor.execute("SELECT prompt FROM users WHERE id = %s", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def update_user_prompt(user_id: int, new_prompt: str):
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET prompt = %s WHERE id = %s", (new_prompt, user_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

# Models for handling prompt updates and conversation summaries
class PromptUpdateRequest(BaseModel):
    new_prompt: str

class SummaryResponse(BaseModel):
    summary: str

# Store the current prompt globally
current_prompt = default_prompt

@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    user_id = get_or_create_user(request.username)
    summary = get_conversation_summary(user_id)
    return {"user_id": user_id, "summary": summary}

@app.get("/prompt/{user_id}")
def get_prompt(user_id: int):
    prompt = get_user_prompt(user_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return prompt

@app.post("/prompt/{user_id}")
def update_prompt(user_id: int, request: PromptUpdateRequest):
    success = update_user_prompt(user_id, request.new_prompt)
    if not success:
        raise HTTPException(status_code=404, detail="User not found.")
    return request.new_prompt

@app.get("/summary/{user_id}", response_model=SummaryResponse)
def get_summary(user_id: int):
    summary = get_conversation_summary(user_id)
    if summary is None:
        raise HTTPException(status_code=404, detail="Summary not found.")
    return SummaryResponse(summary=summary)

# Serve index.html on the root and any other paths
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    file_path = os.path.join('frontend', 'build', full_path)
    if os.path.exists(file_path) and not os.path.isdir(file_path):
        return FileResponse(file_path)
    else:
        return FileResponse(os.path.join('frontend', 'build', 'index.html'))

@app.get("/")
async def read_index():
    return FileResponse('frontend/build/index.html')


@app.post("/chat", response_model=MessageResponse)
def chat(request: MessageRequest):
    user_id = request.user_id
    if not user_id or not get_user_by_id(user_id):
        raise HTTPException(status_code=401, detail="Unauthorized. Please log in.")

    if user_id not in conversations:
        # Get the user's prompt
        prompt_template = get_user_prompt(user_id)
        if not prompt_template:
            # If user prompt not found, use default
            prompt_template = default_prompt

        llm = ChatOpenAI(
            openai_api_key=MY_OPENAI_KEY,
            model_name='gpt-4',
            temperature=0.65,
        )
        summary_memory = ConversationSummaryBufferMemory(llm=llm)
        jordano_prompt = PromptTemplate(
            input_variables=["history", "input"],
            template=default_prompt
        )
        conversations[user_id] = ConversationChain(
            prompt=jordano_prompt,
            llm=llm,
            verbose=True,
            memory=summary_memory
        )

    conversation = conversations[user_id]
    with get_openai_callback() as cb:
        reply = conversation.predict(input=request.message)
        # Correctly retrieve the summary
        summary = conversation.memory.load_memory_variables({})['history']
        update_conversation_summary(user_id, summary)
    return {"reply": reply, "user_id": user_id}

