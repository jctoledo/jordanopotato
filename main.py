import os
import dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from langchain.callbacks import get_openai_callback
from jordan_prompt import template as jordano_template
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationSummaryBufferMemory
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
from fastapi.middleware.cors import CORSMiddleware
import uuid

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
    allow_origins=["https://jordanopotato-98a1485ac275.herokuapp.com"],  # In production, specify the allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the Pydantic models for request and response
class MessageRequest(BaseModel):
    message: str
    session_id: str

class MessageResponse(BaseModel):
    reply: str
    session_id: str

# Dictionary to store conversation sessions
conversations = {}


app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")


# Models for handling prompt updates and conversation summaries
class PromptUpdateRequest(BaseModel):
    new_prompt: str

class SummaryResponse(BaseModel):
    summary: str

# Store the current prompt globally
current_prompt = jordano_template

@app.get("/prompt", response_model=str)
async def get_prompt():
    return current_prompt

@app.post("/prompt", response_model=str)
async def update_prompt(request: PromptUpdateRequest):
    global current_prompt
    current_prompt = request.new_prompt
    return current_prompt

@app.get("/summary/{session_id}", response_model=SummaryResponse)
async def get_summary(session_id: str):
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Session not found.")
    conversation = conversations[session_id]
    return SummaryResponse(summary=conversation.memory.load_memory_variables({})["history"])

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


# Endpoint to handle chat messages
@app.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    try:
        # Check if the session_id exists, else create a new conversation
        if request.session_id in conversations:
            conversation = conversations[request.session_id]
        else:
            # Create a new conversation
            llm = ChatOpenAI(
                openai_api_key=MY_OPENAI_KEY,
                model_name='gpt-4',
                temperature=0.65,
                max_tokens=5000
            )
            summary_memory = ConversationSummaryBufferMemory(llm=llm)
            jordano_prompt = PromptTemplate(
                input_variables=["history", "input"],
                template=jordano_template
            )
            conversation = ConversationChain(
                prompt=jordano_prompt,
                llm=llm,
                verbose=True,
                memory=summary_memory
            )
            conversations[request.session_id] = conversation

        # Get the AI response
        with get_openai_callback() as cb:
            ai_reply = conversation.predict(input=request.message)
        return MessageResponse(reply=ai_reply, session_id=request.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))