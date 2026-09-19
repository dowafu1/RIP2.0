from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Auth schemas
class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    token: str

    class Config:
        from_attributes = True


# Clothing item schemas
class ClothingItemCreate(BaseModel):
    name: str
    category: str
    price: float = 0
    size: str = "M"
    color: str = ""
    is_bought: bool = False


class ClothingItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    size: Optional[str] = None
    color: Optional[str] = None
    is_bought: Optional[bool] = None


class ClothingItemResponse(BaseModel):
    id: int
    name: str
    category: str
    price: float
    size: str
    color: str
    is_bought: bool
    created_at: str

    class Config:
        from_attributes = True


# Chat schemas
class ChatMessageCreate(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    username: str
    message: str
    timestamp: str

    class Config:
        from_attributes = True
