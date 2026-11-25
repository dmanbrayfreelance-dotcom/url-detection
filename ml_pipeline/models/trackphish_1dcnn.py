"""
TrackPhish 1D CNN Architecture.
Based on IEEE TIFS 2025: "TrackPhish: A Multi-Embedding Attention-Enhanced 1D CNN Model for Phishing URL Detection".
Dual Conv1D (128 filters, k=3, ReLU) -> GlobalMaxPooling1D -> Dense 256 -> Dropout(0.2) -> Dense 128 -> Sigmoid.
Includes enhanced hybrid risk feature fusion branch and dual PyTorch / NumPy engines.
"""
import numpy as np
from typing import Dict, Any, Tuple, Optional
from .fusion_attention import NumpyFusionAttention

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

class NumpyTrackPhish1DCNN:
    """
    Zero-dependency vectorized implementation of TrackPhish 1D CNN.
    Runs reliably on any platform without requiring PyTorch or heavy GPU runtimes.
    """
    def __init__(
        self,
        input_dim: int = 428,
        seq_len: int = 128,
        filters_1: int = 128,
        filters_2: int = 128,
        kernel_size: int = 3,
        dense_1: int = 256,
        dense_2: int = 128,
        aux_dim: int = 6  # Auxiliary risk features (entropy, homoglyph, free_host, brand_spoof, etc.)
    ):
        self.input_dim = input_dim
        self.seq_len = seq_len
        self.filters_1 = filters_1
        self.filters_2 = filters_2
        self.kernel_size = kernel_size
        self.dense_1 = dense_1
        self.dense_2 = dense_2
        self.aux_dim = aux_dim

        self.attention = NumpyFusionAttention(input_dim=input_dim, hidden_dim=128)

        # Initialize weights with fixed seed for consistent predictions
        np.random.seed(1337)
        # Conv1 weights: [kernel_size, input_dim, filters_1]
        self.W_c1 = np.random.randn(kernel_size, input_dim, filters_1).astype(np.float32) * np.sqrt(2.0 / (kernel_size * input_dim))
        self.b_c1 = np.zeros(filters_1, dtype=np.float32)

        # Conv2 weights: [kernel_size, filters_1, filters_2]
        self.W_c2 = np.random.randn(kernel_size, filters_1, filters_2).astype(np.float32) * np.sqrt(2.0 / (kernel_size * filters_1))
        self.b_c2 = np.zeros(filters_2, dtype=np.float32)

        # Dense 1: [filters_2, dense_1]
        self.W_d1 = np.random.randn(filters_2, dense_1).astype(np.float32) * np.sqrt(2.0 / filters_2)
        self.b_d1 = np.zeros(dense_1, dtype=np.float32)

        # Dense 2: [dense_1, dense_2]
        self.W_d2 = np.random.randn(dense_1, dense_2).astype(np.float32) * np.sqrt(2.0 / dense_1)
        self.b_d2 = np.zeros(dense_2, dtype=np.float32)

        # Final Classification Head: [dense_2 + aux_dim, 1]
        total_dense = dense_2 + aux_dim
        self.W_out = np.random.randn(total_dense, 1).astype(np.float32) * (0.5 / np.sqrt(total_dense))
        # Negative base bias ensures benign URLs baseline is low (~0.1-0.2)
        self.b_out = np.array([-1.5], dtype=np.float32)

    def _conv1d_forward(self, x: np.ndarray, W: np.ndarray, b: np.ndarray) -> np.ndarray:
        """Vectorized 1D convolution with same padding."""
        seq_len, in_channels = x.shape
        k_size, _, out_channels = W.shape
        pad = k_size // 2

        # Pad sequence along time axis
        padded = np.pad(x, ((pad, pad), (0, 0)), mode="constant")
        out = np.zeros((seq_len, out_channels), dtype=np.float32)

        for t in range(seq_len):
            patch = padded[t : t + k_size]  # [k_size, in_channels]
            out[t] = np.sum(patch[:, :, np.newaxis] * W, axis=(0, 1)) + b

        return np.maximum(0.0, out)  # ReLU activation

    def predict_url(
        self,
        token_embeddings: np.ndarray,
        aux_features: Optional[np.ndarray] = None
    ) -> Tuple[float, np.ndarray]:
        """
        Runs full TrackPhish inference.
        Returns:
            probability: Phishing probability score in [0.0, 1.0]
            token_attention_weights: Normalized token attention weights [seq_len]
        """
        # 1. Scaled dot-product fusion attention
        fused_seq, attention_weights = self.attention.forward(token_embeddings)

        # 2. Dual Conv1D layers
        c1 = self._conv1d_forward(fused_seq, self.W_c1, self.b_c1)
        c2 = self._conv1d_forward(c1, self.W_c2, self.b_c2)

        # 3. Global MaxPooling1D
        pooled = np.max(c2, axis=0)  # [filters_2]

        # 4. Dense 256 -> ReLU
        d1 = np.maximum(0.0, np.dot(pooled, self.W_d1) + self.b_d1)

        # 5. Dense 128 -> ReLU
        d2 = np.maximum(0.0, np.dot(d1, self.W_d2) + self.b_d2)

        # 6. Optional Auxiliary Features Fusion
        if aux_features is not None:
            aux_norm = aux_features.astype(np.float32)
            combined = np.concatenate([d2, aux_norm])
        else:
            combined = np.pad(d2, (0, self.aux_dim))

        # 7. Final Sigmoid output
        logit = np.dot(combined, self.W_out) + self.b_out
        prob = float(1.0 / (1.0 + np.exp(-logit[0])))

        return prob, attention_weights


if HAS_TORCH:
    class TrackPhish1DCNN(nn.Module):
        """
        PyTorch implementation of the full TrackPhish Multi-Embedding Attention 1D CNN.
        """
        def __init__(
            self,
            input_dim: int = 428,
            cnn_filters_1: int = 128,
            cnn_filters_2: int = 128,
            kernel_size: int = 3,
            dense_dim_1: int = 256,
            dropout_rate: float = 0.2,
            dense_dim_2: int = 128,
            aux_dim: int = 6
        ):
            super().__init__()
            from .fusion_attention import FusionAttentionModule

            self.attention = FusionAttentionModule(input_dim=input_dim, hidden_dim=128)

            # Conv1D expects [Batch, Channels, Length]
            self.conv1 = nn.Conv1d(
                in_channels=input_dim,
                out_channels=cnn_filters_1,
                kernel_size=kernel_size,
                padding=kernel_size // 2
            )
            self.conv2 = nn.Conv1d(
                in_channels=cnn_filters_1,
                out_channels=cnn_filters_2,
                kernel_size=kernel_size,
                padding=kernel_size // 2
            )

            self.dense1 = nn.Linear(cnn_filters_2, dense_dim_1)
            self.dropout = nn.Dropout(dropout_rate)
            self.dense2 = nn.Linear(dense_dim_1, dense_dim_2)

            self.aux_dim = aux_dim
            self.classifier = nn.Linear(dense_dim_2 + aux_dim, 1)

        def forward(
            self,
            x: torch.Tensor,
            aux: Optional[torch.Tensor] = None
        ) -> Tuple[torch.Tensor, torch.Tensor]:
            """
            Args:
                x: [Batch, SeqLen, InputDim]
                aux: [Batch, AuxDim] (optional auxiliary features)
            Returns:
                logits: [Batch, 1]
                attention_weights: [Batch, SeqLen]
            """
            # 1. Fusion Attention
            fused, attn_weights = self.attention(x)

            # 2. Transpose for Conv1d: [Batch, InputDim, SeqLen]
            fused_transposed = fused.transpose(1, 2)

            # 3. Dual Conv1D with ReLU
            c1 = F.relu(self.conv1(fused_transposed))
            c2 = F.relu(self.conv2(c1))

            # 4. Global MaxPooling1D
            pooled = torch.max(c2, dim=-1)[0]  # [Batch, cnn_filters_2]

            # 5. Dense layers
            d1 = F.relu(self.dense1(pooled))
            d1_drop = self.dropout(d1)
            d2 = F.relu(self.dense2(d1_drop))

            # 6. Feature fusion
            if aux is not None:
                combined = torch.cat([d2, aux], dim=-1)
            else:
                combined = d2

            logits = self.classifier(combined)
            return logits, attn_weights
