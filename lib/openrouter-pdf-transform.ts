import type { UIMessage, CoreMessage, TextPart, ImagePart } from 'ai';

export function hasPdfAttachments(messages: UIMessage[]): boolean {
  return messages.some(
    (message) =>
      message.experimental_attachments?.some(
        (attachment) => attachment.contentType === 'application/pdf'
      )
  );
}

export function convertMessagesWithPdfAsText(messages: UIMessage[]): CoreMessage[] {
  return messages.map((message): CoreMessage => {
    const role = message.role as 'user' | 'assistant' | 'system';
    
    if (role === 'user') {
      const content: (TextPart | ImagePart)[] = [];
      let textContent = '';
      
      if (message.parts) {
        for (const part of message.parts) {
          if (part.type === 'text' && 'text' in part) {
            textContent += part.text;
          }
        }
      }
      
      const pdfUrls: string[] = [];
      
      if (message.experimental_attachments) {
        for (const attachment of message.experimental_attachments) {
          if (attachment.contentType === 'application/pdf') {
            pdfUrls.push(attachment.url);
          } else if (attachment.contentType?.startsWith('image/')) {
            content.push({
              type: 'image',
              image: attachment.url,
            } as ImagePart);
          }
        }
      }
      
      if (pdfUrls.length > 0) {
        const pdfSection = pdfUrls.map((url, i) => `[PDF Document ${i + 1}]: ${url}`).join('\n');
        textContent = `${pdfSection}\n\n${textContent}`;
      }
      
      if (textContent) {
        content.unshift({ type: 'text', text: textContent });
      }
      
      if (content.length === 0 && typeof message.content === 'string') {
        return { role: 'user', content: message.content };
      }
      
      return { role: 'user', content: content.length === 1 && content[0].type === 'text' ? (content[0] as TextPart).text : content };
    }
    
    if (role === 'assistant') {
      const textParts = message.parts?.filter((p) => p.type === 'text') || [];
      const text = textParts.map((p) => ('text' in p ? p.text : '')).join('');
      return { role: 'assistant', content: text || '' };
    }
    
    return { role: 'system', content: typeof message.content === 'string' ? message.content : '' };
  });
}

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenRouterContentPart[];
}

type OpenRouterContentPart = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; fileData: string } };

export function convertMessagesForOpenRouterPdf(messages: UIMessage[]): OpenRouterMessage[] {
  return messages.map((message): OpenRouterMessage => {
    const role = message.role as 'user' | 'assistant' | 'system';
    
    if (role === 'user') {
      const content: OpenRouterContentPart[] = [];
      
      if (message.parts) {
        for (const part of message.parts) {
          if (part.type === 'text' && 'text' in part) {
            content.push({ type: 'text', text: part.text });
          }
        }
      }
      
      if (message.experimental_attachments) {
        for (const attachment of message.experimental_attachments) {
          if (attachment.contentType === 'application/pdf') {
            content.push({
              type: 'file',
              file: {
                filename: attachment.name || 'document.pdf',
                fileData: attachment.url,
              },
            });
          } else if (attachment.contentType?.startsWith('image/')) {
            content.push({
              type: 'image_url',
              image_url: { url: attachment.url },
            });
          }
        }
      }
      
      if (content.length === 0) {
        const text = typeof message.content === 'string' ? message.content : '';
        return { role: 'user', content: text };
      }
      
      return { role: 'user', content };
    }
    
    if (role === 'assistant') {
      const textParts = message.parts?.filter((p) => p.type === 'text') || [];
      const text = textParts.map((p) => ('text' in p ? p.text : '')).join('');
      return { role: 'assistant', content: text || '' };
    }
    
    return { role: 'system', content: typeof message.content === 'string' ? message.content : '' };
  });
}
