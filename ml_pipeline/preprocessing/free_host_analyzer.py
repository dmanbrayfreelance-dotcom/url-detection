"""
Path-Aware Free-Hosting and Short-URL Guard.
Separates trusted hosting/builder root domains from user-controlled paths/subdomains,
and inspects URL shorteners without performing external live-fetching.
"""
import re
import urllib.parse
from typing import Dict, Any, List, Optional
from ..config import KNOWN_FREE_HOSTS, KNOWN_SHORTENERS, TARGET_BRANDS

class FreeHostAnalyzer:
    def __init__(self):
        self.known_free_hosts = KNOWN_FREE_HOSTS
        self.known_shorteners = KNOWN_SHORTENERS
        self.target_brands = TARGET_BRANDS

    def is_free_host(self, hostname: str) -> Tuple_Bool_Match:
        """Checks if hostname ends with or matches a known free hosting domain."""
        host_lower = hostname.lower()
        for fh in self.known_free_hosts:
            if host_lower == fh or host_lower.endswith("." + fh):
                return True, fh
        return False, None

    def is_shortener(self, hostname: str) -> Tuple_Bool_Match:
        """Checks if hostname matches a known URL shortener service."""
        host_lower = hostname.lower()
        for sh in self.known_shorteners:
            if host_lower == sh or host_lower.endswith("." + sh):
                return True, sh
        return False, None

    def analyze(self, raw_url: str, parsed_components: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Performs path-aware analysis of free-hosting platforms and shorteners.
        Detects brand abuse embedded in free hosting subdomains and paths.
        """
        if not parsed_components:
            parsed = urllib.parse.urlsplit(raw_url if "://" in raw_url else "http://" + raw_url)
            hostname = parsed.hostname or ""
            path = parsed.path
            query = parsed.query
        else:
            hostname = parsed_components.get("hostname", "")
            path = parsed_components.get("path", "")
            query = parsed_components.get("query", "")

        host_lower = hostname.lower()
        full_lower = f"{host_lower}{path.lower()}?{query.lower()}"

        is_fh, matched_fh = self.is_free_host(host_lower)
        is_sh, matched_sh = self.is_shortener(host_lower)

        subdomain_part = ""
        if is_fh and matched_fh and host_lower.endswith("." + matched_fh):
            subdomain_part = host_lower[:-len("." + matched_fh)]

        # Check for brand impersonation inside user-controlled parts (subdomain, path, query)
        abused_brands: List[str] = []
        user_controlled_text = f"{subdomain_part} {path.lower()} {query.lower()}"

        for brand, legit_domains in self.target_brands.items():
            # If the free host itself is owned by the brand (e.g. sites.google.com and brand google),
            # check whether the user subpart is masquerading as another brand
            if brand in user_controlled_text:
                # E.g. 'paypal' in 'paypal-update.sites.google.com'
                abused_brands.append(brand)

        # Shortener specific inspection
        shortener_slug = ""
        slug_entropy = 0.0
        shortener_risk = 0.0
        if is_sh:
            shortener_slug = path.strip("/")
            if shortener_slug:
                # Slug entropy calculation
                from .lexical_entropy import calculate_entropy
                slug_entropy = calculate_entropy(shortener_slug)
                # Shorteners with security/bank/login keywords in the slug are high risk
                for b in self.target_brands:
                    if b in shortener_slug.lower():
                        abused_brands.append(b)
            shortener_risk = 0.65 if abused_brands else 0.40

        # Free hosting risk calculation
        free_host_risk = 0.0
        if is_fh:
            if abused_brands:
                free_host_risk = 0.92  # High confidence phishing: brand on free host
            else:
                # Check for sensitive phishing keywords in path/subdomain
                sensitive_keywords = ["login", "signin", "verify", "secure", "account", "update", "banking", "wallet", "recover", "support"]
                found_keywords = [kw for kw in sensitive_keywords if kw in user_controlled_text]
                if found_keywords:
                    free_host_risk = 0.85
                else:
                    free_host_risk = 0.35  # Medium scrutiny just for being a free site

        overall_risk = max(free_host_risk, shortener_risk)

        return {
            "is_free_hosting": is_fh,
            "matched_free_host": matched_fh,
            "user_controlled_subdomain": subdomain_part,
            "is_url_shortener": is_sh,
            "matched_shortener": matched_sh,
            "shortener_slug": shortener_slug,
            "shortener_slug_entropy": round(slug_entropy, 3),
            "abused_brands": list(set(abused_brands)),
            "free_hosting_risk_score": round(overall_risk, 4),
            "flag_reason": (
                f"Target brand(s) {abused_brands} abused on free hosting service ({matched_fh})"
                if is_fh and abused_brands
                else f"URL shortener ({matched_sh}) masking destination"
                if is_sh
                else "Free hosting platform with sensitive auth keywords"
                if free_host_risk >= 0.7
                else None
            )
        }

Tuple_Bool_Match = tuple[bool, Optional[str]]
