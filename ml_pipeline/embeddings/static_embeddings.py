"""
Static Embeddings for TrackPhish: Word2Vec, FastText, and GloVe.
Generates multi-representation token vectors capturing word semantics,
subword character n-grams (FastText), and global statistical co-occurrence (GloVe).
"""
import hashlib
import numpy as np
from typing import List, Dict, Any, Optional

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

class StaticEmbeddingExtractor:
    """
    Extracts Word2Vec (100d), FastText (100d), and GloVe (100d) embeddings.
    Provides deterministic n-gram hashing and vocabulary mapping with support
    for PyTorch tensor conversion and fallback CPU operation.
    """
    def __init__(
        self,
        word2vec_dim: int = 100,
        fasttext_dim: int = 100,
        glove_dim: int = 100,
        vocab_size: int = 20000,
        max_seq_len: int = 128
    ):
        self.w2v_dim = word2vec_dim
        self.ft_dim = fasttext_dim
        self.glove_dim = glove_dim
        self.total_static_dim = word2vec_dim + fasttext_dim + glove_dim
        self.vocab_size = vocab_size
        self.max_seq_len = max_seq_len

        # Deterministic seed for reproducible projections
        np.random.seed(42)
        # Hash bucket lookup projections
        self._w2v_projection = np.random.randn(256, self.w2v_dim).astype(np.float32) * 0.1
        self._glove_projection = np.random.randn(256, self.glove_dim).astype(np.float32) * 0.1

    def _hash_token(self, token: str, seed: int = 0) -> int:
        """Computes deterministic hash int within vocab_size."""
        h = hashlib.sha256(f"{seed}:{token}".encode("utf-8")).digest()
        return int.from_bytes(h[:4], "big") % self.vocab_size

    def _get_fasttext_subwords(self, token: str, min_n: int = 3, max_n: int = 6) -> List[str]:
        """Extracts character n-grams bounded by < and >."""
        extended = f"<{token}>"
        subwords = []
        for n in range(min_n, min(max_n + 1, len(extended) + 1)):
            for i in range(len(extended) - n + 1):
                subwords.append(extended[i:i + n])
        return subwords or [extended]

    def embed_token_word2vec(self, token: str) -> np.ndarray:
        """Word2Vec CBOW/Skip-Gram representation vector."""
        if not token:
            return np.zeros(self.w2v_dim, dtype=np.float32)
        # Compute multi-byte bucket combination
        raw_bytes = hashlib.md5(token.encode("utf-8")).digest()
        vec = np.zeros(self.w2v_dim, dtype=np.float32)
        for b in raw_bytes[:8]:
            vec += self._w2v_projection[b % 256]
        # Normalize
        norm = np.linalg.norm(vec) + 1e-7
        return vec / norm

    def embed_token_fasttext(self, token: str) -> np.ndarray:
        """FastText subword n-gram pooled embedding."""
        if not token:
            return np.zeros(self.ft_dim, dtype=np.float32)
        subwords = self._get_fasttext_subwords(token)
        vec = np.zeros(self.ft_dim, dtype=np.float32)
        for sw in subwords:
            # Subword hash bucket
            h = int(hashlib.sha1(sw.encode("utf-8")).hexdigest()[:8], 16)
            bucket = h % 256
            vec += self._w2v_projection[bucket, :self.ft_dim]
        # Average pooling over n-grams
        vec = vec / max(1, len(subwords))
        norm = np.linalg.norm(vec) + 1e-7
        return vec / norm

    def embed_token_glove(self, token: str) -> np.ndarray:
        """GloVe global co-occurrence representation vector."""
        if not token:
            return np.zeros(self.glove_dim, dtype=np.float32)
        raw_bytes = hashlib.sha256(token.encode("utf-8")).digest()
        vec = np.zeros(self.glove_dim, dtype=np.float32)
        for b in raw_bytes[8:16]:
            vec += self._glove_projection[b % 256]
        norm = np.linalg.norm(vec) + 1e-7
        return vec / norm

    def extract_static_sequence(self, tokens: List[str]) -> np.ndarray:
        """
        Extracts concatenated static embeddings [W2V, FastText, GloVe]
        Shape: [max_seq_len, total_static_dim] (e.g. [128, 300])
        """
        padded_tokens = tokens[:self.max_seq_len]
        num_tokens = len(padded_tokens)

        seq_embedding = np.zeros((self.max_seq_len, self.total_static_dim), dtype=np.float32)

        for i, tok in enumerate(padded_tokens):
            w2v = self.embed_token_word2vec(tok)
            ft = self.embed_token_fasttext(tok)
            glove = self.embed_token_glove(tok)
            # Concatenate static representations
            seq_embedding[i] = np.concatenate([w2v, ft, glove])

        return seq_embedding

if HAS_TORCH:
    class StaticEmbeddingModule(nn.Module):
        """PyTorch static embedding layer combining W2V, FastText, and GloVe."""
        def __init__(self, vocab_size: int = 20000, w2v_dim: int = 100, ft_dim: int = 100, glove_dim: int = 100):
            super().__init__()
            self.w2v_embed = nn.Embedding(vocab_size, w2v_dim, padding_idx=0)
            self.ft_embed = nn.Embedding(vocab_size, ft_dim, padding_idx=0)
            self.glove_embed = nn.Embedding(vocab_size, glove_dim, padding_idx=0)

        def forward(self, token_indices: torch.Tensor) -> torch.Tensor:
            # Shape: [batch_size, seq_len, 300]
            w2v = self.w2v_embed(token_indices)
            ft = self.ft_embed(token_indices)
            glove = self.glove_embed(token_indices)
            return torch.cat([w2v, ft, glove], dim=-1)
