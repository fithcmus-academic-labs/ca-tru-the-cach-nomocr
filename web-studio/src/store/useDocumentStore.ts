import { create } from 'zustand';
import { PageDocument, PageCategory, PageReviewStatus } from '../types/document';
import { apiAdapter } from '../services/apiAdapter';
import { REAL_PAGES } from '../services/realDataset';

interface DocumentState {
  pages: PageDocument[];
  currentPageNumber: number;
  filterCategory: PageCategory | 'all';
  filterStatus: PageReviewStatus | 'all';
  searchQuery: string;
  setPages: (pages: PageDocument[]) => void;
  setCurrentPageNumber: (pageNumber: number) => void;
  setFilterCategory: (category: PageCategory | 'all') => void;
  setFilterStatus: (status: PageReviewStatus | 'all') => void;
  setSearchQuery: (query: string) => void;
  getCurrentPage: () => PageDocument | undefined;
  loadPages: (projectId: string) => Promise<void>;
  updatePageStatus: (pageNumber: number, status: PageReviewStatus) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  pages: [...REAL_PAGES],
  currentPageNumber: 5, // Default to Page 5 (first content page of NOM_Y)
  filterCategory: 'all',
  filterStatus: 'all',
  searchQuery: '',

  setPages: (pages) => set({ pages }),

  setCurrentPageNumber: (pageNumber) => set({ currentPageNumber: pageNumber }),

  setFilterCategory: (category) => set({ filterCategory: category }),

  setFilterStatus: (status) => set({ filterStatus: status }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  getCurrentPage: () => {
    const { pages, currentPageNumber } = get();
    return pages.find((p) => p.pageNumber === currentPageNumber);
  },

  loadPages: async (projectId: string) => {
    try {
      const pages = await apiAdapter.getPages(projectId);
      set({ pages });
    } catch (e) {
      console.warn('Using mock pages', e);
    }
  },

  updatePageStatus: (pageNumber, status) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.pageNumber === pageNumber ? { ...p, reviewStatus: status } : p))
    }))
}));
