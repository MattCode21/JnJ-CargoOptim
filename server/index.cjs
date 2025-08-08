const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize SQLite database
const db = new sqlite3.Database('./packaging.db');

// Create tables
db.serialize(() => {
  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    sku_code TEXT,
    product_name TEXT NOT NULL,
    tile_dimensions TEXT,
    tile_weight REAL,
    master_carton_dimensions TEXT,
    master_carton_weight REAL,
    pallet_dimensions TEXT,
    pallet_weight REAL,
    max_tiles_in_carton INTEGER,
    max_packs_in_pallet INTEGER,
    max_pallets_20ft INTEGER,
    max_pallets_40ft INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Packing results table
  db.run(`CREATE TABLE IF NOT EXISTS packing_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    packing_type TEXT NOT NULL,
    unit_dimensions TEXT,
    unit_weight REAL,
    container_dimensions TEXT,
    container_max_weight REAL,
    max_units INTEGER,
    total_weight REAL,
    space_utilization REAL,
    weight_utilization REAL,
    positions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Custom categories table
  db.run(`CREATE TABLE IF NOT EXISTS custom_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Utility functions for packing algorithms
const parseDimensions = (dimString) => {
  if (!dimString) return { length: 0, width: 0, height: 0 };
  const matches = dimString.match(/(\d+(?:\.\d+)?)/g);
  if (matches && matches.length >= 3) {
    return {
      length: parseFloat(matches[0]),
      width: parseFloat(matches[1]),
      height: parseFloat(matches[2])
    };
  }
  return { length: 0, width: 0, height: 0 };
};

const calculateOptimalPacking = (itemDims, cartonDims, palletDims, itemWeight, cartonMaxWeight, palletMaxWeight) => {
  // Try different orientations for optimal packing
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
  const cartonsX = Math.floor(palletDims.length / cartonDims.length);
  const cartonsY = Math.floor(palletDims.height / cartonDims.height);
  const cartonsZ = Math.floor(palletDims.width / cartonDims.width);
  let maxPacksInPallet = cartonsX * cartonsY * cartonsZ;
  
  // Check weight constraint
  const cartonTotalWeight = maxItemsInCarton * itemWeight + cartonMaxWeight;
  maxPacksInPallet = Math.min(maxPacksInPallet, Math.floor(palletMaxWeight / cartonTotalWeight));

  // Standard container dimensions
  const container20ft = { length: 589, width: 235, height: 239 };
  const container40ft = { length: 1203, width: 235, height: 239 };

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

const calculateMasterCartonPacking = (unitDims, unitWeight, cartonDims, cartonMaxWeight) => {
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
    positions: []
  };

  orientations.forEach(orientation => {
    const unitsX = Math.floor(cartonDims.length / orientation.l);
    const unitsY = Math.floor(cartonDims.height / orientation.h);
    const unitsZ = Math.floor(cartonDims.width / orientation.w);
    const totalUnits = unitsX * unitsY * unitsZ;
    const totalWeight = totalUnits * unitWeight;
    
    if (totalWeight <= cartonMaxWeight && totalUnits > bestResult.maxUnits) {
      const positions = [];
      
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

// Gemini AI integration function
const getGeminiSuggestions = async (packingData, packingResult) => {
  try {
    // TODO: Add your Gemini API key here
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
    
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return {
        suggestions: [
          {
            title: "AI Integration Required",
            description: "Please add your Gemini API key to enable AI-powered optimization suggestions."
          }
        ]
      };
    }

    const prompt = `
    Analyze this packaging optimization data and provide specific suggestions:
    
    Container Dimensions: ${JSON.stringify(packingData.containerDimensions)}
    Item Dimensions: ${JSON.stringify(packingData.itemDimensions)}
    Maximum Units: ${packingResult.maxUnits}
    Space Utilization: ${packingResult.spaceUtilization}%
    Weight Utilization: ${packingResult.weightUtilization}%
    
    Provide 3-4 specific optimization suggestions focusing on:
    1. Dimensional adjustments to improve packing efficiency
    2. Weight distribution optimization
    3. Alternative packing orientations
    4. Cost-effectiveness improvements
    
    Format as JSON with title and description for each suggestion.
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    
    try {
      return JSON.parse(aiResponse);
    } catch (parseError) {
      return {
        suggestions: [
          {
            title: "AI Analysis Complete",
            description: aiResponse
          }
        ]
      };
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      suggestions: [
        {
          title: "Optimization Analysis",
          description: "AI suggestions are temporarily unavailable. Please check your API configuration."
        }
      ]
    };
  }
};

// API Routes

// Get all custom categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM custom_categories ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => row.name));
  });
});

// Add custom category
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  
  db.run('INSERT INTO custom_categories (name) VALUES (?)', [name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name });
  });
});

// Process Excel upload
app.post('/api/process-excel', (req, res) => {
  const { category, data } = req.body;
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  const processedData = data.map(item => {
    const tileDims = parseDimensions(item.tileDimensions || item['Tile dimensions']);
    const cartonDims = parseDimensions(item.masterCartonDimensions || item['Master carton dimensions']);
    const palletDims = parseDimensions(item.palletDimensions || item['pallet dimensions']);
    
    const tileWeight = parseFloat(item.tileWeight || item['tile weight']) || 0;
    const cartonWeight = parseFloat(item.masterCartonWeight || item['master carton weight']) || 0;
    const palletWeight = parseFloat(item.palletWeight || item['pallet weight']) || 0;
    
    const packingResult = calculateOptimalPacking(
      tileDims,
      cartonDims,
      palletDims,
      tileWeight,
      cartonWeight,
      palletWeight
    );
    
    const processedItem = {
      ...item,
      maxTilesInCarton: packingResult.maxTilesInCarton,
      maxPacksInPallet: packingResult.maxPacksInPallet,
      maxPalletsIn20ft: packingResult.maxPalletsIn20ft,
      maxPalletsIn40ft: packingResult.maxPalletsIn40ft
    };

    // Save to database
    db.run(`INSERT INTO products (
      category, sku_code, product_name, tile_dimensions, tile_weight,
      master_carton_dimensions, master_carton_weight, pallet_dimensions, pallet_weight,
      max_tiles_in_carton, max_packs_in_pallet, max_pallets_20ft, max_pallets_40ft
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      category,
      item.skuCode || item['SKU Code'],
      item.productName || item['Product name'],
      item.tileDimensions || item['Tile dimensions'],
      tileWeight,
      item.masterCartonDimensions || item['Master carton dimensions'],
      cartonWeight,
      item.palletDimensions || item['pallet dimensions'],
      palletWeight,
      packingResult.maxTilesInCarton,
      packingResult.maxPacksInPallet,
      packingResult.maxPalletsIn20ft,
      packingResult.maxPalletsIn40ft
    ]);

    return processedItem;
  });

  res.json(processedData);
});

// Calculate optimal combination
app.post('/api/optimal-combination', (req, res) => {
  const { products, masterCartonDims, maxWeight } = req.body;
  
  if (!products || !Array.isArray(products) || !masterCartonDims || !maxWeight) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  const masterCartonVolume = masterCartonDims.length * masterCartonDims.width * masterCartonDims.height;
  
  // Enhanced knapsack algorithm for optimal combination
  const productsWithRatio = products.map(product => ({
    ...product,
    volume: product.length * product.width * product.height,
    efficiency: 1 / (product.volume * product.unitWeight)
  }));

  productsWithRatio.sort((a, b) => b.efficiency - a.efficiency);

  const result = [];
  let remainingVolume = masterCartonVolume;
  let remainingWeight = maxWeight;

  // Ensure at least one of each product
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

  // Greedily add more products
  let improved = true;
  while (improved) {
    improved = false;
    
    for (const existingResult of result) {
      const product = existingResult.product;
      
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

  res.json(result.filter(item => item.quantity > 0));
});

// Calculate packing algorithm
app.post('/api/calculate-packing', async (req, res) => {
  const { category, packingType, unitDimensions, unitWeight, containerDimensions, containerMaxWeight } = req.body;
  
  if (!unitDimensions || !containerDimensions) {
    return res.status(400).json({ error: 'Missing required dimensions' });
  }

  let result;
  
  switch (packingType) {
    case 'carton':
      result = calculateMasterCartonPacking(unitDimensions, unitWeight, containerDimensions, containerMaxWeight);
      break;
    case 'pallet':
      result = calculateMasterCartonPacking(unitDimensions, unitWeight, containerDimensions, containerMaxWeight);
      break;
    case 'container':
      result = calculateMasterCartonPacking(unitDimensions, unitWeight, containerDimensions, containerMaxWeight);
      break;
    default:
      return res.status(400).json({ error: 'Invalid packing type' });
  }

  // Save to database
  db.run(`INSERT INTO packing_results (
    category, packing_type, unit_dimensions, unit_weight, container_dimensions, 
    container_max_weight, max_units, total_weight, space_utilization, 
    weight_utilization, positions
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    category,
    packingType,
    JSON.stringify(unitDimensions),
    unitWeight,
    JSON.stringify(containerDimensions),
    containerMaxWeight,
    result.maxUnits,
    result.totalWeight,
    result.spaceUtilization,
    result.weightUtilization,
    JSON.stringify(result.positions)
  ]);

  // Get AI suggestions
  const aiSuggestions = await getGeminiSuggestions(
    { containerDimensions, itemDimensions: unitDimensions },
    result
  );

  res.json({
    ...result,
    aiSuggestions
  });
});

// Remove background from image
app.post('/api/remove-background', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // For now, we'll just return the original image
    // In production, you would integrate with remove.bg API or similar service
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // TODO: Integrate with remove.bg API
    // const removeBgApiKey = process.env.REMOVE_BG_API_KEY;
    // if (removeBgApiKey) {
    //   // Call remove.bg API here
    // }
    
    res.json({ 
      imageUrl,
      message: 'Background removal service integration pending. Original image returned.'
    });
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// Get packing history
app.get('/api/packing-history/:category', (req, res) => {
  const { category } = req.params;
  
  db.all(
    'SELECT * FROM packing_results WHERE category = ? ORDER BY created_at DESC LIMIT 10',
    [category],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const results = rows.map(row => ({
        ...row,
        unit_dimensions: JSON.parse(row.unit_dimensions),
        container_dimensions: JSON.parse(row.container_dimensions),
        positions: JSON.parse(row.positions)
      }));
      
      res.json(results);
    }
  );
});

// Gemini chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  
  try {
    // TODO: Add your Gemini API key here
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
    
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.json({
        response: "Please configure your Gemini API key to enable the AI chatbot functionality."
      });
    }

    const prompt = `
    You are a packaging optimization expert assistant. Help the user with their packaging questions.
    
    Context: ${context ? JSON.stringify(context) : 'General packaging inquiry'}
    User Question: ${message}
    
    Provide helpful, specific advice about packaging optimization, container loading, and space utilization.
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    res.json({ response: aiResponse });
    
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    res.json({
      response: "I'm currently unable to process your request. Please check the API configuration."
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;