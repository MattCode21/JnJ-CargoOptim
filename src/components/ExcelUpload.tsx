import React, { useState, useCallback } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CategoryType } from '../App';
import { calculateOptimalPacking } from '../utils/packingAlgorithms';

interface ExcelUploadProps {
  category: CategoryType;
}

interface ProductData {
  skuCode: string;
  productName: string;
  tileDimensions: string;
  tileWeight: number;
  masterCartonDimensions: string;
  masterCartonWeight: number;
  palletDimensions: string;
  palletWeight: number;
  maxTilesInCarton?: number;
  maxPacksInPallet?: number;
  maxPalletsIn20ft?: number;
  maxPalletsIn40ft?: number;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ category }) => {
  const [uploadedData, setUploadedData] = useState<ProductData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const processedData: ProductData[] = jsonData.map((row: any) => ({
          skuCode: row['SKU Code'] || '',
          productName: row['Product name'] || '',
          tileDimensions: row['Tile dimensions'] || '',
          tileWeight: parseFloat(row['tile weight']) || 0,
          masterCartonDimensions: row['Master carton dimensions'] || '',
          masterCartonWeight: parseFloat(row['master carton weight']) || 0,
          palletDimensions: row['pallet dimensions'] || '',
          palletWeight: parseFloat(row['pallet weight']) || 0,
        }));
        
        setUploadedData(processedData);
        setIsProcessed(false);
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const processData = async () => {
    setIsProcessing(true);
    
    // Simulate processing with packing algorithm
    const processedData = await Promise.all(
      uploadedData.map(async (item) => {
        // Parse dimensions
        const tileDims = parseDimensions(item.tileDimensions);
        const cartonDims = parseDimensions(item.masterCartonDimensions);
        const palletDims = parseDimensions(item.palletDimensions);
        
        // Calculate optimal packing
        const packingResult = calculateOptimalPacking(
          tileDims,
          cartonDims,
          palletDims,
          item.tileWeight,
          item.masterCartonWeight,
          item.palletWeight
        );
        
        return {
          ...item,
          maxTilesInCarton: packingResult.maxTilesInCarton,
          maxPacksInPallet: packingResult.maxPacksInPallet,
          maxPalletsIn20ft: packingResult.maxPalletsIn20ft,
          maxPalletsIn40ft: packingResult.maxPalletsIn40ft,
        };
      })
    );
    
    setUploadedData(processedData);
    setIsProcessing(false);
    setIsProcessed(true);
  };

  const downloadResults = () => {
    const worksheet = XLSX.utils.json_to_sheet(uploadedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Optimized Data');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `optimized_packing_${category}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const parseDimensions = (dimString: string) => {
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

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Excel Upload & Optimization</h2>
          <p className="text-gray-600">Upload your product data to get optimized packing calculations</p>
        </div>

        {!uploadedData.length ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isDragActive ? 'Drop your Excel file here' : 'Upload Excel File'}
            </h3>
            <p className="text-gray-500 mb-4">
              Drag & drop your Excel file here, or click to browse
            </p>
            <div className="bg-gray-100 rounded-xl p-4 max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-700 mb-2">Required Format:</h4>
              <p className="text-sm text-gray-600">
                SKU Code, Product name, Tile dimensions, tile weight, Master carton dimensions, 
                master carton weight, pallet dimensions, pallet weight
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Data Uploaded Successfully</h3>
                  <p className="text-gray-600">{uploadedData.length} products found</p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                {!isProcessed && (
                  <button
                    onClick={processData}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Run Optimization'}
                  </button>
                )}
                
                {isProcessed && (
                  <button
                    onClick={downloadResults}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download Results</span>
                  </button>
                )}
              </div>
            </div>

            {isProcessed && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Optimization Complete</h4>
                  <p className="text-green-700">Packing calculations have been added to your data</p>
                </div>
              </div>
            )}

            {/* Data Preview Table */}
            <div className="bg-gray-50 rounded-xl p-6 overflow-x-auto">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Data Preview</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">SKU Code</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Product Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Dimensions</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 border border-gray-200">Weight</th>
                      {isProcessed && (
                        <>
                          <th className="px-4 py-3 text-left font-semibold text-green-700 border border-gray-200">Max in Carton</th>
                          <th className="px-4 py-3 text-left font-semibold text-green-700 border border-gray-200">Max in Pallet</th>
                          <th className="px-4 py-3 text-left font-semibold text-green-700 border border-gray-200">20ft Container</th>
                          <th className="px-4 py-3 text-left font-semibold text-green-700 border border-gray-200">40ft Container</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.slice(0, 5).map((item, index) => (
                      <tr key={index} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200">{item.skuCode}</td>
                        <td className="px-4 py-3 border border-gray-200">{item.productName}</td>
                        <td className="px-4 py-3 border border-gray-200">{item.tileDimensions}</td>
                        <td className="px-4 py-3 border border-gray-200">{item.tileWeight}</td>
                        {isProcessed && (
                          <>
                            <td className="px-4 py-3 border border-gray-200 font-semibold text-green-700">{item.maxTilesInCarton}</td>
                            <td className="px-4 py-3 border border-gray-200 font-semibold text-green-700">{item.maxPacksInPallet}</td>
                            <td className="px-4 py-3 border border-gray-200 font-semibold text-green-700">{item.maxPalletsIn20ft}</td>
                            <td className="px-4 py-3 border border-gray-200 font-semibold text-green-700">{item.maxPalletsIn40ft}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {uploadedData.length > 5 && (
                  <p className="text-gray-500 text-center mt-4">
                    ... and {uploadedData.length - 5} more items
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUpload;