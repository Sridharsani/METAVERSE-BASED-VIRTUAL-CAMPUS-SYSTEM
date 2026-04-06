import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  BookOpen, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  MessageSquare, 
  Calendar, 
  ClipboardList, 
  LogOut, 
  Plus, 
  Trash2, 
  Users, 
  Clock, 
  Star,
  CheckCircle,
  XCircle,
  FileText,
  Send,
  Upload,
  ArrowRight,
  Award,
  Edit2,
  Save
} from 'lucide-react';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

// --- Components ---

const Navbar = ({ user, onLogout }) => (
  <nav className="bg-indigo-700 text-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="bg-white p-1.5 rounded-lg">
        <BookOpen className="w-6 h-6 text-indigo-700" />
      </div>
      <span className="font-bold text-xl tracking-tight hidden sm:block">Metaverse Campus</span>
    </div>
    {user && (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-80">{user.role}</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 hover:bg-indigo-600 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    )}
  </nav>
);

// --- Pages ---

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      onLogin(data.user);
      navigate(data.user.role === 'Faculty' ? '/faculty-dashboard' : '/student-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-zinc-100 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 text-white">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-900">Campus Login</h2>
          <p className="text-zinc-500 mt-2">Enter your credentials to enter the metaverse</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="user@campus.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-4">
              {['Student', 'Faculty'].map(r => (
                <button
                  key={r} type="button" onClick={() => setRole(r)}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                    role === r ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-zinc-100 bg-zinc-50 text-zinc-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
            Enter Campus
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-zinc-500">
           Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      await api.post('/auth/register', { email, password, name, role });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-zinc-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Registration</h2>
          <p className="text-zinc-500">Create a new account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Registration successful! Redirecting...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
            <input 
              type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-4">
              {['Student', 'Faculty'].map(r => (
                <button
                  key={r} type="button" onClick={() => setRole(r)}
                  className={`py-2 rounded-xl border-2 font-semibold transition-all ${
                    role === r ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-zinc-100 bg-zinc-50 text-zinc-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
            Register Account
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-zinc-500">
           Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
};

const FacultyDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [tests, setTests] = useState([]);
  const [testResults, setTestResults] = useState([]);

  const [newClass, setNewClass] = useState({ course: '', faculty: user?.name || '', time: '' });
  const [newAnn, setNewAnn] = useState('');
  const [newSchedule, setNewSchedule] = useState({ course: '', faculty: user?.name || '', time: '' });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newTest, setNewTest] = useState({ title: '', questions: '', answers: '', faculty: user?.name || '' });

  const fetchData = async () => {
    try {
      const [cls, ann, tmt, fbk, tst, res] = await Promise.all([
        api.get('/classes'),
        api.get('/announcements'),
        api.get('/timetable'),
        api.get('/feedback'),
        api.get('/tests'),
        api.get('/test-results')
      ]);
      setClasses(cls.data);
      setAnnouncements(ann.data);
      setTimetable(tmt.data);
      setFeedback(fbk.data);
      setTests(tst.data);
      setTestResults(res.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startClass = async () => {
    if (!newClass.course || !newClass.faculty || !newClass.time) return;
    try {
      const id = Date.now();
      await api.post('/classes', { ...newClass, id });
      setNewClass({ course: '', faculty: user?.name || '', time: '' });
      fetchData();
      
      // Auto-join immediately upon starting
      await api.post(`/classes/${id}/join`, { student_name: user?.name });
      navigate(`/live/${id}`);
    } catch (e) {
      alert('Failed to start class');
    }
  };

  const endClass = async (id) => {
    try {
      await api.delete(`/classes/${id}`);
      fetchData();
    } catch (e) {
      alert('Failed to end class');
    }
  };

  const joinClass = async (c) => {
    try {
      await api.post(`/classes/${c.id}/join`, { student_name: user?.name });
      navigate(`/live/${c.id}`);
    } catch (error) {
       alert('Failed to join class');
    }
  };

  const postAnnouncement = async () => {
    if (!newAnn) return;
    try {
      await api.post('/announcements', { text: newAnn, date: new Date().toLocaleString() });
      setNewAnn('');
      fetchData();
    } catch (e) {
      alert('Failed to post announcement');
    }
  };

  const addSchedule = async () => {
    if (!newSchedule.course || !newSchedule.faculty || !newSchedule.time) return;
    try {
      await api.post('/timetable', newSchedule);
      setNewSchedule({ course: '', faculty: user?.name || '', time: '' });
      fetchData();
    } catch (e) {
      alert('Failed to add schedule');
    }
  };

  const updateSchedule = async () => {
    if (!editingSchedule.course || !editingSchedule.faculty || !editingSchedule.time) return;
    try {
      await api.put(`/timetable/${editingSchedule.id}`, editingSchedule);
      setEditingSchedule(null);
      fetchData();
    } catch (e) {
      alert('Failed to update schedule');
    }
  };

  const deleteSchedule = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await api.delete(`/timetable/${id}`);
        fetchData();
      } catch (e) {
        alert('Failed to delete schedule');
      }
    }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (type === 'questions') setNewTest(prev => ({ ...prev, questions: content }));
      else setNewTest(prev => ({ ...prev, answers: content }));
    };
    reader.readAsText(file);
  };

  const createTest = async () => {
    if (!newTest.title || !newTest.questions || !newTest.answers) {
      alert("Please provide title, questions, and answers.");
      return;
    }
    const qList = newTest.questions.split('\n').filter(q => q.trim());
    const aList = newTest.answers.split('\n').filter(a => a.trim());
    
    if (qList.length !== aList.length) {
      alert("Number of questions and answers must match.");
      return;
    }

    try {
      await api.post('/tests', {
        id: Date.now(),
        title: newTest.title,
        faculty: newTest.faculty,
        questions: qList,
        answers: aList
      });
      setNewTest({ title: '', questions: '', answers: '', faculty: user?.name || '' });
      alert("Test created and published!");
      fetchData();
    } catch (e) {
      alert('Failed to create test');
    }
  };

  const avgRating = feedback.length > 0 
    ? (feedback.reduce((acc, f) => acc + Number(f.rating), 0) / feedback.length).toFixed(1) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900">Faculty Virtual Campus Dashboard</h1>
          <p className="text-zinc-500">Manage your virtual academic environment</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-zinc-900">{user?.name || 'Faculty Member'}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Faculty • Dept. of Physics</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Class Management */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Class Management</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input 
                  placeholder="Course Name" value={newClass.course} onChange={e => setNewClass({...newClass, course: e.target.value})}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input 
                  placeholder="Faculty Name" value={newClass.faculty} onChange={e => setNewClass({...newClass, faculty: e.target.value})}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input 
                  placeholder="Time" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button onClick={startClass} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                Start Class
              </button>

              <div className="space-y-3">
                <h3 className="font-bold text-zinc-700">Active Live Classes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classes.map(c => (
                    <div key={c.id} className="flex flex-col xl:flex-row items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl gap-3">
                      <div className="text-center xl:text-left">
                        <p className="font-bold text-emerald-900">{c.course}</p>
                        <p className="text-xs text-emerald-700">{c.faculty} • {c.time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => joinClass(c)} 
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
                        >
                          Join Class
                        </button>
                        <button 
                          onClick={() => endClass(c.id)} 
                          className="px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-200 transition-all"
                        >
                          End
                        </button>
                      </div>
                    </div>
                  ))}
                  {classes.length === 0 && <p className="text-sm text-zinc-400 italic">No live classes currently.</p>}
                </div>
              </div>
            </div>
          </section>

          {/* Timetable Management */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Timetable Management</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input 
                  placeholder="Course" value={editingSchedule ? editingSchedule.course : newSchedule.course} 
                  onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, course: e.target.value}) : setNewSchedule({...newSchedule, course: e.target.value})}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input 
                  placeholder="Faculty" value={editingSchedule ? editingSchedule.faculty : newSchedule.faculty} 
                  onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, faculty: e.target.value}) : setNewSchedule({...newSchedule, faculty: e.target.value})}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input 
                  placeholder="Time" value={editingSchedule ? editingSchedule.time : newSchedule.time} 
                  onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, time: e.target.value}) : setNewSchedule({...newSchedule, time: e.target.value})}
                  className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button 
                onClick={editingSchedule ? updateSchedule : addSchedule} 
                className={`w-full py-3 text-white font-bold rounded-xl transition-all ${editingSchedule ? 'bg-amber-600 hover:bg-amber-700' : 'bg-zinc-900 hover:bg-black'}`}
              >
                {editingSchedule ? 'Update Schedule' : 'Add to Schedule'}
              </button>

              <div className="space-y-2">
                {timetable.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div>
                      <p className="font-bold text-zinc-900">{t.course}</p>
                      <p className="text-xs text-zinc-500">{t.faculty} • {t.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingSchedule(t)} className="p-2 text-zinc-400 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSchedule(t.id)} className="p-2 text-zinc-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Test Creation */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Conduct Online Test</h2>
            </div>
            <div className="p-6 space-y-6">
              <input 
                placeholder="Test Title" value={newTest.title} onChange={e => setNewTest({...newTest, title: e.target.value})}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Upload Questions (PDF Simulation)</label>
                  <div className="relative">
                    <input type="file" onChange={e => handleFileUpload(e, 'questions')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="p-4 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center gap-2 text-zinc-400">
                      <Upload className="w-4 h-4" />
                      <span className="text-xs">Select Questions File</span>
                    </div>
                  </div>
                  <textarea 
                    placeholder="Or type questions here (one per line)..." value={newTest.questions} onChange={e => setNewTest({...newTest, questions: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Upload Answers (Key Simulation)</label>
                  <div className="relative">
                    <input type="file" onChange={e => handleFileUpload(e, 'answers')} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="p-4 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center gap-2 text-zinc-400">
                      <Upload className="w-4 h-4" />
                      <span className="text-xs">Select Answer Key</span>
                    </div>
                  </div>
                  <textarea 
                    placeholder="Or type answers here (one per line)..." value={newTest.answers} onChange={e => setNewTest({...newTest, answers: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24 text-sm"
                  />
                </div>
              </div>
              <button onClick={createTest} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
                Publish Test
              </button>

              <div className="mt-8">
                <h3 className="font-bold text-zinc-700 mb-4">Student Marks</h3>
                <div className="space-y-2">
                  {testResults.map((r, i) => (
                    <div key={i} className="flex justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <span className="font-bold">{r.student}</span>
                      <span className="text-indigo-600 font-black">{r.score}/{r.total}</span>
                    </div>
                  ))}
                  {testResults.length === 0 && <p className="text-sm text-zinc-400 italic">No results yet.</p>}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Announcements */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Post Announcement</h2>
            </div>
            <div className="p-6 space-y-4">
              <textarea 
                placeholder="Type your announcement..." value={newAnn} onChange={e => setNewAnn(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              />
              <button onClick={postAnnouncement} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                Post Announcement
              </button>
              <div className="mt-4 space-y-3">
                {announcements.map((a, i) => (
                  <div key={i} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-sm text-zinc-800">{a.text}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{a.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Feedback Viewing */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Feedback
              </h2>
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700">{avgRating}</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {feedback.map((f, i) => (
                <div key={i} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < f.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-700 italic">"{f.text}"</p>
                </div>
              ))}
              {feedback.length === 0 && <p className="text-sm text-zinc-400 italic">No feedback received.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const StudentDashboard = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [attendance, setAttendance] = useState({ count: 18, total: 22, today: 'Pending' });
  const [tests, setTests] = useState([]);

  const [newFeedback, setNewFeedback] = useState({ text: '', rating: 5 });
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [cls, ann, tmt, att, tst] = await Promise.all([
        api.get('/classes'),
        api.get('/announcements'),
        api.get('/timetable'),
        api.get('/attendance'),
        api.get('/tests')
      ]);
      setClasses(cls.data);
      setAnnouncements(ann.data);
      setTimetable(tmt.data);
      setAttendance(att.data);
      setTests(tst.data);
    } catch (error) {
       console.error('Failed to fetch dashboard data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitFeedback = async () => {
    if (!newFeedback.text) return;
    try {
      await api.post('/feedback', newFeedback);
      setNewFeedback({ text: '', rating: 5 });
      alert('Feedback submitted!');
    } catch (e) {
      alert('Failed to submit feedback');
    }
  };

  const joinClass = async (c) => {
    try {
      await api.post(`/classes/${c.id}/join`, { student_name: user.name });
      navigate(`/live/${c.id}`);
    } catch (error) {
       alert('Failed to join class');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-zinc-900">Metaverse-Based Virtual Campus Dashboard</h1>
          <p className="text-zinc-500">Welcome back to your digital learning space</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-zinc-900">{user.name}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">B.Tech CSE • 3rd Year</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Attendance</p>
            <p className="text-xl font-black text-zinc-900">{attendance.count}/{attendance.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Live Classes</p>
            <p className="text-xl font-black text-zinc-900">{classes.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Today Status</p>
            <p className="text-xl font-black text-zinc-900">{attendance.today}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-2xl text-red-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Students</p>
            <p className="text-xl font-black text-zinc-900">1,240</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Ongoing Classes */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Ongoing Live Classes</h2>
            </div>
            <div className="p-6 space-y-4">
              {classes.map(c => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-3xl gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">{c.course}</h3>
                    <p className="text-sm text-zinc-500">Prof. {c.faculty} • Starts at {c.time}</p>
                  </div>
                  <button 
                    onClick={() => joinClass(c)}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Join Class
                  </button>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-400 italic">No live classes at the moment.</p>
                </div>
              )}
            </div>
          </section>

          {/* Available Tests */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Available Assessments</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tests.map(t => (
                <div key={t.id} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900">{t.title}</h3>
                    <p className="text-xs text-zinc-500">{t.questions?.length || 0} Questions</p>
                  </div>
                  <Link to={`/test/${t.id}`} className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
              {tests.length === 0 && <p className="text-sm text-zinc-400 italic col-span-2 text-center">No tests available.</p>}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Announcements */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Announcements</h2>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {announcements.map((a, i) => (
                <div key={i} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <p className="text-sm text-zinc-800 leading-relaxed">{a.text}</p>
                  <p className="text-[10px] text-indigo-400 font-bold mt-2 uppercase">{a.date}</p>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-sm text-zinc-400 italic">No announcements.</p>}
            </div>
          </section>

          {/* Timetable */}
          <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold">Timetable Schedule</h2>
            </div>
            <div className="p-6 space-y-3">
              {timetable.map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.course}</p>
                    <p className="text-[10px] text-zinc-500">{t.faculty}</p>
                  </div>
                  <span className="text-xs font-black text-indigo-600">{t.time}</span>
                </div>
              ))}
              {timetable.length === 0 && <p className="text-sm text-zinc-400 italic">Schedule not updated.</p>}
            </div>
          </section>

          {/* Feedback Form */}
          <section className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Course Feedback
            </h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button 
                    key={num} onClick={() => setNewFeedback({...newFeedback, rating: num})}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      newFeedback.rating >= num ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${newFeedback.rating >= num ? 'fill-white' : ''}`} />
                  </button>
                ))}
              </div>
              <textarea 
                placeholder="Share your experience..." value={newFeedback.text} onChange={e => setNewFeedback({...newFeedback, text: e.target.value})}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 h-20 text-sm"
              />
              <button onClick={submitFeedback} className="w-full py-3 bg-amber-500 text-zinc-900 font-bold rounded-xl hover:bg-amber-400 transition-all">
                Submit Feedback
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const LiveClassroom = ({ user }) => {
  const { id } = useParams();
  const [currentClass, setCurrentClass] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [joinTime] = useState(Date.now());
  const videoRef = React.useRef(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const [clsRes, pRes] = await Promise.all([
          api.get('/classes'),
          api.get(`/classes/${id}/participants`)
        ]);
        const cls = clsRes.data.find(c => c.id === Number(id));
        setCurrentClass(cls);
        setParticipants(pRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClassDetails();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch(err => console.error("Error accessing media devices.", err));
  }, [id]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !cameraOn);
      setCameraOn(!cameraOn);
    }
  };

  const handleLeaveClass = async () => {
    if (user.role === 'Student') {
      const duration = Date.now() - joinTime;
      const isPresent = duration >= 30 * 60 * 1000;
      try {
        await api.post('/attendance', {
          class_id: id,
          student: user.name,
          status: isPresent ? 'Present' : 'Absent',
          duration_ms: duration
        });
        alert(`You stayed in the class for ${(duration / 60000).toFixed(1)} minutes. Marked as ${isPresent ? 'Present' : 'Absent'}. (30 mins required)`);
      } catch (e) {
        console.error(e);
        alert(`You stayed in the class for ${(duration / 60000).toFixed(1)} minutes. Marked as ${isPresent ? 'Present' : 'Absent'}. (30 mins required)`);
      }
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate(user.role === 'Faculty' ? '/faculty-dashboard' : '/student-dashboard');
  };

  if (loading) return <div className="p-8 text-center text-white">Loading class...</div>;
  if (!currentClass) return <div className="p-8 text-center text-white">Class not found or ended.</div>;

  return (
    <div className="min-h-[calc(100vh-72px)] bg-zinc-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto h-full flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative flex-1 bg-zinc-800 rounded-3xl border border-zinc-700 overflow-hidden flex items-center justify-center min-h-[400px]">
            {cameraOn ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                  {currentClass.faculty[0]}
                </div>
                <p className="text-white font-bold text-xl">Prof. {currentClass.faculty}</p>
                <p className="text-zinc-500 text-sm">Presenting: {currentClass.course}</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold z-10">
              {currentClass.course} • LIVE
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 py-4">
            <button onClick={toggleMic} className={`p-4 rounded-full transition-all text-white ${micOn ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <button onClick={toggleCamera} className={`p-4 rounded-full transition-all text-white ${cameraOn ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {cameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
            <button 
              onClick={handleLeaveClass}
              className="px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all"
            >
              Leave Class
            </button>
          </div>
        </div>

        <div className="w-full lg:w-80 bg-zinc-800 rounded-3xl border border-zinc-700 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({participants.length + 1})
            </h3>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center gap-3 p-2 bg-indigo-600/20 rounded-xl border border-indigo-600/30">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {currentClass.faculty[0]}
              </div>
              <div>
                <p className="text-white text-sm font-bold">Prof. {currentClass.faculty}</p>
                <p className="text-indigo-400 text-[10px] uppercase font-black">Host</p>
              </div>
            </div>
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-zinc-700/50 rounded-xl border border-zinc-600/30">
                <div className="w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {p[0]}
                </div>
                <p className="text-zinc-300 text-sm font-medium">{p} {p === user.name ? '(You)' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TestPage = ({ user }) => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await api.get('/tests');
        const t = data.find(t => t.id === Number(id));
        setTest(t);
      } catch (err) {
        console.error(err);
      } finally {
         setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  const submitTest = React.useCallback(async () => {
    if (submitted || !test) return;
    let currentScore = 0;
    test.questions.forEach((q, i) => {
      if (answers[i]?.toLowerCase().trim() === test.answers[i]?.toLowerCase().trim()) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setSubmitted(true);

    try {
      await api.post('/test-results', {
        test_id: test.id,
        student: user.name,
        score: currentScore,
        total: test.questions.length
      });
    } catch (e) {
      console.error('Failed to save results', e);
    }
  }, [answers, test, user.name, submitted]);

  useEffect(() => {
    if (!test || submitted) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [test, submitted, submitTest]);

  if (loading) return <div className="p-8 text-center">Loading test...</div>;
  if (!test) return <div className="p-8 text-center">Test not found.</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-6 md:p-8 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              {test.title}
            </h2>
            <p className="text-zinc-500 mt-1">Faculty: {test.faculty}</p>
          </div>
          <div className="flex gap-4 items-center">
            {!submitted && (
              <div className={`px-4 py-2 rounded-xl font-bold border shadow-sm ${timeLeft < 300 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                Time Left: {formatTime(timeLeft)}
              </div>
            )}
            {submitted && (
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-700 font-bold border border-emerald-100 shadow-sm">
                <Award className="w-5 h-5" />
                Score: {score} / {test.questions.length}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {submitted ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 mb-2">Test Completed!</h3>
                <p className="text-zinc-500">Your answers have been submitted automatically.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-zinc-700 border-b pb-2">Review Answers</h4>
                {test.questions.map((q, i) => {
                  const isCorrect = answers[i]?.toLowerCase().trim() === test.answers[i]?.toLowerCase().trim();
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <p className="font-bold text-zinc-900 mb-2">Q{i + 1}: {q}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-zinc-500 font-semibold mb-1">Your Answer:</p>
                          <p className={isCorrect ? 'text-emerald-700' : 'text-red-700'}>{answers[i] || 'No answer'}</p>
                        </div>
                        {!isCorrect && (
                          <div>
                            <p className="text-zinc-500 font-semibold mb-1">Correct Answer:</p>
                            <p className="text-zinc-900">{test.answers[i]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={() => navigate('/student-dashboard')}
                className="w-full py-4 mt-8 bg-zinc-900 text-white font-bold rounded-xl hover:bg-black transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {test.questions.map((q, i) => (
                <div key={i} className="bg-white">
                  <p className="font-bold text-lg text-zinc-900 mb-3 flex gap-4">
                    <span className="text-indigo-600">{i + 1}.</span> {q}
                  </p>
                  <div className="pl-6">
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={answers[i] || ''}
                      onChange={e => setAnswers({...answers, [i]: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!submitted && (
          <div className="p-6 md:p-8 border-t border-zinc-100 bg-zinc-50">
            <button 
              onClick={submitTest}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Submit Test Options
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch(e) {
      console.error('Logout failed', e);
    }
  };

  if (loading) return null;

  return (
    <Router>
      <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900">
        <Navbar user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={user ? <Navigate to={user.role === 'Faculty' ? '/faculty-dashboard' : '/student-dashboard'} /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          <Route path="/faculty-dashboard" element={user?.role === 'Faculty' ? <FacultyDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/student-dashboard" element={user?.role === 'Student' ? <StudentDashboard user={user} /> : <Navigate to="/login" />} />
          
          <Route path="/live/:id" element={user ? <LiveClassroom user={user} /> : <Navigate to="/login" />} />
          <Route path="/test/:id" element={user?.role === 'Student' ? <TestPage user={user} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}
