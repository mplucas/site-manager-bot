export interface Content {
    searchTerm: string;
    prefix: string;
    sourceContentOriginal: string;
    sourceContentSanitized: string;
    sentences: Sentence[];
    maximumSentences: number;
}

export interface Sentence {
    text: string;
    keywords: string[];
    images: string[];
    googleSearchQuery: string;
}