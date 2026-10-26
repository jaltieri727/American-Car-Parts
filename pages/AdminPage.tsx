import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Settings, LayoutDashboard, BarChart, TrendingUp, ShieldAlert, Trash2, Edit2, X, Save, Camera, Mail,
  BookOpen, MessageSquare, CheckCircle, Clock, Plus, ExternalLink
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import imageCompression from 'browser-image-compression';

export const AdminPage: React.FC = () => {
  const { navigateTo, settings } = useNavigation();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [adminSessionToken, setAdminSessionToken] = useState(() => sessionStorage.getItem('crankover_admin_session') || '');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const aiKeyStatus = useQuery(api.aiSettings.status, adminAuthenticated ? { adminSessionToken } : 'skip');
  const saveAiKey = useAction(api.aiSettings.save);
  const [aiApiKey, setAiApiKey] = useState('');
  const [savingAiKey, setSavingAiKey] = useState(false);
  const [aiKeyMessage, setAiKeyMessage] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [credentialChange, setCredentialChange] = useState({ currentPassword: '', newUsername: '', newPassword: '' });

  const registeredUsers = useQuery(api.users.listAllUsers, adminAuthenticated ? { adminSessionToken } : 'skip');
  const subscribers = useQuery(api.newsletter.listSubscribers, adminAuthenticated ? { adminSessionToken } : 'skip');
  const catalog = useQuery(api.catalogAdmin.list, adminAuthenticated ? { adminSessionToken } : 'skip');
  const deleteStore = useMutation(api.catalogAdmin.deleteStore);
  const deleteListing = useMutation(api.catalogAdmin.deleteProduct);
  const removeSubscriber = useMutation(api.newsletter.removeSubscriber);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogView, setCatalogView] = useState<'stores' | 'listings'>('stores');
  const blogs = useQuery(api.blogs.list);
  const inquiries = useQuery(api.contact.listInquiries, adminAuthenticated ? { adminSessionToken } : 'skip');

  const loginAdmin = useAction(api.admin.login);
  const validateAdminSession = useAction(api.admin.validateSession);
  const logoutAdmin = useAction(api.admin.logout);
  const changeAdminCredentials = useAction(api.admin.changeCredentials);

  const deleteUser = useMutation(api.users.deleteUser);
  const editUser = useMutation(api.users.editUser);
  const createBlog = useMutation(api.blogs.create);
  const deleteBlog = useMutation(api.blogs.remove);
  const updateInquiryStatus = useMutation(api.contact.updateStatus);
  const deleteInquiry = useMutation(api.contact.removeInquiry);

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings' | 'newsletter' | 'blog' | 'inquiries' | 'catalog'>('stats');
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [newBlog, setNewBlog] = useState({ title: '', excerpt: '', content: '', category: '', image: '', author: 'CrankOver Admin' });

  const [platformConfig, setPlatformConfig] = useState({
    platformName: '',
    proPlanPrice: 0,
    transactionFee: 10,
    logoUrl: null as string | null
  });
  const [loading, setLoading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const updateSettings = useMutation(api.platformSettings.update);
  const generateUploadUrl = useMutation(api.products.generateAdminUploadUrl);

  useEffect(() => {
    if (!adminSessionToken) return;
    validateAdminSession({ sessionToken: adminSessionToken })
      .then((session) => {
        if (!session) {
          sessionStorage.removeItem('crankover_admin_session');
          setAdminSessionToken('');
          setAdminAuthenticated(false);
          return;
        }
        setAdminUsername(session.username);
        setCredentialChange((current) => ({ ...current, newUsername: session.username }));
        setAdminAuthenticated(true);
      })
      .catch(() => {
        sessionStorage.removeItem('crankover_admin_session');
        setAdminSessionToken('');
        setAdminAuthenticated(false);
      });
  }, [adminSessionToken, validateAdminSession]);

  useEffect(() => {
    if (settings) {
      setPlatformConfig({
        platformName: settings.platformName,
        proPlanPrice: settings.proPlanPrice,
        transactionFee: settings.transactionFee,
        logoUrl: settings.logoUrl || null
      });
    }
  }, [settings.platformName, settings.proPlanPrice, settings.transactionFee, settings.logoUrl]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await loginAdmin(credentials);
      sessionStorage.setItem('crankover_admin_session', session.sessionToken);
      setAdminSessionToken(session.sessionToken);
      setAdminUsername(session.username);
      setCredentialChange((current) => ({ ...current, newUsername: session.username }));
      setAdminAuthenticated(true);
      setCredentials({ username: session.username, password: '' });
    } catch (error: any) {
      alert(error.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      if (adminSessionToken) await logoutAdmin({ sessionToken: adminSessionToken });
    } finally {
      sessionStorage.removeItem('crankover_admin_session');
      setAdminSessionToken('');
      setAdminAuthenticated(false);
    }
  };

  const handleCredentialChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changeAdminCredentials({ sessionToken: adminSessionToken, ...credentialChange });
      sessionStorage.removeItem('crankover_admin_session');
      setAdminSessionToken('');
      setAdminAuthenticated(false);
      setCredentials({ username: credentialChange.newUsername, password: '' });
      setCredentialChange({ currentPassword: '', newUsername: '', newPassword: '' });
      alert('Admin credentials updated. Sign in again.');
    } catch (error: any) {
      alert(error.message || 'Credential update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await editUser({
      adminSessionToken,
      id: editingUser._id,
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role
    });
    setEditingUser(null);
    alert("User permissions updated.");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const postUrl = await generateUploadUrl({ adminSessionToken });
      const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": compressedFile.type }, body: compressedFile });
      const { storageId } = await result.json();

      await updateSettings({
        adminSessionToken,
        platformName: platformConfig.platformName,
        logoUrl: storageId
      });
      alert("Platform logo synchronized.");
    } catch (e: any) {
      alert("Logo upload failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await updateSettings({
        adminSessionToken,
        platformName: platformConfig.platformName,
        proPlanPrice: platformConfig.proPlanPrice,
        transactionFee: platformConfig.transactionFee,
      });
      alert("Settings saved. New checkouts use these prices immediately—no Stripe dashboard changes needed.");
    } catch (e: any) {
      alert("Update failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBlog = useMutation(api.blogs.update);  // Add this
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null); // Add this

  // Update handleCreateBlog
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBlogId) {
        await updateBlog({
          adminSessionToken,
          id: editingBlogId as any,
          title: newBlog.title,
          excerpt: newBlog.excerpt,
          content: newBlog.content,
          category: newBlog.category,
          image: newBlog.image
        });
        alert("Blog post updated.");
      } else {
        await createBlog({ adminSessionToken, ...newBlog });
        alert("Blog post published to protocol.");
      }
      setShowBlogModal(false);
      setEditingBlogId(null);
      setNewBlog({ title: '', excerpt: '', content: '', category: '', image: '', author: 'CrankOver Admin' });
    } catch (e: any) {
      alert("Operation failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };



  const handleBlogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const postUrl = await generateUploadUrl({ adminSessionToken });
      const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": compressedFile.type }, body: compressedFile });
      const { storageId } = await result.json();
      const imageUrl = await fetch(`${window.location.origin}/api/storage/${storageId}`).then(r => r.url).catch(() => storageId); // This is a bit hacky for preview
      setNewBlog({ ...newBlog, image: storageId });
    } catch (e: any) {
      alert("Image upload failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!adminAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-3xl shadow-2xl max-w-md w-full">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center text-white"><ShieldAlert size={32} /></div>
          </div>
          <h2 className="text-2xl font-black uppercase text-center mb-6">System Admin Gate</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} placeholder="Admin username" autoComplete="username" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold" required />
            <input type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} placeholder="Admin password" autoComplete="current-password" className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold" required />
            <button disabled={loading} className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase shadow-xl hover:bg-red-700 transition-all disabled:opacity-50">{loading ? 'Authorizing...' : 'Authorize Access'}</button>
          </form>
          <button onClick={() => navigateTo('home')} className="w-full mt-4 text-[10px] font-black uppercase text-gray-400 hover:text-brand-red transition-colors">Return to Marketplace</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-brand-dark text-white p-6 flex flex-col fixed inset-y-0">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center transform -skew-x-12"><span className="text-white font-bold text-lg skew-x-12">{settings.platformName.charAt(0)}</span></div>
          <span className="font-black text-xl tracking-tighter uppercase">{settings.platformName} Admin</span>
        </div>
        <nav className="space-y-1">
          <button onClick={() => setActiveTab('catalog')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'catalog' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><BookOpen size={20} /> Stores & Listings</button>
          <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stats' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><LayoutDashboard size={20} /> Dashboard</button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Users size={20} /> Entities</button>
          <button onClick={() => setActiveTab('newsletter')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'newsletter' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Mail size={20} /> Newsletter</button>
          <button onClick={() => setActiveTab('blog')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'blog' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><BookOpen size={20} /> Blog Feed</button>
          <button onClick={() => setActiveTab('inquiries')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inquiries' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><MessageSquare size={20} /> Inquiries</button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-brand-red text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Settings size={20} /> Settings</button>
        </nav>
        <button onClick={handleAdminLogout} className="mt-auto w-full px-4 py-3 rounded-xl text-xs font-black uppercase text-gray-400 hover:text-white hover:bg-white/5">Sign Out {adminUsername}</button>
      </aside>

      <main className="flex-1 ml-64 p-10">
        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            {activeTab === 'catalog' ? 'Stores & Listings' : activeTab === 'settings' ? 'Platform Parameters' : activeTab === 'users' ? 'Entity Protocol' : activeTab === 'newsletter' ? 'Newsletter Subscribers' : activeTab === 'blog' ? 'Editorial Feed' : activeTab === 'inquiries' ? 'Communication Hub' : 'System Status'}
          </h1>
          {activeTab === 'blog' && (
            <button
              onClick={() => setShowBlogModal(true)}
              className="bg-brand-red text-white px-6 py-2 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
            >
              <Plus size={18} /> New Article
            </button>
          )}
        </header>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Users</p>
              <h4 className="text-2xl font-black">{registeredUsers?.length || 0}</h4>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Live Storefronts</p>
              <h4 className="text-2xl font-black text-brand-red">{registeredUsers?.filter(u => u.isPublished).length || 0}</h4>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Subscribers</p>
              <h4 className="text-2xl font-black">{subscribers?.length || 0}</h4>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Active Blogs</p>
              <h4 className="text-2xl font-black">{blogs?.length || 0}</h4>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Pending Inquiries</p>
              <h4 className="text-2xl font-black text-brand-red">{inquiries?.filter(i => i.status === 'New').length || 0}</h4>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="bg-white p-6 rounded-2xl border space-y-4">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setCatalogView('stores')} className={`px-4 py-2 rounded-lg ${catalogView === 'stores' ? 'bg-brand-dark text-white' : 'bg-gray-100'}`}>Stores ({catalog?.stores.length ?? 0})</button>
              <button onClick={() => setCatalogView('listings')} className={`px-4 py-2 rounded-lg ${catalogView === 'listings' ? 'bg-brand-dark text-white' : 'bg-gray-100'}`}>Listings ({catalog?.products.length ?? 0})</button>
              <input aria-label="Search catalog" placeholder="Search..." value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)} className="border rounded-lg px-3 py-2" />
            </div>
            {catalogView === 'stores' ? catalog?.stores.filter(s => s.name.toLowerCase().includes(catalogSearch.toLowerCase())).map(s => (
              <div key={s.id} className="flex items-center justify-between gap-4 border-b py-4">
                <div><strong>{s.name}</strong> {s.demo && <span className="text-xs text-gray-500">Demo</span>}<p className="text-sm text-gray-500">{s.listingCount} listings</p></div>
                <button disabled={loading} className="text-red-700 text-sm font-bold" onClick={async () => {
                  const name = prompt(`Delete this store and its ${s.listingCount} listings? Order history and the owner's login are kept. Type the store name to confirm:`, '');
                  if (name === null) return;
                  setLoading(true);
                  try { await deleteStore({ adminSessionToken, id: s.id, confirmName: name }); } catch (error: any) { alert(error.message); } finally { setLoading(false); }
                }}>Delete store</button>
              </div>
            )) : catalog?.products.filter(p => `${p.name} ${p.store}`.toLowerCase().includes(catalogSearch.toLowerCase())).map(p => (
              <div key={p.id} className="flex items-center justify-between gap-4 border-b py-4">
                <div><strong>{p.name}</strong><p className="text-sm text-gray-500">{p.store} · ${p.price.toFixed(2)}</p></div>
                <button disabled={loading} className="text-red-700 text-sm font-bold" onClick={async () => {
                  if (!confirm(`Delete listing "${p.name}" and its reviews?`)) return;
                  setLoading(true);
                  try { await deleteListing({ adminSessionToken, id: p.id }); } catch (error: any) { alert(error.message); } finally { setLoading(false); }
                }}>Delete listing</button>
              </div>
            ))}
            {catalog && (catalogView === 'stores' ? catalog.stores.length : catalog.products.length) === 0 && <p className="text-gray-500">No {catalogView} yet.</p>}
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 flex flex-wrap justify-between items-center gap-3">
              <p className="text-sm text-gray-600">Signup collection is active. Email campaigns are not connected yet.</p>
              <button disabled={!subscribers?.length} className="px-4 py-2 bg-brand-dark text-white rounded-lg disabled:opacity-50" onClick={() => {
                const cell = (value: string) => '"' + (/^[=+@\-]/.test(value) ? "'" + value : value).replaceAll('"', '""') + '"';
                const csv = ['Email,Subscribed at', ...(subscribers ?? []).map(s => `${cell(s.email)},${cell(s.subscribedAt)}`)].join('\r\n');
                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
                const link = document.createElement('a'); link.href = url; link.download = 'crankover-newsletter-subscribers.csv'; link.click(); URL.revokeObjectURL(url);
              }}>Export CSV</button>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                <tr><th className="px-6 py-4">Subscriber Email</th><th className="px-6 py-4">Subscribed</th><th className="px-6 py-4">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers?.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold">{s.email}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-tighter">
                      {new Date(s.subscribedAt).toLocaleDateString()} {new Date(s.subscribedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4"><button className="text-red-700" onClick={async () => { if (confirm(`Remove ${s.email} from the newsletter list?`)) { try { await removeSubscriber({ adminSessionToken, id: s._id }); } catch (e: any) { alert(e.message); } } }}>Remove</button></td>
                  </tr>
                ))}
                {subscribers?.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400 font-bold uppercase">No subscribers yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                <tr><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Storefront</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registeredUsers?.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar || 'https://via.placeholder.com/150?text=Avatar'} className="w-8 h-8 rounded-full border border-gray-100" />
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px] text-gray-400 uppercase">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 uppercase text-[10px] font-black">
                      <span className={u.role === 'admin' ? 'text-brand-red' : ''}>{u.role || 'Unassigned'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {u.storeSlug ? <span className="text-brand-dark font-black text-xs">/store/{u.storeSlug}</span> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setEditingUser(u)} className="p-2 text-gray-400 hover:text-brand-dark transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => { if (confirm("Terminate entity connection?")) deleteUser({ adminSessionToken, id: u._id }) }} className="p-2 text-gray-400 hover:text-brand-red transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs?.map(post => (
              <div key={post._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col group">
                <div className="h-40 bg-gray-100 relative">
                  {post.image && <img src={post.image.startsWith('http') ? post.image : `https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800`} className="w-full h-full object-cover" />}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button onClick={() => {
                      setEditingBlogId(post._id);
                      setNewBlog({
                        title: post.title,
                        excerpt: post.excerpt,
                        content: post.content || '',
                        category: post.category,
                        image: post.image,
                        author: post.author
                      });
                      setShowBlogModal(true);
                    }} className="p-2 bg-white/90 text-brand-dark rounded-lg shadow-sm hover:scale-110 transition-transform"><Edit2 size={14} /></button>
                    <button onClick={() => { if (confirm("Delete article?")) deleteBlog({ adminSessionToken, id: post._id }) }} className="p-2 bg-white/90 text-brand-red rounded-lg shadow-sm hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-[8px] font-black uppercase text-brand-red tracking-widest mb-2 block">{post.category}</span>
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{post.title}</h3>
                  <p className="text-xs text-gray-400 mb-6 line-clamp-2">{post.excerpt}</p>
                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{post.date}</span>
                    <span className="text-[10px] font-black text-brand-dark uppercase">By {post.author}</span>
                  </div>
                </div>
              </div>
            ))}
            {blogs?.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-300 font-black uppercase text-xl italic">No Articles Published</div>
            )}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiries?.map(iq => (
              <div key={iq._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black uppercase text-brand-dark">{iq.subject}</h3>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${iq.status === 'New' ? 'bg-red-100 text-brand-red' : iq.status === 'Replied' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{iq.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">"{iq.message}"</p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase text-gray-400">
                    <span className="flex items-center gap-1"><Users size={12} /> {iq.name}</span>
                    <span className="flex items-center gap-1"><Mail size={12} /> {iq.email}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(iq.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  {iq.status === 'New' && (
                      <button onClick={() => updateInquiryStatus({ adminSessionToken, id: iq._id, status: 'Read' })} className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-black uppercase hover:bg-gray-100 transition-all flex items-center justify-center gap-2">Read <CheckCircle size={14} /></button>
                  )}
                  <button onClick={() => updateInquiryStatus({ adminSessionToken, id: iq._id, status: 'Replied' })} className="flex-1 px-4 py-2 bg-brand-red text-white rounded-xl text-xs font-black uppercase hover:bg-red-700 transition-all flex items-center justify-center gap-2">Mark Replied <TrendingUp size={14} /></button>
                  <button onClick={() => { if (confirm("Remove inquiry?")) deleteInquiry({ adminSessionToken, id: iq._id }) }} className="flex-1 px-4 py-2 bg-white border border-gray-100 text-gray-400 rounded-xl text-xs font-black uppercase hover:text-brand-red transition-all flex items-center justify-center gap-2">Delete <Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {inquiries?.length === 0 && (
              <div className="py-20 text-center text-gray-300 font-black uppercase text-xl italic">Inbox Empty</div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
            <div className="space-y-8">
              <div className="flex items-center gap-8 pb-8 border-b border-gray-50">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 relative overflow-hidden group"
                >
                  {platformConfig.logoUrl ? (
                    <img src={platformConfig.logoUrl} className="w-full h-full object-contain p-2" alt="Platform Logo" />
                  ) : (
                    <Camera className="text-gray-300 group-hover:text-brand-red transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div>
                  <h4 className="font-black uppercase text-sm mb-1">Platform Identity</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">System-wide logo used in headers, footers and transaction protocols.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Platform Name</label>
                  <input
                    value={platformConfig.platformName}
                    onChange={e => setPlatformConfig({ ...platformConfig, platformName: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="monthly-price" className="text-xs font-black uppercase text-gray-600 tracking-widest">Monthly seller subscription (USD)</label>
                  <input
                    id="monthly-price" type="number" min="0" max="999999.99" step="0.01"
                    value={platformConfig.proPlanPrice}
                    onChange={e => setPlatformConfig({ ...platformConfig, proPlanPrice: Number(e.target.value) })}
                    className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-brand-red"
                  />
                  <p className="text-sm text-gray-600">$0 = no subscription required. Set a monthly amount to enable subscriptions; sellers must opt in through checkout. Stripe pricing is created automatically.</p>
                  <p className="text-xs text-gray-600">Changes apply to new subscriptions. Existing subscriptions keep their price and continue until canceled, even if this is later set to $0.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="transaction-fee" className="text-xs font-black uppercase text-gray-600 tracking-widest">All-inclusive transaction fee (%)</label>
                  <input id="transaction-fee" type="number" min="0" max="100" step="0.01" value={platformConfig.transactionFee}
                    onChange={e => setPlatformConfig({ ...platformConfig, transactionFee: Number(e.target.value) })}
                    className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-brand-red" />
                  <p className="text-sm text-gray-600">Applied to each new order's total, including shipping. Stripe processing is paid by CrankOver from this fee, never added on top for the seller.</p>
                  <div className="rounded-xl bg-gray-50 border border-gray-300 p-4 text-sm text-gray-800">
                    On a $100 payment: seller receives <strong>${(100 - platformConfig.transactionFee).toFixed(2)}</strong>; CrankOver receives <strong>${platformConfig.transactionFee.toFixed(2)}</strong> before Stripe's processing fees.
                  </div>
                  <p className="text-xs text-gray-600">Save once below. Pricing pages and new Stripe checkouts update automatically. Already-open checkouts retain their original fee.</p>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="w-full bg-brand-dark text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} /> {loading ? 'Saving...' : 'Save Settings'}
              </button>

              <form onSubmit={async e => {
                e.preventDefault(); setSavingAiKey(true); setAiKeyMessage('');
                try { await saveAiKey({ adminSessionToken, apiKey: aiApiKey }); setAiApiKey(''); setAiKeyMessage('API key verified and saved.'); }
                catch (error: any) { setAiKeyMessage(typeof error.data === 'string' ? error.data : 'Unable to save the key. Please try again.'); }
                finally { setSavingAiKey(false); }
              }} className="pt-8 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between gap-3"><h4 className="font-black uppercase text-sm">AI Assistant</h4><span className="text-xs text-gray-600">{aiKeyStatus?.configured ? `Configured · ${aiKeyStatus.source}` : 'Not configured'}</span></div>
                <label htmlFor="ai-api-key" className="block text-sm font-bold">Gemini API key</label>
                <input id="ai-api-key" type="password" autoComplete="new-password" spellCheck={false} value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} placeholder="Paste a new API key" required className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200" />
                <p className="text-xs text-gray-600">Stored encrypted; the saved key is never displayed.</p>
                <button disabled={savingAiKey || !aiApiKey.trim()} className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold disabled:opacity-50">{savingAiKey ? 'Verifying…' : 'Verify & Save API Key'}</button>
                {aiKeyMessage && <p role="status" className="text-sm text-gray-700">{aiKeyMessage}</p>}
              </form>

              <form onSubmit={handleCredentialChange} className="pt-8 border-t border-gray-100 space-y-4">
                <div>
                  <h4 className="font-black uppercase text-sm mb-1">Admin Credentials</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Changing these values signs out all active admin sessions.</p>
                </div>
                <input type="password" value={credentialChange.currentPassword} onChange={(e) => setCredentialChange({ ...credentialChange, currentPassword: e.target.value })} placeholder="Current password" autoComplete="current-password" className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-brand-red" required />
                <input value={credentialChange.newUsername} onChange={(e) => setCredentialChange({ ...credentialChange, newUsername: e.target.value })} placeholder="New username" autoComplete="username" minLength={3} className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-brand-red" required />
                <input type="password" value={credentialChange.newPassword} onChange={(e) => setCredentialChange({ ...credentialChange, newPassword: e.target.value })} placeholder="New password (8+ characters)" autoComplete="new-password" minLength={8} className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold focus:ring-2 focus:ring-brand-red" required />
                <button disabled={loading} className="w-full border-2 border-brand-dark text-brand-dark py-4 rounded-2xl font-black uppercase hover:bg-brand-dark hover:text-white transition-all disabled:opacity-50">Update Admin Login</button>
              </form>
            </div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase">Edit Entity Parameters</h3>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-brand-dark"><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Full Name</label>
                  <input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-red text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Email Protocol</label>
                  <input value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-red text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">System Role</label>
                  <select value={editingUser.role || ""} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-red text-sm font-bold uppercase tracking-widest">
                    <option value="">Unassigned</option>
                    <option value="consumer">Consumer</option>
                    <option value="provider">Provider</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase shadow-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all">
                  <Save size={18} /> Synchronize Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        <AnimatePresence>
          {showBlogModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tight">{editingBlogId ? 'Edit Article Protocol' : 'Compose Article Protocol'}</h2>
                  <button onClick={() => { setShowBlogModal(false); setEditingBlogId(null); setNewBlog({ title: '', excerpt: '', content: '', category: '', image: '', author: 'CrankOver Admin' }); }} className="text-gray-400 hover:text-brand-dark transition-colors"><X size={24} /></button>
                </div>

                <form onSubmit={handleCreateBlog} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Article Title</label>
                      <input value={newBlog.title} onChange={e => setNewBlog({ ...newBlog, title: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none font-bold focus:ring-2 focus:ring-brand-red" placeholder="e.g. Future of Restoration" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Category</label>
                      <input value={newBlog.category} onChange={e => setNewBlog({ ...newBlog, category: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none font-bold focus:ring-2 focus:ring-brand-red" placeholder="e.g. Industry News" required />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Summary Excerpt</label>
                    <input value={newBlog.excerpt} onChange={e => setNewBlog({ ...newBlog, excerpt: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none font-bold focus:ring-2 focus:ring-brand-red" placeholder="Brief summary for feed card..." required />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Full Technical Content</label>
                    <textarea value={newBlog.content} onChange={e => setNewBlog({ ...newBlog, content: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl border-none outline-none font-bold focus:ring-2 focus:ring-brand-red min-h-[200px]" placeholder="Article body..." required />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                        {newBlog.image ? <img src={newBlog.image.startsWith('http') ? newBlog.image : `https://via.placeholder.com/150`} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase">Article Visuals</p>
                        <p className="text-[8px] text-gray-400 uppercase">Input URL or Upload File</p>
                      </div>
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input type="text" value={newBlog.image} onChange={e => setNewBlog({ ...newBlog, image: e.target.value })} className="flex-1 bg-white p-2 rounded-lg text-[10px] border border-gray-100" placeholder="Unsplash URL..." />
                      <label className="bg-brand-dark text-white text-[10px] font-bold px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors flex items-center shrink-0">
                        UPLOAD
                        <input type="file" className="hidden" accept="image/*" onChange={handleBlogImageUpload} />
                      </label>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-brand-red text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-red-700 transition-all">
                    {loading ? 'Processing...' : (editingBlogId ? 'Update Article' : 'Publish to Feed')}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
