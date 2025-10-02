import { useState } from 'react';

/**
 * A reusable accordion item component.
 * It displays a category title and a collapsible content area with elements.
 * @param {object} props - The component props.
 * @param {string} props.categoryKey - The key for the category (e.g., 'style_guides').
 * @param {string} props.title - The display title for the accordion item.
 * @param {object} props.elements - The elements to display within the accordion.
 * @param {boolean} props.isOpen - Whether the accordion item is currently open.
 * @param {function} props.onToggle - The function to call when the item is toggled.
 * @param {function} props.onElementChange - The function to call when an element's value changes.
 * @param {function} props.onAddElement - The function to call to add a new element.
 * @param {function} props.onDeleteElement - The function to call to delete an element.
 * @returns {JSX.Element} The rendered AccordionItem component.
 */
function AccordionItem({
  categoryKey,
  title,
  elements,
  isOpen,
  onToggle,
  onElementChange,
  onAddElement,
  onDeleteElement,
}) {
  return (
    <div>
      <button className={`accordion-title ${isOpen ? 'active' : ''}`} onClick={onToggle}>
        {title}
      </button>
      {isOpen && (
        <div className="accordion-content">
          {(Object.entries(elements || {})).map(([id, element]) => (
            <div key={id} className="element-item">
              <label>{id}</label>
              <textarea
                value={typeof element === 'object' ? element.description : element}
                onChange={(e) => onElementChange(categoryKey, id, e.target.value)}
              />
              <div className="element-item-actions">
                <button className="delete-btn" onClick={() => onDeleteElement(categoryKey, id)}>Delete</button>
              </div>
            </div>
          ))}
          <button className="add-element-btn" onClick={() => onAddElement(categoryKey)} style={{width: '100%', marginTop: '10px'}}>
            Add New {title.slice(0, -1)}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * A panel that displays the consistent elements of the story (Style Guides, Characters, Locations).
 * It uses an accordion interface to organize the different categories of elements.
 * @param {object} props - The component props.
 * @param {object} props.storyData - The main story data object.
 * @param {function} props.onElementChange - The function to call when an element's value changes.
 * @param {function} props.onAddElement - The function to call to add a new element.
 * @param {function} props.onDeleteElement - The function to call to delete an element.
 * @returns {JSX.Element} The rendered ElementsPanel component.
 */
export default function ElementsPanel({
  storyData,
  onElementChange,
  onAddElement,
  onDeleteElement
}) {
  const [openAccordion, setOpenAccordion] = useState(null);

  const categories = {
    style_guides: "Style Guides",
    characters: "Characters",
    locations: "Locations"
  };

  const handleToggle = (key) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  return (
    <div style={{ 
      width: '280px', 
      minWidth: '250px',
      maxWidth: '350px',
      borderRight: '1px solid #444', 
      backgroundColor: '#2a2a2a', 
      overflowY: 'auto',
      height: '100%',
      flexShrink: 0
    }}>
      <h2 style={{ padding: '10px', margin: 0 }}>Consistent Elements</h2>
      {Object.entries(categories).map(([key, title]) => (
        <AccordionItem
          key={key}
          categoryKey={key}
          title={title}
          elements={storyData[key]}
          isOpen={openAccordion === key}
          onToggle={() => handleToggle(key)}
          onElementChange={onElementChange}
          onAddElement={onAddElement}
          onDeleteElement={onDeleteElement}
        />
      ))}
    </div>
  );
}
