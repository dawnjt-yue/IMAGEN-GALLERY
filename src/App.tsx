import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Settings, 
  Image as ImageIcon, 
  History, 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  Loader2, 
  Sparkles,
  ChevronRight,
  Settings2,
  Bookmark,
  X,
  Copy,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  ApiConfig, 
  ImageSettings, 
  PromptPreset, 
  PrefixTemplate,
  SuffixTemplate,
  GeneratedImage, 
  DEFAULT_CONFIG, 
  DEFAULT_SETTINGS,
  IMAGE_SIZES,
  IMAGE_QUALITIES,
  IMAGE_STYLES
} from './types';
import { cn } from '@/lib/utils';

export default function App() {
  // State
  const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG);
  const [settings, setSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);
  const [presets, setPresets] = useState<PromptPreset[]>([]);
  const [prefixTemplates, setPrefixTemplates] = useState<PrefixTemplate[]>([]);
  const [selectedPrefixId, setSelectedPrefixId] = useState<string>('none');
  const [suffixTemplates, setSuffixTemplates] = useState<SuffixTemplate[]>([]);
  const [selectedSuffixId, setSelectedSuffixId] = useState<string>('none');
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  
  // UI State
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isManagingPrefixes, setIsManagingPrefixes] = useState(false);
  const [isManagingSuffixes, setIsManagingSuffixes] = useState(false);
  const [newPrefixName, setNewPrefixName] = useState('');
  const [newPrefixContent, setNewPrefixContent] = useState('');
  const [newSuffixName, setNewSuffixName] = useState('');
  const [newSuffixContent, setNewSuffixContent] = useState('');

  // Load data from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('ai_image_config');
    const savedSettings = localStorage.getItem('ai_image_settings');
    const savedPresets = localStorage.getItem('ai_image_presets');
    const savedPrefixes = localStorage.getItem('ai_image_prefixes');
    const savedSuffixes = localStorage.getItem('ai_image_suffixes');
    const savedHistory = localStorage.getItem('ai_image_history');

    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedPresets) setPresets(JSON.parse(savedPresets));
    if (savedPrefixes) setPrefixTemplates(JSON.parse(savedPrefixes));
    if (savedSuffixes) setSuffixTemplates(JSON.parse(savedSuffixes));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('ai_image_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('ai_image_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ai_image_presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('ai_image_prefixes', JSON.stringify(prefixTemplates));
  }, [prefixTemplates]);

  useEffect(() => {
    localStorage.setItem('ai_image_suffixes', JSON.stringify(suffixTemplates));
  }, [suffixTemplates]);

  useEffect(() => {
    localStorage.setItem('ai_image_history', JSON.stringify(history));
  }, [history]);

  // Handlers
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }
    if (!config.apiKey) {
      toast.error('请先设置 API 密钥');
      setActiveTab('generate'); // Stay on generate but show settings if needed
      return;
    }

    const prefix = prefixTemplates.find(p => p.id === selectedPrefixId)?.content || '';
    const suffix = suffixTemplates.find(s => s.id === selectedSuffixId)?.content || '';
    let finalPrompt = prompt;
    if (prefix) finalPrompt = `${prefix} ${finalPrompt}`;
    if (suffix) finalPrompt = `${finalPrompt} ${suffix}`;

    setIsGenerating(true);
    try {
      const response = await fetch(`${config.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          prompt: finalPrompt,
          n: settings.n,
          size: settings.size,
          quality: settings.quality,
          style: settings.style,
          response_format: settings.responseFormat,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '生成失败');
      }

      const data = await response.json();
      const newImages: GeneratedImage[] = data.data.map((item: any) => ({
        id: uuidv4(),
        url: item.url || `data:image/png;base64,${item.b64_json}`,
        prompt: finalPrompt,
        timestamp: Date.now(),
        model: config.model,
        settings: { ...settings },
      }));

      setHistory([...newImages, ...history]);
      toast.success(`成功生成 ${newImages.length} 张图片`);
      setActiveTab('generate');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || '生成过程中出错');
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmDeleteImage = () => {
    if (deletingImageId) {
      setHistory(history.filter(img => img.id !== deletingImageId));
      setDeletingImageId(null);
      toast.success('图片已删除');
    }
  };

  const handleSavePreset = () => {
    if (!prompt.trim()) return;
    const name = prompt.slice(0, 20) + (prompt.length > 20 ? '...' : '');
    const newPreset: PromptPreset = {
      id: uuidv4(),
      name: name,
      content: prompt,
    };
    setPresets([newPreset, ...presets]);
    toast.success('提示词已保存');
  };

  const handleDeletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const handleAddPrefix = () => {
    if (!newPrefixName.trim() || !newPrefixContent.trim()) return;
    const newPrefix: PrefixTemplate = {
      id: uuidv4(),
      name: newPrefixName,
      content: newPrefixContent,
    };
    setPrefixTemplates([...prefixTemplates, newPrefix]);
    setNewPrefixName('');
    setNewPrefixContent('');
    toast.success('前置提示词模板已保存');
  };

  const handleDeletePrefix = (id: string) => {
    setPrefixTemplates(prefixTemplates.filter(p => p.id !== id));
    if (selectedPrefixId === id) setSelectedPrefixId('none');
  };

  const handleAddSuffix = () => {
    if (!newSuffixName.trim() || !newSuffixContent.trim()) return;
    const newSuffix: SuffixTemplate = {
      id: uuidv4(),
      name: newSuffixName,
      content: newSuffixContent,
    };
    setSuffixTemplates([...suffixTemplates, newSuffix]);
    setNewSuffixName('');
    setNewSuffixContent('');
    toast.success('后置提示词模板已保存');
  };

  const handleDeleteSuffix = (id: string) => {
    setSuffixTemplates(suffixTemplates.filter(s => s.id !== id));
    if (selectedSuffixId === id) setSelectedSuffixId('none');
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
      toast.info('由于浏览器限制，已在新窗口打开图片，请手动保存');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-neutral-200 flex flex-col">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="w-full border-b border-foreground px-6 py-5 flex justify-between items-baseline bg-white">
        <h1 className="text-3xl font-serif italic font-normal tracking-tight">Vision Studio</h1>
        <div className="text-[10px] uppercase tracking-[0.15em] opacity-60 font-semibold">
          Build 24.09.12 / {config.model}
        </div>
      </header>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-[320px_1fr] overflow-hidden">
        {/* Sidebar */}
        <aside className="border-r border-foreground p-6 flex flex-col gap-8 bg-white overflow-y-auto">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">API Configuration</Label>
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Enter API Key" 
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  className="h-9 bg-background border-secondary"
                />
                <Input 
                  placeholder="Base URL" 
                  value={config.baseUrl}
                  onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                  className="h-9 bg-background border-secondary"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-[10px] uppercase tracking-widest font-bold"
                  onClick={() => {
                    localStorage.setItem('ai_image_config', JSON.stringify(config));
                    toast.success('API 配置已手动保存');
                  }}
                >
                  <Save className="w-3 h-3 mr-2" />
                  Save API Config
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Model & Format</Label>
              <div className="space-y-2">
                <Input 
                  placeholder="Model Name" 
                  value={config.model}
                  onChange={(e) => setConfig({...config, model: e.target.value})}
                  className="h-9 bg-background border-secondary"
                />
                <Select value={settings.size} onValueChange={(v) => setSettings({...settings, size: v})}>
                  <SelectTrigger className="h-9 bg-background border-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-wider font-bold opacity-40">Quality</Label>
                    <Select value={settings.quality} onValueChange={(v) => setSettings({...settings, quality: v})}>
                      <SelectTrigger className="h-8 bg-background border-secondary text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_QUALITIES.map(q => <SelectItem key={q} value={q} className="text-[10px]">{q.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-wider font-bold opacity-40">Count (1-4)</Label>
                    <Select value={settings.n.toString()} onValueChange={(v) => setSettings({...settings, n: parseInt(v)})}>
                      <SelectTrigger className="h-8 bg-background border-secondary text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()} className="text-[10px]">{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Prefix Template</Label>
                <button 
                  className="text-[10px] underline opacity-60 hover:opacity-100"
                  onClick={() => setIsManagingPrefixes(true)}
                >
                  Manage
                </button>
              </div>
              <Select value={selectedPrefixId} onValueChange={setSelectedPrefixId}>
                <SelectTrigger className="h-9 bg-background border-secondary">
                  <SelectValue placeholder="Select a prefix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {prefixTemplates.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Suffix Template</Label>
                <button 
                  className="text-[10px] underline opacity-60 hover:opacity-100"
                  onClick={() => setIsManagingSuffixes(true)}
                >
                  Manage
                </button>
              </div>
              <Select value={selectedSuffixId} onValueChange={setSelectedSuffixId}>
                <SelectTrigger className="h-9 bg-background border-secondary">
                  <SelectValue placeholder="Select a suffix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {suffixTemplates.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">Prompt Studio</Label>
                <button 
                  className="text-[10px] underline opacity-60 hover:opacity-100"
                  onClick={() => setPrompt('')}
                  disabled={!prompt}
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  {selectedPrefixId !== 'none' && (
                    <div className="text-[10px] p-2 bg-neutral-50 border border-secondary border-dashed opacity-60 font-serif italic line-clamp-2">
                      {prefixTemplates.find(p => p.id === selectedPrefixId)?.content}
                    </div>
                  )}
                  <Textarea 
                    placeholder="Describe your vision..."
                    className="min-h-[100px] bg-background border-secondary text-sm leading-relaxed rounded-none focus-visible:ring-0"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  {selectedSuffixId !== 'none' && (
                    <div className="text-[10px] p-2 bg-neutral-50 border border-secondary border-dashed opacity-60 font-serif italic line-clamp-2">
                      {suffixTemplates.find(s => s.id === selectedSuffixId)?.content}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {presets.map((p) => (
                    <div key={p.id} className="flex border border-foreground">
                      <button 
                        className="text-[10px] px-2 py-1 hover:bg-neutral-50 transition-colors"
                        onClick={() => setPrompt(p.content)}
                      >
                        {p.name}
                      </button>
                      <button 
                        className="px-1.5 border-l border-foreground hover:bg-red-50 text-red-600 transition-colors flex items-center justify-center group/del"
                        onClick={() => handleDeletePreset(p.id)}
                        title="Delete Preset"
                      >
                        <X className="w-2.5 h-2.5 opacity-40 group-hover/del:opacity-100" />
                      </button>
                    </div>
                  ))}
                  <button 
                    className="text-[10px] px-2 py-1 border border-dashed border-foreground/40 hover:border-foreground transition-colors"
                    onClick={handleSavePreset}
                    disabled={!prompt.trim()}
                  >
                    + Save Current
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <Button 
              className="w-full h-12 text-sm uppercase tracking-[0.15em] font-bold rounded-none"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate Image</>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-10 bg-background overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-10">
              <TabsList className="bg-transparent h-auto p-0 gap-8">
                <TabsTrigger 
                  value="generate" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-1 text-xs uppercase tracking-widest font-bold"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 pb-1 text-xs uppercase tracking-widest font-bold"
                >
                  Archive
                </TabsTrigger>
              </TabsList>
              
              <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                {history.length} Items Total
              </div>
            </div>

            <TabsContent value="generate" className="mt-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-foreground/20">
                  <p className="text-sm italic opacity-40 font-serif">Your gallery is empty. Begin your vision.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <AnimatePresence mode="popLayout">
                    {history.map((img) => (
                      <motion.div
                        key={img.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white border border-secondary p-3 flex flex-col group cursor-pointer"
                        onClick={() => setViewingImage(img)}
                      >
                        <div className="relative aspect-square bg-neutral-100 overflow-hidden border border-secondary">
                          <img 
                            src={img.url} 
                            alt={img.prompt} 
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center gap-4">
                            <p className="text-xs italic font-serif line-clamp-4 leading-relaxed">"{img.prompt}"</p>
                            <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="text-[10px] uppercase tracking-widest font-bold underline underline-offset-4 hover:opacity-60"
                                onClick={() => handleDownload(img.url, `vision-${img.id}.png`)}
                              >
                                Download
                              </button>
                              <button 
                                className="text-[10px] uppercase tracking-widest font-bold underline underline-offset-4 hover:text-red-600"
                                onClick={() => setDeletingImageId(img.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-baseline">
                          <span className="text-sm font-serif italic">C-{img.id.slice(0, 4).toUpperCase()}</span>
                          <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold">
                            {new Date(img.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="flex flex-col gap-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 border border-dashed border-foreground/20">
                    <p className="text-sm italic opacity-40 font-serif">Archive is empty.</p>
                  </div>
                ) : (
                  history.map(img => (
                    <div key={img.id} className="border border-secondary p-3 bg-white flex items-center gap-4 group">
                      <div 
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 border border-secondary overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() => setViewingImage(img)}
                      >
                        <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-serif italic line-clamp-1 mb-1">"{img.prompt}"</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                          <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">
                            {new Date(img.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] uppercase tracking-widest font-mono opacity-40">
                            {img.settings.size} · {img.settings.quality}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <button 
                          className="text-[10px] uppercase tracking-widest font-bold underline underline-offset-2 hover:opacity-60"
                          onClick={() => setPrompt(img.prompt)}
                        >
                          Reuse
                        </button>
                        <button 
                          className="text-[10px] uppercase tracking-widest font-bold underline underline-offset-2 text-red-600 hover:text-red-800"
                          onClick={() => setDeletingImageId(img.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="border-top border-foreground px-6 py-2 flex justify-between items-center bg-background text-[10px] uppercase tracking-widest font-bold opacity-60">
        <div>Status: {isGenerating ? 'Processing...' : 'Ready'}</div>
        <div className="hidden sm:block">Path: /v1/images/generations</div>
        <div>Vision Studio v24.09</div>
      </footer>

      {/* Image Detail Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-white rounded-none">
          {viewingImage && (
            <div className="flex flex-col md:grid md:grid-cols-[1fr_300px] h-[90vh] md:h-[80vh]">
              <div className="relative bg-neutral-100 flex items-center justify-center overflow-hidden">
                <img 
                  src={viewingImage.url} 
                  alt={viewingImage.prompt} 
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-8 flex flex-col gap-6 border-l border-secondary bg-white overflow-y-auto">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Prompt</Label>
                  <p className="text-sm font-serif italic leading-relaxed">"{viewingImage.prompt}"</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40">Model</Label>
                    <p className="text-xs font-mono">{viewingImage.model}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40">Size</Label>
                    <p className="text-xs font-mono">{viewingImage.settings.size}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40">Quality</Label>
                    <p className="text-xs font-mono">{viewingImage.settings.quality}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-widest font-bold opacity-40">Date</Label>
                    <p className="text-xs font-mono">{new Date(viewingImage.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <Button 
                    className="w-full rounded-none uppercase tracking-widest font-bold text-xs h-10"
                    onClick={() => handleDownload(viewingImage.url, `vision-${viewingImage.id}.png`)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Image
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-none uppercase tracking-widest font-bold text-xs h-10"
                    onClick={() => {
                      navigator.clipboard.writeText(viewingImage.prompt);
                      toast.success('Prompt copied to clipboard');
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Prompt
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingImageId} onOpenChange={(open) => !open && setDeletingImageId(null)}>
        <DialogContent className="max-w-md p-8 bg-white rounded-none border-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif italic flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="pt-4 text-sm leading-relaxed">
              Are you sure you want to remove this vision from your archive? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-none uppercase tracking-widest font-bold text-xs"
              onClick={() => setDeletingImageId(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 rounded-none uppercase tracking-widest font-bold text-xs bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteImage}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prefix Management Dialog */}
      <Dialog open={isManagingPrefixes} onOpenChange={setIsManagingPrefixes}>
        <DialogContent className="max-w-2xl p-8 bg-white rounded-none border-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif italic">Manage Prefix Templates</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest opacity-60 font-bold pt-2">
              Fixed prompts to prepend to your visions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold">Name</Label>
                <Input 
                  placeholder="e.g. Cinematic" 
                  value={newPrefixName}
                  onChange={(e) => setNewPrefixName(e.target.value)}
                  className="h-9 rounded-none border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold">Content</Label>
                <Input 
                  placeholder="e.g. 8k, highly detailed, cinematic lighting..." 
                  value={newPrefixContent}
                  onChange={(e) => setNewPrefixContent(e.target.value)}
                  className="h-9 rounded-none border-secondary"
                />
              </div>
              <Button onClick={handleAddPrefix} className="h-9 rounded-none">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {prefixTemplates.length === 0 ? (
                  <p className="text-center py-8 text-xs italic opacity-40">No templates created yet.</p>
                ) : (
                  prefixTemplates.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 border border-secondary group">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest">{p.name}</p>
                        <p className="text-[10px] opacity-60 line-clamp-1">{p.content}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeletePrefix(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsManagingPrefixes(false)} className="w-full rounded-none uppercase tracking-widest font-bold text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suffix Management Dialog */}
      <Dialog open={isManagingSuffixes} onOpenChange={setIsManagingSuffixes}>
        <DialogContent className="max-w-2xl p-8 bg-white rounded-none border-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif italic">Manage Suffix Templates</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest opacity-60 font-bold pt-2">
              Fixed prompts to append to your visions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold">Name</Label>
                <Input 
                  placeholder="e.g. Style" 
                  value={newSuffixName}
                  onChange={(e) => setNewSuffixName(e.target.value)}
                  className="h-9 rounded-none border-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold">Content</Label>
                <Input 
                  placeholder="e.g. oil painting, van gogh style..." 
                  value={newSuffixContent}
                  onChange={(e) => setNewSuffixContent(e.target.value)}
                  className="h-9 rounded-none border-secondary"
                />
              </div>
              <Button onClick={handleAddSuffix} className="h-9 rounded-none">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {suffixTemplates.length === 0 ? (
                  <p className="text-center py-8 text-xs italic opacity-40">No templates created yet.</p>
                ) : (
                  suffixTemplates.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-3 border border-secondary group">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest">{s.name}</p>
                        <p className="text-[10px] opacity-60 line-clamp-1">{s.content}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteSuffix(s.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsManagingSuffixes(false)} className="w-full rounded-none uppercase tracking-widest font-bold text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
