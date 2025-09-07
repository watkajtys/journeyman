document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const storyTextElement = document.getElementById('story-text');
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
    let isTyping = false; // To prevent skipping text animation

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
            storyTextElement.innerText = `Error loading story: ${error}. Please check that story.json is available.`;
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

    // --- Typewriter Effect ---
    async function typeWriter(text) {
        return new Promise(resolve => {
            isTyping = true;
            storyTextElement.innerHTML = ''; // Clear previous text
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            let sentenceIndex = 0;
            let charIndex = 0;
            const cursor = document.createElement('span');
            cursor.className = 'typewriter-cursor';
            storyTextElement.appendChild(cursor);

            function type() {
                if (sentenceIndex >= sentences.length) {
                    isTyping = false;
                    cursor.remove();
                    resolve();
                    return;
                }

                const sentence = sentences[sentenceIndex];
                if (charIndex < sentence.length) {
                    const charSpan = document.createElement('span');
                    charSpan.textContent = sentence.charAt(charIndex);
                    storyTextElement.insertBefore(charSpan, cursor);
                    charIndex++;
                    setTimeout(type, 30); // Typing speed
                } else {
                    charIndex = 0;
                    sentenceIndex++;
                    setTimeout(type, 400); // Pause between sentences
                }
            }
            type();
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
        currentNodeId = nodeId;
        const node = storyData[currentNodeId];

        if (!node) {
            console.error(`Node "${nodeId}" not found.`);
            storyTextElement.innerText = "An error occurred: The story path is broken.";
            narrativeContainerElement.classList.add('visible');
            return;
        }

        // 1. Hide old narrative and clear choices
        narrativeContainerElement.classList.remove('visible');
        clearChoices();
        setChoicesEnabled(false);

        // 2. Load and display the image
        const imageAvailable = await loadAndDisplayScene(node);

        // After image transition is done, show the narrative
        if (imageAvailable) {
             // Preload next images in the background
            preloadChoiceImages(node);

            // 3. Show the narrative container and animate text
            narrativeContainerElement.classList.remove('hidden');
            narrativeContainerElement.classList.add('visible');
            await typeWriter(node.text);

            // 4. Render choices
            if (node.type === 'exploration') {
                renderExplorationNode(node);
            } else {
                renderChoiceNode(node);
            }
            setChoicesEnabled(true);

            // 5. Handle auto-transition
            if (node.auto_transition && node.choices && node.choices.length > 0) {
                setChoicesEnabled(false);
                setTimeout(() => handleChoice(node.choices[0]), 1000); // Brief delay for readability
            }
        }
    }

    async function loadAndDisplayScene(node) {
        let imageSrc = imageCache[node.id];
        let imageAvailable = false;

        if (!imageSrc) {
            generationController = new AbortController();
            isGenerating = true;
            showLoading(true);
            try {
                const { imageData } = await getGeneratedImage(node.image_prompt, generationController.signal, lastImageB64);
                lastImageB64 = imageData;
                imageSrc = `data:image/png;base64,${imageData}`;
                imageCache[node.id] = imageSrc;
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Image generation stopped.');
                } else {
                    console.error("Error generating image:", error);
                    // Fallback: proceed without an image
                    await updateImage(null);
                    storyTextElement.innerText = node.text; // Show text immediately if image fails
                    narrativeContainerElement.classList.add('visible');
                }
                showLoading(false);
                isGenerating = false;
                return false;
            }
            showLoading(false);
            isGenerating = false;
        }

        await updateImage(imageSrc);
        lastStableNodeId = node.id;
        imageAvailable = true;

        return imageAvailable;
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

    async function handleChoice(choice) {
        // Prevent new choices while one is being processed
        setChoicesEnabled(false);

        // --- Handle potential intermediary transition image ---
        if (choice.transition_prompt) {
            const transitionCacheKey = `${currentNodeId}->${choice.target_id}`;
            let transitionImageSrc = imageCache[transitionCacheKey];

            if (!transitionImageSrc) {
                showLoading(true);
                try {
                    const { imageData } = await getGeneratedImage(choice.transition_prompt, null, lastImageB64);
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
                getGeneratedImage(nextNode.image_prompt, null, lastImageB64, true)
                    .then(({ imageData }) => {
                        imageCache[nextNodeId] = `data:image/png;base64,${imageData}`;
                        console.log(`Preloaded image for: ${nextNodeId}`);
                    })
                    .catch(err => console.warn(`Preloading failed for ${nextNodeId}:`, err));
            }
            // Preload transition image for the choice
            const transitionCacheKey = `${node.id}->${choice.target_id}`;
            if (choice.transition_prompt && !imageCache[transitionCacheKey]) {
                 getGeneratedImage(choice.transition_prompt, null, lastImageB64, true)
                    .then(({ imageData }) => {
                        imageCache[transitionCacheKey] = `data:image/png;base64,${imageData}`;
                        console.log(`Preloaded transition for: ${transitionCacheKey}`);
                    })
                    .catch(err => console.warn(`Preloading transition failed for ${transitionCacheKey}:`, err));
            }
        });
    }

    // --- API Call ---
    async function getGeneratedImage(prompt, signal, contextImageB64 = null, isPreload = false) {
        const parts = [{ text: prompt }];
        if (contextImageB64) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: contextImageB64 } });
            parts.unshift({ text: "Given the previous image, create a new image based on the prompt." });
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
