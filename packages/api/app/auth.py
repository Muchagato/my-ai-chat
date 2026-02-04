"""
Anthropic Authentication Module

Handles setup token validation, storage, and retrieval for
authenticating with Claude using personal account tokens.

Setup tokens are obtained by running `claude setup-token` in the terminal
and have the format: sk-ant-oat01-...
"""

import os
import json
from pathlib import Path
from typing import Optional
from pydantic import BaseModel

# Accepted token prefixes (setup tokens and regular API keys)
ANTHROPIC_TOKEN_PREFIXES = ("sk-ant-oat01-", "sk-ant-api03-", "sk-ant-")
ANTHROPIC_TOKEN_MIN_LENGTH = 40
TOKEN_FILE = Path(__file__).parent.parent / ".anthropic_token"


class TokenCredential(BaseModel):
    """Stored token credential"""
    type: str = "token"
    provider: str = "anthropic"
    token: str
    profile_name: str = "default"


def validate_anthropic_setup_token(raw: str) -> Optional[str]:
    """
    Validate an Anthropic token (setup token or API key).

    Returns None if valid, error message if invalid.
    """
    trimmed = raw.strip()

    if not trimmed:
        return "Token is required"

    if not any(trimmed.startswith(prefix) for prefix in ANTHROPIC_TOKEN_PREFIXES):
        return f"Expected token starting with one of: {', '.join(ANTHROPIC_TOKEN_PREFIXES)}"

    if len(trimmed) < ANTHROPIC_TOKEN_MIN_LENGTH:
        return "Token looks too short"

    return None


def save_token(token: str, profile_name: str = "default") -> None:
    """Save the token to local storage."""
    credential = TokenCredential(
        token=token.strip(),
        profile_name=profile_name
    )
    TOKEN_FILE.write_text(credential.model_dump_json())


def load_token() -> Optional[str]:
    """Load the stored token, if any."""
    if not TOKEN_FILE.exists():
        return None

    try:
        data = json.loads(TOKEN_FILE.read_text())
        return data.get("token")
    except (json.JSONDecodeError, KeyError):
        return None


def delete_token() -> bool:
    """Delete the stored token."""
    if TOKEN_FILE.exists():
        TOKEN_FILE.unlink()
        return True
    return False


def get_token_preview(token: str) -> str:
    """Get a safe preview of the token for display."""
    if len(token) < 20:
        return "***"
    return f"{token[:15]}...{token[-4:]}"


def is_authenticated() -> bool:
    """Check if a valid token is stored."""
    token = load_token()
    if not token:
        return False
    return validate_anthropic_setup_token(token) is None
