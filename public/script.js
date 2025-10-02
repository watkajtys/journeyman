document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const storyTextContainerElement = document.getElementById('story-text-container');
    const choicesContainerElement = document.getElementById('choices-container');
    const imageContainerElement = document.getElementById('image-container');
    const narrativeContainerElement = document.getElementById('narrative-container');
    const imageElements = [document.getElementById('scene-image-1'), document.getElementById('scene-image-2')];
    let activeImageIndex = 0;
    const loadingSpinnerElement = document.getElementById('loading-spinner');
    const stopButtonElement = document.getElementById('stop-button');

    // --- API Configuration ---
    // API key is now securely stored server-side
    const API_URL = '/api/generate-image';
    const getAdminToken = () => sessionStorage.getItem('adminToken');

    // --- Game State ---
    let storyData = {};
    let currentNodeId = 'start';
    let imageCache = {};
    let locationImageCache = {}; // Cache for master location images
    let lastImageB64 = null;
    let generationController;
    let isGenerating = false; // To prevent concurrent generations
    let isDisplayingText = false;
    let navigationHistory = [];
    let historyIndex = -1;
    let visitedNodes = []; // Track nodes visited in order
    
    // Create getter functions so overlay editor always gets current values
    Object.defineProperty(window, 'storyData', {
        get: function() { return storyData; },
        set: function(value) { storyData = value; }
    });
    Object.defineProperty(window, 'currentNodeId', {
        get: function() { return currentNodeId; },
        set: function(value) { currentNodeId = value; }
    });
    Object.defineProperty(window, 'imageCache', {
        get: function() { return imageCache; },
        set: function(value) { imageCache = value; }
    });
    Object.defineProperty(window, 'visitedNodes', {
        get: function() { return visitedNodes; },
        set: function(value) { visitedNodes = value; }
    });
    window.generationController = generationController;
    window.navigationHistory = navigationHistory;
    let skipTextAnimation = false;
    let playerState = {
        visitedServerRoom: false,
        visitedMedBay: false,
    };
    let flashbackStateStack = []; // Stack to hold pre-flashback states

    // Function to show end of narrative message
    async function showEndOfNarrativeMessage() {
        // Create a placeholder canvas with the message
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some atmospheric effects
        ctx.fillStyle = 'rgba(138, 43, 226, 0.1)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                Math.random() * 200 + 50,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Add text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Lora, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw main message
        ctx.fillText('END OF RENDERED CONTENT', canvas.width / 2, canvas.height / 2 - 60);
        
        ctx.font = '32px Lora, serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('You\'ve reached the edge of the', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('currently available narrative', canvas.width / 2, canvas.height / 2 + 60);
        
        ctx.font = 'italic 28px Lora, serif';
        ctx.fillStyle = '#8a2be2';
        ctx.fillText('More content coming soon...', canvas.width / 2, canvas.height / 2 + 120);
        
        // Convert canvas to data URL and display
        const placeholderImage = canvas.toDataURL('image/png');
        await updateImage(placeholderImage);
    }

    // --- Initialization ---
    async function init() {
        try {
            // Try to load from cloud storage first
            let response = await fetch('/api/load');
            
            if (response.ok) {
                console.log('Loading story from cloud storage');
                storyData = await response.json();
            } else {
                // Fall back to static story.json if cloud storage is empty or fails
                console.log('No cloud save found, loading default story');
                response = await fetch(`story.json?t=${new Date().getTime()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                storyData = await response.json();
            }
            
            // The setters will automatically update window references
            currentNodeId = 'opening_scene'; // Set the starting node
            
            // Rebuild image cache from saved data
            if (storyData.nodes) {
                let base64Count = 0;
                let urlCount = 0;
                for (const nodeId in storyData.nodes) {
                    const node = storyData.nodes[nodeId];
                    // Only cache base64 images immediately, R2 URLs will be fetched on demand
                    if (node.pre_rendered_image) {
                        // Cache base64 images immediately
                        imageCache[nodeId] = node.pre_rendered_image;
                        base64Count++;
                    } else if (node.image_url) {
                        // Don't cache URLs - they'll be fetched when needed
                        urlCount++;
                    }
                }
                console.log(`Loaded ${base64Count} base64 images, ${urlCount} R2 URLs available`);
            }
            
            await showNode(currentNodeId);
        } catch (error) {
            storyTextContainerElement.innerHTML = `<p>Error loading story: ${error}. Please check that story.json is available.</p>`;
            narrativeContainerElement.classList.remove('hide');
            console.error("Failed to load story:", error);
        }
    }

    // --- UI State Management ---
    function setChoicesEnabled(enabled) {
        choicesContainerElement.querySelectorAll('.choice-button').forEach(button => {
            button.disabled = !enabled;
            button.style.cursor = enabled ? 'pointer' : 'not-allowed';
            button.style.opacity = enabled ? '1' : '0.7';
        });
    }

    function showLoading(show) {
        loadingSpinnerElement.classList.toggle('hidden', !show);
        stopButtonElement.classList.toggle('hidden', !show);
    }

    // --- Text Display Logic ---
    async function displayText(node) {
        return new Promise(async (resolve) => {
            isDisplayingText = true;
            storyTextContainerElement.innerHTML = ''; // Clear previous content
            const chunks = node.text.split('||').map(s => s.trim()).filter(s => s.length > 0);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const p = document.createElement('p');
                p.className = 'story-text-chunk';
                storyTextContainerElement.appendChild(p);

                // Start typewriter for the current chunk
                await typeWriterChunk(p, chunk);

                // Wait a short moment before typing the next chunk.
                await new Promise(res => setTimeout(res, 350));
            }
            isDisplayingText = false;

            // --- Handle Automatic Post-Text Actions ---
            const isTitleCard = !node.choices || node.choices.length === 0;

            if (isTitleCard && node.auto_transition_delay) {
                 setTimeout(() => {
                    narrativeContainerElement.classList.add('hide');
                    // Wait for the modal to fade out before transitioning
                    setTimeout(() => handleChoice(node.choices[0]), 500);
                }, node.auto_transition_delay);
                 resolve();
            } else if (node.auto_flashback) {
                setChoicesEnabled(false);
                setTimeout(() => enterFlashback(node.auto_flashback), 800);
            } else if (node.auto_transition && node.choices && node.choices.length > 0) {
                // Check if overlay editor is open before auto-transitioning
                if (window.overlayEditorOpen) {
                    console.log('Auto-transition paused - overlay editor is open');
                    // Show a continue button instead
                    renderChoiceNode(node);
                    setChoicesEnabled(true);
                } else {
                    setChoicesEnabled(false);
                    const delay = node.transition_delay || 800;
                    setTimeout(() => {
                        // Double-check the editor hasn't opened during the delay
                        if (!window.overlayEditorOpen) {
                            handleChoice(node.choices[0]);
                        } else {
                            console.log('Auto-transition cancelled - overlay editor opened');
                            renderChoiceNode(node);
                            setChoicesEnabled(true);
                        }
                    }, delay);
                }
            } else {
                resolve();
            }
        });
    }

    function typeWriterChunk(element, text) {
        return new Promise(resolve => {
            skipTextAnimation = false; // Reset for each new chunk
            element.innerHTML = ''; // Clear previous text
            const words = text.split(' ');
            let wordIndex = 0;
            const cursor = document.createElement('span');
            cursor.className = 'typewriter-cursor';
            element.appendChild(cursor);

            function typeWord() {
                if (skipTextAnimation) {
                    element.innerHTML = text; // Instantly set the full text
                    cursor.remove();
                    resolve();
                    return;
                }

                if (wordIndex < words.length) {
                    const wordSpan = document.createElement('span');
                    wordSpan.textContent = words[wordIndex] + (wordIndex < words.length - 1 ? ' ' : '');
                    element.insertBefore(wordSpan, cursor);
                    wordIndex++;
                    setTimeout(typeWord, 100); // Delay between words
                } else {
                    cursor.remove();
                    resolve();
                }
            }
            typeWord();
        });
    }


    // --- Image Logic ---
    function updateImage(newSrc) {
        return new Promise((resolve) => {
            if (!newSrc) {
                imageElements.forEach(img => img.classList.remove('active'));
                resolve();
                return;
            }

            const inactiveImageIndex = 1 - activeImageIndex;
            const activeImage = imageElements[activeImageIndex];
            const inactiveImage = imageElements[inactiveImageIndex];

            const tempImg = new Image();
            tempImg.onload = () => {
                inactiveImage.src = tempImg.src;
                setTimeout(() => {
                    activeImage.classList.remove('active');
                    inactiveImage.classList.add('active');
                    activeImageIndex = inactiveImageIndex;
                    setTimeout(resolve, 1500); // Match CSS transition
                }, 50);
            };
            tempImg.onerror = (err) => {
                console.error("Failed to load image for display:", err);
                resolve(); // Don't block the game
            };
            tempImg.src = newSrc;
        });
    }

    // --- Core Scene Rendering Logic ---
    async function showNode(nodeId) {
        // Track visited nodes for history - handle forward and back navigation properly
        const currentIndex = visitedNodes.indexOf(nodeId);
        
        if (currentIndex !== -1) {
            // We're navigating to a node that's already in history
            // Truncate the history to remove any "forward" nodes
            visitedNodes = visitedNodes.slice(0, currentIndex + 1);
            console.log('Navigated back to existing node:', nodeId);
        } else if (visitedNodes[visitedNodes.length - 1] !== nodeId) {
            // This is a new node, add it to history
            visitedNodes.push(nodeId);
            console.log('Added new node to history:', nodeId);
        }
        console.log('Visited nodes history:', visitedNodes);
        
        // --- State-based Node Redirection (Soft Gate) ---
        if (nodeId === 'access_sensor_logs' && !playerState.visitedServerRoom && !playerState.visitedMedBay) {
            nodeId = 'bridge_knowledge_gap';
        }

        currentNodeId = nodeId; // Setter will automatically update window reference
        const node = storyData.nodes[currentNodeId]; // Access node from storyData.nodes

        if (!node) {
            console.error(`Node "${nodeId}" not found.`);
            storyTextContainerElement.innerHTML = `<p>An error occurred: The story path is broken for node ID: ${nodeId}</p>`;
            narrativeContainerElement.classList.add('visible');
            return;
        }

        // 1. Hide narrative, clear choices
        narrativeContainerElement.classList.add('hide');
        clearChoices();
        setChoicesEnabled(false);

        // 2. Load and display the image (story continues even if this fails)
        await loadAndDisplayScene(node);

        // 3. Preload next images in the background
        preloadChoiceImages(node);

        // 4. Show the narrative and animate text
        narrativeContainerElement.classList.remove('hide');
        await displayText(node);

        // 5. Render choices (if it's not an auto-transitioning or title card node)
        const isTitleCard = !node.choices || node.choices.length === 0;
        if (!node.auto_transition && !isTitleCard) {
            renderChoiceNode(node);
            setChoicesEnabled(true);
        }
    }

    async function loadAndDisplayScene(node) {
        // Sync with window.imageCache in case overlay editor added images
        if (window.imageCache && window.imageCache[node.id]) {
            imageCache[node.id] = window.imageCache[node.id];
        }
        
        let imageSrc = imageCache[node.id];

        // --- Standardized Image Loading Strategy: R2 → Base64 → Generation ---
        if (node.image_url) {
            console.log("Using R2 image URL for node:", node.id);
            // For R2 URLs, try to load the actual image data for smooth display
            try {
                const response = await fetch(node.image_url);
                if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    imageSrc = await new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                    imageCache[node.id] = imageSrc; // Cache the base64 for performance
                    console.log("Loaded and cached R2 image for node:", node.id);
                } else {
                    console.warn("Failed to fetch R2 image, using URL directly:", response.status);
                    imageSrc = node.image_url; // Use URL directly as fallback
                }
            } catch (err) {
                console.error("Error fetching R2 image, using URL directly:", err);
                imageSrc = node.image_url;
            }
        } else if (node.pre_rendered_image) {
            console.log("Using legacy base64 image for node:", node.id);
            imageSrc = node.pre_rendered_image;
            imageCache[node.id] = imageSrc; // Add to cache for consistency
        }
        // --- End ---

        // if (!imageSrc) {
        //     // Skip generation if overlay editor is open
        //     if (window.overlayEditorOpen) {
        //         console.log('Skipping image generation - overlay editor is open');
        //         await updateImage(null);
        //         return imageSrc;
        //     }
            
        //     generationController = new AbortController();
        //     window.generationController = generationController; // Update window reference
        //     isGenerating = true;
        //     showLoading(true);
        //     try {
        //         // Determine the correct context image (location master or last image)
        //         let contextImageB64 = lastImageB64;
        //         if (node.location && locationImageCache[node.location]) {
        //             contextImageB64 = locationImageCache[node.location];
        //         }

        //         const { imageData } = await getGeneratedImage(node, generationController.signal, contextImageB64);
        //         lastImageB64 = imageData; // Always update the last generated image
        //         imageSrc = `data:image/png;base64,${imageData}`;
        //         imageCache[node.id] = imageSrc; // Setter automatically updates window reference

        //         // Upload image to R2 storage with improved error handling
        //         let uploadSuccess = false;
        //         try {
        //             const base64Data = imageData; // Already pure base64 without prefix
        //             const binaryData = atob(base64Data);
        //             const bytes = new Uint8Array(binaryData.length);
        //             for (let i = 0; i < binaryData.length; i++) {
        //                 bytes[i] = binaryData.charCodeAt(i);
        //             }
        //             const blob = new Blob([bytes], { type: 'image/png' });
                    
        //             // Validate blob size
        //             if (blob.size > 10 * 1024 * 1024) {
        //                 throw new Error('Image too large (max 10MB)');
        //             }
                    
        //             console.log(`Uploading ${(blob.size / 1024).toFixed(2)}KB image for node: ${node.id}`);
                    
        //             const uploadResponse = await fetch(`/api/images/${encodeURIComponent(node.id)}`, {
        //                 method: 'PUT',
        //                 body: blob,
        //                 headers: {
        //                     'Content-Type': 'image/png'
        //                 }
        //             });
                    
        //             if (uploadResponse.ok) {
        //                 const result = await uploadResponse.json();
        //                 console.log(`Image uploaded to R2: ${result.path}`);
        //                 // Update node with image URL and remove base64
        //                 node.image_url = `/api/images/${encodeURIComponent(node.id)}`;
        //                 delete node.pre_rendered_image; // Remove old base64 to prevent confusion
        //                 uploadSuccess = true;
        //             } else {
        //                 const errorText = await uploadResponse.text();
        //                 console.error(`Failed to upload image to R2 (${uploadResponse.status}):`, errorText);
        //             }
        //         } catch (uploadError) {
        //             console.error('Error uploading image to R2:', uploadError);
        //         }
                
        //         // If upload failed, fall back to base64 storage
        //         if (!uploadSuccess) {
        //             console.warn('Falling back to base64 storage for node:', node.id);
        //             node.pre_rendered_image = imageSrc; // Store the full data URL
        //             delete node.image_url; // Remove URL to prevent confusion
        //         }
                
        //         // Always save the story data after image handling
        //         try {
        //             const saveSuccess = await saveToCloud();
        //             if (!saveSuccess) {
        //                 console.error('Failed to save story data after image generation');
        //             }
        //         } catch (saveError) {
        //             console.error('Error saving story data:', saveError);
        //         }

        //         // If this is the first time visiting a location, cache its image
        //         if (node.location && !locationImageCache[node.location]) {
        //             locationImageCache[node.location] = imageData;
        //         }

        //     } catch (error) {
        //         if (error.name === 'AbortError') {
        //             console.log('Image generation stopped.');
        //         } else {
        //             console.error("Error generating image:", error);
                    
        //             // Check if this is the "end of narrative" message
        //             if (error.message && error.message.includes('currently rendered narrative')) {
        //                 // Show a special end-of-content message with placeholder image
        //                 await showEndOfNarrativeMessage();
        //                 // Disable further navigation
        //                 const choicesContainer = document.getElementById('choices-container');
        //                 if (choicesContainer) {
        //                     choicesContainer.innerHTML = '<p style="color: #8a2be2; font-style: italic; text-align: center; margin-top: 20px;">You\'ve reached the end of the available content.</p>';
        //                 }
        //                 return; // Stop execution here
        //             } else {
        //                 // Fallback: proceed without an image, narrative will still be shown.
        //                 await updateImage(null);
        //             }
        //         }
        //     } finally {
        //         showLoading(false);
        //         isGenerating = false;
        //     }
        // }

        await updateImage(imageSrc);
    }

    function clearChoices() {
        choicesContainerElement.innerHTML = '';
    }

    function renderChoiceNode(node) {
        if (!node.choices) return;
        node.choices.forEach(choice => {
            const button = document.createElement('button');
            button.classList.add('choice-button');
            button.innerText = choice.text;
            button.addEventListener('click', () => handleChoice(choice), { once: true });
            choicesContainerElement.appendChild(button);
        });
    }

    function updatePlayerState(nodeId) {
        if (nodeId === 'go_to_server_room') {
            playerState.visitedServerRoom = true;
        } else if (nodeId === 'go_to_med_bay') {
            playerState.visitedMedBay = true;
        }
    }

    function enterFlashback(targetNodeId) {
        // Save current state to the stack. We save the node ID we are *leaving from*.
        const currentState = {
            returnNodeId: currentNodeId,
            playerState: JSON.parse(JSON.stringify(playerState)) // Deep copy
        };
        flashbackStateStack.push(currentState);
        console.log('Entering flashback. State saved:', currentState);
        showNode(targetNodeId);
    }

    function exitFlashback(targetNodeId) {
        if (flashbackStateStack.length === 0) {
            console.error("Cannot exit flashback: stack is empty.");
            showNode('start'); // Fallback to start
            return;
        }
        const previousState = flashbackStateStack.pop();
        playerState = previousState.playerState;
        console.log('Exiting flashback. Restoring state to:', previousState);

        // If the choice ending the flashback provides a target, go there.
        // Otherwise, return to the node that triggered the flashback.
        const destinationNode = targetNodeId || previousState.returnNodeId;
        showNode(destinationNode);
    }

    async function handleChoice(choice) {
        // Prevent new choices while one is being processed
        setChoicesEnabled(false);

        // Hide the narrative before starting the transition
        narrativeContainerElement.classList.add('hide');

        // Wait for narrative to fade out before proceeding
        await new Promise(resolve => setTimeout(resolve, 500));

        // --- Handle Flashback Logic ---
        // A choice can either trigger a flashback or end one.
        if (choice.flashback_trigger) {
            enterFlashback(choice.target_id);
            return; // Stop further execution
        }
        if (choice.flashback_end) {
            // Pass the target_id from the choice, if it exists.
            exitFlashback(choice.target_id);
            return; // Stop further execution
        }

        updatePlayerState(choice.target_id);

        // --- Handle potential intermediary transition image ---
        if (choice.transition_prompt) {
            const transitionCacheKey = `${currentNodeId}->${choice.target_id}`;
            let transitionImageSrc = imageCache[transitionCacheKey];

            if (!transitionImageSrc) {
                showLoading(true);
                try {
                    const pseudoNode = {
                        image_prompt: choice.transition_prompt,
                        no_context: choice.no_context || false
                    };
                    const { imageData } = await getGeneratedImage(pseudoNode, null, lastImageB64);
                    transitionImageSrc = `data:image/png;base64,${imageData}`;
                    imageCache[transitionCacheKey] = transitionImageSrc;
                } catch (error) {
                    console.error("Error generating transition image:", error);
                }
                showLoading(false);
            }

            if (transitionImageSrc) {
                await updateImage(transitionImageSrc);
            }
        }

        // --- Proceed to the next story node ---
        showNode(choice.target_id);
    }

    // --- Background Image Preloading ---
    function preloadChoiceImages(node) {
        if (!node.choices) return;

        node.choices.forEach(choice => {
            const nextNodeId = choice.target_id;
            const nextNode = storyData.nodes[nextNodeId];

            // Preload main image for the next node
            if (nextNode && nextNode.image_prompt && !imageCache[nextNodeId]) {
                // Determine context for preloading
                let contextImageB64 = lastImageB64;
                if (nextNode.location && locationImageCache[nextNode.location]) {
                    contextImageB64 = locationImageCache[nextNode.location];
                }

                getGeneratedImage(nextNode, null, contextImageB64, true)
                    .then(({ imageData }) => {
                        imageCache[nextNodeId] = `data:image/png;base64,${imageData}`;
                        console.log(`Preloaded image for: ${nextNodeId}`);
                    })
                    .catch(err => console.warn(`Preloading failed for ${nextNodeId}:`, err));
            }
        });
    }

    // --- API Call ---
    async function getGeneratedImage(node, signal, contextImageB64 = null, isPreload = false) {
        // 1. Assemble the prompt from different parts
        let promptParts = [];

        // Determine which style guide to use
        const styleKey = node.style_override || 'default';
        const styleGuide = storyData.style_guides?.[styleKey] || storyData.style_guides?.default || '';
        if (styleGuide) {
            promptParts.push(styleGuide);
        }

        promptParts.push("Use a landscape aspect ratio (16:9) for the image.");
        // Add character descriptions
        if (node.characters_present && storyData.characters) {
            const characterDescriptions = node.characters_present.map(charId => {
                return storyData.characters[charId]?.description || '';
            }).join(' ');
            if (characterDescriptions) {
                 promptParts.push(`Character details: ${characterDescriptions}`);
            }
        }

        // Add the scene-specific prompt
        promptParts.push(node.image_prompt);

        const finalPrompt = promptParts.join('. ');
        
        console.log('[MAIN GAME] Generating image for node:', node.id);
        console.log('[MAIN GAME] Prompt parts:', promptParts);
        console.log('[MAIN GAME] Final prompt:', finalPrompt);
        console.log('[MAIN GAME] Node data:', {
          id: node.id,
          style_override: node.style_override,
          characters_present: node.characters_present,
          image_prompt: node.image_prompt
        });

        // 2. Construct the API payload
        const parts = [{ text: finalPrompt }];
        const noContext = node.no_context || false;

        if (contextImageB64 && !noContext) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: contextImageB64 } });
            parts.unshift({ text: "Use the previous image as a strong reference for the environment, characters, and art style. Then, create a new image that follows the new prompt:" });
        }

        // Prepare payload for server-side generation
        const payload = {
            prompt: finalPrompt,
            contextImage: (contextImageB64 && !noContext) ? contextImageB64 : null
        };

        const headers = { 'Content-Type': 'application/json' };
        // Add admin token if user is authorized
        const adminToken = getAdminToken();
        if (adminToken) {
            headers['X-Admin-Token'] = adminToken;
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            signal: signal
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error Response:", errorBody);
            if (response.status === 403 && errorBody.message) {
                // This is the "end of narrative" message for non-admin users
                throw new Error(errorBody.message);
            }
            throw new Error(`API Error: ${errorBody.error || 'Generation failed'}`);
        }
        const data = await response.json();
        
        // Handle the response from our worker endpoint
        if (data.candidates?.[0]?.content?.parts) {
            // Response from Gemini via worker
            const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
            if (!imagePart) {
                console.warn("API Response did not contain image data:", data);
                throw new Error("No image data found in API response.");
            }
            return { imageData: imagePart.inlineData.data };
        } else if (data.image) {
            // Direct image response from worker
            return { imageData: data.image };
        } else {
            throw new Error("Invalid response format from server");
        }
    }

    // --- Event Listeners ---
    stopButtonElement.addEventListener('click', () => {
        if (generationController) generationController.abort();
    });

    storyTextContainerElement.addEventListener('click', () => {
        if (isDisplayingText) {
            skipTextAnimation = true;
        }
    });

    // --- Cloud Storage Functions ---
    async function saveToCloud() {
        if (!storyData) {
            console.error('No story data to save');
            return false;
        }
        
        try {
            // Basic validation and cleanup
            validateAndCleanupStoryData();
            
            // Count images by type for logging
            let r2Count = 0, base64Count = 0;
            for (const nodeId in storyData.nodes) {
                const node = storyData.nodes[nodeId];
                if (node.image_url) r2Count++;
                if (node.pre_rendered_image) base64Count++;
            }
            
            console.log(`Saving story: ${Object.keys(storyData.nodes).length} nodes, ${r2Count} R2 images, ${base64Count} base64 images`);
            
            const payload = JSON.stringify(storyData);
            if (payload.length > 50 * 1024 * 1024) { // 50MB limit
                console.error('Story data too large for upload:', payload.length);
                return false;
            }
            
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Admin-Token': getAdminToken() || ''
                },
                body: payload
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Save failed with status ${response.status}: ${errorText}`);
            }
            
            const result = await response.text();
            console.log(`✅ Story saved to cloud successfully: ${result}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to save story to cloud:', error);
            // Don't show alert in main game flow to avoid interrupting gameplay
            return false;
        }
    }
    
    function validateAndCleanupStoryData() {
        if (!storyData.nodes || typeof storyData.nodes !== 'object') {
            console.error('Invalid story structure');
            return;
        }
        
        // Clean up any duplicate image storage
        for (const nodeId in storyData.nodes) {
            const node = storyData.nodes[nodeId];
            if (node.image_url && node.pre_rendered_image) {
                console.log(`Cleaning duplicate image storage for node: ${nodeId}`);
                delete node.pre_rendered_image; // Prefer R2 URLs
            }
        }
    }

    // --- Expose functions for overlay editor ---
    window.showNode = showNode;
    
    // --- Start the adventure ---
    init();
});
