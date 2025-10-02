// Overlay Editor JavaScript
class OverlayEditor {
  constructor() {
    this.isOpen = false;
    this.currentNode = null;
    this.generationHistory = {};
    this.refinementNotes = {};
    this.isGenerating = false;
    
    // API configuration - now uses secure server-side endpoint
    // API key is stored securely on the server
    this.API_URL = '/api/generate-image';
    
    this.init();
  }
  
  init() {
    // Add secret keyboard shortcut (Ctrl+Shift+E) to enable editor
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        sessionStorage.setItem('editorEnabled', 'true');
        window.location.reload();
      }
    });
    
    // Add console command to enable editor
    window.enableEditor = () => {
      sessionStorage.setItem('editorEnabled', 'true');
      window.location.reload();
      console.log('Editor enabled! Refreshing page...');
    };
    
    this.createElements();
    this.attachEventListeners();
    this.startSyncInterval();
    
    // Restore generation history from saved data if available
    if (window.storyData && window.storyData.generation_history) {
      this.generationHistory = window.storyData.generation_history;
      console.log('Restored generation history from saved data:', Object.keys(this.generationHistory).length, 'nodes with history');
    }
    
    console.log('Overlay Editor initialized');
  }
  
  createElements() {
    // Check for admin access via session storage token
    const adminToken = sessionStorage.getItem('adminToken');
    const isAdmin = !!adminToken;
    
    if (!isAdmin) {
      // Editor not available for public
      return;
    }
    
    // Create toggle button only for admin
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'overlay-editor-toggle';
    toggleBtn.innerHTML = '🎨';
    toggleBtn.title = 'Open Image Editor';
    document.body.appendChild(toggleBtn);
    
    // Create overlay panel
    const panel = document.createElement('div');
    panel.className = 'overlay-editor-panel';
    panel.innerHTML = `
      <div class="overlay-editor-header">
        <h2>Scene Image Editor</h2>
        <div class="scene-info">
          <span class="scene-id">Scene: <span id="editor-scene-id">-</span></span>
          <span class="scene-location">Location: <span id="editor-scene-location">-</span></span>
          <div class="scene-navigation" style="margin-top: 10px;">
            <button id="btn-prev-node" style="padding: 5px 10px; margin-right: 5px; background: #444; color: white; border: 1px solid #666; border-radius: 4px; cursor: pointer;">← Previous</button>
            <button id="btn-next-node" style="padding: 5px 10px; background: #444; color: white; border: 1px solid #666; border-radius: 4px; cursor: pointer;">Next →</button>
          </div>
        </div>
      </div>
      
      <div class="overlay-editor-content">
        <!-- Progress Section -->
        <div class="progress-section">
          <div class="progress-label">Story Progress</div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-stats">
            <span id="progress-current">0 scenes with images</span>
            <span id="progress-total">0 total scenes</span>
          </div>
        </div>
        
        <!-- Scene Text -->
        <div class="scene-text-section">
          <h3>Scene Text <span id="text-status" style="font-size: 0.8em; color: #888;"></span></h3>
          <textarea 
            class="scene-text-editor" 
            id="editor-scene-text"
            placeholder="Scene narrative text..."
            style="width: 100%; min-height: 100px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff; padding: 8px; resize: vertical; font-family: inherit; font-size: 0.9em;"
          >No scene loaded</textarea>
          <button class="btn-reset-text" id="btn-reset-text" style="margin-top: 5px; font-size: 0.9em; display: none;">
            Reset Text to Original
          </button>
        </div>
        
        <!-- Current Image -->
        <div class="image-section">
          <h3>Current Image</h3>
          <div class="current-image-container" id="current-image-container">
            <div class="no-image-placeholder">
              <i>🖼️</i>
              <p>No image generated yet</p>
            </div>
          </div>
          <div class="current-image-container" id="current-image-container-mobile">
            <div class="no-image-placeholder">
              <i>📱</i>
              <p>No mobile image generated yet</p>
            </div>
          </div>
          
          <!-- Loading Spinner -->
          <div class="generating-spinner" id="generating-spinner">
            <div class="spinner"></div>
            <p>Generating image...</p>
          </div>
        </div>
        
        <!-- Image Prompt -->
        <div class="prompt-section">
          <h3>Image Prompt <span id="prompt-status" style="font-size: 0.8em; color: #888;"></span></h3>
          <textarea 
            class="prompt-textarea" 
            id="editor-image-prompt"
            placeholder="Describe what the image should show..."
          ></textarea>
          <button class="btn-reset-prompt" id="btn-reset-prompt" style="margin-top: 5px; font-size: 0.9em;">
            Reset to Original
          </button>
        </div>
        
        <!-- Refinement Notes -->
        <div class="notes-section">
          <h3>Refinement Notes (optional)</h3>
          <textarea 
            class="notes-textarea" 
            id="editor-refinement-notes"
            placeholder="Add notes for improving the image (e.g., 'make it darker', 'add more detail to the background')"
          ></textarea>
        </div>
        
        <!-- Aspect Ratio -->
        <div class="aspect-ratio-section">
          <h3>Aspect Ratio</h3>
          <select id="editor-aspect-ratio" class="dropdown">
            <option value="9:16">Portrait (9:16)</option>
            <option value="16:9">Landscape (16:9)</option>
            <option value="1:1">Square (1:1)</option>
            <option value="4:3">Standard (4:3)</option>
          </select>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-generate" id="btn-generate">
            Generate Image
          </button>
          <button class="btn-retry" id="btn-retry">
            Retry Generation
          </button>
          <button class="btn-regenerate" id="btn-regenerate">
            Regenerate with Notes
          </button>
          <button class="btn-retry-next" id="btn-retry-next" title="Use next scene's image to align this one">
            Align with Next Scene
          </button>
          <button class="btn-clear" id="btn-clear">
            Clear Image
          </button>
          <button class="btn-generate-mobile" id="btn-generate-mobile" title="Generate a 9:16 mobile version of the current image">
            Generate Mobile
          </button>
          <button class="btn-clear-mobile" id="btn-clear-mobile" title="Clear the 9:16 mobile version of the image">
            Clear Mobile Image
          </button>
        </div>
        
        <!-- Generation History -->
        <div class="history-section" id="history-section" style="display: none;">
          <h3 class="history-title">Generation History</h3>
          <div class="history-grid" id="history-grid">
            <!-- History items will be added here -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    
    // Store references
    this.toggleBtn = toggleBtn;
    this.panel = panel;
  }
  
  attachEventListeners() {
    // Toggle button
    this.toggleBtn.addEventListener('click', () => this.toggle());
    
    // Generate button
    document.getElementById('btn-generate').addEventListener('click', () => {
      this.generateImage('new');
    });
    
    // Retry button (simple regenerate)
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.generateImage('retry');
    });
    
    // Regenerate with notes button
    document.getElementById('btn-regenerate').addEventListener('click', () => {
      this.generateImage('with-notes');
    });
    
    // Retry with next frame button (align with next scene)
    document.getElementById('btn-retry-next').addEventListener('click', () => {
      this.generateImage('align-with-next');
    });
    
    // Clear button
    document.getElementById('btn-clear').addEventListener('click', () => {
      this.clearImage();
    });
    
    document.getElementById('btn-generate-mobile').addEventListener('click', () => {
      this.generateImage('mobile');
    });

    document.getElementById('btn-clear-mobile').addEventListener('click', () => {
      this.clearMobileImage();
    });
    
    // Save prompt changes
    document.getElementById('editor-image-prompt').addEventListener('blur', () => {
      this.savePromptChanges();
    });
    
    // Save notes changes
    document.getElementById('editor-refinement-notes').addEventListener('blur', () => {
      this.saveNotesChanges();
    });
    
    // Reset prompt to original
    document.getElementById('btn-reset-prompt').addEventListener('click', () => {
      this.resetPromptToOriginal();
    });
    
    // Save text changes
    document.getElementById('editor-scene-text').addEventListener('blur', () => {
      this.saveTextChanges();
    });
    
    // Reset text to original
    document.getElementById('btn-reset-text').addEventListener('click', () => {
      this.resetTextToOriginal();
    });
    
    // Navigation buttons
    document.getElementById('btn-prev-node').addEventListener('click', () => {
      this.navigateToPreviousNode();
    });
    
    document.getElementById('btn-next-node').addEventListener('click', () => {
      this.navigateToNextNode();
    });
  }
  
  toggle() {
    this.isOpen = !this.isOpen;
    this.toggleBtn.classList.toggle('active', this.isOpen);
    this.panel.classList.toggle('active', this.isOpen);
    
    if (this.isOpen) {
      // Pause the game and stop any ongoing generation
      this.pauseGame();
      this.syncWithGame();
    } else {
      // Resume the game when closing
      this.resumeGame();
    }
  }
  
  pauseGame() {
    // Stop any ongoing image generation
    if (window.generationController) {
      window.generationController.abort();
      console.log('Stopped ongoing image generation');
    }
    
    // Set a global flag to pause auto-transitions only
    window.overlayEditorOpen = true;
    
    // Don't disable buttons - allow navigation while editor is open
    console.log('Auto-transitions paused for editing (buttons remain active)');
  }
  
  resumeGame() {
    // Clear the pause flag
    window.overlayEditorOpen = false;
    
    console.log('Auto-transitions resumed');
  }
  
  startSyncInterval() {
    // Sync with game state every 500ms when open
    setInterval(() => {
      if (this.isOpen) {
        this.syncWithGame();
      }
    }, 500);
  }
  
  syncWithGame() {
    // Get current game state from global variables
    if (!window.currentNodeId || !window.storyData) {
      console.log('Game not ready yet');
      return;
    }
    
    if (window.currentNodeId !== this.currentNode) {
      this.currentNode = window.currentNodeId;
      this.loadCurrentScene();
    }
    
    this.updateProgress();
  }
  
  async preserveOriginalImage(node) {
    // Only preserve if we haven't already captured the original for this node
    if (!this.generationHistory[this.currentNode]) {
      this.generationHistory[this.currentNode] = [];
    }
    
    // Check if we already have an "original" entry
    const hasOriginal = this.generationHistory[this.currentNode].some(item => item.isOriginal);
    
    if (!hasOriginal) {
      // Check for existing image (either in cache, R2, or base64)
      let originalImage = window.imageCache?.[this.currentNode] || node.pre_rendered_image;
      
      // If no base64 but we have an R2 URL, fetch it
      if (!originalImage && node.image_url) {
        try {
          console.log(`[PRESERVE ORIGINAL] Fetching original image from R2 for node: ${this.currentNode}`);
          const response = await fetch(node.image_url);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            originalImage = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            // Cache it
            if (!window.imageCache) window.imageCache = {};
            window.imageCache[this.currentNode] = originalImage;
            console.log('[PRESERVE ORIGINAL] Successfully fetched and cached original image');
          }
        } catch (err) {
          console.error('[PRESERVE ORIGINAL] Error fetching original image:', err);
        }
      }
      
      // If we found an original image, add it to history
      if (originalImage && originalImage.startsWith('data:image')) {
        this.generationHistory[this.currentNode].push({
          image: originalImage,
          prompt: node.image_prompt || 'Original image',
          notes: '',
          timestamp: new Date().toISOString(),
          isOriginal: true,
          storage: node.image_url ? 'R2' : 'base64'
        });
        console.log(`[PRESERVE ORIGINAL] Preserved original image for node: ${this.currentNode}`);
      }
    }
  }
  
  loadCurrentScene() {
    if (!this.currentNode || !window.storyData || !window.storyData.nodes) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (!node) {
      return;
    }
    
    // Update scene info
    document.getElementById('editor-scene-id').textContent = this.currentNode;
    document.getElementById('editor-scene-location').textContent = node.location || 'Unknown';
    document.getElementById('editor-scene-text').value = node.text || 'No text';
    
    // Update text status (edited/original)
    this.updateTextStatus();
    
    // Update image prompt
    const promptField = document.getElementById('editor-image-prompt');
    promptField.value = node.image_prompt || '';
    
    // Update prompt status (edited/original)
    this.updatePromptStatus();
    
    // Load refinement notes if any
    const notesField = document.getElementById('editor-refinement-notes');
    notesField.value = this.refinementNotes[this.currentNode] || '';
    
    // Preserve original image in history if it exists and we haven't captured it yet
    this.preserveOriginalImage(node);
    
    // Update current image
    this.updateImageDisplay();
    
    // Update history
    this.updateHistoryDisplay();
  }
  
  async updateImageDisplay() {
    const container = document.getElementById('current-image-container');
    const mobileContainer = document.getElementById('current-image-container-mobile');
    const node = window.storyData.nodes[this.currentNode];
    
    // Standardized retrieval: Cache → R2 → Base64 → None
    let currentImage = window.imageCache?.[this.currentNode];
    
    // If no cache, try to load from node data with R2 priority
    if (!currentImage) {
      if (node?.image_url) {
        container.innerHTML = `
          <div class="no-image-placeholder">
            <i>⏳</i>
            <p>Loading image from storage...</p>
          </div>
        `;
        
        try {
          console.log(`Loading R2 image for node: ${this.currentNode}`);
          const response = await fetch(node.image_url);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            currentImage = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            // Cache it for future use
            if (!window.imageCache) window.imageCache = {};
            window.imageCache[this.currentNode] = currentImage;
            console.log(`Cached R2 image for node: ${this.currentNode}`);
          } else {
            console.warn(`Failed to fetch R2 image (${response.status}), trying direct URL`);
            currentImage = node.image_url; // Use URL directly
          }
        } catch (err) {
          console.error('Failed to fetch R2 image:', err);
          currentImage = node.image_url; // Fall back to URL
        }
      } else if (node?.pre_rendered_image) {
        // Fallback to legacy base64 storage
        console.log(`Using legacy base64 image for node: ${this.currentNode}`);
        currentImage = node.pre_rendered_image;
        // Cache it for consistency
        if (!window.imageCache) window.imageCache = {};
        window.imageCache[this.currentNode] = currentImage;
      }
    }
    
    if (currentImage) {
      container.innerHTML = `<img src="${currentImage}" alt="Scene image" onload="console.log('Image loaded successfully')">`;
    } else {
      container.innerHTML = `
        <div class="no-image-placeholder">
          <i>🖼️</i>
          <p>No image generated yet</p>
        </div>
      `;
    }

    const mobileImage = node?.pre_rendered_image_mobile || node?.image_url_mobile;
    if (mobileImage) {
      mobileContainer.innerHTML = `<img src="${mobileImage}" alt="Mobile scene image" onload="console.log('Mobile image loaded successfully')">`;
    } else {
      mobileContainer.innerHTML = `
        <div class="no-image-placeholder">
          <i>📱</i>
          <p>No mobile image generated yet</p>
        </div>
      `;
    }
  }
  
  updateProgress() {
    if (!window.storyData || !window.storyData.nodes) {
      return;
    }
    
    const totalNodes = Object.keys(window.storyData.nodes).length;
    let nodesWithImages = 0;
    
    for (const nodeId in window.storyData.nodes) {
      const node = window.storyData.nodes[nodeId];
      // Count nodes that have images in any format (prioritizing R2 URLs)
      if (node.image_url || node.pre_rendered_image || window.imageCache?.[nodeId]) {
        nodesWithImages++;
      }
    }
    
    const percentage = totalNodes > 0 ? (nodesWithImages / totalNodes) * 100 : 0;
    
    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-current').textContent = `${nodesWithImages} scenes with images`;
    document.getElementById('progress-total').textContent = `${totalNodes} total scenes`;
    
    console.log(`Progress: ${nodesWithImages}/${totalNodes} (${percentage.toFixed(1)}%) scenes have images`);
  }
  
  findNextNode() {
    // First check visited history
    if (window.visitedNodes && window.visitedNodes.length > 0) {
      const currentIndex = window.visitedNodes.indexOf(this.currentNode);
      if (currentIndex >= 0 && currentIndex < window.visitedNodes.length - 1) {
        return window.visitedNodes[currentIndex + 1];
      }
    }
    
    // Otherwise look for the first choice's target
    const node = window.storyData.nodes[this.currentNode];
    if (node?.choices && node.choices.length > 0) {
      return node.choices[0].target_id;
    }
    
    return null;
  }
  
  findPreviousNode() {
    console.log('[findPreviousNode] Looking for previous node of:', this.currentNode);
    console.log('[findPreviousNode] Visited nodes:', window.visitedNodes);
    
    // Try to find the previous node based on visited history
    if (window.visitedNodes && window.visitedNodes.length > 1) {
      // Get the node before the current one in visited history
      const currentIndex = window.visitedNodes.indexOf(this.currentNode);
      console.log('[findPreviousNode] Current index in visited:', currentIndex);
      if (currentIndex > 0) {
        const prevNodeId = window.visitedNodes[currentIndex - 1];
        console.log('[findPreviousNode] Found via visited history:', prevNodeId);
        return prevNodeId;
      }
    }
    
    // Fallback: look for any node that has this node as a choice target
    if (window.storyData && window.storyData.nodes) {
      for (const nodeId in window.storyData.nodes) {
        const node = window.storyData.nodes[nodeId];
        if (node.choices) {
          for (const choice of node.choices) {
            // Check both 'target_id' (correct) and 'next' (legacy) fields
            if (choice.target_id === this.currentNode || choice.next === this.currentNode) {
              console.log('[findPreviousNode] Found via choice parent:', nodeId);
              return nodeId;
            }
          }
        }
      }
    }
    
    console.log('[findPreviousNode] No previous node found');
    return null;
  }
  
  async generateImage(mode = 'new') {
    // mode can be: 'new', 'retry', or 'with-notes'
    if (this.isGenerating || !this.currentNode) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (!node) {
      return;
    }
    
    this.isGenerating = true;
    this.setGeneratingState(true);
    
    try {
      // Build the prompt matching main game logic
      let promptParts = [];
      
      // Determine which style guide to use (same as main game)
      const styleKey = node.style_override || 'default';
      const styleGuide = window.storyData.style_guides?.[styleKey] || window.storyData.style_guides?.default || '';
      if (styleGuide) {
        promptParts.push(styleGuide);
      }
      
      // Inject aspect ratio for mobile (same as main game)
      const selectedAspectRatio = document.getElementById('editor-aspect-ratio').value;
      if (selectedAspectRatio) {
        promptParts.push(`Use an aspect ratio of ${selectedAspectRatio} for the image.`);
      }
      
      // Add character descriptions (same as main game)
      if (node.characters_present && window.storyData.characters) {
        const characterDescriptions = node.characters_present.map(charId => {
          return window.storyData.characters[charId]?.description || '';
        }).join(' ');
        if (characterDescriptions) {
          promptParts.push(`Character details: ${characterDescriptions}`);
        }
      }
      
      // Add the scene-specific prompt (from editor field or node)
      const scenePrompt = document.getElementById('editor-image-prompt').value || node.image_prompt || '';
      promptParts.push(scenePrompt);
      
      // Add refinement notes if in with-notes mode
      if (mode === 'with-notes') {
        const notes = document.getElementById('editor-refinement-notes').value;
        if (notes && notes.trim()) {
          promptParts.push(`Additional requirements: ${notes}`);
          console.log('[WITH-NOTES MODE] Adding refinement notes:', notes);
        } else {
          console.warn('[WITH-NOTES MODE] No refinement notes provided - regeneration may produce similar results');
        }
      }
      
      const finalPrompt = promptParts.join('. ');
      console.log(`[OVERLAY EDITOR] Generating image (mode: ${mode})`);
      console.log('[OVERLAY EDITOR] Prompt parts:', promptParts);
      console.log('[OVERLAY EDITOR] Final prompt:', finalPrompt);
      console.log('[OVERLAY EDITOR] Node data:', {
        id: this.currentNode,
        style_override: node.style_override,
        characters_present: node.characters_present,
        image_prompt: node.image_prompt
      });
      
      // Build parts array with prompt
      const parts = [{ text: finalPrompt }];
      
      // Handle different modes for image context
      if (mode === 'with-notes') {
        // Use current image as base for refinement - check cache first, then try to fetch from R2
        let currentImage = window.imageCache?.[this.currentNode] || node.pre_rendered_image;
        
        console.log('[WITH-NOTES MODE] Looking for current image:', {
          has_cached: !!window.imageCache?.[this.currentNode],
          has_pre_rendered: !!node.pre_rendered_image,
          has_image_url: !!node.image_url,
          image_prefix: currentImage ? currentImage.substring(0, 30) : 'none'
        });
        
        // If no base64 but we have an R2 URL, we need to fetch it
        if (!currentImage && node.image_url) {
          try {
            console.log('[WITH-NOTES MODE] Fetching current image from R2:', node.image_url);
            const response = await fetch(node.image_url);
            if (response.ok) {
              const blob = await response.blob();
              const reader = new FileReader();
              currentImage = await new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
              // Cache it for future use
              if (!window.imageCache) window.imageCache = {};
              window.imageCache[this.currentNode] = currentImage;
              console.log('[WITH-NOTES MODE] Successfully fetched and cached current image from R2');
            } else {
              console.error('[WITH-NOTES MODE] Failed to fetch from R2:', response.status);
            }
          } catch (err) {
            console.error('[WITH-NOTES MODE] Error fetching current image from R2:', err);
          }
        }
        
        if (currentImage && currentImage.startsWith('data:image')) {
          const base64Data = currentImage.split(',')[1];
          if (base64Data) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
            parts.unshift({ text: "Use this existing image as a base. Keep the same scene, environment, and characters, but apply the following refinements to create an improved version:" });
            console.log('[WITH-NOTES MODE] ✓ Including current image as context for refinement');
            console.log('[WITH-NOTES MODE] Base64 data length:', base64Data.length);
          } else {
            console.error('[WITH-NOTES MODE] Failed to extract base64 data from current image');
          }
        } else {
          console.warn('[WITH-NOTES MODE] ✗ No current image available for refinement - will generate new image');
        }
      } else if (mode === 'align-with-next') {
        // Use next node's image as reference to align current scene
        const nextNodeId = this.findNextNode();
        console.log('[ALIGN-WITH-NEXT MODE] Current node:', this.currentNode);
        console.log('[ALIGN-WITH-NEXT MODE] Next node found:', nextNodeId);
        
        if (nextNodeId) {
          const nextNode = window.storyData.nodes[nextNodeId];
          console.log('[ALIGN-WITH-NEXT MODE] Next node data:', {
            id: nextNodeId,
            has_pre_rendered: !!nextNode?.pre_rendered_image,
            has_image_url: !!nextNode?.image_url,
            has_cached: !!window.imageCache?.[nextNodeId]
          });
          
          // First check cache, then pre_rendered_image
          let nextImage = window.imageCache?.[nextNodeId] || nextNode?.pre_rendered_image;
          
          // If no base64 but we have an R2 URL, we need to fetch it
          if (!nextImage && nextNode?.image_url) {
            try {
              console.log('[ALIGN-WITH-NEXT MODE] Fetching next image from R2:', nextNode.image_url);
              const response = await fetch(nextNode.image_url);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                nextImage = await new Promise((resolve) => {
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
                // Cache it for future use
                if (!window.imageCache) window.imageCache = {};
                window.imageCache[nextNodeId] = nextImage;
                console.log('[ALIGN-WITH-NEXT MODE] Successfully fetched and cached next image from R2');
              } else {
                console.error('[ALIGN-WITH-NEXT MODE] Failed to fetch from R2:', response.status);
              }
            } catch (err) {
              console.error('[ALIGN-WITH-NEXT MODE] Error fetching next image from R2:', err);
            }
          }
          
          if (nextImage && nextImage.startsWith('data:image')) {
            const base64Data = nextImage.split(',')[1];
            if (base64Data) {
              parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
              parts.unshift({ text: "Use the following image as a strong style and visual reference. Maintain the exact same art style, color palette, lighting, character appearances, and overall aesthetic. However, create a NEW scene that matches this prompt (which takes place BEFORE the reference image in the story):" });
              console.log('[ALIGN-WITH-NEXT MODE] ✓ INCLUDING next scene image as alignment reference');
              console.log('[ALIGN-WITH-NEXT MODE] Using current node prompt:', scenePrompt);
              console.log('[ALIGN-WITH-NEXT MODE] With next node image as style reference');
              console.log('[ALIGN-WITH-NEXT MODE] Image data length:', base64Data.length);
            } else {
              console.error('[ALIGN-WITH-NEXT MODE] Failed to extract base64 from image');
            }
          } else {
            console.warn('[ALIGN-WITH-NEXT MODE] ✗ NO next image available for alignment');
            alert('No next scene image available to align with. Generate the next scene first.');
            this.isGenerating = false;
            this.setGeneratingState(false);
            return;
          }
        } else {
          console.warn('[ALIGN-WITH-NEXT MODE] ✗ NO next node found');
          alert('No next scene found to align with.');
          this.isGenerating = false;
          this.setGeneratingState(false);
          return;
        }
      } else if (mode === 'mobile') {
        let currentImage = window.imageCache?.[this.currentNode] || node.pre_rendered_image;
        if (currentImage && currentImage.startsWith('data:image')) {
          const base64Data = currentImage.split(',')[1];
          if (base64Data) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
            parts.unshift({ text: "Use the previous image as a strong reference for the environment, characters, and art style. Then, create a new image that follows the new prompt:" });
            promptParts.push("Use a portrait aspect ratio (9:16) for the image.");
          }
        }
      } else if (mode === 'retry') {
        // Use previous node's image as context (like normal game flow)
        const previousNodeId = this.findPreviousNode();
        console.log('[RETRY MODE] Current node:', this.currentNode);
        console.log('[RETRY MODE] Previous node found:', previousNodeId);
        
        if (previousNodeId) {
          const prevNode = window.storyData.nodes[previousNodeId];
          console.log('[RETRY MODE] Previous node data:', {
            id: previousNodeId,
            has_pre_rendered: !!prevNode?.pre_rendered_image,
            has_image_url: !!prevNode?.image_url,
            has_cached: !!window.imageCache?.[previousNodeId]
          });
          
          // First check cache, then pre_rendered_image
          let prevImage = window.imageCache?.[previousNodeId] || prevNode?.pre_rendered_image;
          
          // If no base64 but we have an R2 URL, we need to fetch it
          if (!prevImage && prevNode?.image_url) {
            try {
              console.log('[RETRY MODE] Fetching previous image from R2:', `/api/images/${encodeURIComponent(previousNodeId)}`);
              const response = await fetch(`/api/images/${encodeURIComponent(previousNodeId)}`);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                prevImage = await new Promise((resolve) => {
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
                // Cache it for future use
                if (!window.imageCache) window.imageCache = {};
                window.imageCache[previousNodeId] = prevImage;
                console.log('[RETRY MODE] Successfully fetched and cached previous image from R2');
              } else {
                console.error('[RETRY MODE] Failed to fetch from R2:', response.status);
              }
            } catch (err) {
              console.error('[RETRY MODE] Error fetching previous image from R2:', err);
            }
          }
          
          if (prevImage && prevImage.startsWith('data:image')) {
            const base64Data = prevImage.split(',')[1];
            if (base64Data) {
              parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
              parts.unshift({ text: "Use the previous image as a strong reference for the environment, characters, and art style. Then, create a new image that follows the new prompt:" });
              console.log('[RETRY MODE] ✓ INCLUDING previous scene image as context');
              console.log('[RETRY MODE] Image data length:', base64Data.length);
            } else {
              console.error('[RETRY MODE] Failed to extract base64 from image');
            }
          } else {
            console.warn('[RETRY MODE] ✗ NO previous image available for context');
            console.log('[RETRY MODE] prevImage value:', prevImage ? prevImage.substring(0, 50) : 'null');
          }
        } else {
          console.warn('[RETRY MODE] ✗ NO previous node found - cannot use previous context');
        }
      }
      // mode === 'new' doesn't include any previous image
      
      // Prepare context image if available
      let contextImage = null;
      if (parts.length > 1 && parts[0].inlineData) {
        // Extract base64 from the context image part
        contextImage = parts[0].inlineData.data;
      } else if (parts.length > 2 && parts[1].inlineData) {
        // Sometimes context is at index 1
        contextImage = parts[1].inlineData.data;
      }
      
      // Extract prompt text from parts
      const promptText = parts.filter(p => p.text).map(p => p.text).join('. ');
      
      // Call server-side API endpoint
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Token': sessionStorage.getItem('adminToken') || '' // Admin key for overlay editor
        },
        body: JSON.stringify({
          prompt: promptText,
          contextImage: contextImage
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      let base64ImageData;
      // Handle response from our worker endpoint
      if (data.candidates?.[0]?.content?.parts) {
        // Response from Gemini via worker
        const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
        if (!imagePart) {
          throw new Error('No image data in response');
        }
        base64ImageData = imagePart.inlineData.data;
      } else if (data.image) {
        // Direct image response from worker
        base64ImageData = data.image;
      } else {
        throw new Error('Invalid response format from server');
      }
      
      const imageData = `data:image/png;base64,${base64ImageData}`;
      
      // Sanitize node ID for use in URLs
      const sanitizedNodeId = encodeURIComponent(this.currentNode);
      
      if (mode === 'mobile') {
        const imageUploaded = await this.uploadImageToR2(sanitizedNodeId, base64ImageData, '-mobile');
        if (imageUploaded) {
          node.image_url_mobile = `/api/images/${sanitizedNodeId}-mobile`;
          delete node.pre_rendered_image_mobile;
        } else {
          node.pre_rendered_image_mobile = imageData;
        }
      } else {
        const imageUploaded = await this.uploadImageToR2(sanitizedNodeId, base64ImageData);
        if (imageUploaded) {
          const imageUrl = `/api/images/${sanitizedNodeId}`;
          node.image_url = imageUrl;
          delete node.pre_rendered_image;
        } else {
          node.pre_rendered_image = imageData;
          delete node.image_url;
        }
      }
      
      // Always save the story data
      try {
        await this.saveToCloud();
        console.log(`Story saved successfully after image generation for node: ${this.currentNode}`);
      } catch (saveError) {
        console.error('Failed to save story after image generation:', saveError);
        alert('Warning: Image generated but story save failed. Changes may be lost.');
      }
      
      // Add to generation history (always use base64 for display)
      if (!this.generationHistory[this.currentNode]) {
        this.generationHistory[this.currentNode] = [];
      }
      
      // Find and remove any non-original items, but keep the original
      const original = this.generationHistory[this.currentNode].find(item => item.isOriginal);
      const nonOriginalHistory = this.generationHistory[this.currentNode].filter(item => !item.isOriginal);
      
      // Add new generation at the beginning of non-original items
      nonOriginalHistory.unshift({
        image: imageData, // Always store base64 for history display
        prompt: finalPrompt,
        notes: mode === 'with-notes' ? document.getElementById('editor-refinement-notes').value : '',
        timestamp: new Date().toISOString(),
        storage: imageUploaded ? 'R2' : 'base64' // Track storage method for debugging
      });
      
      // Keep only last 4 non-original generations (to make room for the original)
      if (nonOriginalHistory.length > 4) {
        nonOriginalHistory.splice(4);
      }
      
      // Rebuild history with non-original items first, then original at the end
      this.generationHistory[this.currentNode] = [...nonOriginalHistory];
      if (original) {
        this.generationHistory[this.currentNode].push(original);
      }
      
      // Update displays
      this.updateImageDisplay();
      this.updateHistoryDisplay();
      this.updateProgress();
      
      console.log('Image generated successfully');
      
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert(`Failed to generate image: ${error.message}`);
    } finally {
      this.isGenerating = false;
      this.setGeneratingState(false);
    }
  }
  
  async clearImage() {
    if (!this.currentNode || !confirm('Are you sure you want to clear this image?')) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (node) {
      const sanitizedNodeId = encodeURIComponent(this.currentNode);
      if (node.image_url) {
        try {
          await fetch(`/api/images/${sanitizedNodeId}`, { method: 'DELETE' });
        } catch (err) {
          console.error('Failed to delete R2 image:', err);
        }
      }
      delete node.pre_rendered_image;
      delete node.image_url;
      console.log(`Cleared image data for node: ${this.currentNode}`);
    }
    
    // Clear from cache
    if (window.imageCache) {
      delete window.imageCache[this.currentNode];
    }
    
    // Clear from generation history
    if (this.generationHistory[this.currentNode]) {
      delete this.generationHistory[this.currentNode];
    }
    
    // Update displays
    this.updateImageDisplay();
    this.updateProgress();
    this.updateHistoryDisplay();
    
    // Save changes
    this.saveToCloud().catch(err => {
      console.error('Failed to save after clearing image:', err);
      alert('Warning: Image cleared but save failed. Changes may not persist.');
    });
  }

  async clearMobileImage() {
    if (!this.currentNode || !confirm('Are you sure you want to clear the mobile image?')) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (node) {
      const sanitizedNodeId = encodeURIComponent(this.currentNode);
      if (node.image_url_mobile) {
        try {
          await fetch(`/api/images/${sanitizedNodeId}-mobile`, { method: 'DELETE' });
        } catch (err) {
          console.error('Failed to delete mobile R2 image:', err);
        }
      }
      delete node.pre_rendered_image_mobile;
      delete node.image_url_mobile;
      console.log(`Cleared mobile image data for node: ${this.currentNode}`);
    }
    
    this.updateImageDisplay();
    this.saveToCloud().catch(err => {
      console.error('Failed to save after clearing mobile image:', err);
      alert('Warning: Mobile image cleared but save failed. Changes may not persist.');
    });
  }
  
  savePromptChanges() {
    if (!this.currentNode) return;
    
    const node = window.storyData.nodes[this.currentNode];
    if (node) {
      const editedPrompt = document.getElementById('editor-image-prompt').value;
      // Only save if actually changed from original
      if (editedPrompt !== node.image_prompt) {
        // Store edited prompt separately to preserve original
        if (!node.edited_prompt) {
          node.original_prompt = node.image_prompt; // Backup original first time
        }
        node.edited_prompt = editedPrompt;
        node.image_prompt = editedPrompt; // Update the working prompt
        this.saveToCloud();
      }
    }
  }
  
  saveNotesChanges() {
    if (!this.currentNode) return;
    
    this.refinementNotes[this.currentNode] = document.getElementById('editor-refinement-notes').value;
  }
  
  resetPromptToOriginal() {
    if (!this.currentNode) return;
    
    const node = window.storyData.nodes[this.currentNode];
    if (node && node.original_prompt) {
      // Restore original prompt
      node.image_prompt = node.original_prompt;
      delete node.edited_prompt;
      delete node.original_prompt;
      
      // Update UI
      document.getElementById('editor-image-prompt').value = node.image_prompt;
      this.updatePromptStatus();
      
      // Save changes
      this.saveToCloud();
      console.log('Prompt reset to original');
    }
  }
  
  updatePromptStatus() {
    const node = window.storyData.nodes[this.currentNode];
    const statusEl = document.getElementById('prompt-status');
    if (node && node.edited_prompt) {
      statusEl.textContent = '(edited)';
      statusEl.style.color = '#ffa500';
      document.getElementById('btn-reset-prompt').style.display = 'inline-block';
    } else {
      statusEl.textContent = '';
      document.getElementById('btn-reset-prompt').style.display = 'none';
    }
  }
  
  updateTextStatus() {
    const node = window.storyData.nodes[this.currentNode];
    const statusEl = document.getElementById('text-status');
    if (node && node.edited_text) {
      statusEl.textContent = '(edited)';
      statusEl.style.color = '#ffa500';
      document.getElementById('btn-reset-text').style.display = 'inline-block';
    } else {
      statusEl.textContent = '';
      document.getElementById('btn-reset-text').style.display = 'none';
    }
  }
  
  saveTextChanges() {
    if (!this.currentNode) return;
    
    const node = window.storyData.nodes[this.currentNode];
    if (node) {
      const editedText = document.getElementById('editor-scene-text').value;
      // Only save if actually changed from original
      if (editedText !== node.text) {
        // Store edited text separately to preserve original
        if (!node.edited_text) {
          node.original_text = node.text; // Backup original first time
        }
        node.edited_text = editedText;
        node.text = editedText; // Update the working text
        this.updateTextStatus();
        this.saveToCloud();
      }
    }
  }
  
  resetTextToOriginal() {
    if (!this.currentNode) return;
    
    const node = window.storyData.nodes[this.currentNode];
    if (node && node.original_text) {
      // Restore original text
      node.text = node.original_text;
      delete node.edited_text;
      delete node.original_text;
      
      // Update UI
      document.getElementById('editor-scene-text').value = node.text;
      this.updateTextStatus();
      
      // Save changes
      this.saveToCloud();
      console.log('Text reset to original');
    }
  }
  
  navigateToPreviousNode() {
    // Use visited nodes history if available
    if (window.visitedNodes && window.visitedNodes.length > 1) {
      const currentIndex = window.visitedNodes.indexOf(this.currentNode);
      if (currentIndex > 0) {
        const previousNodeId = window.visitedNodes[currentIndex - 1];
        console.log('Navigating to previous node:', previousNodeId);
        // Navigate in the main game
        if (window.showNode) {
          window.showNode(previousNodeId);
        }
        return;
      }
    }
    console.log('No previous node in history');
  }
  
  navigateToNextNode() {
    // Check if we have a next node in visited history
    if (window.visitedNodes && window.visitedNodes.length > 0) {
      const currentIndex = window.visitedNodes.indexOf(this.currentNode);
      if (currentIndex >= 0 && currentIndex < window.visitedNodes.length - 1) {
        const nextNodeId = window.visitedNodes[currentIndex + 1];
        console.log('Navigating to next node (from history):', nextNodeId);
        if (window.showNode) {
          window.showNode(nextNodeId);
        }
        return;
      }
    }
    
    // Otherwise, try to find the first available choice
    const node = window.storyData.nodes[this.currentNode];
    if (node && node.choices && node.choices.length > 0) {
      const nextNodeId = node.choices[0].target_id;
      console.log('Navigating to next node (first choice):', nextNodeId);
      if (window.showNode) {
        window.showNode(nextNodeId);
      }
    } else {
      console.log('No next node available');
    }
  }
  
  setGeneratingState(isGenerating) {
    const spinner = document.getElementById('generating-spinner');
    const generateBtn = document.getElementById('btn-generate');
    const regenerateBtn = document.getElementById('btn-regenerate');
    const retryBtn = document.getElementById('btn-retry');
    const alignBtn = document.getElementById('btn-retry-next');
    const clearBtn = document.getElementById('btn-clear');
    
    spinner.classList.toggle('active', isGenerating);
    generateBtn.disabled = isGenerating;
    regenerateBtn.disabled = isGenerating;
    retryBtn.disabled = isGenerating;
    alignBtn.disabled = isGenerating;
    clearBtn.disabled = isGenerating;
  }
  
  updateHistoryDisplay() {
    const historySection = document.getElementById('history-section');
    const historyGrid = document.getElementById('history-grid');
    
    const history = this.generationHistory[this.currentNode];
    
    if (!history || history.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    
    historySection.style.display = 'block';
    historyGrid.innerHTML = '';
    
    // Get the current image from cache (which is the actual displayed image)
    const currentImage = window.imageCache?.[this.currentNode] || 
                        window.storyData.nodes[this.currentNode]?.pre_rendered_image;
    
    history.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      // Check if this history item matches the current image
      if (item.image === currentImage) {
        historyItem.classList.add('history-item-current');
      }
      
      // Show generation number and special badges
      const isLatest = index === 0 && !item.isOriginal;
      const isOriginal = item.isOriginal;
      historyItem.innerHTML = `
        <img src="${item.image}" alt="${isOriginal ? 'Original' : `Generation ${history.length - index}`}">
        ${isOriginal ? '<span class="original-badge">Original</span>' : ''}
        ${isLatest ? '<span class="latest-badge">Latest</span>' : ''}
        ${item.image === currentImage ? '<span class="current-badge">Current</span>' : ''}
      `;
      
      historyItem.title = `Generated: ${new Date(item.timestamp).toLocaleString()}${item.notes ? '\nNotes: ' + item.notes : ''}`;
      
      historyItem.addEventListener('click', () => {
        this.revertToHistoryItem(item);
      });
      
      historyGrid.appendChild(historyItem);
    });
  }
  
  async revertToHistoryItem(item) {
    if (!this.currentNode || !confirm('Revert to this version?')) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (!node) return;
    
    try {
      // Update cache immediately for display
      if (!window.imageCache) window.imageCache = {};
      window.imageCache[this.currentNode] = item.image;
      
      // Extract base64 data and re-upload to R2
      const base64Data = item.image.split(',')[1];
      if (base64Data) {
        const sanitizedNodeId = encodeURIComponent(this.currentNode);
        const imageUploaded = await this.uploadImageToR2(sanitizedNodeId, base64Data);
        
        if (imageUploaded) {
          // Store the R2 URL in the story
          const imageUrl = `/api/images/${sanitizedNodeId}`;
          node.image_url = imageUrl;
          delete node.pre_rendered_image;
          console.log(`Successfully reverted and stored image in R2 for node: ${this.currentNode}`);
        } else {
          // Fallback to base64 storage
          console.warn(`R2 upload failed for revert, using base64 fallback`);
          node.pre_rendered_image = item.image;
          delete node.image_url;
        }
        
        // Save the story data
        await this.saveToCloud();
        console.log(`Story saved after reverting to history item`);
      }
      
      // Update displays
      this.updateImageDisplay();
      this.updateHistoryDisplay();
      this.updateProgress();
      
      alert('Successfully reverted to selected image version');
    } catch (error) {
      console.error('Failed to revert to history item:', error);
      alert(`Failed to revert: ${error.message}`);
    }
  }
  
  async saveToCloud() {
    if (!window.storyData) {
      console.error('No story data available to save');
      return false;
    }
    
    try {
      // Validate story data before saving
      await this.validateStoryData();
      
      // IMPORTANT: Save generation history to story data for persistence
      if (!window.storyData.generation_history) {
        window.storyData.generation_history = {};
      }
      window.storyData.generation_history = this.generationHistory;
      
      // Also save the current image cache references (not the actual base64 data)
      if (!window.storyData.cached_images) {
        window.storyData.cached_images = {};
      }
      for (const nodeId in window.imageCache || {}) {
        // Only save that we have a cached image, not the actual data
        window.storyData.cached_images[nodeId] = true;
      }
      
      // Count images by storage type for debugging
      let r2ImageCount = 0;
      let base64ImageCount = 0;
      let totalNodes = 0;
      let historyCount = 0;
      
      for (const nodeId in window.storyData.nodes) {
        const node = window.storyData.nodes[nodeId];
        totalNodes++;
        if (node.image_url) {
          r2ImageCount++;
        }
        if (node.pre_rendered_image) {
          base64ImageCount++;
        }
        if (this.generationHistory[nodeId]) {
          historyCount += this.generationHistory[nodeId].length;
        }
      }
      
      console.log(`Saving story: ${totalNodes} nodes, ${r2ImageCount} R2 images, ${base64ImageCount} base64 images, ${historyCount} history items`);
      
      // Prepare payload with validation
      const payload = JSON.stringify(window.storyData);
      if (payload.length > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('Story data too large for upload (>50MB)');
      }
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Token': sessionStorage.getItem('adminToken') || ''
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
      console.error('❌ Failed to save to cloud:', error);
      
      // More specific error handling
      if (error.message.includes('too large')) {
        alert('Story data is too large to save. Try clearing some unused images.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        alert('Network error while saving. Please check your connection and try again.');
      } else {
        alert(`Failed to save: ${error.message}`);
      }
      return false;
    }
  }
  
  async validateStoryData() {
    // Validate critical story structure
    if (!window.storyData.nodes || typeof window.storyData.nodes !== 'object') {
      throw new Error('Invalid story structure: missing or invalid nodes');
    }
    
    let inconsistencies = [];
    
    // Check for data consistency issues
    for (const nodeId in window.storyData.nodes) {
      const node = window.storyData.nodes[nodeId];
      
      // Check for duplicate storage (both R2 and base64)
      if (node.image_url && node.pre_rendered_image) {
        console.warn(`Node ${nodeId} has both R2 URL and base64 image - removing base64`);
        delete node.pre_rendered_image;
        inconsistencies.push(`Removed duplicate base64 image from ${nodeId}`);
      }
      
      // Validate image URLs
      if (node.image_url && !node.image_url.startsWith('/api/images/')) {
        console.warn(`Node ${nodeId} has invalid image URL: ${node.image_url}`);
        inconsistencies.push(`Invalid image URL in ${nodeId}`);
      }
      
      // Check for orphaned base64 data (very large base64 without corresponding cache)
      if (node.pre_rendered_image && node.pre_rendered_image.length > 100000) {
        if (!window.imageCache || !window.imageCache[nodeId]) {
          console.warn(`Large base64 image in ${nodeId} not cached - should consider R2 storage`);
        }
      }
    }
    
    if (inconsistencies.length > 0) {
      console.log('Story data validation fixes applied:', inconsistencies);
    }
  }
  
  async uploadImageToR2(nodeId, base64Data, suffix = '') {
    try {
      // Comprehensive validation
      if (!nodeId || typeof nodeId !== 'string') {
        throw new Error('Invalid node ID provided for upload');
      }
      
      if (!base64Data || typeof base64Data !== 'string' || base64Data.length === 0) {
        throw new Error('No valid image data to upload');
      }
      
      // Validate base64 format
      try {
        atob(base64Data);
      } catch (e) {
        throw new Error('Invalid base64 image data');
      }
      
      // Convert base64 to blob with error handling
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('Generated image blob is empty');
      }
      
      // Check size (max 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error(`Image too large (${(blob.size / 1024 / 1024).toFixed(2)}MB, max 10MB)`);
      }
      
      console.log(`Uploading ${(blob.size / 1024).toFixed(2)}KB image for node: ${nodeId}`);
      
      // Upload to R2 with timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      let lastError;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Upload attempt ${attempt}/2 for node: ${nodeId}`);
          
      const response = await fetch(`/api/images/${nodeId}${suffix}`, {
            method: 'PUT',
            body: blob,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'no-cache'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
          }
          
          const result = await response.json();
          console.log(`✅ Image uploaded successfully to R2: ${result.path} (attempt ${attempt})`);
          return true;
        } catch (err) {
          lastError = err;
          if (attempt === 1 && err.name !== 'AbortError') {
            console.warn(`Upload attempt ${attempt} failed, retrying:`, err.message);
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // All attempts failed
      throw lastError;
      
    } catch (error) {
      let userMessage = 'Failed to upload image to cloud storage.';
      
      if (error.name === 'AbortError') {
        console.error('❌ Image upload timed out');
        userMessage = 'Image upload timed out. Please check your connection and try again.';
      } else if (error.message.includes('too large')) {
        console.error('❌ Image too large:', error.message);
        userMessage = error.message;
      } else if (error.message.includes('Invalid')) {
        console.error('❌ Invalid data for upload:', error.message);
        userMessage = 'Invalid image data. Please regenerate the image.';
      } else {
        console.error('❌ R2 upload failed:', error);
        userMessage = `Upload failed: ${error.message}`;
      }
      
      // Only show alert for non-network errors to avoid spam
      if (!error.message.includes('fetch') && !error.message.includes('network')) {
        console.warn('Will show alert for upload error:', userMessage);
        // Don't block the UI with alert in production, just log
        // alert(userMessage);
      }
      
      return false;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.overlayEditor = new OverlayEditor();
  });
} else {
  window.overlayEditor = new OverlayEditor();
}