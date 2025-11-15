import React, { useState, useCallback, ChangeEvent } from 'react';
import { ImageFile, EditedImageResult } from './types';
import { editImageWithPrompt } from './services/geminiService';
import Header from './components/Header';
import ImageDisplay from './components/ImageDisplay';
import UploadIcon from './components/icons/UploadIcon';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Failed to read file as base64 string.'));
        }
    };
    reader.onerror = (error) => reject(error);
  });

interface GenerationResult extends EditedImageResult {
  title: string;
}

type GenderOption = 'pria' | 'wanita' | 'keluarga' | 'berdua';
type ClothingOption = 'casual' | 'formal';
type ItemModelOption = 'none' | 'with_model' | 'with_custom_model';
type ItemLookOption = 'casual' | 'formal' | 'trendy' | 'outdoor' | 'indoor' | 'cafe' | 'lifestyle' | 'family';


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [customModelImage, setCustomModelImage] = useState<ImageFile | null>(null);
  const [editedImages, setEditedImages] = useState<GenerationResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<'barang' | 'orang'>('barang');
  const [itemModelOption, setItemModelOption] = useState<ItemModelOption>('none');
  const [genderOption, setGenderOption] = useState<GenderOption>('pria');
  const [clothingOption, setClothingOption] = useState<ClothingOption>('casual');
  const [itemLook, setItemLook] = useState<ItemLookOption>('casual');


  const genderMap: Record<GenderOption, string> = {
    pria: 'a man',
    wanita: 'a woman',
    keluarga: 'a family',
    berdua: 'a couple (a man and a woman)'
  };

  const promptsByCategory = {
    barang: (
        modelOption: ItemModelOption,
        look: ItemLookOption
    ) => {
        const lookDetails: Record<ItemLookOption, { description: string; subject: string; setting: string }> = {
            casual: {
                description: "in a casual, everyday style",
                subject: 'a model',
                setting: 'in a natural, relaxed setting'
            },
            formal: {
                description: "in a formal, elegant style",
                subject: 'a model',
                setting: 'in a sophisticated studio or indoor location'
            },
            outdoor: {
                description: "being used outdoors",
                subject: 'a model',
                setting: 'in a beautiful natural landscape with great lighting'
            },
            indoor: {
                description: "in a professional indoor/studio setting",
                subject: 'a model',
                setting: 'with clean, controlled lighting'
            },
            lifestyle: {
                description: "in a candid lifestyle scene",
                subject: 'a model or user',
                setting: 'in a realistic environment like a home or city street'
            },
            family: {
                description: "as part of a warm, family moment",
                subject: 'a family or a group',
                setting: 'in a cozy, inviting setting'
            },
            trendy: {
                description: "with a trendy, high-fashion look",
                subject: 'a fashion model',
                setting: 'in a stylish, urban or studio environment'
            },
            cafe: {
                description: "in a stylish, instagramable cafe",
                subject: 'a person',
                setting: 'with aesthetic lighting and decor'
            }
        };

        const selectedLook = lookDetails[look];

        if (modelOption === 'with_custom_model') {
            return [
                {
                    label: `Option 1: Custom Model - Professional`,
                    value: `Using the second image provided as the model, place the item from the first image onto them. The final composition should be a professional photograph ${selectedLook.description}, taken ${selectedLook.setting}. The lighting should be flattering, matching the scene and highlighting the product.`
                },
                {
                    label: `Option 2: Custom Model - Candid`,
                    value: `Using the second image provided as the model, realistically place the item from the first image onto them. Create an environmental portrait that looks like it's being used naturally by the person in the second image, ${selectedLook.setting}. The photo should have a candid feel, telling a story about the product in daily life.`
                }
            ];
        }

        if (modelOption === 'none') {
            return [
                {
                    label: "Option 1: Flat Lay",
                    value: "in a beautifully composed flat lay on a simple wooden background with natural light"
                },
                {
                    label: "Option 2: Still Life",
                    value: "as the centerpiece of a beautiful still life composition, surrounded by elegant, thematic props. The lighting is soft and luxurious."
                }
            ];
        }
        
        // Default to 'with_model'
        return [
            {
                label: `Option 1: Professional Look`,
                value: `a professional photograph of the item ${selectedLook.description}, used by ${selectedLook.subject}. The photo is taken ${selectedLook.setting}. The lighting is flattering and highlights the product.`
            },
            {
                label: `Option 2: Candid Moment`,
                value: `an environmental portrait of the item in a realistic scene. It's being used naturally by ${selectedLook.subject} ${selectedLook.setting}. The photo has a candid feel, telling a story about the product in daily life.`
            }
        ];
    },
    orang: (clothing: ClothingOption, gender: GenderOption) => {
      const subject = genderMap[gender];
      const style = (gender === 'keluarga' || gender === 'berdua') ? 'photo' : 'portrait';

      return [
          {
              label: `Option 1: Studio Photo (${clothing})`,
              value: `a professional studio ${style} of ${subject} with a clean, blurred background and soft, flattering studio lighting, wearing ${clothing} attire`
          },
          {
              label: `Option 2: Outdoor Photo (${clothing})`,
              value: `a candid outdoor ${style} of ${subject} in a natural setting, with beautiful bokeh and warm, golden hour light, wearing ${clothing} attire`
          }
      ]
    }
  };
  
  const currentPrompts = editCategory === 'barang' 
    ? promptsByCategory.barang(itemModelOption, itemLook) 
    : promptsByCategory.orang(clothingOption, genderOption);

  const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setEditedImages([]);
      try {
        const base64 = await fileToBase64(file);
        setOriginalImage({
          base64,
          mimeType: file.type,
          name: file.name
        });
      } catch (err) {
        setError("Failed to process image file. Please try another one.");
        setOriginalImage(null);
      }
    }
  }, []);

  const handleCustomModelImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      try {
        const base64 = await fileToBase64(file);
        setCustomModelImage({
          base64,
          mimeType: file.type,
          name: file.name
        });
      } catch (err) {
        setError("Failed to process custom model image file. Please try another one.");
        setCustomModelImage(null);
      }
    }
  }, []);

  const handleGenerateAllSuggestions = useCallback(async () => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }
    if (itemModelOption === 'with_custom_model' && !customModelImage) {
        setError("Please upload a custom model image.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImages([]);
    
    const promptsToGenerate = currentPrompts;

    try {
      const generationPromises = promptsToGenerate.map(p => 
        editImageWithPrompt(
          { base64: originalImage.base64, mimeType: originalImage.mimeType },
          p.value,
          itemModelOption === 'with_custom_model' && customModelImage ? customModelImage : undefined
        )
      );
      
      const results = await Promise.all(generationPromises);

      const finalResults = results.map((res, i) => ({
        ...res,
        title: promptsToGenerate[i].label,
      }));

      setEditedImages(finalResults);

    } catch (err) {
        const errorMessage = typeof err === 'string' ? err : 'An unexpected error occurred during generation.';
        setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, customModelImage, itemModelOption, currentPrompts]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setEditCategory(e.target.value as 'barang' | 'orang');
      setItemModelOption('none');
      setCustomModelImage(null);
  };

  const handleItemModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemModelOption(e.target.value as ItemModelOption);
      if (e.target.value !== 'with_custom_model') {
        setCustomModelImage(null);
      }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Controls & Original Image */}
          <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-gray-200">1. Upload your Image</h2>
            <div className="relative w-full">
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isLoading}
                />
                <label 
                    htmlFor="file-upload" 
                    className={`flex flex-col items-center justify-center w-full h-32 px-4 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isLoading ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:border-purple-400'}`}
                >
                    <UploadIcon className="w-8 h-8 mb-2" />
                    <span>{originalImage ? `Selected: ${originalImage.name}` : 'Click to choose a file'}</span>
                    <span className="text-xs text-gray-500">PNG, JPG, WEBP, etc.</span>
                </label>
            </div>
            {originalImage && (
              <>
                <ImageDisplay title="Original Image" imageSrc={`data:${originalImage.mimeType};base64,${originalImage.base64}`} />
                <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-bold text-gray-200">2. Generate Edits</h2>
                  
                   <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="category-select" className="font-semibold text-gray-300">Choose edit type:</label>
                            <select
                                id="category-select"
                                value={editCategory}
                                onChange={handleCategoryChange}
                                disabled={isLoading}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                            >
                                <option value="barang">Barang (Item)</option>
                                <option value="orang">Orang (Person)</option>
                            </select>
                        </div>
                        {editCategory === 'barang' && (
                           <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                  <label htmlFor="model-select" className="font-semibold text-gray-300">Choose model option:</label>
                                  <select
                                      id="model-select"
                                      value={itemModelOption}
                                      onChange={handleItemModelChange}
                                      disabled={isLoading}
                                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                                  >
                                      <option value="none">Tidak Menggunakan Model (No Model)</option>
                                      <option value="with_model">Gunakan Model (Use Model)</option>
                                      <option value="with_custom_model">Gunakan Model Kustom (Custom Model)</option>
                                  </select>
                                </div>
                                {itemModelOption === 'with_custom_model' && (
                                  <div className="flex flex-col gap-2 p-3 bg-gray-700/50 rounded-md border border-gray-600">
                                      <label className="font-semibold text-gray-300">Upload Custom Model Image:</label>
                                      <div className="relative w-full">
                                          <input
                                              type="file"
                                              id="custom-model-upload"
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                              accept="image/*"
                                              onChange={handleCustomModelImageUpload}
                                              disabled={isLoading}
                                          />
                                          <label 
                                              htmlFor="custom-model-upload" 
                                              className={`flex flex-col items-center justify-center w-full h-24 px-4 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isLoading ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-700/50 border-gray-500 text-gray-400 hover:bg-gray-600 hover:border-purple-500'}`}
                                          >
                                              <UploadIcon className="w-6 h-6 mb-1" />
                                              <span className="text-sm">{customModelImage ? `Selected: ${customModelImage.name}` : 'Click to choose model'}</span>
                                          </label>
                                      </div>
                                      {customModelImage && (
                                          <div className="mt-2">
                                               <ImageDisplay title="Custom Model Preview" imageSrc={`data:${customModelImage.mimeType};base64,${customModelImage.base64}`} />
                                          </div>
                                      )}
                                  </div>
                                )}
                            </div>
                        )}
                        {editCategory === 'barang' && (itemModelOption === 'with_model' || itemModelOption === 'with_custom_model') && (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="look-select" className="font-semibold text-gray-300">Gaya (Style):</label>
                                <select
                                    id="look-select"
                                    value={itemLook}
                                    onChange={(e) => setItemLook(e.target.value as ItemLookOption)}
                                    disabled={isLoading}
                                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                                >
                                    <option value="casual">Kasual/sehari-hari</option>
                                    <option value="formal">Formal/elegan</option>
                                    <option value="trendy">Trendy/fashion look</option>
                                    <option value="outdoor">Outdoor</option>
                                    <option value="indoor">Indoor/studio</option>
                                    <option value="cafe">Cafe/instagramable</option>
                                    <option value="lifestyle">Lifestyle</option>
                                    <option value="family">Keluarga/group</option>
                                </select>
                            </div>
                        )}
                        {editCategory === 'orang' && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="gender-select" className="font-semibold text-gray-300">Choose subject:</label>
                                    <select
                                        id="gender-select"
                                        value={genderOption}
                                        onChange={(e) => setGenderOption(e.target.value as GenderOption)}
                                        disabled={isLoading}
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                                    >
                                        <option value="pria">Pria (Man)</option>
                                        <option value="wanita">Wanita (Woman)</option>
                                        <option value="keluarga">Keluarga (Family)</option>
                                        <option value="berdua">Berdua (Couple)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="clothing-select" className="font-semibold text-gray-300">Choose clothing style:</label>
                                    <select
                                        id="clothing-select"
                                        value={clothingOption}
                                        onChange={(e) => setClothingOption(e.target.value as ClothingOption)}
                                        disabled={isLoading}
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                                    >
                                        <option value="casual">Casual</option>
                                        <option value="formal">Formal</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                   <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <p className="text-gray-300 mb-3 font-semibold">The following suggested edits will be generated:</p>
                      <ul className="list-disc list-inside text-gray-400 space-y-2 text-sm">
                        {currentPrompts.map(p => <li key={p.label}><strong>{p.label}:</strong> "{p.value}"</li>)}
                      </ul>
                    </div>
                  <button
                    onClick={handleGenerateAllSuggestions}
                    disabled={isLoading || !originalImage || (itemModelOption === 'with_custom_model' && !customModelImage)}
                    className="w-full py-3 px-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {isLoading ? 'Generating All...' : 'Generate All Suggestions'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Edited Image */}
          <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-lg border border-gray-700">
             <h2 className="text-2xl font-bold text-gray-200">3. View Results</h2>
             {error && (
                <div className="p-4 mb-4 text-sm text-red-300 bg-red-900/50 rounded-lg border border-red-500" role="alert">
                    <span className="font-bold">Error:</span> {error}
                </div>
             )}
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-gray-800">
                <ImageDisplay title="Generating suggestions..." imageSrc={null} isLoading={true} />
              </div>
            )}
            
            {!isLoading && editedImages.length === 0 && (
              <div className="aspect-square w-full rounded-lg bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
                <p className="text-center text-gray-500 p-4">Your generated images will appear here.</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-8">
              {!isLoading && editedImages.map((result, index) => (
                <ImageDisplay 
                  key={index} 
                  title={result.title} 
                  imageSrc={result.imageUrl} 
                />
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
