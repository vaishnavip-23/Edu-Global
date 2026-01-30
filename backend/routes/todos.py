from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from models import User, Todo
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/todos", tags=["todos"])


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    priority: Optional[str] = Field("medium", pattern="^(low|medium|high)$", description="Task priority")
    category: Optional[str] = Field("general", max_length=100, description="Task category")
    university_id: Optional[str] = Field(None, max_length=50, description="University ID if task is university-specific")


class TodoUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed)$", description="Task status")
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Task title")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$", description="Task priority")


@router.get("/")
async def get_todos(
    status: Optional[str] = None,
    university_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get user's to-do list, optionally filtered by university_id (for Application Preparation)."""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        query = db.query(Todo).filter(Todo.user_id == user.id)

        if status:
            query = query.filter(Todo.status == status)
        if university_id:
            query = query.filter(Todo.university_id == university_id)

        todos = query.order_by(Todo.created_at.desc()).all()

        return {
            "status": "success",
            "count": len(todos),
            "todos": [
                {
                    "id": todo.id,
                    "title": todo.title,
                    "description": todo.description,
                    "status": todo.status,
                    "priority": todo.priority,
                    "category": todo.category,
                    "university_id": todo.university_id,
                    "stage": todo.stage,
                    "created_at": todo.created_at.isoformat(),
                }
                for todo in todos
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching todos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_todo(
    todo_data: TodoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new to-do task"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        todo = Todo(
            user_id=user.id,
            title=todo_data.title,
            description=todo_data.description,
            priority=todo_data.priority,
            category=todo_data.category,
            university_id=todo_data.university_id,
            stage=user.current_stage,
        )
        db.add(todo)
        db.commit()
        db.refresh(todo)

        return {
            "status": "success",
            "message": "Task created",
            "todo": {
                "id": todo.id,
                "title": todo.title,
                "description": todo.description,
                "status": todo.status,
                "priority": todo.priority,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating todo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{todo_id}")
async def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update a to-do task"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        todo = db.query(Todo).filter(
            Todo.id == todo_id,
            Todo.user_id == user.id
        ).first()

        if not todo:
            raise HTTPException(status_code=404, detail="Task not found")

        if todo_update.status:
            todo.status = todo_update.status
        if todo_update.title:
            todo.title = todo_update.title
        if todo_update.description:
            todo.description = todo_update.description
        if todo_update.priority:
            todo.priority = todo_update.priority

        db.commit()

        return {
            "status": "success",
            "message": "Task updated",
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating todo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{todo_id}")
async def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a to-do task"""
    try:
        clerk_user_id = current_user["clerk_user_id"]

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        todo = db.query(Todo).filter(
            Todo.id == todo_id,
            Todo.user_id == user.id
        ).first()

        if not todo:
            raise HTTPException(status_code=404, detail="Task not found")

        db.delete(todo)
        db.commit()

        return {
            "status": "success",
            "message": "Task deleted",
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting todo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
