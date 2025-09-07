document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const storyTextElement = document.getElementById('story-text');
    const choicesContainerElement = document.getElementById('choices-container');
    const imageElement = document.getElementById('scene-image');
    const loadingSpinnerElement = document.getElementById('loading-spinner');
    const stopButtonElement = document.getElementById('stop-button');

    // --- Gemini API Configuration ---
    const API_KEY = 'AIzaSyC7puMSiLTOJJAY5Uf90L6MwtwJQwj44dg';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';

    // Game State
    let storyData = {};
    let currentNodeId = 'start';
    let lastStableNodeId = 'start';
    let imageCache = {};
    let generationController;
    let collectedFragments = new Set();

    // --- Initialization ---
    async function init() {
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

    // --- UI State Management ---
    function setChoicesEnabled(enabled) {
        choicesContainerElement.querySelectorAll('.choice-button').forEach(button => {
            button.disabled = !enabled;
            button.style.cursor = enabled ? 'pointer' : 'not-allowed';
            button.style.opacity = enabled ? '1' : '0.6';
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

        if (node.type === 'exploration') {
            renderExplorationNode(node);
        } else {
            renderChoiceNode(node);
        }

        // --- Image Generation ---
        if (imageCache[nodeId]) {
            imageElement.src = imageCache[nodeId];
            imageElement.classList.remove('hidden');
            loadingSpinnerElement.classList.add('hidden');
            stopButtonElement.classList.add('hidden');
            lastStableNodeId = nodeId;
        } else {
            generationController = new AbortController();
            const signal = generationController.signal;

            loadingSpinnerElement.classList.remove('hidden');
            stopButtonElement.classList.remove('hidden');
            imageElement.classList.add('hidden');
            setChoicesEnabled(false);

            try {
                const imageData = await getGeneratedImage(node.image_prompt, signal);
                const imageSrc = `data:image/png;base64,${imageData}`;
                imageCache[nodeId] = imageSrc;
                imageElement.src = imageSrc;
                lastStableNodeId = nodeId;
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Image generation was stopped. Reverting to last stable state.');
                    showNode(lastStableNodeId);
                    return; // Exit to prevent finally block on broken state
                } else if (error.message.includes("Could not find image data")) {
                    console.warn(`Soft failure for node "${nodeId}": API did not return image data. Proceeding without an image.`);
                    lastStableNodeId = nodeId; // Treat as stable, just without an image
                } else {
                    console.error("Error generating image:", error);
                    imageElement.alt = `Failed to generate image: ${error.message}`;
                    imageElement.src = "";
                }
            } finally {
                loadingSpinnerElement.classList.add('hidden');
                stopButtonElement.classList.add('hidden');
                imageElement.classList.remove('hidden');
                setChoicesEnabled(true);
                generationController = null;
            }
        }
    }

    function renderChoiceNode(node) {
        choicesContainerElement.innerHTML = '';
        node.choices.forEach(choice => {
            const button = document.createElement('button');
            button.classList.add('choice-button');
            button.innerText = choice.text;
            button.addEventListener('click', () => handleChoice(choice.target_id));
            choicesContainerElement.appendChild(button);
        });
    }

    function renderExplorationNode(node) {
        choicesContainerElement.innerHTML = '';
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
            choicesContainerElement.innerHTML = '';
            const completionButton = document.createElement('button');
            completionButton.classList.add('choice-button');
            completionButton.innerText = node.completion_choice.text;
            completionButton.addEventListener('click', () => handleChoice(node.completion_choice.target_id));
            choicesContainerElement.appendChild(completionButton);
        }
    }

    function handleChoice(targetId) {
        showNode(targetId);
    }

    stopButtonElement.addEventListener('click', () => {
        if (generationController) {
            generationController.abort();
        }
    });

    async function getGeneratedImage(prompt, signal) {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

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
        const imageData = data.candidates[0]?.content?.parts[0]?.inline_data?.data;
        if (!imageData) {
            throw new Error("Could not find image data in API response.");
        }
        return imageData;
    }

    init();
});
