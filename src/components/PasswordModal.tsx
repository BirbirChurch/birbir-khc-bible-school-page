import React, { useState } from 'react';
import { Key, X } from 'lucide-react';

interface PasswordModalProps {
  targetKey: string;
  targetDisplayName: string;
  onClose: () => void;
  onSave: (key: string, newPass: string) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  targetKey,
  targetDisplayName,
  onClose,
  onSave
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 3) {
      setError('የይለፍ ቃል ቢያንስ 3 ፊደላት/ቁጥሮች መሆን አለበት!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('የይለፍ ቃላቱ አይመሳሰሉም!');
      return;
    }

    onSave(targetKey, newPassword);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        <div className="bg-emerald-950 text-white p-4.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">{targetDisplayName} የይለፍ ቃል መቀየሪያ</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">አዲስ የይለፍ ቃል (New Password)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              minLength={3}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 border-slate-300 focus:ring-2 focus:ring-emerald-700 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">አዲስ የይለፍ ቃል ያረጋግጡ (Confirm)</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              minLength={3}
              className="w-full px-3.5 py-2.5 border rounded-xl bg-slate-50 border-slate-300 focus:ring-2 focus:ring-emerald-700 font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
            >
              ሰርዝ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              አስቀምጥ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
