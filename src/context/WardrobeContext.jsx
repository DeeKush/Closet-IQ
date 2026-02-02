import { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'closetIQ-wardrobe';

const WardrobeContext = createContext(null);

export function WardrobeProvider({ children }) {
    const [wardrobe, setWardrobe] = useState([]);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                let items = JSON.parse(stored);
                // Migrate old items without IDs
                let needsSave = false;
                items = items.map((item, index) => {
                    if (!item.id) {
                        needsSave = true;
                        return { ...item, id: Date.now() + index };
                    }
                    return item;
                });
                setWardrobe(items);
                if (needsSave) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
                }
            } catch (e) {
                console.error('Failed to load wardrobe data:', e);
                setWardrobe([]);
            }
        }
    }, []);

    // Save to localStorage whenever wardrobe changes
    useEffect(() => {
        if (wardrobe.length > 0 || localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobe));
        }
    }, [wardrobe]);

    const addItem = (item) => {
        const newItem = {
            ...item,
            id: Date.now(),
        };
        setWardrobe((prev) => [...prev, newItem]);
    };

    const removeItem = (id) => {
        setWardrobe((prev) => prev.filter((item) => item.id !== id));
    };

    return (
        <WardrobeContext.Provider value={{ wardrobe, addItem, removeItem }}>
            {children}
        </WardrobeContext.Provider>
    );
}

export function useWardrobe() {
    const context = useContext(WardrobeContext);
    if (!context) {
        throw new Error('useWardrobe must be used within a WardrobeProvider');
    }
    return context;
}
