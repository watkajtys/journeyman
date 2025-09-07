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
    let lastStableNodeId = 'start';
    let imageCache = {};
    let lastImageB64 = null;
    let generationController;
    let isGenerating = false; // To prevent concurrent generations
    let isDisplayingText = false; // To prevent skipping text animation
    let playerState = {
        visitedServerRoom: false,
        visitedMedBay: false,
    };

    // --- Initialization ---
    async function init() {
        try {
            const response = await fetch('story.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            storyData = await response.json();
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

            // Handle auto-transition right after text is displayed
            if (node.auto_transition && node.choices && node.choices.length > 0) {
                setChoicesEnabled(false);
                // The setTimeout will trigger the next node, so we don't resolve the promise here.
                // This stops the current `showNode` execution path.
                setTimeout(() => handleChoice(node.choices[0]), 800);
            } else {
                // If it's not an auto-transition node, resolve the promise to allow
                // the calling function to proceed and render choices.
                resolve();
            }
        });
    }

    function typeWriterChunk(element, text) {
        return new Promise(resolve => {
            element.innerHTML = ''; // Clear previous text
            const words = text.split(' ');
            let wordIndex = 0;
            const cursor = document.createElement('span');
            cursor.className = 'typewriter-cursor';
            element.appendChild(cursor);

            function typeWord() {
                if (wordIndex < words.length) {
                    const wordSpan = document.createElement('span');
                    // Add a space after each word. The final word won't have a trailing space.
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
        const node = storyData[currentNodeId];

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
            if (node.type === 'exploration') {
                renderExplorationNode(node);
            } else {
                renderChoiceNode(node);
            }
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
                // Pass the no_context flag from the node to the image generator
                const { imageData } = await getGeneratedImage(node.image_prompt, generationController.signal, lastImageB64, false, node.no_context);
                lastImageB64 = imageData;
                imageSrc = `data:image/png;base64,${imageData}`;
                imageCache[node.id] = imageSrc;
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
        lastStableNodeId = node.id;
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

    // --- Exploration Node Logic (simplified for now) ---
    function renderExplorationNode(node) {
        // This complex logic can be reintegrated later if needed.
        // For now, we'll treat it like a standard choice node.
        renderChoiceNode(node);
    }

    function updatePlayerState(nodeId) {
        if (nodeId === 'go_to_server_room') {
            playerState.visitedServerRoom = true;
        } else if (nodeId === 'go_to_med_bay') {
            playerState.visitedMedBay = true;
        }
    }

    async function handleChoice(choice) {
        // Prevent new choices while one is being processed
        setChoicesEnabled(false);

        updatePlayerState(choice.target_id);

        // --- Handle potential intermediary transition image ---
        if (choice.transition_prompt) {
            const transitionCacheKey = `${currentNodeId}->${choice.target_id}`;
            let transitionImageSrc = imageCache[transitionCacheKey];

            if (!transitionImageSrc) {
                showLoading(true);
                try {
                     // Pass the no_context flag from the choice to the image generator
                    const { imageData } = await getGeneratedImage(choice.transition_prompt, null, lastImageB64, false, choice.no_context);
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
            const nextNode = storyData[nextNodeId];

            // Preload main image for the next node
            if (nextNode && nextNode.image_prompt && !imageCache[nextNodeId]) {
                getGeneratedImage(nextNode.image_prompt, null, lastImageB64, true, nextNode.no_context)
                    .then(({ imageData }) => {
                        imageCache[nextNodeId] = `data:image/png;base64,${imageData}`;
                        console.log(`Preloaded image for: ${nextNodeId}`);
                    })
                    .catch(err => console.warn(`Preloading failed for ${nextNodeId}:`, err));
            }
            // Preload transition image for the choice
            const transitionCacheKey = `${node.id}->${choice.target_id}`;
            if (choice.transition_prompt && !imageCache[transitionCacheKey]) {
                 getGeneratedImage(choice.transition_prompt, null, lastImageB64, true, choice.no_context)
                    .then(({ imageData }) => {
                        imageCache[transitionCacheKey] = `data:image/png;base64,${imageData}`;
                        console.log(`Preloaded transition for: ${transitionCacheKey}`);
                    })
                    .catch(err => console.warn(`Preloading transition failed for ${transitionCacheKey}:`, err));
            }
        });
    }

    // --- API Call ---
    async function getGeneratedImage(prompt, signal, contextImageB64 = null, isPreload = false, noContext = false) {
        const parts = [{ text: prompt }];
        // Only add the context image if it exists and noContext is false
        if (contextImageB64 && !noContext) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: contextImageB64 } });
            parts.unshift({ text: "Given the previous image, create a new image based on the prompt." });
        }
        const payload = {
            contents: [{ parts: parts }],
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE"
                }
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
            throw new Error(`API Error: ${errorBody.error.message}`);
        }
        const data = await response.json();
        const imagePart = data.candidates[0]?.content?.parts.find(p => p.inlineData);
        if (!imagePart) {
            throw new Error("No image data found in API response.");
        }
        return { imageData: imagePart.inlineData.data };
    }

    // --- Event Listeners ---
    stopButtonElement.addEventListener('click', () => {
        if (generationController) generationController.abort();
    });

    // --- Start the adventure ---
    init();
});
