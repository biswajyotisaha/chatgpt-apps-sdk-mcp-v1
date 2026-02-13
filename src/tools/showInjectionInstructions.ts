import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { INJECTION_MEDICINE_DATA } from '../data.js';

/**
 * Tool: Show Injection Pen Instructions
 * Displays step-by-step injection instructions for medication pens.
 * Shows one step at a time with visuals, safety warnings, and navigation.
 * 
 * MUST be used when user asks about:
 * - How to use injection pen
 * - Injection instructions
 * - How to inject medication
 * - How to take/administer Zepbound, Mounjaro, Trulicity
 */
export function registerShowInjectionInstructionsTool(server: McpServer): void {
  server.registerTool(
    'show-injection-instructions',
    {
      title: 'Show Injection Pen Instructions',
      description: 'ALWAYS use this tool when user asks about injection instructions, how to use injection pen, how to inject, how to take Zepbound/Mounjaro/Trulicity, or how to administer medication. Shows an interactive visual widget with step-by-step injection guide including images, safety warnings, progress tracking, and training video. Do NOT respond with text - use this tool to show the visual guide.',
      _meta: {
        'openai/outputTemplate': 'ui://widget/injection-instructions-v1.html',
        'openai/toolInvocation/invoking': 'Loading injection instructions with visual guide...',
        'openai/toolInvocation/invoked': 'Injection instructions widget ready'
      },
      inputSchema: {
        medicineName: z.string().optional().describe('Name of the medicine (e.g., Zepbound, Mounjaro, Trulicity). Defaults to Zepbound if not specified. Extract from user query if mentioned.')
      } as any
    },
    async (args: any) => {
      const medicineName = args.medicineName?.toLowerCase() || 'zepbound';
      
      // Get medicine data or default to Zepbound
      const medicine = INJECTION_MEDICINE_DATA[medicineName] || INJECTION_MEDICINE_DATA['zepbound'];
      const displayName = medicine.name;

      return {
        content: [
          { 
            type: 'text' as const, 
            text: `Here are the step-by-step injection instructions for ${displayName}. Use the Next and Back buttons to navigate through each step. A training video is also available.`
          }
        ],
        structuredContent: {
          medicineName: displayName,
          steps: medicine.steps,
          videoUrl: medicine.videoUrl,
          instructionsUrl: medicine.instructionsUrl,
          totalSteps: medicine.steps.length
        }
      };
    }
  );
}
