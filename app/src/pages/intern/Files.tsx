import { useEffect, useState, useRef } from 'react';
import { InternLayout } from '@/components/layouts/InternLayout';
import { api } from '@/services/api';
import type { FileItem } from '@/types';
import { toast } from 'sonner';

const categoryConfig: Record<string, { icon: string; color: string; bg: string }> = {
  document:    { icon:'📄', color:'text-blue-700',   bg:'bg-blue-50'   },
  certificate: { icon:'🏆', color:'text-yellow-700', bg:'bg-yellow-50' },
  image:       { icon:'🖼️', color:'text-purple-700', bg:'bg-purple-50' },
  general:     { icon:'📎', color:'text-gray-600',   bg:'bg-gray-100'  },
  id:          { icon:'🪪', color:'text-green-700',  bg:'bg-green-50'  },
  other:       { icon:'📁', color:'text-teal-700',   bg:'bg-teal-50'   },
};

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('word')) return '📘';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📗';
  return '📄';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}

export default function InternFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try { const res = await api.getFiles(); setFiles((res as any).files ?? []); }
    catch { toast.error('Failed to load files'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Please select a file'); return; }
    setUploading(true);
    try {
      await api.uploadFile(selectedFile, category, description || undefined);
      toast.success('File uploaded successfully');
      setShowModal(false); setSelectedFile(null); setCategory('general'); setDescription('');
      fetchFiles();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await api.deleteFile(id); toast.success('File deleted'); fetchFiles(); }
    catch { toast.error('Failed to delete file'); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setShowModal(true); }
  };

  const filtered = filterCat === 'all' ? files : files.filter(f => f.category === filterCat);
  const totalSize = files.reduce((s, f) => s + f.file_size, 0);
  const categories = [...new Set(files.map(f => f.category).filter(Boolean))] as string[];

  return (
    <InternLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Files</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and download your uploaded documents</p>
          </div>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Upload File
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label:'Total Files',  value: files.length,         bg:'bg-blue-50',   color:'text-blue-700'   },
            { label:'Storage Used', value: formatSize(totalSize), bg:'bg-purple-50', color:'text-purple-700' },
            { label:'Categories',   value: categories.length,    bg:'bg-green-50',  color:'text-green-700'  },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Drop zone + filter */}
        <div ref={dropRef} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
          onClick={() => setShowModal(true)}>
          <div className="text-3xl mb-2">📂</div>
          <p className="text-sm font-medium text-gray-600">Drop files here or <span className="text-green-600 underline">click to upload</span></p>
          <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images, TXT · Max 10MB</p>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(['all', ...categories]).map(c => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${filterCat===c ? 'text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                style={filterCat===c ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                {c === 'all' ? `All (${files.length})` : `${c} (${files.filter(f=>f.category===c).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Files grid */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor:'rgba(22,163,74,0.2)', borderTopColor:'#16a34a' }}/></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">📁</div>
            <p className="text-gray-500 font-medium">{files.length === 0 ? 'No files uploaded yet' : 'No files in this category'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(file => {
              const cat = categoryConfig[file.category ?? 'general'] ?? categoryConfig.general;
              return (
                <div key={file.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${cat.bg}`}>
                      {fileIcon(file.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{file.original_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${cat.bg} ${cat.color}`}>{file.category ?? 'general'}</span>
                        <span className="text-xs text-gray-400">{formatSize(file.file_size)}</span>
                      </div>
                      {file.description && <p className="text-xs text-gray-400 mt-1 truncate">{file.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{new Date(file.uploaded_at).toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => api.downloadFile(file.id)}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors"
                      style={{ color:'#16a34a', background:'rgba(22,163,74,0.08)' }}>
                      ↓ Download
                    </button>
                    <button onClick={() => handleDelete(file.id, file.original_name)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Upload File</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* File picker */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}/>
                {selectedFile ? (
                  <div>
                    <div className="text-3xl mb-2">{fileIcon(selectedFile.type)}</div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatSize(selectedFile.size)}</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📂</div>
                    <p className="text-sm text-gray-500">Click to select a file</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images · Max 10MB</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="general">General</option>
                  <option value="document">Document</option>
                  <option value="certificate">Certificate</option>
                  <option value="id">ID / Identification</option>
                  <option value="image">Image</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description…"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={uploading || !selectedFile} className="flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-60" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
                  {uploading ? 'Uploading…' : 'Upload File'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </InternLayout>
  );
}
