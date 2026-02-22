import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerTenant } from '../../redux/authSlice';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterOrg() {
  const [formData, setFormData] = useState({
    business_name: '', business_code: '', 
    admin_name: '', admin_email: '', admin_password: ''
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerTenant(formData));
    if (registerTenant.fulfilled.match(result)) {
      alert("Organization Registered! Please Login.");
      navigate('/login');
    }
  };

  // ... (Render similar inputs to Login, but with fields for Org Name and Admin Name) ...
  // Keeping it brief for this response, simply add the extra inputs.
  return (
      <div className="min-h-screen bg-stone-brown-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-xl p-8 w-full max-w-lg">
              <h1 className="text-2xl font-black text-stone-brown-900 mb-6 text-center">Register Organization</h1>
              {error && <div className="bg-red-50 text-red-600 p-3 mb-4 rounded-lg">{error}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                  <input placeholder="Organization Name" className="input-std" onChange={(e)=>setFormData({...formData, business_name: e.target.value})} required />
                  <input placeholder="Preferred Business Code (e.g. MUM-POL)" className="input-std" onChange={(e)=>setFormData({...formData, business_code: e.target.value})} required />
                  <div className="border-t border-gray-100 my-2"></div>
                  <input placeholder="Admin Name" className="input-std" onChange={(e)=>setFormData({...formData, admin_name: e.target.value})} required />
                  <input placeholder="Admin Email" type="email" className="input-std" onChange={(e)=>setFormData({...formData, admin_email: e.target.value})} required />
                  <input placeholder="Password" type="password" className="input-std" onChange={(e)=>setFormData({...formData, admin_password: e.target.value})} required />
                  
                  <button disabled={loading} className="btn-primary w-full py-3 rounded-xl bg-stone-brown-900 text-white font-bold mt-4">
                      {loading ? 'Creating Tenant...' : 'Initialize System'}
                  </button>
              </form>
          </div>
      </div>
  )
}