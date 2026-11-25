"""
Explainability Module: Token Attention Weight Extractor and Rationale Generator.
Extracts token-level attention weights from the Scaled Dot-Product Fusion Attention layer,
maps them to character spans, assigns color heat tiers, and generates human-interpretable
cybersecurity rationales for security analysts.
"""
from typing import List, Dict, Any, Optional
import numpy as np

from ..preprocessing.url_sanitizer import URLSanitizer
from ..preprocessing.homoglyph_guard import HomoglyphGuard
from ..preprocessing.free_host_analyzer import FreeHostAnalyzer
from ..preprocessing.lexical_entropy import LexicalEntropyAnalyzer
from ..embeddings.static_embeddings import StaticEmbeddingExtractor
from ..embeddings.transformer_embeddings import ContextualTransformerExtractor
from ..models.trackphish_1dcnn import NumpyTrackPhish1DCNN

class TokenExplainabilityEngine:
    def __init__(self, max_seq_len: int = 128):
        self.sanitizer = URLSanitizer(max_sequence_length=max_seq_len)
        self.homoglyph_guard = HomoglyphGuard()
        self.free_host_analyzer = FreeHostAnalyzer()
        self.lexical_analyzer = LexicalEntropyAnalyzer()

        self.static_embedder = StaticEmbeddingExtractor(max_seq_len=max_seq_len)
        self.trans_embedder = ContextualTransformerExtractor(max_seq_len=max_seq_len)
        self.teacher_model = NumpyTrackPhish1DCNN(seq_len=max_seq_len)

    def explain_url(self, raw_url: str) -> Dict[str, Any]:
        """
        Runs full feature extraction, fusion attention, and generates token-level explainability.
        """
        # 1. Parsing & Tokenization
        parsed = self.sanitizer.parse_url(raw_url)
        token_objects = self.sanitizer.tokenize_url(raw_url)
        token_strings = [t["token"] for t in token_objects]

        # 2. Enhanced guards & analyzers
        homoglyph_res = self.homoglyph_guard.analyze(raw_url)
        free_host_res = self.free_host_analyzer.analyze(raw_url, parsed)
        lexical_res = self.lexical_analyzer.analyze(raw_url, parsed)

        # 3. Embedding extraction
        static_seq = self.static_embedder.extract_static_sequence(token_strings)  # [128, 300]
        trans_seq = self.trans_embedder.extract_contextual_sequence(token_strings)  # [128, 128]
        combined_embeddings = np.concatenate([static_seq, trans_seq], axis=-1)  # [128, 428]

        # 4. Auxiliary feature vector
        aux_features = np.array([
            lexical_res["lexical_risk_score"],
            homoglyph_res["homoglyph_risk_score"],
            free_host_res["free_hosting_risk_score"],
            1.0 if lexical_res["is_brand_spoof"] else 0.0,
            1.0 if lexical_res["is_ip_host"] else 0.0,
            float(lexical_res["shannon_entropy"]["domain"]) / 8.0
        ], dtype=np.float32)

        # 5. Teacher inference & Attention extraction
        raw_prob, attention_weights = self.teacher_model.predict_url(combined_embeddings, aux_features)

        # Domain legitimacy check: if host is in genuine brand list or major authoritative top sites
        is_known_legit_domain = False
        clean_host = parsed.get("hostname", "").lower()
        from ..config import TARGET_BRANDS
        for _, legit_list in TARGET_BRANDS.items():
            if any(clean_host == l or clean_host.endswith("." + l) for l in legit_list):
                if not homoglyph_res["is_homoglyph_attack"] and not lexical_res["is_brand_spoof"] and not free_host_res["is_free_hosting"]:
                    is_known_legit_domain = True
                    break

        # Blend with algorithmic risk factors for robust zero-day detection
        if is_known_legit_domain:
            final_probability = min(0.15, raw_prob * 0.3)
        else:
            blended_risk = max(
                raw_prob,
                homoglyph_res["homoglyph_risk_score"] * 0.95,
                free_host_res["free_hosting_risk_score"] * 0.92,
                0.92 if (lexical_res["is_brand_spoof"] and (free_host_res["is_free_hosting"] or homoglyph_res["is_homoglyph_attack"])) else 0.0,
                0.88 if lexical_res["is_ip_host"] else 0.0,
                0.85 if lexical_res["has_at_symbol"] else 0.0,
                0.85 if lexical_res["is_brand_spoof"] else 0.0,
                0.75 if (free_host_res["is_url_shortener"] and free_host_res["abused_brands"]) else 0.0
            )
            final_probability = float(min(1.0, max(0.02, blended_risk)))

        # 6. Map attention weights to tokens
        annotated_tokens: List[Dict[str, Any]] = []
        num_extracted_tokens = len(token_objects)

        for i, tok_obj in enumerate(token_objects):
            w = float(attention_weights[i]) if i < len(attention_weights) else 0.05
            tok_text = tok_obj["token"].lower()

            # Boost attention for known malicious indicators
            reasons = []
            if tok_text in lexical_res.get("spoofed_brands", []):
                w = max(w, 0.92)
                reasons.append(f"Targeted brand token spoofing ('{tok_text}')")

            if any(sub["original"] in tok_text for sub in homoglyph_res.get("substitutions", [])):
                w = max(w, 0.95)
                reasons.append(f"Confusable homoglyph / mixed-script character")

            if free_host_res["is_free_hosting"] and tok_text in [free_host_res.get("matched_free_host"), "sites", "wixsite", "weebly", "webflow"]:
                w = max(w, 0.85)
                reasons.append(f"Free hosting infrastructure domain ({tok_text})")

            if free_host_res["is_url_shortener"] and tok_text in [free_host_res.get("matched_shortener"), "bit", "tinyurl"]:
                w = max(w, 0.80)
                reasons.append(f"Known URL shortener mask ({tok_text})")

            if tok_text in ["signin", "login", "verify", "secure", "banking", "wallet", "account", "recover"]:
                w = max(w, 0.78)
                reasons.append(f"High-risk authentication credential keyword ('{tok_text}')")

            if tok_text == "@":
                w = max(w, 0.98)
                reasons.append("Credential @ delimiter redirection trick")

            if lexical_res["is_ip_host"] and tok_obj["category"] == "hostname":
                w = max(w, 0.90)
                reasons.append("Direct IP address hostname instead of registered domain")

            # Tier classification
            if w >= 0.75:
                tier = "critical"
                color_hex = "#ef4444"  # Red
            elif w >= 0.50:
                tier = "high"
                color_hex = "#f97316"  # Orange
            elif w >= 0.25:
                tier = "moderate"
                color_hex = "#eab308"  # Yellow
            else:
                tier = "low"
                color_hex = "#10b981" if final_probability < 0.5 else "#6b7280"  # Green or Muted

            annotated_tokens.append({
                "index": i,
                "token": tok_obj["token"],
                "category": tok_obj["category"],
                "start": tok_obj["start"],
                "end": tok_obj["end"],
                "attention_weight": round(w, 4),
                "heat_tier": tier,
                "color": color_hex,
                "rationales": reasons or ["Standard lexical pattern"]
            })

        # Key threat indicators list
        threat_indicators = []
        if homoglyph_res["is_homoglyph_attack"]:
            threat_indicators.append(f"Homoglyph/IDN Attack Detected: {len(homoglyph_res['substitutions'])} confusable characters (Script: {', '.join(homoglyph_res['detected_scripts'])})")
        if free_host_res["flag_reason"]:
            threat_indicators.append(free_host_res["flag_reason"])
        if lexical_res["is_brand_spoof"]:
            threat_indicators.append(f"Brand Spoofing: Impersonating {lexical_res['spoofed_brands']} on unauthorized domain")
        if lexical_res["is_ip_host"]:
            threat_indicators.append("Host Obfuscation: Uses raw IP address as domain")
        if lexical_res["has_at_symbol"]:
            threat_indicators.append("Redirection Deception: Contains '@' userinfo credential redirect")
        if lexical_res["shannon_entropy"]["domain"] > 4.2:
            threat_indicators.append(f"High Shannon Domain Entropy ({lexical_res['shannon_entropy']['domain']}): indicates algorithmic or generated domain")

        return {
            "url": raw_url,
            "is_phishing": final_probability >= 0.5,
            "phishing_probability": round(final_probability, 4),
            "threat_level": (
                "CRITICAL_PHISHING" if final_probability >= 0.85
                else "SUSPICIOUS_PHISHING" if final_probability >= 0.50
                else "LOW_RISK_BENIGN" if final_probability >= 0.20
                else "SAFE_LEGITIMATE"
            ),
            "model_mode": "teacher_attention",
            "tokens": annotated_tokens,
            "threat_indicators": threat_indicators,
            "parsed_structure": parsed,
            "homoglyph_analysis": homoglyph_res,
            "free_host_analysis": free_host_res,
            "lexical_analysis": lexical_res
        }
