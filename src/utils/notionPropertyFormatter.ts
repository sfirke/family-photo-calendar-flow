// Narrow types for subset of Notion property value shapes we actually format
interface RichTextObject { plain_text?: string }
interface TitleProperty { type: 'title'; title?: RichTextObject[] }
interface RichTextProperty { type: 'rich_text'; rich_text?: RichTextObject[] }
interface NumberProperty { type: 'number'; number?: number }
interface SelectProperty { type: 'select'; select?: { name?: string } | null }
interface MultiSelectProperty { type: 'multi_select'; multi_select?: Array<{ name: string }> }
interface DateProperty { type: 'date'; date?: { start?: string; end?: string | null } }
interface CheckboxProperty { type: 'checkbox'; checkbox?: boolean }
interface UrlProperty { type: 'url'; url?: string }
interface EmailProperty { type: 'email'; email?: string }
interface PhoneNumberProperty { type: 'phone_number'; phone_number?: string }
interface FormulaString { type: 'string'; string?: string | null }
interface FormulaNumber { type: 'number'; number?: number | null }
interface FormulaBoolean { type: 'boolean'; boolean?: boolean | null }
interface FormulaDate { type: 'date'; date?: { start?: string } | null }
interface FormulaProperty { type: 'formula'; formula?: FormulaString | FormulaNumber | FormulaBoolean | FormulaDate | { type: string } }
interface RelationProperty { type: 'relation'; relation?: Array<unknown> }
interface PeopleProperty { type: 'people'; people?: Array<{ name?: string }> }
interface FilesProperty { type: 'files'; files?: Array<unknown> }
interface CreatedTimeProperty { type: 'created_time'; created_time?: string }
interface LastEditedTimeProperty { type: 'last_edited_time'; last_edited_time?: string }
interface CreatedByProperty { type: 'created_by'; created_by?: { name?: string } }
interface LastEditedByProperty { type: 'last_edited_by'; last_edited_by?: { name?: string } }
interface ArrayProperty { type: 'array'; array?: unknown[] }

type FormattableNotionProperty =
  | TitleProperty
  | RichTextProperty
  | NumberProperty
  | SelectProperty
  | MultiSelectProperty
  | DateProperty
  | CheckboxProperty
  | UrlProperty
  | EmailProperty
  | PhoneNumberProperty
  | FormulaProperty
  | RelationProperty
  | PeopleProperty
  | FilesProperty
  | CreatedTimeProperty
  | LastEditedTimeProperty
  | CreatedByProperty
  | LastEditedByProperty
  | ArrayProperty
  | { type: string; [key: string]: unknown };

// Utility function to format Notion properties for display
export const formatNotionProperty = (property: FormattableNotionProperty | null | undefined): string | null => {
  if (!property || typeof property !== 'object' || !('type' in property)) return null;

  switch (property.type) {
    case 'title':
      return Array.isArray(property.title) ? property.title.map(t => t.plain_text || '').join('') : null;
    case 'rich_text':
      return Array.isArray(property.rich_text) ? property.rich_text.map(t => t.plain_text || '').join('') : null;
    case 'number':
      return property.number != null ? String(property.number) : null;
    case 'select':
      return property.select?.name || null;
    case 'multi_select':
      return Array.isArray(property.multi_select) ? property.multi_select.map(o => o.name).join(', ') : null;
    case 'date':
      if (property.date?.start) {
        const start = new Date(property.date.start);
        if (property.date.end) {
          const end = new Date(property.date.end);
          return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        }
        return start.toLocaleDateString();
      }
      return null;
    case 'checkbox':
      return property.checkbox ? 'Yes' : 'No';
    case 'url':
      return property.url || null;
    case 'email':
      return property.email || null;
    case 'phone_number':
      return property.phone_number || null;
    case 'formula':
      if (property.formula) {
        const f = property.formula as FormulaString | FormulaNumber | FormulaBoolean | FormulaDate | { type: string };
        switch (f.type) {
          case 'string':
            return (f as FormulaString).string || null;
          case 'number':
            return (f as FormulaNumber).number != null ? String((f as FormulaNumber).number) : null;
          case 'boolean':
            return (f as FormulaBoolean).boolean ? 'Yes' : 'No';
          case 'date':
            return (f as FormulaDate).date?.start ? new Date((f as FormulaDate).date!.start!).toLocaleDateString() : null;
          default:
            return null;
        }
      }
      return null;
    case 'relation':
      return Array.isArray(property.relation) ? `${property.relation.length} related item(s)` : null;
    case 'people':
      return Array.isArray(property.people)
        ? property.people.map(p => p.name || 'Unknown').join(', ')
        : null;
    case 'files':
      return Array.isArray(property.files) ? `${property.files.length} file(s)` : null;
    case 'created_time':
      return property.created_time ? new Date(property.created_time as string).toLocaleString() : null;
    case 'last_edited_time':
      return property.last_edited_time ? new Date(property.last_edited_time as string).toLocaleString() : null;
    case 'created_by':
      return property.created_by?.name || 'Unknown';
    case 'last_edited_by':
      return property.last_edited_by?.name || 'Unknown';
    case 'array':
      return null; // intentionally handled elsewhere
    default:
      try {
        // Attempt to serialize any nested object named by its type
        const value = (property as Record<string, unknown>)[property.type];
        return typeof value === 'string' ? value : JSON.stringify(value);
      } catch {
        return 'Unsupported property type';
      }
  }
};

// Function to extract ingredients from array property
export const extractIngredientsFromArray = (arrayProperty: ArrayProperty | null | undefined): string[] => {
  if (!arrayProperty?.array || !Array.isArray(arrayProperty.array)) {
    return [];
  }

  const ingredients: string[] = [];
  
  arrayProperty.array.forEach((item) => {
    const candidate = item as { type?: string; rich_text?: RichTextObject[] };
    if (candidate.type === 'rich_text' && candidate.rich_text) {
      // Combine all rich text parts into a single string
      const fullText = candidate.rich_text.map(text => text.plain_text || '').join('');
      
      if (fullText.trim()) {
        // Check if it contains bullet points or newlines
        if (fullText.includes('•') || fullText.includes('\n')) {
          // Split by bullet points and newlines to extract individual ingredients
          const lines = fullText.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            // Remove bullet points and clean up
            const cleaned = line.replace(/^[•·\-*]\s*/, '').trim();
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
export const extractNotesFromArray = (arrayProperty: ArrayProperty | null | undefined): Array<{type: 'url' | 'text', content: string}> => {
  if (!arrayProperty?.array || !Array.isArray(arrayProperty.array)) {
    return [];
  }

  const notes: Array<{type: 'url' | 'text', content: string}> = [];
  
  arrayProperty.array.forEach((item) => {
    const candidate = item as { type?: string; url?: string; rich_text?: RichTextObject[] };
    if (candidate.type === 'url') {
      if (candidate.url && candidate.url.trim()) {
        notes.push({ type: 'url', content: candidate.url });
      }
    } else if (candidate.type === 'rich_text' && candidate.rich_text) {
      const textContent = candidate.rich_text.map(text => text.plain_text || '').join('');
      if (textContent.trim()) notes.push({ type: 'text', content: textContent });
    }
  });

  return notes;
};