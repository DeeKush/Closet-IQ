import { useState } from 'react';
import { WardrobeProvider } from './context/WardrobeContext';
import Wardrobe from './pages/Wardrobe';
import OutfitGenerator from './pages/OutfitGenerator';
import { Shirt, Sparkles, Palette } from 'lucide-react';

function App() {
    const [activePage, setActivePage] = useState('outfit');

    return (
        <WardrobeProvider>
            <div className="min-h-screen">
                {/* Header */}
                <header className="glass-strong mx-4 mt-4 mb-8 sticky top-4 z-40">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                <Palette size={22} />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg">Closet IQ</h1>
                                <p className="text-xs text-white/50">AI-Powered Outfits</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex gap-2">
                            <button
                                onClick={() => setActivePage('outfit')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${activePage === 'outfit'
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Sparkles size={18} />
                                <span className="hidden sm:inline">Get Outfit</span>
                            </button>
                            <button
                                onClick={() => setActivePage('wardrobe')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${activePage === 'wardrobe'
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Shirt size={18} />
                                <span className="hidden sm:inline">Wardrobe</span>
                            </button>
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-6xl mx-auto px-4 pb-12">
                    {activePage === 'wardrobe' ? <Wardrobe /> : <OutfitGenerator />}
                </main>

                {/* Footer */}
                <footer className="text-center py-6 text-white/30 text-sm">
                    <p>Closet IQ — Never waste time on outfit decisions again</p>
                </footer>
            </div>
        </WardrobeProvider>
    );
}

export default App;
