'use server';
/**
 * @fileOverview Generates participant tags and personalized messages for event attendees.
 *
 * - generateParticipantTags - A function that generates participant tags and personalized messages.
 * - GenerateParticipantTagsInput - The input type for the generateParticipantTags function.
 * - GenerateParticipantTagsOutput - The return type for the generateParticipantTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateParticipantTagsInputSchema = z.object({
  name: z.string().describe('The name of the participant.'),
  organization: z.string().describe('The organization the participant belongs to.'),
  phone: z.string().describe('The phone number of the participant.'),
  contactDetails: z.string().describe('The contact details of the participant.'),
});
export type GenerateParticipantTagsInput = z.infer<
  typeof GenerateParticipantTagsInputSchema
>;

const GenerateParticipantTagsOutputSchema = z.object({
  tagContent: z.string().describe('The content to be printed on the participant tag.'),
  personalizedMessage: z
    .string()
    .describe('A personalized message for the attendee based on their interests.'),
});
export type GenerateParticipantTagsOutput = z.infer<
  typeof GenerateParticipantTagsOutputSchema
>;

export async function generateParticipantTags(
  input: GenerateParticipantTagsInput
): Promise<GenerateParticipantTagsOutput> {
  return generateParticipantTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateParticipantTagsPrompt',
  input: {schema: GenerateParticipantTagsInputSchema},
  output: {schema: GenerateParticipantTagsOutputSchema},
  prompt: `You are an event coordinator responsible for generating participant tags and personalized messages for attendees.

  Based on the participant's information, create a tag content suitable for printing on a name tag and a short, personalized message to make them feel welcome.

  Participant Name: {{{name}}}
  Organization: {{{organization}}}
  Phone: {{{phone}}}
  Contact Details: {{{contactDetails}}}

  Tag Content Instructions:
  - Include the participant's name and organization.
  - Make it easily readable for other attendees.

  Personalized Message Instructions:
  - Reference their phone number to create a connection.
  - Keep the message concise and friendly.
  - Should reference their contact details in some way.

  Here is the output formatted as JSON:
  {{output}}
  `,
});

const generateParticipantTagsFlow = ai.defineFlow(
  {
    name: 'generateParticipantTagsFlow',
    inputSchema: GenerateParticipantTagsInputSchema,
    outputSchema: GenerateParticipantTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
