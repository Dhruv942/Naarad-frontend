import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserPreferences, SampleMessage, SelectableTagCategoryKey, CategorySpecificPreferences, AiFollowUpQuestion, FollowUpAnswer, Alert } from '../types';
import { INTEREST_TAG_HIERARCHY, FollowUpQuestion as FollowUpQuestionType } from '../constants'; 

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY for Gemini is not set. Sample message generation will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "mock_api_key_placeholder" });

export const getTagLabel = (tagId: string): string => {
  for (const mainCatKey in INTEREST_TAG_HIERARCHY) {
    const mainCat = INTEREST_TAG_HIERARCHY[mainCatKey];
    if (mainCat.tags) {
      const foundTag = mainCat.tags.find(t => t.id === tagId);
      if (foundTag) return foundTag.label;
    }
    if (mainCat.subCategories) {
      for (const subCat of mainCat.subCategories) {
        if (subCat.tags) {
          const foundTag = subCat.tags.find(t => t.id === tagId);
          if (foundTag) return foundTag.label;
        }
      }
    }
  }
  return tagId; 
};

const getFollowUpQuestionText = (categoryKey: SelectableTagCategoryKey, questionId: string): string => {
  const mainCat = INTEREST_TAG_HIERARCHY[categoryKey.toUpperCase() as keyof typeof INTEREST_TAG_HIERARCHY];
  const question = mainCat?.followUpQuestions?.find(q => q.id === questionId);
  return question ? question.text : questionId;
};

const formatAlertForPrompt = (alert: Alert, user: UserPreferences): string => {
  let prompt = "User's Alert Configuration:\n";
  prompt += `- Alert Name: ${alert.name}\n`;
  prompt += `- Frequency: ${alert.frequency}${alert.frequency === "Custom" && alert.customFrequencyTime ? ` at ${alert.customFrequencyTime}` : ''}\n`;

  const processCategory = (categoryKey: SelectableTagCategoryKey, categoryLabel: string) => {
    const categoryData = alert[categoryKey] as CategorySpecificPreferences;
    let categoryHasContent = false;

    if (categoryData.selectedTags.length > 0) categoryHasContent = true;
    if (categoryKey === 'sports' && categoryData.otherSportName && categoryData.otherSportName.trim() !== '') {
        categoryHasContent = true;
    }
    if (categoryData.followUpAnswers) {
        for (const qId in categoryData.followUpAnswers) {
            const answerObj = categoryData.followUpAnswers[qId];
            if ((answerObj.selectedPredefinedTags && answerObj.selectedPredefinedTags.length > 0) || (answerObj.customAnswerViaOther && answerObj.customAnswerViaOther.trim() !== '')) {
                categoryHasContent = true;
                break;
            }
        }
    }
    if (categoryData.instructionTags && categoryData.instructionTags.length > 0) categoryHasContent = true;
    
    if (categoryHasContent) {
        prompt += `- ${categoryLabel}:\n`;
        if (categoryData.selectedTags.length > 0) {
            prompt += `  - Interests/Topics: ${categoryData.selectedTags.map(getTagLabel).join(', ')}\n`;
        }
        if (categoryKey === 'sports' && categoryData.otherSportName && categoryData.otherSportName.trim() !== '') {
            prompt += `  - Specified Other Sport: ${categoryData.otherSportName.trim()}\n`;
        }
        if (categoryData.followUpAnswers) {
            let hasFollowUpOutput = false;
            let followUpPromptPart = "  - Additional Details (Fixed Q&A):\n";
            for (const questionId in categoryData.followUpAnswers) {
                const answerObj = categoryData.followUpAnswers[questionId];
                let answerParts: string[] = [];
                if (answerObj.selectedPredefinedTags && answerObj.selectedPredefinedTags.length > 0) {
                    answerParts.push(...answerObj.selectedPredefinedTags);
                }
                if (answerObj.customAnswerViaOther && answerObj.customAnswerViaOther.trim() !== '') {
                    answerParts.push(`Other: ${answerObj.customAnswerViaOther.trim()}`);
                }

                if (answerParts.length > 0) {
                    hasFollowUpOutput = true;
                    const questionText = getFollowUpQuestionText(categoryKey, questionId);
                    followUpPromptPart += `    - Q: ${questionText}\n    - A: ${answerParts.join('; ')}\n`;
                }
            }
            if (hasFollowUpOutput) {
                prompt += followUpPromptPart;
            }
        }
        if (categoryData.instructionTags && categoryData.instructionTags.length > 0) {
            prompt += `  - Specific Instructions (Tags): ${categoryData.instructionTags.join(', ')}\n`;
        }
    }
  };
  
  processCategory('sports', 'Sports');
  processCategory('moviesTV', 'Movies & TV');
  processCategory('news', 'News');
  processCategory('youtube', 'YouTube');
  
  if (alert.customInterestTags.length > 0) {
    prompt += `- Custom Interests: ${alert.customInterestTags.join(', ')}\n`;
  }
  
  return prompt;
};

const generateSampleMessageFromText = async (promptText: string): Promise<SampleMessage> => {
    const fallbackMessage: SampleMessage = {
        summaryText: "Sample message generation is disabled or encountered an error. This is a mock update!",
        imageUrl: "⚙️",
        actionText: "Try Again Later"
    };

    if (!API_KEY || API_KEY === "mock_api_key_placeholder") {
        return Promise.resolve(fallbackMessage);
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptText,
            config: { responseMimeType: "application/json" }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) jsonStr = match[2].trim();

        const parsedData = JSON.parse(jsonStr) as SampleMessage;
        if (parsedData.imageSuggestion && !parsedData.imageUrl) {
            parsedData.imageUrl = parsedData.imageSuggestion;
        }
        return parsedData;
    } catch (error) {
        console.error("Error generating single sample message from Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            return { ...fallbackMessage, summaryText: "Could not generate sample: API key is not valid." };
        }
        return { ...fallbackMessage, summaryText: "Sorry, we couldn't generate a sample message at this time." };
    }
};

// FIX: Export a new function 'generateSampleMessage' for use in the ReviewConfirmPage.
export const generateSampleMessage = async (alert: Alert, user: UserPreferences): Promise<SampleMessage> => {
    const userPreferencesPrompt = formatAlertForPrompt(alert, user);
    const fullPrompt = `Based on the user's alert configuration, generate a single, realistic, and compelling sample WhatsApp update. The response MUST be a valid JSON object.

User Config:
${userPreferencesPrompt}

The JSON object must have this structure:
{
  "summaryText": "string",
  "imageSuggestion": "string (a brief suggestion for a relevant emoji or a short image description)",
  "actionText": "string"
}

JSON Response:`;
    return generateSampleMessageFromText(fullPrompt);
};

export const generateTuningSamples = async (alert: Alert, user: UserPreferences): Promise<SampleMessage[]> => {
    const fallbackMessages: SampleMessage[] = [
        { summaryText: "This is a mock 'Direct Hit' update based on your tags!", imageUrl: "🎯", actionText: "See More" },
        { summaryText: "This is a mock 'Depth Test' update, perhaps more analytical.", imageUrl: "🤔", actionText: "Read Analysis" },
        { summaryText: "This is a mock 'Boundary Test' on a related topic.", imageUrl: "🗺️", actionText: "Explore Topic" },
        { summaryText: "Sample 4: A different angle on your interests.", imageUrl: "✨", actionText: "Learn more"},
        { summaryText: "Sample 5: Testing another format for you.", imageUrl: "📰", actionText: "Read article"},
        { summaryText: "Sample 6: How about this related idea?", imageUrl: "💡", actionText: "Discover"},
    ];
    
    if (!API_KEY || API_KEY === "mock_api_key_placeholder") {
        return Promise.resolve(fallbackMessages);
    }

    const userPreferencesPrompt = formatAlertForPrompt(alert, user);
    const fullPrompt = `Based on the user's alert configuration, generate an array of exactly 6 distinct sample WhatsApp updates to help fine-tune their preferences. The response MUST be a valid JSON array of objects.

User Config:
${userPreferencesPrompt}

Instructions for the 6 samples (provide variety):
1.  **Direct Hit:** A message that directly matches their core interests and instructions. This should be what they expect.
2.  **Depth Test:** A message on the same topic but with a different style or depth. (e.g., more analytical/opinionated if they prefer facts, or a human-interest story related to the topic).
3.  **Boundary Test:** A message on a closely related but not explicitly requested topic to gauge their broader interests (e.g., if they like 'IPL Cricket', a message about a major football team's new signing).
4.  **Format Test:** A message with a different format (e.g., using bullet points, a question, or a more casual tone).
5.  **Action Test:** A message with a different type of call-to-action (e.g., "Watch Video", "Read Full Story", "See Stats").
6.  **Wildcard:** An interesting update that is tangentially related to their profile, testing for serendipity.

Each object in the array must have this structure:
{
  "summaryText": "string",
  "imageSuggestion": "string (a brief suggestion for a relevant emoji or a short image description)",
  "actionText": "string"
}

JSON Response:`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: { responseMimeType: "application/json" }
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) jsonStr = match[2].trim();

        const parsedArray = JSON.parse(jsonStr) as SampleMessage[];
        if (Array.isArray(parsedArray) && parsedArray.length > 0) {
            return parsedArray.map(item => ({
                ...item,
                imageUrl: item.imageSuggestion || item.imageUrl,
            }));
        }
        throw new Error("AI response was not a valid array.");

    } catch (error) {
        console.error("Error generating tuning samples from Gemini:", error);
        return fallbackMessages;
    }
};