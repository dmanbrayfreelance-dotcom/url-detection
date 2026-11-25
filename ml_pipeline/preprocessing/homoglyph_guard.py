"""
Multilingual IDN and Homoglyph Normalizer.
Detects Punycode (xn--), mixed-script attacks (Cyrillic, Greek, Latin confusables),
normalizes lookalikes to ASCII equivalents, and scores homoglyph attack risks.
"""
import unicodedata
from typing import Dict, Any, List, Tuple
from ..config import TARGET_BRANDS

# Comprehensive confusable dictionary mapping lookalike unicode characters to standard ASCII
HOMOGLYPH_MAP: Dict[str, str] = {
    # Cyrillic small letters
    '\u0430': 'a',  # а -> a
    '\u0435': 'e',  # е -> e
    '\u043e': 'o',  # о -> o
    '\u0440': 'p',  # р -> p
    '\u0441': 'c',  # с -> c
    '\u0443': 'y',  # у -> y
    '\u0445': 'x',  # х -> x
    '\u0456': 'i',  # і -> i
    '\u0458': 'j',  # ј -> j
    '\u0455': 's',  # ѕ -> s
    '\u0501': 'd',  # ԁ -> d
    '\u051b': 'q',  # ԛ -> q
    '\u051d': 'w',  # ԝ -> w
    '\u0475': 'v',  # ѵ -> v
    '\u04bb': 'h',  # һ -> h
    '\u04cf': 'l',  # ӏ -> l
    '\u043d': 'n',  # н (looks like H)
    '\u0432': 'b',  # в
    '\u043c': 'm',  # м
    '\u0442': 't',  # т

    # Cyrillic capital letters
    '\u0410': 'A',  # А
    '\u0412': 'B',  # В
    '\u0421': 'C',  # С
    '\u0415': 'E',  # Е
    '\u041d': 'H',  # Н
    '\u0406': 'I',  # І
    '\u0408': 'J',  # Ј
    '\u041a': 'K',  # К
    '\u041c': 'M',  # М
    '\u041e': 'O',  # О
    '\u0420': 'P',  # Р
    '\u0422': 'T',  # Т
    '\u0425': 'X',  # Х
    '\u0423': 'Y',  # У

    # Greek small & capitals
    '\u03b1': 'a',  # α
    '\u03b5': 'e',  # ε
    '\u03b9': 'i',  # ι
    '\u03ba': 'k',  # κ
    '\u03bf': 'o',  # ο
    '\u03c1': 'p',  # ρ
    '\u03bd': 'v',  # ν
    '\u03c7': 'x',  # χ
    '\u03c5': 'u',  # υ
    '\u0391': 'A',  # Α
    '\u0392': 'B',  # B
    '\u0395': 'E',  # E
    '\u0396': 'Z',  # Z
    '\u0397': 'H',  # H
    '\u0399': 'I',  # I
    '\u039a': 'K',  # K
    '\u039c': 'M',  # M
    '\u039d': 'N',  # N
    '\u039f': 'O',  # O
    '\u03a1': 'P',  # P
    '\u03a4': 'T',  # T
    '\u03a5': 'Y',  # Y
    '\u03a7': 'X',  # X

    # Latin extended with accents / diacritics
    '\u00e0': 'a', '\u00e1': 'a', '\u00e2': 'a', '\u00e3': 'a', '\u00e4': 'a', '\u00e5': 'a',
    '\u00e8': 'e', '\u00e9': 'e', '\u00ea': 'e', '\u00eb': 'e',
    '\u00ec': 'i', '\u00ed': 'i', '\u00ee': 'i', '\u00ef': 'i',
    '\u00f2': 'o', '\u00f3': 'o', '\u00f4': 'o', '\u00f5': 'o', '\u00f6': 'o', '\u00f8': 'o',
    '\u00f9': 'u', '\u00fa': 'u', '\u00fb': 'u', '\u00fc': 'u',
    '\u00fd': 'y', '\u00ff': 'y',
    '\u00e7': 'c', '\u00f1': 'n',
    '\u0142': 'l', '\u0153': 'oe', '\u00df': 'ss'
}

# Add Fullwidth Latin characters (U+FF01 to U+FF5E)
for code in range(0xFF01, 0xFF5F):
    HOMOGLYPH_MAP[chr(code)] = chr(code - 0xFEE0)


class HomoglyphGuard:
    def __init__(self):
        self.homoglyph_map = HOMOGLYPH_MAP

    def detect_char_script(self, char: str) -> str:
        """Determines script of a unicode character."""
        name = unicodedata.name(char, "")
        if "CYRILLIC" in name:
            return "Cyrillic"
        elif "GREEK" in name:
            return "Greek"
        elif "ARABIC" in name:
            return "Arabic"
        elif "HEBREW" in name:
            return "Hebrew"
        elif any(s in name for s in ["CJK", "HIRAGANA", "KATAKANA", "HANGUL"]):
            return "EastAsian"
        elif "LATIN" in name:
            return "Latin"
        elif "DIGIT" in name or char.isdigit():
            return "Numeric"
        elif not char.isalnum():
            return "Punctuation"
        return "Other"

    def decode_punycode_labels(self, domain: str) -> Tuple[str, bool]:
        """
        Detects and decodes IDN Punycode segments (e.g. xn--...).
        Returns (decoded_domain, has_punycode_flag).
        """
        labels = domain.split(".")
        decoded_labels = []
        has_punycode = False

        for label in labels:
            if label.lower().startswith("xn--"):
                has_punycode = True
                try:
                    decoded = label.encode("ascii").decode("idna")
                    decoded_labels.append(decoded)
                except Exception:
                    decoded_labels.append(label)
            else:
                decoded_labels.append(label)

        return ".".join(decoded_labels), has_punycode

    def analyze(self, domain_or_url: str) -> Dict[str, Any]:
        """
        Analyzes string for Punycode, mixed scripts, homoglyph lookalikes,
        and produces normalized ASCII representation with risk score.
        """
        # Step 1: Decode Punycode if present
        decoded_text, has_punycode = self.decode_punycode_labels(domain_or_url)

        scripts_found = set()
        substitutions = []
        normalized_chars = []
        confusable_count = 0
        total_chars = 0

        for idx, ch in enumerate(decoded_text):
            if ch in {".", ":", "/", "?", "=", "&", "-", "_", "#", "%"}:
                normalized_chars.append(ch)
                continue

            total_chars += 1
            script = self.detect_char_script(ch)
            scripts_found.add(script)

            if ch in self.homoglyph_map:
                confusable_count += 1
                norm_c = self.homoglyph_map[ch]
                normalized_chars.append(norm_c)
                substitutions.append({
                    "position": idx,
                    "original": ch,
                    "unicode_hex": f"U+{ord(ch):04X}",
                    "normalized": norm_c,
                    "script": script,
                    "character_name": unicodedata.name(ch, "UNKNOWN")
                })
            else:
                # Normal ASCII or other characters
                normalized_chars.append(ch)

        normalized_ascii = "".join(normalized_chars)

        # Mixed script detection: Latin combined with Cyrillic or Greek is a strong indicator
        has_mixed_script = ("Latin" in scripts_found) and bool(
            scripts_found.intersection({"Cyrillic", "Greek", "Arabic", "EastAsian"})
        )

        # Risk scoring
        risk_score = 0.0
        if has_punycode:
            risk_score += 0.4
        if has_mixed_script:
            risk_score += 0.5
        if confusable_count > 0:
            char_ratio = confusable_count / max(1, total_chars)
            risk_score += min(0.4, char_ratio * 0.8)

        # Check if normalized domain matches a high-value targeted brand
        detected_target_brand = None
        for brand, legit_domains in TARGET_BRANDS.items():
            if brand in normalized_ascii.lower() and brand not in decoded_text.lower():
                # The word appears ONLY after homoglyph normalization -> definite spoofing!
                detected_target_brand = brand
                risk_score = max(risk_score, 0.95)
                break
            elif brand in normalized_ascii.lower():
                # Check if it's on the genuine domain
                is_legit = any(legit in decoded_text.lower() for legit in legit_domains)
                if not is_legit and confusable_count > 0:
                    detected_target_brand = brand
                    risk_score = max(risk_score, 0.90)

        risk_score = min(1.0, risk_score)

        return {
            "has_punycode": has_punycode,
            "decoded_domain": decoded_text,
            "has_mixed_script": has_mixed_script,
            "detected_scripts": sorted(list(scripts_found)),
            "confusable_count": confusable_count,
            "substitutions": substitutions,
            "normalized_ascii": normalized_ascii,
            "homoglyph_risk_score": round(risk_score, 4),
            "is_homoglyph_attack": risk_score >= 0.45 or has_mixed_script,
            "detected_target_brand": detected_target_brand
        }
