<!-- ===================== HEADER BANNER ===================== -->
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=200&section=header&text=InsightForge%20AI&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=Self-Verifying%20Multi-Agent%20Data%20Analyst%20Workspace&descSize=18&descAlignY=60" alt="InsightForge AI Banner" width="100%"/>

<img src="https://img.icons8.com/fluency/240/shield.png" alt="InsightForge AI Logo" width="120"/>

# 🛡️ InsightForge AI

### *From raw data to verified business insights — automatically.*

<p>
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-Async%20Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>
<p>
  <img src="https://img.shields.io/badge/Google%20Gemini-LLM%20Agents-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini"/>
  <img src="https://img.shields.io/badge/LangGraph-Workflows-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangGraph"/>
  <img src="https://img.shields.io/badge/DuckDB-Analytics-FFF000?style=for-the-badge&logo=duckdb&logoColor=black" alt="DuckDB"/>
  <img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" alt="License"/>
</p>

**[✨ Features](#-key-features)** •
**[🏗️ Architecture](#️-system-architecture)** •
**[🛠️ Tech Stack](#️-technology-stack)** •
**[🚀 Quick Start](#-quick-start-guide)** •
**[🔌 API](#-api-endpoints-summary)** •
**[🧪 Tests](#-running-unit-tests)**

</div>

---

## 📖 Overview

> **InsightForge AI** is a self-verifying, multi-agent data analytics platform that transforms raw tabular datasets (**CSV, Excel, Parquet, JSON**) into **verified business insights, statistical findings, executive dashboards, and downloadable PDF reports** — powered by **Google Gemini LLMs**, **LangGraph workflows**, and **deterministic Python statistical engines**.

<div align="center">

| 📥 **Upload** | ➡️ | 🔍 **Profile** | ➡️ | 🤖 **Analyze** | ➡️ | ✅ **Verify** | ➡️ | 📊 **Present** |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| CSV · Excel · Parquet · JSON | | Types, nulls, outliers | | Multi-agent Q&A | | Critic audits findings | | Dashboard & PDF |

</div>

---

## 🌟 Key Features

<table>
<tr>
<td width="50%" valign="top">

### 📊 Automated Data Profiling
Instantly analyzes column types, null counts, statistical skewness, duplicate rows, and outlier distributions.

### 📈 Executive AI Dashboard
Interactive **dark-mode** dashboard with multiple **Chart.js** visualizations (Bar, Line, Doughnut, Polar Area) and KPI stat widgets.

### 📄 Instant PDF Export
One-click, high-fidelity PDF report generation, ready for executive presentation.

</td>
<td width="50%" valign="top">

### 🛡️ Strict Information Boundary
Zero raw SQL, generated Python code, system prompts, or model tokens are ever exposed to the user interface.

### ⚡ Deterministic Fallback
Operates flawlessly even if Gemini API keys are missing or API rate limits are hit.

### 🔒 Read-Only Validated Tools
All analytical tooling is read-only and validated, keeping your data safe.

</td>
</tr>
</table>

### 🤖 LangGraph Multi-Agent Architecture

Specialized Gemini role agents are orchestrated through a LangGraph workflow:

| Agent | Role |
| :--- | :--- |
| 🧭 **Supervisor Agent** | Classifies analytical intent and routes queries safely. |
| 🔤 **Semantic Resolver Agent** | Maps natural language terms to exact dataset column names. |
| ⚙️ **Execution Engine** | Runs deterministic Python/DuckDB calculations (SciPy, Statsmodels, Pandas). |
| 🕵️ **Critic Agent** | Audits findings, checks logical consistency, detects sample size bias, and issues quality warnings. |
| 💡 **Recommendation Agent** | Synthesizes grounded operational, strategic, and governance action items. |
| 🎨 **Dashboard Agent** | Generates executive visual dashboard layouts. |

---

## 🏗️ System Architecture

```text
React (Vite + TypeScript + Chart.js)
        ↓  HTTP / REST / SSE
FastAPI (Python Async Backend)
        ↓
LangGraph StateGraph Workflow Engine
        ↓
Gemini LLM Role Agents (Flash / Pro)
        ↓  Read-Only Validated Tools
DuckDB + Pandas + SciPy + Statsmodels
        ↓
Chart.js / Plotly + Executive PDF Export
```

---

## 🛠️ Technology Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,ts,vite,py,fastapi,pandas,numpy,scipy&perline=8" alt="Tech Stack Icons"/>

</div>

| Layer | Technologies |
| :--- | :--- |
| 🎨 **Frontend** | React 18, TypeScript, Vite, Chart.js, React ChartJS 2, React Plotly.js, Lucide React, html2pdf.js |
| ⚙️ **Backend** | Python 3.10+, FastAPI, Uvicorn, LangGraph, Pydantic v2 |
| 🧠 **LLM Engine** | Google Gemini API (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`) |
| 🗄️ **Data Engine** | Pandas, DuckDB, NumPy, SciPy, Statsmodels |

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory:

```env
# Gemini API Configuration
gemini_api=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-1.5-flash

# Optional Role-Specific Model Overrides
GEMINI_SUPERVISOR_MODEL=gemini-1.5-flash
GEMINI_SEMANTIC_MODEL=gemini-1.5-flash
GEMINI_ANALYST_MODEL=gemini-1.5-pro
GEMINI_CRITIC_MODEL=gemini-1.5-pro
GEMINI_DASHBOARD_MODEL=gemini-1.5-pro
```

> [!NOTE]
> If `gemini_api` is not set, the platform automatically falls back to the **deterministic rule-based backend engine**.

---

## 🚀 Quick Start Guide

### 1️⃣ Prerequisites

| Requirement | Version |
| :--- | :--- |
| 🐍 **Python** | 3.10+ |
| 🟢 **Node.js** & `npm` | 18+ |

### 2️⃣ Backend Setup & Startup

**Step 1 — Install backend dependencies** (PowerShell, project root):

```powershell
pip install fastapi uvicorn pandas numpy scipy statsmodels duckdb pydantic langgraph
```

**Step 2 — Start the FastAPI backend server:**

```powershell
$env:PYTHONPATH="backend"; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

📘 **API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3️⃣ Frontend Setup & Startup

**Step 1 — Install frontend dependencies** (second PowerShell terminal):

```powershell
cd frontend
npm install
```

**Step 2 — Start the Vite dev server:**

```powershell
npm run dev
```

🌐 **Web App UI:** [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Unit Tests

Run the complete backend `pytest` suite — covers Gemini fallbacks, read-only tools, LangGraph state, and the Dashboard Agent:

```powershell
$env:PYTHONPATH="backend"; python -m pytest backend/tests -v
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :---: | :--- | :--- |
| ![POST](https://img.shields.io/badge/POST-49cc90?style=flat-square) | `/api/datasets/upload` | Upload & profile dataset CSV/Excel/Parquet |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/datasets` | List all uploaded datasets |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/datasets/{id}` | Get detailed dataset profile & quality warnings |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/datasets/{id}/dashboard` | Generate executive Chart.js AI dashboard |
| ![POST](https://img.shields.io/badge/POST-49cc90?style=flat-square) | `/api/analyze` | Queue multi-agent analytical Q&A job |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/analyze/{id}` | Poll analysis execution status |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/analyze/{id}/result` | Fetch verified findings, recommendations & charts |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/analyze/{id}/events` | Stream real-time SSE agent execution progress |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/analyze/history` | List complete historical analysis runs |
| ![GET](https://img.shields.io/badge/GET-61affe?style=flat-square) | `/api/analyze/{id}/report` | Export executive report in Markdown format |

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">

**MIT License © 2026 InsightForge AI Team.**

<br/>

⭐ *If you find InsightForge AI useful, please consider giving it a star!* ⭐

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2c5364,50:203a43,100:0f2027&height=120&section=footer" alt="Footer" width="100%"/>

</div>
