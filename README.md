# 🛡️ AI-Powered Computer Laboratory Security & Surveillance System (FYP)

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Django 5.2](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF?style=for-the-badge&logo=yolo&logoColor=black)](https://ultralytics.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-Computer_Vision-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org/)
[![ReportLab](https://img.shields.io/badge/ReportLab-PDF_Engine-FF6B6B?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://www.reportlab.com/)

---

## 📌 Executive Overview

The **AI-Powered Computer Laboratory Security & Surveillance System** is an enterprise-grade Final Year Project (FYP) designed to safeguard academic computer facilities, monitor hardware assets in real time, and eliminate hardware theft or misplacement.

By combining continuous **YOLOv8 Deep Learning object detection**, **multi-camera IP streaming**, a **3-stage discrepancy verification engine**, and **forensic video capture**, the system automatically detects missing peripherals (e.g., mice, keyboards, laptops, monitors) and compiles legally admissible forensic evidence packages.

---

## 🚀 Key Features

### 🧠 1. Real-Time YOLOv8 Vision & Asset Baseline Monitoring
- **Automated Baseline Profiling**: Captures pristine laboratory reference snapshots and detects expected asset quantities.
- **Continuous Multi-Stream Inference**: Streams annotated MJPEG video from configured IP / RTSP cameras with low latency.
- **Discrepancy Detection**: Compares live detected assets against baseline profiles with high confidence thresholds.

### 🔍 2. 3-Stage Verification & Anti-False-Alarm Engine
- Eliminates false alarms caused by temporary occlusions or passing students.
- **Verification 1/3**: Automatically saves the *Before Frame* (last visible state) into memory.
- **Verification 2/3**: Validates sustained absence on subsequent cycles.
- **Verification 3/3**: Confirms the discrepancy, captures the *After Frame*, logs a security `Incident`, creates immediate `Notifications`, and triggers forensic video compilation.

### 🎥 3. Professional Forensic Evidence Capture
- **Rolling Circular Frame Buffer**: Continuously caches the last 10 seconds of raw camera frames in memory using `collections.deque`.
- **20-Second Forensic MP4 Generation**: Combines 10s pre-event buffer + 10s post-event frames with embedded bounding boxes, asset tags, confidence scores, and timestamps.
- **Isolated Evidence Storage**: Saves distinct forensic image snapshots and MP4 evidence packages for every missing asset independently.

### 📊 4. Security Operations Center (SOC) Main Dashboard
- **12 Live KPI Telemetry Cards**: Total Labs, Online Cameras, Active Sessions, Total Incidents, Critical Alerts, Pending Cases, Resolved Discrepancies, Evidence Files, and System Health.
- **Real-Time Notification Bell**: Dynamic synchronization with backend alerts and unread badge counters.
- **Facility Overview**: Live facility operational statuses and camera uptime tracking.

### 🖥️ 5. Live Monitoring & Fullscreen Surveillance
- **Isolated Fullscreen Mode**: Fullscreen mode targeting the camera feed container directly, excluding sidebars and menus.
- **Multi-Grid Layouts**: Switch seamlessly between `2x2` and `3x3` camera surveillance matrices.
- **Incident Management**: Direct deletion and review controls inside the Security Operations Incidents Log.

### 📄 6. Database-Driven PDF Reports Module
Generates 5 downloadable, vector-quality PDF security reports powered by `ReportLab`:
1. **Incident Audit Report**: Comprehensive record of security incidents with quantity comparison, confidence, severity, and status.
2. **Asset Missing Report**: Aggregated missing hardware audits, incident frequencies, and occurrence timelines.
3. **Laboratory Security Report**: Executive summary KPI dashboard and facility security health analysis.
4. **Evidence Report**: Chain-of-custody audit verifying physical image and MP4 video recordings on storage media.
5. **Lab Session Report**: Official audit log of instructor sessions, active surveillance windows, and concurrent discrepancy logs.
- **Shared Filtering Mechanism**: Filter reports by Target Laboratory, From Date, and To Date.

---

## 🏗️ System Architecture

```
                                  +-----------------------+
                                  |  IP / RTSP Cameras    |
                                  +-----------+-----------+
                                              |
                                              v
+-----------------------------------------------------------------------------------------+
|                                DJANGO BACKEND SYSTEM                                    |
|                                                                                         |
|  +------------------------+      +------------------------+      +-------------------+  |
|  | OpenCV Rolling Buffer  | ---> | YOLOv8 Vision Engine   | ---> | Baseline Profile  |  |
|  | (10s Pre-Event Buffer) |      | (Inference & Tracking) |      | Comparator        |  |
|  +------------------------+      +------------------------+      +---------+---------+  |
|                                                                            |            |
|                                                                            v            |
|  +------------------------+      +------------------------+      +-------------------+  |
|  | Forensic Video Writer  | <--- | Incident & Evidence    | <--- | 3-Stage Validator |  |
|  | (20s MP4 + BoundingBox)|      | Generator Engine       |      | (Cycles 1, 2, 3)  |  |
|  +------------------------+      +-----------+------------+      +-------------------+  |
|                                              |                                          |
|                                              v                                          |
|  +------------------------+      +------------------------+                             |
|  | ReportLab PDF Engine   | <--- | PostgreSQL / SQLite    |                             |
|  | (5 Official Reports)   |      | Database Models        |                             |
|  +------------------------+      +-----------+------------+                             |
+----------------------------------------------|------------------------------------------+
                                               |
                                               v HTTP / JWT REST API
+-----------------------------------------------------------------------------------------+
|                                REACT 19 FRONTEND (SOC)                                  |
|                                                                                         |
|  +-------------------+  +-------------------+  +-------------------+  +---------------+  |
|  | Main SOC Dashboard|  | Live Surveillance |  | Incidents & Logs  |  | Reports Hub   |  |
|  | (12 Live KPIs)    |  | (Isolated Screen) |  | (Evidence Review) |  | (PDF Audits)  |  |
|  +-------------------+  +-------------------+  +-------------------+  +---------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Framework** | Python 3.12, Django 5.2, Django REST Framework (DRF) |
| **Computer Vision & AI** | Ultralytics YOLOv8m, OpenCV (`cv2`), PyTorch, NumPy |
| **PDF Generation** | ReportLab 5.0 (Platypus Flowables & NumberedCanvas) |
| **Authentication & RBAC** | JWT (JSON Web Tokens via `djangorestframework-simplejwt`) |
| **Frontend Framework** | React 19, Vite 6, Tailwind CSS |
| **State & Data Fetching** | TanStack React Query v5, Axios Interceptors |
| **Icons & Visuals** | Lucide React, Recharts |
| **Database** | PostgreSQL / SQLite |

---

## 📁 Repository Structure

```
lab-security-system-fyp/
├── backend/
│   ├── ai_engine/           # YOLOv8 inference engine, circular buffer, & monitoring scheduler
│   ├── assets/              # Asset inventory models, serializers, & views
│   ├── cameras/             # IP camera management, RTSP streaming, & test utilities
│   ├── config/              # Django settings, root URLs, & ASGI/WSGI configs
│   ├── core/                # JWT authentication, RBAC permissions, & dashboard stats
│   ├── evidence/            # Forensic snapshot & MP4 video evidence models
│   ├── incidents/           # Discrepancy incident models, serializers, & views
│   ├── labs/                # Laboratory facilities & room configurations
│   ├── monitoring/          # Academic lab sessions & instructor records
│   ├── notifications/       # Security alert models, notifications, & bell manager
│   ├── reports/             # 5 Database-driven PDF report services & views
│   │   ├── pdf_generator.py # ReportLab document styling & NumberedCanvas engine
│   │   ├── services/        # Incident, Asset, Security, Evidence, & Session report services
│   │   ├── views.py         # DRF PDF download endpoints
│   │   └── tests.py         # Automated report test suite
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI cards, modals, layout, notification bell, & badges
│   │   ├── pages/           # Dashboard, Live Monitoring, Incidents, Reports, Sessions, etc.
│   │   ├── services/        # Axios API clients for all backend modules
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 20+ & npm**
- **Git**

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (Optional)
python manage.py createsuperuser

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Default Credentials

| Role | Username | Password |
|---|---|---|
| **Security Officer / Admin** | `admin_user` | `Password123!` |
| **Lab Instructor** | `instructor_user` | `Password123!` |

---

## 📡 API Endpoints Reference

### Security Reports (`/api/reports/`)
- `GET /api/reports/incident-report/?lab_id=&from_date=&to_date=` — Download Incident Audit PDF
- `GET /api/reports/asset-missing-report/?lab_id=&from_date=&to_date=` — Download Asset Missing Audit PDF
- `GET /api/reports/lab-security-report/?lab_id=&from_date=&to_date=` — Download Laboratory Security Summary PDF
- `GET /api/reports/evidence-report/?lab_id=&from_date=&to_date=` — Download Forensic Evidence Audit PDF
- `GET /api/reports/lab-session-report/?lab_id=&from_date=&to_date=` — Download Academic Lab Session Audit PDF

### Monitoring & Vision Engine (`/api/monitoring/`)
- `POST /api/monitoring/start/` — Start continuous AI surveillance loop
- `POST /api/monitoring/stop/` — Stop monitoring loop
- `GET /api/monitoring/status/` — Get real-time engine telemetry and active camera stats

### Security Incidents & Evidence (`/api/incidents/`, `/api/evidence/`)
- `GET /api/incidents/` — List security discrepancies
- `DELETE /api/incidents/<id>/` — Delete specific incident record
- `GET /api/evidence/` — List captured image & video evidence records

### Notifications (`/api/notifications/`)
- `GET /api/notifications/` — List unread and historical security alerts
- `POST /api/notifications/mark_all_read/` — Mark all active alerts as read

---

## 🧪 Testing & Verification

### Running Backend Unit Tests
```bash
cd backend
python manage.py test --noinput
```
*Result: **23/23 tests passing (100% OK)**.*

### Running Frontend Production Build
```bash
cd frontend
npm run build
```
*Result: **Production bundle compiled cleanly with 0 errors**.*

---

## 👥 Authors & Credits

Developed as a Final Year Project (FYP) by:
- **Department of Software Engineering**
- **AI-Powered Lab Security & Computer Vision Surveillance System**

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
