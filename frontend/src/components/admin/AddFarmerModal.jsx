import { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Copy, Check, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';

export default function AddFarmerModal({ isOpen, onClose, onRefresh }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null); // { tempPassword }
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await api.admin.createFarmer(formData);
      if (result.success) {
        setSuccessData(result);
        onRefresh(); // Refresh the list in the background
      }
    } catch (err) {
      setError(err.message || 'Failed to create farmer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (successData?.data?.tempPassword) {
      navigator.clipboard.writeText(successData.data.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setFormData({ name: '', email: '', phone: '', location: '' });
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-earth-main/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-earth-card border border-earth-dark/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-earth-card-alt/50 px-8 py-6 border-b border-earth-dark/10 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-earth-brown uppercase tracking-tight">
              {successData ? "Farmer Created" : "Add New Farmer"}
            </h3>
            <p className="text-[10px] font-bold text-earth-mut uppercase tracking-[0.2em] mt-1">
              {successData ? "Credential Transmission Ready" : "System Registry Enrollment"}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-earth-card-alt rounded-full transition-colors text-earth-sub">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!successData ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-earth-mut uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-mut" size={16} />
                    <Input 
                      required
                      placeholder="Enter name" 
                      className="pl-12 bg-earth-main border-earth-dark/10 focus:border-earth-primary"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-earth-mut uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-mut" size={16} />
                    <Input 
                      required
                      type="email"
                      placeholder="name@example.com" 
                      className="pl-12 bg-earth-main border-earth-dark/10 focus:border-earth-primary"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-earth-mut uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-mut" size={16} />
                    <Input 
                      required
                      placeholder="080XXXXXXXX" 
                      className="pl-12 bg-earth-main border-earth-dark/10 focus:border-earth-primary"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-earth-mut uppercase tracking-widest ml-1">Primary Village</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-mut" size={16} />
                    <Input 
                      required
                      placeholder="e.g. Village A" 
                      className="pl-12 bg-earth-main border-earth-dark/10 focus:border-earth-primary"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl bg-earth-primary hover:bg-earth-primary-hover text-earth-brown font-black uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin mr-2" size={18} /> Registering...</>
                  ) : (
                    "Authorize & Enroll Farmer"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 bg-earth-primary/10 rounded-3xl flex items-center justify-center text-earth-green mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <ShieldCheck size={40} />
              </div>
              
              <h4 className="text-earth-brown font-black text-xl mb-2 uppercase italic tracking-tight">Account Synchronized</h4>
              <p className="text-earth-mut text-xs font-bold leading-relaxed mb-8 uppercase tracking-wide px-4">
                The farmer has been enrolled. Please share this temporary password securely. It will not be shown again.
              </p>

              <div className="bg-earth-main border border-earth-dark/10 rounded-3xl p-6 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                   <div className="text-[8px] font-black text-earth-mut tracking-[0.3em] uppercase">Private Key</div>
                </div>
                
                <div className="flex flex-col items-center">
                   <div className="text-3xl font-black text-earth-primary tracking-[0.2em] mb-4 font-mono select-all">
                      {successData.data.tempPassword}
                   </div>
                   
                   <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    className="gap-2 bg-earth-card border-earth-dark/10 text-earth-sub hover:text-earth-brown"
                   >
                     {copied ? <Check size={14} className="text-earth-green" /> : <Copy size={14} />}
                     {copied ? "Copied" : "Copy Password"}
                   </Button>
                </div>
              </div>

              <div className="mt-10">
                <Button 
                  onClick={handleClose}
                  className="w-full h-12 rounded-2xl bg-earth-card-alt hover:bg-earth-card text-earth-brown font-black uppercase tracking-widest text-xs border border-earth-dark/15"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
