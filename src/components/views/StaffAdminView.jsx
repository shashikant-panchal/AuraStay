import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Users, UserPlus, ShieldCheck } from 'lucide-react';

export default function StaffAdminView() {
  const { staffUsers, showNotification } = useDashboard();

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Staff & User Administration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage user logins, department roles, and property admin credentials.
          </p>
        </div>

        <button
          onClick={() => showNotification('Add User modal opened.')}
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Staff User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Staff Name</th>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-4 font-bold">Department</th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Contact</th>
                <th className="py-3 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                    No staff users added yet. Click "Add New Staff User" to register team members and staff credentials.
                  </td>
                </tr>
              ) : (
                staffUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">{u.role}</td>
                    <td className="py-3 px-4 text-slate-600">{u.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{u.phone}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

