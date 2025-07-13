// Utility function to format Notion properties for display
export const formatNotionProperty = (property: any): string | null => {
  if (!property || typeof property !== 'object' || !property.type) {
    return null;
  }

  switch (property.type) {
    case 'title':
      if (property.title && Array.isArray(property.title)) {
        return property.title.map((text: any) => text.plain_text || '').join('');
      }
      break;
    
    case 'rich_text':
      if (property.rich_text && Array.isArray(property.rich_text)) {
        return property.rich_text.map((text: any) => text.plain_text || '').join('');
      }
      break;
    
    case 'number':
      return property.number?.toString() || null;
    
    case 'select':
      return property.select?.name || null;
    
    case 'multi_select':
      if (property.multi_select && Array.isArray(property.multi_select)) {
        return property.multi_select.map((option: any) => option.name).join(', ');
      }
      break;
    
    case 'date':
      if (property.date?.start) {
        const date = new Date(property.date.start);
        if (property.date.end) {
          const endDate = new Date(property.date.end);
          return `${date.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        }
        return date.toLocaleDateString();
      }
      break;
    
    case 'checkbox':
      return property.checkbox ? 'Yes' : 'No';
    
    case 'url':
      return property.url || null;
    
    case 'email':
      return property.email || null;
    
    case 'phone_number':
      return property.phone_number || null;
    
    case 'formula':
      // Handle different formula result types
      if (property.formula) {
        switch (property.formula.type) {
          case 'string':
            return property.formula.string;
          case 'number':
            return property.formula.number?.toString();
          case 'boolean':
            return property.formula.boolean ? 'Yes' : 'No';
          case 'date':
            return property.formula.date ? new Date(property.formula.date.start).toLocaleDateString() : null;
          default:
            return null;
        }
      }
      break;
    
    case 'relation':
      if (property.relation && Array.isArray(property.relation)) {
        return `${property.relation.length} related item(s)`;
      }
      break;
    
    case 'people':
      if (property.people && Array.isArray(property.people)) {
        return property.people.map((person: any) => person.name || 'Unknown').join(', ');
      }
      break;
    
    case 'files':
      if (property.files && Array.isArray(property.files)) {
        return `${property.files.length} file(s)`;
      }
      break;
    
    case 'created_time':
      return property.created_time ? new Date(property.created_time).toLocaleString() : null;
    
    case 'last_edited_time':
      return property.last_edited_time ? new Date(property.last_edited_time).toLocaleString() : null;
    
    case 'created_by':
      return property.created_by?.name || 'Unknown';
    
    case 'last_edited_by':
      return property.last_edited_by?.name || 'Unknown';
    
    case 'array':
      // Handle array properties specially for ingredients and notes
      return null; // Will be handled specially in the modal
    
    default:
      // Try to stringify unknown property types
      try {
        return JSON.stringify(property[property.type]);
      } catch {
        return 'Unsupported property type';
      }
  }

  return null;
};

// Function to extract ingredients from array property
export const extractIngredientsFromArray = (arrayProperty: any): string[] => {
  if (!arrayProperty?.array || !Array.isArray(arrayProperty.array)) {
    return [];
  }

  const ingredients: string[] = [];
  
  arrayProperty.array.forEach((item: any) => {
    if (item.type === 'rich_text' && item.rich_text) {
      // Combine all rich text parts into a single string
      const fullText = item.rich_text.map((text: any) => text.plain_text || '').join('');
      
      if (fullText.trim()) {
        // Check if it contains bullet points or newlines
        if (fullText.includes('•') || fullText.includes('\n')) {
          // Split by bullet points and newlines to extract individual ingredients
          const lines = fullText.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            // Remove bullet points and clean up
            const cleaned = line.replace(/^[•·\-\*]\s*/, '').trim();
            if (cleaned) {
              // Also split by comma in case there are multiple ingredients in one line
              const commaSeparated = cleaned.split(',').map(item => item.trim()).filter(Boolean);
              ingredients.push(...commaSeparated);
            }
          });
        } else {
          // Handle comma-separated ingredients
          const commaSeparated = fullText.split(',').map(item => item.trim()).filter(Boolean);
          ingredients.push(...commaSeparated);
        }
      }
    }
  });

  return ingredients;
};

// Function to extract notes from array property
export const extractNotesFromArray = (arrayProperty: any): Array<{type: 'url' | 'text', content: string}> => {
  if (!arrayProperty?.array || !Array.isArray(arrayProperty.array)) {
    return [];
  }

  const notes: Array<{type: 'url' | 'text', content: string}> = [];
  
  arrayProperty.array.forEach((item: any) => {
    if (item.type === 'url') {
      // Handle URL items, skip if URL is null or empty
      if (item.url && item.url.trim()) {
        notes.push({ type: 'url', content: item.url });
      }
    } else if (item.type === 'rich_text' && item.rich_text) {
      const textContent = item.rich_text.map((text: any) => text.plain_text || '').join('');
      if (textContent.trim()) {
        notes.push({ type: 'text', content: textContent });
      }
    }
  });

  return notes;
};