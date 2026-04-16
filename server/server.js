import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the .env file from the server directory explicitly
dotenv.config({ path: path.join(__dirname, '.env') });
// Fallback to the root `.env` if variables are not in server/.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected ✅'))
  .catch((err) => console.log('MongoDB Error ❌', err));

// ✅ User Schema & Model
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// ✅ Register Route
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed ❌', error: err.message });
  }
});

// ✅ Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });

    res.status(200).json({ message: 'Login successful ✅', username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Login failed ❌', error: err.message });
  }
});

// ✅ Logout Route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));