import { apiClient } from './api';

export interface CreditPackage {
  id: string;
  credits: number;
  usd: number;
  label?: string;
}

export interface PurchaseRecord {
  id: string;
  packageId: string;
  creditsGranted: number;
  usdAmount: number;
  status: string;
  provider?: string | null;
  createdAt: string;
}

class PurchaseService {
  getPackages() {
    return apiClient.get<{ success: boolean; packages: CreditPackage[] }>('/api/v1/purchases/packages');
  }

  createPurchase(packageId: string) {
    return apiClient.post<{ success: boolean; purchase: PurchaseRecord; newBalance: number }>(
      '/api/v1/purchases',
      { packageId }
    );
  }

  getMyPurchases() {
    return apiClient.get<{ success: boolean; purchases: PurchaseRecord[] }>('/api/v1/purchases/me');
  }
}

export const purchaseService = new PurchaseService();

