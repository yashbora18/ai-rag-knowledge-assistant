from pathlib import Path



from uuid import uuid4



from zipfile import ZipFile



from xml.etree import ElementTree as ET



import hashlib



from fastapi import (



    APIRouter,



    Depends,



    File,



    HTTPException,



    UploadFile,



    status,



)



from sqlalchemy import or_, select



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



router = APIRouter(



    prefix="/documents",



    tags=["Documents"],



)



MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB



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



def get_safe_filename(filename: str) -> str:



    return Path(filename).name.strip()



def get_file_extension(filename: str) -> str:



    return Path(filename).suffix.lower()



def calculate_file_hash(file_data: bytes) -> str:



    return hashlib.sha256(file_data).hexdigest()



def extract_pdf_text(file_path: Path) -> str:



    reader = PdfReader(str(file_path))



    pages = []



    for page in reader.pages:



        text = page.extract_text()



        if text:



            pages.append(text)



    return "\n\n".join(pages).strip()



def extract_text_file(file_path: Path) -> str:



    raw_data = file_path.read_bytes()



    try:



        return raw_data.decode("utf-8").strip()



    except UnicodeDecodeError:



        return raw_data.decode(



            "utf-8",



            errors="replace",



        ).strip()



def extract_docx_text(file_path: Path) -> str:



    paragraphs = []



    with ZipFile(file_path, "r") as archive:



        try:



            document_xml = archive.read(



                "word/document.xml"



            )



        except KeyError:



            raise ValueError(



                "Invalid DOCX file: document.xml is missing."



            )



    root = ET.fromstring(document_xml)



    namespace = {



        "w": (



            "http\://schemas.openxmlformats.org/"



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



        return extract_pdf_text(file_path)



    if extension in {".txt", ".md"}:



        return extract_text_file(file_path)



    if extension == ".docx":



        return extract_docx_text(file_path)



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



    query = select(Document).where(



        Document.user_id == current_user.id



    )



    if search and search.strip():



        search_term = f"%{search.strip()}%"



        query = query.where(



            Document.filename.ilike(search_term)



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



                len(document.extracted_text)



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



            Document.user_id == current_user.id,



        )



    )



    if not document:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



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



            document.extracted_text or ""



        ),



        "extracted_text_length": (



            len(document.extracted_text)



            if document.extracted_text



            else 0



        ),



        "chunk_count": len(chunks),



        "chunks": [



            {



                "id": chunk.id,



                "chunk_index": chunk.chunk_index,



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



            Document.user_id == current_user.id,



        )



    )



    if not document:



        raise HTTPException(



            status_code=status.HTTP_404_NOT_FOUND,



            detail="Document not found.",



        )



    file_path = None



    if document.file_path:



        file_path = (



            BASE_STORAGE_DIR.parent



            / document.file_path



        ).resolve()



    try:



        # Delete database record.



        # DocumentChunk rows are deleted automatically



        # because the foreign key uses ON DELETE CASCADE.



        db.delete(document)



        db.commit()



        # Delete physical file after successful DB deletion.



        if file_path and file_path.exists():



            file_path.unlink()



        return {



            "message": "Document deleted successfully.",



            "document_id": document_id,



        }



    except Exception as error:



        db.rollback()



        raise HTTPException(



            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,



            detail="Failed to delete document.",



        ) from error



# ============================================================



# UPLOAD DOCUMENT



# ============================================================



@router.post(



    "/",



    status_code=status.HTTP_201_CREATED,



)



async def create_document(



    file: UploadFile = File(...),



    db: Session = Depends(get_db),



    current_user: User = Depends(



        get_current_user



    ),



):



    if not file.filename:



        raise HTTPException(



            status_code=status.HTTP_400_BAD_REQUEST,



            detail="A file is required.",



        )



    filename = get_safe_filename(



        file.filename



    )



    if not filename:



        raise HTTPException(



            status_code=status.HTTP_400_BAD_REQUEST,



            detail="Invalid filename.",



        )



    extension = get_file_extension(



        filename



    )



    if extension not in ALLOWED_EXTENSIONS:



        raise HTTPException(



            status_code=status.HTTP_400_BAD_REQUEST,



            detail=(



                "Unsupported file type. "



                "Allowed formats: "



                "PDF, DOCX, TXT, MD."



            ),



        )



    file_data = await file.read()



    if not file_data:



        raise HTTPException(



            status_code=status.HTTP_400_BAD_REQUEST,



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



    # Calculate SHA-256 hash before saving the file



    # --------------------------------------------------------



    file_hash = calculate_file_hash(



        file_data



    )



    # --------------------------------------------------------



    # Prevent duplicate uploads for this user



    # --------------------------------------------------------



    existing_document = db.scalar(



        select(Document)



        .where(



            Document.user_id == current_user.id,



            Document.file_hash == file_hash,



        )



        .order_by(



            Document.created_at.desc()



        )



    )



    if existing_document:



        raise HTTPException(



            status_code=status.HTTP_409_CONFLICT,



            detail=(



                "This document has already been uploaded. "



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



        file_path.write_bytes(file_data)



        # ----------------------------------------------------



        # Extract readable text



        # ----------------------------------------------------



        extracted_text = (



            extract_document_text(



                file_path,



                extension,



            )



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



            extracted_text=extracted_text,



        )



        db.add(document)



        # Generate document ID before



        # creating related chunks.



        db.flush()



        # ----------------------------------------------------



        # Create chunks + embeddings



        # ----------------------------------------------------



        document_chunks = (



            create_document_chunks(



                db=db,



                document_id=document.id,



                text=extracted_text,



            )



        )



        # ----------------------------------------------------



        # Mark document as ready



        # ----------------------------------------------------



        document.status = "ready"

        notification = Notification(
            user_id=current_user.id,
            type="success",
            title="Document ready",
            message=f'"{document.filename}" is ready for AI chat.',
            is_read=False,
        )

        db.add(notification)

        db.commit()



        db.refresh(document)



        return {



            "id": document.id,



            "filename": document.filename,



            "file_size": document.file_size,



            "status": document.status,



            "created_at": document.created_at,



            "extracted_text_length": len(



                extracted_text



            ),



            "chunk_count": len(



                document_chunks



            ),



        }



    except Exception as error:

        db.rollback()

        try:
            notification = Notification(
                user_id=current_user.id,
                type="error",
                title="Document processing failed",
                message=f'"{filename}" could not be processed.',
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
