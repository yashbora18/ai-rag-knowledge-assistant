from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from pypdf import PdfReader
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.document import Document
from app.models.notification import Notification
from app.services.document_chunk_service import create_document_chunks


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
            document_xml = archive.read("word/document.xml")
        except KeyError as error:
            raise ValueError(
                "Invalid DOCX file: document.xml is missing."
            ) from error

    root = ET.fromstring(document_xml)

    namespace = {
        "w": (
            "http://schemas.openxmlformats.org/"
            "wordprocessingml/2006/main"
        )
    }

    for paragraph in root.findall(".//w:p", namespace):
        text_parts = []

        for text_node in paragraph.findall(".//w:t", namespace):
            if text_node.text:
                text_parts.append(text_node.text)

        paragraph_text = "".join(text_parts).strip()

        if paragraph_text:
            paragraphs.append(paragraph_text)

    return "\n\n".join(paragraphs).strip()


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

    raise ValueError("Unsupported document type.")


def process_document_background(
    document_id: int,
    file_path: str,
    extension: str,
) -> None:
    db: Session = SessionLocal()

    try:
        document = db.scalar(
            select(Document).where(
                Document.id == document_id
            )
        )

        if not document:
            return

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                "Uploaded document file is no longer available."
            )

        extracted_text = extract_document_text(
            path,
            extension,
        )

        if not extracted_text:
            raise ValueError(
                "No readable text could be extracted from the document."
            )

        document.extracted_text = extracted_text
        db.flush()

        document_chunks = create_document_chunks(
            db=db,
            document_id=document.id,
            text=extracted_text,
        )

        if not document_chunks:
            raise ValueError(
                "No document chunks could be created."
            )

        document.status = "ready"

        db.add(
            Notification(
                user_id=document.user_id,
                type="success",
                title="Document ready",
                message=(
                    f'"{document.filename}" is ready for AI chat.'
                ),
                is_read=False,
            )
        )

        db.commit()

    except Exception:
        db.rollback()

        document = db.scalar(
            select(Document).where(
                Document.id == document_id
            )
        )

        if document:
            document.status = "failed"

            db.add(
                Notification(
                    user_id=document.user_id,
                    type="error",
                    title="Document processing failed",
                    message=(
                        f'"{document.filename}" could not be processed.'
                    ),
                    is_read=False,
                )
            )

            db.commit()

    finally:
        db.close()