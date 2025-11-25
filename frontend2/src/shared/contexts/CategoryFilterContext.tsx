import React, { createContext, useContext, useEffect, useState } from 'react';
import { marketService } from '@shared/services/marketService';

interface CategoryFilterContextType {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryFilterContext = createContext<CategoryFilterContextType | null>(null);

export const useCategoryFilter = () => {
  const context = useContext(CategoryFilterContext);
  if (!context) {
    throw new Error('useCategoryFilter must be used within CategoryFilterProvider');
  }
  return context;
};

export const CategoryFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await marketService.getCategories();
        if (response.success) {
          const unique = Array.from(new Set(response.data.filter(Boolean)));
          setCategories(['All', ...unique]);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  return (
    <CategoryFilterContext.Provider value={{ categories, selectedCategory, setSelectedCategory }}>
      {children}
    </CategoryFilterContext.Provider>
  );
};

