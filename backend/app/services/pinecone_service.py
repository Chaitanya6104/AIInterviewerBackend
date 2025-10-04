"""
Pinecone service for vector storage and retrieval
"""

import pinecone
from typing import List, Dict, Any, Optional
from app.core.config import settings
import openai
import json


class PineconeService:
    """Service for Pinecone vector database operations"""
    
    def __init__(self):
        self.pc = pinecone.Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        self.index = None
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize Pinecone index"""
        try:
            # Check if index exists
            if self.index_name not in self.pc.list_indexes().names():
                # Create index if it doesn't exist
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1536,  # OpenAI embedding dimension
                    metric="cosine",
                    spec={"serverless": {"cloud": "aws", "region": "us-east-1"}}
                )
            
            self.index = self.pc.Index(self.index_name)
            print(f"✅ Pinecone index '{self.index_name}' initialized")
        
        except Exception as e:
            print(f"❌ Pinecone initialization error: {e}")
            self.index = None
    
    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for text using OpenAI"""
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"❌ Embedding generation error: {e}")
            return []
    
    async def store_resume_embedding(self, candidate_id: str, resume_text: str, metadata: Dict[str, Any] = None) -> bool:
        """Store resume embedding in Pinecone"""
        try:
            if not self.index:
                return False
            
            # Generate embedding
            embedding = self._get_embedding(resume_text)
            if not embedding:
                return False
            
            # Prepare metadata
            if not metadata:
                metadata = {}
            
            metadata.update({
                "candidate_id": candidate_id,
                "type": "resume",
                "text_length": len(resume_text)
            })
            
            # Store in Pinecone
            self.index.upsert(
                vectors=[{
                    "id": f"resume_{candidate_id}",
                    "values": embedding,
                    "metadata": metadata
                }]
            )
            
            print(f"✅ Resume embedding stored for candidate {candidate_id}")
            return True
        
        except Exception as e:
            print(f"❌ Resume embedding storage error: {e}")
            return False
    
    async def store_interview_context(self, interview_id: str, context_text: str, metadata: Dict[str, Any] = None) -> bool:
        """Store interview context in Pinecone"""
        try:
            if not self.index:
                return False
            
            # Generate embedding
            embedding = self._get_embedding(context_text)
            if not embedding:
                return False
            
            # Prepare metadata
            if not metadata:
                metadata = {}
            
            metadata.update({
                "interview_id": interview_id,
                "type": "interview_context",
                "text_length": len(context_text)
            })
            
            # Store in Pinecone
            self.index.upsert(
                vectors=[{
                    "id": f"context_{interview_id}",
                    "values": embedding,
                    "metadata": metadata
                }]
            )
            
            print(f"✅ Interview context stored for interview {interview_id}")
            return True
        
        except Exception as e:
            print(f"❌ Interview context storage error: {e}")
            return False
    
    async def search_similar_resumes(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar resumes"""
        try:
            if not self.index:
                return []
            
            # Generate query embedding
            query_embedding = self._get_embedding(query_text)
            if not query_embedding:
                return []
            
            # Search Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter={"type": "resume"}
            )
            
            return [
                {
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in results.matches
            ]
        
        except Exception as e:
            print(f"❌ Resume search error: {e}")
            return []
    
    async def search_interview_context(self, query_text: str, interview_id: str = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant interview context"""
        try:
            if not self.index:
                return []
            
            # Generate query embedding
            query_embedding = self._get_embedding(query_text)
            if not query_embedding:
                return []
            
            # Prepare filter
            filter_dict = {"type": "interview_context"}
            if interview_id:
                filter_dict["interview_id"] = interview_id
            
            # Search Pinecone
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            return [
                {
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in results.matches
            ]
        
        except Exception as e:
            print(f"❌ Interview context search error: {e}")
            return []
    
    async def delete_candidate_data(self, candidate_id: str) -> bool:
        """Delete all data for a candidate"""
        try:
            if not self.index:
                return False
            
            # Delete resume embedding
            self.index.delete(ids=[f"resume_{candidate_id}"])
            
            print(f"✅ Candidate data deleted for candidate {candidate_id}")
            return True
        
        except Exception as e:
            print(f"❌ Candidate data deletion error: {e}")
            return False
    
    async def delete_interview_data(self, interview_id: str) -> bool:
        """Delete all data for an interview"""
        try:
            if not self.index:
                return False
            
            # Delete interview context
            self.index.delete(ids=[f"context_{interview_id}"])
            
            print(f"✅ Interview data deleted for interview {interview_id}")
            return True
        
        except Exception as e:
            print(f"❌ Interview data deletion error: {e}")
            return False
