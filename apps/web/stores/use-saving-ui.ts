import { create } from "zustand";
interface SavingUiState { selectedNumber: number | null; suggestedNumber: number | null; sheetOpen: boolean; setSelectedNumber: (number: number | null) => void; setSuggestedNumber: (number: number | null) => void; setSheetOpen: (open: boolean) => void; }
export const useSavingUi = create<SavingUiState>((set) => ({ selectedNumber:null, suggestedNumber:null, sheetOpen:false, setSelectedNumber:(selectedNumber)=>set({selectedNumber}), setSuggestedNumber:(suggestedNumber)=>set({suggestedNumber}), setSheetOpen:(sheetOpen)=>set({sheetOpen}) }));
