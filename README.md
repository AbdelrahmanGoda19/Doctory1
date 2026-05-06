# 🏥 Doctory — Medical Booking Backend

A production-ready RESTful API for a medical appointment booking platform built with **Node.js**, **Express**, and **MongoDB Atlas**.

---

## 🚀 Features

- **JWT Authentication** with email OTP verification
- **Role-based access control** — Patient, Doctor, Admin
- **Separate auth flows** for patients and doctors
- **Clinic management** with schedule slot system
- **Full appointment lifecycle** — book, confirm, complete, cancel, reschedule
- **Doctor profiles** with specialties, home visit & video consultation support
- **Admin dashboard** with platform statistics
- **Input validation** on all endpoints via express-validator
- **Consistent JSON responses** across all endpoints

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js + Express | Server & REST API |
| MongoDB Atlas + Mongoose | Database & ODM |
| JSON Web Tokens (JWT) | Authentication |
| Bcrypt.js | Password hashing |
| Nodemailer | OTP email sending |
| Express Validator | Input validation |

---

## 📁 Project Structure

```
├── app.js
├── package.json
├── .env.example
└── src/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── doctorAuthController.js
    │   ├── adminController.js
    │   ├── doctorController.js
    │   ├── clinicController.js
    │   ├── appointmentController.js
    │   └── userController.js
    ├── middleware/
    │   ├── auth.js
    │   ├── authorize.js
    │   └── validators.js
    ├── models/
    │   ├── User.js
    │   ├── Doctor.js
    │   ├── Clinic.js
    │   └── Appointment.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── doctorAuthRoutes.js
    │   ├── adminRoutes.js
    │   ├── doctorRoutes.js
    │   ├── clinicRoutes.js
    │   ├── appointmentRoutes.js
    │   └── userRoutes.js
    └── utils/
        ├── otp.js
        ├── email.js
        └── response.js
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourname/doctory-backend.git
cd doctory-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

FRONTEND_URL=http://localhost:4200
```

### 4. Run the server
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

---

## 📡 API Endpoints

### Auth — Patients `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new patient |
| POST | `/verify-otp` | Public | Verify email OTP |
| POST | `/resend-otp` | Public | Resend OTP |
| POST | `/login` | Public | Login & get token |
| GET | `/me` | Patient | Get current user |

### Auth — Doctors `/api/auth/doctor`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new doctor |
| POST | `/verify-otp` | Public | Verify email OTP |
| POST | `/resend-otp` | Public | Resend OTP |
| POST | `/login` | Public | Login & get token |

### Users `/api/users`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/:id` | Self / Admin | Get user profile |
| PATCH | `/:id` | Self / Admin | Update user |
| DELETE | `/:id` | Self / Admin | Delete user |

### Doctors `/api/doctors`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List doctors with filters |
| GET | `/:id` | Public | Get doctor profile |
| PATCH | `/:id` | Admin | Update doctor |
| DELETE | `/:id` | Admin | Delete doctor |

### Clinics `/api/clinics`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List clinics |
| GET | `/:id` | Public | Get clinic details |
| POST | `/` | Admin | Create clinic |
| PATCH | `/:id` | Admin | Update clinic |
| DELETE | `/:id` | Admin | Delete clinic |
| POST | `/:id/doctors` | Admin | Add doctor to clinic |
| DELETE | `/:id/doctors/:doctorId` | Admin | Remove doctor from clinic |
| GET | `/:id/schedule` | Public | Get available slots |
| POST | `/:id/schedule` | Admin / Doctor | Add schedule slots |
| PATCH | `/:id/schedule/:slotId` | Admin / Doctor | Update a slot |
| DELETE | `/:id/schedule/:slotId` | Admin / Doctor | Delete a slot |

### Appointments `/api/appointments`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Patient | Book appointment |
| GET | `/my` | Patient | Get my appointments |
| GET | `/doctor` | Doctor | Get doctor appointments |
| GET | `/` | Admin | Get all appointments |
| GET | `/:id` | Patient / Doctor / Admin | Get appointment details |
| PATCH | `/:id/confirm` | Doctor | Confirm appointment |
| PATCH | `/:id/complete` | Doctor | Mark as completed |
| PATCH | `/:id/notes` | Doctor | Add notes & prescription |
| PATCH | `/:id/no-show` | Doctor | Mark patient as no-show |
| PATCH | `/:id/cancel` | Patient / Doctor / Admin | Cancel appointment |
| PATCH | `/:id/reschedule` | Patient / Doctor | Reschedule appointment |

### Admin `/api/admin`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users` | Admin | List all users |
| GET | `/dashboard` | Admin | Platform statistics |
| PATCH | `/users/:id/toggle-status` | Admin | Activate / deactivate user |

---

## 🔐 Authentication

All protected routes require a Bearer token in the header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📅 Booking Flow

```
1. Patient views clinic slots     GET  /api/clinics/:id/schedule
2. Patient books appointment      POST /api/appointments
3. Doctor confirms                PATCH /api/appointments/:id/confirm
4. Visit happens
5. Doctor completes               PATCH /api/appointments/:id/complete
6. Doctor adds notes              PATCH /api/appointments/:id/notes
7. Patient leaves a review        (coming soon)
```

### Appointment Status Lifecycle
```
pending → confirmed → completed
                   ↘ no_show
pending/confirmed → cancelled
pending/confirmed → rescheduled
```

---

## 🔒 Roles & Permissions

| Action | Patient | Doctor | Admin |
|--------|---------|--------|-------|
| Register / Login | ✅ | ✅ | ✅ |
| Book appointment | ✅ | ❌ | ❌ |
| Confirm / Complete appointment | ❌ | ✅ | ❌ |
| Cancel appointment | ✅ | ✅ | ✅ |
| Manage clinics | ❌ | ❌ | ✅ |
| Manage schedule slots | ❌ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| Delete doctors | ❌ | ❌ | ✅ |

---

## 🌍 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `1d`, `7d`) |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_USER` | SMTP username / email |
| `EMAIL_PASS` | SMTP password / app password |
| `EMAIL_FROM` | Sender email address |
| `FRONTEND_URL` | Frontend URL for CORS |

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch `git checkout -b feature/your-feature`
3. Commit your changes `git commit -m 'Add some feature'`
4. Push to the branch `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">Built by Mostafa Akram for NTI Final Project</p>
