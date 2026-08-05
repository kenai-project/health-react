"""Tests for multilingual language enforcement in the system prompt."""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.multilingual_system_prompt import (
    MULTILINGUAL_SYSTEM_PROMPT,
    build_language_enforcement_block,
    get_multilingual_system_prompt,
    _language_name,
)
from services.prompt_builder import prompt_builder


def test_language_name_mapping():
    """Test code -> human-readable name mapping."""
    assert _language_name("te") == "Telugu"
    assert _language_name("de") == "German"
    assert _language_name("en") == "English"
    assert _language_name("hi") == "Hindi"
    assert _language_name("en-US") == "English"
    assert _language_name("") == ""


def test_build_language_enforcement_block():
    """Test the reusable enforcement block uses the human-readable name and is mandatory."""
    block = build_language_enforcement_block("te")

    assert "Telugu" in block
    assert "Preferred Response Language: Telugu" in block
    assert "mandatory" in block.lower()
    assert "ALL responses MUST be written in Telugu" in block
    # Should NOT reference the raw code 'te' as the primary instruction
    assert "Always respond in 'te'" not in block


def test_build_language_enforcement_block_empty():
    """Test empty preferred language returns empty block."""
    assert build_language_enforcement_block("") == ""
    assert build_language_enforcement_block(None) == ""


def test_language_block_is_front_loaded():
    """The mandatory language directive must be at the very top of the prompt."""
    prompt = get_multilingual_system_prompt(preferred_language="te")

    # The language block must come first
    assert prompt.startswith("# Preferred Response Language")
    assert prompt.index("# Preferred Response Language") < prompt.index("# Role")


def test_language_block_with_context():
    """Context is appended after the mandatory block and base prompt."""
    prompt = get_multilingual_system_prompt(
        additional_context="Weight: 70kg",
        preferred_language="de",
    )

    assert "# Preferred Response Language" in prompt
    assert "German" in prompt
    assert "Weight: 70kg" in prompt
    # Language block must come before health context
    assert prompt.index("# Preferred Response Language") < prompt.index("Weight: 70kg")


def test_no_preferred_language_no_block():
    """Without a preferred language, no mandatory block is added."""
    prompt = get_multilingual_system_prompt()

    assert "# Preferred Response Language" not in prompt
    assert "# Role" in prompt


def test_prompt_builder_front_loads_language():
    """analysis_service system prompt must front-load the language block."""
    prompt = prompt_builder.get_system_prompt("summary", preferred_language="te")

    assert prompt.startswith("# Preferred Response Language")
    assert "Telugu" in prompt
    assert "ALL responses MUST be written in Telugu" in prompt


def test_prompt_builder_default():
    """Without a preferred language, no mandatory block is added."""
    prompt = prompt_builder.get_system_prompt("summary")

    assert "# Preferred Response Language" not in prompt
    assert MULTILINGUAL_SYSTEM_PROMPT in prompt


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
