"""
URL Sanitizer and Delimiter-Aware Tokenizer.
Inspects raw URLs without live-network visits or DNS resolutions.
Extracts token sequence, character offsets, and structural components.
"""
import re
import urllib.parse
from typing import List, Dict, Any, Tuple

class URLSanitizer:
    def __init__(self, max_sequence_length: int = 128):
        self.max_seq_len = max_sequence_length
        # Delimiters commonly found in URLs: / . - _ ? = & % @ : ~ + # ;
        self.delimiter_regex = re.compile(r"([/\.\-_?=&%@:~+#;])")

    def parse_url(self, raw_url: str) -> Dict[str, Any]:
        """
        Safely decomposes URL into structural parts without visiting the page.
        """
        cleaned_url = raw_url.strip()
        if not cleaned_url.startswith(("http://", "https://", "ftp://")):
            # Prepend dummy scheme for robust parsing if missing
            working_url = "http://" + cleaned_url
            has_explicit_scheme = False
        else:
            working_url = cleaned_url
            has_explicit_scheme = True

        try:
            parsed = urllib.parse.urlsplit(working_url)
        except Exception:
            # Fallback manual extraction if urlsplit fails on malformed URL
            parsed = urllib.parse.urlsplit("http://malformed.invalid/")

        scheme = parsed.scheme if has_explicit_scheme else ""
        netloc = parsed.netloc.lower()
        path = parsed.path
        query = parsed.query
        fragment = parsed.fragment
        username = parsed.username
        password = parsed.password
        hostname = parsed.hostname or ""
        port = parsed.port

        return {
            "raw_url": raw_url,
            "canonical_url": working_url,
            "has_explicit_scheme": has_explicit_scheme,
            "scheme": scheme,
            "netloc": netloc,
            "hostname": hostname,
            "port": port,
            "username": username,
            "password": password,
            "path": path,
            "query": query,
            "fragment": fragment,
        }

    def tokenize_url(self, raw_url: str) -> List[Dict[str, Any]]:
        """
        Tokenizes the URL into structured tokens with segment categories
        (scheme, host, path, query, delimiter) and start/end character offsets.
        """
        cleaned = raw_url.strip()
        tokens: List[Dict[str, Any]] = []

        # Split preserving delimiters
        raw_parts = self.delimiter_regex.split(cleaned)
        current_offset = 0

        # Structural detection
        parts_accum = ""
        in_query = False

        for part in raw_parts:
            if not part:
                continue
            start = current_offset
            end = current_offset + len(part)
            current_offset = end

            if part == "?":
                in_query = True

            # Determine category
            if part in {"/", ".", "-", "_", "?", "=", "&", "%", "@", ":", "~", "+", "#", ";"}:
                category = "delimiter"
            elif in_query:
                category = "query"
            elif "://" in cleaned and current_offset <= cleaned.index("://") + 3:
                category = "scheme"
            elif (not in_query) and ("/" not in cleaned[len(cleaned.split("://")[0] if "://" in cleaned else ""):end]):
                category = "hostname"
            else:
                category = "path"

            tokens.append({
                "token": part,
                "category": category,
                "start": start,
                "end": end,
                "length": len(part)
            })

        return tokens

    def get_token_strings(self, raw_url: str) -> List[str]:
        """Returns ordered list of token strings truncated/padded to max_seq_len."""
        tok_objs = self.tokenize_url(raw_url)
        tok_strs = [t["token"] for t in tok_objs]
        if len(tok_strs) > self.max_seq_len:
            return tok_strs[:self.max_seq_len]
        return tok_strs

    def pad_or_truncate_indices(self, indices: List[int], pad_val: int = 0) -> List[int]:
        """Pads with pad_val or truncates token integer indices to max_sequence_length."""
        if len(indices) >= self.max_seq_len:
            return indices[:self.max_seq_len]
        return indices + [pad_val] * (self.max_seq_len - len(indices))
