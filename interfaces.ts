export interface Content {
    searchTerm: string;
    prefix: string;
    sourceContentOriginal: string;
    sourceContentSanitized: string;
    sentences: Sentence[];
}

export interface Sentence {
    text: string;
    keywords: string[];
    images: string[];
}