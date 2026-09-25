from datetime import date, datetime, time, timedelta, timezone



from fastapi import APIRouter, Depends, HTTPException, Query



from sqlalchemy import case, func, select



from sqlalchemy.orm import Session







from app.core.security import get_current_user



from app.db.database import get_db



from app.models.ai_usage import AIUsage



from app.models.conversation import Conversation



from app.models.document import Document



from app.models.document_chunk import DocumentChunk



from app.models.rag_request_log import RAGRequestLog



from app.models.user import User











router = APIRouter(



    prefix="/dashboard",



    tags=["Dashboard"],



)











@router.get("/")



def get_dashboard(



    db: Session = Depends(get_db),



    current_user: User = Depends(get_current_user),



):



    # -------------------------------------------------



    # Basic application statistics



    # -------------------------------------------------







    document_count = db.scalar(



        select(func.count(Document.id)).where(



            Document.user_id == current_user.id



        )



    ) or 0







    knowledge_chunk_count = db.scalar(

        select(func.count(DocumentChunk.id))

        .join(

            Document,

            DocumentChunk.document_id == Document.id,

        )

        .where(

            Document.user_id == current_user.id

        )

    ) or 0







    conversation_count = db.scalar(



        select(func.count(Conversation.id)).where(



            Conversation.user_id == current_user.id



        )



    ) or 0







    # -------------------------------------------------



    # AI usage / quota



    # -------------------------------------------------







    usage = db.scalar(



        select(AIUsage).where(



            AIUsage.user_id == current_user.id



        )



    )







    ai_queries = (



        usage.query_count



        if usage



        else 0



    )







    ai_query_limit = (



        usage.query_limit



        if usage



        else 1000



    )







    # -------------------------------------------------



    # RAG observability statistics



    # -------------------------------------------------







    rag_total_requests = db.scalar(



        select(



            func.count(RAGRequestLog.id)



        ).where(



            RAGRequestLog.user_id



            == current_user.id



        )



    ) or 0







    rag_successful_requests = db.scalar(



        select(



            func.count(RAGRequestLog.id)



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.status == "success",



        )



    ) or 0







    rag_failed_requests = db.scalar(



        select(



            func.count(RAGRequestLog.id)



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.status == "failed",



        )



    ) or 0







    avg_retrieval_time = db.scalar(



        select(



            func.avg(



                RAGRequestLog.retrieval_time_ms



            )



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.retrieval_time_ms



            .is_not(None),



        )



    )







    avg_generation_time = db.scalar(



        select(



            func.avg(



                RAGRequestLog.generation_time_ms



            )



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.generation_time_ms



            .is_not(None),



        )



    )







    avg_total_time = db.scalar(



        select(



            func.avg(



                RAGRequestLog.total_time_ms



            )



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.total_time_ms



            .is_not(None),



        )



    )







    avg_retrieved_chunks = db.scalar(



        select(



            func.avg(



                RAGRequestLog.retrieved_chunks



            )



        ).where(



            RAGRequestLog.user_id



            == current_user.id



        )



    )







    # -------------------------------------------------



    # Retrieval quality analytics



    # -------------------------------------------------







    avg_similarity = db.scalar(



        select(



            func.avg(



                RAGRequestLog.average_similarity



            )



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.average_similarity



            .is_not(None),



        )



    )







    avg_max_similarity = db.scalar(



        select(



            func.avg(



                RAGRequestLog.max_similarity



            )



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.max_similarity



            .is_not(None),



        )



    )







    low_quality_requests = db.scalar(



        select(



            func.count(RAGRequestLog.id)



        ).where(



            RAGRequestLog.user_id



            == current_user.id,



            RAGRequestLog.average_similarity



            .is_not(None),



            RAGRequestLog.average_similarity < 0.30,



        )



    ) or 0







    # -------------------------------------------------



    # Normalize numeric analytics values



    # -------------------------------------------------







    avg_retrieval_time = (



        round(float(avg_retrieval_time), 2)



        if avg_retrieval_time is not None



        else 0



    )







    avg_generation_time = (



        round(float(avg_generation_time), 2)



        if avg_generation_time is not None



        else 0



    )







    avg_total_time = (



        round(float(avg_total_time), 2)



        if avg_total_time is not None



        else 0



    )







    avg_retrieved_chunks = (



        round(float(avg_retrieved_chunks), 2)



        if avg_retrieved_chunks is not None



        else 0



    )







    avg_similarity = (



        round(float(avg_similarity), 4)



        if avg_similarity is not None



        else 0



    )







    avg_max_similarity = (



        round(float(avg_max_similarity), 4)



        if avg_max_similarity is not None



        else 0



    )







    # -------------------------------------------------



    # Retrieval quality status



    # -------------------------------------------------







    if avg_similarity == 0:



        retrieval_quality = "no_data"



    elif avg_similarity < 0.30:



        retrieval_quality = "low"



    elif avg_similarity < 0.50:



        retrieval_quality = "moderate"



    else:



        retrieval_quality = "good"







    # -------------------------------------------------



    # RAG success rate



    # -------------------------------------------------







    if rag_total_requests > 0:



        rag_success_rate = round(



            (



                rag_successful_requests



                / rag_total_requests



            ) * 100,



            2,



        )



    else:



        rag_success_rate = 0







    # -------------------------------------------------



    # Recent documents



    # -------------------------------------------------







    recent_documents = db.scalars(



        select(Document)



        .where(



            Document.user_id



            == current_user.id



        )



        .order_by(



            Document.created_at.desc()



        )



        .limit(5)



    ).all()







    # -------------------------------------------------



    # Recent RAG requests



    # -------------------------------------------------







    recent_rag_requests = db.scalars(



        select(RAGRequestLog)



        .where(



            RAGRequestLog.user_id



            == current_user.id



        )



        .order_by(



            RAGRequestLog.created_at.desc()



        )



        .limit(5)



    ).all()







    # -------------------------------------------------



    # Response



    # -------------------------------------------------







    return {



        "stats": {



            "documents": document_count,



            "knowledge_chunks": knowledge_chunk_count,



            "conversations": conversation_count,



            "ai_queries": ai_queries,



            "ai_query_limit": ai_query_limit,



        },







        "rag_analytics": {



            "total_requests": rag_total_requests,



            "successful_requests": (



                rag_successful_requests



            ),



            "failed_requests": rag_failed_requests,



            "success_rate": rag_success_rate,







            "average_retrieval_time_ms": (



                avg_retrieval_time



            ),







            "average_generation_time_ms": (



                avg_generation_time



            ),







            "average_total_time_ms": (



                avg_total_time



            ),







            "average_retrieved_chunks": (



                avg_retrieved_chunks



            ),







            "average_similarity": (



                avg_similarity



            ),







            "average_max_similarity": (



                avg_max_similarity



            ),







            "low_quality_requests": (



                low_quality_requests



            ),







            "retrieval_quality": (



                retrieval_quality



            ),



        },







        "recent_documents": [



            {



                "id": document.id,



                "filename": document.filename,



                "file_size": document.file_size,



                "status": document.status,



                "created_at": document.created_at,



            }



            for document in recent_documents



        ],







        "recent_rag_requests": [



            {



                "id": log.id,



                "conversation_id": (



                    log.conversation_id



                ),



                "question": log.question,



                "model_name": log.model_name,



                "retrieved_chunks": (



                    log.retrieved_chunks



                ),



                "retrieval_time_ms": (



                    log.retrieval_time_ms



                ),



                "generation_time_ms": (



                    log.generation_time_ms



                ),



                "total_time_ms": (



                    log.total_time_ms



                ),



                "average_similarity": (



                    log.average_similarity



                ),



                "max_similarity": (



                    log.max_similarity



                ),



                "status": log.status,



                "created_at": log.created_at,



            }



            for log in recent_rag_requests



        ],



    }





# -------------------------------------------------

# RAG request diagnostics

# -------------------------------------------------



@router.get("/rag-requests")

def get_rag_requests(

    limit: int = Query(20, ge=1, le=100),

    offset: int = Query(0, ge=0),

    start_date: date | None = Query(None),

    end_date: date | None = Query(None),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    """Return the current user's RAG request history."""



    if start_date and end_date and end_date < start_date:

        raise HTTPException(

            status_code=400,

            detail="End date cannot be earlier than the start date.",

        )



    filters = [RAGRequestLog.user_id == current_user.id]



    if start_date:

        start_datetime = datetime.combine(

            start_date,

            time.min,

            tzinfo=timezone.utc,

        )

        filters.append(RAGRequestLog.created_at >= start_datetime)



    if end_date:

        end_datetime = datetime.combine(

            end_date + timedelta(days=1),

            time.min,

            tzinfo=timezone.utc,

        )

        filters.append(RAGRequestLog.created_at < end_datetime)



    total = db.scalar(

        select(func.count(RAGRequestLog.id)).where(*filters)

    ) or 0



    logs = db.scalars(

        select(RAGRequestLog)

        .where(*filters)

        .order_by(

            RAGRequestLog.created_at.desc()

        )

        .offset(offset)

        .limit(limit)

    ).all()



    return {

        "total": total,

        "limit": limit,

        "offset": offset,

        "requests": [

            {

                "id": log.id,

                "conversation_id": log.conversation_id,

                "question": log.question,

                "model_name": log.model_name,

                "retrieved_chunks": log.retrieved_chunks,

                "average_similarity": log.average_similarity,

                "max_similarity": log.max_similarity,

                "retrieval_time_ms": log.retrieval_time_ms,

                "generation_time_ms": log.generation_time_ms,

                "total_time_ms": log.total_time_ms,

                "status": log.status,

                "created_at": log.created_at,

            }

            for log in logs

        ],

    }





@router.get("/rag-requests/{request_id}")

def get_rag_request_details(

    request_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    """Return complete diagnostics for one user's RAG request."""



    log = db.scalar(

        select(RAGRequestLog).where(

            RAGRequestLog.id == request_id,

            RAGRequestLog.user_id == current_user.id,

        )

    )



    if log is None:

        raise HTTPException(

            status_code=404,

            detail="RAG request not found.",

        )



    return {

        "id": log.id,

        "user_id": log.user_id,

        "conversation_id": log.conversation_id,

        "question": log.question,

        "answer": log.answer,

        "model_name": log.model_name,

        "retrieved_chunks": log.retrieved_chunks,

        "document_ids": log.document_ids,

        "similarity_scores": log.similarity_scores,

        "average_similarity": log.average_similarity,

        "max_similarity": log.max_similarity,

        "retrieval_time_ms": log.retrieval_time_ms,

        "generation_time_ms": log.generation_time_ms,

        "total_time_ms": log.total_time_ms,

        "status": log.status,

        "error_message": log.error_message,

        "created_at": log.created_at,

    }



@router.get("/rag-analytics/trends")

def get_rag_analytics_trends(

    start_date: date | None = Query(None),

    end_date: date | None = Query(None),

    db: Session = Depends(get_db),

    current_user: User = Depends(get_current_user),

):

    filters = [

        RAGRequestLog.user_id == current_user.id,

    ]



    if start_date and end_date and end_date < start_date:

        raise HTTPException(

            status_code=400,

            detail="End date cannot be earlier than start date.",

        )



    if start_date:

        start_datetime = datetime.combine(

            start_date,

            time.min,

            tzinfo=timezone.utc,

        )

        filters.append(

            RAGRequestLog.created_at >= start_datetime

        )



    if end_date:

        end_datetime = datetime.combine(

            end_date + timedelta(days=1),

            time.min,

            tzinfo=timezone.utc,

        )

        filters.append(

            RAGRequestLog.created_at < end_datetime

        )



    date_bucket = func.date_trunc(

        "day",

        RAGRequestLog.created_at,

    ).label("date")



    rows = db.execute(

        select(

            date_bucket,

            func.count(RAGRequestLog.id).label("total_requests"),

            func.sum(

                case(

                    (

                        RAGRequestLog.status == "success",

                        1,

                    ),

                    else_=0,

                )

            ).label("successful_requests"),

            func.sum(

                case(

                    (

                        RAGRequestLog.status != "success",

                        1,

                    ),

                    else_=0,

                )

            ).label("failed_requests"),

            func.avg(

                RAGRequestLog.average_similarity

            ).label("average_similarity"),

            func.avg(

                RAGRequestLog.retrieval_time_ms

            ).label("average_retrieval_time_ms"),

            func.avg(

                RAGRequestLog.generation_time_ms

            ).label("average_generation_time_ms"),

            func.avg(

                RAGRequestLog.total_time_ms

            ).label("average_total_time_ms"),

            func.avg(

                RAGRequestLog.retrieved_chunks

            ).label("average_retrieved_chunks"),

        )

        .where(*filters)

        .group_by(date_bucket)

        .order_by(date_bucket.asc())

    ).all()



    trends = []



    for row in rows:

        trends.append(

            {

                "date": (

                    row.date.isoformat()

                    if row.date

                    else None

                ),

                "total_requests": int(

                    row.total_requests or 0

                ),

                "successful_requests": int(

                    row.successful_requests or 0

                ),

                "failed_requests": int(

                    row.failed_requests or 0

                ),

                "average_similarity": round(

                    float(row.average_similarity or 0),

                    4,

                ),

                "average_retrieval_time_ms": round(

                    float(

                        row.average_retrieval_time_ms or 0

                    ),

                    2,

                ),

                "average_generation_time_ms": round(

                    float(

                        row.average_generation_time_ms or 0

                    ),

                    2,

                ),

                "average_total_time_ms": round(

                    float(

                        row.average_total_time_ms or 0

                    ),

                    2,

                ),

                "average_retrieved_chunks": round(

                    float(

                        row.average_retrieved_chunks or 0

                    ),

                    2,

                ),

            }

        )



    return {

        "start_date": (

            start_date.isoformat()

            if start_date

            else None

        ),

        "end_date": (

            end_date.isoformat()

            if end_date

            else None

        ),

        "trends": trends,

    }
