import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- Sidebar Toggle Script ---
const mobileMenuButton = document.getElementById('mobile-menu-button') as HTMLButtonElement;
const sidebar = document.getElementById('sidebar') as HTMLElement;

mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
});

// --- Page Navigation Script ---
const navProductBtn = document.getElementById('nav-product-btn') as HTMLAnchorElement;
const navModelBtn = document.getElementById('nav-model-btn') as HTMLAnchorElement;
const navPasPhotoBtn = document.getElementById('nav-pas-photo-btn') as HTMLAnchorElement;
const navTravelBtn = document.getElementById('nav-travel-btn') as HTMLAnchorElement;
const productPage = document.getElementById('product-generator-page') as HTMLElement;
const modelPage = document.getElementById('model-generator-page') as HTMLElement;
const pasPhotoPage = document.getElementById('pas-photo-generator-page') as HTMLElement;
const travelPage = document.getElementById('travel-generator-page') as HTMLElement;

function setActiveNav(activeBtn: HTMLAnchorElement) {
    const allBtns = [navProductBtn, navModelBtn, navPasPhotoBtn, navTravelBtn];
    allBtns.forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('hover:bg-slate-800');
    });
    activeBtn.classList.add('bg-indigo-600', 'text-white');
    activeBtn.classList.remove('hover:bg-slate-800');
}

function showPage(pageToShow: HTMLElement) {
    const allPages = [productPage, modelPage, pasPhotoPage, travelPage];
    allPages.forEach(page => page.classList.add('hidden'));
    pageToShow.classList.remove('hidden');
}


navProductBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(productPage);
    setActiveNav(navProductBtn);
});

navModelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(modelPage);
    setActiveNav(navModelBtn);
});

navPasPhotoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(pasPhotoPage);
    setActiveNav(navPasPhotoBtn);
});

navTravelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(travelPage);
    setActiveNav(navTravelBtn);
});


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
    fileInput.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                (document.getElementById(previewId) as HTMLImageElement).src = result;
                document.getElementById(previewId)?.classList.remove('hidden');
                document.getElementById(promptId)?.classList.add('hidden');
                const base64 = result.split(',')[1];
                callback(base64, file.type);
            };
            reader.readAsDataURL(file);
        }
    });
}

function showImagePreview(imageUrl: string) {
    modalImage.src = imageUrl;
    imagePreviewModal.classList.remove('hidden');
}

function hideImagePreview() {
    imagePreviewModal.classList.add('hidden');
    modalImage.src = ''; 
}

closeModalBtn.addEventListener('click', hideImagePreview);
imagePreviewModal.addEventListener('click', (e) => {
    if (e.target === imagePreviewModal) {
        hideImagePreview();
    }
});

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

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    return `data:${mimeType};base64,${base64ImageBytes}`;
                }
            }
            throw new Error("API response did not contain image data.");
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
        const useCustomPrompt = customPromptCheckbox.checked;
        guidedOptions.disabled = useCustomPrompt;
        guidedOptions.style.opacity = useCustomPrompt ? '0.5' : '1';
        customPromptContainer.style.display = useCustomPrompt ? 'block' : 'none';

        if (useCustomPrompt) return;

        const isWithoutModel = withoutModelCheckbox.checked;
        const modelSource = (document.querySelector('input[name="model-source"]:checked') as HTMLInputElement).value;
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
        el.addEventListener('change', updateCustomizationView);
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
        
        const promises = [];

        for (let i = 0; i < NUM_IMAGES; i++) {
            let prompt;
            let parts: any[] = [];

            if(useCustomPrompt) {
                if (!customPromptValue) {
                    showModal('Harap isi prompt kustom Anda.');
                    setLoadingState(false);
                    return; 
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
                    showModal('Harap isi Nama Produk Jadi saat mengunggah bahan/kain.');
                    setLoadingState(false);
                    return;
                }

                const withoutModel = withoutModelCheckbox.checked;
                const modelSource = (document.querySelector('input[name="model-source"]:checked') as HTMLInputElement).value;

                if (!withoutModel && modelSource === 'upload' && !modelBase64) {
                    showModal('Harap unggah foto model terlebih dahulu.');
                    setLoadingState(false);
                    return;
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
                        parts = [ { text: prompt }, { inlineData: { mimeType: productMimeType, data: productBase64 } } ];
                    } else {
                        prompt = `Professional photography, creating a stunning visual scene. The provided item${productContext} is the main focus, presented ${studioVariations[i % studioVariations.length]}${liquidEnhancement}${lightingPrompt}.${textPreservationPrompt}`;
                        parts = [ { text: prompt }, { inlineData: { mimeType: productMimeType, data: productBase64 } } ];
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
                                    showModal('Harap isi deskripsi interaksi kustom Anda.');
                                    setLoadingState(false);
                                    return;
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
                            { inlineData: { mimeType: productMimeType, data: productBase64 } }
                        ];
                    } else { // generate model
                        const gender = (document.getElementById('gender') as HTMLSelectElement).value;
                        const ethnicity = (document.getElementById('ethnicity') as HTMLSelectElement).value;
                        let ageRange = (document.getElementById('age-range') as HTMLSelectElement).value;

                        if (ageRange === 'custom') {
                            ageRange = (document.getElementById('custom-age-input') as HTMLInputElement).value.trim();
                            if (!ageRange) {
                                showModal('Harap isi rentang usia kustom Anda.');
                                setLoadingState(false);
                                return;
                            }
                        }

                        prompt = `Professional product showcase photo. A ${gender} of ${ethnicity} ethnicity, in the ${ageRange} age range, ${fullClothingDesc}, in a ${modelPose} pose. The model ${finalActionPhrase} The style is: ${photoStyle}. The photograph should be a ${focusLevel}, with the main focus on the product.${liquidEnhancement} ${textPreservationPrompt}`;
                        parts = [
                            { text: prompt },
                            { inlineData: { mimeType: productMimeType, data: productBase64 } }
                        ];
                    }
                }
            }
            promises.push(generateImage(parts));
        }

        try {
            const results = await Promise.all(promises);
            displayResults(results.filter(r => r) as string[]);
        } catch (error: any) {
            console.error("Error generating images:", error);
            showErrorState(error.message);
        } finally {
            setLoadingState(false);
        }
    });

    function displayResults(images: string[]) {
        resultsGrid.innerHTML = '';
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
    }

    function setLoadingState(isLoading: boolean) {
        generateBtn.disabled = isLoading;
        btnText.style.display = isLoading ? 'none' : 'inline';
        btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
        
        resultsPlaceholder.classList.toggle('hidden', isLoading);
        errorMessage.classList.add('hidden');
        resultsGrid.classList.add('hidden');
        resultsLoader.classList.toggle('hidden', !isLoading);
    }
    
    function showErrorState(message: string) {
         resultsPlaceholder.classList.add('hidden');
         resultsLoader.classList.add('hidden');
         resultsGrid.classList.add('hidden');
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
        
        setModelLoadingState(true, 'Menghasilkan foto model...');

        const photoType = (document.getElementById('model-photo-type') as HTMLSelectElement).value;
        const pose = (document.getElementById('model-page-pose') as HTMLSelectElement).value;
        const clothing = (document.getElementById('model-page-clothing') as HTMLSelectElement).value;
        const focus = (document.getElementById('model-page-focus') as HTMLSelectElement).value;
        const imageCount = parseInt(imageCountSelect.value, 10);

        const prompt = `A ${photoType} of the person in the provided image. They should be in a ${pose} pose, ${clothing}. The photo must be a ${focus}. The final image should have the exact same facial features as the original image.`;

        const parts = [
            { text: prompt },
            { inlineData: { mimeType: modelPageMimeType, data: modelPageBase64 } }
        ];

        const promises = Array(imageCount).fill(0).map(() => generateImage(parts));

        try {
            const results = await Promise.all(promises);
            displayModelResults(results.filter(r => r) as string[]);
        } catch (error: any) {
            console.error("Error generating model images:", error);
            setModelLoadingState(true, `Error: ${error.message}`);
        } finally {
             // Keep loading state until results are shown
        }
    });

    function setModelLoadingState(isLoading: boolean, message: string) {
        generateBtn.disabled = isLoading;
        if (isLoading) {
            statusContainer.innerHTML = `
                <div class="text-center text-slate-600">
                     <div class="spinner w-12 h-12 mx-auto rounded-full border-4 border-slate-300"></div>
                     <p class="mt-4 text-lg">${message}</p>
                </div>`;
            statusContainer.classList.remove('hidden');
            outputContainer.classList.add('hidden');
            outputContainer.innerHTML = '';
        } else {
             statusContainer.classList.add('hidden');
             outputContainer.classList.remove('hidden');
        }
    }

    function displayModelResults(images: string[]) {
        setModelLoadingState(false, '');
        outputContainer.innerHTML = '';
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
            { inlineData: { mimeType: pasPhotoMimeType, data: pasPhotoBase64 } }
        ];

        const promises = Array(imageCount).fill(0).map(() => generateImage(parts));

        try {
            const results = await Promise.all(promises);
            if (results && results.length > 0) {
                displayPasPhotoResults(results.filter(r => r) as string[], photoSize);
            } else {
                throw new Error("Failed to generate any images.");
            }
        } catch (error: any) {
            console.error("Error generating passport photo:", error);
            showPasPhotoErrorState(error.message);
        } finally {
            setPasPhotoLoadingState(false);
        }
    });

    function setPasPhotoLoadingState(isLoading: boolean) {
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
        } else {
             // When loading is finished, don't hide the grid again.
             // Let the display function handle grid visibility.
        }
    }
    
    function showPasPhotoErrorState(message: string) {
        resultsPlaceholder.classList.add('hidden');
        resultsLoader.classList.add('hidden');
        resultsGrid.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorDetails.textContent = message;
    }
    
    function displayPasPhotoResults(images: string[], photoSize: string) {
        resultsGrid.innerHTML = '';
        
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
    
    let travelFile1: { base64: string, mimeType: string } | null = null;
    let travelFile2: { base64: string, mimeType: string } | null = null;

    const deleteBtn1 = document.getElementById('travel-delete-btn-1') as HTMLButtonElement;
    const deleteBtn2 = document.getElementById('travel-delete-btn-2') as HTMLButtonElement;

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

    setupFileUploader('travel-upload-input-1', 'travel-image-preview-1', 'travel-upload-prompt-1', (base64, fileType) => {
        travelFile1 = { base64, mimeType: fileType };
        deleteBtn1.classList.remove('hidden');
    });

    setupFileUploader('travel-upload-input-2', 'travel-image-preview-2', 'travel-upload-prompt-2', (base64, fileType) => {
        travelFile2 = { base64, mimeType: fileType };
        deleteBtn2.classList.remove('hidden');
    });

    travelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!travelFile1) {
            showModal('Harap unggah setidaknya foto pertama.');
            return;
        }
        
        setTravelLoadingState(true);

        const bgValue = (document.getElementById('travel-bg-select') as HTMLSelectElement).value;
        const imageCount = parseInt((document.getElementById('travel-image-count') as HTMLSelectElement).value, 10);
        
        const backgroundMap: { [key: string]: string } = {
            'eiffel': 'the Eiffel Tower in Paris, France',
            'fuji': 'Mount Fuji in Japan',
            'sakura': 'a beautiful scene of cherry blossoms in Japan',
            'windmill': 'classic Dutch windmills in the Netherlands',
            'pisa': 'the Leaning Tower of Pisa in Italy',
            'liberty': 'the Statue of Liberty in New York, USA',
            'kremlin': 'the Kremlin in Moscow, Russia',
        };
        const bgDescription = backgroundMap[bgValue];
        
        const clothingMap: { [key: string]: string } = {
            'eiffel': 'stylish and chic European city wear, like a trench coat or a fashionable jacket',
            'fuji': 'appropriate outdoor or hiking gear suitable for a cool mountain climate',
            'sakura': 'light spring clothing, like a light jacket or sweater, suitable for a pleasant day in Japan',
            'windmill': 'comfortable and casual European travel wear, perhaps with a light jacket for a breezy day',
            'pisa': 'summer tourist attire, like a light shirt or dress, suitable for a sunny day in Italy',
            'liberty': 'casual American tourist style, like jeans and a t-shirt or a light jacket',
            'kremlin': 'warm and stylish clothing suitable for Moscow, such as a smart coat or jacket',
        };
        const clothingDescription = clothingMap[bgValue];

        const personDescription = travelFile2
            ? "the two people from the provided images, placing them together naturally (e.g., as friends or a couple)"
            : "the person from the provided image";

        const prompt = `Create a realistic travel photograph. Take ${personDescription} and place them in a new scene.
1. **Background:** The new background must be a beautiful, clear shot of ${bgDescription}.
2. **Attire:** IMPORTANT: Change the person's (or people's) clothing to be appropriate for the location. Dress them in ${clothingDescription}.
3. **Integration:** The people must be integrated seamlessly into the new environment. It is crucial to match the environmental lighting, shadows, and perspective perfectly to make it look authentic.
4. **HIGHEST PRIORITY (Preservation):** The faces, hair, and distinct facial features from the original images must be preserved with 100% accuracy. DO NOT alter their facial appearance.`;

        const parts: any[] = [{ text: prompt }];
        if (travelFile1) {
            parts.push({ inlineData: { mimeType: travelFile1.mimeType, data: travelFile1.base64 } });
        }
        if (travelFile2) {
            parts.push({ inlineData: { mimeType: travelFile2.mimeType, data: travelFile2.base64 } });
        }
        
        const promises: Promise<string | undefined>[] = [];
        for (let i = 0; i < imageCount; i++) {
            promises.push(generateImage(parts));
        }

        try {
            const results = await Promise.all(promises);
            displayTravelResults(results.filter(r => r) as string[]);
        } catch (error: any) {
            console.error("Error generating travel photo:", error);
            showTravelErrorState(error.message);
        } finally {
            setTravelLoadingState(false);
        }
    });

    function setTravelLoadingState(isLoading: boolean) {
        generateBtn.disabled = isLoading;
        resultsLoader.classList.toggle('hidden', !isLoading);

        if (isLoading) {
            resultsPlaceholder.classList.add('hidden');
            errorMessage.classList.add('hidden');
            resultsGrid.classList.add('hidden');
            resultsGrid.innerHTML = '';
        }
    }
    
    function showTravelErrorState(message: string) {
        resultsPlaceholder.classList.add('hidden');
        resultsLoader.classList.add('hidden');
        resultsGrid.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorDetails.textContent = message;
    }
    
    function displayTravelResults(images: string[]) {
        setTravelLoadingState(false);
        resultsGrid.innerHTML = '';
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