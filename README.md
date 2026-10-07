<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=220&section=header&text=MatchPulse&fontSize=72&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=EdTech%20%26%20Enterprise%20Talent%20Intelligence%20Engine&descAlignY=60&descSize=20" alt="MatchPulse Banner" width="100%"/>

<img src="https://img.icons8.com/fluency/200/artificial-intelligence.png" alt="MatchPulse Logo" width="120"/>

<h3>Explainable NLP Scoring &nbsp;•&nbsp; Local Generative AI &nbsp;•&nbsp; Recruiter-Grade Insights</h3>

<a href="https://github.com/">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=18&pause=1200&color=2C9CE6&center=true&vCenter=true&width=640&lines=Deterministic+match+scoring+you+can+trust;Local+LLM+narratives+via+Ollama+%28llama3.1%3A8b%29;Built+for+Bootcamps%2C+EdTech+%26+Enterprise+HR" alt="Typing SVG" />
</a>

<br/>

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![spaCy](https://img.shields.io/badge/spaCy-09A3D5?style=for-the-badge&logo=spacy&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Status](https://img.shields.io/badge/Phases-0--9%20Complete-success?style=for-the-badge)

<br/>

[**Overview**](#-overview) •
[**Architecture**](#-architecture-overview) •
[**Quick Start**](#-setup--running-instructions) •
[**API**](#-complete-api-sitemap) •
[**Roadmap**](#-complete-phase-status) •
[**Disclosures**](#-judicial--architectural-disclosure-notes)

</div>

---

## ✨ Overview

**MatchPulse** is an enterprise **AI + Data Science** platform designed for **EdTech Course Platforms, Tech Bootcamps, and Enterprise HR Recruiters**.

It pairs two complementary engines:

<table align="center">
  <tr>
    <td align="center" width="50%">
      <h3>🧮 Deterministic NLP Math</h3>
      <sub><code>sentence-transformers</code> embeddings<br/>+ <code>spaCy</code> entity extraction<br/>+ skill alias normalization</sub>
      <br/><br/>
      <b>100% explainable &amp; reproducible match scoring</b>
    </td>
    <td align="center" width="50%">
      <h3>🤖 Local Generative AI</h3>
      <sub><code>Ollama</code> · <code>llama3.1:8b</code><br/>runs fully on your machine</sub>
      <br/><br/>
      <b>Grounded match narratives, tailored interview prep &amp; metric-driven resume rewrites</b>
    </td>
  </tr>
</table>

### 🎯 Key Highlights

| | Feature | What it gives you |
|:-:|---|---|
| 📈 | **Explainable Match Score** | 0–100 score from embeddings + keyword overlap + experience math |
| 🔍 | **Git-Diff Skill Gap View** | Matched vs. missing skills with EdTech learning paths |
| 🎤 | **AI Mock Interviews** | 4–8 tailored technical questions per candidate/JD pair |
| ✍️ | **Bullet Rewriter** | Turns vague resume lines into metric-driven achievements |
| 🧭 | **Career Intelligence** | 5-axis role-fit radar and trajectory prediction |
| 🛡️ | **ATS & Bias Tools** | ATS fidelity meter, recruiter heatmap, demographic bias scanner |
| 📦 | **Bulk Dashboard** | Batch scoring, live resume health editor, shareable PNG cards |

---

## 🏛️ Architecture Overview

```mermaid
flowchart TB
    A["🖥️ Frontend<br/>HTML / CSS / Vanilla JS<br/>Chart.js + Canvas PNG Card"] -->|HTTP / REST| B["⚡ FastAPI Server<br/>Python 3.10+ / Uvicorn"]
    B --> C[("🗄️ MySQL<br/>Schema Pool")]
    B --> D["🧠 NLP / ML Engine<br/>spaCy + sentence-transformers"]
    D --> E["🦙 Local Ollama LLM<br/>llama3.1:8b"]
```

<details>
<summary><b>📜 View classic ASCII diagram</b></summary>

```
                    ┌──────────────────────────────────────────┐
                    │   Frontend: HTML / CSS / Vanilla JS      │
                    │   Chart.js CDN + HTML5 Canvas PNG Card   │
                    └────────────────────┬─────────────────────┘
                                         │ HTTP / REST APIs
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │          Backend: FastAPI Server         │
                    │           (Python 3.10+ / Uvicorn)       │
                    └───────┬──────────────────┬───────────────┘
                            │                  │
          ┌─────────────────┴─┐              ┌─┴────────────────┐
          │   MySQL Database  │              │  NLP / ML Engine │
          │  (Schema Pool)    │              │ (sentence-trans) │
          └───────────────────┘              └─┬────────────────┘
                                               │
                                               ▼
                                     ┌──────────────────┐
                                     │ Local Ollama LLM │
                                     │  (llama3.1:8b)   │
                                     └──────────────────┘
```

</details>

### 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Plain HTML5, Vanilla CSS3, Vanilla JavaScript, Chart.js (CDN) — *zero npm/node build steps* |
| **Backend** | Python **FastAPI** with CORS middleware |
| **Database** | **MySQL** raw schema pool (`mysql-connector-python`) |
| **NLP Engine** | **spaCy** (`en_core_web_sm`) for entities · **sentence-transformers** (`all-MiniLM-L6-v2`) for cosine similarity |
| **Generative AI** | **Ollama** HTTP API (`llama3.1:8b` or `mistral:7b`) for grounded summaries & interview questions |

---

## 🚀 Setup & Running Instructions

> **Prerequisites:** Python 3.10+, MySQL Server, and [Ollama](https://ollama.com/) installed locally.

### 1️⃣ Database Setup (MySQL)

Make sure MySQL Server is running locally, then create the database and apply the schema:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS resume_jd_matcher;"
mysql -u root -p resume_jd_matcher < db/schema.sql
```

Copy the environment configuration file:

```bash
cp .env.example .env
```

> 💡 Update `.env` with your MySQL **user, password, host, and port**.

### 2️⃣ Python Environment Setup

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 3️⃣ Local LLM Setup (Ollama)

```bash
ollama pull llama3.1:8b
```

### 4️⃣ Run the Backend Server

From the project root directory:

```bash
uvicorn backend.main:app --reload --port 8000
```

| Resource | URL |
|---|---|
| 📘 Swagger Interactive API Docs | <http://localhost:8000/docs> |
| ❤️ Health Check Endpoint | <http://localhost:8000/health> |

### 5️⃣ Run the Frontend

Open `frontend/index.html` directly in any modern browser, **or** serve it via Python:

```bash
python -m http.server 3000 --directory frontend
```

Then visit <http://localhost:3000> 🎉

---

## 🗺️ Complete API Sitemap

| Endpoint | Method | Description |
|---|:-:|---|
| `/health` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Health check (DB connection & Ollama liveness) |
| `/upload-jd` | ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | Upload or paste Job Description |
| `/upload-resumes` | ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | Upload PDF/DOCX/Text candidate resumes |
| `/resumes` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | List all uploaded candidate resumes |
| `/resume/{id}/parsed` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Inspect candidate extracted skills & experience |
| `/jd/{id}/parsed` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Inspect target JD required skills & experience |
| `/score/{resume_id}/{jd_id}` | ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | Compute 0–100 match score for candidate against JD |
| `/scores/{jd_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Candidate leaderboard rankings for target JD |
| `/skill-gap/{resume_id}/{jd_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Git-diff match vs missing skills & learning paths |
| `/ai/gap-summary/{resume_id}/{jd_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Grounded Ollama LLM natural-language gap narrative |
| `/ai/mock-questions/{resume_id}/{jd_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Generate 4–8 tailored technical interview questions |
| `/ai/rewrite-bullet` | ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | Metric-driven resume bullet point quantifier |
| `/career-intelligence/{resume_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | 5-axis multi-role fit radar & career trajectory |
| `/ats/preview/{resume_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | ATS raw text parsing fidelity & readability meter |
| `/ats/heatmap/{resume_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | 6-second recruiter visual scan heatmap |
| `/ats/bias-check/{resume_id}` | ![GET](https://img.shields.io/badge/GET-61AFFE?style=flat-square) | Demographic bias detector & neutral screening scanner |
| `/score-batch/{jd_id}` | ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | Batched vector embedding scoring for bulk resumes |
| `/score-live` | ![POST](https://img.shields.io/badge/POST-49CC90?style=flat-square) | 300ms debounced live resume health scoring editor |

---

## 📊 Complete Phase Status

![Progress](https://img.shields.io/badge/Progress-100%25-brightgreen?style=for-the-badge)

| Phase | Name | Highlights | Status |
|:-:|---|---|:-:|
| **0** | Foundation | Skeleton, MySQL schema, FastAPI, static shell | ✅ |
| **1** | Resume / JD Ingestion | PDF (`pdfplumber`), DOCX, text extraction & DB storage | ✅ |
| **2** | Feature Extraction | spaCy `en_core_web_sm`, skill alias taxonomy normalization | ✅ |
| **3** | Scoring Engine | Vector cosine similarity + keyword overlap + experience math | ✅ |
| **4** | Skill-Gap Experience | Git-diff match view, Chart.js bar chart, EdTech learning paths | ✅ |
| **5** | Ollama Generative Layer | Grounded summaries, mock questions, bullet rewriter | ✅ |
| **6** | Career Intelligence | 5-axis role radar, trajectory predictor, unquantified bullet detector | ✅ |
| **7** | ATS & Recruiter Extras | ATS text preview, 6-second heatmap, bias scanner | ✅ |
| **8** | Bulk Dashboard | Batch scoring, live health editor, HTML5 canvas PNG card generator | ✅ |
| **9** | Final Polish & Demo | EdTech enterprise UI pass, `DEMO_SCRIPT.md`, architecture docs | ✅ |

---

## ⚖️ Judicial & Architectural Disclosure Notes

> [!IMPORTANT]
> **Explainable Scoring Math** — Core match scoring is strictly computed by deterministic NLP math (embeddings + keyword overlap + experience formula). The LLM is **never** asked to invent a match score, ensuring 100% reproducible and explainable results.

> [!NOTE]
> **Scannability Proxy** — The 6-second scan simulator uses a layout-density and header-structure proxy algorithm rather than eye-tracking hardware.

> [!NOTE]
> **Demographic Bias Neutrality** — The bias scanner flags non-essential demographic cues (e.g., graduation dates more than 15 years ago, personal status, gender pronouns) to assist blind screening.

---

<div align="center">

### 💙 Built for fair, explainable, and AI-assisted hiring

<sub>If you find MatchPulse useful, consider giving it a ⭐</sub>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2c5364,50:203a43,100:0f2027&height=120&section=footer" alt="Footer" width="100%"/>

</div>![Uploading MatchPulse AI Talent Intelligence Overview.png…]()
