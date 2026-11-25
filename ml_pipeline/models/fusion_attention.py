"""
Scaled Dot-Product Fusion Attention Layer.
Combines multiple static embeddings and contextual transformer representations.
Outputs both the fused sequence representation and normalized token attention weights
for transparent token-level explainability.
"""
import numpy as np
from typing import Tuple, Dict, Any, Optional

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

class NumpyFusionAttention:
    """
    High-performance vectorized NumPy implementation of Scaled Dot-Product Fusion Attention.
    Enables low-resource/laptop execution without torch dependency while strictly adhering
    to the IEEE TIFS 2025 formulation.
    """
    def __init__(self, input_dim: int = 428, hidden_dim: int = 128):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.scale = 1.0 / np.sqrt(hidden_dim)

        np.random.seed(42)
        # Projection weights
        self.W_q = np.random.randn(input_dim, hidden_dim).astype(np.float32) * 0.05
        self.W_k = np.random.randn(input_dim, hidden_dim).astype(np.float32) * 0.05
        self.W_v = np.random.randn(input_dim, hidden_dim).astype(np.float32) * 0.05
        self.W_out = np.random.randn(hidden_dim, input_dim).astype(np.float32) * 0.05

    def forward(self, x: np.ndarray, mask: Optional[np.ndarray] = None) -> Tuple[np.ndarray, np.ndarray]:
        """
        Forward pass.
        Args:
            x: Input token embeddings [seq_len, input_dim] or [batch, seq_len, input_dim]
            mask: Optional boolean mask [seq_len] where True indicates real token
        Returns:
            fused_seq: Fused representation with residual connection [seq_len, input_dim]
            token_attention_weights: Normalized 1D token importance [seq_len]
        """
        is_batched = (x.ndim == 3)
        if not is_batched:
            x_b = x[np.newaxis, :, :]  # [1, seq_len, input_dim]
        else:
            x_b = x

        batch_size, seq_len, _ = x_b.shape

        # Linear projections
        Q = np.matmul(x_b, self.W_q)  # [batch, seq_len, hidden_dim]
        K = np.matmul(x_b, self.W_k)
        V = np.matmul(x_b, self.W_v)

        # Scaled dot-product attention scores
        # scores: [batch, seq_len, seq_len]
        scores = np.matmul(Q, np.swapaxes(K, -1, -2)) * self.scale

        if mask is not None:
            # Mask out padding tokens
            mask_expanded = mask[np.newaxis, np.newaxis, :]
            scores = np.where(mask_expanded, scores, -1e9)

        # Softmax over last dimension
        exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
        attn_matrix = exp_scores / (np.sum(exp_scores, axis=-1, keepdims=True) + 1e-9)

        # Context output: [batch, seq_len, hidden_dim]
        context = np.matmul(attn_matrix, V)
        projected = np.matmul(context, self.W_out)

        # Residual connection
        fused = x_b + projected

        # Aggregate 1D token attention weights across query dimension (mean attention received)
        token_attn = np.mean(attn_matrix, axis=1)  # [batch, seq_len]

        # Rescale token weights to [0, 1] range for visual heatmap
        token_min = np.min(token_attn, axis=-1, keepdims=True)
        token_max = np.max(token_attn, axis=-1, keepdims=True)
        norm_weights = (token_attn - token_min) / (token_max - token_min + 1e-7)

        if not is_batched:
            return fused[0], norm_weights[0]
        return fused, norm_weights


if HAS_TORCH:
    class FusionAttentionModule(nn.Module):
        """
        PyTorch Scaled Dot-Product Fusion Attention Module.
        Computes attention over concatenated multi-embedding sequence representations
        and extracts token attention weights for explainability.
        """
        def __init__(self, input_dim: int = 428, hidden_dim: int = 128, n_heads: int = 4):
            super().__init__()
            self.input_dim = input_dim
            self.hidden_dim = hidden_dim
            self.n_heads = n_heads
            self.head_dim = hidden_dim // n_heads

            self.q_proj = nn.Linear(input_dim, hidden_dim)
            self.k_proj = nn.Linear(input_dim, hidden_dim)
            self.v_proj = nn.Linear(input_dim, hidden_dim)
            self.out_proj = nn.Linear(hidden_dim, input_dim)
            self.norm = nn.LayerNorm(input_dim)
            self.scale = 1.0 / np.sqrt(self.head_dim)

        def forward(self, x: torch.Tensor, key_padding_mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor]:
            """
            Args:
                x: [batch, seq_len, input_dim]
                key_padding_mask: [batch, seq_len] (True where padded)
            Returns:
                fused: [batch, seq_len, input_dim]
                token_weights: [batch, seq_len]
            """
            B, S, D = x.shape

            Q = self.q_proj(x).view(B, S, self.n_heads, self.head_dim).transpose(1, 2)
            K = self.k_proj(x).view(B, S, self.n_heads, self.head_dim).transpose(1, 2)
            V = self.v_proj(x).view(B, S, self.n_heads, self.head_dim).transpose(1, 2)

            scores = torch.matmul(Q, K.transpose(-2, -1)) * self.scale  # [B, heads, S, S]

            if key_padding_mask is not None:
                mask = key_padding_mask.unsqueeze(1).unsqueeze(2)  # [B, 1, 1, S]
                scores = scores.masked_fill(mask, -1e9)

            attn_weights = F.softmax(scores, dim=-1)  # [B, heads, S, S]
            context = torch.matmul(attn_weights, V)  # [B, heads, S, head_dim]
            context = context.transpose(1, 2).contiguous().view(B, S, self.hidden_dim)

            out = self.norm(x + self.out_proj(context))

            # Average attention across heads and queries: [B, S]
            token_importance = attn_weights.mean(dim=(1, 2))
            # Normalize to 0-1
            w_min = token_importance.min(dim=-1, keepdim=True)[0]
            w_max = token_importance.max(dim=-1, keepdim=True)[0]
            norm_token_weights = (token_importance - w_min) / (w_max - w_min + 1e-7)

            return out, norm_token_weights
