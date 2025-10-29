import { tool } from 'ai';
import { z } from 'zod';
import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import { serverEnv } from '@/env/server';

interface ImageGenerationResult {
  imageData: string;
  mimeType: string;
  prompt: string;
  aspectRatio?: string;
  textContent?: string;
}

export const hyperafficheGenerateTool = tool({
  description: 'Generate high-quality images from text descriptions using Gemini 2.5 Flash Image. Supports various styles: photorealistic, illustrations, logos, product photography, minimalist design, comic panels. Can render accurate text within images.',
  inputSchema: z.object({
    prompt: z.string().describe('Detailed description of the image to generate. Be specific about scene, style, lighting, composition, and any text to include.'),
    aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('1:1').describe('Aspect ratio of the generated image'),
    responseModalities: z.enum(['Image', 'Text_Image']).default('Image').describe('Whether to return only image or image with text description'),
  }),
  execute: async ({ prompt, aspectRatio, responseModalities }) => {
    try {
      const ai = new GoogleGenAI({
        apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const config: any = {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      };

      if (responseModalities === 'Image') {
        config.responseModalities = [Modality.IMAGE];
      }

      const textPart = { text: prompt };

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [textPart] },
        config: config,
      });

      const result: ImageGenerationResult = {
        imageData: '',
        mimeType: 'image/png',
        prompt: prompt,
        aspectRatio: aspectRatio,
      };

      const generatedPart = response.candidates?.[0]?.content?.parts?.[0];
      if (generatedPart) {
        if (generatedPart.text) {
          result.textContent = generatedPart.text;
        }
        if (generatedPart.inlineData) {
          result.imageData = generatedPart.inlineData.data;
          result.mimeType = generatedPart.inlineData.mimeType || 'image/png';
        }
      }

      return result;
    } catch (error: any) {
      console.error('Error generating image:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  },
});

export const hyperafficheEditTool = tool({
  description: 'Edit existing images using text prompts with Gemini 2.5 Flash Image. Can add/remove elements, change style, apply transformations, inpainting, and style transfer.',
  inputSchema: z.object({
    imageData: z.string().describe('Base64 encoded image data to edit'),
    mimeType: z.string().default('image/png').describe('MIME type of the input image'),
    prompt: z.string().describe('Detailed editing instructions: what to add, remove, change, or transform in the image'),
    aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).optional().describe('Optional: aspect ratio for output image'),
  }),
  execute: async ({ imageData, mimeType, prompt, aspectRatio }) => {
    try {
      const ai = new GoogleGenAI({
        apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      };

      const textPart = { text: prompt };

      const config: any = {
        responseModalities: [Modality.IMAGE],
      };

      if (aspectRatio) {
        config.imageConfig = { aspectRatio };
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: config,
      });

      const result: ImageGenerationResult = {
        imageData: '',
        mimeType: 'image/png',
        prompt: prompt,
        aspectRatio: aspectRatio,
      };

      const generatedPart = response.candidates?.[0]?.content?.parts?.[0];
      if (generatedPart) {
        if (generatedPart.text) {
          result.textContent = generatedPart.text;
        }
        if (generatedPart.inlineData) {
          result.imageData = generatedPart.inlineData.data;
          result.mimeType = generatedPart.inlineData.mimeType || 'image/png';
        }
      }

      return result;
    } catch (error: any) {
      console.error('Error editing image:', error);
      throw new Error(`Failed to edit image: ${error.message}`);
    }
  },
});

export const hyperafficheComposeTool = tool({
  description: 'Compose new images from multiple input images using Gemini 2.5 Flash Image. Can combine elements, transfer styles, or create product mockups.',
  inputSchema: z.object({
    images: z.array(z.object({
      imageData: z.string().describe('Base64 encoded image data'),
      mimeType: z.string().default('image/png'),
    })).min(1).max(3).describe('Array of 1-3 images to compose'),
    prompt: z.string().describe('Detailed composition instructions: how to combine the images, what elements to use from each'),
    aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('1:1'),
  }),
  execute: async ({ images, prompt, aspectRatio }) => {
    try {
      const ai = new GoogleGenAI({
        apiKey: serverEnv.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      const imageParts = images.map(img => ({
        inlineData: {
          mimeType: img.mimeType,
          data: img.imageData,
        },
      }));

      const textPart = { text: prompt };

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, textPart] },
        config: {
          responseModalities: [Modality.IMAGE],
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      const result: ImageGenerationResult = {
        imageData: '',
        mimeType: 'image/png',
        prompt: prompt,
        aspectRatio: aspectRatio,
      };

      const generatedPart = response.candidates?.[0]?.content?.parts?.[0];
      if (generatedPart) {
        if (generatedPart.text) {
          result.textContent = generatedPart.text;
        }
        if (generatedPart.inlineData) {
          result.imageData = generatedPart.inlineData.data;
          result.mimeType = generatedPart.inlineData.mimeType || 'image/png';
        }
      }

      return result;
    } catch (error: any) {
      console.error('Error composing images:', error);
      throw new Error(`Failed to compose images: ${error.message}`);
    }
  },
});
