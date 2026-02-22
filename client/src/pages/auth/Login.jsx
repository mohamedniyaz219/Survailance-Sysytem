import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginOfficial } from '../../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({ business_code: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginOfficial(formData));
    if (loginOfficial.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-stone-brown-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <ShieldAlert size={48} className="text-toasted-almond-500 mb-2" />
            <h1 className="text-2xl font-black text-stone-brown-900">Sentinel Command</h1>
            <p className="text-silver-500 text-sm">Official Personnel Access Only</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-silver-500 uppercase mb-1">Business Code</label>
            <input 
              type="text" 
              className="w-full bg-stone-brown-50 border border-stone-brown-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-toasted-almond-500 font-mono text-stone-brown-900"
              placeholder="e.g. TN-POL"
              onChange={(e) => setFormData({...formData, business_code: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-silver-500 uppercase mb-1">Official Email</label>
            <input 
              type="email" 
              className="w-full bg-stone-brown-50 border border-stone-brown-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-toasted-almond-500"
              placeholder="officer@dept.gov"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-silver-500 uppercase mb-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-stone-brown-50 border border-stone-brown-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-toasted-almond-500"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-stone-brown-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-stone-brown-800 transition-all active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Authenticating...' : 'Access Console'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <Link to="/register-org" className="text-sm text-toasted-almond-600 font-bold hover:underline">
                Register New Organization
            </Link>
        </div>
      </div>
    </div>
  );
}