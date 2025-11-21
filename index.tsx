
import { GoogleGenAI, Modality } from "@google/genai";

// --- Sidebar Toggle Script ---
const mobileMenuButton = document.getElementById('mobile-menu-button') as HTMLButtonElement;
const sidebar = document.getElementById('sidebar') as HTMLElement;

if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });
}


// --- Page Navigation Script ---
const navProductBtn = document.getElementById('nav-product-btn') as HTMLAnchorElement;
const navModelBtn = document.getElementById('nav-model-btn') as HTMLAnchorElement;
const navPasPhotoBtn = document.getElementById('nav-pas-photo-btn') as HTMLAnchorElement;
const navTravelBtn = document.getElementById('nav-travel-btn') as HTMLAnchorElement;
const navPreweddingBtn = document.getElementById('nav-prewedding-btn') as HTMLAnchorElement;
const navRestorationBtn = document.getElementById('nav-restoration-btn') as HTMLAnchorElement;
const productPage = document.getElementById('product-generator-page') as HTMLElement;
const modelPage = document.getElementById('model-generator-page') as HTMLElement;
const pasPhotoPage = document.getElementById('pas-photo-generator-page') as HTMLElement;
const travelPage = document.getElementById('travel-generator-page') as HTMLElement;
const preweddingPage = document.getElementById('prewedding-generator-page') as HTMLElement;
const digitalRestorationPage = document.getElementById('digital-restoration-page') as HTMLElement;


function setActiveNav(activeBtn: HTMLAnchorElement) {
    const allBtns = [navProductBtn, navModelBtn, navPasPhotoBtn, navTravelBtn, navPreweddingBtn, navRestorationBtn];
    allBtns.forEach(btn => {
        if(btn) {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('hover:bg-slate-800');
        }
    });
    if(activeBtn) {
        activeBtn.classList.add('bg-indigo-600', 'text-white');
        activeBtn.classList.remove('hover:bg-slate-800');
    }
}

function showPage(pageToShow: HTMLElement) {
    const allPages = [productPage, modelPage, pasPhotoPage, travelPage, preweddingPage, digitalRestorationPage];
    allPages.forEach(page => {
        if(page) page.classList.add('hidden');
    });
    if(pageToShow) pageToShow.classList.remove('hidden');
}


if (navProductBtn) {
    navProductBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(productPage);
        setActiveNav(navProductBtn);
    });
}

if (navModelBtn) {
    navModelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(modelPage);
        setActiveNav(navModelBtn);
    });
}

if (navPasPhotoBtn) {
    navPasPhotoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(pasPhotoPage);
        setActiveNav(navPasPhotoBtn);
    });
}

if (navTravelBtn) {
    navTravelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(travelPage);
        setActiveNav(navTravelBtn);
    });
}

if (navPreweddingBtn) {
    navPreweddingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(preweddingPage);
        setActiveNav(navPreweddingBtn);
    });
}

if (navRestorationBtn) {
    navRestorationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(digitalRestorationPage);
        setActiveNav(navRestorationBtn);
    });
}


// --- SHARED SCRIPT ---
let productBase64: string | null = null;
let modelBase64: string | null = null;
let modelPageBase64: string | null = null;
let pasPhotoBase64: string | null = null;

const imagePreviewModal = document.getElementById('image-preview-modal') as HTMLElement;
const modalImage = document.getElementById('modal-image') as HTMLImageElement;
const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;

function setupFileUploader(inputId: string, previewId: string, promptId: string, callback: (base64: string, fileType: string) => void) {
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    const previewEl = document.getElementById(previewId) as HTMLImageElement;
                    if(previewEl) {
                        previewEl.src = result;
                        previewEl.classList.remove('hidden');
                    }
                    const promptEl = document.getElementById(promptId);
                    if(promptEl) {
                        promptEl.classList.add('hidden');
                    }
                    
                    const base64 = result.split(',')[1];
                    callback(base64, file.type);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function showImagePreview(imageUrl: string) {
    if(modalImage) modalImage.src = imageUrl;
    if(imagePreviewModal) imagePreviewModal.classList.remove('hidden');
}

function hideImagePreview() {
    if(imagePreviewModal) imagePreviewModal.classList.add('hidden');
    if(modalImage) modalImage.src = ''; 
}

if (closeModalBtn) closeModalBtn.addEventListener('click', hideImagePreview);
if (imagePreviewModal) {
    imagePreviewModal.addEventListener('click', (e) => {
        if (e.target === imagePreviewModal) {
            hideImagePreview();
        }
    });
}


function showModal(message: string) {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center animate-fade-in';
    const modalText = document.createElement('p');
    modalText.className = 'text-slate-700 mb-4';
    modalText.textContent = message;
    const closeButton = document.createElement('button');
    closeButton.className = 'bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200';
    closeButton.textContent = 'OK';
    closeButton.onclick = () => {
        document.body.removeChild(modalBackdrop);
    };
    modalContent.appendChild(modalText);
    modalContent.appendChild(closeButton);
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
}

async function generateImage(parts: any[]) {
    // Lazy initialization of the AI client to prevent script crash on load
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let attempt = 0;
    const maxAttempts = 5;
    let delay = 1000;
    while (attempt < maxAttempts) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: parts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            if (!response.candidates || response.candidates.length === 0) {
                if (response.promptFeedback?.blockReason) {
                    const reason = response.promptFeedback.blockReason;
                    const message = response.promptFeedback.blockReasonMessage || 'No additional details provided.';
                    throw new Error(`Image generation was blocked. Reason: ${reason}. Details: ${message}`);
                }
                throw new Error("API response was empty or blocked for an unknown reason.");
            }

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    return `data:${mimeType};base64,${base64ImageBytes}`;
                }
            }
            throw new Error("API response did not contain image data in the first candidate.");
        } catch (error: any) {
            console.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
            attempt++;
            if (attempt >= maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    throw new Error("Failed to generate image after multiple attempts.");
}

async function downloadAllImages(imageUrls: string[], prefix: string) {
    for (let i = 0; i < imageUrls.length; i++) {
        const link = document.createElement('a');
        link.href = imageUrls[i];
        link.download = `${prefix}_${i + 1}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Small delay to ensure browser handles multiple downloads correctly
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}

// --- PRODUCT GENERATOR SCRIPT ---
const productForm = document.getElementById('generation-form') as HTMLFormElement;
if (productForm) {
    // --- DOM Elements ---
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    const btnText = document.getElementById('btn-text') as HTMLSpanElement;
    const btnSpinner = document.getElementById('btn-spinner') as HTMLElement;
    const resultsPlaceholder = document.getElementById('results-placeholder') as HTMLElement;
    const resultsLoader = document.getElementById('results-loader') as HTMLElement;
    const resultsGrid = document.getElementById('results-grid') as HTMLElement;
    const errorMessage = document.getElementById('error-message') as HTMLElement;
    const errorDetails = document.getElementById('error-details') as HTMLElement;
    const resultsLoaderText = resultsLoader ? resultsLoader.querySelector('p') : null;
    const downloadAllBtn = document.getElementById('product-download-all-btn') as HTMLButtonElement;

    const customPromptCheckbox = document.getElementById('custom-prompt-checkbox') as HTMLInputElement;
    const customPromptContainer = document.getElementById('custom-prompt-container') as HTMLElement;
    const guidedOptions = document.getElementById('guided-options') as HTMLFieldSetElement;

    const uploadTypeSelect = document.getElementById('upload-type') as HTMLSelectElement;
    const productNameContainer = document.getElementById('product-name-container') as HTMLElement;

    const withoutModelCheckbox = document.getElementById('without-model') as HTMLInputElement;
    const lightingContainer = document.getElementById('lighting-container') as HTMLElement;
    const modelSourceContainer = document.getElementById('model-source-container') as HTMLElement;
    const generateModelRadio = document.getElementById('generate-model-radio') as HTMLInputElement;
    const uploadModelRadio = document.getElementById('upload-model-radio') as HTMLInputElement;
    
    const uploadModelSection = document.getElementById('upload-model-section') as HTMLElement;
    const modelOptionsGenerate = document.getElementById('model-options-generate') as HTMLElement;
    const sharedModelOptions = document.getElementById('shared-model-options') as HTMLElement;

    const interactionTypeSelect = document.getElementById('interaction-type') as HTMLSelectElement;
    const customInteractionContainer = document.getElementById('custom-interaction-container') as HTMLElement;

    const ageRangeSelect = document.getElementById('age-range') as HTMLSelectElement;
    const customAgeContainer = document.getElementById('custom-age-container') as HTMLElement;
    
    const imageCountSelect = document.getElementById('image-count') as HTMLSelectElement;

    let productMimeType = "image/png";
    let modelMimeType = "image/jpeg";

    const studioVariations = [
        "in a beautifully composed flat lay on a simple wooden background with natural light.",
        "as the centerpiece of a beautiful still life composition, surrounded by elegant, thematic props. The lighting is soft and luxurious.",
        "on a textured surface like marble or stone, with complementary decorative elements arranged artfully around it. Natural, beautiful lighting.",
        "in a minimalist and clean composition, placed next to one or two carefully selected props that hint at its use or origin. The background is a soft, neutral color.",
        "in a vibrant and dynamic shot, utilizing movement or floating elements to convey action and freshness. Bright, commercial lighting.",
        "in a rustic and natural scene, set against a background like linen or rough stone, accompanied by organic elements like leaves or raw ingredients. Warm, gentle lighting.",
        "in a luxurious and dark moody photograph, set on a dark surface with dramatic backlighting that highlights its texture.",
        "in a clean, top-down shot (flat lay) on a vibrant colored background, with minimal geometric props.",
        "floating in a clean, white void, lit by professional studio lights to emphasize form and shadow.",
        "on a reflective black surface, creating a mirror effect, lit with intense, focused light.",
        "in an exploded view, with components suspended artfully against a simple background.",
        "set against a backdrop of soft, blurred bokeh lights in an indoor environment.",
        "under harsh, dramatic lighting to emphasize texture and material, on a plain cement slab.",
        "in a wet environment, with water droplets and mist, suggesting freshness and cooling.",
        "placed inside an open, elegant wooden box, suggesting a premium unboxing experience.",
        "set against a soft, textile backdrop (like velvet or silk) with complementary folds.",
        "in a symmetrical, highly organized composition with matching items.",
        "in a messy, creative environment, hinting at the creation process or raw materials.",
        "shot with macro focus to highlight surface details and textures.",
        "on a pedestal with a spotlight, emphasizing its importance and quality.",
        "in a modern kitchen setting on a sleek countertop.",
        "on a worn, painted surface with peeling paint for a vintage look.",
        "under a strong light source creating long, deep shadows.",
        "surrounded by smoke or fog for a mysterious, dramatic effect.",
        "against a background that suggests a specific geographic location (e.g., desert sand, tropical wood).",
        "in a close-up shot showing how it interacts with an element (e.g., liquid being poured).",
        "on a minimalist metallic surface, reflecting high technology or precision.",
        "wrapped partially in translucent paper or fabric, creating curiosity.",
        "in a monochromatic color scheme, where only the product provides a different color.",
        "displayed on a colorful geometric background with sharp lines.",
        "in a beautifully lit antique setting, suggesting timeless value.",
        "set outdoors in golden hour light on a clean, simple foreground.",
    ];

    setupFileUploader('product-upload', 'image-preview', 'upload-prompt', (base64, fileType) => {
        productBase64 = base64;
        productMimeType = fileType;
    });

    setupFileUploader('model-upload', 'model-image-preview', 'model-upload-prompt', (base64, fileType) => {
        modelBase64 = base64;
        modelMimeType = fileType;
    });

    function updateCustomizationView() {
        if (!customPromptCheckbox || !guidedOptions || !customPromptContainer || !withoutModelCheckbox || !productNameContainer || !uploadTypeSelect || !lightingContainer || !sharedModelOptions || !modelSourceContainer || !uploadModelSection || !modelOptionsGenerate || !interactionTypeSelect || !customInteractionContainer || !ageRangeSelect || !customAgeContainer) return;
        
        const useCustomPrompt = customPromptCheckbox.checked;
        guidedOptions.disabled = useCustomPrompt;
        guidedOptions.style.opacity = useCustomPrompt ? '0.5' : '1';
        customPromptContainer.style.display = useCustomPrompt ? 'block' : 'none';

        if (useCustomPrompt) return;

        const isWithoutModel = withoutModelCheckbox.checked;
        const modelSource = (document.querySelector('input[name="model-source"]:checked') as HTMLInputElement)?.value;
        const uploadType = uploadTypeSelect.value;
        
        productNameContainer.style.display = uploadType === 'fabric' ? 'block' : 'none';
        
        lightingContainer.style.display = isWithoutModel ? 'block' : 'none';
        sharedModelOptions.style.display = isWithoutModel ? 'none' : 'block';
        modelSourceContainer.style.display = isWithoutModel ? 'none' : 'flex';

        uploadModelSection.style.display = (!isWithoutModel && modelSource === 'upload') ? 'block' : 'none';
        modelOptionsGenerate.style.display = (!isWithoutModel && modelSource === 'generate') ? 'block' : 'none';
    
        const interactionType = interactionTypeSelect.value;
        customInteractionContainer.style.display = interactionType === 'custom' && !isWithoutModel ? 'block' : 'none';

        const ageRange = ageRangeSelect.value;
        customAgeContainer.style.display = ageRange === 'custom' && !isWithoutModel && modelSource === 'generate' ? 'block' : 'none';
    }
    
    [customPromptCheckbox, uploadTypeSelect, withoutModelCheckbox, generateModelRadio, uploadModelRadio, interactionTypeSelect, ageRangeSelect].forEach(el => {
        if(el) el.addEventListener('change', updateCustomizationView);
    });

    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!productBase64) {
            showModal('Harap unggah gambar produk terlebih dahulu.');
            return;
        }

        setLoadingState(true);

        const useCustomPrompt = customPromptCheckbox.checked;
        const customPromptValue = (document.getElementById('custom-prompt-input') as HTMLTextAreaElement).value.trim();
        const NUM_IMAGES = parseInt(imageCountSelect.value, 10);
        
        const generatedImages: string[] = [];

        try {
            for (let i = 0; i < NUM_IMAGES; i++) {
                if (resultsLoaderText) {
                    resultsLoaderText.textContent = `Menghasilkan gambar... ini mungkin memakan waktu yang sangat lama.`;
                }

                let prompt;
                let parts: any[] = [];

                if (useCustomPrompt) {
                    if (!customPromptValue) {
                        throw new Error('Harap isi prompt kustom Anda.');
                    }
                    prompt = customPromptValue;
                    
                    const modelSource = (document.querySelector('input[name="model-source"]:checked') as HTMLInputElement).value;
                    const isWithoutModel = withoutModelCheckbox.checked;

                    if (!isWithoutModel && modelSource === 'upload' && modelBase64) {
                        parts = [
                            { text: prompt },
                            { inlineData: { mimeType: modelMimeType, data: modelBase64 } },
                            { inlineData: { mimeType: productMimeType, data: productBase64 } }
                        ];
                    } else {
                        parts = [
                            { text: prompt },
                            { inlineData: { mimeType: productMimeType, data: productBase64 } }
                        ];
                    }

                } else {
                    const uploadType = uploadTypeSelect.value;
                    const productName = (document.getElementById('product-name') as HTMLInputElement).value.trim();
                    const productDescription = (document.getElementById('product-description') as HTMLInputElement).value.trim();
                    
                    if (uploadType === 'fabric' && !productName) {
                         throw new Error('Harap isi Nama Produk Jadi saat mengunggah bahan/kain.');
                    }

                    const withoutModel = withoutModelCheckbox.checked;
                    const modelSource = (document.querySelector('input[name="model-source"]:checked') as HTMLInputElement).value;

                    if (!withoutModel && modelSource === 'upload' && !modelBase64) {
                        throw new Error('Harap unggah foto model terlebih dahulu.');
                    }
                    
                    const textPreservationPrompt = " HIGHEST PRIORITY: The most critical instruction is to preserve all text, labels, stickers, and logos on the uploaded product with 100% perfect accuracy. DO NOT CHANGE, GUESS, OR GENERATE ANY TEXT. Replicate the text from the original image exactly as it is, character for character."
                    let productContext = productDescription ? `, which is a ${productDescription}` : '';
                    
                    const isLiquidProduct = productDescription.toLowerCase().includes('minuman') || productDescription.toLowerCase().includes('kopi') || productDescription.toLowerCase().includes('jus') || productDescription.toLowerCase().includes('teh');
                    let liquidEnhancement = "";
                    
                    if (isLiquidProduct) {
                         if (!withoutModel && (document.getElementById('interaction-type') as HTMLSelectElement).value === 'holding') {
                            liquidEnhancement = " The image must clearly show dynamic elements like **water splash, melting ice, condensation, or cool mist** to suggest coldness and freshness. ";
                         } else if (withoutModel) {
                            liquidEnhancement = " The product is cold, emphasize **condensation or cool mist** in the lighting and background. ";
                         }
                    } 

                    if (withoutModel) {
                        let lightingPrompt = '';
                        const lighting = (document.getElementById('lighting-select') as HTMLSelectElement).value;
                        lightingPrompt = lighting === 'dark'
                            ? " The scene has dramatic, moody, low-key lighting with deep shadows."
                            : " The scene has bright, airy, high-key lighting with soft shadows.";
                        
                        if (uploadType === 'fabric') {
                            prompt = `Professional studio product-only photography of a newly created ${productName}${productContext}, displayed neatly (e.g., folded, on a hanger, or on a mannequin).${lightingPrompt} This new ${productName} must be made using the texture, pattern, and colors from the provided fabric image. The product should be presented cleanly on a minimalist background. It is absolutely essential that the pattern from the uploaded image is perfectly and accurately applied to the new product.`;
                            parts = [ { text: prompt }, { inlineData: { mimeType: productMimeType, data: productBase64! } } ];
                        } else {
                            prompt = `Professional photography, creating a stunning visual scene. The provided item${productContext} is the main focus, presented ${studioVariations[i % studioVariations.length]}${liquidEnhancement}${lightingPrompt}.${textPreservationPrompt}`;
                            parts = [ { text: prompt }, { inlineData: { mimeType: productMimeType, data: productBase64! } } ];
                        }
                    } else { // With model
                        const photoStyle = (document.getElementById('photo-style') as HTMLSelectElement).value;
                        const clothingAttributes = (document.getElementById('clothing-attributes') as HTMLSelectElement).value;
                        const additionalAttributes = (document.getElementById('additional-attributes') as HTMLSelectElement).value;
                        const interactionType = (document.getElementById('interaction-type') as HTMLSelectElement).value;
                        const focusLevel = (document.getElementById('focus-level') as HTMLSelectElement).value;
                        const modelPose = (document.getElementById('model-pose') as HTMLSelectElement).value;

                        let fullClothingDesc = clothingAttributes;
                        if (additionalAttributes) {
                            fullClothingDesc += `, ${additionalAttributes}`;
                        }

                        let finalActionPhrase;
                        if (uploadType === 'fabric') {
                            finalActionPhrase = `is wearing a newly created ${productName}${productContext}. This new ${productName} must be made using the texture, pattern, and colors from the provided fabric image.`;
                        } else { 
                            switch (interactionType) {
                                case 'wearing': finalActionPhrase = `is wearing the provided item${productContext} naturally.`; break;
                                case 'holding':
                                    const poseVariations = ["holding", "presenting", "showcasing", "interacting with"];
                                    finalActionPhrase = `is ${poseVariations[i % poseVariations.length]} the provided item${productContext}.`;
                                    break;
                                case 'none':
                                    const noInteractionPoses = ["posing near", "standing next to", "showcased with"];
                                    finalActionPhrase = `is ${noInteractionPoses[i % noInteractionPoses.length]} the provided item${productContext}, but not touching it.`;
                                    break;
                                case 'custom':
                                    const customInteraction = (document.getElementById('custom-interaction-input') as HTMLInputElement).value.trim();
                                    if (!customInteraction) {
                                        throw new Error('Harap isi deskripsi interaksi kustom Anda.');
                                    }
                                    finalActionPhrase = `${customInteraction} the provided item${productContext}.`;
                                    break;
                                default: finalActionPhrase = `is holding the provided item${productContext}.`;
                            }
                        }

                        if (modelSource === 'upload') {
                            prompt = `Take the provided photo of a person (first image). The person ${finalActionPhrase}. The person should also be styled with these attributes: ${fullClothingDesc}. The model should be in a ${modelPose} pose. The overall photo style should be transformed to: ${photoStyle}. The final image should be framed as a ${focusLevel}, with the main focus on the product. Match the lighting, shadows, and perspective perfectly. It is absolutely critical that the person's face in the final image is an exact, 100% perfect, and identical match to the face in the uploaded model photo—do not alter their facial features in any way whatsoever.${liquidEnhancement} ${textPreservationPrompt}`;
                            parts = [
                                { text: prompt },
                                { inlineData: { mimeType: modelMimeType, data: modelBase64! } },
                                { inlineData: { mimeType: productMimeType, data: productBase64! } }
                            ];
                        } else { // generate model
                            const gender = (document.getElementById('gender') as HTMLSelectElement).value;
                            const ethnicity = (document.getElementById('ethnicity') as HTMLSelectElement).value;
                            let ageRange = (document.getElementById('age-range') as HTMLSelectElement).value;

                            if (ageRange === 'custom') {
                                ageRange = (document.getElementById('custom-age-input') as HTMLInputElement).value.trim();
                                if (!ageRange) {
                                    throw new Error('Harap isi rentang usia kustom Anda.');
                                }
                            }

                            prompt = `Professional product showcase photo. A ${gender} of ${ethnicity} ethnicity, in the ${ageRange} age range, ${fullClothingDesc}, in a ${modelPose} pose. The model ${finalActionPhrase} The style is: ${photoStyle}. The photograph should be a ${focusLevel}, with the main focus on the product.${liquidEnhancement} ${textPreservationPrompt}`;
                            parts = [
                                { text: prompt },
                                { inlineData: { mimeType: productMimeType, data: productBase64! } }
                            ];
                        }
                    }
                }
                const result = await generateImage(parts);
                if (result) {
                    generatedImages.push(result);
                }
            }
            displayResults(generatedImages);
        } catch (error: any) {
            console.error("Error generating images:", error);
            if (generatedImages.length > 0) {
                displayResults(generatedImages);
            }
            showErrorState(error.message);
        } finally {
            setLoadingState(false);
            if (resultsLoaderText) {
                resultsLoaderText.textContent = `Menghasilkan gambar... ini mungkin memakan waktu yang sangat lama.`;
            }
        }
    });


    function displayResults(images: string[]) {
        if (!resultsGrid || !resultsPlaceholder) return;
        resultsGrid.innerHTML = '';
        if (images.length > 0) {
            resultsPlaceholder.classList.add('hidden');
            
            if (downloadAllBtn) {
                downloadAllBtn.classList.remove('hidden');
                downloadAllBtn.onclick = () => downloadAllImages(images, 'product_showcase');
            }
            
            images.forEach(imageUrl => {
                const container = document.createElement('div');
                container.className = 'relative group bg-slate-100 rounded-lg flex items-center justify-center aspect-square';

                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = "Generated Showcase Image";
                img.className = "w-full h-full object-contain rounded-lg animate-fade-in";
                
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity';

                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
                previewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
                previewBtn.onclick = () => showImagePreview(imageUrl);

                const downloadLink = document.createElement('a');
                downloadLink.href = imageUrl;
                downloadLink.download = `product_showcase_${Date.now()}.png`;
                downloadLink.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
                downloadLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>`;
                
                buttonContainer.appendChild(previewBtn);
                buttonContainer.appendChild(downloadLink);
                
                container.appendChild(img);
                container.appendChild(buttonContainer);
                resultsGrid.appendChild(container);
            });
            resultsGrid.classList.remove('hidden');
        } else {
            resultsPlaceholder.classList.remove('hidden');
            if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
    }

    function setLoadingState(isLoading: boolean) {
        if (!generateBtn || !btnText || !btnSpinner || !errorMessage || !resultsLoader || !resultsGrid || !resultsPlaceholder) return;
        
        generateBtn.disabled = isLoading;
        btnText.style.display = isLoading ? 'none' : 'inline';
        btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
        
        if (isLoading) {
            resultsPlaceholder.classList.add('hidden');
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
        
        errorMessage.classList.add('hidden');
        if (!isLoading) {
            resultsLoader.classList.add('hidden');
        } else {
            resultsGrid.classList.add('hidden');
            resultsLoader.classList.remove('hidden');
        }
    }
    
    function showErrorState(message: string) {
        if (!resultsPlaceholder || !resultsLoader || !resultsGrid || !errorMessage || !errorDetails) return;
        
         resultsPlaceholder.classList.add('hidden');
         resultsLoader.classList.add('hidden');
         // Don't hide the grid if there are partial results
         if (resultsGrid.children.length === 0) {
            resultsGrid.classList.add('hidden');
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
         }
         errorMessage.classList.remove('hidden');
         errorDetails.textContent = message;
    }
    
    updateCustomizationView();
}


// --- MODEL GENERATOR SCRIPT ---
const modelForm = document.getElementById('model-generation-form') as HTMLFormElement;
if (modelForm) {
    const generateBtn = document.getElementById('model-page-generate-btn') as HTMLButtonElement;
    const statusContainer = document.getElementById('model-page-status') as HTMLElement;
    const outputContainer = document.getElementById('model-page-output-container') as HTMLElement;
    const imageCountSelect = document.getElementById('model-image-count') as HTMLSelectElement;
    const downloadAllBtn = document.getElementById('model-download-all-btn') as HTMLButtonElement;

    let modelPageMimeType = "image/jpeg";

    setupFileUploader('model-page-upload-input', 'model-page-image-preview', 'model-page-upload-prompt', (base64, fileType) => {
        modelPageBase64 = base64;
        modelPageMimeType = fileType;
    });

    modelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!modelPageBase64) {
            showModal('Harap unggah foto model terlebih dahulu.');
            return;
        }
        
        const imageCount = parseInt(imageCountSelect.value, 10);
        setModelLoadingState(true, `Menghasilkan foto model...`);

        const photoType = (document.getElementById('model-photo-type') as HTMLSelectElement).value;
        const pose = (document.getElementById('model-page-pose') as HTMLSelectElement).value;
        const clothing = (document.getElementById('model-page-clothing') as HTMLSelectElement).value;
        const focus = (document.getElementById('model-page-focus') as HTMLSelectElement).value;
        
        const prompt = `A ${photoType} of the person in the provided image. They should be in a ${pose} pose, ${clothing}. The photo must be a ${focus}. The final image should have the exact same facial features as the original image.`;

        const parts = [
            { text: prompt },
            { inlineData: { mimeType: modelPageMimeType, data: modelPageBase64! } }
        ];

        const generatedImages: string[] = [];
        try {
            for (let i = 0; i < imageCount; i++) {
                setModelLoadingState(true, `Menghasilkan foto model...`);
                const result = await generateImage(parts);
                if (result) {
                    generatedImages.push(result);
                }
            }
            displayModelResults(generatedImages);
        } catch (error: any) {
            console.error("Error generating model images:", error);
            setModelLoadingState(true, `Error: ${error.message}`);
             if (generatedImages.length > 0) {
                displayModelResults(generatedImages); // Show partial results
             }
        }
    });

    function setModelLoadingState(isLoading: boolean, message: string) {
        if (!generateBtn || !statusContainer || !outputContainer) return;

        generateBtn.disabled = isLoading;
        if (isLoading) {
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
            statusContainer.innerHTML = `
                <div class="text-center text-slate-600">
                     <div class="spinner w-12 h-12 mx-auto rounded-full border-4 border-slate-300"></div>
                     <p class="mt-4 text-lg">${message}</p>
                </div>`;
            statusContainer.classList.remove('hidden');
            outputContainer.classList.add('hidden');
            if (!message.toLowerCase().includes('error')) {
                outputContainer.innerHTML = '';
            }
        } else {
             statusContainer.classList.add('hidden');
             outputContainer.classList.remove('hidden');
        }
    }

    function displayModelResults(images: string[]) {
        if(!outputContainer) return;
        setModelLoadingState(false, '');
        outputContainer.innerHTML = '';
        
        if (images.length > 0) {
            if (downloadAllBtn) {
                downloadAllBtn.classList.remove('hidden');
                downloadAllBtn.onclick = () => downloadAllImages(images, 'model_photo');
            }
        } else {
             if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }

        images.forEach(imageUrl => {
            const container = document.createElement('div');
            container.className = 'relative group bg-slate-100 rounded-lg flex items-center justify-center aspect-square';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Generated Model Image";
            img.className = "w-full h-full object-contain rounded-lg animate-fade-in";
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity';

            const previewBtn = document.createElement('button');
            previewBtn.type = 'button';
            previewBtn.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            previewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
            previewBtn.onclick = () => showImagePreview(imageUrl);

            const downloadLink = document.createElement('a');
            downloadLink.href = imageUrl;
            downloadLink.download = `model_photo_${Date.now()}.png`;
            downloadLink.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            downloadLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>`;
            
            buttonContainer.appendChild(previewBtn);
            buttonContainer.appendChild(downloadLink);
            
            container.appendChild(img);
            container.appendChild(buttonContainer);
            outputContainer.appendChild(container);
        });
    }
}

// --- PAS PHOTO GENERATOR SCRIPT ---
const pasPhotoForm = document.getElementById('pas-photo-form') as HTMLFormElement;
if (pasPhotoForm) {
    const generateBtn = document.getElementById('pas-photo-generate-btn') as HTMLButtonElement;
    const resultsPlaceholder = document.getElementById('pas-photo-results-placeholder') as HTMLElement;
    const resultsLoader = document.getElementById('pas-photo-results-loader') as HTMLElement;
    const resultsGrid = document.getElementById('pas-photo-results-grid') as HTMLElement;
    const errorMessage = document.getElementById('pas-photo-error-message') as HTMLElement;
    const errorDetails = document.getElementById('pas-photo-error-details') as HTMLElement;
    const resultsLoaderText = resultsLoader ? resultsLoader.querySelector('p') : null;
    const downloadAllBtn = document.getElementById('pas-photo-download-all-btn') as HTMLButtonElement;
    
    let pasPhotoMimeType = "image/jpeg";

    setupFileUploader('pas-photo-upload-input', 'pas-photo-image-preview', 'pas-photo-upload-prompt', (base64, fileType) => {
        pasPhotoBase64 = base64;
        pasPhotoMimeType = fileType;
    });

    pasPhotoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!pasPhotoBase64) {
            showModal('Harap unggah foto wajah terlebih dahulu.');
            return;
        }
        
        setPasPhotoLoadingState(true);

        const bgColorValue = (document.getElementById('pas-photo-bg-color') as HTMLSelectElement).value;
        const photoSize = (document.getElementById('pas-photo-size') as HTMLSelectElement).value;
        const attireStyle = (document.getElementById('pas-photo-attire') as HTMLSelectElement).value;
        const imageCount = parseInt((document.getElementById('pas-photo-image-count') as HTMLSelectElement).value, 10);
        
        const colorMap: { [key: string]: string } = {
            'red': '#db1514',
            'blue': '#0090ff',
            'white': 'white'
        };
        const bgColor = colorMap[bgColorValue];

        const attireMap: { [key: string]: string } = {
            'formal': 'formal attire, specifically a smart suit jacket or blazer over a collared shirt',
            'semi-formal': 'semi-formal attire, such as a neat plain or non-patterned collared shirt',
            'casual': 'simple casual clothing like a clean t-shirt or polo shirt'
        };
        const attirePrompt = attireMap[attireStyle];

        const sizeMap: { [key: string]: string } = {
            '2x3': '2:3',
            '3x4': '3:4',
            '4x6': '4:6'
        };
        const aspectRatio = sizeMap[photoSize];
        
        const prompt = `Create a professional, regulation-compliant passport photo from the provided image. The MOST IMPORTANT photographic requirement is the lighting: the lighting across the face must be perfectly even, flat, and diffused. It is absolutely crucial to eliminate all harsh shadows, bright hot spots, and any form of stylistic or dramatic lighting like Rembrandt lighting. This even lighting rule applies universally, regardless of the background color chosen. Now, adhere to these other strict requirements: 1. **Background:** Set a solid, uniform background using the exact hex color ${bgColor}. 2. **Attire:** Dress the person in ${attirePrompt}. 3. **Pose & Expression:** The person must be facing forward with a neutral expression. 4. **Composition & Framing:** The subject must be perfectly centered with proportional spacing on the top, left, and right sides. The face should occupy 70-80% of the photo's height, ensuring it's ready for use without any further cropping. 5. **Final Aspect Ratio:** The final image must be cropped to a strict ${aspectRatio} aspect ratio. **HIGHEST PRIORITY:** The person's face, hair, and distinct facial features from the original image must be preserved with 100% accuracy. Do not alter their appearance.`;

        const parts = [
            { text: prompt },
            { inlineData: { mimeType: pasPhotoMimeType, data: pasPhotoBase64! } }
        ];

        const generatedImages: string[] = [];
        try {
            for (let i = 0; i < imageCount; i++) {
                if(resultsLoaderText) resultsLoaderText.textContent = `Memproses foto...`;
                const result = await generateImage(parts);
                if (result) {
                    generatedImages.push(result);
                }
            }
            displayPasPhotoResults(generatedImages, photoSize);
        } catch (error: any) {
            console.error("Error generating passport photo:", error);
            showPasPhotoErrorState(error.message);
            if (generatedImages.length > 0) {
                 displayPasPhotoResults(generatedImages, photoSize);
            }
        } finally {
            setPasPhotoLoadingState(false);
            if(resultsLoaderText) resultsLoaderText.textContent = `Memproses foto...`;
        }
    });

    function setPasPhotoLoadingState(isLoading: boolean) {
        if (!generateBtn || !resultsLoader || !resultsPlaceholder || !errorMessage || !resultsGrid) return;
        
        generateBtn.disabled = isLoading;
        (document.getElementById('pas-photo-upload-input') as HTMLInputElement).disabled = isLoading;
        (document.getElementById('pas-photo-bg-color') as HTMLSelectElement).disabled = isLoading;
        (document.getElementById('pas-photo-attire') as HTMLSelectElement).disabled = isLoading;
        (document.getElementById('pas-photo-size') as HTMLSelectElement).disabled = isLoading;
        (document.getElementById('pas-photo-image-count') as HTMLSelectElement).disabled = isLoading;

        resultsLoader.classList.toggle('hidden', !isLoading);

        if (isLoading) {
            resultsPlaceholder.classList.add('hidden');
            errorMessage.classList.add('hidden');
            resultsGrid.classList.add('hidden');
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
    }
    
    function showPasPhotoErrorState(message: string) {
        if (!resultsPlaceholder || !resultsLoader || !resultsGrid || !errorMessage || !errorDetails) return;
        resultsPlaceholder.classList.add('hidden');
        resultsLoader.classList.add('hidden');
        if (resultsGrid.children.length === 0) {
            resultsGrid.classList.add('hidden');
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
        errorMessage.classList.remove('hidden');
        errorDetails.textContent = message;
    }
    
    function displayPasPhotoResults(images: string[], photoSize: string) {
        if (!resultsGrid) return;
        resultsGrid.innerHTML = '';
        
        if (images.length > 0) {
            if (downloadAllBtn) {
                downloadAllBtn.classList.remove('hidden');
                downloadAllBtn.onclick = () => downloadAllImages(images, 'pas_photo');
            }
        } else {
            if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }

        const sizeClassMap: { [key: string]: { container: string, image: string } } = {
            '2x3': { container: 'aspect-[2/3] w-full', image: 'object-cover' },
            '3x4': { container: 'aspect-[3/4] w-full', image: 'object-cover' },
            '4x6': { container: 'aspect-[4/6] w-full', image: 'object-cover' }
        };

        const classes = sizeClassMap[photoSize] || { container: 'aspect-square w-full', image: 'object-contain' };

        images.forEach(imageUrl => {
            const container = document.createElement('div');
            container.className = `relative group bg-slate-100 rounded-lg overflow-hidden ${classes.container}`;

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Generated Passport Photo";
            img.className = `w-full h-full ${classes.image} rounded-lg animate-fade-in`;
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity';

            const previewBtn = document.createElement('button');
            previewBtn.type = 'button';
            previewBtn.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            previewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
            previewBtn.onclick = () => showImagePreview(imageUrl);

            const downloadLink = document.createElement('a');
            downloadLink.href = imageUrl;
            downloadLink.download = `pas_photo_${Date.now()}.png`;
            downloadLink.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            downloadLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>`;
            
            buttonContainer.appendChild(previewBtn);
            buttonContainer.appendChild(downloadLink);
            
            container.appendChild(img);
            container.appendChild(buttonContainer);
            resultsGrid.appendChild(container);
        });
        resultsGrid.classList.remove('hidden');
    }
}

// --- TRAVEL PHOTO GENERATOR SCRIPT ---
const travelForm = document.getElementById('travel-photo-form') as HTMLFormElement;
if (travelForm) {
    const generateBtn = document.getElementById('travel-generate-btn') as HTMLButtonElement;
    const resultsPlaceholder = document.getElementById('travel-results-placeholder') as HTMLElement;
    const resultsLoader = document.getElementById('travel-results-loader') as HTMLElement;
    const resultsGrid = document.getElementById('travel-results-grid') as HTMLElement;
    const errorMessage = document.getElementById('travel-error-message') as HTMLElement;
    const errorDetails = document.getElementById('travel-error-details') as HTMLElement;
    const resultsLoaderText = resultsLoader ? resultsLoader.querySelector('p') : null;
    const downloadAllBtn = document.getElementById('travel-download-all-btn') as HTMLButtonElement;
    
    let travelFile1: { base64: string, mimeType: string } | null = null;
    let travelFile2: { base64: string, mimeType: string } | null = null;
    let travelFile3: { base64: string, mimeType: string } | null = null;
    let travelFile4: { base64: string, mimeType: string } | null = null;
    let travelFile5: { base64: string, mimeType: string } | null = null;

    const deleteBtn1 = document.getElementById('travel-delete-btn-1') as HTMLButtonElement;
    const deleteBtn2 = document.getElementById('travel-delete-btn-2') as HTMLButtonElement;
    const deleteBtn3 = document.getElementById('travel-delete-btn-3') as HTMLButtonElement;
    const deleteBtn4 = document.getElementById('travel-delete-btn-4') as HTMLButtonElement;
    const deleteBtn5 = document.getElementById('travel-delete-btn-5') as HTMLButtonElement;

    const resetUploader = (
        fileVarSetter: (val: null) => void,
        fileInputId: string,
        previewId: string,
        promptId: string,
        deleteBtn: HTMLButtonElement
    ) => {
        fileVarSetter(null);
        (document.getElementById(fileInputId) as HTMLInputElement).value = '';
        const preview = document.getElementById(previewId) as HTMLImageElement;
        preview.src = '#';
        preview.classList.add('hidden');
        document.getElementById(promptId)?.classList.remove('hidden');
        deleteBtn.classList.add('hidden');
    };
    
    if(deleteBtn1) {
        deleteBtn1.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetUploader(
                (val) => { travelFile1 = val; },
                'travel-upload-input-1',
                'travel-image-preview-1',
                'travel-upload-prompt-1',
                deleteBtn1
            );
        });
    }

    if(deleteBtn2) {
        deleteBtn2.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetUploader(
                (val) => { travelFile2 = val; },
                'travel-upload-input-2',
                'travel-image-preview-2',
                'travel-upload-prompt-2',
                deleteBtn2
            );
        });
    }
    
    if(deleteBtn3) {
        deleteBtn3.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetUploader(
                (val) => { travelFile3 = val; },
                'travel-upload-input-3',
                'travel-image-preview-3',
                'travel-upload-prompt-3',
                deleteBtn3
            );
        });
    }

    if(deleteBtn4) {
        deleteBtn4.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetUploader(
                (val) => { travelFile4 = val; },
                'travel-upload-input-4',
                'travel-image-preview-4',
                'travel-upload-prompt-4',
                deleteBtn4
            );
        });
    }

    if(deleteBtn5) {
        deleteBtn5.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetUploader(
                (val) => { travelFile5 = val; },
                'travel-upload-input-5',
                'travel-image-preview-5',
                'travel-upload-prompt-5',
                deleteBtn5
            );
        });
    }

    setupFileUploader('travel-upload-input-1', 'travel-image-preview-1', 'travel-upload-prompt-1', (base64, fileType) => {
        travelFile1 = { base64, mimeType: fileType };
        if(deleteBtn1) deleteBtn1.classList.remove('hidden');
    });

    setupFileUploader('travel-upload-input-2', 'travel-image-preview-2', 'travel-upload-prompt-2', (base64, fileType) => {
        travelFile2 = { base64, mimeType: fileType };
        if(deleteBtn2) deleteBtn2.classList.remove('hidden');
    });
    
    setupFileUploader('travel-upload-input-3', 'travel-image-preview-3', 'travel-upload-prompt-3', (base64, fileType) => {
        travelFile3 = { base64, mimeType: fileType };
        if(deleteBtn3) deleteBtn3.classList.remove('hidden');
    });

    setupFileUploader('travel-upload-input-4', 'travel-image-preview-4', 'travel-upload-prompt-4', (base64, fileType) => {
        travelFile4 = { base64, mimeType: fileType };
        if(deleteBtn4) deleteBtn4.classList.remove('hidden');
    });

    setupFileUploader('travel-upload-input-5', 'travel-image-preview-5', 'travel-upload-prompt-5', (base64, fileType) => {
        travelFile5 = { base64, mimeType: fileType };
        if(deleteBtn5) deleteBtn5.classList.remove('hidden');
    });

    travelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const files = [travelFile1, travelFile2, travelFile3, travelFile4, travelFile5].filter(f => f !== null);

        if (files.length === 0) {
            showModal('Harap unggah setidaknya satu foto.');
            return;
        }
        
        setTravelLoadingState(true);

        const bgValue = (document.getElementById('travel-bg-select') as HTMLSelectElement).value;
        const seasonValue = (document.getElementById('travel-season-select') as HTMLSelectElement).value;
        const imageCount = parseInt((document.getElementById('travel-image-count') as HTMLSelectElement).value, 10);
        
        const backgroundMap: { [key: string]: string } = {
            'eiffel': 'the Eiffel Tower in Paris, France',
            'fuji': 'Mount Fuji in Japan',
            'sakura': 'a beautiful scene of cherry blossoms in Japan',
            'shinjuku': 'the vibrant neon-lit streets of Shinjuku, Tokyo at night',
            'shirakawago': 'the snowy historic village of Shirakawa-go in Japan during winter',
            'windmill': 'classic Dutch windmills in the Netherlands',
            'big_ben': 'the iconic Big Ben and Houses of Parliament in London, UK',
            'abbey_road': 'the famous Abbey Road crossing in London, UK',
            'pisa': 'the Leaning Tower of Pisa in Italy',
            'liberty': 'the Statue of Liberty in New York, USA',
            'namsan': 'the N Seoul Tower (Namsan Tower) in Seoul, South Korea, with a city view',
            'merlion': 'the Merlion statue with the Marina Bay Sands in the background in Singapore',
            'petronas': 'the majestic Petronas Twin Towers in Kuala Lumpur, Malaysia',
            'kremlin': 'the Kremlin in Moscow, Russia',
            'pyramids': 'the Great Pyramids of Giza in Egypt',
            'opera_house': 'the Sydney Opera House in Australia',
            'dotonbori': 'the vibrant and bustling Dotonbori district in Osaka, Japan at night with all the neon lights',
            'shibuya': 'the iconic Shibuya Crossing in Tokyo, Japan, with crowds of people',
            'arashiyama': 'the serene Arashiyama Bamboo Forest in Kyoto, Japan',
            'fushimi_inari': 'the famous Fushimi Inari Shrine in Kyoto, Japan, with its thousands of red torii gates',
            'times_square': "the dazzling Times Square in New York, USA, with its bright billboards and bustling atmosphere at night",
            'rinjani': 'the peak of Mount Rinjani in Lombok, Indonesia, with a breathtaking view of the crater lake and sunrise',
        };
        const bgDescription = backgroundMap[bgValue];
        
        const clothingMap: { [key: string]: string } = {
            'eiffel': 'stylish and chic European city wear, like a trench coat or a fashionable jacket',
            'fuji': 'appropriate outdoor or hiking gear suitable for a cool mountain climate',
            'sakura': 'light spring clothing, like a light jacket or sweater, suitable for a pleasant day in Japan',
            'shinjuku': 'stylish urban nightlife attire, trendy and cool, perfect for Tokyo streets',
            'shirakawago': 'warm winter clothing, heavy coats, scarves, and boots suitable for snowy weather',
            'windmill': 'comfortable and casual European travel wear, perhaps with a light jacket for a breezy day',
            'big_ben': 'smart casual British style, perhaps a trench coat or a blazer',
            'abbey_road': 'casual, retro-inspired walking attire, or just comfortable street wear',
            'pisa': 'summer tourist attire, like a light shirt or dress, suitable for a sunny day in Italy',
            'liberty': 'casual American tourist style, like jeans and a t-shirt or a light jacket',
            'namsan': 'stylish casual Korean fashion, trendy and neat',
            'merlion': 'light, breathable summer clothing suitable for tropical Singapore weather',
            'petronas': 'smart casual or urban travel wear suitable for warm weather',
            'kremlin': 'warm and stylish clothing suitable for Moscow, such as a smart coat or jacket',
            'pyramids': 'light, breathable desert travel clothing, sunglasses, and maybe a hat',
            'opera_house': 'stylish, modern city wear suitable for a sunny day in Sydney',
            'dotonbori': 'trendy, fashionable Japanese streetwear, perfect for a night out in a bustling city',
            'shibuya': 'modern, stylish Tokyo street fashion, like you are part of the vibrant crowd',
            'arashiyama': 'comfortable and elegant walking attire, such as a light coat or a flowing dress, fitting for a serene forest',
            'fushimi_inari': 'respectful and comfortable walking clothes suitable for a shrine visit, perhaps with a touch of traditional style',
            'times_square': 'casual and cool New York City style, like a stylish jacket, jeans, and sneakers, fitting for a night in the city',
            'rinjani': 'warm, layered hiking and trekking gear, including a windproof jacket, beanie, and gloves, prepared for a mountain summit',
        };
        const clothingDescription = clothingMap[bgValue];

        let seasonPrompt = "";
        let clothingSeasonInstruction = "";

        if (seasonValue === 'winter') {
            seasonPrompt = " The season must be Winter, featuring snow, cold weather, and a wintry atmosphere.";
            clothingSeasonInstruction = " The clothing MUST be adapted for Winter (warm coats, scarves, layers) regardless of the standard location attire.";
        } else if (seasonValue === 'spring') {
            seasonPrompt = " The season must be Spring, featuring blooming flowers, fresh greenery, and pleasant weather.";
            clothingSeasonInstruction = " The clothing MUST be adapted for Spring (light jackets, fresh colors).";
        } else if (seasonValue === 'autumn') {
            seasonPrompt = " The season must be Autumn, featuring colorful fall foliage (orange, red, yellow leaves) and a cozy atmosphere.";
            clothingSeasonInstruction = " The clothing MUST be adapted for Autumn (stylish layers, earth tones, light coats).";
        }

        let personDescription = "the person from the provided image";
        if (files.length === 2) {
            personDescription = "the two people from the provided images, placing them together naturally (e.g., as friends or a couple)";
        } else if (files.length > 2) {
             personDescription = `the ${files.length} people from the provided images, placing them together naturally as a group`;
        }

        const prompt = `Create a realistic travel photograph. Take ${personDescription} and place them in a new scene.
1. **Background:** The new background must be a beautiful, clear shot of ${bgDescription}.${seasonPrompt}
2. **Attire:** IMPORTANT: Change the person's (or people's) clothing to be appropriate for the location. Dress them in ${clothingDescription}.${clothingSeasonInstruction}
3. **Integration:** The people must be integrated seamlessly into the new environment. It is crucial to match the environmental lighting, shadows, and perspective perfectly to make it look authentic.
4. **HIGHEST PRIORITY (Preservation):** The faces, hair, and distinct facial features from the original images must be preserved with 100% accuracy. DO NOT alter their facial appearance.`;

        const parts: any[] = [{ text: prompt }];
        files.forEach(file => {
             parts.push({ inlineData: { mimeType: file!.mimeType, data: file!.base64 } });
        });
        
        const generatedImages: string[] = [];
        try {
            for (let i = 0; i < imageCount; i++) {
                if(resultsLoaderText) resultsLoaderText.textContent = `Memproses foto...`;
                const result = await generateImage(parts);
                if (result) {
                    generatedImages.push(result);
                }
            }
            displayTravelResults(generatedImages);
        } catch (error: any) {
            console.error("Error generating travel photo:", error);
            showTravelErrorState(error.message);
            if (generatedImages.length > 0) {
                 displayTravelResults(generatedImages);
            }
        } finally {
            setTravelLoadingState(false);
            if(resultsLoaderText) resultsLoaderText.textContent = `Memproses foto...`;
        }
    });

    function setTravelLoadingState(isLoading: boolean) {
        if (!generateBtn || !resultsLoader || !resultsPlaceholder || !errorMessage || !resultsGrid) return;

        generateBtn.disabled = isLoading;
        resultsLoader.classList.toggle('hidden', !isLoading);

        if (isLoading) {
            resultsPlaceholder.classList.add('hidden');
            errorMessage.classList.add('hidden');
            resultsGrid.classList.add('hidden');
            resultsGrid.innerHTML = '';
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
    }
    
    function showTravelErrorState(message: string) {
        if (!resultsPlaceholder || !resultsLoader || !resultsGrid || !errorMessage || !errorDetails) return;

        resultsPlaceholder.classList.add('hidden');
        resultsLoader.classList.add('hidden');
        if (resultsGrid.children.length === 0) {
            resultsGrid.classList.add('hidden');
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
        errorMessage.classList.remove('hidden');
        errorDetails.textContent = message;
    }
    
    function displayTravelResults(images: string[]) {
        if (!resultsGrid) return;

        setTravelLoadingState(false);
        resultsGrid.innerHTML = '';
        
        if (images.length > 0) {
            if (downloadAllBtn) {
                downloadAllBtn.classList.remove('hidden');
                downloadAllBtn.onclick = () => downloadAllImages(images, 'travel_photo');
            }
        } else {
            if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }

        images.forEach(imageUrl => {
            const container = document.createElement('div');
            container.className = 'relative group bg-slate-100 rounded-lg flex items-center justify-center aspect-[4/5]';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Generated Travel Photo";
            img.className = "w-full h-full object-cover rounded-lg animate-fade-in";
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity';

            const previewBtn = document.createElement('button');
            previewBtn.type = 'button';
            previewBtn.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            previewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
            previewBtn.onclick = () => showImagePreview(imageUrl);

            const downloadLink = document.createElement('a');
            downloadLink.href = imageUrl;
            downloadLink.download = `travel_photo_${Date.now()}.png`;
            downloadLink.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            downloadLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>`;
            
            buttonContainer.appendChild(previewBtn);
            buttonContainer.appendChild(downloadLink);
            
            container.appendChild(img);
            container.appendChild(buttonContainer);
            resultsGrid.appendChild(container);
        });
        resultsGrid.classList.remove('hidden');
    }
}


// --- PREWEDDING PHOTO GENERATOR SCRIPT ---
const preweddingForm = document.getElementById('prewedding-photo-form') as HTMLFormElement;
if (preweddingForm) {
    const generateBtn = document.getElementById('prewedding-generate-btn') as HTMLButtonElement;
    const resultsPlaceholder = document.getElementById('prewedding-results-placeholder') as HTMLElement;
    const resultsLoader = document.getElementById('prewedding-results-loader') as HTMLElement;
    const resultsGrid = document.getElementById('prewedding-results-grid') as HTMLElement;
    const errorMessage = document.getElementById('prewedding-error-message') as HTMLElement;
    const errorDetails = document.getElementById('prewedding-error-details') as HTMLElement;
    const resultsLoaderText = resultsLoader ? resultsLoader.querySelector('p') : null;
    const downloadAllBtn = document.getElementById('prewedding-download-all-btn') as HTMLButtonElement;
    
    const locationTypeOutdoorRadio = document.getElementById('prewedding-location-type-outdoor') as HTMLInputElement;
    const locationTypeIndoorRadio = document.getElementById('prewedding-location-type-indoor') as HTMLInputElement;
    const locationOutdoorContainer = document.getElementById('prewedding-location-outdoor-container') as HTMLElement;
    const locationIndoorContainer = document.getElementById('prewedding-location-indoor-container') as HTMLElement;

    let preweddingFileA: { base64: string, mimeType: string } | null = null;
    let preweddingFileB: { base64: string, mimeType: string } | null = null;

    const deleteBtnA = document.getElementById('prewedding-delete-btn-a') as HTMLButtonElement;
    const deleteBtnB = document.getElementById('prewedding-delete-btn-b') as HTMLButtonElement;

    function updatePreweddingLocationView() {
        if (!locationOutdoorContainer || !locationIndoorContainer || !locationTypeOutdoorRadio) return;
        const isOutdoor = locationTypeOutdoorRadio.checked;
        locationOutdoorContainer.classList.toggle('hidden', !isOutdoor);
        locationIndoorContainer.classList.toggle('hidden', isOutdoor);
    }

    if (locationTypeOutdoorRadio && locationTypeIndoorRadio) {
        locationTypeOutdoorRadio.addEventListener('change', updatePreweddingLocationView);
        locationTypeIndoorRadio.addEventListener('change', updatePreweddingLocationView);
    }

    const resetUploader = (
        fileVarSetter: (val: null) => void,
        fileInputId: string,
        previewId: string,
        promptId: string,
        deleteBtn: HTMLButtonElement
    ) => {
        fileVarSetter(null);
        (document.getElementById(fileInputId) as HTMLInputElement).value = '';
        const preview = document.getElementById(previewId) as HTMLImageElement;
        preview.src = '#';
        preview.classList.add('hidden');
        document.getElementById(promptId)?.classList.remove('hidden');
        deleteBtn.classList.add('hidden');
    };
    
    if(deleteBtnA) {
        deleteBtnA.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetUploader(
                (val) => { preweddingFileA = val; },
                'prewedding-upload-input-a',
                'prewedding-image-preview-a',
                'prewedding-upload-prompt-a',
                deleteBtnA
            );
        });
    }

    if(deleteBtnB) {
        deleteBtnB.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetUploader(
                (val) => { preweddingFileB = val; },
                'prewedding-upload-input-b',
                'prewedding-image-preview-b',
                'prewedding-upload-prompt-b',
                deleteBtnB
            );
        });
    }

    setupFileUploader('prewedding-upload-input-a', 'prewedding-image-preview-a', 'prewedding-upload-prompt-a', (base64, fileType) => {
        preweddingFileA = { base64, mimeType: fileType };
        if(deleteBtnA) deleteBtnA.classList.remove('hidden');
    });

    setupFileUploader('prewedding-upload-input-b', 'prewedding-image-preview-b', 'prewedding-upload-prompt-b', (base64, fileType) => {
        preweddingFileB = { base64, mimeType: fileType };
        if(deleteBtnB) deleteBtnB.classList.remove('hidden');
    });

    preweddingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!preweddingFileA || !preweddingFileB) {
            showModal('Harap unggah foto untuk kedua pasangan.');
            return;
        }
        
        setPreweddingLoadingState(true);

        const locationType = (document.querySelector('input[name="location-type"]:checked') as HTMLInputElement).value;
        let locationValue = '';
        if (locationType === 'outdoor') {
            locationValue = (document.getElementById('prewedding-location-outdoor-select') as HTMLSelectElement).value;
        } else {
            locationValue = (document.getElementById('prewedding-location-indoor-select') as HTMLSelectElement).value;
        }

        const attireValue = (document.getElementById('prewedding-attire-select') as HTMLSelectElement).value;
        const imageCount = parseInt((document.getElementById('prewedding-image-count') as HTMLSelectElement).value, 10);
        
        const locationMap: { [key: string]: string } = {
            'pantai': 'a beautiful, serene beach during the golden hour of sunset',
            'padang_rumput': 'a beautiful meadow or flower field with tall grass and wildflowers',
            'hutan': 'a lush, enchanting forest with dappled sunlight filtering through the trees',
            'kota': 'a bustling and modern cityscape at night with beautiful bokeh lights in the background',
            'pasar': 'a vibrant and colorful traditional market, full of life and culture',
            'pegunungan': 'a majestic mountain landscape with a breathtaking panoramic view',
            'masjid': 'the serene and grand interior of a beautiful mosque with intricate architectural details',
            'gereja': 'the classic and solemn interior of a beautiful church with stained glass windows',
            'studio': 'a minimalist studio with a clean, simple background and professional lighting',
            'rumah_kaca': 'a bright and airy botanical greenhouse filled with exotic plants and flowers',
            'gedung_tua': 'a historic old building with rustic, vintage architecture and charm',
            'cafe': 'a cozy and stylish cafe with a warm, intimate ambiance'
        };
        const locationDescription = locationMap[locationValue];
        
        const attireMap: { [key: string]: string } = {
            'formal': 'a stunning formal wedding gown for her and a sharp, classic tuxedo for him',
            'modern': 'chic and modern prewedding outfits, like a stylish contemporary dress and a smart suit',
            'muslim': 'elegant and modest Muslim wedding attire, like a beautiful gamis or kaftan for her and a neat koko shirt or thobe for him',
            'kasual': 'stylish and comfortable casual outfits that complement each other',
            'batik': 'elegant and matching modern Batik couple outfits',
            'adat': 'beautiful and intricate traditional Indonesian wedding attire',
            'vintage': 'classy vintage-style clothing, reminiscent of the 1950s or 60s',
        };

        const autoAttireMap: { [key: string]: string } = {
            'pantai': 'light and airy beachwear, like a flowing white sundress for her and a linen shirt for him',
            'padang_rumput': 'bohemian chic outfits, like a flowing dress and a relaxed shirt, perfect for a field of flowers',
            'hutan': 'bohemian or rustic chic outfits that blend with the natural surroundings',
            'kota': 'fashionable and trendy city outfits, perfect for a night out',
            'pasar': 'casual, comfortable, yet stylish outfits suitable for walking around a market',
            'pegunungan': 'stylish but practical layered outfits or hiking gear suitable for the mountains',
            'masjid': 'modest and elegant Muslim attire (gamis and koko) that is respectful for a place of worship',
            'gereja': 'smart and respectful semi-formal attire suitable for a church setting',
            'studio': 'simple, elegant, and timeless outfits that don\'t distract from the couple',
            'rumah_kaca': 'light, floral, or pastel-colored outfits that complement the botanical setting',
            'gedung_tua': 'vintage or classic-styled clothing that matches the historic feel of the building',
            'cafe': 'smart-casual and cozy outfits, like sweaters and nice trousers'
        };
        
        const clothingDescription = attireValue === 'otomatis'
            ? autoAttireMap[locationValue]
            : attireMap[attireValue];

        const prompt = `Create a photorealistic, professional prewedding photograph featuring the two people from the provided images, placed together naturally and romantically as a couple.
1. **Background:** The setting is ${locationDescription}.
2. **Attire:** Dress the couple in ${clothingDescription}.
3. **Integration & Style:** The couple must be integrated seamlessly into the scene. Use professional photography parameters: *Cinematic lighting, shallow depth of field (bokeh), alternate between 14mm, 35mm, and 85mm lens effects for different shots, 8k resolution, highly detailed texture, and a romantic mood*.
4. **Pose & Mood:** The pose should be romantic, respectful, and appropriate.
5. **HIGHEST PRIORITY (Preservation):** The faces, hair, skin tone, and distinct facial features of both individuals from the original images must be preserved with 100% accuracy. Do not alter their facial appearance. The goal is maximum likeness.
Do not generate any NSFW, violent, or inappropriate content.`;

        const parts: any[] = [
            { text: prompt },
            { inlineData: { mimeType: preweddingFileA!.mimeType, data: preweddingFileA!.base64 } },
            { inlineData: { mimeType: preweddingFileB!.mimeType, data: preweddingFileB!.base64 } }
        ];
        
        const generatedImages: string[] = [];
        try {
            for (let i = 0; i < imageCount; i++) {
                if(resultsLoaderText) resultsLoaderText.textContent = `Memproses foto...`;
                const result = await generateImage(parts);
                if (result) {
                    generatedImages.push(result);
                }
            }
            displayPreweddingResults(generatedImages);
        } catch (error: any) {
            console.error("Error generating prewedding photo:", error);
            showPreweddingErrorState(error.message);
            if (generatedImages.length > 0) {
                 displayPreweddingResults(generatedImages);
            }
        } finally {
            setPreweddingLoadingState(false);
            if(resultsLoaderText) resultsLoaderText.textContent = `Memproses foto...`;
        }
    });

    function setPreweddingLoadingState(isLoading: boolean) {
        if (!generateBtn || !resultsLoader || !resultsPlaceholder || !errorMessage || !resultsGrid) return;

        generateBtn.disabled = isLoading;
        resultsLoader.classList.toggle('hidden', !isLoading);

        if (isLoading) {
            resultsPlaceholder.classList.add('hidden');
            errorMessage.classList.add('hidden');
            resultsGrid.classList.add('hidden');
            resultsGrid.innerHTML = '';
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
    }
    
    function showPreweddingErrorState(message: string) {
        if (!resultsPlaceholder || !resultsLoader || !resultsGrid || !errorMessage || !errorDetails) return;

        resultsPlaceholder.classList.add('hidden');
        resultsLoader.classList.add('hidden');
        if (resultsGrid.children.length === 0) {
            resultsGrid.classList.add('hidden');
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
        errorMessage.classList.remove('hidden');
        errorDetails.textContent = message;
    }
    
    function displayPreweddingResults(images: string[]) {
        if (!resultsGrid) return;

        setPreweddingLoadingState(false);
        resultsGrid.innerHTML = '';
        
        if (images.length > 0) {
            if (downloadAllBtn) {
                downloadAllBtn.classList.remove('hidden');
                downloadAllBtn.onclick = () => downloadAllImages(images, 'prewedding_photo');
            }
        } else {
            if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }

        images.forEach(imageUrl => {
            const container = document.createElement('div');
            container.className = 'relative group bg-slate-100 rounded-lg flex items-center justify-center aspect-[4/5]';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Generated Prewedding Photo";
            img.className = "w-full h-full object-cover rounded-lg animate-fade-in";
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity';

            const previewBtn = document.createElement('button');
            previewBtn.type = 'button';
            previewBtn.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            previewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
            previewBtn.onclick = () => showImagePreview(imageUrl);

            const downloadLink = document.createElement('a');
            downloadLink.href = imageUrl;
            downloadLink.download = `prewedding_photo_${Date.now()}.png`;
            downloadLink.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            downloadLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>`;
            
            buttonContainer.appendChild(previewBtn);
            buttonContainer.appendChild(downloadLink);
            
            container.appendChild(img);
            container.appendChild(buttonContainer);
            resultsGrid.appendChild(container);
        });
        resultsGrid.classList.remove('hidden');
    }

    updatePreweddingLocationView();
}

// --- DIGITAL PHOTO RESTORATION SCRIPT ---
const restorationForm = document.getElementById('digital-restoration-form') as HTMLFormElement;
if (restorationForm) {
    const generateBtn = document.getElementById('restoration-generate-btn') as HTMLButtonElement;
    const resultsPlaceholder = document.getElementById('restoration-results-placeholder') as HTMLElement;
    const resultsLoader = document.getElementById('restoration-results-loader') as HTMLElement;
    const resultsGrid = document.getElementById('restoration-results-grid') as HTMLElement;
    const errorMessage = document.getElementById('restoration-error-message') as HTMLElement;
    const errorDetails = document.getElementById('restoration-error-details') as HTMLElement;
    const downloadAllBtn = document.getElementById('restoration-download-all-btn') as HTMLButtonElement;
    
    let restorationFile: { base64: string, mimeType: string } | null = null;

    setupFileUploader('restoration-upload-input', 'restoration-image-preview', 'restoration-upload-prompt', (base64, fileType) => {
        restorationFile = { base64, mimeType: fileType };
    });

    restorationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!restorationFile) {
            showModal('Harap unggah foto yang ingin Anda pulihkan.');
            return;
        }
        
        setRestorationLoadingState(true);
        
        const prompt = `Perform a comprehensive photo restoration on the provided image. Your goal is to restore and enhance the photo with the following specifications:
1.  **Damage Repair:** Realistically fix any physical damage, including tears, cracks, scratches, water stains, and mold. If parts of the subject's face are missing or obscured, restore them with photorealistic detail.
2.  **Color & Pixel Correction:** Restore damaged pixels. Correct faded or shifted colors, returning them to their original, vibrant state.
3.  **Clarity and Enhancement:** Sharpen the entire image to bring out details. Remove all digital noise, grain, and unwanted spots. Make the subject's features clear and bright.
The final result should be a total restoration, making the photo look as if it were taken with a modern digital camera or a flagship smartphone.

**HIGHEST PRIORITY RULES:**
1.  **Preserve Content:** You MUST NOT change, add, or remove any core objects, people, backgrounds, or compositional elements from the original photo, unless the task specifically requires it (like fixing tears or restoring a missing face part).
2.  **Preserve Likeness:** The faces and features of any people in the photo must be preserved with 100% accuracy. Do not alter their appearance unless restoring damaged/missing parts as instructed above.
3.  The final output must be a single, restored, high-quality version of the provided image.`;


        const parts: any[] = [
            { text: prompt },
            { inlineData: { mimeType: restorationFile.mimeType, data: restorationFile.base64 } }
        ];
        
        try {
            const result = await generateImage(parts);
            if (result) {
                displayRestorationResults([result]);
            } else {
                throw new Error("Gagal menghasilkan gambar yang dipulihkan.");
            }
        } catch (error: any) {
            console.error("Error restoring photo:", error);
            showRestorationErrorState(error.message);
        } finally {
            setRestorationLoadingState(false);
        }
    });

    function setRestorationLoadingState(isLoading: boolean) {
        if (!generateBtn || !resultsLoader || !resultsPlaceholder || !errorMessage || !resultsGrid) return;

        generateBtn.disabled = isLoading;
        resultsLoader.classList.toggle('hidden', !isLoading);

        if (isLoading) {
            resultsPlaceholder.classList.add('hidden');
            errorMessage.classList.add('hidden');
            resultsGrid.classList.add('hidden');
            resultsGrid.innerHTML = '';
            if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }
    }
    
    function showRestorationErrorState(message: string) {
        if (!resultsPlaceholder || !resultsLoader || !resultsGrid || !errorMessage || !errorDetails) return;

        resultsPlaceholder.classList.add('hidden');
        resultsLoader.classList.add('hidden');
        resultsGrid.classList.add('hidden');
        if(downloadAllBtn) downloadAllBtn.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorDetails.textContent = message;
    }
    
    function displayRestorationResults(images: string[]) {
        if (!resultsGrid) return;

        setRestorationLoadingState(false);
        resultsGrid.innerHTML = '';
        
        if (images.length > 0) {
            if (downloadAllBtn) {
                downloadAllBtn.classList.remove('hidden');
                downloadAllBtn.onclick = () => downloadAllImages(images, 'restored_photo');
            }
        } else {
            if (downloadAllBtn) downloadAllBtn.classList.add('hidden');
        }

        images.forEach(imageUrl => {
            const container = document.createElement('div');
            container.className = 'relative group bg-slate-100 rounded-lg flex items-center justify-center aspect-auto';

            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "Restored Photo";
            img.className = "max-w-full max-h-[60vh] object-contain rounded-lg animate-fade-in";
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity';

            const previewBtn = document.createElement('button');
            previewBtn.type = 'button';
            previewBtn.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            previewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
            previewBtn.onclick = () => showImagePreview(imageUrl);

            const downloadLink = document.createElement('a');
            downloadLink.href = imageUrl;
            downloadLink.download = `restored_photo_${Date.now()}.png`;
            downloadLink.className = 'p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75';
            downloadLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>`;
            
            buttonContainer.appendChild(previewBtn);
            buttonContainer.appendChild(downloadLink);
            
            container.appendChild(img);
            container.appendChild(buttonContainer);
            resultsGrid.appendChild(container);
        });
        resultsGrid.classList.remove('hidden');
    }
}
