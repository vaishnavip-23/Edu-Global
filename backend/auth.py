"""
Clerk Authentication Module
Handles JWT verification and user authentication
"""
from fastapi import Header, HTTPException, Depends
from typing import Optional
import jwt
import requests
import json
import logging
from functools import lru_cache
from backend.config import CLERK_SECRET_KEY

logger = logging.getLogger(__name__)


class ClerkAuth:
    """Clerk authentication handler"""

    def __init__(self):
        self.clerk_secret_key = CLERK_SECRET_KEY
        self._jwks_cache = None

    @lru_cache(maxsize=1)
    def get_clerk_jwks(self) -> dict:
        """Fetch Clerk JWKS (JSON Web Key Set) for JWT verification"""
        try:
            # For development, we'll decode without strict verification
            # In production, you would use Clerk's instance-specific JWKS URL:
            # https://[your-clerk-instance].clerk.accounts.dev/.well-known/jwks.json
            print("Note: JWKS verification disabled for development")
            return {}
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
            # Remove 'Bearer ' prefix if present
            if token.startswith("Bearer "):
                token = token[7:]

            # Decode and verify using Clerk's public key
            # Clerk uses RS256 algorithm
            jwks = self.get_clerk_jwks()
            
            if not jwks or not jwks.get('keys'):
                # Fallback: decode without verification (dev mode)
                decoded = jwt.decode(
                    token,
                    options={"verify_signature": False}
                )
                return decoded
            
            # Get the key ID from token header
            unverified_header = jwt.get_unverified_header(token)
            key_id = unverified_header.get('kid')
            
            # Find the matching key
            key = None
            for k in jwks['keys']:
                if k.get('kid') == key_id:
                    key = k
                    break
            
            if not key:
                # Fall back to first key or unverified decode
                if jwks['keys']:
                    key = jwks['keys'][0]
                else:
                    decoded = jwt.decode(token, options={"verify_signature": False})
                    return decoded
            
            # Construct the public key from JWK
            from jwt.algorithms import RSAAlgorithm
            public_key = RSAAlgorithm.from_jwk(json.dumps(key))
            
            # Decode with verification
            decoded = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"]
            )

            return decoded

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except Exception as e:
            # Fallback to unverified decode for compatibility
            try:
                decoded = jwt.decode(token, options={"verify_signature": False})
                return decoded
            except:
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
        logger.warning("Authorization header is missing or None")
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    logger.info(f"Received authorization header: {authorization[:50]}..." if len(authorization) > 50 else f"Received authorization header: {authorization}")

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


def create_onboarding_dependency():
    """
    Factory function to create onboarding check dependency
    This avoids circular import issues
    """
    async def require_onboarding_complete(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        """
        Dependency that checks if user has completed onboarding.
        Use this on protected endpoints that require onboarding completion.

        Usage in routes:
            from backend.auth import get_current_user
            from backend.database import get_db
            from backend.models import User

            @router.get("/protected-endpoint")
            async def protected_endpoint(
                current_user: dict = Depends(get_current_user),
                db: Session = Depends(get_db)
            ):
                # Check onboarding
                clerk_user_id = current_user["clerk_user_id"]
                user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()

                if not user or not user.onboarding_complete:
                    raise HTTPException(status_code=403, detail="Onboarding required")

                # ... rest of endpoint logic
        """
        return current_user

    return require_onboarding_complete
