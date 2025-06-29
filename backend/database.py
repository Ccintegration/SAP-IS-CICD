"""
Database connection and utilities for PostgreSQL
"""
import os
import asyncpg
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import TransportRelease, TransportArtifact

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.connection_params = {
            'host': os.getenv('PGHOST', 'ep-long-queen-a2piie1w-pooler.eu-central-1.aws.neon.tech'),
            'port': int(os.getenv('PGPORT', '5432')),
            'user': os.getenv('PGUSER', 'neondb_owner'),
            'password': os.getenv('PGPASSWORD', 'npg_JPs8mOBY7Ewa'),
            'database': os.getenv('PGDATABASE', 'SAP_INTEGRATION_DB'),
            'ssl': 'require'
        }

    async def connect(self):
        """Initialize database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(**self.connection_params)
            logger.info("Database connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create database connection pool: {e}")
            raise

    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")

    async def get_transport_releases(self) -> List[TransportRelease]:
        """Get all transport releases"""
        if not self.pool:
            raise Exception("Database not connected")
        
        async with self.pool.acquire() as conn:
            query = """
                SELECT 
                    tr.TRANSPORT_ID as id,
                    tr.TRANSPORT_NAME as name,
                    tr.DESCRIPTION as description,
                    tr.STATUS as status,
                    tr.CREATED_DATE as created_date,
                    tr.CREATED_BY as created_by,
                    tr.UPDATED_DATE as modified_date,
                    tr.UPDATED_BY as modified_by,
                    tr.TARGET_SYSTEM as target_environment,
                    'DEV' as source_environment,
                    COUNT(ta.ARTIFACT_ID) as total_artifacts
                FROM TRANSPORT_PACKAGES tr
                LEFT JOIN TRANSPORT_ARTIFACTS ta ON tr.TRANSPORT_ID = ta.TRANSPORT_ID
                GROUP BY tr.TRANSPORT_ID, tr.TRANSPORT_NAME, tr.DESCRIPTION, tr.STATUS, tr.CREATED_DATE, 
                         tr.CREATED_BY, tr.UPDATED_DATE, tr.UPDATED_BY, tr.TARGET_SYSTEM
                ORDER BY tr.CREATED_DATE DESC
            """
            
            rows = await conn.fetch(query)
            transport_releases = []
            
            for row in rows:
                transport_releases.append(TransportRelease(
                    id=row['id'],
                    name=row['name'],
                    description=row['description'],
                    status=row['status'],
                    created_date=row['created_date'],
                    created_by=row['created_by'],
                    modified_date=row['modified_date'],
                    modified_by=row['modified_by'],
                    target_environment=row['target_environment'],
                    source_environment=row['source_environment'],
                    total_artifacts=row['total_artifacts']
                ))
            
            return transport_releases

    async def get_transport_release_artifacts(self, transport_release_id: str) -> List[TransportArtifact]:
        """Get all artifacts for a specific transport release"""
        if not self.pool:
            raise Exception("Database not connected")
        
        async with self.pool.acquire() as conn:
            query = """
                SELECT 
                    ARTIFACT_ID as id,
                    TRANSPORT_ID as transport_release_id,
                    IFLOW_ID as iflow_id,
                    IFLOW_NAME as iflow_name,
                    PACKAGE_ID as package_id,
                    PACKAGE_NAME as package_name,
                    IFLOW_VERSION as version,
                    STATUS as status,
                    ADDED_DATE as created_date,
                    ARTIFACT_ID as deployment_order
                FROM TRANSPORT_ARTIFACTS
                WHERE TRANSPORT_ID = $1
                ORDER BY ARTIFACT_ID ASC
            """
            
            rows = await conn.fetch(query, transport_release_id)
            artifacts = []
            
            for row in rows:
                artifacts.append(TransportArtifact(
                    id=row['id'],
                    transport_release_id=row['transport_release_id'],
                    iflow_id=row['iflow_id'],
                    iflow_name=row['iflow_name'],
                    package_id=row['package_id'],
                    package_name=row['package_name'],
                    version=row['version'],
                    status=row['status'],
                    created_date=row['created_date'],
                    modified_date=None,  # This column doesn't exist in the table
                    deployment_order=row['deployment_order']
                ))
            
            return artifacts

    async def get_transport_release_by_id(self, transport_release_id: str) -> Optional[TransportRelease]:
        """Get a specific transport release by ID"""
        if not self.pool:
            raise Exception("Database not connected")
        
        async with self.pool.acquire() as conn:
            query = """
                SELECT 
                    tr.TRANSPORT_ID as id,
                    tr.TRANSPORT_NAME as name,
                    tr.DESCRIPTION as description,
                    tr.STATUS as status,
                    tr.CREATED_DATE as created_date,
                    tr.CREATED_BY as created_by,
                    tr.UPDATED_DATE as modified_date,
                    tr.UPDATED_BY as modified_by,
                    tr.TARGET_SYSTEM as target_environment,
                    'DEV' as source_environment,
                    COUNT(ta.ARTIFACT_ID) as total_artifacts
                FROM TRANSPORT_PACKAGES tr
                LEFT JOIN TRANSPORT_ARTIFACTS ta ON tr.TRANSPORT_ID = ta.TRANSPORT_ID
                WHERE tr.TRANSPORT_ID = $1
                GROUP BY tr.TRANSPORT_ID, tr.TRANSPORT_NAME, tr.DESCRIPTION, tr.STATUS, tr.CREATED_DATE, 
                         tr.CREATED_BY, tr.UPDATED_DATE, tr.UPDATED_BY, tr.TARGET_SYSTEM
            """
            
            row = await conn.fetchrow(query, transport_release_id)
            
            if row:
                return TransportRelease(
                    id=row['id'],
                    name=row['name'],
                    description=row['description'],
                    status=row['status'],
                    created_date=row['created_date'],
                    created_by=row['created_by'],
                    modified_date=row['modified_date'],
                    modified_by=row['modified_by'],
                    target_environment=row['target_environment'],
                    source_environment=row['source_environment'],
                    total_artifacts=row['total_artifacts']
                )
            
            return None

# Global database manager instance
db_manager = DatabaseManager() 