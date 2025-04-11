// This script runs after the HTML DOM is fully loaded because it's placed at the end of the <body>

// Get references to DOM elements
const imageUpload = document.getElementById('imageUpload');
const examNameSelect = document.getElementById('examNameSelect');
const imageTypeSelect = document.getElementById('imageTypeSelect');
const imageTypeSection = document.getElementById('imageTypeSection'); // Container for type select
const processButton = document.getElementById('processButton');
const originalPreview = document.getElementById('originalPreview');
const originalInfo = document.getElementById('originalInfo');
const processedPreview = document.getElementById('processedPreview');
const processedInfo = document.getElementById('processedInfo');
const downloadLink = document.getElementById('downloadLink');
const resultSection = document.getElementById('resultSection');
const processingStatus = document.getElementById('processingStatus');
const errorMessage = document.getElementById('errorMessage');
const specInfo = document.getElementById('specInfo');

// Variables to store image data
let originalImageSrc = null;
let originalImageFile = null;

// --- Examination Specifications Data Structure ---
const examSpecs = {
    'jee_main': {
        name: "JEE Main",
        photo: { format: 'jpeg', minSizeKB: 10, maxSizeKB: 300, targetWidthPx: 132, targetHeightPx: 170, notes: "Req: 3.5x4.5cm (approx 132x170px). White background." },
        signature: { format: 'jpeg', minSizeKB: 10, maxSizeKB: 50, targetWidthPx: 132, targetHeightPx: 57, notes: "Req: 3.5x1.5cm (approx 132x57px). White background." }
    },
    'upsc': {
        name: "UPSC",
        photo: { format: 'jpeg', minSizeKB: 20, maxSizeKB: 300, minWidthPx: 350, minHeightPx: 350, maxWidthPx: 1000, maxHeightPx: 1000, notes: "Range: 350x350 to 1000x1000px. Preserves aspect ratio. Name/date needed (add manually)." },
        signature: { format: 'jpeg', minSizeKB: 20, maxSizeKB: 300, minWidthPx: 350, minHeightPx: 350, maxWidthPx: 1000, maxHeightPx: 1000, notes: "Range: 350x350 to 1000x1000px. Preserves aspect ratio. Black ink." }
    },
    'gate': {
        name: "GATE",
        photo: { format: 'jpeg', minSizeKB: 5, maxSizeKB: 1024, minWidthPx: 200, minHeightPx: 260, maxWidthPx: 530, maxHeightPx: 690, notes: "Range: 200x260 to 530x690px. Preserves aspect ratio. White background." },
        signature: { format: 'jpeg', minSizeKB: 5, maxSizeKB: 200, minWidthPx: 80, minHeightPx: 280, maxWidthPx: 160, maxHeightPx: 560, notes: "Range: 80x280 to 160x560px. Preserves aspect ratio. Black/dark blue ink." }
    },
    'ssc_je': {
        name: "SSC JE",
        photo: { format: 'jpeg', minSizeKB: 20, maxSizeKB: 50, targetWidthPx: 132, targetHeightPx: 170, notes: "Assuming 20-50KB, 3.5x4.5cm (approx 132x170px) - Verify official notification. Plain background." }, // Placeholder - VERIFY
        signature: { format: 'jpeg', minSizeKB: 10, maxSizeKB: 20, targetWidthPx: 151, targetHeightPx: 76, notes: "Assuming 10-20KB, 4x2cm (approx 151x76px) - Verify official notification. Black ink." } // Placeholder - VERIFY
    },
     'ibps_po': {
        name: "IBPS PO",
        photo: { format: 'jpeg', minSizeKB: 20, maxSizeKB: 50, targetWidthPx: 200, targetHeightPx: 230, notes: "Exact: 200x230px. Light/white background." },
        signature: { format: 'jpeg', minSizeKB: 10, maxSizeKB: 20, targetWidthPx: 140, targetHeightPx: 60, notes: "Exact: 140x60px. Black ink, no capitals." }
    },
    'ibps_rrb': {
        name: "IBPS RRB",
         photo: { format: 'jpeg', minSizeKB: 20, maxSizeKB: 50, targetWidthPx: 200, targetHeightPx: 230, notes: "Exact: 200x230px. Light/white background." },
        signature: { format: 'jpeg', minSizeKB: 10, maxSizeKB: 20, targetWidthPx: 140, targetHeightPx: 60, notes: "Exact: 140x60px. Black ink, no capitals." }
    },
    'ibps_clerk': {
        name: "IBPS Clerk",
        photo: { format: 'jpeg', minSizeKB: 20, maxSizeKB: 50, targetWidthPx: 200, targetHeightPx: 230, notes: "Exact: 200x230px." },
        signature: { format: 'jpeg', minSizeKB: 10, maxSizeKB: 20, targetWidthPx: 140, targetHeightPx: 60, notes: "Exact: 140x60px. Black ink, no capitals." }
        // Note: LTI and Declaration are separate and not handled here.
    },
    'keam': {
        name: "KEAM",
        photo: { format: 'jpeg', minSizeKB: 1, maxSizeKB: 100, targetWidthPx: 150, targetHeightPx: 200, notes: "Exact: 150x200px. Light background (white preferred)." },
        signature: { format: 'jpeg', minSizeKB: 1, maxSizeKB: 100, targetWidthPx: 150, targetHeightPx: 100, notes: "Exact: 150x100px. Black/blue ink." }
    },
    'tnpsc': {
        name: "TNPSC",
        photo: { format: 'jpeg', minSizeKB: 10 /* Assumed min */, maxSizeKB: 50 /* Assumed max */, targetWidthPx: 130, targetHeightPx: 170, notes: "Exact: 130x170px (4.5x3.5cm). Size not specified, assuming 10-50KB. Name/date needed (add manually)." }, // Size Needs Verification
        signature: { format: 'jpeg', minSizeKB: 10, maxSizeKB: 20, targetWidthPx: 230, targetHeightPx: 75, notes: "Exact: 230x75px (6x2cm). Blue/black ink." }
    }
};

// --- Function to Populate the Exam Name Dropdown ---
function populateExamNameDropdown() {
    for (const key in examSpecs) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = examSpecs[key].name;
        examNameSelect.appendChild(option);
    }
}

// --- Function to Populate the Image Type Dropdown ---
function populateImageTypeDropdown(examKey) {
    imageTypeSelect.innerHTML = '<option value="" disabled selected>-- Select Type --</option>';
    if (examKey && examSpecs[examKey]) {
        const examData = examSpecs[examKey];
        if (examData.photo) {
            const option = document.createElement('option');
            option.value = 'photo'; option.textContent = 'Photo';
            imageTypeSelect.appendChild(option);
        }
        if (examData.signature) {
            const option = document.createElement('option');
            option.value = 'signature'; option.textContent = 'Signature';
            imageTypeSelect.appendChild(option);
        }
        imageTypeSelect.disabled = false;
        imageTypeSection.classList.remove('hidden');
    } else {
        imageTypeSelect.disabled = true;
        imageTypeSection.classList.add('hidden');
    }
    specInfo.classList.add('hidden');
    specInfo.textContent = '';
}

// --- Function to Display Info About the Selected Spec ---
function displaySpecInfo(spec) {
     if (spec) {
        let info = `Format: ${spec.format.toUpperCase()}, Size: ${spec.minSizeKB}-${spec.maxSizeKB} KB. `;
        if (spec.targetWidthPx && spec.targetHeightPx) {
            info += `Dimensions: ${spec.targetWidthPx}x${spec.targetHeightPx}px. `;
        } else if (spec.maxWidthPx && spec.maxHeightPx) {
            info += `Dimensions: ${spec.minWidthPx}x${spec.minHeightPx}px to ${spec.maxWidthPx}x${spec.maxHeightPx}px. `;
        }
        if (spec.notes) { info += `Notes: ${spec.notes}`; }
        specInfo.textContent = info;
        specInfo.classList.remove('hidden');
    } else {
        specInfo.classList.add('hidden');
        specInfo.textContent = '';
    }
}

// --- Function to Enable/Disable the Process Button ---
function checkEnableProcessButton() {
    processButton.disabled = !(originalImageSrc && examNameSelect.value && imageTypeSelect.value);
}

// --- Event Listener for Image Upload ---
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        originalImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImageSrc = e.target.result;
            originalPreview.src = originalImageSrc;
            originalPreview.classList.remove('hidden');
            const img = new Image();
            img.onload = () => {
                originalInfo.textContent = `Original: ${img.width}x${img.height}px, ${(file.size / 1024).toFixed(1)} KB`;
            };
            img.src = originalImageSrc;
            resetResults();
            checkEnableProcessButton();
            hideError();
        };
        reader.readAsDataURL(file);
    } else {
        showError("Please upload a valid image file (JPG, JPEG, PNG).");
        resetUpload();
    }
});

 // --- Event Listener for Exam Name Selection ---
examNameSelect.addEventListener('change', () => {
    const selectedExamKey = examNameSelect.value;
    populateImageTypeDropdown(selectedExamKey);
    resetResults();
    checkEnableProcessButton();
});

// --- Event Listener for Image Type Selection ---
imageTypeSelect.addEventListener('change', () => {
    const selectedExamKey = examNameSelect.value;
    const selectedTypeKey = imageTypeSelect.value;
    if (selectedExamKey && selectedTypeKey && examSpecs[selectedExamKey]?.[selectedTypeKey]) {
        const spec = examSpecs[selectedExamKey][selectedTypeKey];
        displaySpecInfo(spec);
    } else {
        displaySpecInfo(null);
    }
    resetResults();
    checkEnableProcessButton();
});

// --- Function to Reset the Upload State ---
function resetUpload() {
    imageUpload.value = '';
    originalImageSrc = null;
    originalImageFile = null;
    originalPreview.classList.add('hidden');
    originalPreview.src = '#';
    originalInfo.textContent = 'Upload an image to see preview';
    examNameSelect.value = '';
    imageTypeSelect.innerHTML = '<option value="" disabled selected>-- Select Type --</option>';
    imageTypeSelect.disabled = true;
    imageTypeSection.classList.add('hidden');
    specInfo.classList.add('hidden');
    resetResults();
    checkEnableProcessButton();
}

// --- Function to Reset the Results Section ---
function resetResults() {
     resultSection.classList.add('hidden');
     processedPreview.src = '#';
     processedInfo.textContent = '';
     processingStatus.classList.add('hidden');
     processingStatus.textContent = '';
     downloadLink.classList.add('hidden');
     downloadLink.href = '#';
}

// --- Function to Display Error Messages ---
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    processingStatus.classList.add('hidden');
    resultSection.classList.add('hidden');
}

// --- Function to Hide Error Messages ---
function hideError() {
     errorMessage.classList.add('hidden');
     errorMessage.textContent = '';
}

 // --- Function to Display Status Messages ---
function showStatus(message, type = 'info') {
    processingStatus.textContent = message;
    processingStatus.classList.remove('hidden');
    hideError(); // Hide errors when status is shown
    processingStatus.className = 'status'; // Reset class

    switch (type) {
        case 'processing':
            processingStatus.style.color = '#e67e22'; // Orange
            processingStatus.style.backgroundColor = '#fdf3e6';
            processingStatus.style.border = '1px solid #f5c58f';
            break;
        case 'success':
            processingStatus.style.color = '#218838'; // Darker Green
            processingStatus.style.backgroundColor = '#d4edda'; // Light Green
            processingStatus.style.border = '1px solid #c3e6cb';
            break;
        case 'warning': // Added warning type for size issues
            processingStatus.style.color = '#856404'; // Dark Yellow
            processingStatus.style.backgroundColor = '#fff3cd'; // Light Yellow
            processingStatus.style.border = '1px solid #ffeeba';
            break;
        case 'error': // Use showError function preferably
             showError(message);
             processingStatus.classList.add('hidden');
             break;
        default: // Info
            processingStatus.style.color = '#004085'; // Darker Blue
            processingStatus.style.backgroundColor = '#cce5ff'; // Light Blue
            processingStatus.style.border = '1px solid #b8daff';
    }
}


// --- Event Listener for Process Button Click ---
processButton.addEventListener('click', async () => {
    const selectedExamKey = examNameSelect.value;
    const selectedTypeKey = imageTypeSelect.value;

    if (!originalImageSrc || !selectedExamKey || !selectedTypeKey || !originalImageFile) {
        showError("Please complete all steps: upload image, select exam, and select type.");
        return;
    }

    const spec = examSpecs[selectedExamKey]?.[selectedTypeKey];
    if (!spec) {
         showError("Could not find specifications for the selected exam and type.");
         return;
    }

    resetResults();
    hideError();
    showStatus("Processing... Please wait.", 'processing');
    processButton.disabled = true;

    try {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let targetWidth, targetHeight;

            // --- Determine Target Dimensions ---
             if (spec.targetWidthPx && spec.targetHeightPx) {
                targetWidth = spec.targetWidthPx; targetHeight = spec.targetHeightPx;
            } else if (spec.maxWidthPx && spec.maxHeightPx) {
                const ratio = Math.min(spec.maxWidthPx / img.width, spec.maxHeightPx / img.height);
                targetWidth = Math.floor(img.width * ratio); targetHeight = Math.floor(img.height * ratio);
                if (targetWidth < spec.minWidthPx || targetHeight < spec.minHeightPx) {
                    showStatus(`Error: Resized image (${targetWidth}x${targetHeight}px) is smaller than the minimum required dimensions (${spec.minWidthPx}x${spec.minHeightPx}px).`, 'error');
                    processButton.disabled = false; return;
                }
            } else {
                showStatus("Error: Image dimension requirements unclear.", 'error');
                 processButton.disabled = false; return;
            }

            // Set canvas dimensions
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // --- Set High Quality Image Smoothing ---
            // Might slightly increase file size when scaling up by using a better algorithm
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw the image onto the canvas
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);


            // --- Adjust Quality to Meet File Size ---
            const minBytes = spec.minSizeKB * 1024;
            const maxBytes = spec.maxSizeKB * 1024;
            const outputFormat = `image/${spec.format}`;
            let quality = 0.9; // Start high
            let processedDataURL = null;
            let processedBlob = null;
            let bestAttemptBlob = null;
            let bestAttemptDataURL = null;
            let foundInRange = false;
            let finalQualityUsed = quality; // Track the quality

            // Iteratively decrease quality to fit within max size
            for (let attempts = 0; attempts < 10; attempts++) {
                processedDataURL = canvas.toDataURL(outputFormat, quality);
                processedBlob = await dataURLtoBlob(processedDataURL);
                finalQualityUsed = quality; // Store quality used for this blob

                if (attempts === 0) { // Store the result of the first attempt
                    bestAttemptBlob = processedBlob;
                    bestAttemptDataURL = processedDataURL;
                }

                if (processedBlob.size >= minBytes && processedBlob.size <= maxBytes) {
                    foundInRange = true; // Found a size within the range
                    break;
                } else if (processedBlob.size > maxBytes) {
                    quality = Math.max(0.1, quality - 0.1); // Reduce quality, min 0.1
                    if (quality <= 0.1 && processedBlob.size > maxBytes) {
                         // If even lowest quality is too big, mark as failure to fit
                         processedBlob = null;
                         break;
                    }
                } else { // Size is already below minBytes
                    // If size is below min, try quality 1.0 as a last resort attempt
                    if (quality !== 1.0) {
                        quality = 1.0; // Try max quality
                        processedDataURL = canvas.toDataURL(outputFormat, quality);
                        processedBlob = await dataURLtoBlob(processedDataURL);
                        finalQualityUsed = quality;

                        // Check if max quality is within range
                        if (processedBlob.size >= minBytes && processedBlob.size <= maxBytes) {
                            foundInRange = true;
                        } else {
                            // If max quality is still too small OR too large (unlikely if initial was small)
                            // Use the best attempt we had earlier (usually the initial high-quality one)
                            processedBlob = bestAttemptBlob;
                            processedDataURL = bestAttemptDataURL;
                            // We know this is below minBytes, foundInRange remains false
                        }
                    } else {
                         // If we already tried quality 1.0 and it was too small
                         processedBlob = bestAttemptBlob; // Use the result from quality 1.0
                         processedDataURL = bestAttemptDataURL;
                         // foundInRange remains false
                    }
                    break; // Exit loop after handling undersize case
                }
            } // End of quality adjustment loop

            // --- Final Check and Result Display ---
            if (foundInRange && processedBlob) {
                // Case 1: Successfully found size within range
                const finalSizeKB = (processedBlob.size / 1024).toFixed(1);
                displaySuccessResult(processedDataURL, processedBlob, canvas.width, canvas.height, spec, selectedExamKey, selectedTypeKey);
                showStatus(`Processing Complete. Size: ${finalSizeKB}KB. Dimensions: ${canvas.width}x${canvas.height}px. (Quality: ${finalQualityUsed.toFixed(1)})`, 'success');
            } else if (processedBlob && processedBlob.size < minBytes) {
                 // Case 2: Best attempt (likely max quality) was below minimum size
                 const finalSizeKB = (processedBlob.size / 1024).toFixed(1);
                 displaySuccessResult(processedDataURL, processedBlob, canvas.width, canvas.height, spec, selectedExamKey, selectedTypeKey); // Still show the result
                 // Provide a clear warning message
                 showStatus(`Warning: File size (${finalSizeKB}KB) is below the minimum requirement (${spec.minSizeKB}KB) even at highest quality (1.0) and best resizing. The source image may lack sufficient detail or resolution for these requirements. Consider using a higher-resolution source image if possible.`, 'warning');
            } else {
                // Case 3: Failed to meet requirements (e.g., couldn't get below max size, or other errors)
                const currentSizeKB = processedBlob ? (processedBlob.size / 1024).toFixed(1) : 'N/A';
                showStatus(`Error: Could not meet file size requirements (${spec.minSizeKB}-${spec.maxSizeKB} KB). Final attempt size: ${currentSizeKB}KB. Please try a different source image or adjust manually.`, 'error');
            }
        };
        img.onerror = () => {
             showStatus("Error loading the uploaded image for processing.", 'error');
             processButton.disabled = false;
        };
        img.src = originalImageSrc;

    } catch (error) {
        console.error("Processing error:", error);
        showStatus("An unexpected error occurred during processing.", 'error');
    } finally {
         processButton.disabled = false; // Re-enable button
    }
});

// --- Helper Function to Display Successful Result ---
function displaySuccessResult(dataURL, blob, width, height, spec, examKey, typeKey) {
    const finalSizeKB = (blob.size / 1024).toFixed(1);
    processedPreview.src = dataURL;
    processedInfo.textContent = `Processed: ${width}x${height}px, ${finalSizeKB} KB`;
    downloadLink.href = dataURL;
    downloadLink.download = `processed_${examKey}_${typeKey}.${spec.format}`;
    downloadLink.classList.remove('hidden');
    resultSection.classList.remove('hidden');
}


// --- Helper Function: Convert Data URL to Blob ---
async function dataURLtoBlob(dataurl) {
    const res = await fetch(dataurl);
    return await res.blob();
}

// --- Initial Setup on Page Load ---
populateExamNameDropdown();
imageTypeSection.classList.add('hidden');
specInfo.classList.add('hidden');
resultSection.classList.add('hidden');
processingStatus.classList.add('hidden');
errorMessage.classList.add('hidden');
downloadLink.classList.add('hidden');

