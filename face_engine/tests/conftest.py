"""Pytest setup for face_engine: env vars must exist before ``server`` imports."""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Required by server.py at import time
os.environ.setdefault("VITE_SUPABASE_PUBLISHABLE_KEY", "pytest-anon-key")
os.environ.setdefault("VITE_SUPABASE_URL", "https://pytest.example.supabase.co")

_FACE_ENGINE_ROOT = Path(__file__).resolve().parent.parent
if str(_FACE_ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(_FACE_ENGINE_ROOT))
