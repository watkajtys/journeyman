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

    // --- Gemini API Configuration ---
    const API_KEY = 'AIzaSyC7puMSiLTOJJAY5Uf90L6MwtwJQwj44dg';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

    // --- Game State ---
    let storyData = {};
    let currentNodeId = 'start';
    let imageCache = {};
    let locationImageCache = {}; // Cache for master location images
    let lastImageB64 = null;
    let generationController;
    let isGenerating = false; // To prevent concurrent generations
    let isDisplayingText = false;
    let skipTextAnimation = false;
    let playerState = {
        visitedServerRoom: false,
        visitedMedBay: false,
    };
    let flashbackStateStack = []; // Stack to hold pre-flashback states

    // --- Initialization ---
    async function init() {
        try {
            const response = await fetch('story.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            storyData = await response.json();
            currentNodeId = 'opening_scene'; // Set the starting node
            await showNode(currentNodeId);
        } catch (error) {
            narrativeContainerElement.classList.remove('hidden');
            narrativeContainerElement.classList.add('visible');
            storyTextContainerElement.innerHTML = `<p>Error loading story: ${error}. Please check that story.json is available.</p>`;
            console.error("Failed to load story.json:", error);
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
            // A node can either trigger a flashback or auto-transition, but not both.
            // Flashback takes precedence.
            if (node.auto_flashback) {
                setChoicesEnabled(false);
                // After a short delay, trigger the flashback
                setTimeout(() => enterFlashback(node.auto_flashback), 800);
            } else if (node.auto_transition && node.choices && node.choices.length > 0) {
                setChoicesEnabled(false);
                // After a short delay, transition to the next node
                setTimeout(() => handleChoice(node.choices[0]), 800);
            } else {
                // If it's a standard node, resolve the promise to allow
                // the calling function to proceed and render choices.
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
        // --- State-based Node Redirection (Soft Gate) ---
        if (nodeId === 'access_sensor_logs' && !playerState.visitedServerRoom && !playerState.visitedMedBay) {
            nodeId = 'bridge_knowledge_gap';
        }

        currentNodeId = nodeId;
        const node = storyData.nodes[currentNodeId]; // Access node from storyData.nodes

        if (!node) {
            console.error(`Node "${nodeId}" not found.`);
            storyTextContainerElement.innerHTML = `<p>An error occurred: The story path is broken for node ID: ${nodeId}</p>`;
            narrativeContainerElement.classList.add('visible');
            return;
        }

        // 1. Hide old narrative and clear choices
        narrativeContainerElement.classList.remove('visible');
        clearChoices();
        setChoicesEnabled(false);

        // 2. Load and display the image (story continues even if this fails)
        await loadAndDisplayScene(node);

        // 3. Preload next images in the background
        preloadChoiceImages(node);

        // 4. Show the narrative container and animate text
        narrativeContainerElement.classList.remove('hidden');
        narrativeContainerElement.classList.add('visible');
        // Pass the whole node to displayText to handle transitions there
        await displayText(node);

        // 5. Render choices (if it's not an auto-transitioning node)
        if (!node.auto_transition) {
            renderChoiceNode(node);
            setChoicesEnabled(true);
        }
    }

    async function loadAndDisplayScene(node) {
        let imageSrc = imageCache[node.id];

        if (!imageSrc) {
            generationController = new AbortController();
            isGenerating = true;
            showLoading(true);
            try {
                // Determine the correct context image (location master or last image)
                let contextImageB64 = lastImageB64;
                if (node.location && locationImageCache[node.location]) {
                    contextImageB64 = locationImageCache[node.location];
                }

                const { imageData } = await getGeneratedImage(node, generationController.signal, contextImageB64);
                lastImageB64 = imageData; // Always update the last generated image
                imageSrc = `data:image/png;base64,${imageData}`;
                imageCache[node.id] = imageSrc;

                // If this is the first time visiting a location, cache its image
                if (node.location && !locationImageCache[node.location]) {
                    locationImageCache[node.location] = imageData;
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Image generation stopped.');
                } else {
                    console.error("Error generating image:", error);
                    // Fallback: proceed without an image, narrative will still be shown.
                    await updateImage(null);
                }
            } finally {
                showLoading(false);
                isGenerating = false;
            }
        }

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

        // Inject aspect ratio for mobile
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('portrait') === 'true') {
            promptParts.push("Use a portrait aspect ratio (9:16) for the image.");
        }

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

        // 2. Construct the API payload
        const parts = [{ text: finalPrompt }];
        const noContext = node.no_context || false;

        if (contextImageB64 && !noContext) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: contextImageB64 } });
            parts.unshift({ text: "Use the previous image as a strong reference for the environment, characters, and art style. Then, create a new image that follows the new prompt:" });
        }

        const payload = {
            contents: [{ parts: parts }],
            safetySettings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: signal
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error Response:", errorBody);
            throw new Error(`API Error: ${errorBody.error.message}`);
        }
        const data = await response.json();
        const imagePart = data.candidates[0]?.content?.parts.find(p => p.inlineData);
        if (!imagePart) {
            console.warn("API Response did not contain image data:", data);
            throw new Error("No image data found in API response.");
        }
        return { imageData: imagePart.inlineData.data };
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

    // --- Start the adventure ---
    init();
});
