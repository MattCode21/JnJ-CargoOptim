const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Product {
  skuCode?: string;
  productName: string;
  tileDimensions?: string;
  tileWeight?: number;
  masterCartonDimensions?: string;
  masterCartonWeight?: number;
  palletDimensions?: string;
  palletWeight?: number;
  maxTilesInCarton?: number;
  maxPacksInPallet?: number;
  maxPalletsIn20ft?: number;
  maxPalletsIn40ft?: number;
}

export interface PackingResult {
  maxUnits: number;
  totalWeight: number;
  spaceUtilization: number;
  weightUtilization: number;
  positions: Array<{
    x: number;
    y: number;
    z: number;
    rotation: { x: number; y: number; z: number };
  }>;
  aiSuggestions?: {
    suggestions: Array<{
      title: string;
      description: string;
    }>;
  };
}

export interface CombinationResult {
  product: {
    productName: string;
    unitWeight: number;
    unitCartonDimensions: string;
    length: number;
    width: number;
    height: number;
    volume: number;
  };
  quantity: number;
  totalWeight: number;
  totalVolume: number;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Custom categories
  async getCustomCategories(): Promise<string[]> {
    return this.request<string[]>('/categories');
  }

  async addCustomCategory(name: string): Promise<{ id: number; name: string }> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Excel processing
  async processExcelData(category: string, data: any[]): Promise<Product[]> {
    return this.request<Product[]>('/process-excel', {
      method: 'POST',
      body: JSON.stringify({ category, data }),
    });
  }

  // Optimal combination
  async calculateOptimalCombination(
    products: any[],
    masterCartonDims: { length: number; width: number; height: number },
    maxWeight: number
  ): Promise<CombinationResult[]> {
    return this.request<CombinationResult[]>('/optimal-combination', {
      method: 'POST',
      body: JSON.stringify({ products, masterCartonDims, maxWeight }),
    });
  }

  // Packing algorithm
  async calculatePacking(
    category: string,
    packingType: 'carton' | 'pallet' | 'container',
    unitDimensions: { length: number; width: number; height: number },
    unitWeight: number,
    containerDimensions: { length: number; width: number; height: number },
    containerMaxWeight: number
  ): Promise<PackingResult> {
    return this.request<PackingResult>('/calculate-packing', {
      method: 'POST',
      body: JSON.stringify({
        category,
        packingType,
        unitDimensions,
        unitWeight,
        containerDimensions,
        containerMaxWeight,
      }),
    });
  }

  // Image processing
  async removeBackground(imageFile: File): Promise<{ imageUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/remove-background`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Packing history
  async getPackingHistory(category: string): Promise<any[]> {
    return this.request<any[]>(`/packing-history/${category}`);
  }

  // AI Chat
  async sendChatMessage(message: string, context?: any): Promise<{ response: string }> {
    return this.request<{ response: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiService = new ApiService();