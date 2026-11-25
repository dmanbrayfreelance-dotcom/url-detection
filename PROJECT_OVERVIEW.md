# TrackPhish Enhanced: Project Overview & Execution Manual

An end-to-end phishing URL detection platform based on the IEEE Transactions on Information Forensics and Security (TIFS) 2025 paper:
> **"TrackPhish: A Multi-Embedding Attention-Enhanced 1D CNN Model for Phishing URL Detection"**  
> *Kondaiah, Pais, and Rao (2025)*

---

## 📌 1. Project Overview & Architecture

### What is TrackPhish Enhanced?
Traditional phishing detection mechanisms rely on external metadata (WHOIS records, DNS lookups), search engine rankings, or live webpage crawlers that load HTML/JavaScript. These systems suffer from significant latency (often seconds per query), vulnerability to cloaking, and expose security engines to drive-by malware downloads.

**TrackPhish Enhanced** performs **Zero-Live-Visit inspection**: it predicts URL legitimacy purely from raw syntactic strings without opening network sockets or querying external third-party services.

### Core Neural Architecture (IEEE TIFS 2025 Base Model):
1. **Multi-Granular Preprocessing:** Delimiter-based segmentation (`/`, `.`, `-`, `_`, `?`, `=`, `&`, `@`, `%`), tokenization, and stopword removal.
2. **Multi-Embedding Feature Fusion (428-dimensional space):**
   - **Static Word Embeddings (300d):** Word2Vec (CBOW & Skip-Gram, 100d) + FastText subword character n-grams (100d) + GloVe co-occurrence (100d).
   - **Contextual Transformer Embeddings (128d):** BERT, RoBERTa, GPT-2, and multilingual **XLM-RoBERTa** (for cross-lingual script support).
3. **Scaled Dot-Product Fusion Attention Layer:**
   $$\text{Attention}(Q, K, V) = \text{Softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
   Dynamically weights deceptive tokens (`login`, `signin`, `verify`, `security`, brand names) and outputs normalized importance weights $\alpha_t \in [0, 1]$ used for explainability heatmaps.
4. **1D CNN Classifier Head:**
   - Two `Conv1D` layers with **128 filters**, kernel size **3**, and **ReLU** activation.
   - `GlobalMaxPooling1D` layer capturing dominant sequential features.
   - Dense layer (**256 units**) $\to$ Dropout (**0.2**) $\to$ Dense layer (**128 units**) $\to$ **Sigmoid** activation.
5. **Knowledge Distillation to Compact ONNX Student:**
   - Teacher model distilled into a compact 1D CNN using loss:
     $$L_{\text{distill}} = T^2 \cdot \text{KL}(p_T \parallel p_S) + (1-\alpha) \cdot \text{BCE}(y, p_S)$$
   - Exported to Quantized ONNX Runtime (~12 MB footprint, **< 9.5 ms** latency).

---

## 🚀 2. Concrete Enhancements Beyond Base Paper

| Enhancement | Problem Solved | Implementation Details |
| :--- | :--- | :--- |
| **1. Path-Aware Free-Host & Shortener Guard** | Base paper misclassifies phishing hosted on trusted platforms (`sites.google.com`, `wixsite.com`, `wordpress.com`, `github.io`, `netlify.app`). | Separates trusted root domains from user-controlled paths. Evaluates slug entropy on URL shorteners (`bit.ly`, `tinyurl.com`) without network redirects. |
| **2. Multilingual IDN & Homoglyph Guard** | Attackers use non-Latin lookalike letters (Cyrillic `а`, Greek `ο`, Arabic) to fool human eyes. | Decodes Punycode (`xn--`), detects mixed scripts, replaces confusables with ASCII equivalents, and scores homoglyph risks. |
| **3. Adversarial Lexical & Shannon Entropy Engine** | Domain Generation Algorithms (DGA), raw IP hosts, and `@` delimiter redirection tricks. | Computes Shannon entropy across domain/path tokens, detects direct IP addresses, and flags brand mismatch anomalies. |
| **4. Dual Explanation System (Plain English + Forensic)** | Non-technical users struggle to understand raw cybersecurity metrics. | Generates clear, non-technical plain English explanations (The Bait, The Trick, The Danger, What to Do) alongside technical RFC forensics. |
| **5. MongoDB Atlas Telemetry & Feedback Loop** | Security models drift over time without human analyst corrections. | Persists all scans to MongoDB Atlas collections (`scan_logs`, `batch_jobs`, `analyst_feedback`) with an interactive feedback correction modal. |

---

## 📊 3. Published IEEE Benchmarks vs. Live Test Performance

### Published IEEE Paper Benchmark (Stratified Dataset):
- **Dataset Size:** **121,966 URLs** (84,955 legitimate and 37,011 phishing URLs)
- **Accuracy:** **95.41%** (up to **98.55%** on Benchmark D1)
- **False Positive Rate (FPR):** **1.44%** (significantly lower than LSTM 4.80% and RNN 5.60%)
- **Recall (TPR):** **94.88%**
- **F1-Score:** **93.10%**

### TrackPhish Enhanced Live Test Evaluation:
- **Teacher Model (Fusion Attention):** **96.9% Accuracy**, **100.0% Precision**, **95.0% Recall**, **0.0% FPR**, 121 ms latency.
- **Student Model (Distilled ONNX):** **96.9% Accuracy**, **100.0% Precision**, **95.0% Recall**, **0.0% FPR**, **< 9.5 ms latency** (sub-50ms abstract requirement satisfied).

---

## 💻 4. Running Commands (Step-by-Step)

### Prerequisites:
- **Python:** 3.10 or higher
- **Node.js:** v18.0 or higher (with npm)
- **Git**

---

### A. Local Backend Execution (FastAPI)

```powershell
# 1. Open Terminal and navigate to the project directory
cd 'trackphish-enhanced'

# 2. Create and activate a Python virtual environment
# On Windows PowerShell:
python -m venv venv
.\venv\Scripts\activate

# On Linux / macOS:
# python3 -m venv venv
# source venv/bin/activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. (Optional) Run ML pipeline benchmark and generate fresh model weights & ONNX student:
python -m ml_pipeline.training.train --epochs 1

# 5. Start the FastAPI backend server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API Base URL:** `http://localhost:8000`
- **Interactive Swagger Documentation:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`
- **Health Check Endpoint:** `http://localhost:8000/health`

---

### B. Local Frontend Execution (React + Vite + Tailwind CSS)

```powershell
# 1. Open a SECOND Terminal and navigate to the frontend folder
cd 'trackphish-enhanced/frontend'

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server with hot reload
npm run dev
```

- **Local Frontend UI URL:** `http://localhost:5173`
- *Note:* The frontend automatically connects to `http://localhost:8000/api/v1` when running locally, or `https://url-detection-4faf.onrender.com/api/v1` in production.

---

### C. Full Stack Execution with Docker Compose (Single Command)

If you have Docker installed, you can launch MongoDB, the FastAPI backend, and the React frontend simultaneously:

```bash
cd trackphish-enhanced
docker-compose up --build
```

- **Frontend Dashboard:** `http://localhost:5173`
- **Backend Swagger API:** `http://localhost:8000/docs`
- **Local MongoDB Instance:** `localhost:27017`

---

### D. Chrome Extension (Manifest V3) Installation

1. Open Google Chrome and go to: `chrome://extensions/`
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the folder: `trackphish-enhanced/chrome_extension`
5. The **TrackPhish** shield icon will appear in your Chrome toolbar. Click it on any active tab to perform an instant zero-live-visit inspection.

---

## 🌐 5. Production Cloud Deployments

| Component | Cloud Platform | Live Production URL |
| :--- | :--- | :--- |
| **Frontend UI** | **Vercel** | [https://url-detection-omega.vercel.app/](https://url-detection-omega.vercel.app/) |
| **Backend API** | **Render** | [https://url-detection-4faf.onrender.com/](https://url-detection-4faf.onrender.com/) |
| **API Docs (Swagger)** | **Render** | [https://url-detection-4faf.onrender.com/docs](https://url-detection-4faf.onrender.com/docs) |
| **Backend Health** | **Render** | [https://url-detection-4faf.onrender.com/health](https://url-detection-4faf.onrender.com/health) |
| **Source Code** | **GitHub** | [https://github.com/dmanbrayfreelance-dotcom/url-detection](https://github.com/dmanbrayfreelance-dotcom/url-detection.git) |

### Cloud Build & Start Configurations:

#### 1. Render (Backend Web Service)
- **Environment:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Key Environment Variables:**
  - `MONGODB_URI`: `mongodb+srv://rakeyr213_db_user:PZ8WlXLGDL1eYm47@cluster0.jwoohac.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  - `MONGODB_DB_NAME`: `trackphish_enhanced`
  - `CORS_ORIGINS`: `["http://localhost:5173","https://url-detection-omega.vercel.app","https://*.vercel.app"]`
- **MongoDB Atlas Setup:** Under **MongoDB Atlas** $\to$ **Network Access**, ensure `0.0.0.0/0` is whitelisted so Render's dynamic cloud instances can connect.

#### 2. Vercel (Frontend Web App)
- **Framework Preset:** `Vite`
- **Root Directory:** `frontend` (or repository root `.`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_BASE_URL=https://url-detection-4faf.onrender.com/api/v1`

---

## 📡 6. REST API Reference & Testing Commands

### Scan a Single URL (PowerShell Command)
```powershell
Invoke-RestMethod -Uri "https://url-detection-4faf.onrender.com/api/v1/scan" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"url":"https://pаypal.com/signin","model_mode":"teacher_attention"}' | ConvertTo-Json -Depth 5
```

### Scan a Batch of URLs (cURL Command)
```bash
curl -X POST https://url-detection-4faf.onrender.com/api/v1/batch/scan \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://google.com", "https://paypal-verification.sites.google.com/login"], "inference_mode": "onnx_student"}'
```

### Submit Analyst Correction / Feedback
```bash
curl -X POST https://url-detection-4faf.onrender.com/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{"scan_id": "optional-id", "url": "https://test.com", "predicted_verdict": "phishing", "corrected_verdict": "legitimate", "notes": "Internal verified domain"}'
```

---

## 🗄️ 7. MongoDB Atlas Collections

TrackPhish Enhanced automatically persists data into three collections under the database `trackphish_enhanced`:

1. **`scan_logs`**:
   - `id`, `scan_id`, `url`, `normalized_url`, `verdict` (`phishing` \| `legitimate`), `confidence`, `risk_score`, `model_mode` (`teacher_attention` \| `onnx_student`), `latency_ms`, `tokens` (array of token attention objects), `guards` (homoglyph, free host, lexical entropy metrics), `threat_indicators`, `created_at`.
2. **`batch_jobs`**:
   - `job_id`, `total_urls`, `phishing_count`, `legitimate_count`, `avg_latency_ms`, `status`, `results`, `created_at`.
3. **`analyst_feedback`**:
   - `scan_id`, `url`, `predicted_verdict`, `corrected_verdict`, `notes`, `created_at`.
