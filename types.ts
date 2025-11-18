export enum AnalysisMode {
  ELEMENT_ANALYSIS = "ELEMENT_ANALYSIS",
  PAGE_REFACTOR = "PAGE_REFACTOR",
  LIVE_INSPECTOR = "LIVE_INSPECTOR"
}

export interface ElementMetadata {
  tag: string;
  id?: string;
  classes?: string[];
  name?: string;
  type?: string;
  text_content?: string;
  aria_label?: string;
  role?: string;
  data_attributes?: Record<string, string>;
  dom_path?: string;
}

export interface CurrentLocators {
  css?: string;
  xpath?: string;
  other?: string;
}

export interface ElementAnalysisPayload {
  MODE: AnalysisMode.ELEMENT_ANALYSIS;
  PAGE_URL: string;
  ELEMENT_HTML: string;
  ELEMENT_METADATA: ElementMetadata;
  CURRENT_LOCATORS?: CurrentLocators;
  INTENT?: string;
}

export interface PageRefactorPayload {
  MODE: AnalysisMode.PAGE_REFACTOR;
  PAGE_URL: string;
  PAGE_HTML: string;
  FRAMEWORK?: string;
}

export type AdvisorPayload = ElementAnalysisPayload | PageRefactorPayload;

export interface AnalysisResult {
  markdown: string;
  timestamp: number;
}

export type SelectorType = 'CSS' | 'XPath';

export interface InspectorEvent {
  elementHtml: string;
  metadata: ElementMetadata;
  generatedCss: string;
  generatedXpath: string;
}

export interface PageObjectElement {
  metadata: ElementMetadata;
  generatedCss: string;
  generatedXpath: string;
}

export interface PageScanResult {
  elements: PageObjectElement[];
}