# 🎓 SLIIT-Nexus – Smart Campus Operations Hub

A **Spring Boot + React** web application for managing university facility bookings, resource allocation, and maintenance incident tracking.  
Built as part of **IT3030 - Programming Applications and Frameworks** at SLIIT.

This project has two main parts:

- **Backend** – Spring Boot REST API with MongoDB (Java 17, Maven)  
- **Frontend** – React client web application (Node.js 18+)

---

## ✨ Features Implemented

### **Module A: Facilities & Assets Catalogue**
- CRUD operations for bookable resources (lecture halls, labs, meeting rooms, equipment)  
- Search and filter by type, capacity, location  
- Resource status management (ACTIVE / OUT_OF_SERVICE)

### **Module B: Booking Management**
- Users can request bookings with date, time range, purpose  
- Automatic conflict detection (no overlapping bookings)  
- Workflow: PENDING → APPROVED/REJECTED → CANCELLED  
- Admin approval/rejection with reason  
- View personal bookings (users) or all bookings (admin)

### **Module C: Maintenance & Incident Ticketing**
- Create incident tickets with category, description, priority  
- Upload up to 3 image attachments per ticket  
- Ticket workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED/REJECTED  
- Technician assignment and status updates  
- Comment system with ownership rules

### **Module D: Notifications**
- Real-time notifications for booking approvals/rejections  
- Ticket status change notifications  
- New comment notifications  
- Notification panel with read/unread status

### **Module E: Authentication & Authorization**
- OAuth 2.0 Google Sign-In  
- Role-based access control (USER, ADMIN, TECHNICIAN)  
- Protected API endpoints and frontend routes

---

📂 Project Structure

SLIIT_NEXUS/
├── nexus_backend/ (Spring Boot Backend)
│ ├── src/
│ │ ├── main/
│ │ │ ├── java/com/sliit/nexus/
│ │ │ │ ├── config/ (Security, OAuth, CORS configs)
│ │ │ │ ├── controller/ (REST API controllers)
│ │ │ │ ├── model/ (MongoDB document models)
│ │ │ │ ├── repository/ (MongoDB repositories)
│ │ │ │ ├── service/ (Business logic)
│ │ │ │ ├── dto/ (Data transfer objects)
│ │ │ │ ├── exception/ (Custom exceptions & handlers)
│ │ │ │ └── utils/ (Helper utilities)
│ │ │ └── resources/
│ │ │ ├── application.properties
│ │ │ └── application-dev.properties
│ │ └── test/ (Unit & integration tests)
│ ├── target/ (Build folder, ignored in Git)
│ ├── pom.xml
│ └── Dockerfile
│
├── nexus_frontend/ (React Frontend)
│ ├── src/
│ │ ├── components/
│ │ │ ├── common/ (Navbar, Sidebar, NotificationPanel)
│ │ │ ├── resources/ (Resource management)
│ │ │ ├── bookings/ (Booking management)
│ │ │ ├── tickets/ (Ticket management)
│ │ │ └── admin/ (Admin dashboard)
│ │ ├── pages/ (Login, Dashboard, etc.)
│ │ ├── services/ (API service calls)
│ │ ├── hooks/ (Custom React hooks)
│ │ ├── context/ (Auth context)
│ │ ├── styles/ (CSS files)
│ │ ├── App.js
│ │ └── index.js
│ ├── public/
│ ├── node_modules/ (Ignored in Git)
│ ├── build/ (Production build, ignored in Git)
│ ├── package.json
│ └── Dockerfile
│
├── .github/workflows/ci-cd.yml (GitHub Actions pipeline)
├── docs/ (Architecture diagrams, screenshots, reports)
├── .gitignore
├── README.md
└── docker-compose.yml (Optional Docker setup)

## ⚡ Prerequisites

- Java 17+  
- Maven  
- Node.js 18+ and npm  
- MongoDB (if used)  

---


💻 Running the Project

Backend (Spring Boot)
cd nexus_backend
./mvnw clean install
./mvnw spring-boot:run
Runs at: http://localhost:8080
✅ No need to install Maven globally; the wrapper will handle it automatically.

Frontend (React)
cd nexus_frontend
npm install   # install dependencies
npm start     # start development server
Runs at: http://localhost:3000
