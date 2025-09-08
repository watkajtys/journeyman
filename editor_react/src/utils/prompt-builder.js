export function constructFinalPrompt(node, storyData) {
    if (!node || !storyData) return "";

    let promptParts = [];

    // 1. Get Style Guide
    const styleKey = node.style_override || 'default';
    const styleGuide = storyData.style_guides?.[styleKey] || '';
    if (styleGuide) {
        promptParts.push(styleGuide);
    }

    // 2. Get Character descriptions
    if (node.characters_present && storyData.characters) {
        const characterDescriptions = node.characters_present.map(charId => {
            return storyData.characters[charId]?.description || '';
        }).filter(d => d).join(' '); // filter out empty strings
        if (characterDescriptions) {
             promptParts.push(`Character details: ${characterDescriptions}`);
        }
    }

    // 3. Get the node's image prompt, resolving templates from the main storyData object.
    let resolvedImagePrompt = node.image_prompt || '';
    resolvedImagePrompt = resolvedImagePrompt.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value = storyData;
        try {
            for (const k of keys) {
                value = value[k];
            }
            if (typeof value === 'object' && value.description) {
                return value.description;
            }
            return String(value) || match;
        } catch (err) {
            return match;
        }
    });
    promptParts.push(resolvedImagePrompt);

    return promptParts.join('. ');
}
