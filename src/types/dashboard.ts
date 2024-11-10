// types/dashboard.ts
export interface Profile {
    id: string;
    firstName: string;
    phoneNumber: string;
    age: string;
    photos: string[];
    schedule: string;
    profilePhoto: string;
    gender: string;
    interestedIn: string;
    bio: string;
    distance?: number;
    groupIds?: string[];
    coffeeAdded?: string[];
    setupComplete?: boolean;
  }
  
  export interface DateDetails {
    location?: string;
    time?: string;
    status?: 'pending' | 'confirmed' | 'completed';
    partnerId?: string;
  }
  
  export interface ConfirmModalState {
    visible: boolean;
    userId: string | null;
    index: number | null;
  }