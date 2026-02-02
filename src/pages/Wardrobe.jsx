import { useState, useRef } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { analyzeClothingImage } from '../services/gemini';
import { Upload, Plus, Trash2, Shirt, X, Sparkles, Loader2, Check } from 'lucide-react';

const OCCASIONS = [
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'party', label: 'Party' },
    { value: 'sports', label: 'Sports' },
    { value: 'work', label: 'Work' },
];

export default function Wardrobe() {
    const { wardrobe, addItem, removeItem } = useWardrobe();
    const [showForm, setShowForm] = useState(false);
    const [preview, setPreview] = useState(null);
    const [clothingType, setClothingType] = useState('');
    const [occasion, setOccasion] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiError, setAiError] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64Image = reader.result;
            setPreview(base64Image);
            setAiSuggestion(null);
            setAiError(null);
            setClothingType('');
            setOccasion('');

            // Auto-analyze with AI
            setAnalyzing(true);
            try {
                const result = await analyzeClothingImage(base64Image);
                setAiSuggestion(result);
                setClothingType(result.type);
                // Use the first suggested occasion as default
                if (result.occasions && result.occasions.length > 0) {
                    setOccasion(result.occasions[0]);
                }
            } catch (error) {
                console.error('AI analysis failed:', error);
                setAiError(error.message);
            } finally {
                setAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!preview) {
            alert('Please upload an image first!');
            return;
        }
        if (!clothingType || !occasion) {
            alert('Please select both clothing type and occasion!');
            return;
        }

        addItem({
            image: preview,
            type: clothingType,
            occasion: occasion,
        });

        // Reset form
        setPreview(null);
        setClothingType('');
        setOccasion('');
        setAiSuggestion(null);
        setAiError(null);
        setShowForm(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancel = () => {
        setPreview(null);
        setClothingType('');
        setOccasion('');
        setAiSuggestion(null);
        setAiError(null);
        setShowForm(false);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Wardrobe</h1>
                    <p className="text-white/60">Manage your clothing collection</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Item
                </button>
            </div>

            {/* Add Item Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-strong p-6 w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Add New Item</h2>
                            <button
                                onClick={handleCancel}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-white/80">
                                    Clothing Image
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition-colors relative"
                                >
                                    {preview ? (
                                        <div className="relative">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="max-h-48 mx-auto rounded-lg object-cover"
                                            />
                                            {analyzing && (
                                                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                                        <p className="text-sm">AI analyzing...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-8">
                                            <Upload className="mx-auto mb-3 text-white/40" size={40} />
                                            <p className="text-white/60">Click to upload image</p>
                                            <p className="text-white/40 text-sm mt-1">AI will auto-detect clothing type</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>

                            {/* AI Suggestion */}
                            {aiSuggestion && (
                                <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={18} className="text-purple-400" />
                                        <span className="font-medium text-purple-300">AI Detection</span>
                                        <Check size={16} className="text-green-400 ml-auto" />
                                    </div>
                                    <p className="text-sm text-white/70 mb-2">{aiSuggestion.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-white/10 rounded text-xs capitalize">
                                            Type: {aiSuggestion.type}
                                        </span>
                                        {aiSuggestion.occasions?.map((occ) => (
                                            <span key={occ} className="px-2 py-1 bg-purple-500/30 rounded text-xs capitalize">
                                                {occ}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Error */}
                            {aiError && (
                                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                                    <p className="text-red-300 text-sm">{aiError}</p>
                                    <p className="text-white/50 text-xs mt-1">You can still select manually below</p>
                                </div>
                            )}

                            {/* Clothing Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-white/80">
                                    Clothing Type {aiSuggestion && <span className="text-purple-400">(AI suggested)</span>}
                                </label>
                                <div className="flex gap-2">
                                    {['top', 'bottom', 'footwear'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setClothingType(type)}
                                            className={`flex-1 py-3 rounded-xl capitalize transition-all ${clothingType === type
                                                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg'
                                                    : 'bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Occasion */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-white/80">
                                    Occasion {aiSuggestion && <span className="text-purple-400">(AI suggested)</span>}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {OCCASIONS.map((occ) => (
                                        <button
                                            key={occ.value}
                                            type="button"
                                            onClick={() => setOccasion(occ.value)}
                                            className={`py-2.5 rounded-xl text-sm transition-all ${occasion === occ.value
                                                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg'
                                                    : aiSuggestion?.occasions?.includes(occ.value)
                                                        ? 'bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30'
                                                        : 'bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            {occ.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn-primary w-full"
                                disabled={analyzing}
                            >
                                {analyzing ? 'Analyzing...' : 'Add to Wardrobe'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Wardrobe Grid */}
            {wardrobe.length === 0 ? (
                <div className="glass p-12 text-center">
                    <Shirt className="mx-auto mb-4 text-white/30" size={64} />
                    <h3 className="text-xl font-medium mb-2 text-white/80">Your wardrobe is empty</h3>
                    <p className="text-white/50 mb-6">Start by adding some clothing items</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Your First Item
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {wardrobe.map((item, index) => (
                        <div
                            key={item.id}
                            className="glass overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="relative aspect-square overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.type}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="absolute top-3 right-3 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="flex gap-2 flex-wrap">
                                    <span className="px-3 py-1 bg-white/10 rounded-full text-sm capitalize">
                                        {item.type}
                                    </span>
                                    <span className="px-3 py-1 bg-purple-500/30 rounded-full text-sm capitalize">
                                        {item.occasion}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
