import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..database.session import get_db
from ..database.models import ChatHistory
from ..services.llm_service import LLMService
from ..schemas.schemas import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
def post_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Interacts with EcoBot Sustainability Assistant.
    Uses Google Gemini API when configured, or transparently
    falls back to the grounded domain intelligence engine.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty.",
        )

    # Call LLM service
    response = LLMService.chat(payload.message, payload.session_id, db)

    # Persist in ChatHistory
    user_record = ChatHistory(
        session_id=payload.session_id,
        role="user",
        message=payload.message,
    )
    bot_record = ChatHistory(
        session_id=payload.session_id,
        role="assistant",
        message=response["answer"],
        intent=response.get("intent"),
        suggested_questions=json.dumps(response.get("suggested_questions", [])),
    )
    db.add(user_record)
    db.add(bot_record)
    db.commit()

    return ChatResponse(
        answer=response["answer"],
        intent=response.get("intent", "sustainability_query"),
        suggested_questions=response.get("suggested_questions", []),
        model_used=response.get("model_used", "EcoMind Engine"),
        data_grounded=True,
    )


@router.get("/history", response_model=List[Dict[str, Any]])
def get_chat_history(
    session_id: str = Query(default="default"),
    limit: int = Query(default=30),
    db: Session = Depends(get_db),
):
    """Retrieves conversation history for the session."""
    chats = (
        db.query(ChatHistory)
        .filter(ChatHistory.session_id == session_id)
        .order_by(ChatHistory.created_at.asc())
        .limit(limit)
        .all()
    )

    history = []
    for c in chats:
        suggested = []
        if c.suggested_questions:
            try:
                suggested = json.loads(c.suggested_questions)
            except Exception:
                pass
        history.append({
            "id": c.id,
            "role": c.role,
            "message": c.message,
            "intent": c.intent,
            "suggested_questions": suggested,
            "created_at": c.created_at.isoformat(),
        })

    return history


@router.delete("/history")
def clear_chat_history(
    session_id: str = Query(default="default"),
    db: Session = Depends(get_db),
):
    """Clears conversation history for the session."""
    db.query(ChatHistory).filter(ChatHistory.session_id == session_id).delete()
    db.commit()
    return {"message": "Chat history cleared successfully."}
