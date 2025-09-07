document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const graphContainer = document.getElementById('graph-container');
    const editorPanel = document.getElementById('editor-panel');
    const nodeEditorForm = document.getElementById('node-editor-form');
    const nodeIdInput = document.getElementById('node-id');
    const nodeTextInput = document.getElementById('node-text');
    const nodeImagePromptInput = document.getElementById('node-image-prompt');
    const choicesList = document.getElementById('choices-list');
    const addChoiceBtn = document.getElementById('add-choice-btn');
    const deleteNodeBtn = document.getElementById('delete-node-btn');
    const addNodeBtn = document.getElementById('add-node-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');

    // --- State ---
    let storyData = {};
    let selectedNodeId = null;
    let nodePositions = {}; // To store and calculate node positions

    // --- Initialization ---
    async function init() {
        try {
            const response = await fetch('story.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            storyData = await response.json();
            console.log("Story data loaded:", storyData);
            renderGraph();
        } catch (error) {
            graphContainer.innerHTML = `<p style="color: red;">Error loading story.json: ${error.message}</p>`;
            console.error("Failed to load or parse story.json:", error);
        }
    }

    // --- Graph Rendering ---
    function renderGraph() {
        graphContainer.innerHTML = ''; // Clear previous render
        if (!storyData.nodes) return;
        nodePositions = {}; // Reset positions

        // 1. Group nodes by arch and location
        const groupedNodes = {};
        Object.values(storyData.nodes).forEach(node => {
            const arch = node.id.split('_')[0] || 'general';
            const location = node.location || 'no-location';

            if (!groupedNodes[arch]) {
                groupedNodes[arch] = {};
            }
            if (!groupedNodes[arch][location]) {
                groupedNodes[arch][location] = [];
            }
            groupedNodes[arch][location].push(node);
        });

        // 2. Render groups and nodes
        const archKeys = Object.keys(groupedNodes).sort();

        for (const arch of archKeys) {
            const archContainer = document.createElement('div');
            archContainer.className = 'arch-container';

            const archTitle = document.createElement('h2');
            archTitle.className = 'arch-title';
            archTitle.textContent = arch;
            archContainer.appendChild(archTitle);

            const locationKeys = Object.keys(groupedNodes[arch]).sort();

            for (const location of locationKeys) {
                const locationContainer = document.createElement('div');
                locationContainer.className = 'location-container';

                const locationTitle = document.createElement('h3');
                locationTitle.className = 'location-title';
                locationTitle.textContent = location;
                locationContainer.appendChild(locationTitle);

                const nodes = groupedNodes[arch][location];
                nodes.sort((a, b) => a.id.localeCompare(b.id));

                let nodeY = 60; // Initial Y position for the first node in a location
                for (const node of nodes) {
                    const nodeElement = document.createElement('div');
                    nodeElement.className = 'graph-node';
                    nodeElement.textContent = node.id;
                    nodeElement.dataset.id = node.id;

                    // Position nodes statically within the flex item
                    nodeElement.style.position = 'relative';
                    nodeElement.style.marginBottom = '10px';

                    nodeElement.addEventListener('click', () => selectNode(node.id));
                    locationContainer.appendChild(nodeElement);
                }
                archContainer.appendChild(locationContainer);
            }
            graphContainer.appendChild(archContainer);
        }

        // Use requestAnimationFrame to ensure the DOM is updated before calculating positions
        requestAnimationFrame(() => {
            // One frame to render, another to ensure layout is stable
            requestAnimationFrame(() => {
                calculateAbsolutePositions();
                drawConnections();
            });
        });
    }

    function calculateAbsolutePositions() {
        nodePositions = {};
        const allNodeElements = graphContainer.querySelectorAll('.graph-node');
        const containerRect = graphContainer.getBoundingClientRect();
        const scrollLeft = graphContainer.scrollLeft;
        const scrollTop = graphContainer.scrollTop;

        allNodeElements.forEach(nodeEl => {
            const rect = nodeEl.getBoundingClientRect();
            nodePositions[nodeEl.dataset.id] = {
                x: rect.left - containerRect.left + scrollLeft + (rect.width / 2),
                y: rect.top - containerRect.top + scrollTop + (rect.height / 2)
            };
        });
    }

    function drawConnections() {
        let svg = graphContainer.querySelector('svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
            svg.style.zIndex = '-1';
            graphContainer.prepend(svg);
        }
        svg.innerHTML = '';

        Object.values(storyData.nodes).forEach(node => {
            if (node.choices) {
                node.choices.forEach(choice => {
                    const startPos = nodePositions[node.id];
                    const endPos = nodePositions[choice.target_id];
                    if (startPos && endPos) {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', startPos.x);
                        line.setAttribute('y1', startPos.y);
                        line.setAttribute('x2', endPos.x);
                        line.setAttribute('y2', endPos.y);

                        if (choice.transition_prompt) {
                            line.setAttribute('stroke', '#8e44ad');
                            line.setAttribute('stroke-width', '4');
                        } else {
                            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
                            line.setAttribute('stroke-width', '2');
                        }

                        svg.appendChild(line);
                    }
                });
            }
        });
    }


    // --- Node Selection & Editing ---
    function selectNode(nodeId) {
        if (selectedNodeId) {
            const oldNodeEl = graphContainer.querySelector(`[data-id="${selectedNodeId}"]`);
            if (oldNodeEl) oldNodeEl.classList.remove('selected');
        }

        selectedNodeId = nodeId;
        const node = storyData.nodes[nodeId];
        if (!node) return;

        const newNodeEl = graphContainer.querySelector(`[data-id="${nodeId}"]`);
        if (newNodeEl) newNodeEl.classList.add('selected');

        editorPanel.classList.remove('hidden');
        nodeIdInput.value = node.id;
        nodeTextInput.value = node.text || '';
        nodeImagePromptInput.value = node.image_prompt || '';

        // Populate choices
        choicesList.innerHTML = '';
        if (node.choices) {
            node.choices.forEach((choice, index) => {
                addChoiceToForm(choice, index);
            });
        }
    }

    function addChoiceToForm(choice, index) {
        const choiceElement = document.createElement('div');
        choiceElement.className = 'choice-item';
        choiceElement.innerHTML = `
            <div class="choice-main-inputs">
                <input type="text" placeholder="Choice Text" value="${choice.text}" data-index="${index}" class="choice-text">
                <input type="text" placeholder="Target Node ID" value="${choice.target_id}" data-index="${index}" class="choice-target">
                <button type="button" class="delete-choice-btn" data-index="${index}">X</button>
            </div>
            <textarea placeholder="Transition Prompt (optional)" class="choice-transition-prompt" data-index="${index}">${choice.transition_prompt || ''}</textarea>
        `;
        choicesList.appendChild(choiceElement);
    }

    // --- Event Handlers ---
    nodeEditorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!selectedNodeId) return;

        const node = storyData.nodes[selectedNodeId];
        node.text = nodeTextInput.value;
        node.image_prompt = nodeImagePromptInput.value;

        // Update choices
        const newChoices = [];
        const choiceTextInputs = choicesList.querySelectorAll('.choice-text');
        const choiceTargetInputs = choicesList.querySelectorAll('.choice-target');
        const choiceTransitionPromptInputs = choicesList.querySelectorAll('.choice-transition-prompt');

        for (let i = 0; i < choiceTextInputs.length; i++) {
            const choice = {
                text: choiceTextInputs[i].value,
                target_id: choiceTargetInputs[i].value
            };
            const transitionPrompt = choiceTransitionPromptInputs[i].value.trim();
            if (transitionPrompt) {
                choice.transition_prompt = transitionPrompt;
            }
            newChoices.push(choice);
        }
        node.choices = newChoices;

        alert(`Node "${selectedNodeId}" updated!`);
        renderGraph(); // Re-render to show changes like new connections
    });

    addChoiceBtn.addEventListener('click', () => {
        if (!selectedNodeId) return;
        const node = storyData.nodes[selectedNodeId];
        if (!node.choices) {
            node.choices = [];
        }
        const newChoice = { text: "New Choice", target_id: "" };
        node.choices.push(newChoice);
        addChoiceToForm(newChoice, node.choices.length - 1);
    });

    choicesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-choice-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            storyData.nodes[selectedNodeId].choices.splice(index, 1);
            selectNode(selectedNodeId); // Re-populate the form
        }
    });

    deleteNodeBtn.addEventListener('click', () => {
        if (!selectedNodeId || !confirm(`Are you sure you want to delete node "${selectedNodeId}"?`)) {
            return;
        }

        // Delete the node itself
        delete storyData.nodes[selectedNodeId];

        // Remove choices pointing to this node from other nodes
        Object.values(storyData.nodes).forEach(node => {
            if (node.choices) {
                node.choices = node.choices.filter(c => c.target_id !== selectedNodeId);
            }
        });

        editorPanel.classList.add('hidden');
        selectedNodeId = null;
        renderGraph();
    });

    addNodeBtn.addEventListener('click', () => {
        const newNodeId = prompt("Enter a unique ID for the new node:");
        if (!newNodeId) return;
        if (storyData.nodes[newNodeId]) {
            alert("A node with this ID already exists.");
            return;
        }

        storyData.nodes[newNodeId] = {
            id: newNodeId,
            text: "New node text.",
            image_prompt: "A new image prompt.",
            choices: []
        };

        renderGraph();
        selectNode(newNodeId);
    });

    exportJsonBtn.addEventListener('click', () => {
        const jsonString = JSON.stringify(storyData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'story.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- Start ---
    init();
});
