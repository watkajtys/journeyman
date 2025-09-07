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

        // Create a simple column layout
        const columns = {};
        Object.keys(storyData.nodes).forEach(nodeId => {
            const level = getNodeIdLevel(nodeId);
            if (!columns[level]) {
                columns[level] = [];
            }
            columns[level].push(nodeId);
        });

        const sortedLevels = Object.keys(columns).sort((a, b) => a - b);
        let nodeIndex = 0;

        sortedLevels.forEach((level, colIndex) => {
            columns[level].forEach((nodeId, rowIndex) => {
                const nodeElement = document.createElement('div');
                nodeElement.className = 'graph-node';
                nodeElement.textContent = nodeId;
                nodeElement.dataset.id = nodeId;

                const x = colIndex * 200 + 50;
                const y = rowIndex * 100 + 50;
                nodeElement.style.left = `${x}px`;
                nodeElement.style.top = `${y}px`;
                nodePositions[nodeId] = { x, y };

                nodeElement.addEventListener('click', () => selectNode(nodeId));
                graphContainer.appendChild(nodeElement);
                nodeIndex++;
            });
        });

        drawConnections();
    }

    function getNodeIdLevel(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return 0; // Prevent infinite loops
        visited.add(nodeId);

        for (const sourceNodeId in storyData.nodes) {
            const node = storyData.nodes[sourceNodeId];
            if (node.choices && node.choices.some(c => c.target_id === nodeId)) {
                return getNodeIdLevel(sourceNodeId, visited) + 1;
            }
        }
        return 0; // Root node
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
                        // Offset by half node size to center the line
                        line.setAttribute('x1', startPos.x + 75);
                        line.setAttribute('y1', startPos.y + 20);
                        line.setAttribute('x2', endPos.x + 75);
                        line.setAttribute('y2', endPos.y + 20);

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
