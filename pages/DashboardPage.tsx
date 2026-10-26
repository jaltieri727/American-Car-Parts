import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Settings, CreditCard,
  ExternalLink, Plus, ArrowUpRight, Globe, Lock, ShieldCheck, X, Camera, Edit2, Trash2, LogOut, Save, Truck, CheckCircle, Sparkles
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { Product, User, Order } from '../types';
import { useMutation, useAction, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import imageCompression from 'browser-image-compression';
import { PRODUCT_CATEGORIES } from '../data/productCategories';

const StatCard: React.FC<{ label: string, value: string, change: string }> = ({ label, value, change }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{label}</p>
    <div className="flex justify-between items-end">
      <h4 className="text-2xl font-black">{value}</h4>
      <span className={`text-xs font-bold ${change.startsWith('+') ? 'text-green-500' : 'text-brand-red'} flex items-center gap-1`}>
        {change} <ArrowUpRight size={12} />
      </span>
    </div>
  </div>
);

const NavItem: React.FC<{ icon: any, label: string, active?: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-brand-red text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
    <Icon size={20} /><span className="text-sm font-bold uppercase tracking-wider">{label}</span>
  </button>
);

interface DashboardOverviewProps {
  user: any;
  products: Product[];
  orders: Order[];
  navigateTo: any;
  onConnectStripe: () => void;
  onTogglePublish: () => void;
  loading: boolean;
}

const DashboardOverview = ({ user, products, orders, navigateTo, onConnectStripe, onTogglePublish, loading }: DashboardOverviewProps) => {
  const { settings } = useNavigation();
  const providerOrders = orders.filter(o => o.providerId === user?.clerkId);
  const providerListings = products.filter(p => p.providerId === user?.clerkId);
  const canPublish = user.stripeConnected && providerListings.length > 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Earnings after platform fees" value={`$${providerOrders.reduce((a, b) => a + (b.sellerAmount ?? b.amount), 0).toFixed(2)}`} change="+0%" />
        <StatCard label="Active Listings" value={providerListings.length.toString()} change="+0" />
        <StatCard label="Pending Payouts" value="$0.00" change="+0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-black uppercase mb-6 flex items-center gap-2"><Globe size={18} /> Storefront Status</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Public Visibility</p>
                <p className={`text-sm font-black uppercase ${user.isPublished ? 'text-green-500' : 'text-brand-red'}`}>
                  {user.isPublished ? 'Live & Operational' : 'Offline / Private'}
                </p>
              </div>
              <button
                disabled={!canPublish}
                onClick={onTogglePublish}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${!canPublish ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                  user.isPublished ? 'bg-brand-dark text-white hover:bg-gray-800' : 'bg-brand-red text-white hover:bg-red-700 shadow-lg shadow-red-900/20'
                  }`}
              >
                {!user.stripeConnected ? 'Stripe Required' : providerListings.length === 0 ? 'Add Parts to Live' : user.isPublished ? 'Take Offline' : 'Publish Now'}
              </button>
            </div>
            {user.isPublished && user.storeSlug && (
              <div className="mt-4 p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between">
                <code className="text-xs font-mono text-brand-red">{window.location.origin}/store/{user.storeSlug}</code>
                <button onClick={() => navigateTo('store', { slug: user.storeSlug })} className="text-[10px] font-black uppercase text-brand-dark hover:underline flex items-center gap-1">
                  View <ExternalLink size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 h-full">
          <div className={`p-6 rounded-2xl text-white shadow-xl h-full flex flex-col justify-between ${user.stripeConnected ? 'bg-green-600' : 'bg-brand-red'}`}>
            <div>
              <h3 className="font-black uppercase mb-2 flex items-center gap-2">
                <ShieldCheck size={20} /> {user.stripeConnected ? 'Stripe Linked' : 'Payouts Offline'}
              </h3>
              <p className="text-white/80 text-xs mb-6">
                {user.stripeConnected
                  ? `You receive ${100 - settings.transactionFee}% of each order. The ${settings.transactionFee}% fee includes Stripe processing. Payout timing follows your Stripe account schedule.`
                  : 'Link your Stripe account to receive seller payouts and enable your storefront.'}
              </p>
            </div>
            {!user.stripeConnected ? (
              <button
                onClick={onConnectStripe}
                className="block w-full text-center bg-white text-brand-red py-3 rounded-xl font-bold uppercase text-xs hover:bg-gray-50 transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Syncing Protocol...' : 'Connect Stripe Protocol'}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-white/50">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div> Status: Synchronized
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user, products, navigateTo, orders, logout, settings, updateProvider } = useNavigation();
  const isConsumer = user?.role === 'consumer';
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'orders' | 'settings'>(isConsumer ? 'orders' : 'overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Gallery state for image management
  const [gallery, setGallery] = useState<Array<{ url: string, storageId?: string, file?: File }>>([]);

  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.products.generateUploadUrl);
  const addProductMutation = useMutation(api.products.addProduct);
  const updateProductMutation = useMutation(api.products.updateProduct);
  const deleteProductMutation = useMutation(api.products.deleteProduct);
  const generateDescription = useAction(api.products.generateDescription);
  const updateOrderStatusAction = useAction(api.orders.updateStatusAndNotify);
  const createConnectAccount = useAction(api.stripe.createConnectAccount);
  const createStripeLoginLink = useAction(api.stripe.createStripeLoginLink);

  const verifyOnboarding = useAction(api.stripe.verifyStripeOnboarding);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('stripe_connect_success') === 'true' && user && !user.stripeConnected) {
      setLoading(true);
      verifyOnboarding()
        .then(res => {
          if (res.success) {
            console.log("Stripe Connection Secured.");
          } else {
            console.warn("Stripe Verification Protocol:", res.message);
            // Alerting here to help the user diagnose the specific Stripe issue
            alert(`Stripe Verification: ${res.message}`);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [location.search, user?.stripeConnected, verifyOnboarding, user]);

  const [newPart, setNewPart] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    condition: '',
    inStock: true,
    partNumber: '',
    castingNumber: '',
    vinCompatibility: ''
  });

  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    storeSlug: '',
    logoUrl: null as string | null,
    bio: '',
    coverImageUrl: '',
    specialties: [] as Array<{ name: string; years: string; imageUrl: string; photoPageUrl?: string }>,
    showcaseItems: [] as Array<{ title: string; vehicle: string; years: string; category: string; description: string; priceNote?: string; conditionNote?: string; imageUrl: string; photoPageUrl?: string }>,
    location: '',
    joinedAt: '',
    address: '',
    phone: '',
    ownerName: '',
    contactEmail: ''
  });

  useEffect(() => {
    if (user) {
      setStoreSettings({
        storeName: user.storeName || '',
        storeSlug: user.storeSlug || '',
        logoUrl: user.logoUrl || null,
        bio: user.bio || '',
        coverImageUrl: user.coverImageUrl || '',
        specialties: user.specialties || [],
        showcaseItems: user.showcaseItems || [],
        location: user.location || 'USA',
        joinedAt: user.joinedAt || new Date().getFullYear().toString(),
        address: user.address || '',
        phone: user.phone || '',
        ownerName: user.ownerName || user.name || '',
        contactEmail: user.contactEmail || user.email || ''
      });
    }
  }, [user]);

  if (!user) { navigateTo('auth'); return null; }

  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      const { url } = await createConnectAccount({ frontendUrl: window.location.origin });
      window.location.href = url;
    } catch (e: any) {
      alert("Failed to initiate Stripe connection: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayouts = async () => {
    if (!user.stripeConnected) {
      setActiveTab('overview');
      alert("Please initialize the Stripe Protocol connection via the dashboard overview first to enable payouts.");
      return;
    }
    try {
      setLoading(true);
      const { url } = await createStripeLoginLink();
      window.open(url, '_blank');
    } catch (e: any) {
      alert("Failed to create Stripe dashboard link: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIDescription = async () => {
    if (!newPart.name || !newPart.category) {
      alert("Please provide a part name and category for better AI generation.");
      return;
    }

    setIsAiGenerating(true);
    try {
      const prompt = `Write a highly technical and professional description for a classic car part.
      Part Name: ${newPart.name}
      Category: ${newPart.category}
      Include restoration notes and compatibility emphasis. Keep it under 100 words.`;

      const response = await generateDescription({ contents: prompt });

      if (response && response.text) {
        setNewPart(prev => ({ ...prev, description: response.text.trim() }));
      }
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("AI Protocol error. Please check your system logs.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isLogo = false) => {
    const files = e.target.files;
    if (!files) return;

    if (isLogo) {
      try {
        setLoading(true);
        const file = files[0];
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1000, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, { method: "POST", headers: { "Content-Type": compressedFile.type }, body: compressedFile });
        const { storageId } = await result.json();
        await updateProvider({ logoUrl: storageId });
        alert("Store Logo Identity Updated Successfully");
      } catch (error) {
        console.error("Logo upload failed", error);
        alert("Failed to upload store logo identity.");
      } finally {
        setLoading(false);
      }
    } else {
      const newFiles = Array.from(files) as File[];
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1000, useWebWorker: true };

      for (const file of newFiles) {
        try {
          const compressed = await imageCompression(file, options) as File;
          setGallery(prev => [...prev, {
            url: URL.createObjectURL(compressed),
            file: compressed
          }]);
        } catch (error) {
          console.error("Compression failed", error);
        }
      }
    }
  };

  const removeGalleryItem = (index: number) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublishListing = async () => {
    if (!newPart.name.trim() || !newPart.category.trim() || !newPart.description.trim() || !newPart.condition || !newPart.vinCompatibility.trim() || gallery.length === 0 || !(parseFloat(newPart.price) > 0)) {
      alert("Add an actual part photo, name, category, price, condition, description, and confirmed vehicle compatibility before publishing.");
      return;
    }
    setLoading(true);

    try {
      const finalStorageIds: string[] = [];

      for (const item of gallery) {
        if (item.storageId) {
          finalStorageIds.push(item.storageId);
        } else if (item.file) {
          const postUrl = await generateUploadUrl();
          const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": item.file.type },
            body: item.file,
          });
          const { storageId } = await result.json();
          finalStorageIds.push(storageId);
        }
      }

      if (editingProduct) {
        await updateProductMutation({
          id: (editingProduct as any)._id || editingProduct.id,
          name: newPart.name,
          category: newPart.category,
          description: newPart.description,
          price: parseFloat(newPart.price),
          condition: newPart.condition,
          inStock: newPart.inStock,
          images: finalStorageIds,
          partNumber: newPart.partNumber,
          castingNumber: newPart.castingNumber,
          vinCompatibility: newPart.vinCompatibility
        });
      } else {
        await addProductMutation({
          name: newPart.name,
          category: newPart.category || 'Uncategorized',
          description: newPart.description,
          price: parseFloat(newPart.price),
          condition: newPart.condition,
          inStock: newPart.inStock,
          images: finalStorageIds,
          providerName: user.storeName || user.name,
          providerSlug: user.storeSlug || 'garage',
          partNumber: newPart.partNumber,
          castingNumber: newPart.castingNumber,
          vinCompatibility: newPart.vinCompatibility
        });
      }

      setShowAddModal(false);
      setEditingProduct(null);
      setNewPart({ name: '', category: '', description: '', price: '', condition: '', inStock: true, partNumber: '', castingNumber: '', vinCompatibility: '' });
      setGallery([]);
    } catch (e) {
      alert("Action failed. Ensure all fields are valid.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateProvider({
        storeName: storeSettings.storeName,
        bio: storeSettings.bio,
        coverImageUrl: storeSettings.coverImageUrl,
        specialties: storeSettings.specialties,
        showcaseItems: storeSettings.showcaseItems,
        storeSlug: storeSettings.storeSlug,
        location: storeSettings.location,
        joinedAt: storeSettings.joinedAt,
        address: storeSettings.address,
        phone: storeSettings.phone,
        ownerName: storeSettings.ownerName,
        contactEmail: storeSettings.contactEmail
      });
      alert("Storefront parameters updated.");
    } catch (e: any) {
      alert(e.message || "Failed to update settings.");
    }
  };

  const handleUpdateStatus = async (order: any, status: string) => {
    try {
      setLoading(true);
      await updateOrderStatusAction({ orderId: order._id || order.id, status });
      alert(`Order status updated to ${status}. Notification protocol synchronized.`);
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9F7]">
      <aside className="w-64 bg-brand-dark text-white p-6 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="flex items-center gap-2 mb-12 cursor-pointer" onClick={() => navigateTo('home')}>
          <div className="w-8 h-8 bg-brand-red rounded flex items-center justify-center transform -skew-x-12">
            <span className="text-white font-bold text-lg skew-x-12">{settings.platformName.charAt(0)}</span>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase">{settings.platformName}</span>
        </div>
        <nav className="flex-1 space-y-1">
          {!isConsumer && <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />}
          {!isConsumer && <NavItem icon={Package} label="My Listings" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />}
          <NavItem icon={ShoppingCart} label={isConsumer ? "My Orders" : "Sales"} active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          {!isConsumer && <NavItem icon={CreditCard} label="Payouts" onClick={handleOpenPayouts} />}
          {!isConsumer && <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />}
          {!isConsumer && <NavItem icon={CreditCard} label="Subscription" active={false} onClick={() => navigateTo('subscription')} />}
        </nav>
        <div className="mt-auto pt-6 border-t border-gray-800">
          <button onClick={logout} className="w-full flex items-center gap-2 text-xs font-bold uppercase text-gray-500 hover:text-brand-red transition-colors mb-4">
            <LogOut size={16} /> Logout
          </button>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <img src={user.avatar || 'https://via.placeholder.com/150?text=Avatar'} className="w-10 h-10 rounded-lg object-cover" alt="User Avatar" />
            <div className="overflow-hidden"><p className="text-xs font-bold truncate w-24">{isConsumer ? user.name : (user.storeName || user.name)}</p><p className="text-[10px] text-gray-400 uppercase">{user.role}</p></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-8">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tight">{activeTab === 'orders' && isConsumer ? 'My Orders' : activeTab}</h1>
          {activeTab === 'listings' && !isConsumer && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setNewPart({ name: '', category: '', description: '', price: '', condition: '', inStock: true, partNumber: '', castingNumber: '', vinCompatibility: '' });
                setGallery([]);
                setShowAddModal(true);
              }}
              className="bg-brand-red text-white px-6 py-2 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
            >
              <Plus size={18} /> New Listing
            </button>
          )}
        </header>

        {activeTab === 'overview' && !isConsumer && <DashboardOverview user={user} products={products} orders={orders} navigateTo={navigateTo} onConnectStripe={handleConnectStripe} onTogglePublish={() => updateProvider({ isPublished: !user.isPublished })} loading={loading} />}

        {activeTab === 'settings' && !isConsumer && (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-xl shadow-sm">
            <h3 className="font-black uppercase mb-8">Storefront Customization</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-gray-50">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 relative overflow-hidden"
                >
                  {user.logoUrl ? <img src={user.logoUrl} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, true)} />
                <div>
                  <p className="font-bold uppercase text-xs mb-1">Store Logo</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Recommended size: 500x500px</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Public Store Name</label>
                <input value={storeSettings.storeName} onChange={e => setStoreSettings({ ...storeSettings, storeName: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Store Specialty</label>
                <textarea value={storeSettings.bio} onChange={e => setStoreSettings({ ...storeSettings, bio: e.target.value })} maxLength={500} rows={3} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none resize-none" placeholder="Describe the vehicles and parts your shop focuses on." />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Cover Photo URL</label>
                <input type="url" value={storeSettings.coverImageUrl} onChange={e => setStoreSettings({ ...storeSettings, coverImageUrl: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" placeholder="https://images.unsplash.com/photo-..." />
                <p className="text-[10px] text-gray-400 mt-1">Use a direct Unsplash photo URL. Vehicle images are for presentation; listing photos must show the actual part.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Location (City, Country)</label>
                  <input value={storeSettings.location} onChange={e => setStoreSettings({ ...storeSettings, location: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Joined Year</label>
                  <input value={storeSettings.joinedAt} onChange={e => setStoreSettings({ ...storeSettings, joinedAt: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <p className="text-xs font-black uppercase">Public Storefront Contact</p>
                <p className="text-xs text-gray-500">These details will appear on your public storefront.</p>
                <div>
                  <label htmlFor="store-owner" className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Owner Name</label>
                  <input id="store-owner" value={storeSettings.ownerName} onChange={e => setStoreSettings({ ...storeSettings, ownerName: e.target.value })} maxLength={100} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
                </div>
                <div>
                  <label htmlFor="store-address" className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Storefront Address</label>
                  <input id="store-address" value={storeSettings.address} onChange={e => setStoreSettings({ ...storeSettings, address: e.target.value })} maxLength={200} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="store-phone" className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Phone Number</label>
                    <input id="store-phone" type="tel" value={storeSettings.phone} onChange={e => setStoreSettings({ ...storeSettings, phone: e.target.value })} maxLength={30} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
                  </div>
                  <div>
                    <label htmlFor="store-email" className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Contact Email</label>
                    <input id="store-email" type="email" value={storeSettings.contactEmail} onChange={e => setStoreSettings({ ...storeSettings, contactEmail: e.target.value })} maxLength={254} className="w-full bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-black uppercase">Vehicle Specialties</p>
                  {storeSettings.specialties.length < 6 && <button type="button" onClick={() => setStoreSettings({ ...storeSettings, specialties: [...storeSettings.specialties, { name: '', years: '', imageUrl: '' }] })} className="text-xs font-bold text-brand-red hover:underline">Add Vehicle</button>}
                </div>
                {storeSettings.specialties.map((item, index) => (
                  <div key={index} className="rounded-xl border border-gray-100 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase text-gray-400">Specialty {index + 1}</span>
                      <button type="button" onClick={() => setStoreSettings({ ...storeSettings, specialties: storeSettings.specialties.filter((_, i) => i !== index) })} className="text-xs text-gray-500 hover:text-brand-red">Remove</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input aria-label={`Specialty ${index + 1} model`} value={item.name} onChange={e => setStoreSettings({ ...storeSettings, specialties: storeSettings.specialties.map((entry, i) => i === index ? { ...entry, name: e.target.value } : entry) })} maxLength={80} placeholder="Ford Mustang" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                      <input aria-label={`Specialty ${index + 1} years`} value={item.years} onChange={e => setStoreSettings({ ...storeSettings, specialties: storeSettings.specialties.map((entry, i) => i === index ? { ...entry, years: e.target.value } : entry) })} maxLength={40} placeholder="1965–1973" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                    </div>
                    <input aria-label={`Specialty ${index + 1} photo URL`} type="url" value={item.imageUrl} onChange={e => setStoreSettings({ ...storeSettings, specialties: storeSettings.specialties.map((entry, i) => i === index ? { ...entry, imageUrl: e.target.value } : entry) })} placeholder="Direct Unsplash photo URL" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                    {item.imageUrl && <img src={item.imageUrl} alt={`${item.name} preview`} className="w-full h-32 object-cover rounded-lg" />}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase">Parts Customers Can Ask About</p>
                    <p className="text-xs text-gray-500 mt-1">These inquiry cards are not checkout listings. Add actual stock with its confirmed price, condition, fitment, and part photos in My Listings.</p>
                  </div>
                  {storeSettings.showcaseItems.length < 8 && <button type="button" onClick={() => setStoreSettings({ ...storeSettings, showcaseItems: [...storeSettings.showcaseItems, { title: '', vehicle: '', years: '', category: '', description: '', imageUrl: '' }] })} className="text-xs font-bold text-brand-red hover:underline shrink-0">Add Part</button>}
                </div>
                {storeSettings.showcaseItems.map((item, index) => (
                  <div key={index} className="rounded-xl border border-gray-100 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase text-gray-400">Part {index + 1}</span>
                      <button type="button" onClick={() => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.filter((_, i) => i !== index) })} className="text-xs text-gray-500 hover:text-brand-red">Remove</button>
                    </div>
                    <input aria-label={`Part ${index + 1} title`} value={item.title} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, title: e.target.value } : entry) })} maxLength={100} placeholder="V8 engine bay parts" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input aria-label={`Part ${index + 1} vehicle`} value={item.vehicle} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, vehicle: e.target.value } : entry) })} maxLength={100} placeholder="Ford Mustang" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                      <input aria-label={`Part ${index + 1} years`} value={item.years} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, years: e.target.value } : entry) })} maxLength={40} placeholder="1965–1973" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                      <input aria-label={`Part ${index + 1} category`} value={item.category} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, category: e.target.value } : entry) })} maxLength={80} placeholder="Engine & Engine Parts" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                    </div>
                    <textarea aria-label={`Part ${index + 1} description`} value={item.description} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, description: e.target.value } : entry) })} maxLength={240} rows={2} placeholder="What buyers can ask Joseph about" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red resize-none" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input aria-label={`Part ${index + 1} price note`} value={item.priceNote || ''} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, priceNote: e.target.value } : entry) })} maxLength={60} placeholder="Price: Ask seller" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                      <input aria-label={`Part ${index + 1} condition note`} value={item.conditionNote || ''} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, conditionNote: e.target.value } : entry) })} maxLength={80} placeholder="Condition: Confirm with seller" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                    </div>
                    <input aria-label={`Part ${index + 1} photo URL`} type="url" value={item.imageUrl} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, imageUrl: e.target.value } : entry) })} placeholder="Direct Unsplash photo URL" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                    <input aria-label={`Part ${index + 1} photo source`} type="url" value={item.photoPageUrl || ''} onChange={e => setStoreSettings({ ...storeSettings, showcaseItems: storeSettings.showcaseItems.map((entry, i) => i === index ? { ...entry, photoPageUrl: e.target.value } : entry) })} placeholder="Unsplash photo page (optional)" className="w-full bg-gray-50 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red" />
                    {item.imageUrl && <img src={item.imageUrl} alt={`${item.title} preview`} className="w-full h-32 object-cover rounded-lg" />}
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Custom URL Slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-bold">crankover.com/store/</span>
                  <input value={storeSettings.storeSlug} onChange={e => setStoreSettings({ ...storeSettings, storeSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="flex-1 bg-gray-50 p-4 rounded-xl text-sm focus:ring-2 focus:ring-brand-red outline-none border-none" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={handleSaveSettings} className="flex-1 bg-brand-dark text-white px-8 py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                  <Save size={18} /> Save Parameters
                </button>
                {user.storeSlug && (
                  <button
                    onClick={() => navigateTo('store', { slug: user.storeSlug })}
                    className="flex-1 bg-white border-2 border-brand-dark text-brand-dark px-8 py-4 rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                  >
                    <ExternalLink size={18} /> Preview Shop
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                <tr><th className="px-6 py-4">Part Visual</th><th className="px-6 py-4">Identity</th><th className="px-6 py-4">Inventory</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.filter(p => p.providerId === user?.clerkId).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {p.images[0]?.url ? <img src={p.images[0].url} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-50" /> : <Package size={24} className="text-gray-300" />}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-dark uppercase">{p.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-widest">{p.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-brand-red">${p.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setNewPart({
                            name: p.name,
                            category: p.category,
                            description: p.description ?? '',
                            price: p.price.toString(),
                            condition: p.condition || '',
                            inStock: p.inStock,
                            partNumber: p.partNumber || '',
                            castingNumber: p.castingNumber || '',
                            vinCompatibility: p.vinCompatibility || ''
                          });
                          setGallery(p.images.map((img: any) => ({
                            url: img.url,
                            storageId: img.storageId
                          })));
                          setShowAddModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-brand-dark transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { if (confirm("Permanently remove this part listing?")) deleteProductMutation({ id: (p as any)._id || p.id }) }} className="p-2 text-gray-400 hover:text-brand-red transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.filter(p => p.providerId === user?.clerkId).length === 0 && (
              <div className="p-20 text-center text-gray-300 font-black uppercase text-xl italic">No Listings Synchronized</div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400">
                <tr><th className="px-6 py-4">Order ID</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Value</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Update Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => {
                  const statusColors: any = {
                    'Processing': 'bg-yellow-100 text-yellow-700',
                    'Shipped': 'bg-blue-100 text-blue-700',
                    'Delivered': 'bg-green-100 text-green-700',
                    'Cancelled': 'bg-red-100 text-red-700'
                  };
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-black text-brand-red">#CO-{o.id.slice(-6)}</td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{o.date}</td>
                      <td className="px-6 py-4 font-bold text-brand-dark">${o.amount.toFixed(2)}
                        {!isConsumer && o.sellerAmount !== undefined && <div className="text-xs font-normal text-gray-600 mt-1">Fee ({o.transactionFeePercent}%): ${(o.platformFeeAmount ?? 0).toFixed(2)}<br />Your earnings: ${o.sellerAmount.toFixed(2)}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColors[o.status] || 'bg-gray-100'}`}>{o.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role === 'provider' && (
                          <div className="flex justify-end gap-2">
                            {o.status === 'Processing' && (
                              <button
                                onClick={() => handleUpdateStatus(o, 'Shipped')}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="Mark as Shipped"
                              >
                                <Truck size={16} />
                              </button>
                            )}
                            {o.status === 'Shipped' && (
                              <button
                                onClick={() => handleUpdateStatus(o, 'Delivered')}
                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
                                title="Mark as Delivered"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="p-20 text-center text-gray-300 font-black uppercase text-xl italic">No Order History Found</div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase">{editingProduct ? 'Edit Part Protocol' : 'Initialize New Listing'}</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Component Visuals (Multi-upload)</label>
                  <div className="grid grid-cols-4 gap-4">
                    {gallery.map((item, idx) => (
                      <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border">
                        <img src={item.url} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeGalleryItem(idx)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-brand-red"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="text-gray-400" />
                      <span className="text-[8px] font-black uppercase text-gray-400">Add Image</span>
                    </button>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => handleImageChange(e)} />
                </div>

                <div className="space-y-4">
                  <input placeholder="Part Common Name" value={newPart.name} onChange={e => setNewPart({ ...newPart, name: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {![...PRODUCT_CATEGORIES, ...products.map(p => p.category)].includes(newPart.category as any) && newPart.category !== '' ? (
                        <div className="flex gap-2">
                          <input
                            placeholder="Custom Category Name"
                            value={newPart.category}
                            onChange={e => setNewPart({ ...newPart, category: e.target.value })}
                            className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red font-bold"
                            autoFocus
                          />
                          <button onClick={() => setNewPart({ ...newPart, category: '' })} className="bg-gray-200 px-4 rounded-xl hover:bg-gray-300"><X size={16} /></button>
                        </div>
                      ) : (
                        <select
                          value={newPart.category}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setNewPart({ ...newPart, category: 'Custom' });
                            } else {
                              setNewPart({ ...newPart, category: e.target.value });
                            }
                          }}
                          className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red appearance-none font-bold"
                        >
                          <option value="" disabled>Select Category</option>
                          {Array.from(new Set([
                            ...PRODUCT_CATEGORIES,
                            ...products.map(p => p.category)
                          ])).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="custom" className="font-black text-brand-red uppercase">+ Create New Category</option>
                        </select>
                      )}
                    </div>
                    <input placeholder="Price (USD)" type="number" value={newPart.price} onChange={e => setNewPart({ ...newPart, price: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select aria-label="Part condition" value={newPart.condition} onChange={e => setNewPart({ ...newPart, condition: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red">
                      <option value="" disabled>Choose Condition</option>
                      <option value="New">New</option>
                      <option value="Used">Used</option>
                      <option value="Restored">Restored</option>
                      <option value="For parts">For parts</option>
                    </select>
                    <label className="flex items-center gap-3 text-sm font-bold text-gray-700"><input type="checkbox" checked={newPart.inStock} onChange={e => setNewPart({ ...newPart, inStock: e.target.checked })} /> Available for purchase</label>
                  </div>

                  <div className="relative">
                    <textarea
                      placeholder="Technical Description & Restoration Notes"
                      value={newPart.description}
                      onChange={e => setNewPart({ ...newPart, description: e.target.value })}
                      rows={4}
                      className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red resize-none pr-12"
                    />
                    <button
                      onClick={handleGenerateAIDescription}
                      disabled={isAiGenerating}
                      className="absolute bottom-4 right-4 p-2 bg-brand-red text-white rounded-lg shadow-lg hover:bg-red-700 transition-all disabled:opacity-50"
                      title="AI Generate Description"
                    >
                      <Sparkles size={16} className={isAiGenerating ? "animate-pulse" : ""} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input placeholder="Part #" value={newPart.partNumber} onChange={e => setNewPart({ ...newPart, partNumber: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red" />
                    <input placeholder="Casting #" value={newPart.castingNumber} onChange={e => setNewPart({ ...newPart, castingNumber: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red" />
                  </div>

                  <input placeholder="Vehicle compatibility: year, make, model, engine" value={newPart.vinCompatibility} onChange={e => setNewPart({ ...newPart, vinCompatibility: e.target.value })} className="w-full bg-gray-50 p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-brand-red" />

                  <button onClick={handlePublishListing} disabled={loading} className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase shadow-xl hover:bg-red-700 transition-all disabled:opacity-50">
                    {loading ? 'Processing Transaction...' : 'Authorize Listing Publication'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
