import { useEffect, useState } from 'react';
import type { User, UserCreateRequest, UserUpdateRequest } from '../types/user';
import { getUsers, createUser, updateUser, deleteUser } from '../api/user';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Edit form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim()) return;
    try {
      const data: UserCreateRequest = { username: newUsername.trim(), email: newEmail.trim() };
      await createUser(data);
      setNewUsername('');
      setNewEmail('');
      fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEditStart = (user: User) => {
    setEditingId(user.id);
    setEditUsername(user.username);
    setEditEmail(user.email);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    try {
      const data: UserUpdateRequest = {};
      if (editUsername.trim()) data.username = editUsername.trim();
      if (editEmail.trim()) data.email = editEmail.trim();
      await updateUser(editingId, data);
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1>User Management</h1>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #f88', padding: 12, marginBottom: 16, borderRadius: 4 }}>
          {error}
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleCreate} style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Username</label>
          <input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Username"
            style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Email</label>
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email"
            type="email"
            style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>
        <button type="submit" style={{ padding: '6px 16px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Create
        </button>
      </form>

      {/* User Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>ID</th>
              <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Username</th>
              <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Email</th>
              <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Created At</th>
              <th style={{ padding: 10, borderBottom: '2px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{user.id}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                  {editingId === user.id ? (
                    <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }} />
                  ) : (
                    user.username
                  )}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                  {editingId === user.id ? (
                    <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: 4 }} />
                  ) : (
                    user.email
                  )}
                </td>
                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{user.createdAt}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                  {editingId === user.id ? (
                    <>
                      <button onClick={handleEditSave} style={{ padding: '4px 10px', marginRight: 4, background: '#2196F3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                      <button onClick={handleEditCancel} style={{ padding: '4px 10px', background: '#999', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditStart(user)} style={{ padding: '4px 10px', marginRight: 4, background: '#FF9800', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(user.id)} style={{ padding: '4px 10px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#999' }}>No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
