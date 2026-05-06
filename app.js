import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import doctorRoutes from './src/routes/doctorRoutes.js';
import doctorAuthRoutes from './src/routes/doctorAuthRoutes.js';
import userRoutes from './src/routes/userRoutes.js'; 
import clinicRoutes from './src/routes/clinicRoutes.js'; 

const app = express();

//db connection
connectDB();

// ─── Global Middleware ──────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));// allow to send a complex array and objects to req


//baseURL
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Medical Booking API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ────
app.use('/api/auth', authRoutes);
app.use('/api/auth/doctor', doctorAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clinics', clinicRoutes); 

// ─── 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ───────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages[0] });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ─── Start Server ───────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
