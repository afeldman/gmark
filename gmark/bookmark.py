from pydantic import BaseModel
from typing import Optional, Tuple, List
import openai
import requests
import json
from loguru import logger

class AIClassifier:
    """Multi-provider AI classifier for bookmarks with Chrome AI, AnythingLLM, and OpenAI fallbacks"""
    
    @staticmethod
    async def classify_with_chrome_ai(url: str, title: str, content: str) -> Optional[Tuple[List[str], str, str]]:
        """
        Classify using Chrome Built-in AI (Gemini Nano)
        Returns: (keywords, summary, suggested_folder_path) or None if not available
        
        Note: This requires Chrome 127+ with AI features enabled.
        Must be called from browser context via API endpoint.
        """
        # Chrome AI is browser-only, so this returns None in backend
        # The actual implementation will be in a frontend JavaScript wrapper
        logger.warning("Chrome AI can only be used from browser context, not backend")
        return None
    
    @staticmethod
    def classify_with_anythingllm(
        url: str, 
        title: str, 
        content: str,
        api_endpoint: str = "http://localhost:3001/api/chat",
        api_key: Optional[str] = None
    ) -> Optional[Tuple[List[str], str, str]]:
        """
        Classify using AnythingLLM local instance
        Returns: (keywords, summary, suggested_folder_path) or None if unavailable
        """
        try:
            prompt = f"""Analyze this bookmark and provide:
1. 5 relevant keywords (comma-separated)
2. A brief summary (1-2 sentences)
3. A suggested folder path in Linux-style format (e.g., /tech/javascript/frameworks)

URL: {url}
Title: {title}
Content excerpt: {content[:500]}

Format your response as JSON:
{{
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "summary": "Brief summary here",
    "folder_path": "/suggested/path"
}}"""

            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            
            payload = {
                "message": prompt,
                "mode": "chat"
            }
            
            response = requests.post(
                api_endpoint,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                # Parse the response - AnythingLLM returns {textResponse: "..."}
                text_response = result.get("textResponse", "")
                
                # Try to extract JSON from response
                try:
                    # Find JSON in response
                    json_start = text_response.find('{')
                    json_end = text_response.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        parsed = json.loads(text_response[json_start:json_end])
                        keywords = parsed.get("keywords", [])[:5]
                        summary = parsed.get("summary", "")
                        folder_path = parsed.get("folder_path", "/unsorted")
                        
                        return keywords, summary, folder_path
                except json.JSONDecodeError:
                    logger.warning("Could not parse AnythingLLM JSON response")
                    return None
            else:
                logger.warning(f"AnythingLLM returned status {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.debug(f"AnythingLLM not available: {e}")
            return None
    
    @staticmethod
    def classify_with_openai(
        url: str,
        title: str,
        content: str,
        api_key: str,
        model: str = "gpt-3.5-turbo"
    ) -> Tuple[List[str], str, str]:
        """
        Classify using OpenAI API (fallback option)
        Returns: (keywords, summary, suggested_folder_path)
        """
        try:
            openai.api_key = api_key
            
            prompt = f"""Analyze this bookmark and provide:
1. 5 relevant keywords (comma-separated)
2. A brief summary (1-2 sentences)
3. A suggested folder path in Linux-style format (e.g., /tech/javascript/frameworks)

URL: {url}
Title: {title}
Content excerpt: {content[:500]}

Format your response as JSON:
{{
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "summary": "Brief summary here",
    "folder_path": "/suggested/path"
}}"""

            response = openai.ChatCompletion.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a bookmark classification assistant. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            text_response = response.choices[0].message.content.strip()
            
            # Parse JSON response
            json_start = text_response.find('{')
            json_end = text_response.rfind('}') + 1
            parsed = json.loads(text_response[json_start:json_end])
            
            keywords = parsed.get("keywords", [])[:5]
            summary = parsed.get("summary", "No summary available")
            folder_path = parsed.get("folder_path", "/unsorted")
            
            return keywords, summary, folder_path
            
        except Exception as e:
            logger.error(f"OpenAI classification failed: {e}")
            # Return defaults
            return [], f"Error: {str(e)}", "/unsorted"
    
    @staticmethod
    def classify(
        url: str,
        title: str,
        content: str,
        openai_api_key: Optional[str] = None,
        anythingllm_endpoint: Optional[str] = None,
        anythingllm_api_key: Optional[str] = None,
        prefer_local: bool = True
    ) -> Tuple[List[str], str, str]:
        """
        Unified classification with fallback chain:
        1. AnythingLLM (if prefer_local=True and available)
        2. OpenAI (if api_key provided)
        3. Basic heuristics (last resort)
        
        Returns: (keywords, summary, suggested_folder_path)
        """
        # Try AnythingLLM first if local is preferred
        if prefer_local and anythingllm_endpoint:
            result = AIClassifier.classify_with_anythingllm(
                url, title, content,
                api_endpoint=anythingllm_endpoint,
                api_key=anythingllm_api_key
            )
            if result:
                logger.info("Classified with AnythingLLM")
                return result
        
        # Fallback to OpenAI
        if openai_api_key:
            result = AIClassifier.classify_with_openai(
                url, title, content, openai_api_key
            )
            logger.info("Classified with OpenAI")
            return result
        
        # Last resort: basic heuristics
        logger.warning("No AI provider available, using basic heuristics")
        keywords = []
        
        # Extract keywords from URL and title
        text = f"{url} {title}".lower()
        common_tech = ["javascript", "python", "rust", "java", "react", "django", "ai", "ml"]
        for tech in common_tech:
            if tech in text:
                keywords.append(tech)
        
        # Determine folder from domain
        folder_path = "/unsorted"
        if "github.com" in url:
            folder_path = "/tech/code"
        elif "youtube.com" in url or "vimeo.com" in url:
            folder_path = "/media/video"
        elif any(tech in text for tech in ["javascript", "python", "programming"]):
            folder_path = "/tech/programming"
        
        return keywords[:5], f"Bookmark: {title}", folder_path


class Bookmark(BaseModel):
    @staticmethod
    def sort_bookmarks_by_relevance(api_key, bookmarks):
        openai.api_key = api_key

        # Kombiniere URLs und Titel
        inputs = [f"URL: {b[3]} Title: {b[4]}" for b in bookmarks]

        response = openai.Completion.create(
            model="text-davinci-003",
            prompt="Sort the following bookmarks by relevance:\n" + "\n".join(inputs),
            max_tokens=500
        )

        sorted_indices = response.choices[0].text.strip().split('\n')
        sorted_bookmarks = [bookmarks[int(idx)] for idx in sorted_indices if idx.isdigit()]
        return sorted_bookmarks

    @staticmethod
    def classify(api_key: str, url: str) -> str:
        """Deprecated: Use AIClassifier.classify() instead"""
        response = openai.Completion.create(
            model="text-davinci-003",
            prompt=f"Classify this URL into 5 keywords and summarize it: {url}",
            max_tokens=150
        )
        keywords = response.choices[0].text.strip().split(',')
        return keywords[:5], "Summary: " + response.choices[0].text.strip()
    