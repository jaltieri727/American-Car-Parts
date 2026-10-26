import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, ChevronRight, X } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { AnimatePresence } from 'framer-motion';

export const BlogPage: React.FC = () => {
  const blogs = useQuery(api.blogs.list) || [];
  const [selectedPost, setSelectedPost] = React.useState<any | null>(null);

  return (
    <div className="bg-white min-h-screen pb-24">
      <div className="bg-brand-dark py-24 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-6"
          >
            The <span className="text-brand-red">Garage</span> Journal
          </motion.h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Expert insights, restoration guides, and marketplace news for the classic car community.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {blogs.length > 0 ? blogs.map((post, i) => (
            <motion.article
              key={(post as any)._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative h-64 overflow-hidden rounded-2xl mb-6 shadow-lg">
                <img
                  src={post.image.startsWith('http') ? post.image : `https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={post.title}
                />
                <div className="absolute top-4 left-4 bg-brand-red text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full">
                  {post.category}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {post.date}</span>
                  <span className="flex items-center gap-1"><User size={14} /> {post.author}</span>
                </div>
                <h2 className="text-2xl font-black uppercase leading-tight group-hover:text-brand-red transition-colors">{post.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                <div className="pt-4">
                  <button className="flex items-center gap-2 text-brand-red font-black uppercase text-sm group-hover:gap-4 transition-all">
                    Read Article <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.article>
          )) : (
            <div className="col-span-3 py-20 text-center font-black uppercase text-gray-300 text-xl italic tracking-tighter">
              Awaiting New Journal Entries...
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md" onClick={() => setSelectedPost(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <button onClick={() => setSelectedPost(null)} className="absolute top-6 right-6 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md transition-colors">
                <X size={24} />
              </button>

              <div className="h-80 relative shrink-0">
                <img src={selectedPost.image.startsWith('http') ? selectedPost.image : `https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t FROM-brand-dark/80 TO-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                  <span className="bg-brand-red text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full mb-4 inline-block">{selectedPost.category}</span>
                  <h2 className="text-4xl font-black uppercase text-white tracking-tight">{selectedPost.title}</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12">
                <div className="flex items-center gap-6 mb-8 text-xs font-bold uppercase text-gray-400 tracking-widest pb-8 border-b border-gray-100">
                  <span className="flex items-center gap-2"><Calendar size={16} className="text-brand-red" /> {selectedPost.date}</span>
                  <span className="flex items-center gap-2"><User size={16} className="text-brand-red" /> {selectedPost.author}</span>
                </div>
                <div className="prose prose-lg max-w-none text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};