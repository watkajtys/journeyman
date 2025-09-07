document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const storyTextElement = document.getElementById('story-text');
    const choicesContainerElement = document.getElementById('choices-container');
    const imageContainerElement = document.getElementById('image-container');
    const imageElements = [document.getElementById('scene-image-1'), document.getElementById('scene-image-2')];
    let activeImageIndex = 0;
    const loadingSpinnerElement = document.getElementById('loading-spinner');
    const stopButtonElement = document.getElementById('stop-button');
    // let tooltipElement; // No longer needed

    // --- Gemini API Configuration ---
    const API_KEY = 'AIzaSyC7puMSiLTOJJAY5Uf90L6MwtwJQwj44dg';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

    // Game State
    let storyData = {};
    let currentNodeId = 'start';
    let lastStableNodeId = 'start';
    let imageCache = {};
    let lastImageB64 = null;
    let generationController;
    let collectedFragments = new Set();
    let isPreloading = false; // Flag to prevent multiple preloading processes

    // --- Initialization ---
    async function init() {
        // createTooltip(); // No longer needed
        try {
            const response = await fetch('story.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            storyData = await response.json();
            await showNode(currentNodeId);
        } catch (error) {
            storyTextElement.innerText = `Error loading story: ${error}. Please check that story.json is available.`;
            console.error("Failed to load story.json:", error);
        }
    }

    // function createTooltip() { ... } // No longer needed

    // --- UI State Management ---
    function setChoicesEnabled(enabled) {
        // Hotspots are removed, so no need to manage them.

        // For button-based choices (fallback and exploration)
        choicesContainerElement.querySelectorAll('.choice-button').forEach(button => {
            button.disabled = !enabled;
            button.style.cursor = enabled ? 'pointer' : 'not-allowed';
            button.style.opacity = enabled ? '1' : '0.6';
        });
    }


    // --- Image Preloading and Update Logic ---
    function preloadChoiceImages(node) {
        if (!node.choices || isPreloading) {
            return;
        }
        isPreloading = true;
        console.log('Starting preload for choices of:', node.id);

        const preloadPromises = [];
        node.choices.forEach(choice => {
            const nextNodeId = choice.target_id;
            const nextNode = storyData[nextNodeId];

            // --- Preload the main image for the next node ---
            if (nextNode && nextNode.image_prompt && !imageCache[nextNodeId]) {
                console.log('Queueing preload for main image:', nextNodeId);
                const mainImagePromise = getGeneratedImage(nextNode.image_prompt, null, lastImageB64, true)
                    .then(({ imageData }) => {
                        const imageSrc = `data:image/png;base64,${imageData}`;
                        imageCache[nextNodeId] = imageSrc;
                        console.log('Successfully preloaded main image for:', nextNodeId);
                    })
                    .catch(error => console.warn(`Preloading main image failed for "${nextNodeId}":`, error));
                preloadPromises.push(mainImagePromise);
            }

            // --- Preload the transition image for the choice ---
            const transitionCacheKey = `${node.id}->${choice.target_id}`;
            if (choice.transition_prompt && !imageCache[transitionCacheKey]) {
                console.log('Queueing preload for transition image:', transitionCacheKey);
                const transitionImagePromise = getGeneratedImage(choice.transition_prompt, null, lastImageB64, true)
                    .then(({ imageData }) => {
                        const imageSrc = `data:image/png;base64,${imageData}`;
                        imageCache[transitionCacheKey] = imageSrc;
                        console.log('Successfully preloaded transition image for:', transitionCacheKey);
                    })
                    .catch(error => console.warn(`Preloading transition image failed for "${transitionCacheKey}":`, error));
                preloadPromises.push(transitionImagePromise);
            }
        });

        if (preloadPromises.length > 0) {
            Promise.all(preloadPromises).then(() => {
                isPreloading = false;
                console.log('All preloading tasks finished for node:', node.id);
            });
        } else {
            isPreloading = false;
        }
    }

    function updateImage(newSrc) {
        return new Promise((resolve) => {
            if (!newSrc) {
                // Deactivate both images if there's no source
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

                // Wait a tick for the browser to register the new src
                setTimeout(() => {
                    activeImage.classList.remove('active');
                    inactiveImage.classList.add('active');
                    activeImageIndex = inactiveImageIndex; // Update the active index
                    // Resolve after the transition is expected to finish
                    setTimeout(resolve, 1500); // Match CSS transition duration
                }, 50);
            };
            tempImg.onerror = (err) => {
                console.error("Failed to load image for display:", newSrc, err);
                resolve(); // Resolve anyway to not block the game
            };
            tempImg.src = newSrc;
        });
    }

    // --- Node Rendering Logic ---
    async function showNode(nodeId) {
        currentNodeId = nodeId;
        const node = storyData[currentNodeId];

        if (!node) {
            console.error(`Node "${nodeId}" not found in story.json.`);
            storyTextElement.innerText = "An error occurred. The story path is broken.";
            return;
        }

        storyTextElement.innerText = node.text;
        clearChoices();

        if (node.type === 'exploration') {
            renderExplorationNode(node);
        } else {
            renderChoiceNode(node);
        }

        let imageAvailable = false;
        if (imageCache[nodeId]) {
            await updateImage(imageCache[nodeId]);
            lastStableNodeId = nodeId;
            setChoicesEnabled(true);
            imageAvailable = true;
        } else {
            generationController = new AbortController();
            const signal = generationController.signal;

            // Show spinner only for primary, non-preloaded images
            loadingSpinnerElement.classList.remove('hidden');
            stopButtonElement.classList.remove('hidden');
            setChoicesEnabled(false);

            try {
                // Pass false for isPreload
                const { imageData } = await getGeneratedImage(node.image_prompt, signal, lastImageB64, false);
                lastImageB64 = imageData;
                const imageSrc = `data:image/png;base64,${imageData}`;
                imageCache[nodeId] = imageSrc;
                await updateImage(imageSrc);
                lastStableNodeId = nodeId;
                imageAvailable = true;
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Image generation was stopped. Reverting to last stable state.');
                    // No need to call showNode again, just stay on the current stable node.
                } else if (error.message.includes("Could not find image data")) {
                    console.warn(`Soft failure for node "${nodeId}": API did not return image data. Proceeding without an image.`);
                    lastStableNodeId = nodeId; // Treat as stable, just without an image
                    await updateImage(null); // Clear the image
                } else {
                    console.error("Error generating image:", error);
                    // Don't clear the src, keep the old image
                }
            } finally {
                loadingSpinnerElement.classList.add('hidden');
                stopButtonElement.classList.add('hidden');
                setChoicesEnabled(true);
                generationController = null;
            }
        }
        // After the main image is loaded and displayed, kick off preloading for the next choices
        if (imageAvailable) {
            preloadChoiceImages(node);
        }
    }

    function clearChoices() {
        // Clear button choices
        choicesContainerElement.innerHTML = '';
        // Clear hotspot choices
        const existingHotspots = imageContainerElement.querySelectorAll('.hotspot');
        existingHotspots.forEach(hotspot => hotspot.remove());
    }

    function renderChoiceNode(node) {
        // Hotspot logic is removed. All choices are rendered as buttons.
        node.choices.forEach(choice => {
            const button = document.createElement('button');
            button.classList.add('choice-button');
            button.innerText = choice.text;
            button.addEventListener('click', () => handleChoice(choice));
            choicesContainerElement.appendChild(button);
        });
    }

    function renderExplorationNode(node) {
        collectedFragments.clear();
        node.interactive_objects.forEach(obj => {
            const button = document.createElement('button');
            button.classList.add('choice-button', 'interactive-object');
            button.innerText = obj.name;
            button.addEventListener('click', () => {
                storyTextElement.innerText = obj.description;
                if (obj.reveals_fragment) {
                    button.classList.add('toggled');
                    collectedFragments.add(obj.name);
                }
                checkExplorationCompletion(node);
            });
            choicesContainerElement.appendChild(button);
        });
    }

    function checkExplorationCompletion(node) {
        if (collectedFragments.size >= node.required_fragments) {
            clearChoices(); // Clear the object buttons
            const completionButton = document.createElement('button');
            completionButton.classList.add('choice-button');
            completionButton.innerText = node.completion_choice.text;
            // The choice here might be a simple target_id string, not a choice object
            // Let's ensure handleChoice can handle both for max compatibility
             const completionChoice = { target_id: node.completion_choice.target_id, text: node.completion_choice.text };
            completionButton.addEventListener('click', () => handleChoice(completionChoice));
            choicesContainerElement.appendChild(completionButton);
        }
    }

    async function handleChoice(choice) {
        if (typeof choice === 'string') {
            // Handle cases where we just pass a target ID string
            choice = { target_id: choice };
        }
        setChoicesEnabled(false);

        // --- Intermediary Image Transition ---
        // If the choice has a transition prompt, we generate and display that image first.
        if (choice.transition_prompt) {
            // A unique cache key for the transition image, e.g., "start->bridge_path"
            const transitionCacheKey = `${currentNodeId}->${choice.target_id}`;
            let transitionImageSrc = imageCache[transitionCacheKey];

            if (!transitionImageSrc) {
                // If not preloaded, generate the transition image now.
                generationController = new AbortController();
                const signal = generationController.signal;
                loadingSpinnerElement.classList.remove('hidden');
                stopButtonElement.classList.remove('hidden');

                try {
                    // We use lastImageB64 for context, but DON'T update it with the transition image.
                    const { imageData } = await getGeneratedImage(choice.transition_prompt, signal, lastImageB64, false);
                    transitionImageSrc = `data:image/png;base64,${imageData}`;
                    imageCache[transitionCacheKey] = transitionImageSrc; // Cache it for future use.
                } catch (error) {
                    console.error("Error generating transition image:", error);
                    // If generation fails, we'll just skip to the next node.
                } finally {
                    loadingSpinnerElement.classList.add('hidden');
                    stopButtonElement.classList.add('hidden');
                    generationController = null;
                }
            }

            // If we have a transition image (either from cache or just generated), show it.
            if (transitionImageSrc) {
                await updateImage(transitionImageSrc);
            }
        }

        // After the transition (or if there was none), show the main node.
        showNode(choice.target_id);
    }

    stopButtonElement.addEventListener('click', () => {
        if (generationController) {
            generationController.abort();
        }
    });

    async function getGeneratedImage(prompt, signal, lastImageB64 = null, isPreload = false) {
        // For preloading, we don't want to use an abort signal from the main controller
        const effectiveSignal = isPreload ? null : signal;

        const parts = [{ text: prompt }];
        if (lastImageB64) {
            parts.unshift({
                inlineData: {
                    mimeType: 'image/png',
                    data: lastImageB64
                }
            });
            parts.unshift({
                text: "Given the previous image, create a new image that continues the scene based on the following prompt:"
            });
        }
        const payload = { contents: [{ parts: parts }] };
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: signal
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API request failed with status ${response.status}: ${errorBody.error.message}`);
        }
        const data = await response.json();
        const textPart = data.candidates[0]?.content?.parts.find(part => part.text);
        const textResponse = textPart?.text;
        const imagePart = data.candidates[0]?.content?.parts.find(part => part.inlineData);
        const imageData = imagePart?.inlineData?.data;
        if (!imageData) {
            if (data.candidates[0]?.finishReason === 'SAFETY') {
                const safetyText = data.candidates[0]?.content?.parts.map(p => p.text).join('') || 'No details provided.';
                throw new Error(`Image generation failed due to safety settings. Response: ${safetyText}`);
            }
            throw new Error("Could not find image data in API response.");
        }
        return { imageData, textResponse };
    }

    init();
});
