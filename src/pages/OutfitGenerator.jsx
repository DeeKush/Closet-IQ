import { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { getOutfitFromAI, parseGeminiResponse } from '../services/gemini';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

const OCCASIONS = [
    { value: 'casual', label: 'Casual', emoji: '👕' },
    { value: 'formal', label: 'Formal', emoji: '👔' },
    { value: 'party', label: 'Party', emoji: '🎉' },
    { value: 'sports', label: 'Sports', emoji: '⚽' },
    { value: 'work', label: 'Work', emoji: '💼' },
];

export default function OutfitGenerator() {
    const { wardrobe } = useWardrobe();
    const [selectedOccasion, setSelectedOccasion] = useState('');
    const [loading, setLoading] = useState(false);
    const [outfit, setOutfit] = useState(null);
    const [error, setError] = useState(null);

    const generateOutfit = async () => {
        if (!selectedOccasion) {
            setError('Please select an occasion first');
            return;
        }

        // Check if we have items for this occasion
        const matchingItems = wardrobe.filter(item => item.occasion === selectedOccasion);
        const tops = matchingItems.filter(item => item.type === 'top');
        const bottoms = matchingItems.filter(item => item.type === 'bottom');
        const footwear = matchingItems.filter(item => item.type === 'footwear');

        if (tops.length === 0 || bottoms.length === 0 || footwear.length === 0) {
            setError('You need at least one top, bottom, and footwear for this occasion.');
            setOutfit(null);
            return;
        }

        setLoading(true);
        setError(null);
        setOutfit(null);

        try {
            const aiResponse = await getOutfitFromAI(wardrobe, selectedOccasion);
            const parsed = parseGeminiResponse(aiResponse);

            if (parsed.error) {
                setError(parsed.error);
                return;
            }

            // Find actual items from wardrobe by ID
            const topItem = wardrobe.find(item => item.id == parsed.top);
            const bottomItem = wardrobe.find(item => item.id == parsed.bottom);
            const footwearItem = wardrobe.find(item => item.id == parsed.footwear);

            if (!topItem || !bottomItem || !footwearItem) {
                console.error('AI selected invalid IDs:', parsed);
                setError('AI selected items that do not exist in your wardrobe. Please try again.');
                return;
            }

            setOutfit({
                top: topItem,
                bottom: bottomItem,
                footwear: footwearItem,
                reason: parsed.reason || 'AI-selected outfit',
            });
        } catch (err) {
            console.error('AI outfit generation failed:', err);
            setError(err.message || 'Failed to generate outfit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold mb-3">AI Outfit Generator</h1>
                <p className="text-white/60 max-w-lg mx-auto">
                    Stop wasting time deciding what to wear. Select an occasion and let AI pick the perfect outfit for you.
                </p>
            </div>

            {/* Occasion Selection */}
            <div className="glass-strong p-6 mb-8 max-w-2xl mx-auto">
                <label className="block text-sm font-medium mb-4 text-white/80 text-center">
                    What's the occasion?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {OCCASIONS.map((occ) => (
                        <button
                            key={occ.value}
                            onClick={() => setSelectedOccasion(occ.value)}
                            className={`p-4 rounded-xl text-center transition-all duration-300 ${selectedOccasion === occ.value
                                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 scale-105 shadow-lg shadow-purple-500/30'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-2xl block mb-1">{occ.emoji}</span>
                            <span className="text-sm font-medium">{occ.label}</span>
                        </button>
                    ))}
                </div>

                <button
                    onClick={generateOutfit}
                    disabled={loading || !selectedOccasion}
                    className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate Outfit
                        </>
                    )}
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="glass bg-red-500/10 border-red-500/30 p-4 mb-8 max-w-2xl mx-auto flex items-start gap-3">
                    <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <p className="text-red-300">{error}</p>
                </div>
            )}

            {/* Outfit Result */}
            {outfit && (
                <div className="max-w-4xl mx-auto animate-fade-in">
                    <h2 className="text-xl font-semibold text-center mb-6">Your Perfect Outfit</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {['top', 'bottom', 'footwear'].map((type) => (
                            <div key={type} className="glass overflow-hidden">
                                <div className="aspect-square overflow-hidden">
                                    <img
                                        src={outfit[type].image}
                                        alt={type}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4 text-center">
                                    <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 rounded-full text-sm capitalize font-medium">
                                        {type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* AI Reasoning */}
                    <div className="glass-strong p-5 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Sparkles size={18} className="text-purple-400" />
                            <span className="font-medium text-white/90">AI Recommendation</span>
                        </div>
                        <p className="text-white/70">{outfit.reason}</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!outfit && !error && !loading && (
                <div className="text-center text-white/40 py-12">
                    <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Select an occasion and click "Generate Outfit" to get started</p>
                </div>
            )}
        </div>
    );
}
