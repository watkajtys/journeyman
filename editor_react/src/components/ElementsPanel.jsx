import { useState } from 'react';

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
    <div style={{ width: '300px', borderRight: '1px solid #444', backgroundColor: '#2a2a2a', overflowY: 'auto' }}>
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
