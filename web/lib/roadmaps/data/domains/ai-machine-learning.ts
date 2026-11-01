import type { RoadmapData } from "../../types";

export const aiMachineLearningRoadmap: RoadmapData = {
  id: "ai-machine-learning",
  slug: "ai-machine-learning",
  title: "AI & Machine Learning",
  description: "Comprehensive, all-in-one guide to becoming an AI & Machine Learning Engineer. Master Linear Algebra & Calculus, Python Data Science (NumPy/Pandas), Classical Scikit-Learn ML, Deep Learning with PyTorch, Vision (YOLO/ViT), NLP & Attention Transformers, LLM Fine-Tuning (LoRA/QLoRA), Production RAG Pipelines, and vLLM Model Serving without needing external materials.",
  category: "ai-ml",
  badgeText: "Trending Track",
  iconName: "BrainCircuit",
  version: 2,
  isPublished: true,
  nodes: [
    {
      id: "title-node",
      type: "title",
      position: { x: 550, y: 30 },
      data: { label: "AI & Machine Learning Roadmap" },
    },
    // 1. Math & Statistics Foundations
    {
      id: "math-foundations",
      type: "topic",
      position: { x: 550, y: 120 },
      data: {
        label: "Mathematics & Statistics for AI",
        category: "Mathematics",
        description: `### 📐 Mathematics for Machine Learning & Deep Learning

The mathematical principles driving gradient descent, loss landscapes, and high-dimensional vector representations.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-linear-algebra",
      type: "subtopic",
      position: { x: 860, y: 100 },
      data: {
        label: "Linear Algebra & Matrix Decompositions",
        colorKey: "C",
        description: `### 🔢 Vectors, Matrices, Eigenvalues & SVD

Tensors are multidimensional arrays representing image batches, token embeddings, and weight matrices.

---

### 1. Dot Product & Cosine Similarity Formula
$$\\text{Cosine Similarity}(A, B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|} = \\frac{\\sum_{i=1}^{n} A_i B_i}{\\sqrt{\\sum_{i=1}^{n} A_i^2} \\sqrt{\\sum_{i=1}^{n} B_i^2}}$$

- Measures semantic angle between two vector embeddings regardless of vector magnitude.
- Range: $-1$ (opposite), $0$ (orthogonal/unrelated), $+1$ (identical meaning).
`,
      },
    },
    {
      id: "sub-calculus-probability",
      type: "subtopic",
      position: { x: 860, y: 150 },
      data: {
        label: "Calculus, Gradients & Probability Distributions",
        colorKey: "C",
        description: `### 📉 Gradient Descent & Backpropagation Calculus

How neural networks adjust weights to minimize loss.

---

### 1. Gradient Descent Update Rule
$$W_{t+1} = W_t - \\eta \\nabla_W \\mathcal{L}(W_t)$$

- $W$: Model weights matrix.
- $\\eta$: Learning rate hyperparameter.
- $\\nabla_W \\mathcal{L}$: Gradient of the loss function with respect to weights computed via the Calculus Chain Rule.
`,
      },
    },

    // 2. Python Scientific Stack
    {
      id: "python-scientific",
      type: "topic",
      position: { x: 550, y: 320 },
      data: {
        label: "Python for Data Science (NumPy & Pandas)",
        category: "Programming",
        description: `### 🐍 Vectorized Computing, DataFrames & Exploratory Analysis

Wrangle datasets and compute high-speed array manipulations in Python.
`,
        difficulty: "beginner",
        colorKey: "B",
        estimatedHours: 15,
      },
    },
    {
      id: "sub-numpy-vectorization",
      type: "subtopic",
      position: { x: 240, y: 280 },
      data: {
        label: "NumPy Vectorization & Broadcasting",
        colorKey: "C",
        description: `### ⚡ High-Performance Array Operations

Avoid slow Python for-loops using C-optimized SIMD vectorization.

\`\`\`python
import numpy as np

# 1. Vectorized Euclidean distance calculation between two 3D point batches
points_a = np.random.rand(1000, 3)
points_b = np.random.rand(1000, 3)

# Computes 1000 distances in microseconds!
distances = np.linalg.norm(points_a - points_b, axis=1)

# 2. Broadcasting a (1, 3) bias vector across a (1000, 3) matrix
bias = np.array([0.1, -0.2, 0.05])
normalized = (points_a + bias) / np.std(points_a, axis=0)
\`\`\`
`,
      },
    },
    {
      id: "sub-pandas-matplotlib",
      type: "subtopic",
      position: { x: 240, y: 330 },
      data: {
        label: "Pandas & Exploratory Data Analysis (EDA)",
        colorKey: "C",
        description: `### 📊 Data Cleaning, Outlier Detection & Feature Engineering

Clean messy datasets and impute missing values.

\`\`\`python
import pandas as pd

# Load dataset
df = pd.read_csv("student_quiz_results.csv")

# 1. Fill missing numeric scores with group median
df['score'] = df.groupby('branch')['score'].transform(lambda x: x.fillna(x.median()))

# 2. One-Hot Encode categorical features
df_encoded = pd.get_dummies(df, columns=['branch', 'role'], drop_first=True)

# 3. Create derived feature (percentage score)
df_encoded['pct_score'] = (df_encoded['score'] / df_encoded['total_marks']) * 100
\`\`\`
`,
      },
    },

    // 3. Classical Machine Learning
    {
      id: "classical-ml",
      type: "topic",
      position: { x: 550, y: 520 },
      data: {
        label: "Classical Machine Learning (Scikit-Learn)",
        category: "Machine Learning",
        description: `### 🤖 Supervised & Unsupervised Learning (XGBoost / Scikit-Learn)

Train interpretable machine learning models on tabular datasets.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-supervised-models",
      type: "subtopic",
      position: { x: 860, y: 480 },
      data: {
        label: "Supervised: Regression, SVM, Random Forest & XGBoost",
        colorKey: "C",
        description: `### 🌲 Gradient Boosted Decision Trees (XGBoost)

The reigning champion for tabular dataset predictions.

\`\`\`python
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

model = xgb.XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="auc",
    early_stopping_rounds=20
)

model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
y_pred_proba = model.predict_proba(X_test)[:, 1]
print("ROC-AUC Score:", roc_auc_score(y_test, y_pred_proba))
\`\`\`
`,
      },
    },
    {
      id: "sub-unsupervised-clustering",
      type: "subtopic",
      position: { x: 860, y: 530 },
      data: {
        label: "Unsupervised: K-Means, PCA & Evaluation Metrics",
        colorKey: "C",
        description: `### 🎯 Dimensionality Reduction & Cluster Segmentation

Reduce high-dimensional feature spaces with Principal Component Analysis (PCA).

\`\`\`python
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

# Reduce 100 features down to 2 principal components explaining 90%+ variance
pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X_scaled)

# Segment users into 4 distinct behavioral clusters
kmeans = KMeans(n_clusters=4, random_state=42, n_init='auto')
clusters = kmeans.fit_predict(X_reduced)
\`\`\`
`,
      },
    },

    // 4. Deep Learning & Neural Networks (PyTorch)
    {
      id: "deep-learning-pytorch",
      type: "topic",
      position: { x: 550, y: 720 },
      data: {
        label: "Deep Learning with PyTorch",
        category: "Deep Learning",
        description: `### 🔥 PyTorch Neural Networks, Autograd & GPU Acceleration

Build custom deep neural network architectures from scratch.
`,
        difficulty: "intermediate",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-pytorch-autograd",
      type: "subtopic",
      position: { x: 240, y: 680 },
      data: {
        label: "PyTorch Tensors, Autograd & Custom Modules",
        colorKey: "C",
        description: `### 🧠 Building a Custom PyTorch Neural Network

\`\`\`python
import torch
import torch.nn as nn
import torch.optim as optim

class DeepClassifier(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, num_classes: int):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = DeepClassifier(input_dim=50, hidden_dim=128, num_classes=5).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
\`\`\`
`,
      },
    },
    {
      id: "sub-optimizers-loss",
      type: "subtopic",
      position: { x: 240, y: 730 },
      data: {
        label: "Loss Functions, Optimizers & Regularization",
        colorKey: "C",
        description: `### ⚙️ Training Dynamics & Learning Rate Schedulers

Prevent overfitting and accelerate convergence using AdamW and Cosine Annealing.

\`\`\`python
# Cosine Annealing Learning Rate Scheduler with Warm Restarts
scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
    optimizer, T_0=10, T_mult=2, eta_min=1e-6
)

for epoch in range(100):
    train_one_epoch(model, train_loader, criterion, optimizer)
    scheduler.step()
\`\`\`
`,
      },
    },

    // 5. Computer Vision & NLP
    {
      id: "cv-nlp-domains",
      type: "topic",
      position: { x: 550, y: 920 },
      data: {
        label: "Computer Vision (CNNs) & NLP (Transformers)",
        category: "Perception & Language",
        description: `### 👁️ Computer Vision (YOLO/ViT) & Transformer Self-Attention

Extract spatial features from images and understand natural human language.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 25,
      },
    },
    {
      id: "sub-cnn-vision",
      type: "subtopic",
      position: { x: 860, y: 880 },
      data: {
        label: "CNNs, ResNets, YOLO & Vision Transformers (ViT)",
        colorKey: "C",
        description: `### 📷 Real-Time Object Detection with YOLOv8

\`\`\`python
from ultralytics import YOLO

# Load pre-trained state-of-the-art vision model
model = YOLO("yolov8m.pt")

# Perform real-time inference on webcam / video stream
results = model.predict(source="traffic.mp4", conf=0.5, save=True)

for r in results:
    boxes = r.boxes.xyxy.cpu().numpy() # [x1, y1, x2, y2]
    classes = r.boxes.cls.cpu().numpy()
    confidences = r.boxes.conf.cpu().numpy()
\`\`\`
`,
      },
    },
    {
      id: "sub-attention-transformers",
      type: "subtopic",
      position: { x: 860, y: 930 },
      data: {
        label: "Self-Attention Mechanism & The Transformer",
        colorKey: "C",
        description: `### ⚡ Scaled Dot-Product Attention Formula

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

- **Queries ($Q$)**: What the token is looking for.
- **Keys ($K$)**: What the token offers.
- **Values ($V$)**: The actual contextual information extracted.
- $\\sqrt{d_k}$: Scaling factor preventing softmax gradients from vanishing in high dimensions.
`,
      },
    },

    // 6. Generative AI, LLMs & RAG
    {
      id: "genai-llms-rag",
      type: "topic",
      position: { x: 550, y: 1120 },
      data: {
        label: "Generative AI, LLMs & Retrieval-Augmented Generation",
        category: "Generative AI",
        description: `### 🤖 Large Language Models, PEFT Fine-Tuning (LoRA) & Production RAG

Build enterprise knowledge assistants grounded in proprietary vector documents.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 30,
      },
    },
    {
      id: "sub-rag-vectordb",
      type: "subtopic",
      position: { x: 240, y: 1080 },
      data: {
        label: "Vector Databases & Production RAG Pipelines",
        colorKey: "C",
        description: `### 📚 Production RAG Architecture (Retrieval-Augmented Generation)

\`\`\`python
from langchain_community.vectorstores import Qdrant
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# 1. Connect Vector Store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vector_store = Qdrant(client=client, collection_name="codebreakers_docs", embeddings=embeddings)
retriever = vector_store.as_retriever(search_kwargs={"k": 4})

# 2. Grounded System Prompt
prompt = ChatPromptTemplate.from_template("""
Answer the question using ONLY the provided context. If unknown, state 'I do not have enough context':
<context>
{context}
</context>
Question: {input}
""")

llm = ChatOpenAI(model="gpt-4o", temperature=0)
document_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, document_chain)
response = rag_chain.invoke({"input": "How does CodeBreakers track member points?"})
\`\`\`
`,
      },
    },
    {
      id: "sub-finetuning-peft",
      type: "subtopic",
      position: { x: 240, y: 1130 },
      data: {
        label: "LLM Fine-Tuning: LoRA, QLoRA & Hugging Face",
        colorKey: "C",
        description: `### 🎯 Parameter-Efficient Fine-Tuning (LoRA)

Freeze 99% of base model weights and train low-rank adapter matrices ($A$ and $B$).

$$W = W_0 + \\Delta W = W_0 + B \\cdot A$$
- $W_0 \\in \\mathbb{R}^{d \\times k}$ (Frozen 8-bit / 4-bit base weights).
- $B \\in \\mathbb{R}^{d \\times r}, A \\in \\mathbb{R}^{r \\times k}$ with rank $r \\ll \\min(d, k)$ (e.g. $r=16$).
- Reduces trainable parameters by $>99\\%$, enabling 70B model fine-tuning on a single consumer GPU!
`,
      },
    },

    // 7. MLOps & Model Deployment
    {
      id: "mlops-deployment",
      type: "topic",
      position: { x: 550, y: 1320 },
      data: {
        label: "MLOps, Serving & Model Monitoring",
        category: "MLOps",
        description: `### 🚀 vLLM Serving, Continuous Batching & Model Observability

Deploy and serve deep learning models with high throughput and low latency.
`,
        difficulty: "advanced",
        colorKey: "B",
        estimatedHours: 20,
      },
    },
    {
      id: "sub-vllm-serving",
      type: "subtopic",
      position: { x: 860, y: 1280 },
      data: {
        label: "vLLM, TensorRT-LLM & PagedAttention Serving",
        colorKey: "C",
        description: `### ⚡ 20x Faster LLM Inference with vLLM & PagedAttention

Eliminate VRAM fragmentation from dynamic Key-Value (KV) caching.

\`\`\`bash
# Launch high-throughput OpenAI-compatible server using vLLM
python3 -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-3.1-8B-Instruct \
  --dtype auto \
  --gpu-memory-utilization 0.90 \
  --max-model-len 8192 \
  --port 8000
\`\`\`
`,
      },
    },
    {
      id: "sub-mlflow-monitoring",
      type: "subtopic",
      position: { x: 860, y: 1330 },
      data: {
        label: "MLflow, Experiment Tracking & Drift Detection",
        colorKey: "C",
        description: `### 📈 Model Governance, Experiment Tracking & Data Drift

Detect when production data distributions diverge from training benchmarks.

#### Metrics:
- Population Stability Index (PSI) and Wasserstein Distance for feature drift.
- Tracking experiments, artifact checkpoints, and metrics across training runs with MLflow.
`,
      },
    },

    // 8. Milestone
    {
      id: "milestone-ai-engineer",
      type: "milestone",
      position: { x: 550, y: 1520 },
      data: {
        label: "Certified AI & Machine Learning Engineer",
        category: "Milestone",
        description: `### 🎓 AI & Machine Learning Mastery Attained!

Congratulations! You have mastered the full AI & ML engineering spectrum:
- Linear Algebra, Vector Calculus, and Probability.
- Tabular Machine Learning (XGBoost, Scikit-Learn) and Feature Engineering.
- Deep Learning & Neural Network architectures with PyTorch.
- Transformers, Computer Vision (YOLO/ViT), and NLP.
- Modern GenAI: Large Language Models, RAG pipelines, and LoRA fine-tuning.
- High-throughput MLOps with vLLM, Docker, and MLflow.
`,
        difficulty: "advanced",
        color: "gold",
        status: "not-started",
      },
    },
  ],
  edges: [
    { id: "e-ai-1", source: "math-foundations", target: "python-scientific", type: "interactive" },
    { id: "e-ai-2", source: "python-scientific", target: "classical-ml", type: "interactive" },
    { id: "e-ai-3", source: "classical-ml", target: "deep-learning-pytorch", type: "interactive" },
    { id: "e-ai-4", source: "deep-learning-pytorch", target: "cv-nlp-domains", type: "interactive" },
    { id: "e-ai-5", source: "cv-nlp-domains", target: "genai-llms-rag", type: "interactive" },
    { id: "e-ai-6", source: "genai-llms-rag", target: "mlops-deployment", type: "interactive" },
    { id: "e-ai-7", source: "mlops-deployment", target: "milestone-ai-engineer", type: "interactive" },

    // Subtopics
    { id: "e-ai-sub-1", source: "math-foundations", target: "sub-linear-algebra" },
    { id: "e-ai-sub-2", source: "math-foundations", target: "sub-calculus-probability" },

    { id: "e-ai-sub-3", source: "python-scientific", target: "sub-numpy-vectorization" },
    { id: "e-ai-sub-4", source: "python-scientific", target: "sub-pandas-matplotlib" },

    { id: "e-ai-sub-5", source: "classical-ml", target: "sub-supervised-models" },
    { id: "e-ai-sub-6", source: "classical-ml", target: "sub-unsupervised-clustering" },

    { id: "e-ai-sub-7", source: "deep-learning-pytorch", target: "sub-pytorch-autograd" },
    { id: "e-ai-sub-8", source: "deep-learning-pytorch", target: "sub-optimizers-loss" },

    { id: "e-ai-sub-9", source: "cv-nlp-domains", target: "sub-cnn-vision" },
    { id: "e-ai-sub-10", source: "cv-nlp-domains", target: "sub-attention-transformers" },

    { id: "e-ai-sub-11", source: "genai-llms-rag", target: "sub-rag-vectordb" },
    { id: "e-ai-sub-12", source: "genai-llms-rag", target: "sub-finetuning-peft" },

    { id: "e-ai-sub-13", source: "mlops-deployment", target: "sub-vllm-serving" },
    { id: "e-ai-sub-14", source: "mlops-deployment", target: "sub-mlflow-monitoring" },
  ],
};
