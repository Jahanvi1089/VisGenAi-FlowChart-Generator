import { ChatOpenAI } from "@langchain/openai";
import { LLMChain } from "langchain/chains";
import { Document } from "@langchain/core/documents";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { MarkdownTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "@langchain/core/prompts";

interface SelectedTemplate {
  name: string;
  template: string;
}

interface GenerateInput {
  input: string;
  selectedTemplate: SelectedTemplate;
}

export const generate = async ({ input, selectedTemplate }: GenerateInput) => {
  try {
    const model = new ChatOpenAI({
      temperature: 0.9,
      modelName: "gpt-3.5-turbo",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const promptTemplate = `{syntax} - {instructions} learn from syntax above and write {template} in mermaid syntax about {input}?`;

    const prompt = new PromptTemplate({
      template: promptTemplate,
      inputVariables: ["template", "input", "syntax", "instructions"],
    });

    const chain = new LLMChain({ llm: model, prompt });

    // Load markdown syntax instructions
    // selectedTemplate.name should match the markdown file name (e.g., 'flowchart' => syntax/flowchart.md)
    const syntaxDoc = await import(`./syntax/${selectedTemplate.name.toLowerCase()}.md`);

    const response = await chain.call({
      template: selectedTemplate.template,
      input,
      syntax: syntaxDoc.default,
      instructions: `
        - use different shapes, colors and also use icons when possible as mentioned in the doc.
        - strict rules: do not add Note and do not explain the code and do not add any additional text except code,
        - do not use 'end' syntax
        - do not use any parenthesis inside block
      `,
    });

    return {
      output: response?.text || response,
      templateName: selectedTemplate.name,
    };
  } catch (e: any) {
    console.error("openai:debug", e?.response?.data || e.message);
    throw e;
  }
};
