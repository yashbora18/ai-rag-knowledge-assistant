from pathlib import Path

from uuid import uuid4

from zipfile import ZipFile

from xml.etree import ElementTree as ET

import hashlib

import logging

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from sqlalchemy import select

from sqlalchemy.orm import Session

from pypdf import PdfReader

from app.core.security import get_current_user

from app.db.database import get_db

from app.models.document import Document

from app.models.document_chunk import DocumentChunk

from app.models.user import User

from app.models.notification import Notification

from app.services.document_chunk_service import (
    create_document_chunks,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


MAX_FILE_SIZE = 20 * 1024 * 1024


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".md",
}


BASE_STORAGE_DIR = (
    Path(__file__).resolve().parents[2]
    / "storage"
    / "documents"
)


def get_safe_filename(
    filename: str,
) -> str:

    return Path(filename).name.strip()


def get_file_extension(
    filename: str,
) -> str:

    return Path(filename).suffix.lower()


def calculate_file_hash(
    file_data: bytes,
) -> str:

    return hashlib.sha256(
        file_data
    ).hexdigest()


def extract_pdf_text(
    file_path: Path,
) -> str:

    logger.info(
        "Extracting PDF text from %s",
        file_path,
    )

    reader = PdfReader(
        str(file_path)
    )

    pages = []

    for page in reader.pages:

        text = page.extract_text()

        if text:

            pages.append(text)

    return "\n\n".join(
        pages
    ).strip()


def extract_text_file(
    file_path: Path,
) -> str:

    raw_data = file_path.read_bytes()

    try:

        return raw_data.decode(
            "utf-8"
        ).strip()

    except UnicodeDecodeError:

        return raw_data.decode(
            "utf-8",
            errors="replace",
        ).strip()


def extract_docx_text(
    file_path: Path,
) -> str:

    paragraphs = []

    with ZipFile(
        file_path,
        "r",
    ) as archive:

        try:

            document_xml = archive.read(
                "word/document.xml"
            )

        except KeyError:

            raise ValueError(
                "Invalid DOCX file: "
                "document.xml is missing."
            )

    root = ET.fromstring(
        document_xml
    )

    namespace = {
        "w": (
            "http://schemas.openxmlformats.org/"
            "wordprocessingml/2006/main"
        )
    }

    for paragraph in root.findall(
        ".//w:p",
        namespace,
    ):

        text_parts = []

        for text_node in paragraph.findall(
            ".//w:t",
            namespace,
        ):

            if text_node.text:

                text_parts.append(
                    text_node.text
                )

        paragraph_text = "".join(
            text_parts
        ).strip()

        if paragraph_text:

            paragraphs.append(
                paragraph_text
            )

    return "\n\n".join(
        paragraphs
    ).strip()


def extract_document_text(
    file_path: Path,
    extension: str,
) -> str:

    if extension == ".pdf":

        return extract_pdf_text(
            file_path
        )

    if extension in {
        ".txt",
        ".md",
    }:

        return extract_text_file(
            file_path
        )

    if extension == ".docx":

        return extract_docx_text(
            file_path
        )

    raise ValueError(
        "Unsupported document type."
    )


# ============================================================
# GET ALL DOCUMENTS / SEARCH DOCUMENTS
# ============================================================


@router.get("/")
def get_documents(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    query = select(
        Document
    ).where(
        Document.user_id
        == current_user.id
    )

    if search and search.strip():

        search_term = (
            f"%{search.strip()}%"
        )

        query = query.where(
            Document.filename.ilike(
                search_term
            )
        )

    documents = db.scalars(
        query.order_by(
            Document.created_at.desc()
        )
    ).all()

    return [
        {
            "id": document.id,
            "filename": document.filename,
            "file_size": document.file_size,
            "status": document.status,
            "created_at": document.created_at,
            "extracted_text_length": (
                len(
                    document.extracted_text
                )
                if document.extracted_text
                else 0
            ),
        }
        for document in documents
    ]


# ============================================================
# GET SINGLE DOCUMENT DETAILS
# ============================================================


@router.get("/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    document = db.scalar(
        select(Document).where(
            Document.id == document_id,
            Document.user_id
            == current_user.id,
        )
    )

    if not document:

        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Document not found.",
        )

    chunks = db.scalars(
        select(DocumentChunk)
        .where(
            DocumentChunk.document_id
            == document.id
        )
        .order_by(
            DocumentChunk.chunk_index.asc()
        )
    ).all()

    return {
        "id": document.id,
        "filename": document.filename,
        "file_size": document.file_size,
        "status": document.status,
        "created_at": document.created_at,
        "extracted_text": (
            document.extracted_text
            or ""
        ),
        "extracted_text_length": (
            len(
                document.extracted_text
            )
            if document.extracted_text
            else 0
        ),
        "chunk_count": len(chunks),
        "chunks": [
            {
                "id": chunk.id,
                "chunk_index": (
                    chunk.chunk_index
                ),
                "content": chunk.content,
            }
            for chunk in chunks
        ],
    }


# ============================================================
# DELETE DOCUMENT
# ============================================================


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    document = db.scalar(
        select(Document).where(
            Document.id == document_id,
            Document.user_id
            == current_user.id,
        )
    )

    if not document:

        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Document not found.",
        )

    file_path = None

    if document.file_path:

        file_path = (
            BASE_STORAGE_DIR.parent
            / document.file_path
        ).resolve()

    try:

        db.delete(document)

        db.commit()

        if (
            file_path
            and file_path.exists()
        ):

            file_path.unlink()

        return {
            "message": (
                "Document deleted successfully."
            ),
            "document_id": document_id,
        }

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Failed to delete document."
            ),
        ) from error


# ============================================================
# BACKGROUND DOCUMENT PROCESSING
# ============================================================


def process_document_background(
    document_id: int,
    user_id: int,
    file_path: Path,
    extension: str,
):
    """
    Process document text extraction and embeddings
    in the background.

    A separate database session is used because the
    request-scoped session must not be reused after
    the HTTP response is returned.
    """

    from app.db.database import (
        SessionLocal,
    )

    logger.info(
        "BACKGROUND PROCESSING STARTED "
        "document_id=%s user_id=%s file=%s",
        document_id,
        user_id,
        file_path,
    )

    db = SessionLocal()

    try:

        document = db.scalar(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == user_id,
            )
        )

        if not document:

            logger.error(
                "Document not found for "
                "background processing: "
                "document_id=%s",
                document_id,
            )

            return

        if not file_path.exists():

            raise FileNotFoundError(
                f"Stored document file does not "
                f"exist: {file_path}"
            )

        logger.info(
            "Extracting text for document_id=%s",
            document_id,
        )

        extracted_text = (
            extract_document_text(
                file_path,
                extension,
            )
        )

        if not extracted_text.strip():

            raise ValueError(
                "Document contains no readable text."
            )

        logger.info(
            "Text extraction completed for "
            "document_id=%s. Characters=%s",
            document_id,
            len(extracted_text),
        )

        document.extracted_text = (
            extracted_text
        )

        db.commit()

        logger.info(
            "Creating chunks and embeddings "
            "for document_id=%s",
            document_id,
        )

        document_chunks = (
            create_document_chunks(
                db=db,
                document_id=document.id,
                text=extracted_text,
            )
        )

        logger.info(
            "Chunk and embedding creation completed "
            "for document_id=%s. Chunks=%s",
            document_id,
            len(document_chunks),
        )

        document.status = "ready"

        notification = Notification(
            user_id=user_id,
            type="success",
            title="Document ready",
            message=(
                f'"{document.filename}" '
                "is ready for AI chat."
            ),
            is_read=False,
        )

        db.add(notification)

        db.commit()

        logger.info(
            "BACKGROUND PROCESSING COMPLETED "
            "document_id=%s status=ready chunks=%s",
            document_id,
            len(document_chunks),
        )

    except Exception as error:

        logger.exception(
            "BACKGROUND PROCESSING FAILED "
            "document_id=%s error=%s",
            document_id,
            error,
        )

        db.rollback()

        try:

            document = db.scalar(
                select(Document).where(
                    Document.id == document_id,
                    Document.user_id
                    == user_id,
                )
            )

            if document:

                document.status = "failed"

                notification = Notification(
                    user_id=user_id,
                    type="error",
                    title=(
                        "Document processing failed"
                    ),
                    message=(
                        f'"{document.filename}" '
                        "could not be processed."
                    ),
                    is_read=False,
                )

                db.add(notification)

                db.commit()

                logger.info(
                    "Document marked as failed: "
                    "document_id=%s",
                    document_id,
                )

        except Exception as failure_error:

            logger.exception(
                "Could not mark document as failed "
                "document_id=%s error=%s",
                document_id,
                failure_error,
            )

            db.rollback()

    finally:

        db.close()

        logger.info(
            "Background database session closed "
            "for document_id=%s",
            document_id,
        )


# ============================================================
# UPLOAD DOCUMENT
# ============================================================


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    if not file.filename:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail="A file is required.",
        )

    filename = get_safe_filename(
        file.filename
    )

    if not filename:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail="Invalid filename.",
        )

    extension = get_file_extension(
        filename
    )

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Unsupported file type. "
                "Allowed formats: "
                "PDF, DOCX, TXT, MD."
            ),
        )

    file_data = await file.read()

    if not file_data:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail="The uploaded file is empty.",
        )

    if len(file_data) > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            ),
            detail=(
                "File is too large. "
                "Maximum allowed size is 20 MB."
            ),
        )

    # --------------------------------------------------------
    # Calculate SHA-256 hash
    # --------------------------------------------------------

    file_hash = calculate_file_hash(
        file_data
    )

    # --------------------------------------------------------
    # Prevent duplicate uploads
    # --------------------------------------------------------

    existing_document = db.scalar(
        select(Document)
        .where(
            Document.user_id
            == current_user.id,
            Document.file_hash
            == file_hash,
        )
        .order_by(
            Document.created_at.desc()
        )
    )

    if existing_document:

        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "This document has already "
                "been uploaded. "
                f'Existing document: '
                f'"{existing_document.filename}".'
            ),
        )

    user_storage_dir = (
        BASE_STORAGE_DIR
        / str(current_user.id)
    )

    user_storage_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    unique_filename = (
        f"{uuid4().hex}{extension}"
    )

    file_path = (
        user_storage_dir
        / unique_filename
    )

    try:

        # ----------------------------------------------------
        # Save uploaded file
        # ----------------------------------------------------

        file_path.write_bytes(
            file_data
        )

        logger.info(
            "Uploaded file saved: "
            "user_id=%s filename=%s size=%s "
            "path=%s",
            current_user.id,
            filename,
            len(file_data),
            file_path,
        )

        # ----------------------------------------------------
        # Create document record
        # ----------------------------------------------------

        document = Document(
            user_id=current_user.id,
            filename=filename,
            file_size=len(file_data),
            file_hash=file_hash,
            status="processing",
            file_path=str(
                file_path.relative_to(
                    BASE_STORAGE_DIR.parent
                )
            ),
            extracted_text=None,
        )

        db.add(document)

        db.flush()

        document_id = document.id

        user_id = current_user.id

        db.commit()

        db.refresh(document)

        logger.info(
            "Document record created: "
            "document_id=%s user_id=%s "
            "filename=%s",
            document_id,
            user_id,
            filename,
        )

        # ----------------------------------------------------
        # Background processing
        # ----------------------------------------------------

        background_tasks.add_task(
            process_document_background,
            document_id,
            user_id,
            file_path,
            extension,
        )

        logger.info(
            "Background processing task queued: "
            "document_id=%s",
            document_id,
        )

        # ----------------------------------------------------
        # Return immediately
        # ----------------------------------------------------

        return {
            "id": document.id,
            "filename": document.filename,
            "file_size": document.file_size,
            "status": document.status,
            "created_at": document.created_at,
            "extracted_text_length": 0,
            "chunk_count": 0,
        }

    except Exception as error:

        logger.exception(
            "Document upload failed: "
            "filename=%s error=%s",
            filename,
            error,
        )

        db.rollback()

        try:

            notification = Notification(
                user_id=current_user.id,
                type="error",
                title=(
                    "Document processing failed"
                ),
                message=(
                    f'"{filename}" '
                    "could not be processed."
                ),
                is_read=False,
            )

            db.add(notification)

            db.commit()

        except Exception:

            db.rollback()

        if file_path.exists():

            file_path.unlink()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "The document was uploaded, "
                "but processing failed."
            ),
        ) from error