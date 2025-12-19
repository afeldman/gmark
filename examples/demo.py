#!/usr/bin/env python3
"""
Example script demonstrating GMARK API usage
"""

import requests
import json
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "testuser"
PASSWORD = "testpass123"
EMAIL = "test@example.com"


class GmarkClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: Optional[str] = None
    
    def register(self, username: str, password: str, email: str = ""):
        """Register a new user"""
        response = requests.post(
            f"{self.base_url}/users/register",
            json={
                "username": username,
                "password": password,
                "email": email
            }
        )
        print(f"✓ Register: {response.json()}")
        return response.json()
    
    def login(self, username: str, password: str):
        """Login and get access token"""
        response = requests.post(
            f"{self.base_url}/users/token",
            data={
                "username": username,
                "password": password
            }
        )
        data = response.json()
        self.token = data.get("access_token")
        print(f"✓ Login successful, token: {self.token[:20]}...")
        return self.token
    
    def create_folder(self, name: str, parent_path: Optional[str] = None):
        """Create a new folder"""
        response = requests.post(
            f"{self.base_url}/api/folders",
            headers={"token": self.token},
            json={
                "name": name,
                "parent_path": parent_path
            }
        )
        print(f"✓ Created folder: {response.json()}")
        return response.json()
    
    def create_bookmark(
        self,
        url: str,
        folder_path: str = "/unsorted",
        auto_classify: bool = True
    ):
        """Create a bookmark with AI classification"""
        response = requests.post(
            f"{self.base_url}/api/bookmarks",
            headers={"token": self.token},
            json={
                "url": url,
                "folder_path": folder_path,
                "auto_classify": auto_classify
            },
            params={"prefer_local_ai": True}
        )
        print(f"✓ Created bookmark: {response.json()}")
        return response.json()
    
    def get_bookmarks(self, folder_path: Optional[str] = None):
        """Get all bookmarks"""
        params = {"folder_path": folder_path} if folder_path else {}
        response = requests.get(
            f"{self.base_url}/api/bookmarks",
            headers={"token": self.token},
            params=params
        )
        return response.json()
    
    def get_folder_tree(self):
        """Get folder hierarchy"""
        response = requests.get(
            f"{self.base_url}/api/folders",
            headers={"token": self.token}
        )
        return response.json()
    
    def search_bookmarks(self, query: str):
        """Search bookmarks"""
        response = requests.get(
            f"{self.base_url}/api/bookmarks/search",
            headers={"token": self.token},
            params={"query": query}
        )
        return response.json()
    
    def move_bookmark(self, bookmark_id: int, folder_path: str):
        """Move bookmark to different folder"""
        response = requests.put(
            f"{self.base_url}/api/bookmarks/{bookmark_id}/move",
            headers={"token": self.token},
            json={"folder_path": folder_path}
        )
        return response.json()


def main():
    print("🔖 GMARK API Example")
    print("=" * 50)
    
    client = GmarkClient(BASE_URL)
    
    # 1. Register and login
    print("\n1️⃣  User Registration & Login")
    try:
        client.register(USERNAME, PASSWORD, EMAIL)
    except Exception as e:
        print(f"   (User might already exist: {e})")
    
    client.login(USERNAME, PASSWORD)
    
    # 2. Create folder structure
    print("\n2️⃣  Creating Folder Structure")
    client.create_folder("programming", None)
    client.create_folder("python", "/programming")
    client.create_folder("javascript", "/programming")
    
    # 3. Create bookmarks with AI classification
    print("\n3️⃣  Creating Bookmarks with AI Classification")
    
    bookmarks = [
        "https://react.dev",
        "https://python.org",
        "https://github.com/pytorch/pytorch",
        "https://fastapi.tiangolo.com"
    ]
    
    for url in bookmarks:
        result = client.create_bookmark(url, auto_classify=True)
        if "suggested_folder" in result:
            print(f"   AI suggested: {result['suggested_folder']}")
    
    # 4. Get folder tree
    print("\n4️⃣  Folder Tree")
    tree = client.get_folder_tree()
    print(json.dumps(tree, indent=2))
    
    # 5. Search bookmarks
    print("\n5️⃣  Searching for 'python'")
    results = client.search_bookmarks("python")
    print(f"   Found {len(results.get('bookmarks', []))} bookmarks")
    
    # 6. Get all bookmarks
    print("\n6️⃣  All Bookmarks")
    all_bookmarks = client.get_bookmarks()
    for bm in all_bookmarks.get('bookmarks', [])[:3]:  # Show first 3
        print(f"   - {bm['title']}: {bm['url']}")
    
    print("\n✅ Demo completed!")
    print("\nNext steps:")
    print("- Open static/chrome-ai-demo.html for Chrome AI demo")
    print("- Configure AnythingLLM for local AI classification")
    print("- Add OpenAI key to .env for cloud fallback")


if __name__ == "__main__":
    main()
