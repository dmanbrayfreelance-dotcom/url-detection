"""
Adversarial Lexical, Shannon Entropy, and Brand-Spoof Analyzer.
Extracts character distribution, entropy metrics, obfuscation signatures,
and brand token mismatch indicators.
"""
import math
import re
import urllib.parse
from typing import Dict, Any, List, Set, Tuple
from ..config import TARGET_BRANDS, SUSPICIOUS_TLDS

def calculate_entropy(text: str) -> float:
    """Computes Shannon entropy (bits per character) of a string."""
    if not text:
        return 0.0
    freq: Dict[str, int] = {}
    for c in text:
        freq[c] = freq.get(c, 0) + 1
    entropy = 0.0
    text_len = len(text)
    for count in freq.values():
        p = count / text_len
        entropy -= p * math.log2(p)
    return round(entropy, 4)

class LexicalEntropyAnalyzer:
    def __init__(self):
        self.target_brands = TARGET_BRANDS
        self.suspicious_tlds = SUSPICIOUS_TLDS
        # Regex for IPv4 address host
        self.ipv4_pattern = re.compile(r"^(\d{1,3}\.){3}\d{1,3}(:\d+)?$")
        # Hex or decimal encoded IP (e.g., 2130706433 or 0x7f000001)
        self.decimal_ip_pattern = re.compile(r"^0x[0-9a-fA-F]+$|^\d{8,11}$")
        # Base64-like token pattern (length >= 16, mixed alphanum + padding)
        self.base64_pattern = re.compile(r"[A-Za-z0-9+/]{16,}={0,2}")
        # Hex percent encoding %xx
        self.percent_pattern = re.compile(r"%[0-9a-fA-F]{2}")

    def analyze(self, raw_url: str, parsed_components: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes detailed lexical, entropy, and adversarial features.
        """
        hostname = parsed_components.get("hostname", "") or ""
        path = parsed_components.get("path", "") or ""
        query = parsed_components.get("query", "") or ""
        netloc = parsed_components.get("netloc", "") or ""

        # Shannon Entropies
        url_entropy = calculate_entropy(raw_url)
        domain_entropy = calculate_entropy(hostname)
        path_entropy = calculate_entropy(path)
        query_entropy = calculate_entropy(query)

        # Length metrics
        url_len = len(raw_url)
        domain_len = len(hostname)
        path_len = len(path)
        query_len = len(query)

        # Host inspection: IP address detection
        is_ip_host = False
        clean_host = hostname.split(":")[0] if ":" in hostname else hostname
        if self.ipv4_pattern.match(clean_host) or self.decimal_ip_pattern.match(clean_host):
            is_ip_host = True

        # Userinfo '@' symbol redirect detection
        has_at_symbol = "@" in raw_url

        # Percent-encoded obfuscation count
        percent_encodings = self.percent_pattern.findall(raw_url)
        percent_encoded_count = len(percent_encodings)

        # Base64-like blob detection in path or query
        base64_matches = self.base64_pattern.findall(f"{path}?{query}")
        has_base64_blob = len(base64_matches) > 0

        # Subdomain counts
        host_labels = hostname.split(".")
        num_subdomains = max(0, len(host_labels) - 2) if len(host_labels) >= 2 else 0
        tld = host_labels[-1].lower() if len(host_labels) > 0 else ""
        is_suspicious_tld = tld in self.suspicious_tlds

        # Character counts
        num_hyphens = raw_url.count("-")
        num_underscores = raw_url.count("_")
        num_dots = raw_url.count(".")
        num_slashes = raw_url.count("/")
        num_digits = sum(1 for c in raw_url if c.isdigit())
        digit_ratio = round(num_digits / max(1, url_len), 4)

        # Brand spoofing analysis:
        # Check if brand token appears in hostname/subdomain/path while registered domain is NOT authentic
        spoofed_brands = []
        is_brand_spoof = False
        url_lower = raw_url.lower()

        for brand, legit_domains in self.target_brands.items():
            # Brand is mentioned in the URL
            if brand in url_lower:
                # Is the hostname legitimately owned by the brand?
                is_legit = any(clean_host == legit or clean_host.endswith("." + legit) for legit in legit_domains)
                if not is_legit:
                    spoofed_brands.append(brand)
                    is_brand_spoof = True

        # Suspicious token heuristics
        phish_keywords = [
            "login", "signin", "verify", "verification", "secure", "account",
            "update", "banking", "wallet", "recover", "security", "confirm",
            "password", "credential", "suspend", "alert", "portal"
        ]
        found_keywords = [kw for kw in phish_keywords if kw in url_lower]

        # Adversarial heuristic risk score
        heuristic_score = 0.0
        if is_ip_host:
            heuristic_score += 0.45
        if has_at_symbol:
            heuristic_score += 0.50
        if is_brand_spoof:
            heuristic_score += 0.50
        if is_suspicious_tld:
            heuristic_score += 0.25
        if num_subdomains >= 3:
            heuristic_score += 0.20
        if domain_entropy > 4.2:
            heuristic_score += 0.20
        if has_base64_blob:
            heuristic_score += 0.15
        if len(found_keywords) >= 2 and not any(legit in clean_host for legit in sum(self.target_brands.values(), [])):
            heuristic_score += 0.30

        heuristic_score = min(1.0, heuristic_score)

        return {
            "url_length": url_len,
            "domain_length": domain_len,
            "path_length": path_len,
            "query_length": query_len,
            "shannon_entropy": {
                "url": url_entropy,
                "domain": domain_entropy,
                "path": path_entropy,
                "query": query_entropy
            },
            "is_ip_host": is_ip_host,
            "has_at_symbol": has_at_symbol,
            "percent_encoded_count": percent_encoded_count,
            "has_base64_blob": has_base64_blob,
            "num_subdomains": num_subdomains,
            "tld": tld,
            "is_suspicious_tld": is_suspicious_tld,
            "digit_count": num_digits,
            "digit_ratio": digit_ratio,
            "hyphen_count": num_hyphens,
            "dot_count": num_dots,
            "is_brand_spoof": is_brand_spoof,
            "spoofed_brands": spoofed_brands,
            "suspicious_keywords_found": found_keywords,
            "lexical_risk_score": round(heuristic_score, 4)
        }
