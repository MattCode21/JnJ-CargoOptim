interface Product {
  productName: string;
  unitWeight: number;
  unitCartonDimensions: string;
  length: number;
  width: number;
  height: number;
  volume: number;
}

interface CombinationResult {
  product: Product;
  quantity: number;
  totalWeight: number;
  totalVolume: number;
}

export const findOptimalCombination = (
  products: Product[],
  maxVolume: number,
  maxWeight: number
): CombinationResult[] => {
  // This is a simplified version of the knapsack problem
  // We'll use a greedy approach with some optimization
  
  // Calculate efficiency ratio (value per unit volume and weight)
  const productsWithRatio = products.map(product => ({
    ...product,
    volumeRatio: 1 / product.volume, // Inverse because smaller volume is better
    weightRatio: 1 / product.unitWeight, // Inverse because lighter is better
    efficiency: (1 / product.volume) * (1 / product.unitWeight)
  }));

  // Sort by efficiency (higher is better)
  productsWithRatio.sort((a, b) => b.efficiency - a.efficiency);

  const result: CombinationResult[] = [];
  let remainingVolume = maxVolume;
  let remainingWeight = maxWeight;

  // First, ensure at least one of each product
  for (const product of productsWithRatio) {
    if (product.volume <= remainingVolume && product.unitWeight <= remainingWeight) {
      result.push({
        product: product,
        quantity: 1,
        totalWeight: product.unitWeight,
        totalVolume: product.volume
      });
      remainingVolume -= product.volume;
      remainingWeight -= product.unitWeight;
    }
  }

  // Then, greedily add more products
  let improved = true;
  while (improved) {
    improved = false;
    
    for (const existingResult of result) {
      const product = existingResult.product;
      
      // Check if we can add one more of this product
      if (product.volume <= remainingVolume && product.unitWeight <= remainingWeight) {
        existingResult.quantity += 1;
        existingResult.totalWeight += product.unitWeight;
        existingResult.totalVolume += product.volume;
        remainingVolume -= product.volume;
        remainingWeight -= product.unitWeight;
        improved = true;
      }
    }
  }

  return result.filter(item => item.quantity > 0);
};