interface Dimensions {
  length: number;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
  z: number;
  rotation: { x: number; y: number; z: number };
}

export const calculateOptimalPacking = (
  itemDims: Dimensions,
  cartonDims: Dimensions,
  palletDims: Dimensions,
  itemWeight: number,
  cartonMaxWeight: number,
  palletMaxWeight: number
) => {
  // Calculate maximum items in carton
  const cartonVolume = cartonDims.length * cartonDims.width * cartonDims.height;
  const itemVolume = itemDims.length * itemDims.width * itemDims.height;
  
  // Try different orientations
  const orientations = [
    { l: itemDims.length, w: itemDims.width, h: itemDims.height },
    { l: itemDims.length, w: itemDims.height, h: itemDims.width },
    { l: itemDims.width, w: itemDims.length, h: itemDims.height },
    { l: itemDims.width, w: itemDims.height, h: itemDims.length },
    { l: itemDims.height, w: itemDims.length, h: itemDims.width },
    { l: itemDims.height, w: itemDims.width, h: itemDims.length }
  ];

  let maxItemsInCarton = 0;
  
  orientations.forEach(orientation => {
    const itemsX = Math.floor(cartonDims.length / orientation.l);
    const itemsY = Math.floor(cartonDims.height / orientation.h);
    const itemsZ = Math.floor(cartonDims.width / orientation.w);
    const totalItems = itemsX * itemsY * itemsZ;
    
    if (totalItems * itemWeight <= cartonMaxWeight) {
      maxItemsInCarton = Math.max(maxItemsInCarton, totalItems);
    }
  });

  // Calculate cartons in pallet
  const palletVolume = palletDims.length * palletDims.width * palletDims.height;
  
  const cartonsX = Math.floor(palletDims.length / cartonDims.length);
  const cartonsY = Math.floor(palletDims.height / cartonDims.height);
  const cartonsZ = Math.floor(palletDims.width / cartonDims.width);
  let maxPacksInPallet = cartonsX * cartonsY * cartonsZ;
  
  // Check weight constraint
  const cartonTotalWeight = maxItemsInCarton * itemWeight;
  maxPacksInPallet = Math.min(maxPacksInPallet, Math.floor(palletMaxWeight / cartonTotalWeight));

  // Standard container dimensions (20ft and 40ft)
  const container20ft = { length: 589, width: 235, height: 239 }; // cm
  const container40ft = { length: 1203, width: 235, height: 239 }; // cm

  // Calculate pallets in containers
  const palletsInContainer20 = Math.floor(container20ft.length / palletDims.length) *
                              Math.floor(container20ft.width / palletDims.width) *
                              Math.floor(container20ft.height / palletDims.height);
  
  const palletsInContainer40 = Math.floor(container40ft.length / palletDims.length) *
                              Math.floor(container40ft.width / palletDims.width) *
                              Math.floor(container40ft.height / palletDims.height);

  return {
    maxTilesInCarton: maxItemsInCarton,
    maxPacksInPallet: maxPacksInPallet,
    maxPalletsIn20ft: palletsInContainer20,
    maxPalletsIn40ft: palletsInContainer40
  };
};

export const calculateMasterCartonPacking = (
  unitDims: Dimensions,
  unitWeight: number,
  cartonDims: Dimensions,
  cartonMaxWeight: number
) => {
  const orientations = [
    { l: unitDims.length, w: unitDims.width, h: unitDims.height, rot: { x: 0, y: 0, z: 0 } },
    { l: unitDims.length, w: unitDims.height, h: unitDims.width, rot: { x: Math.PI/2, y: 0, z: 0 } },
    { l: unitDims.width, w: unitDims.length, h: unitDims.height, rot: { x: 0, y: Math.PI/2, z: 0 } },
    { l: unitDims.width, w: unitDims.height, h: unitDims.length, rot: { x: Math.PI/2, y: Math.PI/2, z: 0 } },
    { l: unitDims.height, w: unitDims.length, h: unitDims.width, rot: { x: 0, y: 0, z: Math.PI/2 } },
    { l: unitDims.height, w: unitDims.width, h: unitDims.length, rot: { x: 0, y: Math.PI/2, z: Math.PI/2 } }
  ];

  let bestResult = {
    maxUnits: 0,
    totalWeight: 0,
    spaceUtilization: 0,
    weightUtilization: 0,
    positions: [] as Position[]
  };

  orientations.forEach(orientation => {
    const unitsX = Math.floor(cartonDims.length / orientation.l);
    const unitsY = Math.floor(cartonDims.height / orientation.h);
    const unitsZ = Math.floor(cartonDims.width / orientation.w);
    const totalUnits = unitsX * unitsY * unitsZ;
    const totalWeight = totalUnits * unitWeight;
    
    if (totalWeight <= cartonMaxWeight && totalUnits > bestResult.maxUnits) {
      const positions: Position[] = [];
      
      for (let x = 0; x < unitsX; x++) {
        for (let y = 0; y < unitsY; y++) {
          for (let z = 0; z < unitsZ; z++) {
            positions.push({
              x: x * orientation.l,
              y: y * orientation.h,
              z: z * orientation.w,
              rotation: orientation.rot
            });
          }
        }
      }

      const unitVolume = unitDims.length * unitDims.width * unitDims.height;
      const cartonVolume = cartonDims.length * cartonDims.width * cartonDims.height;
      
      bestResult = {
        maxUnits: totalUnits,
        totalWeight: totalWeight,
        spaceUtilization: (totalUnits * unitVolume / cartonVolume) * 100,
        weightUtilization: (totalWeight / cartonMaxWeight) * 100,
        positions: positions
      };
    }
  });

  return bestResult;
};

export const calculatePalletPacking = (
  cartonDims: Dimensions,
  cartonWeight: number,
  palletDims: Dimensions,
  palletMaxWeight: number
) => {
  const cartonsX = Math.floor(palletDims.length / cartonDims.length);
  const cartonsY = Math.floor(palletDims.height / cartonDims.height);
  const cartonsZ = Math.floor(palletDims.width / cartonDims.width);
  
  let maxCartons = cartonsX * cartonsY * cartonsZ;
  const totalWeight = maxCartons * cartonWeight;
  
  // Adjust for weight constraint
  if (totalWeight > palletMaxWeight) {
    maxCartons = Math.floor(palletMaxWeight / cartonWeight);
  }

  const positions: Position[] = [];
  let currentCartons = 0;
  
  for (let y = 0; y < cartonsY && currentCartons < maxCartons; y++) {
    for (let x = 0; x < cartonsX && currentCartons < maxCartons; x++) {
      for (let z = 0; z < cartonsZ && currentCartons < maxCartons; z++) {
        positions.push({
          x: x * cartonDims.length,
          y: y * cartonDims.height,
          z: z * cartonDims.width,
          rotation: { x: 0, y: 0, z: 0 }
        });
        currentCartons++;
      }
    }
  }

  const cartonVolume = cartonDims.length * cartonDims.width * cartonDims.height;
  const palletVolume = palletDims.length * palletDims.width * palletDims.height;
  
  return {
    maxCartons: maxCartons,
    totalWeight: maxCartons * cartonWeight,
    spaceUtilization: (maxCartons * cartonVolume / palletVolume) * 100,
    weightUtilization: (maxCartons * cartonWeight / palletMaxWeight) * 100,
    positions: positions,
    layers: Math.min(cartonsY, Math.ceil(maxCartons / (cartonsX * cartonsZ)))
  };
};

export const calculateContainerPacking = (
  palletDims: Dimensions,
  palletWeight: number,
  containerDims: Dimensions,
  containerMaxWeight: number
) => {
  const palletsX = Math.floor(containerDims.length / palletDims.length);
  const palletsY = Math.floor(containerDims.height / palletDims.height);
  const palletsZ = Math.floor(containerDims.width / palletDims.width);
  
  let maxPallets = palletsX * palletsY * palletsZ;
  const totalWeight = maxPallets * palletWeight;
  
  // Adjust for weight constraint
  if (totalWeight > containerMaxWeight) {
    maxPallets = Math.floor(containerMaxWeight / palletWeight);
  }

  const positions: Position[] = [];
  let currentPallets = 0;
  
  for (let y = 0; y < palletsY && currentPallets < maxPallets; y++) {
    for (let x = 0; x < palletsX && currentPallets < maxPallets; x++) {
      for (let z = 0; z < palletsZ && currentPallets < maxPallets; z++) {
        positions.push({
          x: x * palletDims.length,
          y: y * palletDims.height,
          z: z * palletDims.width,
          rotation: { x: 0, y: 0, z: 0 }
        });
        currentPallets++;
      }
    }
  }

  const palletVolume = palletDims.length * palletDims.width * palletDims.height;
  const containerVolume = containerDims.length * containerDims.width * containerDims.height;
  
  return {
    maxPallets: maxPallets,
    totalWeight: maxPallets * palletWeight,
    spaceUtilization: (maxPallets * palletVolume / containerVolume) * 100,
    weightUtilization: (maxPallets * palletWeight / containerMaxWeight) * 100,
    positions: positions,
    arrangement: {
      rows: Math.min(palletsX, Math.ceil(maxPallets / (palletsY * palletsZ))),
      columns: Math.min(palletsZ, Math.ceil(maxPallets / (palletsX * palletsY))),
      layers: Math.min(palletsY, Math.ceil(maxPallets / (palletsX * palletsZ)))
    }
  };
};