import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Async Engine for FastAPI async endpoints
try:
    async_engine = create_async_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        echo=False,
        future=True,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
except Exception as e:
    logger.warning(f"Could not initialize async engine: {e}")
    async_engine = None
    AsyncSessionLocal = None

# Sync Engine for Celery tasks or synchronous scripts
try:
    sync_engine = create_engine(
        settings.SYNC_DATABASE_URI,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
    SyncSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=sync_engine
    )
except Exception as e:
    logger.warning(f"Could not initialize sync engine: {e}")
    sync_engine = None
    SyncSessionLocal = None

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an async database session."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database connection not configured")
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def get_sync_db():
    """Context manager or utility for synchronous database sessions in Celery."""
    if SyncSessionLocal is None:
        raise RuntimeError("Sync database connection not configured")
    db = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
