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

    // --- Initialization ---
    async function init() {
        try {
            const response = await fetch('story.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            storyData = await response.json();
            console.log("Story data loaded:", storyData);

            // Ensure consistent element keys exist
            if (!storyData.style_guides) storyData.style_guides = {};
            if (!storyData.characters) storyData.characters = {};
            if (!storyData.locations) storyData.locations = {}; // Add new category

            renderGraph();
            renderConsistentElements();
            setupConsistentElementsEventListeners();
        } catch (error) {
            graphContainer.innerHTML = `<p style="color: red;">Error loading story.json: ${error.message}</p>`;
            console.error("Failed to load or parse story.json:", error);
        }
    }

    // --- Consistent Elements Rendering ---
    function renderConsistentElements() {
        const accordionContainer = document.getElementById('elements-accordion');
        accordionContainer.innerHTML = ''; // Clear previous render

        // Define the categories of consistent elements
        const categories = {
            'style_guides': { title: 'Style Guides', fields: ['description'] },
            'characters': { title: 'Characters', fields: ['description'] },
            'locations': { title: 'Locations', fields: ['description'] }
        };

        for (const categoryKey in categories) {
            const category = categories[categoryKey];
            const categoryData = storyData[categoryKey];

            const accordion = document.createElement('div');
            accordion.innerHTML = `
                <button class="accordion-title">${category.title}</button>
                <div class="accordion-content">
                    <div id="${categoryKey}-editor-content"></div>
                </div>
            `;
            accordionContainer.appendChild(accordion);

            const contentDiv = accordion.querySelector(`#${categoryKey}-editor-content`);
            if (Object.keys(categoryData).length === 0) {
                contentDiv.innerHTML = '<p class="empty-state">No elements defined.</p>';
            } else {
                for (const elementId in categoryData) {
                    const element = categoryData[elementId];
                    const elementDiv = document.createElement('div');
                    elementDiv.className = 'element-item';
                    let fieldsHTML = `<label>ID: ${elementId}</label>`;

                    // For now, we assume a simple key-value (like style_guides) or an object with description
                    if (typeof element === 'string') {
                         fieldsHTML += `<textarea data-id="${elementId}" data-field="value">${element}</textarea>`;
                    } else if (typeof element === 'object' && element.description) {
                         fieldsHTML += `<textarea data-id="${elementId}" data-field="description">${element.description}</textarea>`;
                    }

                    fieldsHTML += `
                        <div class="element-item-actions">
                            <button class="save-element-btn" data-category="${categoryKey}" data-id="${elementId}">Save</button>
                            <button class="delete-element-btn" data-category="${categoryKey}" data-id="${elementId}">Delete</button>
                        </div>
                    `;
                    elementDiv.innerHTML = fieldsHTML;
                    contentDiv.appendChild(elementDiv);
                }
            }
        }

        // Add event listeners for accordion toggling
        accordionContainer.querySelectorAll('.accordion-title').forEach(button => {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                const content = button.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        });
    }

    // --- Node Rendering ---
    function renderGraph() {
        graphContainer.innerHTML = ''; // Clear previous render
        if (!storyData.nodes) return;

        // Create a container for the sequential list
        const listContainer = document.createElement('div');
        listContainer.className = 'node-list-container';

        // 1. Get all nodes in the order they appear in the JSON file
        const nodesInStoryOrder = Object.values(storyData.nodes);

        // 2. Render nodes sequentially
        for (const node of nodesInStoryOrder) {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'graph-node'; // Use existing styling
            nodeElement.textContent = node.id;
            nodeElement.dataset.id = node.id;

            // Add a small indicator for choices
            if (node.choices && node.choices.length > 0) {
                const choicesIndicator = document.createElement('span');
                choicesIndicator.className = 'node-choice-indicator';
                choicesIndicator.textContent = `→ ${node.choices.map(c => c.target_id).join(', ')}`;
                nodeElement.appendChild(choicesIndicator);
            }

            nodeElement.addEventListener('click', () => selectNode(node.id));
            listContainer.appendChild(nodeElement);
        }

        graphContainer.appendChild(listContainer);

        // After rendering, if a node was selected, re-apply the 'selected' class
        if (selectedNodeId) {
            const selectedEl = listContainer.querySelector(`[data-id="${selectedNodeId}"]`);
            if (selectedEl) {
                selectedEl.classList.add('selected');
            }
        }
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

    // --- Consistent Elements Event Handling ---
    function setupConsistentElementsEventListeners() {
        const panel = document.getElementById('elements-panel');

        panel.addEventListener('click', (e) => {
            const target = e.target;
            const category = target.dataset.category;
            const id = target.dataset.id;

            if (target.classList.contains('save-element-btn')) {
                const itemDiv = target.closest('.element-item');
                const textarea = itemDiv.querySelector('textarea');
                const field = textarea.dataset.field;

                if (field === 'value') { // Simple key-value like style_guides
                    storyData[category][id] = textarea.value;
                } else { // Object with properties like characters/locations
                    if (!storyData[category][id]) storyData[category][id] = {};
                    storyData[category][id][field] = textarea.value;
                }

                alert(`Element "${id}" in "${category}" saved.`);
                // No re-render needed, but maybe a visual confirmation
            }

            if (target.classList.contains('delete-element-btn')) {
                if (confirm(`Are you sure you want to delete "${id}" from "${category}"?`)) {
                    delete storyData[category][id];
                    renderConsistentElements();
                }
            }
        });

        document.getElementById('add-style-guide-btn').addEventListener('click', () => {
            const id = prompt("Enter new style guide ID:");
            if (id && !storyData.style_guides[id]) {
                storyData.style_guides[id] = "New style guide description.";
                renderConsistentElements();
            } else if (id) {
                alert("ID already exists.");
            }
        });

        document.getElementById('add-character-btn').addEventListener('click', () => {
            const id = prompt("Enter new character ID:");
            if (id && !storyData.characters[id]) {
                storyData.characters[id] = { description: "New character description." };
                renderConsistentElements();
            } else if (id) {
                alert("ID already exists.");
            }
        });

        document.getElementById('add-location-btn').addEventListener('click', () => {
            const id = prompt("Enter new location ID:");
            if (id && !storyData.locations[id]) {
                storyData.locations[id] = { description: "New location description." };
                renderConsistentElements();
            } else if (id) {
                alert("ID already exists.");
            }
        });
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

    nodeEditorForm.addEventListener('click', (e) => {
        if (e.target.classList.contains('insert-template-btn')) {
            const targetId = e.target.dataset.target;
            const textarea = document.getElementById(targetId);
            const category = prompt("Enter category (style_guides, characters, locations):");
            if (category && storyData[category]) {
                const elementId = prompt(`Enter ID from ${category}:`);
                if (elementId && storyData[category][elementId]) {
                    const template = `{{${category}.${elementId}.description}}`;
                    textarea.value += template;
                } else if (elementId) {
                    alert("ID not found.");
                }
            } else if(category) {
                alert("Category not found.");
            }
        }

        if (e.target.classList.contains('preview-template-btn')) {
            const targetId = e.target.dataset.target;
            const textarea = document.getElementById(targetId);
            let content = textarea.value;

            content = content.replace(/\{\{(.*?)\}\}/g, (match, key) => {
                const keys = key.trim().split('.');
                let value = storyData;
                try {
                    for (const k of keys) {
                        value = value[k];
                    }
                    return value || match;
                } catch (err) {
                    return match; // If path is invalid, return original placeholder
                }
            });

            alert("Preview:\n\n" + content);
        }
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
