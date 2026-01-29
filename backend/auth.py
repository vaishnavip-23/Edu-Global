"""
Clerk Authentication Module
Handles JWT verification and user authentication
"""
from fastapi import Header, HTTPException, Depends
from typing import Optional
import jwt
import requests
from functools import lru_cache
from backend.config import CLERK_SECRET_KEY


class ClerkAuth:
    """Clerk authentication handler"""

    def __init__(self):
        self.clerk_secret_key = CLERK_SECRET_KEY
        self._jwks_cache = None

    @lru_cache(maxsize=1)
    def get_clerk_jwks(self) -> dict:
        """Fetch Clerk JWKS (JSON Web Key Set) for JWT verification"""
        try:
            # Clerk JWKS endpoint - contains public keys for verification
            response = requests.get(
                "https://api.clerk.com/v1/jwks",
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching Clerk JWKS: {e}")
            return {}

    def verify_token(self, token: str) -> dict:
        """
        Verify Clerk JWT token and return decoded payload
        Returns the user's clerk_user_id (sub claim)
        """
        if not token:
            raise HTTPException(status_code=401, detail="No authorization token provided")

        try:
            # For development: If using Clerk secret key directly
            # In production, you should verify using JWKS

            # Remove 'Bearer ' prefix if present
            if token.startswith("Bearer "):
                token = token[7:]

            # Decode without verification for now (development only)
            # In production, implement proper JWT verification with JWKS
            decoded = jwt.decode(
                token,
                options={"verify_signature": False}  # WARNING: Only for development
            )

            return decoded

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")


# Global auth instance
clerk_auth = ClerkAuth()


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> dict:
    """
    Dependency to get current authenticated user from Clerk token
    Returns user info including clerk_user_id
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    # Verify and decode the token
    user_data = clerk_auth.verify_token(authorization)

    # Extract clerk_user_id from 'sub' claim
    clerk_user_id = user_data.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token: missing user ID"
        )

    return {
        "clerk_user_id": clerk_user_id,
        "email": user_data.get("email", ""),
        "full_data": user_data
    }


async def get_optional_user(
    authorization: Optional[str] = Header(None)
) -> Optional[dict]:
    """
    Optional authentication - returns user if authenticated, None otherwise
    Useful for endpoints that work with or without authentication
    """
    if not authorization:
        return None

    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
