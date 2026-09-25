from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.services.vector_search_service import search_similar_chunks


router = APIRouter(
    prefix="/search",
    tags=["Semantic Search"],
)


class SearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=2,
        max_length=1000,
    )

    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
    )

    document_ids: list[int] | None = Field(
        default=None,
        description=(
            "Optional list of document IDs to restrict "
            "semantic search to."
        ),
    )


@router.post("/")
def semantic_search(
    request: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        results = search_similar_chunks(
            db=db,
            query=request.query,
            user_id=current_user.id,
            top_k=request.top_k,
            document_ids=request.document_ids,
        )

        return {
            "query": request.query,
            "document_ids": request.document_ids,
            "results": results,
            "result_count": len(results),
        }

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Semantic search failed.",
        ) from error