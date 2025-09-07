document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const storyTextElement = document.getElementById('story-text');
    const choicesContainerElement = document.getElementById('choices-container');
    const imageContainerElement = document.getElementById('image-container'); // Get image container
    const imageElement = document.getElementById('scene-image');
    const loadingSpinnerElement = document.getElementById('loading-spinner');
    const stopButtonElement = document.getElementById('stop-button');
    let tooltipElement; // Will be created dynamically

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

    // --- Initialization ---
    async function init() {
        createTooltip();
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

    function createTooltip() {
        tooltipElement = document.createElement('div');
        tooltipElement.id = 'tooltip';
        tooltipElement.classList.add('hidden');
        document.body.appendChild(tooltipElement); // Append to body to avoid container clipping
    }

    // --- UI State Management ---
    function setChoicesEnabled(enabled) {
        // For hotspot-based choices
        document.querySelectorAll('.hotspot').forEach(hotspot => {
            hotspot.style.pointerEvents = enabled ? 'auto' : 'none';
        });

        // For button-based choices (fallback and exploration)
        choicesContainerElement.querySelectorAll('.choice-button').forEach(button => {
            button.disabled = !enabled;
            button.style.cursor = enabled ? 'pointer' : 'not-allowed';
            button.style.opacity = enabled ? '1' : '0.6';
        });
    }


    // --- Image Update Logic ---
    function updateImage(newSrc) {
        return new Promise((resolve) => {
            // If there's no new source, resolve immediately.
            if (!newSrc) {
                resolve();
                return;
            }

            // Preload the image in the background
            const tempImg = new Image();
            tempImg.onload = () => {
                // Once loaded, set the source of the actual image element
                imageElement.src = newSrc;
                // The CSS transition will handle the fade
                resolve();
            };
            tempImg.onerror = () => {
                console.error("Failed to load image for preloading:", newSrc);
                // Even on error, resolve to not block the game flow
                resolve();
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

        // Clear old choices/hotspots before rendering new ones
        clearChoices();

        if (node.type === 'exploration') {
            renderExplorationNode(node);
        } else {
            renderChoiceNode(node);
        }

        // --- Image Generation ---
        if (imageCache[nodeId]) {
            await updateImage(imageCache[nodeId]);
            loadingSpinnerElement.classList.add('hidden');
            stopButtonElement.classList.add('hidden');
            lastStableNodeId = nodeId;
            setChoicesEnabled(true);
        } else {
            generationController = new AbortController();
            const signal = generationController.signal;

            loadingSpinnerElement.classList.remove('hidden');
            stopButtonElement.classList.remove('hidden');
            // DO NOT HIDE THE IMAGE ANYMORE: imageElement.classList.add('hidden');
            setChoicesEnabled(false);

            try {
                const { imageData } = await getGeneratedImage(node.image_prompt, signal, lastImageB64);

                lastImageB64 = imageData;
                const imageSrc = `data:image/png;base64,${imageData}`;
                imageCache[nodeId] = imageSrc;

                // Use the new update function
                await updateImage(imageSrc);

                lastStableNodeId = nodeId;
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Image generation was stopped. Reverting to last stable state.');
                    // Don't just call showNode, as it could cause loops. Reset state carefully.
                    loadingSpinnerElement.classList.add('hidden');
                    stopButtonElement.classList.add('hidden');
                    setChoicesEnabled(true);
                    // No need to call showNode again, just stay on the current stable node.
                    return;
                } else if (error.message.includes("Could not find image data")) {
                    console.warn(`Soft failure for node "${nodeId}": API did not return image data. Proceeding without an image.`);
                    lastStableNodeId = nodeId; // Treat as stable, just without an image
                } else {
                    console.error("Error generating image:", error);
                    imageElement.alt = `Failed to generate image: ${error.message}`;
                    // Don't clear the src, keep the old image
                }
            } finally {
                loadingSpinnerElement.classList.add('hidden');
                stopButtonElement.classList.add('hidden');
                setChoicesEnabled(true);
                generationController = null;
            }
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
        node.choices.forEach(choice => {
            if (choice.hotspot) {
                // Create a hotspot
                const hotspot = document.createElement('div');
                hotspot.classList.add('hotspot');
                hotspot.style.left = `${choice.hotspot.x}%`;
                hotspot.style.top = `${choice.hotspot.y}%`;
                hotspot.style.width = `${choice.hotspot.width}%`;
                hotspot.style.height = `${choice.hotspot.height}%`;

                hotspot.addEventListener('click', () => handleChoice(choice));

                // Tooltip events
                hotspot.addEventListener('mousemove', e => {
                    tooltipElement.style.left = `${e.clientX}px`;
                    tooltipElement.style.top = `${e.clientY}px`;
                });
                hotspot.addEventListener('mouseover', () => {
                    tooltipElement.innerText = choice.text;
                    tooltipElement.classList.remove('hidden');
                });
                hotspot.addEventListener('mouseout', () => {
                    tooltipElement.classList.add('hidden');
                });

                imageContainerElement.appendChild(hotspot);
            } else {
                // Fallback to creating a button
                const button = document.createElement('button');
                button.classList.add('choice-button');
                button.innerText = choice.text;
                button.addEventListener('click', () => handleChoice(choice));
                choicesContainerElement.appendChild(button);
            }
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
        // Handle legacy calls where only targetId might be passed
        if (typeof choice === 'string') {
            choice = { target_id: choice };
        }

        setChoicesEnabled(false);
        tooltipElement.classList.add('hidden');

        if (choice.transition_prompt) {
            loadingSpinnerElement.classList.remove('hidden');
            // DO NOT HIDE IMAGE: imageElement.classList.add('hidden');
            generationController = new AbortController();
            stopButtonElement.classList.remove('hidden');

            try {
                const { imageData } = await getGeneratedImage(choice.transition_prompt, generationController.signal, lastImageB64);
                lastImageB64 = imageData;

                // Use the new update function for a seamless transition
                const imageSrc = `data:image/png;base64,${imageData}`;
                await updateImage(imageSrc);

                // No need for an artificial delay anymore
                // await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Transition generation stopped. Reverting.');
                    // Just re-enable choices, stay on the current node.
                    setChoicesEnabled(true);
                    return;
                }
                console.error("Error during transition, proceeding to next node but keeping old image.", error);
            } finally {
                // Hide spinner and button regardless of outcome
                loadingSpinnerElement.classList.add('hidden');
                stopButtonElement.classList.add('hidden');
            }
        }
        showNode(choice.target_id);
    }

    stopButtonElement.addEventListener('click', () => {
        if (generationController) {
            generationController.abort();
        }
    });

    async function getGeneratedImage(prompt, signal, lastImageB64 = null) {
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
