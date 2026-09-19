from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, Base
from models import User, ClothingItem, ChatMessage
from schemas import (
    UserCreate, UserResponse,
    ClothingItemCreate, ClothingItemUpdate, ClothingItemResponse,
    ChatMessageResponse,
)
from auth import (
    get_password_hash, verify_password, create_access_token, get_current_user
)
from chat import manager, get_username_from_token

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Гардероб API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ AUTH ROUTES ============

@app.post("/api/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    # Create user
    user = User(
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.username})
    return UserResponse(id=user.id, username=user.username, token=token)


@app.post("/api/auth/login", response_model=UserResponse)
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")

    token = create_access_token(data={"sub": user.username})
    return UserResponse(id=user.id, username=user.username, token=token)


# ============ CLOTHING ITEMS CRUD ============

@app.get("/api/items", response_model=List[ClothingItemResponse])
def get_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    return [
        ClothingItemResponse(
            id=item.id,
            name=item.name,
            category=item.category,
            price=item.price,
            size=item.size,
            color=item.color,
            is_bought=item.is_bought,
            created_at=str(item.created_at.date()) if item.created_at else ""
        )
        for item in items
    ]


@app.get("/api/items/{item_id}", response_model=ClothingItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id,
        ClothingItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    return ClothingItemResponse(
        id=item.id, name=item.name, category=item.category,
        price=item.price, size=item.size, color=item.color,
        is_bought=item.is_bought,
        created_at=str(item.created_at.date()) if item.created_at else ""
    )


@app.post("/api/items", response_model=ClothingItemResponse)
def create_item(item_data: ClothingItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = ClothingItem(
        user_id=current_user.id,
        name=item_data.name,
        category=item_data.category,
        price=item_data.price,
        size=item_data.size,
        color=item_data.color,
        is_bought=item_data.is_bought,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ClothingItemResponse(
        id=item.id, name=item.name, category=item.category,
        price=item.price, size=item.size, color=item.color,
        is_bought=item.is_bought,
        created_at=str(item.created_at.date()) if item.created_at else ""
    )


@app.put("/api/items/{item_id}", response_model=ClothingItemResponse)
def update_item(item_id: int, item_data: ClothingItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id,
        ClothingItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Предмет не найден")

    update_data = item_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return ClothingItemResponse(
        id=item.id, name=item.name, category=item.category,
        price=item.price, size=item.size, color=item.color,
        is_bought=item.is_bought,
        created_at=str(item.created_at.date()) if item.created_at else ""
    )


@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ClothingItem).filter(
        ClothingItem.id == item_id,
        ClothingItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Предмет не найден")

    db.delete(item)
    db.commit()
    return {"message": "Предмет удалён"}


# ============ CHAT ROUTES ============

@app.get("/api/chat/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(ChatMessage).order_by(ChatMessage.timestamp.desc()).limit(100).all()
    return [
        ChatMessageResponse(
            id=msg.id,
            username=msg.username,
            message=msg.message,
            timestamp=str(msg.timestamp) if msg.timestamp else ""
        )
        for msg in reversed(messages)
    ]


# ============ WEBSOCKET CHAT ============

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(default="")):
    username = get_username_from_token(token)
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                message_text = payload.get("message", "")
            except:
                message_text = data

            if message_text.strip():
                # Save to DB
                from database import SessionLocal
                db = SessionLocal()
                user = db.query(User).filter(User.username == username).first()
                if user:
                    chat_msg = ChatMessage(
                        user_id=user.id,
                        username=username,
                        message=message_text
                    )
                    db.add(chat_msg)
                    db.commit()
                    db.refresh(chat_msg)
                    msg_response = {
                        "id": chat_msg.id,
                        "username": chat_msg.username,
                        "message": chat_msg.message,
                        "timestamp": str(chat_msg.timestamp)
                    }
                else:
                    msg_response = {
                        "id": 0,
                        "username": username,
                        "message": message_text,
                        "timestamp": ""
                    }
                db.close()

                # Broadcast to all connected clients
                await manager.broadcast(msg_response)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


import json

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
