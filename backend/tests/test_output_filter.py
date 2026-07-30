"""Tests for OutputFilter — LLM response filtering and compliance."""

import os
import sys
import pytest

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from services.output_filter import OutputFilter, output_filter


@pytest.fixture
def filter_():
    return OutputFilter()


# ---------------------------------------------------------------------------
# System Prompt Leak Detection Tests
# ---------------------------------------------------------------------------

class TestSystemPromptLeak:
    def test_no_leak_normal_response(self, filter_):
        """Normal response without system prompt fragments is clean."""
        response = "The patient has high blood pressure. Please consult a doctor."
        result = filter_._check_system_prompt_leak(response)
        assert result is None

    def test_detect_full_fragment(self, filter_):
        """Response containing system prompt fragment is detected."""
        response = "The document shows normal results. You are a medical document assistant. The patient is healthy."
        result = filter_._check_system_prompt_leak(response)
        assert result is not None
        assert "medical document assistant" in result.lower()

    def test_leak_in_filtered_response(self, filter_):
        """Full filter pipeline detects and redacts leaks."""
        response = "Here is the summary. You are a medical document assistant. Always follow those rules."
        result = filter_.filter_response(response, "SUMMARY")
        assert result["system_prompt_leaked"] is True
        assert "medical document assistant" not in result["content"].lower()
        assert "[REDACTED]" in result["content"]
        assert len(result["warnings"]) > 0

    def test_no_false_positive_similar_text(self, filter_):
        """Contextual mention of assistant is not flagged if no exact fragment match."""
        response = "The patient asked if you could help with their document."
        result = filter_._check_system_prompt_leak(response)
        assert result is None

    def test_case_insensitive_detection(self, filter_):
        """System prompt detection is case-insensitive."""
        response = "YOU ARE A MEDICAL DOCUMENT ASSISTANT"
        result = filter_._check_system_prompt_leak(response)
        assert result is not None

    def test_empty_response_no_leak(self, filter_):
        """Empty response has no leak."""
        assert filter_._check_system_prompt_leak("") is None


# ---------------------------------------------------------------------------
# Medical Disclaimer Tests
# ---------------------------------------------------------------------------

class TestMedicalDisclaimer:
    def test_disclaimer_required_for_lab_report(self, filter_):
        """Lab report analysis requires disclaimer."""
        response = "Your LDL cholesterol is high."
        result = filter_.filter_response(response, "LAB_REPORT")
        assert result["disclaimer_added"] is True
        assert "educational" in result["content"]
        assert "consult a qualified" in result["content"].lower()

    def test_disclaimer_required_for_prescription(self, filter_):
        """Prescription analysis requires disclaimer."""
        response = "Take 500mg of Metformin twice daily."
        result = filter_.filter_response(response, "PRESCRIPTION")
        assert result["disclaimer_added"] is True

    def test_disclaimer_not_required_for_summary(self, filter_):
        """Summary analysis does not require disclaimer."""
        response = "The document summarizes patient vitals."
        result = filter_.filter_response(response, "SUMMARY")
        assert result["disclaimer_added"] is False

    def test_disclaimer_not_required_for_explanation(self, filter_):
        """Explanation analysis does not require disclaimer."""
        response = "This explains the lab results."
        result = filter_.filter_response(response, "EXPLANATION")
        assert result["disclaimer_added"] is False

    def test_disclaimer_not_duplicated(self, filter_):
        """If disclaimer already present, do not add another."""
        response = "Your results are normal. This information is for educational purposes only. Always consult a qualified healthcare professional for diagnosis or treatment."
        result = filter_.filter_response(response, "LAB_REPORT")
        assert result["disclaimer_added"] is False

    def test_disclaimer_with_variant_text(self, filter_):
        """Variant disclaimer text is recognized."""
        variants = [
            "This is for educational purposes",
            "consult your healthcare provider",
            "not medical advice",
            "always consult a",
            "educational purposes only",
        ]
        for variant in variants:
            response = f"Your results are normal. {variant}"
            result = filter_.filter_response(response, "LAB_REPORT")
            assert result["disclaimer_added"] is False, f"False positive for: {variant}"

    def test_disclaimer_check_utility(self, filter_):
        """_has_disclaimer correctly identifies disclaimer text."""
        assert filter_._has_disclaimer("Always consult a qualified healthcare professional.") is True
        assert filter_._has_disclaimer("This is for educational purposes.") is True
        assert filter_._has_disclaimer("Normal lab results") is False


# ---------------------------------------------------------------------------
# PII Detection Tests
# ---------------------------------------------------------------------------

class TestPIIDetection:
    def test_detect_ssn_not_in_source(self, filter_):
        """SSN in response not in source is flagged."""
        response = "Patient SSN is 123-45-6789"
        source = "Normal lab results"
        result = filter_._check_pii(response, source)
        assert result is not None
        assert "SSN" in result

    def test_ssn_in_source_not_flagged(self, filter_):
        """SSN present in source is not flagged."""
        response = "Patient SSN is 123-45-6789"
        source = "Patient SSN is 123-45-6789"
        result = filter_._check_pii(response, source)
        assert result is None

    def test_detect_credit_card(self, filter_):
        """Credit card pattern in response is flagged."""
        response = "Card: 4111-1111-1111-1111"
        source = "Normal text"
        result = filter_._check_pii(response, source)
        assert result is not None
        assert "Credit card" in result

    def test_no_pii_normal(self, filter_):
        """Normal response without PII is clean."""
        response = "Patient has high blood pressure."
        source = "Normal lab results"
        result = filter_._check_pii(response, source)
        assert result is None

    def test_pii_in_filter_response_warning(self, filter_):
        """Full filter pipeline reports PII warning."""
        response = "Patient SSN is 123-45-6789 and they have hypertension."
        source = "Lab results show hypertension"
        result = filter_.filter_response(response, "SUMMARY", source)
        assert len(result["warnings"]) > 0
        assert "PII" in result["warnings"][0] or "SSN" in result["warnings"][0]


# ---------------------------------------------------------------------------
# Full Pipeline Integration Tests
# ---------------------------------------------------------------------------

class TestFullFilterPipeline:
    def test_filter_preserves_normal_response(self, filter_):
        """Normal response passes through unchanged."""
        response = "The patient's blood pressure is 120/80, which is normal."
        result = filter_.filter_response(response, "SUMMARY")
        assert result["content"] == response
        assert result["warnings"] == []
        assert result["system_prompt_leaked"] is False

    def test_filter_appends_disclaimer_correctly(self, filter_):
        """Disclaimer is appended with proper formatting."""
        response = "Your LDL is high."
        result = filter_.filter_response(response, "LAB_REPORT")
        assert result["content"].startswith("Your LDL is high.")
        # Check for the warning emoji
        assert "⚠" in result["content"] or "educational" in result["content"]

    def test_multiple_warnings_on_same_response(self, filter_):
        """Multiple issues are all reported."""
        # Create a response with system prompt leak in a LAB_REPORT context
        response = "You are a medical document assistant. The patient SSN is 123-45-6789."
        source = "Lab results"
        result = filter_.filter_response(response, "LAB_REPORT", source)
        assert result["system_prompt_leaked"] is True
        assert len(result["warnings"]) >= 1


# ---------------------------------------------------------------------------
# Global Instance
# ---------------------------------------------------------------------------

class TestGlobalInstance:
    def test_global_instance_exists(self):
        """Global instance is available."""
        from services.output_filter import output_filter
        assert output_filter is not None
        assert isinstance(output_filter, OutputFilter)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
